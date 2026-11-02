// Lot « Carte révision » (02/11/2026) — carte Squad Révision Maths CEB en démo publique, Belgique (décision de Pierre).
// JavaScript pur, aucune dépendance (node --test 'tests/**/*.test.mjs').
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = () => readFileSync(join(RACINE, 'index.html'), 'utf8');

// Titre exact dans le source : espace insécable avant « CEB ».
const TITRE = 'Squad Révision Maths&nbsp;CEB';

// Carte repérée par son titre.
const carte = (titre) => {
  const cartes = [...html().matchAll(/<article class="carte">([\s\S]*?)<\/article>/g)].map((m) => m[1]);
  const trouvees = cartes.filter((c) => c.includes(`<h3 class="titre">${titre}</h3>`));
  assert.equal(trouvees.length, 1, `carte « ${titre} » introuvable ou en double`);
  return trouvees[0];
};

test('R1 — la carte a pour titre « Squad Révision Maths CEB » (espace insécable avant CEB)', () => {
  carte(TITRE);
});

test('R2 — badge « Démo en ligne », comme la carte CCAPP', () => {
  assert.ok(carte(TITRE).includes('<span class="badge en-ligne">Démo en ligne</span>'), 'révision : badge');
});

test('R3 — marché « Éducation · Belgique »', () => {
  assert.ok(carte(TITRE).includes('<p class="marche">Éducation · Belgique</p>'), 'révision : marché');
});

test('R4 — bouton « Essayer la démo » vers https://eipdecision.be/squad-maths-ceb/web/', () => {
  assert.ok(carte(TITRE).includes('<a class="bouton plein petit" href="https://eipdecision.be/squad-maths-ceb/web/">Essayer la démo</a>'), 'révision : bouton');
});

test('R5 — plus de « En préparation » ni de « Être prévenu » ; l\'appli payante n\'est jamais liée', () => {
  const source = html();
  assert.ok(!source.includes('En préparation'), 'index.html contient « En préparation »');
  assert.ok(!source.includes('Être prévenu'), 'index.html contient « Être prévenu »');
  assert.ok(!source.includes('/squad-maths-ceb/web/appli.html'), 'index.html contient « /squad-maths-ceb/web/appli.html »');
});
