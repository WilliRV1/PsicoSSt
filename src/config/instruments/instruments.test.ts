import { describe, expect, it } from "vitest";
import { BATTERY_IDS, INSTRUMENTS, INSTRUMENT_IDS, familyOf, getInstrument, sortByOrder } from "./index";
import { scoreQuestionnaire } from "@/lib/scoring";
import { getFormConfig, getItemText } from "@/config/battery";
import type { ItemResponses } from "@/types/battery";

describe("registro de instrumentos", () => {
    it("declara los tres de la Batería como normativos y clima como libre", () => {
        expect(BATTERY_IDS).toEqual(["INTRALABORAL", "EXTRALABORAL", "STRESS"]);
        expect(INSTRUMENTS.CLIMA.regulated).toBe(false);
        expect(INSTRUMENTS.CLIMA.family).toBe("CLIMA");
        expect(familyOf("STRESS")).toBe("BATTERY");
    });

    it("ordena cualquier conjunto en el orden de diligenciamiento", () => {
        expect(sortByOrder(["STRESS", "CLIMA", "INTRALABORAL"])).toEqual(["INTRALABORAL", "STRESS", "CLIMA"]);
    });

    it("cada instrumento resuelve a la misma configuración que getFormConfig", () => {
        for (const id of INSTRUMENT_IDS) {
            for (const form of ["A", "B"] as const) {
                expect(getInstrument(id).config(form)).toBe(getFormConfig(form, id));
            }
        }
    });

    it("clima tiene 35 ítems con enunciado, en 7 dimensiones de 5, todos invertidos", () => {
        const cfg = INSTRUMENTS.CLIMA.config("A");
        expect(cfg.dimensions).toHaveLength(7);
        const all = cfg.dimensions.flatMap((d) => d.items);
        expect(all).toHaveLength(35);
        expect(new Set(all).size).toBe(35);
        for (const d of cfg.dimensions) {
            expect(d.items).toHaveLength(5);
            expect(d.invertedItems).toEqual(d.items);
        }
        for (const i of all) expect(getItemText("CLIMA", "A", i)).toBeTruthy();
        expect(cfg.totalTransformationFactor).toBe(35 * 4);
    });
});

function climaResponses(value: number): ItemResponses {
    const r: ItemResponses = {};
    for (let i = 1; i <= 35; i++) r[String(i)] = value;
    return r;
}

describe("clima organizacional · escala 1-5, nivel = desfavorabilidad", () => {
    it("total acuerdo (5) → 0 %, muy favorable", () => {
        const s = scoreQuestionnaire(climaResponses(5), "A", "CLIMA");
        expect(s.total.isValid).toBe(true);
        expect(s.total.transformedScore).toBe(0);
        expect(s.total.riskCategory).toBe("SIN_RIESGO");
        expect(INSTRUMENTS.CLIMA.levelLabels.SIN_RIESGO).toBe("Muy favorable");
        for (const d of Object.values(s.dimensions)) expect(d.transformedScore).toBe(0);
    });

    it("total desacuerdo (1) → 100 %, muy desfavorable", () => {
        const s = scoreQuestionnaire(climaResponses(1), "A", "CLIMA");
        expect(s.total.transformedScore).toBe(100);
        expect(s.total.riskCategory).toBe("MUY_ALTO");
        expect(INSTRUMENTS.CLIMA.levelLabels.MUY_ALTO).toBe("Muy desfavorable");
    });

    it("neutro (3) → 50 %, nivel medio", () => {
        const s = scoreQuestionnaire(climaResponses(3), "A", "CLIMA");
        expect(s.total.transformedScore).toBe(50);
        expect(s.total.riskCategory).toBe("MEDIO");
        expect(s.dimensions.liderazgo.transformedScore).toBe(50);
    });

    it("un ítem faltante invalida su dimensión y el total (sin tolerancia)", () => {
        const r = climaResponses(4);
        delete r["12"];
        const s = scoreQuestionnaire(r, "A", "CLIMA");
        expect(s.dimensions.reconocimiento.isValid).toBe(false);
        expect(s.dimensions.reconocimiento.riskCategory).toBe("INVALIDO");
        expect(s.total.isValid).toBe(false);
        expect(s.dimensions.liderazgo.isValid).toBe(true);
    });

    it("no produce dominios ni usa grupo ocupacional", () => {
        const s = scoreQuestionnaire(climaResponses(2), "A", "CLIMA", { jobLevel: "OPERATIVO" });
        expect(Object.keys(s.domains)).toHaveLength(0);
        expect(s.total.transformedScore).toBe(75);
        expect(s.total.riskCategory).toBe("ALTO");
    });
});
