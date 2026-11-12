/* Offres générées, trames minutées, feuille de route 90 jours, kit de lancement, collectif. */
(function (W) {
  'use strict';
  var C = W.Cordes, U = C.util;
  function lc(s) { s = String(s || ''); return s.charAt(0).toLowerCase() + s.slice(1); }
  function minutes(m) { var h = Math.floor(m / 60), r = m % 60; return h ? h + ' h' + (r ? ' ' + (r < 10 ? '0' : '') + r : '') : r + ' min'; }
  C.minutes = minutes;
  C.AUDIENCES = { enfants: 'Enfants', debutants: 'Adultes débutants', passionnes: 'Passionnés', entreprises: 'Entreprises', touristes: 'Touristes', seniors: 'Seniors' };
  C.GOALS = { benevolat: 'Transmettre bénévolement', complement: 'Un complément de revenu', activite: 'En faire une activité principale', projets: 'Monter des projets collectifs' };
  var FMT_UTIL = { atelier: 1, cours: 0.95, stage: 0.8, prestation: 0.8, entreprise: 0.75, coaching: 0.72, evenement: 0.7, communaute: 0.62, contenu: 0.6, produit: 0.6 };
  var FMT_SPEC = {
    cours: { dur: 60, size: [1, 1] }, atelier: { dur: 120, size: [4, 8] }, stage: { dur: 360, size: [5, 10] }, prestation: { dur: 180, size: [10, 40] },
    coaching: { dur: 60, size: [1, 1] }, entreprise: { dur: 120, size: [8, 20] }, evenement: { dur: 150, size: [12, 30] }, contenu: { dur: 90, size: [1, 1] },
    produit: { dur: 0, size: [1, 1] }, communaute: { dur: 90, size: [6, 15] }
  };
  var MATERIAL = {
    cuisine: ['Plan de travail et ustensiles pour chaque binôme', 'Ingrédients pesés à l’avance', 'Tabliers, torchons, boîtes pour repartir avec sa réalisation'],
    musique: ['Enceinte et câbles', 'Instruments ou contrôleurs (1 pour 2)', 'Casques', 'Partitions ou fiches d’accords imprimées'],
    image: ['Papier et outils de base par personne', 'Exemples imprimés', 'Lampe d’appoint', 'Rangement pour faire sécher ou emporter'],
    artisanat: ['Matière première par personne', 'Outils (1 jeu pour 2)', 'Protection des tables', 'Sacs pour emporter les pièces'],
    maison: ['Caisse à outils complète', 'Pièces de rechange courantes', 'Lunettes et gants', 'Objets d’entraînement'],
    nature: ['Graines, plants ou boutures', 'Pots et terreau', 'Gants', 'Fiches d’identification'],
    sport: ['Espace dégagé et tapis', 'Matériel d’échauffement', 'Trousse de secours', 'Eau'],
    pleinair: ['Itinéraire et plan B météo', 'Trousse de secours', 'Matériel collectif', 'Liste d’équipement envoyée la veille'],
    scene: ['Salle avec espace de jeu', 'Enceinte pour la musique', 'Accessoires simples', 'Bouteilles d’eau'],
    parole: ['Paperboard et feutres', 'Sujets imprimés', 'Chronomètre', 'Smartphone pour filmer les passages'],
    jeux: ['Plateaux et jeux (1 pour 2)', 'Fiches de règles résumées', 'Pendule ou minuteur'],
    tech: ['Ordinateurs ou smartphones des participants', 'Vidéoprojecteur', 'Wifi et comptes de test', 'Fiche pas à pas'],
    bienetre: ['Tapis et coussins', 'Plaids', 'Musique douce', 'Salle calme'],
    style: ['Miroirs et lumière', 'Produits et outils par personne', 'Lingettes et désinfectant'],
    savoirs: ['Supports imprimés ou projetés', 'Objets ou documents à manipuler', 'Bibliographie courte'],
    pratique: ['Supports pratiques', 'Cas concrets imprimés', 'Fiche-mémo'],
    social: ['Paperboard', 'Cartes ou post-it', 'Minuteur', 'Collation']
  };

  C.strongSkills = function (st) {
    var o = st.offer || {};
    var ids = U.arr(o.strong).filter(function (id) { return C.data.sById[id]; });
    if (!ids.length) ids = Object.keys(st.skills || {}).filter(function (id) { return C.data.sById[id] && st.skills[id].level >= 3; });
    var sc = function (id) { var s = C.data.sById[id], v = st.skills[id] || {}; return U.num(v.level, 3) * 2 + s.attrs.teachable + s.attrs.monetization + s.attrs.demand + U.num(v.love, 2); };
    return ids.sort(function (a, b) { return sc(b) - sc(a); }).slice(0, 6);
  };

  C.generateOffers = function (st) {
    var o = st.offer || {}, ids = C.strongSkills(st);
    if (!ids.length) return [];
    var E = C.computeEntrepreneur(o.entrepreneur).vals;
    var prefF = U.arr(o.formats), aud = U.arr(o.audiences);
    function rankFormats(s) {
      var list = s.formats.map(function (f) {
        var v = (FMT_UTIL[f] || 0.5) * (prefF.length ? (prefF.indexOf(f) >= 0 ? 1 : 0.35) : 1);
        if (f === 'contenu') v *= 0.4 + 0.25 * E.camera;
        if (f === 'entreprise' && aud.indexOf('entreprises') >= 0) v *= 1.4;
        if ((f === 'atelier' || f === 'evenement') && aud.indexOf('touristes') >= 0) v *= 1.15;
        if (f === 'cours' && (aud.indexOf('enfants') >= 0 || aud.indexOf('passionnes') >= 0)) v *= 1.1;
        if (f === 'communaute' && U.arr(o.goals).indexOf('projets') >= 0) v *= 1.2;
        return { f: f, v: v };
      }).sort(function (a, b) { return b.v - a.v; });
      return list.map(function (x) { return x.f; });
    }
    var plan = [];
    var per = ids.length === 1 ? 3 : ids.length === 2 ? 2 : 1;
    ids.forEach(function (id, i) {
      var s = C.data.sById[id], fl = rankFormats(s);
      var k = i === 0 ? Math.max(per, 2) : per;
      fl.slice(0, k).forEach(function (f) { plan.push({ id: id, f: f }); });
    });
    plan = plan.slice(0, 6);
    while (plan.length < 3 && ids.length) { var s0 = C.data.sById[ids[0]]; var extra = rankFormats(s0).filter(function (f) { return !plan.some(function (p) { return p.id === s0.id && p.f === f; }); })[0]; if (!extra) break; plan.push({ id: s0.id, f: extra }); }
    return plan.map(function (p, i) { return C.buildOffer(st, p.id, p.f, i); });
  };

  C.buildOffer = function (st, id, fmt, i) {
    var s = C.data.sById[id], o = st.offer || {}, spec = FMT_SPEC[fmt] || { dur: 90, size: [4, 8] };
    var aud = U.arr(o.audiences);
    var size = fmt === 'atelier' ? (s.attrs.teachable >= 3 ? 6 : 4) : Math.round((spec.size[0] + spec.size[1]) / 2);
    if (fmt === 'atelier' && s.attrs.cost >= 3) size = 4;
    var dur = spec.dur;
    if (fmt === 'atelier' && s.attrs.hoursToBasics <= 8) dur = 90;
    var pr = C.suggestPrice(st, id, fmt, size);
    var L = s.levels, name = s.name;
    var audTxt = aud.length ? aud.map(function (a) { return (C.AUDIENCES[a] || a).toLowerCase(); }).slice(0, 2).join(' et ') : 'adultes débutants';
    var title, hook;
    switch (fmt) {
      case 'atelier': title = name + ' · ' + lc(L[0]) + ' en ' + minutes(dur); hook = 'En petit groupe de ' + size + ', chacun repart en sachant ' + lc(L[0]) + ', photo à l’appui.'; break;
      case 'cours': title = 'Cours particulier de ' + lc(name) + ' · progression sur mesure'; hook = 'Un objectif fixé à la première heure, puis une étape par séance jusqu’à « ' + lc(L[1]) + ' ».'; break;
      case 'stage': title = 'Stage ' + lc(name) + ' · de zéro à « ' + lc(L[1]) + ' » en une journée'; hook = 'Une journée intensive pour franchir le cap que l’on met des mois à passer seul.'; break;
      case 'prestation': title = ({ cuisine: name + ' pour vos événements', musique: name + ' pour vos soirées', scene: name + ' pour vos soirées et mariages', maison: name + ' à domicile', style: name + ' sur rendez-vous' }[s.universe]) || name + ' · prestation sur mesure'; hook = 'Vous recevez, je m’occupe de ' + lc(name) + ' : préparation, animation, rangement.'; break;
      case 'coaching': title = 'Accompagnement ' + lc(name) + ' · 6 séances vers « ' + lc(L[2]) + ' »'; hook = 'Un suivi personnalisé avec un exercice entre chaque séance et un point d’étape mesurable.'; break;
      case 'entreprise': title = 'Team building ' + lc(name) + ' · ' + minutes(dur) + ' pour 8 à 20 collègues'; hook = 'Une activité qui fait coopérer les équipes et produit un résultat concret à montrer.'; break;
      case 'evenement': title = 'Soirée ' + lc(name) + ' · découverte conviviale'; hook = 'Une soirée ouverte où l’on essaie, on échange et on repart avec l’envie de continuer.'; break;
      case 'contenu': title = 'Mini-formation vidéo ' + lc(name) + ' · 8 modules'; hook = 'Tout ce qu’il faut pour atteindre « ' + lc(L[0]) + ' » chez soi, à son rythme.'; break;
      case 'communaute': title = 'Cercle ' + lc(name) + ' · un rendez-vous par mois'; hook = 'Un groupe stable qui pratique ensemble, avec un thème et un défi chaque mois.'; break;
      case 'produit': title = 'Créations ' + lc(name) + ' · pièces uniques'; hook = 'Des pièces faites main, vendues en direct, en boutique partenaire ou en ligne.'; break;
      default: title = name; hook = s.desc;
    }
    var mat = (MATERIAL[s.universe] || ['Matériel de base']).slice(0, 3);
    var assets = o.assets || {};
    if (assets.venue) mat.push('Votre lieu : à présenter comme argument (calme, équipé)');
    if (s.attrs.cost >= 2 && !assets.material) mat.push('Matériel à mutualiser : prévoir 1 jeu pour 2 ou un lieu équipé');
    mat.push('Fiche-mémo d’une page remise en fin de séance');
    return {
      id: 'o' + i + '-' + id + '-' + fmt, s: s, fmt: fmt, title: title, hook: hook, duration: dur, size: size, audience: audTxt,
      price: pr.price, pricing: pr, unit: pr.unit, outline: C.outline(s, fmt, dur, size), material: mat, regulated: s.regulated
    };
  };

  C.outline = function (s, fmt, dur, size) {
    var L = s.levels, soft = (s.soft[0] && C.data.softById[s.soft[0]]) ? C.data.softById[s.soft[0]].name.toLowerCase() : 'précision';
    var phases;
    if (fmt === 'cours' || fmt === 'coaching') phases = [
      [0.10, 'Diagnostic', 'Ce que la personne sait déjà faire, ce qu’elle veut atteindre, un exercice test'],
      [0.10, 'Objectif du jour', 'Une seule étape visée : « ' + lc(L[0]) + ' »'],
      [0.40, 'Technique', 'Démonstration, décomposition du geste, répétitions corrigées une par une'],
      [0.25, 'Mise en situation', 'Application autonome, vous observez et notez 2 points à travailler'],
      [0.15, 'Suite', 'Exercice pour la semaine, prochain objectif, trace écrite ou vidéo']];
    else if (fmt === 'entreprise') phases = [
      [0.10, 'Brise-glace', 'Équipes de 3 à 4 mélangées, consigne et enjeu du défi final'],
      [0.15, 'Démonstration', L[0] + ' : les 3 gestes clés'],
      [0.35, 'Atelier en équipes', 'Chaque équipe produit sa version, rotation des rôles pour que chacun pratique'],
      [0.25, 'Défi', 'Présentation des réalisations, vote, photo de groupe'],
      [0.15, 'Débrief', 'Ce qui a marché dans la coopération, fiche-mémo, contact pour une suite']];
    else if (fmt === 'stage') phases = [
      [0.08, 'Accueil', 'Tour de table, niveau et attentes de chacun'],
      [0.20, 'Bases', 'Démonstration et exercices : « ' + lc(L[0]) + ' »'],
      [0.10, 'Pause', 'Pause, regard collectif sur les essais'],
      [0.30, 'Approfondissement', 'Vers « ' + lc(L[1]) + ' », correction individuelle (' + soft + ')'],
      [0.22, 'Projet', 'Réalisation personnelle de bout en bout'],
      [0.10, 'Restitution', 'Présentation, photos, ressources pour continuer seul']];
    else if (fmt === 'evenement' || fmt === 'communaute') phases = [
      [0.15, 'Accueil', 'Arrivée, présentation rapide, thème de la soirée'],
      [0.20, 'Découverte', 'Démonstration courte et commentée : ' + lc(L[0])],
      [0.40, 'Pratique libre', 'Petits groupes, vous passez de table en table'],
      [0.15, 'Moment commun', 'Mini défi ou partage des réalisations'],
      [0.10, 'Suite', 'Prochaine date, inscription au cercle, photo']];
    else if (fmt === 'contenu') phases = [
      [0.12, 'Module 1', 'Matériel minimum et installation'], [0.18, 'Modules 2 et 3', 'Le geste de base : ' + lc(L[0])],
      [0.30, 'Modules 4 à 6', 'Exercices progressifs vers « ' + lc(L[1]) + ' »'], [0.25, 'Module 7', 'Erreurs fréquentes et corrections'],
      [0.15, 'Module 8', 'Projet final et partage dans la communauté']];
    else if (fmt === 'produit') return [{ start: 0, end: 0, label: 'Gamme', text: '3 pièces de prix différents (entrée, cœur, pièce signature)' }, { start: 0, end: 0, label: 'Vente', text: 'Marché de créateurs, boutique partenaire en dépôt-vente, boutique en ligne' }, { start: 0, end: 0, label: 'Atelier associé', text: 'Proposer un atelier pour faire soi-même : il fait vendre les pièces' }];
    else phases = [
      [0.10, 'Accueil', 'Tour de table : prénom, niveau, ce qui donne envie'],
      [0.15, 'Démonstration', 'Démonstration commentée : ' + lc(L[0])],
      [0.35, 'Pratique guidée', (size > 2 ? 'En binômes' : 'Pas à pas') + ', correction individuelle, accent sur la ' + soft],
      [0.25, 'Défi', 'Chacun réalise sa version, vers « ' + lc(L[1]) + ' » pour les plus à l’aise'],
      [0.15, 'Clôture', 'Photo des réalisations, fiche-mémo, proposition d’un arc de 3 séances']];
    var t = 0;
    return phases.map(function (ph) {
      var d = Math.max(5, Math.round(dur * ph[0] / 5) * 5);
      var o = { start: t, end: t + d, label: ph[1], text: ph[2] };
      t += d; return o;
    }).map(function (x, i, arr) { if (i === arr.length - 1) x.end = dur; return x; });
  };

  /* ---------- feuille de route 90 jours ---------- */
  C.roadmap = function (st, offers, channels, status, niche) {
    var o = st.offer || {}, first = offers[0], now = new Date();
    var ch1 = channels.filter(function (c) { return !c.p.soon; })[0], ch2 = channels.filter(function (c) { return !c.p.soon; })[1];
    var regs = C.regulationsFor(offers.map(function (x) { return x.s; }));
    var proj = C.projectsFor(offers.map(function (x) { return x.s; }), 1)[0];
    var stp = status && status.s && status.s.steps && status.s.steps[0];
    var d = function (n) { return U.addDays(now, n); };
    var ph = [
      { id: 'tester', label: 'Tester', range: 'Sem. 1-2', tasks: [
        { id: 'r1', due: d(7), text: 'Animer une séance pilote gratuite pour 3 à 4 proches : « ' + (first ? first.title : 'votre première offre') + ' »' },
        { id: 'r2', due: d(10), text: 'Recueillir 3 retours écrits et 5 photos utilisables' },
        { id: 'r3', due: d(14), text: 'Chronométrer la trame réelle et ajuster les durées' }] },
      { id: 'prix', label: 'Prix et cadre', range: 'Sem. 3-4', tasks: [
        { id: 'r4', due: d(18), text: 'Fixer le prix de lancement à ' + (first ? U.eur(Math.round(first.price * 0.8)) : '…') + ' pour les 10 premiers clients, puis ' + (first ? U.eur(first.price) : '…') },
        { id: 'r5', due: d(21), text: status ? 'Statut « ' + status.s.name + ' » : ' + lc(stp || 'faire les démarches') : 'Choisir un statut adapté' },
        { id: 'r6', due: d(25), text: 'Souscrire une responsabilité civile professionnelle (compter 100 à 250 € par an)' }].concat(regs.map(function (r, i) { return { id: 'rg' + i, due: d(25), text: 'Cadre « ' + r.r.title + ' » : ' + lc((r.r.options || [])[0] || 'vérifier les obligations') }; })) },
      { id: 'clients', label: 'Premiers clients', range: 'Mois 2', tasks: [
        { id: 'r7', due: d(35), text: ch1 ? 'Publier l’offre sur ' + ch1.p.name + (ch1.p.url ? ' (' + ch1.p.url.replace(/^https?:\/\//, '') + ')' : '') : 'Publier l’offre sur un premier canal' },
        { id: 'r8', due: d(38), text: 'Envoyer le message de prospection du kit à 5 lieux partenaires (cafés, ateliers, tiers-lieux)' },
        { id: 'r9', due: d(50), text: 'Remplir 2 séances payantes à ' + (first ? first.size : 4) + ' participants' },
        { id: 'r10', due: d(55), text: 'Demander un avis écrit à chaque participant et le publier' }] },
      { id: 'canaux', label: 'Canaux', range: 'Mois 2', tasks: [
        { id: 'r11', due: d(58), text: ch2 ? 'Ouvrir un 2e canal : ' + ch2.p.name : 'Ouvrir un 2e canal' },
        { id: 'r12', due: d(60), text: 'Rejoindre la liste d’attente hôte fondateur de Cordes' }] },
      { id: 'recurrence', label: 'Récurrence', range: 'Mois 3', tasks: [
        { id: 'r13', due: d(68), text: first ? 'Lancer un arc de 3 séances à ' + U.eur(U.round5(first.price * 2.7)) + ' (au lieu de ' + U.eur(first.price * 3) + ')' : 'Lancer un arc de 3 séances' },
        { id: 'r14', due: d(72), text: 'Fixer un créneau régulier, par exemple le jeudi à 19 h, et le tenir 6 semaines' }].concat(U.arr(o.audiences).indexOf('entreprises') >= 0 || offers.some(function (x) { return x.fmt === 'entreprise'; }) ? [{ id: 'r15', due: d(78), text: 'Proposer la version entreprise à 3 CSE ou entreprises du quartier' }] : []) },
      { id: 'collectif', label: 'Collectif', range: 'Mois 3', tasks: [
        { id: 'r16', due: d(84), text: proj ? 'Rejoindre ou lancer le projet « ' + proj.p.name + ' » (' + proj.p.size[0] + ' à ' + proj.p.size[1] + ' personnes, ' + proj.p.weeks + ' semaines)' : 'Rejoindre un projet collectif local' },
        { id: 'r17', due: d(90), text: 'Bilan à J+90 : chiffre d’affaires, taux de remplissage, prix, canal le plus rentable' + (niche ? ', test de la niche « ' + niche.title + ' »' : '') }] }
    ];
    return ph;
  };

  /* ---------- kit de lancement ---------- */
  C.launchKit = function (st, offers, niche) {
    var c = st.context || {}, o = st.offer || {}, first = offers[0];
    if (!first) return null;
    var s = first.s, v = (st.skills && st.skills[s.id]) || {};
    var name = c.firstName || 'Votre prénom', city = c.city || 'votre ville';
    var yrs = v.years ? v.years + ' ans de pratique' : 'une pratique de longue date';
    var others = offers.map(function (x) { return x.s.name; }).filter(function (n, i, a) { return a.indexOf(n) === i && n !== s.name; });
    var aud = first.audience;
    var bioShort = name + ' · ' + s.name.toLowerCase() + (others[0] ? ' et ' + others[0].toLowerCase() : '') + ' à ' + city + '. ' + yrs.charAt(0).toUpperCase() + yrs.slice(1) + ', des ateliers en petit groupe où l’on repart avec un résultat.';
    var bioLong = 'Je m’appelle ' + name + ' et je pratique ' + s.name.toLowerCase() + ' depuis ' + (v.years ? v.years + ' ans' : 'longtemps') + '. ' +
      'J’anime à ' + city + ' des séances pour ' + aud + ' : on y apprend à ' + lc(s.levels[0]) + ', puis on va plus loin à son rythme. ' +
      (niche ? 'Ma particularité : je mêle ' + niche.a.name.toLowerCase() + ' et ' + niche.b.name.toLowerCase() + ', ce qui donne des séances qu’on ne trouve pas ailleurs. ' : '') +
      'Prochaine date et réservation en message.';
    var pitch = 'Vous avez toujours voulu essayer ' + s.name.toLowerCase() + ' ? En ' + C.minutes(first.duration) + ', en groupe de ' + first.size + ', vous repartez en sachant ' + lc(s.levels[0]) + '. C’est ' + U.eur(first.price) + ', le matériel est fourni, et c’est à ' + city + '.';
    var mat = C.COST_RANGE[s.attrs.cost];
    var posts = [
      'Avant / après : ce que mes participants savent faire en ' + C.minutes(first.duration) + ' (photos de la dernière séance)',
      '3 erreurs de débutant en ' + s.name.toLowerCase() + ', et comment les éviter',
      'Le matériel minimum pour commencer ' + s.name.toLowerCase() + ' : ' + (mat[1] <= 20 ? 'presque rien' : 'moins de ' + mat[1] + ' €'),
      'Coulisses : je prépare la séance de jeudi (trame, matériel, playlist)',
      'Témoignage d’une participante et photo de sa première réalisation',
      'Défi de la semaine : ' + lc(s.levels[0]) + '. Montrez-moi vos essais',
      niche ? 'Pourquoi ' + niche.a.name.toLowerCase() + ' et ' + niche.b.name.toLowerCase() + ' vont si bien ensemble' : 'Ce que ' + s.name.toLowerCase() + ' m’a appris en dehors de ' + s.name.toLowerCase(),
      'Prochaine date : jeudi 19 h, ' + first.size + ' places, ' + U.eur(first.price) + ', lien en bio',
      'Question ouverte : qu’aimeriez-vous apprendre en ' + s.name.toLowerCase() + ' ?',
      'Merci au lieu partenaire du mois, qui nous accueille aux heures creuses'
    ];
    var venue = 'Bonjour,\n\nJe m’appelle ' + name + ' et j’anime des ateliers de ' + s.name.toLowerCase() + ' en petit groupe (' + first.size + ' personnes, ' + C.minutes(first.duration) + ') à ' + city + '.\n\n' +
      'Je cherche un lieu pour les accueillir un soir de semaine ou un samedi matin, à un moment calme pour vous. En échange, je vous amène ' + first.size + ' à ' + (first.size + 4) + ' clients qui consomment sur place, et je mets votre lieu en avant dans toutes mes communications.\n\n' +
      'Pas de loyer, pas d’engagement : on teste une date, et on continue si c’est bon pour vous. Je peux passer vous présenter le format cette semaine.\n\nBelle journée,\n' + name;
    var keywords = U.uniq([s.name.toLowerCase(), 'atelier ' + s.name.toLowerCase(), 'cours ' + s.name.toLowerCase() + ' ' + U.norm(city), s.name.toLowerCase() + ' débutant'].concat(s.aliases.slice(0, 3)).concat(s.tags.slice(0, 4)).concat(others.slice(0, 2).map(function (x) { return x.toLowerCase(); })));
    return { bioShort: bioShort, bioLong: bioLong, pitch: pitch, posts: posts, venue: venue, keywords: keywords };
  };

  C.collective = function (st, offers) {
    var skills = offers.map(function (x) { return x.s; });
    var projects = C.projectsFor(skills, 4).map(function (x) {
      var roles = x.p.roles;
      var myRole = roles.find ? roles.find(function (r) { return skills.some(function (s) { return U.norm(r).indexOf(U.norm(s.name).split(' ')[0]) >= 0; }); }) : null;
      return { p: x.p, score: x.score, role: myRole || roles[1] || roles[0] || 'Contributeur' };
    });
    var unis = {}; skills.forEach(function (s) { unis[s.universe] = 1; });
    var networks = C.res.networks.filter(function (n) { return Object.keys(unis).some(function (u) { return C.matchUniverse(n.universes, u); }) || skills.some(function (s) { return n.domains.indexOf(s.domain) >= 0; }); }).slice(0, 6);
    var places = C.res.communityTypes.filter(function (c) { return c.sides.indexOf('offer') >= 0 && Object.keys(unis).some(function (u) { return C.matchUniverse(c.universes, u); }); })
      .sort(function (a, b) { return (a.universes.indexOf('*') >= 0) - (b.universes.indexOf('*') >= 0); }).slice(0, 6);
    return { projects: projects, networks: networks, places: places };
  };

  // assemble le plan de valorisation complet
  C.offerPlan = function (st) {
    var offers = C.generateOffers(st);
    if (!offers.length) return null;
    var channels = C.rankChannels(st, offers);
    var statuses = C.recommendStatus(st, offers);
    var niches = C.niches(st, 3);
    var regs = C.regulationsFor(U.uniq(offers.map(function (x) { return x.s.id; })).map(function (id) { return C.data.sById[id]; }));
    var roadmap = C.roadmap(st, offers, channels, statuses[0], niches[0]);
    return { offers: offers, channels: channels, statuses: statuses, niches: niches, matrix: C.niceMatrix(st), regs: regs, roadmap: roadmap, kit: C.launchKit(st, offers, niches[0]), collective: C.collective(st, offers), entre: C.computeEntrepreneur((st.offer || {}).entrepreneur) };
  };
})(window);
