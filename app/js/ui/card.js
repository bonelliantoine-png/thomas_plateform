/* A4 · Carte image partageable : le bilan dessiné sur un Canvas (format carré ou story), au style Chrome néon,
   téléchargeable en PNG et partageable par la Web Share API quand le navigateur sait partager des fichiers. */
(function (W) {
  'use strict';
  var C = W.Cordes, U = C.util, ui = C.ui, E = ui.e;
  var T = { bg: '#07080b', grid: '#161a22', panel: '#0e1015', line: '#1d2029', line2: '#2b2f3b', fg: '#f2f4f8', fg2: '#aeb4c2', fg3: '#7c8394', accent: '#5ee7ff', ink: '#03141a', int: '#4dffb5' };
  var F = { display: '"Marcellus", "Cormorant Garamond", Georgia, serif', body: '"Spectral", Georgia, serif', mono: '"IBM Plex Mono", ui-monospace, Menlo, monospace' };
  ui.CARD_FORMATS = { carre: [1080, 1080, 'Carré · 1080 × 1080'], story: [1080, 1920, 'Story · 1080 × 1920'] };

  ui.cardData = function (st) {
    var skills = Object.keys(st.skills || {}).filter(function (id) { return st.skills[id] && st.skills[id].level > 0 && C.data.sById[id]; })
      .sort(function (a, b) { return (st.skills[b].level * 2 + U.num(st.skills[b].love, 1)) - (st.skills[a].level * 2 + U.num(st.skills[a].love, 1)); })
      .slice(0, 3).map(function (id) { return { s: C.data.sById[id], level: st.skills[id].level }; });
    var desires = C.yesDesires(st).slice(0, 3).map(function (id) { return { s: C.data.sById[id] }; });
    var arch = st.style && st.style.answers && Object.keys(st.style.answers).length ? C.computeArchetype(st.style.answers) : null;
    var archName = arch && arch.answered ? arch.archetype.name : null;
    if (!archName && st.mode !== 'learn' && st.offer && st.offer.entrepreneur && Object.keys(st.offer.entrepreneur).length) {
      var en = C.computeEntrepreneur(st.offer.entrepreneur); if (en && en.answered) archName = en.profile.name;
    }
    var n = Object.keys(st.skills || {}).filter(function (id) { return st.skills[id] && st.skills[id].level > 0; }).length;
    return { name: (st.context && st.context.firstName) || '', city: (st.context && st.context.city) || '', arch: archName, skills: skills, desires: desires, prof: C.universeProfile(st), nSkills: n, nDesires: C.yesDesires(st).length };
  };

  function rr(x, c, y, w, h, r) { x.beginPath(); x.moveTo(c + r, y); x.arcTo(c + w, y, c + w, y + h, r); x.arcTo(c + w, y + h, c, y + h, r); x.arcTo(c, y + h, c, y, r); x.arcTo(c, y, c + w, y, r); x.closePath(); }
  function fit(x, text, max) { text = String(text); if (x.measureText(text).width <= max) return text; while (text.length > 1 && x.measureText(text + '…').width > max) text = text.slice(0, -1); return text.replace(/\s+$/, '') + '…'; }
  function spaced(x, text, px, y, sp) { var cx = px; for (var i = 0; i < text.length; i++) { x.fillText(text[i], cx, y); cx += x.measureText(text[i]).width + sp; } return cx; }

  ui.drawCard = function (canvas, st, fmt) {
    var dims = ui.CARD_FORMATS[fmt] || ui.CARD_FORMATS.carre, Wd = dims[0], H = dims[1], story = fmt === 'story';
    canvas.width = Wd; canvas.height = H;
    var x = canvas.getContext('2d'), d = ui.cardData(st), P = 72;
    x.fillStyle = T.bg; x.fillRect(0, 0, Wd, H);
    x.fillStyle = T.grid; for (var gy = 18; gy < H; gy += 36) for (var gx = 18; gx < Wd; gx += 36) { x.beginPath(); x.arc(gx, gy, 1.6, 0, 7); x.fill(); }
    // en-tête : logo 4 carrés et marque
    var ly = story ? 120 : 76;
    x.fillStyle = T.accent; rr(x, P, ly, 26, 26, 7); x.fill();
    x.fillStyle = T.int; rr(x, P + 32, ly, 26, 26, 7); x.fill();
    x.strokeStyle = T.line2; x.lineWidth = 2; rr(x, P + 1, ly + 33, 24, 24, 6); x.stroke(); rr(x, P + 33, ly + 33, 24, 24, 6); x.stroke();
    x.fillStyle = T.fg; x.font = '400 40px ' + F.display; x.textBaseline = 'alphabetic'; x.fillText('Cordes', P + 76, ly + 44);
    x.fillStyle = T.accent; x.font = '500 20px ' + F.mono; spaced(x, 'BILAN DE COMPÉTENCES DE VIE', P, ly + (story ? 140 : 118), 2.2);
    // titre et archétype
    var ty = ly + (story ? 240 : 198);
    x.fillStyle = T.fg; x.font = '400 ' + (story ? 88 : 70) + 'px ' + F.display;
    x.fillText(fit(x, d.name ? 'Le bilan de ' + d.name : 'Mon bilan', Wd - 2 * P), P, ty);
    var py = ty + (story ? 46 : 36), px = P;
    function pill(text, col) {
      x.font = '500 22px ' + F.mono; var w = x.measureText(text).width + 52;
      x.fillStyle = col === T.int ? 'rgba(77,255,181,.13)' : 'rgba(94,231,255,.10)'; rr(x, px, py, w, 42, 21); x.fill();
      x.strokeStyle = col === T.int ? 'rgba(77,255,181,.42)' : T.line2; x.lineWidth = 2; rr(x, px, py, w, 42, 21); x.stroke();
      x.fillStyle = col; x.beginPath(); x.arc(px + 22, py + 21, 6, 0, 7); x.fill();
      x.fillStyle = T.fg; x.fillText(text, px + 38, py + 29); px += w + 12;
    }
    if (d.arch) pill(d.arch, T.int);
    pill(d.nSkills + ' compétence' + (d.nSkills > 1 ? 's' : '') + ' · ' + d.nDesires + ' envie' + (d.nDesires > 1 ? 's' : ''), T.accent);
    // radar maîtrise × envies
    var rcx = story ? Wd / 2 : P + 215, rcy = story ? py + 460 : py + 330, R = story ? 300 : 200;
    var ids = Object.keys(d.prof), n = ids.length || 1;
    var pt = function (i, r) { var a = -Math.PI / 2 + i * 2 * Math.PI / n; return [rcx + Math.cos(a) * R * r, rcy + Math.sin(a) * R * r]; };
    x.strokeStyle = T.line; x.lineWidth = 1.5;
    [0.33, 0.66, 1].forEach(function (r) { x.beginPath(); ids.forEach(function (_, i) { var p = pt(i, r); if (i) x.lineTo(p[0], p[1]); else x.moveTo(p[0], p[1]); }); x.closePath(); x.stroke(); });
    ids.forEach(function (_, i) { var p = pt(i, 1); x.beginPath(); x.moveTo(rcx, rcy); x.lineTo(p[0], p[1]); x.stroke(); });
    function poly(key, fill, stroke, dash) {
      x.beginPath(); ids.forEach(function (id, i) { var p = pt(i, Math.max(0.04, d.prof[id][key])); if (i) x.lineTo(p[0], p[1]); else x.moveTo(p[0], p[1]); }); x.closePath();
      x.fillStyle = fill; x.fill(); x.setLineDash(dash || []); x.strokeStyle = stroke; x.lineWidth = 3; x.stroke(); x.setLineDash([]);
    }
    poly('d', 'rgba(77,255,181,.10)', T.int, [10, 8]);
    poly('m', 'rgba(94,231,255,.18)', T.accent);
    x.font = '500 ' + (story ? 21 : 17) + 'px ' + F.mono; x.textAlign = 'center';
    ids.forEach(function (id, i) { var v = d.prof[id]; if (!(v.m > 0 || v.d > 0)) return; var p = pt(i, 1.16); x.fillStyle = T.fg2; x.fillText(v.u.short, p[0], p[1] + 6); });
    x.textAlign = 'left';
    // listes
    var lx = story ? P : P + 450, lw = Wd - lx - P, y = story ? rcy + R + 110 : py + 104;
    // nom sur deux lignes au plus, coupé aux espaces
    function lines(text, max) {
      if (x.measureText(text).width <= max) return [text];
      var w = text.split(' '), a = '';
      while (w.length && x.measureText((a ? a + ' ' : '') + w[0]).width <= max) a += (a ? ' ' : '') + w.shift();
      return a ? [a, fit(x, w.join(' '), max)] : [fit(x, text, max)];
    }
    function list(title, items, desire) {
      x.fillStyle = T.fg3; x.font = '500 19px ' + F.mono; spaced(x, title, lx, y, 2); y += 22;
      x.strokeStyle = T.line; x.lineWidth = 2; x.beginPath(); x.moveTo(lx, y); x.lineTo(lx + lw, y); x.stroke(); y += (story ? 62 : 46);
      if (!items.length) { x.fillStyle = T.fg3; x.font = '300 28px ' + F.body; x.fillText('à compléter', lx, y); y += 54; }
      items.forEach(function (it) {
        if (desire) { x.strokeStyle = T.int; x.lineWidth = 3; x.beginPath(); x.arc(lx + 10, y - 10, 9, 0, 7); x.stroke(); }
        else for (var k = 0; k < C.LEVEL_MAX; k++) { x.fillStyle = k < it.level ? T.accent : T.line2; rr(x, lx + k * 12.5, y - 17, 9.5, 9.5, 2.2); x.fill(); }
        x.fillStyle = T.fg; x.font = '400 ' + (story ? 40 : 31) + 'px ' + F.display;
        var ls = lines(it.s.short || it.s.name, lw - (desire ? 40 : 78));
        ls.forEach(function (t, k) { x.fillText(t, lx + (desire ? 36 : 74), y + k * (story ? 46 : 36)); });
        y += (story ? 68 : 52) + (ls.length - 1) * (story ? 46 : 36);
      });
      y += story ? 40 : 16;
    }
    list('CE QUE JE SAIS FAIRE', d.skills, false);
    list('CE QUE JE VEUX APPRENDRE', d.desires, true);
    // pied
    var fy = H - (story ? 120 : 64);
    x.strokeStyle = T.line; x.lineWidth = 2; x.beginPath(); x.moveTo(P, fy - 44); x.lineTo(Wd - P, fy - 44); x.stroke();
    x.fillStyle = T.fg2; x.font = '300 ' + (story ? 34 : 28) + 'px ' + F.body; x.fillText('Et vous, que savez-vous faire ?', P, fy);
    x.fillStyle = T.fg3; x.font = '400 20px ' + F.mono; x.textAlign = 'right';
    var dd = new Date(); x.fillText(U.dateShort(dd) + ' ' + dd.getFullYear() + (d.city ? ' · ' + d.city : ''), Wd - P, fy); x.textAlign = 'left';
    return canvas;
  };
  /* ---------- fonds et en-tête communs aux cartes ---------- */
  function frame(x, Wd, H, P, ly, label) {
    x.fillStyle = T.bg; x.fillRect(0, 0, Wd, H);
    x.fillStyle = T.grid; for (var gy = 18; gy < H; gy += 36) for (var gx = 18; gx < Wd; gx += 36) { x.beginPath(); x.arc(gx, gy, 1.6, 0, 7); x.fill(); }
    x.fillStyle = T.accent; rr(x, P, ly, 26, 26, 7); x.fill();
    x.fillStyle = T.int; rr(x, P + 32, ly, 26, 26, 7); x.fill();
    x.strokeStyle = T.line2; x.lineWidth = 2; rr(x, P + 1, ly + 33, 24, 24, 6); x.stroke(); rr(x, P + 33, ly + 33, 24, 24, 6); x.stroke();
    x.fillStyle = T.fg; x.font = '400 40px ' + F.display; x.textBaseline = 'alphabetic'; x.fillText('Cordes', P + 76, ly + 44);
    x.fillStyle = T.accent; x.font = '500 20px ' + F.mono; spaced(x, label, P, ly + 118, 2.2);
  }
  // texte sur plusieurs lignes (coupé aux espaces), renvoie la hauteur utilisée
  function wrap(x, text, px, y, max, lh, maxLines) {
    var words = String(text || '').split(/\s+/), line = '', n = 0;
    for (var i = 0; i < words.length; i++) {
      var t = line ? line + ' ' + words[i] : words[i];
      if (x.measureText(t).width > max && line) { x.fillText(line, px, y + n * lh); n++; line = words[i]; if (n >= (maxLines || 9) - 1) { line = fit(x, words.slice(i).join(' '), max); break; } }
      else line = t;
    }
    if (line) { x.fillText(line, px, y + n * lh); n++; }
    return n * lh;
  }
  function foot(x, Wd, H, P, text) {
    var fy = H - 64;
    x.strokeStyle = T.line; x.lineWidth = 2; x.beginPath(); x.moveTo(P, fy - 44); x.lineTo(Wd - P, fy - 44); x.stroke();
    x.fillStyle = T.fg2; x.font = '300 28px ' + F.body; x.fillText(text, P, fy);
    if (C.PUBLIC_URL) { x.fillStyle = T.fg3; x.font = '400 20px ' + F.mono; x.textAlign = 'right'; x.fillText(C.PUBLIC_URL, Wd - P, fy); x.textAlign = 'left'; }
  }

  /* ---------- carte « Ta corde cachée » (story ou carré) ---------- */
  ui.drawQuizCard = function (canvas, d, fmt) {
    var dims = ui.CARD_FORMATS[fmt] || ui.CARD_FORMATS.story, Wd = dims[0], H = dims[1], story = fmt !== 'carre';
    canvas.width = Wd; canvas.height = H;
    var x = canvas.getContext('2d'), P = 72, ly = story ? 120 : 76, r = d.r;
    frame(x, Wd, H, P, ly, 'TA CORDE CACHÉE');
    var y = ly + (story ? 300 : 230);
    x.fillStyle = T.fg3; x.font = '500 24px ' + F.mono; x.fillText(d.defi ? 'DÉFI RÉUSSI' : 'MA CORDE', P, y - (story ? 110 : 84));
    x.fillStyle = T.fg; x.font = '400 ' + (story ? 108 : 84) + 'px ' + F.display;
    x.fillText(fit(x, r.profile.name, Wd - 2 * P), P, y);
    x.fillStyle = T.fg2; x.font = '300 ' + (story ? 38 : 31) + 'px ' + F.body;
    y += (story ? 70 : 56) + wrap(x, d.defi ? d.defi.titre + '. ' + d.defi.reussi : r.profile.portrait, P, y + (story ? 70 : 56), Wd - 2 * P, story ? 50 : 40, 3);
    y += story ? 90 : 60;
    x.fillStyle = T.fg3; x.font = '500 19px ' + F.mono; spaced(x, 'TROIS SAVOIR-FAIRE QUI ME RESSEMBLENT', P, y, 2); y += 22;
    x.strokeStyle = T.line; x.lineWidth = 2; x.beginPath(); x.moveTo(P, y); x.lineTo(Wd - P, y); x.stroke(); y += story ? 74 : 54;
    d.picks.slice(0, 3).forEach(function (p, i) {
      x.fillStyle = i === 2 ? T.int : T.accent; rr(x, P, y - 24, 18, 18, 4); x.fill();
      x.fillStyle = T.fg3; x.font = '500 ' + (story ? 22 : 18) + 'px ' + F.mono; x.fillText(p.label.toUpperCase(), P + 34, y - 8);
      x.fillStyle = T.fg; x.font = '500 ' + (story ? 44 : 32) + 'px ' + F.mono; x.fillText(fit(x, p.s.short || p.s.name, Wd - 2 * P - 34), P + 34, y + (story ? 46 : 32));
      if (story) { x.fillStyle = T.fg2; x.font = '300 32px ' + F.body; wrap(x, 'En 1 h : ' + U.lc(p.oneHour || p.s.levels[0]), P + 34, y + 100, Wd - 2 * P - 34, 42, 2); }
      y += story ? 250 : 102;
    });
    foot(x, Wd, H, P, 'Ta corde cachée · fais le test');
    return canvas;
  };

  /* ---------- bon cadeau (1080 × 1350) ---------- */
  ui.drawGiftCard = function (canvas, d) {
    var Wd = 1080, H = 1350, P = 80; canvas.width = Wd; canvas.height = H;
    var x = canvas.getContext('2d');
    frame(x, Wd, H, P, 84, 'BON CADEAU · IDÉE À VIVRE');
    x.strokeStyle = T.accent; x.lineWidth = 3; x.setLineDash([14, 10]); rr(x, P - 20, 270, Wd - 2 * P + 40, 820, 18); x.stroke(); x.setLineDash([]);
    var y = 380, Q = P + 20, MW = Wd - 2 * Q;
    if (d.to) { x.fillStyle = T.fg3; x.font = '500 26px ' + F.mono; x.fillText(fit(x, 'POUR ' + d.to.toUpperCase() + (d.from ? '  ·  DE ' + d.from.toUpperCase() : ''), MW), Q, y); y += 80; }
    x.fillStyle = T.fg; x.font = '400 78px ' + F.display; y += wrap(x, d.title, Q, y + 14, MW, 88, 3) + 50;
    x.font = '500 36px ' + F.mono;
    d.items.slice(0, 5).forEach(function (s) { x.fillStyle = T.int; x.beginPath(); x.arc(Q + 10, y - 12, 8, 0, 7); x.fill(); x.fillStyle = T.fg; x.fillText(fit(x, s.short || s.name, MW - 44), Q + 36, y); y += 62; });
    y += 30; x.fillStyle = T.fg2; x.font = '300 38px ' + F.body; y += wrap(x, d.end, Q, y, MW, 50, 2) + 30;
    if (d.word) { x.fillStyle = T.fg; x.font = 'italic 300 40px ' + F.body; wrap(x, '« ' + d.word + ' »', Q, Math.min(y + 20, 960), MW, 52, 3); }
    foot(x, Wd, H, P, 'Idée trouvée sur Cordes');
    return canvas;
  };

  // attendre les polices de la page (limité à 1,5 s) pour que le dessin soit fidèle
  ui.cardFontsReady = function () {
    if (!document.fonts || !document.fonts.load) return Promise.resolve();
    var p = Promise.all(['400 40px "Marcellus"', '300 28px "Spectral"', '500 20px "IBM Plex Mono"'].map(function (f) { return document.fonts.load(f).catch(function () { return null; }); }));
    return Promise.race([p, new Promise(function (r) { setTimeout(r, 1500); })]);
  };
  ui.cardBlob = function (st, fmt) {
    return ui.cardFontsReady().then(function () {
      var cv = ui.drawCard(document.createElement('canvas'), st, fmt);
      return new Promise(function (res, rej) { cv.toBlob(function (b) { if (b) res({ blob: b, url: cv.toDataURL('image/png') }); else rej(new Error('Image impossible à générer')); }, 'image/png'); });
    });
  };

  ui._cardFmt = 'carre';
  ui.actions.card = function () {
    if (!ui.st.mode) { ui.toast('Faire le bilan d’abord', 'wait'); return; }
    var fmt = ui._cardFmt;
    ui.drawer('Carte à partager', '<p class="sp">Une image de votre bilan, prête pour une story, un message ou un statut. Le lien de partage reste le moyen de comparer vos bilans.</p>' +
      '<div style="margin-top:14px">' + ui.seg('_', [['carre', 'Carré'], ['story', 'Story']], fmt, 'Format').replace(/data-act="set" data-bind="_"/g, 'data-act="cardFmt"') + '</div>' +
      '<div class="cardprev" id="card-prev"><div class="status"><span class="spin"></span>Dessin de la carte…</div></div>' +
      '<div class="row" style="margin-top:12px"><button class="btn primary" data-act="cardDl" disabled>' + ui.icon('dl') + ' Télécharger</button>' +
      (navigator.share ? '<button class="btn" data-act="cardShare" disabled>' + ui.icon('share') + ' Partager</button>' : '') + '<span class="faint">' + E(ui.CARD_FORMATS[fmt][2]) + ' · PNG</span></div>' +
      '<p class="faint" style="margin-top:12px;font-size:11.5px">L’image est dessinée dans votre navigateur. Elle montre votre prénom, votre ville et vos trois premières compétences et envies.</p>');
    ui.cardBlob(ui.st, fmt).then(function (r) {
      ui._cardOut = { blob: r.blob, fmt: fmt };
      var pv = ui.$('#card-prev'); if (!pv) return;
      pv.innerHTML = '<img src="' + r.url + '" alt="Aperçu de la carte de votre bilan au format ' + (fmt === 'story' ? 'story' : 'carré') + '" class="' + fmt + '">';
      ui.$$('#drawer [data-act="cardDl"], #drawer [data-act="cardShare"]').forEach(function (b) { b.disabled = false; });
    }).catch(function (e) { var pv = ui.$('#card-prev'); if (pv) pv.innerHTML = '<div class="note no"><span class="lbl">Image indisponible</span><span class="sp">' + E(e.message) + '</span></div>'; });
  };
  ui.actions.cardFmt = function (el) { ui._cardFmt = el.getAttribute('data-val'); ui.actions.card(); };
  function cardName() { return C.fileSlug(ui.st) + '-carte-' + (ui._cardOut ? ui._cardOut.fmt : 'carre') + '.png'; }
  ui.actions.cardDl = function () {
    if (!ui._cardOut) return;
    var url = URL.createObjectURL(ui._cardOut.blob), a = document.createElement('a');
    a.href = url; a.download = cardName(); document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 1500);
    ui.toast('Image téléchargée');
  };
  ui.actions.cardShare = function () {
    if (!ui._cardOut) return;
    var file = new File([ui._cardOut.blob], cardName(), { type: 'image/png' });
    var data = { files: [file], title: 'Mon bilan Cordes', text: 'Mon bilan de compétences de vie. Et vous, que savez-vous faire ?' };
    if (navigator.canShare && !navigator.canShare(data)) { ui.toast('Partage d’image non pris en charge : télécharger l’image', 'wait'); return; }
    navigator.share(data).then(function () { C.track('use', { k: 'card-share' }); }).catch(function (e) { if (e && e.name !== 'AbortError') ui.toast('Partage interrompu', 'wait'); });
  };
})(window);
