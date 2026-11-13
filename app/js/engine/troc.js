/* Troc : appariement bilatéral entre deux bilans, selon la règle d'animation (C.TEACH_RULE).
   A peut faire progresser B sur x si B veut x et que A peut animer un palier du chemin de B (niveau actuel + 1 → niveau visé).
   Règle stricte : niveau(A) = palier + 1 ; pour le dernier palier, niveau(A) = niveau visé par B + 1.
   À défaut de la compétence exacte, une compétence très proche (similarité ≥ 0,55) au niveau voulu convient.
   Un troc = une paire (A apprend x de B, B apprend y de A). Score = Σ niveaux / 10 × proximité × priorité. */
(function (W) {
  'use strict';
  var C = W.Cordes, U = C.util;
  function wants(p) { var d = p.desires || {}; return Object.keys(d).filter(function (id) { return d[id] && d[id].verdict === 'yes' && C.data.sById[id]; }); }
  function knows(p, min) { var s = p.skills || {}; return Object.keys(s).filter(function (id) { return s[id] && s[id].level >= (min || 2) && C.data.sById[id]; }); }
  function lvl(p, id) { return U.num(((p.skills || {})[id] || {}).level, 0); }
  // chemin d'une envie : du niveau actuel au niveau visé (échelle des envies : 2 à 5)
  C.desirePath = function (p, id) {
    var cur = U.clamp(lvl(p, id), 0, C.LEVEL_MAX);
    var t = U.clamp(U.num(((p.desires || {})[id] || {}).target, 2), 2, C.LEVEL_MAX);
    if (t <= cur) t = Math.min(C.LEVEL_MAX, cur + 1);
    return { cur: cur, target: t };
  };
  // ce que teacher peut faire progresser chez learner
  C.teachMatches = function (learner, teacher) {
    var out = [], tk = knows(teacher, 2);
    wants(learner).forEach(function (w) {
      var path = C.desirePath(learner, w);
      var exact = tk.indexOf(w) >= 0 ? C.paliersOnPath(lvl(teacher, w), path.cur, path.target) : [];
      if (exact.length) { out.push({ want: w, via: w, exact: true, level: lvl(teacher, w), paliers: exact, palier: exact[exact.length - 1], cur: path.cur, target: path.target, score: 1 }); return; }
      var best = null, bv = 0, bp = null;
      tk.forEach(function (k) {
        if (k === w) return;
        var pal = C.paliersOnPath(lvl(teacher, k), path.cur, path.target); if (!pal.length) return;
        var v = C.sim(w, k); if (v > bv) { bv = v; best = k; bp = pal; }
      });
      if (best && bv >= 0.55) out.push({ want: w, via: best, exact: false, level: lvl(teacher, best), paliers: bp, palier: bp[bp.length - 1], cur: path.cur, target: path.target, score: bv });
    });
    return out;
  };
  // envies de learner que teacher connaît, mais pas au bon niveau pour les animer (pour expliquer la règle)
  C.teachMisses = function (learner, teacher) {
    var tk = knows(teacher, 1);
    return wants(learner).filter(function (w) { return tk.indexOf(w) >= 0; }).map(function (w) {
      var path = C.desirePath(learner, w), n = lvl(teacher, w);
      return C.paliersOnPath(n, path.cur, path.target).length ? null : { want: w, level: n, cur: path.cur, target: path.target, need: C.hostLevel(path.cur + 1) + (C.TEACH_RULE === 'below' ? ' ou plus' : (path.target > path.cur + 1 ? ' à ' + C.hostLevel(path.target) : '')) };
    }).filter(Boolean);
  };
  C.troc = function (A, B) {
    var aFromB = C.teachMatches(A, B), bFromA = C.teachMatches(B, A);
    var pairs = [];
    aFromB.forEach(function (x) { bFromA.forEach(function (y) {
      var pa = U.num(((A.desires || {})[x.want] || {}).priority, 3), pb = U.num(((B.desires || {})[y.want] || {}).priority, 3);
      pairs.push({ aLearns: x, bLearns: y, score: (x.level + y.level) / 10 * x.score * y.score * (1 + 0.15 * (6 - Math.min(5, pa)) / 5 + 0.15 * (6 - Math.min(5, pb)) / 5) });
    }); });
    pairs.sort(function (p, q) { return q.score - p.score; });
    var ak = knows(A, 2), bk = knows(B, 2);
    var commonSkills = ak.filter(function (id) { return bk.indexOf(id) >= 0; });
    var wa = wants(A), wb = wants(B);
    var commonWants = wa.filter(function (id) { return wb.indexOf(id) >= 0; });
    var projSkills = commonSkills.concat(commonWants).concat(pairs.slice(0, 2).map(function (p) { return p.aLearns.via; })).map(function (id) { return C.data.sById[id]; });
    var projects = C.projectsFor(projSkills.length ? projSkills : ak.concat(bk).map(function (id) { return C.data.sById[id]; }), 3);
    var ideas = [];
    commonWants.slice(0, 3).forEach(function (id) { var s = C.data.sById[id]; ideas.push('Réserver ensemble un atelier découverte ' + C.de(s) + ' : à deux, on revient plus souvent'); });
    commonSkills.slice(0, 2).forEach(function (id) { var s = C.data.sById[id]; ideas.push('Animer à deux une séance ' + C.de(s) + ' pour 4 amis, au palier que vous pouvez animer'); });
    pairs.slice(0, 2).forEach(function (p) { ideas.push('Troc de 2 × 1 h : ' + C.nm(C.data.sById[p.aLearns.via]) + ' (palier ' + p.aLearns.palier + ') contre ' + C.nm(C.data.sById[p.bLearns.via]) + ' (palier ' + p.bLearns.palier + ')'); });
    var compat = Math.round(U.clamp(pairs.length * 0.22 + aFromB.length * 0.08 + bFromA.length * 0.08 + commonWants.length * 0.1 + commonSkills.length * 0.05, 0, 1) * 100);
    return { aFromB: aFromB, bFromA: bFromA, pairs: pairs.slice(0, 6), commonSkills: commonSkills, commonWants: commonWants, projects: projects, ideas: ideas, compat: compat,
      aMisses: C.teachMisses(A, B), bMisses: C.teachMisses(B, A) };
  };
})(window);
