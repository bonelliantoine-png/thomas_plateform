/* Ta corde cachée : test de 8 questions, profil parmi 13 « cordes », trois savoir-faire (évidente, voisine, surprise),
   défi de la semaine, comparaison de deux résultats, passerelle vers le bilan. Moteur pur, déterministe, sans DOM.
   score(s) = 0,45 × points d'univers / max + 0,25 × cosinus(axes, attributs centrés) + 0,15 × tendance/3 + 0,15 × demande/3 */
(function (W) {
  'use strict';
  var C = W.Cordes, U = C.util;
  C.QUIZ_W = { uni: 0.45, axes: 0.25, trend: 0.15, demand: 0.15 };
  C.QUIZ_AXES = [['so', 'Social'], ['ph', 'Physique'], ['cr', 'Création'], ['in', 'Intellect']];
  var EXCL = ['securite', 'sante', 'animaux'];

  C.loadQuiz = function (raw) {
    var Q = raw || W.CORDES_QUIZ || {};
    var qs = U.arr(Q.questions).filter(function (q) { return q && q.id && U.arr(q.opts).length; });
    if (qs.length !== 8) U.anomaly('quiz', 'CORDES_QUIZ : ' + qs.length + ' questions au lieu de 8');
    qs.forEach(function (q) { q.opts.forEach(function (o) { Object.keys(o.uni || {}).forEach(function (u) { if (!C.data.uById[u]) U.anomaly('quiz', q.id + ' : univers inconnu « ' + u + ' »'); }); }); });
    var profiles = U.arr(Q.profiles).filter(function (p) { return p && p.id && U.arr(p.universes).length; });
    C.quiz = { questions: qs, profiles: profiles, byId: {} };
    profiles.forEach(function (p) { C.quiz.byId[p.id] = p; });
    C.quizUniProfile = {}; profiles.forEach(function (p) { p.universes.forEach(function (u) { C.quizUniProfile[u] = p.id; }); });
    return C.quiz;
  };
  function Q() { return C.quiz || C.loadQuiz(); }

  C.quizScore = function (answers) {
    var q = Q(), axes = { so: 0, ph: 0, cr: 0, in: 0 }, uni = {}, costMax = 3, budget = 40;
    q.questions.forEach(function (qq, i) {
      var k = U.arr(answers)[i]; var o = qq.opts[k]; if (!o) return;
      Object.keys(o.ax || {}).forEach(function (a) { axes[a] = (axes[a] || 0) + U.num(o.ax[a]); });
      Object.keys(o.uni || {}).forEach(function (u) { uni[u] = (uni[u] || 0) + U.num(o.uni[u]); });
      if (o.cost !== undefined) { costMax = o.cost == null ? 3 : U.clamp(o.cost, 0, 3); budget = U.num(o.budget, budget); }
    });
    // profil : univers dominant (points regroupés par corde) ; à égalité, l'axe de la corde le plus fort, puis l'ordre des cordes
    var best = null, bv = -1;
    q.profiles.forEach(function (p, i) {
      var v = Math.max.apply(null, p.universes.map(function (u) { return uni[u] || 0; }));
      var key = v * 1000 + (axes[p.axis] || 0) * 10 - i * 0.01;
      if (key > bv) { bv = key; best = p; }
    });
    var tops = Object.keys(uni).sort(function (a, b) { return uni[b] - uni[a] || (a < b ? -1 : 1); }).slice(0, 3);
    return { axes: axes, uni: uni, costMax: costMax, budget: budget, profile: best, topUniverses: tops, answers: U.arr(answers).slice(0, 8) };
  };

  function vec(s) { var a = s.attrs; return [a.social - 1.5, a.physical - 1.5, a.creative - 1.5, a.intellectual - 1.5]; }
  function cos(x, y) { var d = 0, nx = 0, ny = 0; for (var i = 0; i < x.length; i++) { d += x[i] * y[i]; nx += x[i] * x[i]; ny += y[i] * y[i]; } return nx && ny ? d / Math.sqrt(nx * ny) : 0; }
  C.quizEligible = function (s, costMax) {
    var a = s.attrs;
    return a.oneHourResult === true && !(s.regulated && EXCL.indexOf(s.regulated) >= 0) && a.cost <= (costMax == null ? 3 : costMax) && !(C.IDEAS && C.IDEAS.excludeSkills && (C.IDEAS.excludeSkills.indexOf(s.id) >= 0 || C.IDEAS.excludeDomains.indexOf(s.domain) >= 0));
  };
  C.quizRank = function (r) {
    var W2 = C.QUIZ_W, maxU = Math.max.apply(null, [1].concat(Object.keys(r.uni).map(function (k) { return r.uni[k]; })));
    var ax = [r.axes.so, r.axes.ph, r.axes.cr, r.axes.in];
    return C.data.skills.filter(function (s) { return C.quizEligible(s, r.costMax); }).map(function (s) {
      var sc = W2.uni * (r.uni[s.universe] || 0) / maxU + W2.axes * cos(ax, vec(s)) + W2.trend * U.clamp(s.attrs.trend / 3, 0, 1) + W2.demand * s.attrs.demand / 3;
      return { s: s, score: sc };
    }).sort(function (a, b) { return b.score - a.score || (a.s.id < b.s.id ? -1 : 1); });
  };
  // [évidente, voisine, surprise] puis jusqu'à 5 surprises de rechange
  C.quizPicks = function (r, opts) {
    opts = opts || {};
    var rank = C.quizRank(r); if (!rank.length) return { picks: [], surprises: [] };
    var byId = {}; rank.forEach(function (x, i) { byId[x.s.id] = x; x.rank = i; });
    var ev = rank[0];
    var nb = U.arr(C.neighbors[ev.s.id]).map(function (n) { return byId[n.id]; }).filter(function (x) { return x && x.s.domain !== ev.s.domain; })
      .sort(function (a, b) { return b.score - a.score; });
    var vo = nb[0] || rank.filter(function (x) { return x.s.domain !== ev.s.domain && x.s.universe === ev.s.universe; })[0] || rank.filter(function (x) { return x.s.domain !== ev.s.domain; })[0];
    var prof = U.arr(r.profile && r.profile.universes), top3 = U.uniq(prof.concat(r.topUniverses)).slice(0, Math.max(3, prof.length));
    var notTop = function (x) { return top3.indexOf(x.s.universe) < 0 && x.s.id !== ev.s.id && (!vo || x.s.id !== vo.s.id); };
    var shareTag = function (x) { return x.s.tags.some(function (t) { return ev.s.tags.indexOf(t) >= 0; }); };
    var sur = rank.filter(function (x) { return notTop(x) && x.s.attrs.demand <= 2 && shareTag(x); });
    if (sur.length < 5) sur = sur.concat(rank.filter(function (x) { return notTop(x) && x.s.attrs.demand <= 2 && sur.indexOf(x) < 0; }));
    if (sur.length < 5) sur = sur.concat(rank.filter(function (x) { return notTop(x) && sur.indexOf(x) < 0; }));
    // une seule surprise par univers dans la liste de rechange
    var seenU = {}; sur = sur.filter(function (x) { if (seenU[x.s.universe]) return false; seenU[x.s.universe] = 1; return true; }).slice(0, 5);
    var k = U.clamp(U.num(opts.surprise, 0), 0, Math.max(0, sur.length - 1));
    var mk = function (x, role, label) { return x ? { s: x.s, role: role, label: label, score: Math.round(x.score * 1000) / 1000, oneHour: x.s.levels[0], tag: role === 'surprise' ? (ev.s.tags.filter(function (t) { return x.s.tags.indexOf(t) >= 0; })[0] || '') : '' } : null; };
    return { picks: [mk(ev, 'evidente', 'L’évidente'), mk(vo, 'voisine', 'La voisine'), mk(sur[k], 'surprise', 'La surprise')].filter(Boolean), surprises: sur.map(function (x) { return x.s.id; }), surprise: k };
  };

  /* ---------- défi de la semaine ---------- */
  C.quizDefi = function (id) {
    var s = C.data.sById[id]; if (!s) return null;
    var d = (W.CORDES_DEFIS || {})[id];
    if (d && U.arr(d.etapes).length) return { id: id, titre: d.titre, minutes: U.num(d.minutes, 15), materiel: d.materiel || '', etapes: d.etapes.slice(0, 3), reussi: d.reussi || '', edited: true };
    var first = C.firstStep({ context: {} }, s, { formats: ['contenu'] });
    return { id: id, titre: 'Premier essai : ' + U.lc(s.levels[0]), minutes: 15, materiel: s.attrs.cost === 0 ? 'Rien de particulier' : 'Le minimum pour essayer, à emprunter si possible',
      etapes: ['Regarder une démonstration courte ' + C.de(s) + ' et noter le geste qui revient', 'Essayer pendant 10 minutes : ' + U.lc(s.levels[0]), 'Photographier ou noter le résultat, même maladroit'], reussi: 'Tu as fait un premier essai ' + C.de(s) + '.', next: first.text, edited: false };
  };

  /* ---------- partage #t= et comparaison ---------- */
  C.encodeQuiz = function (r, name) {
    var o = { v: 1, a: U.arr(r.answers).join('') };
    if (name) o.n = String(name).slice(0, 40);
    return C.packCode(o);
  };
  C.decodeQuiz = function (code) {
    var p; try { p = C.unpackCode(code, 't'); } catch (e) { return Promise.resolve(null); }
    return p.then(function (o) {
      if (!o || !/^\d{8}$/.test(String(o.a || ''))) return null;
      var ans = String(o.a).split('').map(Number), q = Q();
      if (ans.some(function (k, i) { return !q.questions[i] || !q.questions[i].opts[k]; })) return null;
      return { answers: ans, name: String(o.n || '').slice(0, 40) };
    }, function () { return null; });
  };
  C.quizCompare = function (a, b) {
    var axes = C.QUIZ_AXES.map(function (x) { return { id: x[0], label: x[1], a: a.axes[x[0]] || 0, b: b.axes[x[0]] || 0 }; });
    var uni = {}; [a, b].forEach(function (r) { var m = Math.max.apply(null, [1].concat(Object.keys(r.uni).map(function (k) { return r.uni[k]; }))); Object.keys(r.uni).forEach(function (u) { uni[u] = (uni[u] || 0) + r.uni[u] / m; }); });
    var mix = { axes: { so: (a.axes.so + b.axes.so) / 2, ph: (a.axes.ph + b.axes.ph) / 2, cr: (a.axes.cr + b.axes.cr) / 2, in: (a.axes.in + b.axes.in) / 2 }, uni: uni, costMax: Math.min(a.costMax, b.costMax) };
    // au plus proche des deux : bien classé pour chacun (rang moyen) et pour le profil moyen
    var ra = C.quizRank(a), rb = C.quizRank(b), rm = C.quizRank(mix), pos = function (l) { var o = {}; l.forEach(function (x, i) { o[x.s.id] = i; }); return o; };
    var pa = pos(ra), pb = pos(rb);
    var both = rm.filter(function (x) { return pa[x.s.id] != null && pb[x.s.id] != null; }).map(function (x, i) { return { s: x.s, v: i + Math.max(pa[x.s.id], pb[x.s.id]) * 0.5 }; })
      .sort(function (x, y) { return x.v - y.v; });
    var together = []; both.forEach(function (x) { if (together.length < 2 && !together.some(function (t) { return t.s.universe === x.s.universe; })) together.push(x); });
    return { axes: axes, same: a.profile && b.profile && a.profile.id === b.profile.id, together: together.map(function (x) { return x.s; }) };
  };

  /* ---------- passerelle vers le bilan ---------- */
  C.quizToState = function (r, picks) {
    var st = C.defaultState();
    st.mode = 'learn';
    st.context.budgetPerMonth = U.num(r.budget, 40);
    st.context.presence = 'both';
    st.intents = ['plaisir'];
    var max = Math.max.apply(null, [1].concat(Object.keys(r.uni).map(function (k) { return r.uni[k]; })));
    Object.keys(r.uni).forEach(function (u) { if (C.data.uById[u]) st.deck.uniW[u] = Math.min(0.5, 0.5 * r.uni[u] / max); });
    st.deck.seed = U.arr(picks).map(function (p) { return p.s ? p.s.id : p; }).filter(function (id) { return C.data.sById[id]; });
    st.deck.seedFrom = 'test';
    st.source = 'test';
    return st;
  };
})(window);
