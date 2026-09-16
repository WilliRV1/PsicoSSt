/**
 * Cadencia normativa de la evaluación de riesgo psicosocial.
 *
 * Res. 2764/2022 art. 3: anual cuando el riesgo es alto o muy alto, mínimo
 * cada dos años en los demás casos. El producto llegó a tener tres cálculos
 * distintos —uno plano de dos años, otro por nivel de empresa y otro por
 * porcentaje de críticos— de modo que un mismo trabajador vencía en fechas
 * diferentes según la pantalla. Aquí queda uno solo.
 *
 * Los instrumentos no normativos (clima organizacional) no pasan por aquí.
 */

export type ValidityYears = 1 | 2;

export interface Validity {
    years: ValidityYears;
    /** Vacío cuando aplica la vigencia general de dos años. */
    reasons: string[];
}

export const CRITICAL_LEVELS: ReadonlySet<string> = new Set(["ALTO", "MUY_ALTO"]);

/** Porcentaje de trabajadores críticos a partir del cual la empresa mide cada año. */
export const CRITICAL_SHARE_THRESHOLD = 20;

/** Aviso con tres meses de antelación: tiempo real para convocar y aplicar. */
export const WARNING_DAYS = 90;

export function isCriticalLevel(level: string | null | undefined): boolean {
    return !!level && CRITICAL_LEVELS.has(level);
}

/** Vigencia del último resultado de un trabajador. */
export function workerValidity(lastLevel: string | null | undefined): Validity {
    return isCriticalLevel(lastLevel)
        ? { years: 1, reasons: ["Riesgo alto o muy alto en la última evaluación"] }
        : { years: 2, reasons: [] };
}

export interface OrganizationRiskSummary {
    /** % de trabajadores evaluados con riesgo alto o muy alto (0-100). */
    criticalWorkerPercent: number;
    /** Alguna área con el 100 % de sus trabajadores en riesgo crítico. */
    anyAreaFullyCritical?: boolean;
    /** Algún dominio intralaboral promedio en MUY_ALTO. */
    anyDomainVeryHigh?: boolean;
}

/** Vigencia de la medición de una empresa. Anual si cualquier criterio se cumple. */
export function organizationValidity(summary: OrganizationRiskSummary): Validity {
    const reasons: string[] = [];
    if (summary.criticalWorkerPercent >= CRITICAL_SHARE_THRESHOLD) {
        reasons.push(
            `${Math.round(summary.criticalWorkerPercent)} % de los trabajadores en riesgo alto o muy alto (umbral ${CRITICAL_SHARE_THRESHOLD} %)`
        );
    }
    if (summary.anyAreaFullyCritical) reasons.push("Un área con la totalidad de sus trabajadores en riesgo crítico");
    if (summary.anyDomainVeryHigh) reasons.push("Un dominio intralaboral en riesgo muy alto");
    return reasons.length > 0 ? { years: 1, reasons } : { years: 2, reasons: [] };
}

function addYears(date: Date, years: number): Date {
    const d = new Date(date.getTime());
    d.setFullYear(d.getFullYear() + years);
    return d;
}

function addDays(date: Date, days: number): Date {
    return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

export function nextDueDate(lastAssessmentDate: Date, validity: Validity): Date {
    return addYears(lastAssessmentDate, validity.years);
}

export function warningDate(dueDate: Date): Date {
    return addDays(dueDate, -WARNING_DAYS);
}

export type DueStatus = "VIGENTE" | "POR_VENCER" | "VENCIDA";

export interface DueInfo {
    validity: Validity;
    dueDate: Date;
    warningDate: Date;
    daysLeft: number;
    status: DueStatus;
}

export function dueInfo(lastAssessmentDate: Date, validity: Validity, now: Date = new Date()): DueInfo {
    const due = nextDueDate(lastAssessmentDate, validity);
    const warn = warningDate(due);
    const daysLeft = Math.ceil((due.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
    const status: DueStatus = now >= due ? "VENCIDA" : now >= warn ? "POR_VENCER" : "VIGENTE";
    return { validity, dueDate: due, warningDate: warn, daysLeft, status };
}

export function isDue(lastAssessmentDate: Date, validity: Validity, now: Date = new Date()): boolean {
    return now >= nextDueDate(lastAssessmentDate, validity);
}
