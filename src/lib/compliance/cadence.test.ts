import { describe, expect, it } from "vitest";
import {
    dueInfo,
    isDue,
    nextDueDate,
    organizationValidity,
    warningDate,
    workerValidity,
} from "./cadence";

const D = (iso: string) => new Date(iso);

describe("cadencia normativa · Res. 2764/2022 art. 3", () => {
    it("trabajador: anual si el último nivel es alto o muy alto, bienal si no", () => {
        expect(workerValidity("ALTO").years).toBe(1);
        expect(workerValidity("MUY_ALTO").years).toBe(1);
        expect(workerValidity("MEDIO").years).toBe(2);
        expect(workerValidity("SIN_RIESGO").years).toBe(2);
        expect(workerValidity(null).years).toBe(2);
        expect(workerValidity("INVALIDO").years).toBe(2);
    });

    it("empresa: anual con ≥20 % de críticos, área 100 % crítica o dominio muy alto", () => {
        expect(organizationValidity({ criticalWorkerPercent: 19.9 }).years).toBe(2);
        expect(organizationValidity({ criticalWorkerPercent: 20 }).years).toBe(1);
        expect(organizationValidity({ criticalWorkerPercent: 0, anyAreaFullyCritical: true }).years).toBe(1);
        expect(organizationValidity({ criticalWorkerPercent: 0, anyDomainVeryHigh: true }).years).toBe(1);
        expect(organizationValidity({ criticalWorkerPercent: 0 }).reasons).toEqual([]);
    });

    it("la empresa acumula todas las razones que apliquen", () => {
        const v = organizationValidity({
            criticalWorkerPercent: 35,
            anyAreaFullyCritical: true,
            anyDomainVeryHigh: true,
        });
        expect(v.years).toBe(1);
        expect(v.reasons).toHaveLength(3);
    });

    it("vence el mismo día calendario uno o dos años después", () => {
        expect(nextDueDate(D("2026-03-15T00:00:00Z"), { years: 1, reasons: [] }).toISOString()).toBe(
            "2027-03-15T00:00:00.000Z"
        );
        expect(nextDueDate(D("2026-03-15T00:00:00Z"), { years: 2, reasons: [] }).toISOString()).toBe(
            "2028-03-15T00:00:00.000Z"
        );
    });

    it("avisa 90 días antes del vencimiento", () => {
        const due = D("2027-03-15T00:00:00Z");
        expect(warningDate(due).toISOString()).toBe("2026-12-15T00:00:00.000Z");
    });

    it("estado: vigente → por vencer → vencida", () => {
        const last = D("2026-01-01T00:00:00Z");
        const v = workerValidity("ALTO"); // vence 2027-01-01
        expect(dueInfo(last, v, D("2026-06-01T00:00:00Z")).status).toBe("VIGENTE");
        expect(dueInfo(last, v, D("2026-11-15T00:00:00Z")).status).toBe("POR_VENCER");
        expect(dueInfo(last, v, D("2027-01-01T00:00:00Z")).status).toBe("VENCIDA");
        expect(isDue(last, v, D("2027-01-02T00:00:00Z"))).toBe(true);
        expect(isDue(last, v, D("2026-12-31T00:00:00Z"))).toBe(false);
    });

    it("un trabajador en riesgo alto NO puede aparecer vigente a los 18 meses (la regla plana anterior)", () => {
        const last = D("2025-01-01T00:00:00Z");
        const info = dueInfo(last, workerValidity("MUY_ALTO"), D("2026-07-01T00:00:00Z"));
        expect(info.status).toBe("VENCIDA");
    });
});
