import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  output: "standalone",
  turbopack: {
    root: path.resolve(process.cwd()),
  },
  // The Typst compiler is a native addon and the report templates/fonts are
  // read from disk at request time. Next's tracer cannot see either, so both
  // are force-included or the SVE route 500s once deployed.
  serverExternalPackages: ["@myriaddreamin/typst-ts-node-compiler"],
  outputFileTracingIncludes: {
    // Toda ruta que compile un informe necesita los mismos tres bultos. Los
    // fixtures quedan fuera a propósito: sólo sirven para la revisión local.
    //
    // Las claves apuntan a las ocho rutas que de verdad compilan un PDF, no a
    // sus grupos (`/api/organizations/**`…). Con los grupos, las 33 funciones
    // de esas tres familias cargaban el compilador nativo —53 MB entre binario
    // y fuentes— cuando sólo ocho lo usan: ~1,75 GB por despliegue en vez de
    // ~420 MB, que es lo que agotó la cuota de Function Storage.
    //
    // Se usa `*` y no `[orgId]` en el segmento dinámico a propósito: los
    // corchetes son sintaxis de glob y no coincidirían literalmente.
    ...Object.fromEntries(
      [
        "/api/assessments/*/report/pdf",
        "/api/organizations/*/collective-report/pdf",
        "/api/organizations/*/intervention-plan/pdf",
        "/api/organizations/*/reports/diagnostic/pdf",
        "/api/organizations/*/reports/sociodemographic/pdf",
        "/api/organizations/*/sve/pdf",
        "/api/reports/*/sign",
        "/api/reports/bulk-export",
      ].map((route) => [
        route,
        [
          "./typst/*.typ",
          "./typst/lib/**",
          "./typst/fonts/**",
          "./node_modules/@myriaddreamin/typst-ts-node-compiler/**",
        ],
      ]),
    ),
  },
};

export default nextConfig;
