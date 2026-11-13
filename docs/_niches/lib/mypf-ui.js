/* ───── mon portefeuille : interface et persistance ─────
   Inséré par build.js dans la portée de lib/app.js (repère __MYPF_UI__). Utilise N, byId, SEC, CAT, SUB, PAR, L, E, D,
   esc, f1, toast, pill, sbar, X, VIS, renderX, renderTop, openNiche, download, mixCard (fonctions hissées). */
var MY = window.MYPF;
var KNOWN = {}; N.forEach(function (n) { KNOWN[n.id] = 1; });
var ST = MY.empty(), IN = {};
var MYUI = { q: '', group: 'sector', sort: 's1', fv: '', tag: '', renaming: false, delArm: 0, imp: null, repArm: 0 };
var SYNC = { mode: 'local', ref: null, writing: false, pending: false, timer: 0, last: '', early: false, unsub: null };
var MYCTX = { byId: byId, N: N, SEC: SEC, CAT: CAT, SUB: SUB, PAR: PAR, LBL: L, KEYS: E.KEYS, ENG: E, sectors: D.sectors, editorial: D.editorial, studyPfs: D.portfolios, study: 'Étude des niches v2 · ' + D.updated };
var MARK = '<span class="mk" title="Modifié à la main" aria-label="modifié">✎</span>';

function curSet() { var o = {}; MY.cur(ST).ids.forEach(function (id) { o[id] = 1; }); IN = o; return o; }
function ev(n) { return ST.mode === 'mine' ? MY.verdict(ST, n) : n.verdict; }
function vpill(n) { return pill(ev(n), ST.mode === 'mine' && ST.ov[n.id] && ST.ov[n.id].v); }
function pfb(n) { var on = !!IN[n.id]; return '<button type="button" class="pfb" data-pf="' + n.id + '" aria-pressed="' + on + '" aria-label="Retenir «\u00a0' + esc(n.name) + '\u00a0» dans mon portefeuille" title="' + (on ? 'Retirer du portefeuille' : 'Ajouter au portefeuille') + '">' + (on ? '✓' : '+') + '</button>'; }
function setBtn(ids) {
  var on = ids.length && ids.every(function (id) { return IN[id]; });
  return { on: on, t: on ? 'Retirer ' + (ids.length > 1 ? 'les ' + ids.length + ' niches' : 'la niche') : 'Ajouter ' + (ids.length > 1 ? 'les ' + ids.length + ' niches' : 'la niche') };
}
function pfSetBtn(ids, cls) { var s = setBtn(ids); return '<button type="button" class="btn sm' + (cls ? ' ' + cls : '') + '" data-pfset="' + ids.join('|') + '" aria-pressed="' + s.on + '">' + s.t + '</button>'; }
function hhmm() { var d = new Date(); return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2); }
function setSync(col, long, short) {
  $('sync-dot').style.background = 'var(--' + col + ')';
  $('sync-t').innerHTML = '<span class="lbl2">' + esc(long) + (short ? ' · ' : '') + '</span>' + esc(short || '');
  $('sync').setAttribute('data-s', col); $('sync').title = long + (short ? ' · ' + short : '');
}

/* ───── mises à jour après un changement ───── */
var VQ = 0;
function refreshViews() { cancelAnimationFrame(VQ); VQ = requestAnimationFrame(function () { renderX(); renderTop(); renderMy(); if ($('side').classList.contains('on') && X.sel) sidePills(byId[X.sel]); }); }
function paintPf() {
  var name = MY.cur(ST).name;
  document.querySelectorAll('[data-pf]').forEach(function (b) {
    var on = !!IN[b.getAttribute('data-pf')]; b.setAttribute('aria-pressed', on);
    if (b.classList.contains('pfbig')) b.textContent = on ? '✓ Dans «\u00a0' + name + '\u00a0» · retirer' : 'Ajouter au portefeuille';
    else { b.textContent = on ? '✓' : '+'; b.title = on ? 'Retirer du portefeuille' : 'Ajouter au portefeuille'; }
  });
  document.querySelectorAll('[data-pfset]').forEach(function (b) { var s = setBtn(b.getAttribute('data-pfset').split('|')); b.setAttribute('aria-pressed', s.on); b.textContent = s.t; });
  paintGroups(); paintAddAll();
  var c = MY.cur(ST).ids.length; $('pf-jump-n').textContent = c; $('pf-jump').setAttribute('aria-label', 'Aller à Mon portefeuille, ' + c + ' niche' + (c > 1 ? 's' : ''));
}
function grpIds(key) { var k = key.split(':'), f = k[0] === 'x' ? 'sector' : k[0] === 'c' ? 'category' : 'subcategory'; return VIS.filter(function (n) { return n[f] === k[1]; }).map(function (n) { return n.id; }); }
function paintGroups() {
  document.querySelectorAll('[data-pfgrp]').forEach(function (b) { var ids = grpIds(b.getAttribute('data-pfgrp')), on = ids.every(function (id) { return IN[id]; }); b.setAttribute('aria-pressed', on); b.textContent = on ? 'Retirer' : 'Ajouter'; });
}
function paintAddAll() {
  var b = $('x-addall'); if (!b) return; var act = active();
  b.classList.toggle('hide', !act || !VIS.length);
  if (!act) return; var all = VIS.every(function (n) { return IN[n.id]; });
  b.textContent = (all ? 'Retirer ' : 'Ajouter ') + (VIS.length > 1 ? 'les ' + VIS.length + ' niches filtrées' : 'la niche filtrée'); b.setAttribute('data-all', all ? '1' : '');
}
function afterSel() { curSet(); paintPf(); save(); if (Object.keys(X.mine).length) renderX(); else counts(); scheduleMy(); }
var MQ = 0; function scheduleMy() { clearTimeout(MQ); MQ = setTimeout(renderMy, 60); }

