// Tests de la page d'accueil EIP — JavaScript pur, aucune dépendance (node --test tests/)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..');
const lire = (f) => readFileSync(join(RACINE, f), 'utf8');
const html = () => lire('index.html');

// Texte visible normalisé : balises retirées, espaces insécables → espace, espaces multiples réduits.
const normaliser = (s) => s
  .replace(/<[^>]*>/g, ' ')
  .replace(/&nbsp;/g, ' ')
  .replace(/ /g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const compter = (texte, motif) => texte.split(motif).length - 1;

// Liens <a> : href et texte normalisé.
const liens = (source) => [...source.matchAll(/<a\b[^>]*\bhref="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g)]
  .map(([, href, contenu]) => ({ href, texte: normaliser(contenu) }));

test('A1 — les 5 sections existent, dans l\'ordre', () => {
  const ids = [...html().matchAll(/<section\b[^>]*\bid="([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(ids, ['accueil', 'solutions', 'methode', 'annonceurs', 'contact']);
});

test('A2 — le menu contient les 4 liens attendus', () => {
  const nav = html().match(/<nav\b[^>]*>([\s\S]*?)<\/nav>/);
  assert.ok(nav, '<nav> absent');
  assert.deepEqual(liens(nav[1]), [
    { href: '#solutions', texte: 'Nos solutions' },
    { href: '#methode', texte: 'Notre méthode' },
    { href: '#annonceurs', texte: 'Annonceurs' },
    { href: '#contact', texte: 'Nous écrire' },
  ]);
});

test('A3 — textes exacts présents', () => {
  const texte = normaliser(html());
  const attendus = [
    'Éditeur de solutions numériques',
    'Des applis simples, pour la vie de tous les jours.',
    'EIP conçoit et édite ses propres applications, en Europe et en Afrique. Chacune s\'essaie gratuitement avant d\'acheter.',
    'Essayer nos démos',
    'Devenir partenaire',
    'Touchez une démo pour l\'essayer sur votre téléphone. Une démo s\'ouvre seulement quand elle est vraiment prête.',
    'CCAPP',
    'Afrivita Diaspora',
    'Gustavita Coach',
    'Appli de révision en maths',
    'Commerces · Cameroun',
    'Bien-être · Cameroun',
    'Bien-être · Europe',
    'Bien-être · Belgique et France',
    'Éducation · Belgique et France',
    'Le carnet de crédit numérique des boutiques de quartier. Le crédit, plus simple pour tous.',
    'Afrivita, ton coach : bouge, mange léger, retrouve ta forme.',
    'Afrivita pour toi en Europe, ou à offrir à un parent. 29,90 € pour un an.',
    'Bouger sans salle de sport, bien manger sans se priver. 29,90 € pour un an.',
    'Il ne passe pas l\'examen à la place de votre enfant. Il lui donne l\'entraînement.',
    'Vous essayez d\'abord',
    'Chaque appli a sa démo gratuite, sans compte.',
    'Vous nous écrivez',
    'La vente se fait directement avec EIP, sur WhatsApp ou par e-mail.',
    'L\'appli s\'améliore',
    'Vos retours nous aident à l\'améliorer.',
    'Annonceurs : soyez le partenaire du mois',
    'Votre logo, votre slogan et votre contact, en haut de l\'accueil de nos applis. Nous sélectionnons des annonceurs cohérents avec chaque appli.',
    'Réserver un espace',
    'WhatsApp Belgique',
    '+32 470 28 49 53',
    'WhatsApp France',
    '+33 6 98 81 43 63',
    'pierre@eipdecision.be',
    'EIP — Economic Intelligence Partners · BCE 0839.627.446',
    'Mentions légales',
  ];
  for (const a of attendus) {
    assert.ok(texte.includes(a), `texte absent : « ${a} »`);
  }
});

test('A4 — badges des démos', () => {
  const texte = normaliser(html());
  assert.equal(compter(texte, 'Démo en ligne'), 2, 'Démo en ligne');
  assert.equal(compter(texte, 'Démo bientôt'), 2, 'Démo bientôt');
  assert.equal(compter(texte, 'En préparation'), 1, 'En préparation');
});

test('A5 — 2 liens « Essayer la démo » et 3 liens « Être prévenu »', () => {
  const tous = liens(html());
  const essayer = tous.filter((l) => l.texte === 'Essayer la démo').map((l) => l.href);
  assert.deepEqual(essayer, ['https://eipdecision.be/ccapp/', 'https://eipdecision.be/afrivita/']);
  const prevenu = tous.filter((l) => l.texte === 'Être prévenu').map((l) => l.href);
  assert.deepEqual(prevenu, ['#contact', '#contact', '#contact']);
});

test('A6 — liens de contact et mentions légales présents', () => {
  const hrefs = liens(html()).map((l) => l.href);
  for (const h of ['https://wa.me/32470284953', 'https://wa.me/33698814363', 'mailto:pierre@eipdecision.be', 'mentions-legales.html']) {
    assert.ok(hrefs.includes(h), `lien absent : ${h}`);
  }
});

test('A7 — aucune trace de l\'ancienne page', () => {
  const source = html();
  for (const interdit of ['Zéro Oubli', 'Ombessa', 'Squad', '€ HT', '[', 'Opportunity Intelligence', '32483142070', '483 14 20 70']) {
    assert.ok(!source.includes(interdit), `index.html contient « ${interdit} »`);
  }
});

test('A8 — l\'ancienne page est archivée', () => {
  const chemin = 'archives/index-avant-relooking.html';
  assert.ok(existsSync(join(RACINE, chemin)), `${chemin} absent`);
  assert.ok(lire(chemin).includes('Zéro Oubli'), `${chemin} ne contient pas « Zéro Oubli »`);
});
