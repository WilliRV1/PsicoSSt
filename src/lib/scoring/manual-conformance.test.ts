import { describe, it, expect } from "vitest";
import formA from "@/config/battery/form-a-config.json";
import formB from "@/config/battery/form-b-config.json";
import extralaboral from "@/config/battery/extralaboral-config.json";
import stress from "@/config/battery/stress-config.json";
import baremos from "@/config/battery/baremos.json";
import itemTexts from "@/config/battery/items.json";
import { lookupRiskCategory, scoreQuestionnaire } from "./index";
import type { BaremoThreshold, ItemResponses } from "@/types/battery";

/**
 * Conformidad con los manuales oficiales de la Batería.
 *
 * Cada aserción cita la tabla o el ejemplo del manual del que sale el número
 * esperado. La configuración de la Batería son cerca de trescientas constantes
 * transcritas a mano —ítems por dimensión, ítems inversos, factores de
 * transformación y baremos— y una sola mal copiada altera la calificación sin
 * que nada falle: los puntajes siguen saliendo, sólo que equivocados. Esta
 * suite es lo que ancla esas constantes a la fuente.
 *
 * Fuentes:
 *   M2 = Manual del cuestionario intralaboral formas A y B
 *   M3 = Manual del cuestionario extralaboral
 *   M4 = Manual del cuestionario para la evaluación del estrés (3.ª versión)
 */

const dim = (cfg: { dimensions: { key: string; items: number[]; invertedItems: number[] }[] }, key: string) =>
    cfg.dimensions.find(d => d.key === key)!;

const domain = (cfg: { domains: { key: string; transformationFactor: number }[] }, key: string) =>
    cfg.domains.find(d => d.key === key)!;

/** Cotas superiores de las cinco bandas, en orden. */
const bands = (b: Record<string, number[]>) =>
    [b.sinRiesgo, b.bajo, b.medio, b.alto, b.muyAlto].map(x => x[1]);

// ════════════════════════════════════════════════════════════
describe("M2 · Tabla 23 — ítems que integran cada dimensión", () => {
    const ESPERADO_A: Record<string, number[]> = {
        liderazgo_caracteristicas: [63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75],
        relaciones_sociales: [76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89],
        retroalimentacion_desempeno: [90, 91, 92, 93, 94],
        relacion_colaboradores: [115, 116, 117, 118, 119, 120, 121, 122, 123],
        claridad_rol: [53, 54, 55, 56, 57, 58, 59],
        capacitacion: [60, 61, 62],
        participacion_cambio: [48, 49, 50, 51],
        oportunidades_desarrollo: [39, 40, 41, 42],
        control_autonomia: [44, 45, 46],
        demandas_ambientales: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
        demandas_emocionales: [106, 107, 108, 109, 110, 111, 112, 113, 114],
        demandas_cuantitativas: [13, 14, 15, 32, 43, 47],
        influencia_trabajo_extralaboral: [35, 36, 37, 38],
    };

    for (const [key, items] of Object.entries(ESPERADO_A)) {
        it(`forma A · ${key}`, () => {
            expect(dim(formA, key).items).toEqual(items);
        });
    }

    it("forma A suma 123 ítems y forma B suma 97", () => {
        expect(formA.dimensions.reduce((s, d) => s + d.items.length, 0)).toBe(123);
        expect(formB.dimensions.reduce((s, d) => s + d.items.length, 0)).toBe(97);
    });

    it("forma B no evalúa relación con los colaboradores, exigencias de responsabilidad ni consistencia del rol", () => {
        for (const k of ["relacion_colaboradores", "exigencias_responsabilidad", "consistencia_rol"]) {
            expect(formB.dimensions.find(d => d.key === k)).toBeUndefined();
        }
    });
});

