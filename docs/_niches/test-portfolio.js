/* Tests « Mon portefeuille » de docs/niches.html, appelés par test.js (node docs/_niches/test.js pf).
   1. modèle pur (lib/mypf.js) sous Node ; 2. page en file:// : sélection unitaire et en lot, requalification et retour à l'étude,
   plusieurs portefeuilles, exports CSV et JSON, import fusion et remplacement, persistance après rechargement, 375 et 1440 px ;
   3. page publiée simulée : faux window.claude (db, user, downloads). Renvoie le nombre d'échecs. */
const fs = require('fs'), path = require('path'), os = require('os');
const URL_ = 'file://' + path.resolve(__dirname, '..', 'niches.html');
const OUT = '/tmp/claude-0/-home-user-thomas-plateform/bdf3316b-5100-5af2-a522-73fd61586f39/scratchpad/shots-portfolio/';
fs.mkdirSync(OUT, { recursive: true });
let fails = 0;
const ok = (c, label, extra) => { console.log((c ? 'ok   ' : 'ÉCHEC ') + label + (extra !== undefined ? ' · ' + extra : '')); if (!c) fails++; };

function unit() {
  const M = require('./lib/mypf.js');
  const known = { a: 1, b: 1, c: 1 };
  const s = M.empty();
  M.add(s, ['a', 'b']); M.set(s, 'a', 'v', 'prioritaire', 'a-tester'); M.set(s, 'b', 'v', 'a-tester', 'a-tester');
  M.set(s, 'a', 't', ['vague 1', ' Vague 1 ', '11e']); M.set(s, 'a', 'lv', [1, 2, 3, 4, 5]);
  const c = M.compact(s);
  ok(JSON.stringify(c.ov) === '{"a":{"v":"prioritaire","t":["vague 1","11e"]}}', 'modèle : document compact limité aux écarts', JSON.stringify(c.ov));
  const n = M.normalize({ pfs: [{ id: 'x', name: 'A', ids: ['a', 'zz', 'a'] }], ov: { zz: { v: 'ecarter' }, c: { p: 7, lv: [9] } } }, known);
  ok(n.pfs[0].ids.join() === 'a' && !n.ov.zz && !n.ov.c && n.unknown.indexOf('zz') >= 0, 'modèle : normalisation (inconnus, doublons, valeurs hors bornes)');
  const imp = M.normalize({ pfs: [{ name: 'Mon portefeuille', ids: ['c'] }, { name: 'B', ids: ['b'] }], ov: { a: { t: ['entreprise'] } } }, known);
  const m = M.merge(s, imp);
  ok(m.pfs.length === 2 && m.pfs[0].ids.join() === 'a,b,c' && m.ov.a.t.join() === 'vague 1,11e,entreprise' && m.ov.a.v === 'prioritaire', 'modèle : fusion (portefeuille homonyme réuni, étiquettes additionnées)');
  const r = M.replace(s, imp); ok(r.pfs.length === 2 && !r.ov.a.v, 'modèle : remplacement');
  M.remove(s, s.cur); ok(s.pfs.length === 1 && s.pfs[0].ids.length === 0, 'modèle : suppression du dernier portefeuille recrée un portefeuille vide');
}

