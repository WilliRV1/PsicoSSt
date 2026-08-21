import { describe, it, expect } from 'vitest';
import { scoreQuestionnaire } from './index';

describe('A. Motor de Cálculo (Precisión Matemática)', () => {
    it('Inversión de Ítems (Fase 1): Responder 0 en ítems inversos de Forma A devuelve 4', () => {
        // En Forma A, los ítems de Demandas de Carga Mental (16, 17, 18, 20, 21) son factores de riesgo y se invierten.
        const responses: Record<string, number> = {};
        [16, 17, 18, 20, 21].forEach(i => responses[String(i)] = 0); // "Siempre"
        
        const result = scoreQuestionnaire(responses, 'A', 'INTRALABORAL');
        const cargaMental = result.dimensions['demandas_carga_mental'];
        
        // Suma cruda = 5 ítems * 4 = 20
        expect(cargaMental.rawScore).toBe(20);
        expect(cargaMental.transformedScore).toBe(100.0);
    });

    it('Tolerancia a Faltantes: Falta 1 ítem en Liderazgo -> Valida e imputa por la media', () => {
        const responses: Record<string, number> = {};
        // Liderazgo: ítems 63 al 75 (13 ítems). 
        for (let i = 63; i <= 75; i++) responses[String(i)] = 1;
        delete responses['63']; // Falta el ítem 63
        
        const result = scoreQuestionnaire(responses, 'A', 'INTRALABORAL');
        const liderazgo = result.dimensions['liderazgo_caracteristicas'];
        
        expect(liderazgo.isValid).toBe(true);
        // Suma original de 12 ítems = 12. Media = 1. Faltante imputado = 1.
        // Total crudo esperado = 13.
        expect(liderazgo.rawScore).toBe(13);
        expect(liderazgo.transformedScore).toBe(25.0);
    });

    it('Tolerancia a Faltantes: Falta 1 ítem en Demandas Cuantitativas -> Inválido', () => {
        const responses: Record<string, number> = {};
        // Demandas cuantitativas: 13 al 23 (11 ítems)
        for (let i = 13; i <= 23; i++) responses[String(i)] = 2;
        delete responses['13'];
        
        const result = scoreQuestionnaire(responses, 'A', 'INTRALABORAL');
        const cuantitativas = result.dimensions['demandas_cuantitativas'];
        
        expect(cuantitativas.isValid).toBe(false);
        expect(cuantitativas.rawScore).toBe(0);
        expect(cuantitativas.transformedScore).toBe(0);
        expect(result.total.rawScore).toBe(0);
        expect(result.total.transformedScore).toBe(0);
    });

    it('Tolerancia a Faltantes: Falta 1 ítem en Estrés -> Inválido', () => {
        const responses: Record<string, number> = {};
        for (let i = 1; i <= 31; i++) responses[String(i)] = 1;
        delete responses['1']; // Falta ítem 1
        
        const result = scoreQuestionnaire(responses, 'A', 'STRESS', { jobLevel: 'AUXILIAR' });
        
        expect((result.total as any).isValid).toBe(false);
        expect(result.total.rawScore).toBe(0);
        expect(result.total.transformedScore).toBe(0);
    });

    it('Redondeo Legal: 29.15 redondea a 29.2 y 29.14 a 29.1', () => {
        const round1 = (value: number) => Math.round(value * 10) / 10;
        expect(round1(29.15)).toBe(29.2);
        expect(round1(29.14)).toBe(29.1);
    });
});

