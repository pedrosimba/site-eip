// Lot « Carte Virées - Mons » (12/11/2026) — 6e carte, appli en ligne (décision de Pierre).
// JavaScript pur, aucune dépendance (node --test tests/*.test.mjs).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = () => readFileSync(join(RACINE, 'index.html'), 'utf8');

const TITRE = 'Virées&nbsp;- Mons';
const SHA_LOGO = '1071aa40b224f6d660b309f76d54eccf719030e5faf8fe96371db1c91af1a5f6';

const cartes = () => [...html().matchAll(/<article class="carte">([\s\S]*?)<\/article>/g)].map((m) => m[1]);
const carte = () => {
  const trouvees = cartes().filter((c) => c.includes(`<h3 class="titre">${TITRE}</h3>`));
  assert.equal(trouvees.length, 1, 'carte Virées introuvable ou en double');
  return trouvees[0];
};

test('V1 — titre exact « Virées - Mons » (espace insécable avant le tiret)', () => {
  carte();
});

test('V2 — étiquette « Sorties · Mons-Borinage »', () => {
  assert.ok(carte().includes('<p class="marche">Sorties · Mons-Borinage</p>'), 'virées : étiquette');
});

test('V3 — texte exact', () => {
  assert.ok(carte().includes('<p class="texte">On fait le tri pour vous&nbsp;: apéros, concerts, spectacles, brunchs et sorties en famille autour de Mons, réunis au même endroit.</p>'), 'virées : texte');
});

test('V4 — badge « En ligne » (même classe que « Démo en ligne »)', () => {
  assert.ok(carte().includes('<span class="badge en-ligne">En ligne</span>'), 'virées : badge');
});

test('V5 — bouton « Ouvrir l\'appli » vers https://eipdecision.be/virees/', () => {
  assert.ok(carte().includes('<a class="bouton plein petit" href="https://eipdecision.be/virees/">Ouvrir l\'appli</a>'), 'virées : bouton');
});

test('V6 — la carte Virées est la dernière des cartes et précède #partenaires', () => {
  const toutes = cartes();
  assert.equal(toutes.length, 6, 'six cartes attendues');
  assert.ok(toutes[5].includes(`<h3 class="titre">${TITRE}</h3>`), 'Virées doit être la 6e carte');
  const source = html();
  const finCarte = source.lastIndexOf('</article>');
  const partenaires = source.indexOf('<section id="partenaires"');
  assert.ok(finCarte > -1 && partenaires > finCarte, '#partenaires doit suivre la dernière carte');
});

test('V7 — logo logos/virees.svg, 32×32, alt vide, dans <div class="logo-appli">', () => {
  assert.ok(carte().includes('<div class="logo-appli"><img src="logos/virees.svg" alt="" width="32" height="32"></div>'), 'virées : logo');
  assert.ok(carte().includes('style="background:#1A1438"'), 'virées : fond de vignette');
});

test('V8 — sha256 de logos/virees.svg identique à celui de virees-mons/assets/logo.svg', () => {
  const chemin = join(RACINE, 'logos', 'virees.svg');
  assert.ok(existsSync(chemin), 'logos/virees.svg absent');
  const sha = createHash('sha256').update(readFileSync(chemin)).digest('hex');
  assert.equal(sha, SHA_LOGO);
});

test('V9 — aucune URL externe dans logos/virees.svg (hors espace de noms xmlns)', () => {
  const chemin = join(RACINE, 'logos', 'virees.svg');
  assert.ok(existsSync(chemin), 'logos/virees.svg absent');
  const svg = readFileSync(chemin, 'utf8').replace(/xmlns(:\w+)?="[^"]*"/g, '');
  assert.ok(!/https?:\/\//i.test(svg) && !/url\(\s*['"]?(?!#)/i.test(svg), 'URL externe trouvée');
});

test('V10 — toujours exactement 5 « Démo en ligne » et 5 « Essayer la démo »', () => {
  const source = html();
  assert.equal(source.split('>Démo en ligne<').length - 1, 5);
  assert.equal(source.split('>Essayer la démo<').length - 1, 5);
});
