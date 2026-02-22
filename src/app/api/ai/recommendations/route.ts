import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateRecommendations } from '@/lib/ai/openrouter-client';

/**
 * POST /api/ai/recommendations
 * Generate AI recommendations for a specific assessment
 * Body: { assessmentId: string }
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { assessmentId } = await req.json();

    if (!assessmentId) {
      return NextResponse.json(
        { error: 'assessmentId is required' },
        { status: 400 }
      );
    }

    // Fetch assessment with related data
    const assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId },
      include: {
        psychologist: true,
        worker: true,
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
        { error: 'Scored result not found. Please complete the assessment first.' },
        { status: 400 }
      );
    }

    // Generate recommendations using OpenRouter AI
    const recommendations = await generateRecommendations({
      overallRiskCategory: scoredResult.overallRiskCategory,
      totalScores: scoredResult.totalScores,
      dimensionScores: scoredResult.dimensionScores,
      workerProfile: {
        jobTitle: assessment.worker.jobTitle || undefined,
        jobLevel: assessment.worker.jobLevel,
        yearsInPosition: assessment.worker.yearsInPosition || undefined,
      },
    });

    // Update report with AI-generated recommendations
    const report = await prisma.report.findUnique({
      where: { assessmentId },
    });

    if (report) {
      await prisma.report.update({
        where: { id: report.id },
        data: {
          recommendationsAI: recommendations,
        },
      });
    }

    return NextResponse.json({
      success: true,
      recommendations,
      assessmentId,
    });
  } catch (error) {
    console.error('POST /api/ai/recommendations error:', error);

    // Check if it's an OpenRouter API key error
    if (error instanceof Error) {
      if (error.message.includes('OPENROUTER_API_KEY')) {
        return NextResponse.json(
          {
            error: 'AI service not configured. Please set OPENROUTER_API_KEY in environment variables.',
          },
          { status: 503 }
        );
      }

      if (error.message.includes('OpenRouter')) {
        return NextResponse.json(
          { error: error.message },
          { status: 503 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to generate recommendations' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/ai/recommendations?assessmentId=...
 * Get AI recommendations for an assessment (if already generated)
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const assessmentId = req.nextUrl.searchParams.get('assessmentId');

    if (!assessmentId) {
      return NextResponse.json(
        { error: 'assessmentId query parameter is required' },
        { status: 400 }
      );
    }

    // Fetch assessment to verify ownership
    const assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId },
    });

    if (!assessment) {
      return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });
    }

    if (assessment.psychologistId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch report with recommendations
    const report = await prisma.report.findUnique({
      where: { assessmentId },
    });

    return NextResponse.json({
      success: true,
      recommendations: report?.recommendationsAI || null,
      assessmentId,
    });
  } catch (error) {
    console.error('GET /api/ai/recommendations error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
