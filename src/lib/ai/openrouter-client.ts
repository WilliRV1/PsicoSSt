/**
 * OpenRouter AI Client for PsicoSST
 * Provides methods to generate psychosocial recommendations and interpretations
 */
import { MODEL_ANALYSIS, MODEL_DRAFTING, OPENROUTER_HEADERS, OPENROUTER_URL } from "./models";

interface OpenRouterMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface OpenRouterRequest {
  model: string;
  messages: OpenRouterMessage[];
  max_tokens?: number;
  temperature?: number;
}

interface OpenRouterResponse {
  id: string;
  model: string;
  choices: Array<{
    message: {
      content: string;
    };
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
const OPENROUTER_API_URL = OPENROUTER_URL;

/**
 * Call OpenRouter API
 */
async function callOpenRouter(request: OpenRouterRequest): Promise<string> {
  if (!OPENROUTER_API_KEY) {
    throw new Error(
      'OPENROUTER_API_KEY not configured. Set it in .env.local'
    );
  }

  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      ...OPENROUTER_HEADERS,
    },
    body: JSON.stringify({
      ...request,
      max_tokens: request.max_tokens || 1500,
      temperature: request.temperature || 0.7,
    }),
  });

  if (!response.ok) {
    // El cuerpo de error no siempre es JSON: un 502 del borde llega como HTML y
    // `response.json()` lanzaría, sustituyendo el fallo real por uno de parseo.
    const body = await response.text();
    let detail = response.statusText;
    try {
      detail = JSON.parse(body)?.error?.message ?? detail;
    } catch {
      detail = body.slice(0, 200) || detail;
    }
    throw new Error(
      `OpenRouter respondió ${response.status} para el modelo ${request.model}: ${detail}`
    );
  }

  const data = (await response.json()) as OpenRouterResponse;
  return data.choices[0].message.content;
}

interface ScoreData {
  overallRiskCategory: string;
  totalScores?: any;
  dimensionScores?: any;
  workerProfile?: {
    jobTitle?: string;
    jobLevel?: string;
    yearsInPosition?: number;
  };
}

/**
 * Generate psychosocial recommendations based on assessment scores
 */
export async function generateRecommendations(
  scoreData: ScoreData
): Promise<string> {
  const highRiskDimensions =
    scoreData.dimensionScores && typeof scoreData.dimensionScores === 'object'
      ? Object.entries(scoreData.dimensionScores)
          .filter(([, val]: [string, any]) =>
            ['ALTO', 'MUY_ALTO'].includes(val?.riskCategory ?? '')
          )
          .map(([key, val]: [string, any]) =>
            `- ${val?.dimensionName ?? key}: ${val?.transformedScore?.toFixed(1) ?? 'N/D'}% — Riesgo ${val?.riskCategory}`
          )
          .join('\n')
      : 'Sin dimensiones en riesgo alto';

  const allDimensions =
    scoreData.dimensionScores && typeof scoreData.dimensionScores === 'object'
      ? Object.entries(scoreData.dimensionScores)
          .map(([key, val]: [string, any]) =>
            `- ${val?.dimensionName ?? key}: ${val?.transformedScore?.toFixed(1) ?? 'N/D'}% (${val?.riskCategory ?? 'N/D'})`
          )
          .join('\n')
      : 'No disponible';

  const prompt = `Eres un psicólogo organizacional senior con 15 años de experiencia aplicando la Batería para la Evaluación de Factores de Riesgo Psicosocial del Ministerio de Trabajo de Colombia (Resolución 2764 de 2022).

Acabas de evaluar a este trabajador y debes redactar el plan de intervención individualizado. Este documento será leído por el trabajador, su jefe directo y el área de RR.HH.

PERFIL DEL TRABAJADOR:
- Cargo: ${scoreData.workerProfile?.jobTitle || 'No especificado'}
- Nivel: ${scoreData.workerProfile?.jobLevel || 'No especificado'}
- Antigüedad en el cargo: ${scoreData.workerProfile?.yearsInPosition != null ? scoreData.workerProfile.yearsInPosition + ' años' : 'No especificada'}
- Riesgo global: ${scoreData.overallRiskCategory}

DIMENSIONES EN RIESGO ELEVADO (ALTO o MUY ALTO):
${highRiskDimensions}

TODAS LAS DIMENSIONES EVALUADAS:
${allDimensions}

INSTRUCCIONES DE REDACCIÓN:
Redacta el plan de intervención con estas secciones exactas. Sé específico — menciona las dimensiones por nombre. No uses frases genéricas. Cada acción debe ser concreta, con un verbo de acción y un plazo.

**ACCIONES INMEDIATAS (0-30 días)**
Lista de 3-4 acciones que el trabajador y/o la organización deben ejecutar este mes. Fundamenta cada una en las dimensiones con mayor riesgo.

**INTERVENCIONES A MEDIANO PLAZO (1-3 meses)**
Lista de 2-3 intervenciones estructuradas (puede incluir procesos de acompañamiento, ajustes de rol, formación específica).

**RECOMENDACIONES PARA EL JEFE DIRECTO**
2-3 ajustes concretos que el líder del trabajador puede implementar en la gestión del día a día para reducir los factores de riesgo identificados.

**CRITERIOS DE SEGUIMIENTO**
Cuándo y cómo reevaluar. Señales de alerta a monitorear. Criterio de derivación (cuándo escalar a intervención clínica individual).

Responde ÚNICAMENTE con el contenido de las secciones, sin introducción ni texto previo.`;

  return callOpenRouter({
    model: MODEL_ANALYSIS,
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 1800,
    temperature: 0.55,
  });
}

