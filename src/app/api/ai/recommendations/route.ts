import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateRecommendations } from '@/lib/ai/openrouter-client';

/** POST /api/ai/recommendations */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { assessmentId, overrideText } = body;

    if (!assessmentId) {
      return NextResponse.json({ error: 'assessmentId is required' }, { status: 400 });
    }

    // Verify assessment ownership
    const assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId },
      include: { worker: true },
    });
    if (!assessment) return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });
    if (assessment.psychologistId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // If manual override — just save it
    if (overrideText !== undefined) {
      const report = await prisma.report.findFirst({ where: { assessmentId } });
      if (report) {
        await prisma.report.update({
          where: { id: report.id },
          data: { recommendationsAI: overrideText } as any,
        });
      }
      return NextResponse.json({ success: true, recommendations: overrideText, assessmentId });
    }

    // Generate with AI
    const scoredResult = await prisma.scoredResult.findUnique({ where: { assessmentId } });
    if (!scoredResult) {
      return NextResponse.json({ error: 'Scored result not found. Complete the assessment first.' }, { status: 400 });
    }

    const recommendations = await generateRecommendations({
      overallRiskCategory: scoredResult.overallRiskCategory,
      totalScores: scoredResult.totalScores,
      dimensionScores: scoredResult.dimensionScores,
      workerProfile: {
        jobTitle: assessment.worker.jobTitle ?? undefined,
        jobLevel: assessment.worker.jobLevel,
        yearsInPosition: assessment.worker.yearsInPosition ?? undefined,
      },
    });

    // Save to report
    const report = await prisma.report.findFirst({ where: { assessmentId } });
    if (report) {
      await prisma.report.update({
        where: { id: report.id },
        data: { recommendationsAI: recommendations } as any,
      });
    }

    return NextResponse.json({ success: true, recommendations, assessmentId });
  } catch (error) {
    console.error('POST /api/ai/recommendations:', error);
    if (error instanceof Error && error.message.includes('OPENROUTER_API_KEY')) {
      return NextResponse.json(
        { error: 'IA no configurada. Agrega OPENROUTER_API_KEY en .env.local' },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: 'Error al generar recomendaciones' }, { status: 500 });
  }
}

/** GET /api/ai/recommendations?assessmentId=... */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const assessmentId = req.nextUrl.searchParams.get('assessmentId');
    if (!assessmentId) return NextResponse.json({ error: 'assessmentId required' }, { status: 400 });

    const assessment = await prisma.assessment.findUnique({ where: { id: assessmentId } });
    if (!assessment) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (assessment.psychologistId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const report = await prisma.report.findFirst({ where: { assessmentId } });
    return NextResponse.json({
      success: true,
      recommendations: (report as any)?.recommendationsAI ?? null,
      assessmentId,
    });
  } catch (error) {
    console.error('GET /api/ai/recommendations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
