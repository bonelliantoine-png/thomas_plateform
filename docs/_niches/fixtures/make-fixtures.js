/* Génère des données factices au format v2 à partir de la v1 (199 niches), répliquées jusqu'à ≈ 1 000.
   Sert uniquement au développement tant que data/*.json n'est pas livré. Usage : node fixtures/make-fixtures.js */
'use strict';
const fs = require('fs'), path = require('path');
const NI = require('../v1-source/niches.js'), SEC = require('../lib/sectors.js');
let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const pick = (a, k) => { const c = a.slice(), o = []; while (o.length < k && c.length) o.push(c.splice(Math.floor(rnd() * c.length), 1)[0]); return o; };
const D = {
  cuisine: [['cafe', 'bar', 'cave', 'cuisine-pro', 'coffee-shop', 'restaurant'], ['gout', 'odorat', 'geste'], ['plat', 'boisson'], ['cafe', 'boisson', 'convivial', 'gout', 'fermentation', 'apero']],
  musique: [['studio-musique', 'bar', 'tiers-lieu', 'domicile'], ['ouie', 'emotion', 'geste'], ['son', 'performance'], ['vinyle', 'son', 'ecoute', 'soiree', 'rythme']],
  image: [['cafe', 'galerie', 'parc', 'tiers-lieu'], ['vue', 'geste'], ['photo', 'objet'], ['dessin', 'photo', 'ville', 'carnet', 'couleur']],
  artisanat: [['atelier-artisan', 'tiers-lieu', 'fablab', 'cafe'], ['toucher', 'geste'], ['objet'], ['fait-main', 'textile', 'geste', 'reemploi', 'cadeau']],
  maison: [['fablab', 'tiers-lieu', 'domicile', 'boutique'], ['geste', 'reflexion'], ['objet', 'service'], ['reparation', 'outil', 'reemploi', 'maison']],
  nature: [['jardin-partage', 'parc', 'nature', 'tiers-lieu'], ['toucher', 'odorat', 'vue'], ['plante', 'savoir'], ['plante', 'jardin', 'saison', 'cueillette', 'quartier']],
  sport: [['parc', 'salle-sport', 'studio-danse'], ['mouvement'], ['performance'], ['corps', 'souffle', 'dehors', 'equipe']],
  pleinair: [['nature', 'parc', 'montagne', 'bateau'], ['mouvement', 'vue'], ['photo', 'savoir'], ['dehors', 'balade', 'carte', 'aventure']],
  scene: [['studio-danse', 'salle-polyvalente', 'bar'], ['mouvement', 'emotion', 'parole'], ['performance'], ['scene', 'corps', 'rythme', 'impro']],
  parole: [['cafe', 'librairie', 'mediatheque', 'en-ligne'], ['parole', 'reflexion'], ['texte', 'performance'], ['recit', 'langue', 'ecriture', 'voix']],
  jeux: [['bar', 'cafe', 'tiers-lieu'], ['reflexion', 'parole'], ['jeu', 'rencontre'], ['enigme', 'strategie', 'jeu', 'convivial']],
  tech: [['tiers-lieu', 'mediatheque', 'en-ligne', 'fablab'], ['reflexion', 'geste'], ['service', 'video'], ['ia', 'code', 'numerique', 'creation']],
  bienetre: [['studio-danse', 'parc', 'salle-polyvalente'], ['mouvement', 'emotion', 'odorat'], ['savoir'], ['souffle', 'calme', 'corps', 'soin']],
  style: [['boutique', 'atelier-artisan', 'domicile'], ['vue', 'toucher'], ['vetement', 'objet'], ['mode', 'couleur', 'textile', 'reemploi']],
  savoirs: [['mediatheque', 'librairie', 'parc', 'galerie'], ['reflexion', 'parole'], ['savoir', 'carte'], ['histoire', 'quartier', 'science', 'balade']],
  pratique: [['tiers-lieu', 'mediatheque', 'domicile'], ['reflexion', 'geste'], ['service', 'savoir'], ['budget', 'quotidien', 'outil', 'maison']],
  social: [['tiers-lieu', 'salle-polyvalente', 'cafe'], ['parole', 'emotion'], ['rencontre', 'service'], ['quartier', 'convivial', 'engagement', 'rencontre']]
};
const MOM = ['semaine-midi', 'semaine-soir', 'weekend-matin', 'weekend-apres-midi', 'weekend-soir', 'journee', 'vacances'];
const PUB = ['etudiants', 'jeunes-actifs', 'couples', 'familles', 'enfants', 'ados', 'seniors', 'entreprises', 'touristes', 'expatries', 'parents', 'neurodivers'];
const LT = ['Découverte', 'Bases', 'Consolider', 'Maîtriser', 'Référent'];
const FMT = [['atelier', '1 h 30', '4-8'], ['atelier', '2 h', '4-8'], ['arc', '3 × 2 h', '4-6'], ['stage', '1 journée', '4-8'], ['coaching', '4 × 2 h', '1-3']];
const domSec = {}; SEC.forEach(s => s.dom.forEach(d => domSec[d[0]] = [s.id, d[1]]));
const out = {};
SEC.forEach(s => out[s.id] = { sector: s.id, categories: s.dom.map(d => ({ id: d[0], name: d[1], desc: 'Catégorie factice.', subcategories: [{ id: d[0] + '.a', name: d[1] + ' · pratique', desc: '' }, { id: d[0] + '.b', name: d[1] + ' · approfondir', desc: '' }] })), niches: [] });
const ids = new Set();
for (let rep = 0; rep < 5; rep++) NI.forEach((r, i) => {
  const [dom, name, k, s] = r; const [sec] = domSec[dom]; const sc = s.split('').map(Number);
  const o = out[sec]; if (o.niches.length >= 60) return;
  let id = (name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40)) + (rep ? '-v' + rep : '');
  if (ids.has(id)) return; ids.add(id);
  const d = D[sec]; const j = v => Math.max(0, Math.min(5, v + (rep ? Math.round(rnd() * 2 - 1) : 0)));
  const base = 15 + Math.round(sc[2] * 6 + rnd() * 10);
  o.niches.push({
    id, name: name + (rep ? ' · variante ' + rep : ''), sector: sec, category: dom, subcategory: dom + (i % 2 ? '.b' : '.a'),
    desc: 'Niche factice dérivée de la v1.', audience: 'Public factice', skills: k.split(' | ').slice(0, 5), appSkills: [],
    levels: LT.map((t, n) => ({ n: n + 1, title: t + ' · ' + name.slice(0, 30), goal: 'Objectif factice du palier ' + (n + 1), format: FMT[n][0], duration: FMT[n][1], group: FMT[n][2], price: [Math.round(base * (1 + n * 0.6)), Math.round(base * (1 + n * 0.6) * 1.5)] })),
    scores: { demand: j(sc[0]), trend: j(sc[1]), wtp: j(sc[2]), space: j(sc[3]), community: j(sc[4]), format: j(sc[5]), supply: j(sc[6]), hostIncome: j(sc[7]), regulatory: j(sc[8]), cost: Math.round(1 + rnd() * 4), local: 4, online: Math.round(rnd() * 3) },
    venues: pick(d[0], 2), moments: pick(MOM, 2), publics: pick(PUB, 3), senses: pick(d[1], 2), outputs: pick(d[2], 1), energy: ['calme', 'modere', 'intense'][Math.floor(rnd() * 3)],
    mixTags: pick(d[3], 3), competitors: ['Concurrent factice'], regulated: sc[8] < 3 ? 'securite' : null,
    verdict: ['prioritaire', 'a-tester', 'plus-tard', 'ecarter'][Math.min(3, Math.max(0, 4 - Math.round((sc[5] + sc[0] + sc[2]) / 3)))], why: 'Justification factice.', confidence: 'hypothese'
  });
});
let t = 0; for (const k in out) { fs.writeFileSync(path.join(__dirname, k + '.json'), JSON.stringify(out[k])); t += out[k].niches.length; }
console.log('fixtures', t);
