/* Mon portefeuille : modèle d'état pur (sans DOM) de l'étude des niches v2.
   Requalifications par niche (verdict, priorité, étiquettes, note, paliers), portefeuilles nommés,
   document compact (écarts avec l'étude seulement), import, exports CSV et JSON, synthèse.
   Embarqué tel quel dans niches.html (window.MYPF) et testable sous Node (module.exports). */
(function (root) {
'use strict';
var M = {};
M.KEY = 'niches-v2.portefeuilles';
M.FORMAT = 'niches-v2.portefeuilles';
M.VERDICTS = ['prioritaire', 'a-tester', 'plus-tard', 'ecarter'];
M.ALL_LV = [1, 2, 3, 4, 5];
M.MAX_TAGS = 12; M.MAX_TAG = 40; M.MAX_NOTE = 2000; M.MAX_PF = 40; M.MAX_NAME = 60;
M.DEFAULT_NAME = 'Mon portefeuille';

function str(s) { return typeof s === 'string' ? s : s == null ? '' : String(s); }
function clean(s, max) { return str(s).replace(/[\u0000-\u001f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max); }
M.cleanTag = function (t) { return clean(t, M.MAX_TAG); };
M.cleanName = function (t) { return clean(t, M.MAX_NAME); };
function uniqTags(list) {
  var seen = {}, out = [];
  (Array.isArray(list) ? list : []).forEach(function (t) { t = M.cleanTag(t); var k = t.toLowerCase(); if (t && !seen[k] && out.length < M.MAX_TAGS) { seen[k] = 1; out.push(t); } });
  return out;
}
function lvList(l) {
  var o = []; (Array.isArray(l) ? l : []).forEach(function (x) { x = +x; if (x >= 1 && x <= 5 && o.indexOf(x) < 0) o.push(x); });
  return o.sort();
}
function sameLv(a) { return a.length === 5; }

M.empty = function () { return { v: 1, ov: {}, pfs: [{ id: 'p1', name: M.DEFAULT_NAME, ids: [] }], cur: 'p1', mode: 'mine' }; };

/* Normalise une saisie quelconque (document stocké, import) ; known : dictionnaire des ids connus (facultatif). */
M.normalize = function (raw, known) {
  var s = M.empty(), unknown = {};
  if (!raw || typeof raw !== 'object') return s;
  var ok = function (id) { if (typeof id !== 'string' || !id) return false; if (known && !known[id]) { unknown[id] = 1; return false; } return true; };
  var ov = raw.ov && typeof raw.ov === 'object' ? raw.ov : {};
  Object.keys(ov).forEach(function (id) {
    if (!ok(id)) return; var o = ov[id] || {}, r = {};
    if (M.VERDICTS.indexOf(o.v) >= 0) r.v = o.v;
    if (o.p === 1 || o.p === 2 || o.p === 3) r.p = o.p;
    var t = uniqTags(o.t); if (t.length) r.t = t;
    var nt = str(o.note).slice(0, M.MAX_NOTE); if (nt.trim()) r.note = nt;
    if (Array.isArray(o.lv)) { var l = lvList(o.lv); if (l.length && !sameLv(l)) r.lv = l; }
    if (Object.keys(r).length) s.ov[id] = r;
  });
  var pfs = Array.isArray(raw.pfs) ? raw.pfs : [];
  var used = {};
  var list = [];
  pfs.slice(0, M.MAX_PF).forEach(function (p, i) {
    if (!p || typeof p !== 'object') return;
    var id = typeof p.id === 'string' && /^[a-z0-9_-]{1,24}$/i.test(p.id) && !used[p.id] ? p.id : null;
    if (!id) { var k = i + 1; while (used['p' + k]) k++; id = 'p' + k; }
    used[id] = 1;
    var seen = {}, ids = [];
    (Array.isArray(p.ids) ? p.ids : []).forEach(function (x) { if (ok(x) && !seen[x]) { seen[x] = 1; ids.push(x); } });
    list.push({ id: id, name: M.cleanName(p.name) || ('Portefeuille ' + (list.length + 1)), ids: ids });
  });
  if (list.length) s.pfs = list;
  s.cur = s.pfs.some(function (p) { return p.id === raw.cur; }) ? raw.cur : s.pfs[0].id;
  s.mode = raw.mode === 'study' ? 'study' : 'mine';
  s.unknown = Object.keys(unknown);
  return s;
};

/* Document compact : uniquement les écarts avec l'étude et les sélections. Clés triées pour une comparaison stable. */
M.compact = function (s) {
  var ov = {};
  Object.keys(s.ov).sort().forEach(function (id) {
    var o = s.ov[id], r = {};
    if (o.v) r.v = o.v; if (o.p) r.p = o.p; if (o.t && o.t.length) r.t = o.t.slice(); if (o.note && o.note.trim()) r.note = o.note; if (o.lv && !sameLv(o.lv)) r.lv = o.lv.slice();
    if (Object.keys(r).length) ov[id] = r;
  });
  return { v: 1, cur: s.cur, mode: s.mode, pfs: s.pfs.map(function (p) { return { id: p.id, name: p.name, ids: p.ids.slice() }; }), ov: ov };
};
M.key = function (s) { return JSON.stringify(M.compact(s)); };
M.isEmpty = function (s) { return !Object.keys(s.ov).length && s.pfs.every(function (p) { return !p.ids.length; }) && s.pfs.length === 1; };

/* portefeuilles */
M.cur = function (s) { for (var i = 0; i < s.pfs.length; i++) if (s.pfs[i].id === s.cur) return s.pfs[i]; return s.pfs[0]; };
M.newId = function (s) { var k = s.pfs.length + 1; while (s.pfs.some(function (p) { return p.id === 'p' + k; })) k++; return 'p' + k; };
M.uniqueName = function (s, base, skipId) {
  base = M.cleanName(base) || 'Portefeuille'; var n = base, k = 2;
  var taken = function (x) { return s.pfs.some(function (p) { return p.id !== skipId && p.name.toLowerCase() === x.toLowerCase(); }); };
  while (taken(n)) n = base + ' ' + (k++);
  return n;
};
M.create = function (s, name, ids) {
  if (s.pfs.length >= M.MAX_PF) return null;
  var p = { id: M.newId(s), name: M.uniqueName(s, name || 'Portefeuille ' + (s.pfs.length + 1)), ids: (ids || []).slice() };
  s.pfs.push(p); s.cur = p.id; return p;
};
M.duplicate = function (s, id) { var src = s.pfs.filter(function (p) { return p.id === id; })[0] || M.cur(s); return M.create(s, src.name + ' (copie)', src.ids); };
M.rename = function (s, id, name) { var p = s.pfs.filter(function (x) { return x.id === id; })[0]; name = M.cleanName(name); if (!p || !name) return false; p.name = M.uniqueName(s, name, id); return true; };
M.remove = function (s, id) {
  s.pfs = s.pfs.filter(function (p) { return p.id !== id; });
  if (!s.pfs.length) s.pfs.push({ id: 'p1', name: M.DEFAULT_NAME, ids: [] });
  if (!s.pfs.some(function (p) { return p.id === s.cur; })) s.cur = s.pfs[0].id;
};
M.has = function (s, id) { return M.cur(s).ids.indexOf(id) >= 0; };
M.add = function (s, ids) { var p = M.cur(s), n = 0; ids.forEach(function (id) { if (p.ids.indexOf(id) < 0) { p.ids.push(id); n++; } }); return n; };
M.drop = function (s, ids) { var p = M.cur(s), b = p.ids.length; p.ids = p.ids.filter(function (x) { return ids.indexOf(x) < 0; }); return b - p.ids.length; };
M.toggle = function (s, id) { if (M.has(s, id)) { M.drop(s, [id]); return false; } M.add(s, [id]); return true; };
M.inAny = function (s, id) { return s.pfs.filter(function (p) { return p.ids.indexOf(id) >= 0; }).map(function (p) { return p.name; }); };

/* requalifications */
M.get = function (s, id) { return s.ov[id] || {}; };
M.set = function (s, id, k, val, studyVerdict) {
  var o = Object.assign({}, s.ov[id] || {});
  if (k === 'v') { if (M.VERDICTS.indexOf(val) < 0 || val === studyVerdict) delete o.v; else o.v = val; }
  else if (k === 'p') { if (val === 1 || val === 2 || val === 3) o.p = val; else delete o.p; }
  else if (k === 't') { var t = uniqTags(val); if (t.length) o.t = t; else delete o.t; }
  else if (k === 'note') { var nt = str(val).slice(0, M.MAX_NOTE); if (nt.trim()) o.note = nt; else delete o.note; }
  else if (k === 'lv') { var l = lvList(val); if (!l.length || sameLv(l)) delete o.lv; else o.lv = l; }
  if (Object.keys(o).length) s.ov[id] = o; else delete s.ov[id];
};
M.reset = function (s, id, k) { if (!s.ov[id]) return; if (!k) { delete s.ov[id]; return; } var o = Object.assign({}, s.ov[id]); delete o[k]; if (Object.keys(o).length) s.ov[id] = o; else delete s.ov[id]; };
M.verdict = function (s, n) { var o = s.ov[n.id]; return o && o.v || n.verdict; };
M.levels = function (s, id) { var o = s.ov[id]; return o && o.lv ? o.lv : M.ALL_LV; };
M.allTags = function (s) { var c = {}; Object.keys(s.ov).forEach(function (id) { (s.ov[id].t || []).forEach(function (t) { c[t] = (c[t] || 0) + 1; }); }); return Object.keys(c).sort(function (a, b) { return c[b] - c[a] || a.localeCompare(b); }); };

/* import */
M.parseImport = function (text, known) {
  var raw; try { raw = JSON.parse(text); } catch (e) { return { ok: false, err: 'Fichier illisible : JSON invalide' }; }
  if (!raw || typeof raw !== 'object' || (!Array.isArray(raw.pfs) && !raw.ov)) return { ok: false, err: 'Ce fichier n’est pas un export de portefeuilles' };
  if (raw.format && raw.format !== M.FORMAT) return { ok: false, err: 'Format inconnu : ' + clean(raw.format, 60) };
  var st = M.normalize(raw, known);
  if (!Array.isArray(raw.pfs) || !raw.pfs.length) st.pfs = [];
  return { ok: true, state: st, stats: { pfs: st.pfs.map(function (p) { return [p.name, p.ids.length]; }), ov: Object.keys(st.ov).length, unknown: st.unknown.length } };
};
M.merge = function (s, imp) {
  var out = JSON.parse(JSON.stringify(M.compact(s)));
  out = M.normalize(out);
  Object.keys(imp.ov).forEach(function (id) {
    var a = out.ov[id] || {}, b = imp.ov[id], r = Object.assign({}, a, b);
    if (a.t || b.t) r.t = uniqTags((a.t || []).concat(b.t || []));
    if (a.note && b.note && a.note !== b.note && a.note.indexOf(b.note) < 0) r.note = (a.note + '\n' + b.note).slice(0, M.MAX_NOTE);
    out.ov[id] = r;
  });
  imp.pfs.forEach(function (p) {
    var q = out.pfs.filter(function (x) { return x.name.toLowerCase() === p.name.toLowerCase(); })[0];
    if (q) p.ids.forEach(function (id) { if (q.ids.indexOf(id) < 0) q.ids.push(id); });
    else if (out.pfs.length < M.MAX_PF) out.pfs.push({ id: M.newId(out), name: p.name, ids: p.ids.slice() });
  });
  /* un portefeuille par défaut vide est remplacé par les portefeuilles importés */
  if (out.pfs.length > 1 && out.pfs[0].name === M.DEFAULT_NAME && !out.pfs[0].ids.length && imp.pfs.length) { out.pfs.shift(); if (!out.pfs.some(function (p) { return p.id === out.cur; })) out.cur = out.pfs[0].id; }
  return out;
};
M.replace = function (s, imp) { var out = M.normalize(M.compact(imp)); if (!imp.pfs.length) { out.pfs = M.empty().pfs; out.cur = 'p1'; } out.mode = s.mode; return out; };

/* exports */
var q = function (v) { return '"' + str(v).replace(/"/g, '""') + '"'; };
var dec = function (x) { return (Math.round(x * 10) / 10).toFixed(1).replace('.', ','); };
M.slug = function (s) { return str(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50) || 'portefeuille'; };
M.json = function (s, ctx) {
  var c = M.compact(s), names = {};
  c.pfs.forEach(function (p) { p.ids.forEach(function (id) { names[id] = ctx.byId[id] ? ctx.byId[id].name : id; }); });
  Object.keys(c.ov).forEach(function (id) { names[id] = ctx.byId[id] ? ctx.byId[id].name : id; });
  return JSON.stringify({ format: M.FORMAT, version: 1, exported: ctx.now || new Date().toISOString(), study: ctx.study || '', cur: c.cur, mode: c.mode, pfs: c.pfs, ov: c.ov, names: names }, null, 2);
};
function lvTxt(n, lvs) { return lvs.map(function (k) { var l = n.levels[k - 1]; return 'N' + k + ' ' + l.title + ' (' + l.price[0] + '-' + l.price[1] + ' €)'; }).join(' | '); }
function rowCommon(s, n, ctx) {
  var o = M.get(s, n.id), L = ctx.LBL, lvs = M.levels(s, n.id);
  return {
    head: [n.id, q(ctx.SEC[n.sector].n), q((ctx.CAT[n.category] || {}).name), q((ctx.SUB[n.subcategory] || {}).name), q(n.name), n.verdict, M.verdict(s, n), o.p ? 'P' + o.p : '', q((o.t || []).join(', ')), q(o.note || ''), q(lvTxt(n, lvs))],
    tail: ctx.KEYS.map(function (k) { return String(n.scores[k]).replace('.', ','); }).concat([dec(n.s0), dec(n.s1), q((n.par || []).map(function (p) { return ctx.PAR[p].n; }).join(', ')), q(n.venues.map(function (v) { return L.venues[v] || v; }).join(', ')), q(n.moments.map(function (v) { return L.moments[v] || v; }).join(', ')), q(n.publics.map(function (v) { return L.publics[v] || v; }).join(', '))])
  };
}
var HEAD = ['id', 'secteur', 'categorie', 'sous_categorie', 'niche', 'verdict_etude', 'mon_verdict', 'priorite', 'etiquettes', 'note', 'paliers_retenus'];
function tailHead(ctx) { return ctx.KEYS.map(function (k) { return 'note_' + k; }).concat(['score', 'score_total_parades', 'parade_recommandee', 'lieux', 'moments', 'publics']); }
M.csv = function (s, pfId, ctx) {
  var p = s.pfs.filter(function (x) { return x.id === pfId; })[0] || M.cur(s);
  var rows = [HEAD.concat(tailHead(ctx)).join(';')];
  p.ids.forEach(function (id) { var n = ctx.byId[id]; if (!n) return; var r = rowCommon(s, n, ctx); rows.push(r.head.concat(r.tail).join(';')); });
  return '﻿' + rows.join('\n');
};
M.csvBase = function (s, ctx) {
  var rows = [HEAD.concat(['requalifiee', 'portefeuilles']).concat(tailHead(ctx)).join(';')];
  ctx.N.forEach(function (n) { var r = rowCommon(s, n, ctx); rows.push(r.head.concat([s.ov[n.id] ? 'oui' : 'non', q(M.inAny(s, n.id).join(', '))]).concat(r.tail).join(';')); });
  return '﻿' + rows.join('\n');
};

/* synthèse d'un portefeuille : ctx = { byId, sectors, ENG, editorial, studyPfs } */
M.synth = function (s, ids, ctx) {
  var L = ids.map(function (id) { return ctx.byId[id]; }).filter(Boolean), k = L.length || 1, E = ctx.ENG;
  var cnt = function (key) { var c = {}; L.forEach(function (n) { n[key].forEach(function (v) { c[v] = (c[v] || 0) + 1; }); }); return Object.keys(c).map(function (x) { return [x, c[x]]; }).sort(function (a, b) { return b[1] - a[1] || a[0].localeCompare(b[0]); }); };
  var sec = {}; L.forEach(function (n) { sec[n.sector] = (sec[n.sector] || 0) + 1; });
  var vc = { prioritaire: 0, 'a-tester': 0, 'plus-tard': 0, ecarter: 0 }, pc = { 1: 0, 2: 0, 3: 0 };
  L.forEach(function (n) { vc[M.verdict(s, n)]++; var o = s.ov[n.id]; if (o && o.p) pc[o.p]++; });
  var lv = [1, 2, 3, 4, 5].map(function (j) {
    var with_ = L.filter(function (n) { return M.levels(s, n.id).indexOf(j) >= 0; });
    var mids = with_.map(function (n) { return E.mid(n.levels[j - 1].price); });
    return { k: j, n: with_.length, mean: mids.length ? mids.reduce(function (a, b) { return a + b; }, 0) / mids.length : 0,
      lo: with_.length ? Math.min.apply(null, with_.map(function (n) { return n.levels[j - 1].price[0]; })) : 0,
      hi: with_.length ? Math.max.apply(null, with_.map(function (n) { return n.levels[j - 1].price[1]; })) : 0,
      hostLevel: j < 5 ? j + 1 : 'référent', hosts: with_.length };
  });
  /* minimum : un seul hôte par niche, du niveau requis par le palier le plus haut retenu (règle n → n-1, « au moins ») */
  var minH = {}; L.forEach(function (n) { var m = Math.max.apply(null, M.levels(s, n.id)); var lvl = m < 5 ? m + 1 : 'référent'; minH[lvl] = (minH[lvl] || 0) + 1; });
  /* mixes internes : paires de secteurs différents, 80 meilleures niches au plus */
  var pool = L.slice().sort(function (a, b) { return b.s1 - a.s1; }).slice(0, 80), pairs = [];
  for (var i = 0; i < pool.length; i++) for (var j = i + 1; j < pool.length; j++) { if (pool[i].sector === pool[j].sector) continue; var r = E.pair(pool[i], pool[j], pool[i].s0, pool[j].s0, {}); pairs.push([r.s, pool[i].id, pool[j].id, r]); }
  pairs.sort(function (a, b) { return b[0] - a[0]; });
  var used = {}, mixes = [];
  for (var x = 0; x < pairs.length && mixes.length < 6; x++) { var pp = pairs[x]; if ((used[pp[1]] || 0) >= 2 || (used[pp[2]] || 0) >= 2) continue; used[pp[1]] = (used[pp[1]] || 0) + 1; used[pp[2]] = (used[pp[2]] || 0) + 1; mixes.push(pp); }
  var has = {}; L.forEach(function (n) { has[n.id] = 1; });
  var ed = (ctx.editorial || []).filter(function (m) { return m.n.filter(function (id) { return has[id]; }).length >= 2; }).map(function (m) { return { m: m, all: m.n.every(function (id) { return has[id]; }) }; });
  var cmp = (ctx.studyPfs || []).map(function (p) { var common = p.niches.filter(function (id) { return has[id]; }); return { p: p, common: common, share: p.niches.length ? common.length / p.niches.length : 0 }; });
  return {
    n: L.length, list: L, sec: sec, nSec: Object.keys(sec).length, missing: ctx.sectors.filter(function (x) { return !sec[x.id]; }).map(function (x) { return x.id; }),
    venues: cnt('venues'), moments: cnt('moments'), publics: cnt('publics'), vc: vc, pc: pc,
    wtp: L.reduce(function (a, n) { return a + n.scores.wtp; }, 0) / k, wEff: L.reduce(function (a, n) { return a + (n.wEff || n.scores.wtp); }, 0) / k,
    par: L.filter(function (n) { return n.par; }).length, s1: L.reduce(function (a, n) { return a + n.s1; }, 0) / k,
    lv: lv, minHosts: minH, hostsTotal: lv.reduce(function (a, l) { return a + l.hosts; }, 0), pairsN: pairs.length, mixes: mixes, ed: ed, cmp: cmp
  };
};

if (typeof module !== 'undefined' && module.exports) module.exports = M; else root.MYPF = M;
})(this);
