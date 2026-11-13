/* Construction de l'étude des niches v2 : lit data/*.json (repli sur fixtures/ si un secteur manque),
   calcule scores, parades, mixes, portefeuilles et géographie, puis écrit docs/niches.html.
   Usage : node docs/_niches/build.js */
'use strict';
const fs = require('fs'), path = require('path');
const T0 = Date.now();
const E = require('./lib/engine.js');
const SEC = require('./lib/sectors.js'), SRC = require('./lib/sources.js');
const PAR = require('./lib/parades.js'), MIX = require('./lib/mixes.js'), STR = require('./lib/strategy.js');
const DIR = path.join(__dirname, 'data'), FIX = path.join(__dirname, 'fixtures');
const OUT = path.join(__dirname, '..', 'niches.html');
const err = m => { console.error('ERR', m); process.exitCode = 1; };
const srcIdx = {}; SRC.forEach((s, i) => srcIdx[s[0]] = i + 1);

/* 1. données */
const fixtureSectors = [];
const sectors = SEC.map(s => {
  let f = path.join(DIR, s.id + '.json'); if (!fs.existsSync(f)) { f = path.join(FIX, s.id + '.json'); fixtureSectors.push(s.id); }
  const d = JSON.parse(fs.readFileSync(f, 'utf8'));
  return { s, d };
});
if (fixtureSectors.length) console.warn('Secteurs en données factices :', fixtureSectors.join(', '));
const niches = [], cats = [], subs = [];
sectors.forEach(({ s, d }) => {
  d.categories.forEach(c => { cats.push({ id: c.id, sec: s.id, name: c.name, desc: c.desc || '' }); c.subcategories.forEach(sc => subs.push({ id: sc.id, cat: c.id, sec: s.id, name: sc.name, desc: sc.desc || '' })); });
  d.niches.forEach(n => niches.push(n));
});
/* corrections marginales signalées (voir lib/strategy.js · fixes) */
const byId = {}; niches.forEach(n => byId[n.id] = n);
(STR.fixes || []).forEach(([id, field, val, note]) => { const n = byId[id]; if (!n) return; const ks = field.split('.'); let o = n; while (ks.length > 1) o = o[ks.shift()]; o[ks[0]] = val; console.log('correction', id, field, '·', note); });

/* 1 bis. harmonisation du calibrage entre lots (documentée dans la méthode)
   a) cohérence réglementaire : le score « regulatory » est plafonné selon le champ « regulated »
   b) recentrage partiel par secteur (50 %) des quatre critères de jugement les plus sensibles au lot :
      format, supply, community, hostIncome. L'ordre interne d'un secteur est conservé, la moitié de l'écart entre secteurs aussi. */
