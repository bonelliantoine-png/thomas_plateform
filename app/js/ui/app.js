/* Routeur par hash, état global, liaison des champs, actions déléguées, raccourcis clavier. */
(function (W) {
  'use strict';
  var C = W.Cordes, U = C.util, ui = C.ui, E = ui.e;
  ui.routes = {}; ui.actions = {};
  ui.st = null;

  /* ---------- étapes du bilan ---------- */
  ui.STEP_DEFS = {
    contexte: 'Vous', maitrise: 'Ce que je sais', envies: 'Mes envies', affinage: 'Affiner', style: 'Mon style',
    forces: 'Mes forces', offre: 'Mon offre', profil: 'Profil pro'
  };
  ui.stepsFor = function (mode) {
    if (mode === 'offer') return ['contexte', 'maitrise', 'forces', 'offre', 'profil'];
    if (mode === 'both') return ['contexte', 'maitrise', 'envies', 'affinage', 'style', 'forces', 'offre', 'profil'];
    return ['contexte', 'maitrise', 'envies', 'affinage', 'style'];
  };
  ui.resultRoute = function (st) { return (st || ui.st).mode === 'offer' ? '#/offre' : '#/resultats'; };
  ui.nextStep = function (cur) {
    var steps = ui.stepsFor(ui.st.mode), i = steps.indexOf(cur);
    if (i < 0 || i === steps.length - 1) { ui.st.step = 'done'; ui.save(); return ui.resultRoute(); }
    return '#/bilan/' + steps[i + 1];
  };
  ui.prevStep = function (cur) {
    var steps = ui.stepsFor(ui.st.mode), i = steps.indexOf(cur);
    return i <= 0 ? '#/accueil' : '#/bilan/' + steps[i - 1];
  };

  /* ---------- état ---------- */
  var saveT = null;
  ui.save = function (now) {
    clearTimeout(saveT); saveT = null;
    var go = function () { saveT = null; var ok = C.saveState(ui.st); ui.savedAt = new Date(); ui.updateSaveBadge(ok); };
    if (now) go(); else saveT = setTimeout(go, 250);
  };
  // écrit tout de suite un enregistrement différé encore en attente (onglet fermé ou masqué)
  ui.flushSave = function () { if (saveT) ui.save(true); };
  ui.updateSaveBadge = function (ok) {
    var b = ui.$('#savebadge'); if (!b) return;
    if (!ui.st || !ui.st.mode) { b.innerHTML = '<i class="idle"></i>Aucun bilan'; return; }
    var d = ui.savedAt || new Date(ui.st.updatedAt || Date.now());
    b.innerHTML = '<i class="' + (ok === false ? 'no' : 'int') + '"></i>' + (ok === false ? 'Stockage plein' : 'Enregistré · ' + ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2));
  };
  ui.getPath = function (path, obj) {
    var o = obj || ui.st, parts = path.split('.');
    for (var i = 0; i < parts.length; i++) { if (o == null) return undefined; o = o[parts[i]]; }
    return o;
  };
  ui.setPath = function (path, val, obj) {
    var o = obj || ui.st, parts = path.split('.');
    for (var i = 0; i < parts.length - 1; i++) { if (o[parts[i]] == null || typeof o[parts[i]] !== 'object') o[parts[i]] = {}; o = o[parts[i]]; }
    o[parts[parts.length - 1]] = val;
  };
  function parseVal(v) { if (v === 'true') return true; if (v === 'false') return false; if (v !== '' && /^-?\d+(\.\d+)?$/.test(v)) return +v; return v; }

  /* ---------- rendu ---------- */
  ui.parseHash = function () {
    var h = W.location.hash || '';
    if (/^#b=/.test(h)) return { path: 'partage', param: h.slice(3) };
    if (/^#i=/.test(h)) return { path: 'recu', param: h.slice(3) };
    if (/^#t=/.test(h)) return { path: 'corde', param: h.slice(3) };
    h = h.replace(/^#\/?/, '');
    var parts = h.split('/').filter(Boolean);
    if (!parts.length) return { path: 'accueil' };
    if (parts[0] === 'outils' && parts[1]) return { path: 'outils/' + parts[1], param: parts[2] };
    return { path: parts[0], param: parts[1] };
  };
  ui.go = function (hash) { if (W.location.hash === hash) ui.render(); else W.location.hash = hash; };
  ui.render = function (opts) {
    opts = opts || {};
    // un champ qui perd le focus pendant le remplacement du contenu peut redemander un rendu : on le diffère
    if (ui._rendering) { setTimeout(function () { ui.render(opts); }, 0); return; }
    ui._rendering = true;
    try { renderNow(opts); } finally { ui._rendering = false; }
  };
  function renderNow(opts) {
    var r = ui.parseHash();
    var scr = ui.routes[r.path] || ui.routes.accueil;
    ui.current = { route: r, screen: scr };
    var view = ui.$('#view');
    var act = document.activeElement, actId = act && act.id, sel = null;
    try { if (act && act.selectionStart != null) sel = [act.selectionStart, act.selectionEnd]; } catch (e) { sel = null; }
    var html;
    try { html = scr.render(ui.st, r.param); }
    catch (err) { console.error(err); html = '<section class="wrap"><div class="panel pad"><h1 class="h1">Un problème est survenu</h1><p class="lead">Cet écran n’a pas pu s’afficher (' + E(err.message) + '). Vos données sont conservées.</p><a class="btn primary" href="#/accueil">Revenir à l’accueil</a></div></section>'; }
    view.innerHTML = html;
    document.title = (scr.title ? (typeof scr.title === 'function' ? scr.title(ui.st, r.param) : scr.title) + ' · ' : '') + 'Cordes';
    ui.renderCrumb(r);
    if (scr.mount) { try { scr.mount(view, ui.st, r.param); } catch (err2) { console.error(err2); } }
    if (opts.keepFocus !== false && actId) {
      var el = document.getElementById(actId);
      if (el) { el.focus({ preventScroll: true }); if (sel && el.setSelectionRange) try { el.setSelectionRange(sel[0], sel[1]); } catch (e) { /* rien */ } }
    }
    ui.$$('.topnav a').forEach(function (a) { var on = a.getAttribute('href').replace('#/', '') === r.path.split('/')[0] || a.getAttribute('href') === '#/' + r.path; a.classList.toggle('on', on); if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
  }
  ui.renderCrumb = function (r) {
    var labels = { accueil: 'accueil', bilan: 'bilan', resultats: 'résultats', offre: 'plan de valorisation', comment: 'comment ça marche', demo: 'démo', comparer: 'comparer', attente: 'liste d’attente', copilote: 'copilote', partage: 'bilan partagé', 'outils/autour': 'outils / autour de moi', 'outils/recherches': 'outils / recherches', groupe: 'comparer en groupe', lieu: 'lieu partenaire', donnees: 'mes données', progres: 'mes progrès', admin: 'mesure et questionnaire', idees: 'idées à vivre', test: 'le test', recu: 'idées reçues', corde: 'corde cachée reçue' };
    var t = labels[r.path] || r.path;
    if (r.path === 'bilan' && r.param) t += ' / ' + (ui.STEP_DEFS[r.param] || r.param).toLowerCase();
    var c = ui.$('#crumb'); if (c) c.textContent = t;
  };

  /* ---------- événements délégués ---------- */
  function onClick(ev) {
    var el = ev.target.closest('[data-act]');
    if (!el) return;
    var act = el.getAttribute('data-act');
    if (el.tagName === 'A' && act !== 'go') ev.preventDefault();
    var fn = ui.actions[act];
    if (fn) fn(el, ev);
  }
  function onInput(ev) {
    var el = ev.target;
    if (!el.matches || !el.matches('input[data-bind], select[data-bind], textarea[data-bind]')) return;
    var path = el.getAttribute('data-bind');
    var v = el.type === 'checkbox' ? el.checked : (el.type === 'number' || el.type === 'range') ? (el.value === '' ? null : +el.value) : el.value;
    ui.setPath(path, v);
    ui.save();
    ui.$$('[data-out="' + path + '"]').forEach(function (o) { o.textContent = el.getAttribute('data-fmt') === 'eur' ? U.eur(v) : String(v == null ? '' : v).replace('.', ','); });
    if (el.hasAttribute('data-rerender') && (ev.type === 'change' || el.type === 'range' || el.type === 'checkbox')) ui.render();
    if (ui.current && ui.current.screen.onInput) ui.current.screen.onInput(el, ev);
  }

  ui.actions.go = function (el) { var h = el.getAttribute('data-href') || el.getAttribute('href'); if (h) ui.go(h); };
  ui.actions.set = function (el) {
    ui.setPath(el.getAttribute('data-bind'), parseVal(el.getAttribute('data-val')));
    ui.save(); ui.render();
  };
  ui.actions.toggle = function (el) {
    var path = el.getAttribute('data-bind'), v = parseVal(el.getAttribute('data-val'));
    var arr = U.arr(ui.getPath(path)).slice(), i = arr.indexOf(v);
    if (i >= 0) arr.splice(i, 1); else arr.push(v);
    ui.setPath(path, arr); ui.save(); ui.render();
  };
  ui.actions.closeDrawer = function () { ui.closeDrawer(); };
  ui.actions.copy = function (el) { var t = ui._copyStore && ui._copyStore[el.getAttribute('data-id')]; if (t != null) ui.copy(t); };
  ui.actions.scrollTo = function (el) {
    var t = document.getElementById(el.getAttribute('data-target'));
    if (t) { t.scrollIntoView({ behavior: W.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' }); t.focus({ preventScroll: true }); }
  };
  ui.actions.menu = function () {
    var links = [['#/accueil', 'Accueil'], ['#/demo', 'Démo'], ['#/outils/autour', 'Autour de moi'], ['#/outils/recherches', 'Recherches préparées'], ['#/comparer', 'Comparer avec un ami'], ['#/copilote', 'Copilote IA'], ['#/attente', 'Liste d’attente'], ['#/comment', 'Comment ça marche']];
    if (ui.st && ui.st.mode) links.splice(1, 0, [ui.st.step === 'done' ? ui.resultRoute() : '#/bilan/' + (ui.st.step || 'contexte'), ui.st.step === 'done' ? 'Mes résultats' : 'Reprendre mon bilan']);
    if (ui.st && ui.st.mode === 'both' && ui.st.step === 'done') links.splice(2, 0, ['#/offre', 'Mon plan de valorisation']);
    ui.drawer('Menu', '<nav class="menulist" aria-label="Navigation">' + links.map(function (l) { return '<a href="' + l[0] + '" data-act="menuGo">' + E(l[1]) + ui.icon('arrowR') + '</a>'; }).join('') + '</nav>' +
      (ui.st && ui.st.mode ? '<button class="btn ghost danger" data-act="reset" style="margin-top:20px">Réinitialiser mon bilan</button>' : ''));
  };
  ui.actions.menuGo = function (el) { ui.closeDrawer(); ui.go(el.getAttribute('href')); };
  ui.actions.reset = function () {
    if (!W.confirm('Effacer tout le bilan enregistré sur cet appareil ?')) return;
    C.clearState(); ui.st = C.defaultState(); ui.closeDrawer(); ui.updateSaveBadge(); ui.toast('Bilan effacé', 'wait'); ui.go('#/accueil');
  };
  ui.actions.start = function (el) {
    var mode = el.getAttribute('data-mode');
    var had = ui.st && ui.st.mode && Object.keys(ui.st.skills || {}).length;
    if (had && ui.st.mode !== mode && !ui.st.demo) {
      // on garde ce qui a été saisi et on change seulement de parcours
      ui.st.mode = mode;
    } else if (!had || ui.st.demo) { ui.st = C.defaultState(); ui.st.mode = mode; }
    ui.st.step = 'contexte'; ui.save(true); ui.go('#/bilan/contexte');
  };

  function onKey(ev) {
    var tag = (ev.target.tagName || '').toLowerCase();
    var typing = tag === 'input' || tag === 'textarea' || tag === 'select' || ev.target.isContentEditable;
    if (ev.key === 'Escape') { if (ui.closeDrawer()) { ev.preventDefault(); return; } if (typing) { ev.target.blur(); return; } }
    if (ev.key === '/' && !typing) {
      var s = ui.$('[data-search]');
      if (s) { ev.preventDefault(); s.focus(); s.select && s.select(); return; }
    }
    if (ui.current && ui.current.screen.onKey && !typing && !ev.metaKey && !ev.ctrlKey && !ev.altKey) ui.current.screen.onKey(ev);
  }

  ui.boot = function () {
    C.loadData(W.CORDES_DATA, W.CORDES_RESOURCES);
    C.buildGraph(12);
    ui.st = C.loadState() || C.defaultState();
    // bilan converti depuis l'ancienne échelle (0 à 4) : on enregistre tout de suite la version 2
    if (ui.st.migratedFrom) { delete ui.st.migratedFrom; C.saveState(ui.st); }
    document.addEventListener('click', onClick);
    document.addEventListener('input', onInput);
    document.addEventListener('change', onInput);
    document.addEventListener('keydown', onKey);
    W.addEventListener('hashchange', function () { ui.closeDrawer(); ui.render({ keepFocus: false }); W.scrollTo(0, 0); var h = ui.$('#view h1'); if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); } });
    ui.$('#veil').addEventListener('click', ui.closeDrawer);
    // enregistrer tout de suite si l'onglet se ferme ou passe en arrière-plan
    W.addEventListener('pagehide', ui.flushSave);
    document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') ui.flushSave(); });
    if ('ontouchstart' in W || navigator.maxTouchPoints > 0) document.documentElement.classList.add('touch');
    ui.updateSaveBadge();
    ui.render();
    if (C.anomalies.length && W.console) console.info('[Cordes] anomalies de données :', C.anomalies);
  };
})(window);
