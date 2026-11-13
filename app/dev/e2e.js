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
const vis = async (page, sel, t = 4000) => { try { await page.waitForSelector(sel, { state: 'visible', timeout: t }); return true; } catch (e) { return false; } };
const noOverflow2 = async (page, name) => { const ov = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth); ok(ov <= 0, name + ' : aucun débordement à 375 px (' + ov + ' px)'); };
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
    ok(await vis(page, 'text=Ce que vous savez déjà faire'), 'étape maîtrise affichée');
    await page.fill('#mq', 'guitare');
    await page.waitForTimeout(100);
    const g = page.locator('#mres .schip').first();
    await g.click(); await g.click();
    await page.click('[data-act="openUni"][data-u="cuisine"]');
    const chips = page.locator('#dompanel .schip');
    await chips.nth(0).click(); await chips.nth(1).click(); await chips.nth(1).click(); await chips.nth(1).click();
    await page.click('[data-act="openUni"][data-u="parole"]');
    await page.locator('#dompanel .schip').nth(0).click();
    ok(await page.locator('.lvlegend li').count() === 5 && /anime le niveau 4, forme les hôtes/.test(await page.textContent('.lvlegend')), 'inventaire : légende des 5 niveaux et palier animé');
    ok(/au niveau 3, vous animez les ateliers de niveau 2/.test(await page.textContent('.rulehelp')), 'inventaire : aide en une ligne sur la règle d’animation');
    const cyc = page.locator('#dompanel .schip').nth(2), cycId = await cyc.getAttribute('data-id');
    const lv = id => page.evaluate(i => (Cordes.ui.st.skills[i] || {}).level || 0, id);
    const seq = []; for (let i = 0; i < 6; i++) { await cyc.click(); seq.push(await lv(cycId)); }
    ok(seq.join() === '1,2,3,4,5,0', 'inventaire : cycle 0 → 5 puis retour à 0 (' + seq.join(' ') + ')');
    await cyc.focus(); await page.keyboard.press('5');
    ok(await lv(cycId) === 5 && /5 · Référent/.test(await cyc.textContent()) && await cyc.locator('.dots i.on').count() === 5, 'inventaire : touche 5 → Référent, 5 pastilles');
    await page.keyboard.press('0');
    ok(await lv(cycId) === 0, 'inventaire : touche 0 → remise à zéro');
    await shot(page, 'e2e-375-03-maitrise');
    const known = await page.evaluate(() => Object.values(Cordes.ui.st.skills).filter(s => s.level > 0).length);
    ok(known >= 4, 'compétences notées par appui (' + known + ')');
    await page.click('[data-act="next"]');
    ok(await vis(page, '#card'), 'paquet de cartes affiché');
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
    ok(await page.locator('[data-bind$=".target"]').first().evaluate(el => [...el.parentNode.querySelectorAll('button')].map(b => b.dataset.val).join()) === '2,3,4,5', 'envies : niveau visé sur l’échelle 2 à 5');
    ok(await page.locator('section.panel').first().locator('.palpath li').count() === 3 && /un hôte de niveau 4 \(je maîtrise\)/.test(await page.locator('section.panel').first().locator('.palpath').textContent()), 'envies : paliers et « qui peut vous faire progresser »');
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
    ok(/≈ \d+ h · \d/.test(await page.locator('details.desire').first().locator('.palpath').textContent()), 'plan par paliers : heures et budget de chaque atelier');
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
    await page.click('[data-act="wishlist"].tile'); ok(await vis(page, '#drawer .copyblock'), 'liste d’envies à offrir'); await page.keyboard.press('Escape'); await page.waitForTimeout(250);
    await page.click('[data-act="cv"].tile'); ok(await vis(page, '#drawer .copyblock'), 'section CV'); await page.keyboard.press('Escape'); await page.waitForTimeout(250);
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
    ok(await vis(page, 'text=Vos compétences fortes'), 'étape forces');
    ok(await page.locator('section.panel .h3').count() >= 3, 'compétences fortes présélectionnées');
    await page.locator('input[type=number][data-bind$=".years"]').first().fill('9');
    await page.locator('[data-bind$=".proof"][data-val="realisations"]').first().click();
    ok(/Vous pouvez animer les ateliers de niveau 3 \(Je consolide\)/.test(await page.locator('.animtext').first().textContent()), 'forces : palier animé affiché selon le niveau');
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
    ok(await vis(page, '#ladder') && /Vous êtes niveau 4 : vous pouvez animer les ateliers de niveau 3 \(Je consolide\)/.test(await page.textContent('#ladder')), 'offreur : « vous êtes niveau 4 : vous pouvez animer les ateliers de niveau 3 »');
    ok(await page.locator('#ladder .ladder5').first().locator(':scope > div').count() === 5 && /Pour animer le palier \d : monter au niveau \d/.test(await page.textContent('#ladder')), 'offreur : échelle de progression vers le palier supérieur');
    ok(await page.locator('article.offer .animline').count() === nOff, 'offreur : chaque offre affiche son palier');
    ok(/Monter au niveau \d .* pour animer le palier \d/.test(await page.textContent('#s-route ~ .roadmap')), 'feuille de route : monter d’un niveau');
    ok(await page.locator('.chtable .gtr:not(.h)').count() >= 5, 'canaux classés');
    ok(await vis(page, 'text=Cordes · bientôt'), 'canal « notre plateforme · bientôt »');
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
    ok(pass.content.includes('Ce que je propose') && pass.content.includes('Échelle de maîtrise et règle d’animation'), 'passeport avec les offres, l’échelle et la règle');
    // liste d'attente hôte fondateur
    await page.click('a[href="#/attente/host"]');
    await page.fill('#wl-email', 'nora@example.org');
    await page.check('#wl-consent');
    await page.click('[data-act="wlSave"]');
    ok(await vis(page, 'text=Inscription enregistrée'), 'liste d’attente hôte fondateur');
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
    await page.goto(URL + '#/comment'); ok(await vis(page, 'text=JaccardIDF') && await page.locator('#d-echelle .scaletable tbody tr').count() === 6, 'page Comment ça marche, avec l’échelle 0 à 5 et la règle'); await shot(page, 'e2e-1440-05-comment', false);
    await page.goto(URL + '#/comparer'); await page.click('[data-act="cmpDemo"]');
    await page.waitForSelector('text=Trocs possibles', { timeout: 5000 }); ok(true, 'comparaison avec un ami');
    await shot(page, 'e2e-1440-06-comparer');
    for (const id of ['ines', 'malik', 'claire']) {
      await page.goto(URL + '#/demo'); await page.click(`[data-act="loadDemo"][data-id="${id}"]`); await page.waitForTimeout(300);
      ok(await page.locator('.counters').count() >= 1, 'démo ' + id + ' affichée');
    }
    await page.goto(URL + '#/demo'); ok(await vis(page, '[data-act="restoreBackup"]'), 'bilan mis de côté restaurable');
    // repli OSM en cas d'échec réseau
    await page.unroute(/overpass/); await page.route(/overpass/, r => r.abort());
    await page.goto(URL + '#/outils/autour'); await page.fill('#osm-city', 'Lyon'); await page.click('[data-act="osmRun"]');
    await page.waitForSelector('#osm-body .note.no', { timeout: 10000 });
    ok(await page.locator('#osm-body .linkgrid a').count() >= 3, 'échec Overpass : message clair et recherches préparées');
  }
  /* ---------- lot 2 : croissance et étude, 375 px ---------- */
  console.log('Lot 2 · 375 px');
  {
    const { page } = await newPage(browser, 375, errs);
    const noOverflow = async name => { const ov = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth); ok(ov <= 0, name + ' : aucun débordement à 375 px (' + ov + ' px)'); };
    await page.goto(URL);
    await page.evaluate(() => { const st = Cordes.buildDemo('ines'); delete st.demo; st.context.firstName = 'Lou'; st.context.city = 'Paris'; localStorage.setItem('cordes.v1', JSON.stringify(st)); });
    await page.goto(URL + '#/resultats'); await page.reload(); await page.waitForTimeout(250);
    ok(await page.locator('#usages ~ .tiles .tile, .tiles .tile[data-act]').count() === 12, 'résultats : 12 utilisations du bilan');
    ok(await page.evaluate(() => Cordes.history.list().length === 1), 'A5 · instantané daté à l’arrivée aux résultats');
    // A4 carte image
    await page.click('[data-act="card"].tile');
    await page.waitForSelector('#card-prev img', { timeout: 8000 });
    const png = await download(page, '#drawer [data-act="cardDl"]');
    ok(/carte-carre\.png$/.test(png.name) && png.size > 20000, 'A4 · carte carrée téléchargée en PNG (' + png.size + ' o)');
    const dims = await page.evaluate(() => { const i = document.querySelector('#card-prev img'); return [i.naturalWidth, i.naturalHeight]; });
    ok(dims[0] === 1080 && dims[1] === 1080, 'A4 · 1080 × 1080');
    await page.click('#drawer [data-act="cardFmt"][data-val="story"]');
    await page.waitForSelector('#card-prev img.story', { timeout: 8000 });
    ok(await page.evaluate(() => document.querySelector('#card-prev img').naturalHeight === 1920), 'A4 · format story 1080 × 1920');
    await shot(page, 'e2e-375-10-carte', false);
    await page.keyboard.press('Escape'); await page.waitForTimeout(200);
    // A6 questionnaire
    ok(await vis(page, '#survey'), 'A6 · questionnaire en fin de bilan');
    ok(await page.isDisabled('[data-act="svSend"]'), 'A6 · envoi bloqué tant que les 4 questions ne sont pas répondues');
    for (const [k, v] of [['u', '4'], ['nps', '9'], ['int', 'oui'], ['pay', 'peut-etre']]) await page.click(`[data-act="svSet"][data-k="${k}"][data-v="${v}"]`);
    await page.fill('#sv-miss', 'Des cours le dimanche matin');
    await page.click('[data-act="svSend"]');
    ok(await vis(page, '#survey .note.int'), 'A6 · réponses enregistrées');
    const sv = await page.evaluate(() => ({ list: JSON.parse(localStorage.getItem('cordes.survey')), arm: JSON.parse(localStorage.getItem('cordes.priceArm')) }));
    ok(sv.list.length === 1 && [12, 15, 19].includes(sv.arm) && sv.list[0].arm === sv.arm && sv.list[0].nps === 9, 'A6 · prix testé mémorisé (' + sv.arm + ' €)');
    // A8 compteur
    ok(/Le 11e ouvre|ouvre à 50 inscrits/.test(await page.textContent('#avis ~ .grid2 .quarter')), 'A8 · compteur d’ouverture affiché');
    await shot(page, 'e2e-375-11-fin-resultats', false);
    // A5 progrès
    await page.goto(URL + '#/progres'); await page.waitForTimeout(200);
    ok(await vis(page, 'text=Ce qui a bougé'), 'A5 · écran de progrès');
    const rics = await download(page, '[data-act="progIcs"]');
    ok(/RRULE:FREQ=MONTHLY;INTERVAL=3/.test(rics.content), 'A5 · rappel .ics tous les 3 mois');
    await page.evaluate(() => { const l = Cordes.history.list(); l[0].at = new Date(Date.now() - 95 * 864e5).toISOString(); l[0].skills['anglais-conversation'] = 3; localStorage.setItem('cordes.history', JSON.stringify(l)); });
    await page.reload(); await page.waitForTimeout(200);
    ok(/\+1/.test(await page.textContent('.counters .counter:nth-child(2) .v')), 'A5 · avant/après : niveau gagné détecté');
    await noOverflow('progrès');
    await shot(page, 'e2e-375-12-progres');
    // A1 liste d'attente
    await page.goto(URL + '#/attente'); await page.waitForTimeout(200);
    ok(await page.locator('.chip.on[data-act="wlSkill"]').count() >= 5, 'A1 · compétences pré-remplies depuis le bilan (' + await page.locator('.chip.on[data-act="wlSkill"]').count() + ')');
    ok(await page.isVisible('#wl-arr'), 'A1 · arrondissement proposé pour Paris');
    await page.selectOption('#wl-arr', '11e');
    await page.fill('#wl-email', 'lou@example.org');
    await page.click('[data-act="wlSave"]');
    ok(await page.evaluate(() => !localStorage.getItem('cordes.waitlist')), 'A1 · refus sans consentement');
    await page.check('#wl-consent');
    await page.click('[data-act="wlSave"]');
    ok(await vis(page, 'text=Inscription enregistrée'), 'A1 · inscription enregistrée');
    const wl = await page.evaluate(() => JSON.parse(localStorage.getItem('cordes.waitlist'))[0]);
    ok(wl.zone === 'Paris 11e' && wl.consent && wl.wants.length >= 3 && wl.role === 'apprendre', 'A1 · zone, rôle, envies et consentement stockés');
    ok(/1 inscription sur cet appareil/.test(await page.textContent('#wl-quarter')), 'A8 · compteur local incrémenté');
    const wcsv = await download(page, '[data-act="wlCsv"]');
    ok(/Paris 11e/.test(wcsv.content) && /lou@example.org/.test(wcsv.content), 'A1 · export CSV');
    await noOverflow('liste d’attente');
    await shot(page, 'e2e-375-13-attente');
    // A10 lieu partenaire
    await page.goto(URL + '#/lieu'); await page.waitForTimeout(200);
    await page.fill('#v-name', 'Café des Volontaires');
    await page.fill('#v-city', 'Paris'); await page.dispatchEvent('#v-city', 'change'); await page.waitForTimeout(150);
    await page.selectOption('#v-arr', '11e');
    for (const k of ['1:aprem', '2:aprem', '4:matin']) await page.click(`[data-act="vSlot"][data-k="${k}"]`);
    await page.click('[data-act="vEquip"][data-v="machine"]');
    await page.click('[data-act="vFormula"][data-v="membre"]');
    ok(await page.locator('#venue-out .resitem').count() >= 8, 'A10 · compétences compatibles');
    ok(/Café de spécialité|Latte art/.test(await page.textContent('#venue-out')), 'A10 · équipement pris en compte (machine à café)');
    ok(/FICHE LIEU PARTENAIRE · Café des Volontaires/.test(await page.textContent('#venue-out .copyblock')), 'A10 · fiche partenaire générée');
    await page.click('[data-act="vJoin"]');
    await page.waitForTimeout(100);
    ok(await page.evaluate(() => Cordes.ui.st.waitlist.role !== 'lieu'), 'A10 · consentement exigé');
    await page.check('#v-consent'); await page.click('[data-act="vJoin"]'); await page.waitForTimeout(200);
    ok(await page.evaluate(() => { const l = JSON.parse(localStorage.getItem('cordes.waitlist')); const v = l.find(x => x.role === 'lieu'); return v && v.venue.name === 'Café des Volontaires' && v.venue.slots.length === 3 && v.zone === 'Paris 11e'; }), 'A10 · lieu inscrit à la liste d’attente (rôle lieu)');
    await noOverflow('lieu partenaire');
    await shot(page, 'e2e-375-14-lieu');
    // A7 groupe
    await page.goto(URL + '#/groupe'); await page.waitForTimeout(150);
    await page.click('[data-act="grpDemo"]');
    await page.waitForSelector('table.matrix', { timeout: 8000 });
    ok(await page.locator('table.matrix tbody tr').count() === 5, 'A7 · matrice de trocs à 5 membres (dont moi)');
    ok(await page.locator('table.matrix td.hot').count() >= 5, 'A7 · trocs trouvés dans la matrice');
    ok(await page.locator('text=Qui anime quoi').count() === 1, 'A7 · qui anime quoi');
    ok(/animé par \S+, niveau \d.*atelier de niveau \d/.test(await page.textContent('.wrap')), 'A7 · qui anime quoi : niveau de l’hôte et palier animé');
    await noOverflow('groupe');
    await shot(page, 'e2e-375-15-groupe');
    // A3 + A6 tableau de bord
    await page.goto(URL + '#/admin/metrics'); await page.waitForTimeout(200);
    ok(await page.locator('.frow').count() === 8, 'A3 · entonnoir à 8 étapes');
    const funnel = await page.$$eval('.frow .num > b', b => b.map(x => +x.textContent));
    ok(funnel.length === 8 && funnel[0] >= 1 && funnel[4] >= 1 && funnel[6] >= 1 && funnel[7] >= 1, 'A3 · étapes mesurées sur cet appareil (' + funnel.join(' · ') + ')');
    ok(/1/.test(await page.textContent('#q ~ .counters .counter .v')), 'A6 · réponse visible dans le tableau de bord');
    await page.click('[data-act="mSrc"][data-val="demo"]'); await page.click('[data-act="mSim"]'); await page.waitForTimeout(200);
    ok(/Données fictives/i.test(await page.textContent('.note.wait .lbl')) && await page.locator('.ph .t', { hasText: 'Test du prix' }).count() === 1, 'A3 · démonstration clairement marquée, test du prix');
    await noOverflow('mesure');
    await shot(page, 'e2e-375-16-mesure');
    // A2 données
    await page.goto(URL + '#/donnees'); await page.waitForTimeout(150);
    const all = await download(page, '[data-act="dataExport"]');
    const parsed = JSON.parse(all.content);
    ok(parsed.data['cordes.v1'] && parsed.data['cordes.waitlist'].length === 2 && parsed.data['cordes.history'].length >= 1, 'A2 · export complet JSON (' + Object.keys(parsed.data).join(', ') + ' · ' + (parsed.data['cordes.waitlist'] || []).length + ' inscriptions)');
    await page.click('[data-act="dataErase"]'); await page.waitForTimeout(200);
    ok(await page.evaluate(() => Object.keys(localStorage).filter(k => k.startsWith('cordes.')).length === 0 && !Cordes.ui.st.mode), 'A2 · suppression totale en un geste');
    await shot(page, 'e2e-375-17-donnees');
  }
  /* ---------- échelle 0 à 5 : migration, ancien lien, troc de démo, 375 px ---------- */
  console.log('Échelle 0 à 5 · 375 px');
  {
    const { page } = await newPage(browser, 375, errs);
    await page.goto(URL);
    // bilan enregistré avec l'ancienne échelle (0 à 4)
    await page.evaluate(() => localStorage.setItem('cordes.v1', JSON.stringify({ version: 1, mode: 'learn', step: 'done', context: { firstName: 'Ana', city: 'Lyon' },
      skills: { 'latte-art': { level: 1 }, 'dj-mix': { level: 2 }, 'eloquence': { level: 3 }, 'beatmaking': { level: 4 } }, desires: { 'podcast': { verdict: 'yes', target: 3, priority: 1 } } })));
    await page.reload(); await page.waitForTimeout(200);
    const m = await page.evaluate(() => { const s = Cordes.ui.st; return { v: s.version, l: ['latte-art', 'dj-mix', 'eloquence', 'beatmaking'].map(id => s.skills[id].level).join(), t: s.skills.beatmaking.teach, d: s.desires.podcast.target }; });
    ok(m.v === 2 && m.l === '1,2,4,4' && m.t === true && m.d === 4, 'migration du bilan local : 1→1, 2→2, 3→4, 4→4 + teach, schéma 2 (' + m.l + ')');
    await page.reload(); await page.waitForTimeout(150);
    ok(await page.evaluate(() => Cordes.ui.st.skills.eloquence.level === 4 && JSON.parse(localStorage.getItem('cordes.v1')).version === 2), 'migration enregistrée, sans double conversion');
    await page.goto(URL + '#/bilan/maitrise'); await page.waitForTimeout(150);
    ok(/4 · Maîtrise/.test(await page.textContent('#mres')), 'inventaire : niveau migré affiché');
    await page.goto(URL + '#/resultats'); await page.waitForTimeout(200);
    ok(/vous pouvez animer les ateliers de niveau 3 \(Je consolide\)/.test(await page.textContent('#partager ~ section.panel')), 'passerelle demandeur → offreur : palier animable');
    await noOverflow2(page, 'résultats migrés');
    // ancien lien de partage (schéma 1)
    const legacy = 'j' + Buffer.from(JSON.stringify({ v: 1, m: 'learn', n: 'Old', c: 'Lyon', s: [['eloquence', 3, 0, 2], ['latte-art', 4, 0, 2]], d: [['dj-mix', 2, 1, 1]] })).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    await page.goto(URL + '#b=' + legacy); await page.waitForSelector('text=Le bilan de Old', { timeout: 5000 });
    ok(/niveau 4, Je maîtrise/.test(await page.textContent('.wrap')), 'ancien lien de partage lu avec la nouvelle échelle');
    // troc de démonstration : Inès × Claire
    await page.goto(URL + '#/demo'); await page.click('[data-act="loadDemo"][data-id="ines"]'); await page.waitForTimeout(300);
    await page.goto(URL + '#/comparer'); await page.click('[data-act="cmpDemo"]');
    await page.waitForSelector('text=Trocs proposés', { timeout: 5000 });
    const tx = await page.textContent('.wrap');
    ok(/palier 3, animé par Inès \(niveau 4\)/.test(tx) && /palier 2, animé par Claire \(niveau 3\)/.test(tx), 'troc de démo valide : anglais (Inès 4 → palier 3) contre pain au levain (Claire 3 → palier 2)');
    ok(await page.locator('.rulehelp').count() >= 1, 'troc : règle d’animation rappelée');
    await noOverflow2(page, 'comparaison');
    await shot(page, 'e2e-375-18-troc');
    await page.goto(URL + '#/comment'); await page.waitForTimeout(150);
    await page.evaluate(() => document.getElementById('d-echelle').scrollIntoView()); await page.waitForTimeout(200);
    await noOverflow2(page, 'comment ça marche');
    await shot(page, 'e2e-375-19-echelle', false);
  }
  await browser.close();
  console.log('\nErreurs console : ' + (errs.length ? '\n  ' + errs.join('\n  ') : 'aucune'));
  console.log(`${passes} vérifications OK, ${fails} échec(s), ${errs.length} erreur(s) console.`);
  process.exit(fails || errs.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
