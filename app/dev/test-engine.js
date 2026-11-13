/* Test du moteur Cordes sous Node : charge les vraies données et le moteur dans un faux `window`,
   vérifie les algorithmes sur les 3 profils de démo. Usage : node app/dev/test-engine.js */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const APP = path.resolve(__dirname, '..');
const store = {};
const win = {
  localStorage: { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } },
  location: { href: 'file:///app/index.html' },
  CompressionStream: globalThis.CompressionStream, DecompressionStream: globalThis.DecompressionStream
};
win.window = win;
const ctx = vm.createContext(Object.assign(win, {
  console, Math, Date, JSON, Promise, setTimeout, clearTimeout, TextEncoder, TextDecoder, Blob, Response, Uint8Array, Float32Array,
  btoa: globalThis.btoa, atob: globalThis.atob, encodeURIComponent, decodeURIComponent, URL, AbortController, fetch: async () => { throw new Error('offline'); }
}));
const files = [
  'js/data/taxonomy-a.js', 'js/data/taxonomy-b.js', 'js/data/resources.js',
  'js/engine/core.js', 'js/engine/similarity.js', 'js/engine/inspiration.js', 'js/engine/archetype.js', 'js/engine/plan.js',
  'js/engine/pricing.js', 'js/engine/channels.js', 'js/engine/status.js', 'js/engine/niche.js', 'js/engine/offers.js',
  'js/engine/troc.js', 'js/engine/share.js', 'js/engine/osm.js', 'js/engine/ai.js', 'js/engine/demo.js', 'js/engine/export.js', 'js/ui/charts.js'
];
for (const f of files) {
  const p = path.join(APP, f);
  if (!fs.existsSync(p)) { console.error('MANQUANT', f); process.exit(2); }
  vm.runInContext(fs.readFileSync(p, 'utf8'), ctx, { filename: f });
}
const C = win.Cordes;

let fails = 0, passes = 0;
function ok(cond, msg) { if (cond) passes++; else { fails++; console.log('  ÉCHEC ·', msg); } }
function inRange(x, a, b, msg) { ok(typeof x === 'number' && isFinite(x) && x >= a && x <= b, msg + ' (' + x + ' hors [' + a + ', ' + b + '])'); }