/* ───── gestes de sélection (capture : passe avant l'ouverture des fiches) ───── */
document.addEventListener('click', function (e) {
  var b = e.target.closest('[data-pf],[data-pfgrp],[data-pfset],[data-pfcopy]'); if (!b) return;
  e.stopPropagation(); e.preventDefault();
  var name = MY.cur(ST).name, ids, n;
  if (b.hasAttribute('data-pf')) { var id = b.getAttribute('data-pf'), on = MY.toggle(ST, id); afterSel(); toast((on ? 'Ajoutée à «\u00a0' : 'Retirée de «\u00a0') + name + '\u00a0»'); return; }
  if (b.hasAttribute('data-pfcopy')) { var sp = D.portfolios.filter(function (p) { return p.id === b.getAttribute('data-pfcopy'); })[0]; if (!sp) return; var np = MY.create(ST, sp.n, sp.niches); if (!np) { toast('Quarante portefeuilles au plus'); return; } afterSel(); toast('Portefeuille «\u00a0' + np.name + '\u00a0» créé'); return; }
  ids = b.hasAttribute('data-pfgrp') ? grpIds(b.getAttribute('data-pfgrp')) : b.getAttribute('data-pfset').split('|');
  if (ids.every(function (x) { return IN[x]; })) { n = MY.drop(ST, ids); toast(n + ' niche' + (n > 1 ? 's' : '') + ' retirée' + (n > 1 ? 's' : '') + ' de «\u00a0' + name + '\u00a0»'); }
  else { n = MY.add(ST, ids); toast(n + ' niche' + (n > 1 ? 's' : '') + ' ajoutée' + (n > 1 ? 's' : '') + ' à «\u00a0' + name + '\u00a0»'); }
  afterSel();
}, true);
$('x-addall').addEventListener('click', function () {
  var ids = VIS.map(function (n) { return n.id; }), n;
  if ($('x-addall').getAttribute('data-all')) { n = MY.drop(ST, ids); toast(n + ' niches retirées'); } else { n = MY.add(ST, ids); toast(n + ' niches ajoutées à «\u00a0' + MY.cur(ST).name + '\u00a0»'); }
  afterSel();
});
document.querySelectorAll('[data-vm]').forEach(function (b) {
  b.addEventListener('click', function () { ST.mode = b.getAttribute('data-vm'); paintMode(); save(); refreshViews(); toast(ST.mode === 'mine' ? 'Affichage de mes verdicts' : 'Affichage des verdicts de l’étude'); });
});
function paintMode() { document.querySelectorAll('[data-vm]').forEach(function (x) { x.setAttribute('aria-pressed', x.getAttribute('data-vm') === ST.mode); }); }

