import { T, RISK, RISK_ORDER } from './lib.mjs';

const lin = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
const L = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return 0.2126 * lin((n >> 16) & 255) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255);
};
const ratio = (a, b) => { const x = L(a), y = L(b); return ((Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)); };

const filas = [
  ['ink sobre superficie',      T.ink,       T.surface,      4.5],
  ['ink sobre lienzo',          T.ink,       T.paper,        4.5],
  ['secundario sobre superficie', T.secondary, T.surface,    4.5],
  ['secundario sobre lienzo',   T.secondary, T.paper,        4.5],
  ['apagado sobre superficie',  T.muted,     T.surface,      4.5],
  ['apagado sobre lienzo',      T.muted,     T.paper,        4.5],
  ['apagado sobre apagada',     T.muted,     T.surfaceMuted, 4.5],
  ['teal sobre superficie',     T.teal,      T.surface,      4.5],
  ['tealDark sobre superficie', T.tealDark,  T.surface,      4.5],
  ['blanco sobre tinta (botón)', '#FFFFFF',  T.ink,          4.5],
  ['blanco sobre acento (botón)', '#FFFFFF', T.tealDark, 4.5],
];
for (const k of RISK_ORDER) filas.push([`riesgo ${RISK[k].label}`, RISK[k].text, RISK[k].bg, 4.5]);

let fallos = 0;
console.log('PAR'.padEnd(30), 'RATIO'.padStart(7), '  MÍN   VEREDICTO');
for (const [n, fg, bg, min] of filas) {
  const r = ratio(fg, bg);
  const ok = r >= min;
  if (!ok) fallos++;
  console.log(n.padEnd(30), r.toFixed(2).padStart(7), ` ${min}`, ok ? ' PASA' : ' ← NO LLEGA');
}
console.log(`\n${fallos} de ${filas.length} por debajo de 4.5:1`);
