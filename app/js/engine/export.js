/* Exports : JSON, agenda .ics, passeport HTML autonome (données + mini-rendu embarqués), téléchargement par Blob. */
(function (W) {
  'use strict';
  var C = W.Cordes, U = C.util;

  C.download = function (name, content, mime) {
    var blob = new Blob([content], { type: mime || 'application/octet-stream' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = name; a.rel = 'noopener';
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 1500);
    return true;
  };
  C.fileSlug = function (st) { return 'cordes-' + (U.norm((st.context && st.context.firstName) || 'bilan').replace(/ /g, '-') || 'bilan'); };

  C.toJSON = function (st) {
    var copy = JSON.parse(JSON.stringify(st));
    delete copy.deck; // poids internes du paquet, sans intérêt hors de l'app
    return JSON.stringify({ app: 'Cordes', format: 'cordes.v1', exportedAt: new Date().toISOString(), profile: copy }, null, 2);
  };

  /* ---------- iCalendar ---------- */
  function icsEsc(s) { return String(s || '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n'); }
  function fold(line) {
    var out = [], cur = '';
    for (var i = 0; i < line.length; i++) {
      var ch = line[i];
      if (new TextEncoder().encode(cur + ch).length > 74) { out.push(cur); cur = ' ' + ch; } else cur += ch;
    }
    out.push(cur); return out.join('\r\n');
  }
  function d8(d) { return d.getFullYear() + ('0' + (d.getMonth() + 1)).slice(-2) + ('0' + d.getDate()).slice(-2); }
  C.toICS = function (events) {
    var stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
    var L = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Cordes//Bilan de competences de vie//FR', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'X-WR-CALNAME:Cordes · mon plan'];
    events.forEach(function (e, i) {
      var end = U.addDays(e.date, 1);
      L.push('BEGIN:VEVENT', 'UID:' + (e.uid || ('cordes-' + i)) + '-' + d8(e.date) + '@cordes.local', 'DTSTAMP:' + stamp,
        'DTSTART;VALUE=DATE:' + d8(e.date), 'DTEND;VALUE=DATE:' + d8(end), 'SUMMARY:' + icsEsc(e.title));
      if (e.rrule) L.push('RRULE:' + e.rrule);
      if (e.desc) L.push('DESCRIPTION:' + icsEsc(e.desc));
      if (e.url) L.push('URL:' + e.url);
      L.push('BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:' + icsEsc(e.title), 'TRIGGER:-PT12H', 'END:VALARM', 'END:VEVENT');
    });
    L.push('END:VCALENDAR');
    return L.map(fold).join('\r\n') + '\r\n';
  };
  C.learnerEvents = function (st) {
    var ev = [];
    C.yesDesires(st).slice(0, 5).forEach(function (id, i) {
      var p = C.learnPlan(st, id); if (!p) return;
      ev.push({ uid: id + '-start', date: U.addDays(new Date(), 2 + i), title: 'Premier pas · ' + p.s.name, desc: p.first.text + (p.first.link ? '\n' + p.first.link : ''), url: p.first.link || '' });
      p.milestones.forEach(function (m) { ev.push({ uid: m.id.replace(/[^a-z0-9-]/gi, '-'), date: m.when, title: m.label + ' · ' + p.s.name, desc: 'Jalon visé : ' + m.text + '\nEnviron ' + p.hours + ' h au total, ' + p.hpw + ' h par semaine.' }); });
    });
    return ev;
  };
  C.offerEvents = function (st, plan) {
    var ev = [];
    if (!plan) return ev;
    plan.roadmap.forEach(function (ph) { ph.tasks.forEach(function (t) { if (!(st.plan.checked || {})[t.id]) ev.push({ uid: 'roadmap-' + t.id, date: t.due, title: ph.label + ' · ' + t.text.slice(0, 70), desc: t.text }); }); });
    return ev;
  };
  C.challengeEvents = function (st, id) {
    return C.challenge30(st, id).map(function (d) { return { uid: 'defi-' + id + '-' + d.day, date: U.addDays(new Date(), d.day), title: 'Défi J' + d.day + ' · ' + C.data.sById[id].name, desc: d.text }; });
  };

  /* ---------- passeport HTML autonome ---------- */
  C.passportData = function (st) {
    var c = st.context || {};
    var arch = st.style && st.style.archetype && C.ARCHETYPES.filter(function (x) { return x.id === st.style.archetype; })[0];
    var skills = Object.keys(st.skills || {}).filter(function (id) { return C.data.sById[id] && st.skills[id].level > 0; }).map(function (id) {
      var s = C.data.sById[id], v = st.skills[id];
      return { id: id, name: s.name, u: C.universe(s.universe).short, hue: C.universe(s.universe).hue, level: v.level, levelText: C.LEVELS[v.level], milestone: s.levels[v.level - 1], years: v.years || 0, teach: !!v.teach };
    }).concat((st.custom || []).filter(function (x) { return x.level > 0; }).map(function (x) { return { id: x.id, name: x.name, u: C.universe(x.universe).short, hue: C.universe(x.universe).hue, level: x.level, levelText: C.LEVELS[x.level], milestone: 'Compétence ajoutée librement', years: 0, teach: false }; }))
      .sort(function (a, b) { return b.level - a.level; });
    var desires = C.yesDesires(st).map(function (id) {
      var p = C.learnPlan(st, id);
      return { name: p.s.name, u: C.universe(p.s.universe).short, hue: C.universe(p.s.universe).hue, target: p.s.levels[p.target - 1], hours: p.hours, weeks: p.weeks, hpw: p.hpw, budget: p.monthly, first: p.first.text, milestones: p.milestones.map(function (m) { return { when: U.dateShort(m.when), label: m.label, text: m.text }; }) };
    });
    var plan = (st.mode === 'offer' || st.mode === 'both') ? C.offerPlan(st) : null;
    return {
      name: c.firstName || 'Mon bilan', city: c.city || '', date: U.dateShort(new Date()) + ' ' + new Date().getFullYear(), mode: st.mode,
      archetype: arch ? { name: arch.name, pref: arch.pref } : null,
      skills: skills, desires: desires,
      soft: C.softProfile(st).slice(0, 6).map(function (x) { return { name: x.soft.name, rel: Math.round(x.rel * 100) }; }),
      cv: C.cvSection(st),
      offers: plan ? plan.offers.map(function (o) { return { title: o.title, hook: o.hook, price: o.price, unit: o.unit, dur: C.minutes(o.duration), size: o.size }; }) : [],
      radar: C.charts ? C.charts.radarSVG(C.universeProfile(st), { size: 320, print: true }) : ''
    };
  };
  C.passportHTML = function (st) {
    var data = C.passportData(st);
    var json = JSON.stringify(data).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028');
    var title = 'Passeport Cordes · ' + U.esc(data.name);
    var css = ':root{--bg:#07080b;--grid:#12151c;--panel:#0e1015;--panel-2:#13161d;--line:#1d2029;--line-2:#2b2f3b;--fg:#f2f4f8;--fg-2:#aeb4c2;--fg-3:#7c8394;--accent:#5ee7ff;--accent-ink:#03141a;--int:#4dffb5;--wait:#e6dcb4;--f-display:"Marcellus",Georgia,serif;--f-body:"Spectral",Georgia,serif;--f-mono:"IBM Plex Mono",ui-monospace,Menlo,monospace;color-scheme:dark}' +
      '*{box-sizing:border-box}body{margin:0;background:var(--bg);background-image:radial-gradient(var(--grid) 1px,transparent 1px);background-size:22px 22px;color:var(--fg);font:13px/1.5 var(--f-mono)}' +
      '.w{max-width:980px;margin:0 auto;padding:24px clamp(14px,3vw,32px) 60px}h1{font:400 clamp(28px,5vw,40px)/1.1 var(--f-display);margin:6px 0 4px}h2{font:400 22px var(--f-display);margin:0}' +
      '.k{font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--fg-3)}.lead{font:300 17px/1.6 var(--f-body);color:var(--fg-2);max-width:68ch}' +
      '.p{background:var(--panel);border:1px solid var(--line);border-radius:8px;margin-top:16px}.ph{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:12px 16px;border-bottom:1px solid var(--line)}.pb{padding:14px 16px}' +
      '.g{display:grid;grid-template-columns:1fr 1fr;gap:16px}@media(max-width:760px){.g{grid-template-columns:1fr}}' +
      '.row{display:grid;grid-template-columns:1fr auto;gap:8px;padding:9px 0;border-bottom:1px solid var(--line)}.row:last-child{border:0}.nm{font:400 16px var(--f-display)}.sub{color:var(--fg-2);font:300 14px var(--f-body)}' +
      '.dots{display:flex;gap:3px}.dots i{width:9px;height:9px;border-radius:2px;background:var(--line-2)}.dots i.on{background:var(--accent)}' +
      '.tabs{display:flex;gap:6px;flex-wrap:wrap;margin-top:18px}.tabs button,input{font:12px var(--f-mono);color:var(--fg);background:var(--panel);border:1px solid var(--line-2);border-radius:6px;padding:7px 12px;cursor:pointer}.tabs button[aria-pressed=true]{background:var(--accent);color:var(--accent-ink);border-color:var(--accent);font-weight:600}' +
      'input{cursor:text;min-width:200px}.bar{height:6px;border-radius:3px;background:var(--line-2);overflow:hidden}.bar b{display:block;height:100%;background:var(--int)}.ms{display:grid;grid-template-columns:70px 90px 1fr;gap:8px;font-size:12px;padding:4px 0;color:var(--fg-2)}' +
      '.pill{display:inline-flex;align-items:center;gap:6px;height:22px;padding:0 9px;border-radius:999px;font-size:11px;border:1px solid color-mix(in srgb,var(--accent) 36%,transparent);background:color-mix(in srgb,var(--accent) 14%,transparent)}.sw{width:8px;height:8px;border-radius:2px;display:inline-block}' +
      'svg{max-width:100%;height:auto}.foot{margin-top:28px;color:var(--fg-3);font-size:11px}:focus-visible{outline:2px solid var(--accent);outline-offset:2px}' +
      '@media print{body{background:#fff;color:#111}.p{background:#fff;border-color:#ccc}.tabs,input{display:none}.k,.sub,.lead{color:#444}.dots i.on{background:#111}}';
    var script = '(function(){var D=JSON.parse(document.getElementById("cordes-data").textContent);var $=function(s){return document.querySelector(s)};' +
      'function e(s){return String(s==null?"":s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;","\\"":"&quot;"}[c]})}' +
      'function dots(n){var h="";for(var i=1;i<=4;i++)h+="<i class=\\""+(i<=n?"on":"")+"\\"></i>";return "<span class=\\"dots\\" aria-label=\\"niveau "+n+" sur 4\\">"+h+"</span>"}' +
      'var view="all",q="";function render(){var f=function(x){return !q||x.name.toLowerCase().indexOf(q)>=0||(x.u||"").toLowerCase().indexOf(q)>=0};' +
      'var s=D.skills.filter(f).map(function(x){return "<div class=\\"row\\"><div><div class=\\"nm\\"><span class=\\"sw\\" style=\\"background:hsl("+x.hue+" 38% 60%)\\"></span> "+e(x.name)+"</div><div class=\\"sub\\">"+e(x.u)+" · "+e(x.levelText)+(x.years?" · "+x.years+" ans":"")+" · "+e(x.milestone)+"</div></div>"+dots(x.level)+"</div>"}).join("")||"<p class=\\"sub\\">Aucune compétence.</p>";' +
      'var d=D.desires.filter(f).map(function(x){return "<div class=\\"row\\" style=\\"grid-template-columns:1fr\\"><div class=\\"nm\\">"+e(x.name)+" <span class=\\"k\\">"+e(x.u)+"</span></div><div class=\\"sub\\">Objectif : "+e(x.target)+" · ≈ "+x.hours+" h · "+x.weeks+" sem. à "+x.hpw+" h · "+x.budget+" € / mois</div><div class=\\"sub\\">Premier pas : "+e(x.first)+"</div>"+x.milestones.map(function(m){return "<div class=\\"ms\\"><span>"+e(m.when)+"</span><span class=\\"k\\">"+e(m.label)+"</span><span>"+e(m.text)+"</span></div>"}).join("")+"</div>"}).join("")||"<p class=\\"sub\\">Aucune envie retenue.</p>";' +
      'var o=D.offers.map(function(x){return "<div class=\\"row\\"><div><div class=\\"nm\\">"+e(x.title)+"</div><div class=\\"sub\\">"+e(x.hook)+" · "+e(x.dur)+" · "+x.size+" pers.</div></div><span class=\\"pill\\">"+x.price+" "+e(x.unit)+"</span></div>"}).join("");' +
      '$("#sk").innerHTML=s;$("#de").innerHTML=d;$("#of").innerHTML=o;$("#ofp").style.display=o&&(view==="all"||view==="of")?"":"none";' +
      '$("#skp").style.display=view==="all"||view==="sk"?"":"none";$("#dep").style.display=view==="all"||view==="de"?"":"none";}' +
      'document.querySelectorAll(".tabs button").forEach(function(b){b.addEventListener("click",function(){view=b.dataset.v;document.querySelectorAll(".tabs button").forEach(function(x){x.setAttribute("aria-pressed",x===b)});render()})});' +
      '$("#q").addEventListener("input",function(ev){q=ev.target.value.toLowerCase().trim();render()});render();})();';
    return '<!DOCTYPE html>\n<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
      '<title>' + title + '</title><link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Marcellus&family=Spectral:ital,wght@0,300;0,400;1,300&family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet">' +
      '<style>' + css + '</style></head><body><div class="w">' +
      '<div class="k">Cordes · passeport de compétences de vie · ' + U.esc(data.date) + '</div>' +
      '<h1>' + U.esc(data.name) + '</h1>' +
      '<p class="lead">' + (data.city ? U.esc(data.city) + ' · ' : '') + data.skills.length + ' compétences notées · ' + data.desires.length + ' envies' + (data.archetype ? ' · ' + U.esc(data.archetype.name) : '') + '</p>' +
      (data.archetype ? '<p class="lead" style="font-style:italic">' + U.esc(data.archetype.pref) + '</p>' : '') +
      '<div class="g"><section class="p"><div class="ph"><span class="k">Maîtrise et envies par univers</span></div><div class="pb">' + data.radar + '</div></section>' +
      '<section class="p"><div class="ph"><span class="k">Forces transverses</span></div><div class="pb">' + data.soft.map(function (x) { return '<div style="margin:8px 0"><div style="display:flex;justify-content:space-between"><span>' + U.esc(x.name) + '</span><span class="k">' + x.rel + '</span></div><div class="bar"><b style="width:' + x.rel + '%"></b></div></div>'; }).join('') +
      (data.cv.length ? '<div class="k" style="margin-top:16px">Pour un CV</div>' + data.cv.map(function (l) { return '<p class="sub" style="margin:6px 0">' + U.esc(l) + '</p>'; }).join('') : '') + '</div></section></div>' +
      '<div class="tabs" role="group" aria-label="Filtrer"><button data-v="all" aria-pressed="true">Tout</button><button data-v="sk" aria-pressed="false">Compétences</button><button data-v="de" aria-pressed="false">Envies</button>' + (data.offers.length ? '<button data-v="of" aria-pressed="false">Offres</button>' : '') + '<input id="q" type="search" placeholder="Filtrer par nom ou univers" aria-label="Filtrer"></div>' +
      '<section class="p" id="skp"><div class="ph"><h2>Ce que je sais faire</h2></div><div class="pb" id="sk"></div></section>' +
      '<section class="p" id="dep"><div class="ph"><h2>Ce que je veux apprendre</h2></div><div class="pb" id="de"></div></section>' +
      '<section class="p" id="ofp"><div class="ph"><h2>Ce que je propose</h2></div><div class="pb" id="of"></div></section>' +
      '<p class="foot">Fichier autonome généré par Cordes (prototype). Les données restent dans ce fichier : aucune connexion n\u2019est nécessaire pour le lire.</p>' +
      '</div><script type="application/json" id="cordes-data">' + json + '</script><script>' + script + '</script></body></html>';
  };
})(window);
