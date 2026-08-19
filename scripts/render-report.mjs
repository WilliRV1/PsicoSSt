/**
 * Renderiza una plantilla Typst contra un fixture JSON, sin base de datos.
 *
 * Es la herramienta con la que se itera el diseño de los informes: compilar
 * desde la app exige una organización con evaluaciones reales, lo que hace
 * imposible probar los casos límite (cero trabajadores, nombres larguísimos,
 * todas las dimensiones en riesgo muy alto).
 *
 *   node scripts/render-report.mjs sve.typ typst/fixtures/sve.json out.pdf
 *
 * Para revisar el resultado a ojo hace falta convertir a imagen:
 *   pdftoppm -png -r 110 out.pdf pagina
 */
import { NodeCompiler } from "@myriaddreamin/typst-ts-node-compiler";
import fs from "node:fs";
import path from "node:path";

const [template, fixture, out = "out.pdf"] = process.argv.slice(2);

if (!template || !fixture) {
    console.error("uso: node scripts/render-report.mjs <plantilla.typ> <fixture.json> [salida.pdf]");
    process.exit(2);
}

const root = path.join(process.cwd(), "typst");
const compiler = NodeCompiler.create({
    workspace: root,
    fontArgs: [{ fontPaths: [path.join(root, "fonts")] }],
});

const data = JSON.parse(fs.readFileSync(fixture, "utf8"));
const args = {
    mainFilePath: path.join(root, template),
    inputs: { data: JSON.stringify(data) },
};

const started = Date.now();
const result = compiler.compile(args);

if (result.hasError()) {
    const err = result.takeError();
    for (const d of compiler.fetchDiagnostics(err)) {
        const line = d.range?.start?.line;
        console.error(`  ${line != null ? `L${line + 1}: ` : ""}${d.message}`);
    }
    process.exit(1);
}

fs.writeFileSync(out, Buffer.from(compiler.pdf(args)));

const pages = result.result?.numOfPages;
console.log(
    `${out} — ${pages ?? "?"} páginas, ${(fs.statSync(out).size / 1024).toFixed(0)} KB, ${Date.now() - started} ms`
);
