// Lot « Mention Partenaires recherchés » (24/11/2026, décision de Pierre, accord du pilote) : pastille remplacée par un bandeau bien visible — JavaScript pur (node --test tests/*.test.mjs).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = () => readFileSync(join(RACINE, 'index.html'), 'utf8');

const AU = 'Partenaires recherchés au Cameroun et en Côte d\'Ivoire';
const SIMPLE = 'Partenaires recherchés';
// 24/11/2026 : zones partenaires d'Anti-Gaspi du Coin (décision de Pierre, accord du pilote).
const AG = "Partenaires recherchés en Belgique et en France, puis au Luxembourg, en Allemagne, aux Pays-Bas…";
const bandeau = (texte) => `<a class="bandeau-partenaires" href="#partenaires">${texte}</a>`;
const VISEES = [['Anti-Gaspi du Coin', AG], ['Afrivita', AU], ['Afrivita Diaspora', SIMPLE], ['CCAPP', AU]];
const AUTRES = ['Elya', 'Virées&nbsp;- Mons', 'Gustavita Coach', 'Squad Révision Maths&nbsp;CEB'];

const cartes = () => [...html().matchAll(/<article class="carte">([\s\S]*?)<\/article>/g)].map((m) => m[1]);
const carte = (titre) => {
  const trouvees = cartes().filter((x) => x.includes(`<h3 class="titre">${titre}</h3>`));
  assert.equal(trouvees.length, 1, `carte « ${titre} » introuvable ou en double`);
  return trouvees[0];
};
const compter = (texte, motif) => texte.split(motif).length - 1;

test('P1 — chaque carte visée contient exactement une fois son bandeau, avec son texte exact, seul après le bloc titre + badge', () => {
  for (const [t, texte] of VISEES) {
    const c = carte(t);
    assert.equal(compter(c, bandeau(texte)), 1, `${t} : bandeau attendu une fois`);
    assert.equal(compter(c, '<a class="bandeau-partenaires"'), 1, `${t} : un seul bandeau`);
    assert.ok(c.includes(`</span></div>${bandeau(texte)}<p class="marche">`), `${t} : bandeau juste après le bloc titre + badge, hors de la ligne flex`);
  }
});

test('P2 — les 4 autres cartes n\'ont aucun « Partenaires recherchés »', () => {
  for (const t of AUTRES) assert.equal(compter(carte(t), 'Partenaires recherchés'), 0, `${t} : aucune mention attendue`);
});

test('P3 — exactement 4 bandeaux et aucune « pastille-partenaires »', () => {
  const source = html();
  assert.equal(compter(source, '<a class="bandeau-partenaires"'), 4);
  assert.equal(compter(source, 'pastille-partenaires'), 0);
  assert.equal(compter(source, '.ligne .badge{margin-left:auto}'), 0);
});

test('P4 — la cible #partenaires existe', () => {
  assert.equal(compter(html(), '<section id="partenaires"'), 1);
});

test('P5 — contraste : la règle .bandeau-partenaires a background:#C9A227 et color:#14213D', () => {
  const regle = html().match(/\.bandeau-partenaires\{([^}]*)\}/);
  assert.ok(regle, 'règle .bandeau-partenaires absente');
  assert.ok(regle[1].includes('background:#C9A227'), 'background:#C9A227 attendu');
  assert.ok(regle[1].includes('color:#14213D'), 'color:#14213D attendu');
});