/* ───── fiche : bloc «\u00a0Mon suivi\u00a0» ───── */
function sidePills(n) {
  var el = $('side-pills'); if (!el || !n) return;
  el.innerHTML = vpill(n) + '<span class="pill p-acc"><i></i>Score ' + f1(n.s0) + ' · rang ' + n.r0 + '</span>' + (n.par ? '<span class="pill p-wait"><i></i>Avec parades ' + f1(n.s1) + ' · rang ' + n.r1 + '</span>' : '') + '<span class="tag t-' + (n.confidence === 'source' ? 'S' : n.confidence === 'estimation' ? 'E' : 'H') + '">' + n.confidence + '</span>';
}
function rv(k) { return '<button type="button" class="rv" data-mrs="' + k + '">Revenir à la valeur de l’étude</button>'; }
function mineBlock(n) {
  var o = MY.get(ST, n.id), on = !!IN[n.id], lvs = MY.levels(ST, n.id), mv = MY.verdict(ST, n), tags = o.t || [];
  var sug = MY.allTags(ST).filter(function (t) { return tags.indexOf(t) < 0; }).slice(0, 8);
  var h = '<div class="mine-h"><span class="t">Mon suivi</span><button type="button" class="btn sm pfbig" data-pf="' + n.id + '" aria-pressed="' + on + '">' + (on ? '✓ Dans «\u00a0' + esc(MY.cur(ST).name) + '\u00a0» · retirer' : 'Ajouter au portefeuille') + '</button></div>';
  h += '<div class="mf"><div class="mfh"><span class="k">Mon verdict' + (o.v ? MARK : '') + '</span>' + (o.v ? rv('v') : '<span class="sub">valeur de l’étude</span>') + '</div><div class="seg" role="group" aria-label="Mon verdict">' + MY.VERDICTS.map(function (v) { return '<button type="button" data-mv="' + v + '" data-fk="mv-' + v + '" aria-pressed="' + (mv === v) + '">' + L.verdict[v][0] + '</button>'; }).join('') + '</div>' + (o.v ? '<div class="sub">Étude : ' + L.verdict[n.verdict][0] + '</div>' : '') + '</div>';
  h += '<div class="mf"><div class="mfh"><span class="k">Priorité personnelle' + (o.p ? MARK : '') + '</span>' + (o.p ? rv('p') : '') + '</div><div class="seg" role="group" aria-label="Priorité personnelle">' + [0, 1, 2, 3].map(function (p) { return '<button type="button" data-mp="' + p + '" data-fk="mp-' + p + '" aria-pressed="' + ((o.p || 0) === p) + '">' + (p ? 'P' + p : 'Aucune') + '</button>'; }).join('') + '</div></div>';
  h += '<div class="mf"><div class="mfh"><span class="k">Étiquettes' + (tags.length ? MARK : '') + '</span>' + (tags.length ? rv('t') : '') + '</div>' +
    (tags.length ? '<div class="tgs" style="margin-bottom:8px">' + tags.map(function (t) { return '<button type="button" class="tg x" data-mtrm="' + esc(t) + '" aria-label="Retirer l’étiquette ' + esc(t) + '">' + esc(t) + ' <span aria-hidden="true">×</span></button>'; }).join('') + '</div>' : '') +
    '<div class="tadd"><input class="in" type="text" id="m-tag" data-fk="tag" maxlength="40" placeholder="vague 1, 11e, entreprise…" aria-label="Nouvelle étiquette" autocomplete="off"><button type="button" class="btn sm" data-mtadd="" data-fk="tag-b">Ajouter</button></div>' +
    (sug.length ? '<div class="tgs" style="margin-top:6px">' + sug.map(function (t) { return '<button type="button" class="tg add" data-mtadd="' + esc(t) + '">+ ' + esc(t) + '</button>'; }).join('') + '</div>' : '') + '</div>';
  h += '<div class="mf"><div class="mfh"><span class="k">Paliers à lancer' + (o.lv ? MARK : '') + '</span>' + (o.lv ? rv('lv') : '<span class="sub">les cinq par défaut</span>') + '</div><div class="lvp" role="group" aria-label="Paliers à lancer">' + n.levels.map(function (l, i) { var k = i + 1; return '<button type="button" class="chip c-acc" data-ml="' + k + '" data-fk="ml-' + k + '" aria-pressed="' + (lvs.indexOf(k) >= 0) + '" title="' + esc(l.title) + ' · ' + l.price[0] + ' à ' + l.price[1] + ' €"><i></i>N' + k + ' · ' + l.price[0] + '-' + l.price[1] + ' €</button>'; }).join('') + '</div></div>';
  h += '<div class="mf"><div class="mfh"><span class="k" id="m-note-k">Note' + (o.note ? MARK : '') + '</span><span id="m-note-r">' + (o.note ? rv('note') : '') + '</span></div><textarea class="in" id="m-note" data-fk="note" rows="3" maxlength="2000" aria-labelledby="m-note-k" placeholder="Contact, lieu repéré, idée de format…">' + esc(o.note || '') + '</textarea></div>';
  if (ST.ov[n.id]) h += '<button type="button" class="rv" data-mrs="*" style="margin-top:6px">Revenir à l’étude pour toute la fiche</button>';
  return h;
}
function renderMine(n) {
  var el = $('side-mine'); if (!el) return;
  var fk = document.activeElement && el.contains(document.activeElement) ? document.activeElement.getAttribute('data-fk') : null;
  el.innerHTML = mineBlock(n);
  if (fk) { var f = el.querySelector('[data-fk="' + fk + '"]'); if (f) f.focus({ preventScroll: true }); }
}
function requal(id, k, val) { MY.set(ST, id, k, val, byId[id].verdict); save(); renderMine(byId[id]); refreshViews(); }
function addTag(id, t) { t = MY.cleanTag(t); if (!t) return; var cur = (MY.get(ST, id).t || []).slice(); if (cur.length >= MY.MAX_TAGS) { toast('Douze étiquettes au plus'); return; } cur.push(t); requal(id, 't', cur); var i = $('m-tag'); if (i) i.focus(); }
$('side-b').addEventListener('click', function (e) {
  var id = X.sel, n = byId[id]; if (!n) return; var b;
  if ((b = e.target.closest('[data-mv]'))) { requal(id, 'v', b.getAttribute('data-mv')); toast('Verdict requalifié'); return; }
  if ((b = e.target.closest('[data-mp]'))) { requal(id, 'p', +b.getAttribute('data-mp')); return; }
  if ((b = e.target.closest('[data-ml]'))) { var k = +b.getAttribute('data-ml'), l = MY.levels(ST, id).slice(), i = l.indexOf(k); if (i >= 0) { if (l.length === 1) { toast('Garder au moins un palier'); return; } l.splice(i, 1); } else l.push(k); requal(id, 'lv', l); return; }
  if ((b = e.target.closest('[data-mtrm]'))) { var t = b.getAttribute('data-mtrm'); requal(id, 't', (MY.get(ST, id).t || []).filter(function (x) { return x !== t; })); return; }
  if ((b = e.target.closest('[data-mtadd]'))) { var v = b.getAttribute('data-mtadd') || ($('m-tag') || {}).value; addTag(id, v); return; }
  if ((b = e.target.closest('[data-mrs]'))) { var f = b.getAttribute('data-mrs'); MY.reset(ST, id, f === '*' ? null : f); save(); renderMine(n); refreshViews(); toast('Valeur de l’étude rétablie'); }
});
$('side-b').addEventListener('keydown', function (e) { if (e.target.id === 'm-tag' && e.key === 'Enter') { e.preventDefault(); addTag(X.sel, e.target.value); } });
$('side-b').addEventListener('input', function (e) {
  if (e.target.id !== 'm-note') return; var id = X.sel; MY.set(ST, id, 'note', e.target.value, byId[id].verdict); save();
  var has = !!MY.get(ST, id).note; $('m-note-k').innerHTML = 'Note' + (has ? MARK : ''); var r = $('m-note-r'); if (r && !!r.firstChild !== has) r.innerHTML = has ? rv('note') : '';
  clearTimeout(MYUI.nt); MYUI.nt = setTimeout(refreshViews, 400);
});