// ════════════════════════════════════════════════════════════
describe("M2 · Tablas 21 y 22 — calificación de las opciones de respuesta", () => {
    // Los ítems que el manual califica Siempre=4 … Nunca=0. La interfaz guarda
    // 0=Siempre … 4=Nunca, de modo que son exactamente los que deben invertirse.
    const INVERSOS_A = [
        1, 2, 3, 7, 8, 10, 11, 13, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30,
        31, 33, 35, 36, 37, 38, 52, 80, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117,
        118, 119, 120, 121, 122, 123,
    ];
    const INVERSOS_B = [
        1, 2, 3, 7, 8, 10, 11, 13, 15, 16, 17, 18, 19, 20, 21, 23, 25, 26, 27, 28, 66, 89, 90, 91,
        92, 93, 94, 95, 96,
    ];

    const union = (cfg: { dimensions: { invertedItems: number[] }[] }) =>
        [...new Set(cfg.dimensions.flatMap(d => d.invertedItems))].sort((a, b) => a - b);

    it("forma A invierte exactamente los ítems de la Tabla 21", () => {
        expect(union(formA)).toEqual(INVERSOS_A);
    });

    it("forma B invierte exactamente los ítems de la Tabla 22", () => {
        expect(union(formB)).toEqual(INVERSOS_B);
    });

    it("los ítems 4, 5, 6, 9 y 12 no se invierten: están redactados en positivo", () => {
        // "El aire es fresco y agradable", "La luz es agradable", "El espacio es
        // cómodo", "Los equipos son cómodos", "El lugar es limpio y ordenado".
        // Responder "Siempre" a cualquiera de ellos indica ausencia de riesgo.
        for (const cfg of [formA, formB]) {
            const inv = dim(cfg, "demandas_ambientales").invertedItems;
            for (const i of [4, 5, 6, 9, 12]) expect(inv).not.toContain(i);
            for (const i of [1, 2, 3, 7, 8, 10, 11]) expect(inv).toContain(i);
        }
    });

    it("ningún ítem aparece como inverso en dos dimensiones a la vez", () => {
        for (const cfg of [formA, formB, extralaboral]) {
            const all = cfg.dimensions.flatMap(d => d.invertedItems);
            expect(all.length).toBe(new Set(all).size);
        }
    });
});

// ════════════════════════════════════════════════════════════
describe("M2 · Tablas 25, 26 y 27 — factores de transformación", () => {
    const T25: Record<string, [number, number | null]> = {
        liderazgo_caracteristicas: [52, 52],
        relaciones_sociales: [56, 48],
        retroalimentacion_desempeno: [20, 20],
        relacion_colaboradores: [36, null],
        claridad_rol: [28, 20],
        capacitacion: [12, 12],
        participacion_cambio: [16, 12],
        oportunidades_desarrollo: [16, 16],
        control_autonomia: [12, 12],
        demandas_ambientales: [48, 48],
        demandas_emocionales: [36, 36],
        demandas_cuantitativas: [24, 12],
        influencia_trabajo_extralaboral: [16, 16],
        exigencias_responsabilidad: [24, null],
        demandas_carga_mental: [20, 20],
        consistencia_rol: [20, null],
        demandas_jornada: [12, 24],
        recompensas_pertenencia: [20, 16],
        reconocimiento_compensacion: [24, 24],
    };

    it("el factor de cada dimensión equivale a su número de ítems por 4", () => {
        for (const [key, [fa, fb]] of Object.entries(T25)) {
            expect(dim(formA, key).items.length * 4, `forma A · ${key}`).toBe(fa);
            if (fb !== null) expect(dim(formB, key).items.length * 4, `forma B · ${key}`).toBe(fb);
        }
    });

    it("Tabla 26 · dominios", () => {
        const T26: Record<string, [number, number]> = {
            liderazgo_relaciones: [164, 120],
            control_trabajo: [84, 72],
            demandas_trabajo: [200, 156],
            recompensa: [44, 40],
        };
        for (const [key, [fa, fb]] of Object.entries(T26)) {
            expect(domain(formA, key).transformationFactor, `A · ${key}`).toBe(fa);
            expect(domain(formB, key).transformationFactor, `B · ${key}`).toBe(fb);
        }
    });

    it("Tabla 27 · total del cuestionario intralaboral", () => {
        expect(formA.totalTransformationFactor).toBe(492);
        expect(formB.totalTransformationFactor).toBe(388);
    });
});

