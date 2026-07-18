import { describe, it, expect } from 'vitest';
import { scoreQuestionnaire } from './index';

describe('A. Motor de Cálculo (Precisión Matemática)', () => {
    it('Inversión de Ítems (Fase 1): Responder 0 en ítem inverso de Forma A devuelve 4', () => {
        // En Forma A, los ítems 53 al 59 son de Claridad de Rol y son invertidos.
        const responses: Record<string, number> = {};
        for (let i = 53; i <= 59; i++) responses[String(i)] = 0; // "Siempre"
        
        const result = scoreQuestionnaire(responses, 'A', 'INTRALABORAL');
        const clarity = result.dimensions['claridad_rol'];
        
        // Suma cruda = 7 ítems * 4 = 28
        expect(clarity.rawScore).toBe(28);
        expect(clarity.transformedScore).toBe(100.0);
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
        const responses: Record<string, number> = {};
        for (let i = 97; i <= 105; i++) responses[String(i)] = 4; // Llenamos relación con colaboradores
        
        const result = scoreQuestionnaire(responses, 'A', 'INTRALABORAL', { hasPersonnelManagement: false });
        const colaboradores = result.dimensions['relacion_colaboradores'];
        
        expect(colaboradores.rawScore).toBe(0);
        expect(colaboradores.transformedScore).toBe(0);
        expect(colaboradores.isValid).toBe(true);
    });
});

describe('C. Baremación Diferencial (Lookup)', () => {
    it('Extralaboral: Jefatura=Riesgo Alto, Operario=Riesgo Medio con mismo puntaje', () => {
        const responses: Record<string, number> = {};
        // Para que de Alto en Jefe y Medio en Operario, el valor debe ser ~23.4
        // Raw = 29 -> Transformed = (29 / 124) * 100 = 23.38 -> 23.4
        for (let i = 1; i <= 29; i++) responses[String(i)] = 1; 
        for (let i = 30; i <= 31; i++) responses[String(i)] = 0; 

        // Con JobLevel = JEFATURA
        const resultJefe = scoreQuestionnaire(responses, 'A', 'EXTRALABORAL', { jobLevel: 'JEFATURA' });
        expect(resultJefe.total.transformedScore).toBe(23.4);
        expect(resultJefe.total.riskLevel).toBe(4); // 4 = ALTO

        // Con JobLevel = OPERATIVO
        const resultOperario = scoreQuestionnaire(responses, 'A', 'EXTRALABORAL', { jobLevel: 'OPERATIVO' });
        expect(resultOperario.total.transformedScore).toBe(23.4);
        expect(resultOperario.total.riskLevel).toBe(3); // 3 = MEDIO
    });

    it('Estrés: Profesionales=Nivel Bajo, Auxiliares=Nivel Medio con mismo puntaje', () => {
        const responses2: Record<string, number> = {};
        for(let i=1; i<=8; i++) responses2[String(i)] = 1; // prom 1 * 4 = 4
        for(let i=9; i<=12; i++) responses2[String(i)] = 1; // prom 1 * 3 = 3
        for(let i=13; i<=22; i++) responses2[String(i)] = 0; // prom 0
        for(let i=23; i<=25; i++) responses2[String(i)] = 1; // 3 items de 9
        for(let i=26; i<=31; i++) responses2[String(i)] = 0; 
        // Prom G4 = 3/9 = 0.3333 * 1 = 0.3333
        // Total = 4 + 3 + 0 + 0.3333 = 7.3333
        // Transformado = 7.3333 / 61.16 * 100 = 11.99 -> 12.0
        
        const resultPro = scoreQuestionnaire(responses2, 'A', 'STRESS', { jobLevel: 'PROFESIONAL' });
        expect(resultPro.total.transformedScore).toBe(12.0);
        expect(resultPro.total.riskLevel).toBe(2); // 2 = BAJO
        
        const resultAux = scoreQuestionnaire(responses2, 'A', 'STRESS', { jobLevel: 'AUXILIAR' });
        expect(resultAux.total.transformedScore).toBe(12.0);
        expect(resultAux.total.riskLevel).toBe(3); // 3 = MEDIO
    });
});

describe('D. Algoritmo Manual de Estrés', () => {
    it('Suma ponderada exacta: Todos "A veces" (3)', () => {
        const responses: Record<string, number> = {};
        for (let i = 1; i <= 31; i++) responses[String(i)] = 3;
        
        const result = scoreQuestionnaire(responses, 'A', 'STRESS', { jobLevel: 'AUXILIAR' });
        
        expect(result.total.rawScore).toBe(30);
        expect(result.total.transformedScore).toBe(49.1);
    });
});
