export type PriorityLevel = 'ALTA' | 'MEDIA' | 'BAJA';

export interface ActionRecommendation {
  text: string;
  priority: PriorityLevel;
  timeframe: string;
  responsible: string;
  impact: string;
  normative: string;
}

export interface ClinicalConcept {
  interpretation: string;
  evidence: string;
  consequence: string;
  recommendations: ActionRecommendation[];
}

export interface RiskLevelMap {
  MUY_ALTO: ClinicalConcept;
  ALTO: ClinicalConcept;
  MEDIO?: ClinicalConcept; 
  BAJO?: ClinicalConcept;
  SIN_RIESGO?: ClinicalConcept;
}

export type DomainDictionary = Record<string, RiskLevelMap>;
export type DimensionDictionary = Record<string, RiskLevelMap>;
