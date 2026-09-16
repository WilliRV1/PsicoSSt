import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Mensaje legible de un valor atrapado en un `catch`.
 *
 * TypeScript tipa lo que cae en un `catch` como `unknown` — con razón, en JS
 * se puede lanzar cualquier cosa, no sólo un `Error`. Esta función es el único
 * lugar donde se asume que "probablemente es un Error" y se degrada con
 * gracia cuando no lo es, en vez de repetir `error instanceof Error ? ... :
 * String(error)` en cada bloque catch del proyecto.
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return String(error);
}
