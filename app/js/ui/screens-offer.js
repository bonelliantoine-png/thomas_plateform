/* Plan de valorisation de l'offreur : offres, niche, simulateur, canaux, statut, feuille de route, kit, collectif. */
(function (W) {
  'use strict';
  var C = W.Cordes, U = C.util, ui = C.ui, E = ui.e;
  var counter = function () { return ui.counter.apply(null, arguments); };

  function simParams(st, plan) {
    var o0 = plan.offers[0];
    var sim = st.offer.sim = Object.assign({}, st.offer.sim || {});
    var def = { hours: U.num(st.offer.hoursPerWeek, 4), price: o0.price, size: o0.size, fill: 70, dur: o0.duration || 60, mat: 3, status: plan.statuses[0] && plan.statuses[0].s.id, mix: null, offer: o0.id };
    Object.keys(def).forEach(function (k) { if (sim[k] == null) sim[k] = def[k]; });
    // réinitialise prix et jauge si l'offre de référence a changé
    if (sim.offer !== o0.id && !plan.offers.some(function (o) { return o.id === sim.offer; })) { sim.offer = o0.id; sim.price = o0.price; sim.size = o0.size; sim.dur = o0.duration || 60; }
    var top = plan.channels.filter(function (c) { return !c.p.soon; }).slice(0, 3);
    if (!sim.mix || sim.mix.length !== top.length + 1 || sim.mix.some(function (m, i) { return i < top.length && m.id !== top[i].p.id; })) {
      sim.mix = top.map(function (c, i) { return { id: c.p.id, share: [40, 25, 15][i] }; }).concat([{ id: 'direct', share: 20 }]);
    }
    st.offer.sim = sim;
    return { sim: sim, top: top };
  }
  function runSim(st, plan, hoursOverride) {
    var sp = simParams(st, plan), sim = sp.sim;
    var status = C.res.statuses.filter(function (s) { return s.id === sim.status; })[0] || (plan.statuses[0] && plan.statuses[0].s);
    var mix = sim.mix.map(function (m) { return { platform: m.id === 'direct' ? { id: 'direct', name: 'En direct', fee: { type: 'mixed', pct: 1.5, eurPerMonth: 0 } } : C.res.platforms.filter(function (p) { return p.id === m.id; })[0], share: m.share }; }).filter(function (m) { return m.platform; });
    return C.simulate({ hoursPerWeek: hoursOverride != null ? hoursOverride : sim.hours, sessionMin: sim.dur, price: sim.price, size: sim.size, fill: sim.fill / 100, mix: mix, status: status, materialPerSession: sim.mat });
  }

  ui.routes.offre = {
    title: 'Plan de valorisation',
    render: function (st) {
      if (!st.mode) return ui.emptyBilan();
      if (st.mode === 'learn') { st.mode = 'both'; ui.save(); }
      var plan = C.offerPlan(st);
      ui._plan = plan;
      if (!plan) return '<div class="wrap narrow"><div class="panel pad" style="margin-top:30px"><div class="kicker">Plan de valorisation</div><h1 class="h1">Choisir d’abord vos compétences fortes</h1><p class="lead">Le plan se construit à partir de 1 à 6 compétences que vous maîtrisez.</p><a class="btn primary" href="#/bilan/forces" style="margin-top:14px">Choisir mes forces</a></div></div>';
      var c = st.context, sim = runSim(st, plan);
      var avg = plan.offers.filter(function (o) { return ['atelier', 'cours', 'stage', 'coaching', 'evenement'].indexOf(o.fmt) >= 0; });
      var avgP = avg.length ? avg.reduce(function (a, o) { return a + o.price; }, 0) / avg.length : plan.offers[0].price;
      var html = '<div class="wrap">';
      html += '<div class="dash-h"><div><div class="kicker">Plan de valorisation' + (st.demo ? ' · profil de démonstration' : '') + '</div><h1 class="h1">' + (c.firstName ? E(c.firstName) + ', votre plan pour transmettre' : 'Votre plan pour transmettre') + '</h1><div class="row">' + ui.pill(plan.entre.profile.name, 'int') + (c.city ? ui.pill(c.city, 'idle') : '') + U.arr(st.offer.goals).map(function (g) { return ui.pill(C.GOALS[g], 'idle'); }).join('') + '</div></div>' + ui.exportBar(st) + '</div>';
      html += '<div class="counters">' + counter('Offres générées', plan.offers.length, U.uniq(plan.offers.map(function (o) { return C.FORMATS[o.fmt].toLowerCase(); })).slice(0, 3).join(', '), '') +
        counter('Prix moyen', U.fmt(avgP) + '<small> €</small>', 'par place ou par heure', 'sent') +
        counter('Net mensuel estimé', U.fmt(sim.net) + '<small> €</small>', 'objectif ' + U.eur(U.num(st.offer.incomeTarget)) + (sim.net >= U.num(st.offer.incomeTarget) ? ' · atteint' : ' · voir le simulateur'), sim.net >= U.num(st.offer.incomeTarget) ? 'int' : 'wait') +
        counter('Statut conseillé', '<span style="font-size:16px;letter-spacing:0">' + E(plan.statuses[0].s.name.replace(/\s*\(.*\)/, '')) + '</span>', plan.statuses[0].s.name.match(/\((.*)\)/) ? E(plan.statuses[0].s.name.match(/\((.*)\)/)[1]) : 'cotisations ' + U.rate(plan.statuses[0].rate.rate ), 'int') + '</div>';
      html += '<nav class="subnav" aria-label="Sections du plan">' + [['s-offres', '1 · Offres'], ['s-niche', '2 · Niche'], ['s-sim', '3 · Simulateur'], ['s-canaux', '4 · Canaux'], ['s-statut', '5 · Statut et cadre'], ['s-route', '6 · 90 jours'], ['s-kit', '7 · Kit'], ['s-coll', '8 · Collectif']].map(function (x) { return '<button data-act="scrollTo" data-target="' + x[0] + '">' + E(x[1]) + '</button>'; }).join('') + '</nav>';
      html += secOffers(st, plan) + secNiche(st, plan) + secSim(st, plan) + secChannels(st, plan) + secStatus(st, plan) + secRoadmap(st, plan) + secKit(st, plan) + secColl(st, plan);
      if (ui.afterResults) html += ui.afterResults(st);
      html += '</div>';
      return html;
    },
    mount: function (root, st) { ui.updateSimOut(); }
  };
  function sec(id, k, title, hint) { return '<div class="section-h" id="' + id + '" tabindex="-1"><span class="kicker">' + E(k) + '</span><h2 class="h2">' + E(title) + '</h2>' + (hint ? '<span class="faint">' + hint + '</span>' : '') + '</div>'; }

  /* 1. offres */
  // échelle de progression de l'hôte : ce que vous animez aujourd'hui, et le niveau à atteindre pour animer le palier suivant
  ui.ladderPanel = function (plan) {
    var L = plan.ladder || []; if (!L.length) return '';
    return '<section class="panel" id="ladder" style="margin-bottom:16px"><div class="ph"><span class="t">Ce que vous pouvez animer</span><span class="hint">niveau n : ateliers de niveau n-1</span></div><div class="pb">' +
      L.slice(0, 4).map(function (x, i) {
        return '<div' + (i ? ' style="margin-top:16px"' : '') + '><div class="spread" style="margin-bottom:8px"><span class="h3" style="font-size:17px">' + E(x.s.name) + '</span><span class="animnote">' + ui.pill('Vous êtes niveau ' + x.level, 'int') + '</span></div>' +
          '<p class="sp" style="margin-bottom:8px;color:var(--fg)">Vous êtes niveau ' + x.level + ' : ' + E(x.text) + '.</p>' +
          '<div class="ladder5" role="list" aria-label="Échelle de ' + E(x.s.name) + '">' + x.rungs.map(function (r) {
            return '<div role="listitem" class="' + (r.current ? 'cur' : r.done ? 'done' : '') + '"' + (r.current ? ' aria-current="true"' : '') + '><div class="lv">' + r.level + ' · ' + E(r.label) + '</div><div class="nm">' + E(r.milestone) + '</div><div class="an">' + (r.animates.length ? 'anime le niveau ' + r.animates.join(', ') + (r.level >= C.LEVEL_MAX ? ', forme les hôtes' : '') : 'n’anime pas') + '</div></div>';
          }).join('') + '</div>' +
          (x.next ? '<p class="sp" style="margin-top:8px">Pour animer le palier ' + x.next.palier + ' : monter au niveau ' + x.next.level + ' (' + E(x.next.label.toLowerCase()) + '), environ ' + x.next.hours + ' h de pratique. Objectif : « ' + E(U.lc(x.next.milestone)) + ' ».</p>' : '<p class="sp" style="margin-top:8px">Niveau référent : vous animez le niveau 4 et pouvez former les hôtes de vos ateliers.</p>') + '</div>';
      }).join('') + '</div></section>';
  };
  function secOffers(st, plan) {
    return sec('s-offres', '01 · Offres', 'Vos offres prêtes à publier', plan.offers.length + ' offres, prix et trame inclus') + ui.ladderPanel(plan) + '<div class="offers">' + plan.offers.map(function (o, i) {
      var reg = o.regulated && plan.regs.filter(function (r) { return r.id === o.regulated; })[0];
      ui._copyStore = ui._copyStore || {};
      ui._copyStore['offer' + i] = o.title + '\n' + o.palierTag + ' · ' + o.animate + '\n' + o.hook + '\n' + C.FORMATS[o.fmt] + ' · ' + C.minutes(o.duration) + ' · ' + o.size + ' personne(s) · ' + U.eur(o.price) + ' ' + o.unit.replace('€ ', '') + '\n\nDéroulé\n' + o.outline.map(function (t) { return (o.duration ? C.minutes(t.start) + ' · ' : '') + t.label + ' : ' + t.text; }).join('\n') + '\n\nMatériel\n' + o.material.map(function (m) { return '· ' + m; }).join('\n');
      return '<article class="panel offer"><div class="top"><div class="spread"><span class="row">' + ui.uniTag(o.s.universe) + ui.pill(C.FORMATS[o.fmt], 'idle') + '</span>' + (reg ? ui.pill('Activité encadrée', 'wait') : '') + '</div>' +
        '<h3 class="ttl" style="margin-top:10px">' + E(o.title) + '</h3><p class="hook">' + E(o.hook) + '</p>' +
        '<p class="animline"><b>' + E(o.palierTag) + '</b><span>' + E(o.animate) + '</span></p>' +
        '<div class="metas">' + (o.duration ? ui.pill(C.minutes(o.duration), 'idle', false) : '') + ui.pill(o.size > 1 ? o.size + ' personnes' : 'individuel', 'idle', false) + ui.pill('pour ' + o.audience, 'idle', false) + '</div></div>' +
        '<div class="pricebox"><div><div class="lbl">Prix conseillé</div><div class="p num">' + U.fmt(o.price) + ' <small>' + E(o.unit) + '</small></div></div><div class="faint" style="text-align:right;font-size:11.5px">fourchette ' + U.eur(o.pricing.lo) + ' à ' + U.eur(o.pricing.hi) + (o.pricing.fallback ? '<br>repli générique' : '') + (o.size > 1 && ['atelier', 'stage', 'evenement'].indexOf(o.fmt) >= 0 ? '<br>' + U.eur(o.price * o.size) + ' par séance complète' : '') + '</div></div>' +
        '<details class="more"><summary>Pourquoi ce prix</summary><div class="why">' + o.pricing.steps.map(function (s) { return '<div class="wr"><span>' + E(s.label) + '</span><span>' + E(s.val) + '</span></div>'; }).join('') + '<div class="wr"><span>Prix arrondi</span><span>' + U.eur(o.price) + '</span></div></div></details>' +
        '<details class="more"' + (i === 0 ? ' open' : '') + '><summary>Trame ' + (o.duration ? 'minutée' : '') + '</summary><div class="trame">' + o.outline.map(function (t) { return '<div class="trow"><span class="tm">' + (o.duration ? C.minutes(t.start) + ' → ' + C.minutes(t.end) : '') + '</span><div class="tx"><b>' + E(t.label) + '</b><span>' + E(t.text) + '</span></div></div>'; }).join('') + '</div></details>' +
        '<details class="more"><summary>Matériel</summary><div class="pb" style="padding-top:4px"><ul class="clean">' + o.material.map(function (m) { return '<li>' + E(m) + '</li>'; }).join('') + '</ul></div></details>' +
        '<div class="pb noprint" style="border-top:1px solid var(--line);padding:10px 16px"><div class="row"><button class="btn sm" data-act="copy" data-id="offer' + i + '">' + ui.icon('copy') + ' Copier la fiche</button>' + (C.ai.has() ? '<button class="btn ghost sm" data-act="aiOffer" data-i="' + i + '">' + ui.icon('spark') + ' Trame détaillée avec Claude</button>' : '') + '</div><div id="aio-' + i + '"></div></div></article>';
    }).join('') + '</div>';
  }
  ui.actions.aiOffer = function (el) {
    var i = +el.getAttribute('data-i'), o = ui._plan.offers[i], out = ui.$('#aio-' + i);
    out.innerHTML = '<div class="status" style="margin-top:10px"><span class="spin"></span>Rédaction…</div>';
    C.ai.ask('Détaille la trame minutée de cette séance (déroulé, consignes, erreurs fréquentes à corriger, fiche-mémo pour les participants en 5 points). Séance : ' + o.title + ' · ' + C.FORMATS[o.fmt] + ' · ' + C.minutes(o.duration) + ' · ' + o.size + ' personnes · jalons de la compétence : ' + o.s.levels.join(' / ') + '\n\nBILAN\n' + C.ai.profileText(ui.st),
      function (t) { out.innerHTML = '<div class="prose" style="white-space:pre-wrap;margin-top:12px">' + E(t) + '</div>'; })
      .catch(function (e) { out.innerHTML = '<div class="note no" style="margin-top:10px"><span class="lbl">Copilote indisponible</span><span class="sp">' + E(C.ai.errorText(e)) + '</span></div>'; });
  };

  /* 2. niche */
  function secNiche(st, plan) {
    var n = plan.niches;
    var html = sec('s-niche', '02 · Niche', 'Votre niche différenciante', 'croisement de deux compétences');
    if (!n.length) return html + '<p class="empty">Noter au moins deux compétences au niveau 2 (bases acquises) ou plus, dont une au niveau 3, pour calculer une niche.</p>';
    var bar = function (l, v) { return '<div class="softrow"><div class="top"><span>' + E(l) + '</span><span class="faint num">' + Math.round(v * 100) + '</span></div>' + ui.meter(v * 100, 100, 'int') + '</div>'; };
    html += '<div class="grid2"><section class="panel"><div class="ph"><span class="t">Recommandée</span><span class="count">score ' + Math.round(n[0].score * 100) + '</span></div><div class="pb"><div class="h2">' + E(n[0].title) + '</div><p class="prose" style="margin-top:8px">' + E(n[0].concept) + '</p>' +
      '<div style="margin-top:12px">' + bar('Complémentarité', n[0].parts.comp) + bar('Demande', n[0].parts.demand) + bar('Potentiel de revenu', n[0].parts.monet) + bar('Rareté de la combinaison', n[0].parts.rare) + '</div>' +
      (n.length > 1 ? '<div class="lbl" style="margin-top:14px">Alternatives</div>' + n.slice(1).map(function (x) { return '<div class="resitem"><div class="nm">' + E(x.title) + '</div><span class="faint num">' + Math.round(x.score * 100) + '</span><div class="d">' + E(C.FORMATS[x.format] || x.format) + ' · ' + x.common.length + ' formats communs</div></div>'; }).join('') : '') + '</div></section>';
    html += '<section class="panel"><div class="ph"><span class="t">J’aime · je maîtrise · ça se demande · ça se paie</span></div><div class="gtable mtable"><div class="gtr h"><span>Compétence</span><span>J’aime</span><span>Maîtrise</span><span>Demande</span><span>Se paie</span><span></span></div>' +
      plan.matrix.slice(0, 8).map(function (m) {
        return '<div class="gtr' + (m.sweet ? ' sel' : '') + '"><span class="c-name"><span class="nm" style="font-size:14.5px">' + E(m.s.short || m.s.name) + '</span></span>' +
          [['J’aime', m.love], ['Maîtrise', m.level], ['Demande', m.demand], ['Se paie', m.monet]].map(function (x) { return '<span data-l="' + E(x[0]) + '">' + ui.meter(x[1] * 100, 100, x[1] >= 0.66 ? 'int' : '') + '</span>'; }).join('') +
          '<span>' + (m.sweet ? ui.pill('zone idéale', 'int') : '') + '</span></div>';
      }).join('') + '</div><div class="pb"><p class="faint" style="font-size:11.5px">Zone idéale : les quatre critères au-dessus des deux tiers. C’est là que l’effort de lancement rapporte le plus.</p></div></section></div>';
    return html;
  }

  /* 3. simulateur */
  function secSim(st, plan) {
    var sp = simParams(st, plan), s = sp.sim;
    var opts = plan.offers.map(function (o) { return '<option value="' + E(o.id) + '"' + (o.id === s.offer ? ' selected' : '') + '>' + E(o.title.slice(0, 60)) + '</option>'; }).join('');
    var ctl = function (label, key, min, max, step, suf) { return '<div class="ctl"><div class="spread"><label class="lbl" for="sim-' + key + '">' + E(label) + '</label><output id="out-' + key + '">' + String(s[key]).replace('.', ',') + (suf || '') + '</output></div><input type="range" id="sim-' + key + '" data-sim="' + key + '" min="' + min + '" max="' + max + '" step="' + step + '" value="' + s[key] + '"></div>'; };
    var html = sec('s-sim', '03 · Simulateur', 'Combien cela peut rapporter', 'cotisations lues dans les statuts, commissions dans les plateformes');
    html += '<div class="simgrid"><section class="panel"><div class="ph"><span class="t">Hypothèses</span><button class="btn ghost sm" data-act="simReset">Réinitialiser</button></div><div class="pb">' +
      '<div class="ctl"><label class="lbl" for="sim-offer">Offre de référence</label><select class="input" id="sim-offer" style="margin-top:6px">' + opts + '</select></div>' +
      ctl('Heures par semaine (préparation comprise)', 'hours', 1, 35, 1, ' h') + ctl('Prix par place', 'price', 5, Math.max(200, Math.ceil(s.price * 2.5 / 10) * 10), 1, ' €') + ctl('Jauge', 'size', 1, 30, 1, ' pers.') + ctl('Taux de remplissage', 'fill', 10, 100, 5, ' %') + ctl('Durée d’une séance', 'dur', 30, 480, 15, ' min') + ctl('Matériel par séance', 'mat', 0, 60, 1, ' €') +
      '<div class="ctl"><label class="lbl" for="sim-status">Statut</label><select class="input" id="sim-status" style="margin-top:6px">' + C.res.statuses.map(function (x) { var r = C.statusRate(x); return '<option value="' + E(x.id) + '"' + (x.id === s.status ? ' selected' : '') + '>' + E(x.name) + ' · ' + U.rate(r.rate ) + (r.est ? ' (estim.)' : '') + '</option>'; }).join('') + '</select></div>' +
      '<div class="lbl" style="margin-top:16px">Mix de canaux (part des ventes)</div>' + s.mix.map(function (m, i) {
        var p = m.id === 'direct' ? { name: 'En direct (paiement en ligne 1,5 %)' } : C.res.platforms.filter(function (x) { return x.id === m.id; })[0] || { name: m.id };
        return '<div class="ctl" style="margin-top:8px"><div class="spread"><label class="faint" for="mix-' + i + '" style="font-size:12px">' + E(p.name) + (p.fee ? ' · ' + E(C.feeOf(p).label) : '') + '</label><output id="out-mix-' + i + '">' + m.share + ' %</output></div><input type="range" id="mix-' + i + '" data-mix="' + i + '" min="0" max="100" step="5" value="' + m.share + '"></div>';
      }).join('') + '</div></section>' +
      '<section class="panel"><div class="ph"><span class="t">Résultat mensuel</span><span class="hint" id="sim-sess"></span></div><div class="pb"><div class="counters c5" id="sim-counters"></div><div class="split" id="sim-split" aria-hidden="true"></div><div class="splitlegend" id="sim-legend"></div><div class="chart" id="sim-curve" style="margin-top:14px"></div><div id="sim-alerts" class="stack" style="margin-top:12px"></div></div></section></div>';
    return html;
  }
  ui.updateSimOut = function () {
    var st = ui.st, plan = ui._plan; if (!plan || !ui.$('#sim-counters')) return;
    var r = runSim(st, plan), s = st.offer.sim, target = U.num(st.offer.incomeTarget);
    ui.$('#sim-sess').textContent = String(r.sessionsPerMonth).replace('.', ',') + ' séances · ' + Math.round(r.seats) + ' places vendues';
    ui.$('#sim-counters').innerHTML = counter('Chiffre d’affaires', U.fmt(r.gross) + '<small> €</small>', U.fmt(r.annual) + ' € par an') + counter('Commissions', U.fmt(r.fees) + '<small> €</small>', r.gross ? Math.round(r.fees / r.gross * 100) + ' % du CA' : '—', 'sent') +
      counter('Cotisations', U.fmt(r.cotis) + '<small> €</small>', U.rate(r.rate ) + (r.rateEst ? ' estimé' : ''), 'wait') + counter('Net mensuel', U.fmt(r.net) + '<small> €</small>', target ? (r.net >= target ? 'objectif atteint' : 'manque ' + U.eur(target - r.net)) : 'avant impôt', r.net >= target ? 'int' : 'no') +
      counter('Net par heure', U.fmt(r.hourly) + '<small> €</small>', 'préparation comprise', '');
    var parts = [['Net', Math.max(0, r.net), 'var(--int)'], ['Cotisations', r.cotis, 'var(--wait)'], ['Commissions', r.fees, 'var(--sent)'], ['Matériel', r.material, 'var(--idle)']];
    var tot = parts.reduce(function (a, p) { return a + p[1]; }, 0) || 1;
    ui.$('#sim-split').innerHTML = parts.map(function (p) { return p[1] > 0 ? '<b style="flex:' + p[1] + ';background:' + p[2] + '"></b>' : ''; }).join('');
    ui.$('#sim-legend').innerHTML = parts.map(function (p) { return '<div><span class="sq" style="background:' + p[2] + '"></span><span>' + p[0] + '</span><span class="num">' + U.eur(p[1]) + '</span><span class="pc num">' + Math.round(p[1] / tot * 100) + ' %</span></div>'; }).join('');
    ui.$('#sim-curve').innerHTML = C.charts.simCurveSVG(function (h) { return runSim(st, plan, h).net; }, s.hours, target, { w: 560, h: 190 });
    var al = [];
    if (r.overCeiling) al.push('<div class="note no"><span class="lbl">Plafond dépassé</span><span class="sp">' + U.eur(r.annual) + ' par an dépasse le plafond du statut (' + U.eur(r.ceiling) + '). Envisager une société ou une CAE.</span></div>');
    else if (r.overVat) al.push('<div class="note wait"><span class="lbl">TVA</span><span class="sp">Au-delà de ' + U.eur(r.vat) + ' de chiffre d’affaires annuel, la franchise de TVA tombe : prévoir 20 % de TVA sur les prix ou les absorber.</span></div>');
    if (r.subs > 0) al.push('<div class="note"><span class="lbl">Point mort</span><span class="sp">' + U.eur(r.subs) + ' d’abonnements fixes par mois, couverts dès ' + (isFinite(r.breakEvenSeats) ? r.breakEvenSeats + ' place' + (r.breakEvenSeats > 1 ? 's' : '') + ' vendue' + (r.breakEvenSeats > 1 ? 's' : '') : '—') + '.</span></div>');
    if (target && r.net < target) {
      var need = null; for (var h = 1; h <= 35; h++) if (runSim(st, plan, h).net >= target) { need = h; break; }
      al.push('<div class="note wait"><span class="lbl">Pour atteindre ' + U.eur(target) + '</span><span class="sp">' + (need ? 'Il faut environ ' + need + ' h par semaine à ces conditions, ou augmenter le remplissage et le prix.' : 'Même à 35 h par semaine, l’objectif n’est pas atteint : ajouter un format mieux payé (entreprise, stage) ou des produits.') + '</span></div>');
    }
    if (r.rateNote) al.push('<p class="faint" style="font-size:11.5px">Cotisations : ' + E(r.rateNote) + '.</p>');
    al.push('<p class="faint" style="font-size:11.5px">Hypothèses : 35 % du temps passé en préparation, trajets et communication ; impôt sur le revenu non déduit. Les taux et plafonds viennent du fichier de ressources (relevé ' + E(C.res.updated || '2026') + ').</p>');
    ui.$('#sim-alerts').innerHTML = al.join('');
  };
  ui.routes.offre.onInput = function (el) {
    var s = ui.st.offer.sim; if (!s) return;
    if (el.hasAttribute('data-sim')) { var k = el.getAttribute('data-sim'); s[k] = +el.value; var o = ui.$('#out-' + k); if (o) o.textContent = String(s[k]).replace('.', ',') + ({ hours: ' h', price: ' €', size: ' pers.', fill: ' %', dur: ' min', mat: ' €' }[k] || ''); }
    else if (el.hasAttribute('data-mix')) { var i = +el.getAttribute('data-mix'); s.mix[i].share = +el.value; ui.$('#out-mix-' + i).textContent = el.value + ' %'; }
    else if (el.id === 'sim-status') s.status = el.value;
    else if (el.id === 'sim-offer') { var of = ui._plan.offers.filter(function (x) { return x.id === el.value; })[0]; if (of) { s.offer = of.id; s.price = of.price; s.size = of.size; s.dur = of.duration || 60; ui.save(); ui.render(); return; } }
    else return;
    ui.save(); ui.updateSimOut();
  };
  // les contrôles du simulateur ne portent pas data-bind : on les écoute ici
  document.addEventListener('input', function (ev) { if (ui.current && ui.current.screen === ui.routes.offre && ev.target.closest && ev.target.closest('#s-sim + .simgrid')) ui.routes.offre.onInput(ev.target); });
  document.addEventListener('change', function (ev) { if (ui.current && ui.current.screen === ui.routes.offre && (ev.target.id === 'sim-status' || ev.target.id === 'sim-offer')) ui.routes.offre.onInput(ev.target); });
  ui.actions.simReset = function () { delete ui.st.offer.sim; ui.save(); ui.render(); ui.toast('Simulateur réinitialisé'); };

  /* 4. canaux */
  function secChannels(st, plan) {
    var html = sec('s-canaux', '04 · Canaux', 'Où trouver vos premiers clients', 'classés pour votre profil');
    html += '<section class="panel"><div class="gtable chtable"><div class="gtr h"><span>#</span><span>Canal</span><span>Score</span><span>Commission</span><span>Pourquoi</span></div>' +
      plan.channels.slice(0, 12).map(function (c, i) {
        var p = c.p;
        return '<div class="gtr' + (p.soon ? ' sel' : '') + '"><span class="faint num">' + (i + 1) + '</span><div class="c-name"><div class="row" style="gap:8px"><span class="nm">' + E(p.name) + '</span>' + (p.soon ? ui.pill('bientôt', 'int') : '') + ui.verify(p) + '</div>' +
          '<div class="faint" style="font-size:11px;margin-top:3px">' + E(p.bestFor || p.model || '') + '</div>' +
          '<div class="row" style="gap:12px;margin-top:5px;font-size:10.5px;color:var(--fg-3)"><span>audience ' + mini(p.reach) + '</span><span>effort ' + mini(p.effort) + '</span><span>relation ' + mini(p.control) + '</span></div></div>' +
          '<div data-l="Score" class="scorebar"><span class="num" style="min-width:22px">' + c.score + '</span>' + ui.meter(c.score, 100, i < 3 ? 'int' : '') + '</div>' +
          '<div data-l="Commission" style="font-size:12px" title="' + E(c.p.fee && c.p.fee.note || c.fee.label) + '">' + E(c.fee.label.length > 34 ? c.fee.label.split(/[;(]/)[0].slice(0, 34).trim() + '…' : c.fee.label) + '</div>' +
          '<div class="c-why">' + (c.reasons.slice(0, 2).map(E).join(' · ') || E(p.model || '')) + (p.url ? ' ' + ui.extLink(p.url, 'site') : '') + (p.soon ? '<div style="margin-top:8px"><a class="btn primary sm" href="#/attente/host">Devenir hôte fondateur</a></div>' : '') + '</div></div>';
      }).join('') + '</div><div class="pb"><p class="faint" style="font-size:11.5px">Score = adéquation des formats × adéquation à l’univers × (audience, commission, effort de mise en route, maîtrise de la relation), pondérés selon vos objectifs, puis modulés par votre profil (caméra, aisance commerciale). Détail dans <a href="#/comment">Comment ça marche</a>.</p></div></section>';
    return html;
  }
  function mini(n) { var h = ''; for (var i = 1; i <= 3; i++) h += '<i class="' + (i <= n ? 'on' : '') + '"></i>'; return '<span class="mini" role="img" aria-label="' + n + ' sur 3">' + h + '</span>'; }

  /* 5. statut et cadre */
  function secStatus(st, plan) {
    var top = plan.statuses[0], s = top.s;
    var html = sec('s-statut', '05 · Statut et cadre', 'Le statut le plus adapté', U.eur(U.num(st.offer.incomeTarget) * 12) + ' visés par an');
    html += '<div class="grid2"><section class="panel"><div class="ph"><span class="t">Recommandé</span>' + ui.pill('cotisations ' + U.rate(top.rate.rate ) + (top.rate.est ? ' estimées' : ''), 'int') + '</div><div class="pb">' +
      '<div class="h2">' + E(s.name) + '</div><p class="sp" style="margin-top:6px">' + E(s.forWhat) + '</p>' +
      (top.why.length ? '<ul class="clean" style="margin-top:10px">' + top.why.map(function (w) { return '<li>' + E(w) + '</li>'; }).join('') + '</ul>' : '') +
      '<div class="lbl" style="margin-top:14px">Coût</div><p class="sp">' + E(s.cost) + '</p>' + (s.ceiling ? '<div class="lbl" style="margin-top:10px">Plafonds</div><p class="sp">' + E(s.ceiling) + '</p>' : '') +
      (s.steps.length ? '<div class="lbl" style="margin-top:14px">Démarches</div><ol class="sp" style="padding-left:20px;margin:6px 0 0">' + s.steps.map(function (x) { return '<li style="margin:4px 0">' + E(x) + '</li>'; }).join('') + '</ol>' : '') +
      (s.source ? '<p style="margin-top:12px">' + ui.extLink(s.source, 'Source officielle') + '</p>' : '') + '</div></section>' +
      '<section class="panel"><div class="ph"><span class="t">Autres options</span></div><div class="pb tight">' + plan.statuses.slice(1, 5).map(function (x) {
        return '<details class="resitem" style="display:block"><summary style="cursor:pointer;list-style:none" class="spread"><span class="nm">' + E(x.s.name) + '</span><span class="faint num">' + U.rate(x.rate.rate) + '</span></summary><p class="sp" style="margin-top:6px">' + E(x.s.forWhat) + '</p>' + (x.why.length ? '<ul class="clean">' + x.why.map(function (w) { return '<li>' + E(w) + '</li>'; }).join('') + '</ul>' : '') + (x.s.pros.length ? '<div class="lbl" style="margin-top:8px">Atouts</div><ul class="clean">' + x.s.pros.slice(0, 3).map(function (w) { return '<li>' + E(w) + '</li>'; }).join('') + '</ul>' : '') + (x.s.cons.length ? '<div class="lbl" style="margin-top:8px">Limites</div><ul class="clean">' + x.s.cons.slice(0, 3).map(function (w) { return '<li>' + E(w) + '</li>'; }).join('') + '</ul>' : '') + '</details>';
      }).join('') + '</div></section></div>';
    if (plan.regs.length) html += '<div class="stack" style="margin-top:16px">' + plan.regs.map(function (r) {
      return '<div class="note wait"><span class="lbl">Cadre réglementaire · ' + E(r.r.title) + '</span><p class="sp" style="color:var(--fg)">Concerne : ' + r.skills.map(function (s) { return E(s.name); }).join(', ') + '</p><p class="sp" style="margin-top:6px">' + E(r.r.rule) + '</p>' + (r.r.risk ? '<p class="sp" style="margin-top:6px"><span style="color:var(--no)">Risque :</span> ' + E(r.r.risk) + '</p>' : '') +
        (U.arr(r.r.options).length ? '<div class="lbl" style="margin-top:10px">Parades</div><ul class="clean">' + r.r.options.map(function (x) { return '<li>' + E(x) + '</li>'; }).join('') + '</ul>' : '') + (r.r.source ? '<p style="margin-top:8px">' + ui.extLink(r.r.source, 'Source') + '</p>' : '') + '</div>';
    }).join('') + '</div>';
    return html;
  }

  /* 6. feuille de route */
  function secRoadmap(st, plan) {
    var ck = st.plan.checked || {}, all = [], done = 0;
    plan.roadmap.forEach(function (ph) { ph.tasks.forEach(function (t) { all.push(t); if (ck[t.id]) done++; }); });
    var html = sec('s-route', '06 · 90 jours', 'Feuille de route', done + ' / ' + all.length + ' étapes cochées');
    html += '<div class="spread" style="margin-bottom:12px"><div style="flex:1;max-width:420px"><div class="progress"><b style="width:' + Math.round(done / all.length * 100) + '%"></b></div></div><button class="btn sm noprint" data-act="ics">' + ui.icon('cal') + ' Exporter dans l’agenda</button></div>';
    html += '<div class="roadmap">' + plan.roadmap.map(function (ph) {
      return '<section class="panel"><div class="ph"><span class="t">' + E(ph.label) + '</span><span class="hint">' + E(ph.range) + '</span></div><div class="pb tight">' + ph.tasks.map(function (t) {
        var on = !!ck[t.id];
        return '<label class="task' + (on ? ' done' : '') + '"><input type="checkbox" data-act="tick" data-id="' + E(t.id) + '"' + (on ? ' checked' : '') + '><span><span class="tt">' + E(t.text) + '</span><span class="due" style="display:block">avant le ' + E(U.dateShort(t.due)) + '</span></span></label>';
      }).join('') + '</div></section>';
    }).join('') + '</div>';
    return html;
  }
  ui.actions.tick = function (el) {
    var id = el.getAttribute('data-id'); ui.st.plan.checked = ui.st.plan.checked || {};
    if (el.checked) ui.st.plan.checked[id] = true; else delete ui.st.plan.checked[id];
    el.closest('.task').classList.toggle('done', el.checked); ui.save();
    var y = W.scrollY; ui.render(); W.scrollTo(0, y);
  };

  /* 7. kit */
  function secKit(st, plan) {
    var k = plan.kit; if (!k) return '';
    var html = sec('s-kit', '07 · Kit de lancement', 'Les textes, prêts à copier', '');
    html += '<div class="grid2"><div>' + ui.copyBlock('Bio courte', k.bioShort, 'kit-bio') + ui.copyBlock('Bio longue', k.bioLong, 'kit-biol') + ui.copyBlock('Pitch de 30 secondes', k.pitch, 'kit-pitch') + ui.copyBlock('Mots-clés', k.keywords.join(', '), 'kit-kw') + '</div><div>' +
      ui.copyBlock('Message à un lieu partenaire', k.venue, 'kit-venue') + ui.copyBlock('10 idées de publications', k.posts.map(function (p, i) { return (i + 1) + '. ' + p; }).join('\n'), 'kit-posts') + '</div></div>';
    html += '<div style="margin-top:16px">' + ui.copilotPanel('posts', 'Le copilote peut rédiger les 10 publications en entier, au ton de votre choix, et une annonce prête pour ' + ((plan.channels.filter(function (c) { return !c.p.soon; })[0] || { p: { name: 'votre premier canal' } }).p.name) + '.', 'Rédige en entier 5 publications Instagram (80 mots chacune, avec un appel à réserver) et une annonce de 150 mots pour la plateforme ' + ((plan.channels.filter(function (c) { return !c.p.soon; })[0] || { p: { name: 'de cours' } }).p.name) + ', pour l’offre : ' + plan.offers[0].title + ' (' + U.eur(plan.offers[0].price) + ').') + '</div>';
    return html;
  }

  /* 8. collectif */
  function secColl(st, plan) {
    var c = plan.collective;
    var html = sec('s-coll', '08 · Collectif', 'Projets, réseaux et lieux', '');
    html += '<div class="grid3">' + c.projects.slice(0, 3).map(function (x) {
      var p = x.p;
      return '<section class="panel"><div class="ph"><span class="t" style="text-transform:none;letter-spacing:0;font:400 17px var(--f-display)">' + E(p.name) + '</span></div><div class="pb"><p class="sp">' + E(p.desc) + '</p>' +
        '<div class="row" style="margin-top:10px">' + ui.pill(p.size[0] + ' à ' + p.size[1] + ' pers.', 'idle', false) + ui.pill(p.weeks + ' semaines', 'idle', false) + ui.pill('votre rôle : ' + x.role, 'int') + '</div>' +
        '<div class="lbl" style="margin-top:12px">Sortie</div><p class="sp">' + E(p.output) + '</p>' +
        '<details class="more" style="margin:10px -16px -16px"><summary>Étapes et financement</summary><div class="pb" style="padding-top:2px"><ul class="clean">' + p.steps.map(function (s) { return '<li>' + E(s) + '</li>'; }).join('') + '</ul>' + (p.funding.length ? '<p class="faint" style="margin-top:8px;font-size:11.5px">Financement : ' + p.funding.map(E).join(', ') + '</p>' : '') + '</div></details></div></section>';
    }).join('') + '</div>';
    html += '<div class="grid2" style="margin-top:16px"><section class="panel"><div class="ph"><span class="t">Réseaux et fédérations</span></div><div class="pb tight">' + (c.networks.map(function (n) { return '<div class="resitem"><div class="nm">' + E(n.name) + '</div><div>' + ui.extLink(n.url, 'site') + '</div><div class="d">' + E(n.desc) + '</div></div>'; }).join('') || '<p class="empty">Aucun réseau référencé.</p>') + '</div></section>' +
      '<section class="panel"><div class="ph"><span class="t">Lieux où proposer vos séances</span><a class="btn ghost sm" href="#/outils/autour">' + ui.icon('pin') + ' Autour de moi</a></div><div class="pb tight">' + c.places.map(function (pl) { return '<div class="resitem"><div class="nm">' + E(pl.name) + '</div><div>' + (pl.links[0] ? ui.extLink(pl.links[0].url, 'annuaire') : '') + '</div><div class="d">' + E(pl.desc) + '</div><div class="m">' + E(pl.howToFind) + '</div></div>'; }).join('') + '</div></section></div>';
    return html;
  }
})(window);
