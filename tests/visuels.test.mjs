// Lot « VISUELS sur les cartes produits » (12/11/2026, décision de Pierre) — JavaScript pur (node --test tests/*.test.mjs).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = () => readFileSync(join(RACINE, 'index.html'), 'utf8');

const CARTES = [
  ['CCAPP', 'ccapp'],
  ['Afrivita Diaspora', 'afrivita-diaspora'],
  ['Gustavita Coach', 'gustavita'],
  ['Squad Révision Maths&nbsp;CEB', 'squad'],
  ['Virées&nbsp;- Mons', 'virees'],
];

const carte = (titre) => {
  const toutes = [...html().matchAll(/<article class="carte">([\s\S]*?)<\/article>/g)].map((m) => m[1]);
  const trouvees = toutes.filter((c) => c.includes(`<h3 class="titre">${titre}</h3>`));
  assert.equal(trouvees.length, 1, `carte « ${titre} » introuvable ou en double`);
  return trouvees[0];
};
const vignette = (c) => c.match(/<div class="vignette[ "][\s\S]*?(?=<div class="corps">)/)[0];
const visuel = (titre) => {
  const m = vignette(carte(titre)).match(/<a\b[^>]*>\s*<img\b[^>]*\bsrc="visuels\/[^"]*"[^>]*>\s*<\/a>/);
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

test('S1 — chaque carte concernée contient un <img> vers visuels/<nom>.jpg', () => {
  for (const [titre, nom] of CARTES) {
    const v = visuel(titre);
    assert.ok(v, `${titre} : <a><img src="visuels/…"></a> absent de la vignette`);
    assert.equal(attr(v.match(/<img\b[^>]*>/)[0], 'src'), `visuels/${nom}.jpg`, `${titre} : src attendu visuels/${nom}.jpg`);
  }
});

test('S2 — chaque visuels/*.jpg existe, signature JPEG, 200 000 octets maximum', () => {
  for (const [, nom] of CARTES) {
    const f = join(RACINE, 'visuels', `${nom}.jpg`);
    assert.ok(existsSync(f), `visuels/${nom}.jpg absent`);
    const buf = readFileSync(f);
    assert.ok(buf[0] === 0xff && buf[1] === 0xd8, `visuels/${nom}.jpg : signature JPEG (FF D8) absente`);
    assert.ok(buf.length <= 200000, `visuels/${nom}.jpg : ${buf.length} octets > 200000`);
  }
  const jpgs = readdirSync(join(RACINE, 'visuels')).filter((f) => f.endsWith('.jpg'));
  assert.equal(jpgs.length, CARTES.length, 'nombre de fichiers visuels/*.jpg inattendu');
});

test('S3 — alt non vide, loading="lazy", decoding="async", width/height = dimensions réelles', () => {
  for (const [titre, nom] of CARTES) {
    const v = visuel(titre);
    assert.ok(v, `${titre} : visuel absent`);
    const img = v.match(/<img\b[^>]*>/)[0];
    assert.ok((attr(img, 'alt') || '').trim().length > 0, `${titre} : alt vide ou absent`);
    assert.equal(attr(img, 'loading'), 'lazy', `${titre} : loading="lazy" attendu`);
    assert.equal(attr(img, 'decoding'), 'async', `${titre} : decoding="async" attendu`);
    const d = dimensionsJpeg(readFileSync(join(RACINE, 'visuels', `${nom}.jpg`)));
    assert.equal(attr(img, 'width'), String(d.w), `${titre} : width attendu ${d.w}`);
    assert.equal(attr(img, 'height'), String(d.h), `${titre} : height attendu ${d.h}`);
  }
});

test('S4 — chaque <img> est dans un lien identique au bouton de SA carte', () => {
  for (const [titre] of CARTES) {
    const v = visuel(titre);
    assert.ok(v, `${titre} : visuel absent`);
    const bouton = carte(titre).match(/<a class="bouton[^"]*" href="([^"]*)"/);
    assert.ok(bouton, `${titre} : bouton introuvable`);
    assert.equal(attr(v.match(/^<a\b[^>]*>/)[0], 'href'), bouton[1], `${titre} : adresse du lien ≠ adresse du bouton`);
  }
});

test('S5 — la carte Afrivita (Cameroun) n\'a aucun visuel et garde sa vignette actuelle', () => {
  const v = vignette(carte('Afrivita'));
  assert.ok(!v.includes('visuels/'), 'visuel présent sur la carte Afrivita Cameroun');
  assert.equal(
    v,
    '<div class="vignette" style="background:#F6EBD6" aria-hidden="true"><div class="logo-appli"><img src="logos/afrivita.svg" alt="" width="32" height="32"></div><div class="ecran"><i style="height:14px;border-radius:5px;background:#2F6B3F"></i><i style="height:44px;background:#FBF3E4"></i><i style="height:28px;background:#F08A24"></i></div></div>',
  );
});

test('S6 — aucun src d\'image ne pointe vers une adresse externe', () => {
  const srcs = [...html().matchAll(/<img\b[^>]*\bsrc="([^"]*)"/g)].map((m) => m[1]);
  assert.ok(srcs.length > 0, 'aucune image trouvée');
  for (const s of srcs) assert.ok(!/^(https?:)?\/\//i.test(s) && !s.startsWith('data:'), `src externe : ${s}`);
});