// ════════════════════════════════════════════════════════════
describe("M2 · ejemplos resueltos del manual", () => {
    /** Aplica la fórmula del Paso 3 tal como la enuncia el manual. */
    const transformar = (bruto: number, factor: number) =>
        Math.round((bruto / factor) * 100 * 10) / 10;

    it("ejemplo 1 · bruto 34 en relaciones sociales forma A → 60,7", () => {
        expect(transformar(34, dim(formA, "relaciones_sociales").items.length * 4)).toBe(60.7);
    });

    it("ejemplo 2 · bruto 7 en demandas de la jornada forma B → 29,2", () => {
        expect(transformar(7, dim(formB, "demandas_jornada").items.length * 4)).toBe(29.2);
    });

    it("ejemplo 3 · bruto 81 en demandas del trabajo forma A → 40,5", () => {
        expect(transformar(81, domain(formA, "demandas_trabajo").transformationFactor)).toBe(40.5);
    });

    it("ejemplo 4 · bruto 17 en control sobre el trabajo forma B → 23,6", () => {
        expect(transformar(17, domain(formB, "control_trabajo").transformationFactor)).toBe(23.6);
    });

    it("ejemplo 5 · bruto total 278 forma A → 56,5", () => {
        expect(transformar(278, formA.totalTransformationFactor)).toBe(56.5);
    });

    it("ejemplo 6 · 60,7 en relaciones sociales forma A es riesgo muy alto", () => {
        expect(lookupRiskCategory(60.7, baremos.intralaboral_a.dimensions.relaciones_sociales as BaremoThreshold)).toBe(
            "MUY_ALTO"
        );
    });

    it("ejemplo 7 · 23,6 en control sobre el trabajo forma B es riesgo bajo", () => {
        expect(lookupRiskCategory(23.6, baremos.intralaboral_b.domains.control_trabajo as BaremoThreshold)).toBe("BAJO");
    });
});

