/* Trois profils de démonstration. Chaque compétence est résolue par id (ou à défaut par nom),
   ce qui garde la démo fonctionnelle si la taxonomie évolue. */
(function (W) {
  'use strict';
  var C = W.Cordes, U = C.util;
  C.DEMOS = [
    { id: 'ines', name: 'Inès', tag: 'Demandeuse curieuse', mode: 'learn', city: 'Lyon',
      blurb: '31 ans, Lyon. Sait cuisiner et parle anglais, veut se mettre au tournage, au chant et à l’escalade en rencontrant du monde.',
      context: { hoursPerWeek: 4, budgetPerMonth: 80, presence: 'local', radiusKm: 4, ageBand: '25-34' }, intents: ['plaisir', 'rencontres', 'equilibre'],
      skills: [[['cuisiner-legumes', 'cuisine'], 2, 3], [['photo-smartphone'], 2, 2], [['yoga-hatha', 'yoga'], 1, 2], [['anglais-conversation', 'anglais'], 3, 2], [['randonnee-journee', 'randonnee'], 2, 3], [['dessin-illustration', 'dessin'], 1, 2], [['jeux-de-societe-regles', 'jeux de societe'], 2, 3]],
      desires: [[['poterie-tournage', 'ceramique'], 2, '3m', ['atelier'], ['plaisir', 'creer']], [['chant-technique', 'chant'], 2, '12m', ['cours', 'atelier'], ['confiance']], [['escalade-bloc', 'escalade'], 2, '3m', ['communaute'], ['rencontres', 'forme']], [['latte-art'], 2, '1m', ['atelier'], ['plaisir']], [['langue-des-signes'], 2, '12m', ['cours'], ['utile']]],
      style: { q1: 0, q2: 0, q3: 0, q4: 2, q5: 1, q6: 2, q7: 2, q8: 1 } },
    { id: 'malik', name: 'Malik', tag: 'DJ-producteur qui veut en vivre', mode: 'offer', city: 'Paris',
      blurb: '34 ans, Paris. 12 ans de platines, des productions sorties, veut faire de la transmission son activité principale.',
      context: { hoursPerWeek: 2, budgetPerMonth: 60, presence: 'both', radiusKm: 6, ageBand: '25-34' }, intents: ['activite', 'transmettre', 'projets'],
      skills: [[['dj-mix', 'dj'], 4, 3, 12, ['realisations', 'portfolio', 'avis'], true], [['beatmaking'], 4, 3, 8, ['realisations', 'portfolio'], true], [['mixage-mastering'], 3, 2, 6, ['realisations']], [['sound-design'], 3, 2, 5, []], [['digging-vinyle'], 4, 3, 12, []], [['live-electronique'], 3, 2, 4, []], [['organisation-evenements'], 2, 2, 5, []]],
      desires: [[['motion-design'], 2, '3m', ['contenu'], ['projets']]],
      offer: { strong: ['dj-mix', 'beatmaking', 'mixage-mastering', 'digging-vinyle'], goals: ['activite', 'projets'], incomeTarget: 2200, hoursPerWeek: 20, audiences: ['debutants', 'passionnes', 'entreprises'], formats: ['cours', 'atelier', 'stage', 'prestation', 'contenu', 'evenement'], presence: 'both', assets: { material: true, venue: false, audience: 2, teachExp: 2 }, entrepreneur: { risk: 2, sales: 2, camera: 2, admin: 1, collective: 2, network: 3 } } },
    { id: 'claire', name: 'Claire', tag: 'Cuisine et éloquence', mode: 'both', city: 'Bordeaux',
      blurb: '42 ans, Bordeaux. Pâtissière amateure de haut niveau, ancienne finaliste de concours d’éloquence, veut transmettre et apprendre le podcast.',
      context: { hoursPerWeek: 5, budgetPerMonth: 70, presence: 'both', radiusKm: 5, ageBand: '35-44' }, intents: ['transmettre', 'complement', 'defi', 'projets'],
      skills: [[['patisserie-francaise'], 4, 3, 15, ['realisations', 'avis'], true], [['cuisine-vegetarienne'], 3, 2, 10, []], [['pain-levain'], 3, 3, 6, ['realisations']], [['eloquence'], 4, 3, 8, ['diplome', 'avis'], true], [['improvisation-theatrale'], 3, 3, 5, []], [['pitch-presentation'], 3, 2, 8, ['realisations']], [['storytelling'], 3, 2, 6, []], [['anglais-conversation'], 2, 1, 0, []]],
      desires: [[['podcast'], 3, '3m', ['atelier', 'contenu'], ['projets', 'creer']], [['fermentation-lacto', 'fermentation'], 2, '3m', ['atelier'], ['plaisir']], [['degustation-vin', 'oenologie'], 2, '12m', ['atelier'], ['rencontres']], [['facilitation'], 3, '12m', ['stage'], ['utile']]],
      style: { q1: 1, q2: 1, q3: 1, q4: 0, q5: 0, q6: 1, q7: 0, q8: 0 },
      offer: { strong: ['patisserie-francaise', 'eloquence', 'pain-levain', 'pitch-presentation'], goals: ['complement', 'projets'], incomeTarget: 900, hoursPerWeek: 8, audiences: ['debutants', 'entreprises'], formats: ['atelier', 'entreprise', 'coaching', 'stage'], presence: 'local', assets: { material: true, venue: true, audience: 1, teachExp: 2 }, entrepreneur: { risk: 1, sales: 2, camera: 1, admin: 2, collective: 2, network: 2 } } }
  ];

  C.buildDemo = function (id) {
    var d = C.DEMOS.filter(function (x) { return x.id === id; })[0]; if (!d) return null;
    var st = C.defaultState();
    st.mode = d.mode; st.demo = d.id;
    st.context = Object.assign(st.context, d.context, { firstName: d.name, city: d.city });
    var cc = C.CITIES && C.CITIES[U.norm(d.city)]; if (cc) { st.context.lat = cc[0]; st.context.lon = cc[1]; }
    st.intents = d.intents.slice();
    var map = {};
    d.skills.forEach(function (r) {
      var cand = r[0], uni = C.data.sById[cand[0]] ? null : null;
      var id2 = C.resolve(cand, uni); if (!id2) return;
      map[cand[0]] = id2;
      st.skills[id2] = { level: r[1], love: r[2], years: r[3] || 0, proof: r[4] || [], teach: !!r[5] };
    });
    d.desires.forEach(function (r, i) {
      var id2 = C.resolve(r[0]); if (!id2 || st.skills[id2] && st.skills[id2].level >= r[1]) return;
      st.desires[id2] = { verdict: 'yes', priority: i + 1, target: r[1], horizon: r[2], formats: r[3], motive: r[4] };
    });
    // quelques refus pour nourrir l'apprentissage du paquet
    if (d.style) { st.style.answers = Object.assign({}, d.style); var a = C.computeArchetype(st.style.answers); st.style.archetype = a.archetype.id; }
    if (d.offer) {
      st.offer = Object.assign(st.offer, JSON.parse(JSON.stringify(d.offer)));
      st.offer.strong = st.offer.strong.map(function (x) { return map[x] || C.resolve([x]); }).filter(function (x) { return x && st.skills[x]; });
    }
    st.step = 'done';
    return st;
  };
})(window);
