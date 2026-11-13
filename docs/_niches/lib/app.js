(function () {
'use strict';
var T0 = performance.now();
var E = window.ENG;
var D = JSON.parse(document.getElementById('data').textContent);
var $ = function (id) { return document.getElementById(id); };
var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
var f1 = function (x) { return (Math.round(x * 10) / 10).toFixed(1).replace('.', ','); };
var f0 = function (x) { return String(Math.round(x)); };
var fs1 = function (v) { return String(Math.round(v * 10) / 10).replace('.', ','); };
var eur = function (x) { return (Math.round(x) < 0 ? '−' : '') + Math.abs(Math.round(x)) + ' €'; };
var norm = function (s) { return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); };
var L = E.LBL;

/* ───── préparation ───── */
var N = D.niches, byId = {}, SEC = {}, CAT = {}, SUB = {};
D.sectors.forEach(function (s) { SEC[s.id] = s; });
D.cats.forEach(function (c) { CAT[c.id] = c; });
D.subs.forEach(function (s) { SUB[s.id] = s; });
N.forEach(function (n, i) {
  n.i = i; byId[n.id] = n;
  n.levels = n.L.map(function (l, k) { return { n: k + 1, title: l[0], goal: l[1], format: l[2], duration: l[3], group: l[4], price: [l[5], l[6]] }; });
  n.q = norm([n.name, n.desc, n.skills.join(' '), n.mixTags.join(' '), n.audience, SEC[n.sector].n, (CAT[n.category] || {}).name, (SUB[n.subcategory] || {}).name].join(' '));
  n.fmts = n.levels.map(function (l) { return l.format; });
});
var PAR = {}; D.parades.forEach(function (p) { PAR[p.id] = p; });
var W = E.W0.slice();
function recompute() {
  N.forEach(function (n) { n.s0 = E.score(n.scores, W); n.sx = E.scoreNoWtp(n.scores, W); n.s1 = n.par ? E.scoreWith(n.scores, W, n.wEff) : n.s0; });
  N.slice().sort(function (a, b) { return b.s0 - a.s0; }).forEach(function (n, i) { n.r0 = i + 1; });
  N.slice().sort(function (a, b) { return b.s1 - a.s1; }).forEach(function (n, i) { n.r1 = i + 1; });
}
recompute();
var sOf = function (n) { return n.s0; };

function pill(v, mod) { var x = L.verdict[v] || ['?', 'idle']; return '<span class="pill p-' + x[1] + '"><i></i>' + x[0] + (mod ? '<span class="mk" title="Verdict requalifié à la main" aria-label="requalifié">✎</span>' : '') + '</span>'; }
function sbar(s) { return '<span class="sbar"><span class="g"><b style="width:' + Math.max(0, Math.min(100, s)) + '%"></b></span><span class="n">' + f1(s) + '</span></span>'; }
function lbls(list, key) { return list.map(function (x) { return L[key][x] || x; }).join(', '); }
function srcRef(i) { return i ? '<a class="ref" href="#src-' + i + '">[' + i + ']</a>' : ''; }
/*__MYPF_UI__*/
function toast(t) { $('toast-t').textContent = t; $('toast').classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(function () { $('toast').classList.remove('on'); }, 1800); }

/* ───── en-tête et synthèse ───── */
var nLow = D.low.length;
$('meta').innerHTML = [
  ['Niches', N.length.toLocaleString('fr-FR'), 'avec 5 paliers chacune', 'accent'], ['Secteurs', D.sectors.length, 'ids figés de l’app', 'sent'], ['Catégories', D.cats.length, D.subs.length + ' sous-catégories', 'sent'],
  ['Faible propension', nLow, 'niches couvertes par une parade', 'wait'], ['Mixes éditoriaux', D.editorial.length, 'et un moteur pour les autres paires', 'int']
].map(function (m) { return '<div><div class="k"><span class="sq" style="background:var(--' + m[3] + ')"></span>' + m[0] + '</div><div class="v big">' + m[1] + '</div><div class="sub">' + m[2] + '</div></div>'; }).join('');
(function () {
  var t = D.takeaways && D.takeaways.length ? D.takeaways : [];
  var h = '';
  if (D.fixtures && D.fixtures.length) h += '<div class="callout warn"><div class="ct">Données provisoires</div><div class="prose"><p>Secteurs encore en données factices : ' + D.fixtures.join(', ') + '. Les classements changeront à leur arrivée.</p></div></div>';
  h += '<div class="callout reco"><div class="ct">À retenir</div><div class="prose"><ul>' + t.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul></div></div>';
  $('takeaways').innerHTML = h;
})();

/* ───── méthode ───── */
function renderWeights() {
  $('weights').innerHTML = E.CRIT.map(function (c, i) {
    return '<div class="sl"><label for="w' + i + '">' + c[1] + '</label><span class="w" id="wv' + i + '">' + W[i] + '</span><input type="range" min="0" max="30" step="1" id="w' + i + '" value="' + W[i] + '" aria-describedby="wd' + i + '"><span class="d" id="wd' + i + '">' + esc(c[2]) + '</span></div>';
  }).join('');
}
function wsum() { var s = W.reduce(function (a, b) { return a + b; }, 0); $('wsum').textContent = 'somme ' + s + ' · ramenée sur 100'; }
renderWeights(); wsum();
var raf = 0;
$('weights').addEventListener('input', function (e) {
  var m = e.target.id.match(/^w(\d+)$/); if (!m) return; W[+m[1]] = +e.target.value; $('wv' + m[1]).textContent = e.target.value; wsum();
  cancelAnimationFrame(raf); raf = requestAnimationFrame(function () { recompute(); refreshScores(); });
});
$('w-reset').addEventListener('click', function () { W = E.W0.slice(); renderWeights(); wsum(); recompute(); refreshScores(); toast('Poids réinitialisés'); });
$('levels-t').innerHTML = E.LEVELS.map(function (l) { return '<tr><td class="num" style="text-align:left">' + l[0] + '</td><td class="nm" style="font-family:var(--f-display);font-size:15px">' + l[1] + '</td><td style="font-family:var(--f-body);font-size:14.5px">' + l[2] + '</td><td>' + l[3] + '</td></tr>'; }).join('');
(function () {
  var vc = { prioritaire: 0, 'a-tester': 0, 'plus-tard': 0, ecarter: 0 }; N.forEach(function (n) { vc[n.verdict]++; });
  var dsc = { prioritaire: 'à lancer dans les 6 premiers mois', 'a-tester': 'pilote à mener avant décision', 'plus-tard': 'à ouvrir quand le réseau existe', ecarter: 'frein réglementaire, coût ou concurrence gratuite' };
  $('verdict-c').innerHTML = Object.keys(vc).map(function (k) { return '<div><div class="k"><span class="sq" style="background:var(--' + L.verdict[k][1] + ')"></span>' + L.verdict[k][0] + '</div><div class="v big">' + vc[k] + '</div><div class="sub">' + dsc[k] + '</div></div>'; }).join('');
})();

(function () {
  var hk = ['format', 'supply', 'community', 'hostIncome'], nm = { format: 'Format', supply: 'Vivier', community: 'Communauté', hostIncome: 'Revenu hôte' };
  $('harm-reg').textContent = D.harm.reg + ' niches concernées.';
  $('dup-n').textContent = D.dups.length;
  var sg = function (v) { return (v > 0 ? '+' : v < 0 ? '−' : '') + f1(Math.abs(v)).replace(',0', ''); };
  $('harm-t').innerHTML = '<thead><tr><th>Secteur</th>' + hk.map(function (k) { return '<th class="num">' + nm[k] + '</th>'; }).join('') + '</tr></thead><tbody>' + D.sectors.map(function (s) { return '<tr><td>' + esc(s.n) + '</td>' + hk.map(function (k) { var v = D.harm.shift[k][s.id] || 0; return '<td class="num" style="color:' + (Math.abs(v) >= 0.3 ? 'var(--wait)' : 'var(--fg-2)') + '">' + sg(Math.round(v * 100) / 100) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody>';
})();
/* ───── explorateur ───── */
var X = { q: '', view: 'tree', verdict: {}, wtp: {}, mine: {}, sec: '', fmt: '', pub: '', ven: '', mom: '', low: '', open: {}, sort: { k: 's1', d: -1 }, order: [], sel: null };
var FDEF = [['sec', 'Secteur', D.sectors.map(function (s) { return [s.id, s.n]; })], ['fmt', 'Format', Object.keys(L.format).map(function (k) { return [k, L.format[k]]; })], ['pub', 'Public', Object.keys(L.publics).map(function (k) { return [k, L.publics[k]]; })], ['ven', 'Lieu', Object.keys(L.venues).map(function (k) { return [k, L.venues[k]]; })], ['mom', 'Moment', Object.keys(L.moments).map(function (k) { return [k, L.moments[k]]; })], ['low', 'Parades', [['low', 'Faible propension avec parade'], ['no', 'Sans parade']]]];
$('filters').innerHTML = FDEF.map(function (f) { return '<label>' + f[1] + '<select data-f="' + f[0] + '"><option value="">Tous</option>' + f[2].map(function (o) { return '<option value="' + o[0] + '">' + esc(o[1]) + '</option>'; }).join('') + '</select></label>'; }).join('');
function chipRow(id, defs, key) {
  $(id).insertAdjacentHTML('beforeend', defs.map(function (d) { return '<button type="button" class="chip c-' + d[2] + '" data-k="' + key + '" data-v="' + d[0] + '" aria-pressed="false"><i></i>' + d[1] + ' <b data-c="' + key + d[0] + '"></b></button>'; }).join(''));
}
chipRow('f-verdict', Object.keys(L.verdict).map(function (k) { return [k, L.verdict[k][0], L.verdict[k][1]]; }), 'verdict');
chipRow('f-wtp', [['lo', '0 à 2 · faible', 'no'], ['mid', '3 · moyenne', 'wait'], ['hi', '4 et 5 · forte', 'int']], 'wtp');
var wb = function (w) { return w <= 2 ? 'lo' : w === 3 ? 'mid' : 'hi'; };
function active() { return X.q || X.sec || X.fmt || X.pub || X.ven || X.mom || X.low || Object.keys(X.verdict).length || Object.keys(X.wtp).length || Object.keys(X.mine).length; }
function match(n, skip) {
  if (X.q) { var ws = X.qw; for (var i = 0; i < ws.length; i++) if (n.q.indexOf(ws[i]) < 0) return false; }
  if (X.sec && n.sector !== X.sec) return false;
  if (X.fmt && n.fmts.indexOf(X.fmt) < 0) return false;
  if (X.pub && n.publics.indexOf(X.pub) < 0) return false;
  if (X.ven && n.venues.indexOf(X.ven) < 0) return false;
  if (X.mom && n.moments.indexOf(X.mom) < 0) return false;
  if (X.low === 'low' && !n.par) return false; if (X.low === 'no' && n.par) return false;
  if (skip !== 'verdict' && Object.keys(X.verdict).length && !X.verdict[ev(n)]) return false;
  if (skip !== 'mine' && Object.keys(X.mine).length && !((X.mine['in'] && IN[n.id]) || (X.mine.mod && ST.ov[n.id]))) return false;
  if (skip !== 'wtp' && Object.keys(X.wtp).length && !X.wtp[wb(n.scores.wtp)]) return false;
  return true;
}
function counts() {
  var cv = {}, cw = {}, cm = { 'in': 0, mod: 0 };
  N.forEach(function (n) { if (match(n, 'verdict')) { var v = ev(n); cv[v] = (cv[v] || 0) + 1; } if (match(n, 'wtp')) { var b = wb(n.scores.wtp); cw[b] = (cw[b] || 0) + 1; } if (match(n, 'mine')) { if (IN[n.id]) cm['in']++; if (ST.ov[n.id]) cm.mod++; } });
  document.querySelectorAll('[data-c]').forEach(function (b) { var k = b.getAttribute('data-c'); b.textContent = k.indexOf('verdict') === 0 ? (cv[k.slice(7)] || 0) : k.indexOf('mine') === 0 ? cm[k.slice(4)] : (cw[k.slice(3)] || 0); });
  paintAddAll();
}
function visible() { var o = []; for (var i = 0; i < N.length; i++) if (match(N[i])) o.push(N[i]); return o; }
var VIS = [];
function renderX() {
  VIS = visible(); counts();
  $('vis-cnt').textContent = VIS.length + ' / ' + N.length;
  if (X.view === 'tree') renderTree(); else renderTable();
}
/* arborescence à rendu paresseux */
function renderTree() {
  var bySec = {}, byCat = {}, bySub = {};
  VIS.forEach(function (n) { (bySec[n.sector] = bySec[n.sector] || []).push(n); (byCat[n.category] = byCat[n.category] || []).push(n); (bySub[n.subcategory] = bySub[n.subcategory] || []).push(n); });
  var auto = active() && VIS.length <= 60;
  var isOpen = function (id) { return auto || !!X.open[id]; };
  var mean = function (a) { return a.reduce(function (t, n) { return t + n.s1; }, 0) / a.length; };
  var h = [], order = [];
  D.sectors.forEach(function (s) {
    var a = bySec[s.id]; if (!a) return;
    var o = isOpen(s.id);
    h.push('<div class="trw"><button class="trow l0" type="button" data-t="' + s.id + '" aria-expanded="' + o + '"><span class="tri">▶</span><span class="glyph" aria-hidden="true">' + s.g + '</span><span class="sname">' + esc(s.n) + '</span><span class="tc">' + a.length + ' niches</span><span class="tc vv">' + sbar(mean(a)) + '</span></button>' + grpBtn('x:' + s.id, a, s.n) + '</div>');
    if (!o) return;
    D.cats.forEach(function (c) {
      if (c.sec !== s.id) return; var ac = byCat[c.id]; if (!ac) return; var oc = isOpen(c.id);
      h.push('<div class="trw"><button class="trow l1" type="button" data-t="' + c.id + '" aria-expanded="' + oc + '"><span class="tri">▶</span><span>' + esc(c.name) + '</span><span class="tc">' + ac.length + '</span><span class="tc vv">' + sbar(mean(ac)) + '</span></button>' + grpBtn('c:' + c.id, ac, c.name) + '</div>');
      if (!oc) return;
      D.subs.forEach(function (sc) {
        if (sc.cat !== c.id) return; var as = bySub[sc.id]; if (!as) return; var os = isOpen(sc.id);
        h.push('<div class="trw"><button class="trow l2" type="button" data-t="' + sc.id + '" aria-expanded="' + os + '"><span class="tri">▶</span><span>' + esc(sc.name) + '</span><span class="tc">' + as.length + '</span><span class="tc vv">' + sbar(mean(as)) + '</span></button>' + grpBtn('s:' + sc.id, as, sc.name) + '</div>');
        if (!os) return;
        as.slice().sort(function (x, y) { return y.s1 - x.s1; }).forEach(function (n) {
          order.push(n.id);
          h.push('<div class="nrow' + (X.sel === n.id ? ' sel' : '') + '" data-row="' + n.id + '">' + pfb(n) + '<button class="nopen" type="button" data-id="' + n.id + '"><span class="nn">' + esc(n.name) + (n.par ? ' <span class="tag t-E" title="Faible propension, parade recommandée">parade</span>' : '') + '</span><span class="ff">' + esc(L.format[n.levels[0].format]) + ' · ' + n.levels[0].price[0] + ' à ' + n.levels[0].price[1] + ' € · ' + esc(lbls(n.venues.slice(0, 2), 'venues')) + '</span><span class="vv">' + vpill(n) + '</span>' + sbar(n.s1) + '</button></div>');
        });
      });
    });
  });
  X.order = order.length ? order : VIS.slice().sort(function (a, b) { return b.s1 - a.s1; }).map(function (n) { return n.id; });
  $('xbody').innerHTML = h.length ? '<div class="tree" role="tree">' + h.join('') + '</div>' : '<div class="empty">Aucune niche ne correspond. Effacer un filtre ou élargir la recherche.</div>';
}
function grpBtn(key, list, name) { var on = list.every(function (n) { return IN[n.id]; }); return '<button type="button" class="btn sm ghost pfg" data-pfgrp="' + key + '" aria-pressed="' + on + '" aria-label="Retenir les ' + list.length + ' niches de «\u00a0' + esc(name) + '\u00a0» dans mon portefeuille">' + (on ? 'Retirer' : 'Ajouter') + '</button>'; }
/* tableau virtualisé */
var COLS = [['r', '#'], ['name', 'Niche'], ['sector', 'Secteur'], ['verdict', 'Verdict'], ['demand', 'Dem.'], ['wtp', 'Prop.'], ['format', 'Fmt'], ['supply', 'Viv.'], ['s1', 'Score'], ['p1', 'Prix 1']];
var VORD = { prioritaire: 0, 'a-tester': 1, 'plus-tard': 2, ecarter: 3 };
function sortKey(n, k) { switch (k) { case 'r': case 's1': return n.s1; case 'name': return n.name; case 'sector': return SEC[n.sector].n + ' ' + n.category; case 'verdict': return -VORD[ev(n)]; case 'p1': return n.levels[0].price[0]; default: return n.scores[k]; } }
var ROWS = [], RH = 44;
function renderTable() {
  var k = X.sort.k, d = X.sort.d;
  ROWS = VIS.slice().sort(function (a, b) { var x = sortKey(a, k), y = sortKey(b, k); if (typeof x === 'string') return d * x.localeCompare(y); return d * (x - y) || b.s1 - a.s1; });
  X.order = ROWS.map(function (n) { return n.id; });
  RH = window.innerWidth <= 1040 ? 64 : 44;
  $('xbody').innerHTML = '<div class="vt"><div class="msort"><label>Trier par <select id="x-sort">' + COLS.filter(function (c) { return c[0] !== 'r'; }).map(function (c) { return '<option value="' + c[0] + '"' + (X.sort.k === c[0] ? ' selected' : '') + '>' + ({ name: 'Nom', sector: 'Secteur', verdict: 'Verdict', demand: 'Demande', wtp: 'Propension', format: 'Format', supply: 'Vivier', s1: 'Score', p1: 'Prix palier 1' }[c[0]]) + '</option>'; }).join('') + '</select></label></div><div class="vhead" role="row"><div role="columnheader"><span class="sr">Portefeuille</span></div>' + COLS.map(function (c) { var on = X.sort.k === c[0]; return '<div role="columnheader" aria-sort="' + (on ? (X.sort.d > 0 ? 'ascending' : 'descending') : 'none') + '"><button type="button" data-sort="' + c[0] + '">' + c[1] + (on ? (X.sort.d > 0 ? ' ↑' : ' ↓') : '') + '</button></div>'; }).join('') + '</div>' +
    (ROWS.length ? '<div class="vbody" id="vbody" tabindex="0" aria-label="Tableau des niches"><div class="vspace" id="vspace" style="height:' + ROWS.length * RH + 'px"></div></div>' : '<div class="empty">Aucune niche ne correspond. Effacer un filtre ou élargir la recherche.</div>') + '</div>';
  if (ROWS.length) { $('vbody').addEventListener('scroll', paintRows, { passive: true }); paintRows(); }
  $('x-sort').addEventListener('change', function (e) { var k2 = e.target.value; X.sort.k = k2; X.sort.d = (k2 === 'name' || k2 === 'sector') ? 1 : -1; renderTable(); });
}
function paintRows() {
  var b = $('vbody'); if (!b) return;
  var st = b.scrollTop, h = b.clientHeight || 560, a = Math.max(0, Math.floor(st / RH) - 8), z = Math.min(ROWS.length, Math.ceil((st + h) / RH) + 8), o = [];
  for (var i = a; i < z; i++) {
    var n = ROWS[i];
    o.push('<div class="vrow' + (X.sel === n.id ? ' sel' : '') + '" data-row="' + n.id + '" style="top:' + i * RH + 'px">' + pfb(n) + '<button type="button" class="vopen" data-id="' + n.id + '"><span class="rk">' + n.r1 + '</span><span class="nm">' + esc(n.name) + '</span><span class="sc2">' + esc(SEC[n.sector].n) + ' · ' + esc((CAT[n.category] || {}).name || '') + '</span><span class="vd">' + vpill(n) + '</span><span class="c xc">' + fs1(n.scores.demand) + '</span><span class="c xc">' + n.scores.wtp + (n.par ? '<span class="up" title="parade"> +</span>' : '') + '</span><span class="c xc">' + fs1(n.scores.format) + '</span><span class="c xc">' + fs1(n.scores.supply) + '</span><span class="scr">' + sbar(n.s1) + '</span><span class="c xc">' + n.levels[0].price[0] + '-' + n.levels[0].price[1] + '</span></button></div>');
  }
  $('vspace').innerHTML = o.join('');
}
window.addEventListener('resize', function () { if (X.view === 'table') { var r = window.innerWidth <= 1040 ? 64 : 44; if (r !== RH) renderTable(); } });
var qt = 0;
$('q').addEventListener('input', function (e) { clearTimeout(qt); qt = setTimeout(function () { X.q = norm(e.target.value.trim()); X.qw = X.q.split(/\s+/).filter(Boolean); renderX(); }, 90); });
$('filters').addEventListener('change', function (e) { var f = e.target.getAttribute('data-f'); if (f) { X[f] = e.target.value; renderX(); } });
$('xp').addEventListener('click', function (e) {
  var c = e.target.closest('.chip'); if (c) { var k = c.getAttribute('data-k'), v = c.getAttribute('data-v'); if (X[k][v]) delete X[k][v]; else X[k][v] = 1; c.setAttribute('aria-pressed', !!X[k][v]); renderX(); return; }
  var vb = e.target.closest('[data-view]'); if (vb) { X.view = vb.getAttribute('data-view'); document.querySelectorAll('[data-view]').forEach(function (b) { b.setAttribute('aria-pressed', b === vb); }); renderX(); return; }
  var t = e.target.closest('[data-t]'); if (t) { var id = t.getAttribute('data-t'); var auto = active() && VIS.length <= 60; if (auto) { toast('Filtres actifs : arborescence dépliée'); return; } if (X.open[id]) delete X.open[id]; else X.open[id] = 1; renderTree(); var nb = document.querySelector('[data-t="' + id + '"]'); if (nb) nb.focus(); return; }
  var s = e.target.closest('[data-sort]'); if (s) { var k2 = s.getAttribute('data-sort'); if (X.sort.k === k2) X.sort.d *= -1; else { X.sort.k = k2; X.sort.d = (k2 === 'name' || k2 === 'sector') ? 1 : -1; } renderTable(); return; }
  var r = e.target.closest('[data-id]'); if (r) openNiche(r.getAttribute('data-id'), X.order);
});
$('x-reset').addEventListener('click', function () {
  X.q = ''; X.qw = []; $('q').value = ''; X.verdict = {}; X.wtp = {}; ['sec', 'fmt', 'pub', 'ven', 'mom', 'low'].forEach(function (k) { X[k] = ''; });
  document.querySelectorAll('#filters select').forEach(function (s) { s.value = ''; }); document.querySelectorAll('#xp .chip').forEach(function (c) { c.setAttribute('aria-pressed', 'false'); }); renderX();
});
var hostDl = null; if (window.claude && typeof window.claude.use === 'function') { window.claude.use('downloads').then(function (d) { hostDl = d; }, function () {}); }
function download(name, text) {
  if (window.claude && typeof window.claude.use === 'function') {
    (hostDl ? Promise.resolve(hostDl) : window.claude.use('downloads')).then(function (d) { if (!d) { toast('Téléchargement indisponible ici · utiliser Copier'); return; } hostDl = d; return d.save({ filename: name, data: text }); }).catch(function () { toast('Téléchargement refusé'); });
    return;
  }
  var b = new Blob([text], { type: (/\.json$/.test(name) ? 'application/json' : 'text/csv') + ';charset=utf-8' }), u = URL.createObjectURL(b), a = document.createElement('a'); a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(u); }, 1000);
}
$('x-csv').addEventListener('click', function () {
  var q = function (s) { return '"' + String(s).replace(/"/g, '""') + '"'; };
  var rows = [['id', 'niche', 'secteur', 'categorie', 'sous_categorie', 'score', 'score_parades', 'verdict', 'mon_verdict', 'propension', 'parades', 'prix_p1', 'prix_p2', 'prix_p3', 'prix_p4', 'prix_p5'].join(';')];
  VIS.forEach(function (n) { rows.push([n.id, q(n.name), q(SEC[n.sector].n), q((CAT[n.category] || {}).name), q((SUB[n.subcategory] || {}).name), f1(n.s0), f1(n.s1), n.verdict, MY.verdict(ST, n), n.scores.wtp, q((n.par || []).join(' ')), n.levels.map(function (l) { return l.price.join('-'); }).join(';')].join(';')); });
  download('niches-v2.csv', '﻿' + rows.join('\n')); toast(VIS.length + ' niches exportées');
});

/* ───── panneau latéral ───── */
var PANEL = { list: [], last: null };
function ladder(n) {
  return '<ol class="ladder">' + n.levels.map(function (l, i) {
    var who = i < 4 ? 'Animé par un hôte de niveau ' + (i + 2) + ' au moins' : 'Encadré par un référent confirmé, qui forme aussi les hôtes';
    return '<li class="l' + (i + 1) + '"><div class="lh"><span class="ln">Palier ' + (i + 1) + ' · ' + E.LEVELS[i][1] + '</span></div><div class="lt">' + esc(l.title) + '</div><div class="lg">' + esc(l.goal) + '</div><div class="lm">' + esc(L.format[l.format] || l.format) + ' · ' + esc(l.duration) + ' · ' + esc(l.group) + ' pers. · ' + l.price[0] + ' à ' + l.price[1] + ' € par personne</div><div class="lw">' + who + '</div></li>';
  }).join('') + '</ol>';
}
function openNiche(id, list) {
  var n = byId[id]; if (!n) return;
  if (!$('side').classList.contains('on')) PANEL.last = document.activeElement;
  PANEL.list = list || PANEL.list; X.sel = id;
  document.querySelectorAll('.nrow.sel,.vrow.sel').forEach(function (r) { r.classList.remove('sel'); });
  document.querySelectorAll('[data-row="' + id + '"]').forEach(function (r) { r.classList.add('sel'); });
  $('side-path').textContent = SEC[n.sector].n + ' / ' + ((CAT[n.category] || {}).name || '') + ' / ' + ((SUB[n.subcategory] || {}).name || '');
  $('side-title').textContent = n.name;
  var h = '<div style="display:flex;gap:6px;flex-wrap:wrap" id="side-pills"></div>';
  h += '<p class="desc">' + esc(n.desc) + '</p><div class="mine" id="side-mine"></div>';
  h += '<div class="kv"><div class="w"><div class="k">Public</div><div class="val">' + esc(n.audience) + '</div></div><div class="w"><div class="k">Compétences</div><div class="val">' + esc(n.skills.join(' · ')) + '</div></div>' +
    '<div><div class="k">Lieux</div><div class="val">' + esc(lbls(n.venues, 'venues')) + '</div></div><div><div class="k">Moments</div><div class="val">' + esc(lbls(n.moments, 'moments')) + '</div></div>' +
    '<div><div class="k">Publics</div><div class="val">' + esc(lbls(n.publics, 'publics')) + '</div></div><div><div class="k">Sens et énergie</div><div class="val">' + esc(lbls(n.senses, 'senses')) + ' · ' + esc(L.energy[n.energy]) + '</div></div>' +
    '<div><div class="k">Productions</div><div class="val">' + esc(lbls(n.outputs, 'outputs')) + '</div></div><div><div class="k">Cadre</div><div class="val">' + (n.regulated ? esc(L.regulated[n.regulated]) : 'Aucun frein particulier') + '</div></div>' +
    '<div class="w"><div class="k">Concurrents</div><div class="val">' + esc(n.competitors.join(', ') || 'non renseigné') + '</div></div><div class="w"><div class="k">Pourquoi ce verdict</div><div class="val">' + esc(n.why) + '</div></div></div>';
  h += '<h4>Échelle des 5 paliers</h4>' + ladder(n);
  h += '<h4>Notes</h4>' + E.CRIT.map(function (c) { var v = n.scores[c[0]], rw = n.raw && n.raw[c[0]] !== v ? ' <span style="color:var(--fg-3)">(brut ' + n.raw[c[0]] + ')</span>' : ''; return '<div class="crit"><span>' + c[1] + rw + ' <span style="color:var(--fg-3)">· ' + W[E.KEYS.indexOf(c[0])] + '</span></span><span class="g"><b style="width:' + v * 20 + '%;background:var(--' + (v >= 4 ? 'int' : v >= 3 ? 'accent' : v >= 2 ? 'wait' : 'no') + ')"></b></span><span class="val">' + String(v).replace('.', ',') + '</span></div>'; }).join('');
  if (n.dup) h += '<p class="note">Proche de : ' + n.dup.map(function (d) { return '<button class="lnk" type="button" data-open="' + d + '" style="color:var(--accent)">' + esc(byId[d].name) + '</button> (' + esc(SEC[byId[d].sector].n) + ')'; }).join(', ') + '. Quasi-doublon entre lots, à fusionner ou différencier.</p>';
  if (n.par) {
    h += '<h4>Parades recommandées</h4><ul class="mini">' + n.par.map(function (p) { var f = (n.pfit || []).filter(function (x) { return x[0] === p; })[0]; return '<li><div><div class="mn">' + esc(PAR[p].n) + (n.pm ? ' <span style="color:var(--accent)">✎</span>' : '') + '</div><div class="ms">' + esc(PAR[p].tag) + (f ? ' · adéquation ' + f[1] : '') + '</div></div><button class="btn sm" type="button" data-sim="' + n.id + '|' + p + '">Simuler</button></li>'; }).join('') + '</ul>';
    if (n.pm) h += '<p class="note">✎ ' + esc(n.pm) + '</p>';
    if (n.prem) h += '<p class="note">Meilleur duo premium : ' + esc(byId[n.prem[0]].name) + ' · score de mix ' + n.prem[1] + '</p>';
  }
  var bp = E.bestPartners(n, N, sOf, 5, {}, function (b) { return b.sector !== n.sector; });
  h += '<h4>Meilleurs mixes avec cette niche</h4><ul class="mini">' + bp.map(function (r) { var f = E.format([n, r.b], r); return '<li><div><div class="mn">' + esc(f.name) + '</div><div class="ms">' + esc(SEC[r.b.sector].n) + ' · ' + f.price + ' € · ' + esc(L.venues[f.venue] || 'lieu à trouver') + ' · score ' + f0(r.s) + '</div></div><button class="btn sm" type="button" data-mix="' + n.id + '|' + r.b.id + '">Explorer</button></li>'; }).join('') + '</ul>';
  $('side-b').innerHTML = h; $('side-b').scrollTop = 0; sidePills(n); renderMine(n);
  $('side').classList.add('on'); $('side').setAttribute('aria-hidden', 'false'); $('veil').classList.add('on');
  $('side-x').focus({ preventScroll: true });
}
function closeSide() { if (!$('side').classList.contains('on')) return; $('side').classList.remove('on'); $('side').setAttribute('aria-hidden', 'true'); $('veil').classList.remove('on'); if (PANEL.last && PANEL.last.focus && document.contains(PANEL.last)) PANEL.last.focus({ preventScroll: true }); }
$('side-x').addEventListener('click', closeSide); $('veil').addEventListener('click', closeSide);
$('side-b').addEventListener('click', function (e) {
  var s = e.target.closest('[data-sim]'); if (s) { var p = s.getAttribute('data-sim').split('|'); closeSide(); setSim(p[0], p[1]); $('sim').scrollIntoView(); return; }
  var m = e.target.closest('[data-mix]'); if (m) { closeSide(); MT.sel = m.getAttribute('data-mix').split('|'); renderSel(); runMix(); $('mt').scrollIntoView(); }
});
document.addEventListener('keydown', function (e) {
  var tag = (e.target.tagName || '').toLowerCase(), typing = tag === 'input' || tag === 'select' || tag === 'textarea';
  if (e.key === 'Escape') { if ($('side').classList.contains('on')) { closeSide(); e.preventDefault(); } return; }
  if (typing) return;
  if (e.key === '/') { e.preventDefault(); $('q').focus(); $('explorer').scrollIntoView(); return; }
  if ((e.key === 'p' || e.key === 'P') && !e.metaKey && !e.ctrlKey && !e.altKey && $('side').classList.contains('on') && X.sel) { var on = MY.toggle(ST, X.sel); afterSel(); toast((on ? 'Ajoutée à «\u00a0' : 'Retirée de «\u00a0') + MY.cur(ST).name + '\u00a0»'); e.preventDefault(); return; }
  if ((e.key === 'j' || e.key === 'k') && $('side').classList.contains('on') && PANEL.list.length) {
    var i = PANEL.list.indexOf(X.sel), j = e.key === 'j' ? Math.min(PANEL.list.length - 1, i + 1) : Math.max(0, i - 1); if (j !== i && j >= 0) openNiche(PANEL.list[j]); e.preventDefault();
  }
  if (e.key === 'Tab' && $('side').classList.contains('on')) {
    var f = $('side').querySelectorAll('button,a[href],input,textarea,select'); if (!f.length) return; var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { last.focus(); e.preventDefault(); } else if (!e.shiftKey && document.activeElement === last) { first.focus(); e.preventDefault(); }
  }
});
document.addEventListener('click', function (e) { var b = e.target.closest('[data-open]'); if (b) { e.preventDefault(); openNiche(b.getAttribute('data-open'), (b.getAttribute('data-list') || '').split(',').filter(Boolean)); } });

/* ───── secteurs ───── */
var SECS = { k: 's1', d: -1 }, SOPEN = {};
function secStats() {
  var o = {}; D.sectors.forEach(function (s) { o[s.id] = { s: 0, s1: 0, n: 0 }; }); var c = {}; D.cats.forEach(function (x) { c[x.id] = { s: 0, s1: 0, n: 0 }; });
  N.forEach(function (n) { var a = o[n.sector]; a.s += n.s0; a.s1 += n.s1; a.n++; var b = c[n.category]; if (b) { b.s += n.s0; b.s1 += n.s1; b.n++; } });
  for (var k in o) { o[k].s /= o[k].n || 1; o[k].s1 /= o[k].n || 1; } for (var j in c) { c[j].s /= c[j].n || 1; c[j].s1 /= c[j].n || 1; }
  return { sec: o, cat: c };
}
function renderSectors() {
  var st = secStats();
  var rows = D.sectors.map(function (s) { var x = D.secStats[s.id]; return { s: s, x: x, m: st.sec[s.id] }; });
  var key = function (r) { switch (SECS.k) { case 'n': return r.x.n; case 's0': return r.m.s; case 's1': return r.m.s1; case 'prio': return r.x.vc.prioritaire / r.x.n; case 'wtp': return r.x.wtp; case 'low': return r.x.low; case 'p1': return r.x.p1; case 'p4': return r.x.p4; default: return r.s.n; } };
  rows.sort(function (a, b) { var x = key(a), y = key(b); return typeof x === 'string' ? SECS.d * x.localeCompare(y) : SECS.d * (x - y); });
  var vcol = ['prioritaire', 'a-tester', 'plus-tard', 'ecarter'];
  /* graphique en barres */
  var vals = []; rows.forEach(function (r) { vals.push(r.m.s, r.m.s1); }); var lo = Math.floor((Math.min.apply(null, vals) - 2) / 4) * 4, hi = lo + 16; while (hi < Math.max.apply(null, vals) + 1) hi += 4;
  var ticks = []; for (var t = lo; t <= hi; t += (hi - lo) / 4) ticks.push(t);
  var pos = function (v) { return Math.max(0, Math.min(100, (v - lo) / (hi - lo) * 100)); };
  var axis = '<span></span><span style="position:relative;height:14px;display:block;color:var(--fg-3);font-size:10px">' + ticks.map(function (t) { return '<span style="position:absolute;left:' + pos(t) + '%;transform:translateX(-50%)">' + t + '</span>'; }).join('') + '</span><span style="color:var(--fg-3);font-size:10px">verdicts</span>';
  $('sec-chart').innerHTML = '<div class="schart">' + axis + rows.slice().sort(function (a, b) { return b.m.s1 - a.m.s1; }).map(function (r) {
    var x = r.x; return '<span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--fg-2)">' + esc(r.s.n) + '</span><span style="position:relative;height:16px;display:block;background:linear-gradient(var(--line-2),var(--line-2)) 0 50%/100% 1px no-repeat"><span title="brut" style="position:absolute;top:4px;width:8px;height:8px;border-radius:50%;background:var(--accent);left:calc(' + pos(r.m.s) + '% - 4px)"></span><span title="avec parades" style="position:absolute;top:1px;height:14px;width:2px;background:var(--int);left:' + pos(r.m.s1) + '%"></span><span style="position:absolute;left:calc(' + pos(Math.max(r.m.s, r.m.s1)) + '% + 8px);top:0;color:var(--fg)">' + f1(r.m.s1) + '</span></span>' +
      '<span class="dist" title="verdicts">' + vcol.map(function (v) { return x.vc[v] ? '<i style="flex:' + x.vc[v] + ';background:var(--' + L.verdict[v][1] + ')"></i>' : ''; }).join('') + '</span>';
  }).join('') + '</div><div class="legend" style="margin-top:12px"><span><i style="background:var(--accent);border-radius:50%"></i>Score brut moyen</span><span><i style="background:var(--int);width:2px"></i>Avec parades</span><span style="color:var(--fg-3)">échelle de 60 à 76</span>' + vcol.map(function (v) { return '<span><i style="background:var(--' + L.verdict[v][1] + ')"></i>' + L.verdict[v][0] + '</span>'; }).join('') + '</div>';
  var hd = [['name', 'Secteur'], ['n', 'Niches'], ['s0', 'Score'], ['s1', 'Avec parades'], ['prio', 'Prioritaires'], ['wtp', 'Prop. moy.'], ['low', 'Faibles à parade'], ['p1', 'Prix P1'], ['p4', 'Prix P4'], ['best', 'Meilleure niche']];
  var h = '<thead><tr>' + hd.map(function (c, i) { var on = SECS.k === c[0]; return '<th' + (i && i < 9 ? ' class="num"' : '') + ' aria-sort="' + (on ? (SECS.d > 0 ? 'ascending' : 'descending') : 'none') + '">' + (c[0] === 'best' ? c[1] : '<button type="button" data-ss="' + c[0] + '">' + c[1] + (on ? (SECS.d > 0 ? ' ↑' : ' ↓') : '') + '</button>') + '</th>'; }).join('') + '</tr></thead><tbody>';
  rows.forEach(function (r) {
    var x = r.x, b = byId[x.best];
    h += '<tr class="clk" data-sx="' + r.s.id + '" tabindex="0" aria-expanded="' + !!SOPEN[r.s.id] + '"><td style="white-space:nowrap"><span class="tri">▶</span> <span class="nm">' + esc(r.s.n) + '</span></td><td class="num">' + x.n + '</td><td class="num">' + f1(r.m.s) + '</td><td class="num">' + f1(r.m.s1) + '</td><td class="num">' + Math.round(x.vc.prioritaire / x.n * 100) + ' %</td><td class="num">' + f1(x.wtp) + '</td><td class="num">' + x.low + '</td><td class="num">' + x.p1 + ' €</td><td class="num">' + x.p4 + ' €</td><td>' + (b ? '<button class="lnk" type="button" data-open="' + b.id + '">' + esc(b.name) + '</button>' : '') + '</td></tr>';
    if (SOPEN[r.s.id]) D.cats.forEach(function (c) { if (c.sec !== r.s.id) return; var cx = D.catStats[c.id], cm = st.cat[c.id], cb = byId[cx.best]; h += '<tr class="cat"><td>' + esc(c.name) + '</td><td class="num">' + cx.n + '</td><td class="num">' + f1(cm.s) + '</td><td class="num">' + f1(cm.s1) + '</td><td class="num">' + Math.round(cx.vc.prioritaire / Math.max(1, cx.n) * 100) + ' %</td><td class="num">' + f1(cx.wtp) + '</td><td class="num">' + cx.low + '</td><td class="num">' + cx.p1 + ' €</td><td class="num">' + cx.p4 + ' €</td><td>' + (cb ? '<button class="lnk" type="button" data-open="' + cb.id + '">' + esc(cb.name) + '</button>' : '') + '</td></tr>'; });
  });
  $('sec-t').innerHTML = h + '</tbody>';
}
$('sec-t').addEventListener('click', function (e) {
  var s = e.target.closest('[data-ss]'); if (s) { var k = s.getAttribute('data-ss'); if (SECS.k === k) SECS.d *= -1; else { SECS.k = k; SECS.d = k === 'name' ? 1 : -1; } renderSectors(); return; }
  if (e.target.closest('[data-open]')) return;
  var r = e.target.closest('[data-sx]'); if (r) { var id = r.getAttribute('data-sx'); SOPEN[id] = !SOPEN[id]; renderSectors(); var nr = document.querySelector('[data-sx="' + id + '"]'); if (nr) nr.focus(); }
});
$('sec-t').addEventListener('keydown', function (e) { if (e.key === 'Enter' && e.target.matches('[data-sx]')) e.target.click(); });
$('sec-diag').innerHTML = D.sectors.map(function (s) {
  return '<details class="sec"><summary><span class="glyph" aria-hidden="true">' + s.g + '</span><span class="sname">' + esc(s.n) + '<small>' + D.secStats[s.id].n + ' niches · public potentiel ≈ ' + s.dm + ' M</small></span><span class="tri">▶</span></summary><div class="secbody">' +
    '<div class="prose" style="font-size:16px;margin-top:10px"><p>' + esc(s.diag) + '</p></div><h4>Chiffres</h4><ul class="figs">' + s.ch.map(function (c) { return '<li><span><span class="tag t-' + c[0] + '">' + ({ S: 'sourcé', E: 'estimé', H: 'hypothèse' }[c[0]]) + '</span></span><span>' + esc(c[1]) + ' ' + c[2].map(srcRef).join('') + '</span></li>'; }).join('') + '</ul>' +
    '<h4>Bench</h4><div class="tw"><table class="bench"><thead><tr><th>Acteur</th><th>Modèle</th><th>Prix</th><th>Forces</th><th>Failles</th></tr></thead><tbody>' + s.b.map(function (b) { return '<tr>' + b.map(function (x) { return '<td>' + esc(x) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>' +
    '<h4>Signaux</h4><ul class="prose" style="font-size:15px">' + s.sig.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul><div class="callout reco"><div class="ct">Opportunité</div><div class="prose"><p>' + esc(s.opp) + '</p></div></div></div></details>';
}).join('');

/* ───── top 15 ───── */
var TM = 's1';
function argue(n) {
  var s = n.scores, best = E.CRIT.map(function (c) { return [c[1], s[c[0]], c[3]]; }).filter(function (c) { return c[1] >= 4; }).sort(function (a, b) { return b[2] - a[2]; }).slice(0, 3).map(function (c) { return c[0].toLowerCase() + ' ' + fs1(c[1]); });
  var t = esc(n.why) + ' Points forts : ' + best.join(', ') + '.';
  if (n.par) t += ' Propension ' + s.wtp + '/5 compensée par ' + n.par.map(function (p) { return PAR[p].n.toLowerCase(); }).join(' ou ') + '.';
  t += ' Palier 1 à ' + n.levels[0].price[0] + '-' + n.levels[0].price[1] + ' €, palier 4 à ' + n.levels[3].price[0] + '-' + n.levels[3].price[1] + ' €.';
  return t;
}
function renderTop() {
  var key = TM, list = N.slice().sort(function (a, b) { return b[key] - a[key]; }).slice(0, 15), ids = list.map(function (n) { return n.id; });
  $('top-h').textContent = TM === 's1' ? 'score avec parades · poids actuels' : 'score brut · poids actuels';
  $('topl').innerHTML = list.map(function (n, i) {
    var other = TM === 's1' ? n.r0 : n.r1, d = other - (i + 1);
    return '<li><span class="rnk">' + (i + 1) + '</span><div><button class="lnk tn" type="button" data-open="' + n.id + '" data-list="' + ids.join(',') + '">' + esc(n.name) + '</button><div class="tm">' + esc(SEC[n.sector].n) + ' · ' + esc((CAT[n.category] || {}).name) + ' · ' + esc(L.format[n.levels[0].format]) + '</div></div><div class="rs"><div class="sc">' + f1(n[key]) + '</div><div style="display:flex;gap:6px;justify-content:flex-end;align-items:center">' + vpill(n) + pfb(n) + '<span class="dl ' + (d > 0 ? 'down' : d < 0 ? 'up' : 'eq') + '" title="rang dans l’autre mode">' + (TM === 's1' ? 'brut ' : 'parades ') + other + '</span></div></div><div class="ta">' + argue(n) + '</div></li>';
  }).join('');
}
document.querySelectorAll('[data-tm]').forEach(function (b) { b.addEventListener('click', function () { TM = b.getAttribute('data-tm'); document.querySelectorAll('[data-tm]').forEach(function (x) { x.setAttribute('aria-pressed', x === b); }); renderTop(); }); });

/* ───── parades ───── */
(function () {
  var cover = {}; D.low.forEach(function (id) { byId[id].par.forEach(function (p) { cover[p] = (cover[p] || 0) + 1; }); });
  var allLow = N.filter(function (n) { return n.scores.wtp <= 2; }).length;
  var tp = D.low.filter(function (id) { return byId[id].par.some(function (p) { return PAR[p].fam === 'Tiers payeur'; }); }).length;
  $('par-c').innerHTML = [['Propension 2 ou moins', allLow, 'sur ' + N.length.toLocaleString('fr-FR') + ' niches', 'no'], ['Faibles mais intéressantes', nLow, 'score hors propension ≥ ' + D.lowMin, 'wait'], ['Couvertes par un tiers payeur', tp, 'entreprise, collectivité, lieu, marque…', 'int'], ['Parades', D.parades.length, D.packages.length + ' packages', 'accent']].map(function (m) { return '<div><div class="k"><span class="sq" style="background:var(--' + m[3] + ')"></span>' + m[0] + '</div><div class="v big">' + m[1] + '</div><div class="sub">' + m[2] + '</div></div>'; }).join('');
  /* nuage : score hors propension × propension */
  var w = 640, h = 230, pl = 34, pb = 26, pt = 10, pr = 10, xs = function (v) { return pl + (v - 40) / 60 * (w - pl - pr); }, ys = function (v) { return pt + (5 - v) / 5 * (h - pt - pb); };
  var svg = '<svg viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="Nuage des niches : score hors propension en abscisse, propension à payer en ordonnée"><rect x="' + xs(58) + '" y="' + ys(2.5) + '" width="' + (xs(100) - xs(58)) + '" height="' + (ys(-0.5) - ys(2.5)) + '" fill="color-mix(in srgb,var(--wait) 10%,transparent)" stroke="color-mix(in srgb,var(--wait) 38%,transparent)"/>';
  for (var v = 0; v <= 5; v++) svg += '<text x="' + (pl - 8) + '" y="' + (ys(v) + 3) + '" fill="var(--fg-3)" font-size="10" font-family="IBM Plex Mono" text-anchor="end">' + v + '</text>';
  [40, 50, 60, 70, 80, 90, 100].forEach(function (x) { svg += '<text x="' + xs(x) + '" y="' + (h - 8) + '" fill="var(--fg-3)" font-size="10" font-family="IBM Plex Mono" text-anchor="middle">' + x + '</text>'; });
  N.forEach(function (n, i) { var j = ((i * 7919) % 100) / 100 - 0.5; svg += '<circle cx="' + xs(Math.max(40, n.sx)).toFixed(1) + '" cy="' + ys(n.scores.wtp + j * 0.6).toFixed(1) + '" r="2.2" fill="var(--' + L.verdict[n.verdict][1] + ')" opacity=".75"/>'; });
  svg += '<text x="' + (xs(100) - 4) + '" y="' + (ys(2.5) - 4) + '" fill="var(--wait)" font-size="10" font-family="IBM Plex Mono" text-anchor="end">zone des parades · ' + nLow + ' niches</text></svg>';
  $('par-c').insertAdjacentHTML('afterend', '<div class="panel chart"><div class="ph"><span class="t">Score hors propension × propension à payer</span><span class="h">un point par niche, couleur du verdict</span></div><div class="pb">' + svg + '</div></div>');
  $('par-cards').innerHTML = D.parades.map(function (p) {
    return '<article class="card"><div class="chd"><div class="cf"><span>' + esc(p.fam) + '</span><span>' + (cover[p.id] || 0) + ' niches</span></div><div class="cn">' + esc(p.n) + '</div><div class="ctag">' + esc(p.tag) + '</div></div><div class="cb"><dl><dt>Mécanique</dt><dd>' + esc(p.meca) + '</dd><dt>Qui paie</dt><dd>' + esc(p.payers.join(', ')) + '</dd><dt>Mini-économie <span class="tag t-E">estimation</span></dt><dd>' + esc(p.eco) + '</dd></dl>' +
      '<details><summary>Détails, hôtes, références, risques</summary><dl><dt>Le participant obtient</dt><dd><ul>' + p.gets.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></dd><dt>Rémunération des hôtes</dt><dd><ul>' + p.hostPay.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></dd><dt>Ce qui donne envie aux hôtes</dt><dd>' + esc(p.hostWhy) + '</dd><dt>Références</dt><dd><ul>' + p.refs.map(function (r) { return '<li><strong style="font-weight:500">' + esc(r[0]) + '</strong> · ' + esc(r[1]) + ' ' + srcRef(r[2]) + '</li>'; }).join('') + '</ul></dd><dt>Risques</dt><dd>' + esc(p.risks) + '</dd><dt>Règle d’affectation</dt><dd>' + esc(p.rule) + '</dd></dl></details></div>' +
      '<div class="cft"><button class="btn sm" type="button" data-pf="' + p.id + '">Voir les niches</button><button class="btn sm ghost" type="button" data-ps="' + p.id + '">Simuler</button></div></article>';
  }).join('');
  $('pack-t').innerHTML = D.packages.map(function (k) { return '<tr><td class="nm" style="font-family:var(--f-display);font-size:15px;white-space:nowrap">' + esc(k[0]) + '</td><td style="font-family:var(--f-body);font-size:14.5px">' + esc(k[1]) + '</td><td>' + esc(PAR[k[2]].n) + '</td></tr>'; }).join('');
  $('aff-par').innerHTML = '<option value="">Toutes les parades</option>' + D.parades.map(function (p) { return '<option value="' + p.id + '">' + esc(p.n) + ' · ' + (cover[p.id] || 0) + '</option>'; }).join('');
  $('aff-sec').innerHTML = '<option value="">Tous les secteurs</option>' + D.sectors.map(function (s) { return '<option value="' + s.id + '">' + esc(s.n) + '</option>'; }).join('');
})();
function renderAff() {
  var p = $('aff-par').value, s = $('aff-sec').value;
  var list = D.low.map(function (id) { return byId[id]; }).filter(function (n) { return (!p || n.par.indexOf(p) >= 0) && (!s || n.sector === s); }).sort(function (a, b) { return b.sx - a.sx; });
  var ids = list.map(function (n) { return n.id; }).join(',');
  $('aff-cnt').textContent = list.length;
  $('aff-t').innerHTML = list.map(function (n) { return '<tr><td><span style="display:flex;gap:8px;align-items:center">' + pfb(n) + '<button class="lnk" type="button" data-open="' + n.id + '" data-list="' + ids + '" style="font-family:var(--f-body);font-size:14.5px">' + esc(n.name) + '</button></span></td><td>' + esc(SEC[n.sector].n) + '</td><td class="num">' + f1(n.sx) + '</td><td class="num">' + n.scores.wtp + '</td><td><div class="ncl">' + n.par.map(function (x) { return '<button type="button" class="nchip" data-sim="' + n.id + '|' + x + '"><span>' + esc(PAR[x].n) + (n.pm ? ' ✎' : '') + '</span></button>'; }).join('') + '</div></td><td style="font-size:11.5px;color:var(--fg-2)">' + (n.prem ? esc(byId[n.prem[0]].name) + ' · ' + n.prem[1] : '') + '</td></tr>'; }).join('') || '<tr><td colspan="6" class="empty">Aucune niche pour ce filtre.</td></tr>';
}
$('aff-par').addEventListener('change', renderAff); $('aff-sec').addEventListener('change', renderAff);
document.addEventListener('click', function (e) {
  var s = e.target.closest('#aff-t [data-sim]'); if (s) { var p = s.getAttribute('data-sim').split('|'); setSim(p[0], p[1]); $('sim').scrollIntoView(); return; }
  var f = e.target.closest('[data-pf]'); if (f) { $('aff-par').value = f.getAttribute('data-pf'); $('aff-sec').value = ''; renderAff(); $('aff-t').closest('.panel').scrollIntoView(); return; }
  var ps = e.target.closest('[data-ps]'); if (ps) { var pid = ps.getAttribute('data-ps'); var cand = D.low.map(function (id) { return byId[id]; }).filter(function (n) { return n.par.indexOf(pid) >= 0; }).sort(function (a, b) { return b.sx - a.sx; })[0] || byId[D.low[0]]; setSim(cand.id, pid); $('sim').scrollIntoView(); }
});
/* simulateur */
var SIM = { n: null, p: null, v: null };
var SR = [['n', 'Participants', 1, 30, 1, ''], ['price', 'Prix payé par participant', 0, 120, 1, ' €'], ['tp', 'Tiers payeur par séance', 0, 800, 10, ' €'], ['extra', 'Revenu additionnel par participant', 0, 40, 1, ' €'], ['hFixed', 'Hôte · fixe par séance', 0, 400, 5, ' €'], ['hHead', 'Hôte · par place', 0, 40, 1, ' €'], ['hPct', 'Hôte · part de la recette', 0, 80, 1, ' %'], ['mat', 'Matériel par participant', 0, 30, 1, ' €']];
(function () {
  var low = D.low.map(function (id) { return byId[id]; }).sort(function (a, b) { return b.sx - a.sx; });
  $('sim-n').innerHTML = low.map(function (n) { return '<option value="' + n.id + '">' + esc(n.name) + ' · ' + esc(SEC[n.sector].n) + '</option>'; }).join('');
})();
function simCtx(n) { return n.prem ? { premium: { n: byId[n.prem[0]], s: n.prem[1] } } : null; }
function setSim(nid, pid) {
  var n = byId[nid]; if (!n) return; SIM.n = n; $('sim-n').value = nid;
  var rec = n.par || [];
  $('sim-p').innerHTML = rec.map(function (p) { return '<option value="' + p + '">' + esc(PAR[p].n) + ' · recommandée</option>'; }).join('') + D.parades.filter(function (p) { return rec.indexOf(p.id) < 0; }).map(function (p) { return '<option value="' + p.id + '">' + esc(p.n) + '</option>'; }).join('');
  SIM.p = pid && PAR[pid] ? pid : rec[0] || D.parades[0].id; $('sim-p').value = SIM.p;
  SIM.v = E.simDefaults(SIM.p, n, simCtx(n)); SIM.v.hPct = Math.round(SIM.v.hPct * 100);
  $('sim-r').innerHTML = SR.map(function (r) { return '<div class="rng"><label for="sr-' + r[0] + '">' + r[1] + '</label><output id="so-' + r[0] + '" for="sr-' + r[0] + '">' + Math.round(SIM.v[r[0]]) + r[5] + '</output><input type="range" id="sr-' + r[0] + '" data-r="' + r[0] + '" min="' + r[2] + '" max="' + r[3] + '" step="' + r[4] + '" value="' + Math.round(SIM.v[r[0]]) + '"></div>'; }).join('');
  simOut();
}
function simOut() {
  var v = SIM.v, n = SIM.n, p = PAR[SIM.p];
  var r = E.simulate({ n: v.n, price: v.price, tp: v.tp, extra: v.extra, hFixed: v.hFixed, hHead: v.hHead, hPct: v.hPct / 100, mat: v.mat, venue: 0, hours: v.hours });
  var cost = v.price;
  $('sim-o').innerHTML = [['Revenu de la séance', eur(r.R), v.n + ' participants · ' + eur(v.tp) + ' de tiers payeur', 'accent'], ['Rémunération de l’hôte', eur(r.host), eur(r.hostHour) + ' de l’heure sur ' + f1(v.hours).replace(',0', '') + ' h', 'sent'], ['Marge plateforme', eur(r.margin), r.R > 0 ? Math.round(r.margin / r.R * 100) + ' % du revenu' : 'aucun revenu', r.margin >= 0 ? 'int' : 'no'], ['Coût pour le participant', eur(cost), cost === 0 ? 'gratuit pour lui' : 'contre ' + n.levels[0].price[0] + '-' + n.levels[0].price[1] + ' € seul', 'wait']].map(function (m) { return '<div><div class="k"><span class="sq" style="background:var(--' + m[3] + ')"></span>' + m[0] + '</div><div class="v big" style="color:' + (m[3] === 'no' ? 'var(--no)' : 'var(--fg)') + '">' + m[1] + '</div><div class="sub">' + m[2] + '</div></div>'; }).join('');
  var tot = Math.max(1, r.R), seg = [['Hôte', r.host, 'sent'], ['Matériel', r.mat, 'wait'], ['Frais de paiement', r.fees, 'idle'], ['Marge', Math.max(0, r.margin), 'int']];
  $('sim-split').innerHTML = seg.map(function (s) { return s[1] > 0 ? '<i style="flex:' + s[1].toFixed(2) + ';background:var(--' + s[2] + ')"></i>' : ''; }).join('');
  $('sim-leg').innerHTML = seg.map(function (s) { return '<span><i style="background:var(--' + s[2] + ')"></i>' + s[0] + ' · ' + eur(s[1]) + ' · ' + Math.round(s[1] / tot * 100) + ' %</span>'; }).join('');
  $('sim-x').innerHTML = '<p><strong>' + esc(p.n) + '.</strong> ' + esc(p.meca) + '</p><p>Qui paie : ' + esc(p.payers.join(', ')) + '. Hôte : ' + esc(p.hostPay[0]) + '.' + (r.margin < 0 ? ' Marge négative : la parade se finance ailleurs (abonnement, niche premium, acquisition).' : '') + '</p>' + (SIM.p === 'duo-premium' && n.prem ? '<p>Niche premium couplée : ' + esc(byId[n.prem[0]].name) + '.</p>' : '');
}
$('sim-r').addEventListener('input', function (e) { var k = e.target.getAttribute('data-r'); if (!k) return; SIM.v[k] = +e.target.value; var r = SR.filter(function (x) { return x[0] === k; })[0]; $('so-' + k).textContent = e.target.value + r[5]; simOut(); });
$('sim-n').addEventListener('change', function () { setSim($('sim-n').value); });
$('sim-p').addEventListener('change', function () { setSim(SIM.n.id, $('sim-p').value); });
$('sim-reset').addEventListener('click', function () { setSim(SIM.n.id, SIM.p); toast('Valeurs par défaut'); });

/* ───── mixes ───── */
var MIXRULE = { comp: 'Secteurs différents (1), même secteur (0,45), même catégorie (0,15), mêlé à la part de sens non partagés', lieu: 'Lieu commun (1), même famille de lieux (0,8), lieux compatibles (0,3 à 0,75)', moment: 'Moment commun (1), moments voisins (0,3 à 0,7)', public: 'Deux publics communs ou plus (1), un seul (0,6)', chain: 'La production de l’une nourrit l’autre : plantes puis plat, boisson puis écoute, objet puis photo', energy: 'Selon la préférence : accord, contraste ou indifférent', lever: 'Une niche de propension 2 ou moins avec une niche de 4 ou plus (1), sinon écart et moyenne', orig: 'Rareté de la paire de secteurs sur le marché (75 %) et espace concurrentiel moyen (25 %)', coh: 'Mots-clés de mix spécifiques partagés : deux ou plus (1), un (0,85). Mots d’ambiance seuls (convivial, calme, famille…) : 0,45. Sinon sens communs (0,35)' };
$('mixw-t').innerHTML = E.MIXW.map(function (w) { return '<tr><td>' + w[1] + '</td><td class="num">' + w[2] + '</td><td style="font-family:var(--f-body);font-size:14.5px">' + MIXRULE[w[0]] + '</td></tr>'; }).join('');
function opts(sel, obj, all) { $(sel).innerHTML = '<option value="">' + all + '</option>' + Object.keys(obj).map(function (k) { return '<option value="' + k + '">' + esc(obj[k]) + '</option>'; }).join(''); }
opts('mt-v', L.venues, 'Tous'); opts('mt-m', L.moments, 'Tous'); opts('mt-p', L.publics, 'Tous');
var MT = { sel: [] };
function partsHtml(p) { return '<div class="parts">' + E.MIXW.map(function (w) { var v = Math.round((p[w[0]] || 0) * 100); return '<div><span>' + w[1] + '</span><span style="text-align:right;color:var(--fg)">' + v + '</span><span class="g"><b style="width:' + v + '%"></b></span></div>'; }).join('') + '</div>'; }
function mixCard(ns, pr, label) {
  var f = E.format(ns, pr);
  return '<article class="card"><div class="chd"><div class="cf"><span>' + esc(label || D.families[f.fam]) + '</span><span>score ' + f0(pr.s) + ' · adéquation ' + f0(pr.fit) + '</span></div><div class="cn">' + esc(f.name) + '</div><div class="ncl" style="margin-top:8px">' + ns.map(function (n) { return '<button type="button" class="nchip" data-open="' + n.id + '"><span>' + esc(n.name) + '</span><span class="x">' + n.scores.wtp + '/5</span></button>'; }).join('') + '</div></div><div class="cb">' +
    '<div class="facts f3"><div><div class="k">Jauge</div><div class="v">' + f.group + ' pers.</div></div><div><div class="k">Prix</div><div class="v">' + f.price + ' €</div></div><div><div class="k">Durée</div><div class="v">' + Math.floor(f.total / 60) + ' h ' + (f.total % 60 ? f.total % 60 : '') + '</div></div></div>' +
    '<dl><dt>Quand et où</dt><dd>' + esc(L.venues[f.venue] || 'Lieu à trouver') + ' · ' + esc(L.moments[f.moment] || 'moment à définir') + (pr.publics && pr.publics.length ? ' · ' + esc(lbls(pr.publics, 'publics')) : '') + '</dd><dt>Déroulé</dt><dd><ol class="steps">' + f.steps.map(function (s) { return '<li><span class="mm">' + s[0] + ' min</span><span class="st">' + esc(s[1]) + '</span></li>'; }).join('') + '</ol></dd><dt>Hôtes</dt><dd>' + esc(f.hosts) + '</dd><dt>Pourquoi c’est original</dt><dd><ul class="whys">' + f.why.map(function (w) { return '<li>' + esc(w) + '</li>'; }).join('') + '</ul></dd></dl>' +
    '<details><summary>Composantes du score</summary>' + partsHtml(pr.p || {}) + '</details></div><div class="cft">' + pfSetBtn(ns.map(function (n) { return n.id; })) + '</div></article>';
}
function renderSel() {
  $('mt-sel').innerHTML = MT.sel.map(function (id) { var n = byId[id]; return '<button type="button" class="nchip" data-rm="' + id + '" aria-label="Retirer ' + esc(n.name) + '"><span>' + esc(n.name) + '</span><span class="x">×</span></button>'; }).join('') || '<span class="note" style="margin:0">Aucune niche choisie : le moteur cherche dans tout le catalogue selon les contraintes.</span>';
}
function runMix() {
  var v = $('mt-v').value, m = $('mt-m').value, pu = $('mt-p').value, bud = +$('mt-b').value, en = $('mt-e').value, opt = { energy: en };
  var cf = function (n) { return (!v || n.venues.indexOf(v) >= 0) && (!m || n.moments.indexOf(m) >= 0) && (!pu || n.publics.indexOf(pu) >= 0); };
  var okB = function (ns, pr) { return !bud || E.format(ns, pr).price <= bud; };
  var sel = MT.sel.map(function (id) { return byId[id]; }), out = [], t = performance.now();
  if (sel.length === 0) {
    var cand = N.filter(cf).sort(function (a, b) { return b.s1 - a.s1; }).slice(0, 160), ps = [];
    for (var i = 0; i < cand.length; i++) for (var j = i + 1; j < cand.length; j++) { if (cand[i].sector === cand[j].sector) continue; var r = E.pair(cand[i], cand[j], cand[i].s0, cand[j].s0, opt); ps.push([r, cand[i], cand[j]]); }
    ps.sort(function (a, b) { return b[0].s - a[0].s; }); var used = {};
    for (var k = 0; k < ps.length && out.length < 8; k++) { var x = ps[k]; if (used[x[1].id] || used[x[2].id] || !okB([x[1], x[2]], x[0])) continue; used[x[1].id] = used[x[2].id] = 1; out.push(mixCard([x[1], x[2]], x[0])); }
    $('mt-info').textContent = cand.length + ' niches candidates · ' + ps.length + ' paires évaluées en ' + Math.round(performance.now() - t) + ' ms';
  } else if (sel.length === 1) {
    var a = sel[0], bp = E.bestPartners(a, N.filter(cf), sOf, 60, opt, function (b) { return b.sector !== a.sector; });
    bp.filter(function (r) { return okB([a, r.b], r); }).slice(0, 8).forEach(function (r) { out.push(mixCard([a, r.b], r)); });
    $('mt-info').textContent = 'Meilleurs partenaires de ' + a.name + ' dans les autres secteurs';
  } else if (sel.length === 2) {
    var pr = E.pair(sel[0], sel[1], sel[0].s0, sel[1].s0, opt); out.push(mixCard(sel, pr, 'Format généré pour votre paire'));
    var c3 = N.filter(function (c) { return cf(c) && c.id !== sel[0].id && c.id !== sel[1].id && c.sector !== sel[0].sector && c.sector !== sel[1].sector; }).map(function (c) { return [E.triple(sel[0], sel[1], c, sOf, opt), c]; }).sort(function (a, b) { return b[0].s - a[0].s; });
    c3.filter(function (x) { return okB([sel[0], sel[1], x[1]], x[0]); }).slice(0, 5).forEach(function (x) { out.push(mixCard([sel[0], sel[1], x[1]], x[0], 'Trio suggéré')); });
    $('mt-info').textContent = 'Votre paire, puis cinq troisièmes niches possibles';
  } else {
    var tr = E.triple(sel[0], sel[1], sel[2], sOf, opt); out.push(mixCard(sel, tr, 'Format généré pour votre trio'));
    $('mt-info').textContent = 'Trio évalué';
  }
  $('mt-res').innerHTML = out.join('') || '<div class="empty">Aucun mix ne respecte ces contraintes. Relâcher le budget ou le lieu.</div>';
}
var cmb = { list: [], act: -1 };
function comboShow(q) {
  var w = norm(q).split(/\s+/).filter(Boolean), ul = $('mt-list');
  if (!w.length) { ul.classList.add('hide'); $('mt-in').setAttribute('aria-expanded', 'false'); return; }
  cmb.list = N.filter(function (n) { var nn = norm(n.name); return w.every(function (x) { return nn.indexOf(x) >= 0 || n.q.indexOf(x) >= 0; }) && MT.sel.indexOf(n.id) < 0; }).sort(function (a, b) { var x = norm(a.name).indexOf(w[0]), y = norm(b.name).indexOf(w[0]); x = x < 0 ? 999 : x; y = y < 0 ? 999 : y; return x - y || b.s1 - a.s1; }).slice(0, 10);
  cmb.act = cmb.list.length ? 0 : -1;
  ul.innerHTML = cmb.list.map(function (n, i) { return '<li role="option" id="mo-' + i + '" data-add="' + n.id + '" aria-selected="' + (i === cmb.act) + '">' + esc(n.name) + '<span>' + esc(SEC[n.sector].n) + '</span></li>'; }).join('') || '<li role="option" aria-disabled="true">Aucune niche</li>';
  ul.classList.remove('hide'); $('mt-in').setAttribute('aria-expanded', 'true');
}
function addSel(id) { if (MT.sel.length >= 3) { toast('Trois niches au plus'); return; } if (MT.sel.indexOf(id) < 0) MT.sel.push(id); $('mt-in').value = ''; comboShow(''); renderSel(); runMix(); }
$('mt-in').addEventListener('input', function (e) { comboShow(e.target.value); });
$('mt-in').addEventListener('keydown', function (e) {
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { if (!cmb.list.length) return; cmb.act = (cmb.act + (e.key === 'ArrowDown' ? 1 : -1) + cmb.list.length) % cmb.list.length; document.querySelectorAll('#mt-list li').forEach(function (li, i) { li.setAttribute('aria-selected', i === cmb.act); }); $('mt-in').setAttribute('aria-activedescendant', 'mo-' + cmb.act); e.preventDefault(); }
  else if (e.key === 'Enter') { if (cmb.act >= 0 && cmb.list[cmb.act]) { addSel(cmb.list[cmb.act].id); e.preventDefault(); } }
  else if (e.key === 'Escape') { comboShow(''); e.stopPropagation(); }
});
$('mt-list').addEventListener('mousedown', function (e) { var li = e.target.closest('[data-add]'); if (li) { e.preventDefault(); addSel(li.getAttribute('data-add')); } });
$('mt-in').addEventListener('blur', function () { setTimeout(function () { comboShow(''); }, 120); });
$('mt-sel').addEventListener('click', function (e) { var b = e.target.closest('[data-rm]'); if (b) { MT.sel = MT.sel.filter(function (x) { return x !== b.getAttribute('data-rm'); }); renderSel(); runMix(); } });
$('mt-go').addEventListener('click', runMix);
$('mt-clear').addEventListener('click', function () { MT.sel = []; ['mt-v', 'mt-m', 'mt-p'].forEach(function (s) { $(s).value = ''; }); $('mt-b').value = '0'; $('mt-e').value = 'indifferent'; renderSel(); runMix(); });
['mt-v', 'mt-m', 'mt-p', 'mt-b', 'mt-e'].forEach(function (s) { $(s).addEventListener('change', runMix); });
/* sélection éditoriale */
var EDF = '';
(function () {
  var fams = {}; D.editorial.forEach(function (m) { fams[m.fam] = (fams[m.fam] || 0) + 1; });
  $('ed-fam').innerHTML = '<button type="button" data-ef="" aria-pressed="true">Toutes · ' + D.editorial.length + '</button>' + Object.keys(D.families).filter(function (k) { return fams[k]; }).map(function (k) { return '<button type="button" data-ef="' + k + '" aria-pressed="false">' + D.families[k] + ' · ' + fams[k] + '</button>'; }).join('');
  $('ed-fam').addEventListener('click', function (e) { var b = e.target.closest('[data-ef]'); if (!b) return; EDF = b.getAttribute('data-ef'); $('ed-fam').querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', x === b); }); renderEd(); });
})();
function renderEd() {
  $('ed-cards').innerHTML = D.editorial.filter(function (m) { return !EDF || m.fam === EDF; }).slice().sort(function (a, b) { return b.s - a.s; }).map(function (m) {
    var ns = m.n.map(function (id) { return byId[id]; });
    return '<article class="card"><div class="chd"><div class="cf"><span>' + esc(D.families[m.fam]) + '</span><span>score moteur ' + m.s + '</span></div><div class="cn">' + esc(m.name) + '</div><div class="ctag">' + esc(m.pitch) + '</div><div class="ncl" style="margin-top:8px">' + ns.map(function (n) { return '<button type="button" class="nchip" data-open="' + n.id + '"><span>' + esc(n.name) + '</span><span class="x">' + n.scores.wtp + '/5</span></button>'; }).join('') + '</div></div><div class="cb">' +
      '<div class="facts f2"><div><div class="k">Jauge</div><div class="v">' + esc(m.group) + (/^\d/.test(m.group) && !/pers|duo|famil|enfant/.test(m.group) ? ' pers.' : '') + '</div></div><div><div class="k">Prix</div><div class="v wrap">' + esc(m.price) + '</div></div></div>' +
      '<dl><dt>Quand et où</dt><dd>' + esc(m.moment) + ' · ' + esc(m.venue) + '</dd><dt>Déroulé</dt><dd><ol class="steps">' + m.steps.map(function (s) { return '<li><span class="mm">' + s[0] + ' min</span><span class="st">' + esc(s[1]) + '</span></li>'; }).join('') + '</ol></dd><dt>Hôtes</dt><dd>' + esc(m.hosts) + '</dd><dt>Pourquoi c’est original</dt><dd>' + esc(m.why) + '</dd></dl></div>' +
      '<div class="cft"><button class="btn sm" type="button" data-edmix="' + m.n.join('|') + '">Explorer dans l’outil</button>' + pfSetBtn(m.n, 'ghost') + '</div></article>';
  }).join('');
}
document.addEventListener('click', function (e) { var b = e.target.closest('[data-edmix]'); if (b) { MT.sel = b.getAttribute('data-edmix').split('|'); renderSel(); runMix(); $('mt').scrollIntoView(); } });
function renderTopPairs() {
  $('tp-t').innerHTML = D.topPairs.map(function (p) { var a = byId[p[1]], b = byId[p[2]]; var r = E.pair(a, b, a.s0, b.s0, {}); var f = E.format([a, b], r); return '<tr><td class="num">' + f0(p[0]) + '</td><td><span style="font-family:var(--f-body);font-size:14.5px">' + esc(f.name) + '</span><div class="note" style="margin:0">' + esc(D.families[f.fam]) + ' · ' + esc(f.why[0] || '') + '</div></td><td>' + esc(L.venues[f.venue] || '') + '</td><td class="num">' + f.price + ' €</td><td><button class="btn sm" type="button" data-edmix="' + a.id + '|' + b.id + '">Ouvrir</button></td></tr>'; }).join('');
}

/* ───── portefeuilles et géographie ───── */
function renderPf() {
  var pf = D.portfolios, geo = D.geo;
  $('pf-reco').innerHTML = '<div class="callout reco"><div class="ct">Recommandation calculée</div><div class="prose"><p>Lancer <strong>' + esc(pf[0].n) + '</strong> en cœur et <strong>' + esc(pf[1].n) + '</strong> en complément. ' + esc(D.pfNote || '') + '</p></div></div>';
  $('pfs').innerHTML = pf.map(function (p, i) {
    var ids = p.niches.join(','), g = geo.per.filter(function (x) { return x.id === p.id; })[0];
    return '<article class="card' + (i < 2 ? ' rec' : '') + '"><div class="chd"><div class="cf"><span>' + (i < 2 ? (i === 0 ? 'Recommandé · cœur' : 'Recommandé · complément') : 'Candidat ' + (i + 1)) + '</span><span>note ' + f1(p.m.total) + '</span></div><div class="cn">' + esc(p.n) + '</div><div class="ctag">' + esc(p.tag) + '</div></div><div class="cb">' +
      '<div class="facts"><div><div class="k">Score</div><div class="v">' + f1(p.m.s) + '</div></div><div><div class="k">Parades</div><div class="v">' + f1(p.m.s1) + '</div></div><div><div class="k">Mix</div><div class="v">' + f1(p.m.mix) + '</div></div><div><div class="k">Vivier</div><div class="v">' + f1(p.m.sup) + '</div></div></div>' +
      '<ul class="pfl">' + p.niches.map(function (id) { var n = byId[id]; return '<li><button type="button" data-open="' + id + '" data-list="' + ids + '"><span class="nn">' + esc(n.name) + (n.par ? ' <span class="tag t-E">parade</span>' : '') + '<br><span style="font-family:var(--f-mono);font-size:11px;color:var(--fg-3)">' + esc(SEC[n.sector].n) + '</span></span><span class="num">' + f1(n.s1) + '</span></button></li>'; }).join('') + '</ul>' +
      '<dl><dt>Mixes signature</dt><dd><ul class="whys">' + p.pairs.slice(0, 2).map(function (x) { var a = byId[x[1]], b = byId[x[2]]; return '<li>' + esc(E.format([a, b], E.pair(a, b, a.s0, b.s0, {})).name) + ' · ' + x[0] + '</li>'; }).join('') + p.ed.map(function (id) { var m = D.editorial.filter(function (e) { return e.id === id; })[0]; return m ? '<li>' + esc(m.name) + ' (sélection éditoriale)</li>' : ''; }).join('') + '</ul></dd>' +
      '<dt>Lieux dominants</dt><dd>' + esc(lbls(p.venues, 'venues')) + '</dd><dt>Où commencer</dt><dd>' + (g ? g.top.slice(0, 3).map(function (t) { return t[0] + ' (' + t[1] + ')'; }).join(', ') : '') + '</dd><dt>Pourquoi</dt><dd>' + esc(p.desc) + '</dd><dt>Risques</dt><dd>' + esc(p.risk) + '</dd></dl></div><div class="cft">' + pfSetBtn(p.niches) + '<button type="button" class="btn sm ghost" data-pfcopy="' + p.id + '">Copier en portefeuille</button></div></article>';
  }).join('');
  var rowsBy = {}; geo.rows.forEach(function (r) { rowsBy[r.a] = r; });
  $('geo-top').innerHTML = pf.slice(0, 2).map(function (p) { var g = geo.per.filter(function (x) { return x.id === p.id; })[0]; return '<article class="card rec"><div class="chd"><div class="cf"><span>' + esc(p.n) + '</span><span>adéquation sur 100</span></div><div class="cn">Arrondissements prioritaires</div></div><div class="cb"><ol class="steps">' + g.top.map(function (t) { return '<li><span class="mm">' + t[0] + '</span><span class="st">' + esc(rowsBy[t[0]].q) + ' · ' + t[1] + '</span></li>'; }).join('') + '</ol></div></article>'; }).join('');
  var dots = function (v) { return '<span class="dots" aria-label="' + v + ' sur 3">' + [1, 2, 3].map(function (k) { return '<i' + (k <= v ? ' class="on"' : '') + '></i>'; }).join('') + '</span>'; };
  $('geo-t').innerHTML = '<thead><tr><th>Arr.</th><th>Repères</th>' + geo.crit.map(function (c) { return '<th style="white-space:normal;min-width:84px;vertical-align:bottom">' + esc(c) + '</th>'; }).join('') + pf.map(function (p) { return '<th class="num" style="white-space:normal;min-width:80px;vertical-align:bottom">' + esc(p.n) + '</th>'; }).join('') + '</tr></thead><tbody>' +
    geo.rows.map(function (r) { return '<tr><td>' + r.a + '</td><td style="font-family:var(--f-body);font-size:14px;min-width:180px">' + esc(r.q) + '</td>' + r.v.map(function (v) { return '<td>' + dots(v) + '</td>'; }).join('') + pf.map(function (p, i) { var g = geo.per.filter(function (x) { return x.id === p.id; })[0]; var s = g.all[r.a], top = g.top.some(function (t) { return t[0] === r.a; }); return '<td class="num" style="' + (top ? 'color:var(--int);font-weight:500' : '') + '">' + s + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody>';
  $('villes-t').innerHTML = D.villes.map(function (v) { return '<tr><td class="nm" style="font-family:var(--f-display);font-size:15px">' + v[0] + '</td><td>' + dots(v[1]) + '</td><td>' + dots(v[2]) + '</td><td>' + dots(v[3]) + '</td><td style="font-family:var(--f-body);font-size:14px">' + esc(v[4]) + '</td></tr>'; }).join('');
}
$('limits').innerHTML = '<ul>' + (D.limits || []).map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul>';
$('srcl').innerHTML = D.sources.map(function (s) { var link = /^https?:/.test(s.u) ? '<a href="' + esc(s.u) + '" target="_blank" rel="noopener noreferrer">' + esc(s.u.replace(/^https?:\/\//, '').slice(0, 90)) + (s.u.length > 98 ? '…' : '') + '</a>' : esc(s.u); return '<li id="src-' + s.i + '"><span class="i">' + s.i + '</span><div><div class="st">' + esc(s.t) + ' ' + (s.v ? '<span class="tag t-E">attribution à vérifier</span>' : '') + '</div><div class="se">' + esc(s.e) + ' · consulté en nov. 2026 · ' + link + '</div></div></li>'; }).join('');

/* ───── sommaire actif ───── */
(function () {
  var links = document.querySelectorAll('.toc a'), map = {};
  links.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
  if (!('IntersectionObserver' in window)) return;
  var io = new IntersectionObserver(function (ents) {
    ents.forEach(function (en) { if (en.isIntersecting) { links.forEach(function (a) { a.classList.remove('on'); a.removeAttribute('aria-current'); }); var a = map[en.target.id]; if (a) { a.classList.add('on'); a.setAttribute('aria-current', 'true'); if (window.innerWidth <= 900) { var ol = a.closest('ol'); ol.scrollLeft = a.offsetLeft - 20; } } } });
  }, { rootMargin: '-30% 0px -60% 0px' });
  document.querySelectorAll('main section.s').forEach(function (s) { io.observe(s); });
})();

function refreshScores() { renderX(); renderTop(); renderSectors(); }
pfInit();
renderX(); renderTop(); renderSectors();
window.__firstRender = Math.round(performance.now() - T0);
var idle = window.requestIdleCallback || function (f) { return setTimeout(f, 30); };
idle(function () { renderAff(); setSim(D.low[0] ? byId[D.low.slice().sort(function (a, b) { return byId[b].sx - byId[a].sx; })[0]].id : N[0].id); renderEd(); renderTopPairs(); renderPf(); renderSel(); runMix(); renderMy(); window.__ready = Math.round(performance.now() - T0); });
})();