// ════════════════════════════════════════════════════════════
describe("M2 · Tablas 29 a 33 — baremos", () => {
    it("Tabla 29 · dimensiones de la forma A", () => {
        const T29: Record<string, number[]> = {
            liderazgo_caracteristicas: [3.8, 15.4, 30.8, 46.2, 100],
            relaciones_sociales: [5.4, 16.1, 25, 37.5, 100],
            retroalimentacion_desempeno: [10, 25, 40, 55, 100],
            relacion_colaboradores: [13.9, 25, 33.3, 47.2, 100],
            claridad_rol: [0.9, 10.7, 21.4, 39.3, 100],
            capacitacion: [0.9, 16.7, 33.3, 50, 100],
            participacion_cambio: [12.5, 25, 37.5, 50, 100],
            oportunidades_desarrollo: [0.9, 6.3, 18.8, 31.3, 100],
            control_autonomia: [8.3, 25, 41.7, 58.3, 100],
            demandas_ambientales: [14.6, 22.9, 31.3, 39.6, 100],
            demandas_emocionales: [16.7, 25, 33.3, 47.2, 100],
            demandas_cuantitativas: [25, 33.3, 45.8, 54.2, 100],
            influencia_trabajo_extralaboral: [18.8, 31.3, 43.8, 50, 100],
            exigencias_responsabilidad: [37.5, 54.2, 66.7, 79.2, 100],
            demandas_carga_mental: [60, 70, 80, 90, 100],
            consistencia_rol: [15, 25, 35, 45, 100],
            demandas_jornada: [8.3, 25, 33.3, 50, 100],
            recompensas_pertenencia: [0.9, 5, 10, 20, 100],
            reconocimiento_compensacion: [4.2, 16.7, 25, 37.5, 100],
        };
        for (const [k, esperado] of Object.entries(T29)) {
            expect(bands(baremos.intralaboral_a.dimensions[k as never]), k).toEqual(esperado);
        }
    });

    it("Tabla 30 · dimensiones de la forma B", () => {
        const T30: Record<string, number[]> = {
            liderazgo_caracteristicas: [3.8, 13.5, 25, 38.5, 100],
            relaciones_sociales: [6.3, 14.6, 27.1, 37.5, 100],
            retroalimentacion_desempeno: [5, 20, 30, 50, 100],
            claridad_rol: [0.9, 5, 15, 30, 100],
            capacitacion: [0.9, 16.7, 25, 50, 100],
            participacion_cambio: [16.7, 33.3, 41.7, 58.3, 100],
            control_autonomia: [33.3, 50, 66.7, 75, 100],
            demandas_ambientales: [22.9, 31.3, 39.6, 47.9, 100],
            demandas_emocionales: [19.4, 27.8, 38.9, 47.2, 100],
            demandas_cuantitativas: [16.7, 33.3, 41.7, 50, 100],
            demandas_carga_mental: [50, 65, 75, 85, 100],
            demandas_jornada: [25, 37.5, 45.8, 58.3, 100],
            reconocimiento_compensacion: [0.9, 12.5, 25, 37.5, 100],
        };
        for (const [k, esperado] of Object.entries(T30)) {
            expect(bands(baremos.intralaboral_b.dimensions[k as never]), k).toEqual(esperado);
        }
    });

    it("Tablas 31 y 32 · dominios", () => {
        const A: Record<string, number[]> = {
            liderazgo_relaciones: [9.1, 17.7, 25.6, 34.8, 100],
            control_trabajo: [10.7, 19, 29.8, 40.5, 100],
            demandas_trabajo: [28.5, 35, 41.5, 47.5, 100],
        };
        const B: Record<string, number[]> = {
            liderazgo_relaciones: [8.3, 17.5, 26.7, 38.3, 100],
            control_trabajo: [19.4, 26.4, 34.7, 43.1, 100],
            demandas_trabajo: [26.9, 33.3, 37.8, 44.2, 100],
            recompensa: [2.5, 10, 17.5, 27.5, 100],
        };
        for (const [k, e] of Object.entries(A))
            expect(bands(baremos.intralaboral_a.domains[k as never]), `A·${k}`).toEqual(e);
        for (const [k, e] of Object.entries(B))
            expect(bands(baremos.intralaboral_b.domains[k as never]), `B·${k}`).toEqual(e);
    });

    it("Tabla 33 · total del cuestionario", () => {
        expect(bands(baremos.intralaboral_a.total)).toEqual([19.7, 25.8, 31.5, 38, 100]);
        expect(bands(baremos.intralaboral_b.total)).toEqual([20.6, 26, 31.2, 38.7, 100]);
    });

    it("las bandas son contiguas: cada una empieza 0,1 después de la anterior", () => {
        const revisar = (t: Record<string, number[]>, etiqueta: string) => {
            const orden = ["sinRiesgo", "bajo", "medio", "alto", "muyAlto"];
            for (let i = 1; i < orden.length; i++) {
                expect(
                    Math.round((t[orden[i]][0] - t[orden[i - 1]][1]) * 10) / 10,
                    `${etiqueta} · ${orden[i]}`
                ).toBe(0.1);
            }
        };
        for (const forma of ["intralaboral_a", "intralaboral_b"] as const) {
            const b = baremos[forma];
            for (const [k, v] of Object.entries(b.dimensions)) revisar(v, `${forma}.${k}`);
            for (const [k, v] of Object.entries(b.domains)) revisar(v, `${forma}.${k}`);
            revisar(b.total, `${forma}.total`);
        }
    });
});

