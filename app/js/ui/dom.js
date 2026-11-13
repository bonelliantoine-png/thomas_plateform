/* Utilitaires d'interface : sélection, échappement, toast, panneau latéral, copie, icônes. */
(function (W) {
  'use strict';
  var C = W.Cordes, U = C.util;
  var ui = C.ui = C.ui || {};
  ui.$ = function (s, r) { return (r || document).querySelector(s); };
  ui.$$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var E = ui.e = U.esc;

  ui.icon = function (name) {
    var p = {
      search: '<circle cx="7" cy="7" r="4.5"/><path d="M10.5 10.5 14 14"/>',
      arrowR: '<path d="M3 8h10M9 4l4 4-4 4"/>', arrowL: '<path d="M13 8H3M7 4 3 8l4 4"/>', arrowD: '<path d="M8 3v10M4 9l4 4 4-4"/>',
      check: '<path d="m3 8.5 3.2 3L13 4.5"/>', x: '<path d="m4 4 8 8M12 4l-8 8"/>', undo: '<path d="M5 6H10a3.5 3.5 0 0 1 0 7H6"/><path d="M7 3 4 6l3 3"/>',
      ext: '<path d="M9 3h4v4M13 3 7.5 8.5M12 9.5V13H3V4h3.5"/>', copy: '<rect x="5" y="5" width="8" height="8" rx="1.5"/><path d="M3 10.5V3h7.5"/>',
      menu: '<path d="M2.5 4.5h11M2.5 8h11M2.5 11.5h11"/>', pin: '<path d="M8 14s4.5-4.2 4.5-7.5a4.5 4.5 0 0 0-9 0C3.5 9.8 8 14 8 14z"/><circle cx="8" cy="6.5" r="1.6"/>',
      dl: '<path d="M8 2.5v8M4.5 7 8 10.5 11.5 7M3 13.5h10"/>', share: '<circle cx="4" cy="8" r="1.8"/><circle cx="12" cy="4" r="1.8"/><circle cx="12" cy="12" r="1.8"/><path d="m5.6 7.1 4.8-2.3M5.6 8.9l4.8 2.3"/>',
      print: '<path d="M4.5 6V2.5h7V6M4.5 11.5h-2V6h11v5.5h-2"/><rect x="4.5" y="9.5" width="7" height="4"/>', cal: '<rect x="2.5" y="3.5" width="11" height="10" rx="1.5"/><path d="M2.5 6.5h11M5.5 2v3M10.5 2v3"/>',
      spark: '<path d="M8 2v3M8 11v3M2 8h3M11 8h3M4 4l2 2M10 10l2 2M12 4l-2 2M6 10l-2 2"/>', up: '<path d="M8 13V3M4 7l4-4 4 4"/>', down: '<path d="M8 3v10M4 9l4 4 4-4"/>',
      plus: '<path d="M8 3v10M3 8h10"/>', img: '<rect x="2.5" y="3" width="11" height="10" rx="1.5"/><circle cx="6" cy="6.5" r="1.2"/><path d="m3 12 3.5-3.5 2.5 2.5 2-2 2.5 2.5"/>', info: '<circle cx="8" cy="8" r="5.5"/><path d="M8 7.5v3.5M8 5.2v.1"/>'
    }[name] || '';
    return '<svg class="ic" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' + p + '</svg>';
  };
  ui.logo = '<svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true"><rect x="1" y="1" width="8" height="8" rx="2.2" style="fill:var(--accent)"/><rect x="11" y="1" width="8" height="8" rx="2.2" style="fill:var(--int)"/><rect x="1.5" y="11.5" width="7" height="7" rx="2" style="fill:none;stroke:var(--line-2)"/><rect x="11.5" y="11.5" width="7" height="7" rx="2" style="fill:none;stroke:var(--line-2)"/></svg>';

  ui.dots = function (n, max, label) {
    max = max || C.LEVEL_MAX || 5; var h = '';
    for (var i = 1; i <= max; i++) h += '<i class="' + (i <= n ? 'on' : '') + '"></i>';
    return '<span class="dots" role="img" aria-label="' + E(label || (n + ' sur ' + max)) + '">' + h + '</span>';
  };
  // légende de l'échelle 1 à 5 : pastilles, libellé et palier animé
  ui.levelLegend = function () {
    return '<ol class="lvlegend" aria-label="Échelle de maîtrise">' + C.LEVELS.slice(1).map(function (l, i) {
      var k = i + 1, t = C.topPalier(k);
      return '<li class="l' + k + '"><span class="n">' + k + '</span>' + ui.dots(k, C.LEVEL_MAX, 'niveau ' + k) + '<span class="t">' + E(l) + '</span><span class="a">' + (t ? 'anime le niveau ' + t + (k >= C.LEVEL_MAX ? ', forme les hôtes' : '') : 'n’anime pas') + '</span></li>';
    }).join('') + '</ol>';
  };
  // chemin par paliers : un atelier par niveau, son objectif, l'hôte qui l'anime (et heures et coût si le plan est fourni)
  ui.palierPath = function (s, cur, target, steps) {
    steps = steps || [];
    var rows = [];
    for (var k = cur + 1; k <= target; k++) {
      var x = steps.filter(function (y) { return y.k === k; })[0];
      rows.push('<li><span class="k">' + k + '</span><div><div class="pt">' + (k === 1 ? 'Atelier découverte' : 'Atelier de niveau ' + k) + ' · ' + E(C.LEVELS[k]) + '</div><div class="pm">' + E(C.milestone(s, k)) + '</div>' +
        '<div class="pw">Qui peut vous faire progresser : un hôte de niveau ' + C.hostLevel(k) + (C.TEACH_RULE === 'below' ? ' ou plus' : '') + ' (' + E(C.LEVELS[C.hostLevel(k)].toLowerCase()) + ')' + (x ? ' · ≈ ' + x.hours + ' h · ' + U.eur(x.cost) : '') + '</div></div></li>');
    }
    return rows.length ? '<ol class="palpath" aria-label="Paliers à franchir">' + rows.join('') + '</ol>' : '';
  };
  ui.meter = function (v, max, cls) { return '<span class="meter ' + (cls || '') + '" role="img" aria-label="' + Math.round(v) + ' sur ' + max + '"><b style="width:' + Math.round(U.clamp(v / max, 0, 1) * 100) + '%"></b></span>'; };
  ui.pill = function (text, kind, dot) { return '<span class="pill ' + (kind || '') + '">' + (dot === false ? '' : '<i></i>') + E(text) + '</span>'; };
  ui.uniTag = function (uid) { var u = C.universe(uid); return '<span class="unitag"><span class="sw" style="background:' + C.hue(uid) + '"></span>' + E(u.short) + '</span>'; };
  ui.verify = function (p) { return p && p.verify ? '<span class="pill wait sm" title="' + E(p.note || 'Chiffre ou commission non confirmés à la source') + '"><i></i>à vérifier</span>' : ''; };
  ui.extLink = function (url, label) { return url ? '<a href="' + E(url) + '" target="_blank" rel="noopener noreferrer">' + E(label || url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')) + ' ' + ui.icon('ext') + '</a>' : ''; };

  /* ---------- toast ---------- */
  var toastT;
  ui.toast = function (msg, kind) {
    var t = ui.$('#toast');
    if (!t) return;
    t.innerHTML = '<i class="' + (kind || 'int') + '"></i>' + E(msg);
    t.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(function () { t.classList.remove('show'); }, 2600);
  };

  /* ---------- panneau latéral ---------- */
  var lastFocus = null, closeT = null, openRaf = null;
  ui.drawer = function (title, html, opts) {
    opts = opts || {};
    var d = ui.$('#drawer'), v = ui.$('#veil');
    // une fermeture en cours ne doit pas masquer le panneau que l'on rouvre
    if (closeT) { clearTimeout(closeT); closeT = null; }
    if (d.hidden) lastFocus = document.activeElement;
    d.innerHTML = '<div class="dr-h"><h2 id="dr-title">' + E(title) + '</h2><button class="btn ghost sm" data-act="closeDrawer" aria-label="Fermer">Esc ' + ui.icon('x') + '</button></div><div class="dr-b">' + html + '</div>';
    d.setAttribute('aria-labelledby', 'dr-title');
    d.hidden = false; v.hidden = false;
    if (openRaf) cancelAnimationFrame(openRaf);
    openRaf = requestAnimationFrame(function () { openRaf = null; if (!d.hidden) { d.classList.add('open'); v.classList.add('open'); } });
    var f = d.querySelector(opts.focus || 'button, a, input, textarea, select'); if (f) f.focus();
    document.body.classList.add('noscroll');
    if (opts.onOpen) opts.onOpen(d);
  };
  ui.closeDrawer = function () {
    var d = ui.$('#drawer'), v = ui.$('#veil');
    if (!d || d.hidden) return false;
    if (openRaf) { cancelAnimationFrame(openRaf); openRaf = null; }
    d.classList.remove('open'); v.classList.remove('open');
    d.hidden = true; v.hidden = true;
    clearTimeout(closeT);
    closeT = setTimeout(function () { closeT = null; if (d.hidden) d.innerHTML = ''; }, 180);
    document.body.classList.remove('noscroll');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
    return true;
  };

  ui.copy = function (text) {
    function fallback() {
      var ta = document.createElement('textarea'); ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      var ok = false; try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      ta.remove(); return ok;
    }
    if (navigator.clipboard && W.isSecureContext) {
      return navigator.clipboard.writeText(text).then(function () { ui.toast('Copié'); return true; }, function () { var ok = fallback(); ui.toast(ok ? 'Copié' : 'Copie impossible : sélectionner le texte', ok ? 'int' : 'no'); return ok; });
    }
    var ok = fallback(); ui.toast(ok ? 'Copié' : 'Copie impossible : sélectionner le texte', ok ? 'int' : 'no');
    return Promise.resolve(ok);
  };

  // bloc texte copiable
  ui.copyBlock = function (label, text, id) {
    id = id || ('cb' + Math.floor(U.hash(label + text) * 1e8));
    ui._copyStore = ui._copyStore || {}; ui._copyStore[id] = text;
    return '<div class="copyblock"><div class="cb-h"><span class="lbl">' + E(label) + '</span><button class="btn ghost sm" data-act="copy" data-id="' + id + '">' + ui.icon('copy') + ' Copier</button></div><div class="cb-t">' + E(text).replace(/\n/g, '<br>') + '</div></div>';
  };

  ui.seg = function (bind, opts, val, label, extra) {
    return '<div class="seg" role="radiogroup" aria-label="' + E(label) + '">' + opts.map(function (o) {
      var on = String(o[0]) === String(val);
      return '<button type="button" role="radio" aria-checked="' + on + '" class="' + (on ? 'on' : '') + '" data-act="set" data-bind="' + bind + '" data-val="' + E(o[0]) + '"' + (extra || '') + '>' + E(o[1]) + '</button>';
    }).join('') + '</div>';
  };
  ui.chips = function (bind, opts, vals, label) {
    vals = U.arr(vals);
    return '<div class="chips" role="group" aria-label="' + E(label) + '">' + opts.map(function (o) {
      var on = vals.indexOf(o[0]) >= 0;
      return '<button type="button" class="chip ' + (on ? 'on' : '') + '" aria-pressed="' + on + '" data-act="toggle" data-bind="' + bind + '" data-val="' + E(o[0]) + '"><i></i>' + E(o[1]) + '</button>';
    }).join('') + '</div>';
  };
})(window);
