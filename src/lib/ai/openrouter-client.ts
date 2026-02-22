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
 * Uses Claude or GPT-4 via OpenRouter
 */
export async function generateRecommendations(
  scoreData: ScoreData
): Promise<string> {
  const prompt = `You are an expert occupational health psychologist specializing in Colombian psychosocial risk assessment (Batería para Evaluación de Factores de Riesgo Psicosocial).

A worker has been assessed with the following results:
- Overall Risk Category: ${scoreData.overallRiskCategory}
- Job Title: ${scoreData.workerProfile?.jobTitle || 'Not specified'}
- Job Level: ${scoreData.workerProfile?.jobLevel || 'Not specified'}
- Years in Position: ${scoreData.workerProfile?.yearsInPosition || 'Not specified'}

Based on these results, provide:
1. RECOMMENDATIONS: 3-4 specific, actionable recommendations for workplace improvements
2. NEXT STEPS: 2-3 immediate next steps for the worker and organization

Format your response in Spanish with clear sections. Be professional and evidence-based.`;

  const response = await callOpenRouter({
    model: 'meta-llama/llama-2-70b-chat', // Default model, can be changed
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
 * Generate general interpretation of psychosocial assessment results
 */
export async function generateInterpretation(
  scoreData: ScoreData
): Promise<string> {
  const prompt = `You are an expert occupational health psychologist. Provide a brief (200-250 words) professional interpretation of the following psychosocial assessment results in Spanish:

Overall Risk Category: ${scoreData.overallRiskCategory}

Explain what this risk category means for the worker and organization, and provide context about priority areas for intervention.`;

  const response = await callOpenRouter({
    model: 'meta-llama/llama-2-70b-chat',
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