/* ───── section «\u00a0Mon portefeuille\u00a0» ───── */
var VSEQ = { prioritaire: 0, 'a-tester': 1, 'plus-tard': 2, ecarter: 3 };
function myList() {
  var p = MY.cur(ST), w = MYUI.q ? norm(MYUI.q).split(/\s+/).filter(Boolean) : [];
  var list = p.ids.map(function (id) { return byId[id]; }).filter(function (n) {
    if (!n) return false;
    if (w.length && !w.every(function (x) { return n.q.indexOf(x) >= 0 || norm((MY.get(ST, n.id).t || []).join(' ') + ' ' + (MY.get(ST, n.id).note || '')).indexOf(x) >= 0; })) return false;
    if (MYUI.fv && ev(n) !== MYUI.fv) return false;
    if (MYUI.tag && (MY.get(ST, n.id).t || []).indexOf(MYUI.tag) < 0) return false;
    return true;
  });
  var pk = function (n) { return MY.get(ST, n.id).p || 9; };
  var cmp = { s1: function (a, b) { return b.s1 - a.s1; }, name: function (a, b) { return a.name.localeCompare(b.name); }, prio: function (a, b) { return pk(a) - pk(b) || b.s1 - a.s1; }, p1: function (a, b) { return a.levels[0].price[0] - b.levels[0].price[0] || b.s1 - a.s1; }, verdict: function (a, b) { return VSEQ[ev(a)] - VSEQ[ev(b)] || b.s1 - a.s1; } }[MYUI.sort] || function (a, b) { return b.s1 - a.s1; };
  return list.sort(cmp);
}
function myGroups(list) {
  var g = MYUI.group, out = [], map = {};
  var put = function (k, lbl, ord, n) { if (!map[k]) { map[k] = { k: k, lbl: lbl, ord: ord, list: [] }; out.push(map[k]); } map[k].list.push(n); };
  var so = {}; D.sectors.forEach(function (s, i) { so[s.id] = i; });
  list.forEach(function (n) {
    var o = MY.get(ST, n.id);
    if (g === 'sector') put(n.sector, SEC[n.sector].n, so[n.sector], n);
    else if (g === 'prio') put('p' + (o.p || 9), o.p ? 'Priorité P' + o.p : 'Sans priorité', o.p || 9, n);
    else if (g === 'verdict') { var v = ev(n); put(v, L.verdict[v][0], VSEQ[v], n); }
    else if (g === 'tag') { if (o.t && o.t.length) o.t.forEach(function (t) { put('t' + t, t, 0, n); }); else put('-', 'Sans étiquette', 1, n); }
    else put('all', '', 0, n);
  });
  return out.sort(function (a, b) { return a.ord - b.ord || a.lbl.localeCompare(b.lbl); });
}
function lvDots(id) { var l = MY.levels(ST, id); return '<span class="lvd" aria-label="Paliers retenus : ' + l.join(', ') + '">' + [1, 2, 3, 4, 5].map(function (k) { return '<i' + (l.indexOf(k) >= 0 ? ' class="on"' : '') + '>' + k + '</i>'; }).join('') + '</span>'; }
function myRow(n, ids) {
  var o = MY.get(ST, n.id);
  return '<div class="mrow">' + pfb(n) + '<button type="button" class="lnk mn" data-open="' + n.id + '" data-list="' + ids + '">' + esc(n.name) + '<small>' + esc(SEC[n.sector].n) + ' · ' + esc((CAT[n.category] || {}).name || '') + (n.par ? ' · parade' : '') + '</small></button>' +
    '<span class="mmeta">' + vpill(n) + (o.p ? '<span class="prio p' + o.p + '">P' + o.p + '</span>' : '') + lvDots(n.id) + (o.t || []).map(function (t) { return '<span class="tg">' + esc(t) + '</span>'; }).join('') + (o.note ? '<span class="tg nt" title="' + esc(o.note) + '">note</span>' : '') + '</span>' + sbar(n.s1) + '</div>';
}
function barList(rows, lbl, max) {
  var m = rows.length ? rows[0][1] : 1;
  return '<ul class="bl">' + rows.slice(0, max || 8).map(function (r) { return '<li><span class="bn">' + esc(lbl[r[0]] || r[0]) + '</span><span class="g"><b style="width:' + Math.round(r[1] / m * 100) + '%"></b></span><span class="c">' + r[1] + '</span></li>'; }).join('') + '</ul>' + (rows.length > (max || 8) ? '<div class="note">et ' + (rows.length - (max || 8)) + ' autres</div>' : '');
}
function cnt5(cells) { return cells.map(function (m) { return '<div><div class="k"><span class="sq" style="background:var(--' + m[3] + ')"></span>' + m[0] + '</div><div class="v big">' + m[1] + '</div><div class="sub">' + m[2] + '</div></div>'; }).join(''); }
function renderMy() {
  if (!$('my')) return;
  var p = MY.cur(ST), S = MY.synth(ST, p.ids, MYCTX), list = myList(), ids = list.map(function (n) { return n.id; }).join(',');
  $('my-tabs').innerHTML = ST.pfs.map(function (x) { return '<button type="button" data-myt="' + x.id + '" aria-pressed="' + (x.id === ST.cur) + '">' + esc(x.name) + ' <b>' + x.ids.length + '</b></button>'; }).join('');
  $('my-del').textContent = MYUI.delArm ? 'Confirmer la suppression' : 'Supprimer';
  $('my-del').classList.toggle('danger', !!MYUI.delArm);
  $('my-ren-row').classList.toggle('hide', !MYUI.renaming);
  if (MYUI.renaming && document.activeElement !== $('my-name')) { $('my-name').value = p.name; }
  var k = S.n || 1;
  $('my-c').innerHTML = cnt5([
    ['Niches retenues', S.n, 'dans «\u00a0' + esc(p.name) + '\u00a0»', 'accent'],
    ['Secteurs couverts', S.nSec + ' / ' + D.sectors.length, S.missing.length ? S.missing.length + ' secteurs absents' : 'tous les secteurs', 'sent'],
    ['Prioritaires', S.vc.prioritaire, (ST.mode === 'mine' ? 'mes verdicts' : 'mes verdicts') + ' · P1 ' + S.pc[1] + ' · P2 ' + S.pc[2] + ' · P3 ' + S.pc[3], 'int'],
    ['Avec parade', S.n ? Math.round(S.par / k * 100) + ' %' : '–', S.par + ' niche' + (S.par > 1 ? 's' : '') + ' à faible propension', 'wait'],
    ['Propension moyenne', S.n ? f1(S.wtp) : '–', S.n ? 'effective avec parades ' + f1(S.wEff) + ' · score ' + f1(S.s1) : 'sur 5', 'accent']
  ]);
  /* liste */
  var tags = MY.allTags(ST);
  var tsel = $('my-tag'); var tv = MYUI.tag; tsel.innerHTML = '<option value="">Toutes</option>' + tags.map(function (t) { return '<option value="' + esc(t) + '"' + (t === tv ? ' selected' : '') + '>' + esc(t) + '</option>'; }).join('');
  if (tv && tags.indexOf(tv) < 0) MYUI.tag = '';
  $('my-cnt').textContent = list.length + (list.length !== S.n ? ' / ' + S.n : '');
  var h = '';
  if (!S.n) h = '<div class="empty">Aucune niche retenue dans «\u00a0' + esc(p.name) + '\u00a0». Ajouter avec le bouton + d’une ligne de l’explorateur, la touche P dans une fiche, ou copier un portefeuille de l’étude plus bas.</div>';
  else if (!list.length) h = '<div class="empty">Aucune niche ne correspond. Effacer la recherche ou le filtre.</div>';
  else myGroups(list).forEach(function (g) { if (g.lbl) h += '<div class="mgrp"><span>' + esc(g.lbl) + '</span><b>' + g.list.length + '</b><span class="act"><button type="button" class="btn sm ghost" data-pfset="' + g.list.map(function (n) { return n.id; }).join('|') + '" aria-pressed="true">Retirer les ' + g.list.length + ' niches</button></span></div>'; h += g.list.map(function (n) { return myRow(n, ids); }).join(''); });
  $('my-list').innerHTML = h;
  /* synthèse */
  var sx = '';
  if (S.n) {
    var secRows = D.sectors.filter(function (s) { return S.sec[s.id]; }).map(function (s) { return [s.n, S.sec[s.id]]; }).sort(function (a, b) { return b[1] - a[1]; });
    sx += '<div class="panel"><div class="ph"><span class="t">Couverture des secteurs</span><span class="h">' + S.nSec + ' sur ' + D.sectors.length + '</span></div><div class="pb">' + barList(secRows, {}, 17) + (S.missing.length ? '<p class="note">Absents : ' + S.missing.map(function (id) { return esc(SEC[id].n); }).join(', ') + '.</p>' : '') + '</div></div>';
    sx += '<div class="panel"><div class="ph"><span class="t">Lieux nécessaires</span><span class="h">niches par lieu</span></div><div class="pb">' + barList(S.venues, L.venues, 8) + '</div></div>';
    sx += '<div class="panel"><div class="ph"><span class="t">Moments et publics</span></div><div class="pb">' + barList(S.moments, L.moments, 7) + '<h4 style="margin-top:14px">Publics</h4>' + barList(S.publics, L.publics, 6) + '</div></div>';
    $('my-syn').innerHTML = sx;
    $('my-lv').innerHTML = '<thead><tr><th>Palier</th><th class="num">Niches</th><th class="num">Prix moyen</th><th class="num">Fourchette</th><th>Hôtes à recruter</th><th class="num">Hôtes</th></tr></thead><tbody>' + S.lv.map(function (l) {
      return '<tr><td style="white-space:nowrap">N' + l.k + ' · ' + esc(E.LEVELS[l.k - 1][1]) + '</td><td class="num">' + l.n + '</td><td class="num">' + (l.n ? Math.round(l.mean) + ' €' : '–') + '</td><td class="num">' + (l.n ? l.lo + ' à ' + l.hi + ' €' : '–') + '</td><td>' + (l.k < 5 ? 'niveau ' + l.hostLevel + ' au moins' : 'référent confirmé') + '</td><td class="num">' + l.hosts + '</td></tr>';
    }).join('') + '<tr><td colspan="5" style="color:var(--fg-2)">Total · un hôte par palier ouvert et par niche</td><td class="num"><b>' + S.hostsTotal + '</b></td></tr></tbody>';
    var mh = Object.keys(S.minHosts).sort().map(function (lv) { return S.minHosts[lv] + ' ' + (lv === 'référent' ? 'référent' + (S.minHosts[lv] > 1 ? 's' : '') : 'de niveau ' + lv); }).join(', ');
    $('my-lv-n').textContent = 'Règle n → n-1 : un palier k est animé par un hôte de niveau k+1 au moins, le palier 5 par un référent. Au minimum, un seul hôte par niche du niveau le plus haut requis : ' + S.n + ' hôtes (' + mh + ').';
    $('my-mix').innerHTML = S.mixes.length ? S.mixes.map(function (x) { var a = byId[x[1]], b = byId[x[2]], f = E.format([a, b], x[3]); return '<tr><td class="num">' + Math.round(x[0]) + '</td><td><span style="font-family:var(--f-body);font-size:14.5px">' + esc(f.name) + '</span><div class="note" style="margin:0">' + esc(D.families[f.fam]) + ' · ' + esc(f.why[0] || '') + '</div></td><td>' + esc(L.venues[f.venue] || '') + '</td><td class="num">' + f.price + ' €</td><td><button class="btn sm" type="button" data-edmix="' + a.id + '|' + b.id + '">Explorer</button></td></tr>'; }).join('') +
      S.ed.map(function (x) { return '<tr><td class="num">' + x.m.s + '</td><td><span style="font-family:var(--f-body);font-size:14.5px">' + esc(x.m.name) + '</span><div class="note" style="margin:0">Sélection éditoriale · ' + (x.all ? 'toutes ses niches sont retenues' : 'deux niches retenues sur trois') + '</div></td><td>' + esc(x.m.venue) + '</td><td class="num">' + esc(x.m.price) + '</td><td><button class="btn sm" type="button" data-edmix="' + x.m.n.join('|') + '">Explorer</button></td></tr>'; }).join('')
      : '<tr><td colspan="5" class="empty">Retenir des niches d’au moins deux secteurs pour voir les mixes possibles.</td></tr>';
    $('my-mix-h').textContent = S.pairsN + ' paires évaluées · secteurs différents';
  } else {
    $('my-syn').innerHTML = '<div class="panel"><div class="empty">La synthèse apparaît dès la première niche retenue.</div></div>';
    $('my-lv').innerHTML = ''; $('my-lv-n').textContent = ''; $('my-mix').innerHTML = '<tr><td colspan="5" class="empty">Aucune niche retenue.</td></tr>'; $('my-mix-h').textContent = '';
  }
  $('my-cmp').innerHTML = '<thead><tr><th>Portefeuille de l’étude</th><th class="num">Recouvrement</th><th>Niches en commun</th><th></th></tr></thead><tbody>' + S.cmp.map(function (c, i) {
    return '<tr><td><span class="nm" style="font-family:var(--f-display);font-size:15px">' + esc(c.p.n) + '</span><div class="note" style="margin:0">' + (i < 2 ? (i === 0 ? 'Recommandé · cœur' : 'Recommandé · complément') : 'Candidat ' + (i + 1)) + '</div></td><td class="num"><span class="mbar"><span class="g"><b style="width:' + Math.round(c.share * 100) + '%"></b></span>' + c.common.length + ' / ' + c.p.niches.length + '</span></td><td style="font-family:var(--f-body);font-size:14px">' + (c.common.length ? c.common.map(function (id) { return esc(byId[id].name); }).join(', ') : '<span style="color:var(--fg-3)">aucune</span>') + '</td><td style="white-space:nowrap">' + pfSetBtn(c.p.niches, 'ghost') + ' <button type="button" class="btn sm ghost" data-pfcopy="' + c.p.id + '">Copier en portefeuille</button></td></tr>';
  }).join('') + '</tbody>';
  ['my-csv', 'my-copy'].forEach(function (b) { $(b).disabled = !S.n; });
  renderImp();
}
$('my').addEventListener('click', function (e) {
  var b = e.target.closest('[data-myt]'); if (b) { ST.cur = b.getAttribute('data-myt'); MYUI.renaming = false; MYUI.delArm = 0; afterSel(); renderMy(); return; }
  var g = e.target.closest('[data-myg]'); if (g) { MYUI.group = g.getAttribute('data-myg'); document.querySelectorAll('[data-myg]').forEach(function (x) { x.setAttribute('aria-pressed', x === g); }); renderMy(); }
});
$('my-q').addEventListener('input', function (e) { MYUI.q = e.target.value.trim(); clearTimeout(MYUI.qt); MYUI.qt = setTimeout(renderMy, 90); });
$('my-sort').addEventListener('change', function (e) { MYUI.sort = e.target.value; renderMy(); });
$('my-fv').addEventListener('change', function (e) { MYUI.fv = e.target.value; renderMy(); });
$('my-tag').addEventListener('change', function (e) { MYUI.tag = e.target.value; renderMy(); });
$('my-new').addEventListener('click', function () { var p = MY.create(ST); if (!p) { toast('Quarante portefeuilles au plus'); return; } MYUI.renaming = true; afterSel(); renderMy(); $('my-name').value = p.name; $('my-name').focus(); $('my-name').select(); toast('Portefeuille créé'); });
$('my-dup').addEventListener('click', function () { var p = MY.duplicate(ST, ST.cur); if (!p) { toast('Quarante portefeuilles au plus'); return; } afterSel(); renderMy(); toast('«\u00a0' + p.name + '\u00a0» créé'); });
$('my-ren').addEventListener('click', function () { MYUI.renaming = !MYUI.renaming; renderMy(); if (MYUI.renaming) { $('my-name').value = MY.cur(ST).name; $('my-name').focus(); $('my-name').select(); } });
function commitName() { var v = $('my-name').value; if (MY.rename(ST, ST.cur, v)) { save(); toast('Portefeuille renommé'); } MYUI.renaming = false; renderMy(); paintPf(); }
$('my-name-ok').addEventListener('click', commitName);
$('my-name').addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); commitName(); } else if (e.key === 'Escape') { e.stopPropagation(); MYUI.renaming = false; renderMy(); $('my-ren').focus(); } });
$('my-del').addEventListener('click', function () {
  if (!MYUI.delArm) { MYUI.delArm = setTimeout(function () { MYUI.delArm = 0; renderMy(); }, 4000); renderMy(); return; }
  clearTimeout(MYUI.delArm); MYUI.delArm = 0; var nm = MY.cur(ST).name; MY.remove(ST, ST.cur); MYUI.renaming = false; afterSel(); renderMy(); toast('«\u00a0' + nm + '\u00a0» supprimé');
});