const REGCAP = { sport: 2, sante: 3, alcool: 3, enfants: 3, securite: 3, droit: 3, alimentaire: 4, animaux: 4 };
const HARM = ['format', 'supply', 'community', 'hostIncome'], SHRINK = 0.5;
const harm = { reg: 0, shift: {} };
niches.forEach(n => { n.raw = Object.assign({}, n.scores); const c = REGCAP[n.regulated]; if (c != null && n.scores.regulatory > c) { n.scores.regulatory = c; harm.reg++; } });
HARM.forEach(k => {
  const g = niches.reduce((a, n) => a + n.scores[k], 0) / niches.length; harm.shift[k] = {};
  SEC.forEach(s => { const L = niches.filter(n => n.sector === s.id); if (!L.length) return; const m = L.reduce((a, n) => a + n.scores[k], 0) / L.length; const d = -SHRINK * (m - g); harm.shift[k][s.id] = +d.toFixed(2);
    L.forEach(n => { n.scores[k] = Math.max(0, Math.min(5, Math.round((n.scores[k] + d) * 10) / 10)); }); });
});
console.log('harmonisation : regulatory plafonné sur', harm.reg, 'niches · décalages', JSON.stringify(harm.shift));
/* 1 ter. quasi-doublons entre lots (noms proches dans deux secteurs) : signalés, et jamais réunis dans un portefeuille */
const STOP = new Set('pour avec dans des les une son ses sur par aux debutant debutants bases premiers premier premiere initiation decouverte maison'.split(' '));
const toks = n => new Set(n.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').split(/[^a-z0-9]+/).filter(w => w.length >= 4 && !STOP.has(w)));
niches.forEach(n => n.tk = toks(n));
const dups = [];
for (let i = 0; i < niches.length; i++) for (let j = i + 1; j < niches.length; j++) {
  const a = niches[i], b = niches[j]; if (a.sector === b.sector) continue;
  let c = 0; a.tk.forEach(w => { if (b.tk.has(w)) c++; }); const u = a.tk.size + b.tk.size - c;
  if (c >= 1 && u && c / u >= 0.5) { dups.push([a.id, b.id]); (a.dup = a.dup || []).push(b.id); (b.dup = b.dup || []).push(a.id); }
}
console.log('quasi-doublons entre secteurs', dups.length);
/* 2. scores */
const W = E.W0;
niches.forEach(n => { n.s0 = E.score(n.scores, W); n.sx = E.scoreNoWtp(n.scores, W); });
const rank = niches.slice().sort((a, b) => b.s0 - a.s0 || a.name.localeCompare(b.name));
rank.forEach((n, i) => n.r0 = i + 1);
const sOf = n => n.s0;

/* 3. parades */
const sxs = niches.map(n => n.sx).sort((a, b) => a - b); E.LOW_MIN = Math.round(sxs[Math.floor(sxs.length / 2)]);
console.log('seuil hors propension (médiane)', E.LOW_MIN);
const low = niches.filter(n => E.isLow(n, W));
const premiums = niches.filter(n => n.scores.wtp >= 4);
const parIds = PAR.parades.map(p => p.id), parById = {}; PAR.parades.forEach(p => parById[p.id] = p);
const manual = STR.manualParades || {};
low.forEach(n => {
  const best = E.bestPartners(n, premiums, sOf, 1, {})[0];
  const ctx = best ? { premium: { n: best.b, s: best.s } } : null;
  const fits = parIds.map(id => [id, Math.max(0, Math.min(1, E.FIT[id](n, ctx)))]).sort((a, b) => b[1] - a[1]);
  let rec = fits.filter(f => f[1] >= 0.55).slice(0, 3).map(f => f[0]);
  if (!rec.length) rec = [fits[0][0]];
  if (manual[n.id]) { rec = manual[n.id].p.slice(); n.pm = manual[n.id].why; }
  n.par = rec; n.pfit = fits.slice(0, 6).map(f => [f[0], Math.round(f[1] * 100)]);
  if (best) n.prem = [best.b.id, Math.round(best.s)];
  n.wEff = E.effWtp(n.scores.wtp, Math.max(...rec.map(id => parById[id].lift)));
});
niches.forEach(n => { n.s1 = n.par ? E.scoreWith(n.scores, W, n.wEff) : n.s0; });
const rank1 = niches.slice().sort((a, b) => b.s1 - a.s1 || a.name.localeCompare(b.name));
rank1.forEach((n, i) => n.r1 = i + 1);
const parCount = {}; parIds.forEach(id => parCount[id] = 0); low.forEach(n => n.par.forEach(id => parCount[id]++));
console.log('niches à faible propension intéressantes', low.length, parCount);

/* 4. mixes : meilleures paires globales (pré-filtre sur le haut du classement pour la vitesse) */
const pool = rank.slice(0, Math.min(rank.length, 700));
const pairs = [];
for (let i = 0; i < pool.length; i++) for (let j = i + 1; j < pool.length; j++) {
  const a = pool[i], b = pool[j]; if (a.sector === b.sector) continue;
  const r = E.pair(a, b, a.s0, b.s0, {}); if (r.s >= 66) pairs.push([r.s, a.id, b.id]);
}
pairs.sort((x, y) => y[0] - x[0]);
/* diversité : une niche apparaît au plus 2 fois dans le top généré */
const used = {}, topPairs = [];
for (const p of pairs) { if ((used[p[1]] || 0) >= 2 || (used[p[2]] || 0) >= 2) continue; used[p[1]] = (used[p[1]] || 0) + 1; used[p[2]] = (used[p[2]] || 0) + 1; topPairs.push(p); if (topPairs.length >= 60) break; }
console.log('paires évaluées', pool.length * (pool.length - 1) / 2, 'retenues ≥ 66 :', pairs.length);

/* mixes éditoriaux : résolution des niches par identifiant */
const edit = MIX.editorial.map(m => {
  const ns = m.n.map(id => byId[id]);
  ns.forEach((x, k) => { if (!x) err('mix ' + m.id + ' : niche inconnue ' + m.n[k]); });
  if (ns.some(x => !x)) return null;
  const pr = ns.length === 3 ? E.triple(ns[0], ns[1], ns[2], sOf, {}) : E.pair(ns[0], ns[1], sOf(ns[0]), sOf(ns[1]), {});
  return Object.assign({}, m, { hosts: m.hosts || MIX.H2, s: Math.round(pr.s), fit: Math.round(pr.fit), parts: pr.p ? Object.fromEntries(Object.entries(pr.p).map(([k, v]) => [k, Math.round(v * 100)])) : null });
}).filter(Boolean);
const edRank = edit.slice().sort((a, b) => b.s - a.s);
console.log('mixes éditoriaux', edit.length, '· top :', edRank.slice(0, 10).map(m => m.name + ' ' + m.s).join(' | '));

/* 5. statistiques secteur et catégorie */
const stat = list => {
  const k = list.length || 1, sum = f => list.reduce((a, n) => a + f(n), 0);
  const vc = { prioritaire: 0, 'a-tester': 0, 'plus-tard': 0, ecarter: 0 }; list.forEach(n => vc[n.verdict]++);
  return { n: list.length, s: +(sum(n => n.s0) / k).toFixed(1), s1: +(sum(n => n.s1) / k).toFixed(1), wtp: +(sum(n => n.scores.wtp) / k).toFixed(2), dem: +(sum(n => n.scores.demand) / k).toFixed(2), fmt: +(sum(n => n.scores.format) / k).toFixed(2), sup: +(sum(n => n.scores.supply) / k).toFixed(2),
    low: list.filter(n => n.par).length, p1: Math.round(sum(n => E.mid(n.levels[0].price)) / k), p4: Math.round(sum(n => E.mid(n.levels[3].price)) / k), vc, best: list.slice().sort((a, b) => b.s0 - a.s0)[0]?.id };
};
const secStats = {}, catStats = {};
SEC.forEach(s => secStats[s.id] = stat(niches.filter(n => n.sector === s.id)));
cats.forEach(c => catStats[c.id] = stat(niches.filter(n => n.category === c.id)));

/* 6. portefeuilles et géographie */
/* tirage en ronde : chaque portefeuille prend à tour de rôle la meilleure niche restante de son circuit (exclusivité entre portefeuilles) */
const taken = new Set(), PS = STR.portfolios.map(P => ({ P, elig: rank1.filter(n => P.pick(n) && n.verdict !== 'ecarter'), sel: [], perCat: {}, perSec: {} }));
for (let round = 0; round < 6; round++) PS.forEach(o => {
  const n = o.elig.find(x => !taken.has(x.id) && !(x.dup || []).some(d => taken.has(d)) && !o.perCat[x.category] && (o.perSec[x.sector] || 0) < o.P.maxSec); if (!n) return;
  o.sel.push(n); taken.add(n.id); o.perCat[n.category] = 1; o.perSec[n.sector] = (o.perSec[n.sector] || 0) + 1;
});
/* au moins une niche à faible propension avec parade par portefeuille, si le circuit en contient */
PS.forEach(o => { if (o.sel.some(n => n.par)) return; const l = o.elig.find(x => x.par && !taken.has(x.id)); if (l && o.sel.length) { taken.delete(o.sel[o.sel.length - 1].id); o.sel[o.sel.length - 1] = l; taken.add(l.id); } });
const pf = PS.map(({ P, sel, elig }) => {
  /* mixes signature : meilleures paires internes + meilleur mix éditorial qui touche le portefeuille */
  const sp = [];
  for (let i = 0; i < sel.length; i++) for (let j = i + 1; j < sel.length; j++) { if (sel[i].sector === sel[j].sector) continue; const r = E.pair(sel[i], sel[j], sel[i].s0, sel[j].s0, {}); sp.push([Math.round(r.s), sel[i].id, sel[j].id]); }
  sp.sort((a, b) => b[0] - a[0]);
  const ed = edRank.filter(m => m.n.some(id => sel.some(x => x.id === id))).slice(0, 2).map(m => m.id);
  const k = sel.length || 1, mean = f => sel.reduce((a, n) => a + f(n), 0) / k;
  const venues = {}; sel.forEach(n => n.venues.forEach(v => venues[v] = (venues[v] || 0) + 1));
  const vConc = Math.max(...Object.values(venues)) / k;
  const m = { s: mean(n => n.s0), s1: mean(n => n.s1), wtp: mean(n => n.wEff || n.scores.wtp), sup: mean(n => n.scores.supply), mix: sp.length ? sp.slice(0, 2).reduce((a, p) => a + p[0], 0) / Math.min(2, sp.length) : 0, vConc };
  m.total = 0.45 * m.s1 + 0.2 * m.mix + 0.15 * m.sup * 20 + 0.1 * m.wtp * 20 + 0.1 * vConc * 100;
  return { id: P.id, n: P.n, tag: P.tag, desc: P.desc, risk: P.risk, need: P.need, niches: sel.map(n => n.id), pairs: sp.slice(0, 3), ed, m: Object.fromEntries(Object.entries(m).map(([a, b]) => [a, +b.toFixed(1)])), venues: Object.entries(venues).sort((a, b) => b[1] - a[1]).slice(0, 4).map(v => v[0]) };
}).sort((a, b) => b.m.total - a.m.total);
pf.forEach((p, i) => p.rk = i + 1);
console.log('portefeuilles', pf.map(p => p.id + ' ' + p.m.total).join(' | '));
const geo = STR.geo(pf);

/* 7. top 15 et argumentaires */
const top = rank1.slice(0, 15).map(n => n.id);
const top0 = rank.slice(0, 15).map(n => n.id);

/* 8. sérialisation compacte des niches */
const lvl = l => [l.title, l.goal, l.format, l.duration, l.group, l.price[0], l.price[1]];
const NI = niches.map(n => ({
  id: n.id, name: n.name, sector: n.sector, category: n.category, subcategory: n.subcategory, desc: n.desc, audience: n.audience, skills: n.skills, appSkills: n.appSkills || [],
  L: n.levels.map(lvl), scores: n.scores, venues: n.venues, moments: n.moments, publics: n.publics, senses: n.senses, outputs: n.outputs, energy: n.energy, mixTags: n.mixTags,
  raw: HARM.concat(['regulatory']).some(k => n.raw[k] !== n.scores[k]) ? n.raw : undefined, competitors: n.competitors || [], regulated: n.regulated, verdict: n.verdict, why: n.why, confidence: n.confidence,
  dup: n.dup, par: n.par, pfit: n.pfit, prem: n.prem, pm: n.pm, wEff: n.wEff
}));
const data = {
  updated: '13 nov. 2026', lowMin: E.LOW_MIN, fixtures: fixtureSectors,
  sectors: SEC.map(s => ({ id: s.id, n: s.n, g: s.g, diag: s.diag, ch: s.ch.map(c => [c[0], c[1], c[2].map(k => { if (!srcIdx[k]) err('source ' + k); return srcIdx[k]; })]), b: s.b, sig: s.sig, opp: s.opp, dm: s.dm, dmN: s.dmN })),
  cats, subs, niches: NI, harm, dups, secStats, catStats, top, top0, low: low.map(n => n.id), parCount,
  parades: PAR.parades.map(p => Object.assign({}, p, { refs: p.refs.map(r => [r[0], r[1], r[2] ? (srcIdx[r[2]] || err('source parade ' + r[2])) : 0]) })),
  packages: PAR.packages, editorial: edit, families: E.FAMILIES, topPairs, portfolios: pf, geo, villes: STR.villes, limits: STR.limits, takeaways: STR.takeaways,
  sources: SRC.map((s, i) => ({ i: i + 1, k: s[0], t: s[1], e: s[2], u: s[3], v: s[4] ? 1 : 0 }))
};
const tpl = fs.readFileSync(path.join(__dirname, 'template.html'), 'utf8');
const json = JSON.stringify(data).replace(/</g, '\\u003c');
const eng = fs.readFileSync(path.join(__dirname, 'lib', 'engine.js'), 'utf8');
const out = tpl.replace('/*__DATA__*/', () => json).replace('/*__ENGINE__*/', () => eng).replace('/*__APP__*/', () => fs.readFileSync(path.join(__dirname, 'lib', 'app.js'), 'utf8'))
  .replace(/__NNICHES__/g, String(niches.length)).replace(/__NSOURCES__/g, String(SRC.length)).replace(/__NCATS__/g, String(cats.length)).replace(/__NSUBS__/g, String(subs.length)).replace(/__NLOW__/g, String(low.length)).replace(/__NPAR__/g, String(PAR.parades.length)).replace(/__NMIX__/g, String(edit.length));
if (/fondateur|antoine/i.test(json.replace(/biais fondateur|critère fondateur|Aucun critère fondateur/gi, ''))) console.warn('ATTENTION : mention fondateur dans les données');
fs.writeFileSync(OUT, out);
console.log('top15', rank1.slice(0, 15).map(n => n.r1 + ' ' + n.name + ' ' + n.s1.toFixed(1) + (n.par ? ' (parade)' : '')).join('\n'));
console.log('écrit', (out.length / 1e6).toFixed(2), 'Mo ·', niches.length, 'niches ·', cats.length, 'catégories ·', subs.length, 'sous-catégories ·', (Date.now() - T0) + ' ms');
