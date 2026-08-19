import path from "node:path";
import { NodeCompiler } from "@myriaddreamin/typst-ts-node-compiler";

/**
 * Typst compilation for report PDFs.
 *
 * The compiler is expensive to construct (it loads and indexes the font files),
 * so it is created once per process and reused. It carries mutable shadow-file
 * state, though — the per-organization logo and signature are injected as
 * virtual files — so compilations MUST NOT interleave, or one tenant's logo
 * could end up in another tenant's document. Every compile is therefore
 * serialized through a promise chain and starts by clearing the shadow state.
 */

const TYPST_ROOT = path.join(process.cwd(), "typst");
const FONT_DIR = path.join(TYPST_ROOT, "fonts");
const ASSET_DIR = path.join(TYPST_ROOT, "assets");

let compiler: NodeCompiler | null = null;

function getCompiler(): NodeCompiler {
    if (!compiler) {
        compiler = NodeCompiler.create({
            workspace: TYPST_ROOT,
            fontArgs: [{ fontPaths: [FONT_DIR] }],
        });
    }
    return compiler;
}

let queue: Promise<unknown> = Promise.resolve();

function serialize<T>(fn: () => Promise<T>): Promise<T> {
    const run = queue.then(fn, fn);
    // Keep the chain alive regardless of how this job settled.
    queue = run.then(
        () => undefined,
        () => undefined
    );
    return run;
}

export interface TypstAssets {
    /** Rendered at `/assets/logo.png` inside the template. */
    logo?: Buffer | null;
    /** Rendered at `/assets/signature.png` inside the template. */
    signature?: Buffer | null;
}

export class TypstCompileError extends Error {
    constructor(
        message: string,
        readonly diagnostics: { message: string; line?: number }[]
    ) {
        super(message);
        this.name = "TypstCompileError";
    }
}

/**
 * Compiles `<typst>/{template}` to a PDF.
 *
 * @param template  File name inside the typst directory, e.g. "sve.typ".
 * @param data      Serialized to JSON and exposed to the template as `sys.inputs.data`.
 * @param assets    Optional images injected as virtual files.
 */
export function compileTypstPdf(
    template: string,
    data: unknown,
    assets: TypstAssets = {}
): Promise<Buffer> {
    return serialize(async () => {
        const c = getCompiler();
        c.resetShadow();

        if (assets.logo) c.mapShadow(path.join(ASSET_DIR, "logo.png"), assets.logo);
        if (assets.signature) c.mapShadow(path.join(ASSET_DIR, "signature.png"), assets.signature);

        const args = {
            mainFilePath: path.join(TYPST_ROOT, template),
            inputs: { data: JSON.stringify(data) },
        };

        const result = c.compile(args);
        if (result.hasError()) {
            const err = result.takeError();
            const diags = (err ? c.fetchDiagnostics(err) : []) as {
                message?: string;
                range?: { start?: { line?: number } };
            }[];
            const parsed = diags.map(d => ({
                message: d.message ?? "error desconocido",
                line: d.range?.start?.line != null ? d.range.start.line + 1 : undefined,
            }));
            const summary = parsed
                .slice(0, 3)
                .map(d => (d.line ? `L${d.line}: ${d.message}` : d.message))
                .join(" · ");
            throw new TypstCompileError(`Typst falló al compilar ${template}: ${summary}`, parsed);
        }

        const pdf = c.pdf(args);
        c.resetShadow();
        return Buffer.from(pdf);
    });
}