/* ───── exports et import ───── */
function csvCur() { return MY.csv(ST, ST.cur, MYCTX); }
$('my-csv').addEventListener('click', function () { download('portefeuille-' + MY.slug(MY.cur(ST).name) + '.csv', csvCur()); toast(MY.cur(ST).ids.length + ' niches exportées'); });
$('my-json').addEventListener('click', function () { download('mes-portefeuilles-' + new Date().toISOString().slice(0, 10) + '.json', MY.json(ST, MYCTX)); toast(ST.pfs.length + ' portefeuille' + (ST.pfs.length > 1 ? 's' : '') + ' exporté' + (ST.pfs.length > 1 ? 's' : '')); });
$('my-base').addEventListener('click', function () { download('niches-base-complete.csv', MY.csvBase(ST, MYCTX)); toast(N.length + ' niches exportées avec mes requalifications'); });
$('my-copy').addEventListener('click', function () {
  var t = csvCur(), n = MY.cur(ST).ids.length;
  try { navigator.clipboard.writeText(t.replace(/^﻿/, '')).then(function () { toast('CSV copié · ' + n + ' lignes'); }, function () { toast('Copie refusée ici · utiliser Exporter CSV'); }); }
  catch (e) { toast('Copie indisponible ici · utiliser Exporter CSV'); }
});
function readFile(f) {
  if (!f) return; if (f.size > 2e6) { MYUI.imp = { ok: false, err: 'Fichier trop lourd (2 Mo au plus)' }; renderImp(); return; }
  var done = function (txt) { var r = MY.parseImport(txt, KNOWN); r.file = f.name; MYUI.imp = r; MYUI.repArm = 0; renderImp(); var b = $('my-prev').querySelector('button'); if (b) b.focus(); };
  if (f.text) f.text().then(done, function () { MYUI.imp = { ok: false, err: 'Lecture impossible' }; renderImp(); });
  else { var fr = new FileReader(); fr.onload = function () { done(fr.result); }; fr.readAsText(f); }
}
function renderImp() {
  var r = MYUI.imp, el = $('my-prev'); if (!r) { el.innerHTML = ''; return; }
  if (!r.ok) { el.innerHTML = '<div class="callout risk"><div class="ct">Import impossible</div><div class="prose"><p>' + esc(r.err) + '</p></div><button type="button" class="btn sm ghost" data-imp="cancel">Fermer</button></div>'; return; }
  var s = r.stats;
  el.innerHTML = '<div class="callout"><div class="ct">Aperçu · ' + esc(r.file || 'fichier') + '</div><ul class="whys">' + (s.pfs.length ? s.pfs.map(function (p) { return '<li>' + esc(p[0]) + ' · ' + p[1] + ' niche' + (p[1] > 1 ? 's' : '') + '</li>'; }).join('') : '<li>Aucun portefeuille</li>') + '<li>' + s.ov + ' niche' + (s.ov > 1 ? 's' : '') + ' requalifiée' + (s.ov > 1 ? 's' : '') + '</li>' + (s.unknown ? '<li style="color:var(--wait)">' + s.unknown + ' identifiant' + (s.unknown > 1 ? 's' : '') + ' inconnu' + (s.unknown > 1 ? 's' : '') + ', ignoré' + (s.unknown > 1 ? 's' : '') + '</li>' : '') + '</ul>' +
    '<p class="note">Fusionner : ajoute les portefeuilles et les niches, les valeurs importées priment, les étiquettes s’additionnent. Remplacer : efface l’état actuel.</p><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px"><button type="button" class="btn primary sm" data-imp="merge">Fusionner</button><button type="button" class="btn sm' + (MYUI.repArm ? ' danger' : '') + '" data-imp="replace">' + (MYUI.repArm ? 'Confirmer le remplacement' : 'Remplacer') + '</button><button type="button" class="btn sm ghost" data-imp="cancel">Annuler</button></div></div>';
}
$('my-prev').addEventListener('click', function (e) {
  var b = e.target.closest('[data-imp]'); if (!b) return; var a = b.getAttribute('data-imp'), r = MYUI.imp;
  if (a === 'cancel') { MYUI.imp = null; renderImp(); return; }
  if (a === 'replace' && !MYUI.repArm) { MYUI.repArm = setTimeout(function () { MYUI.repArm = 0; renderImp(); }, 4000); renderImp(); return; }
  clearTimeout(MYUI.repArm); MYUI.repArm = 0;
  ST = a === 'merge' ? MY.merge(ST, r.state) : MY.replace(ST, r.state);
  MYUI.imp = null; paintMode(); afterSel(); refreshViews(); toast(a === 'merge' ? 'Import fusionné' : 'État remplacé par l’import');
});
$('my-file-b').addEventListener('click', function () { $('my-file').click(); });
$('my-file').addEventListener('change', function (e) { readFile(e.target.files[0]); e.target.value = ''; });
(function () {
  var z = $('my-drop');
  ['dragenter', 'dragover'].forEach(function (t) { z.addEventListener(t, function (e) { e.preventDefault(); z.classList.add('on'); }); });
  ['dragleave', 'drop'].forEach(function (t) { z.addEventListener(t, function (e) { e.preventDefault(); z.classList.remove('on'); }); });
  z.addEventListener('drop', function (e) { var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]; readFile(f); });
})();