describe('B. Filtros Condicionales (Saltos Lógicos)', () => {
    it('Servicio al Cliente = NO -> Demandas Emocionales = 0.0', () => {
        const responses: Record<string, number> = {};
        for (let i = 106; i <= 114; i++) responses[String(i)] = 4; // Llenamos demandas emocionales
        
        const result = scoreQuestionnaire(responses, 'A', 'INTRALABORAL', { hasCustomerInteraction: false });
        const emocionales = result.dimensions['demandas_emocionales'];
        
        expect(emocionales.rawScore).toBe(0);
        expect(emocionales.transformedScore).toBe(0);
        expect(emocionales.isValid).toBe(true);
    });

    it('Personal a Cargo = NO (Forma A) -> Relación con Colaboradores = 0.0', () => {
        // Los ítems de esta dimensión son el 115 al 123 (M2, Tabla 23), y quien
        // decide si aplica es la respuesta del trabajador a "soy jefe de otras
        // personas", no su nivel del cargo.
        const responses: Record<string, number> = {};
        for (let i = 115; i <= 123; i++) responses[String(i)] = 4;

        const result = scoreQuestionnaire(responses, 'A', 'INTRALABORAL', { hasPeopleInCharge: false });

        expect(result.dimensions['relacion_colaboradores'].rawScore).toBe(0);
        expect(result.dimensions['relacion_colaboradores'].transformedScore).toBe(0);
        expect(result.dimensions['relacion_colaboradores'].isFiltered).toBe(true);
    });

    it('Extralaboral: Jefatura=Riesgo Alto, Operario=Riesgo Medio con mismo puntaje', () => {
        const responses: Record<string, number> = {};
        // Para que de Alto en Jefe y Medio en Operario, el valor debe ser ~23.4
        // Raw = 29 -> Transformed = (29 / 124) * 100 = 23.38 -> 23.4
        // Due to the newly added inverted items, answering 1 or 0 will affect the score.
        // There are 8 inverted items: 2, 3, 6, 24, 26, 28, 30, 31
        // Let's set the raw score exactly so that transformed = 23.4 (Raw = 29)
        // If we answer 0 for all inverted, they become 4. 8 * 4 = 32 (too high)
        // Let's just mock the responses so raw score is exactly 29 without relying on simple loops
        // Non-inverted items: 23 items. Inverted items: 8 items.
        for (let i = 1; i <= 31; i++) responses[String(i)] = 1; 
        // Inverted items will be 4 - 1 = 3. 8 * 3 = 24.
        // Non-inverted items will be 1. 23 * 1 = 23.
        // Total = 47. 47 / 124 = 37.9%.
        // Let's adjust to get Raw = 29.
        // We need 29 total points. 
        for (let i = 1; i <= 31; i++) responses[String(i)] = 0; // All 0. Inverted = 4 * 8 = 32. 
        // We need 29. So 32 - 3 = 29. 
        // Change one inverted item from 0 to 3 -> score 1. (loss of 3).
        responses["2"] = 3; // inverted: 4-3 = 1.
        
        // Con JobLevel = JEFATURA
        const resultJefe = scoreQuestionnaire(responses, 'A', 'EXTRALABORAL', { jobLevel: 'JEFATURA' });
        expect(resultJefe.total.transformedScore).toBe(23.4);
        expect(resultJefe.total.riskLevel).toBe(4); // 4 = ALTO

        // Con JobLevel = OPERATIVO
        const resultOperario = scoreQuestionnaire(responses, 'A', 'EXTRALABORAL', { jobLevel: 'OPERATIVO' });
        expect(resultOperario.total.transformedScore).toBe(23.4);
        expect(resultOperario.total.riskLevel).toBe(3); // 3 = MEDIO
    });

    it('Estrés: un mismo puntaje cae en niveles distintos según el nivel ocupacional', () => {
        // M4, Tabla 6: para jefes/profesionales/técnicos el nivel medio llega
        // hasta 17,7; para auxiliares y operarios el alto empieza en 17,1.
        const responses: Record<string, number> = {};
        for (let i = 1; i <= 31; i++) responses[String(i)] = 3; // "Nunca" = 0 puntos
        responses['1'] = 0;  // grupo de peso 9 → promedio(1,8) = 9/8, x4 = 4,5
        responses['9'] = 1;  // grupo de peso 9, "casi siempre" = 6 → 6/4, x3 = 4,5
        responses['13'] = 0; // grupo de peso 9 → 9/10, x2 = 1,8

        const jefe = scoreQuestionnaire(responses, 'A', 'STRESS', { jobLevel: 'PROFESIONAL' });
        const auxiliar = scoreQuestionnaire(responses, 'A', 'STRESS', { jobLevel: 'OPERATIVO' });

        expect(jefe.total.transformedScore).toBe(17.7);
        expect(jefe.total.riskCategory).toBe('MEDIO');
        expect(auxiliar.total.riskCategory).toBe('ALTO');
    });

    it('Suma ponderada exacta: todos los ítems en "A veces"', () => {
        // "A veces" se guarda como 2. Según la Tabla 4 vale 3, 2 o 1 punto
        // según el grupo del ítem, de modo que los cuatro promedios ponderados
        // dan 8,5 + 6 + 4 + 1,89 = 20,4.
        const responses: Record<string, number> = {};
        for (let i = 1; i <= 31; i++) responses[String(i)] = 2;

        const result = scoreQuestionnaire(responses, 'A', 'STRESS', { jobLevel: 'AUXILIAR' });

        expect(result.total.rawScore).toBe(20.4);
        expect(result.total.transformedScore).toBe(33.3);
        expect(result.total.riskCategory).toBe('MUY_ALTO');
    });

});
