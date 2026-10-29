// Tests du site EIP — JavaScript pur, aucune dépendance (node --test tests/)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..');
const lire = (f) => readFileSync(join(RACINE, f), 'utf8');

const PAGES = [
  'index.html',
  'performance.html',
  'espace-partenaires.html',
  'mentions-legales.html',
  'veille-belgique.html',
  'decret-tertiaire.html',
  'hebergement-handicap.html',
  'intelligence-risques.html',
  'reprise-entreprises.html',
];

const NON_SUIVIS = [
  'emails-a-copier.txt',
  'prospection-handicap.csv',
  'structures-avec-email.csv',
  'structures-sans-email.pdf',
];

const POLICES = [
  'fraunces-latin-full-normal.woff2',
  'fraunces-latin-full-italic.woff2',
  'inter-latin-wght-normal.woff2',
];

const FONT_FACES = [
  { famille: 'Fraunces', style: 'normal', fichier: 'fraunces-latin-full-normal.woff2' },
  { famille: 'Fraunces', style: 'italic', fichier: 'fraunces-latin-full-italic.woff2' },
  { famille: 'Inter', style: 'normal', fichier: 'inter-latin-wght-normal.woff2' },
];

test('T1 — .gitignore protège les 4 fichiers de prospection', () => {
  assert.ok(existsSync(join(RACINE, '.gitignore')), '.gitignore absent');
  const lignes = lire('.gitignore').split(/\r?\n/).map((l) => l.trim());
  for (const nom of NON_SUIVIS) {
    assert.ok(lignes.includes(nom), `${nom} absent du .gitignore`);
  }
});

test('T2 — aucune page n\'appelle Google Fonts', () => {
  for (const page of PAGES) {
    const html = lire(page);
    assert.ok(!html.includes('fonts.googleapis.com'), `${page} : fonts.googleapis.com`);
    assert.ok(!html.includes('fonts.gstatic.com'), `${page} : fonts.gstatic.com`);
  }
});

test('T3 — polices et licences présentes dans fonts/', () => {
  for (const f of POLICES) {
    const chemin = join(RACINE, 'fonts', f);
    assert.ok(existsSync(chemin), `fonts/${f} absent`);
    const entete = readFileSync(chemin).subarray(0, 4).toString('latin1');
    assert.equal(entete, 'wOF2', `fonts/${f} n'est pas un woff2`);
  }
  for (const l of ['OFL-Fraunces.txt', 'OFL-Inter.txt']) {
    assert.ok(existsSync(join(RACINE, 'fonts', l)), `fonts/${l} absent`);
    assert.ok(lire(join('fonts', l)).includes('SIL Open Font License'), `fonts/${l} : licence OFL manquante`);
  }
});

test('T4 — chaque page déclare les 3 @font-face hébergés', () => {
  for (const page of PAGES) {
    const blocs = lire(page).match(/@font-face\s*\{[^}]*\}/g) || [];
    for (const { famille, style, fichier } of FONT_FACES) {
      const trouve = blocs.some((b) => {
        const c = b.replace(/\s+/g, '');
        return c.includes(`font-family:"${famille}"`)
          && c.includes(`url("fonts/${fichier}")`)
          && c.includes(`font-style:${style}`)
          && /font-weight:100 900/.test(b.replace(/\s+/g, ' '))
          && c.includes('font-display:swap');
      });
      assert.ok(trouve, `${page} : @font-face ${famille} ${style} manquant ou incomplet`);
    }
  }
});

test('T5 — plus aucune trace d\'IBM Plex', () => {
  for (const page of PAGES) {
    assert.ok(!lire(page).includes('IBM Plex'), `${page} : IBM Plex encore présent`);
  }
});

test('T6 — aucune ressource externe chargée par les pages', () => {
  const motifs = [
    /<link\b[^>]*\bhref\s*=\s*["']?https?:\/\//gi,
    /<script\b[^>]*\bsrc\s*=\s*["']?https?:\/\//gi,
    /<img\b[^>]*\bsrc\s*=\s*["']?https?:\/\//gi,
    /<iframe\b[^>]*\bsrc\s*=\s*["']?https?:\/\//gi,
    /url\(\s*["']?https?:\/\//gi,
  ];
  for (const page of PAGES) {
    const html = lire(page);
    for (const m of motifs) {
      const trouves = html.match(m);
      assert.equal(trouves, null, `${page} : ressource externe ${trouves && trouves[0]}`);
    }
  }
});
