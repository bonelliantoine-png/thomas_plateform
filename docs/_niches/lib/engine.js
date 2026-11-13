/* Moteur partagé de l'étude des niches v2 : notation, parades, mixes.
   Chargé par build.js (Node) et embarqué tel quel dans niches.html (navigateur). Aucun critère fondateur. */
(function (root) {
'use strict';
var E = {};

/* ───── notation ───── */
E.CRIT = [
  ['demand', 'Demande', 'Taille de la demande grand public. 5 = plus d’un million d’intéressés en France', 14],
  ['trend', 'Tendance', 'Dynamique de la pratique et de l’offre. 5 = forte vogue', 8],
  ['wtp', 'Propension à payer', 'Prix observés, achat cadeau, budget entreprise. 5 = prix de marché élevés', 10],
  ['space', 'Espace concurrentiel', '5 = peu d’offre de qualité au format court', 8],
  ['community', 'Communauté', 'Densité de clubs, groupes, cercles naturels', 7],
  ['format', 'Aptitude au format', 'Résultat en 1 h, montrable, peu de matériel, on y revient', 16],
  ['supply', 'Vivier d’hôtes', 'Beaucoup de gens de niveau 2 ou plus capables de transmettre', 10],
  ['hostIncome', 'Revenu de l’hôte', 'Potentiel de revenu pour un hôte, séances d’équipe', 6],
  ['regulatory', 'Cadre réglementaire', '5 = aucun frein (diplôme, alcool, hygiène, sécurité)', 8],
  ['cost', 'Coût', '5 = matériel et lieu peu coûteux', 5],
  ['local', 'Présentiel de quartier', 'Aptitude à une séance en lieu partenaire proche', 6],
  ['online', 'Distanciel', 'Aptitude à une séance en ligne', 2]
];
E.KEYS = E.CRIT.map(function (c) { return c[0]; });
E.W0 = E.CRIT.map(function (c) { return c[3]; });
E.score = function (s, W) { var t = 0, sw = 0; for (var i = 0; i < E.KEYS.length; i++) { t += W[i] * s[E.KEYS[i]] / 5; sw += W[i]; } return sw ? t * 100 / sw : 0; };
E.scoreNoWtp = function (s, W) { var w = W.slice(); w[2] = 0; return E.score(s, w); };
/* La parade compte pour moitié : propension effective = propension + 0,5 × (portée de la parade - propension), risque d'exécution oblige. */
E.effWtp = function (wtp, lift) { return lift > wtp ? wtp + 0.5 * (lift - wtp) : wtp; };
E.scoreWith = function (s, W, wtp) { var o = {}; for (var k in s) o[k] = s[k]; o.wtp = Math.max(s.wtp, wtp); return E.score(o, W); };

E.LEVELS = [
  [1, 'Je découvre', 'A fait une première séance, connaît les gestes de base', 'Personne. Un hôte de niveau 2 l’accueille'],
  [2, 'Bases acquises', 'Fait seul un résultat simple et reproductible', 'Anime les ateliers de niveau 1'],
  [3, 'Je consolide', 'Régulier, varie, corrige ses erreurs', 'Anime les ateliers de niveau 2'],
  [4, 'Je maîtrise', 'Résultat sûr, personnel, explique le pourquoi', 'Anime les ateliers de niveau 3'],
  [5, 'Référent', 'Niveau avancé reconnu, crée ses méthodes', 'Anime le niveau 4 et forme les hôtes']
];

/* utilitaires */
E.mid = function (p) { return (p[0] + p[1]) / 2; };
E.gmax = function (g) { var m = String(g).match(/(\d+)\D*(\d+)?/); return m ? +(m[2] || m[1]) : 6; };
E.gmin = function (g) { var m = String(g).match(/(\d+)/); return m ? +m[1] : 2; };
E.minutes = function (d) {
  d = String(d); var t = 0, m;
  if (/journ/.test(d)) return /demi/.test(d) ? 210 : 360;
  var mult = 1; if ((m = d.match(/(\d+)\s*[×x]/))) { mult = +m[1]; d = d.slice(d.indexOf(m[0]) + m[0].length); }
  if ((m = d.match(/(\d+)\s*h\s*(\d+)?/))) t = +m[1] * 60 + (+m[2] || 0); else if ((m = d.match(/(\d+)\s*min/))) t = +m[1];
  return (t || 90) * mult;
};
function inter(a, b) { var o = []; for (var i = 0; i < a.length; i++) if (b.indexOf(a[i]) >= 0) o.push(a[i]); return o; }
function uni(a, b) { var o = a.slice(); for (var i = 0; i < b.length; i++) if (o.indexOf(b[i]) < 0) o.push(b[i]); return o; }
E.inter = inter;
E.r5 = function (x) { return Math.max(0, Math.round(x / 5) * 5); };

/* ───── libellés ───── */
E.LBL = {
  venues: { 'cafe': 'Café', 'coffee-shop': 'Coffee shop', 'bar': 'Bar', 'cave': 'Cave', 'restaurant': 'Restaurant', 'cuisine-pro': 'Cuisine pro', 'studio-musique': 'Studio de musique', 'studio-danse': 'Studio de danse', 'salle-polyvalente': 'Salle polyvalente', 'atelier-artisan': 'Atelier d’artisan', 'fablab': 'Fablab', 'tiers-lieu': 'Tiers-lieu', 'mediatheque': 'Médiathèque', 'librairie': 'Librairie', 'galerie': 'Galerie', 'parc': 'Parc', 'jardin-partage': 'Jardin partagé', 'nature': 'Nature', 'domicile': 'Domicile', 'boutique': 'Boutique', 'salle-sport': 'Salle de sport', 'ecole': 'École', 'entreprise': 'Entreprise', 'en-ligne': 'En ligne', 'bateau': 'Bateau', 'montagne': 'Montagne' },
  moments: { 'semaine-midi': 'Midi en semaine', 'semaine-soir': 'Soir en semaine', 'weekend-matin': 'Matin le week-end', 'weekend-apres-midi': 'Après-midi le week-end', 'weekend-soir': 'Soir le week-end', 'journee': 'Journée', 'vacances': 'Vacances' },
  publics: { 'etudiants': 'Étudiants', 'jeunes-actifs': 'Jeunes actifs', 'couples': 'Couples', 'familles': 'Familles', 'enfants': 'Enfants', 'ados': 'Ados', 'seniors': 'Seniors', 'entreprises': 'Entreprises', 'touristes': 'Touristes', 'expatries': 'Expatriés', 'parents': 'Parents', 'neurodivers': 'Neurodivers' },
  senses: { 'gout': 'goût', 'odorat': 'odorat', 'ouie': 'ouïe', 'vue': 'vue', 'toucher': 'toucher', 'geste': 'geste', 'mouvement': 'mouvement', 'parole': 'parole', 'reflexion': 'réflexion', 'emotion': 'émotion' },
  outputs: { 'plat': 'un plat', 'boisson': 'une boisson', 'objet': 'un objet', 'photo': 'des photos', 'video': 'une vidéo', 'son': 'un son', 'performance': 'une performance', 'texte': 'un texte', 'savoir': 'un savoir', 'service': 'un service rendu', 'plante': 'une plante', 'vetement': 'un vêtement', 'jeu': 'un jeu', 'carte': 'une carte', 'rencontre': 'des rencontres' },
  energy: { 'calme': 'Calme', 'modere': 'Modéré', 'intense': 'Intense' },
  format: { 'atelier': 'Atelier', 'arc': 'Arc de 3 séances', 'cercle': 'Cercle', 'stage': 'Stage', 'chantier': 'Chantier', 'coaching': 'Coaching', 'enligne': 'En ligne', 'sortie': 'Sortie' },
  verdict: { 'prioritaire': ['Prioritaire', 'int'], 'a-tester': ['À tester', 'sent'], 'plus-tard': ['Plus tard', 'wait'], 'ecarter': ['Écarter', 'no'] },
  regulated: { 'sport': 'Éducateur sportif diplômé', 'alcool': 'Alcool', 'alimentaire': 'Hygiène alimentaire', 'enfants': 'Accueil de mineurs', 'sante': 'Santé', 'securite': 'Sécurité', 'animaux': 'Animaux', 'droit': 'Droit' }
};

/* ───── parades ───── */
/* Éligibilité et adéquation (0..1) de chaque parade pour une niche. P = catalogue (lib/parades.js). */
var COMPTOIR = ['cafe', 'coffee-shop', 'bar', 'cave', 'restaurant', 'librairie', 'boutique'];
var DEHORS = ['parc', 'nature', 'jardin-partage', 'montagne', 'bateau', 'galerie'];
var PUBLIC_LIEUX = ['mediatheque', 'salle-polyvalente', 'tiers-lieu', 'parc', 'jardin-partage', 'ecole'];
var CULTURE = ['image', 'musique', 'scene', 'parole', 'savoirs', 'artisanat', 'tech', 'jeux'];
function has(a, b) { return inter(a || [], b).length > 0; }
function lvMax(n, from) { var m = 0; for (var i = from - 1; i < 5; i++) m = Math.max(m, n.levels[i].price[1]); return m; }
E.FIT = {
  'duo-premium': function (n, ctx) { return ctx && ctx.premium ? Math.max(0, Math.min(1, (ctx.premium.s - 70) / 25)) : 0.2; },
  'pass-saison': function (n) { var s = n.scores; return 0.15 + (s.community + s.format + s.local) / 30 + (n.levels.some(function (l) { return l.format === 'cercle'; }) ? 0.1 : 0); },
  'echelle-freemium': function (n) { var hi = lvMax(n, 3); return hi >= 90 ? 0.25 + Math.min(0.25, hi / 1000) + n.scores.hostIncome * 0.05 : 0.15; },
  'entreprise-cse': function (n) { var e = n.publics.indexOf('entreprises') >= 0 || n.venues.indexOf('entreprise') >= 0; var soc = has(n.outputs, ['rencontre', 'jeu', 'performance', 'plat', 'boisson', 'objet']); return (e ? 0.7 : 0.25) + (soc ? 0.15 : 0) + (n.scores.format >= 4 ? 0.1 : 0) - (n.regulated === 'alcool' ? 0.1 : 0); },
  'lieu-payeur': function (n) { return has(n.venues, COMPTOIR) ? 0.75 + (has(n.outputs, ['boisson', 'plat', 'rencontre', 'jeu']) ? 0.2 : 0) : 0.1; },
  'sortie-atelier': function (n) { return has(n.venues, DEHORS) || has(n.mixTags, ['balade', 'ville', 'quartier', 'dehors', 'patrimoine', 'nature']) ? 0.7 + (has(n.moments, ['weekend-matin', 'weekend-apres-midi', 'journee']) ? 0.2 : 0) : 0.15; },
  'kit-objet': function (n) { return has(n.outputs, ['objet', 'plante', 'vetement', 'jeu', 'plat', 'boisson']) ? 0.55 + (5 - n.scores.cost) * 0.1 : 0.1; },
  'marque-partenaire': function (n) { var s = ['maison', 'artisanat', 'nature', 'sport', 'pleinair', 'style', 'tech', 'image', 'cuisine'].indexOf(n.sector) >= 0; return (s ? 0.5 : 0.2) + (has(n.outputs, ['objet', 'vetement', 'plante', 'photo']) ? 0.2 : 0) + (n.scores.cost <= 3 ? 0.15 : 0); },
  'programmation-publique': function (n) { return (has(n.venues, PUBLIC_LIEUX) ? 0.4 : 0.15) + (['savoirs', 'parole', 'social', 'tech', 'jeux', 'pratique', 'nature'].indexOf(n.sector) >= 0 ? 0.25 : 0.1) + (n.regulated ? -0.1 : 0.05); },
  'pass-culture': function (n) { var c = CULTURE.indexOf(n.sector) >= 0; var y = has(n.publics, ['ados', 'enfants', 'etudiants']); return c ? (y ? 0.85 : 0.5) : (y ? 0.3 : 0.05); },
  'prevention-sante': function (n) { var s = ['bienetre', 'sport', 'nature', 'jeux', 'pratique', 'cuisine', 'social', 'tech'].indexOf(n.sector) >= 0; var sen = n.publics.indexOf('seniors') >= 0; return (sen ? 0.55 : 0.15) + (s ? 0.3 : 0) - (n.scores.regulatory <= 2 ? 0.2 : 0) - (n.energy === 'intense' ? 0.15 : 0); },
  'bailleur-residence': function (n) { var s = ['social', 'pratique', 'maison', 'nature', 'jeux', 'cuisine', 'artisanat'].indexOf(n.sector) >= 0; return (s ? 0.35 : 0.1) + (has(n.publics, ['familles', 'seniors', 'enfants', 'parents']) ? 0.25 : 0) + (n.scores.local >= 4 ? 0.1 : 0); },
  'prix-libre': function (n) { var s = n.scores; return (s.community >= 4 ? 0.25 : 0.1) + (s.cost >= 4 ? 0.15 : 0.05) + (s.regulatory >= 4 ? 0.1 : 0) + (has(n.mixTags, ['reemploi', 'reparation', 'engagement', 'quartier', 'entraide', 'solidaire', 'benevolat', 'partage']) ? 0.3 : 0); },
  'temps-acces': function (n) { var s = n.scores; return (s.supply >= 4 ? 0.35 : 0.15) + (s.community >= 4 ? 0.15 : 0) + (s.cost >= 4 ? 0.1 : 0); },
  'preventes-restitution': function (n) { var f = n.levels.some(function (l) { return l.format === 'chantier' || l.format === 'cercle'; }); return (has(n.outputs, ['performance', 'objet', 'texte', 'video', 'son', 'plante']) ? 0.45 : 0.1) + (f ? 0.3 : 0) + (n.scores.community >= 3 ? 0.1 : 0); },
  'bon-cadeau': function (n) { return (has(n.publics, ['couples', 'touristes', 'expatries']) ? 0.35 : 0.1) + (has(n.outputs, ['objet', 'boisson', 'photo', 'plat', 'vetement']) ? 0.2 : 0) + (n.scores.trend >= 4 ? 0.1 : 0); }
};
/* Niche à faible propension mais intéressante : wtp ≤ 2 et score hors propension ≥ seuil. */
E.LOW_WTP = 2; E.LOW_MIN = 70; /* recalé par build.js sur la médiane du catalogue */
E.isLow = function (n, W) { return n.scores.wtp <= E.LOW_WTP && E.scoreNoWtp(n.scores, W || E.W0) >= E.LOW_MIN; };

/* Simulateur : revenu, hôte, marge plateforme pour une séance. */
E.simulate = function (p) {
  var R = p.n * p.price + p.tp + p.n * p.extra;
  var fees = p.price > 0 ? p.n * (p.price * 0.015 + 0.25) : 0;
  if (p.tp > 0) fees += p.tp * 0.015;
  var host = p.hFixed + p.hHead * p.n + p.hPct * R;
  var mat = p.n * p.mat + (p.venue || 0);
  var margin = R - fees - host - mat;
  return { R: R, fees: fees, host: host, mat: mat, margin: margin, hostHour: host / Math.max(0.5, p.hours || 1.5) };
};
/* Paramètres par défaut d'une parade appliquée à une niche (estimations). */
E.simDefaults = function (pid, n, ctx) {
  var l1 = n.levels[0], m1 = E.mid(l1.price), g = Math.min(12, E.gmax(l1.group)), mat = Math.max(0, (5 - n.scores.cost) * 2.5);
  var hours = Math.max(1, Math.min(4, E.minutes(l1.duration) / 60));
  var mp = ctx && ctx.premium ? E.mid(ctx.premium.n.levels[0].price) : m1 * 2;
  var l3 = E.mid(n.levels[2].price);
  var d = { n: g, price: m1, tp: 0, extra: 0, hFixed: 0, hHead: 12, hPct: 0, mat: mat, venue: 0, hours: hours };
  switch (pid) {
    case 'duo-premium': d.price = E.r5(0.6 * mp + 0.4 * m1); d.hHead = 18; d.hours = hours + 1; break;
    case 'pass-saison': d.price = 12; d.hHead = 10; break;
    case 'echelle-freemium': d.price = 5; d.extra = Math.round(0.25 * l3 * 0.3); d.hFixed = 40; d.hHead = 0; break;
    case 'entreprise-cse': d.n = Math.max(8, g); d.price = 0; d.tp = 350 + Math.max(0, d.n - 8) * 20; d.hPct = 0.4; d.hHead = 0; break;
    case 'lieu-payeur': d.price = 10; d.tp = 40; d.hPct = 0.6; d.hHead = 0; break;
    case 'sortie-atelier': d.price = E.r5(m1 + 15); d.mat = mat + 6; d.hPct = 0.5; d.hHead = 0; d.hours = hours + 1; break;
    case 'kit-objet': d.price = E.r5(Math.max(10, m1 * 0.7)); d.extra = 12; d.hHead = 10; d.hPct = 0.05; break;
    case 'marque-partenaire': d.price = 5; d.tp = 150; d.mat = 0; d.hFixed = 100; d.hHead = 0; break;
    case 'programmation-publique': d.price = 0; d.tp = 250; d.hFixed = 180; d.hHead = 0; d.mat = mat * 0.6; break;
    case 'pass-culture': d.n = 24; d.price = 0; d.tp = 360; d.hFixed = 220; d.hHead = 0; d.mat = mat * 0.5; break;
    case 'prevention-sante': d.n = 10; d.price = 0; d.tp = 200; d.hFixed = 140; d.hHead = 0; break;
    case 'bailleur-residence': d.n = 10; d.price = 0; d.tp = 220; d.hFixed = 150; d.hHead = 0; break;
    case 'prix-libre': d.price = 8; d.extra = 1; d.hPct = 0.7; d.hHead = 0; break;
    case 'temps-acces': d.price = 0; d.extra = 0; d.hHead = 0; d.hFixed = 10; d.mat = mat; break;
    case 'preventes-restitution': d.price = 0; d.tp = 280; d.hPct = 0.55; d.hHead = 0; break;
    case 'bon-cadeau': d.price = E.r5(m1 * 1.5); d.extra = Math.round(m1 * 1.5 * 0.12); d.hHead = 15; break;
  }
  return d;
};

/* ───── mixes ───── */
E.MIXW = [['comp', 'Complémentarité', 12], ['lieu', 'Lieu commun', 14], ['moment', 'Moment commun', 10], ['public', 'Public commun', 10], ['chain', 'Enchaînement des productions', 14], ['energy', 'Énergie', 6], ['lever', 'Levier de prix', 10], ['orig', 'Originalité', 16], ['coh', 'Pont de sens', 8]];
var VFAM = { 'cafe': 'c', 'coffee-shop': 'c', 'bar': 'c', 'cave': 'c', 'restaurant': 'c', 'cuisine-pro': 'k', 'studio-musique': 's', 'studio-danse': 's', 'salle-sport': 's', 'salle-polyvalente': 't', 'atelier-artisan': 'a', 'fablab': 'a', 'tiers-lieu': 't', 'mediatheque': 'm', 'librairie': 'm', 'galerie': 'm', 'parc': 'n', 'jardin-partage': 'n', 'nature': 'n', 'montagne': 'n', 'bateau': 'n', 'domicile': 'd', 'boutique': 'c', 'ecole': 'm', 'entreprise': 'e', 'en-ligne': 'o' };
var VCOMPAT = { 'c|k': 0.6, 'c|m': 0.55, 'c|t': 0.6, 'a|t': 0.75, 'm|t': 0.7, 's|t': 0.6, 'n|t': 0.4, 'n|m': 0.35, 'c|n': 0.3, 'e|t': 0.5, 'c|e': 0.4, 'e|m': 0.4, 'a|c': 0.45, 'a|m': 0.4, 'k|t': 0.55, 'd|t': 0.3, 'c|d': 0.3 };
function vpair(a, b) { if (a === b) return 1; var x = VFAM[a], y = VFAM[b]; if (!x || !y) return 0; if (x === y) return 0.8; return VCOMPAT[x < y ? x + '|' + y : y + '|' + x] || 0; }
E.venueFit = function (A, B) {
  var best = 0, v = null;
  for (var i = 0; i < A.length; i++) for (var j = 0; j < B.length; j++) { var s = vpair(A[i], B[j]); if (s > best) { best = s; v = s === 1 ? A[i] : (VFAM[A[i]] === 'c' || VFAM[A[i]] === 't' ? A[i] : B[j]); } }
  return [best, v];
};
var MADJ = { 'semaine-soir|weekend-soir': 0.6, 'weekend-apres-midi|weekend-matin': 0.6, 'journee|weekend-apres-midi': 0.6, 'journee|weekend-matin': 0.6, 'journee|vacances': 0.7, 'vacances|weekend-apres-midi': 0.5, 'semaine-midi|semaine-soir': 0.3, 'weekend-apres-midi|weekend-soir': 0.5 };
E.momentFit = function (A, B) {
  var c = inter(A, B); if (c.length) return [1, c[0]];
  var best = 0, m = null; for (var i = 0; i < A.length; i++) for (var j = 0; j < B.length; j++) { var k = A[i] < B[j] ? A[i] + '|' + B[j] : B[j] + '|' + A[i]; var s = MADJ[k] || 0; if (s > best) { best = s; m = A[i]; } }
  return [best, m];
};
var CHAIN = { 'boisson|son': 1, 'boisson|plat': 0.75, 'objet|photo': 0.8, 'photo|plat': 0.75, 'boisson|photo': 0.7, 'performance|photo': 0.75, 'photo|plante': 0.75, 'photo|vetement': 0.9, 'photo|texte': 0.9, 'son|texte': 0.85, 'carte|savoir': 0.9, 'carte|photo': 0.8, 'objet|plante': 0.85, 'plante|plat': 0.95, 'boisson|plante': 0.8, 'boisson|objet': 0.75, 'son|video': 0.9, 'photo|video': 0.7, 'performance|son': 0.9, 'performance|texte': 0.85, 'jeu|savoir': 0.95, 'boisson|jeu': 0.7, 'jeu|plat': 0.6, 'objet|texte': 0.8, 'objet|vetement': 0.7, 'savoir|plat': 0.7, 'boisson|savoir': 0.8, 'carte|jeu': 0.9, 'carte|texte': 0.8, 'objet|plat': 0.75, 'plat|texte': 0.6, 'performance|vetement': 0.75, 'performance|video': 0.85, 'savoir|texte': 0.6, 'objet|savoir': 0.55, 'objet|son': 0.7, 'photo|savoir': 0.6, 'savoir|son': 0.65, 'performance|savoir': 0.55, 'jeu|texte': 0.7, 'plante|savoir': 0.7, 'plante|texte': 0.6, 'service|savoir': 0.55, 'objet|service': 0.6, 'jeu|objet': 0.65, 'photo|son': 0.6, 'plat|son': 0.8, 'jeu|son': 0.6, 'carte|plante': 0.7, 'carte|plat': 0.5, 'savoir|video': 0.6, 'texte|video': 0.7, 'performance|plat': 0.6, 'jeu|performance': 0.7, 'objet|performance': 0.6, 'plante|vetement': 0.6, 'texte|vetement': 0.5 };
var PRODUCER = { plat: 1, boisson: 1, objet: 1, plante: 1, texte: 1, vetement: 1, carte: 1, savoir: 0.6, jeu: 0.5, service: 0.5, son: 0.4, video: 0.2, photo: 0, performance: 0.1, rencontre: 0 };
E.chainFit = function (A, B) {
  var best = 0.3, pair = null;
  for (var i = 0; i < A.length; i++) for (var j = 0; j < B.length; j++) {
    var a = A[i], b = B[j]; var s;
    if (a === 'rencontre' || b === 'rencontre') s = 0.6; else if (a === b) s = 0.4; else s = CHAIN[a < b ? a + '|' + b : b + '|' + a] || 0.3;
    if (s > best) { best = s; pair = [a, b]; }
  }
  return [best, pair];
};
var BANAL = { 'cuisine|nature': 0.6, 'cuisine|social': 0.5, 'bienetre|sport': 0.75, 'pleinair|sport': 0.7, 'musique|scene': 0.7, 'artisanat|image': 0.6, 'artisanat|style': 0.65, 'artisanat|maison': 0.55, 'maison|pratique': 0.6, 'pleinair|savoirs': 0.5, 'jeux|social': 0.5, 'parole|scene': 0.6, 'parole|savoirs': 0.55, 'image|tech': 0.5, 'musique|tech': 0.45, 'nature|pleinair': 0.65, 'bienetre|nature': 0.45, 'cuisine|pratique': 0.45, 'image|savoirs': 0.4, 'cuisine|musique': 0.3, 'cuisine|jeux': 0.35, 'bienetre|scene': 0.45, 'scene|sport': 0.5, 'bienetre|style': 0.5, 'image|style': 0.45, 'pratique|tech': 0.5, 'social|savoirs': 0.4, 'nature|savoirs': 0.45, 'jeux|tech': 0.4, 'image|pleinair': 0.4, 'nature|pratique': 0.4 };
E.banal = function (a, b) { if (a === b) return 0.85; return BANAL[a < b ? a + '|' + b : b + '|' + a] || 0.2; };
var EPREF = { indifferent: { same: 0.85, adj: 0.75, opp: 0.6 }, accord: { same: 1, adj: 0.6, opp: 0.2 }, contraste: { same: 0.3, adj: 0.7, opp: 1 } };
E.energyFit = function (a, b, pref) { var t = EPREF[pref || 'indifferent']; if (a === b) return t.same; if (a === 'modere' || b === 'modere') return t.adj; return t.opp; };

/* Score d'une paire. a, b : niches ; sa, sb : scores (0-100) ; opt.energy ∈ indifferent|accord|contraste */
E.pair = function (a, b, sa, sb, opt) {
  opt = opt || {};
  var p = {};
  var secD = a.sector !== b.sector ? 1 : (a.category !== b.category ? 0.45 : 0.15);
  var su = uni(a.senses, b.senses), si = inter(a.senses, b.senses);
  p.comp = 0.6 * secD + 0.4 * (su.length ? (su.length - si.length) / su.length : 0);
  var vf = E.venueFit(a.venues, b.venues); p.lieu = vf[0];
  var mf = E.momentFit(a.moments, b.moments); p.moment = mf[0];
  var pc = inter(a.publics, b.publics); p.public = pc.length >= 2 ? 1 : pc.length === 1 ? 0.6 : 0;
  var cf = E.chainFit(a.outputs, b.outputs); p.chain = cf[0];
  p.energy = E.energyFit(a.energy, b.energy, opt.energy);
  var wa = a.scores.wtp, wb = b.scores.wtp, hi = Math.max(wa, wb), lo = Math.min(wa, wb);
  p.lever = lo <= 2 && hi >= 4 ? 1 : Math.min(1, 0.35 * (hi - lo) / 3 + 0.55 * (wa + wb) / 10);
  p.orig = (1 - E.banal(a.sector, b.sector)) * 0.75 + 0.25 * (a.scores.space + b.scores.space) / 10;
  var tags = inter(a.mixTags, b.mixTags); p.coh = tags.length >= 2 ? 1 : tags.length === 1 ? 0.8 : (si.length ? 0.45 : 0.25);
  var fit = 0, sw = 0; E.MIXW.forEach(function (w) { fit += w[2] * p[w[0]]; sw += w[2]; }); fit = fit * 100 / sw;
  if (p.lieu === 0 && p.moment === 0) fit *= 0.55; else if (p.lieu === 0 || p.moment === 0) fit *= 0.8;
  if ((a.regulated === 'alcool' || b.regulated === 'alcool') && pc.length && pc.every(function (x) { return x === 'enfants' || x === 'ados' || x === 'familles'; })) fit *= 0.6;
  var s = 0.75 * fit + 0.25 * (sa + sb) / 2;
  return { s: s, fit: fit, p: p, venue: vf[1], moment: mf[1], publics: pc, chain: cf[1], tags: tags, senses: si };
};

/* Format généré pour une paire (ou un trio) : nom, famille, déroulé, jauge, prix, hôtes, originalité. */
E.FAMILIES = { soiree: 'Soirées', matinee: 'Matinées', sortie: 'Sorties', chantier: 'Chantiers', famille: 'Rendez-vous famille', entreprise: 'Formats entreprise', midi: 'Pauses de midi', atelier: 'Ateliers croisés' };
function short(nm) { return nm.replace(/\s*\(.*?\)\s*/g, ' ').replace(/\s*·.*$/, '').replace(/\s+/g, ' ').trim(); }
E.short = short;
E.family = function (ns, pr) {
  var pub = pr.publics || [], m = pr.moment, v = pr.venue;
  if (pub.indexOf('entreprises') >= 0 && (m === 'semaine-midi' || m === 'semaine-soir' || !m)) return 'entreprise';
  if ((pub.indexOf('familles') >= 0 || pub.indexOf('enfants') >= 0) && m && m.indexOf('weekend') === 0) return 'famille';
  if (ns.some(function (n) { return n.levels.some(function (l) { return l.format === 'chantier'; }); }) && ns.every(function (n) { return n.outputs.some(function (o) { return o === 'objet' || o === 'performance' || o === 'texte' || o === 'plante'; }); })) return 'chantier';
  if (VFAM[v] === 'n' || ns.every(function (n) { return n.levels[0].format === 'sortie'; })) return 'sortie';
  if (m === 'semaine-soir' || m === 'weekend-soir') return 'soiree';
  if (m === 'weekend-matin') return 'matinee';
  if (m === 'semaine-midi') return 'midi';
  return 'atelier';
};
var FPREFIX = { soiree: 'Soirée', matinee: 'Matinée', sortie: 'Sortie', chantier: 'Chantier', famille: 'Dimanche en famille', entreprise: 'Atelier d’équipe', midi: 'Pause de midi', atelier: 'Atelier croisé' };
E.format = function (ns, pr, scoresById) {
  var fam = E.family(ns, pr);
  /* ordre : celui qui produit passe d'abord, celui qui consomme ou montre ensuite */
  var ord = ns.slice().sort(function (x, y) { var px = Math.max.apply(null, x.outputs.map(function (o) { return PRODUCER[o] || 0; })), py = Math.max.apply(null, y.outputs.map(function (o) { return PRODUCER[o] || 0; })); return py - px; });
  var tot = 0; ns.forEach(function (n) { tot += E.minutes(n.levels[0].duration); });
  tot = Math.max(90, Math.min(fam === 'sortie' || fam === 'chantier' ? 240 : 180, Math.round(tot * 0.75 / 15) * 15));
  var core = tot - 10 - 15 - (ns.length - 1) * 10, each = Math.round(core / ns.length / 5) * 5;
  var steps = [[10, 'Accueil et tour de table, chacun dit ce qu’il vient chercher']];
  ord.forEach(function (n, i) {
    steps.push([each, short(n.name) + ' · ' + n.levels[0].goal.replace(/\.$/, '')]);
    if (i < ord.length - 1) steps.push([10, 'Pont · ' + (pr.tags && pr.tags.length ? 'on relie par le fil « ' + pr.tags[0].replace(/-/g, ' ') + ' »' : 'on passe d’un geste à l’autre') + (pr.chain ? ', ' + E.LBL.outputs[pr.chain[0]] + ' nourrit ' + E.LBL.outputs[pr.chain[1]] : '')]);
  });
  steps.push([15, 'Restitution · on montre, on photographie, on note la suite dans le passeport']);
  var g = Math.min.apply(null, ns.map(function (n) { return Math.min(12, E.gmax(n.levels[0].group)); }));
  g = Math.max(g, Math.max.apply(null, ns.map(function (n) { return E.gmin(n.levels[0].group); })));
  var mids = ns.map(function (n) { return E.mid(n.levels[0].price); }).sort(function (a, b) { return b - a; });
  var price = E.r5(mids[0] * 0.85 + (mids[1] || 0) * 0.35 + (mids[2] || 0) * 0.2);
  var name = FPREFIX[fam] + ' · ' + ord.map(function (n) { return short(n.name); }).join(' × ');
  var why = [];
  var secs = ns.map(function (n) { return n.sector; });
  if (pr.p && pr.p.orig >= 0.6) why.push('Association rare sur le marché (' + secs.join(' + ') + ')');
  if (pr.chain) why.push('Les productions s’enchaînent : ' + E.LBL.outputs[pr.chain[0]] + ' puis ' + E.LBL.outputs[pr.chain[1]]);
  if (pr.p && pr.p.lever === 1) { var lo = ns.slice().sort(function (a, b) { return a.scores.wtp - b.scores.wtp; }); why.push('Levier de prix : ' + short(lo[0].name) + ' (propension ' + lo[0].scores.wtp + '/5) portée par ' + short(lo[lo.length - 1].name) + ' (' + lo[lo.length - 1].scores.wtp + '/5)'); }
  if (pr.tags && pr.tags.length) why.push('Fil commun : ' + pr.tags.map(function (t) { return t.replace(/-/g, ' '); }).join(', '));
  if (pr.p && pr.p.energy >= 0.95 && ns[0].energy !== ns[1].energy) why.push('Contraste d’énergie : ' + ns.map(function (n) { return E.LBL.energy[n.energy].toLowerCase(); }).join(' puis '));
  return { fam: fam, name: name, steps: steps, total: tot, group: g, price: price, venue: pr.venue, moment: pr.moment, order: ord.map(function (n) { return n.id; }),
    hosts: ns.length + ' hôtes de niveau 2 au moins (règle n → n-1 pour un palier découverte), ou un hôte de niveau 2 dans ' + (ns.length === 2 ? 'les deux niches' : 'les trois niches'), why: why };
};

/* Meilleurs partenaires d'une niche dans une liste (indices), filtres optionnels. */
E.bestPartners = function (a, list, scoreOf, k, opt, filter) {
  var out = [];
  for (var i = 0; i < list.length; i++) { var b = list[i]; if (b === a || b.id === a.id) continue; if (filter && !filter(b)) continue; var r = E.pair(a, b, scoreOf(a), scoreOf(b), opt); r.b = b; out.push(r); }
  out.sort(function (x, y) { return y.s - x.s; });
  return out.slice(0, k);
};
E.triple = function (a, b, c, scoreOf, opt) {
  var ab = E.pair(a, b, scoreOf(a), scoreOf(b), opt), ac = E.pair(a, c, scoreOf(a), scoreOf(c), opt), bc = E.pair(b, c, scoreOf(b), scoreOf(c), opt);
  var v = inter(inter(a.venues, b.venues), c.venues), m = inter(inter(a.moments, b.moments), c.moments), pub = inter(inter(a.publics, b.publics), c.publics);
  var s = (ab.s + ac.s + bc.s) / 3 - (v.length ? 0 : 4) - (m.length ? 0 : 4);
  var best = [ab, ac, bc].sort(function (x, y) { return y.s - x.s; })[0];
  return { s: s, fit: (ab.fit + ac.fit + bc.fit) / 3, p: best.p, venue: v[0] || best.venue, moment: m[0] || best.moment, publics: pub.length ? pub : best.publics, chain: best.chain, tags: uni(uni(ab.tags, ac.tags), bc.tags).slice(0, 3), senses: [] };
};

if (typeof module !== 'undefined' && module.exports) module.exports = E; else root.ENG = E;
})(this);
