/* Similarité entre compétences et graphe de voisinage précalculé.
   sim(a,b) = 0.36·Jaccard(tags) + 0.10·même univers + 0.08·même domaine + 0.18·lien related
            + 0.20·proximité des attrs (cosinus centré, ramené à [0,1]) + 0.08·Jaccard(soft) */
(function (W) {
  'use strict';
  var C = W.Cordes, U = C.util;
  C.SIM_WEIGHTS = { tags: 0.36, universe: 0.10, domain: 0.08, related: 0.18, attrs: 0.20, soft: 0.08 };
  var DIMS = ['social', 'physical', 'creative', 'intellectual', 'online', 'teachable', 'cost'];

  C.buildGraph = function (k) {
    k = k || 12;
    var S = C.data.skills, n = S.length, i, j;
    // moyenne par dimension pour centrer les vecteurs (sinon tout cosinus est proche de 1)
    var mean = DIMS.map(function (d) { var t = 0; S.forEach(function (s) { t += s.attrs[d]; }); return n ? t / n : 0; });
    S.forEach(function (s) {
      var v = DIMS.map(function (d, q) { return s.attrs[d] - mean[q]; });
      var norm = Math.sqrt(v.reduce(function (a, x) { return a + x * x; }, 0)) || 1;
      s._vec = v.map(function (x) { return x / norm; });
      s._rel = {}; s.related.forEach(function (r) { s._rel[r] = 1; });
    });
    var cache = C._simCache = new Float32Array(n * n);
    S.forEach(function (s, q) { s._idx = q; });
    var neigh = {};
    for (i = 0; i < n; i++) {
      cache[i * n + i] = 1;
      for (j = i + 1; j < n; j++) {
        var v = C.simRaw(S[i], S[j]);
        cache[i * n + j] = v; cache[j * n + i] = v;
      }
    }
    for (i = 0; i < n; i++) {
      var row = [];
      for (j = 0; j < n; j++) if (j !== i) row.push([j, cache[i * n + j]]);
      row.sort(function (a, b) { return b[1] - a[1]; });
      neigh[S[i].id] = row.slice(0, k).map(function (x) { return { id: S[x[0]].id, sim: x[1] }; });
    }
    C.neighbors = neigh;
    return neigh;
  };

  C.simRaw = function (a, b) {
    var w = C.SIM_WEIGHTS;
    var cos = 0; for (var q = 0; q < a._vec.length; q++) cos += a._vec[q] * b._vec[q];
    var rel = (a._rel[b.id] || b._rel[a.id]) ? 1 : 0;
    return w.tags * U.jaccard(a.tags, b.tags)
      + w.universe * (a.universe === b.universe ? 1 : 0)
      + w.domain * (a.domain === b.domain ? 1 : 0)
      + w.related * rel
      + w.attrs * ((cos + 1) / 2)
      + w.soft * U.jaccard(a.soft, b.soft);
  };

  C.sim = function (a, b) {
    if (typeof a === 'string') a = C.data.sById[a];
    if (typeof b === 'string') b = C.data.sById[b];
    if (!a || !b) return 0;
    if (C._simCache && a._idx != null && b._idx != null) return C._simCache[a._idx * C.data.skills.length + b._idx];
    return C.simRaw(a, b);
  };

  // explication lisible d'une similarité
  C.simWhy = function (a, b) {
    if (typeof a === 'string') a = C.data.sById[a];
    if (typeof b === 'string') b = C.data.sById[b];
    if (!a || !b) return '';
    var common = a.tags.filter(function (t) { return b.tags.indexOf(t) >= 0; });
    var parts = [];
    if (a._rel[b.id] || b._rel[a.id]) parts.push('lien direct');
    if (common.length) parts.push(common.slice(0, 3).join(', '));
    if (a.domain === b.domain) parts.push('même domaine');
    else if (a.universe === b.universe) parts.push('même univers');
    return parts.join(' · ');
  };
})(window);