/**
 * Generate clinical analysis (Interpretación Profesional) for the psychologist's signature section
 */
export async function generateClinicalAnalysis(
  scoreData: ScoreData
): Promise<string> {
  const dimensionDetails =
    scoreData.dimensionScores && typeof scoreData.dimensionScores === 'object'
      ? Object.entries(scoreData.dimensionScores)
          .map(([key, val]: [string, any]) =>
            `- ${val?.dimensionName ?? key}: puntuación transformada ${val?.transformedScore ?? 'N/D'}, nivel de riesgo "${val?.riskCategory ?? 'N/D'}"`
          )
          .join('\n')
      : 'No disponible';

  const criticalDimensions =
    scoreData.dimensionScores && typeof scoreData.dimensionScores === 'object'
      ? Object.entries(scoreData.dimensionScores)
          .filter(([, val]: [string, any]) =>
            ['ALTO', 'MUY_ALTO'].includes(val?.riskCategory ?? '')
          )
          .map(([key, val]: [string, any]) =>
            `${val?.dimensionName ?? key} (${val?.transformedScore?.toFixed(1) ?? 'N/D'}% — ${val?.riskCategory})`
          )
          .join(', ')
      : 'sin dimensiones críticas identificadas';

  const prompt = `Eres un psicólogo especialista en salud ocupacional con licencia vigente en Colombia. Estás redactando la sección de "Interpretación Profesional" de un informe oficial de riesgo psicosocial que tú mismo firmarás. Este texto debe reflejar tu criterio clínico experto.

DATOS DE LA EVALUACIÓN:
- Riesgo global: ${scoreData.overallRiskCategory}
- Cargo: ${scoreData.workerProfile?.jobTitle || 'No especificado'} (${scoreData.workerProfile?.jobLevel || 'nivel no especificado'})
- Antigüedad en el cargo: ${scoreData.workerProfile?.yearsInPosition != null ? scoreData.workerProfile.yearsInPosition + ' años' : 'no especificada'}
- Dimensiones críticas (Alto/Muy Alto): ${criticalDimensions}
- Todos los resultados: ${dimensionDetails}

INSTRUCCIONES:
Redacta entre 250 y 350 palabras en prosa profesional continua (sin viñetas, sin títulos intermedios). El texto debe:
1. Abrir con una valoración clínica del nivel de riesgo global en el contexto específico del cargo y la antigüedad del trabajador
2. Analizar las dimensiones más elevadas: qué significan en términos de respuesta de estrés, salud mental y desempeño — sin repetir el nombre técnico sin interpretarlo
3. Explicar la relación entre los factores de riesgo identificados y los posibles efectos en la salud del trabajador a mediano plazo si no se interviene
4. Concluir señalando la urgencia clínica y los focos prioritarios de intervención de forma fundamentada
Escribe como el psicólogo que tú eres — con criterio clínico, con datos, sin frases vacías. Responde ÚNICAMENTE con el texto de la interpretación.`;

  return callOpenRouter({
    model: MODEL_ANALYSIS,
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 900,
    temperature: 0.6,
  });
}

