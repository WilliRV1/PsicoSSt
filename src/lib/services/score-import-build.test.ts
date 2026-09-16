import { describe, expect, it } from "vitest";
import { getInstrument } from "@/config/instruments";
import { buildScoredDataFromTransformed, csvTemplate, parseScore } from "./score-import-build";
import { baremos } from "@/config/battery";
import { lookupRiskCategory } from "@/lib/scoring";
import type { BaremoThreshold } from "@/types/battery";

describe("plantilla CSV de importación", () => {
    it("lleva las columnas fijas, una por dimensión y total", () => {
        const csv = csvTemplate("EXTRALABORAL", "A");
        const header = csv.split(/\r?\n/)[0].split(",");
        expect(header.slice(0, 4)).toEqual(["documentId", "instrument", "formType", "assessmentDate"]);
        expect(header).toContain("caracteristicas_vivienda");
        expect(header[header.length - 1]).toBe("total");
        expect(header).toHaveLength(4 + 7 + 1);
    });

    it("parseScore acepta coma decimal, rechaza fuera de 0-100 y devuelve null en vacío", () => {
        expect(parseScore("37,5")).toBe(37.5);
        expect(parseScore("")).toBeNull();
        expect(parseScore(undefined)).toBeNull();
        expect(() => parseScore("101")).toThrow();
        expect(() => parseScore("abc")).toThrow();
    });
});

describe("reconstrucción desde puntajes transformados", () => {
    it("intralaboral A: recupera brutos, agrega dominios y deriva el nivel con los baremos", () => {
        const instrument = getInstrument("INTRALABORAL");
        const config = instrument.config("A");
        const dimensionScores: Record<string, number | null> = {};
        for (const d of config.dimensions) dimensionScores[d.key] = 25;

        const s = buildScoredDataFromTransformed({ instrument, formType: "A", dimensionScores, total: null, jobLevel: "PROFESIONAL" });

        expect(s.total.isValid).toBe(true);
        // 25 % en cada dimensión ⇒ 25 % del total (mismo factor lineal).
        expect(s.total.transformedScore).toBe(25);
        expect(Object.keys(s.domains)).toHaveLength(4);
        for (const d of Object.values(s.dimensions)) {
            expect(d.rawScore).toBe(Math.round(d.itemCount * 4 * 0.25 * 10) / 10);
            expect(d.riskCategory).not.toBeNull();
        }
        // El nivel se deriva con la Tabla 33 (forma A), nunca se acepta del archivo.
        const tabla = (baremos as unknown as { intralaboral_a: { total: BaremoThreshold } }).intralaboral_a.total;
        expect(s.total.riskCategory).toBe(lookupRiskCategory(25, tabla));
    });

    it("una dimensión de control ausente se trata como filtrada, no como inválida", () => {
        const instrument = getInstrument("INTRALABORAL");
        const config = instrument.config("A");
        const dimensionScores: Record<string, number | null> = {};
        for (const d of config.dimensions) dimensionScores[d.key] = 10;
        dimensionScores.relacion_colaboradores = null;

        const s = buildScoredDataFromTransformed({ instrument, formType: "A", dimensionScores, total: null, jobLevel: "TECNICO" });
        expect(s.dimensions.relacion_colaboradores.isFiltered).toBe(true);
        expect(s.total.isValid).toBe(true);
    });

    it("una dimensión ordinaria ausente invalida el total", () => {
        const instrument = getInstrument("EXTRALABORAL");
        const dimensionScores: Record<string, number | null> = {};
        for (const d of instrument.config("A").dimensions) dimensionScores[d.key] = 30;
        dimensionScores.situacion_economica = null;

        const s = buildScoredDataFromTransformed({ instrument, formType: "A", dimensionScores, total: null, jobLevel: null });
        expect(s.dimensions.situacion_economica.riskCategory).toBe("INVALIDO");
        expect(s.total.isValid).toBe(false);
        expect(s.total.riskCategory).toBe("INVALIDO");
    });

    it("estrés: exige el total y estratifica por grupo ocupacional", () => {
        const instrument = getInstrument("STRESS");
        const dims: Record<string, number | null> = { sintomas_fisiologicos: 40, sintomas_sociales: 10, sintomas_intelectuales: 20, sintomas_psicoemocionales: 15 };

        const sinTotal = buildScoredDataFromTransformed({ instrument, formType: "A", dimensionScores: dims, total: null, jobLevel: "JEFATURA" });
        expect(sinTotal.total.isValid).toBe(false);

        const conTotal = buildScoredDataFromTransformed({ instrument, formType: "A", dimensionScores: dims, total: 30, jobLevel: "JEFATURA" });
        expect(conTotal.total.isValid).toBe(true);
        expect(conTotal.total.transformedScore).toBe(30);
        expect(conTotal.dimensions.sintomas_fisiologicos.isUnscored).toBe(true);
        expect(conTotal.dimensions.sintomas_fisiologicos.riskCategory).toBeNull();
        // Tabla 6 (jefes): 30 cae en "muy alto" (> 27,8).
        expect(conTotal.total.riskCategory).toBe("MUY_ALTO");
    });

    it("el total del archivo manda sobre el reconstruido", () => {
        const instrument = getInstrument("EXTRALABORAL");
        const dimensionScores: Record<string, number | null> = {};
        for (const d of instrument.config("A").dimensions) dimensionScores[d.key] = 20;
        const s = buildScoredDataFromTransformed({ instrument, formType: "A", dimensionScores, total: 33.3, jobLevel: null });
        expect(s.total.transformedScore).toBe(33.3);
        expect(s.total.riskCategory).toBe("MUY_ALTO");
    });

    it("clima: escala 1-5 con inversión, nivel = desfavorabilidad", () => {
        const instrument = getInstrument("CLIMA");
        const dimensionScores: Record<string, number | null> = {};
        for (const d of instrument.config("A").dimensions) dimensionScores[d.key] = 70;
        const s = buildScoredDataFromTransformed({ instrument, formType: "A", dimensionScores, total: null, jobLevel: null });
        expect(s.total.transformedScore).toBe(70);
        expect(s.total.riskCategory).toBe("ALTO");
        expect(Object.keys(s.domains)).toHaveLength(0);
    });
});
