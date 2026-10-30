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
    // 30/10/2026 : texte de la carte Afrivita Diaspora remplacé par le texte exact décidé par Pierre.
    'Tu vis en Europe ? Offre Afrivita à un membre de ta famille au Cameroun, ou prends-le pour toi. 29,90 € pour un an. Les autres pays d\'Afrique suivront.',
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
  // 30/10/2026 : Afrivita Diaspora passe de « Démo bientôt » à « Démo en ligne » (décision de Pierre) → 3 et 1.
  assert.equal(compter(texte, 'Démo en ligne'), 3, 'Démo en ligne');
  assert.equal(compter(texte, 'Démo bientôt'), 1, 'Démo bientôt');
  assert.equal(compter(texte, 'En préparation'), 1, 'En préparation');
});

// 30/10/2026 : titre passé de « 2 … et 3 … » à « 3 … et 2 … » : la carte Afrivita Diaspora a désormais une démo.
test('A5 — 3 liens « Essayer la démo » et 2 liens « Être prévenu »', () => {
  const tous = liens(html());
  const essayer = tous.filter((l) => l.texte === 'Essayer la démo').map((l) => l.href);
  // 30/10/2026 : Afrivita (Cameroun) → /afrivita/cameroun/ ; Afrivita Diaspora → /afrivita/ (décisions de Pierre).
  assert.deepEqual(essayer, ['https://eipdecision.be/ccapp/', 'https://eipdecision.be/afrivita/cameroun/', 'https://eipdecision.be/afrivita/']);
  const prevenu = tous.filter((l) => l.texte === 'Être prévenu').map((l) => l.href);
  // 30/10/2026 : un « Être prévenu » de moins (celui d'Afrivita Diaspora).
  assert.deepEqual(prevenu, ['#contact', '#contact']);
});

// 30/10/2026 : nouveau test — chaque carte Afrivita, carte par carte (titre, marché, badge, bouton, lien).
// Afrivita Diaspora a la même présentation que la carte CCAPP (badge « en-ligne », bouton « plein petit »).
test('A9 — cartes Afrivita et Afrivita Diaspora', () => {
  const cartes = [...html().matchAll(/<article class="carte">([\s\S]*?)<\/article>/g)].map((m) => m[1]);
  const carte = (titre) => {
    const trouvees = cartes.filter((c) => c.includes(`<h3 class="titre">${titre}</h3>`));
    assert.equal(trouvees.length, 1, `carte « ${titre} » introuvable ou en double`);
    return trouvees[0];
  };
  const cameroun = carte('Afrivita');
  assert.ok(cameroun.includes('<p class="marche">Bien-être · Cameroun</p>'), 'Afrivita : marché');
  assert.ok(cameroun.includes('href="https://eipdecision.be/afrivita/cameroun/"'), 'Afrivita : lien');

  const diaspora = carte('Afrivita Diaspora');
  assert.ok(diaspora.includes('<p class="marche">Bien-être · Europe</p>'), 'Diaspora : marché');
  assert.ok(diaspora.includes('<span class="badge en-ligne">Démo en ligne</span>'), 'Diaspora : badge');
  assert.ok(diaspora.includes('<a class="bouton plein petit" href="https://eipdecision.be/afrivita/">Essayer la démo</a>'), 'Diaspora : bouton');
  assert.equal(normaliser(diaspora.match(/<p class="texte">([\s\S]*?)<\/p>/)[1]),
    'Tu vis en Europe ? Offre Afrivita à un membre de ta famille au Cameroun, ou prends-le pour toi. 29,90 € pour un an. Les autres pays d\'Afrique suivront.',
    'Diaspora : texte exact');
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
