/**
 * Rasteriza una plantilla Typst a un PNG por página, para revisar el diseño a
 * ojo sin depender de un visor de PDF externo.
 *
 *   node scripts/preview-report.mjs individual.typ typst/fixtures/individual-a.json /tmp/prev
 *
 * Typst exporta el documento como un único SVG con todas las páginas apiladas;
 * aquí se recorta en franjas de igual alto. sharp resuelve los <use> de glifos
 * contra los <path> del bloque defs, así que el texto sí aparece.
 */
import { NodeCompiler } from "@myriaddreamin/typst-ts-node-compiler";
import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";

const [template, fixture, outDir = "preview", scaleArg] = process.argv.slice(2);
if (!template || !fixture) {
    console.error("uso: node scripts/preview-report.mjs <plantilla.typ> <fixture.json> [dir] [escala]");
    process.exit(2);
}
const density = Number(scaleArg ?? 100);

const root = path.join(process.cwd(), "typst");
const compiler = NodeCompiler.create({
    workspace: root,
    fontArgs: [{ fontPaths: [path.join(root, "fonts")] }],
});

const args = {
    mainFilePath: path.join(root, template),
    inputs: { data: fs.readFileSync(fixture, "utf8") },
};

const result = compiler.compile(args);
if (result.hasError()) {
    const err = result.takeError();
    for (const d of compiler.fetchDiagnostics(err)) console.error(`  ${d.message}`);
    process.exit(1);
}
const pages = result.result?.numOfPages ?? 1;

fs.mkdirSync(outDir, { recursive: true });
const svgPath = path.join(outDir, "_doc.svg");
fs.writeFileSync(svgPath, compiler.svg(args));

const full = await sharp(svgPath, { density }).png().toBuffer();
const { width, height } = await sharp(full).metadata();
const pageHeight = Math.floor(height / pages);

for (let i = 0; i < pages; i++) {
    // La última franja se lleva el remanente de la división entera.
    const top = i * pageHeight;
    const h = i === pages - 1 ? height - top : pageHeight;
    await sharp(full)
        .extract({ left: 0, top, width, height: h })
        .toFile(path.join(outDir, `pagina-${String(i + 1).padStart(2, "0")}.png`));
}

fs.unlinkSync(svgPath);
console.log(`${outDir} — ${pages} páginas a ${width}x${pageHeight}px`);
