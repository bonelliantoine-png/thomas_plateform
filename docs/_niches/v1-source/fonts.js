const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage();const e=[];p.on('console',m=>e.push(m.type()+': '+m.text()));p.on('pageerror',x=>e.push('pageerror '+x.message));p.on('requestfailed',r=>e.push('reqfail '+r.url().slice(0,80)));
await p.goto('file:///home/user/thomas_plateform/docs/niches.html');await p.waitForTimeout(1500);console.log(e);await b.close();})();