(async () => {
  const t0 = Date.now();
  C.loadData(win.CORDES_DATA, win.CORDES_RESOURCES);
  C.buildGraph(12);
  const D = C.data, R = C.res;
  console.log(`Données : ${D.universes.length} univers · ${D.domains.length} domaines · ${D.skills.length} compétences · ${R.platforms.length} plateformes · ${R.statuses.length} statuts · graphe en ${Date.now() - t0} ms`);
  ok(D.universes.length === 17, '17 univers');
  ok(D.skills.length >= 300, 'au moins 300 compétences');

  // similarité
  let simOk = true;
  for (let i = 0; i < 400; i++) {
    const a = D.skills[(i * 37) % D.skills.length], b = D.skills[(i * 91 + 5) % D.skills.length];
    const v = C.sim(a, b); if (!(v >= 0 && v <= 1) || Math.abs(v - C.sim(b, a)) > 1e-6) simOk = false;
  }
  ok(simOk, 'similarité symétrique et bornée [0,1]');
  ok(Object.keys(C.neighbors).length === D.skills.length, 'graphe de voisinage complet');
  const sample = ['latte-art', 'dj-mix', 'eloquence', 'escalade-bloc'].filter(id => D.sById[id]);
  sample.forEach(id => console.log(`  voisins de ${id} : ${C.neighbors[id].slice(0, 5).map(n => n.id + ' ' + n.sim.toFixed(2)).join(', ')}`));

  for (const demo of C.DEMOS) {
    console.log(`\nProfil « ${demo.name} » (${demo.mode})`);
    const st = C.buildDemo(demo.id);
    ok(!!st, 'construction du profil');
    const nSk = Object.keys(st.skills).length, nDe = C.yesDesires(st).length;
    console.log(`  ${nSk} compétences, ${nDe} envies`);
    ok(nSk >= 5, 'compétences résolues (' + nSk + ')');

    // paquet d'inspiration et apprentissage des verdicts
    const before = C.nextCards(st, 5);
    ok(before.length === 5, 'paquet de 5 cartes');
    before.forEach(c => inRange(c.score, -1, 2, 'score de carte ' + c.s.id));
    ok(new Set(before.map(c => c.s.universe)).size >= 3, 'diversité MMR : au moins 3 univers sur 5 cartes');
    console.log('  cartes : ' + before.map(c => c.s.name + ' [' + (c.reasons[0] ? c.reasons[0].t : '') + ']').join(' · '));
    const target = before[0].s;
    const neigh = C.neighbors[target.id][0].id;
    const sc0 = C.scoreCandidate(D.sById[neigh], st, C.anchors(st), { touched: {} }).score;
    C.applyVerdict(st, target.id, 'yes');
    const sc1 = C.scoreCandidate(D.sById[neigh], st, C.anchors(st), { touched: {} }).score;
    ok(sc1 > sc0, '« oui » renforce les voisins (' + sc0.toFixed(3) + ' → ' + sc1.toFixed(3) + ')');
    const rej = before[1].s, rejN = C.neighbors[rej.id].map(n => D.sById[n.id]).find(s => s.universe === rej.universe) || D.sById[C.neighbors[rej.id][0].id];
    const r0 = C.scoreCandidate(rejN, st, C.anchors(st), { touched: {} }).score;
    C.applyVerdict(st, rej.id, 'no');
    const r1 = C.scoreCandidate(rejN, st, C.anchors(st), { touched: {} }).score;
    ok(r1 < r0, '« non » pénalise tags et univers (' + r0.toFixed(3) + ' → ' + r1.toFixed(3) + ')');
    C.undoVerdict(st); C.undoVerdict(st);
    ok(!st.desires[target.id], 'annulation du verdict');

    // archétype
    if (demo.style) {
      const a = C.computeArchetype(st.style.answers);
      ok(!!a.archetype && a.answered === 8, 'archétype calculé');
      inRange(a.confidence, 0, 1, 'confiance archétype');
      a.vec.forEach(v => inRange(v, -1, 1, 'dimension de style'));
      console.log(`  archétype : ${a.archetype.name} (confiance ${Math.round(a.confidence * 100)} %), second : ${a.second.name}`);
    }

    // plans d'apprentissage
    C.yesDesires(st).forEach(id => {
      const p = C.learnPlan(st, id);
      ok(p && p.hours > 0 && p.weeks > 0, 'plan ' + id);
      inRange(p.hours, 1, 5000, 'heures ' + id);
      ok(p.first && p.first.text.length > 10, 'premier pas ' + id);
      ok(p.milestones.length >= 3, 'jalons ' + id);
      const w = p.where;
      const nWhere = w.teachers.length + w.workshops.length + w.online.length + w.apps.length + w.communities.length + w.networks.length + w.projects.length;
      ok(nWhere >= 3, 'où apprendre non vide pour ' + id + ' (' + nWhere + ')');
      ok(w.searches.length >= 5 && w.searches.every(s => /^https?:\/\//.test(s.url) && !/\{q\}|\{city\}/.test(s.url)), 'recherches préparées ' + id);
    });
    if (C.yesDesires(st).length) {
      const p = C.learnPlan(st, C.yesDesires(st)[0]);
      console.log(`  plan prioritaire : ${p.s.name} · ${p.hours} h · ${p.weeks} sem. à ${p.hpw} h · ${p.monthly} €/mois · ${p.first.text}`);
      const ch = C.challenge30(st, C.yesDesires(st)[0]);
      ok(ch.length === 30 && ch.every(d => d.text.length > 5), 'défi 30 jours');
    }
    const prof = C.universeProfile(st);
    Object.values(prof).forEach(x => { inRange(x.m, 0, 1, 'radar maîtrise'); inRange(x.d, 0, 1, 'radar envie'); });
    ok(C.softProfile(st).length >= 3, 'forces transverses');
    ok(C.cvSection(st).length >= 1, 'section CV');

    // offreur
    if (st.mode !== 'learn') {
      const plan = C.offerPlan(st);
      ok(!!plan, 'plan de valorisation');
      ok(plan.offers.length >= 3 && plan.offers.length <= 6, '3 à 6 offres (' + plan.offers.length + ')');
      plan.offers.forEach(o => {
        inRange(o.price, 1, 5000, 'prix ' + o.title);
        ok(o.outline.length >= 3, 'trame ' + o.title);
        ok(o.pricing.steps.length >= 2, 'explication du prix');
      });
      console.log('  offres : ' + plan.offers.map(o => o.title + ' · ' + o.price + ' ' + o.unit).join('\n          '));
      ok(plan.channels.length >= 5, 'canaux classés');
      plan.channels.forEach(c => inRange(c.score, 0, 100, 'score canal ' + c.p.id));
      ok(plan.channels.some(c => c.p.id === 'cordes'), 'canal Cordes présent');
      console.log('  canaux : ' + plan.channels.slice(0, 6).map(c => c.p.name + ' ' + c.score).join(' · '));
      ok(plan.statuses.length >= 3, 'statuts classés');
      console.log('  statut : ' + plan.statuses.slice(0, 3).map(s => s.s.name + ' (' + s.score.toFixed(1) + ', ' + Math.round(s.rate.rate * 1000) / 10 + ' %)').join(' · '));
      ok(plan.niches.length >= 1, 'niche');
      plan.niches.forEach(n => inRange(n.score, 0, 1, 'score niche'));
      console.log('  niches : ' + plan.niches.map(n => n.title + ' ' + n.score.toFixed(2)).join(' · '));
      ok(plan.roadmap.reduce((a, p) => a + p.tasks.length, 0) >= 14, 'feuille de route 90 j');
      ok(plan.kit && plan.kit.posts.length === 10 && plan.kit.venue.length > 100, 'kit de lancement');
      ok(plan.collective.projects.length >= 1, 'projets collectifs');
      const o0 = plan.offers[0];
      const sim = C.simulate({ hoursPerWeek: st.offer.hoursPerWeek, sessionMin: o0.duration, price: o0.price, size: o0.size, fill: 0.7, mix: plan.channels.slice(0, 3).map((c, i) => ({ platform: c.p, share: [50, 30, 20][i] })), status: plan.statuses[0].s, materialPerSession: 5 });
      ok(isFinite(sim.net) && sim.gross >= sim.net, 'simulateur cohérent');
      console.log(`  simulateur : ${sim.sessionsPerMonth} séances/mois · brut ${Math.round(sim.gross)} € · frais ${Math.round(sim.fees)} € · cotisations ${Math.round(sim.cotis)} € · net ${Math.round(sim.net)} € · plafond ${sim.ceiling} · TVA ${sim.vat}`);
    } else {
      const sh = C.shareable(st);
      console.log('  à partager : ' + sh.map(x => x.s.name).join(', '));
    }

    // partage et exports
    const code = await C.encodeShare(st);
    ok(/^[zj][A-Za-z0-9_-]+$/.test(code), 'code de partage base64url');
    const back = await C.decodeShare('#b=' + code);
    ok(Object.keys(back.skills).length === Object.keys(st.skills).filter(id => st.skills[id].level > 0).length, 'aller-retour du partage (compétences)');
    ok(C.yesDesires(back).length === C.yesDesires(st).length, 'aller-retour du partage (envies)');
    console.log(`  lien de partage : ${code.length} caractères (${code[0] === 'z' ? 'compressé' : 'JSON'})`);
    const ics = C.toICS(C.learnerEvents(st).concat(st.mode !== 'learn' ? C.offerEvents(st, C.offerPlan(st)) : []));
    ok(/^BEGIN:VCALENDAR\r\n/.test(ics) && /END:VCALENDAR\r\n$/.test(ics) && ics.split('\r\n').every(l => Buffer.byteLength(l) <= 75), 'iCalendar valide (pliage 75 octets)');
    const html = C.passportHTML(st);
    ok(html.startsWith('<!DOCTYPE html>') && html.includes('cordes-data') && html.includes('<svg'), 'passeport HTML autonome');
    ok(JSON.parse(C.toJSON(st)).profile.version === 1, 'export JSON');
  }

  // troc entre deux profils
  const A = C.buildDemo('claire'), B = C.buildDemo('ines');
  B.desires[Object.keys(A.skills).find(id => A.skills[id].level >= 3)] = { verdict: 'yes', target: 2, priority: 1 };
  A.desires[Object.keys(B.skills).find(id => B.skills[id].level >= 3)] = { verdict: 'yes', target: 2, priority: 1 };
  const tr = C.troc(A, B);
  ok(tr.pairs.length >= 1, 'troc : au moins une paire bilatérale');
  inRange(tr.compat, 0, 100, 'compatibilité troc');
  console.log(`\nTroc Claire × Inès : ${tr.pairs.length} paire(s), compatibilité ${tr.compat} %, idées : ${tr.ideas.slice(0, 2).join(' · ')}`);

  // robustesse : données manquantes ou mal formées
  const broken = { universes: [{ id: 'cuisine' }], domains: [], skills: [{ id: 'x', name: 'X', universe: 'nope', domain: 'cuisine.zz', related: ['inconnu'] }, { id: 'y', name: 'Y', universe: 'cuisine', attrs: { demand: 9 }, related: ['x', 'zzz'] }], softSkills: [] };
  let threw = false;
  try { C.loadData(broken, { platforms: [{ id: 'p' }] }); C.buildGraph(); C.nextCards(C.defaultState(), 3); } catch (e) { threw = e; }
  ok(!threw, 'données mal formées : aucune exception ' + (threw ? threw.stack : ''));
  ok(C.data.sById.y && C.data.sById.y.attrs.demand === 3, 'attrs bornés');
  ok(C.data.universes.length === 17, 'univers manquants recréés');

  // anomalies relevées sur les vraies données
  C.loadData(win.CORDES_DATA, win.CORDES_RESOURCES); C.buildGraph();
  for (const st of C.DEMOS.map(d => C.buildDemo(d.id))) { if (st.mode !== 'learn') C.offerPlan(st); C.osmSelectors(C.UNIVERSE_IDS, 'learn'); }
  console.log(`\nAnomalies de données relevées (${C.anomalies.length}) :`);
  C.anomalies.slice(0, 30).forEach(a => console.log('  · [' + a.kind + '] ' + a.msg));

  console.log(`\n${passes} vérifications OK, ${fails} échec(s).`);
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
