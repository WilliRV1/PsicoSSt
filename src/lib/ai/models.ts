/**
 * Identificadores de modelo de OpenRouter, en un solo lugar.
 *
 * Estaban escritos como literales repartidos por ocho llamadas distintas, con
 * dos grafías del mismo modelo —"claude-3-5-haiku" y "claude-3.5-haiku"— y
 * ninguna de las dos existía ya en el catálogo. OpenRouter responde a un
 * identificador desconocido con un 400, de modo que todas las funciones de IA
 * fallaban aunque la clave fuese válida. Centralizarlos hace que retirar un
 * modelo se arregle en una línea y no en ocho.
 *
 * Los valores por defecto son los económicos, para que probar la aplicación no
 * cueste. Se suben a un modelo mayor por variable de entorno, sin tocar código:
 *
 *   AI_MODEL_ANALYSIS=anthropic/claude-sonnet-5
 *   AI_MODEL_DRAFTING=anthropic/claude-haiku-4.5
 *
 * El catálogo vigente se consulta en https://openrouter.ai/api/v1/models
 * (endpoint público, no requiere clave).
 */

/**
 * Análisis clínico y diagnóstico organizacional: razona sobre los puntajes y
 * redacta interpretación. Es donde la calidad del modelo más se nota, así que
 * es la variable que conviene subir primero en producción.
 *
 * Por defecto: claude-3-haiku, 0,25 USD por millón de tokens de entrada.
 */
export const MODEL_ANALYSIS = process.env.AI_MODEL_ANALYSIS || "anthropic/claude-3-haiku";

/** Redacción breve y estructurada: resúmenes, recomendaciones, listas. */
export const MODEL_DRAFTING = process.env.AI_MODEL_DRAFTING || "anthropic/claude-3-haiku";

/** Cabeceras con las que OpenRouter atribuye el consumo a la aplicación. */
export const OPENROUTER_HEADERS = {
    "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "https://psicosst.app",
    "X-Title": "PsicoSST",
} as const;

export const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
