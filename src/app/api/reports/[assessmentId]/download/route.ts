import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateReportHTML } from '@/lib/pdf/generate-report';

/**
 * GET /api/reports/[assessmentId]/download
 * Generate and return PDF report as downloadable HTML/PDF
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { assessmentId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const assessmentId = params.assessmentId;

    // Fetch assessment with all related data
    const assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId },
      include: {
        worker: true,
        psychologist: true,
      },
    });

    if (!assessment) {
      return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });
    }

    // Verify ownership
    if (assessment.psychologistId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch scored result
    const scoredResult = await prisma.scoredResult.findUnique({
      where: { assessmentId },
    });

    if (!scoredResult) {
      return NextResponse.json(
        { error: 'Scored result not found' },
        { status: 404 }
      );
    }

    // Fetch or create report
    let report = await prisma.report.findUnique({
      where: { assessmentId },
    });

    if (!report) {
      report = await prisma.report.create({
        data: {
          assessmentId,
          psychologistId: assessment.psychologistId,
          reportType: 'individual',
          reportData: {},
          status: 'DRAFT',
        },
      });
    }

    // Fetch psychologist's signature
    const psychologist = await prisma.psychologist.findUnique({
      where: { id: assessment.psychologistId },
      include: { signatures: true },
    });

    if (!psychologist) {
      return NextResponse.json(
        { error: 'Psychologist not found' },
        { status: 404 }
      );
    }

    // Get best available signature (prefer drawn, fallback to uploaded)
    const drawnSig = psychologist.signatures.find((s) => s.signatureType === 'drawn');
    const uploadedSig = psychologist.signatures.find(
      (s) => s.signatureType === 'uploaded'
    );
    const signatureImage = drawnSig?.dataUrl || uploadedSig?.imageUrl || undefined;

    // Generate HTML
    const html = generateReportHTML({
      assessment,
      scoredResult,
      report,
      signatureImage,
    });

    // Update report with signature image and mark as finalized if signing
    if (signatureImage && !report.isFinalized) {
      await prisma.report.update({
        where: { id: report.id },
        data: {
          signatureImage,
          signedBy: psychologist.email,
          signedAt: new Date(),
          isFinalized: true,
          status: 'SIGNED',
        },
      });
    }

    // Return HTML for client-side PDF generation using html2pdf
    return NextResponse.json({
      html,
      assessmentId,
      workerName: assessment.worker.fullName,
    });
  } catch (error) {
    console.error('GET /api/reports/[assessmentId]/download error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