// ════════════════════════════════════════════════════════════
describe("M3 · cuestionario extralaboral", () => {
    it("Tabla 12 · ítems que integran cada dimensión", () => {
        const T12: Record<string, number[]> = {
            tiempo_fuera_trabajo: [14, 15, 16, 17],
            relaciones_familiares: [22, 25, 27],
            comunicacion_relaciones: [18, 19, 20, 21, 23],
            situacion_economica: [29, 30, 31],
            caracteristicas_vivienda: [5, 6, 7, 8, 9, 10, 11, 12, 13],
            influencia_entorno_extralaboral: [24, 26, 28],
            desplazamiento_vivienda: [1, 2, 3, 4],
        };
        for (const [k, items] of Object.entries(T12)) {
            expect(dim(extralaboral, k).items, k).toEqual(items);
        }
    });

    it("Tabla 11 · ítems que se califican de forma invertida", () => {
        const inv = [...new Set(extralaboral.dimensions.flatMap(d => d.invertedItems))].sort(
            (a, b) => a - b
        );
        expect(inv).toEqual([2, 3, 6, 24, 26, 28, 30, 31]);
    });

    it("Tabla 14 · factores de transformación", () => {
        const T14: Record<string, number> = {
            tiempo_fuera_trabajo: 16,
            relaciones_familiares: 12,
            comunicacion_relaciones: 20,
            situacion_economica: 12,
            caracteristicas_vivienda: 36,
            influencia_entorno_extralaboral: 12,
            desplazamiento_vivienda: 16,
        };
        for (const [k, f] of Object.entries(T14)) {
            expect(dim(extralaboral, k).items.length * 4, k).toBe(f);
        }
        expect(extralaboral.totalTransformationFactor).toBe(124);
    });

    it("ejemplos 1 a 3 del manual", () => {
        const t = (b: number, f: number) => Math.round((b / f) * 100 * 10) / 10;
        expect(t(4, 12)).toBe(33.3); // situación económica
        expect(t(6, 36)).toBe(16.7); // características de la vivienda
        expect(t(28, 124)).toBe(22.6); // total
    });
});

// ════════════════════════════════════════════════════════════
describe("M4 · cuestionario para la evaluación del estrés", () => {
    it("Tabla 4 · el máximo posible del puntaje bruto es el factor de transformación", () => {
        // Si el factor 61,16 es correcto, responder "Siempre" a los 31 ítems
        // debe dar exactamente 100. Es la comprobación que delata una
        // ponderación de ítem equivocada: con pesos uniformes el máximo cae a
        // la mitad y nadie puede clasificar en nivel alto.
        const responses: ItemResponses = {};
        for (let i = 1; i <= 31; i++) responses[String(i)] = 0; // 0 = "Siempre"

        const r = scoreQuestionnaire(responses, "A", "STRESS", {
            jobLevel: "PROFESIONAL",
            occupationalGroup: "jefes_profesionales_tecnicos",
        });

        expect(r.total.transformedScore).toBe(100);
        expect(r.total.riskCategory).toBe("MUY_ALTO");
    });

    it("responder «Nunca» a los 31 ítems da 0 y nivel muy bajo", () => {
        const responses: ItemResponses = {};
        for (let i = 1; i <= 31; i++) responses[String(i)] = 3; // 3 = "Nunca"

        const r = scoreQuestionnaire(responses, "A", "STRESS", {
            jobLevel: "PROFESIONAL",
            occupationalGroup: "jefes_profesionales_tecnicos",
        });

        expect(r.total.transformedScore).toBe(0);
        expect(r.total.riskCategory).toBe("SIN_RIESGO");
    });

    it("el factor de transformación es 61,16 y hay 31 ítems", () => {
        expect(stress.totalTransformationFactor).toBe(61.16);
        expect(stress.totalItems).toBe(31);
    });

    it("Tabla 6 · baremos por nivel ocupacional", () => {
        expect(bands(baremos.stress.jefes_profesionales_tecnicos)).toEqual([7.8, 12.6, 17.7, 25, 100]);
        expect(bands(baremos.stress.auxiliares_operativos)).toEqual([6.5, 11.8, 17, 23.4, 100]);
    });

    it("el desglose por grupo de síntomas refleja la gravedad real, no siempre Sin Riesgo", () => {
        // baremos.json no publica baremo propio por grupo de síntomas (sólo
        // para el total), y el motor calificaba cada grupo con un promedio
        // simple sin baremo, cayendo siempre en SIN_RIESGO sin importar la
        // respuesta — lo que impedía que la alerta de salud mental de
        // sintomas_psicoemocionales se disparara jamás. Responder "Siempre"
        // a los 9 ítems de ese grupo debe clasificarlo en un nivel alto.
        const responses: ItemResponses = {};
        for (let i = 1; i <= 31; i++) responses[String(i)] = 3; // resto en "Nunca"
        for (const i of [23, 24, 25, 26, 27, 28, 29, 30, 31]) responses[String(i)] = 0; // "Siempre"

        const r = scoreQuestionnaire(responses, "A", "STRESS", {
            jobLevel: "PROFESIONAL",
            occupationalGroup: "jefes_profesionales_tecnicos",
        });

        const psicoemocional = r.dimensions.sintomas_psicoemocionales;
        expect(psicoemocional.isValid).toBe(true);
        expect(psicoemocional.transformedScore).toBe(100);
        expect(["ALTO", "MUY_ALTO"]).toContain(psicoemocional.riskCategory);

        const fisiologico = r.dimensions.sintomas_fisiologicos;
        expect(fisiologico.transformedScore).toBe(0);
        expect(fisiologico.riskCategory).toBe("SIN_RIESGO");
    });

    it("estrés incompleto invalida también el desglose por grupo de síntomas", () => {
        const responses: ItemResponses = {};
        for (let i = 1; i <= 30; i++) responses[String(i)] = 0; // falta el ítem 31

        const r = scoreQuestionnaire(responses, "A", "STRESS", {
            jobLevel: "PROFESIONAL",
            occupationalGroup: "jefes_profesionales_tecnicos",
        });

        expect(r.total.isValid).toBe(false);
        expect(r.dimensions.sintomas_psicoemocionales.isValid).toBe(false);
        expect(r.dimensions.sintomas_psicoemocionales.riskCategory).toBe("INVALIDO");
    });
});

