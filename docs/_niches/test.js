/* Vérification Playwright de docs/niches.html : erreurs console, temps de rendu, filtres, recherche, panneau,
   simulateur, outil de mix, curseurs, débordements, captures 375 et 1440 px, puis « Mon portefeuille » (test-portfolio.js).
   Usage : node docs/_niches/test.js [quick | pf] (pf : seulement les tests du portefeuille) */
const { chromium } = require('playwright');
const OUT = '/tmp/claude-0/-home-user-thomas-plateform/bdf3316b-5100-5af2-a522-73fd61586f39/scratchpad/shots-niches2/';
require('fs').mkdirSync(OUT, { recursive: true });
const QUICK = process.argv[2] === 'quick', PF_ONLY = process.argv[2] === 'pf';
(async () => {
  const b = await chromium.launch();
  const errs = [];
  if (!PF_ONLY) for (const vp of [{ n: 'desktop', w: 1440, h: 900 }, { n: 'mobile', w: 375, h: 812 }]) {
    const p = await b.newPage({ viewport: { width: vp.w, height: vp.h }, deviceScaleFactor: 1 });
    p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push(vp.n + ' ' + m.type() + ': ' + m.text()); });
    p.on('pageerror', e => errs.push(vp.n + ' pageerror: ' + e.message));
    p.on('request', r => { const u = r.url(); if (!/^file:|^data:|fonts\.(googleapis|gstatic)\.com/.test(u)) errs.push(vp.n + ' requête externe ' + u); });
    const t0 = Date.now();
    await p.goto('file:///home/user/thomas_plateform/docs/niches.html', { waitUntil: 'load' });
    const t1 = Date.now() - t0;
    await p.waitForFunction(() => window.__ready, null, { timeout: 10000 });
    const perf = await p.evaluate(() => ({ first: window.__firstRender, ready: window.__ready, fcp: (performance.getEntriesByName('first-contentful-paint')[0] || {}).startTime }));
    console.log(vp.n, 'load', t1, 'ms · premier rendu JS', perf.first, 'ms · FCP', Math.round(perf.fcp || 0), 'ms · prêt', perf.ready, 'ms');
    await p.addStyleTag({ content: 'html{scroll-behavior:auto!important}' });
    const ov = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    console.log(vp.n, 'débordement horizontal', ov);
    if (ov > 0) console.log(await p.evaluate(() => [...document.querySelectorAll('body *')].filter(e => { const r = e.getBoundingClientRect(); return r.right > window.innerWidth + 1 && !e.closest('.tw,.toc,.chart,.vbody'); }).slice(0, 8).map(e => e.tagName + '.' + e.className + ' ' + Math.round(e.getBoundingClientRect().right))));
    const shot = async name => { await p.waitForTimeout(150); await p.screenshot({ path: OUT + vp.n + '-' + name + '.png' }); };
    const go = async id => { await p.evaluate(i => document.getElementById(i).scrollIntoView(), id); await p.waitForTimeout(200); };
    await shot('01-top');
    // curseurs
    const before = await p.$eval('#topl li .tn', e => e.textContent);
    await p.$eval('#w5', e => { e.value = 0; e.dispatchEvent(new Event('input', { bubbles: true })); });
    await p.$eval('#w0', e => { e.value = 30; e.dispatchEvent(new Event('input', { bubbles: true })); });
    await p.waitForTimeout(100);
    const after = await p.$eval('#topl li .tn', e => e.textContent);
    console.log(vp.n, 'top 1 avant/après curseurs :', before, '|', after);
    await go('methode'); await shot('02-methode');
    await p.click('#w-reset');
    // explorateur
    await go('explorer');
    await p.click('[data-t="cuisine"]'); await p.click('[data-t="cuisine.boissons"]');
    const sub = await p.$eval('[data-t^="cuisine.boissons."]', e => e.getAttribute('data-t')); await p.click('[data-t="' + sub + '"]');
    console.log(vp.n, 'lignes de niches après dépliage', await p.$$eval('.nrow', a => a.length));
    await shot('03-tree');
    await p.fill('#q', 'latte'); await p.waitForTimeout(200);
    console.log(vp.n, 'recherche « latte »', await p.$eval('#vis-cnt', e => e.textContent));
    await p.fill('#q', ''); await p.waitForTimeout(200);
    await p.click('#f-verdict [data-v="prioritaire"]');
    console.log(vp.n, 'prioritaires', await p.$eval('#vis-cnt', e => e.textContent));
    await p.selectOption('[data-f="ven"]', 'parc');
    console.log(vp.n, 'prioritaires en parc', await p.$eval('#vis-cnt', e => e.textContent));
    await p.click('#f-wtp [data-v="lo"]');
    console.log(vp.n, '+ propension faible', await p.$eval('#vis-cnt', e => e.textContent));
    await p.click('#x-reset');
    await p.click('[data-view="table"]'); await p.waitForTimeout(150);
    console.log(vp.n, 'tableau · lignes peintes', await p.$$eval('.vrow', a => a.length), '/', await p.$eval('#vis-cnt', e => e.textContent));
    await p.$eval('#vbody', e => { e.scrollTop = 20000; e.dispatchEvent(new Event('scroll')); }); await p.waitForTimeout(100);
    console.log(vp.n, 'tableau défilé · première ligne', await p.$eval('.vrow .nm', e => e.textContent));
    if (vp.w > 1040) await p.click('[data-sort="wtp"]'); else await p.selectOption('#x-sort', 'wtp'); await p.waitForTimeout(100);
    await shot('04-table');
    await p.click('.vrow .vopen >> nth=0'); await p.waitForTimeout(300);
    console.log(vp.n, 'panneau ouvert', await p.$eval('#side', e => e.classList.contains('on')), await p.$eval('#side-title', e => e.textContent), '· paliers', await p.$$eval('.ladder li', a => a.length));
    await shot('05-panel');
    await p.keyboard.press('j'); await p.waitForTimeout(100);
    console.log(vp.n, 'après J', await p.$eval('#side-title', e => e.textContent));
    await p.keyboard.press('Escape'); await p.waitForTimeout(250);
    console.log(vp.n, 'panneau fermé', !(await p.$eval('#side', e => e.classList.contains('on'))));
    await p.click('[data-view="tree"]');
    if (!QUICK) { await go('secteurs'); await shot('06-secteurs'); await go('top'); await shot('07-top15'); }
    // parades et simulateur
    await go('parades'); await shot('08-parades');
    await go('sim');
    const m1 = await p.$eval('#sim-o', e => e.textContent);
    await p.$eval('#sr-tp', e => { e.value = 500; e.dispatchEvent(new Event('input', { bubbles: true })); });
    const m2 = await p.$eval('#sim-o', e => e.textContent);
    console.log(vp.n, 'simulateur réagit', m1 !== m2);
    const opts = await p.$$eval('#sim-p option', a => a.map(o => o.value));
    await p.selectOption('#sim-p', opts[opts.length - 1]); await p.waitForTimeout(100);
    await shot('09-simulateur');
    // mixes
    await go('mt');
    console.log(vp.n, 'mixes proposés (défaut)', await p.$$eval('#mt-res .card', a => a.length));
    await p.fill('#mt-in', 'croquis'); await p.waitForTimeout(150);
    const cnt = await p.$$eval('#mt-list li[data-add]', a => a.length); console.log(vp.n, 'suggestions « croquis »', cnt);
    if (cnt) { await p.keyboard.press('Enter'); await p.waitForTimeout(300); }
    console.log(vp.n, 'mixes pour 1 niche', await p.$$eval('#mt-res .card', a => a.length), '·', await p.$eval('#mt-info', e => e.textContent));
    await p.fill('#mt-in', 'cafe'); await p.waitForTimeout(150); await p.keyboard.press('Enter'); await p.waitForTimeout(300);
    console.log(vp.n, 'paire + trios', await p.$$eval('#mt-res .card', a => a.length), '·', await p.$eval('#mt-res .card .cn', e => e.textContent));
    await shot('10-mixtool');
    await p.selectOption('#mt-b', '25'); await p.waitForTimeout(300);
    await p.click('#mt-clear'); await p.selectOption('#mt-v', 'parc'); await p.waitForTimeout(400);
    console.log(vp.n, 'mixes en parc', await p.$$eval('#mt-res .card', a => a.length));
    await go('ed-fam'); await shot('11-editorial');
    const fams = await p.$$eval('#ed-fam button', a => a.length); if (fams > 1) { await p.click('#ed-fam button >> nth=1'); console.log(vp.n, 'famille filtrée', await p.$$eval('#ed-cards .card', a => a.length)); }
    if (!QUICK) { await go('portefeuilles'); await shot('12-portefeuilles'); await go('geo'); await shot('13-geo'); await go('limites'); await shot('14-limites'); }
    await p.close();
  }
  console.log('ERREURS', errs.length ? errs : 'aucune');
  const pf = await require('./test-portfolio.js')(b);
  await b.close();
  if (errs.length || pf) process.exitCode = 1;
})();
