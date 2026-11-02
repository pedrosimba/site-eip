// Lot « Tous les produits » (31/10/2026) — logo Double C sur CCAPP, Gustavita Coach en démo publique, numéro personnel retiré.
// JavaScript pur, aucune dépendance (node --test 'tests/**/*.test.mjs').
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..');
const lire = (f) => readFileSync(join(RACINE, f), 'utf8');
const html = () => lire('index.html');
const compter = (texte, motif) => texte.split(motif).length - 1;
const chiffres = (s) => s.replace(/\D/g, '');

// Numéro France : chiffres du lien wa.me/33… de l'accueil (31/10/2026).
const NUMERO = '32483142070'; // 02/11/2026 : numéro unique +32…70 (décision de Pierre, accord du pilote)
const MESSAGE = '?text=Bonjour%20EIP%2C%20je%20viens%20du%20site%20eipdecision.be.'; // 02/11/2026 : numéro unique +32…70 (décision de Pierre, accord du pilote)

// Carte repérée par son titre.
const carte = (titre) => {
  const cartes = [...html().matchAll(/<article class="carte">([\s\S]*?)<\/article>/g)].map((m) => m[1]);
  const trouvees = cartes.filter((c) => c.includes(`<h3 class="titre">${titre}</h3>`));
  assert.equal(trouvees.length, 1, `carte « ${titre} » introuvable ou en double`);
  return trouvees[0];
};

test('P1 — logos/ccapp.svg existe et est le logo Double C validé (sha256)', () => {
  assert.ok(existsSync(join(RACINE, 'logos/ccapp.svg')), 'logos/ccapp.svg absent');
  const sha = createHash('sha256').update(readFileSync(join(RACINE, 'logos/ccapp.svg'))).digest('hex');
  assert.equal(sha, '0cb8b82bada4be3cac406b30c54e73897fbb904f693c2797e7cf15942daba356');
});

test('P2 — la carte CCAPP utilise logos/ccapp.svg ; ccapp.png absent de l\'accueil', () => {
  assert.ok(carte('CCAPP').includes('<img src="logos/ccapp.svg" alt="" width="32" height="32">'), 'CCAPP : logos/ccapp.svg attendu');
  assert.ok(!html().includes('ccapp.png'), 'index.html contient « ccapp.png »');
});

test('P3 — carte Gustavita Coach : démo en ligne et bouton vers /gustavita/', () => {
  const g = carte('Gustavita Coach');
  assert.ok(g.includes('<span class="badge en-ligne">Démo en ligne</span>'), 'Gustavita : badge');
  assert.ok(g.includes('<a class="bouton plein petit" href="https://eipdecision.be/gustavita/">Essayer la démo</a>'), 'Gustavita : bouton');
  assert.ok(!html().includes('/gustavita/app'), 'index.html contient « /gustavita/app »');
});

test('P4 — badges et prix de l\'accueil', () => {
  const source = html();
  assert.equal(compter(source, 'Démo bientôt'), 0, 'Démo bientôt');
  assert.equal(compter(source, 'Démo en ligne'), 5, 'Démo en ligne'); // 02/11/2026 : carte révision en ligne (décision de Pierre, accord du pilote)
  assert.equal(compter(source, '29,90'), 2, '29,90 (Diaspora et Gustavita, texte inchangé)');
  assert.ok(!source.includes('/gustavita/app'), 'index.html contient « /gustavita/app »');
});

test('P5 — numéro personnel absent de l\'accueil et des mentions légales', () => {
  for (const f of ['index.html', 'mentions-legales.html']) {
    const c = chiffres(lire(f));
    assert.ok(!c.includes('32470284953'), `${f} contient le numéro personnel (format international)`);
    assert.ok(!c.includes('0470284953'), `${f} contient le numéro personnel (format national)`);
  }
});

test('P6 — numéro unique présent sur l\'accueil (wa.me) et dans les mentions légales (tel:)', () => { // 02/11/2026 : numéro unique +32…70 (décision de Pierre, accord du pilote)
  assert.ok(html().includes(`href="https://wa.me/${NUMERO}${MESSAGE}"`), 'index.html : lien wa.me +32…70 absent'); // 02/11/2026 : numéro unique +32…70 (décision de Pierre, accord du pilote)
  assert.ok(lire('mentions-legales.html').includes(`href="tel:+${NUMERO}"`), 'mentions-legales.html : lien tel: +32…70 absent'); // 02/11/2026 : numéro unique +32…70 (décision de Pierre, accord du pilote)
});

// 02/11/2026 : nouveau test — numéro unique +32…70, numéros 53 et 63 retirés, message déjà rempli (décision de Pierre, accord du pilote)
test('P7 — numéro unique +32…70 avec message déjà rempli ; numéros 53 et 63 absents', () => {
  for (const f of ['index.html', 'mentions-legales.html']) {
    const c = chiffres(lire(f));
    assert.ok(c.includes(NUMERO), `${f} : numéro +32…70 absent`);
    for (const interdit of ['32470284953', '0470284953', '33698814363']) {
      assert.ok(!c.includes(interdit), `${f} contient un numéro retiré (…${interdit.slice(-2)})`);
    }
  }
  const wa = html().match(/href="(https:\/\/wa\.me\/[^"]*)"/g) || [];
  assert.equal(wa.length, 2, 'index.html : deux liens wa.me attendus (contact et partenaires)'); // 02/11/2026 : bandeau partenaires (décision de Pierre, accord du pilote)
  assert.equal(wa.filter((l) => l.includes(MESSAGE)).length, 1, 'index.html : message déjà rempli absent ou différent'); // 02/11/2026 : bandeau partenaires (décision de Pierre, accord du pilote)
});
