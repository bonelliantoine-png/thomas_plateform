/* Lieux partenaires (brief V2, section 2) : 20 types en 6 familles, 7 formules, migration des fiches, simulateur de gain,
   fiche enrichie (texte et HTML autonome), charte d'une page, kit de communication, lieux de démonstration fictifs,
   mise en avant d'un lieu pour une compétence. Moteur pur (sauf lecture du lieu enregistré sur l'appareil).
   Gain mensuel d'un créneau hebdomadaire = 4,33 séances ; formule 1 : séances × (participants + hôte) × ticket. */
(function (W) {
  'use strict';
  var C = W.Cordes, U = C.util;
  C.WEEKS = 4.33;
  C.VENUE_FORMULAS = [
    { id: 'creuse', n: 1, label: 'Heure creuse contre consommation', mech: 'Le lieu prête une table ou une salle à un créneau calme ; chaque participant consomme au moins une boisson sur place.', gives: 'Un créneau, une table', gets: '4 à 6 clients par séance, une fiche partenaire, des photos', platform: 'Ne paie rien, ne touche rien sur le lieu', engagement: 'Aucun, créneau fermable sous 7 jours', kpis: ['remplissage', 'consommations par participant', 'premières visites'], paid: false, from: 1 },
    { id: 'membre', n: 2, label: 'Avantage membre et ventes liées', mech: 'Le commerce offre une remise ou un produit aux membres ; les fiches de séance renvoient vers lui pour le matériel.', gives: '5 à 10 % de remise', gets: 'Des acheteurs qualifiés : 25 % des participants achètent, panier de 30 €', platform: 'Rien en phase 1 ; commission de 5 % sur les ventes avec code en phase 2, si le commerce l’accepte', engagement: 'Remise tenue 12 mois', kpis: ['ventes avec code', 'nouveaux clients'], paid: false, from: 1, buyRate: 0.25, basket: 30 },
    { id: 'recette', n: 3, label: 'Partage de recette', mech: 'Le lieu fournit un créneau équipé ; Cordes lui verse une part fixe par place occupée.', gives: 'Salle et matériel', gets: '4 € par place, minimum 15 € par séance ; des débutants qui reviennent à ses propres cours', platform: 'Paie la part par place occupée', engagement: 'Montant figé 12 mois', kpis: ['remplissage', 'inscriptions aux cours du lieu'], paid: false, from: 1, shareSeat: 4, shareMin: 15 },
    { id: 'programme', n: 4, label: 'Programme commandé', mech: 'Le lieu achète des séances pour son propre public : clients d’hôtel, membres de coworking, salariés.', gives: '200 € HT par séance', gets: 'Une animation clé en main, du contenu, un public qui reste', platform: 'Touche 200 € HT, paie l’hôte et le matériel', engagement: 'Pack de 4 séances, reconductible', kpis: ['séances par mois', 'note des participants', 'renouvellement'], paid: true, from: 7, priceHT: 200 },
    { id: 'une', n: 5, label: 'Lieu à la une', mech: 'Abonnement de visibilité : fiche enrichie, mise en avant dans « Idées à vivre » et les pages du quartier, kit de communication mensuel, rapport de fréquentation.', gives: '39 € HT par mois', gets: 'De la visibilité auprès d’habitants actifs ; rentable s’il gagne un client fidèle par mois', platform: 'Offert 3 mois aux lieux qui accueillent déjà des séances', engagement: 'Mensuel, sans engagement', kpis: ['vues', 'clics', 'résiliations'], paid: true, from: 10, priceHT: 39 },
    { id: 'soiree', n: 6, label: 'Soirée découverte co-organisée', mech: 'Une soirée mensuelle, quatre tables, quatre gestes de 15 minutes, entrée à 12 € TTC encaissée par Cordes.', gives: 'La salle un soir calme', gets: '100 % du bar, pour 30 personnes à 10 € de consommation', platform: 'Encaisse les entrées, paie 4 hôtes et le matériel', engagement: 'À la date', kpis: ['participants', 'inscrits sur place', 'séances réservées ensuite'], paid: false, from: 4, ticketTTC: 12, people: 30, barPerHead: 10 },
    { id: 'public', n: 7, label: 'Programme public', mech: 'Six ateliers gratuits par trimestre pour les usagers d’un équipement public, animés par des habitants.', gives: '3 000 € HT par trimestre sur le budget d’action culturelle', gets: 'Un public nouveau, un bilan de fréquentation pour son rapport d’activité', platform: 'Touche 3 000 € HT, fournit hôtes et matériel', engagement: 'Convention trimestrielle', kpis: ['inscrits', 'part de nouveaux usagers', 'satisfaction'], paid: true, from: 13, priceHT: 3000, per: 'trimestre', sessions: 6 }
  ];
  C.formulaById = function (id) { return C.VENUE_FORMULAS.filter(function (f) { return f.id === id; })[0] || null; };
  // à quels types une formule s'applique (les recommandées s'appliquent toujours)
  var APPLIES = {
    creuse: function (t) { return t.ticket > 0; },
    membre: function (t) { return ['coffee', 'cave', 'librairie', 'disquaire', 'boutique-materiel', 'salle-sport'].indexOf(t.id) >= 0; },
    recette: function (t) { return t.family === 'faire' || t.id === 'mjc'; },
    programme: function (t) { return ['hotel', 'coworking', 'entreprise', 'restaurant', 'tiers-lieu', 'boutique-materiel', 'galerie'].indexOf(t.id) >= 0; },
    une: function (t) { return t.family !== 'publics' && t.id !== 'entreprise'; },
    soiree: function (t) { return ['bar', 'tiers-lieu', 'librairie', 'galerie', 'disquaire'].indexOf(t.id) >= 0; },
    public: function (t) { return ['mediatheque', 'mjc', 'tiers-lieu'].indexOf(t.id) >= 0; }
  };

  C.loadVenues = function () {
    var fams = U.arr(W.CORDES_VENUE_FAMILIES), types = U.arr(W.CORDES_VENUE_TYPES).filter(function (t) { return t && t.id; });
    if (!types.length) U.anomaly('venues', 'CORDES_VENUE_TYPES absent : types de lieux par défaut');
    C.VENUE_FAMILIES = fams;
    C.VENUE_TYPE_INFO = {};
    types.forEach(function (t) {
      t.formulas = U.arr(t.formulas).filter(function (f) { if (!C.formulaById(f)) { U.anomaly('venues', t.id + ' : formule inconnue « ' + f + ' »'); return false; } return true; });
      t.ticket = U.num(t.ticket, 0); t.margin = U.num(t.margin, 0.7);
      C.VENUE_TYPE_INFO[t.id] = t;
      C.VENUE_TYPE_UNI[t.id] = U.arr(t.universes);
    });
    // [id, libellé, famille, ticket, formules recommandées, pitch] : forme attendue par les écrans existants
    C.VENUE_TYPES = types.filter(function (t) { return !t.legacy; }).map(function (t) { return [t.id, t.label, t.family, t.ticket, t.formulas, t.pitch]; });
    C.VENUE_LICENSED = types.filter(function (t) { return t.licensed; }).map(function (t) { return t.id; });
    C.DEMO_VENUES = U.arr(W.CORDES_DEMO_VENUES).map(function (v) { return C.migrateVenue(Object.assign({ demo: true, perSlot: 1 }, v)); });
    return C.VENUE_TYPE_INFO;
  };
  C.venueType = function (id) { return (C.VENUE_TYPE_INFO || {})[id] || (C.VENUE_TYPE_INFO || {}).autre || { id: id, label: 'Lieu', ticket: 4, margin: 0.7, formulas: ['creuse'], universes: [], pitch: '' }; };
  C.formulaApplies = function (fid, typeId) { var t = C.venueType(typeId); return t.formulas.indexOf(fid) >= 0 || (APPLIES[fid] ? APPLIES[fid](t) : false); };

  /* ---------- migration des fiches (v1 : 6 types, une formule) ---------- */
  C.migrateVenue = function (v) {
    v = Object.assign({}, v || {});
    if (v.type === 'studio') v.type = U.arr(v.equip).some(function (e) { return e === 'sono' || e === 'piano'; }) ? 'studio-musique' : 'studio-danse';
    else if (v.type === 'atelier') v.type = 'atelier-artisan';
    if (!C.VENUE_TYPE_INFO) C.loadVenues();
    if (!v.type) v.type = 'cafe'; else if (!C.VENUE_TYPE_INFO[v.type]) v.type = 'autre';
    if (!Array.isArray(v.formulas)) v.formulas = v.formula ? [v.formula] : C.venueType(v.type).formulas.slice(0, 1);
    v.formulas = v.formulas.filter(function (f) { return C.formulaById(f); });
    delete v.formula;
    v.slots = U.arr(v.slots); v.equip = U.arr(v.equip);
    v.perSlot = U.clamp(U.num(v.perSlot, 1), 1, 3);
    v.capacity = U.num(v.capacity, 8);
    v.sim = v.sim && typeof v.sim === 'object' ? v.sim : {};
    if (!v.slug && v.name) v.slug = C.venueSlug(v.name);
    v.v = 2;
    return v;
  };
  C.venueSlug = function (name) { return U.norm(name).replace(/ /g, '-').slice(0, 40) || 'mon-lieu'; };

  /* ---------- simulateur de gain ---------- */
  C.venueGainDefaults = function (v) {
    var t = C.venueType(v.type);
    return { slots: Math.min(10, U.arr(v.slots).length * U.clamp(U.num(v.perSlot, 1), 1, 3)), people: 4, host: true, ticket: t.ticket, margin: t.margin, basket: t.basket || 30,
      firstShare: 0.35, returnRate: 0.2, visitsPerMonth: 2, ordered: 4, soirees: 1, jauge: Math.min(12, U.num(v.capacity, 8)), fill: 0.6 };
  };
  // badge de chaque hypothèse : « estimation » (chiffre d'ordre de grandeur) ou « hypothèse » (à mesurer)
  C.VENUE_HYP = { slots: ['Créneaux par semaine', 'estimation'], people: ['Participants par séance', 'estimation'], host: ['Hôte compté comme consommateur', 'estimation'], ticket: ['Ticket moyen', 'estimation'], margin: ['Marge brute', 'estimation'],
    basket: ['Panier des ventes liées', 'estimation'], firstShare: ['Part de premières visites', 'hypothèse'], returnRate: ['Taux de retour des nouveaux', 'hypothèse'], visitsPerMonth: ['Visites par mois d’un client revenu', 'hypothèse'], ordered: ['Séances commandées par mois', 'estimation'], soirees: ['Soirées découverte par mois', 'estimation'] };
  C.venueGain = function (v, over) {
    var d = Object.assign(C.venueGainDefaults(v), v.sim || {}, over || {});
    d.slots = U.clamp(U.num(d.slots, 0), 0, 10); d.people = U.clamp(U.num(d.people, 4), 2, 8);
    d.ticket = Math.max(0, U.num(d.ticket, 0)); d.margin = U.clamp(U.num(d.margin, 0.7), 0, 1);
    var sess = d.slots * C.WEEKS, seat = d.people + (d.host ? 1 : 0);
    var chosen = U.arr(v.formulas);
    var rows = C.VENUE_FORMULAS.map(function (f) {
      var r = { id: f.id, n: f.n, label: f.label, ca: 0, marge: 0, cost: 0, text: '', on: chosen.indexOf(f.id) >= 0, applies: C.formulaApplies(f.id, v.type), from: f.from };
      if (f.id === 'creuse') { r.ca = sess * seat * d.ticket; r.marge = r.ca * d.margin; r.text = Math.round(sess * seat) + ' consommations par mois'; }
      else if (f.id === 'membre') { r.ca = sess * d.people * f.buyRate * d.basket; r.marge = r.ca * 0.35; r.text = 'ventes liées, panier ' + U.eur(d.basket); }
      else if (f.id === 'recette') { r.ca = sess * Math.max(f.shareSeat * d.people, f.shareMin); r.marge = r.ca; r.text = U.eur(f.shareSeat) + ' par place, ' + U.eur(f.shareMin) + ' au moins par séance'; }
      else if (f.id === 'programme') { r.cost = U.num(d.ordered, 4) * f.priceHT; r.text = U.num(d.ordered, 4) + ' séances clé en main pour votre public'; }
      else if (f.id === 'une') { r.cost = f.priceHT; r.text = 'rentable si 1 client fidèle par mois'; }
      else if (f.id === 'soiree') { r.ca = U.num(d.soirees, 1) * f.people * f.barPerHead; r.marge = r.ca * 0.7; r.text = f.people + ' personnes à ' + U.eur(f.barPerHead) + ' de bar'; }
      else if (f.id === 'public') { r.cost = f.priceHT / 3; r.audience = Math.round(f.sessions * d.jauge * d.fill); r.text = f.sessions + ' ateliers par trimestre, ' + r.audience + ' participants estimés'; }
      r.ca = Math.round(r.ca); r.marge = Math.round(r.marge); r.cost = Math.round(r.cost);
      return r;
    });
    var on = rows.filter(function (r) { return r.on; });
    var firstVisits = sess * d.people * d.firstShare;
    var newValue = Math.round(firstVisits * d.returnRate * d.visitsPerMonth * 6 * (d.ticket || 0));
    return {
      params: d, sessions: Math.round(sess * 10) / 10, participants: Math.round(sess * d.people), firstVisits: Math.round(firstVisits),
      rows: rows, chosen: on, ca: on.reduce(function (a, r) { return a + r.ca; }, 0), marge: on.reduce(function (a, r) { return a + r.marge; }, 0), cost: on.reduce(function (a, r) { return a + r.cost; }, 0),
      newClientsValue6m: newValue
    };
  };

  /* ---------- textes ---------- */
  C.venueSlotsText = function (v) {
    return U.arr(v.slots).slice().sort().map(function (k) { var p = k.split(':'); return C.VENUE_DAYS[+p[0]] + ' ' + ((C.VENUE_MOMENTS.filter(function (x) { return x[0] === p[1]; })[0] || ['', p[1]])[1] || '').toLowerCase(); });
  };
  C.venueEquipText = function (v) { return U.arr(v.equip).map(function (k) { return (C.VENUE_EQUIP.filter(function (x) { return x[0] === k; })[0] || ['', k])[1].toLowerCase(); }); };
  C.formulaAmount = function (f, g) {
    var r = g ? g.rows.filter(function (x) { return x.id === f.id; })[0] : null;
    if (f.id === 'creuse') return 'consommation minimale d’une boisson par participant' + (r && r.ca ? ', environ ' + U.eur(r.ca) + ' de chiffre d’affaires par mois' : '');
    if (f.id === 'membre') return 'remise de 5 à 10 % pour les membres' + (r && r.ca ? ', environ ' + U.eur(r.ca) + ' de ventes liées par mois' : '');
    if (f.id === 'recette') return U.eur(f.shareSeat) + ' par place occupée, ' + U.eur(f.shareMin) + ' au moins par séance' + (r ? ', environ ' + U.eur(r.ca) + ' par mois' : '');
    if (f.id === 'programme') return U.eur(f.priceHT) + ' HT par séance commandée';
    if (f.id === 'une') return U.eur(f.priceHT) + ' HT par mois, sans engagement';
    if (f.id === 'soiree') return 'entrée à ' + U.eur(f.ticketTTC) + ' TTC encaissée par Cordes, 100 % du bar pour le lieu';
    if (f.id === 'public') return U.fmt(f.priceHT) + ' € HT par trimestre pour ' + f.sessions + ' ateliers';
    return '';
  };
  C.VENUE_RULES = ['Consommer au moins une boisson ou un produit sur place', 'Arriver à l’heure et prévenir 48 h avant en cas d’absence', 'Ranger la table ou la salle avec l’hôte en fin de séance'];
  // séances possibles, sans doublon de nom court (« Jeux de rôle » maître du jeu et joueur)
  C.venueSessions = function (v, n) {
    var seen = {};
    return C.venueMatch(v, (n || 6) + 4).skills.filter(function (x) { var k = U.norm(x.s.short || x.s.name); if (seen[k]) return false; seen[k] = 1; return true; }).slice(0, n || 6).map(function (x) { return { s: x.s, oneHour: x.s.levels[0] }; });
  };
  C.venueSheet = function (v) {
    v = C.migrateVenue(v);
    var t = C.venueType(v.type), g = C.venueGain(v), m = C.venueMatch(v, 8);
    return [
      'FICHE LIEU PARTENAIRE · ' + (v.name || 'Mon lieu') + ' (' + t.label.toLowerCase() + ')' + (v.demo ? ' · lieu fictif de démonstration' : ''),
      'Zone : ' + (C.zoneOf(v.city, v.arr) || 'à préciser'),
      'Créneaux creux : ' + (C.venueSlotsText(v).join(', ') || 'à préciser'),
      'Capacité : ' + U.num(v.capacity, 8) + ' personnes · groupes Cordes de 2 à 8',
      'Équipements : ' + (C.venueEquipText(v).join(', ') || 'à préciser'),
      'Formules : ' + (v.formulas.map(function (id) { var f = C.formulaById(id); return f.n + ' · ' + f.label + ' (' + C.formulaAmount(f, g) + ')'; }).join(' ; ') || 'à choisir'),
      'Séances possibles : ' + m.skills.map(function (x) { return x.s.name; }).join(', '),
      'Estimation : ' + String(g.sessions).replace('.', ',') + ' séances et ' + g.participants + ' participants par mois, dont ' + g.firstVisits + ' premières visites' + (g.ca ? ', ' + U.eur(g.ca) + ' de chiffre d’affaires additionnel et ' + U.eur(g.marge) + ' de marge brute' : '') + (g.cost ? ', ' + U.eur(g.cost) + ' HT de programmes ou visibilité' : '') + '.',
      'Ce que les participants s’engagent à faire : ' + C.VENUE_RULES.map(function (r) { return U.lc(r); }).join(' ; ') + '.',
      'Hypothèses : ' + g.params.people + ' participants et un hôte par séance, ticket moyen ' + U.eur(g.params.ticket) + ', ' + Math.round(g.params.firstShare * 100) + ' % de premières visites. Estimations à vérifier sur place.'
    ].join('\n');
  };

  // page HTML autonome (même technique que le passeport) : imprimable en A4
  var CSS = 'body{margin:0;font:14px/1.5 "IBM Plex Mono",ui-monospace,Menlo,monospace;color:#f2f4f8;background:#07080b}main{max-width:820px;margin:0 auto;padding:28px 22px 40px}' +
    'h1{font:400 34px/1.15 "Marcellus",Georgia,serif;margin:6px 0}h2{font:400 20px "Marcellus",Georgia,serif;margin:22px 0 8px;border-bottom:1px solid #2b2f3b;padding-bottom:6px}' +
    '.k{font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:#5ee7ff}.demo{display:inline-block;margin-top:6px;padding:2px 8px;border:1px solid #e6dcb4;border-radius:999px;color:#e6dcb4;font-size:11px}' +
    'p,li{font:300 15px/1.55 Spectral,Georgia,serif;color:#cfd3dc}table{border-collapse:collapse;width:100%}td{border-bottom:1px solid #1d2029;padding:6px 4px;vertical-align:top}td.r{text-align:right;white-space:nowrap}' +
    '.sign{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:28px}.sign div{border:1px dashed #5d6477;border-radius:6px;min-height:110px;padding:10px;font-size:12px;color:#aeb4c2}.foot{margin-top:24px;font-size:11px;color:#7c8394}' +
    '@media print{@page{size:A4;margin:14mm}body{background:#fff;color:#111}p,li{color:#222}.k{color:#0a7c96}h2{border-color:#bbb}td{border-color:#ddd}.sign div{border-color:#888;color:#444}}';
  function page(title, body) {
    return '<!DOCTYPE html>\n<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + U.esc(title) + '</title><style>' + CSS + '</style></head><body><main>' + body + '</main></body></html>';
  }
  C.venueSheetHTML = function (v) {
    v = C.migrateVenue(v);
    var t = C.venueType(v.type), g = C.venueGain(v), E = U.esc, sess = C.venueSessions(v, 6);
    var body = '<div class="k">Cordes · fiche lieu partenaire</div><h1>' + E(v.name || 'Mon lieu') + '</h1><p>' + E(t.label) + ' · ' + E(C.zoneOf(v.city, v.arr) || '') + ' · ' + U.num(v.capacity, 8) + ' places</p>' + (v.demo ? '<span class="demo">lieu fictif de démonstration</span>' : '') +
      '<h2>Pourquoi des séances ici</h2><p>' + E(t.pitch) + '</p>' +
      '<h2>Créneaux et équipements</h2><p>' + E(C.venueSlotsText(v).join(', ') || 'à préciser') + '</p><p>' + E(C.venueEquipText(v).join(', ') || '') + '</p>' +
      '<h2>Formules</h2><ul>' + v.formulas.map(function (id) { var f = C.formulaById(id); return '<li><b>' + f.n + ' · ' + E(f.label) + '</b> : ' + E(C.formulaAmount(f, g)) + '</li>'; }).join('') + '</ul>' +
      '<h2>Six séances possibles</h2><table>' + sess.map(function (x) { return '<tr><td>' + E(x.s.name) + '</td><td>En 1 h : ' + E(U.lc(x.oneHour)) + '</td></tr>'; }).join('') + '</table>' +
      '<h2>Estimation par mois</h2><table><tr><td>Séances</td><td class="r">' + String(g.sessions).replace('.', ',') + '</td></tr><tr><td>Participants</td><td class="r">' + g.participants + '</td></tr><tr><td>Chiffre d’affaires additionnel</td><td class="r">' + U.eur(g.ca) + '</td></tr><tr><td>Marge brute</td><td class="r">' + U.eur(g.marge) + '</td></tr></table>' +
      '<h2>Ce que les participants s’engagent à faire</h2><ul>' + C.VENUE_RULES.map(function (r) { return '<li>' + E(r) + '</li>'; }).join('') + '</ul>' +
      '<p class="foot">Estimations indicatives, à vérifier sur place. Fiche générée par Cordes le ' + E(U.dateShort(new Date())) + ' ' + new Date().getFullYear() + '.</p>';
    return page('Fiche lieu · ' + (v.name || 'Mon lieu'), body);
  };

  /* ---------- charte d'une page (10 clauses de l'étude, § 06c) ---------- */
  C.venueCharterClauses = function (v) {
    v = C.migrateVenue(v);
    var g = C.venueGain(v), slots = C.venueSlotsText(v).join(', ') || 'à préciser';
    var fl = v.formulas.map(function (id) { var f = C.formulaById(id); return 'formule ' + f.n + ', ' + f.label.toLowerCase() + ' : ' + C.formulaAmount(f, g); }).join(' ; ') || 'à préciser';
    return [
      ['Créneaux', 'Le lieu choisit ses créneaux et sa jauge, et peut fermer un créneau sous 7 jours. Créneaux retenus : ' + slots + ' ; jauge : ' + U.num(v.capacity, 8) + ' personnes, groupes de 2 à 8.'],
      ['Formule', 'Une formule écrite, avec ses montants, figée 12 mois. Aucune baisse en cours de contrat. Formule retenue : ' + fl + '.'],
      ['Consommation', 'Une consommation minimale par participant, rappelée à l’inscription.'],
      ['Assurance', 'Responsabilité civile de la plateforme pour les séances ; matériel du lieu utilisé selon ses règles.'],
      ['Annulation', '48 h des deux côtés ; au-delà, le créneau est dû pour la formule 3.'],
      ['Paiement', 'Versements le 15 du mois suivant, avec le détail par séance.'],
      ['Données', 'Rapport mensuel anonymisé envoyé au lieu ; aucune donnée personnelle des participants transmise sans leur accord.'],
      ['Exclusivité', 'Aucune, des deux côtés.'],
      ['Règles légales', 'Séances avec alcool seulement dans un lieu licencié ; jauge de l’établissement respectée ; cuisine seulement avec un plan adapté.'],
      ['Sortie', 'Préavis de 30 jours ; tout changement de formule proposé 60 jours avant, avec le choix de garder l’ancienne.']
    ];
  };
  C.venueCharter = function (v) {
    v = C.migrateVenue(v);
    var d = new Date(), end = U.addDays(d, 365);
    return ['CHARTE LIEU PARTENAIRE · CORDES', 'Entre ' + (v.name || 'le lieu') + ' (' + C.venueType(v.type).label.toLowerCase() + ', ' + (C.zoneOf(v.city, v.arr) || 'adresse à préciser') + ') et Cordes.',
      'Date : ' + U.dateShort(d) + ' ' + d.getFullYear() + ' · durée : 12 mois, jusqu’au ' + U.dateShort(end) + ' ' + end.getFullYear() + '.', '']
      .concat(C.venueCharterClauses(v).map(function (c, i) { return (i + 1) + '. ' + c[0] + ' · ' + c[1]; }))
      .concat(['', 'Signature du lieu :', '', 'Signature de Cordes :', '', 'Modèle indicatif, à faire relire par un juriste avant usage.']).join('\n');
  };
  C.venueCharterHTML = function (v) {
    v = C.migrateVenue(v);
    var d = new Date(), E = U.esc;
    var body = '<div class="k">Cordes · charte lieu partenaire</div><h1>' + E(v.name || 'Le lieu') + '</h1><p>' + E(C.venueType(v.type).label) + ' · ' + E(C.zoneOf(v.city, v.arr) || '') + ' · le ' + E(U.dateShort(d) + ' ' + d.getFullYear()) + ' · durée 12 mois</p>' +
      '<table>' + C.venueCharterClauses(v).map(function (c, i) { return '<tr><td style="width:150px"><b>' + (i + 1) + ' · ' + E(c[0]) + '</b></td><td>' + E(c[1]) + '</td></tr>'; }).join('') + '</table>' +
      '<div class="sign"><div>Pour le lieu · nom, date, signature</div><div>Pour Cordes · nom, date, signature</div></div><p class="foot">Modèle indicatif, à faire relire par un juriste avant usage.</p>';
    return page('Charte · ' + (v.name || 'lieu'), body);
  };

  /* ---------- kit de communication du lieu ---------- */
  C.venueLink = function (v) { var slug = (v && v.slug) || C.venueSlug(v && v.name); return C.PUBLIC_URL ? C.PUBLIC_URL.replace(/\/$/, '') + '/#/l/' + slug : 'cordes · ' + ((v && v.name) || 'mon lieu'); };
  C.venueKit = function (v) {
    v = C.migrateVenue(v);
    var sess = C.venueSessions(v, 3), name = v.name || 'notre lieu', slots = C.venueSlotsText(v), s0 = sess[0] && sess[0].s;
    var when = slots[0] ? slots[0] : 'un créneau calme de la semaine';
    return {
      title: 'Ici, on apprend en une heure', sessions: sess, slots: slots, link: C.venueLink(v),
      posts: [
        'Nouveau chez ' + name + ' : des séances d’une heure en petit groupe pour apprendre un geste. ' + (s0 ? 'On commence par ' + C.nm(s0) + ', ' : 'Premières séances ') + when + '. Places limitées, inscription sur Cordes.',
        'Coulisses : la table est prête, l’hôte aussi. ' + (s0 ? 'Une heure de ' + C.nm(s0) + ' et chacun repart en sachant ' + U.lc(s0.levels[0]) + '.' : 'Une heure pour apprendre un geste avec des voisins.') + ' Venez voir comment ça se passe.',
        'Résultat de la séance d’hier chez ' + name + ' : quatre voisins, une heure, et tout le monde est reparti avec quelque chose de fait. Prochaine date ' + when + '.'
      ],
      message: 'Bonjour,\n\nÀ partir de ce mois, ' + name + ' accueille des séances d’une heure en petit groupe pour apprendre un geste : ' + sess.map(function (x) { return C.nm(x.s); }).join(', ') + '. Ça se passe ' + (slots.join(', ') || 'aux heures calmes') + '.\n\nVous êtes les premiers prévenus : réservez votre place auprès de nous ou sur ' + C.venueLink(v) + '.\n\nÀ bientôt',
      story: { title: 'Ici, on apprend en une heure', lines: sess.map(function (x) { return x.s.short || x.s.name; }) }
    };
  };

  // affiche A4 et chevalet A6 en HTML imprimable (une page chacun)
  C.venuePrintHTML = function (v) {
    v = C.migrateVenue(v);
    var k = C.venueKit(v), E = U.esc;
    var block = function (cls) { return '<section class="' + cls + '"><div class="k">' + E(v.name || 'Notre lieu') + '</div><h1>' + E(k.title) + '</h1><p>Des séances d’une heure en petit groupe, avec des voisins. On repart en sachant faire.</p><ul>' + k.sessions.map(function (x) { return '<li><b>' + E(x.s.name) + '</b><br>En 1 h : ' + E(U.lc(x.oneHour)) + '</li>'; }).join('') + '</ul>' + (k.slots.length ? '<p><b>Créneaux :</b> ' + E(k.slots.join(', ')) + '</p>' : '') + '<p class="foot">' + E(k.link) + '</p></section>'; };
    var css = 'body{margin:0;font:14px/1.5 Georgia,serif;color:#111}section{box-sizing:border-box;padding:18mm;page-break-after:always;overflow:hidden}.a4{width:210mm;min-height:297mm}.a6{width:105mm;min-height:148mm;padding:9mm;font-size:11px}' +
      '.k{font:600 11px monospace;letter-spacing:.1em;text-transform:uppercase;color:#0a7c96}h1{font:400 40px/1.1 Georgia,serif;margin:8px 0}.a6 h1{font-size:22px}ul{padding-left:18px}li{margin:8px 0}.foot{margin-top:16px;font:500 12px monospace;color:#444}@page{margin:0}';
    return '<!DOCTYPE html>\n<html lang="fr"><head><meta charset="utf-8"><title>Affiche et chevalet · ' + E(v.name || 'lieu') + '</title><style>' + css + '</style></head><body>' + block('a4') + block('a6') + '</body></html>';
  };

  /* ---------- lieux connus : démonstration et lieu de l'appareil ---------- */
  C.venuesAll = function () {
    if (!C.DEMO_VENUES) C.loadVenues();
    var out = C.DEMO_VENUES.slice(), mine = C.LS && C.LS.get(C.KEYS.venue, null);
    if (mine && mine.name && mine.slots && mine.slots.length) out.unshift(C.migrateVenue(Object.assign({ mine: true }, mine)));
    return out;
  };
  C.venueBySlug = function (slug) { return C.venuesAll().filter(function (v) { return v.slug === slug; })[0] || null; };
  // lieux où une compétence se pratique bien (mêmes règles que C.venueMatch), ceux de la zone d'abord
  C.venuesFor = function (skillId, zone, n) {
    var s = C.data.sById[skillId]; if (!s) return [];
    var z = U.norm(zone || ''), city = z.split(' ')[0];
    return C.venuesAll().map(function (v) {
      var sc = C.venueSkillScore(v, s); if (!sc || sc.score <= 0.45) return null;
      var vz = U.norm(C.zoneOf(v.city, v.arr)), near = z && vz === z ? 2 : city && vz.split(' ')[0] === city ? 1 : 0;
      return { v: v, score: sc.score + near * 0.2, demo: !!v.demo, near: near };
    }).filter(Boolean).sort(function (a, b) { return b.score - a.score; }).slice(0, n || 3);
  };

  /* ---------- mesure : entonnoir des lieux ---------- */
  C.FUNNEL_VENUE = [
    { id: 'v-type', label: 'Type choisi', test: function (ev) { return ev.e === 'venue_type'; } },
    { id: 'v-slots', label: 'Créneaux indiqués', test: function (ev) { return ev.e === 'venue_slots'; } },
    { id: 'v-sim', label: 'Simulateur vu', test: function (ev) { return /^venue_(sim_view|sim_edit|compare|pitch_open)$/.test(ev.e); } },
    { id: 'v-docs', label: 'Kit ou charte téléchargé', test: function (ev) { return /^venue_(kit_dl|charter_dl|sheet_dl)$/.test(ev.e); } },
    { id: 'v-join', label: 'Inscription du lieu', test: function (ev) { return ev.e === 'venue_join' || (ev.e === 'waitlist' && ev.p && ev.p.role === 'lieu'); } }
  ];
})(window);