module.exports = async function (browser) {
  console.log('\n— Mon portefeuille —');
  unit();
  const errs = [];
  const watch = (p, tag) => {
    p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push(tag + ' ' + m.type() + ': ' + m.text()); });
    p.on('pageerror', e => errs.push(tag + ' pageerror: ' + e.message));
    p.on('request', r => { const u = r.url(); if (!/^file:|^data:|^blob:|fonts\.(googleapis|gstatic)\.com/.test(u)) errs.push(tag + ' requête externe ' + u); });
  };
  const ready = async p => { await p.waitForFunction(() => window.__ready, null, { timeout: 10000 }); await p.addStyleTag({ content: 'html{scroll-behavior:auto!important}*{transition:none!important}' }); };
  const count = p => p.$eval('#pf-jump-n', e => +e.textContent);
  const go = async (p, id) => { await p.evaluate(i => document.getElementById(i).scrollIntoView(), id); await p.waitForTimeout(150); };
  const overflow = p => p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'pf-'));

  /* ───── 1. page locale (file://) ───── */
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, acceptDownloads: true });
  const p = await ctx.newPage(); watch(p, 'local');
  const t0 = Date.now(); await p.goto(URL_); await ready(p);
  const perf = await p.evaluate(() => ({ first: window.__firstRender, fcp: Math.round((performance.getEntriesByName('first-contentful-paint')[0] || {}).startTime || 0) }));
  ok(perf.first < 1500 && Date.now() - t0 < 4000, 'premier rendu', perf.first + ' ms JS · FCP ' + perf.fcp + ' ms');
  ok((await p.$eval('#sync-t', e => e.textContent)).includes('appareil'), 'indicateur local (sable)', await p.$eval('#sync-t', e => e.textContent));
  ok((await p.$$('.toc a[href="#mon-portefeuille"]')).length === 1, 'entrée de sommaire');

  // sélection unitaire depuis le tableau
  await go(p, 'explorer');
  await p.click('[data-view="table"]'); await p.waitForTimeout(150);
  const firstId = await p.$eval('.vrow .pfb', e => e.getAttribute('data-pf'));
  await p.click('.vrow .pfb >> nth=0'); await p.waitForTimeout(100);
  ok(await p.$eval('.vrow .pfb', e => e.getAttribute('aria-pressed')) === 'true' && await count(p) === 1, 'sélection unitaire (tableau, aria-pressed)');
  ok(!(await p.$eval('#side', e => e.classList.contains('on'))), 'le bouton + n’ouvre pas la fiche');
  await p.click('.vrow .pfb >> nth=0'); await p.waitForTimeout(100);
  ok(await count(p) === 0, 'retrait unitaire');
  await p.click('.vrow .pfb >> nth=0');

  // lot : arborescence (catégorie puis sous-catégorie)
  await p.click('[data-view="tree"]'); await p.click('[data-t="cuisine"]');
  const catBtn = await p.$('[data-pfgrp^="c:cuisine."]');
  const catN = await catBtn.evaluate(e => +e.getAttribute('aria-label').match(/les (\d+)/)[1]);
  await catBtn.click(); await p.waitForTimeout(100);
  ok(await count(p) === 1 + catN, 'lot par catégorie', catN + ' niches');
  ok(await catBtn.evaluate(e => e.textContent) === 'Retirer', 'bouton de catégorie passe à « Retirer »');
  await catBtn.click(); await p.waitForTimeout(100);
  ok(await count(p) === 1, 'retrait du lot de catégorie');
  const catId = await p.$eval('[data-pfgrp^="c:cuisine."]', e => e.getAttribute('data-pfgrp').slice(2));
  await p.click('[data-t="' + catId + '"]');
  const subBtn = await p.$('[data-pfgrp^="s:' + catId + '."]'); const subN = await subBtn.evaluate(e => +e.getAttribute('aria-label').match(/les (\d+)/)[1]);
  await subBtn.click(); await p.waitForTimeout(100);
  ok(await count(p) === 1 + subN, 'lot par sous-catégorie', subN + ' niches');
  await p.screenshot({ path: OUT + 'desktop-01-tree.png' });

  // lot : depuis les filtres
  await p.click('#f-verdict [data-v="prioritaire"]'); await p.selectOption('[data-f="ven"]', 'parc'); await p.waitForTimeout(150);
  const vis = await p.$eval('#vis-cnt', e => +e.textContent.split('/')[0]);
  const lbl = await p.$eval('#x-addall', e => e.textContent);
  ok(lbl === 'Ajouter les ' + vis + ' niches filtrées', 'bouton de lot filtré', lbl);
  const before = await count(p); await p.click('#x-addall'); await p.waitForTimeout(100);
  const after = await count(p);
  ok(after > before && after <= before + vis, 'lot filtré ajouté', before + ' → ' + after);
  await p.click('#f-mine [data-v="in"]'); await p.waitForTimeout(100);
  ok(await p.$eval('#vis-cnt', e => +e.textContent.split('/')[0]) === vis, 'filtre « Dans mon portefeuille »');
  await p.click('#x-reset'); await p.waitForTimeout(100);

  // requalification depuis la fiche
  await p.click('#f-verdict [data-v="a-tester"]'); await p.click('[data-view="table"]'); await p.waitForTimeout(150);
  const rid = await p.$eval('.vrow .vopen', e => e.getAttribute('data-id'));
  const rname = await p.$eval('.vrow .vopen .nm', e => e.textContent);
  const visAT = await p.$eval('#vis-cnt', e => +e.textContent.split('/')[0]);
  await p.click('.vrow .vopen >> nth=0'); await p.waitForTimeout(250);
  ok(await p.$eval('#side', e => e.classList.contains('on')), 'fiche ouverte');
  const st0 = await p.$eval('.pfbig', e => e.getAttribute('aria-pressed')), inBefore = await count(p);
  await p.keyboard.press('p'); await p.waitForTimeout(100);
  ok(await p.$eval('.pfbig', e => e.getAttribute('aria-pressed')) !== st0 && Math.abs(await count(p) - inBefore) === 1, 'touche P bascule la niche ouverte');
  if (st0 === 'true') await p.keyboard.press('p');
  ok(await p.$eval('.pfbig', e => e.getAttribute('aria-pressed')) === 'true', 'niche ouverte retenue');
  await p.click('#side-mine [data-mv="prioritaire"]'); await p.waitForTimeout(150);
  ok(await p.$eval('#side-pills .pill', e => e.textContent.includes('Prioritaire') && e.textContent.includes('✎')), 'verdict requalifié affiché avec ✎ dans la fiche');
  ok(await p.$eval('#vis-cnt', e => +e.textContent.split('/')[0]) === visAT - 1, 'la niche quitte le filtre « À tester » (mes verdicts)');
  await p.click('#side-mine [data-mp="1"]');
  await p.fill('#m-tag', 'vague 1'); await p.keyboard.press('Enter'); await p.waitForTimeout(50);
  ok(await p.evaluate(() => document.activeElement && document.activeElement.id) === 'm-tag', 'focus conservé sur le champ d’étiquette');
  await p.fill('#m-tag', '11e'); await p.click('#side-mine [data-mtadd=""]'); await p.waitForTimeout(50);
  await p.click('#side-mine [data-ml="5"]'); await p.click('#side-mine [data-ml="4"]');
  await p.fill('#m-note', 'Contact repéré au café du coin'); await p.waitForTimeout(100);
  const marks = await p.$$eval('#side-mine .mfh .mk', a => a.length);
  ok(marks === 5, 'cinq champs marqués ✎', marks);
  await p.screenshot({ path: OUT + 'desktop-02-fiche.png' });
  await p.click('#side-mine [data-mrs="v"]'); await p.waitForTimeout(150);
  ok(await p.$eval('#side-pills .pill', e => e.textContent.includes('À tester') && !e.textContent.includes('✎')), 'revenir à la valeur de l’étude');
  await p.click('#side-mine [data-mv="prioritaire"]'); await p.waitForTimeout(100);
  await p.keyboard.press('Escape'); await p.waitForTimeout(150);
  await p.click('#x-reset'); await p.fill('#q', rname); await p.waitForTimeout(250);
  ok(await p.$eval('.vrow[data-row="' + rid + '"] .vd', e => e.textContent.includes('Prioritaire') && e.textContent.includes('✎')), 'verdict requalifié dans le tableau');
  await p.click('[data-vm="study"]'); await p.waitForTimeout(150);
  ok(await p.$eval('.vrow[data-row="' + rid + '"] .vd', e => e.textContent.includes('À tester') && !e.textContent.includes('✎')), 'bascule « Verdicts de l’étude »');
  await p.click('[data-vm="mine"]'); await p.waitForTimeout(150);
  ok(await p.$eval('.vrow[data-row="' + rid + '"] .vd', e => e.textContent.includes('✎')), 'bascule « Mes verdicts »');
  await p.click('#x-reset'); await p.click('[data-view="tree"]');

  // top 15, mixes, parades
  await go(p, 'top'); const tb = await p.$eval('#topl .pfb', e => e.getAttribute('aria-pressed'));
  await p.click('#topl .pfb >> nth=0'); await p.waitForTimeout(80);
  ok(await p.$eval('#topl .pfb', e => e.getAttribute('aria-pressed')) !== tb, 'bascule depuis le top 15');
  await go(p, 'ed-cards'); const c0 = await count(p); await p.click('#ed-cards [data-pfset] >> nth=0'); await p.waitForTimeout(80);
  ok(await count(p) > c0, 'ajout d’un mix éditorial');
  await go(p, 'aff-t'); const c1 = await count(p); await p.click('#aff-t .pfb >> nth=0'); await p.waitForTimeout(80);
  ok(await count(p) !== c1, 'bascule depuis les parades');

  // portefeuilles multiples
  await go(p, 'mon-portefeuille');
  const n1 = await count(p);
  ok(await p.$eval('#my-list', e => e.querySelectorAll('.mrow').length) >= 1 && n1 > 5, 'liste du portefeuille', n1 + ' niches');
  await p.screenshot({ path: OUT + 'desktop-03-section.png', fullPage: false });
  await p.click('#my-new'); await p.waitForTimeout(80);
  ok(await p.evaluate(() => document.activeElement.id) === 'my-name', 'nouveau portefeuille : champ de nom actif');
  await p.fill('#my-name', 'Lancement 11e'); await p.keyboard.press('Enter'); await p.waitForTimeout(80);
  ok(await p.$eval('#my-tabs [aria-pressed="true"]', e => e.textContent.startsWith('Lancement 11e')) && await count(p) === 0, 'portefeuille créé et renommé');
  await go(p, 'top'); for (let i = 0; i < 4; i++) { const b2 = (await p.$$('#topl .pfb'))[i]; if (await b2.getAttribute('aria-pressed') === 'false') await b2.click(); }
  await go(p, 'mon-portefeuille'); ok(await count(p) === 4, 'quatre niches dans « Lancement 11e »');
  await p.click('#my-dup'); await p.waitForTimeout(80);
  ok(await p.$$eval('#my-tabs button', a => a.length) === 3, 'portefeuille dupliqué');
  await p.click('#my-ren'); await p.fill('#my-name', 'Formats entreprise'); await p.click('#my-name-ok'); await p.waitForTimeout(80);
  ok(await p.$eval('#my-tabs [aria-pressed="true"]', e => e.textContent.startsWith('Formats entreprise')), 'renommer');
  await p.click('#my-del'); await p.waitForTimeout(50);
  ok(await p.$eval('#my-del', e => e.textContent) === 'Confirmer la suppression' && await p.$$eval('#my-tabs button', a => a.length) === 3, 'suppression : premier clic arme');
  await p.click('#my-del'); await p.waitForTimeout(80);
  ok(await p.$$eval('#my-tabs button', a => a.length) === 2, 'suppression : second clic supprime');
  await p.click('#my-tabs button >> nth=0'); await p.waitForTimeout(80);
  ok(await count(p) === n1, 'bascule vers le premier portefeuille');
  for (const g of ['prio', 'tag', 'verdict', 'sector']) { await p.click('[data-myg="' + g + '"]'); await p.waitForTimeout(40); }
  ok(await p.$$eval('#my-list .mgrp', a => a.length) > 1, 'regroupement par secteur');
  await p.selectOption('#my-sort', 'prio'); await p.waitForTimeout(50);
  ok(await p.$eval('#my-list .mrow .mn', e => e.getAttribute('data-open')) === rid, 'tri par priorité : la niche P1 en tête');
  await p.fill('#my-q', 'contact repéré'); await p.waitForTimeout(200);
  ok(await p.$$eval('#my-list .mrow', a => a.length) === 1, 'recherche dans les notes');
  await p.fill('#my-q', ''); await p.waitForTimeout(150);
  const syn = await p.evaluate(() => ({ syn: document.querySelectorAll('#my-syn .panel').length, lv: document.querySelectorAll('#my-lv tbody tr').length, mix: document.querySelectorAll('#my-mix tr').length, cmp: document.querySelectorAll('#my-cmp tbody tr').length, c: document.querySelectorAll('#my-c > div').length }));
  ok(syn.syn === 3 && syn.lv === 6 && syn.mix >= 1 && syn.cmp === 6 && syn.c === 5, 'synthèse, paliers et hôtes, mixes, comparaison', JSON.stringify(syn));
  await go(p, 'my-syn'); await p.screenshot({ path: OUT + 'desktop-04-synthese.png' });
  await go(p, 'my-cmp'); await p.screenshot({ path: OUT + 'desktop-05-comparaison.png' });

  // exports
  await go(p, 'my-io');
  const dl = async sel => { const [d] = await Promise.all([p.waitForEvent('download'), p.click(sel)]); const f = path.join(tmp, d.suggestedFilename()); await d.saveAs(f); return [d.suggestedFilename(), fs.readFileSync(f, 'utf8')]; };
  const [cn, csv] = await dl('#my-csv'); const rows = csv.replace(/^\ufeff/, '').split('\n');
  ok(/^portefeuille-.*\.csv$/.test(cn) && rows.length === n1 + 1 && rows[0].startsWith('id;secteur;categorie;sous_categorie;niche;verdict_etude;mon_verdict;priorite;etiquettes;note;paliers_retenus'), 'export CSV du portefeuille', cn + ' · ' + rows.length + ' lignes');
  const rr = rows.find(r => r.startsWith(rid + ';')) || '';
  ok(rr.includes(';a-tester;prioritaire;P1;"vague 1, 11e";"Contact repéré au café du coin";"P1 ') && !rr.includes('P4 '), 'ligne requalifiée dans le CSV');
  const [jn, json] = await dl('#my-json'); const J = JSON.parse(json);
  ok(/\.json$/.test(jn) && J.format === 'niches-v2.portefeuilles' && J.pfs.length === 2 && J.ov[rid].v === 'prioritaire', 'export JSON complet', jn);
  const [bn, base] = await dl('#my-base');
  ok(bn === 'niches-base-complete.csv' && base.replace(/^\ufeff/, '').split('\n').length === 1035, 'base complète CSV', base.split('\n').length + ' lignes');
  await p.click('#my-copy'); await p.waitForTimeout(150);
  ok(/copi|Copie/.test(await p.$eval('#toast-t', e => e.textContent)), 'bouton Copier', await p.$eval('#toast-t', e => e.textContent));

  // import : fusion par champ fichier, remplacement par glisser-déposer
  const jf = path.join(tmp, 'import.json');
  fs.writeFileSync(jf, JSON.stringify({ format: 'niches-v2.portefeuilles', version: 1, pfs: [{ id: 'p1', name: 'Importé', ids: J.pfs[0].ids.slice(0, 3).concat(['niche-inexistante']) }], ov: { [rid]: { t: ['entreprise'] } } }));
  await p.setInputFiles('#my-file', jf); await p.waitForTimeout(150);
  ok(await p.$eval('#my-prev', e => e.textContent.includes('Importé · 3 niches') && e.textContent.includes('1 identifiant inconnu')), 'aperçu de l’import');
  await p.click('[data-imp="merge"]'); await p.waitForTimeout(150);
  ok(await p.$$eval('#my-tabs button', a => a.length) === 3, 'import : fusion ajoute le portefeuille');
  await p.evaluate(t => { const dt = new DataTransfer(); dt.items.add(new File([t], 'export.json', { type: 'application/json' })); const z = document.getElementById('my-drop'); z.dispatchEvent(new DragEvent('dragover', { dataTransfer: dt, bubbles: true, cancelable: true })); z.dispatchEvent(new DragEvent('drop', { dataTransfer: dt, bubbles: true, cancelable: true })); }, json);
  await p.waitForTimeout(200);
  ok(await p.$eval('#my-prev', e => e.textContent.includes('Aperçu · export.json')), 'glisser-déposer');
  await p.click('[data-imp="replace"]'); await p.waitForTimeout(50);
  ok(await p.$eval('[data-imp="replace"]', e => e.textContent) === 'Confirmer le remplacement', 'remplacement en deux clics');
  await p.click('[data-imp="replace"]'); await p.waitForTimeout(150);
  const tabs = await p.$$eval('#my-tabs button', a => a.map(b => b.textContent));
  ok(tabs.length === 2 && await p.evaluate(() => MYPF) && true, 'import : remplacement', tabs.join(' | '));

  // persistance
  await p.waitForTimeout(1000);
  ok((await p.$eval('#sync-t', e => e.textContent)).includes('Enregistré sur cet appareil'), 'enregistrement local signalé', await p.$eval('#sync-t', e => e.textContent));
  const stored = await p.evaluate(() => localStorage.getItem('niches-v2.portefeuilles'));
  ok(stored && stored.length < 20000 && !stored.includes('"name":"Atelier'), 'document local compact', stored && stored.length + ' octets');
  const nBefore = await count(p);
  await p.reload(); await ready(p);
  ok(await count(p) === nBefore && await p.$$eval('#my-tabs button', a => a.length) === 2, 'persistance après rechargement');
  await go(p, 'explorer'); await p.click('[data-view="table"]'); await p.click('#f-mine [data-v="mod"]'); await p.waitForTimeout(150);
  ok(await p.$eval('#vis-cnt', e => +e.textContent.split('/')[0]) >= 1 && await p.$eval('.vrow .vd', e => e.textContent.includes('✎')), 'requalifications rechargées');
  await p.screenshot({ path: OUT + 'desktop-06-table.png' });
  ok(await overflow(p) <= 0, 'pas de débordement à 1440 px');
  await p.close();

  /* mobile 375 */
  const pm = await ctx.newPage(); watch(pm, 'mobile'); await pm.setViewportSize({ width: 375, height: 812 });
  await pm.goto(URL_); await ready(pm);
  await go(pm, 'explorer'); await pm.click('[data-t="cuisine"]'); await pm.waitForTimeout(100);
  await pm.screenshot({ path: OUT + 'mobile-01-tree.png' });
  await pm.click('[data-view="table"]'); await pm.waitForTimeout(150); await go(pm, 'xbody'); await pm.screenshot({ path: OUT + 'mobile-02-table.png' });
  await pm.click('.vrow .vopen >> nth=0'); await pm.waitForTimeout(250); await pm.evaluate(() => document.getElementById('side-mine').scrollIntoView()); await pm.screenshot({ path: OUT + 'mobile-03-fiche.png' });
  await pm.keyboard.press('Escape');
  await go(pm, 'mon-portefeuille'); await pm.screenshot({ path: OUT + 'mobile-04-section.png' });
  await go(pm, 'my-list'); await pm.screenshot({ path: OUT + 'mobile-05-liste.png' });
  await go(pm, 'my-lv'); await pm.screenshot({ path: OUT + 'mobile-07-paliers.png' });
  await go(pm, 'my-io'); await pm.screenshot({ path: OUT + 'mobile-06-io.png' });
  const ovm = await overflow(pm);
  ok(ovm <= 0, 'pas de débordement à 375 px', ovm);
  if (ovm > 0) console.log(await pm.evaluate(() => [...document.querySelectorAll('body *')].filter(e => e.getBoundingClientRect().right > window.innerWidth + 1 && !e.closest('.tw,.toc,.chart,.vbody,aside')).slice(0, 8).map(e => e.tagName + '.' + e.className + ' ' + Math.round(e.getBoundingClientRect().right))));
  await pm.close(); await ctx.close();

  /* ───── 2. page publiée simulée (faux window.claude, apparu après le premier rendu) ───── */
  const hctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  await hctx.addInitScript(() => {
    const KEY = '__fakedb', load = () => JSON.parse(localStorage.getItem(KEY) || '{}'), keep = o => localStorage.setItem(KEY, JSON.stringify(o));
    window.__log = { gets: 0, sets: [], subs: 0, dl: [], paths: [] };
    const listeners = {};
    const snap = (id, d) => ({ id, exists: !!d, data: () => d ? JSON.parse(JSON.stringify(d)) : undefined, metadata: { fromCache: false, hasPendingWrites: false } });
    const db = { collection: c => ({ doc: id => { const pth = c + '/' + id; window.__log.paths.push(pth); return {
      id, path: pth,
      get: async () => { window.__log.gets++; await new Promise(r => setTimeout(r, 120)); return snap(id, load()[pth]); },
      set: async o => { if (window.__log.inflight) window.__log.overlap = true; window.__log.inflight = true; await new Promise(r => setTimeout(r, 150)); const s = load(); s[pth] = JSON.parse(JSON.stringify(o)); keep(s); window.__log.sets.push(o); window.__log.inflight = false; (listeners[pth] || []).forEach(f => f(snap(id, o))); },
      update: async o => { const s = load(); s[pth] = Object.assign(s[pth] || {}, o); keep(s); },
      onSnapshot: (next) => { window.__log.subs++; (listeners[pth] = listeners[pth] || []).push(next); setTimeout(() => next(snap(id, load()[pth])), 50); return () => {}; }
    }; } }) };
    const user = { id: async () => 'u1' };
    const downloads = { save: async ({ filename, data }) => { window.__log.dl.push({ filename, n: data.length, head: data.slice(0, 60) }); } };
    setTimeout(() => { window.claude = { use: async n => { await new Promise(r => setTimeout(r, 200)); return n === 'db' ? db : n === 'user' ? user : n === 'downloads' ? downloads : null; } }; }, 300);
  });
  const h = await hctx.newPage(); watch(h, 'publiée');
  await h.goto(URL_); await ready(h);
  ok(await h.evaluate(() => window.__firstRender) < 1500, 'page publiée : rendu avant la capacité');
  await h.waitForFunction(() => /Compte relié|Synchronisé|Enregistré/.test(document.getElementById('sync-t').textContent), null, { timeout: 5000 });
  ok(true, 'page publiée : connexion au compte', await h.$eval('#sync-t', e => e.textContent));
  await go(h, 'top');
  for (let i = 0; i < 3; i++) await h.click('#topl .pfb >> nth=' + i);
  await h.waitForTimeout(400);
  ok(await h.evaluate(() => window.__log.sets.length) === 0, 'regroupement : aucune écriture avant 800 ms');
  await h.waitForFunction(() => window.__log.sets.length >= 1, null, { timeout: 4000 }); await h.waitForTimeout(600);
  const L1 = await h.evaluate(() => window.__log);
  ok(L1.sets.length === 1 && L1.sets[0].pfs[0].ids.length === 3, 'une seule écriture pour trois gestes', L1.sets.length);
  ok(L1.paths.every(x => x === 'data/users/u1/portefeuilles') && L1.gets === 1 && L1.subs === 1, 'chemin data/users/u1/portefeuilles, une lecture, un abonnement', L1.paths[0]);
  ok(JSON.stringify(L1.sets[0]).length < 2000 && !('niches' in L1.sets[0]), 'document distant compact', JSON.stringify(L1.sets[0]).length + ' octets');
  ok(/Enregistré · \d\d:\d\d/.test(await h.$eval('#sync-t', e => e.textContent)) && await h.$eval('#sync-dot', e => e.style.background.includes('--int')), 'indicateur menthe « Enregistré · hh:mm »', await h.$eval('#sync-t', e => e.textContent));
  // écritures successives sans chevauchement
  await go(h, 'explorer'); await h.click('[data-view="table"]'); await h.waitForTimeout(100);
  await h.click('.vrow .vopen >> nth=0'); await h.waitForTimeout(200);
  await h.click('#side-mine [data-mv="ecarter"]'); await h.waitForTimeout(900); await h.click('#side-mine [data-mp="2"]'); await h.waitForTimeout(1500);
  const L2 = await h.evaluate(() => window.__log);
  ok(!L2.overlap && L2.sets.length === 3, 'une écriture à la fois', L2.sets.length + ' écritures');
  await h.keyboard.press('Escape');
  await go(h, 'my-io'); await h.click('#my-csv'); await h.click('#my-json'); await h.click('#my-base'); await h.waitForTimeout(500);
  const dls = await h.evaluate(() => window.__log.dl);
  ok(dls.length === 3 && /\.csv$/.test(dls[0].filename) && /\.json$/.test(dls[1].filename) && dls[2].filename === 'niches-base-complete.csv', 'exports par downloads.save', dls.map(d => d.filename).join(', '));
  await h.screenshot({ path: OUT + 'hosted-01-appbar.png', clip: { x: 0, y: 0, width: 1440, height: 60 } });
  // rechargement : l'état revient du faux db (copie locale effacée)
  await h.evaluate(() => localStorage.removeItem('niches-v2.portefeuilles'));
  await h.reload(); await ready(h);
  await h.waitForFunction(() => +document.getElementById('pf-jump-n').textContent === 3, null, { timeout: 5000 }).catch(() => {});
  ok(await count(h) === 3, 'page publiée : état relu depuis db après rechargement', await count(h));
  await h.waitForTimeout(1200);
  ok(await h.evaluate(() => window.__log.sets.length) === 0, 'aucune écriture au chargement sans changement');
  await h.close(); await hctx.close();

  /* db indisponible (null) : repli local */
  const nctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await nctx.addInitScript(() => { window.claude = { use: async () => null }; });
  const nb = await nctx.newPage(); watch(nb, 'sans-db');
  await nb.goto(URL_); await ready(nb); await nb.waitForTimeout(400);
  await go(nb, 'top'); await nb.click('#topl .pfb >> nth=0'); await nb.waitForTimeout(1100);
  ok((await nb.$eval('#sync-t', e => e.textContent)).includes('appareil') && !!(await nb.evaluate(() => localStorage.getItem('niches-v2.portefeuilles'))), 'db null : repli localStorage signalé', await nb.$eval('#sync-t', e => e.textContent));
  await nb.close(); await nctx.close();

  ok(!errs.length, 'zéro erreur console', errs.join(' | '));
  console.log('Portefeuille :', fails ? fails + ' échec(s)' : 'tous les tests passent');
  return fails;
};
if (require.main === module) (async () => { const b = await require('playwright').chromium.launch(); const f = await module.exports(b); await b.close(); process.exitCode = f ? 1 : 0; })();
