/* Graphiques SVG inline (chaînes, sans DOM : réutilisés par le passeport autonome).
   Textes en IBM Plex Mono, couleurs par tokens, jamais la couleur seule (libellés et nombres). */
(function (W) {
  'use strict';
  var C = W.Cordes, U = C.util;
  var E = U.esc;
  var CH = C.charts = {};
  function f(x) { return Math.round(x * 10) / 10; }

  // radar maîtrise × envie par univers
  CH.radarSVG = function (prof, o) {
    o = o || {};
    var S = o.size || 360, pad = 66, R = (S - pad * 2) / 2, cx = S / 2, cy = S / 2;
    var ids = Object.keys(prof), n = ids.length || 1;
    var pt = function (i, r) { var a = -Math.PI / 2 + i * 2 * Math.PI / n; return [cx + Math.cos(a) * R * r, cy + Math.sin(a) * R * r]; };
    var s = '<svg viewBox="0 0 ' + S + ' ' + S + '" width="' + S + '" height="' + S + '" role="img" aria-label="Radar : maîtrise et envies par univers" class="radar">';
    [0.25, 0.5, 0.75, 1].forEach(function (r) {
      s += '<polygon points="' + ids.map(function (_, i) { return pt(i, r).map(f).join(','); }).join(' ') + '" style="fill:none;stroke:var(--line)" />';
    });
    ids.forEach(function (id, i) { var p = pt(i, 1); s += '<line x1="' + cx + '" y1="' + cy + '" x2="' + f(p[0]) + '" y2="' + f(p[1]) + '" style="stroke:var(--line)" />'; });
    var poly = function (key, style) { return '<polygon points="' + ids.map(function (id, i) { return pt(i, Math.max(0.03, prof[id][key])).map(f).join(','); }).join(' ') + '" style="' + style + '" />'; };
    s += poly('d', 'fill:color-mix(in srgb,var(--int) 10%,transparent);stroke:var(--int);stroke-width:1.5;stroke-dasharray:4 3');
    s += poly('m', 'fill:color-mix(in srgb,var(--accent) 16%,transparent);stroke:var(--accent);stroke-width:1.5');
    ids.forEach(function (id, i) {
      var p = pt(i, 1.13), x = prof[id], a = -Math.PI / 2 + i * 2 * Math.PI / n;
      var anchor = Math.abs(Math.cos(a)) < 0.25 ? 'middle' : Math.cos(a) > 0 ? 'start' : 'end';
      var hot = x.m > 0 || x.d > 0;
      s += '<text x="' + f(p[0]) + '" y="' + f(p[1] + 3) + '" text-anchor="' + anchor + '" style="font:' + (hot ? 500 : 400) + ' 9.5px var(--f-mono);fill:' + (hot ? 'var(--fg)' : 'var(--fg-3)') + '">' + E(x.u.short) + '</text>';
      if (x.m > 0) { var q = pt(i, x.m); s += '<circle cx="' + f(q[0]) + '" cy="' + f(q[1]) + '" r="2.6" style="fill:var(--accent)" />'; }
      if (x.d > 0) { var q2 = pt(i, x.d); s += '<circle cx="' + f(q2[0]) + '" cy="' + f(q2[1]) + '" r="2.6" style="fill:var(--bg);stroke:var(--int);stroke-width:1.4" />'; }
    });
    s += '</svg>';
    return s;
  };

  // axes du test (social, physique, création, intellect) : un losange, un ou deux profils superposés
  CH.axesSVG = function (a, b, o) {
    o = o || {};
    var S = o.size || 260, pad = 30, R = (S - 140) / 2, cx = S / 2, cy = S / 2, ax = C.QUIZ_AXES || [['so', 'Social'], ['ph', 'Physique'], ['cr', 'Création'], ['in', 'Intellect']];
    var vals = [a, b].filter(Boolean).reduce(function (m, v) { ax.forEach(function (k) { m = Math.max(m, Math.abs(v[k[0]] || 0)); }); return m; }, 4);
    var pt = function (i, r) { var t = -Math.PI / 2 + i * Math.PI / 2; return [cx + Math.cos(t) * R * r, cy + Math.sin(t) * R * r]; };
    var rad = function (v) { return Math.max(0.06, Math.min(1, ((v || 0) + 1) / (vals + 1))); };
    var lab = ax.map(function (k) { return k[1] + ' ' + (a[k[0]] || 0) + (b ? ' / ' + (b[k[0]] || 0) : ''); }).join(', ');
    var s = '<svg viewBox="0 0 ' + S + ' ' + S + '" width="' + S + '" height="' + S + '" role="img" aria-label="Axes : ' + E(lab) + '" class="radar axes">';
    [0.33, 0.66, 1].forEach(function (r) { s += '<polygon points="' + ax.map(function (_, i) { return pt(i, r).map(f).join(','); }).join(' ') + '" style="fill:none;stroke:var(--line)" />'; });
    ax.forEach(function (_, i) { var p = pt(i, 1); s += '<line x1="' + cx + '" y1="' + cy + '" x2="' + f(p[0]) + '" y2="' + f(p[1]) + '" style="stroke:var(--line)" />'; });
    var poly = function (v, st) { return '<polygon points="' + ax.map(function (k, i) { return pt(i, rad(v[k[0]])).map(f).join(','); }).join(' ') + '" style="' + st + '" />'; };
    if (b) s += poly(b, 'fill:color-mix(in srgb,var(--int) 10%,transparent);stroke:var(--int);stroke-width:1.5;stroke-dasharray:4 3');
    s += poly(a, 'fill:color-mix(in srgb,var(--accent) 16%,transparent);stroke:var(--accent);stroke-width:1.5');
    ax.forEach(function (k, i) {
      var p = pt(i, i % 2 ? 1.1 : 1.16), anchor = i === 1 ? 'start' : i === 3 ? 'end' : 'middle';
      s += '<text x="' + f(p[0]) + '" y="' + f(p[1] + (i === 0 ? -2 : i === 2 ? 10 : 4)) + '" text-anchor="' + anchor + '" style="font:500 10.5px var(--f-mono);fill:var(--fg)">' + E(k[1]) + '</text>';
    });
    return s + '</svg>';
  };

  // constellation : compétences connues (pleines, plus proches du centre si maîtrisées) et envies (anneaux) par secteur d'univers
  CH.constellationSVG = function (st, o) {
    o = o || {};
    // sur petit écran : figure plus compacte et libellés plus gros, pour rester lisible une fois réduite
    var small = o.small != null ? o.small : ((W.innerWidth || 1024) < 600);
    var S = small ? 330 : (o.size || 420), cx = S / 2, cy = S / 2, R = S / 2 - (small ? 30 : 58);
    var FS = small ? 10.5 : 9.5, CW = small ? 6.3 : 5.6, MAXC = small ? 14 : 18;
    var unis = C.data.universes, nU = unis.length;
    var nodes = [];
    Object.keys(st.skills || {}).forEach(function (id) { var s = C.data.sById[id], v = st.skills[id]; if (s && v && v.level > 0) nodes.push({ s: s, level: v.level, desire: false }); });
    C.yesDesires(st).forEach(function (id) { if (!nodes.some(function (n) { return n.s.id === id; })) nodes.push({ s: C.data.sById[id], level: 0, desire: true }); });
    if (!nodes.length) return '<p class="empty">Ajouter des compétences pour voir la constellation.</p>';
    var bySec = {}; nodes.forEach(function (n) { (bySec[n.s.universe] = bySec[n.s.universe] || []).push(n); });
    unis.forEach(function (u, ui) {
      var arr = bySec[u.id] || [], a0 = -Math.PI / 2 + ui * 2 * Math.PI / nU, span = 2 * Math.PI / nU;
      arr.sort(function (a, b) { return b.level - a.level; });
      arr.forEach(function (n, k) {
        var a = a0 + span * (arr.length === 1 ? 0.5 : 0.15 + 0.7 * k / (arr.length - 1));
        var r = n.desire ? 0.93 : 0.78 - (n.level - 1) * 0.15;
        r += (U.hash(n.s.id) - 0.5) * 0.08;
        n.x = cx + Math.cos(a) * R * r; n.y = cy + Math.sin(a) * R * r;
      });
    });
    var uniBoxes = [];
    var PADX = small ? 16 : 70, s = '<svg viewBox="' + (-PADX) + ' 0 ' + (S + 2 * PADX) + ' ' + S + '" width="' + (S + 2 * PADX) + '" height="' + S + '" role="img" aria-label="Constellation de ' + nodes.length + ' compétences et envies" class="constel">';
    [0.33, 0.63, 0.93].forEach(function (r) { s += '<circle cx="' + cx + '" cy="' + cy + '" r="' + f(R * r) + '" style="fill:none;stroke:var(--line)" />'; });
    unis.forEach(function (u, ui) {
      var a = -Math.PI / 2 + ui * 2 * Math.PI / nU;
      s += '<line x1="' + f(cx + Math.cos(a) * R * 0.2) + '" y1="' + f(cy + Math.sin(a) * R * 0.2) + '" x2="' + f(cx + Math.cos(a) * R) + '" y2="' + f(cy + Math.sin(a) * R) + '" style="stroke:var(--grid)" />';
      var am = a + Math.PI / nU, lx = cx + Math.cos(am) * (R + (small ? 14 : 22)), ly = cy + Math.sin(am) * (R + (small ? 14 : 22));
      var has = !!bySec[u.id], uw = u.short.length * 5.4;
      uniBoxes.push({ x0: lx - uw / 2, x1: lx + uw / 2, y0: ly - 4, y1: ly + 5 });
      s += '<text x="' + f(lx) + '" y="' + f(ly + 3) + '" text-anchor="middle" style="font:9px var(--f-mono);fill:' + (has ? 'var(--fg-2)' : 'var(--idle)') + '">' + E(u.short) + '</text>';
    });
    // arêtes : deux plus proches voisins de chaque nœud
    var edges = {};
    nodes.forEach(function (a, i) {
      var best = nodes.map(function (b, j) { return { j: j, v: i === j ? -1 : C.sim(a.s, b.s) }; }).sort(function (x, y) { return y.v - x.v; }).slice(0, 2);
      best.forEach(function (b) { if (b.v > 0.36) { var key = Math.min(i, b.j) + '-' + Math.max(i, b.j); edges[key] = { a: a, b: nodes[b.j], v: b.v }; } });
    });
    Object.keys(edges).forEach(function (k) {
      var e = edges[k], bridge = e.a.desire !== e.b.desire;
      s += '<line x1="' + f(e.a.x) + '" y1="' + f(e.a.y) + '" x2="' + f(e.b.x) + '" y2="' + f(e.b.y) + '" style="stroke:' + (bridge ? 'var(--int)' : 'var(--line-2)') + ';stroke-width:' + (bridge ? 1.2 : 1) + (bridge ? ';stroke-dasharray:3 3' : '') + ';opacity:' + (0.4 + e.v * 0.6).toFixed(2) + '" />';
    });
    var labelAll = nodes.length <= 22, placed = uniBoxes, labels = '';
    // libellés : placement glouton avec évitement des chevauchements (décalage vertical, sinon infobulle seule)
    function hit(b) { return placed.some(function (q) { return b.x0 < q.x1 && b.x1 > q.x0 && b.y0 < q.y1 && b.y1 > q.y0; }); }
    nodes.slice().sort(function (a, b) { return (b.desire ? 5 : b.level) - (a.desire ? 5 : a.level); }).forEach(function (n) {
      var r = n.desire ? 5 : 3 + n.level * 1.4;
      if (!(labelAll || n.level >= 3 || n.desire)) return;
      var nm0 = n.s.short || n.s.name; var name = nm0.length > MAXC ? nm0.slice(0, MAXC - 1) + '…' : nm0;
      var right = n.x >= cx, w = name.length * CW + 2;
      // bascule de côté si le libellé sortirait du cadre
      if (right && n.x + r + 3 + w > S + PADX - 2) right = false; else if (!right && n.x - r - 3 - w < -PADX + 2) right = true;
      var x0 = right ? n.x + r + 3 : n.x - r - 3 - w;
      var offs = [0, -9, 9, -17, 17], box = null;
      for (var k = 0; k < offs.length; k++) { var b = { x0: x0, x1: x0 + w, y0: n.y - 5 + offs[k], y1: n.y + 5 + offs[k] }; if (!hit(b)) { box = b; break; } }
      if (!box) return;
      placed.push(box);
      labels += '<text x="' + f(right ? box.x0 : box.x1) + '" y="' + f(box.y0 + 8.5) + '" text-anchor="' + (right ? 'start' : 'end') + '" style="font:' + FS + 'px var(--f-mono);fill:' + (n.desire ? 'var(--int)' : 'var(--fg)') + ';paint-order:stroke;stroke:var(--panel);stroke-width:3px">' + E(name) + '</text>';
    });
    nodes.forEach(function (n) {
      var r = n.desire ? 5 : 3 + n.level * 1.4;
      var col = 'hsl(' + C.universe(n.s.universe).hue + ' 38% 62%)';
      s += '<g><title>' + E(n.s.name) + (n.desire ? ' · envie' : ' · ' + C.LEVELS[n.level]) + '</title>';
      s += n.desire ? '<circle cx="' + f(n.x) + '" cy="' + f(n.y) + '" r="' + r + '" style="fill:var(--bg);stroke:var(--int);stroke-width:1.6" />'
        : '<circle cx="' + f(n.x) + '" cy="' + f(n.y) + '" r="' + f(r) + '" style="fill:' + col + ';stroke:var(--bg);stroke-width:1" />';
      s += '</g>';
    });
    s += labels;
    s += '</svg>';
    return s;
  };

  // simulateur : net mensuel selon les heures hebdomadaires, repère courant et objectif
  CH.simCurveSVG = function (fn, cur, target, o) {
    o = o || {};
    var Wd = o.w || 520, H = o.h || 180, pl = 44, pr = 12, pt = 14, pb = 26;
    var xs = []; for (var h = 1; h <= 35; h++) xs.push(h);
    var ys = xs.map(function (h) { return fn(h); });
    var maxY = Math.max(target || 0, Math.max.apply(null, ys), 100) * 1.1;
    var X = function (h) { return pl + (h - 1) / 34 * (Wd - pl - pr); }, Y = function (v) { return pt + (1 - Math.max(0, v) / maxY) * (H - pt - pb); };
    var s = '<svg viewBox="0 0 ' + Wd + ' ' + H + '" width="100%" role="img" aria-label="Revenu net mensuel selon les heures par semaine" class="simcurve" preserveAspectRatio="xMidYMid meet">';
    var step = maxY > 4000 ? 1000 : maxY > 1600 ? 500 : maxY > 600 ? 200 : 100;
    for (var v = 0; v <= maxY; v += step) s += '<line x1="' + pl + '" x2="' + (Wd - pr) + '" y1="' + f(Y(v)) + '" y2="' + f(Y(v)) + '" style="stroke:var(--line)" /><text x="' + (pl - 6) + '" y="' + f(Y(v) + 3) + '" text-anchor="end" style="font:9px var(--f-mono);fill:var(--fg-3)">' + U.fmt(v) + '</text>';
    [5, 10, 15, 20, 25, 30, 35].forEach(function (h) { s += '<text x="' + f(X(h)) + '" y="' + (H - 8) + '" text-anchor="middle" style="font:9px var(--f-mono);fill:var(--fg-3)">' + h + ' h</text>'; });
    if (target) s += '<line x1="' + pl + '" x2="' + (Wd - pr) + '" y1="' + f(Y(target)) + '" y2="' + f(Y(target)) + '" style="stroke:var(--wait);stroke-dasharray:4 3" /><text x="' + (Wd - pr) + '" y="' + f(Y(target) - 5) + '" text-anchor="end" style="font:9.5px var(--f-mono);fill:var(--wait)">objectif ' + U.fmt(target) + ' €</text>';
    s += '<polyline points="' + xs.map(function (h, i) { return f(X(h)) + ',' + f(Y(ys[i])); }).join(' ') + '" style="fill:none;stroke:var(--accent);stroke-width:1.8" />';
    var hc = U.clamp(cur, 1, 35), yc = fn(hc);
    s += '<line x1="' + f(X(hc)) + '" x2="' + f(X(hc)) + '" y1="' + pt + '" y2="' + (H - pb) + '" style="stroke:var(--line-2)" />';
    s += '<circle cx="' + f(X(hc)) + '" cy="' + f(Y(yc)) + '" r="4" style="fill:var(--accent);stroke:var(--bg);stroke-width:2" />';
    s += '<text x="' + f(X(hc) + (hc > 25 ? -8 : 8)) + '" y="' + f(Math.max(pt + 10, Y(yc) - 8)) + '" text-anchor="' + (hc > 25 ? 'end' : 'start') + '" style="font:500 10.5px var(--f-mono);fill:var(--fg)">' + U.fmt(yc) + ' € net</text>';
    s += '</svg>';
    return s;
  };

  // carte relative des lieux autour d'un point (projection équirectangulaire locale)
  CH.mapSVG = function (items, lat, lon, radiusKm, o) {
    o = o || {};
    var S = o.size || 360, c = S / 2, R = S / 2 - 18;
    var kx = 111.32 * Math.cos(lat * Math.PI / 180), ky = 110.57;
    // échelle ajustée au lieu le plus éloigné (zoom automatique), bornée par le rayon demandé
    var far = 0; items.forEach(function (it) { var d = Math.sqrt(Math.pow((it.lon - lon) * kx, 2) + Math.pow((it.lat - lat) * ky, 2)); if (d > far) far = d; });
    var steps = [0.5, 1, 2, 2.5, 5, 10, 20]; var view = radiusKm;
    for (var k = 0; k < steps.length; k++) if (steps[k] >= far * 1.12 && steps[k] <= radiusKm) { view = steps[k]; break; }
    radiusKm = view;
    var s = '<svg viewBox="0 0 ' + S + ' ' + S + '" width="' + S + '" height="' + S + '" role="img" aria-label="Carte des ' + items.length + ' lieux trouvés" class="osmmap">';
    var rings = radiusKm <= 0.5 ? [0.25, 0.5] : radiusKm <= 1 ? [0.25, 0.5, 1] : radiusKm <= 2.5 ? [0.5, 1, radiusKm] : radiusKm <= 5 ? [1, 2.5, 5] : [2, 5, 10, 20].filter(function (x) { return x <= radiusKm * 1.01; });
    rings.forEach(function (rk) { var rr = R * rk / radiusKm; s += '<circle cx="' + c + '" cy="' + c + '" r="' + f(rr) + '" style="fill:none;stroke:var(--line)" /><text x="' + (c + 3) + '" y="' + f(c - rr - 3) + '" style="font:9px var(--f-mono);fill:var(--fg-3)">' + String(rk).replace('.', ',') + ' km</text>'; });
    s += '<line x1="' + (c - 6) + '" x2="' + (c + 6) + '" y1="' + c + '" y2="' + c + '" style="stroke:var(--accent)" /><line y1="' + (c - 6) + '" y2="' + (c + 6) + '" x1="' + c + '" x2="' + c + '" style="stroke:var(--accent)" />';
    items.forEach(function (it, i) {
      var dx = (it.lon - lon) * kx, dy = (it.lat - lat) * ky;
      var x = c + dx / radiusKm * R, y = c - dy / radiusKm * R;
      if (Math.abs(x - c) > c || Math.abs(y - c) > c) return;
      var col = it.universe ? 'hsl(' + C.universe(it.universe).hue + ' 38% 62%)' : 'var(--fg-2)';
      s += '<g data-osm="' + i + '"><title>' + E((i + 1) + '. ' + it.name + ' · ' + it.category) + '</title><circle cx="' + f(x) + '" cy="' + f(y) + '" r="' + (i < 9 ? 7 : 3.5) + '" style="fill:' + col + ';stroke:var(--bg);stroke-width:1" />' +
        (i < 9 ? '<text x="' + f(x) + '" y="' + f(y + 3) + '" text-anchor="middle" style="font:600 8.5px var(--f-mono);fill:var(--accent-ink)">' + (i + 1) + '</text>' : '') + '</g>';
    });
    s += '</svg>';
    return s;
  };
})(window);
