// Lot « Cartes Anti-Gaspi du Coin et Elya » (24/11/2026, décisions du pilote, délégation de Pierre) — 7e et 8e cartes.
// JavaScript pur, aucune dépendance (node --test tests/*.test.mjs).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = () => readFileSync(join(RACINE, 'index.html'), 'utf8');

const NBSP = '&nbsp;';
const AG = {
  titre: 'Anti-Gaspi du Coin',
  marche: 'Commerces de proximité · Belgique et France',
  texte: `Les invendus du jour de vos commerçants, à au moins 40${NBSP}% de remise. Réservez dans l'appli, payez sur place.`,
  badge: 'En ligne',
  bouton: "Ouvrir l'appli",
  lien: 'https://antigaspi.eipdecision.be/',
  visuel: 'anti-gaspi',
  fond: '#1F3D2B',
};
const ELYA = {
  titre: 'Elya',
  marche: "Services à domicile · 6 pays d'Europe",
  texte: 'Babysitting, aînés, cours, pet-sitting, maison, numérique. Vous choisissez qui vient chez vous.',
  badge: 'En ligne',
  bouton: 'Ouvrir Elya',
  lien: 'https://elya-production-76edcec0.up.railway.app/',
  visuel: 'elya',
  fond: '#0E1830',
};
const NOUVELLES = [AG, ELYA];

const cartes = () => [...html().matchAll(/<article class="carte">([\s\S]*?)<\/article>/g)].map((m) => m[1]);
const carte = (c) => {
  const trouvees = cartes().filter((x) => x.includes(`<h3 class="titre">${c.titre}</h3>`));
  assert.equal(trouvees.length, 1, `carte « ${c.titre} » introuvable ou en double`);
  return trouvees[0];
};
const vignette = (x) => x.match(/<div class="vignette[ "][\s\S]*?(?=<div class="corps">)/)[0];
const visuel = (c) => {
  const m = vignette(carte(c)).match(/<a\b[^>]*>\s*<img\b[^>]*\bsrc="visuels\/[^"]*"[^>]*>\s*<\/a>/);
  return m ? m[0] : null;
};
const attr = (balise, nom) => (balise.match(new RegExp(`\\b${nom}="([^"]*)"`)) || [])[1];

// Dimensions réelles d'un JPEG (lecture du marqueur SOFn).
const dimensionsJpeg = (buf) => {
  let i = 2;
  while (i < buf.length) {
    if (buf[i] !== 0xff) { i++; continue; }
    const m = buf[i + 1];
    if (m >= 0xc0 && m <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(m)) return { h: buf.readUInt16BE(i + 5), w: buf.readUInt16BE(i + 7) };
    i += 2 + buf.readUInt16BE(i + 2);
  }
  throw new Error('SOF introuvable');
};

test('G1 — étiquette de chaque carte', () => {
  for (const c of NOUVELLES) assert.ok(carte(c).includes(`<p class="marche">${c.marche}</p>`), `${c.titre} : étiquette`);
});

test('G2 — texte exact de chaque carte (espace insécable avant « % »)', () => {
  for (const c of NOUVELLES) assert.ok(carte(c).includes(`<p class="texte">${c.texte}</p>`), `${c.titre} : texte`);
});

test('G3 — badge « En ligne » (même classe que « Démo en ligne »)', () => {
  for (const c of NOUVELLES) assert.ok(carte(c).includes(`<span class="badge en-ligne">${c.badge}</span>`), `${c.titre} : badge`);
});

test('G4 — bouton et adresse de chaque carte', () => {
  for (const c of NOUVELLES) assert.ok(carte(c).includes(`<a class="bouton plein petit" href="${c.lien}">${c.bouton}</a>`), `${c.titre} : bouton`);
});

test('G5 — visuel, logo et fond de vignette (même structure que la carte Virées)', () => {
  for (const c of NOUVELLES) {
    const x = carte(c);
    assert.ok(x.includes(`<div class="vignette" style="background:${c.fond}" aria-hidden="true">`), `${c.titre} : vignette`);
    assert.ok(x.includes(`<div class="logo-appli"><img src="logos/${c.visuel}.svg" alt="" width="32" height="32"></div>`), `${c.titre} : logo`);
    const v = visuel(c);
    assert.ok(v, `${c.titre} : <a><img src="visuels/…"></a> absent de la vignette`);
    assert.ok(/^<a class="visuel" href="[^"]*" tabindex="-1">/.test(v), `${c.titre} : lien class="visuel" tabindex="-1"`);
    assert.equal(attr(v.match(/<img\b[^>]*>/)[0], 'src'), `visuels/${c.visuel}.jpg`, `${c.titre} : src du visuel`);
  }
});

