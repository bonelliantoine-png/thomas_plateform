const { chromium } = require('playwright');
const OUT = '/tmp/claude-0/-home-user-thomas-plateform/bdf3316b-5100-5af2-a522-73fd61586f39/scratchpad/shots-niches/';
(async () => {
  const b = await chromium.launch();
  const errs = [];
  for (const vp of [{n:'desktop', w:1440, h:900}, {n:'mobile', w:375, h:812}]) {
    const p = await b.newPage({ viewport: { width: vp.w, height: vp.h }, deviceScaleFactor: 1 });
    p.on('console', m => { if (m.type() === 'error' || m.type()==='warning') errs.push(vp.n + ' ' + m.type() + ': ' + m.text()); });
    p.on('pageerror', e => errs.push(vp.n + ' pageerror: ' + e.message));

    await p.goto('file:///home/user/thomas_plateform/docs/niches.html');
    await p.addStyleTag({content:'html{scroll-behavior:auto!important}'});
    await p.waitForTimeout(1500);
    const ov = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    console.log(vp.n, 'overflow-x', ov);
    // éléments qui débordent
    if (ov > 0) console.log(await p.evaluate(() => [...document.querySelectorAll('body *')].filter(e => { const r = e.getBoundingClientRect(); return r.right > window.innerWidth + 1 && !e.closest('.tw,.mx,.toc'); }).slice(0, 8).map(e => e.tagName + '.' + e.className + ' ' + Math.round(e.getBoundingClientRect().right))));
    await p.screenshot({ path: OUT + vp.n + '-01-top.png' });
    // curseurs
    const before = await p.$eval('#ranking .row .nmc', e => e.textContent);
    await p.$eval('#w5', e => { e.value = 0; e.dispatchEvent(new Event('input')); });
    await p.$eval('#w0', e => { e.value = 30; e.dispatchEvent(new Event('input')); });
    const after = await p.$eval('#ranking .row .nmc', e => e.textContent);
    console.log(vp.n, 'top1 before/after', before, '|', after, '| sum', await p.$eval('#wsum', e => e.textContent));
    await p.locator('#methode').scrollIntoViewIfNeeded(); await p.evaluate(() => document.getElementById('weights').scrollIntoView());
    await p.screenshot({ path: OUT + vp.n + '-02-methode.png' });
    await p.click('#w-reset');
    await p.evaluate(() => document.getElementById('secteurs').scrollIntoView());
    await p.waitForTimeout(250); await p.screenshot({ path: OUT + vp.n + '-03-matrix.png' });
    // fiche secteur
    await p.click('#sec-cuisine summary');
    await p.evaluate(() => document.getElementById('sec-cuisine').scrollIntoView());
    await p.screenshot({ path: OUT + vp.n + '-04-secteur.png' });
    // arbre
    await p.evaluate(() => document.getElementById('explorer').scrollIntoView());
    await p.click('[data-tsec="musique"]');
    const cnt = await p.$$eval('.nrow', a => a.length);
    console.log(vp.n, 'nrows after expand musique', cnt);
    await p.screenshot({ path: OUT + vp.n + '-05-tree.png' });
    await p.fill('#q', 'latte');
    console.log(vp.n, 'search latte', await p.$eval('#vis-cnt', e => e.textContent));
    await p.fill('#q', '');
    await p.click('#f-verdict [data-v="prioritaire"]');
    console.log(vp.n, 'prioritaires', await p.$eval('#vis-cnt', e => e.textContent));
    await p.click('#f-mode [data-m="enligne"]');
    console.log(vp.n, 'prio+enligne', await p.$eval('#vis-cnt', e => e.textContent));
    await p.click('#t-reset');
    await p.click('[data-tsec="cuisine"]');
    await p.click('.nrow >> nth=0');
    await p.waitForTimeout(300);
    console.log(vp.n, 'panel open', await p.$eval('#side', e => e.classList.contains('on')), await p.$eval('#side-title', e => e.textContent));
    await p.screenshot({ path: OUT + vp.n + '-06-panel.png' });
    await p.keyboard.press('j'); await p.waitForTimeout(100);
    console.log(vp.n, 'after J', await p.$eval('#side-title', e => e.textContent));
    await p.keyboard.press('Escape'); await p.waitForTimeout(250);
    console.log(vp.n, 'panel closed', !(await p.$eval('#side', e => e.classList.contains('on'))));
    for (const id of ['top', 'portefeuilles', 'ecarter', 'geo', 'sources']) {
      await p.evaluate(i => document.getElementById(i).scrollIntoView(), id);
      await p.waitForTimeout(250);
      await p.screenshot({ path: OUT + vp.n + '-07-' + id + '.png' });
    }
    await p.close();
  }
  console.log('ERRORS', errs.length ? errs : 'none');
  await b.close();
})();