// ════════════════════════════════════════════════════════════
describe("M2 · validez de los resultados", () => {
    it("una dimensión sin el mínimo de ítems invalida el cuestionario completo", () => {
        // El manual: "Si una dimensión no cuenta con el número mínimo de ítems
        // respondidos no debe calcularse su puntaje bruto, así como tampoco el
        // del dominio al que pertenece, ni el puntaje bruto total general".
        const responses: ItemResponses = {};
        for (let i = 1; i <= 123; i++) responses[String(i)] = 2;
        delete responses["53"]; // claridad de rol no tolera faltantes
        delete responses["54"];

        const r = scoreQuestionnaire(responses, "A", "INTRALABORAL", {
            hasCustomerInteraction: true,
            hasPeopleInCharge: true,
        });

        expect(r.dimensions.claridad_rol.isValid).toBe(false);
        expect(r.total.isValid).toBe(false);
        // Y no debe presentarse como un resultado sano.
        expect(r.total.riskCategory).not.toBe("SIN_RIESGO");
    });

    it("tolera un ítem faltante en las cuatro dimensiones que el manual permite", () => {
        for (const [clave, item] of [
            ["liderazgo_caracteristicas", 63],
            ["relaciones_sociales", 76],
            ["relacion_colaboradores", 115],
            ["demandas_ambientales", 1],
        ] as const) {
            const responses: ItemResponses = {};
            for (let i = 1; i <= 123; i++) responses[String(i)] = 2;
            delete responses[String(item)];

            const r = scoreQuestionnaire(responses, "A", "INTRALABORAL", {
                hasCustomerInteraction: true,
                hasPeopleInCharge: true,
            });
            expect(r.dimensions[clave].isValid, clave).toBe(true);
            expect(r.total.isValid, clave).toBe(true);
        }
    });

    it("sin personal a cargo, relación con los colaboradores obtiene puntaje bruto cero", () => {
        const responses: ItemResponses = {};
        for (let i = 1; i <= 114; i++) responses[String(i)] = 2;

        const r = scoreQuestionnaire(responses, "A", "INTRALABORAL", {
            hasCustomerInteraction: true,
            hasPeopleInCharge: false,
        });

        expect(r.dimensions.relacion_colaboradores.rawScore).toBe(0);
        expect(r.total.isValid).toBe(true);
    });

    it("Forma B: omitir demandas emocionales no invalida reconocimiento ni recompensa", () => {
        // Si no atiende clientes, el manual excluye únicamente 89–97. Este
        // caso protege contra el límite histórico 80–88, que dejó inválidas
        // evaluaciones por borrar preguntas de recompensa.
        const responses: ItemResponses = {};
        for (let i = 1; i <= 88; i++) responses[String(i)] = 2;

        const r = scoreQuestionnaire(responses, "B", "INTRALABORAL", {
            hasCustomerInteraction: false,
        });

        expect(r.dimensions.reconocimiento_compensacion.isValid).toBe(true);
        expect(r.dimensions.recompensas_pertenencia.isValid).toBe(true);
        expect(r.dimensions.demandas_emocionales.isFiltered).toBe(true);
        expect(r.total.isValid).toBe(true);
    });

    it("el nivel del cargo no decide si el trabajador tiene personal a cargo", () => {
        // Un técnico puede ser jefe y un profesional puede no serlo. La respuesta
        // a la pregunta de control es el único criterio del manual.
        const responses: ItemResponses = {};
        for (let i = 1; i <= 123; i++) responses[String(i)] = 2;

        const r = scoreQuestionnaire(responses, "A", "INTRALABORAL", {
            hasCustomerInteraction: true,
            hasPeopleInCharge: true,
            jobLevel: "TECNICO",
        });

        expect(r.dimensions.relacion_colaboradores.rawScore).toBeGreaterThan(0);
    });
});

