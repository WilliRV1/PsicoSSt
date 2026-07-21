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
    const { assessmentId, organizationId, overrideText } = body;

    if (!assessmentId && !organizationId) {
      return NextResponse.json({ error: 'assessmentId or organizationId is required' }, { status: 400 });
    }

    // --- ORGANIZATIONAL LOGIC ---
    if (organizationId) {
      if (overrideText !== undefined) {
        // Find existing plan to update
        const plan = await prisma.interventionPlan.findFirst({ where: { organizationId } });
        if (plan) {
          // Since InterventionPlan doesn't have a recommendationsAI field, we can use a generic action or note
          // But wait, the simplest is to create an InterventionAction or just use Prisma schema correctly.
          // Wait, InterventionPlan has `title`, `period`, `status`. No generic text field.
          // Maybe we can create an action?
          // Let's create an action for it.
          const action = await prisma.interventionAction.findFirst({ where: { planId: plan.id, measure: { startsWith: 'Recomendaciones AI:' } } });
          if (action) {
             await prisma.interventionAction.update({
               where: { id: action.id },
               data: { notes: overrideText }
             });
          } else {
             await prisma.interventionAction.create({
               data: {
                 planId: plan.id,
                 measure: 'Recomendaciones AI: Plan Organizacional',
                 responsible: 'Psicólogo SST',
                 notes: overrideText
               }
             });
          }
        } else {
           const newPlan = await prisma.interventionPlan.create({
             data: {
               organizationId,
               psychologistId: session.user.id,
               title: 'Plan de Intervención Organizacional',
               period: new Date().getFullYear().toString(),
               actions: {
                 create: [{
                   measure: 'Recomendaciones AI: Plan Organizacional',
                   responsible: 'Psicólogo SST',
                   notes: overrideText
                 }]
               }
             }
           });
        }
        return NextResponse.json({ success: true, recommendations: overrideText, organizationId });
      }

      // Generate with AI
      const { AssessmentService } = await import('@/lib/services/assessment-service');
      const orgData = await AssessmentService.getOrganizationalReportData(organizationId, 'ALL');
      
      if (orgData.isRestricted) {
        return NextResponse.json({ error: 'Muestra insuficiente (N<5). Reserva legal activa.' }, { status: 403 });
      }

      const { generateOrganizationalRecommendations } = await import('@/lib/ai/openrouter-client');
      const recommendations = await generateOrganizationalRecommendations(orgData);

      // Save to plan
      let plan = await prisma.interventionPlan.findFirst({ where: { organizationId } });
      if (!plan) {
         plan = await prisma.interventionPlan.create({
             data: {
               organizationId,
               psychologistId: session.user.id,
               title: 'Plan de Intervención Organizacional',
               period: new Date().getFullYear().toString(),
             }
         });
      }

      const action = await prisma.interventionAction.findFirst({ where: { planId: plan.id, measure: { startsWith: 'Recomendaciones AI:' } } });
      if (action) {
         await prisma.interventionAction.update({
           where: { id: action.id },
           data: { notes: recommendations }
         });
      } else {
         await prisma.interventionAction.create({
           data: {
             planId: plan.id,
             measure: 'Recomendaciones AI: Plan Organizacional',
             responsible: 'Psicólogo SST',
             notes: recommendations
           }
         });
      }

      return NextResponse.json({ success: true, recommendations, organizationId });
    }

    // --- INDIVIDUAL LOGIC ---
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
      const report = await prisma.generatedReport.findFirst({ where: { assessmentId } });
      if (report) {
        await prisma.generatedReport.update({
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
    const report = await prisma.generatedReport.findFirst({ where: { assessmentId } });
    if (report) {
      await prisma.generatedReport.update({
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

/** GET /api/ai/recommendations?assessmentId=...&organizationId=... */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const assessmentId = req.nextUrl.searchParams.get('assessmentId');
    const organizationId = req.nextUrl.searchParams.get('organizationId');

    if (!assessmentId && !organizationId) return NextResponse.json({ error: 'assessmentId or organizationId required' }, { status: 400 });

    if (organizationId) {
       const org = await prisma.organization.findUnique({ where: { id: organizationId } });
       if (!org) return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
       if (org.createdByPsychologist !== session.user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

       const plan = await prisma.interventionPlan.findFirst({ where: { organizationId }, include: { actions: true } });
       const action = plan?.actions.find(a => a.measure.startsWith('Recomendaciones AI:'));
       
       return NextResponse.json({
         success: true,
         recommendations: action ? action.notes : null,
         organizationId,
       });
    }

    // Individual logic
    const assessment = await prisma.assessment.findUnique({ where: { id: assessmentId as string } });
    if (!assessment) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (assessment.psychologistId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const report = await prisma.generatedReport.findFirst({ where: { assessmentId: assessmentId as string } });
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
