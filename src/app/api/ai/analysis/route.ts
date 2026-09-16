import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { extractRequestMeta, logAudit } from '@/lib/auth/audit';
import { generateClinicalAnalysis } from '@/lib/ai/openrouter-client';

/**
 * Interpretación profesional del informe individual.
 *
 * La interpretación de la batería es un acto reservado al psicólogo con
 * licencia SST (Res. 2646/2008 art. 12, Ley 1090/2006): la IA solo produce un
 * BORRADOR y el profesional debe aceptarlo explícitamente antes de firmar.
 *
 * Esa aceptación se persiste dentro del JSON `reportData` de GeneratedReport,
 * junto al propio `analysis`, y no en columnas nuevas: el esquema está
 * congelado en esta entrega y `reportData` ya es el contenedor de la narrativa
 * del informe, así que el texto y la prueba de que fue revisado viajan y se
 * versionan juntos. Claves añadidas:
 *   analysisDraft              último borrador generado por la IA
 *   analysisDraftAt            cuándo se generó
 *   analysisSource             AI_DRAFT | AI_DRAFT_EDITED | PROFESSIONAL
 *   analysisReviewedAt / By    aceptación explícita del psicólogo
 *   analysisUnchangedFromDraft si se publicó sin editar una sola palabra
 */

type AnalysisSource = 'AI_DRAFT' | 'AI_DRAFT_EDITED' | 'PROFESSIONAL';

async function loadOwnedReport(assessmentId: string, psychologistId: string) {
  const assessment = await prisma.assessment.findUnique({
    where: { id: assessmentId },
    include: { worker: true },
  });
  if (!assessment || assessment.psychologistId !== psychologistId) return null;

  const report = await prisma.generatedReport.findFirst({ where: { assessmentId } });
  return { assessment, report };
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const psychologistId = session.user.id;

    const { assessmentId, overrideText, acceptDraft } = await req.json();
    if (!assessmentId) return NextResponse.json({ error: 'assessmentId required' }, { status: 400 });

    const owned = await loadOwnedReport(assessmentId, psychologistId);
    if (!owned) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const { assessment, report } = owned;
    const existing = ((report?.reportData as any) || {}) as Record<string, unknown>;
    const draft = typeof existing.analysisDraft === 'string' ? existing.analysisDraft : null;
    const requestMeta = extractRequestMeta(req);

    // ── Aceptación explícita del profesional ───────────────────────────────
    if (acceptDraft === true) {
      const accepted = typeof overrideText === 'string' ? overrideText : (existing.analysis as string) ?? '';
      if (!accepted.trim()) {
        return NextResponse.json({ error: 'No hay texto que asumir.' }, { status: 400 });
      }
      if (!report) {
        return NextResponse.json({ error: 'El informe aún no ha sido generado.' }, { status: 400 });
      }

      const unchanged = draft !== null && accepted.trim() === draft.trim();
      const source: AnalysisSource = draft === null ? 'PROFESSIONAL' : unchanged ? 'AI_DRAFT' : 'AI_DRAFT_EDITED';

      await prisma.generatedReport.update({
        where: { id: report.id },
        data: {
          reportData: {
            ...existing,
            analysis: accepted,
            analysisSource: source,
            analysisReviewedAt: new Date().toISOString(),
            analysisReviewedBy: psychologistId,
            analysisUnchangedFromDraft: unchanged,
          },
        },
      });

      // Publicar el borrador sin tocar una palabra es legítimo, pero es
      // exactamente lo que un proceso disciplinario querría poder verificar.
      await logAudit({
        ...requestMeta,
        userId: psychologistId,
        action: 'UPDATE',
        resourceType: 'GeneratedReport',
        resourceId: report.id,
        metadata: {
          event: unchanged
            ? 'AI_ANALYSIS_ACCEPTED_VERBATIM'
            : 'AI_ANALYSIS_ACCEPTED_AFTER_EDIT',
          assessmentId,
          workerId: assessment.workerId,
          analysisSource: source,
          hadAiDraft: draft !== null,
        },
      });

      return NextResponse.json({ success: true, analysis: accepted, reviewed: true, unchanged });
    }

    // ── Guardado manual del texto (sin aceptar todavía) ────────────────────
    if (typeof overrideText === 'string') {
      if (report) {
        // Si hay un borrador de IA de por medio, editar el texto invalida
        // cualquier aceptación previa: hay que volver a asumirlo tal como
        // quedó, no como estaba cuando se aceptó. Un texto escrito por el
        // profesional sin borrador de por medio ya es suyo y no requiere nada.
        const reviewFields =
          draft === null
            ? {
                analysisSource: 'PROFESSIONAL' as AnalysisSource,
                analysisReviewedAt: new Date().toISOString(),
                analysisReviewedBy: psychologistId,
                analysisUnchangedFromDraft: false,
              }
            : {
                analysisSource: 'AI_DRAFT_EDITED' as AnalysisSource,
                analysisReviewedAt: null,
                analysisReviewedBy: null,
                analysisUnchangedFromDraft: draft.trim() === overrideText.trim(),
              };

        await prisma.generatedReport.update({
          where: { id: report.id },
          data: { reportData: { ...existing, analysis: overrideText, ...reviewFields } },
        });
      }
      return NextResponse.json({ success: true, analysis: overrideText, reviewed: draft === null });
    }

    // ── Generación del borrador ───────────────────────────────────────────
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

    if (report) {
      await prisma.generatedReport.update({
        where: { id: report.id },
        data: {
          reportData: {
            ...existing,
            analysis,
            analysisDraft: analysis,
            analysisDraftAt: new Date().toISOString(),
            analysisSource: 'AI_DRAFT' as AnalysisSource,
            // Un borrador nuevo nunca hereda la aceptación del anterior.
            analysisReviewedAt: null,
            analysisReviewedBy: null,
            analysisUnchangedFromDraft: null,
          },
        },
      });

      await logAudit({
        ...requestMeta,
        userId: psychologistId,
        action: 'CREATE',
        resourceType: 'GeneratedReport',
        resourceId: report.id,
        metadata: {
          event: 'AI_ANALYSIS_DRAFT_GENERATED',
          assessmentId,
          workerId: assessment.workerId,
        },
      });
    }

    return NextResponse.json({ success: true, analysis, isAiDraft: true, reviewed: false });
  } catch (error) {
    console.error('POST /api/ai/analysis:', error);
    if (error instanceof Error && error.message.includes('OPENROUTER_API_KEY')) {
      return NextResponse.json({ error: 'IA no configurada. Agrega OPENROUTER_API_KEY en .env.local' }, { status: 503 });
    }
    return NextResponse.json({ error: 'Error al generar análisis' }, { status: 500 });
  }
}
