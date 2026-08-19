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
    "/api/organizations/**": [
      "./typst/**/*.typ",
      "./typst/fonts/**",
      "./node_modules/@myriaddreamin/typst-ts-node-compiler/**",
    ],
  },
};

export default nextConfig;
