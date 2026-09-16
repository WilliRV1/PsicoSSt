// Mide la altura natural de cada artboard para detectar recortes.
// Rinde el mismo marcado sin `overflow:hidden` y con la altura liberada,
// sobre un fondo magenta que no aparece en la paleta: la última fila que no
// sea magenta es donde termina de verdad el contenido.
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = dirname(fileURLToPath(import.meta.url));
const IN = join(DIR, 'artboards');
const OUT = join(DIR, '.audit');
mkdirSync(OUT, { recursive: true });

const filas = [];
for (const f of readdirSync(IN).filter((x) => x.endsWith('.dc.html'))) {
  const src = readFileSync(join(IN, f), 'utf8');
  const css = src.match(/<helmet>\s*<style>([\s\S]*?)<\/style>\s*<\/helmet>/)?.[1] ?? '';
  let body = src.match(/<\/helmet>([\s\S]*?)<\/x-dc>/)?.[1] ?? '';
  const m = body.match(/width:(\d+)px;height:(\d+)px/);
  const [w, h] = m ? [Number(m[1]), Number(m[2])] : [1440, 900];
  // Libera la altura del contenedor raíz y de todo lo que la fije por dentro.
  body = body.replace(/height:(\d+)px;background/g, 'min-height:$1px;background')
             .replace(/overflow:hidden/g, 'overflow:visible')
             .replace(/height:(\d+)px"/g, 'min-height:$1px"');
  writeFileSync(join(OUT, f.replace('.dc.html', '.html')),
    `<!doctype html><html><head><meta charset="utf-8"><style>${css}
    html,body{background:#FF00FF !important;margin:0}</style></head><body>${body}</body></html>`);
  filas.push({ nombre: f.replace('.dc.html', ''), w, h });
}
writeFileSync(join(OUT, 'index.json'), JSON.stringify(filas, null, 2));
console.log(filas.length + ' listos');