// ════════════════════════════════════════════════════════════
describe("Cuadernillos — enunciados de los ítems", () => {
    it("cada cuestionario tiene el texto de todos sus ítems", () => {
        const esperado: [string, number][] = [
            ["A", 123],
            ["B", 97],
            ["EXTRALABORAL", 31],
            ["STRESS", 31],
        ];
        for (const [clave, total] of esperado) {
            const grupo = (itemTexts as Record<string, Record<string, string>>)[clave];
            expect(grupo, clave).toBeDefined();
            expect(Object.keys(grupo).length, clave).toBe(total);
            for (let i = 1; i <= total; i++) {
                const t = grupo[String(i)];
                expect(t, `${clave} · ítem ${i}`).toBeTruthy();
                // Un enunciado demasiado corto delata una extracción truncada.
                expect(t.length, `${clave} · ítem ${i}: ${t}`).toBeGreaterThan(11);
            }
        }
    });

    it("ningún enunciado arrastra la columna de respuestas del cuadernillo", () => {
        const cola = /\b(S[íi]\s+No|Siempre|Casi nunca|MUCHAS GRACIAS|DATOS GENERALES)\s*$/;
        for (const grupo of Object.values(itemTexts as Record<string, Record<string, string>>)) {
            for (const [n, t] of Object.entries(grupo)) {
                expect(cola.test(t), `ítem ${n}: ${t}`).toBe(false);
            }
        }
    });

    it("los enunciados corresponden a la dimensión que los reclama", () => {
        // Comprobación de sentido sobre ítems reconocibles: si el mapeo de
        // ítems a dimensiones se desalineara, estos dejarían de cuadrar.
        const A = (itemTexts as Record<string, Record<string, string>>).A;
        const E = (itemTexts as Record<string, Record<string, string>>).EXTRALABORAL;
        expect(A["1"]).toMatch(/ruido/i); // demandas ambientales
        expect(A["63"]).toMatch(/jefe/i); // características del liderazgo
        expect(A["115"]).toMatch(/colaboradores/i); // relación con los colaboradores
        expect(E["1"]).toMatch(/transportarme|trasportarme/i); // desplazamiento
        expect(E["29"]).toMatch(/dinero|gastos/i); // situación económica
    });
});
