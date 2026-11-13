/* A9 · Génère des pages statiques « Apprendre X à Paris » et « Donner des cours de X à Paris »
   pour les 30 compétences les plus demandées, à partir de la taxonomie, des ressources et du moteur Cordes.
   Usage : node app/dev/build-seo.js [dossier de sortie, par défaut seo/ à la racine du dépôt] */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const APP = path.resolve(__dirname, '..');
const OUT = path.resolve(process.argv[2] || path.join(APP, '..', 'seo'));
const CITY = 'Paris';
const APP_LINK = '../app/index.html';

/* ---------- chargement du moteur dans un faux window ---------- */
const store = {};
const win = { localStorage: { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } }, location: { href: '' } };
win.window = win;
const ctx = vm.createContext(Object.assign(win, { console, Math, Date, JSON, Promise, setTimeout, clearTimeout, TextEncoder, TextDecoder, encodeURIComponent, decodeURIComponent, URL }));
['js/data/taxonomy-a.js', 'js/data/taxonomy-b.js', 'js/data/resources.js', 'js/engine/core.js', 'js/engine/similarity.js', 'js/engine/inspiration.js', 'js/engine/archetype.js',
  'js/engine/plan.js', 'js/engine/pricing.js', 'js/engine/channels.js', 'js/engine/status.js', 'js/engine/niche.js', 'js/engine/offers.js', 'js/engine/share.js'].forEach(f => vm.runInContext(fs.readFileSync(path.join(APP, f), 'utf8'), ctx, { filename: f }));
const C = win.Cordes, U = C.util, E = U.esc;
C.loadData(win.CORDES_DATA, win.CORDES_RESOURCES);
C.buildGraph(12);
const D = C.data, R = C.res;

/* ---------- sélection : 30 compétences les plus demandées ---------- */
const rank = s => s.attrs.demand * 3 + s.attrs.trend * 1.5 + s.attrs.teachable * 0.6 + s.attrs.monetization * 0.4 + (s.attrs.oneHourResult ? 0.3 : 0);
// au plus 3 par univers pour couvrir largement le catalogue ; égalités départagées par l'ordre alphabétique
const perU = {};
const top = D.skills.slice().sort((a, b) => rank(b) - rank(a) || a.name.localeCompare(b.name, 'fr')).filter(s => (perU[s.universe] = (perU[s.universe] || 0) + 1) <= 3).slice(0, 30);
const inTop = {}; top.forEach(s => { inTop[s.id] = true; });
const learnFile = s => 'apprendre-' + s.id + '-paris.html';
const teachFile = s => 'donner-des-cours-' + s.id + '-paris.html';
const lc = s => U.lc(s.short || s.name);
const de = s => C.de(s);
const eurR = (a, b) => a === b ? U.eur(a) : U.fmt(a) + ' à ' + U.eur(b);
const paris = x => U.round5(x * 1.15);

