/* Lieux partenaires (brief V2, section 2) : #/lieu en 4 étapes (lieu, heures creuses, gain, partenariat), mode présentation
   #/lieu/pitch, fiche publique #/l/<slug>. Outil de prospection ouvert sur téléphone devant un gérant : vouvoiement. */
(function (W) {
  'use strict';
  var C = W.Cordes, U = C.util, ui = C.ui, E = ui.e;
  var plural = function (n, one, many) { return n + ' ' + (n > 1 ? (many || one + 's') : one); };
  var BADGE = function (k) { var h = (C.VENUE_HYP[k] || ['', 'estimation'])[1]; return '<span class="pill sm ' + (h === 'hypothèse' ? 'sent' : 'wait') + '"><i></i>' + h + '</span>'; };

  function venueState() {
    if (!ui._venue) ui._venue = C.migrateVenue(Object.assign(C.defaultVenue(), C.LS.get(C.KEYS.venue, {}) || {}));
    return ui._venue;
  }
  function venueSave() { var v = ui._venue; if (v.name) v.slug = C.venueSlug(v.name); C.LS.set(C.KEYS.venue, v); }
  function tlabel(id) { return C.venueType(id).label; }

  /* ---------- #/lieu ---------- */
  ui.routes.lieu = {
    title: function (st, p) { return p === 'pitch' ? 'Présenter' : 'Lieu partenaire'; },
    render: function (st, param) {
      var v = venueState();
      if (param === 'pitch') return pitchHTML(v);
      var g = C.venueGain(v), t = C.venueType(v.type), done = ui.st.waitlist && ui.st.waitlist.role === 'lieu';
      var html = '<div class="wrap"><div class="kicker">Lieu partenaire · outil de prospection</div><h1 class="h1">Votre lieu, vos heures creuses</h1>' +
        '<p class="lead">Café, bar, studio, librairie ou médiathèque : décrivez vos créneaux calmes. Cordes en déduit les séances qui s’y tiennent bien, ce que vous y gagnez, une fiche, une charte et un kit de communication.</p>' +
        '<nav class="subnav vsteps" aria-label="Étapes">' + [['v-s1', '1 · Votre lieu'], ['v-s2', '2 · Heures creuses'], ['v-s3', '3 · Ce que vous y gagnez'], ['v-s4', '4 · Devenir partenaire']].map(function (x) { return '<button data-act="scrollTo" data-target="' + x[0] + '">' + E(x[1]) + '</button>'; }).join('') + '</nav>';
      // 1 · le lieu
      html += '<section class="panel vstep" id="v-s1" tabindex="-1"><div class="ph"><span class="t">1 · Votre lieu</span><span class="hint">1 minute</span></div><div class="pb">' +
        '<div class="grid2 tightgrid"><label class="field" style="margin-top:0"><span class="lbl">Nom du lieu</span><input class="input" id="v-name" value="' + E(v.name) + '" placeholder="Le nom de votre lieu"></label>' +
        '<label class="field" style="margin-top:0"><span class="lbl">Ville</span><input class="input" id="v-city" value="' + E(v.city) + '" placeholder="Paris" autocomplete="address-level2"></label></div>' +
        (C.isParis(v.city) ? '<label class="field"><span class="lbl">Arrondissement</span><select class="input" id="v-arr"><option value="">Choisir</option>' + C.PARIS_ARR.map(function (a) { return '<option' + (a === v.arr ? ' selected' : '') + '>' + a + '</option>'; }).join('') + '</select></label>' : '') +
        '<div class="field"><span class="lbl">Type de lieu</span><div class="vfams">' + C.VENUE_FAMILIES.map(function (fm) {
          var ts = C.VENUE_TYPES.filter(function (x) { return x[2] === fm[0]; });
          return '<div class="vfam"><span class="lbl">' + E(fm[1]) + '</span><div class="chips">' + ts.map(function (x) { var on = v.type === x[0]; return '<button type="button" class="chip sm' + (on ? ' on' : '') + '" aria-pressed="' + on + '" data-act="vType" data-v="' + x[0] + '"><i></i>' + E(x[1]) + '</button>'; }).join('') + '</div></div>';
        }).join('') + '</div></div>' +
        '<div class="note int vpitch"><span class="lbl">Pourquoi des séances chez vous · ' + E(t.label.toLowerCase()) + '</span><span class="sp">' + E(t.pitch) + '</span></div>' +
        '<div class="field"><div class="spread"><span class="lbl">Capacité d’accueil</span><output class="num" id="v-cap-out">' + U.num(v.capacity, 8) + ' places</output></div><input type="range" id="v-cap" min="2" max="40" step="1" value="' + U.num(v.capacity, 8) + '" aria-label="Capacité d’accueil"></div>' +
        '<div class="field"><span class="lbl">Équipements</span><div class="chips" style="margin-top:8px">' + C.VENUE_EQUIP.map(function (q) { var on = v.equip.indexOf(q[0]) >= 0; return '<button type="button" class="chip sm' + (on ? ' on' : '') + '" aria-pressed="' + on + '" data-act="vEquip" data-v="' + q[0] + '"><i></i>' + E(q[1]) + '</button>'; }).join('') + '</div></div></div></section>';
      // 2 · heures creuses
      var grid = '<div class="slotgrid" role="group" aria-label="Créneaux creux"><span></span>' + C.VENUE_MOMENTS.map(function (m) { return '<span class="sh">' + E(m[1]) + '</span>'; }).join('') +
        C.VENUE_DAYS.map(function (d, i) { return '<span class="sd">' + E(d) + '</span>' + C.VENUE_MOMENTS.map(function (m) { var k = i + ':' + m[0], on = v.slots.indexOf(k) >= 0; return '<button type="button" class="slot' + (on ? ' on' : '') + '" aria-pressed="' + on + '" aria-label="' + E(d + ' ' + m[1]) + '" data-act="vSlot" data-k="' + k + '">' + (on ? ui.icon('check') : '') + '</button>'; }).join(''); }).join('') + '</div>';
      html += '<section class="panel vstep" id="v-s2" tabindex="-1"><div class="ph"><span class="t">2 · Vos heures creuses</span><span class="hint">' + plural(v.slots.length, 'créneau', 'créneaux') + ' par semaine</span></div><div class="pb">' +
        '<p class="help" style="margin:0 0 8px">Les moments où des tables ou une salle restent libres chaque semaine.</p>' + grid +
        '<div class="field"><span class="lbl">Séances par créneau</span>' + ui.seg('_', [[1, '1'], [2, '2'], [3, '3']], v.perSlot, 'Séances par créneau').replace(/data-act="set" data-bind="_"/g, 'data-act="vPer"') + '</div></div></section>';
      // 3 · gain
      html += '<section class="panel vstep" id="v-s3" tabindex="-1"><div class="ph"><span class="t">3 · Ce que vous y gagnez</span><div class="row"><button class="btn sm" data-act="vCompare" aria-pressed="' + !!ui._vCompare + '">Comparer les formules</button><a class="btn sm" href="#/lieu/pitch" data-act="vPitch">Présenter</a></div></div><div class="pb">' +
        '<div class="lbl">Formules · plusieurs possibles</div><div class="vforms">' + C.VENUE_FORMULAS.map(function (f) {
          var on = v.formulas.indexOf(f.id) >= 0, rec = t.formulas.indexOf(f.id) >= 0, ap = C.formulaApplies(f.id, v.type);
          return '<button type="button" class="vform' + (on ? ' on' : '') + (ap ? '' : ' na') + '" aria-pressed="' + on + '" data-act="vFormula" data-v="' + f.id + '"><span class="spread"><b>' + f.n + ' · ' + E(f.label) + '</b>' + (on ? ui.icon('check') : '') + '</span>' +
            '<span class="vf-m">' + E(f.mech) + '</span><span class="vf-g"><i>Vous donnez</i> ' + E(f.gives) + ' · <i>vous recevez</i> ' + E(f.gets) + '</span>' +
            '<span class="row vf-b">' + (rec ? ui.pill('recommandée', 'int') : '') + (f.from > 1 ? ui.pill('à partir de M' + f.from, 'idle') : '') + (f.paid ? ui.pill('payée par le lieu', 'wait') : '') + (ap ? '' : ui.pill('peu adaptée à ce type', 'idle')) + '</span></button>';
        }).join('') + '</div>';
      html += '<div id="v-sim">' + simHTML(v, g) + '</div>';
      html += '<div class="lbl" style="margin-top:18px">Séances compatibles · ' + C.venueMatch(v, 10).total + ' au catalogue</div><div class="reslist" id="venue-skills">' + C.venueMatch(v, 10).skills.map(function (x) {
        return '<div class="resitem"><div class="nm" style="font-size:15px">' + E(x.s.name) + '</div><span>' + ui.uniTag(x.s.universe) + '</span><div class="m">En 1 h : ' + E(U.lc(x.s.levels[0])) + '</div></div>'; }).join('') + '</div></div></section>';
      // 4 · partenariat
      html += '<section class="panel vstep" id="v-s4" tabindex="-1"><div class="ph"><span class="t">4 · Devenir partenaire</span></div><div class="pb">' + partnerHTML(v, g) +
        (done ? '<div class="note int" style="margin:16px 0 0"><span class="lbl">Lieu inscrit</span><span class="sp">' + E(ui.st.waitlist.zone || '') + ' · nous revenons vers vous avant l’ouverture du quartier.</span></div>' : '') +
        '<div class="grid2 tightgrid" style="margin-top:8px"><label class="field"><span class="lbl">E-mail de contact (facultatif)</span><input class="input" type="email" id="v-email" value="' + E(v.contact || '') + '" autocomplete="email"></label><div></div></div>' +
        '<label class="consent"><input type="checkbox" id="v-consent"><span>J’accepte que Cordes conserve cette fiche pour organiser des séances dans mon lieu. Suppression possible à tout moment depuis « Mes données ».</span></label>' +
        '<div class="row" style="margin-top:14px"><button class="btn primary" data-act="vJoin">' + (done ? 'Mettre à jour' : 'Inscrire mon lieu') + '</button></div></div></section></div>';
      return html;
    },
    mount: function (root, st, param) {
      if (param === 'pitch') { mountPitch(root); return; }
      var v = venueState();
      if (v.slots.length && !ui._vSimSeen) { ui._vSimSeen = true; C.track('venue_sim_view'); }
      [['#v-name', 'name'], ['#v-email', 'contact']].forEach(function (p) { var el = ui.$(p[0], root); if (el) { el.addEventListener('input', function () { v[p[1]] = el.value; venueSave(); }); } });
      var city = ui.$('#v-city', root);
      if (city) { city.addEventListener('input', function () { v.city = city.value; venueSave(); }); city.addEventListener('change', function () { ui.render(); }); }
      var arr = ui.$('#v-arr', root); if (arr) arr.addEventListener('change', function () { v.arr = arr.value; venueSave(); ui.render(); });
      var cap = ui.$('#v-cap', root); if (cap) { cap.addEventListener('input', function () { v.capacity = +cap.value; ui.$('#v-cap-out').textContent = cap.value + ' places'; venueSave(); }); cap.addEventListener('change', function () { keepRender(); }); }
      ui.$$('[data-sim]', root).forEach(function (el) {
        el.addEventListener('change', function () {
          var k = el.getAttribute('data-sim'), val = el.type === 'checkbox' ? el.checked : +el.value;
          if (k === 'margin' || k === 'firstShare' || k === 'returnRate') val = U.clamp(val / 100, 0, 1);
          v.sim[k] = val; venueSave(); C.track('venue_sim_edit', { k: k }); refreshSim();
        });
      });
      drawKitPreview(v);
    },
    onKey: function (ev) { if (ui.current && ui.current.route.param === 'pitch') pitchKey(ev); }
  };
  function keepRender() { var y = W.scrollY; ui.render(); W.scrollTo(0, y); }
  function refreshSim() {
    var v = venueState(), box = ui.$('#v-sim'); if (!box) return;
    var act = document.activeElement && document.activeElement.id;
    box.innerHTML = simHTML(v, C.venueGain(v));
    ui.$$('[data-sim]', box).forEach(function (el) { el.addEventListener('change', function () { var k = el.getAttribute('data-sim'), val = el.type === 'checkbox' ? el.checked : +el.value; if (k === 'margin' || k === 'firstShare' || k === 'returnRate') val = U.clamp(val / 100, 0, 1); v.sim[k] = val; venueSave(); C.track('venue_sim_edit', { k: k }); refreshSim(); }); });
    if (act) { var a = document.getElementById(act); if (a) a.focus({ preventScroll: true }); }
  }
  function simHTML(v, g) {
    var p = g.params, fld = function (k, label, val, opts) {
      opts = opts || {};
      return '<label class="vsf"><span class="lbl">' + E(label) + ' ' + BADGE(k) + '</span><span class="row" style="gap:6px;flex-wrap:nowrap"><input class="input sm" type="number" id="vs-' + k + '" data-sim="' + k + '" value="' + val + '" min="' + (opts.min || 0) + '" max="' + (opts.max || 999) + '" step="' + (opts.step || 1) + '"><span class="faint">' + E(opts.unit || '') + '</span></span></label>';
    };
    var on = g.chosen.length ? g.chosen : [];
    var html = '<div class="counters vcounters" style="margin-top:16px">' + ui.counter('Séances', String(g.sessions).replace('.', ',') + '<small> / mois</small>', plural(p.slots, 'créneau', 'créneaux') + ' par semaine', 'sent') + ui.counter('Participants', g.participants, g.firstVisits + ' premières visites', 'int') +
      ui.counter('CA additionnel', U.fmt(g.ca) + '<small> €</small>', 'par mois, formules cochées', 'int') + ui.counter('Marge brute', U.fmt(g.marge) + '<small> €</small>', g.cost ? U.eur(g.cost) + ' HT de coûts' : 'estimée', g.cost ? 'wait' : '') + '</div>';
    var rows = ui._vCompare ? g.rows : on;
    html += '<div class="chart vbars" style="margin-top:14px">' + (rows.length ? C.charts.barsSVG(rows.map(function (r) { return { label: r.n + ' · ' + r.label, a: r.ca, b: r.marge, cost: r.cost, muted: !r.applies || (ui._vCompare && !r.on), note: (W.innerWidth || 1024) < 600 ? '' : r.text }; }), { w: Math.min(620, Math.max(300, (W.innerWidth || 1024) - 70)) }) : '<p class="empty">Cocher une formule pour voir le gain.</p>') + '</div>';
    html += '<div class="note" style="margin-top:12px"><span class="lbl">Valeur des nouveaux clients sur 6 mois ' + BADGE('returnRate') + '</span><span class="sp"><b class="num" id="v-newval">' + U.eur(g.newClientsValue6m) + '</b> si ' + Math.round(p.returnRate * 100) + ' % des premières visites reviennent ' + p.visitsPerMonth + ' fois par mois. Hypothèse à mesurer sur place.</span></div>';
    html += '<details class="more vhyp"><summary>Hypothèses du calcul</summary><div class="vsgrid">' +
      fld('people', 'Participants par séance', p.people, { min: 2, max: 8, unit: 'pers.' }) + '<label class="vsf"><span class="lbl">Hôte compté comme consommateur ' + BADGE('host') + '</span><label class="toggle"><input type="checkbox" data-sim="host"' + (p.host ? ' checked' : '') + '> oui</label></label>' +
      fld('ticket', 'Ticket moyen', p.ticket, { unit: '€', step: 0.5 }) + fld('margin', 'Marge brute', Math.round(p.margin * 100), { max: 100, unit: '%' }) + fld('basket', 'Panier des ventes liées', p.basket, { unit: '€' }) +
      fld('firstShare', 'Part de premières visites', Math.round(p.firstShare * 100), { max: 100, unit: '%' }) + fld('returnRate', 'Taux de retour des nouveaux', Math.round(p.returnRate * 100), { max: 100, unit: '%' }) + fld('visitsPerMonth', 'Visites par mois d’un client revenu', p.visitsPerMonth, { max: 30, unit: 'fois' }) +
      fld('ordered', 'Séances commandées par mois', p.ordered, { max: 30, unit: 'séances' }) + fld('soirees', 'Soirées découverte par mois', p.soirees, { max: 8, unit: 'soirées' }) +
      '</div><p class="faint" style="font-size:11.5px;margin-top:8px">Un créneau hebdomadaire = 4,33 séances par mois. Marge supposée : 70 % sur les boissons, 35 % sur les ventes de matériel, 100 % sur la part reversée. Formule 4 : coût pour le lieu ; formule 5 : rentable si un client fidèle par mois.</p></details>';
    return html;
  }
  function partnerHTML(v, g) {
    var t = C.venueType(v.type), sess = C.venueSessions(v, 6), kit = C.venueKit(v);
    ui._copyStore = ui._copyStore || {};
    var html = '<div class="grid2"><section class="panel vsheet"><div class="ph"><span class="t">Fiche partenaire</span>' + (v.demo ? ui.pill('lieu fictif de démonstration', 'wait') : '') + '</div><div class="pb">' +
      '<div class="h3" style="font-size:22px">' + E(v.name || 'Votre lieu') + '</div><p class="sp">' + E(t.label) + ' · ' + E(C.zoneOf(v.city, v.arr) || 'zone à préciser') + ' · ' + U.num(v.capacity, 8) + ' places</p>' +
      '<div class="row" style="margin-top:8px">' + v.formulas.map(function (id) { var f = C.formulaById(id); return ui.pill(f.n + ' · ' + f.label, 'int'); }).join('') + '</div>' +
      '<div class="lbl" style="margin-top:12px">Créneaux</div><p class="sp">' + E(C.venueSlotsText(v).join(', ') || 'à préciser') + '</p>' +
      '<div class="lbl" style="margin-top:10px">Équipements</div><p class="sp">' + E(C.venueEquipText(v).join(', ') || 'à préciser') + '</p>' +
      '<div class="lbl" style="margin-top:10px">Six séances possibles</div><ul class="clean">' + sess.map(function (x) { return '<li>' + E(x.s.name) + ' · <span class="faint">en 1 h : ' + E(U.lc(x.oneHour)) + '</span></li>'; }).join('') + '</ul>' +
      '<div class="lbl" style="margin-top:10px">Ce que les participants s’engagent à faire</div><ul class="clean">' + C.VENUE_RULES.map(function (r) { return '<li>' + E(r) + '</li>'; }).join('') + '</ul>' +
      '<div class="row" style="margin-top:12px"><button class="btn sm" data-act="vDlSheet">' + ui.icon('dl') + ' Fiche HTML</button><button class="btn ghost sm" data-act="vDl">Fiche texte</button></div></div></section>' +
      '<section class="panel"><div class="ph"><span class="t">Charte d’une page</span><span class="hint">12 mois</span></div><div class="pb"><ol class="charter">' + C.venueCharterClauses(v).map(function (c) { return '<li><b>' + E(c[0]) + '</b> ' + E(c[1]) + '</li>'; }).join('') + '</ol>' +
      '<p class="faint" style="font-size:11.5px">Modèle indicatif, à faire relire par un juriste avant usage.</p><div class="row" style="margin-top:10px"><button class="btn sm" data-act="vDlCharter" data-fmt="html">' + ui.icon('dl') + ' Charte HTML</button><button class="btn ghost sm" data-act="vDlCharter" data-fmt="txt">Charte texte</button></div></div></section></div>';
    html += '<section class="panel" style="margin-top:16px"><div class="ph"><span class="t">Kit de communication</span>' + (C.ai.has() ? '<button class="btn ghost sm" data-act="vKitAi">' + ui.icon('spark') + ' Réécrire</button>' : '') + '</div><div class="pb"><div class="vkit"><div class="cardprev" id="v-poster"><div class="status"><span class="spin"></span>Affiche…</div></div><div>' +
      kit.posts.map(function (pp, i) { return ui.copyBlock('Publication ' + (i + 1), pp, 'vpost' + i); }).join('') + ui.copyBlock('Message aux habitués', kit.message, 'vmsg') + '</div></div>' +
      '<div class="row" style="margin-top:12px"><button class="btn sm" data-act="vKitDl" data-item="affiche">Affiche A4</button><button class="btn sm" data-act="vKitDl" data-item="chevalet">Chevalet A6</button><button class="btn sm" data-act="vKitDl" data-item="story">Story</button><button class="btn sm" data-act="vKitDl" data-item="html">Affiche et chevalet imprimables</button><button class="btn" data-act="vKitAll">' + ui.icon('dl') + ' Tout télécharger</button></div>' +
      '<p class="faint" style="font-size:11.5px;margin-top:8px">Lien du lieu : ' + E(kit.link) + '. Pas de QR code : aucun encodeur local dans ce prototype.</p></div></section>';
    return html;
  }
  function drawKitPreview(v) {
    var box = ui.$('#v-poster'); if (!box) return;
    ui.cardFontsReady().then(function () {
      var cv = ui.drawVenuePoster(document.createElement('canvas'), v, 'affiche');
      var b = ui.$('#v-poster'); if (b) b.innerHTML = '<img src="' + cv.toDataURL('image/png') + '" alt="Aperçu de l’affiche du lieu" class="poster">';
    });
  }
  ui.actions.vType = function (el) { var v = venueState(); v.type = el.getAttribute('data-v'); v.formulas = C.venueType(v.type).formulas.slice(0, 1); v.sim = {}; venueSave(); C.track('venue_type', { t: v.type }); keepRender(); };
  ui.actions.vEquip = function (el) { var v = venueState(), a = v.equip, k = el.getAttribute('data-v'), i = a.indexOf(k); if (i >= 0) a.splice(i, 1); else a.push(k); venueSave(); keepRender(); };
  ui.actions.vSlot = function (el) { var v = venueState(), a = v.slots, k = el.getAttribute('data-k'), i = a.indexOf(k); if (i >= 0) a.splice(i, 1); else a.push(k); venueSave(); if (a.length === 1 && i < 0) C.track('venue_slots'); keepRender(); };
  ui.actions.vPer = function (el) { venueState().perSlot = +el.getAttribute('data-val'); venueSave(); keepRender(); };
  ui.actions.vFormula = function (el) { var v = venueState(), a = v.formulas, k = el.getAttribute('data-v'), i = a.indexOf(k); if (i >= 0) a.splice(i, 1); else { a.push(k); C.track('venue_formula', { f: k }); } venueSave(); keepRender(); };
  ui.actions.vCompare = function () { ui._vCompare = !ui._vCompare; if (ui._vCompare) C.track('venue_compare'); keepRender(); };
  ui.actions.vPitch = function () { ui._slide = 0; C.track('venue_pitch_open'); ui.go('#/lieu/pitch'); };
  function slug(v) { return v.slug || C.venueSlug(v.name || 'mon-lieu'); }
  ui.actions.vDl = function () { var v = venueState(); C.download('cordes-lieu-' + slug(v) + '.txt', C.venueSheet(v) + '\n', 'text/plain;charset=utf-8'); C.track('venue_sheet_dl', { fmt: 'txt' }); };
  ui.actions.vDlSheet = function () { var v = venueState(); C.download('cordes-lieu-' + slug(v) + '.html', C.venueSheetHTML(v), 'text/html;charset=utf-8'); C.track('venue_sheet_dl', { fmt: 'html' }); };
  ui.actions.vDlCharter = function (el) {
    var v = venueState(), fmt = el.getAttribute('data-fmt');
    if (fmt === 'txt') C.download('cordes-charte-' + slug(v) + '.txt', C.venueCharter(v) + '\n', 'text/plain;charset=utf-8');
    else C.download('cordes-charte-' + slug(v) + '.html', C.venueCharterHTML(v), 'text/html;charset=utf-8');
    C.track('venue_charter_dl');
  };
  function kitFile(v, item) {
    if (item === 'html') return Promise.resolve({ name: 'cordes-affiche-' + slug(v) + '.html', data: C.venuePrintHTML(v), mime: 'text/html;charset=utf-8' });
    return ui.cardFontsReady().then(function () {
      var cv = ui.drawVenuePoster(document.createElement('canvas'), v, item);
      return new Promise(function (res) { cv.toBlob(function (b) { res({ name: 'cordes-' + item + '-' + slug(v) + '.png', data: b, mime: 'image/png' }); }, 'image/png'); });
    });
  }
  ui.actions.vKitDl = function (el) { var v = venueState(), item = el.getAttribute('data-item'); kitFile(v, item).then(function (f) { C.download(f.name, f.data, f.mime); C.track('venue_kit_dl', { item: item }); }); };
  ui.actions.vKitAll = function () {
    var v = venueState(), items = ['affiche', 'chevalet', 'story', 'html'], i = 0;
    var next = function () { if (i >= items.length) { C.download('cordes-kit-textes-' + slug(v) + '.txt', C.venueKit(v).posts.map(function (p, k) { return 'Publication ' + (k + 1) + '\n' + p; }).join('\n\n') + '\n\nMessage aux habitués\n' + C.venueKit(v).message + '\n', 'text/plain;charset=utf-8'); C.track('venue_kit_dl', { item: 'tout' }); ui.toast('Kit téléchargé'); return; } kitFile(v, items[i++]).then(function (f) { C.download(f.name, f.data, f.mime); setTimeout(next, 250); }); };
    next();
  };
  ui.actions.vKitAi = function (el) {
    var v = venueState(), kit = C.venueKit(v); el.disabled = true;
    C.ai.ask('Réécris ces trois publications pour les réseaux sociaux du lieu « ' + (v.name || 'notre lieu') + ' » (' + C.venueType(v.type).label + '), vouvoiement, 300 caractères au plus chacune, sans emoji, séparées par une ligne vide :\n\n' + kit.posts.join('\n\n'), function () {})
      .then(function (t) { var parts = String(t || '').split(/\n\s*\n/).map(function (x) { return x.trim(); }).filter(Boolean).slice(0, 3); parts.forEach(function (pp, i) { ui._copyStore['vpost' + i] = pp; var b = ui.$$('#v-s4 .copyblock .cb-t')[i]; if (b) b.textContent = pp; }); el.disabled = false; ui.toast('Publications réécrites'); })
      .catch(function () { el.disabled = false; ui.toast('IA indisponible · textes standard', 'wait'); });
  };
  ui.actions.vJoin = function () {
    var v = venueState();
    if (!String(v.name || '').trim()) { ui.toast('Indiquer le nom du lieu', 'no'); ui.$('#v-name').focus(); return; }
    if (!v.slots.length) { ui.toast('Choisir au moins un créneau creux', 'no'); return; }
    var g = C.venueGain(v);
    var entry = { id: (ui.st.waitlist && ui.st.waitlist.role === 'lieu' && ui.st.waitlist.id) || undefined, source: 'lieu', role: 'lieu', city: v.city, arr: C.isParis(v.city) ? v.arr : '', zone: C.zoneOf(v.city, v.arr), email: (v.contact || '').trim() || undefined, consent: ui.$('#v-consent').checked, wants: [], offers: [],
      venue: { name: v.name.trim(), type: v.type, capacity: v.capacity, slots: v.slots.slice(), equip: v.equip.slice(), formulas: v.formulas.slice(), skills: C.venueMatch(v, 8).skills.map(function (x) { return x.s.id; }), gain: { sessions: g.sessions, participants: g.participants, ca: g.ca, marge: g.marge, cost: g.cost } } };
    var errs = C.waitlist.validate(entry);
    if (errs.length) { ui.toast(errs[0], 'no'); return; }
    C.track('venue_join', { formulas: v.formulas.join(',') });
    ui.saveWaitEntry(entry);
  };

  /* ---------- mode présentation : 4 diapositives ---------- */
  function slides(v) {
    var t = C.venueType(v.type), g = C.venueGain(v);
    return [
      { k: 'Le principe', t: (v.name ? v.name + ' : ' : '') + 'des séances d’une heure aux heures creuses', body: '<p class="pp">' + E(t.pitch) + '</p>' },
      { k: 'Ce que vous gagnez', t: 'Par mois, avec ' + plural(g.params.slots, 'créneau', 'créneaux') + ' par semaine', body: '<div class="pnums"><div><b>' + String(g.sessions).replace('.', ',') + '</b><span>séances</span></div><div><b>' + g.participants + '</b><span>participants</span></div><div><b>' + U.eur(g.ca) + '</b><span>chiffre d’affaires additionnel</span></div><div><b>' + U.eur(g.marge) + '</b><span>marge brute</span></div></div>' +
        '<p class="pf">' + E(g.chosen.map(function (r) { return r.n + ' · ' + r.label; }).join(' + ') || 'Choisir une formule') + ' · estimations, à vérifier sur place</p>' },
      { k: 'Comment ça marche', t: 'Cinq étapes, aucun loyer', body: '<ol class="psteps">' + ['Vous choisissez vos créneaux, votre jauge et votre formule', 'Cordes fait venir 4 à 6 voisins inscrits', 'Un hôte anime une heure, le matériel est prévu', 'Les participants consomment ou achètent chez vous', 'Un rapport chaque mois ; un créneau se ferme sous 7 jours'].map(function (x) { return '<li>' + E(x) + '</li>'; }).join('') + '</ol>' },
      { k: 'La charte', t: 'Une page, douze mois, sans exclusivité', body: '<ol class="pcharter">' + C.venueCharterClauses(v).map(function (c) { return '<li>' + E(c[0]) + '</li>'; }).join('') + '</ol>' }
    ];
  }
  function pitchHTML(v) {
    var S = slides(v), i = U.clamp(ui._slide || 0, 0, S.length - 1), s = S[i];
    return '<div class="pitch" id="pitch"><div class="pbar"><a class="btn ghost sm" href="#/lieu">' + ui.icon('x') + ' Quitter</a><span class="pdots" aria-hidden="true">' + S.map(function (_, k) { return '<i class="' + (k === i ? 'on' : '') + '"></i>'; }).join('') + '</span><span class="faint num">' + (i + 1) + ' / ' + S.length + '</span></div>' +
      '<section class="pslide" aria-live="polite" aria-roledescription="diapositive" aria-label="' + (i + 1) + ' sur ' + S.length + '"><div class="kicker">' + E(s.k) + (v.demo ? ' · lieu fictif de démonstration' : '') + '</div><h1 class="pt">' + E(s.t) + '</h1>' + s.body + '</section>' +
      '<div class="pnav"><button class="btn lg" data-act="pPrev"' + (i ? '' : ' disabled') + '>' + ui.icon('arrowL') + ' Précédente</button><button class="btn primary lg" data-act="pNext"' + (i < S.length - 1 ? '' : ' disabled') + '>Suivante ' + ui.icon('arrowR') + '</button></div></div>';
  }
  function go(d) { var n = U.clamp((ui._slide || 0) + d, 0, 3); if (n === ui._slide) return; ui._slide = n; C.track('venue_pitch_slide', { n: n + 1 }); ui.render({ keepFocus: false }); }
  ui.actions.pPrev = function () { go(-1); };
  ui.actions.pNext = function () { go(1); };
  function pitchKey(ev) { if (ev.key === 'ArrowRight' || ev.key === ' ') { ev.preventDefault(); go(1); } else if (ev.key === 'ArrowLeft') { ev.preventDefault(); go(-1); } }
  function mountPitch(root) {
    var el = ui.$('#pitch', root); if (!el) return;
    var x0 = null;
    el.addEventListener('pointerdown', function (e) { if (e.pointerType !== 'mouse') x0 = e.clientX; });
    el.addEventListener('pointerup', function (e) { if (x0 == null) return; var d = e.clientX - x0; x0 = null; if (d < -60) go(1); else if (d > 60) go(-1); });
  }

  /* ---------- fiche publique #/l/<slug> ---------- */
  ui.routes.l = {
    title: 'Lieu partenaire',
    render: function (st, slugp) {
      var v = C.venueBySlug(slugp);
      if (!v) return '<div class="wrap narrow"><div class="note no" style="margin-top:30px"><span class="lbl">Lieu introuvable</span><span class="sp">Ce lieu n’est pas (ou plus) référencé sur cet appareil.</span></div><a class="btn primary" href="#/lieu" style="margin-top:14px">Proposer un lieu</a></div>';
      var t = C.venueType(v.type), sess = C.venueSessions(v, 6);
      ui._lv = v;
      return '<div class="wrap"><div class="kicker">Lieu partenaire · ' + E(t.label) + (v.demo ? ' · lieu fictif de démonstration' : '') + '</div><h1 class="h1">' + E(v.name) + '</h1><p class="lead">' + E(C.zoneOf(v.city, v.arr)) + ' · ' + U.num(v.capacity, 8) + ' places · ' + E(C.venueSlotsText(v).join(', ')) + '</p>' +
        (v.demo ? '<div class="note wait" style="margin-top:12px"><span class="lbl">Lieu fictif de démonstration</span><span class="sp">Ce lieu n’existe pas : il illustre ce qu’une fiche partenaire affichera.</span></div>' : '') +
        '<div class="grid2" style="margin-top:16px"><section class="panel"><div class="ph"><span class="t">Séances possibles ici</span></div><div class="pb tight">' + sess.map(function (x) { return '<div class="resitem"><div class="nm" style="font-size:15px">' + E(x.s.name) + '</div>' + ui.uniTag(x.s.universe) + '<div class="d">En 1 h : ' + E(U.lc(x.oneHour)) + '</div></div>'; }).join('') + '</div></section>' +
        '<section class="panel"><div class="ph"><span class="t">Pourquoi ici</span></div><div class="pb"><p class="prose">' + E(t.pitch) + '</p><div class="lbl" style="margin-top:12px">Équipements</div><p class="sp">' + E(C.venueEquipText(v).join(', ')) + '</p>' +
        '<div class="row" style="margin-top:14px"><button class="btn primary" data-act="lWait">Être prévenu des séances ici</button><a class="btn" href="#/idees">Idées à vivre</a></div></div></section></div></div>';
    }
  };
  ui.actions.lWait = function () { var v = ui._lv; ui._prefill = { wants: C.venueSessions(v, 4).map(function (x) { return x.s.id; }), source: 'lieu-fiche' }; ui._wl = null; ui.go('#/attente'); };
  ui.actions.venueOpen = function (el) { C.track('venue_card_click', { id: el.getAttribute('data-slug'), from: el.getAttribute('data-from') }); ui.go('#/l/' + el.getAttribute('data-slug')); };
  // lien vers un lieu, réutilisé par les idées et les résultats
  ui.venueLine = function (x, from) {
    var v = x.v;
    return '<button type="button" class="venueline" data-act="venueOpen" data-slug="' + E(v.slug) + '" data-from="' + E(from) + '">' + ui.icon('pin') + '<span>À faire chez <b>' + E(v.name) + '</b> · ' + E((C.zoneOf(v.city, v.arr) || '').replace(/^Paris /, '')) + (v.demo ? ' · lieu fictif de démonstration' : '') + '</span></button>';
  };
})(window);
