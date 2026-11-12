/* Troc : appariement bilatéral entre deux bilans.
   A peut apprendre s à B si A veut s et B sait s au niveau ≥ 3 (ou une compétence très proche, sim ≥ 0,55).
   Un troc = une paire (A apprend x de B, B apprend y de A). Score = Σ niveaux / 8 × priorité. */
(function (W) {
  'use strict';
  var C = W.Cordes, U = C.util;
  function wants(p) { var d = p.desires || {}; return Object.keys(d).filter(function (id) { return d[id] && d[id].verdict === 'yes' && C.data.sById[id]; }); }
  function knows(p, min) { var s = p.skills || {}; return Object.keys(s).filter(function (id) { return s[id] && s[id].level >= (min || 3) && C.data.sById[id]; }); }
  function teachMatches(learner, teacher) {
    var out = [], tk = knows(teacher, 3);
    wants(learner).forEach(function (w) {
      var exact = tk.indexOf(w) >= 0;
      if (exact) { out.push({ want: w, via: w, exact: true, level: teacher.skills[w].level, score: 1 }); return; }
      var best = null, bv = 0;
      tk.forEach(function (k) { var v = C.sim(w, k); if (v > bv) { bv = v; best = k; } });
      if (best && bv >= 0.55) out.push({ want: w, via: best, exact: false, level: teacher.skills[best].level, score: bv });
    });
    return out;
  }
  C.troc = function (A, B) {
    var aFromB = teachMatches(A, B), bFromA = teachMatches(B, A);
    var pairs = [];
    aFromB.forEach(function (x) { bFromA.forEach(function (y) {
      var pa = U.num((A.desires[x.want] || {}).priority, 3), pb = U.num((B.desires[y.want] || {}).priority, 3);
      pairs.push({ aLearns: x, bLearns: y, score: (x.level + y.level) / 8 * x.score * y.score * (1 + 0.15 * (6 - Math.min(5, pa)) / 5 + 0.15 * (6 - Math.min(5, pb)) / 5) });
    }); });
    pairs.sort(function (p, q) { return q.score - p.score; });
    var ak = knows(A, 2), bk = knows(B, 2);
    var commonSkills = ak.filter(function (id) { return bk.indexOf(id) >= 0; });
    var wa = wants(A), wb = wants(B);
    var commonWants = wa.filter(function (id) { return wb.indexOf(id) >= 0; });
    var unis = {};
    commonSkills.concat(commonWants).forEach(function (id) { unis[C.data.sById[id].universe] = 1; });
    var projSkills = commonSkills.concat(commonWants).concat(pairs.slice(0, 2).map(function (p) { return p.aLearns.via; })).map(function (id) { return C.data.sById[id]; });
    var projects = C.projectsFor(projSkills.length ? projSkills : ak.concat(bk).map(function (id) { return C.data.sById[id]; }), 3);
    var ideas = [];
    commonWants.slice(0, 3).forEach(function (id) { var s = C.data.sById[id]; ideas.push('Réserver ensemble un atelier découverte de ' + s.name.toLowerCase() + ' : à deux, on revient plus souvent'); });
    commonSkills.slice(0, 2).forEach(function (id) { var s = C.data.sById[id]; ideas.push('Animer à deux une séance de ' + s.name.toLowerCase() + ' pour 4 amis'); });
    pairs.slice(0, 2).forEach(function (p) { ideas.push('Troc de 2 × 1 h : ' + C.data.sById[p.aLearns.via].name.toLowerCase() + ' contre ' + C.data.sById[p.bLearns.via].name.toLowerCase()); });
    var compat = Math.round(U.clamp(pairs.length * 0.22 + aFromB.length * 0.08 + bFromA.length * 0.08 + commonWants.length * 0.1 + commonSkills.length * 0.05, 0, 1) * 100);
    return { aFromB: aFromB, bFromA: bFromA, pairs: pairs.slice(0, 6), commonSkills: commonSkills, commonWants: commonWants, projects: projects, ideas: ideas, compat: compat };
  };
})(window);
