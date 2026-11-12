/* Profils : archétype d'apprenant (8 questions → vecteur 6D → plus proche centroïde parmi 7)
   et profil entrepreneurial (6 questions → 4 profils). Formulé en préférences, sans pseudo-psychologie. */
(function (W) {
  'use strict';
  var C = W.Cordes, U = C.util;
  // dimensions : cadre (+ structuré / − libre), groupe (+ / − seul), rythme (+ intensif / − régulier),
  // pratique (+ faire / − comprendre), defi (+ défi / − plaisir), presentiel (+ / − en ligne)
  C.STYLE_DIMS = [
    { id: 'cadre', lo: 'Libre', hi: 'Cadré' }, { id: 'groupe', lo: 'Seul', hi: 'En groupe' }, { id: 'rythme', lo: 'Régulier', hi: 'Intensif' },
    { id: 'pratique', lo: 'Comprendre', hi: 'Faire' }, { id: 'defi', lo: 'Plaisir', hi: 'Défi' }, { id: 'presentiel', lo: 'En ligne', hi: 'Sur place' }
  ];
  function v(o) { return C.STYLE_DIMS.map(function (d) { return o[d.id] || 0; }); }
  C.STYLE_QUESTIONS = [
    { id: 'q1', q: 'Pour découvrir quelque chose de nouveau, vous préférez…', opts: [
      ['Qu’on me montre, puis essayer tout de suite', { pratique: 1, presentiel: 0.5 }],
      ['Comprendre comment ça marche avant de m’y mettre', { pratique: -1, cadre: 0.5 }],
      ['Tâtonner seul avec des vidéos', { groupe: -1, presentiel: -1, cadre: -0.5 }],
      ['Y aller avec des amis', { groupe: 1, defi: -0.5 }]] },
    { id: 'q2', q: 'Votre rythme idéal ressemble à…', opts: [
      ['Un créneau fixe chaque semaine', { cadre: 1, rythme: -1 }],
      ['Un stage ou un week-end intensif de temps en temps', { rythme: 1 }],
      ['Un quart d’heure chaque jour', { rythme: -0.5, cadre: 0.5, presentiel: -0.5 }],
      ['Quand l’envie me prend', { cadre: -1 }]] },
    { id: 'q3', q: 'Avec les autres, vous apprenez mieux…', opts: [
      ['En petit groupe, ça me motive', { groupe: 1 }],
      ['En tête-à-tête avec quelqu’un d’expérimenté', { groupe: -0.3, cadre: 0.7 }],
      ['Seul, à mon rythme', { groupe: -1 }],
      ['En groupe surtout pour l’ambiance', { groupe: 1, defi: -1 }]] },
    { id: 'q4', q: 'Ce qui vous fait continuer, c’est…', opts: [
      ['Voir des progrès mesurables', { defi: 1, cadre: 0.5 }],
      ['Le plaisir du moment', { defi: -1 }],
      ['Les gens que je retrouve', { groupe: 1, presentiel: 0.5 }],
      ['Un projet concret à terminer', { pratique: 1, rythme: 0.3 }]] },
    { id: 'q5', q: 'Face à une difficulté, vous…', opts: [
      ['Vous acharnez jusqu’à réussir', { defi: 1, rythme: 0.5 }],
      ['Demandez à quelqu’un', { groupe: 0.7, presentiel: 0.5 }],
      ['Cherchez une explication détaillée', { pratique: -1 }],
      ['Passez à autre chose et y revenez plus tard', { cadre: -1, defi: -0.5 }]] },
    { id: 'q6', q: 'Apprendre en ligne, pour vous…', opts: [
      ['Très bien, c’est souple', { presentiel: -1 }],
      ['En complément d’un vrai cours', { presentiel: 0.3 }],
      ['Pas pour moi, j’ai besoin d’être sur place', { presentiel: 1 }]] },
    { id: 'q7', q: 'La compétition…', opts: [
      ['Me stimule', { defi: 1, groupe: 0.5 }],
      ['Seulement contre moi-même', { defi: 0.5, groupe: -0.5 }],
      ['Je m’en passe volontiers', { defi: -1 }]] },
    { id: 'q8', q: 'Un programme structuré, c’est…', opts: [
      ['Indispensable, je veux savoir où je vais', { cadre: 1 }],
      ['Utile au début, puis je m’en libère', { cadre: 0.3 }],
      ['Je préfère improviser', { cadre: -1, pratique: 0.5 }]] }
  ];
  C.ARCHETYPES = [
    { id: 'artisan', name: 'L’artisan patient', c: v({ cadre: 0.6, rythme: -0.8, pratique: 0.8, defi: 0.2, presentiel: 0.7 }),
      pref: 'Vous progressez par la répétition du geste, sur place, avec un créneau régulier.', formats: ['atelier', 'cours', 'communaute'],
      tips: ['Réserver un créneau fixe chaque semaine plutôt qu’un stage', 'Choisir un lieu équipé (atelier, club) pour pratiquer sans acheter', 'Garder une trace photo de chaque séance pour voir le chemin parcouru'] },
    { id: 'sprinter', name: 'Le sprinteur', c: v({ cadre: 0.3, rythme: 1, pratique: 0.5, defi: 0.9, presentiel: 0.3 }),
      pref: 'Vous aimez les immersions courtes et intenses avec un objectif net.', formats: ['stage', 'atelier', 'evenement'],
      tips: ['Commencer par un stage d’un week-end pour franchir le niveau 1 d’un coup', 'Fixer un défi daté (un concert, une sortie, un plat servi à 8)', 'Prévoir une séance de rappel 2 semaines après pour ne pas perdre l’acquis'] },
    { id: 'butineur', name: 'Le butineur', c: v({ cadre: -0.9, groupe: 0.3, pratique: 0.5, defi: -0.8, presentiel: 0.2 }),
      pref: 'Vous aimez goûter à beaucoup de choses, sans engagement long.', formats: ['atelier', 'evenement'],
      tips: ['Enchaîner des ateliers découverte d’une heure plutôt qu’un cursus', 'Limiter à 3 envies actives à la fois pour en finir au moins une', 'Utiliser le défi 30 jours sur une seule envie pour tester la durée'] },
    { id: 'autodidacte', name: 'L’autodidacte connecté', c: v({ cadre: -0.4, groupe: -1, defi: 0.3, presentiel: -1 }),
      pref: 'Vous apprenez seul, en ligne, à votre rythme, et allez chercher l’information.', formats: ['contenu', 'cours'],
      tips: ['Choisir une application ou une chaîne de référence et s’y tenir un mois', 'Prendre un cours ponctuel avec un pro tous les mois pour corriger les défauts', 'Publier ses progrès dans une communauté en ligne pour garder le rythme'] },
    { id: 'bande', name: 'Le compagnon de bande', c: v({ groupe: 1, rythme: -0.3, pratique: 0.4, defi: -0.6, presentiel: 0.9 }),
      pref: 'Vous venez pour les gens autant que pour la pratique : le groupe vous fait tenir.', formats: ['atelier', 'communaute', 'evenement'],
      tips: ['Rejoindre un club ou un cercle local plutôt qu’un cours individuel', 'Embarquer un ami : le binôme double les chances de continuer', 'Viser un projet collectif (jam, dîner, compilation) dès le 2e mois'] },
    { id: 'analyste', name: 'L’analyste', c: v({ cadre: 0.9, groupe: -0.4, pratique: -1, defi: 0.4 }),
      pref: 'Vous voulez comprendre le pourquoi avant le comment, avec un programme clair.', formats: ['cours', 'contenu', 'stage'],
      tips: ['Commencer par un livre ou un cours structuré qui pose la théorie', 'Tenir un carnet de notes et de questions pour chaque séance', 'Passer à la pratique dès la 2e semaine pour ne pas rester dans la théorie'] },
    { id: 'competiteur', name: 'Le compétiteur', c: v({ cadre: 0.6, groupe: 0.6, rythme: 0.4, pratique: 0.4, defi: 1, presentiel: 0.5 }),
      pref: 'Vous aimez vous mesurer aux autres et suivre une progression chiffrée.', formats: ['cours', 'communaute', 'evenement'],
      tips: ['Choisir une discipline avec des niveaux ou des tournois (club fédéré)', 'Mesurer un indicateur chaque semaine (temps, score, nombre de motifs réussis)', 'S’inscrire à une première compétition amicale à 3 mois'] }
  ];

  C.computeArchetype = function (answers) {
    answers = answers || {};
    var vec = C.STYLE_DIMS.map(function () { return 0; }), n = 0;
    C.STYLE_QUESTIONS.forEach(function (q) {
      var a = answers[q.id]; if (a == null || !q.opts[a]) return;
      n++;
      var d = v(q.opts[a][1]);
      d.forEach(function (x, i) { vec[i] += x; });
    });
    // normalisation : ramène chaque dimension dans [-1, 1]
    var maxAbs = [0, 0, 0, 0, 0, 0];
    C.STYLE_QUESTIONS.forEach(function (q) { var m = [0, 0, 0, 0, 0, 0]; q.opts.forEach(function (o) { v(o[1]).forEach(function (x, i) { m[i] = Math.max(m[i], Math.abs(x)); }); }); m.forEach(function (x, i) { maxAbs[i] += x; }); });
    vec = vec.map(function (x, i) { return U.clamp(maxAbs[i] ? x / (maxAbs[i] * 0.6) : 0, -1, 1); });
    var ranked = C.ARCHETYPES.map(function (a) {
      var d = 0; a.c.forEach(function (x, i) { d += (x - vec[i]) * (x - vec[i]); });
      return { a: a, dist: Math.sqrt(d) };
    }).sort(function (x, y) { return x.dist - y.dist; });
    var conf = ranked.length > 1 ? U.clamp((ranked[1].dist - ranked[0].dist) / (ranked[1].dist || 1) * 2.2 + 0.35, 0.35, 0.95) : 0.5;
    return { answered: n, vec: vec, archetype: ranked[0].a, second: ranked[1] && ranked[1].a, confidence: n ? conf : 0, ranked: ranked };
  };

  /* ---------- profil entrepreneurial ---------- */
  C.ENTRE_QUESTIONS = [
    { id: 'risk', q: 'Investir du temps ou un peu d’argent sans garantie de retour', opts: ['Hors de question', 'Un peu, si c’est limité', 'Oui, c’est le jeu', 'J’aime ça'] },
    { id: 'sales', q: 'Parler de ce que vous proposez à des inconnus', opts: ['Très difficile', 'Je me force', 'À l’aise', 'J’adore convaincre'] },
    { id: 'camera', q: 'Vous filmer, parler en direct ou publier des vidéos', opts: ['Jamais', 'Si on ne voit pas mon visage', 'Ça va', 'Avec plaisir'] },
    { id: 'admin', q: 'Factures, déclarations, papiers', opts: ['Je fuis', 'Le strict minimum', 'Ça ne me gêne pas', 'J’aime que ce soit carré'] },
    { id: 'collective', q: 'Travailler seul ou à plusieurs', opts: ['Seul, toujours', 'Plutôt seul', 'Plutôt à plusieurs', 'En collectif avant tout'] },
    { id: 'network', q: 'Votre réseau local (lieux, associations, commerces, public)', opts: ['Quasi nul', 'Quelques contacts', 'Un bon réseau', 'Je connais tout le quartier'] }
  ];
  C.ENTRE_PROFILES = [
    { id: 'prudent', name: 'Le transmetteur prudent', c: { risk: 0.5, sales: 0.8, camera: 0.5, admin: 0.8, collective: 1.5, network: 1 }, pref: 'Démarrer petit, sans frais fixes, en s’appuyant sur des plateformes qui amènent les clients.' },
    { id: 'artisan', name: 'L’artisan indépendant', c: { risk: 1.8, sales: 1.8, camera: 1, admin: 2, collective: 0.8, network: 2 }, pref: 'Construire sa clientèle en direct, garder la relation et ses marges.' },
    { id: 'createur', name: 'Le créateur de contenu', c: { risk: 2.2, sales: 2, camera: 2.8, admin: 1.4, collective: 1, network: 1 }, pref: 'Toucher large par la vidéo et convertir une partie de l’audience en cours ou en communauté payante.' },
    { id: 'collectif', name: 'L’animateur collectif', c: { risk: 1.4, sales: 1.6, camera: 1.2, admin: 1.2, collective: 2.8, network: 2.6 }, pref: 'Porter des projets à plusieurs, avec des lieux et des associations.' }
  ];
  C.computeEntrepreneur = function (ans) {
    ans = ans || {};
    var keys = C.ENTRE_QUESTIONS.map(function (q) { return q.id; });
    var vals = {}; keys.forEach(function (k) { vals[k] = ans[k] == null ? 1.5 : U.clamp(ans[k], 0, 3); });
    var ranked = C.ENTRE_PROFILES.map(function (p) { var d = 0; keys.forEach(function (k) { d += Math.pow(p.c[k] - vals[k], 2); }); return { p: p, dist: Math.sqrt(d) }; }).sort(function (a, b) { return a.dist - b.dist; });
    return { vals: vals, profile: ranked[0].p, second: ranked[1].p, answered: keys.filter(function (k) { return ans[k] != null; }).length };
  };
})(window);
