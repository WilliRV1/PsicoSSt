import { DomainDictionary, DimensionDictionary } from './types';
import { demandsDomain } from './domains/demands';

// Central Registry for Clinical Dictionaries
export const domains: Record<string, DomainDictionary> = {
  demands: demandsDomain,
  // leadership: leadershipDomain,
  // control: controlDomain,
  // reward: rewardDomain,
};

// Example function to retrieve interpretation
export function getClinicalConcept(
  type: 'domain' | 'dimension',
  id: string, // e.g. 'demandas_trabajo'
  riskLevel: 'MUY_ALTO' | 'ALTO' | 'MEDIO' | 'BAJO' | 'SIN_RIESGO'
) {
  if (type === 'domain') {
    // Busca en todos los diccionarios de dominios registrados
    for (const domainKey in domains) {
      if (domains[domainKey][id] && domains[domainKey][id][riskLevel]) {
        return domains[domainKey][id][riskLevel];
      }
    }
  }
  return null;
}
