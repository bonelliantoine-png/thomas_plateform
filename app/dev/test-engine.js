/* Test du moteur Cordes sous Node : charge les vraies données et le moteur dans un faux `window`,
   vérifie les algorithmes sur les 3 profils de démo. Usage : node app/dev/test-engine.js */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const APP = path.resolve(__dirname, '..');
const store = {};
const win = {
  localStorage: { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; }, key: i => Object.keys(store)[i] || null, get length() { return Object.keys(store).length; } },
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
  'js/engine/troc.js', 'js/engine/share.js', 'js/engine/osm.js', 'js/engine/ai.js', 'js/engine/demo.js', 'js/engine/export.js', 'js/engine/growth.js', 'js/ui/charts.js'
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

  /* ---------- lot 2 : croissance et étude ---------- */
  console.log('\nLot 2');
  const ines = C.buildDemo('ines'), malik = C.buildDemo('malik'), claire = C.buildDemo('claire');
  // A1 liste d'attente
  const pre = C.waitlist.prefill(claire);
  ok(pre.wants.length === C.yesDesires(claire).length && pre.offers.every(id => claire.skills[id].level >= 3) && pre.offers.length >= 3, 'A1 · pré-remplissage : envies et compétences ≥ 3 (' + pre.wants.length + ' + ' + pre.offers.length + ')');
  ok(C.zoneOf('Paris', '11e') === 'Paris 11e' && C.zoneOf('paris 18') === 'Paris 18e' && C.zoneOf('75003') === 'Paris 3e' && C.zoneOf('lyon') === 'Lyon', 'A1 · zones : arrondissements et villes');
  ok(C.waitlist.validate({ role: 'apprendre', zone: 'Paris 11e', consent: false }).length === 1, 'A1 · consentement obligatoire');
  ok(C.waitlist.validate({ role: 'apprendre', zone: 'Paris 11e', consent: true, email: 'x@' }).length === 1, 'A1 · e-mail vérifié');
  const e1 = C.waitlist.add({ role: 'apprendre', zone: 'Paris 11e', city: 'Paris', arr: '11e', consent: true, email: 'a@b.fr', wants: pre.wants, offers: pre.offers });
  C.waitlist.add({ role: 'transmettre', zone: 'Paris 11e', consent: true, email: 'a@b.fr' });
  C.waitlist.add({ role: 'lieu', zone: 'Lyon', consent: true, venue: { name: 'Café « test »; quai', type: 'cafe' } });
  ok(C.waitlist.list().length === 2, 'A1 · dédoublonnage par e-mail');
  C.waitlist.add({ id: undefined, role: 'apprendre', zone: 'Nantes', consent: true }); C.waitlist.add({ id: undefined, role: 'lieu', zone: 'Nantes', consent: true });
  ok(C.waitlist.list().length === 4 && C.waitlist.list().every(x => x.id), 'A1 · chaque inscription reçoit un identifiant');
  C.waitlist.list().filter(x => x.zone === 'Nantes').forEach(x => C.waitlist.remove(x.id));
  ok(!!e1.consentAt, 'A1 · date de consentement');
  const csv = C.waitlist.csv();
  ok(csv.split('\r\n').length === 4 && /"Café « test »; quai \(cafe\)"/.test(csv) && csv.startsWith('\ufeffdate;role;zone'), 'A1 · export CSV (en-tête, échappement)');
  ok((await C.waitlist.send(e1)).sent === false, 'A1 · envoi désactivé par défaut');
  let posted = null; C.WAITLIST_ENDPOINT = 'https://example.org/form';
  await C.waitlist.send(e1, (url, o) => { posted = { url, o }; return Promise.resolve({ ok: true }); });
  ok(posted && posted.o.method === 'POST' && JSON.parse(posted.o.body).consent === true && JSON.parse(posted.o.body).zone === 'Paris 11e', 'A1 · POST JSON vers WAITLIST_ENDPOINT');
  C.WAITLIST_ENDPOINT = '';
  // A8 compteur de quartier
  const q = C.quarterCount('Paris 11e');
  ok(q.local === 1 && q.demo >= 9 && q.demo <= 38 && q.total === q.demo + 1 && q.missing === 50 - q.total, 'A8 · compteur : ' + q.total + '/50 dont ' + q.demo + ' de démonstration');
  ok(C.quarterCount('Paris 11e').demo === q.demo, 'A8 · valeur de démonstration stable');
  // A3 mesure
  C.metrics.clear();
  ['accueil', 'bilan/contexte', 'bilan/maitrise', 'bilan/envies', 'resultats'].forEach((r, i) => C.track('view', { r }));
  C.track('use', { k: 'passport' });
  const ev = C.metrics.events(); ev.forEach((e, i) => { e.t = 1e12 + i * 60000; });
  const rep = C.metricsReport(ev);
  ok(rep.sessions === 1 && rep.funnel.find(f => f.id === 'results').n === 1 && rep.funnel.find(f => f.id === 'survey').n === 0, 'A3 · entonnoir par étape');
  ok(rep.durations.length === 5 && rep.durations.every(d => d.median === 60), 'A3 · temps passé par écran');
  C.metrics.setOff(true); ok(C.track('view', { r: 'x' }) === false, 'A3 · refus de la mesure respecté'); C.metrics.setOff(false);
  const sim = C.simulateMetrics(80, 'test');
  const srep = C.metricsReport(sim);
  ok(srep.sessions === 80 && srep.funnel.every((f, i) => i === 0 || f.n <= srep.funnel[i - 1].n || f.id === 'waitlist' || f.id === 'survey'), 'A3 · données simulées et entonnoir décroissant');
  ok(C.metrics.events().length === 6, 'A3 · simulation stockée à part');
  console.log('  simulation : ' + srep.funnel.map(f => f.label + ' ' + f.n).join(' · '));
  // A6 questionnaire et prix
  const arm = C.priceArm();
  ok(C.PRICE_ARMS.indexOf(arm) >= 0 && C.priceArm() === arm, 'A6 · prix tiré au hasard et mémorisé (' + arm + ' €)');
  C.survey.save({ u: 5, nps: 10, int: 'oui', pay: 'oui' }); C.survey.save({ u: 3, nps: 5, int: 'non', pay: 'non' });
  const sr = C.surveyReport(C.survey.list());
  ok(sr.n === 2 && sr.avgUtility === 4 && sr.nps === 0 && sr.arms.find(a => a.price === arm).n === 2, 'A6 · utilité, NPS et test de prix agrégés');
  ok(C.metricsReport(C.metrics.events()).survey.n === 2, 'A6 · réponses visibles dans la mesure');
  console.log('  test du prix (simulé) : ' + srep.survey.arms.map(a => a.price + ' € → ' + Math.round(a.rate * 100) + ' % de oui (n=' + a.n + ')').join(' · '));
  // A5 historique
  const past = C.demoPastSnapshot(ines), cmp = C.compareSnapshots(past, C.snapshot(ines));
  ok(cmp.realized.length >= 1 && cmp.gained.length >= 1 && cmp.newDesires.length >= 1 && cmp.days >= 90, 'A5 · avant/après : ' + cmp.realized.length + ' envie(s) réalisée(s), ' + cmp.gained.length + ' niveau(x) gagné(s), ' + cmp.newDesires.length + ' nouvelle(s)');
  C.history.upsertToday(ines); C.history.upsertToday(ines);
  ok(C.history.list().length === 1, 'A5 · un instantané par jour');
  const rics = C.toICS([C.rebilanEvent(new Date(2026, 0, 1))]);
  ok(/RRULE:FREQ=MONTHLY;INTERVAL=3/.test(rics) && /DTSTART;VALUE=DATE:20260401/.test(rics), 'A5 · rappel .ics à 90 jours, récurrent');
  // A7 groupe
  const names = ['Inès', 'Malik', 'Claire', 'Yanis', 'Léa'];
  const grp = C.groupCompare([ines, malik, claire, C.buildFriend('yanis'), C.buildFriend('lea')].map((st, i) => ({ name: names[i], st })));
  ok(grp.n === 5 && grp.matrix.length === 5 && grp.matrix[0][0] === null && grp.matrix.every(r => r.length === 5), 'A7 · matrice 5 × 5');
  const t01 = C.troc(C.buildFriend('lea'), ines).aFromB.length;
  ok(t01 >= 1 && grp.matrix[0][4].length === t01, 'A7 · matrice cohérente avec le troc à deux (Inès → Léa : ' + t01 + ')');
  ok(grp.links >= 6, 'A7 · liens de transmission (' + grp.links + ')');
  ok(grp.hosts.every(h => h.teacher !== null && h.learners.indexOf(h.teacher) < 0), 'A7 · qui anime quoi');
  ok(grp.projects.length >= 1, 'A7 · activités de groupe');
  console.log('  groupe : ' + grp.links + ' liens · ' + grp.hosts.slice(0, 4).map(h => C.data.sById[h.want].name + ' par ' + names[h.teacher]).join(' · '));
  // A10 lieu
  const v = Object.assign(C.defaultVenue(), { name: 'Le Comptoir', type: 'cafe', city: 'Paris', arr: '11e', slots: ['1:matin', '2:aprem', '3:soir'], capacity: 12, equip: ['tables', 'machine', 'calme'], formula: 'creuse' });
  const vm2 = C.venueMatch(v, 10);
  ok(vm2.skills.length === 10 && vm2.skills.every(x => x.s.attrs.physical < 3 && x.s.regulated !== 'alcool'), 'A10 · compétences compatibles filtrées');
  ok(vm2.skills.some(x => x.s.domain === 'cuisine.cafe'), 'A10 · machine à café → compétences café');
  const ve = C.venueEstimate(v);
  ok(ve.sessions === 13 && ve.seats === 8 && ve.visitors === Math.round(3 * 4.33 * 8 * 0.6) && ve.conso === ve.visitors * 6, 'A10 · estimation de fréquentation (' + ve.visitors + ' participants, ' + ve.conso + ' €)');
  const studio = C.venueMatch(Object.assign({}, v, { type: 'studio', equip: ['parquet', 'sono'] }), 10);
  ok(studio.universes.some(u => u === 'sport' || u === 'scene' || u === 'bienetre'), 'A10 · studio → corps et scène');
  ok(/FICHE LIEU PARTENAIRE · Le Comptoir/.test(C.venueSheet(v)) && /Paris 11e/.test(C.venueSheet(v)), 'A10 · fiche partenaire');
  console.log('  lieu : ' + vm2.skills.slice(0, 5).map(x => x.s.name).join(', '));
  // A2 export complet et suppression
  store['cordes.apikey'] = 'sk-ant-secret';
  const all = JSON.parse(C.exportAll());
  ok(all.data['cordes.waitlist'].length === 2 && !/sk-ant-secret/.test(JSON.stringify(all)), 'A2 · export complet, clé masquée');
  store['autre.cle'] = '1';
  const nErased = C.eraseAll();
  ok(nErased >= 5 && Object.keys(store).length === 1 && store['autre.cle'] === '1', 'A2 · suppression totale des clés cordes.* (' + nErased + ')');

  // A9 pages SEO générées
  const os = require('os'), cp = require('child_process');
  const seoDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cordes-seo-'));
  cp.execFileSync(process.execPath, [path.join(__dirname, 'build-seo.js'), seoDir]);
  const seoFiles = fs.readdirSync(seoDir);
  const learnP = seoFiles.filter(f => /^apprendre-.*-paris\.html$/.test(f)), teachP = seoFiles.filter(f => /^donner-des-cours-.*-paris\.html$/.test(f));
  ok(learnP.length === 30 && teachP.length === 30 && seoFiles.indexOf('index.html') >= 0 && seoFiles.indexOf('seo.css') >= 0, 'A9 · 30 pages « apprendre » + 30 « donner des cours » + index');
  const pg = fs.readFileSync(path.join(seoDir, learnP[0]), 'utf8'), pt = fs.readFileSync(path.join(seoDir, teachP[0]), 'utf8');
  ok(/<title>Apprendre .* à Paris/.test(pg) && /N4/.test(pg) && /h cumulées/.test(pg) && /Prix observés/.test(pg) && /\.\.\/app\/index\.html#\//.test(pg), 'A9 · page apprendre : jalons, heures, prix, lien vers l’app');
  ok(/Prix conseillé|Cours particulier/.test(pt) && /Trame minutée/.test(pt) && /Où trouver vos premiers élèves/.test(pt), 'A9 · page transmettre : prix, trame, canaux');
  ok(!seoFiles.some(f => /undefined|NaN|\{q\}/.test(fs.readFileSync(path.join(seoDir, f), 'utf8'))), 'A9 · aucune valeur manquante (undefined, NaN)');
  const idx = fs.readFileSync(path.join(seoDir, 'index.html'), 'utf8');
  ok(learnP.every(f => idx.includes('href="' + f + '"')), 'A9 · index relié aux 30 fiches');
  fs.rmSync(seoDir, { recursive: true, force: true });

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
