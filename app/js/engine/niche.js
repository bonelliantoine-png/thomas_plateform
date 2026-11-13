/* Niche différenciante : score des paires de compétences maîtrisées.
   score = (0,30·complémentarité + 0,25·demande + 0,25·monétisation + 0,10·rareté + 0,10·formats communs) × facteur niveau
   complémentarité = (1 − JaccardIDF(tags)) × (univers différents ? 1 : 0,6) ; rareté = 1 − similarité. */
(function (W) {
  'use strict';
  var C = W.Cordes, U = C.util;
  C.NICHE_W = { comp: 0.30, demand: 0.25, monet: 0.25, rare: 0.10, fmt: 0.10 };
  C.niches = function (st, n) {
    var ids = Object.keys(st.skills || {}).filter(function (id) { return C.data.sById[id] && st.skills[id].level >= 2; });
    ids.sort(function (a, b) { return st.skills[b].level - st.skills[a].level; });
    ids = ids.slice(0, 14);
    var out = [], W = C.NICHE_W;
    var strongN = ids.filter(function (id) { return st.skills[id].level >= 3; }).length;
    for (var i = 0; i < ids.length; i++) for (var j = i + 1; j < ids.length; j++) {
      var a = C.data.sById[ids[i]], b = C.data.sById[ids[j]];
      var la = st.skills[a.id].level, lb = st.skills[b.id].level;
      if (la < 3 && lb < 3) continue;
      if (strongN >= 2 && (la < 3 || lb < 3)) continue; // deux compétences maîtrisées si possible
      var comp = (1 - C.jaccardIdf(a.tags, b.tags)) * (a.universe !== b.universe ? 1 : 0.6);
      var demand = (a.attrs.demand + b.attrs.demand) / 6;
      var monet = (a.attrs.monetization + b.attrs.monetization) / 6;
      var simab = C.sim(a, b);
      var rare = 1 - simab;
      var common = a.formats.filter(function (f) { return b.formats.indexOf(f) >= 0; });
      var fmt = common.length / Math.max(1, U.uniq(a.formats.concat(b.formats)).length);
      // une paire trop éloignée est peu crédible : on exige un minimum de proximité ou de format commun
      var plaus = simab > 0.18 || common.length >= 2 ? 1 : 0.7;
      var lvl = (Math.min(la, 5) + Math.min(lb, 5)) / 10;
      var score = (W.comp * comp + W.demand * demand + W.monet * monet + W.rare * rare + W.fmt * fmt) * (0.6 + 0.4 * lvl) * plaus;
      var lead = (a.attrs.demand + a.attrs.monetization) >= (b.attrs.demand + b.attrs.monetization) ? a : b;
      var other = lead === a ? b : a;
      var f = common[0] || lead.formats[0];
      out.push({ a: lead, b: other, score: score, parts: { comp: comp, demand: demand, monet: monet, rare: rare, fmt: fmt }, format: f, common: common,
        title: (lead.short || lead.name) + ' × ' + (other.short || other.name),
        concept: C.nicheConcept(lead, other, f) });
    }
    out.sort(function (x, y) { return y.score - x.score; });
    return out.slice(0, n || 3);
  };
  C.nicheConcept = function (a, b, f) {
    var fl = (C.FORMATS[f] || f).toLowerCase();
    var tagsB = b.tags.slice(0, 2).join(' et ');
    return 'Un ' + fl + ' où « ' + U.lc(C.milestone(a, 2)) + ' » sert de porte d’entrée, enrichi par votre pratique ' + C.de(b) +
      (tagsB ? ' (' + tagsB + ')' : '') + '. Peu de personnes maîtrisent les deux : vous attirez deux publics et sortez de la comparaison de prix.';
  };
  // matrice « j'aime / je maîtrise / ça se demande / ça se paie »
  C.niceMatrix = function (st) {
    return Object.keys(st.skills || {}).filter(function (id) { return C.data.sById[id] && st.skills[id].level >= 2; }).map(function (id) {
      var s = C.data.sById[id], v = st.skills[id];
      var love = U.num(v.love, 2) / 3, lvl = v.level / 5, dem = s.attrs.demand / 3, mon = s.attrs.monetization / 3;
      return { s: s, love: love, level: lvl, demand: dem, monet: mon, sweet: love >= 0.66 && lvl >= 0.75 && dem >= 0.66 && mon >= 0.66, total: love + lvl + dem + mon };
    }).sort(function (a, b) { return b.total - a.total; });
  };
})(window);
