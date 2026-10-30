// Tests des logos sur les cartes de démo (visuel A validé par Pierre, 30/10/2026) — JavaScript pur (node --test 'tests/**/*.test.mjs')
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..');
const lire = (f, enc = 'utf8') => readFileSync(join(RACINE, f), enc);
const sha256 = (f) => createHash('sha256').update(readFileSync(join(RACINE, f))).digest('hex');

// Vignette d'une carte, repérée par son titre : tout ce qui précède <div class="corps">.
const vignette = (titre) => {
  const cartes = [...lire('index.html').matchAll(/<article class="carte">([\s\S]*?)<\/article>/g)].map((m) => m[1]);
  const trouvees = cartes.filter((c) => c.includes(`<h3 class="titre">${titre}</h3>`));
  assert.equal(trouvees.length, 1, `carte « ${titre} » introuvable ou en double`);
  const v = trouvees[0].match(/<div class="vignette"[\s\S]*?(?=<div class="corps">)/);
  assert.ok(v, `vignette de « ${titre} » introuvable`);
  return v[0];
};

const LOGOS = [
  ['CCAPP', 'logos/ccapp.png'],
  ['Afrivita', 'logos/afrivita.svg'],
  ['Afrivita Diaspora', 'logos/afrivita.svg'],
  ['Gustavita Coach', 'logos/gustavita.svg'],
];

test('L1 — chaque carte d\'appli a son logo dans la vignette (conteneur, alt vide, 32 × 32)', () => {
  for (const [titre, src] of LOGOS) {
    const v = vignette(titre);
    const conteneur = v.match(/<div class="logo-appli">\s*(<img\b[^>]*>)\s*<\/div>/);
    assert.ok(conteneur, `${titre} : conteneur de logo avec <img> absent de la vignette`);
    const img = conteneur[1];
    assert.ok(img.includes(`src="${src}"`), `${titre} : src attendu ${src}`);
    assert.ok(/\balt=""/.test(img), `${titre} : alt="" attendu`);
    assert.ok(/\bwidth="32"/.test(img), `${titre} : width="32" attendu`);
    assert.ok(/\bheight="32"/.test(img), `${titre} : height="32" attendu`);
  }
});

test('L2 — la carte de l\'appli de révision n\'a aucun logo', () => {
  const v = vignette('Appli de révision en maths');
  assert.ok(!v.includes('<img'), 'image présente dans la vignette de révision');
  assert.ok(!v.includes('logo-appli'), 'conteneur de logo présent dans la vignette de révision');
});

test('L3 — les logos Afrivita et CCAPP sont les fichiers validés (sha256)', () => {
  assert.equal(sha256('logos/afrivita.svg'), '6dd5fea32beb8bea4c42576427e7fe0fc0ffadf07ab56bd9aa933485e10e9222');
  assert.equal(sha256('logos/ccapp.png'), '8a0fd46ef3ef3d7fa393512a0e7f71bed1316c35db6c9fe5bf1b835cf2dacafa');
});

test('L4 — le logo Gustavita reprend le cercle et le tracé de gustavita/src/rendu.mjs:20-21', () => {
  const svg = lire('logos/gustavita.svg');
  assert.ok(/<circle\b[^>]*\bcx="32" cy="32" r="30"/.test(svg), 'cercle cx="32" cy="32" r="30" absent');
  assert.ok(svg.includes('d="M44 22a14 14 0 1 0 2 14H33"'), 'tracé d="M44 22a14 14 0 1 0 2 14H33" absent');
});

test('L5 — aucune URL externe dans les 3 logos (seul xmlns SVG toléré)', () => {
  for (const f of ['logos/afrivita.svg', 'logos/ccapp.png', 'logos/gustavita.svg']) {
    const contenu = lire(f, 'latin1').split('xmlns="http://www.w3.org/2000/svg"').join('');
    assert.ok(!/https?:\/\//i.test(contenu), `${f} contient une adresse http`);
  }
});
