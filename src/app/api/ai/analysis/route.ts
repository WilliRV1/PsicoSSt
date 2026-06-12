import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateClinicalAnalysis } from '@/lib/ai/openrouter-client';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { assessmentId, overrideText } = await req.json();
    if (!assessmentId) return NextResponse.json({ error: 'assessmentId required' }, { status: 400 });

    const assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId },
      include: { worker: true },
    });
    if (!assessment || assessment.psychologistId !== session.user.id)
      return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // If manual override — just save it to reportData.analysis
    if (overrideText !== undefined) {
      const report = await prisma.report.findFirst({ where: { assessmentId } });
      if (report) {
        const existing = (report.reportData as any) || {};
        await prisma.report.update({
          where: { id: report.id },
          data: { reportData: { ...existing, analysis: overrideText } },
        });
      }
      return NextResponse.json({ success: true, analysis: overrideText });
    }

    // Generate with AI
    const scoredResult = await prisma.scoredResult.findUnique({ where: { assessmentId } });
    if (!scoredResult) return NextResponse.json({ error: 'No scored result' }, { status: 400 });

    const analysis = await generateClinicalAnalysis({
      overallRiskCategory: scoredResult.overallRiskCategory,
      totalScores: scoredResult.totalScores,
      dimensionScores: scoredResult.dimensionScores,
      workerProfile: {
        jobTitle: assessment.worker.jobTitle ?? undefined,
        jobLevel: assessment.worker.jobLevel,
        yearsInPosition: assessment.worker.yearsInPosition ?? undefined,
      },
    });

    // Save to reportData.analysis
    const report = await prisma.report.findFirst({ where: { assessmentId } });
    if (report) {
      const existing = (report.reportData as any) || {};
      await prisma.report.update({
        where: { id: report.id },
        data: { reportData: { ...existing, analysis } },
      });
    }

    return NextResponse.json({ success: true, analysis });
  } catch (error) {
    console.error('POST /api/ai/analysis:', error);
    if (error instanceof Error && error.message.includes('OPENROUTER_API_KEY')) {
      return NextResponse.json({ error: 'IA no configurada. Agrega OPENROUTER_API_KEY en .env.local' }, { status: 503 });
    }
    return NextResponse.json({ error: 'Error al generar análisis' }, { status: 500 });
  }
}
