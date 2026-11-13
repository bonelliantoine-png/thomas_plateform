/* Écrans de croissance et d'étude : liste d'attente localisée (A1) et compteur de quartier (A8), mes données (A2),
   tableau de bord de mesure (A3, A6), questionnaire de fin (A6), progrès et re-bilan (A5), comparaison de groupe (A7),
   parcours lieu partenaire (A10). Branche aussi la mesure d'audience sur le routeur et les actions. */
(function (W) {
  'use strict';
  var C = W.Cordes, U = C.util, ui = C.ui, E = ui.e;
  var sname = function (id) { var s = C.data.sById[id]; return s ? s.name : id; };
  var plural = function (n, one, many) { return n + ' ' + (n > 1 ? (many || one + 's') : one); };

  /* ---------- mesure : vues, démarrages, usages ---------- */
  var render0 = ui.render;
  ui.render = function (opts) {
    render0(opts);
    var r = ui.current && ui.current.route; if (!r) return;
    var key = r.path === 'bilan' && r.param ? 'bilan/' + r.param : r.path === 'admin' ? 'admin' : r.path;
    if (key === ui._lastView) return;
    ui._lastView = key;
    C.track('view', { r: key });
    // A5 : un instantané daté par jour quand un vrai bilan arrive aux résultats
    if ((key === 'resultats' || key === 'offre') && ui.st && ui.st.mode && ui.st.step === 'done' && !ui.st.demo) C.history.upsertToday(ui.st);
  };
  var start0 = ui.actions.start;
  ui.actions.start = function (el) { C.track('start', { m: el.getAttribute('data-mode') }); return start0.apply(this, arguments); };
  ['share', 'passport', 'ics', 'json', 'print', 'cv', 'wishlist', 'challengeIcs', 'cardDl', 'gocompare'].forEach(function (k) {
    var f = ui.actions[k]; if (!f) return;
    ui.actions[k] = function () { C.track('use', { k: k === 'cardDl' ? 'card' : k }); return f.apply(this, arguments); };
  });
  var boot0 = ui.boot;
  ui.boot = function () { boot0(); C.loadAnalytics(); };

  /* ---------- menu : navigation complète, regroupée ---------- */
  ui.actions.menu = function () {
    var st = ui.st, groups = [];
    var mine = [];
    if (st && st.mode) {
      mine.push([st.step === 'done' ? ui.resultRoute() : '#/bilan/' + (st.step || 'contexte'), st.step === 'done' ? 'Mes résultats' : 'Reprendre mon bilan']);
      if (st.mode === 'both' && st.step === 'done') mine.push(['#/offre', 'Mon plan de valorisation']);
      mine.push(['#/progres', 'Mes progrès']);
    }
    mine.push(['#/donnees', 'Mes données']);
    groups.push(['Mon bilan', mine]);
    groups.push(['Outils', [['#/outils/autour', 'Autour de moi'], ['#/outils/recherches', 'Recherches préparées'], ['#/comparer', 'Comparer avec un ami'], ['#/groupe', 'Comparer en groupe'], ['#/copilote', 'Copilote IA']]]);
    groups.push(['La plateforme', [['#/attente', 'Liste d’attente'], ['#/lieu', 'Proposer un lieu'], ['#/demo', 'Démo'], ['#/comment', 'Comment ça marche'], ['#/admin/metrics', 'Mesure et questionnaire']]]);
    ui.drawer('Menu', groups.map(function (g) {
      return '<div class="lbl" style="margin-top:14px">' + E(g[0]) + '</div><nav class="menulist" aria-label="' + E(g[0]) + '">' + g[1].map(function (l) { return '<a href="' + l[0] + '" data-act="menuGo">' + E(l[1]) + ui.icon('arrowR') + '</a>'; }).join('') + '</nav>';
    }).join('') + (st && st.mode ? '<button class="btn ghost danger" data-act="reset" style="margin-top:20px">Réinitialiser mon bilan</button>' : ''));
  };

  /* ---------- A8 · compteur d'ouverture ---------- */
  ui.quarterHTML = function (zone, opts) {
    opts = opts || {};
    var q = C.quarterCount(zone);
    var lbl = C.zoneLabel(q.zone);
    return '<div class="quarter"><div class="spread"><div class="qt">' + E(lbl) + ' ouvre à ' + q.goal + ' inscrits</div><div class="qn num"><b>' + q.total + '</b> / ' + q.goal + '</div></div>' +
      '<div class="qbar" role="img" aria-label="' + q.total + ' inscrits sur ' + q.goal + '"><b class="demo" style="width:' + Math.round(q.demo / q.goal * 100) + '%"></b><b class="mine" style="width:' + Math.round(Math.min(q.local, q.goal - Math.min(q.demo, q.goal)) / q.goal * 100) + '%"></b></div>' +
      '<div class="legend" style="margin-top:8px"><span><span class="sw" style="background:var(--line-2)"></span>' + q.demo + ' valeur de démonstration</span><span><span class="sw" style="background:var(--int)"></span>' + plural(q.local, 'inscription') + ' sur cet appareil</span></div>' +
      (opts.noText ? '' : '<p class="sp" style="margin-top:10px">' + (q.open ? 'Le seuil est atteint : les premières séances peuvent être planifiées.' : 'Il manque ' + q.missing + ' personne' + (q.missing > 1 ? 's' : '') + ' pour ouvrir ' + E(/^Paris \d/.test(q.zone) ? 'le ' + q.zone.replace('Paris ', '') : q.zone) + '. Chaque voisin invité rapproche l’ouverture.') + '</p>') + '</div>';
  };

  /* ---------- A1 · liste d'attente ---------- */
  function wlState(st, param) {
    var f = ui._wl;
    if (!f || (param && f.param !== param)) {
      var pre = C.waitlist.prefill(st), last = st.waitlist || {};
      var city = last.city || st.context.city || 'Paris';
      f = ui._wl = {
        param: param, role: param === 'host' ? 'transmettre' : param === 'lieu' ? 'lieu' : (last.role || (st.mode === 'offer' ? 'transmettre' : 'apprendre')),
        city: city, arr: last.arr || (C.zoneOf(city).match(/Paris (\d+\w+)/) || [])[1] || (C.isParis(city) ? '11e' : ''),
        email: last.email || '', wants: pre.wants.slice(), offers: pre.offers.slice(), pre: pre, consent: false
      };
    }
    return f;
  }
  ui.routes.attente = {
    title: 'Liste d’attente',
    render: function (st, param) {
      var f = wlState(st, param), zone = C.zoneOf(f.city, f.arr), w = st.waitlist, list = C.waitlist.list();
      var venue = C.LS.get(C.KEYS.venue, null);
      var html = '<div class="wrap"><div class="kicker">Bientôt · ouverture quartier par quartier</div><h1 class="h1">Rejoindre la plateforme Cordes</h1>' +
        '<p class="lead">Chaque mois, une compétence de plus avec des gens de son quartier : des séances d’une heure, en groupe de 2 à 4, dans des cafés, ateliers et studios partenaires aux heures creuses. Un quartier ouvre quand ' + C.OPEN_GOAL + ' voisins se sont inscrits.</p>';
      if (w && w.at) html += '<div class="note int" style="margin-top:18px"><span class="lbl">Inscription enregistrée · ' + E(U.dateShort(new Date(w.at))) + '</span><span class="sp">' + E(C.ROLES[w.role] || w.role) + ' · ' + E(w.zone || '') + (w.role === 'transmettre' ? ' · statut hôte fondateur réservé' : '') + '. ' + (w.sent ? 'Transmise à l’équipe.' : 'Gardée sur cet appareil : l’envoi est désactivé dans ce prototype.') + '</span></div>';
      html += '<div class="wlgrid" style="margin-top:20px"><section class="panel"><div class="ph"><span class="t">' + (w && w.at ? 'Modifier mon inscription' : 'Mon inscription') + '</span><span class="hint">1 minute</span></div><div class="pb">' +
        '<span class="lbl">Je veux</span><div style="margin-top:8px">' + ui.seg('_', [['apprendre', 'Apprendre'], ['transmettre', 'Transmettre'], ['lieu', 'Proposer un lieu']], f.role, 'Rôle').replace(/data-act="set" data-bind="_"/g, 'data-act="wlRole"').replace('class="seg"', 'class="seg full"') + '</div>' +
        (f.role === 'transmettre' ? '<div class="note int" style="margin-top:14px"><span class="lbl">Hôte fondateur</span><span class="sp">Les 50 premiers hôtes animent la séance pilote accompagnés, gardent un tarif membre à vie et choisissent leurs créneaux en premier.</span></div>' : '') +
        '<div class="grid2 tightgrid"><label class="field"><span class="lbl">Ville</span><input class="input" id="wl-city" value="' + E(f.city) + '" autocomplete="address-level2" placeholder="Paris, Lyon, Nantes…"></label>' +
        (C.isParis(f.city) ? '<label class="field"><span class="lbl">Arrondissement</span><select class="input" id="wl-arr"><option value="">Choisir</option>' + C.PARIS_ARR.map(function (a) { return '<option' + (a === f.arr ? ' selected' : '') + '>' + a + '</option>'; }).join('') + '</select></label>' : '<div></div>') + '</div>';
      if (f.role === 'lieu') {
        html += '<div class="field"><span class="lbl">Mon lieu</span>' + (venue && venue.name ? '<div class="resitem"><div class="nm">' + E(venue.name) + '</div><a class="btn ghost sm" href="#/lieu">Modifier</a><div class="m">' + E((C.VENUE_TYPES.filter(function (t) { return t[0] === venue.type; })[0] || ['', ''])[1]) + ' · ' + plural(U.arr(venue.slots).length, 'créneau', 'créneaux') + ' · ' + U.num(venue.capacity, 8) + ' places</div></div>' : '<p class="sp">Décrire le lieu en 2 minutes : créneaux creux, capacité, équipements. Cordes en déduit les compétences compatibles et une estimation de fréquentation.</p><a class="btn" style="margin-top:8px" href="#/lieu">Décrire mon lieu ' + ui.icon('arrowR') + '</a>') + '</div>';
      } else {
        html += skillPick('Ce que je veux apprendre', 'wants', f.pre.wants, f.wants, 'Retenir des envies dans le bilan pour les ajouter ici.') +
          skillPick('Ce que je peux transmettre (niveau 3 ou plus)', 'offers', f.pre.offers, f.offers, 'Aucune compétence notée « je maîtrise » dans le bilan.');
        if (!st.mode) html += '<p class="faint" style="margin-top:8px">Le bilan pré-remplit ces listes. <a href="#/accueil">Faire mon bilan</a></p>';
      }
      html += '<label class="field"><span class="lbl">E-mail pour être prévenu (facultatif)</span><input class="input" type="email" id="wl-email" value="' + E(f.email) + '" autocomplete="email" placeholder="vous@exemple.fr"></label>' +
        '<label class="consent"><input type="checkbox" id="wl-consent"' + (f.consent ? ' checked' : '') + '><span>J’accepte que Cordes conserve ces informations dans le seul but de me prévenir de l’ouverture dans ma zone et d’organiser les premières séances. Je peux les supprimer à tout moment depuis « Mes données ».</span></label>' +
        '<button class="btn primary lg" style="margin-top:18px" data-act="wlSave">' + (w && w.at ? 'Mettre à jour' : 'M’inscrire') + '</button>' +
        '<p class="faint" style="margin-top:10px;font-size:11.5px">' + (C.WAITLIST_ENDPOINT ? 'L’inscription est envoyée à l’équipe Cordes et gardée sur cet appareil.' : 'Prototype : l’envoi est désactivé. L’inscription reste dans ce navigateur et s’exporte en CSV.') + '</p></div></section>';
      html += '<div class="stack"><section class="panel"><div class="ph"><span class="t">Ouverture du quartier</span><span class="hint" id="wl-zone">' + E(zone || 'zone à préciser') + '</span></div><div class="pb" id="wl-quarter">' + ui.quarterHTML(zone || 'Paris 11e') + '</div></section>' +
        '<section class="panel"><div class="ph"><span class="t">Trois façons de participer</span></div><div class="pb">' + [['Apprendre', 'Première séance offerte, puis un abonnement à partir de 12 € par mois avec un crédit inclus.'], ['Transmettre', 'Les hôtes sont payés 12 € par place occupée, ou 2 crédits par séance. Le copilote aide à construire la trame.'], ['Lieu partenaire', 'Une heure creuse contre 4 à 10 clients qui consomment, sans loyer ni engagement.']].map(function (x) { return '<div class="resitem"><div class="nm">' + E(x[0]) + '</div><span></span><div class="d">' + E(x[1]) + '</div></div>'; }).join('') + '</div></section>' +
        '<section class="panel"><div class="ph"><span class="t">Inscriptions sur cet appareil</span><span class="count">' + list.length + '</span></div><div class="pb">' +
        (list.length ? '<div class="reslist">' + list.slice(-5).reverse().map(function (e) { return '<div class="resitem"><div class="nm" style="font-size:15px">' + E(C.ROLES[e.role] || e.role) + ' · ' + E(e.zone) + '</div><span class="faint">' + E(U.dateShort(new Date(e.at))) + '</span><div class="m">' + (e.email ? E(e.email) + ' · ' : '') + plural(U.arr(e.wants).length, 'envie') + ' · ' + plural(U.arr(e.offers).length, 'compétence') + (e.venue ? ' · ' + E(e.venue.name) : '') + '</div></div>'; }).join('') + '</div>' : '<p class="empty">Aucune inscription pour l’instant.</p>') +
        '<div class="row" style="margin-top:12px"><button class="btn" data-act="wlCsv"' + (list.length ? '' : ' disabled') + '>' + ui.icon('dl') + ' Exporter en CSV</button></div></div></section></div></div></div>';
      return html;
    },
    mount: function (root) {
      var city = ui.$('#wl-city', root), arr = ui.$('#wl-arr', root), email = ui.$('#wl-email', root), cons = ui.$('#wl-consent', root);
      var upd = function () {
        var f = ui._wl; var z = C.zoneOf(f.city, f.arr);
        var q = ui.$('#wl-quarter'), h = ui.$('#wl-zone'); if (q) q.innerHTML = ui.quarterHTML(z || 'Paris 11e'); if (h) h.textContent = z || 'zone à préciser';
      };
      if (city) {
        city.addEventListener('input', function () { ui._wl.city = city.value; upd(); });
        city.addEventListener('change', function () { var wasP = !!ui.$('#wl-arr'); if (wasP !== C.isParis(city.value)) ui.render(); });
      }
      if (arr) arr.addEventListener('change', function () { ui._wl.arr = arr.value; upd(); });
      if (email) email.addEventListener('input', function () { ui._wl.email = email.value; });
      if (cons) cons.addEventListener('change', function () { ui._wl.consent = cons.checked; });
    }
  };
  function skillPick(label, key, pool, sel, empty) {
    return '<div class="field"><span class="lbl">' + E(label) + '</span>' + (pool.length ? '<div class="chips" style="margin-top:8px">' + pool.map(function (id) { var on = sel.indexOf(id) >= 0; return '<button type="button" class="chip' + (on ? ' on' : '') + '" aria-pressed="' + on + '" data-act="wlSkill" data-k="' + key + '" data-id="' + E(id) + '"><i></i>' + E(sname(id)) + '</button>'; }).join('') + '</div>' : '<p class="faint" style="margin-top:4px">' + E(empty) + '</p>') + '</div>';
  }
  ui.actions.wlRole = function (el) { ui._wl.role = el.getAttribute('data-val'); ui.render(); };
  ui.actions.wlSkill = function (el) { var a = ui._wl[el.getAttribute('data-k')], id = el.getAttribute('data-id'), i = a.indexOf(id); if (i >= 0) a.splice(i, 1); else a.push(id); ui.render(); };
  ui.actions.wlSave = function () {
    var f = ui._wl, venue = C.LS.get(C.KEYS.venue, null);
    f.email = (ui.$('#wl-email').value || '').trim(); f.consent = ui.$('#wl-consent').checked; f.city = ui.$('#wl-city').value.trim();
    if (ui.$('#wl-arr')) f.arr = ui.$('#wl-arr').value;
    var entry = { id: (ui.st.waitlist && ui.st.waitlist.id) || undefined, role: f.role, city: f.city, arr: C.isParis(f.city) ? f.arr : '', zone: C.zoneOf(f.city, f.arr), email: f.email || undefined, consent: f.consent, wants: f.role === 'lieu' ? [] : f.wants.slice(), offers: f.role === 'lieu' ? [] : f.offers.slice() };
    if (f.role === 'lieu' && venue && venue.name) entry.venue = { name: venue.name, type: venue.type, capacity: venue.capacity, slots: venue.slots, equip: venue.equip, formula: venue.formula };
    var errs = C.waitlist.validate(entry);
    if (errs.length) { ui.toast(errs[0], 'no'); var foc = !entry.consent && errs[0].indexOf('consentement') >= 0 ? '#wl-consent' : !entry.zone ? '#wl-city' : '#wl-email'; if (ui.$(foc)) ui.$(foc).focus(); return; }
    saveEntry(entry);
  };
  function saveEntry(entry) {
    var saved = C.waitlist.add(entry);
    ui.st.waitlist = { id: saved.id, role: saved.role, zone: saved.zone, city: saved.city, arr: saved.arr, email: saved.email, at: saved.at, sent: false };
    ui.save(true);
    C.track('waitlist', { role: saved.role });
    ui.toast(saved.role === 'transmettre' ? 'Inscrit comme hôte fondateur' : 'Inscription enregistrée');
    C.waitlist.send(saved).then(function (r) { if (r.sent) { ui.st.waitlist.sent = true; ui.save(true); ui.toast('Inscription transmise'); ui.render(); } })
      .catch(function () { ui.toast('Envoi impossible : inscription gardée sur l’appareil', 'wait'); });
    ui._wl = null; ui.render();
    return saved;
  }
  ui.actions.wlCsv = function () { C.download('cordes-liste-attente.csv', C.waitlist.csv(), 'text/csv;charset=utf-8'); ui.toast('Liste exportée en CSV'); };

  /* ---------- A10 · lieu partenaire ---------- */
  function venueState() { if (!ui._venue) ui._venue = Object.assign(C.defaultVenue(), C.LS.get(C.KEYS.venue, {}) || {}); return ui._venue; }
  function venueSave() { C.LS.set(C.KEYS.venue, ui._venue); }
  function venueOut(v) {
    var m = C.venueMatch(v, 10), e = C.venueEstimate(v), sheet = C.venueSheet(v);
    return '<div class="counters" style="grid-template-columns:1fr 1fr">' + ui.counter('Séances par mois', e.sessions, plural(e.slots, 'créneau creux', 'créneaux creux'), 'sent') + ui.counter('Participants', e.visitors, 'par mois · ' + e.newClients + ' nouveaux', 'int') +
      ui.counter('Consommations', e.ticket ? U.fmt(e.conso) + '<small> €</small>' : '—', e.ticket ? 'ticket moyen ' + U.eur(e.ticket) : 'lieu sans consommation', e.ticket ? 'int' : '') + ui.counter('Univers', m.universes.length, m.universes.slice(0, 3).map(function (u) { return C.universe(u).short; }).join(', ') || 'à préciser', 'wait') + '</div>' +
      (e.share ? '<p class="faint" style="margin-top:8px">Partage de recette : environ ' + U.eur(e.share) + ' par mois en plus (15 % de places à 12 €).</p>' : '') +
      '<div class="lbl" style="margin-top:16px">Compétences compatibles · ' + m.total + ' au catalogue</div><div class="reslist">' + m.skills.map(function (x) { return '<div class="resitem"><div class="nm" style="font-size:15px">' + E(x.s.name) + '</div><span></span><div class="m">' + ui.uniTag(x.s.universe) + ' · demande ' + x.s.attrs.demand + '/3' + (x.s.attrs.oneHourResult ? ' · résultat en 1 h' : '') + '</div></div>'; }).join('') + '</div>' +
      ui.copyBlock('Fiche partenaire', sheet, 'venuesheet');
  }
  ui.routes.lieu = {
    title: 'Lieu partenaire',
    render: function (st) {
      var v = venueState(), done = ui.st.waitlist && ui.st.waitlist.role === 'lieu';
      var grid = '<div class="slotgrid" role="group" aria-label="Créneaux creux"><span></span>' + C.VENUE_MOMENTS.map(function (m) { return '<span class="sh">' + E(m[1]) + '</span>'; }).join('') +
        C.VENUE_DAYS.map(function (d, i) { return '<span class="sd">' + E(d) + '</span>' + C.VENUE_MOMENTS.map(function (m) { var k = i + ':' + m[0], on = v.slots.indexOf(k) >= 0; return '<button type="button" class="slot' + (on ? ' on' : '') + '" aria-pressed="' + on + '" aria-label="' + E(d + ' ' + m[1]) + '" data-act="vSlot" data-k="' + k + '">' + (on ? ui.icon('check') : '') + '</button>'; }).join(''); }).join('') + '</div>';
      var html = '<div class="wrap"><div class="kicker">Parcours lieu partenaire · 2 minutes</div><h1 class="h1">Votre lieu, vos heures creuses</h1>' +
        '<p class="lead">Café, bar, studio ou atelier : décrivez vos créneaux calmes, votre capacité et votre matériel. Cordes en déduit les séances qui s’y tiennent bien, une estimation de fréquentation et une fiche partenaire prête à envoyer.</p>' +
        '<div class="venuegrid" style="margin-top:20px"><section class="panel"><div class="ph"><span class="t">Le lieu</span></div><div class="pb">' +
        '<div class="grid2 tightgrid"><label class="field" style="margin-top:0"><span class="lbl">Nom du lieu</span><input class="input" id="v-name" value="' + E(v.name) + '" placeholder="Café des Volontaires"></label>' +
        '<label class="field" style="margin-top:0"><span class="lbl">Ville</span><input class="input" id="v-city" value="' + E(v.city) + '" placeholder="Paris" autocomplete="address-level2"></label></div>' +
        (C.isParis(v.city) ? '<label class="field"><span class="lbl">Arrondissement</span><select class="input" id="v-arr"><option value="">Choisir</option>' + C.PARIS_ARR.map(function (a) { return '<option' + (a === v.arr ? ' selected' : '') + '>' + a + '</option>'; }).join('') + '</select></label>' : '') +
        '<div class="field"><span class="lbl">Type de lieu</span><div class="chips" style="margin-top:8px">' + C.VENUE_TYPES.map(function (t) { var on = v.type === t[0]; return '<button type="button" class="chip' + (on ? ' on' : '') + '" aria-pressed="' + on + '" data-act="vType" data-v="' + t[0] + '"><i></i>' + E(t[1]) + '</button>'; }).join('') + '</div></div>' +
        '<div class="field"><span class="lbl">Créneaux creux réguliers</span><p class="help" style="margin:0 0 8px">Les moments où des tables ou une salle restent libres chaque semaine.</p>' + grid + '</div>' +
        '<div class="field"><div class="spread"><span class="lbl">Capacité d’accueil</span><output class="num" id="v-cap-out">' + U.num(v.capacity, 8) + ' places</output></div><input type="range" id="v-cap" min="2" max="30" step="1" value="' + U.num(v.capacity, 8) + '" aria-label="Capacité d’accueil"></div>' +
        '<div class="field"><span class="lbl">Équipements</span><div class="chips" style="margin-top:8px">' + C.VENUE_EQUIP.map(function (q) { var on = v.equip.indexOf(q[0]) >= 0; return '<button type="button" class="chip' + (on ? ' on' : '') + '" aria-pressed="' + on + '" data-act="vEquip" data-v="' + q[0] + '"><i></i>' + E(q[1]) + '</button>'; }).join('') + '</div></div>' +
        '<div class="field"><span class="lbl">Formule souhaitée</span><div class="opts" style="margin-top:8px">' + C.VENUE_FORMULAS.map(function (f) { var on = v.formula === f[0]; return '<button type="button" class="opt' + (on ? ' on' : '') + '" role="radio" aria-checked="' + on + '" data-act="vFormula" data-v="' + f[0] + '"><span><b style="font:500 13px var(--f-mono);color:var(--fg);display:block">' + E(f[1]) + '</b>' + E(f[2]) + '</span></button>'; }).join('') + '</div></div>' +
        '</div></section>' +
        '<div class="stack venueside"><section class="panel"><div class="ph"><span class="t">Ce que Cordes vous apporterait</span><span class="hint">estimation prudente</span></div><div class="pb" id="venue-out">' + venueOut(v) + '</div></section>' +
        '<section class="panel"><div class="ph"><span class="t">Devenir lieu partenaire</span></div><div class="pb">' +
        (done ? '<div class="note int" style="margin-bottom:12px"><span class="lbl">Lieu inscrit</span><span class="sp">' + E(ui.st.waitlist.zone || '') + ' · nous revenons vers vous avant l’ouverture du quartier.</span></div>' : '') +
        '<label class="field" style="margin-top:0"><span class="lbl">E-mail de contact (facultatif)</span><input class="input" type="email" id="v-email" value="' + E(v.contact || '') + '" autocomplete="email"></label>' +
        '<label class="consent"><input type="checkbox" id="v-consent"><span>J’accepte que Cordes conserve cette fiche pour organiser des séances dans mon lieu. Suppression possible à tout moment depuis « Mes données ».</span></label>' +
        '<div class="row" style="margin-top:14px"><button class="btn primary" data-act="vJoin">' + (done ? 'Mettre à jour' : 'Inscrire mon lieu') + '</button><button class="btn" data-act="vDl">' + ui.icon('dl') + ' Fiche en texte</button></div></div></section></div></div></div>';
      return html;
    },
    mount: function (root) {
      var v = venueState();
      var refresh = function () { venueSave(); var o = ui.$('#venue-out'); if (o) o.innerHTML = venueOut(v); };
      [['#v-name', 'name'], ['#v-email', 'contact']].forEach(function (p) { var el = ui.$(p[0], root); if (el) el.addEventListener('input', function () { v[p[1]] = el.value; refresh(); }); });
      var city = ui.$('#v-city', root);
      if (city) { city.addEventListener('input', function () { v.city = city.value; refresh(); }); city.addEventListener('change', function () { if (!!ui.$('#v-arr') !== C.isParis(city.value)) ui.render(); }); }
      var arr = ui.$('#v-arr', root); if (arr) arr.addEventListener('change', function () { v.arr = arr.value; refresh(); });
      var cap = ui.$('#v-cap', root); if (cap) cap.addEventListener('input', function () { v.capacity = +cap.value; ui.$('#v-cap-out').textContent = cap.value + ' places'; refresh(); });
    }
  };
  function vToggle(key, val) { var v = venueState(), a = v[key], i = a.indexOf(val); if (i >= 0) a.splice(i, 1); else a.push(val); venueSave(); ui.render(); }
  ui.actions.vSlot = function (el) { vToggle('slots', el.getAttribute('data-k')); };
  ui.actions.vEquip = function (el) { vToggle('equip', el.getAttribute('data-v')); };
  ui.actions.vType = function (el) { venueState().type = el.getAttribute('data-v'); venueSave(); ui.render(); };
  ui.actions.vFormula = function (el) { venueState().formula = el.getAttribute('data-v'); venueSave(); ui.render(); };
  ui.actions.vDl = function () { var v = venueState(); C.download('cordes-fiche-lieu.txt', C.venueSheet(v) + '\n', 'text/plain;charset=utf-8'); ui.toast('Fiche téléchargée'); };
  ui.actions.vJoin = function () {
    var v = venueState();
    if (!v.name.trim()) { ui.toast('Indiquer le nom du lieu', 'no'); ui.$('#v-name').focus(); return; }
    if (!v.slots.length) { ui.toast('Choisir au moins un créneau creux', 'no'); return; }
    var entry = { id: (ui.st.waitlist && ui.st.waitlist.role === 'lieu' && ui.st.waitlist.id) || undefined, role: 'lieu', city: v.city, arr: C.isParis(v.city) ? v.arr : '', zone: C.zoneOf(v.city, v.arr), email: (v.contact || '').trim() || undefined, consent: ui.$('#v-consent').checked, wants: [], offers: [],
      venue: { name: v.name.trim(), type: v.type, capacity: v.capacity, slots: v.slots.slice(), equip: v.equip.slice(), formula: v.formula, skills: C.venueMatch(v, 8).skills.map(function (x) { return x.s.id; }) } };
    var errs = C.waitlist.validate(entry);
    if (errs.length) { ui.toast(errs[0], 'no'); return; }
    saveEntry(entry);
  };

  /* ---------- A6 · questionnaire de fin de bilan ---------- */
  function svState() { if (!ui._sv) ui._sv = { u: null, nps: null, int: null, pay: null, miss: '' }; return ui._sv; }
  function scaleBtns(key, vals, cur, label) {
    return '<div class="scale" role="radiogroup" aria-label="' + E(label) + '" style="grid-template-columns:repeat(' + vals.length + ',1fr)">' + vals.map(function (v) { var on = String(cur) === String(v[0]); return '<button type="button" role="radio" aria-checked="' + on + '" class="' + (on ? 'on' : '') + '" data-act="svSet" data-k="' + key + '" data-v="' + E(v[0]) + '">' + E(v[1]) + '</button>'; }).join('') + '</div>';
  }
  ui.surveyPanel = function (st) {
    var last = C.survey.last(), sv = svState(), arm = C.priceArm();
    var html = '<section class="panel" id="survey"><div class="ph"><span class="t">Votre avis en une minute</span><span class="hint">anonyme · gardé sur cet appareil</span></div><div class="pb">';
    if (last && !ui._svAgain) return html + '<div class="note int"><span class="lbl">Merci</span><span class="sp">Réponses enregistrées le ' + E(U.dateShort(new Date(last.at))) + '. Elles aident à décider ce que la plateforme proposera en premier.</span></div><button class="btn ghost sm" style="margin-top:10px" data-act="svAgain">Répondre à nouveau</button></div></section>';
    html += '<div class="qrow"><div class="q">Ce bilan vous a-t-il été utile ?</div>' + scaleBtns('u', [[1, '1'], [2, '2'], [3, '3'], [4, '4'], [5, '5']], sv.u, 'Utilité de 1 à 5') + '<div class="scalelbl"><span>pas du tout</span><span>très utile</span></div></div>' +
      '<div class="qrow"><div class="q">Recommanderiez-vous Cordes à un ami ?</div>' + scaleBtns('nps', [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(function (x) { return [x, String(x)]; }), sv.nps, 'Recommandation de 0 à 10') + '<div class="scalelbl"><span>0 · pas du tout</span><span>10 · certainement</span></div></div>' +
      '<div class="qrow"><div class="q">Des séances d’une heure en petit groupe près de chez vous, ça vous intéresse ?</div>' + scaleBtns('int', [['oui', 'Oui'], ['peut-etre', 'Peut-être'], ['non', 'Non']], sv.int, 'Intérêt pour la plateforme') + '</div>' +
      '<div class="qrow"><div class="q">Pour <b class="num">' + arm + ' €</b> par mois, avec une séance par mois incluse, vous abonneriez-vous ?</div>' + scaleBtns('pay', [['oui', 'Oui'], ['peut-etre', 'Peut-être'], ['non', 'Non, trop cher']], sv.pay, 'Disposition à payer') + '</div>' +
      '<label class="field"><span class="lbl">Qu’est-ce qui manque ? (facultatif)</span><textarea class="input" id="sv-miss" style="min-height:80px" placeholder="Une compétence absente, un outil, une question restée sans réponse…">' + E(sv.miss) + '</textarea></label>' +
      '<div class="row" style="margin-top:14px"><button class="btn primary" data-act="svSend"' + (sv.u && sv.nps != null && sv.int && sv.pay ? '' : ' disabled') + '>Envoyer mes réponses</button><span class="faint">4 questions · aucune donnée personnelle</span></div></div></section>';
    return html;
  };
  function refreshSurvey() { var p = ui.$('#survey'); if (p) { var tmp = document.createElement('div'); tmp.innerHTML = ui.surveyPanel(ui.st); p.replaceWith(tmp.firstChild); } }
  ui.actions.svSet = function (el) { var sv = svState(), k = el.getAttribute('data-k'), v = el.getAttribute('data-v'); var m = ui.$('#sv-miss'); if (m) sv.miss = m.value; sv[k] = /^\d+$/.test(v) ? +v : v; refreshSurvey(); };
  ui.actions.svAgain = function () { ui._svAgain = true; ui._sv = null; refreshSurvey(); };
  ui.actions.svSend = function () {
    var sv = svState(); sv.miss = (ui.$('#sv-miss') || {}).value || '';
    C.survey.save({ u: sv.u, nps: sv.nps, int: sv.int, pay: sv.pay, miss: sv.miss.trim().slice(0, 600), mode: ui.st.mode || null });
    ui._sv = null; ui._svAgain = false; refreshSurvey(); ui.toast('Merci pour vos réponses');
  };

  // bloc ajouté en fin des résultats et du plan de valorisation
  ui.afterResults = function (st) {
    var zone = C.zoneOf(st.context.city) || 'Paris 11e', w = st.waitlist;
    return '<div class="section-h noprint" id="avis" tabindex="-1"><span class="kicker">La suite</span><h2 class="h2">Bientôt près de chez vous</h2></div><div class="grid2 noprint">' + ui.surveyPanel(st) +
      '<section class="panel"><div class="ph"><span class="t">Ouverture de votre quartier</span><span class="hint">' + E(zone) + '</span></div><div class="pb">' + ui.quarterHTML(zone) +
      '<div class="row" style="margin-top:14px">' + (w && w.at ? ui.pill('inscrit · ' + (C.ROLES[w.role] || w.role), 'int') + '<a class="btn ghost" href="#/attente">Modifier</a>' : '<a class="btn primary" href="#/attente">Rejoindre la liste</a>') + '<a class="btn ghost" href="#/progres">Mes progrès</a></div></div></section></div>';
  };

  /* ---------- A2 · mes données ---------- */
  ui.routes.donnees = {
    title: 'Mes données',
    render: function () {
      var keys = C.storedKeys(), total = keys.reduce(function (a, k) { return a + k.size; }, 0);
      return '<div class="wrap narrow"><div class="kicker">Confidentialité</div><h1 class="h1">Vos données restent sur votre appareil</h1>' +
        '<p class="lead">Cordes n’a ni compte ni serveur. Le bilan, l’historique et les réponses sont gardés dans ce navigateur. Vous pouvez tout exporter ou tout effacer en un geste.</p>' +
        '<section class="panel" style="margin-top:20px"><div class="ph"><span class="t">Ce qui quitte l’appareil</span></div><div class="pb"><ul class="clean">' +
        '<li><strong>Autour de moi</strong> : le nom de la ville part vers OpenStreetMap (Nominatim et Overpass) pour trouver des lieux. Rien d’autre.</li>' +
        '<li><strong>Copilote IA</strong> : seulement si vous enregistrez votre clé, le résumé du bilan part vers Anthropic au moment où vous posez une question.</li>' +
        '<li><strong>Liste d’attente</strong> : ' + (C.WAITLIST_ENDPOINT ? 'envoyée à l’équipe Cordes, avec votre consentement explicite.' : 'aucun envoi dans ce prototype ; l’inscription reste ici.') + '</li>' +
        '<li><strong>Lien de partage</strong> : le bilan voyage dans le lien lui-même, sans passer par un serveur.</li>' +
        '<li><strong>Mesure d’audience</strong> : ' + (C.ANALYTICS.provider ? 'des événements anonymes, sans cookie, partent vers ' + E(C.ANALYTICS.provider) + '.' : 'des événements anonymes (étapes atteintes, sans contenu) restent sur cet appareil.') + '</li></ul></div></section>' +
        '<section class="panel" style="margin-top:16px"><div class="ph"><span class="t">Stocké dans ce navigateur</span><span class="hint num">' + U.fmt(total / 1024) + ' Ko</span></div><div class="pb tight">' +
        (keys.length ? keys.map(function (k) { return '<div class="resitem"><div class="nm" style="font-size:15px">' + E(C.KEY_LABELS[k.key] || k.key) + '</div><span class="faint num">' + (k.size < 1024 ? k.size + ' o' : U.fmt(k.size / 1024) + ' Ko') + '</span><div class="m">' + E(k.key) + '</div></div>'; }).join('') : '<p class="empty">Rien n’est stocké pour l’instant.</p>') + '</div></section>' +
        '<section class="panel" style="margin-top:16px"><div class="ph"><span class="t">Mesure d’audience</span></div><div class="pb"><label class="toggle"><input type="checkbox" id="m-on"' + (C.metrics.off() ? '' : ' checked') + '> Participer à la mesure anonyme (aucun cookie, aucun contenu du bilan)</label></div></section>' +
        '<div class="row" style="margin-top:20px"><button class="btn primary" data-act="dataExport">' + ui.icon('dl') + ' Exporter toutes mes données</button><button class="btn danger" data-act="dataErase">Tout supprimer</button></div>' +
        '<p class="faint" style="margin-top:10px;font-size:11.5px">L’export est un fichier JSON lisible (la clé du copilote y est masquée). La suppression efface aussi l’historique, les réponses et la liste d’attente de cet appareil.</p></div>';
    },
    mount: function (root) { var c = ui.$('#m-on', root); if (c) c.addEventListener('change', function () { C.metrics.setOff(!c.checked); ui.toast(c.checked ? 'Mesure activée' : 'Mesure désactivée', c.checked ? 'int' : 'wait'); }); }
  };
  ui.actions.dataExport = function () { C.download('cordes-mes-donnees.json', C.exportAll(), 'application/json'); ui.toast('Export complet téléchargé'); };
  ui.actions.dataErase = function () {
    if (!W.confirm('Supprimer définitivement toutes les données Cordes de ce navigateur ? Le bilan, l’historique, les réponses et la clé du copilote seront effacés.')) return;
    var n = C.eraseAll();
    ui.st = C.defaultState(); ui._wl = null; ui._venue = null; ui._sv = null; ui._cmp = null; ui._grp = null;
    ui.updateSaveBadge(); ui.toast(plural(n, 'élément') + ' supprimé' + (n > 1 ? 's' : ''), 'wait'); ui.render();
  };

  /* ---------- A3 + A6 · tableau de bord de l'étude ---------- */
  ui._mSrc = 'local';
  function fmtDur(s) { s = Math.round(s); return s < 60 ? s + ' s' : Math.floor(s / 60) + ' min ' + ('0' + (s % 60)).slice(-2); }
  ui.routes.admin = {
    title: 'Mesure et questionnaire',
    render: function () {
      var src = ui._mSrc, ev = C.metrics.events(src), R = C.metricsReport(ev), S = R.survey, A = C.ANALYTICS;
      var html = '<div class="wrap"><div class="kicker">Étude · tableau de bord interne</div><h1 class="h1">Mesure d’audience et questionnaire</h1>' +
        '<p class="lead">Événements anonymes, sans cookie : étapes du bilan atteintes, usages, réponses au questionnaire de fin. ' + (A.provider ? 'Envoi actif vers ' + E(A.provider) + '.' : 'Aucun service branché : les chiffres ci-dessous sont ceux de cet appareil.') + '</p>' +
        '<div class="spread" style="margin-top:16px"><div>' + ui.seg('_', [['local', 'Cet appareil'], ['demo', 'Démonstration']], src, 'Source').replace(/data-act="set" data-bind="_"/g, 'data-act="mSrc"') + '</div><div class="row">' +
        (src === 'demo' ? '<button class="btn" data-act="mSim">Générer 80 visites fictives</button>' : '') + '<button class="btn" data-act="mCsv"' + (ev.length ? '' : ' disabled') + '>' + ui.icon('dl') + ' CSV</button><button class="btn ghost danger" data-act="mClear"' + (ev.length ? '' : ' disabled') + '>Vider</button></div></div>' +
        (src === 'demo' ? '<div class="note wait" style="margin-top:14px"><span class="lbl">Données fictives</span><span class="sp">Visites simulées pour montrer le tableau de bord. Elles sont stockées à part et ne se mélangent jamais aux vraies.</span></div>' : '');
      if (!ev.length) return html + '<p class="empty" style="margin-top:20px">Aucun événement. ' + (src === 'demo' ? 'Générer des visites fictives pour voir le tableau de bord.' : 'Parcourir l’app, ou passer en source « Démonstration ».') + '</p></div>';
      var res = R.funnel.filter(function (f) { return f.id === 'results'; })[0];
      html += '<div class="counters" style="margin-top:16px">' + ui.counter('Visites', R.sessions, U.fmt(R.events) + ' événements') + ui.counter('Bilans commencés', R.funnel[1].n, U.pct(R.funnel[1].rate) + ' des visites', 'sent') + ui.counter('Résultats atteints', res.n, U.pct(res.rate) + ' des visites', 'int') + ui.counter('Durée médiane', fmtDur(R.medianSession), 'par visite', 'wait') + '</div>';
      html += '<div class="grid2" style="margin-top:16px"><section class="panel"><div class="ph"><span class="t">Entonnoir</span><span class="hint">visites atteignant chaque étape</span></div><div class="pb">' +
        R.funnel.map(function (f, i) { return '<div class="frow"><div class="spread"><span>' + (i + 1) + ' · ' + E(f.label) + '</span><span class="num"><b>' + f.n + '</b> <span class="faint">' + U.pct(f.rate) + (i ? ' · ' + U.pct(f.conv) + ' de l’étape précédente' : '') + '</span></span></div>' + ui.meter(f.rate * 100, 100, i >= 4 ? 'int' : '') + '</div>'; }).join('') + '</div></section>' +
        '<section class="panel"><div class="ph"><span class="t">Temps passé par écran</span><span class="hint">médiane</span></div><div class="gtable">' +
        '<div class="gtr h" style="grid-template-columns:minmax(0,1fr) 60px 90px"><span>Écran</span><span>Vues</span><span>Médiane</span></div>' +
        R.durations.slice(0, 10).map(function (d) { return '<div class="gtr" style="grid-template-columns:minmax(0,1fr) 60px 90px"><span>' + E(d.route) + '</span><span class="num">' + d.n + '</span><span class="num">' + fmtDur(d.median) + '</span></div>'; }).join('') + '</div></section></div>';
      var cnt = Object.keys(R.counts).sort(function (a, b) { return R.counts[b] - R.counts[a]; });
      html += '<section class="panel" style="margin-top:16px"><div class="ph"><span class="t">Événements</span></div><div class="pb"><div class="row">' + cnt.map(function (k) { return ui.pill(k.replace('use:', 'usage · ').replace('start:', 'départ · ') + ' · ' + R.counts[k], 'idle'); }).join('') + '</div></div></section>';
      html += '<div class="section-h" id="q"><span class="kicker">Questionnaire de fin</span><h2 class="h2">Utilité, recommandation et test du prix</h2></div>';
      if (!S.n) return html + '<p class="empty">Aucune réponse au questionnaire pour l’instant.</p></div>';
      html += '<div class="counters">' + ui.counter('Réponses', S.n, U.pct(S.n / Math.max(1, res.n)) + ' des résultats') + ui.counter('Utilité', String(Math.round(S.avgUtility * 10) / 10).replace('.', ',') + '<small> / 5</small>', 'moyenne', 'int') +
        ui.counter('NPS', (S.nps > 0 ? '+' : '') + S.nps, S.promoters + ' promoteurs · ' + S.detractors + ' détracteurs', S.nps >= 0 ? 'int' : 'no') + ui.counter('Intéressés', U.pct(S.interest.oui / S.n), (S.interest['peut-etre'] || 0) + ' peut-être · ' + (S.interest.non || 0) + ' non', 'sent') + '</div>';
      var tot = S.n;
      html += '<div class="grid2" style="margin-top:16px"><section class="panel"><div class="ph"><span class="t">Intérêt pour la plateforme</span></div><div class="pb">' +
        '<div class="split">' + [['oui', 'var(--int)'], ['peut-etre', 'var(--wait)'], ['non', 'var(--no)']].map(function (x) { return '<b style="flex:' + (S.interest[x[0]] || 0) + ';background:' + x[1] + '"></b>'; }).join('') + '</div>' +
        '<div class="splitlegend">' + [['oui', 'Oui', 'var(--int)'], ['peut-etre', 'Peut-être', 'var(--wait)'], ['non', 'Non', 'var(--no)']].map(function (x) { var n = S.interest[x[0]] || 0; return '<div><span class="sq" style="background:' + x[2] + '"></span><span>' + x[1] + '</span><span class="num">' + n + '</span><span class="pc num">' + U.pct(n / tot) + '</span></div>'; }).join('') + '</div>' +
        '<div class="lbl" style="margin-top:16px">Utilité perçue</div>' + [5, 4, 3, 2, 1].map(function (k) { var n = S.utility[k] || 0; return '<div class="learnrow" style="grid-template-columns:24px 1fr 40px;margin-top:6px"><span class="num">' + k + '</span>' + ui.meter(n / tot * 100, 100, 'int') + '<span class="num faint" style="text-align:right">' + n + '</span></div>'; }).join('') + '</div></section>' +
        '<section class="panel"><div class="ph"><span class="t">Test du prix</span><span class="hint">un prix tiré au hasard par répondant</span></div><div class="gtable">' +
        '<div class="gtr h" style="grid-template-columns:58px 34px minmax(0,1fr) 52px"><span>Prix</span><span>n</span><span>Oui · peut-être · non</span><span>Indice</span></div>' +
        S.arms.map(function (a) { var best = S.best && S.best.price === a.price; return '<div class="gtr' + (best ? ' sel' : '') + '" style="grid-template-columns:58px 34px minmax(0,1fr) 52px"><span class="num"><b>' + a.price + ' €</b></span><span class="num">' + a.n + '</span><span><span class="split" style="margin:0 0 4px"><b style="flex:' + a.yes + ';background:var(--int)"></b><b style="flex:' + a.maybe + ';background:var(--wait)"></b><b style="flex:' + a.no + ';background:var(--no)"></b></span><span class="faint num">' + a.yes + ' · ' + a.maybe + ' · ' + a.no + ' · ' + U.pct(a.rate) + ' de oui</span></span><span class="num">' + String(Math.round(a.revenueIndex * 10) / 10).replace('.', ',') + '</span></div>'; }).join('') +
        '</div><div class="pb"><p class="faint" style="font-size:11.5px">Indice = prix × part de « oui » : le revenu attendu par personne interrogée. ' + (S.best ? 'Meilleur à ce stade : ' + S.best.price + ' €.' : '') + ' Un écart n’est fiable qu’à partir de 30 réponses par prix environ.</p></div></section></div>';
      var miss = C.survey.list().filter(function (x) { return x.miss; }).slice(-6).reverse();
      if (src === 'local' && miss.length) html += '<section class="panel" style="margin-top:16px"><div class="ph"><span class="t">Ce qui manque, en clair</span></div><div class="pb"><ul class="clean">' + miss.map(function (x) { return '<li>' + E(x.miss) + '</li>'; }).join('') + '</ul></div></section>';
      html += '<div class="note" style="margin-top:16px"><span class="lbl">Brancher un service de mesure</span><span class="sp">Renseigner <code>C.ANALYTICS</code> dans <code>js/engine/growth.js</code> : provider « plausible » ou « umami », domaine et URL du script. Les mêmes événements partent alors vers le service, toujours sans cookie.</span></div>';
      return html + '</div>';
    }
  };
  ui.actions.mSrc = function (el) { ui._mSrc = el.getAttribute('data-val'); ui.render(); };
  ui.actions.mSim = function () { C.simulateMetrics(80, 'demo-' + Date.now()); ui.toast('80 visites fictives générées'); ui.render(); };
  ui.actions.mCsv = function () { C.download('cordes-mesure-' + ui._mSrc + '.csv', C.metricsCSV(C.metrics.events(ui._mSrc)), 'text/csv;charset=utf-8'); };
  ui.actions.mClear = function () { if (!W.confirm('Vider les événements de cette source ?')) return; C.metrics.clear(ui._mSrc); ui.render(); };

  /* ---------- A5 · progrès et re-bilan ---------- */
  ui.routes.progres = {
    title: 'Mes progrès',
    render: function (st) {
      if (!st.mode) return ui.emptyBilan();
      var hist = C.history.list();
      if (st.demo) hist = [C.demoPastSnapshot(st)].concat(hist.filter(function (h) { return !h.demo; }));
      var now = C.snapshot(st, 'Bilan actuel'); now.id = 'now';
      var pick = ui._prog || {};
      var a = hist.filter(function (h) { return h.id === pick.a; })[0] || hist[0];
      var html = '<div class="wrap"><div class="kicker">Re-bilan tous les 3 mois</div><h1 class="h1">Ce qui a bougé</h1><p class="lead">Chaque passage aux résultats garde un instantané daté de votre bilan. Comparez deux dates : niveaux gagnés, envies réalisées, nouvelles envies.</p>';
      html += '<div class="row" style="margin-top:16px"><button class="btn primary" data-act="progRedo">Refaire mon bilan</button><button class="btn" data-act="progIcs">' + ui.icon('cal') + ' Rappel dans 90 jours</button><button class="btn ghost" data-act="progSnap">Enregistrer un instantané</button></div>';
      if (!a) return html + '<div class="note wait" style="margin-top:18px"><span class="lbl">Premier instantané</span><span class="sp">Aucun bilan daté pour l’instant. Enregistrer un instantané maintenant, puis revenir dans trois mois pour voir la différence.</span></div></div>';
      var b = pick.b && pick.b !== 'now' ? (hist.filter(function (h) { return h.id === pick.b; })[0] || now) : now;
      var cmp = C.compareSnapshots(a, b);
      var opt = function (sel, list) { return list.map(function (h) { return '<option value="' + E(h.id) + '"' + (h.id === sel ? ' selected' : '') + '>' + E(h.label) + '</option>'; }).join(''); };
      html += '<section class="panel" style="margin-top:18px"><div class="pb"><div class="grid2 tightgrid"><label><span class="lbl">Avant</span><select class="input" id="pg-a" style="margin-top:6px">' + opt(a.id, hist) + '</select></label><label><span class="lbl">Après</span><select class="input" id="pg-b" style="margin-top:6px">' + opt(b.id, [now].concat(hist)) + '</select></label></div>' +
        (a.demo ? '<p class="faint" style="margin-top:10px;font-size:11.5px">Profil de démonstration : l’instantané « avant » est fictif, construit pour montrer la comparaison.</p>' : '') + '</div></section>';
      html += '<div class="counters" style="margin-top:16px">' + ui.counter('Écart', cmp.days + '<small> j</small>', E(U.dateShort(new Date(a.at))) + ' → ' + E(U.dateShort(new Date(b.at)))) + ui.counter('Niveaux gagnés', '+' + cmp.levelsUp, plural(cmp.gained.length + cmp.newSkills.length, 'compétence'), 'int') +
        ui.counter('Envies réalisées', cmp.realized.length, 'sur ' + Object.keys(a.desires).length + ' au départ', cmp.realized.length ? 'int' : 'wait') + ui.counter('Nouvelles envies', cmp.newDesires.length, plural(cmp.kept.length, 'envie') + ' en cours', 'sent') + '</div>';
      var row = function (id, right, meta) { var s = C.data.sById[id]; return '<div class="resitem"><div class="nm" style="font-size:16px">' + E(s.name) + '</div><span>' + right + '</span><div class="m">' + ui.uniTag(s.universe) + (meta ? ' · ' + meta : '') + '</div></div>'; };
      html += '<div class="grid2" style="margin-top:16px"><section class="panel"><div class="ph"><span class="t">Niveaux gagnés</span><span class="count">' + (cmp.gained.length + cmp.newSkills.length) + '</span></div><div class="pb tight">' +
        (cmp.gained.map(function (x) { return row(x.id, ui.dots(x.to), C.LEVELS[x.from].toLowerCase() + ' → ' + C.LEVELS[x.to].toLowerCase()); }).concat(cmp.newSkills.map(function (x) { return row(x.id, ui.dots(x.to), 'nouvelle · ' + C.LEVELS[x.to].toLowerCase()); })).join('') || '<p class="empty">Aucun niveau gagné entre ces deux dates.</p>') + '</div></section>' +
        '<section class="panel"><div class="ph"><span class="t">Envies réalisées</span><span class="count">' + cmp.realized.length + '</span></div><div class="pb tight">' +
        (cmp.realized.map(function (x) { return row(x.id, ui.pill('réalisée', 'int'), 'objectif niveau ' + x.target + ' · atteint ' + x.level); }).join('') || '<p class="empty">Pas encore d’envie réalisée. Le défi 30 jours aide à démarrer.</p>') + '</div></section></div>' +
        '<div class="grid2" style="margin-top:16px"><section class="panel"><div class="ph"><span class="t">Nouvelles envies</span><span class="count">' + cmp.newDesires.length + '</span></div><div class="pb tight">' + (cmp.newDesires.map(function (x) { return row(x.id, ui.pill('nouvelle', 'sent'), ''); }).join('') || '<p class="empty">Aucune nouvelle envie.</p>') + '</div></section>' +
        '<section class="panel"><div class="ph"><span class="t">En cours ou abandonnées</span></div><div class="pb tight">' + (cmp.kept.map(function (x) { return row(x.id, ui.pill(x.progress > 0 ? '+' + x.progress + ' niveau' : 'en cours', 'idle'), ''); }).concat(cmp.dropped.map(function (x) { return row(x.id, ui.pill('abandonnée', 'no'), ''); })).join('') || '<p class="empty">Rien à signaler.</p>') + '</div></section></div>';
      html += '<section class="panel" style="margin-top:16px"><div class="ph"><span class="t">Historique</span><span class="count">' + hist.length + '</span></div><div class="pb"><div class="timeline">' + hist.slice().reverse().map(function (h) {
        return '<div class="tl' + (h.demo ? ' wait' : '') + '"><div class="when">' + E(U.dateShort(new Date(h.at))) + ' ' + new Date(h.at).getFullYear() + (h.demo ? ' · fictif' : '') + '</div><div class="what">' + plural(Object.keys(h.skills).length, 'compétence') + ', ' + plural(Object.keys(h.desires).length, 'envie') + (h.demo ? '' : ' <button class="btn ghost sm" data-act="progDel" data-id="' + E(h.id) + '" aria-label="Supprimer l’instantané du ' + E(U.dateShort(new Date(h.at))) + '">' + ui.icon('x') + '</button>') + '</div></div>';
      }).join('') + '</div></div></section></div>';
      return html;
    },
    mount: function (root) {
      ['#pg-a', '#pg-b'].forEach(function (s, i) { var el = ui.$(s, root); if (el) el.addEventListener('change', function () { ui._prog = ui._prog || {}; ui._prog[i ? 'b' : 'a'] = el.value; ui.render(); }); });
    }
  };
  ui.actions.progSnap = function () { var s = C.snapshot(ui.st); s.manual = true; C.history.add(s); ui.toast('Instantané enregistré'); ui.render(); };
  ui.actions.progDel = function (el) { C.history.remove(el.getAttribute('data-id')); ui._prog = null; ui.render(); };
  ui.actions.progIcs = function () { C.download('cordes-rebilan.ics', C.toICS([C.rebilanEvent()]), 'text/calendar;charset=utf-8'); C.track('use', { k: 'rebilan-ics' }); ui.toast('Rappel ajouté : tous les 3 mois'); };
  ui.actions.progRedo = function () { if (!ui.st.demo) C.history.upsertToday(ui.st); ui.st.step = 'maitrise'; ui.save(true); ui.go('#/bilan/maitrise'); };

  /* ---------- A7 · comparaison de groupe ---------- */
  ui.cmpSwitch = function (cur) {
    return '<nav class="seg navseg" aria-label="Type de comparaison" style="margin-top:14px">' + [['comparer', 'Avec un ami'], ['groupe', 'En groupe']].map(function (x) { return '<a href="#/' + x[0] + '"' + (x[0] === cur ? ' class="on" aria-current="page"' : '') + '>' + E(x[1]) + '</a>'; }).join('') + '</nav>';
  };
  ui.routes.groupe = {
    title: 'Comparer en groupe',
    render: function (st) {
      var g = ui._grp || { input: '', me: !!st.mode };
      var html = '<div class="wrap"><div class="kicker">Troc entre amis</div><h1 class="h1">Comparer en groupe</h1><p class="lead">Une bande de 3 à 8 amis : qui peut apprendre quoi à qui, ce que vous savez tous faire, ce que vous voulez tous apprendre, et des activités à lancer ensemble.</p>' +
        ui.cmpSwitch('groupe') +
        '<section class="panel" style="margin-top:16px"><div class="pb"><label class="lbl" for="grp-in">Liens de bilan, un par ligne (2 à 8)</label><textarea class="input" id="grp-in" style="margin-top:8px;font:12px var(--f-mono);min-height:110px" placeholder="…index.html#b=z…&#10;…index.html#b=z…">' + E(g.input) + '</textarea>' +
        (st.mode ? '<label class="toggle" style="margin-top:6px"><input type="checkbox" id="grp-me"' + (g.me ? ' checked' : '') + '> Inclure mon bilan' + (st.context.firstName ? ' (' + E(st.context.firstName) + ')' : '') + '</label>' : '') +
        '<div class="row" style="margin-top:10px"><button class="btn primary" data-act="grpRun">Comparer</button><button class="btn ghost" data-act="grpDemo">Essayer avec une bande de démo</button>' + (st.mode ? '<button class="btn ghost" data-act="share">' + ui.icon('share') + ' Mon lien à envoyer</button>' : '') + '</div>' +
        (g.error ? '<div class="note no" style="margin-top:12px"><span class="lbl">Comparaison impossible</span><span class="sp">' + E(g.error) + '</span></div>' : '') + '</div></section>';
      if (g.result) html += groupHTML(g.members, g.result);
      return html + '</div>';
    }
  };
  function groupHTML(m, r) {
    var nm = function (i) { return E(m[i].name); };
    var html = '<div class="counters" style="margin-top:18px">' + ui.counter('Membres', r.n, m.map(function (x) { return x.name; }).join(', ')) + ui.counter('Liens de transmission', r.links, U.pct(r.density) + ' des paires possibles', 'int') + ui.counter('Envies communes', r.commonWants.length, 'à apprendre ensemble', 'sent') + ui.counter('Compétences communes', r.commonSkills.length, 'à animer ensemble', 'wait') + '</div>';
    html += '<section class="panel" style="margin-top:16px"><div class="ph"><span class="t">Matrice des trocs</span><span class="hint">ligne : peut apprendre à · colonne : apprend</span></div><div class="pb"><div class="tablewrap"><table class="matrix" style="min-width:' + (90 + m.length * 100) + 'px"><thead><tr><th scope="col" class="rh"><span class="sr">Transmet</span></th>' + m.map(function (x) { return '<th scope="col">' + E(x.name) + '</th>'; }).join('') + '</tr></thead><tbody>' +
      m.map(function (x, i) { return '<tr><th scope="row">' + E(x.name) + '</th>' + m.map(function (y, j) {
        if (i === j) return '<td class="self">·</td>';
        var it = r.matrix[i][j] || [];
        return '<td class="' + (it.length ? 'hot' : 'zero') + '" style="--a:' + Math.min(1, it.length / 3) + '" title="' + E(it.map(function (z) { return sname(z.via); }).join(', ')) + '"><b>' + it.length + '</b>' + (it.length ? '<span>' + E(it.slice(0, 2).map(function (z) { return C.data.sById[z.via].short || sname(z.via); }).join(', ')) + '</span>' : '') + '</td>';
      }).join('') + '</tr>'; }).join('') + '</tbody></table></div></div></section>';
    html += '<div class="grid2" style="margin-top:16px"><section class="panel"><div class="ph"><span class="t">Qui anime quoi</span><span class="count">' + r.hosts.length + '</span></div><div class="pb tight">' +
      (r.hosts.slice(0, 8).map(function (h) { return '<div class="resitem"><div class="nm" style="font-size:16px">' + E(sname(h.want)) + '</div>' + ui.dots(h.level) + '<div class="m">animé par <b style="color:var(--fg);font-weight:500">' + nm(h.teacher) + '</b>' + (h.exact ? '' : ' via ' + E(sname(h.via))) + ' · pour ' + h.learners.map(nm).join(', ') + '</div></div>'; }).join('') || '<p class="empty">Personne ne maîtrise encore une envie d’un autre membre.</p>') + '</div></section>' +
      '<section class="panel"><div class="ph"><span class="t">Activités de groupe</span></div><div class="pb">' + (r.ideas.length ? '<ul class="clean">' + r.ideas.map(function (x) { return '<li>' + E(x) + '</li>'; }).join('') + '</ul>' : '<p class="empty">Ajouter des envies pour obtenir des idées.</p>') +
      (r.commonWants.length ? '<div class="lbl" style="margin-top:14px">Envies communes</div><div class="row" style="margin-top:6px">' + r.commonWants.slice(0, 8).map(function (x) { return ui.pill(sname(x.id) + ' · ' + x.who.length, 'sent'); }).join('') + '</div>' : '') +
      (r.commonSkills.length ? '<div class="lbl" style="margin-top:14px">Compétences communes</div><div class="row" style="margin-top:6px">' + r.commonSkills.slice(0, 8).map(function (x) { return ui.pill(sname(x.id) + ' · ' + x.who.length, 'idle'); }).join('') + '</div>' : '') + '</div></section></div>';
    html += '<section class="panel" style="margin-top:16px"><div class="ph"><span class="t">Projets collectifs à lancer</span></div><div class="pb tight">' + (r.projects.map(function (x) { return '<div class="resitem"><div class="nm">' + E(x.p.name) + '</div><span class="faint">' + x.p.size[0] + '–' + x.p.size[1] + ' pers. · ' + x.p.weeks + ' sem.</span><div class="d">' + E(x.p.desc) + '</div></div>'; }).join('') || '<p class="empty">Aucun gabarit adapté.</p>') + '</div></section>';
    return html;
  }
  ui.actions.grpRun = function () {
    var input = ui.$('#grp-in').value, me = ui.$('#grp-me') ? ui.$('#grp-me').checked : false;
    var links = input.split(/\s+/).map(function (x) { return x.trim(); }).filter(function (x) { return /b=[zj][A-Za-z0-9_-]+/.test(x); });
    ui._grp = { input: input, me: me };
    var total = links.length + (me && ui.st.mode ? 1 : 0);
    if (total < 2) { ui._grp.error = 'Il faut au moins deux bilans : coller au moins un lien (ou deux sans le vôtre). Chaque lien contient « #b= ».'; ui.render(); return; }
    if (total > 8) { ui._grp.error = 'Huit bilans au plus.'; ui.render(); return; }
    Promise.all(links.map(function (l) { return C.decodeShare(l); })).then(function (sts) {
      var members = (me && ui.st.mode ? [{ name: ui.st.context.firstName || 'Moi', st: ui.st }] : []).concat(sts.map(function (s, i) { return { name: s.context.firstName || ('Ami ' + (i + 1)), st: s }; }));
      var seen = {}; members.forEach(function (x) { if (seen[x.name]) x.name += ' ' + (++seen[x.name]); else seen[x.name] = 1; });
      ui._grp.members = members; ui._grp.result = C.groupCompare(members);
      C.track('use', { k: 'group' }); ui.render(); ui.toast('Comparaison de ' + members.length + ' bilans prête');
    }).catch(function (e) { ui._grp.error = e.message + ' Vérifier que chaque lien est complet.'; ui.render(); });
  };
  ui.actions.grpDemo = function () {
    var sts = C.DEMOS.map(function (d) { return C.buildDemo(d.id); }).concat(C.GROUP_FRIENDS.map(function (f) { return C.buildFriend(f.id); }));
    if (ui.st.mode && !ui.st.demo) sts = sts.slice(0, 4);
    Promise.all(sts.map(function (st) { return C.encodeShare(st); })).then(function (codes) {
      ui._grp = { input: codes.map(function (c) { return C.shareUrl(c); }).join('\n'), me: !!(ui.st.mode && !ui.st.demo) };
      ui.render(); ui.actions.grpRun();
    });
  };
})(window);
