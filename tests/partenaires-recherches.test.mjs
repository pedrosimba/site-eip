// Lot « Pastille Partenaires recherchés » (24/11/2026, décision de Pierre, accord du pilote) — JavaScript pur (node --test tests/*.test.mjs).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = () => readFileSync(join(RACINE, 'index.html'), 'utf8');

const PASTILLE = '<a class="pastille-partenaires" href="#partenaires">Partenaires recherchés</a>';
const VISEES = ['Anti-Gaspi du Coin', 'Afrivita', 'Afrivita Diaspora', 'CCAPP'];
const AUTRES = ['Elya', 'Virées&nbsp;- Mons', 'Gustavita Coach', 'Squad Révision Maths&nbsp;CEB'];

const cartes = () => [...html().matchAll(/<article class="carte">([\s\S]*?)<\/article>/g)].map((m) => m[1]);
const carte = (titre) => {
  const trouvees = cartes().filter((x) => x.includes(`<h3 class="titre">${titre}</h3>`));
  assert.equal(trouvees.length, 1, `carte « ${titre} » introuvable ou en double`);
  return trouvees[0];
};
const compter = (texte, motif) => texte.split(motif).length - 1;

test('P1 — les 4 cartes visées contiennent exactement une fois la pastille', () => {
  for (const t of VISEES) assert.equal(compter(carte(t), PASTILLE), 1, `${t} : pastille attendue une fois`);
});

test('P2 — les 4 autres cartes ne contiennent pas « Partenaires recherchés »', () => {
  for (const t of AUTRES) assert.equal(compter(carte(t), 'Partenaires recherchés'), 0, `${t} : aucune pastille attendue`);
});

test('P3 — exactement 4 fois « Partenaires recherchés » hors section #partenaires', () => {
  const source = html();
  const debut = source.indexOf('<section id="partenaires"');
  assert.ok(debut > -1, '#partenaires introuvable');
  const fin = source.indexOf('</section>', debut) + '</section>'.length;
  assert.equal(compter(source.slice(0, debut) + source.slice(fin), 'Partenaires recherchés'), 4);
});

test('P4 — la cible #partenaires existe', () => {
  assert.equal(compter(html(), '<section id="partenaires"'), 1);
});
