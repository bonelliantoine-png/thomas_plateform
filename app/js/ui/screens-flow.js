/* Écrans du parcours : contexte, maîtrise, envies (paquet), affinage, style, forces, offre, profil entrepreneurial. */
(function (W) {
  'use strict';
  var C = W.Cordes, U = C.util, ui = C.ui, E = ui.e;
  C.INTENTS = [['plaisir', 'Me faire plaisir'], ['defi', 'Relever un défi'], ['rencontres', 'Rencontrer du monde'], ['equilibre', 'Prendre soin de moi'], ['transmettre', 'Transmettre'], ['complement', 'Gagner un complément'], ['activite', 'En vivre'], ['projets', 'Monter des projets']];
  C.MOTIVES = [['plaisir', 'Plaisir'], ['defi', 'Défi'], ['rencontres', 'Rencontres'], ['utile', 'Utile au quotidien'], ['creer', 'Créer'], ['forme', 'Forme'], ['confiance', 'Confiance en soi'], ['projets', 'Projet précis']];
  C.LEARN_FORMATS = [['cours', 'Cours individuel'], ['atelier', 'Atelier en groupe'], ['stage', 'Stage intensif'], ['communaute', 'Club ou cercle'], ['contenu', 'Seul, en ligne'], ['evenement', 'Sorties, soirées']];
  C.PROOFS = [['diplome', 'Diplôme ou certificat'], ['realisations', 'Réalisations'], ['portfolio', 'Portfolio en ligne'], ['avis', 'Avis ou témoignages'], ['presse', 'Prix, presse']];

  function stepper(cur) {
    var steps = ui.stepsFor(ui.st.mode), ci = steps.indexOf(cur);
    return '<nav class="stepper" aria-label="Étapes du bilan">' + steps.map(function (s, i) {
      return '<a href="#/bilan/' + s + '" class="' + (i < ci ? 'done' : i === ci ? 'cur' : '') + '"' + (i === ci ? ' aria-current="step"' : '') + '>' + (i + 1) + ' · ' + E(ui.STEP_DEFS[s]) + '</a>';
    }).join('') + '</nav>';
  }
  function flowbar(cur, info, nextLabel, disabled) {
    return '<div class="flowbar"><div class="in"><a class="btn ghost" href="' + ui.prevStep(cur) + '" aria-label="Étape précédente">' + ui.icon('arrowL') + '</a><div class="info" aria-live="polite">' + info + '</div>' +
      '<button class="btn primary lg" data-act="next" data-step="' + cur + '"' + (disabled ? ' disabled' : '') + '>' + E(nextLabel || 'Continuer') + ' ' + ui.icon('arrowR') + '</button></div></div>';
  }
  ui.actions.next = function (el) { var cur = el.getAttribute('data-step'); var n = ui.nextStep(cur); if (n.indexOf('#/bilan/') === 0) ui.st.step = n.split('/').pop(); ui.save(true); ui.go(n); };
  function head(kicker, title, lead) { return '<div class="kicker">' + E(kicker) + '</div><h1 class="h1">' + title + '</h1>' + (lead ? '<p class="lead">' + lead + '</p>' : ''); }

  /* ---------- bilan : routeur d'étapes ---------- */
  ui.routes.bilan = {
    title: function (st, p) { return 'Bilan · ' + (ui.STEP_DEFS[p] || ''); },
    render: function (st, step) {
      if (!st.mode) { st.mode = 'learn'; }
      var steps = ui.stepsFor(st.mode);
      if (steps.indexOf(step) < 0) step = steps[0];
      if (st.step !== 'done') { st.step = step; ui.save(); }
      ui._step = step;
      return S[step](st);
    },
    mount: function (root, st, step) { if (M[step]) M[step](root, st); },
    onKey: function (ev) { if (ui._step === 'envies') deckKey(ev); }
  };
  var S = {}, M = {};

  /* ---------- 1. contexte ---------- */
  S.contexte = function (st) {
    var c = st.context;
    var cities = Object.keys(C.CITIES).map(function (k) { return k.replace(/\b\w/g, function (m) { return m.toUpperCase(); }).replace(/ /g, '-').replace(/-(En|Sur|Le|La)-/g, function (m) { return m.toLowerCase(); }); });
    return '<div class="flow">' + stepper('contexte') + head('Étape 1', 'Faisons connaissance', 'Quelques repères pour que les recommandations collent à votre vie : votre ville pour les lieux, votre temps et votre budget pour des plans réalistes.') +
      '<div class="grid2" style="margin-top:6px"><label class="field"><span class="lbl">Prénom (facultatif)</span><input class="input" id="f-name" data-bind="context.firstName" value="' + E(c.firstName) + '" autocomplete="given-name" maxlength="40"></label>' +
      '<label class="field"><span class="lbl">Ville</span><input class="input" id="f-city" data-bind="context.city" value="' + E(c.city) + '" list="citylist" autocomplete="address-level2" placeholder="Paris, Lyon, Rennes…"><datalist id="citylist">' + cities.map(function (x) { return '<option value="' + E(x) + '">'; }).join('') + '</datalist></label></div>' +
      '<div class="field"><span class="lbl">Rayon de recherche autour de chez vous</span>' + ui.seg('context.radiusKm', [[2, '2 km'], [5, '5 km'], [10, '10 km'], [20, '20 km']], c.radiusKm, 'Rayon') + '</div>' +
      '<div class="field"><span class="lbl">Temps disponible par semaine pour apprendre ou transmettre</span><div class="rangeline"><input type="range" id="f-hours" min="1" max="20" step="0.5" data-bind="context.hoursPerWeek" value="' + U.num(c.hoursPerWeek, 3) + '" aria-label="Heures par semaine"><output data-out="context.hoursPerWeek">' + String(U.num(c.hoursPerWeek, 3)).replace('.', ',') + '</output><span class="faint">h</span></div></div>' +
      '<div class="field"><span class="lbl">Budget mensuel pour vos loisirs d’apprentissage</span>' + ui.seg('context.budgetPerMonth', [[0, '0 €'], [20, '20 €'], [50, '50 €'], [100, '100 €'], [200, '200 € et +']], c.budgetPerMonth, 'Budget mensuel') + '</div>' +
      '<div class="field"><span class="lbl">Vous préférez</span>' + ui.seg('context.presence', [['local', 'Sur place'], ['online', 'En ligne'], ['both', 'Les deux']], c.presence, 'Présentiel ou en ligne') + '</div>' +
      '<div class="field"><span class="lbl">Ce que vous cherchez (plusieurs choix)</span>' + ui.chips('intents', C.INTENTS, st.intents, 'Intentions') + '</div>' +
      '<div class="field"><span class="lbl">Tranche d’âge (facultatif)</span>' + ui.seg('context.ageBand', [['-25', '− 25'], ['25-34', '25-34'], ['35-44', '35-44'], ['45-59', '45-59'], ['60+', '60 +']], c.ageBand, 'Tranche d’âge') + '</div>' +
      '</div>' + flowbar('contexte', c.city ? E(c.city) + ' · ' + String(U.num(c.hoursPerWeek, 3)).replace('.', ',') + ' h par semaine' : 'Tout est modifiable plus tard', 'Continuer');
  };

  /* ---------- 2. maîtrise ---------- */
  // un appui monte d'un cran (0 → 5), le sixième remet à zéro ; au clavier, les touches 0 à 5 choisissent directement
  ui.setLevel = function (id, nx) {
    nx = U.clamp(nx, 0, C.LEVEL_MAX);
    if (nx === 0) { if (ui.st.skills[id]) ui.st.skills[id].level = 0; }
    else ui.st.skills[id] = Object.assign({ love: 2 }, ui.st.skills[id] || {}, { level: nx });
    ui.save();
    return nx;
  };
  ui.cycleLevel = function (id) {
    var cur = (ui.st.skills[id] && ui.st.skills[id].level) || 0;
    return ui.setLevel(id, (cur + 1) % (C.LEVEL_MAX + 1));
  };
  function chipLabel(s, lv) { return s.name + ' : niveau ' + lv + ', ' + C.LEVELS[lv] + '. Appuyer pour monter d’un niveau, ou taper un chiffre de 0 à 5'; }
  function chipInner(s, lv) { return '<span class="nm">' + E(s.name) + '</span>' + ui.dots(lv, C.LEVEL_MAX, C.LEVELS[lv]) + (lv ? '<span class="lv">' + lv + ' · ' + E(C.LEVELS_SHORT[lv]) + '</span>' : ''); }
  function schip(s, st) {
    var lv = (st.skills[s.id] && st.skills[s.id].level) || 0;
    return '<button type="button" class="schip l' + lv + '" id="sc-' + E(s.id) + '" data-act="cycle" data-id="' + E(s.id) + '" title="' + E(s.desc) + '" aria-label="' + E(chipLabel(s, lv)) + '">' + chipInner(s, lv) + '</button>';
  }
  function paintChip(el, id, nx) {
    var s = C.data.sById[id];
    el.className = 'schip l' + nx;
    el.innerHTML = chipInner(s, nx);
    el.setAttribute('aria-label', chipLabel(s, nx));
    updateMastery();
  }
  ui.actions.cycle = function (el) { var id = el.getAttribute('data-id'); paintChip(el, id, ui.cycleLevel(id)); };
  function knownCount(st) { return Object.keys(st.skills).filter(function (id) { return st.skills[id] && st.skills[id].level > 0; }).length + (st.custom || []).filter(function (c) { return c.level > 0; }).length; }
  function updateMastery() {
    var n = knownCount(ui.st), info = ui.$('.flowbar .info');
    if (info) info.textContent = n + ' compétence' + (n > 1 ? 's' : '') + ' notée' + (n > 1 ? 's' : '') + (n < 3 ? ' · visez au moins 3' : '');
    ui.$$('.unitile').forEach(function (t) {
      var u = t.getAttribute('data-u'), c = C.data.byUniverse[u].filter(function (s) { return ui.st.skills[s.id] && ui.st.skills[s.id].level > 0; }).length;
      var el = t.querySelector('.c'); if (el) el.innerHTML = c ? '<b>' + c + ' notée' + (c > 1 ? 's' : '') + '</b> · ' + C.data.byUniverse[u].length : C.data.byUniverse[u].length + ' compétences';
    });
  }
  S.maitrise = function (st) {
    var open = ui._openUni || null, q = ui._mq || '';
    var n = knownCount(st);
    var html = '<div class="flow">' + stepper('maitrise') + head('Étape 2 · 2 à 3 minutes', 'Ce que vous savez déjà faire',
      'Touchez une compétence pour indiquer votre niveau de 1 à 5. Chaque appui monte d’un cran, le sixième remet à zéro. Notez large : la cuisine du quotidien compte autant qu’un diplôme.') +
      ui.levelLegend() +
      '<p class="help rulehelp">' + ui.icon('info') + ' <span>Un niveau anime l’atelier du niveau juste en dessous : au niveau 3, vous animez les ateliers de niveau 2. Le niveau 1 n’anime pas encore.</span></p>' +
      '<div class="searchbox"><input class="input" id="mq" data-search placeholder="Rechercher une compétence : guitare, couture, échecs…" value="' + E(q) + '" aria-label="Rechercher une compétence" autocomplete="off">' + ui.icon('search') + '<kbd class="kbdhint">/</kbd></div>' +
      '<div id="mres" style="margin-top:12px">' + searchResults(st, q) + '</div>' +
      '<div class="lbl" style="margin:22px 0 10px">Parcourir les 17 univers</div><div class="unigrid">' + C.data.universes.map(function (u) {
        var all = C.data.byUniverse[u.id], c = all.filter(function (s) { return st.skills[s.id] && st.skills[s.id].level > 0; }).length;
        return '<button type="button" class="unitile' + (open === u.id ? ' on' : '') + '" data-act="openUni" data-u="' + u.id + '" aria-expanded="' + (open === u.id) + '"><span class="bar" style="background:' + C.hue(u.id, 55) + '"></span><span class="g" aria-hidden="true">' + E(u.glyph) + '</span><span class="n">' + E(u.short) + '</span><span class="c">' + (c ? '<b>' + c + ' notée' + (c > 1 ? 's' : '') + '</b> · ' + all.length : all.length + ' compétences') + '</span></button>';
      }).join('') + '</div>';
    if (open) html += '<div class="panel dompanel" id="dompanel"><div class="ph"><span class="t">' + E(C.universe(open).name) + '</span><span class="hint">' + E(C.universe(open).desc) + '</span></div><div class="pb">' + uniBody(st, open) + '</div></div>';
    var custom = st.custom || [];
    html += '<details class="panel" style="margin-top:18px"' + (custom.length ? ' open' : '') + '><summary class="ph" style="cursor:pointer;border:0"><span class="t">Ajouter une compétence hors catalogue</span><span class="hint">' + custom.length + ' ajoutée' + (custom.length > 1 ? 's' : '') + '</span></summary><div class="pb">' +
      '<div class="grid2"><input class="input" id="cname" placeholder="Nom, par exemple : sculpture sur glace" maxlength="60" aria-label="Nom de la compétence"><select class="input" id="cuni" aria-label="Univers">' + C.data.universes.map(function (u) { return '<option value="' + u.id + '">' + E(u.name) + '</option>'; }).join('') + '</select></div>' +
      '<div class="row" style="margin-top:10px">' + ui.seg('_tmp', [1, 2, 3, 4, 5].map(function (k) { return [k, k + ' · ' + C.LEVELS_SHORT[k]]; }), ui._cl || 2, 'Niveau', ' data-act="clvl"').replace(/data-act="set" /g, '') + '<button class="btn" data-act="addCustom">' + ui.icon('plus') + ' Ajouter</button></div>' +
      (custom.length ? '<div class="skillchips" style="margin-top:14px">' + custom.map(function (c, i) { return '<span class="schip l' + c.level + '"><span class="nm">' + E(c.name) + '</span>' + ui.dots(c.level, C.LEVEL_MAX, C.LEVELS[c.level]) + '<button class="btn ghost sm" data-act="delCustom" data-i="' + i + '" aria-label="Retirer ' + E(c.name) + '">' + ui.icon('x') + '</button></span>'; }).join('') + '</div>' : '') +
      '</div></details>';
    html += '</div>' + flowbar('maitrise', n + ' compétence' + (n > 1 ? 's' : '') + ' notée' + (n > 1 ? 's' : '') + (n < 3 ? ' · visez au moins 3' : ''), 'Continuer');
    return html;
  };
  function uniBody(st, uid) {
    var doms = C.data.domains.filter(function (d) { return d.universe === uid; });
    return doms.map(function (d) {
      var sk = C.data.byUniverse[uid].filter(function (s) { return s.domain === d.id; });
      if (!sk.length) return '';
      return '<div class="domname lbl">' + E(d.name) + '</div><div class="skillchips">' + sk.map(function (s) { return schip(s, st); }).join('') + '</div>';
    }).join('');
  }
  function searchResults(st, q) {
    if (!q || q.length < 2) {
      var noted = Object.keys(st.skills).filter(function (id) { return C.data.sById[id] && st.skills[id].level > 0; });
      if (!noted.length) {
        // suggestions : les plus demandées de chaque univers
        var pop = C.data.universes.map(function (u) { return U.sortBy(C.data.byUniverse[u.id], function (s) { return s.attrs.demand * 10 + s.attrs.teachable; }, true)[0]; }).filter(Boolean).slice(0, 12);
        return '<div class="lbl" style="margin-bottom:8px">Pour démarrer, les plus courantes</div><div class="skillchips">' + pop.map(function (s) { return schip(s, st); }).join('') + '</div>';
      }
      return '<div class="lbl" style="margin-bottom:8px">Déjà notées</div><div class="skillchips">' + noted.map(function (id) { return schip(C.data.sById[id], st); }).join('') + '</div>';
    }
    var r = C.search(q, 24);
    if (!r.length) return '<p class="empty">Aucune compétence trouvée pour « ' + E(q) + ' ». L’ajouter hors catalogue, en bas de page.</p>';
    return '<div class="lbl" style="margin-bottom:8px">' + r.length + ' résultat' + (r.length > 1 ? 's' : '') + '</div><div class="skillchips">' + r.map(function (s) { return schip(s, st); }).join('') + '</div>';
  }
  M.maitrise = function (root, st) {
    var inp = ui.$('#mq', root);
    inp.addEventListener('input', function () { ui._mq = inp.value; ui.$('#mres').innerHTML = searchResults(ui.st, inp.value); });
    inp.addEventListener('keydown', function (ev) { if (ev.key === 'Enter') { var b = ui.$('#mres .schip'); if (b) { ev.preventDefault(); b.click(); b.focus(); } } });
    // sélection directe au clavier : 0 à 5 sur une compétence qui a le focus
    root.addEventListener('keydown', function (ev) {
      var el = ev.target && ev.target.closest && ev.target.closest('.schip[data-act="cycle"]');
      if (!el || ev.ctrlKey || ev.metaKey || ev.altKey) return;
      var k = /^[0-5]$/.test(ev.key) ? +ev.key : (ev.key === 'Delete' || ev.key === 'Backspace') ? 0 : null;
      if (k == null) return;
      ev.preventDefault(); ev.stopPropagation();
      var id = el.getAttribute('data-id'); paintChip(el, id, ui.setLevel(id, k));
    });
  };
  ui.actions.openUni = function (el) {
    var u = el.getAttribute('data-u'); ui._openUni = ui._openUni === u ? null : u; ui.render();
    var p = ui.$('#dompanel'); if (p) p.scrollIntoView({ block: 'nearest', behavior: W.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  };
  ui.actions.clvl = function (el) { ui._cl = +el.getAttribute('data-val'); ui.$$('[data-act="clvl"]').forEach(function (b) { var on = b === el; b.classList.toggle('on', on); b.setAttribute('aria-checked', on); }); };
  ui.actions.addCustom = function () {
    var n = ui.$('#cname').value.trim(); if (!n) { ui.toast('Indiquer un nom', 'wait'); ui.$('#cname').focus(); return; }
    var found = C.search(n, 1)[0];
    if (found && U.norm(found.name) === U.norm(n)) { ui.st.skills[found.id] = Object.assign({ love: 2 }, ui.st.skills[found.id] || {}, { level: ui._cl || 2 }); ui.toast('Trouvée dans le catalogue : ' + found.name); }
    else { ui.st.custom.push({ id: 'x-' + U.norm(n).replace(/ /g, '-'), name: n, universe: ui.$('#cuni').value, level: ui._cl || 2 }); ui.toast('Ajoutée'); }
    ui.save(); ui.render();
  };
  ui.actions.delCustom = function (el) { ui.st.custom.splice(+el.getAttribute('data-i'), 1); ui.save(); ui.render(); };

  /* ---------- 3. envies : paquet de cartes ---------- */
  function yesCount(st) { return C.yesDesires(st).length; }
  S.envies = function (st) {
    var cards = C.nextCards(st, 2);
    ui._deck = cards;
    var c = cards[0], ny = yesCount(st), seen = (st.deck.shown || []).length;
    var html = '<div class="flow wide">' + stepper('envies') + head('Étape 3 · le cœur du bilan', 'Ce qui vous tente',
      'Le paquet s’adapte à chaque réponse : un « ça me tente » rapproche les compétences voisines, un « pas pour moi » écarte leurs cousines. Retenez 3 à 5 envies.') +
      '<div class="deckwrap" style="margin-top:18px"><div><div class="deck" id="deck">';
    if (!c) html += '<div class="panel pad"><p class="lead">Vous avez parcouru tout le catalogue. Bravo pour la persévérance.</p></div>';
    else {
      if (cards[1]) html += '<div class="card behind" aria-hidden="true"></div>';
      html += cardHTML(c);
    }
    html += '</div>' + (c ? '<div class="deckbtns"><button class="btn no" data-act="verdict" data-v="no"><span>Pas pour moi</span><kbd class="kbdhint">←</kbd></button><button class="btn" data-act="verdict" data-v="done"><span>Déjà fait</span><kbd class="kbdhint">↓</kbd></button><button class="btn yes" data-act="verdict" data-v="yes"><span>Ça me tente</span><kbd class="kbdhint">→</kbd></button></div>' : '') +
      '<div class="spread" style="margin-top:10px"><span class="faint">' + seen + ' carte' + (seen > 1 ? 's' : '') + ' vue' + (seen > 1 ? 's' : '') + '</span><button class="btn ghost sm" data-act="undo"' + (seen ? '' : ' disabled') + '>' + ui.icon('undo') + ' Annuler la dernière</button></div>' +
      '<div class="searchbox" style="margin-top:16px"><input class="input" id="dq" data-search placeholder="Vous savez déjà ? Rechercher une envie" aria-label="Rechercher une envie" autocomplete="off">' + ui.icon('search') + '<kbd class="kbdhint">/</kbd></div><div id="dres" style="margin-top:10px"></div>' +
      '</div><aside class="stack">' + sideDesires(st) + sideLearned(st) + '</aside></div></div>' +
      flowbar('envies', ny ? ny + ' envie' + (ny > 1 ? 's' : '') + ' retenue' + (ny > 1 ? 's' : '') + (ny > 5 ? ' · gardez les 5 premières' : '') : 'Retenez au moins une envie', ny ? 'Affiner mes envies' : 'Continuer', !ny);
    return html;
  };
  function cardHTML(c) {
    var s = c.s, a = s.attrs, mat = C.COST_RANGE[a.cost];
    return '<article class="card" id="card" data-id="' + E(s.id) + '" aria-live="polite" aria-label="Carte : ' + E(s.name) + '">' +
      '<div class="uni">' + ui.uniTag(s.universe) + '<span class="faint" style="font-size:11px">' + E((C.data.dById[s.domain] || {}).name || '') + '</span></div>' +
      '<h2 class="name">' + E(s.name) + '</h2><p class="desc">' + E(s.desc) + '</p>' +
      '<div class="reasons">' + c.reasons.slice(0, 3).map(function (r, i) { return ui.pill(r.t, i === 0 ? '' : r.k === 'tendance' ? 'wait' : r.k === 'nouveau' ? 'sent' : 'idle'); }).join('') + '</div>' +
      '<div class="facts"><div><span class="lbl">Bases acquises</span><b>≈ ' + a.hoursToBasics + ' h</b></div><div><span class="lbl">Budget de départ</span><b>' + (mat[1] <= 20 ? '≈ 0 €' : mat[0] >= 300 ? '300 € et +' : '< ' + mat[1] + ' €') + '</b></div>' +
      '<div><span class="lbl">1re heure</span><b>' + (a.oneHourResult ? 'Résultat visible' : 'Découverte') + '</b></div><div><span class="lbl">En ligne</span><b>' + ['Impossible', 'Difficile', 'Possible', 'Idéal'][Math.round(a.online)] + '</b></div></div>' +
      '<div class="ladder">' + [2, 3].map(function (k) { return '<div><span>N' + k + '</span>' + E(C.milestone(s, k)) + '</div>'; }).join('') + '</div>' +
      (c.reasons[0] && c.reasons[0].why ? '<p class="faint" style="margin-top:10px;font-size:11px">Proximité : ' + E(c.reasons[0].why) + '</p>' : '') +
      '</article>';
  }
  function sideDesires(st) {
    var ys = C.yesDesires(st);
    return '<div class="panel"><div class="ph"><span class="t">Vos envies</span><span class="count">' + ys.length + '</span></div><div class="pb tight">' +
      (ys.length ? ys.map(function (id, i) { var s = C.data.sById[id]; return '<div class="resitem" style="grid-template-columns:1fr auto"><div><div class="nm" style="font-size:15px">' + (i + 1) + '. ' + E(s.name) + '</div><div class="m">' + ui.uniTag(s.universe) + '</div></div><button class="btn ghost sm" data-act="dropDesire" data-id="' + E(id) + '" aria-label="Retirer ' + E(s.name) + '">' + ui.icon('x') + '</button></div>'; }).join('') : '<p class="empty">Les cartes retenues s’affichent ici.</p>') + '</div></div>';
  }
  function sideLearned(st) {
    var tw = st.deck.tagW || {}, uw = st.deck.uniW || {};
    var items = Object.keys(uw).map(function (u) { return { l: C.universe(u).short, v: uw[u], k: 'u' }; }).concat(Object.keys(tw).map(function (t) { return { l: '#' + t, v: tw[t], k: 't' }; }))
      .filter(function (x) { return Math.abs(x.v) > 0.02; }).sort(function (a, b) { return Math.abs(b.v) - Math.abs(a.v); }).slice(0, 8);
    return '<div class="panel"><div class="ph"><span class="t">Ce que le paquet a appris</span><span class="hint">mis à jour à chaque carte</span></div><div class="pb">' +
      (items.length ? '<div class="learnlist">' + items.map(function (x) { var w = Math.min(50, Math.abs(x.v) / 0.3 * 50); return '<div class="learnrow"><span>' + E(x.l) + '</span><span class="wbar" role="img" aria-label="' + (x.v > 0 ? 'attirance' : 'rejet') + '"><b class="' + (x.v > 0 ? 'pos' : 'neg') + '" style="width:' + w + '%"></b></span></div>'; }).join('') + '</div><p class="faint" style="margin-top:10px;font-size:11px">Vert : renforcé par vos « ça me tente ». Rose : pénalisé par vos « pas pour moi ».</p>' :
        '<p class="empty">Répondez à quelques cartes : les univers et thèmes qui vous attirent apparaîtront ici.</p>') + '</div></div>';
  }
  function verdict(v) {
    var c = ui._deck && ui._deck[0]; if (!c || ui._busy) return;
    ui._busy = true;
    var card = ui.$('#card');
    var reduce = W.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (card && !reduce) card.classList.add('out-' + v);
    setTimeout(function () {
      C.applyVerdict(ui.st, c.s.id, v); ui.save(); ui._busy = false;
      ui.render({ keepFocus: false });
      var nb = ui.$('.deckbtns .btn.yes'); if (nb && document.activeElement === document.body) nb.focus({ preventScroll: true });
      ui.toast(v === 'yes' ? 'Retenue : ' + c.s.name : v === 'no' ? 'Écartée' : 'Notée comme déjà pratiquée', v === 'no' ? 'wait' : 'int');
    }, reduce ? 0 : 200);
  }
  ui.actions.verdict = function (el) { verdict(el.getAttribute('data-v')); };
  ui.actions.undo = function () { var id = C.undoVerdict(ui.st); ui.save(); ui.render(); if (id) ui.toast('Carte remise dans le paquet'); };
  ui.actions.dropDesire = function (el) { var id = el.getAttribute('data-id'); delete ui.st.desires[id]; renumber(); ui.save(); ui.render(); };
  ui.actions.addDesire = function (el) { var id = el.getAttribute('data-id'); C.applyVerdict(ui.st, id, 'yes'); ui.save(); ui.render(); ui.toast('Ajoutée à vos envies'); };
  function renumber() { C.yesDesires(ui.st).forEach(function (id, i) { ui.st.desires[id].priority = i + 1; }); }
  function deckKey(ev) {
    if (ev.key === 'ArrowRight') { ev.preventDefault(); verdict('yes'); }
    else if (ev.key === 'ArrowLeft') { ev.preventDefault(); verdict('no'); }
    else if (ev.key === 'ArrowDown') { ev.preventDefault(); verdict('done'); }
    else if (ev.key === 'Backspace' || ev.key === 'z') { ev.preventDefault(); ui.actions.undo(); }
  }
  M.envies = function (root) {
    var card = ui.$('#card', root);
    if (card) {
      // balayage tactile
      var x0 = null, y0 = null, dx = 0;
      card.addEventListener('pointerdown', function (e) { if (e.pointerType === 'mouse') return; x0 = e.clientX; y0 = e.clientY; card.setPointerCapture(e.pointerId); card.style.transition = 'none'; });
      card.addEventListener('pointermove', function (e) { if (x0 == null) return; dx = e.clientX - x0; var dy = e.clientY - y0; if (Math.abs(dx) > Math.abs(dy)) card.style.transform = 'translateX(' + dx + 'px) rotate(' + dx / 30 + 'deg)'; });
      var end = function () { if (x0 == null) return; card.style.transition = ''; card.style.transform = ''; var d = dx; x0 = null; dx = 0; if (d > 90) verdict('yes'); else if (d < -90) verdict('no'); };
      card.addEventListener('pointerup', end); card.addEventListener('pointercancel', end);
    }
    var dq = ui.$('#dq', root);
    if (dq) dq.addEventListener('input', function () {
      var r = dq.value.length >= 2 ? C.search(dq.value, 10) : [];
      ui.$('#dres').innerHTML = r.length ? '<div class="skillchips">' + r.map(function (s) { var on = ui.st.desires[s.id] && ui.st.desires[s.id].verdict === 'yes'; return '<button class="chip' + (on ? ' on' : '') + '" data-act="addDesire" data-id="' + E(s.id) + '"' + (on ? ' disabled' : '') + '><i></i>' + E(s.name) + '</button>'; }).join('') + '</div>' : (dq.value.length >= 2 ? '<p class="empty">Aucun résultat.</p>' : '');
    });
  };

  /* ---------- 4. affinage ---------- */
  S.affinage = function (st) {
    var ys = C.yesDesires(st);
    var html = '<div class="flow">' + stepper('affinage') + head('Étape 4', 'Affiner vos envies', 'Pour chaque envie, dites pourquoi, jusqu’où et comment. Le plan d’apprentissage en dépend : heures, budget, lieux et premiers pas.');
    if (!ys.length) html += '<div class="note wait" style="margin-top:18px"><span class="lbl">Aucune envie</span><span class="sp">Revenir au paquet de cartes pour en retenir au moins une.</span> <a href="#/bilan/envies">Ouvrir le paquet</a></div>';
    if (ys.length > 5) html += '<div class="note" style="margin-top:18px"><span class="lbl">Conseil</span><span class="sp">Vous avez retenu ' + ys.length + ' envies. Le plan se concentre sur les 5 premières : remontez celles qui comptent le plus.</span></div>';
    ys.forEach(function (id, i) {
      var s = C.data.sById[id], d = st.desires[id], p = 'desires.' + id;
      var cur = (st.skills[id] && st.skills[id].level) || 0;
      var t = U.clamp(d.target || 2, 2, C.LEVEL_MAX); if (t <= cur) t = Math.min(C.LEVEL_MAX, cur + 1);
      var opts = [2, 3, 4, 5].filter(function (k) { return k > cur; }).map(function (k) { return [k, k + ' · ' + C.LEVELS_SHORT[k]]; });
      html += '<section class="panel' + (i >= 5 ? ' dim' : '') + '" style="margin-top:16px' + (i >= 5 ? ';opacity:.6' : '') + '"><div class="ph"><div class="row"><span class="prio">' + (i + 1) + '</span><span class="h3">' + E(s.name) + '</span>' + ui.uniTag(s.universe) + '</div>' +
        '<div class="row"><button class="btn ghost sm" data-act="prioUp" data-id="' + E(id) + '" aria-label="Monter ' + E(s.name) + '"' + (i === 0 ? ' disabled' : '') + '>' + ui.icon('up') + '</button><button class="btn ghost sm" data-act="prioDown" data-id="' + E(id) + '" aria-label="Descendre ' + E(s.name) + '"' + (i === ys.length - 1 ? ' disabled' : '') + '>' + ui.icon('down') + '</button><button class="btn ghost sm" data-act="dropDesire" data-id="' + E(id) + '" aria-label="Retirer ' + E(s.name) + '">' + ui.icon('x') + '</button></div></div><div class="pb">' +
        '<div class="lbl">Pourquoi</div><div style="margin-top:8px">' + ui.chips(p + '.motive', C.MOTIVES, d.motive, 'Motivation') + '</div>' +
        '<div class="lbl" style="margin-top:18px">Niveau visé' + (cur ? ' (vous êtes au niveau ' + cur + ', ' + E(C.LEVELS[cur].toLowerCase()) + ')' : '') + '</div><div style="margin-top:8px">' + (opts.length ? ui.seg(p + '.target', opts, t, 'Niveau visé') : '<p class="sp">Vous êtes déjà référent : rien à viser au-delà.</p>') + '</div>' +
        '<p class="sp" style="margin-top:8px">Objectif concret : <span style="color:var(--fg)">' + E(C.milestone(s, t)) + '</span></p>' +
        ui.palierPath(s, cur, t) +
        '<div class="lbl" style="margin-top:18px">Horizon</div><div style="margin-top:8px">' + ui.seg(p + '.horizon', [['1m', '1 mois'], ['3m', '3 mois'], ['12m', '1 an']], d.horizon || '3m', 'Horizon') + '</div>' +
        '<div class="lbl" style="margin-top:18px">Format préféré</div><div style="margin-top:8px">' + ui.chips(p + '.formats', C.LEARN_FORMATS, d.formats, 'Formats') + '</div>' +
        '</div></section>';
    });
    html += '</div>' + flowbar('affinage', ys.length ? Math.min(5, ys.length) + ' envie' + (ys.length > 1 ? 's' : '') + ' au plan' : '', ui.stepsFor(st.mode).indexOf('style') >= 0 ? 'Continuer' : 'Voir mon bilan', !ys.length);
    return html;
  };
  function movePrio(id, dir) {
    var ys = C.yesDesires(ui.st), i = ys.indexOf(id), j = i + dir;
    if (j < 0 || j >= ys.length) return;
    ys.splice(i, 1); ys.splice(j, 0, id);
    ys.forEach(function (k, n) { ui.st.desires[k].priority = n + 1; });
    ui.save(); ui.render();
  }
  ui.actions.prioUp = function (el) { movePrio(el.getAttribute('data-id'), -1); };
  ui.actions.prioDown = function (el) { movePrio(el.getAttribute('data-id'), 1); };

  /* ---------- 5. style ---------- */
  S.style = function (st) {
    var a = st.style.answers || {};
    var res = C.computeArchetype(a);
    var html = '<div class="flow">' + stepper('style') + head('Étape 5 · 1 minute', 'Votre façon d’apprendre', 'Huit questions sur vos préférences, pas sur votre personnalité. Elles orientent les formats conseillés : cours, groupe, stage, en ligne.');
    C.STYLE_QUESTIONS.forEach(function (q, qi) {
      html += '<div class="qcard" role="radiogroup" aria-labelledby="q-' + q.id + '"><div class="q" id="q-' + q.id + '"><span class="faint" style="font:12px var(--f-mono)">' + (qi + 1) + '/8 · </span>' + E(q.q) + '</div><div class="opts">' +
        q.opts.map(function (o, oi) { var on = a[q.id] === oi; return '<button type="button" role="radio" aria-checked="' + on + '" class="opt' + (on ? ' on' : '') + '" data-act="answer" data-q="' + q.id + '" data-o="' + oi + '">' + E(o[0]) + '</button>'; }).join('') + '</div></div>';
    });
    if (res.answered >= 4) html += '<div class="note int" style="margin-top:26px"><span class="lbl">Aperçu · ' + res.answered + '/8 réponses</span><div class="h3">' + E(res.archetype.name) + '</div><p class="sp" style="margin-top:4px">' + E(res.archetype.pref) + '</p></div>';
    html += '</div>' + flowbar('style', res.answered + ' réponse' + (res.answered > 1 ? 's' : '') + ' sur 8', ui.stepsFor(st.mode).indexOf('forces') >= 0 ? 'Passer à mes forces' : 'Voir mon bilan');
    return html;
  };
  ui.actions.answer = function (el) {
    var q = el.getAttribute('data-q'), o = +el.getAttribute('data-o');
    ui.st.style.answers[q] = o;
    var r = C.computeArchetype(ui.st.style.answers); ui.st.style.archetype = r.answered ? r.archetype.id : null;
    ui.save(); var y = W.scrollY; ui.render(); W.scrollTo(0, y);
    var next = ui.$('[data-q="q' + (+q.slice(1) + 1) + '"]');
    if (next && !W.matchMedia('(prefers-reduced-motion: reduce)').matches && W.innerWidth < 900) next.closest('.qcard').scrollIntoView({ block: 'center', behavior: 'smooth' });
  };

  /* ---------- 6. forces (offreur) ---------- */
  S.forces = function (st) {
    var o = st.offer;
    var cands = Object.keys(st.skills).filter(function (id) { return C.data.sById[id] && st.skills[id].level >= 2; })
      .sort(function (a, b) { return st.skills[b].level - st.skills[a].level; });
    if (!o.strong || !o.strong.length) { o.strong = cands.filter(function (id) { return st.skills[id].level >= 3; }).slice(0, 4); ui.save(); }
    var strong = o.strong.filter(function (id) { return C.data.sById[id]; });
    var html = '<div class="flow">' + stepper('forces') + head('Transmettre · 1', 'Vos compétences fortes', 'Choisissez 3 à 6 compétences que vous pourriez transmettre. Votre niveau fixe le palier que vous animez (niveau n : ateliers de niveau n-1) ; les années de pratique, les preuves et votre expérience de transmission ajustent le prix conseillé.');
    html += '<div class="lbl" style="margin-top:20px">Choisir parmi vos compétences notées</div><div class="chips" style="margin-top:8px">' + (cands.length ? cands.map(function (id) { var on = strong.indexOf(id) >= 0; return '<button class="chip' + (on ? ' on' : '') + '" aria-pressed="' + on + '" data-act="toggleStrong" data-id="' + E(id) + '"><i></i>' + E(C.data.sById[id].name) + ' · ' + st.skills[id].level + '/5</button>'; }).join('') : '<p class="empty">Aucune compétence au niveau 2 ou plus : c’est le niveau qui permet d’animer la découverte. <a href="#/bilan/maitrise">Noter mes compétences</a></p>') + '</div>';
    html += '<div class="searchbox" style="margin-top:14px"><input class="input" id="fq" data-search placeholder="Ajouter une autre compétence" aria-label="Ajouter une compétence forte" autocomplete="off">' + ui.icon('search') + '<kbd class="kbdhint">/</kbd></div><div id="fres" style="margin-top:8px"></div>';
    strong.forEach(function (id) {
      var s = C.data.sById[id], v = st.skills[id] || {}, p = 'skills.' + id;
      html += '<section class="panel" style="margin-top:16px"><div class="ph"><div class="row"><span class="h3">' + E(s.name) + '</span>' + ui.uniTag(s.universe) + (s.regulated ? ui.pill('Activité encadrée', 'wait') : '') + '</div><button class="btn ghost sm" data-act="toggleStrong" data-id="' + E(id) + '" aria-label="Retirer ' + E(s.name) + '">' + ui.icon('x') + '</button></div><div class="pb">' +
        '<div class="grid2"><div><div class="lbl">Niveau</div><div style="margin-top:8px">' + ui.seg(p + '.level', [2, 3, 4, 5].map(function (k) { return [k, k + ' · ' + C.LEVELS_SHORT[k]]; }), v.level, 'Niveau') + '</div><p class="sp animtext" style="margin-top:8px">' + E(C.animateText(v.level).replace(/^v/, 'V')) + '.</p></div>' +
        '<label><span class="lbl">Années de pratique</span><input class="input" type="number" min="0" max="60" id="y-' + E(id) + '" data-bind="' + p + '.years" value="' + U.num(v.years, 0) + '" style="margin-top:8px"></label></div>' +
        '<div class="lbl" style="margin-top:16px">Preuves</div><div style="margin-top:8px">' + ui.chips(p + '.proof', C.PROOFS, v.proof, 'Preuves') + '</div>' +
        '<div class="grid2" style="margin-top:14px"><label class="toggle"><input type="checkbox" data-bind="' + p + '.teach"' + (v.teach ? ' checked' : '') + '> J’ai déjà transmis cette compétence</label>' +
        '<div><div class="lbl">Plaisir à la pratiquer</div><div style="margin-top:8px">' + ui.seg(p + '.love', [[1, 'Un peu'], [2, 'Beaucoup'], [3, 'Passion']], v.love || 2, 'Plaisir', '').replace('class="seg"', 'class="seg sm"') + '</div></div></div>' +
        '</div></section>';
    });
    var as = o.assets || {};
    html += '<section class="panel" style="margin-top:22px"><div class="ph"><span class="t">Vos atouts</span></div><div class="pb">' +
      '<div class="grid2"><label class="toggle"><input type="checkbox" data-bind="offer.assets.material"' + (as.material ? ' checked' : '') + '> J’ai le matériel pour un petit groupe</label><label class="toggle"><input type="checkbox" data-bind="offer.assets.venue"' + (as.venue ? ' checked' : '') + '> J’ai accès à un lieu</label></div>' +
      '<div class="lbl" style="margin-top:14px">Audience existante (réseaux, liste de contacts)</div><div style="margin-top:8px">' + ui.seg('offer.assets.audience', [[0, 'Aucune'], [1, '< 500'], [2, '500 à 5 000'], [3, '> 5 000']], as.audience || 0, 'Audience') + '</div>' +
      '<div class="lbl" style="margin-top:14px">Expérience de transmission</div><div style="margin-top:8px">' + ui.seg('offer.assets.teachExp', [[0, 'Jamais'], [1, 'Un peu'], [2, 'Régulière'], [3, 'Professionnelle']], as.teachExp == null ? 1 : as.teachExp, 'Expérience') + '</div></div></section>';
    html += '</div>' + flowbar('forces', strong.length + ' compétence' + (strong.length > 1 ? 's' : '') + ' forte' + (strong.length > 1 ? 's' : '') + (strong.length < 1 ? ' · en choisir au moins une' : ''), 'Continuer', !strong.length);
    return html;
  };
  M.forces = function (root) {
    var fq = ui.$('#fq', root);
    if (fq) fq.addEventListener('input', function () {
      var r = fq.value.length >= 2 ? C.search(fq.value, 8) : [];
      ui.$('#fres').innerHTML = r.length ? '<div class="chips">' + r.map(function (s) { return '<button class="chip" data-act="toggleStrong" data-id="' + E(s.id) + '" data-add="1"><i></i>' + E(s.name) + '</button>'; }).join('') + '</div>' : '';
    });
  };
  ui.actions.toggleStrong = function (el) {
    var id = el.getAttribute('data-id'), arr = ui.st.offer.strong = U.arr(ui.st.offer.strong), i = arr.indexOf(id);
    if (i >= 0 && !el.getAttribute('data-add')) arr.splice(i, 1);
    else if (i < 0) { if (arr.length >= 6) { ui.toast('6 compétences au plus', 'wait'); return; } arr.push(id); if (!ui.st.skills[id] || ui.st.skills[id].level < 2) ui.st.skills[id] = Object.assign({ love: 2 }, ui.st.skills[id] || {}, { level: 3 }); }
    ui.save(); ui.render();
  };

  /* ---------- 7. offre : objectifs ---------- */
  S.offre = function (st) {
    var o = st.offer;
    var html = '<div class="flow">' + stepper('offre') + head('Transmettre · 2', 'Que voulez-vous proposer ?', 'Vos objectifs et vos contraintes orientent les formats, les canaux et le statut recommandés.') +
      '<div class="field"><span class="lbl">Objectifs</span>' + ui.chips('offer.goals', Object.keys(C.GOALS).map(function (k) { return [k, C.GOALS[k]]; }), o.goals, 'Objectifs') + '</div>' +
      '<div class="field"><span class="lbl">Formats envisagés</span>' + ui.chips('offer.formats', C.FORMAT_IDS.map(function (k) { return [k, C.FORMATS[k]]; }), o.formats, 'Formats') + '<p class="help">Sans choix, Cordes retient les formats les plus adaptés à chaque compétence.</p></div>' +
      '<div class="field"><span class="lbl">Publics</span>' + ui.chips('offer.audiences', Object.keys(C.AUDIENCES).map(function (k) { return [k, C.AUDIENCES[k]]; }), o.audiences, 'Publics') + '</div>' +
      '<div class="field"><span class="lbl">Heures par semaine consacrées à transmettre (préparation comprise)</span><div class="rangeline"><input type="range" min="1" max="35" step="1" id="o-hours" data-bind="offer.hoursPerWeek" value="' + U.num(o.hoursPerWeek, 4) + '" aria-label="Heures par semaine"><output data-out="offer.hoursPerWeek">' + U.num(o.hoursPerWeek, 4) + '</output><span class="faint">h</span></div></div>' +
      '<div class="field"><span class="lbl">Revenu mensuel visé</span>' + ui.seg('offer.incomeTarget', [[0, 'Aucun'], [200, '200 €'], [500, '500 €'], [1000, '1 000 €'], [2000, '2 000 €'], [3000, '3 000 €']], o.incomeTarget, 'Revenu visé') +
      '<label class="row" style="margin-top:10px"><span class="faint">Autre montant</span><input class="input" type="number" min="0" step="50" id="o-inc" data-bind="offer.incomeTarget" value="' + U.num(o.incomeTarget, 0) + '" style="max-width:140px" aria-label="Revenu mensuel visé en euros"><span class="faint">€ par mois</span></label></div>' +
      '<div class="field"><span class="lbl">Où</span>' + ui.seg('offer.presence', [['local', 'Près de chez moi'], ['online', 'En ligne'], ['both', 'Les deux']], o.presence || 'both', 'Présence') + '</div>' +
      '</div>' + flowbar('offre', (o.goals || []).length ? (o.goals || []).map(function (g) { return C.GOALS[g]; }).join(' · ') : 'Choisir au moins un objectif', 'Continuer', !(o.goals || []).length);
    return html;
  };

  /* ---------- 8. profil entrepreneurial ---------- */
  S.profil = function (st) {
    var e = st.offer.entrepreneur || {};
    var r = C.computeEntrepreneur(e);
    var html = '<div class="flow">' + stepper('profil') + head('Transmettre · 3 · 1 minute', 'Votre profil d’indépendant', 'Six curseurs pour adapter les canaux et le statut à ce qui vous convient vraiment. Il n’y a pas de bonne réponse.');
    C.ENTRE_QUESTIONS.forEach(function (q, i) {
      html += '<div class="qcard"><div class="q"><span class="faint" style="font:12px var(--f-mono)">' + (i + 1) + '/6 · </span>' + E(q.q) + '</div>' + ui.seg('offer.entrepreneur.' + q.id, q.opts.map(function (o, k) { return [k, o]; }), e[q.id], q.q).replace('class="seg"', 'class="seg full"') + '</div>';
    });
    if (r.answered >= 3) html += '<div class="note int" style="margin-top:26px"><span class="lbl">Aperçu · ' + r.answered + '/6</span><div class="h3">' + E(r.profile.name) + '</div><p class="sp" style="margin-top:4px">' + E(r.profile.pref) + '</p></div>';
    html += '</div>' + flowbar('profil', r.answered + ' réponse' + (r.answered > 1 ? 's' : '') + ' sur 6', st.mode === 'both' ? 'Voir mon bilan' : 'Voir mon plan');
    return html;
  };
})(window);
