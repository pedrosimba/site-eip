// Lot 2b — téléphones 3D animés et tailles de texte relatives (index.html).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(RACINE, 'index.html'), 'utf8');
const css = (html.match(/<style>([\s\S]*?)<\/style>/) || [, ''])[1];

function blocTelephones() {
  const debut = html.search(/<div class="telephones"[^>]*>/);
  assert.notEqual(debut, -1, 'bloc class="telephones" absent');
  const fin = html.indexOf('</section>', debut);
  assert.notEqual(fin, -1, 'fin du bloc class="telephones" introuvable');
  return html.slice(debut, fin);
}

const compter = (texte, motif) => (texte.match(motif) || []).length;

test('B1 — 3 téléphones (tranche + face) et 3 ombres', () => {
  const bloc = blocTelephones();
  for (const n of [1, 2, 3]) {
    assert.equal(compter(bloc, new RegExp(`class="tel t${n}"`, 'g')), 1, `tel t${n}`);
    assert.equal(compter(bloc, new RegExp(`class="ombre o${n}"`, 'g')), 1, `ombre o${n}`);
    const tel = bloc.split(`class="tel t${n}"`)[1].split('class="tel t')[0];
    assert.ok(tel.includes('class="tranche"'), `tel t${n} : tranche absente`);
    assert.ok(tel.includes('class="face"'), `tel t${n} : face absente`);
  }
  assert.equal(compter(bloc, /class="tel /g), 3, 'exactement 3 téléphones');
  assert.equal(compter(bloc, /class="ombre /g), 3, 'exactement 3 ombres');
});

test('B2 — animations, perspective et mouvement réduit', () => {
  assert.ok(css.includes('@keyframes flotte'), '@keyframes flotte');
  assert.ok(css.includes('@keyframes ombre'), '@keyframes ombre');
  assert.ok(css.includes('perspective:900px'), 'perspective:900px');
  const reduit = css.match(/@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{([^{}]*\{[^}]*\})*\s*\}/);
  assert.ok(reduit, 'bloc @media (prefers-reduced-motion:reduce) absent');
  assert.ok(reduit[0].includes('animation:none'), 'animation:none absent du bloc mouvement réduit');
});

test('B3 — aucune taille de texte en pixels, h1 en clamp rem', () => {
  assert.equal(compter(html, /font-size:\s*[\d.]+px/g), 0, 'font-size en px trouvé');
  assert.ok(/h1\{[^}]*font-size:clamp\(2\.25rem,5vw,3\.625rem\)/.test(css), 'h1 : clamp(2.25rem,5vw,3.625rem) absent');
});

test('B4 — le bloc des téléphones est masqué aux lecteurs d’écran', () => {
  assert.ok(/<div class="telephones" aria-hidden="true">/.test(html), 'aria-hidden="true" absent');
});
