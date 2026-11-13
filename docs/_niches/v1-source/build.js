const fs = require('fs'), path = require('path');
const SRC = require('./sources.js'), SEC = require('./sectors.js'), NI = require('./niches.js'), X = require('./extra.js');
const W = X.crit.map(c => c[3]);
const srcIdx = {}; SRC.forEach((s, i) => srcIdx[s[0]] = i + 1);
const err = m => { console.error('ERR', m); process.exitCode = 1; };
const chk = (arr, where) => (arr || []).forEach(k => { if (!srcIdx[k]) err('source inconnue ' + k + ' dans ' + where); });

const domMap = {}, sectors = SEC.map((s, si) => {
  s.ch.forEach(c => chk(c[2], s.id));
  s.dom.forEach(d => domMap[d[0]] = { sec: s.id, si, name: d[1], def: d[2] });
  return { id: s.id, n: s.n, g: s.g, diag: s.diag, ch: s.ch.map(c => [c[0], c[1], c[2].map(k => srcIdx[k])]), b: s.b, sig: s.sig, opp: s.opp, dm: s.dm, dmT: s.dmT, dmN: s.dmN, dom: s.dom.map(d => [d[0], d[1]]) };
});

const score = s => s.reduce((a, v, i) => a + W[i] * (v - 1) / 4, 0);
const verdictOf = (sc, ko) => ko ? 'ecarter' : sc >= 68 ? 'prioritaire' : sc >= 60 ? 'tester' : sc >= 48 ? 'tard' : 'ecarter';
const band = d => ["", "Moins de 20 000 intéressés en France", "20 000 à 100 000 intéressés en France", "100 000 à 300 000 intéressés en France", "300 000 à 1 million d'intéressés en France", "Plus d'un million d'intéressés en France"][d];
const ids = new Set();
const niches = NI.map((r, i) => {
  const [d, n, k, s, f, m, x] = r; const dm = domMap[d]; if (!dm) err('domaine ' + d);
  const sc = s.split('').map(Number); if (sc.length !== 10) err('scores ' + n);
  const skills = k.split(' | '); if (skills.length < 2 || skills.length > 5) err('compétences ' + n);
  if (!X.fmt[f]) err('format ' + f); if (!X.mode[m]) err('mode ' + m);
  chk(x.src, n);
  let id = n.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48);
  if (ids.has(id)) err('id dupliqué ' + id); ids.add(id);
  const s0 = score(sc);
  const def = dm.def;
  return {
    id, n, sec: dm.sec, dom: d, k: skills, s: sc, f, m,
    p: x.p || def.p, c: x.c || def.c, o: x.o || def.o, l: x.l || def.l, r: x.r || def.r,
    z: x.z || (band(sc[0]) + " · estimation calée sur les chiffres du secteur"), zS: !!x.z,
    ko: x.ko ? 1 : 0, w: x.w || '', src: (x.src || []).map(k => srcIdx[k]),
    v: x.v || verdictOf(s0, x.ko), vs: !!x.v, s0
  };
});
// rang par défaut
const ranked = niches.slice().sort((a, b) => b.s0 - a.s0 || a.n.localeCompare(b.n));
ranked.forEach((n, i) => n.r0 = i + 1);
const byName = {}; niches.forEach(n => byName[n.n] = n.id);
X.portfolios.forEach(p => p.niches.forEach(n => { if (!byName[n]) err('portefeuille ' + n); }));
['core', 'plus', 'later'].forEach(k => X.reco[k].forEach(n => { if (!byName[n]) err('reco ' + n); }));
const top15 = ranked.slice(0, 15); top15.forEach(n => { if (!n.w) err('pas d\'argumentaire pour ' + n.n); });

const vc = {}; niches.forEach(n => vc[n.v] = (vc[n.v] || 0) + 1);
console.log('niches', niches.length, 'verdicts', vc, 'sources', SRC.length);
console.log('top15', top15.map(n => n.r0 + ' ' + n.n + ' ' + n.s0.toFixed(1)).join('\n'));
const pf = X.portfolios.map(p => { const v = p.niches.map(nm => niches.find(n => n.n === nm).s0); return p.id + ' ' + (v.reduce((a, b) => a + b) / v.length).toFixed(1); });
console.log('portefeuilles', pf.join(' | '));

const data = {
  updated: "12 nov. 2026", crit: X.crit, fmt: X.fmt, mode: X.mode, verdicts: X.verdicts,
  sectors, niches: niches.map(({ s0, ...rest }) => rest), byName,
  portfolios: X.portfolios, reco: X.reco, geo: X.geo,
  sources: SRC.map((s, i) => ({ i: i + 1, k: s[0], t: s[1], e: s[2], u: s[3], v: s[4] ? 1 : 0 }))
};
const tpl = fs.readFileSync(path.join(__dirname, 'template.html'), 'utf8');
const json = JSON.stringify(data).replace(/</g, '\\u003c');
const out = tpl.replace('/*__DATA__*/', () => json)
  .replace(/__TL__/g, String(srcIdx.timeleftvilles)).replace(/__IP__/g, String(srcIdx.inseeparis)).replace(/__NNICHES__/g, String(niches.length)).replace(/__NSOURCES__/g, String(SRC.length));
fs.writeFileSync('/home/user/thomas_plateform/docs/niches.html', out);
console.log('écrit', out.length, 'octets');
