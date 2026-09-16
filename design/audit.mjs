// Mide la altura natural de cada artboard para detectar recortes.
//
// Rinde el mismo marcado sin `overflow:hidden` y con la altura liberada, y deja
// que el propio navegador informe de dónde termina el contenido: un script
// escribe scrollHeight en el título y `--dump-dom` lo devuelve. Antes esto se
// hacía descodificando el PNG píxel a píxel en Python y tardaba varios minutos.
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const DIR = dirname(fileURLToPath(import.meta.url));
const IN = join(DIR, 'artboards');
const OUT = join(DIR, '.audit');
const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
mkdirSync(OUT, { recursive: true });

const filas = [];
for (const f of readdirSync(IN).filter((x) => x.endsWith('.dc.html')).sort()) {
  const src = readFileSync(join(IN, f), 'utf8');
  const css = src.match(/<helmet>\s*<style>([\s\S]*?)<\/style>\s*<\/helmet>/)?.[1] ?? '';
  let body = src.match(/<\/helmet>([\s\S]*?)<\/x-dc>/)?.[1] ?? '';
  const m = body.match(/width:(\d+)px;height:(\d+)px/);
  const [w, h] = m ? [Number(m[1]), Number(m[2])] : [1440, 900];
  body = body
    .replace(/height:(\d+)px;background/g, 'min-height:$1px;background')
    .replace(/overflow:hidden/g, 'overflow:visible')
    .replace(/height:(\d+)px"/g, 'min-height:$1px"');
  const ruta = join(OUT, f.replace('.dc.html', '.html'));
  writeFileSync(ruta,
    `<!doctype html><html><head><meta charset="utf-8"><style>${css}
    html,body{margin:0}
    /* Sin animación: una entrada a medio camino mediría de menos. */
    *,*::before,*::after{animation:none !important;transition:none !important}</style></head>
    <body>${body}<script>
      const medir = () => { document.title = 'ALTO=' + document.documentElement.scrollHeight; };
      medir(); window.addEventListener('load', medir);
      if (document.fonts) document.fonts.ready.then(medir);
    <\/script></body></html>`);
  filas.push({ nombre: f.replace('.dc.html', ''), w, h, ruta });
}

console.log(`midiendo ${filas.length} artboards…`);
let malos = 0;
const informe = [`${'ARTBOARD'.padEnd(24)} ${'DECL'.padStart(6)} ${'REAL'.padStart(6)} ${'HOLGURA'.padStart(8)}`];

for (const r of filas) {
  let dom = '';
  try {
    dom = execFileSync(CHROME, [
      '--headless', '--no-sandbox', '--disable-gpu', '--hide-scrollbars',
      `--window-size=${r.w},400`, '--virtual-time-budget=4000', '--dump-dom', r.ruta,
    ], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] });
  } catch { /* se informa abajo como NO MEDIDO */ }
  const real = Number(dom.match(/<title>ALTO=(\d+)<\/title>/)?.[1] ?? 0);
  const holgura = r.h - real;
  let marca = '';
  if (real === 0) { marca = '  ← NO MEDIDO'; malos++; }
  else if (holgura < 0) { marca = '  ← RECORTADO'; malos++; }
  else if (holgura > 180) { marca = '  ← sobra'; malos++; }
  informe.push(`${r.nombre.padEnd(24)} ${String(r.h).padStart(6)} ${String(real).padStart(6)} ${String(holgura).padStart(8)}${marca}`);
}

writeFileSync(join(OUT, 'informe.txt'), informe.join('\n') + '\n');
console.log(informe.join('\n'));
console.log(malos === 0 ? '\nOK — sin recortes ni holguras excesivas' : `\n${malos} artboards a revisar`);
