import { DomainDictionary } from '../types';

export const demandsDomain: DomainDictionary = {
  demandas_trabajo: {
    MUY_ALTO: {
      interpretation: "El trabajador se encuentra expuesto a un nivel crítico de exigencias laborales, abarcando excesiva carga mental, responsabilidades abrumadoras o demandas emocionales severas.",
      evidence: "Los puntajes indican una percepción de sobrecarga sistemática que excede sustancialmente su capacidad de respuesta y recursos de afrontamiento disponibles.",
      consequence: "Riesgo inminente de agotamiento profesional (burnout), estrés agudo, alteraciones psicosomáticas y deterioro significativo en la calidad de vida laboral y personal.",
      recommendations: [
        {
          text: "Realizar una evaluación ergonómica y de cargas de trabajo para redistribuir tareas críticas inmediatamente.",
          priority: "ALTA",
          timeframe: "30 días",
          responsible: "Talento Humano / Jefatura",
          impact: "Alto",
          normative: "Resolución 2646 de 2008 / Resolución 2764 de 2022"
        },
        {
          text: "Implementar pausas cognitivas mandatorias y asegurar la desconexión laboral estricta fuera del horario contractual.",
          priority: "MEDIA",
          timeframe: "Inmediato",
          responsible: "Líder Directo",
          impact: "Medio",
          normative: "Ley 2191 de 2022 (Desconexión Laboral)"
        }
      ]
    },
    ALTO: {
      interpretation: "Existe una exposición significativa a exigencias de diversa índole (cuantitativas, mentales o emocionales) que requieren un esfuerzo adaptativo superior al promedio.",
      evidence: "El volumen y la naturaleza de las tareas asignadas se perciben como un desafío constante que drena la energía del trabajador de forma prolongada.",
      consequence: "Probabilidad moderada-alta de fatiga crónica, desmotivación, incremento en los errores operativos y posibles síntomas iniciales de estrés laboral crónico.",
      recommendations: [
        {
          text: "Revisar los perfiles de cargo frente a las funciones reales ejecutadas para alinear expectativas y carga operativa.",
          priority: "MEDIA",
          timeframe: "90 días",
          responsible: "Desarrollo Organizacional",
          impact: "Medio",
          normative: "Resolución 2646 de 2008"
        }
      ]
    }
  }
};
