/* Test de bout en bout avec Playwright (Chromium), en file://.
   Usage : node app/dev/e2e.js [dossier_captures]
   Parcours demandeur (375 px), parcours offreur (1440 px), démos, exports, Autour de moi (réponses OSM simulées),
   comparaison, lien de partage, persistance. Échoue s'il y a une erreur console. */
'use strict';
const path = require('path');
const fs = require('fs');
let chromium;
try { ({ chromium } = require('playwright')); } catch (e) { ({ chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright')); }

const URL = 'file://' + path.resolve(__dirname, '..', 'index.html');
const SHOTS = process.argv[2] || path.resolve(__dirname, 'shots');
fs.mkdirSync(SHOTS, { recursive: true });
let fails = 0, passes = 0;
const ok = (c, m) => { if (c) { passes++; console.log('  ok ·', m); } else { fails++; console.log('  ÉCHEC ·', m); } };

const NOMINATIM = [{ lat: '45.7640', lon: '4.8357', display_name: 'Lyon, Métropole de Lyon, France' }];
const OVERPASS = { elements: [
  { type: 'node', id: 1, lat: 45.7655, lon: 4.8370, tags: { name: 'Atelier Terre & Feu', craft: 'pottery', 'addr:street': 'Rue Mercière', 'addr:housenumber': '12' } },
  { type: 'way', id: 2, center: { lat: 45.7700, lon: 4.8300 }, tags: { name: 'Fablab de la Croix-Rousse', leisure: 'hackerspace', website: 'https://example.org' } },
  { type: 'node', id: 3, lat: 45.7500, lon: 4.8500, tags: { amenity: 'community_centre', name: 'MJC Presqu’île' } },
  { type: 'node', id: 4, lat: 45.7600, lon: 4.8400, tags: { amenity: 'music_school', name: 'École de musique du 2e' } }
] };

async function newPage(browser, width, errs) {
  const ctx = await browser.newContext({ viewport: { width, height: width < 600 ? 812 : 900 }, deviceScaleFactor: 1, acceptDownloads: true });
  await ctx.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  await ctx.route(/nominatim\.openstreetmap\.org/, r => r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(NOMINATIM) }));
  await ctx.route(/overpass/, r => r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(OVERPASS) }));
  const page = await ctx.newPage();
  page.on('console', m => { if ((m.type() === 'error' || m.type() === 'warning') && !/Failed to load resource/.test(m.text())) errs.push(width + ' · ' + m.type() + ': ' + m.text()); });
  page.on('pageerror', e => errs.push(width + ' · pageerror: ' + e.message));
  await page.addInitScript(() => { window.print = () => { window.__printed = (window.__printed || 0) + 1; }; window.confirm = () => true; });
  return { ctx, page };
}
const shot = (page, name, full = true) => page.screenshot({ path: path.join(SHOTS, name + '.png'), fullPage: full });
async function download(page, clickSel) {
  const [d] = await Promise.all([page.waitForEvent('download', { timeout: 5000 }), page.click(clickSel)]);
  const p = await d.path(); const size = p ? fs.statSync(p).size : 0;
  return { name: d.suggestedFilename(), size, content: p ? fs.readFileSync(p, 'utf8') : '' };
}

