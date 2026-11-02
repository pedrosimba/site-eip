// Lot « Bandeau partenaires » (02/11/2026) — section « Devenez partenaire EIP », même style que le bandeau Annonceurs.
// JavaScript pur, aucune dépendance (node --test 'tests/**/*.test.mjs').
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = () => readFileSync(join(RACINE, 'index.html'), 'utf8');

const TITRE = 'Devenez partenaire EIP';
const TEXTE = 'En signant le contrat partenaire, vous détenez une licence d\'exploitation de l\'application de votre choix et la proposez autour de vous.';
const BOUTON = 'Parlons-en sur WhatsApp';
const LIEN = 'https://wa.me/32483142070?text=Bonjour%20EIP%2C%20je%20souhaite%20devenir%20partenaire.';

// Section repérée par son id (du <section> jusqu'au </section> suivant).
const section = (source, id) => {
  const debut = source.indexOf(`<section id="${id}"`);
  assert.notEqual(debut, -1, `section #${id} absente`);
  return source.slice(debut, source.indexOf('</section>', debut) + '</section>'.length);
};
const classes = (bloc) => new Set([...bloc.matchAll(/\bclass="([^"]*)"/g)].flatMap((m) => m[1].split(/\s+/)).filter(Boolean));
const texte = (s) => s.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();

test('B1 — une seule section #partenaires, après la dernière carte « Nos solutions » et avant « Notre méthode »', () => {
  const source = html();
  assert.equal(source.split('<section id="partenaires"').length - 1, 1, 'une seule section id="partenaires" attendue');
  const position = source.indexOf('<section id="partenaires"');
  const solutions = section(source, 'solutions');
  const finCartes = source.indexOf(solutions) + solutions.lastIndexOf('</article>');
  assert.ok(solutions.includes('</article>'), 'cartes « Nos solutions » absentes');
  assert.ok(position > finCartes, 'la section doit suivre la dernière carte « Nos solutions »');
  assert.ok(position > source.indexOf(solutions) + solutions.length - 1, 'la section doit être hors de #solutions');
  assert.ok(position < source.indexOf('<section id="methode"'), 'la section doit précéder « Notre méthode »');
});

test('B2 — titre, texte et bouton exacts dans la section', () => {
  const s = texte(section(html(), 'partenaires'));
  for (const t of [TITRE, TEXTE, BOUTON]) assert.ok(s.includes(t), `texte absent : « ${t} »`);
});

test('B3 — le bouton de la section pointe vers WhatsApp avec le message partenaire', () => {
  const liens = [...section(html(), 'partenaires').matchAll(/<a\b[^>]*\bhref="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g)];
  assert.equal(liens.length, 1, 'un seul lien attendu dans la section');
  assert.equal(liens[0][1], LIEN);
  assert.equal(texte(liens[0][2]), BOUTON);
});

test('B4 — le bouton « Devenir partenaire » du haut de page pointe vers #partenaires', () => {
  const haut = [...section(html(), 'accueil').matchAll(/<a\b[^>]*\bhref="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g)]
    .filter((m) => texte(m[2]) === 'Devenir partenaire').map((m) => m[1]);
  assert.deepEqual(haut, ['#partenaires']);
});

test('B5 — la section n\'utilise que des classes du bandeau Annonceurs', () => {
  const source = html();
  const permises = classes(section(source, 'annonceurs'));
  const utilisees = [...classes(section(source, 'partenaires'))];
  assert.ok(utilisees.length > 0, 'aucune classe dans la section');
  for (const c of utilisees) assert.ok(permises.has(c), `classe absente du bandeau Annonceurs : ${c}`);
});

test('B6 — les 4 sélecteurs du bandeau Annonceurs couvrent aussi #partenaires', () => {
  const css = html().match(/<style>([\s\S]*?)<\/style>/)[1];
  for (const [a, p] of [['#annonceurs', '#partenaires'], ['#annonceurs .boite', '#partenaires .boite'], ['#annonceurs h2', '#partenaires h2'], ['#annonceurs p', '#partenaires p']]) {
    assert.ok(css.includes(`\n${a},${p}{`), `sélecteur « ${a},${p} » absent`);
  }
});