/* ───── persistance : capacité db de claude.ai, sinon localStorage ───── */
function loadLocal() { try { var s = window.localStorage.getItem(MY.KEY); return s ? JSON.parse(s) : null; } catch (e) { return null; } }
function saveLocal(str) { try { window.localStorage.setItem(MY.KEY, str); return true; } catch (e) { return false; } }
function save() { clearTimeout(SYNC.timer); SYNC.timer = setTimeout(flush, 800); if (SYNC.mode === 'connecting') SYNC.early = true; }
function flush() {
  SYNC.timer = 0;
  var doc = MY.compact(ST), str = JSON.stringify(doc), okL = saveLocal(str);
  if (SYNC.mode !== 'db') { setSync(okL ? 'wait' : 'no', okL ? 'Enregistré sur cet appareil' : 'Non enregistré', okL ? hhmm() : 'stockage indisponible'); return; }
  if (str === SYNC.last) return;
  if (SYNC.writing) { SYNC.pending = true; return; }
  SYNC.writing = true; setSync('idle', 'Enregistrement', '…');
  doc.at = Date.now();
  SYNC.ref.set(doc).then(function () { SYNC.last = str; setSync('int', 'Enregistré', hhmm()); }, function (err) {
    var c = err && err.code;
    if (c === 'revoked' || c === 'not_granted' || c === 'capability_disabled' || c === 'capability_removed' || c === 'invalid_argument' || c === 'quota_exceeded') { SYNC.mode = 'local'; if (SYNC.unsub) { try { SYNC.unsub(); } catch (e) {} } }
    setSync('wait', 'Enregistré sur cet appareil', 'compte indisponible');
  }).then(function () { SYNC.writing = false; if (SYNC.pending) { SYNC.pending = false; flush(); } });
}
function applyState(next) { ST = next; paintMode(); curSet(); paintPf(); refreshViews(); }
function hostProbe(i) {
  if (window.claude && typeof window.claude.use === 'function') { connectHost(); return; }
  if (i < 12) setTimeout(function () { hostProbe(i + 1); }, 250);
}
function connectHost() {
  SYNC.mode = 'connecting'; setSync('idle', 'Connexion au compte', '…');
  var to = setTimeout(function () { to = 0; SYNC.mode = 'local'; setSync('wait', 'Enregistré sur cet appareil', 'compte injoignable'); if (SYNC.early) flush(); }, 10000);
  var fail = function (msg) { if (!to) return; clearTimeout(to); to = 0; SYNC.mode = 'local'; setSync('wait', 'Enregistré sur cet appareil', msg); if (SYNC.early) flush(); };
  var cl = window.claude;
  Promise.all([cl.use('db'), cl.use('user')]).then(function (r) {
    var db = r[0], user = r[1];
    if (!db || !user) { fail('hors compte'); return null; }
    return user.id().then(function (id) {
      if (!id) { fail('hors compte'); return null; }
      SYNC.ref = db.collection('data/users/' + id).doc('portefeuilles');
      return SYNC.ref.get();
    });
  }).then(function (snap) {
    if (!snap || !to) return;
    clearTimeout(to); to = 0;
    var remote = snap.exists ? MY.normalize(snap.data(), KNOWN) : null;
    SYNC.mode = 'db';
    if (remote) {
      SYNC.last = MY.key(remote);
      /* le compte fait foi ; un geste fait avant son arrivée est fusionné puis écrit */
      if (SYNC.early) { applyState(MY.merge(remote, ST)); flush(); } else applyState(remote);
      setSync('int', 'Synchronisé', hhmm());
    } else if (!MY.isEmpty(ST)) { flush(); }
    else setSync('int', 'Compte relié', hhmm());
    SYNC.early = false;
    /* un seul abonnement, pour les changements venus d'un autre appareil */
    SYNC.unsub = SYNC.ref.onSnapshot(function (s) {
      if (!s || !s.exists || (s.metadata && s.metadata.hasPendingWrites)) return;
      if (SYNC.writing || SYNC.timer) return;
      var st = MY.normalize(s.data(), KNOWN), k = MY.key(st);
      if (k === SYNC.last || k === MY.key(ST)) { SYNC.last = k; return; }
      SYNC.last = k; applyState(st); setSync('int', 'Synchronisé', hhmm());
    }, function () { /* abonnement terminé : l'état local reste valable */ });
  }).catch(function () { fail('compte indisponible'); });
}
function pfInit() {
  var raw = loadLocal();
  if (raw) ST = MY.normalize(raw, KNOWN);
  curSet(); paintMode();
  setSync('wait', raw ? 'Chargé' : 'Rien à enregistrer', 'sur cet appareil');
  var c = MY.cur(ST).ids.length; $('pf-jump-n').textContent = c;
  hostProbe(0);
}