(async () => {
  const browser = await chromium.launch();
  const errs = [];

  /* ---------- parcours demandeur, 375 px ---------- */
  console.log('Parcours demandeur · 375 px');
  {
    const { page } = await newPage(browser, 375, errs);
    await page.goto(URL);
    await shot(page, 'e2e-375-01-accueil');
    await page.click('[data-act="start"][data-mode="learn"]');
    await page.fill('#f-name', 'Sam');
    await page.fill('#f-city', 'Lyon');
    await page.click('[data-bind="context.budgetPerMonth"][data-val="100"]');
    await page.click('[data-bind="intents"][data-val="rencontres"]');
    await shot(page, 'e2e-375-02-contexte');
    await page.click('[data-act="next"]');
    ok(await page.isVisible('text=Ce que vous savez déjà faire'), 'étape maîtrise affichée');
    await page.fill('#mq', 'guitare');
    await page.waitForTimeout(100);
    const g = page.locator('#mres .schip').first();
    await g.click(); await g.click();
    await page.click('[data-act="openUni"][data-u="cuisine"]');
    const chips = page.locator('#dompanel .schip');
    await chips.nth(0).click(); await chips.nth(1).click(); await chips.nth(1).click(); await chips.nth(1).click();
    await page.click('[data-act="openUni"][data-u="parole"]');
    await page.locator('#dompanel .schip').nth(0).click();
    await shot(page, 'e2e-375-03-maitrise');
    const known = await page.evaluate(() => Object.values(Cordes.ui.st.skills).filter(s => s.level > 0).length);
    ok(known >= 4, 'compétences notées par appui (' + known + ')');
    await page.click('[data-act="next"]');
    ok(await page.isVisible('#card'), 'paquet de cartes affiché');
    const first = await page.getAttribute('#card', 'data-id');
    await page.keyboard.press('ArrowRight'); await page.waitForTimeout(320);
    const second = await page.getAttribute('#card', 'data-id');
    ok(first !== second, 'flèche droite : carte suivante');
    await page.keyboard.press('ArrowLeft'); await page.waitForTimeout(320);
    await page.keyboard.press('ArrowDown'); await page.waitForTimeout(320);
    await page.click('[data-act="verdict"][data-v="yes"]'); await page.waitForTimeout(320);
    await page.click('[data-act="verdict"][data-v="yes"]'); await page.waitForTimeout(320);
    await shot(page, 'e2e-375-04-envies');
    const yes = await page.evaluate(() => Cordes.yesDesires(Cordes.ui.st).length);
    ok(yes === 3, '3 envies retenues (' + yes + ')');
    const learned = await page.evaluate(() => Object.keys(Cordes.ui.st.deck.tagW).length);
    ok(learned > 0, 'poids appris enregistrés (' + learned + ' tags)');
    await page.click('[data-act="next"]');
    await page.locator('[data-act="set"][data-val="3"]').first().click();
    await page.locator('[data-act="toggle"][data-val="atelier"]').first().click();
    await shot(page, 'e2e-375-05-affinage');
    await page.click('[data-act="next"]');
    for (let i = 1; i <= 8; i++) await page.locator(`[data-act="answer"][data-q="q${i}"]`).nth(i % 3).click();
    await shot(page, 'e2e-375-06-style');
    await page.click('[data-act="next"]');
    await page.waitForTimeout(200);
    ok(page.url().endsWith('#/resultats'), 'arrivée sur les résultats');
    ok(await page.locator('svg.radar').count() === 1, 'radar rendu');
    ok(await page.locator('svg.constel').count() === 1, 'constellation rendue');
    ok(await page.locator('details.desire').count() === 3, '3 plans d’apprentissage');
    await page.locator('details.desire').first().locator('[data-tab="ou"]').click();
    ok(await page.locator('.tabpanel:not([hidden]) .resitem').count() >= 3, 'où apprendre : ressources listées');
    await page.locator('details.desire').first().locator('[data-tab="autour"]').click();
    await page.locator('details.desire').first().locator('[data-act="osmInline"]').click();
    await page.waitForSelector('details.desire .place', { timeout: 8000 });
    ok(await page.locator('details.desire .place').count() >= 1, 'autour de moi intégré au plan (réponse OSM simulée)');
    await shot(page, 'e2e-375-07-resultats');
    const ov = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    ok(ov <= 0, 'aucun débordement horizontal à 375 px (' + ov + ' px)');
    // exports
    const pass = await download(page, '.actionsbar [data-act="passport"]');
    ok(/passeport\.html$/.test(pass.name) && pass.content.includes('cordes-data') && pass.size > 5000, 'passeport HTML téléchargé (' + pass.size + ' o)');
    const ics = await download(page, '.actionsbar [data-act="ics"]');
    ok(ics.name.endsWith('.ics') && ics.content.startsWith('BEGIN:VCALENDAR'), 'agenda .ics téléchargé (' + (ics.content.match(/BEGIN:VEVENT/g) || []).length + ' événements)');
    const js = await download(page, '.actionsbar [data-act="json"]');
    ok(JSON.parse(js.content).profile.context.firstName === 'Sam', 'export JSON téléchargé');
    await page.click('.actionsbar [data-act="print"]');
    ok(await page.evaluate(() => window.__printed === 1), 'impression déclenchée');
    await page.click('.actionsbar [data-act="share"]');
    await page.waitForSelector('#drawer.open textarea');
    const link = await page.inputValue('#drawer textarea');
    ok(/#b=[zj][A-Za-z0-9_-]+$/.test(link), 'lien de partage généré');
    await shot(page, 'e2e-375-08-partage', false);
    await page.keyboard.press('Escape'); await page.waitForTimeout(250);
    ok(await page.isHidden('#drawer'), 'Esc ferme le panneau');
    await page.click('[data-act="challenge"].tile');
    await page.locator('#drawer .day input').first().check();
    ok(await page.evaluate(() => Object.keys(Cordes.ui.st.challenge.checked).length === 1), 'défi 30 jours : jour coché et enregistré');
    await page.keyboard.press('Escape'); await page.waitForTimeout(250);
    await page.click('[data-act="wishlist"].tile'); ok(await page.isVisible('#drawer .copyblock'), 'liste d’envies à offrir'); await page.keyboard.press('Escape'); await page.waitForTimeout(250);
    await page.click('[data-act="cv"].tile'); ok(await page.isVisible('#drawer .copyblock'), 'section CV'); await page.keyboard.press('Escape'); await page.waitForTimeout(250);
    // persistance
    await page.reload(); await page.waitForTimeout(200);
    ok(await page.evaluate(() => Cordes.ui.st.context.firstName === 'Sam' && Cordes.yesDesires(Cordes.ui.st).length === 3), 'reprise après rechargement');
    // vue partagée
    await page.goto(URL + '#/accueil'); await page.evaluate(l => { location.hash = l.split('#')[1]; }, link);
    await page.waitForSelector('text=Le bilan de Sam', { timeout: 5000 });
    ok(true, 'lien #b= lisible dans une autre vue');
    await shot(page, 'e2e-375-09-vue-partagee');
  }

  /* ---------- parcours offreur, 1440 px ---------- */
  console.log('Parcours offreur · 1440 px');
  {
    const { page } = await newPage(browser, 1440, errs);
    await page.goto(URL);
    await page.click('[data-act="start"][data-mode="offer"]');
    await page.fill('#f-name', 'Nora'); await page.fill('#f-city', 'Paris');
    await page.click('[data-act="next"]');
    await page.fill('#mq', 'céramique'); await page.waitForTimeout(100);
    let c = page.locator('#mres .schip').first(); for (let i = 0; i < 4; i++) await c.click();
    await page.fill('#mq', 'illustration'); await page.waitForTimeout(100);
    c = page.locator('#mres .schip').first(); for (let i = 0; i < 3; i++) await c.click();
    await page.fill('#mq', 'yoga'); await page.waitForTimeout(100);
    c = page.locator('#mres .schip').first(); for (let i = 0; i < 3; i++) await c.click();
    await page.click('[data-act="next"]');
    ok(await page.isVisible('text=Vos compétences fortes'), 'étape forces');
    ok(await page.locator('section.panel .h3').count() >= 3, 'compétences fortes présélectionnées');
    await page.locator('input[type=number][data-bind$=".years"]').first().fill('9');
    await page.locator('[data-bind$=".proof"][data-val="realisations"]').first().click();
    await shot(page, 'e2e-1440-01-forces');
    await page.click('[data-act="next"]');
    await page.click('[data-bind="offer.goals"][data-val="complement"]');
    await page.click('[data-bind="offer.audiences"][data-val="entreprises"]');
    await page.click('[data-bind="offer.incomeTarget"][data-val="1000"]');
    await shot(page, 'e2e-1440-02-offre');
    await page.click('[data-act="next"]');
    for (const q of ['risk', 'sales', 'camera', 'admin', 'collective', 'network']) await page.click(`[data-bind="offer.entrepreneur.${q}"][data-val="2"]`);
    await page.click('[data-act="next"]'); await page.waitForTimeout(200);
    ok(page.url().endsWith('#/offre'), 'arrivée sur le plan de valorisation');
    const nOff = await page.locator('article.offer').count();
    ok(nOff >= 3 && nOff <= 6, nOff + ' offres générées');
    ok(await page.locator('.chtable .gtr:not(.h)').count() >= 5, 'canaux classés');
    ok(await page.isVisible('text=Cordes · bientôt'), 'canal « notre plateforme · bientôt »');
    const net0 = await page.textContent('#sim-counters .counter:nth-child(4) .v');
    await page.locator('#sim-hours').fill('30'); await page.locator('#sim-hours').dispatchEvent('input');
    const net1 = await page.textContent('#sim-counters .counter:nth-child(4) .v');
    ok(net0 !== net1, 'simulateur interactif (' + net0.trim() + ' → ' + net1.trim() + ')');
    await page.locator('.task input').first().check(); await page.waitForTimeout(150);
    await page.reload(); await page.waitForTimeout(250);
    ok(await page.locator('.task input').first().isChecked(), 'feuille de route cochable et persistée');
    ok(await page.locator('.copyblock').count() >= 6, 'kit de lancement');
    await page.click('[data-act="scrollTo"][data-target="s-sim"]');
    await page.waitForTimeout(300);
    await shot(page, 'e2e-1440-03-plan');
    const ics = await download(page, '#s-route ~ .spread [data-act="ics"], .spread [data-act="ics"]');
    ok(ics.content.includes('BEGIN:VEVENT'), 'feuille de route exportée en .ics');
    const pass = await download(page, '.actionsbar [data-act="passport"]');
    ok(pass.content.includes('Ce que je propose'), 'passeport avec les offres');
    // liste d'attente hôte fondateur
    await page.click('a[href="#/attente/host"]');
    await page.fill('#wl-email', 'nora@example.org');
    await page.click('[data-act="wlSave"]');
    ok(await page.isVisible('text=Inscription enregistrée'), 'liste d’attente hôte fondateur');
    // autour de moi (outil complet)
    await page.goto(URL + '#/outils/autour/artisanat');
    await page.fill('#osm-city', 'Lyon');
    await page.click('[data-act="osmRun"]');
    await page.waitForSelector('#osm-body .place', { timeout: 8000 });
    ok(await page.locator('#osm-body .place').count() === 4, 'Autour de moi : 4 lieux triés par distance');
    const d = await page.$$eval('#osm-body .dist', els => els.map(e => e.textContent));
    ok(d.length && /m$/.test(d[0]), 'distances affichées (' + d.join(', ') + ')');
    await shot(page, 'e2e-1440-04-autour');
    // comment ça marche, démo, comparer
    await page.goto(URL + '#/comment'); ok(await page.isVisible('text=JaccardIDF'), 'page Comment ça marche'); await shot(page, 'e2e-1440-05-comment', false);
    await page.goto(URL + '#/comparer'); await page.click('[data-act="cmpDemo"]');
    await page.waitForSelector('text=Trocs possibles', { timeout: 5000 }); ok(true, 'comparaison avec un ami');
    await shot(page, 'e2e-1440-06-comparer');
    for (const id of ['ines', 'malik', 'claire']) {
      await page.goto(URL + '#/demo'); await page.click(`[data-act="loadDemo"][data-id="${id}"]`); await page.waitForTimeout(300);
      ok(await page.locator('.counters').count() >= 1, 'démo ' + id + ' affichée');
    }
    await page.goto(URL + '#/demo'); ok(await page.isVisible('[data-act="restoreBackup"]'), 'bilan mis de côté restaurable');
    // repli OSM en cas d'échec réseau
    await page.unroute(/overpass/); await page.route(/overpass/, r => r.abort());
    await page.goto(URL + '#/outils/autour'); await page.fill('#osm-city', 'Lyon'); await page.click('[data-act="osmRun"]');
    await page.waitForSelector('#osm-body .note.no', { timeout: 10000 });
    ok(await page.locator('#osm-body .linkgrid a').count() >= 3, 'échec Overpass : message clair et recherches préparées');
  }
  await browser.close();
  console.log('\nErreurs console : ' + (errs.length ? '\n  ' + errs.join('\n  ') : 'aucune'));
  console.log(`${passes} vérifications OK, ${fails} échec(s), ${errs.length} erreur(s) console.`);
  process.exit(fails || errs.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
