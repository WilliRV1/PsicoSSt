// Type definitions for battery-specific scoring structures

/** Risk categories per Colombian battery manual */
export type RiskCategory =
    | "SIN_RIESGO"
    | "BAJO"
    | "MEDIO"
    | "ALTO"
    | "MUY_ALTO";

/** Form type determining questionnaire variant */
export type FormType = "A" | "B";

/** Questionnaire instrument type */
export type QuestionnaireType = "INTRALABORAL" | "EXTRALABORAL" | "STRESS";

/** Job levels determining form type or filters */
export type JobLevel = "JEFATURA" | "PROFESIONAL" | "TECNICO" | "AUXILIAR" | "OPERATIVO";

// ─────────────────────────────────────────────────
// Scoring Engine Types
// ─────────────────────────────────────────────────

/** Individual item response (item number → Likert value 0-4) */
export type ItemResponses = Record<string, number>;

/** Score result for a single dimension */
export interface DimensionScore {
    dimensionKey: string;
    dimensionName: string;
    rawScore: number;
    maxPossible: number;
    transformedScore: number;
    transformationFactor: number;
    baremoPercentile?: number;
    riskCategory: RiskCategory;
    riskLevel: number; // 1-5 numeric
    itemCount: number;
    invertedItems: number[];
    isValid: boolean;          // False if nullified by missing items
    isFiltered?: boolean;      // True if zeroed by filter questions
}

/** Score result for a domain (aggregation of dimensions) */
export interface DomainScore {
    domainKey: string;
    domainName: string;
    rawScore: number;
    maxPossible: number;
    transformedScore: number;
    riskCategory: RiskCategory;
    riskLevel: number;
    dimensions: string[]; // dimension keys in this domain
}

/** Total score for a questionnaire */
export interface TotalScore {
    rawScore: number;
    maxPossible: number;
    transformedScore: number;
    riskCategory: RiskCategory;
    riskLevel: number;
}

/** Complete scored result structure (stored as JSONB) */
export interface ScoredResultData {
    formType: FormType;
    questionnaireType: QuestionnaireType;
    dimensions: Record<string, DimensionScore>;
    domains: Record<string, DomainScore>;
    total: TotalScore;
}

// ─────────────────────────────────────────────────
// Battery Configuration Types
// ─────────────────────────────────────────────────

/** Configuration for a single dimension within a form */
export interface DimensionConfig {
    key: string;
    name: string;
    domainKey: string;
    items: number[];           // Item numbers belonging to this dimension
    invertedItems: number[];   // Items requiring score inversion (4 - value)
}

/** Configuration for a complete form (A or B) */
export interface FormConfig {
    formType: FormType;
    questionnaireType: QuestionnaireType;
    totalItems: number;
    dimensions: DimensionConfig[];
    domains: DomainConfig[];
}

/** Domain grouping configuration */
export interface DomainConfig {
    key: string;
    name: string;
    dimensionKeys: string[];
}

/** Baremo threshold entry: transformed score → risk category */
export interface BaremoThreshold {
    sinRiesgo: [number, number];  // [min, max] transformed score range
    bajo: [number, number];
    medio: [number, number];
    alto: [number, number];
    muyAlto: [number, number];
}

/** Complete baremo table for a form */
export interface BaremoTable {
    formType: FormType;
    questionnaireType: QuestionnaireType;
    dimensions: Record<string, BaremoThreshold>;
    domains: Record<string, BaremoThreshold>;
    total: BaremoThreshold;
}

// ─────────────────────────────────────────────────
// Report Types
// ─────────────────────────────────────────────────

/** Interpretation narrative for a single dimension */
export interface DimensionInterpretation {
    dimensionKey: string;
    dimensionName: string;
    riskCategory: RiskCategory;
    narrative: string;
    recommendations: string[];
}

/** Complete report data (stored as JSONB in Report model) */
export interface ReportData {
    workerInfo: {
        fullName: string;
        documentId: string;
        jobTitle: string;
        jobLevel: string;
        organization: string;
        area: string;
    };
    psychologistInfo: {
        fullName: string;
        licenseNumber: string;
        professionalCard: string;
        sstCredential: string;
    };
    assessmentDate: string;
    formType: FormType;
    scores: ScoredResultData;
    interpretations: DimensionInterpretation[];
    conclusions: string;
    recommendations: string[];
    consentInfo: {
        granted: boolean;
        method: string;
        date: string;
    };
}
