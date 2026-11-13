/* Validateur des fichiers de niches v2. Usage : node docs/_niches/check.js [secteur ...] (sans argument : tous) */
'use strict';
const fs = require('fs'), path = require('path');
const DIR = path.join(__dirname, 'data');
const w = {}; for (const f of ['taxonomy-a.js', 'taxonomy-b.js']) new Function('window', fs.readFileSync(path.join(__dirname, '../../app/js/data', f), 'utf8'))(w);
const APP = new Set(w.CORDES_DATA.skills.map(s => s.id));
const SECTORS = 'cuisine musique image artisanat maison nature sport pleinair scene parole jeux tech bienetre style savoirs pratique social'.split(' ');
const L = {
  format: 'atelier arc cercle stage chantier coaching enligne sortie', venues: 'cafe coffee-shop bar cave restaurant cuisine-pro studio-musique studio-danse salle-polyvalente atelier-artisan fablab tiers-lieu mediatheque librairie galerie parc jardin-partage nature domicile boutique salle-sport ecole entreprise en-ligne bateau montagne',
  moments: 'semaine-midi semaine-soir weekend-matin weekend-apres-midi weekend-soir journee vacances', publics: 'etudiants jeunes-actifs couples familles enfants ados seniors entreprises touristes expatries parents neurodivers',
  senses: 'gout odorat ouie vue toucher geste mouvement parole reflexion emotion', outputs: 'plat boisson objet photo video son performance texte savoir service plante vetement jeu carte rencontre',
  energy: 'calme modere intense', regulated: 'sport alcool alimentaire enfants sante securite animaux droit', verdict: 'prioritaire a-tester plus-tard ecarter', confidence: 'source estimation hypothese'
};
for (const k in L) L[k] = new Set(L[k].split(' '));
const SC = 'demand trend wtp space community format supply hostIncome regulatory cost local online'.split(' ');
const want = process.argv.slice(2).length ? process.argv.slice(2) : SECTORS;
let errs = [], total = 0; const allIds = new Map();
for (const sec of want) {
  const f = path.join(DIR, sec + '.json');
  if (!fs.existsSync(f)) { errs.push(sec + ' : fichier absent'); continue; }
  let d; try { d = JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { errs.push(sec + ' : JSON invalide ' + e.message); continue; }
  const E = m => errs.push(sec + ' · ' + m);
  if (d.sector !== sec) E('sector incorrect');
  const cats = new Map(), subs = new Map();
  (d.categories || []).forEach(c => { cats.set(c.id, c); if (!c.id.startsWith(sec + '.')) E('catégorie hors préfixe ' + c.id); (c.subcategories || []).forEach(s => { subs.set(s.id, c.id); if (!s.id.startsWith(c.id + '.')) E('sous-catégorie hors préfixe ' + s.id); }); });
  if (cats.size < 4 || cats.size > 8) E('catégories : ' + cats.size + ' (4 à 8)');
  const n = d.niches || []; total += n.length;
  if (n.length < 55 || n.length > 70) E('niches : ' + n.length + ' (55 à 70)');
  const perSub = {};
  n.forEach(x => {
    const id = x.id || '?'; const e = m => E(id + ' : ' + m);
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(id)) e('id non kebab-case');
    if (allIds.has(id)) e('id en double (' + allIds.get(id) + ')'); allIds.set(id, sec);
    for (const k of ['name', 'desc', 'audience', 'why']) if (!x[k] || typeof x[k] !== 'string') e('champ ' + k);
    if (x.desc && x.desc.length > 120) e('desc > 120');
    if (x.sector !== sec) e('sector');
    if (!cats.has(x.category)) e('catégorie inconnue ' + x.category);
    if (subs.get(x.subcategory) !== x.category) e('sous-catégorie incohérente ' + x.subcategory);
    perSub[x.subcategory] = (perSub[x.subcategory] || 0) + 1;
    if (!Array.isArray(x.skills) || x.skills.length < 2 || x.skills.length > 6) e('skills 2 à 6');
    (x.appSkills || []).forEach(s => { if (!APP.has(s)) e('appSkill inconnue ' + s); });
    if (!Array.isArray(x.levels) || x.levels.length !== 5) e('5 niveaux requis');
    else x.levels.forEach((l, i) => { if (l.n !== i + 1) e('niveau ' + (i + 1) + ' mal numéroté'); if (!L.format.has(l.format)) e('format ' + l.format); for (const k of ['title', 'goal', 'duration', 'group']) if (!l[k]) e('niveau ' + l.n + ' champ ' + k); if (l.goal && l.goal.length > 110) e('goal > 110 (n' + l.n + ')'); if (!Array.isArray(l.price) || l.price.length !== 2 || !(l.price[0] <= l.price[1])) e('price n' + l.n); });
    SC.forEach(k => { const v = x.scores && x.scores[k]; if (!Number.isInteger(v) || v < 0 || v > 5) e('score ' + k); });
    if (x.scores && Object.keys(x.scores).some(k => !SC.includes(k))) e('score inattendu (aucun critère fondateur)');
    for (const k of ['venues', 'moments', 'publics', 'senses', 'outputs']) { if (!Array.isArray(x[k]) || !x[k].length) e(k + ' vide'); else x[k].forEach(v => { if (!L[k].has(v)) e(k + ' inconnu ' + v); }); }
    if (!L.energy.has(x.energy)) e('energy');
    if (!Array.isArray(x.mixTags) || x.mixTags.length < 3 || x.mixTags.length > 7) e('mixTags 3 à 7');
    if (x.regulated !== null && !L.regulated.has(x.regulated)) e('regulated');
    if (!L.verdict.has(x.verdict)) e('verdict'); if (!L.confidence.has(x.confidence)) e('confidence');
    const txt = JSON.stringify(x); if (/fondateur|antoine/i.test(txt)) e('mention fondateur interdite'); if (/ — | – /.test(txt)) e('tiret d’incise');
  });
  subs.forEach((c, s) => { if (!perSub[s]) E('sous-catégorie vide ' + s); });
  console.log(sec.padEnd(10), 'catégories', cats.size, '· sous-catégories', subs.size, '· niches', n.length);
}
console.log('Total niches :', total);
if (errs.length) { console.log('\n' + errs.length + ' erreur(s) :'); errs.slice(0, 80).forEach(e => console.log('  ' + e)); process.exit(1); } else console.log('0 erreur');
