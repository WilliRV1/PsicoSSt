// Convierte un .dc.html en HTML plano para mirarlo en el navegador.
// Sirve para cazar recortes y desbordes antes de publicar; no sustituye al
// lienzo, solo rinde el mismo marcado sin el runtime del editor.
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = dirname(fileURLToPath(import.meta.url));
const IN = join(DIR, 'artboards');
const OUT = join(DIR, '.preview');
mkdirSync(OUT, { recursive: true });

const files = process.argv.slice(2).length
  ? process.argv.slice(2).map((n) => `${n}.dc.html`)
  : readdirSync(IN).filter((f) => f.endsWith('.dc.html'));

for (const f of files) {
  const src = readFileSync(join(IN, f), 'utf8');
  const css = src.match(/<helmet>\s*<style>([\s\S]*?)<\/style>\s*<\/helmet>/)?.[1] ?? '';
  const body = src.match(/<\/helmet>([\s\S]*?)<\/x-dc>/)?.[1] ?? '';
  writeFileSync(join(OUT, f.replace('.dc.html', '.html')),
    `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body>${body}</body></html>`);
}
console.log(files.length + ' previsualizaciones en ' + OUT);