/**
 * Generate general interpretation of psychosocial assessment results
 */
export async function generateInterpretation(
  scoreData: ScoreData
): Promise<string> {
  const prompt = `Eres un psicólogo experto en salud ocupacional. Redacta una interpretación profesional breve (200-250 palabras) en español de los siguientes resultados de evaluación psicosocial:

Nivel de riesgo global: ${scoreData.overallRiskCategory}

Explica qué significa este nivel de riesgo para el trabajador y la organización, y proporciona contexto sobre las áreas prioritarias de intervención.`;

  const response = await callOpenRouter({
    model: MODEL_DRAFTING,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  return response;
}

/**
 * List available models on OpenRouter
 */
export async function listAvailableModels(): Promise<Array<{ id: string; name: string }>> {
  if (!OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY not configured');
  }

  try {
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch models');
    }

    const data = await response.json();
    return data.data.map((model: any) => ({
      id: model.id,
      name: model.name || model.id,
    }));
  } catch (error) {
    console.error('Error fetching OpenRouter models:', error);
    return [];
  }
}

export interface OrgDiagnosticInput {
  orgName: string;
  economicSector?: string | null;
  city?: string | null;
  totalWorkers: number;
  diagnostic: {
    totalAssessments: number;
    intralaboralDistribution: Record<string, number>;
    extralaboralDistribution: Record<string, number>;
    stressDistribution: Record<string, number>;
    segmentation: {
      byArea: Record<string, { count: number; riskDistribution: Record<string, number> }>;
      byJobTitle: Record<string, { count: number; riskDistribution: Record<string, number> }>;
    };
    correlation: Record<string, Record<string, number>>;
  };
  sociodemographic: {
    genderDistribution: Record<string, number>;
    ageDistribution: Record<string, number>;
    jobLevelDistribution: Record<string, number>;
    tenureDistribution: Record<string, number>;
  };
}

/**
 * Generate a comprehensive organizational psychosocial risk diagnostic report.
 * Usa el modelo de análisis (ver lib/ai/models.ts), no el de redacción.
 */
export async function generateOrganizationalDiagnosis(
  data: OrgDiagnosticInput
): Promise<string> {
  const fmtDist = (dist: Record<string, number>) =>
    Object.entries(dist)
      .filter(([, v]) => v > 0)
      .map(([k, v]) => `${k.replace(/_/g, ' ')}: ${v}%`)
      .join(' | ');

  const highRiskIntra = (data.diagnostic.intralaboralDistribution['ALTO'] ?? 0)
    + (data.diagnostic.intralaboralDistribution['MUY_ALTO'] ?? 0);
  const highRiskExtra = (data.diagnostic.extralaboralDistribution['ALTO'] ?? 0)
    + (data.diagnostic.extralaboralDistribution['MUY_ALTO'] ?? 0);
  const highRiskStress = (data.diagnostic.stressDistribution['ALTO'] ?? 0)
    + (data.diagnostic.stressDistribution['MUY_ALTO'] ?? 0);

  const areaAnalysis = Object.entries(data.diagnostic.segmentation.byArea)
    .map(([area, d]) => {
      const critico = (d.riskDistribution['ALTO'] ?? 0) + (d.riskDistribution['MUY_ALTO'] ?? 0);
      return `• ${area} (n=${d.count}): ${fmtDist(d.riskDistribution)} → ${critico}% riesgo crítico`;
    })
    .join('\n') || '  Sin datos suficientes por área (grupos < 10 trabajadores)';

  const cargoAnalysis = Object.entries(data.diagnostic.segmentation.byJobTitle)
    .map(([cargo, d]) => {
      const critico = (d.riskDistribution['ALTO'] ?? 0) + (d.riskDistribution['MUY_ALTO'] ?? 0);
      return `• ${cargo} (n=${d.count}): ${fmtDist(d.riskDistribution)} → ${critico}% riesgo crítico`;
    })
    .join('\n') || '  Sin datos suficientes por cargo (grupos < 10 trabajadores)';

  const evaluationCoverage = data.totalWorkers > 0
    ? Math.round((data.diagnostic.totalAssessments / data.totalWorkers) * 100)
    : 0;

  const prompt = `Eres el psicólogo organizacional senior responsable del proceso de evaluación de riesgo psicosocial en ${data.orgName}. Acabas de consolidar todos los resultados de la evaluación. Tu tarea ahora es redactar el INFORME DE DIAGNÓSTICO ORGANIZACIONAL que será presentado al comité directivo, al área de Talento Humano y al responsable del SG-SST.

Este informe es el documento de mayor importancia estratégica en el proceso. Debe ser suficientemente técnico para el psicólogo, y suficientemente claro y accionable para que un gerente sin formación en psicología pueda tomar decisiones con él.

════════════════════════════════════════
EMPRESA: ${data.orgName}
Sector: ${data.economicSector || 'No especificado'} | Ciudad: ${data.city || 'No especificada'}
Total trabajadores registrados: ${data.totalWorkers}
Evaluaciones firmadas (cobertura): ${data.diagnostic.totalAssessments} (${evaluationCoverage}% de la población)
════════════════════════════════════════

RESULTADOS POR COMPONENTE:

Riesgo Intralaboral — ${fmtDist(data.diagnostic.intralaboralDistribution)} → ${highRiskIntra}% en riesgo crítico
Riesgo Extralaboral — ${fmtDist(data.diagnostic.extralaboralDistribution)} → ${highRiskExtra}% en riesgo crítico
Nivel de Estrés — ${fmtDist(data.diagnostic.stressDistribution)} → ${highRiskStress}% en riesgo crítico

SEGMENTACIÓN POR ÁREA/DEPARTAMENTO:
${areaAnalysis}

SEGMENTACIÓN POR CARGO:
${cargoAnalysis}

PERFIL SOCIODEMOGRÁFICO DE LA POBLACIÓN:
• Género: ${fmtDist(data.sociodemographic.genderDistribution) || 'Sin datos'}
• Edad: ${fmtDist(data.sociodemographic.ageDistribution) || 'Sin datos'}
• Nivel de cargo: ${fmtDist(data.sociodemographic.jobLevelDistribution) || 'Sin datos'}
• Antigüedad: ${fmtDist(data.sociodemographic.tenureDistribution) || 'Sin datos'}

════════════════════════════════════════

Redacta el informe completo con las secciones que se indican a continuación. Usa markdown para estructurar. Sé directo, específico y fundamentado en los datos. Prohibido usar frases vacías como "es importante", "se recomienda considerar" o "podría ser beneficioso". Cada afirmación lleva un dato que la respalde. Cada recomendación lleva un verbo de acción, un plazo y un responsable.

---

## 🚨 ALERTA EJECUTIVA

(Máximo 4 bullets. Lo más crítico que el CEO/Gerente debe saber hoy. Incluye el número exacto de trabajadores afectados cuando sea posible.)

---

## 1. DIAGNÓSTICO POR COMPONENTE

### Riesgo Intralaboral
Interpreta el resultado de manera profunda: qué tipo de factores organizacionales generan este perfil (gestión del trabajo, liderazgo, relaciones, demandas), qué implica para la salud de los trabajadores y para la productividad. Menciona si el porcentaje de riesgo crítico es alto, medio o bajo comparado con lo esperado según la normativa.

### Riesgo Extralaboral
Analiza qué revelan los factores extralaborales sobre la población: condiciones de vida, desplazamiento, situación familiar. Señala si amplifica o atenúa el riesgo intralaboral.

### Nivel de Estrés
Interpreta el nivel de estrés en relación con los dos componentes anteriores. Si hay trabajadores con estrés MUY ALTO + intralaboral ALTO, esto es una señal de alarma clínica — señálalo explícitamente.

---

## 2. GRUPOS DE MAYOR VULNERABILIDAD

Identifica los 2-3 grupos más críticos (por área y/o cargo) y explica por qué son prioritarios. Incluye hipótesis causales plausibles basadas en los datos (no especulación vacía).

---

## 3. PATRONES Y CORRELACIONES CRÍTICAS

¿Qué combinaciones de riesgo son preocupantes? ¿Qué perfil sociodemográfico coincide con mayor riesgo? ¿Hay señales de que el problema es sistémico (toda la empresa) o focalizado (áreas específicas)?

---

## 4. PLAN DE INTERVENCIÓN PHVA

### Acciones Inmediatas — Planear y ejecutar en 0-30 días
(Mínimo 3 acciones. Cada una: Qué | Quién | Cuándo | Cómo se mide)

### Acciones a Corto Plazo — 1 a 3 meses
(Mínimo 3 acciones. Intervenciones más estructuradas.)

### Intervenciones Estructurales — 3 a 12 meses
(Mínimo 2 acciones. Cambios de fondo en cultura, procesos o estructura.)

---

## 5. INDICADORES DE SEGUIMIENTO

Tabla con 5-6 KPIs específicos y medibles:

| Indicador | Valor Actual | Meta 6 meses | Meta 12 meses | Cómo medirlo |
|-----------|-------------|--------------|---------------|--------------|

---

## 6. ESTADO DE CUMPLIMIENTO — RESOLUCIÓN 2764/2022

¿Qué ha cumplido la empresa? ¿Qué le falta? ¿Cuál es el riesgo legal concreto si no actúa? ¿Cuáles son los plazos normativos?

---

*Diagnóstico generado con base en la Batería de Riesgo Psicosocial — Resolución 2764 de 2022*`;

  return callOpenRouter({
    model: MODEL_ANALYSIS,
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 4000,
    temperature: 0.5,
  });
}

/**
 * Generate an optimized prompt for AI presentation tools (Gamma AI, Canva AI)
 * based on the organizational diagnostic and sociodemographic data.
 */
export async function generatePresentationPrompt(data: {
  orgName: string;
  economicSector?: string | null;
  city?: string | null;
  platform: "gamma" | "canva";
  diagnostic: {
    totalAssessments: number;
    riskDistribution: Record<string, number>;
    intralaboralDistribution: Record<string, number>;
    extralaboralDistribution: Record<string, number>;
    stressDistribution: Record<string, number>;
    segmentation: {
      byArea: Record<string, { count: number; riskDistribution: Record<string, number> }>;
      byJobTitle: Record<string, { count: number; riskDistribution: Record<string, number> }>;
    };
  };
  sociodemographic: {
    totalWorkers: number;
    genderDistribution: Record<string, number>;
    ageDistribution: Record<string, number>;
    educationDistribution: Record<string, number>;
    jobLevelDistribution: Record<string, number>;
    tenureDistribution: Record<string, number>;
  };
}): Promise<string> {
  const fmt = (dist: Record<string, number>) =>
    Object.entries(dist)
      .filter(([, v]) => v > 0)
      .map(([k, v]) => `${k}: ${v}%`)
      .join(", ");

  const segArea = Object.entries(data.diagnostic.segmentation.byArea)
    .map(([area, d]) => `• ${area} (n=${d.count}): ${fmt(d.riskDistribution)}`)
    .join("\n") || "Sin datos por área";

  const segCargo = Object.entries(data.diagnostic.segmentation.byJobTitle)
    .map(([cargo, d]) => `• ${cargo} (n=${d.count}): ${fmt(d.riskDistribution)}`)
    .join("\n") || "Sin datos por cargo";

  const platformHint =
    data.platform === "gamma"
      ? "Gamma AI (gamma.app): el prompt debe ser un texto narrativo con secciones claramente delimitadas por títulos en markdown (#, ##) que Gamma usará para estructurar las diapositivas automáticamente. Incluye instrucciones de diseño en corchetes [style: ...] cuando sea relevante."
      : "Canva AI (Magic Design/Docs to Deck): el prompt debe ser un texto con bullet points jerárquicos por diapositiva, indicando el tipo de visualización deseada (gráfica de barras, pastel, tabla) y el estilo visual requerido.";

  const metaPrompt = `Eres un experto en prompt engineering y comunicación visual corporativa, especializado en presentaciones de salud ocupacional para empresas colombianas.

Tu tarea es crear el MEJOR PROMPT POSIBLE que un psicólogo ocupacional pueda copiar y pegar directamente en ${data.platform === "gamma" ? "Gamma AI (gamma.app)" : "Canva AI"} para generar automáticamente una presentación ejecutiva y profesional del Diagnóstico de Factores de Riesgo Psicosocial según la Resolución 2764 de 2022.

Plataforma destino: ${platformHint}

El prompt que generes debe:
1. Incluir literalmente TODOS los datos reales a continuación (porcentajes exactos, segmentaciones)
2. Definir entre 14 y 18 diapositivas con flujo narrativo coherente
3. Solicitar visualizaciones específicas por diapositiva (tipo de gráfica, colores)
4. Usar un tono ejecutivo-profesional en español, apto para presentar a gerentes de empresa
5. Mencionar el marco normativo colombiano (Resolución 2764/2022, Ley 1090/2006)
6. Pedir paleta de colores institucional azul corporativo con acento en verde (#2563EB, #059669)
7. Que la presentación sea autosuficiente (el espectador entiende todo sin el psicólogo presente)

═══════════════════════════════════════════
DATOS REALES DE LA EMPRESA
═══════════════════════════════════════════

EMPRESA: ${data.orgName}
SECTOR ECONÓMICO: ${data.economicSector || "No especificado"}
CIUDAD: ${data.city || "No especificada"}

── DIAGNÓSTICO DE RIESGO PSICOSOCIAL ──
Total evaluaciones firmadas: ${data.diagnostic.totalAssessments}

Riesgo Intralaboral:
${fmt(data.diagnostic.intralaboralDistribution) || "Sin datos"}

Riesgo Extralaboral:
${fmt(data.diagnostic.extralaboralDistribution) || "Sin datos"}

Nivel de Estrés:
${fmt(data.diagnostic.stressDistribution) || "Sin datos"}

Segmentación por Área/Departamento:
${segArea}

Segmentación por Cargo:
${segCargo}

── PERFIL SOCIODEMOGRÁFICO ──
Total trabajadores: ${data.sociodemographic.totalWorkers}

Género: ${fmt(data.sociodemographic.genderDistribution) || "Sin datos"}
Edad: ${fmt(data.sociodemographic.ageDistribution) || "Sin datos"}
Nivel educativo: ${fmt(data.sociodemographic.educationDistribution) || "Sin datos"}
Nivel de cargo: ${fmt(data.sociodemographic.jobLevelDistribution) || "Sin datos"}
Antigüedad en la empresa: ${fmt(data.sociodemographic.tenureDistribution) || "Sin datos"}

═══════════════════════════════════════════

Genera ÚNICAMENTE el prompt final optimizado para copiar y pegar en ${data.platform === "gamma" ? "Gamma AI" : "Canva AI"}. No incluyas ningún texto introductorio, explicación, ni comentario tuyo. El output debe comenzar directamente con el prompt.`;

  return callOpenRouter({
    model: MODEL_DRAFTING,
    messages: [{ role: "user", content: metaPrompt }],
    max_tokens: 3000,
    temperature: 0.6,
  });
}

/**
 * Generate Organizational Recommendations based on the Technical Guide
 */
export async function generateOrganizationalRecommendations(
  orgData: any
): Promise<string> {
  const prompt = `Eres un psicólogo experto en salud ocupacional en Colombia.
Basado estrictamente en los protocolos de intervención de la Resolución 2764 de Colombia, 
selecciona y adapta la acción correspondiente del Protocolo de Acciones Generales (Acciones 3.1 a 3.34) para el plan de mejoramiento.

Datos de la empresa:
- Porcentaje de población en riesgo (Alto/Muy Alto): ${orgData.executiveSummary?.criticalPercent || 0}%
- Total de trabajadores evaluados: ${orgData.executiveSummary?.totalWorkers || 0}
- Riesgo Predominante: ${orgData.executiveSummary?.predominantRisk || 'Ninguno'}

Redacta de 3 a 5 recomendaciones organizacionales específicas basadas en los resultados, orientadas al ciclo PHVA del Sistema de Gestión de Seguridad y Salud en el Trabajo (SG-SST).
El texto generado irá directo al reporte, así que usa un tono profesional de consultor experto y abstente de frases introductorias (ej. "Aquí están las recomendaciones").`;

  const response = await callOpenRouter({
    model: MODEL_DRAFTING,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
    max_tokens: 1500,
    temperature: 0.5,
  });

  return response;
}
