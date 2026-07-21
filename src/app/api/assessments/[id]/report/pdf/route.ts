import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { renderToStream } from '@react-pdf/renderer';
import React from 'react';
import IndividualReportPDF from '@/components/reports/IndividualReportPDF';

interface DimensionScore {
  dimensionName?: string;
  transformedScore: number;
  riskCategory: string;
}

interface ReportData {
  analysis?: string;
  recommendations?: string;
}

interface TotalScores {
  transformedScore?: number;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: assessmentId } = await params;
    const isAnonymous = req.nextUrl.searchParams.get('anon') === 'true';

    const assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId },
      include: {
        worker: true,
        organization: true,
        psychologist: {
          include: {
            signatures: {
              orderBy: { uploadedAt: 'desc' },
            },
          },
        },
        scoredResult: true,
        generatedReports: {
          take: 1,
          orderBy: { generatedAt: 'desc' }
        }
      }
    });

    if (!assessment || !assessment.scoredResult) {
      return NextResponse.json({ error: 'Evaluación no encontrada o no calificada' }, { status: 404 });
    }

    const { worker, organization, psychologist, scoredResult, generatedReports } = assessment;
    const report = generatedReports[0];

    // Prepare dimension data for the PDF
    const dimensionScoresRaw = scoredResult.dimensionScores as unknown as Record<string, DimensionScore>;
    const dimensionScores = Object.entries(dimensionScoresRaw).map(([key, data]) => ({
      name: data.dimensionName || key,
      score: data.transformedScore,
      level: data.riskCategory
    }));

    // Get signature image: from signed report first, then from psychologist signatures, then legacy field
    let signatureImage: string | undefined;
    if (psychologist.sstLicenseDate) {
      if (report?.status === 'SIGNED' && report.signatureImage) {
        signatureImage = report.signatureImage;
      } else {
        const drawnSig = psychologist.signatures.find((sig) => sig.signatureType === 'drawn');
        const uploadedSig = psychologist.signatures.find((sig) => sig.signatureType === 'uploaded');
        const bestSig = drawnSig || uploadedSig;
        signatureImage = bestSig?.dataUrl || bestSig?.imageUrl || psychologist.signature || undefined;
      }
    }

    const assessmentDate = new Date(assessment.assessmentDate).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const submittedTime = new Date(assessment.createdAt).toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit'
    });

    const reportData = report?.reportData as ReportData | null;

    const pdfElement = React.createElement(IndividualReportPDF, {
      workerName: worker.fullName,
      workerId: `${worker.documentType} ${worker.documentId}`,
      age: worker.birthYear ? `${new Date().getFullYear() - worker.birthYear} años` : undefined,
      gender: worker.gender || undefined,
      jobTitle: worker.jobTitle || undefined,
      department: worker.departmentArea || undefined,
      tenure: worker.yearsInCompany !== null && worker.yearsInCompany !== undefined ? `${worker.yearsInCompany} años` : undefined,
      educationLevel: worker.educationLevel || undefined,
      orgName: organization.name,
      psychologistName: psychologist.fullName,
      licenseNumber: psychologist.licenseNumber,
      professionalCard: psychologist.professionalCard,
      sstCredential: psychologist.sstCredential,
      sstLicenseDate: psychologist.sstLicenseDate ? new Date(psychologist.sstLicenseDate).toISOString() : undefined,
      overallRisk: scoredResult.overallRiskCategory as any,
      dimensionScores: dimensionScores,
      analysis: reportData?.analysis,
      recommendations: reportData?.recommendations,
      signatureImage: signatureImage,
      assessmentDate: assessmentDate,
      reportDate: new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' }),
      submittedTime: submittedTime,
      isAnonymous: isAnonymous,
      questionnaireType: assessment.questionnaireType,
    });

    // @ts-expect-error react-pdf renderToStream typing mismatch with React 19
    const stream = await renderToStream(pdfElement);

    const chunks: Buffer[] = [];
    for await (const chunk of stream as AsyncIterable<Buffer>) {
      chunks.push(Buffer.from(chunk));
    }
    const buffer = Buffer.concat(chunks);

    const filename = isAnonymous ? `Informe_Anonimo_${worker.documentId.slice(-4)}.pdf` : `Informe_${worker.documentId}.pdf`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

  } catch (error: unknown) {
    console.error('Error generating PDF:', error);
    return NextResponse.json({ error: 'Error interno al generar el PDF' }, { status: 500 });
  }
}
