import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateReportHTML } from '@/lib/pdf/generate-report';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ assessmentId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { assessmentId } = await params;

    const assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId },
      include: { worker: true, psychologist: true },
    });
    if (!assessment) return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });
    if (assessment.psychologistId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const scoredResult = await prisma.scoredResult.findUnique({ where: { assessmentId } });
    if (!scoredResult) return NextResponse.json({ error: 'No scored result' }, { status: 404 });

    let report = await prisma.generatedReport.findFirst({ where: { assessmentId } });
    if (!report) {
      report = await prisma.generatedReport.create({
        data: {
          assessmentId,
          psychologistId: assessment.psychologistId,
          reportData: {},
          status: 'DRAFT',
        },
      });
    }

    // Get psychologist signature (prefer drawn, fallback to uploaded)
    const db = prisma as any;
    const signatures = await db.psychologistSignature.findMany({
      where: { psychologistId: assessment.psychologistId },
    });
    const signatureImage =
      signatures.find((s: any) => s.signatureType === 'drawn')?.dataUrl ??
      signatures.find((s: any) => s.signatureType === 'uploaded')?.imageUrl ??
      undefined;

    const html = generateReportHTML({
      assessment: assessment as any,
      scoredResult: scoredResult as any,
      report: report as any,
      signatureImage: signatureImage ?? undefined,
    });

    // Mark as signed if signature present and not finalized
    if (signatureImage && !(report as any).isFinalized) {
      await prisma.generatedReport.update({
        where: { id: report.id },
        data: {
          signedBy: assessment.psychologist.email,
          signedAt: new Date(),
          status: 'SIGNED',
        } as any,
      });
    }

    return NextResponse.json({ html, assessmentId, workerName: assessment.worker.fullName });
  } catch (error) {
    console.error('GET /api/reports/download:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
