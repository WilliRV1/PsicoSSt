import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Cliente de Prisma generado por `prisma generate` — nunca se escribe a
    // mano y ya está fuera de git (ver .gitignore). Lintearlo no aporta nada
    // y cualquier "arreglo" se pierde en la siguiente generación; sin este
    // ignore representaba el 75% de los problemas reportados por ESLint.
    "src/generated/**",
  ]),
]);

export default eslintConfig;
