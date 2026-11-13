/* Outils : Autour de moi (OSM), recherches préparées, comparaison avec un ami (troc), vue d'un bilan partagé. */
(function (W) {
  'use strict';
  var C = W.Cordes, U = C.util, ui = C.ui, E = ui.e;

  function userUniverses(st) {
    var u = {};
    C.yesDesires(st).forEach(function (id) { u[C.data.sById[id].universe] = 1; });
    U.arr(st.offer && st.offer.strong).forEach(function (id) { var s = C.data.sById[id]; if (s) u[s.universe] = 1; });
    return Object.keys(u);
  }
  ui.osmState = ui.osmState || { status: 'idle' };

  /* ---------- Autour de moi ---------- */
  ui.routes['outils/autour'] = {
    title: 'Autour de moi',
    render: function (st, param) {
      var o = ui.osmState;
      if (!o.init || (param && o.param !== param)) {
        o.init = true; o.param = param;
        o.city = o.city || st.context.city || '';
        o.radius = o.radius || U.num(st.context.radiusKm, 5);
        o.unis = param && C.data.uById[param] ? [param] : (userUniverses(st).slice(0, 3).length ? userUniverses(st).slice(0, 3) : ['musique']);
        o.side = st.mode === 'offer' ? 'offer' : 'learn';
      }
      var html = '<div class="wrap"><div class="kicker">Outil · OpenStreetMap</div><h1 class="h1">Autour de moi</h1><p class="lead">Écoles, clubs, ateliers, tiers-lieux, studios : les lieux réels cartographiés par la communauté OpenStreetMap, triés par distance.</p>' +
        '<div class="osmgrid" style="margin-top:20px"><section class="panel"><div class="ph"><span class="t">Recherche</span></div><div class="pb">' +
        '<label class="field" style="margin-top:0"><span class="lbl">Ville ou adresse</span><input class="input" id="osm-city" data-search value="' + E(o.city) + '" placeholder="Paris 11e, Nantes, Annecy…" autocomplete="address-level2"></label>' +
        '<div class="field"><span class="lbl">Rayon</span>' + ui.seg('_', [[1, '1 km'], [2, '2 km'], [5, '5 km'], [10, '10 km']], o.radius, 'Rayon').replace(/data-act="set" data-bind="_"/g, 'data-act="osmRadius"') + '</div>' +
        '<div class="field"><span class="lbl">Je cherche à</span>' + ui.seg('_', [['learn', 'Apprendre'], ['offer', 'Transmettre']], o.side, 'Côté').replace(/data-act="set" data-bind="_"/g, 'data-act="osmSide"') + '</div>' +
        '<div class="field"><span class="lbl">Univers (3 au plus pour une recherche rapide)</span><div class="chips">' + C.data.universes.map(function (u) { var on = o.unis.indexOf(u.id) >= 0; return '<button class="chip' + (on ? ' on' : '') + '" aria-pressed="' + on + '" data-act="osmUni" data-u="' + u.id + '"><i></i>' + E(u.short) + '</button>'; }).join('') + '</div></div>' +
        '<div class="row" style="margin-top:20px"><button class="btn primary lg" data-act="osmRun"' + (o.status === 'loading' ? ' disabled' : '') + '>' + ui.icon('pin') + ' Chercher</button>' + (W.navigator.geolocation ? '<button class="btn" data-act="osmGeo">Ma position</button>' : '') + '</div>' +
        '<p class="faint" style="margin-top:14px;font-size:11.5px">Géocodage Nominatim (une requête par recherche, mise en cache) et lieux via l’API Overpass. Données © contributeurs OpenStreetMap, ODbL.</p></div></section>' +
        '<section class="panel"><div class="ph"><span class="t">Résultats</span><span class="hint" id="osm-hint">' + osmHint(o) + '</span></div><div class="pb" id="osm-body">' + osmBody(o) + '</div></section></div></div>';
      return html;
    },
    mount: function (root) { var c = ui.$('#osm-city', root); if (c) c.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); ui.actions.osmRun(); } }); }
  };
  function osmHint(o) {
    if (o.status === 'loading') return 'recherche…';
    if (o.status === 'done') return o.items.length + ' lieu' + (o.items.length > 1 ? 'x' : '') + ' · ' + E(o.geo.source === 'nominatim' ? 'géocodé' : o.geo.source === 'cache' ? 'cache' : o.geo.source === 'gps' ? 'position GPS' : 'table locale');
    return '';
  }
  function osmBody(o, compact) {
    if (o.status === 'loading') return '<div class="status"><span class="spin"></span>' + E(o.msg || 'Recherche en cours…') + '</div>';
    if (o.status === 'error') return '<div class="note no"><span class="lbl">Recherche interrompue</span><span class="sp">' + E(o.error) + '</span></div>' + fallbackSearches(o);
    if (o.status !== 'done') return '<p class="empty">Choisir une ville et des univers, puis lancer la recherche.</p>';
    var it = o.items;
    var html = (o.geo.warning ? '<div class="note wait" style="margin-bottom:12px"><span class="lbl">Position approximative</span><span class="sp">' + E(o.geo.warning) + '</span></div>' : '');
    if (!it.length) return html + '<div class="note wait"><span class="lbl">Aucun lieu cartographié</span><span class="sp">OpenStreetMap n’a rien dans ce rayon pour ces univers. Élargir le rayon, changer d’univers ou utiliser les recherches préparées.</span></div>' + fallbackSearches(o);
    var cats = {}; it.forEach(function (x) { cats[x.category] = (cats[x.category] || 0) + 1; });
    html += '<div class="grid2" style="align-items:start"><div class="chart">' + C.charts.mapSVG(it.slice(0, 60), o.geo.lat, o.geo.lon, o.radius, { size: compact ? 300 : 360 }) + '</div><div><div class="lbl">Par catégorie</div><div class="splitlegend" style="margin-top:8px">' + Object.keys(cats).sort(function (a, b) { return cats[b] - cats[a]; }).slice(0, 8).map(function (k) { return '<div><span class="sq" style="background:var(--fg-3)"></span><span>' + E(k) + '</span><span class="num">' + cats[k] + '</span><span></span></div>'; }).join('') + '</div></div></div>';
    html += '<div style="margin-top:10px">' + it.slice(0, compact ? 8 : 40).map(function (x, i) {
      var col = x.universe ? C.hue(x.universe) : 'var(--fg-3)';
      return '<div class="place"><span class="rk" style="background:' + col + '">' + (i + 1) + '</span><div><div class="nm">' + E(x.name) + '</div><div class="m"><span>' + E(x.category) + '</span>' + (x.address ? '<span>' + E(x.address) + '</span>' : '') + (x.hours ? '<span>' + E(x.hours.slice(0, 40)) + '</span>' : '') + '</div>' +
        '<div class="m" style="margin-top:4px">' + ui.extLink(x.url, 'Voir sur OpenStreetMap') + (x.website ? ui.extLink(x.website, 'site') : '') + '</div></div><span class="dist">' + (x.dist < 1 ? Math.round(x.dist * 1000) + ' m' : String(Math.round(x.dist * 10) / 10).replace('.', ',') + ' km') + '</span></div>';
    }).join('') + '</div>';
    if (it.length > (compact ? 8 : 40)) html += '<p class="faint" style="margin-top:8px">' + (it.length - (compact ? 8 : 40)) + ' autres lieux plus éloignés.</p>';
    return html;
  }
  function fallbackSearches(o) {
    var u = C.universe(o.unis[0] || 'musique');
    var links = C.searchLinks(u.short, o.side === 'offer' ? 'lieu atelier' : 'cours atelier', o.city, o.side).slice(0, 6);
    return '<div class="lbl" style="margin-top:14px">Recherches préparées</div><div class="linkgrid" style="margin-top:8px">' + links.map(function (s) { return '<a href="' + E(s.url) + '" target="_blank" rel="noopener noreferrer">' + E(s.name) + ui.icon('ext') + '</a>'; }).join('') + '</div>';
  }
  function refreshOsm() { var b = ui.$('#osm-body'), h = ui.$('#osm-hint'); if (b) b.innerHTML = osmBody(ui.osmState); if (h) h.innerHTML = osmHint(ui.osmState); var btn = ui.$('[data-act="osmRun"]'); if (btn) btn.disabled = ui.osmState.status === 'loading'; }
  ui.actions.osmRadius = function (el) { ui.osmState.radius = +el.getAttribute('data-val'); ui.osmState.city = ui.$('#osm-city').value; ui.render(); };
  ui.actions.osmSide = function (el) { ui.osmState.side = el.getAttribute('data-val'); ui.osmState.city = ui.$('#osm-city').value; ui.render(); };
  ui.actions.osmUni = function (el) {
    var u = el.getAttribute('data-u'), a = ui.osmState.unis, i = a.indexOf(u);
    if (i >= 0) a.splice(i, 1); else { a.push(u); if (a.length > 3) a.shift(); }
    ui.osmState.city = ui.$('#osm-city').value; ui.render();
  };
  ui.runOsm = function (o, city, onUpdate) {
    o.status = 'loading'; o.msg = 'Localisation de « ' + city + ' »…'; onUpdate();
    var geoP = o.gps ? Promise.resolve(o.gps) : C.geocode(city);
    return geoP.then(function (g) {
      o.geo = g; o.msg = 'Recherche des lieux dans un rayon de ' + o.radius + ' km…'; onUpdate();
      var sels = C.osmSelectors(o.unis.length ? o.unis : ['musique'], o.side);
      return C.overpass(sels, g.lat, g.lon, o.radius * 1000);
    }).then(function (r) { o.items = r.items; o.status = 'done'; onUpdate(); })
      .catch(function (err) { o.status = 'error'; o.error = C.osmErrorText(err); if (W.console) console.info('[Cordes] OSM', err && err.message); onUpdate(); });
  };
  ui.actions.osmRun = function () {
    var o = ui.osmState, city = ui.$('#osm-city').value.trim();
    if (!city && !o.gps) { ui.toast('Indiquer une ville', 'wait'); ui.$('#osm-city').focus(); return; }
    if (o.status === 'loading') return;
    if (city !== o.city) o.gps = null;
    o.city = city;
    if (city && !ui.st.context.city) { ui.st.context.city = city; ui.save(); }
    ui.runOsm(o, city, refreshOsm);
  };
  ui.actions.osmGeo = function () {
    var o = ui.osmState;
    o.status = 'loading'; o.msg = 'Demande de votre position…'; refreshOsm();
    navigator.geolocation.getCurrentPosition(function (p) {
      o.gps = { lat: p.coords.latitude, lon: p.coords.longitude, label: 'Ma position', source: 'gps' };
      ui.$('#osm-city').value = 'Ma position'; o.city = 'Ma position'; o.status = 'idle'; ui.actions.osmRun();
    }, function () { o.status = 'error'; o.error = 'Position refusée ou indisponible. Indiquer une ville.'; refreshOsm(); }, { timeout: 10000, maximumAge: 600000 });
  };
  // recherche intégrée dans un plan d'apprentissage
  ui.actions.osmInline = function (el) {
    var target = ui.$('#' + el.getAttribute('data-target'));
    var city = ui.st.context.city;
    if (!city) { target.innerHTML = '<div class="note wait"><span class="lbl">Ville manquante</span><span class="sp">Indiquer votre ville à l’étape 1 ou dans l’outil complet.</span></div>'; return; }
    var o = { radius: U.num(ui.st.context.radiusKm, 5), unis: [el.getAttribute('data-u')], side: 'learn', city: city };
    el.disabled = true;
    ui.runOsm(o, city, function () { target.innerHTML = osmBody(o, true); if (o.status !== 'loading') el.disabled = false; });
  };

  /* ---------- recherches préparées ---------- */
  ui.routes['outils/recherches'] = {
    title: 'Recherches préparées',
    render: function (st) {
      var r = ui._rs = ui._rs || { id: C.yesDesires(st)[0] || (st.offer.strong || [])[0] || 'latte-art', intent: st.mode === 'offer' ? 'enseigner' : 'cours', city: st.context.city || '' };
      if (!C.data.sById[r.id]) r.id = C.data.skills[0].id;
      var s = C.data.sById[r.id];
      var intents = [['cours', 'Cours'], ['atelier débutant', 'Atelier découverte'], ['club', 'Club ou association'], ['stage', 'Stage'], ['matériel occasion', 'Matériel d’occasion'], ['enseigner', 'Enseigner']];
      var side = r.intent === 'enseigner' ? 'offer' : 'learn';
      var links = C.searchLinks(s, r.intent === 'enseigner' ? 'donner des cours' : r.intent, r.city, side);
      return '<div class="wrap"><div class="kicker">Outil</div><h1 class="h1">Recherches préparées</h1><p class="lead">Des liens directs vers les bons sites, avec la requête déjà composée : compétence, intention et ville.</p>' +
        '<section class="panel" style="margin-top:20px"><div class="pb"><div class="grid2"><div><span class="lbl">Compétence</span><div class="searchbox" style="margin-top:8px"><input class="input" id="rs-q" data-search value="' + E(s.name) + '" autocomplete="off" aria-label="Compétence">' + ui.icon('search') + '<kbd class="kbdhint">/</kbd></div><div id="rs-res" style="margin-top:8px"></div></div>' +
        '<label><span class="lbl">Ville</span><input class="input" id="rs-city" value="' + E(r.city) + '" style="margin-top:8px" autocomplete="address-level2"></label></div>' +
        '<div class="lbl" style="margin-top:16px">Intention</div><div class="chips" style="margin-top:8px">' + intents.map(function (x) { var on = r.intent === x[0]; return '<button class="chip' + (on ? ' on' : '') + '" aria-pressed="' + on + '" data-act="rsIntent" data-v="' + E(x[0]) + '"><i></i>' + E(x[1]) + '</button>'; }).join('') + '</div></div></section>' +
        '<div class="section-h"><span class="kicker">' + links.length + ' liens</span><h2 class="h2">' + E(s.name) + ' · ' + E(r.intent) + (r.city ? ' · ' + E(r.city) : '') + '</h2></div><div class="linkgrid">' + links.map(function (l) { return '<a href="' + E(l.url) + '" target="_blank" rel="noopener noreferrer">' + E(l.name) + ui.icon('ext') + '</a>'; }).join('') + '</div></div>';
    },
    mount: function (root) {
      var q = ui.$('#rs-q', root), city = ui.$('#rs-city', root);
      q.addEventListener('input', function () { var r = q.value.length >= 2 ? C.search(q.value, 8) : []; ui.$('#rs-res').innerHTML = r.length ? '<div class="chips">' + r.map(function (s) { return '<button class="chip" data-act="rsPick" data-id="' + E(s.id) + '"><i></i>' + E(s.name) + '</button>'; }).join('') + '</div>' : ''; });
      city.addEventListener('change', function () { ui._rs.city = city.value.trim(); ui.render(); });
    }
  };
  ui.actions.rsPick = function (el) { ui._rs.id = el.getAttribute('data-id'); ui.render(); };
  ui.actions.rsIntent = function (el) { ui._rs.intent = el.getAttribute('data-v'); ui._rs.city = ui.$('#rs-city').value.trim(); ui.render(); };

  /* ---------- comparer / troc ---------- */
  ui.routes.comparer = {
    title: 'Comparer avec un ami',
    render: function (st) {
      var cmp = ui._cmp || {};
      var html = '<div class="wrap"><div class="kicker">Troc entre proches</div><h1 class="h1">Comparer avec un ami</h1><p class="lead">Collez le lien de bilan d’un ami : Cordes trouve ce que vous avez en commun, ce que chacun peut apprendre à l’autre, et des idées d’activités à deux.</p>';
      if (!st.mode) html += '<div class="note wait" style="margin-top:16px"><span class="lbl">Votre bilan d’abord</span><span class="sp">La comparaison se fait entre deux bilans.</span> <a href="#/accueil">Faire mon bilan</a> · <a href="#/demo">Charger une démo</a></div>';
      html += '<section class="panel" style="margin-top:18px"><div class="pb"><label class="lbl" for="cmp-in">Lien du bilan de votre ami</label><textarea class="input" id="cmp-in" data-search style="margin-top:8px;font:12px var(--f-mono);min-height:80px" placeholder="…index.html#b=z…">' + E(cmp.input || '') + '</textarea>' +
        '<div class="row" style="margin-top:10px"><button class="btn primary" data-act="cmpRun"' + (st.mode ? '' : ' disabled') + '>Comparer</button>' + (st.mode ? '<button class="btn ghost" data-act="share">' + ui.icon('share') + ' Mon lien à envoyer</button>' : '') + '<button class="btn ghost" data-act="cmpDemo">Essayer avec un profil de démo</button></div>' +
        (cmp.error ? '<div class="note no" style="margin-top:12px"><span class="lbl">Lien illisible</span><span class="sp">' + E(cmp.error) + '</span></div>' : '') + '</div></section>';
      if (cmp.result && st.mode) html += trocHTML(st, cmp.other, cmp.result);
      return html + '</div>';
    }
  };
  function trocHTML(A, B, t) {
    var an = A.context.firstName || 'Vous', bn = B.context.firstName || 'votre ami';
    var nm = function (id) { var s = C.data.sById[id]; return s ? E(s.name) : id; };
    var html = '<div class="counters" style="margin-top:18px">' + ui.counter('Compatibilité', t.compat + '<small> %</small>', 'troc et envies communes', t.compat >= 50 ? 'int' : 'wait') + ui.counter('Trocs possibles', t.pairs.length, 'échanges bilatéraux', 'int') + ui.counter('Envies communes', t.commonWants.length, 'à apprendre ensemble', 'sent') + ui.counter('Compétences communes', t.commonSkills.length, 'à animer ensemble') + '</div>';
    html += '<div class="grid2" style="margin-top:16px"><section class="panel"><div class="ph"><span class="t">' + E(bn) + ' peut vous apprendre</span><span class="count">' + t.aFromB.length + '</span></div><div class="pb tight">' + (t.aFromB.map(function (x) { return '<div class="resitem"><div class="nm">' + nm(x.want) + '</div><span>' + ui.dots(x.level) + '</span><div class="m">' + (x.exact ? 'niveau ' + x.level + '/4' : 'via ' + nm(x.via) + ', compétence proche') + '</div></div>'; }).join('') || '<p class="empty">Aucune de vos envies dans ses compétences fortes.</p>') + '</div></section>' +
      '<section class="panel"><div class="ph"><span class="t">Vous pouvez apprendre à ' + E(bn) + '</span><span class="count">' + t.bFromA.length + '</span></div><div class="pb tight">' + (t.bFromA.map(function (x) { return '<div class="resitem"><div class="nm">' + nm(x.want) + '</div><span>' + ui.dots(x.level) + '</span><div class="m">' + (x.exact ? 'votre niveau ' + x.level + '/4' : 'via ' + nm(x.via)) + '</div></div>'; }).join('') || '<p class="empty">Aucune de ses envies dans vos compétences fortes.</p>') + '</div></section></div>';
    if (t.pairs.length) html += '<section class="panel" style="margin-top:16px"><div class="ph"><span class="t">Trocs proposés</span><span class="hint">2 × 1 h, sans argent</span></div><div class="gtable">' + t.pairs.map(function (p) { return '<div class="gtr" style="grid-template-columns:1fr auto 1fr"><span><span class="faint">' + E(an) + ' apprend</span><br><b style="font:400 16px var(--f-display)">' + nm(p.aLearns.via) + '</b></span><span class="faint">⇄</span><span><span class="faint">' + E(bn) + ' apprend</span><br><b style="font:400 16px var(--f-display)">' + nm(p.bLearns.via) + '</b></span></div>'; }).join('') + '</div></section>';
    html += '<div class="grid2" style="margin-top:16px"><section class="panel"><div class="ph"><span class="t">Idées à deux</span></div><div class="pb">' + (t.ideas.length ? '<ul class="clean">' + t.ideas.map(function (x) { return '<li>' + E(x) + '</li>'; }).join('') + '</ul>' : '<p class="empty">Ajouter des envies pour obtenir des idées.</p>') +
      (t.commonWants.length || t.commonSkills.length ? '<div class="row" style="margin-top:10px">' + t.commonWants.map(function (id) { return ui.pill(C.data.sById[id].name, 'sent'); }).join('') + t.commonSkills.map(function (id) { return ui.pill(C.data.sById[id].name, 'idle'); }).join('') + '</div>' : '') + '</div></section>' +
      '<section class="panel"><div class="ph"><span class="t">Projets collectifs à lancer ensemble</span></div><div class="pb tight">' + (t.projects.map(function (x) { return '<div class="resitem"><div class="nm">' + E(x.p.name) + '</div><span class="faint">' + x.p.size[0] + '–' + x.p.size[1] + ' pers.</span><div class="d">' + E(x.p.desc) + '</div></div>'; }).join('') || '<p class="empty">Aucun gabarit adapté.</p>') + '</div></section></div>';
    return html;
  }
  ui.actions.cmpRun = function () {
    var v = ui.$('#cmp-in').value.trim(); ui._cmp = { input: v };
    if (!v) { ui.toast('Coller un lien', 'wait'); return; }
    C.decodeShare(v).then(function (other) { ui._cmp.other = other; ui._cmp.result = C.troc(ui.st, other); ui.render(); ui.toast('Comparaison prête'); })
      .catch(function (e) { ui._cmp.error = e.message + ' Vérifier que le lien est complet (il contient « #b= »).'; ui.render(); });
  };
  ui.actions.cmpDemo = function () {
    if (!ui.st.mode) { ui.st = C.buildDemo('ines'); ui.save(true); }
    var pick = ui.st.demo === 'claire' ? 'ines' : 'claire';
    C.encodeShare(C.buildDemo(pick)).then(function (code) { ui._cmp = { input: C.shareUrl(code) }; ui.render(); ui.actions.cmpRun(); });
  };

  /* ---------- vue d'un bilan partagé ---------- */
  ui.routes.partage = {
    title: 'Bilan partagé',
    render: function (st, code) {
      var sh = ui._shared;
      if (!sh || sh.code !== code) {
        ui._shared = { code: code, loading: true };
        C.decodeShare(code).then(function (o) { ui._shared = { code: code, st: o }; ui.render(); }).catch(function (e) { ui._shared = { code: code, error: e.message }; ui.render(); });
        return '<div class="wrap"><div class="status"><span class="spin"></span>Lecture du bilan…</div></div>';
      }
      if (sh.loading) return '<div class="wrap"><div class="status"><span class="spin"></span>Lecture du bilan…</div></div>';
      if (sh.error) return '<div class="wrap narrow"><div class="note no" style="margin-top:30px"><span class="lbl">Lien illisible</span><span class="sp">' + E(sh.error) + '</span></div><a class="btn" href="#/accueil" style="margin-top:14px">Accueil</a></div>';
      var o = sh.st, name = o.context.firstName || 'Un ami';
      var skills = Object.keys(o.skills).sort(function (a, b) { return o.skills[b].level - o.skills[a].level; });
      var html = '<div class="wrap"><div class="kicker">Bilan partagé · lecture seule</div><h1 class="h1">Le bilan de ' + E(name) + '</h1><p class="lead">' + (o.context.city ? E(o.context.city) + ' · ' : '') + skills.length + ' compétences · ' + C.yesDesires(o).length + ' envies. Ce bilan est contenu dans le lien : rien n’est stocké sur un serveur.</p>' +
        '<div class="row" style="margin-top:14px">' + (st.mode ? '<button class="btn primary" data-act="cmpShared">Comparer avec mon bilan</button>' : '<a class="btn primary" href="#/accueil">Faire mon bilan pour comparer</a>') + '</div>' +
        '<div class="grid2" style="margin-top:18px"><section class="panel"><div class="ph"><span class="t">Maîtrise et envies</span></div><div class="pb chart">' + C.charts.radarSVG(C.universeProfile(o), { size: 340 }) + '</div></section>' +
        '<section class="panel"><div class="ph"><span class="t">Ce que ' + E(name) + ' sait faire</span></div><div class="pb tight">' + skills.map(function (id) { var s = C.data.sById[id]; return '<div class="resitem"><div class="nm">' + E(s.name) + '</div>' + ui.dots(o.skills[id].level) + '<div class="m">' + ui.uniTag(s.universe) + ' · ' + E(C.LEVELS[o.skills[id].level]) + '</div></div>'; }).join('') + '</div></section></div>' +
        '<section class="panel" style="margin-top:16px"><div class="ph"><span class="t">Ce que ' + E(name) + ' veut apprendre</span></div><div class="pb"><div class="row">' + C.yesDesires(o).map(function (id) { return ui.pill(C.data.sById[id].name, 'int'); }).join('') + '</div></div></section></div>';
      return html;
    }
  };
  ui.actions.cmpShared = function () { var code = ui._shared.code; ui._cmp = { input: '#b=' + code }; ui.go('#/comparer'); setTimeout(ui.actions.cmpRun, 30); };
})(window);
