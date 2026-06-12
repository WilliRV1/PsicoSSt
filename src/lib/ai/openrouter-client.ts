/**
 * OpenRouter AI Client for PsicoSST
 * Provides methods to generate psychosocial recommendations and interpretations
 */

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
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

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
      'HTTP-Referer': 'https://psicosst.app',
      'X-Title': 'PsicoSST',
    },
    body: JSON.stringify({
      ...request,
      max_tokens: request.max_tokens || 1500,
      temperature: request.temperature || 0.7,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      `OpenRouter API error: ${error.error?.message || response.statusText}`
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
  const dimensionDetails =
    scoreData.dimensionScores && typeof scoreData.dimensionScores === 'object'
      ? Object.entries(scoreData.dimensionScores)
          .map(([key, val]: [string, any]) =>
            `- ${val?.dimensionName ?? key}: puntuación transformada ${val?.transformedScore ?? 'N/D'}, nivel de riesgo "${val?.riskCategory ?? 'N/D'}"`
          )
          .join('\n')
      : 'No disponible';

  const prompt = `Eres un psicólogo experto en salud ocupacional especializado en la evaluación de riesgo psicosocial laboral según la Batería para la Evaluación de Factores de Riesgo Psicosocial del Ministerio de Trabajo de Colombia.

Un trabajador ha sido evaluado con los siguientes resultados:

Nivel de riesgo global: ${scoreData.overallRiskCategory}
Cargo: ${scoreData.workerProfile?.jobTitle || 'No especificado'}
Nivel del cargo: ${scoreData.workerProfile?.jobLevel || 'No especificado'}
Años en el cargo: ${scoreData.workerProfile?.yearsInPosition ?? 'No especificado'}
Puntajes totales: ${JSON.stringify(scoreData.totalScores)}

Dimensiones evaluadas:
${dimensionDetails}

Con base en estos resultados, redacta en español:

1. RECOMENDACIONES: 3 a 4 recomendaciones específicas y accionables dirigidas a la organización y al trabajador para reducir los factores de riesgo más elevados.
2. PRÓXIMOS PASOS: 2 a 3 acciones inmediatas prioritarias para el trabajador y la empresa.

Sé profesional, preciso y fundamentado en evidencia. Adapta las recomendaciones al cargo y nivel de riesgo de las dimensiones con mayor puntuación.`;

  const response = await callOpenRouter({
    model: 'anthropic/claude-3-5-haiku',
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

  const prompt = `Eres un psicólogo experto en salud ocupacional especializado en la evaluación de riesgo psicosocial laboral según la Batería para la Evaluación de Factores de Riesgo Psicosocial del Ministerio de Trabajo de Colombia.

Redacta la sección de "Interpretación Profesional" de un informe clínico para el siguiente trabajador evaluado. Este texto irá en la sección que firma el psicólogo, por lo que debe estar escrito en primera persona profesional del psicólogo y ser editable por él.

Datos de la evaluación:
Nivel de riesgo global: ${scoreData.overallRiskCategory}
Cargo: ${scoreData.workerProfile?.jobTitle || 'No especificado'}
Nivel del cargo: ${scoreData.workerProfile?.jobLevel || 'No especificado'}
Años en el cargo: ${scoreData.workerProfile?.yearsInPosition ?? 'No especificado'}
Puntajes totales: ${JSON.stringify(scoreData.totalScores)}

Dimensiones evaluadas:
${dimensionDetails}

Instrucciones para la redacción:
- Escribe entre 200 y 300 palabras en prosa profesional continua, sin viñetas, sin encabezados, solo párrafos.
- Explica qué significa el nivel de riesgo global para este trabajador en su contexto laboral.
- Menciona específicamente las dimensiones con mayor puntuación y su implicancia clínica.
- Describe las implicaciones clínicas considerando el cargo y los años de experiencia del trabajador.
- Señala las áreas prioritarias de intervención de manera fundamentada.
- El texto debe sonar como redactado por un psicólogo profesional, listo para ser incluido en un informe oficial.
- Responde ÚNICAMENTE con el texto de la interpretación, sin introducción, sin "Aquí está el análisis:", sin ningún prefacio.`;

  const response = await callOpenRouter({
    model: 'anthropic/claude-3-5-haiku',
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
    max_tokens: 700,
    temperature: 0.65,
  });

  return response;
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
    model: 'anthropic/claude-3-5-haiku',
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