/* ---------- gabarit ---------- */
const CSS = `:root{--bg:#07080b;--grid:#12151c;--panel:#0e1015;--panel-2:#13161d;--hover:#161a23;--line:#1d2029;--line-2:#2b2f3b;--fg:#f2f4f8;--fg-2:#aeb4c2;--fg-3:#7c8394;--accent:#5ee7ff;--accent-ink:#03141a;--sent:#4f7dff;--int:#4dffb5;--no:#ff9ccb;--wait:#e6dcb4;--idle:#5d6477;--f-display:"Marcellus","Cormorant Garamond",Georgia,serif;--f-body:"Spectral",Georgia,serif;--f-mono:"IBM Plex Mono",ui-monospace,"SFMono-Regular",Menlo,monospace;--r:8px;--gut:clamp(16px,3vw,32px);color-scheme:dark}
*{box-sizing:border-box}html{background:var(--bg)}
body{margin:0;background-color:var(--bg);background-image:radial-gradient(var(--grid) 1px,transparent 1px);background-size:22px 22px;color:var(--fg);font-family:var(--f-mono);font-size:13px;line-height:1.5}
a{color:var(--accent);text-decoration:none}a:hover{text-decoration:underline}:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.bar{position:sticky;top:0;z-index:5;height:52px;background:color-mix(in srgb,var(--bg) 86%,transparent);backdrop-filter:blur(10px);border-bottom:1px solid var(--line)}
.bar .in{max-width:1180px;margin:0 auto;height:100%;padding-inline:var(--gut);display:flex;align-items:center;gap:12px}
.brand{display:flex;align-items:center;gap:9px;color:var(--fg);font:400 18px var(--f-display)}.brand:hover{text-decoration:none}
.crumb{color:var(--fg-3);font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0}.crumb a{color:var(--fg-3)}
.bar .cta{margin-left:auto;white-space:nowrap;flex:none}
main{max-width:1180px;margin:0 auto;padding:26px var(--gut) 60px}
.kicker{font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--accent);font-weight:500}
h1{font:400 clamp(30px,6.4vw,44px)/1.12 var(--f-display);margin:8px 0 12px}
h2{font:400 clamp(22px,4.4vw,27px)/1.2 var(--f-display);margin:0}
h3{font:400 18px/1.3 var(--f-display);margin:0}
.lead{font:300 18px/1.6 var(--f-body);color:var(--fg-2);max-width:66ch;margin:0}
p{margin:0}.prose{font:300 16px/1.6 var(--f-body);color:var(--fg-2);max-width:68ch}.prose p+p{margin-top:10px}.prose strong{color:var(--fg);font-weight:500}
.lbl{font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--fg-3);font-weight:500}
.sec{display:flex;flex-direction:column;gap:4px;margin:38px 0 16px;padding-bottom:10px;border-bottom:1px solid var(--line)}
.counters{display:grid;grid-template-columns:repeat(2,1fr);gap:1px;background:var(--line);border:1px solid var(--line);border-radius:var(--r);overflow:hidden;margin-top:22px}
@media (min-width:860px){.counters{grid-template-columns:repeat(4,1fr)}}
.counter{background:var(--panel);padding:13px 14px;min-width:0}.counter .lbl{display:flex;align-items:center;gap:7px}.counter .lbl i{width:6px;height:6px;border-radius:1px;background:var(--accent)}
.counter .lbl i.int{background:var(--int)}.counter .lbl i.wait{background:var(--wait)}.counter .lbl i.sent{background:var(--sent)}
.counter .v{font:500 clamp(21px,5vw,27px)/1.15 var(--f-mono);letter-spacing:-.02em;margin-top:6px;font-variant-numeric:tabular-nums}.counter .v small{font-size:13px;color:var(--fg-3);letter-spacing:0;font-weight:400}
.counter .s{color:var(--fg-2);font-size:11.5px;margin-top:2px}
.grid2{display:grid;gap:16px;grid-template-columns:1fr}@media (min-width:860px){.grid2{grid-template-columns:1fr 1fr}}
.panel{background:var(--panel);border:1px solid var(--line);border-radius:var(--r);min-width:0}
.ph{min-height:46px;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 16px;border-bottom:1px solid var(--line);flex-wrap:wrap}
.ph .t{font-size:11.5px;font-weight:500;letter-spacing:.1em;text-transform:uppercase}.ph .hint{color:var(--fg-3);font-size:11.5px}
.pb{padding:16px}
.ladder{display:grid;gap:0}.step{display:grid;grid-template-columns:34px 1fr auto;gap:10px;align-items:baseline;padding:10px 0;border-bottom:1px solid var(--line)}.step:last-child{border-bottom:0}
.step .n{font:500 11px var(--f-mono);color:var(--accent)}.step .t{font:300 15.5px/1.45 var(--f-body)}.step .h{font-size:11.5px;color:var(--fg-3);white-space:nowrap;font-variant-numeric:tabular-nums}
.item{display:grid;grid-template-columns:1fr auto;gap:2px 12px;padding:11px 0;border-bottom:1px solid var(--line)}.item:last-child{border-bottom:0}
.item .nm{font:400 16px/1.3 var(--f-display)}.item .d{grid-column:1/-1;font:300 14px/1.45 var(--f-body);color:var(--fg-2)}.item .m{grid-column:1/-1;font-size:11px;color:var(--fg-3)}
.grp+.grp{margin-top:16px}.grp>.lbl{display:block;color:var(--accent);margin-bottom:2px}
table{border-collapse:collapse;width:100%;font-size:12.5px}td,th{border-bottom:1px solid var(--line);padding:8px 8px;text-align:left}th{font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--fg-3);font-weight:500}td.r,th.r{text-align:right;font-variant-numeric:tabular-nums}
.tw{overflow-x:auto}
.note{background:var(--panel);border:1px solid var(--line);border-left:3px solid var(--accent);border-radius:0 var(--r) var(--r) 0;padding:12px 14px;margin-top:16px}.note .lbl{display:block;margin-bottom:4px;color:var(--accent)}
.note.wait{border-left-color:var(--wait)}.note.wait .lbl{color:var(--wait)}.note.int{border-left-color:var(--int)}.note.int .lbl{color:var(--int)}
.note .sp{font:300 15px/1.55 var(--f-body);color:var(--fg-2)}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:7px;min-height:32px;padding:5px 13px;border-radius:6px;border:1px solid var(--line-2);background:var(--panel);color:var(--fg);font:500 12.5px var(--f-mono);text-align:center;max-width:100%}
.btn:hover{background:var(--hover);text-decoration:none}.btn.primary{background:var(--accent);border-color:var(--accent);color:var(--accent-ink);font-weight:600}.btn.lg{min-height:46px;padding:10px 18px;font-size:13.5px}
.row{display:flex;gap:10px;flex-wrap:wrap;align-items:center}
.pill{display:inline-flex;align-items:center;gap:6px;height:22px;padding:0 9px;border-radius:999px;font-size:11px;background:transparent;border:1px solid var(--line-2);color:var(--fg-2);white-space:nowrap}
.pill i{width:6px;height:6px;border-radius:50%;background:var(--accent)}
.chips{display:flex;flex-wrap:wrap;gap:8px}.chips a{display:inline-flex;align-items:center;min-height:32px;padding:4px 12px;border:1px solid var(--line-2);border-radius:999px;background:var(--panel);color:var(--fg-2);font-size:12px}.chips a:hover{border-color:var(--accent);color:var(--fg);text-decoration:none}
.idx{display:grid;gap:1px;background:var(--line);border:1px solid var(--line);border-radius:var(--r);overflow:hidden;grid-template-columns:1fr}
@media (min-width:700px){.idx{grid-template-columns:1fr 1fr}}@media (min-width:1040px){.idx{grid-template-columns:1fr 1fr 1fr}}
.idx div{background:var(--panel);padding:14px 16px;display:flex;flex-direction:column;gap:6px}.idx .nm{font:400 17px/1.25 var(--f-display)}.idx .u{font-size:10.5px;letter-spacing:.08em;text-transform:uppercase;color:var(--fg-3)}.idx .l{display:flex;gap:14px;flex-wrap:wrap;font-size:12px}
.sw{width:8px;height:8px;border-radius:2px;display:inline-block;margin-right:6px}
footer{border-top:1px solid var(--line);color:var(--fg-3);font-size:11.5px;padding:18px var(--gut) 40px}footer .in{max-width:1180px;margin:0 auto;display:flex;flex-wrap:wrap;gap:8px 20px;justify-content:space-between}
@media (prefers-reduced-motion:reduce){*{transition:none!important}}`;
const LOGO = '<svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true"><rect x="1" y="1" width="8" height="8" rx="2.2" fill="#5ee7ff"/><rect x="11" y="1" width="8" height="8" rx="2.2" fill="#4dffb5"/><rect x="1.5" y="11.5" width="7" height="7" rx="2" fill="none" stroke="#2b2f3b"/><rect x="11.5" y="11.5" width="7" height="7" rx="2" fill="none" stroke="#2b2f3b"/></svg>';
function page(title, desc, crumb, body, ld) {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="dark">
<meta name="theme-color" content="#07080b">
<title>${E(title)}</title>
<meta name="description" content="${E(desc)}">
<meta property="og:title" content="${E(title)}">
<meta property="og:description" content="${E(desc)}">
<meta property="og:type" content="article">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Marcellus&family=Spectral:ital,wght@0,300;0,400;0,500;1,300&family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="seo.css">
${ld ? '<script type="application/ld+json">' + JSON.stringify(ld).replace(/</g, '\\u003c') + '</script>' : ''}
</head>
<body>
<header class="bar"><div class="in"><a class="brand" href="index.html">${LOGO}Cordes</a><span class="crumb">/ ${crumb}</span><a class="btn primary cta" href="${APP_LINK}#/accueil">Faire mon bilan</a></div></header>
<main id="main">
${body}
</main>
<footer><div class="in"><span>Cordes · fiches générées le ${E(U.dateShort(new Date()))} ${new Date().getFullYear()} depuis le catalogue (${D.skills.length} compétences) et les relevés de prix ${E(R.updated || '')}.</span><span>Prix indicatifs à confronter au marché local. Données de lieux : contributeurs OpenStreetMap.</span></div></footer>
</body>
</html>
`;
}
const firstSentence = t => { t = String(t || ''); const m = t.match(/^.*?[.;](\s|$)/); return (m ? m[0] : t).trim().replace(/;$/, '.'); };
const counter = (l, v, s, k) => `<div class="counter"><div class="lbl"><i class="${k || ''}"></i>${E(l)}</div><div class="v">${v}</div><div class="s">${s}</div></div>`;
const item = (name, url, d, m) => `<div class="item"><div class="nm">${url ? `<a href="${E(url)}" rel="noopener">${E(name)}</a>` : E(name)}</div><span></span>${d ? `<div class="d">${E(d)}</div>` : ''}${m ? `<div class="m">${m}</div>` : ''}</div>`;
const sec = (k, t) => `<div class="sec"><span class="kicker">${E(k)}</span><h2>${E(t)}</h2></div>`;
function priceTable(s) {
  const p = R.pricing[s.universe] || {};
  const fmts = Object.keys(p).filter(f => Array.isArray(p[f]) && s.formats.indexOf(f) >= 0);
  const list = fmts.length ? fmts : Object.keys(p).filter(f => Array.isArray(p[f])).slice(0, 4);
  if (!list.length) return '<p class="prose">Pas de relevé de prix pour cet univers.</p>';
  return `<div class="tw"><table><thead><tr><th>Format</th><th class="r">France</th><th class="r">Paris (+15 %)</th><th>Unité</th></tr></thead><tbody>${list.map(f => `<tr><td>${E(C.FORMATS[f] || f)}</td><td class="r">${eurR(p[f][0], p[f][1])}</td><td class="r">${eurR(paris(p[f][0]), paris(p[f][1]))}</td><td>${E(C.UNITS[f] || '€')}</td></tr>`).join('')}</tbody></table></div>`;
}
function neighbors(s, mk) {
  const n = (C.neighbors[s.id] || []).slice(0, 8).map(x => D.sById[x.id]).filter(Boolean);
  return `<div class="chips">${n.map(x => inTop[x.id] ? `<a href="${mk(x)}">${E(x.name)}</a>` : `<a href="${APP_LINK}#/outils/recherches">${E(x.name)}</a>`).join('')}</div>`;
}

/* ---------- page « Apprendre X à Paris » ---------- */
function learnPage(s) {
  const st = C.defaultState(); st.context.city = CITY; st.context.hoursPerWeek = 2; st.context.budgetPerMonth = 80;
  st.desires[s.id] = { verdict: 'yes', target: 2, priority: 1, horizon: '3m', formats: ['atelier', 'cours'] };
  const p = C.learnPlan(st, s.id), w = p.where, a = s.attrs;
  const mat = C.COST_RANGE[a.cost], at = C.priceRange(s.universe, 'atelier'), co = C.priceRange(s.universe, 'cours');
  const hrs = [1, 2, 3, 4].map(l => Math.max(1, Math.round(a.hoursToBasics * C.LEVEL_FACTOR[l])));
  const weeks2 = Math.ceil(hrs[1] / 2);
  const u = C.universe(s.universe);
  const title = `Apprendre ${lc(s)} à Paris : niveaux, budget, où commencer`;
  const desc = `${s.desc} Environ ${hrs[1]} h pour se débrouiller, ${mat[1] <= 20 ? 'presque aucun matériel' : 'matériel de ' + eurR(mat[0], mat[1])}, ateliers à Paris de ${eurR(paris(at.lo), paris(at.hi))}.`;
  const grp = (label, items) => items.length ? `<div class="grp"><span class="lbl">${E(label)}</span>${items.join('')}</div>` : '';
  const plat = x => item(x.p.name, x.p.url, x.p.bestFor || x.p.model, E(x.p.model ? x.p.model.slice(0, 100) : '') + (x.p.verify ? ' · à vérifier' : ''));
  let b = `<div class="kicker">Apprendre à Paris · ${E(u.name)}</div><h1>Apprendre ${E(lc(s))} à Paris</h1><p class="lead">${E(s.desc)} ${a.oneHourResult ? 'On repart avec un résultat montrable dès la première heure.' : 'Les premières séances servent surtout à poser le geste de base.'}</p>`;
  b += `<div class="counters">${counter('Pour se débrouiller', hrs[1] + '<small> h</small>', 'soit ' + weeks2 + ' semaines à 2 h par semaine', 'sent')}${counter('Matériel de départ', mat[1] <= 20 ? '≈ 0<small> €</small>' : U.fmt(mat[0]) + '–' + U.fmt(mat[1]) + '<small> €</small>', 'budget indicatif')}${counter('Atelier à Paris', U.fmt(paris(at.lo)) + '–' + U.fmt(paris(at.hi)) + '<small> €</small>', 'par personne' + (at.fallback ? ' · estimation' : ''), 'int')}${counter('Cours particulier', U.fmt(paris(co.lo)) + '–' + U.fmt(paris(co.hi)) + '<small> €</small>', 'de l’heure' + (co.fallback ? ' · estimation' : ''), 'wait')}</div>`;
  b += `<div class="row" style="margin-top:18px"><a class="btn primary lg" href="${APP_LINK}#/accueil">Faire mon bilan et obtenir mon plan</a><a class="btn lg" href="${APP_LINK}#/outils/autour/${s.universe}">Lieux autour de moi</a><a class="btn lg" href="${teachFile(s)}">Vous maîtrisez déjà ? Transmettre</a></div>`;
  b += sec('Jalons', 'Les quatre étapes, et le temps qu’elles demandent');
  b += `<div class="panel"><div class="pb"><div class="ladder">${s.levels.map((l, i) => `<div class="step"><span class="n">N${i + 1}</span><span class="t">${E(l)}</span><span class="h">≈ ${hrs[i]} h cumulées</span></div>`).join('')}</div></div></div>`;
  b += `<div class="note int"><span class="lbl">Premier pas cette semaine</span><span class="sp">${E(p.first.text)}${p.first.link ? ` · <a href="${E(p.first.link)}" rel="noopener">${E(p.first.label)}</a>` : ''}</span></div>`;
  b += sec('Où apprendre', 'Profs, ateliers, apps et communautés');
  b += `<div class="grid2"><section class="panel"><div class="ph"><span class="t">Avec quelqu’un</span></div><div class="pb">${grp('Profs et cours', w.teachers.map(plat))}${grp('Ateliers et stages', w.workshops.map(plat)) || ''}${!w.teachers.length && !w.workshops.length ? '<p class="prose">Pas de plateforme spécialisée référencée : passer par les communautés ci-contre.</p>' : ''}</div></section>`;
  b += `<section class="panel"><div class="ph"><span class="t">Seul ou en groupe</span></div><div class="pb">${grp('Apps et ressources', w.apps.map(x => item(x.name, x.url, x.desc, E(x.price))))}${grp('Communautés et lieux', w.communities.slice(0, 4).map(c => item(c.name, c.links[0] && c.links[0].url, c.desc, c.howToFind ? 'Trouver : ' + E(c.howToFind) : '')))}${grp('Réseaux et fédérations', w.networks.slice(0, 3).map(n => item(n.name, n.url, n.desc)))}</div></section></div>`;
  b += sec('Prix observés', 'Ce que coûte un encadrement, en France et à Paris');
  b += `<div class="panel"><div class="pb">${priceTable(s)}<p class="prose" style="margin-top:12px;font-size:14px">Relevés publics ${E(R.updated || '')}, ${E(u.name.toLowerCase())}. Paris applique +15 % aux fourchettes nationales.</p></div></div>`;
  if (s.regulated === 'sport') b += `<div class="note wait"><span class="lbl">À savoir</span><span class="sp">Activité sportive : choisir un encadrant diplômé (carte professionnelle) ou un club fédéré.</span></div>`;
  b += sec('Et ensuite', 'Compétences voisines');
  b += neighbors(s, learnFile);
  const ld = { '@context': 'https://schema.org', '@type': 'HowTo', name: 'Apprendre ' + lc(s) + ' à Paris', description: desc, totalTime: 'PT' + hrs[1] + 'H', estimatedCost: { '@type': 'MonetaryAmount', currency: 'EUR', value: String(mat[1]) }, step: s.levels.map((l, i) => ({ '@type': 'HowToStep', position: i + 1, text: l })) };
  return page(title + ' · Cordes', desc, `<a href="index.html">fiches</a> / apprendre / ${E(lc(s))}`, b, ld);
}

/* ---------- page « Donner des cours de X à Paris » ---------- */
function teachPage(s) {
  const st = C.defaultState(); st.mode = 'offer'; st.context.city = CITY;
  st.skills[s.id] = { level: 3, years: 4, proof: ['realisations'], teach: true, love: 3 };
  st.offer.assets.teachExp = 1; st.offer.audiences = ['debutants'];
  const a = s.attrs, u = C.universe(s.universe);
  const fA = s.formats.indexOf('atelier') >= 0 ? 'atelier' : s.formats[0];
  const off = C.buildOffer(st, s.id, fA, 0);
  const cours = C.suggestPrice(st, s.id, 'cours', 1);
  const monthly = Math.round(4 * off.size * 0.7 * off.price);
  const plats = R.platforms.filter(p => p.sides.indexOf('offer') >= 0 && C.matchUniverse(p.universes, s.universe) && (p.kinds.length === 0 || p.kinds.some(k => s.formats.indexOf(k) >= 0 && ['cours', 'atelier', 'stage', 'coaching', 'evenement', 'communaute'].indexOf(k) >= 0)))
    .map(p => ({ p, f: C.feeOf(p), sc: p.reach * 1.2 + p.control - p.effort * 0.5 + (p.universes.indexOf('*') < 0 ? 1 : 0) })).sort((x, y) => y.sc - x.sc).slice(0, 7);
  const reg = s.regulated && R.regulations[s.regulated];
  const micro = R.statuses.filter(x => x.id === 'micro-bnc')[0];
  const title = `Donner des cours ${de(s)} à Paris : prix, formats, où trouver des élèves`;
  const desc = `Prix conseillé à Paris : ${U.eur(cours.price)} de l’heure en cours particulier, ${U.eur(off.price)} par personne en ${C.FORMATS[fA].toLowerCase()}. Demande ${a.demand}/3, potentiel de revenu ${a.monetization}/3.`;
  let b = `<div class="kicker">Transmettre à Paris · ${E(u.name)}</div><h1>Donner des cours ${E(de(s))} à Paris</h1><p class="lead">Vous maîtrisez ${E(lc(s))} ? ${a.demand >= 2 ? 'C’est une compétence recherchée' : 'C’est une niche'}${a.teachable >= 2 ? ', qui se transmet bien en petit groupe' : ', plus facile à transmettre en individuel'}. Voici ce qu’elle se paie, sous quels formats, et où trouver vos premiers élèves.</p>`;
  b += `<div class="counters">${counter('Cours particulier', cours.price + '<small> € / h</small>', 'fourchette ' + eurR(cours.lo, cours.hi), 'int')}${counter(C.FORMATS[fA], off.price + '<small> ' + E(off.unit.replace('€ / ', '€/')) + '</small>', off.size + ' places · ' + off.duration + ' min', 'sent')}${counter('Quatre ateliers par mois', U.fmt(monthly) + '<small> €</small>', 'chiffre d’affaires à 70 % de remplissage', 'wait')}${counter('Demande', a.demand + '<small> / 3</small>', 'tendance ' + (a.trend >= 2 ? 'très en vogue' : a.trend === 1 ? 'en croissance' : a.trend < 0 ? 'en déclin' : 'stable'))}</div>`;
  b += `<div class="row" style="margin-top:18px"><a class="btn primary lg" href="${APP_LINK}#/accueil">Construire mon offre et mon plan 90 jours</a><a class="btn lg" href="${APP_LINK}#/attente/host">Devenir hôte fondateur</a><a class="btn lg" href="${learnFile(s)}">Fiche apprenant</a></div>`;
  b += sec('Une offre prête à publier', off.title);
  b += `<div class="grid2"><section class="panel"><div class="ph"><span class="t">Trame minutée</span><span class="hint">${off.duration} min · ${off.size} personnes</span></div><div class="pb"><p class="prose" style="margin-bottom:10px">${E(off.hook)}</p><div class="ladder">${off.outline.map(o => `<div class="step"><span class="n">${o.end ? o.start + '′' : '·'}</span><span class="t"><b style="font:500 12px var(--f-mono);display:block;color:var(--fg)">${E(o.label)}</b>${E(o.text)}</span><span class="h">${o.end ? (o.end - o.start) + ' min' : ''}</span></div>`).join('')}</div></div></section>`;
  b += `<section class="panel"><div class="ph"><span class="t">Pourquoi ce prix</span></div><div class="pb"><div class="ladder">${off.pricing.steps.map(x => `<div class="step"><span class="n">·</span><span class="t">${E(x.label)}</span><span class="h">${E(x.val)}</span></div>`).join('')}</div><p class="prose" style="margin-top:10px;font-size:14px">Calcul pour un niveau « je maîtrise », 4 ans de pratique et des réalisations à montrer. Le bilan l’ajuste à votre profil.</p></div></section></div>`;
  b += sec('Formats et prix', 'Ce qui se pratique pour cette compétence');
  b += `<div class="row" style="margin-bottom:12px">${s.formats.map(f => `<span class="pill"><i></i>${E(C.FORMATS[f])}</span>`).join('')}</div><div class="panel"><div class="pb">${priceTable(s)}</div></div>`;
  b += sec('Canaux', 'Où trouver vos premiers élèves');
  b += `<div class="panel"><div class="pb">${plats.map(x => item(x.p.name, x.p.url, x.p.bestFor || x.p.model, E(x.f.label || 'Sans commission') + ' · audience ' + x.p.reach + '/3 · maîtrise de la relation ' + x.p.control + '/3' + (x.p.verify ? ' · à vérifier' : ''))).join('')}</div></div>`;
  b += sec('Cadre', 'Statut et règles');
  b += `<div class="grid2"><section class="panel"><div class="ph"><span class="t">Statut le plus courant</span></div><div class="pb">${micro ? `<h3>${E(micro.name)}</h3><p class="prose" style="margin-top:6px">${E(micro.forWhat)}.</p><p class="prose" style="margin-top:6px">${E(firstSentence(micro.cost))} ${E(firstSentence(micro.ceiling))}</p>` : '<p class="prose">Micro-entreprise en prestations de services.</p>'}<p class="prose" style="margin-top:8px;font-size:14px">Orientation, pas un conseil juridique : le bilan compare les ${R.statuses.length} statuts selon votre revenu visé.</p></div></section>`;
  b += `<section class="panel"><div class="ph"><span class="t">Règles</span></div><div class="pb">${reg ? `<h3>${E(reg.title)}</h3><p class="prose" style="margin-top:6px">${E(reg.rule)}</p>${(reg.options || []).length ? `<ul class="prose" style="margin:8px 0 0;padding-left:18px">${reg.options.slice(0, 3).map(o => `<li>${E(o)}</li>`).join('')}</ul>` : ''}` : '<p class="prose">Aucune réglementation particulière pour enseigner cette compétence à des adultes. Assurance responsabilité civile professionnelle conseillée.</p>'}</div></section></div>`;
  b += `<div class="note int"><span class="lbl">Bientôt · Cordes</span><span class="sp">Des séances d’une heure en petit groupe dans des lieux partenaires du quartier : les hôtes sont payés 12 € par place occupée, sans démarcher.</span> <a href="${APP_LINK}#/attente/host">Rejoindre la liste</a></div>`;
  b += sec('Combiner', 'Compétences voisines pour une niche');
  b += neighbors(s, teachFile);
  const ld = { '@context': 'https://schema.org', '@type': 'Service', name: 'Cours ' + de(s) + ' à Paris', areaServed: 'Paris', description: desc, offers: { '@type': 'AggregateOffer', priceCurrency: 'EUR', lowPrice: cours.lo, highPrice: cours.hi } };
  return page(title + ' · Cordes', desc, `<a href="index.html">fiches</a> / transmettre / ${E(lc(s))}`, b, ld);
}

/* ---------- index ---------- */
function indexPage() {
  const byU = {}; top.forEach(s => { (byU[s.universe] = byU[s.universe] || []).push(s); });
  let b = `<div class="kicker">Fiches par compétence · Paris</div><h1>Apprendre ou transmettre à Paris</h1><p class="lead">Les ${top.length} compétences de loisir les plus demandées, chacune avec deux fiches : pour l’apprendre (jalons, heures, budget, où commencer) et pour la transmettre (prix conseillé, offre prête, canaux, cadre).</p>`;
  b += `<div class="row" style="margin-top:18px"><a class="btn primary lg" href="${APP_LINK}#/accueil">Faire mon bilan de compétences de vie</a><a class="btn lg" href="${APP_LINK}#/outils/recherches">Recherches préparées</a></div>`;
  b += sec('Classement', 'Demande, tendance, facilité à transmettre');
  b += `<div class="idx">${top.map((s, i) => `<div><span class="u"><span class="sw" style="background:hsl(${C.universe(s.universe).hue} 38% 62%)"></span>${E(C.universe(s.universe).short)} · n° ${i + 1}</span><span class="nm">${E(s.name)}</span><span class="l"><a href="${learnFile(s)}">Apprendre</a><a href="${teachFile(s)}">Donner des cours</a></span></div>`).join('')}</div>`;
  b += `<p class="prose" style="margin-top:18px;font-size:14px">Rang = 3 × demande + 1,5 × tendance + 0,6 × facilité à transmettre + 0,4 × potentiel de revenu (attributs du catalogue Cordes, estimations éditoriales), trois compétences au plus par univers : ${Object.keys(byU).length} univers représentés.</p>`;
  return page('Apprendre ou transmettre à Paris : ' + top.length + ' compétences de loisir · Cordes', 'Jalons, heures, budget, prix observés et canaux pour les ' + top.length + ' compétences de loisir les plus demandées à Paris.', 'fiches par compétence', b);
}

/* ---------- écriture ---------- */
fs.mkdirSync(OUT, { recursive: true });
fs.readdirSync(OUT).filter(f => /^(apprendre|donner-des-cours)-.*\.html$/.test(f)).forEach(f => fs.unlinkSync(path.join(OUT, f)));
fs.writeFileSync(path.join(OUT, 'seo.css'), CSS + '\n');
fs.writeFileSync(path.join(OUT, 'index.html'), indexPage());
let n = 1;
top.forEach(s => { fs.writeFileSync(path.join(OUT, learnFile(s)), learnPage(s)); fs.writeFileSync(path.join(OUT, teachFile(s)), teachPage(s)); n += 2; });
const sitemap = ['index.html'].concat(top.map(learnFile), top.map(teachFile));
fs.writeFileSync(path.join(OUT, 'sitemap.txt'), sitemap.join('\n') + '\n');
console.log(`${n} pages générées dans ${path.relative(process.cwd(), OUT) || OUT} : ${top.slice(0, 6).map(s => s.name).join(', ')}…`);
if (C.anomalies.length) console.log('Anomalies de données : ' + C.anomalies.map(a => a.msg).join(' · '));
