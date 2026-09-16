import { getEntitlements } from "@/lib/entitlements";

/**
 * Marca del documento según el plan de quien lo produce.
 *
 * Sigue al DUEÑO del informe, no a quien lo abre: un administrador que
 * consulta el informe de un profesional con plan Profesional no debe verlo
 * degradado a borrador, y al revés, un informe del plan Residente es un
 * borrador aunque lo abra un administrador.
 */
export interface ReportBranding {
    /** El pie del PDF declara que se generó con PsicoSST. */
    poweredBy: boolean;
    /** Marca de agua «BORRADOR · sin valor probatorio». */
    isDraft: boolean;
}

export async function reportBranding(ownerPsychologistId: string): Promise<ReportBranding> {
    const entitlements = await getEntitlements(ownerPsychologistId);
    // Sin suscripción legible se asume lo más conservador: borrador.
    const draft = entitlements?.draftReports ?? true;
    return { poweredBy: draft, isDraft: draft };
}