// 24/11/2026 : cartes classées de la plus récente à la plus ancienne (décision de Pierre, accord du pilote).
test('G6 — Elya, Anti-Gaspi du Coin et Virées - Mons en tête, puis #partenaires après la dernière carte', () => {
  const toutes = cartes();
  assert.equal(toutes.length, 8, 'huit cartes attendues');
  assert.ok(toutes[0].includes(`<h3 class="titre">${ELYA.titre}</h3>`), '1re carte : Elya');
  assert.ok(toutes[1].includes(`<h3 class="titre">${AG.titre}</h3>`), '2e carte : Anti-Gaspi du Coin');
  assert.ok(toutes[2].includes('<h3 class="titre">Virées&nbsp;- Mons</h3>'), '3e carte : Virées');
  const source = html();
  const finCarte = source.lastIndexOf('</article>');
  const partenaires = source.indexOf('<section id="partenaires"');
  assert.ok(finCarte > -1 && partenaires > finCarte, '#partenaires doit suivre la dernière carte');
});

test('G7 — visuels/*.jpg : existent, signature JPEG, 200 000 octets maximum', () => {
  for (const c of NOUVELLES) {
    const f = join(RACINE, 'visuels', `${c.visuel}.jpg`);
    assert.ok(existsSync(f), `visuels/${c.visuel}.jpg absent`);
    const buf = readFileSync(f);
    assert.ok(buf[0] === 0xff && buf[1] === 0xd8, `visuels/${c.visuel}.jpg : signature JPEG (FF D8) absente`);
    assert.ok(buf.length <= 200000, `visuels/${c.visuel}.jpg : ${buf.length} octets > 200000`);
  }
});

test('G8 — alt non vide, loading="lazy", decoding="async", width/height = dimensions réelles', () => {
  for (const c of NOUVELLES) {
    const v = visuel(c);
    assert.ok(v, `${c.titre} : visuel absent`);
    const img = v.match(/<img\b[^>]*>/)[0];
    assert.ok((attr(img, 'alt') || '').trim().length > 0, `${c.titre} : alt vide ou absent`);
    assert.equal(attr(img, 'loading'), 'lazy', `${c.titre} : loading="lazy" attendu`);
    assert.equal(attr(img, 'decoding'), 'async', `${c.titre} : decoding="async" attendu`);
    const d = dimensionsJpeg(readFileSync(join(RACINE, 'visuels', `${c.visuel}.jpg`)));
    assert.equal(attr(img, 'width'), String(d.w), `${c.titre} : width attendu ${d.w}`);
    assert.equal(attr(img, 'height'), String(d.h), `${c.titre} : height attendu ${d.h}`);
  }
});

test('G9 — le lien du visuel est identique au bouton de SA carte', () => {
  for (const c of NOUVELLES) {
    const v = visuel(c);
    assert.ok(v, `${c.titre} : visuel absent`);
    const bouton = carte(c).match(/<a class="bouton[^"]*" href="([^"]*)"/);
    assert.ok(bouton, `${c.titre} : bouton introuvable`);
    assert.equal(attr(v.match(/^<a\b[^>]*>/)[0], 'href'), bouton[1], `${c.titre} : adresse du lien ≠ adresse du bouton`);
  }
});

test("G10 — aucune URL externe dans les src d'image ni dans les SVG des logos", () => {
  const srcs = [...html().matchAll(/<img\b[^>]*\bsrc="([^"]*)"/g)].map((m) => m[1]);
  assert.ok(srcs.length > 0, 'aucune image trouvée');
  for (const s of srcs) assert.ok(!/^(https?:)?\/\//i.test(s) && !s.startsWith('data:'), `src externe : ${s}`);
  for (const c of NOUVELLES) {
    const f = join(RACINE, 'logos', `${c.visuel}.svg`);
    assert.ok(existsSync(f), `logos/${c.visuel}.svg absent`);
    const svg = readFileSync(f, 'utf8');
    assert.ok(/^\s*(<\?xml[^>]*\?>\s*)?<svg\b/.test(svg), `logos/${c.visuel}.svg : pas un SVG autonome`);
    assert.ok(!/\bhref\s*=|\bsrc\s*=|url\(\s*['"]?(https?:)?\/\/|@import|<image\b|<script\b/i.test(svg), `logos/${c.visuel}.svg : référence externe`);
  }
});

test('G11 — toujours exactement 5 « Démo en ligne » et 5 « Essayer la démo »', () => {
  const source = html();
  assert.equal(source.split('>Démo en ligne<').length - 1, 5);
  assert.equal(source.split('>Essayer la démo<').length - 1, 5);
});

// 24/11/2026 : cartes classées de la plus récente à la plus ancienne (décision de Pierre, accord du pilote).
test('G12 — ordre des 8 cartes, de la plus récente à la plus ancienne', () => {
  const ordre = ['Elya', 'Anti-Gaspi du Coin', 'Virées&nbsp;- Mons', 'Gustavita Coach', 'Afrivita Diaspora', 'Afrivita', 'CCAPP', 'Squad Révision Maths&nbsp;CEB'];
  const titres = cartes().map((x) => x.match(/<h3 class="titre">([^<]*)<\/h3>/)[1]);
  assert.deepEqual(titres, ordre);
  const source = html();
  assert.ok(source.indexOf('<section id="partenaires"') > source.lastIndexOf('</article>'), '#partenaires doit suivre la dernière carte (Squad)');
});
