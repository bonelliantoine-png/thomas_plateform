/* Paquet d'inspiration : score multi-critères, diversité MMR, apprentissage en ligne des verdicts.
   score(c) = 0.34·affinité + 0.20·contexte + 0.08·tendance + 0.12·exploration + 0.10·passerelle + 0.06·demande + appris(c)
   puis MMR : λ·score − (1−λ)·max sim(c, cartes récentes) − pénalité d'univers répété. */
(function (W) {
  'use strict';
  var C = W.Cordes, U = C.util;
  C.DECK = { w: { aff: 0.34, ctx: 0.20, trend: 0.08, explore: 0.12, bridge: 0.10, demand: 0.06 }, lambda: 0.72, uniPenalty: 0.07, learnYes: 0.06, learnNo: 0.05, learnUniYes: 0.05, learnUniNo: 0.07, seedBonus: 1 };

  function deckState(st) {
    st.deck = st.deck || {};
    st.deck.tagW = st.deck.tagW || {};
    st.deck.uniW = st.deck.uniW || {};
    st.deck.shown = st.deck.shown || [];
    return st.deck;
  }

  // ancres = compétences connues (pondérées par niveau et amour) + envies acceptées
  C.anchors = function (st) {
    var out = [];
    Object.keys(st.skills || {}).forEach(function (id) {
      var v = st.skills[id]; var s = C.data.sById[id]; if (!s || !v || !v.level) return;
      out.push({ s: s, w: 0.4 + 0.15 * v.level + 0.2 * U.num(v.love, 1) });
    });
    Object.keys(st.desires || {}).forEach(function (id) {
      var d = st.desires[id]; var s = C.data.sById[id]; if (!s || !d) return;
      if (d.verdict === 'yes') out.push({ s: s, w: 1.4, desire: true });
    });
    return out;
  };

  function contextFit(s, st) {
    var c = st.context || {}, a = s.attrs, intents = st.intents || [], f = 0, n = 0;
    var budget = U.num(c.budgetPerMonth, 50);
    var costCap = budget < 20 ? 0 : budget < 60 ? 1 : budget < 200 ? 2 : 3;
    f += a.cost <= costCap ? 1 : Math.max(0, 1 - 0.4 * (a.cost - costCap)); n++;
    var h = U.num(c.hoursPerWeek, 3);
    var weeks = a.hoursToBasics / Math.max(0.5, h);
    f += weeks <= 8 ? 1 : weeks <= 26 ? 0.7 : 0.35; n++;
    if (c.presence === 'online') { f += a.online / 3; n++; }
    else if (c.presence === 'local') { f += a.online <= 1 ? 1 : 0.7; n++; }
    if (intents.indexOf('rencontres') >= 0) { f += a.social / 3; n++; }
    if (intents.indexOf('defi') >= 0) { f += Math.max(a.intellectual, a.physical) / 3; n++; }
    if (intents.indexOf('plaisir') >= 0) { f += (a.oneHourResult ? 0.6 : 0.2) + a.creative / 7.5; n++; }
    if (intents.indexOf('equilibre') >= 0) { f += (s.universe === 'bienetre' || s.universe === 'nature' ? 1 : a.physical >= 2 ? 0.7 : 0.3); n++; }
    if (intents.indexOf('projets') >= 0) { f += a.social >= 2 ? 0.9 : 0.4; n++; }
    if (intents.indexOf('complement') >= 0 || intents.indexOf('activite') >= 0) { f += a.monetization / 3; n++; }
    return n ? f / n : 0.5;
  }

  C.scoreCandidate = function (s, st, anchors, ctx) {
    var w = C.DECK.w, dk = deckState(st);
    // affinité : moyenne pondérée des 3 meilleures similarités aux ancres
    var sims = anchors.map(function (an) { return { v: C.sim(s, an.s) * an.w, raw: C.sim(s, an.s), an: an }; });
    sims.sort(function (a, b) { return b.v - a.v; });
    var top = sims.slice(0, 3), aff = 0, tw = 0;
    top.forEach(function (x) { aff += x.raw * x.an.w; tw += x.an.w; });
    aff = tw ? aff / tw : 0.3;
    // passerelle : proche d'au moins deux ancres d'univers différents
    var uniNear = {}; sims.forEach(function (x) { if (x.raw > 0.42) uniNear[x.an.s.universe] = 1; });
    var bridge = Math.min(1, Math.max(0, Object.keys(uniNear).length - 1) / 2);
    if (uniNear[s.universe] && Object.keys(uniNear).length >= 2) bridge = Math.max(bridge, 0.6);
    // exploration : univers jamais touché + aléa reproductible
    var explore = (ctx.touched[s.universe] ? 0.25 : 1) * 0.7 + 0.3 * U.hash(s.id + ':' + (dk.shown.length >> 2));
    var cf = contextFit(s, st);
    var trend = (s.attrs.trend + 1) / 3;
    var learned = 0;
    s.tags.forEach(function (t) { learned += U.num(dk.tagW[t]); });
    learned = (s.tags.length ? learned / Math.sqrt(s.tags.length) : 0) + U.num(dk.uniW[s.universe]);
    learned = U.clamp(learned, -0.5, 0.4);
    // graines : idées retenues ou savoir-faire du test, proposés en premier (bonus de +1)
    var seeded = U.arr(dk.seed).indexOf(s.id) >= 0;
    var score = w.aff * aff + w.ctx * cf + w.trend * trend + w.explore * explore + w.bridge * bridge + w.demand * s.attrs.demand / 3 + learned + (seeded ? C.DECK.seedBonus : 0);
    // raison principale affichée sur la carte
    var reasons = [];
    if (seeded) reasons.push({ k: 'graine', t: dk.seedFrom === 'test' ? 'Issue de ta corde cachée' : 'Issue de vos idées à vivre' });
    if (top[0] && top[0].raw > 0.4) reasons.push({ k: 'voisine', t: 'Voisine de ' + top[0].an.s.name, why: C.simWhy(s, top[0].an.s) });
    if (bridge >= 0.6) reasons.push({ k: 'passerelle', t: 'Passerelle entre ' + Object.keys(uniNear).slice(0, 2).map(function (u) { return C.universe(u).short; }).join(' et ') });
    if (!ctx.touched[s.universe]) reasons.push({ k: 'nouveau', t: 'Nouvel univers · ' + C.universe(s.universe).short });
    if (s.attrs.trend >= 2) reasons.push({ k: 'tendance', t: 'Très en vogue' });
    if (s.attrs.oneHourResult) reasons.push({ k: 'heure', t: 'Résultat dès la 1re heure' });
    if (cf > 0.8) reasons.push({ k: 'contexte', t: 'Colle à votre budget et à votre temps' });
    if (learned > 0.08) reasons.push({ k: 'appris', t: 'Proche de vos « ça me tente »' });
    return { s: s, score: score, parts: { aff: aff, ctx: cf, trend: trend, explore: explore, bridge: bridge, learned: learned }, reasons: reasons };
  };

  // prochaine carte (ou n cartes) par MMR
  C.nextCards = function (st, n) {
    n = n || 1;
    var dk = deckState(st);
    var anchors = C.anchors(st);
    var touched = {};
    anchors.forEach(function (a) { touched[a.s.universe] = 1; });
    var seen = {};
    Object.keys(st.desires || {}).forEach(function (id) { seen[id] = 1; });
    Object.keys(st.skills || {}).forEach(function (id) { if (st.skills[id] && st.skills[id].level >= 2) seen[id] = 1; });
    var cands = C.data.skills.filter(function (s) { return !seen[s.id]; })
      .map(function (s) { return C.scoreCandidate(s, st, anchors, { touched: touched }); });
    cands.sort(function (a, b) { return b.score - a.score; });
    var pool = cands.slice(0, 60);
    var recent = dk.shown.slice(-6).map(function (id) { return C.data.sById[id]; }).filter(Boolean);
    var picked = [];
    while (picked.length < n && pool.length) {
      var best = null, bestV = -1e9, bi = -1;
      var ctxList = recent.concat(picked.map(function (p) { return p.s; }));
      pool.forEach(function (c, i) {
        var red = 0, sameU = 0;
        ctxList.forEach(function (r) { red = Math.max(red, C.sim(c.s, r)); if (r.universe === c.s.universe) sameU++; });
        var v = C.DECK.lambda * c.score - (1 - C.DECK.lambda) * red - C.DECK.uniPenalty * sameU;
        if (v > bestV) { bestV = v; best = c; bi = i; }
      });
      best.mmr = bestV;
      picked.push(best); pool.splice(bi, 1);
    }
    return picked;
  };

  // apprentissage en ligne : chaque verdict ajuste les poids de tags et d'univers
  C.applyVerdict = function (st, id, verdict) {
    var s = C.data.sById[id]; if (!s) return;
    var dk = deckState(st), K = C.DECK;
    st.desires = st.desires || {};
    if (verdict === 'yes') {
      s.tags.forEach(function (t) { dk.tagW[t] = U.num(dk.tagW[t]) + K.learnYes; });
      dk.uniW[s.universe] = U.num(dk.uniW[s.universe]) + K.learnUniYes;
      var prev = st.desires[id] || {};
      st.desires[id] = Object.assign({ target: 2, horizon: '3m', motive: [], formats: [] }, prev, { verdict: 'yes', priority: prev.priority || Object.keys(st.desires).filter(function (k) { return st.desires[k].verdict === 'yes'; }).length + 1 });
    } else if (verdict === 'no') {
      s.tags.forEach(function (t) { dk.tagW[t] = U.num(dk.tagW[t]) - K.learnNo; });
      dk.uniW[s.universe] = U.num(dk.uniW[s.universe]) - K.learnUniNo;
      st.desires[id] = { verdict: 'no' };
    } else if (verdict === 'done') {
      st.desires[id] = { verdict: 'done' };
      st.skills = st.skills || {};
      if (!st.skills[id] || !st.skills[id].level) st.skills[id] = { level: 1, love: 1 };
      s.tags.forEach(function (t) { dk.tagW[t] = U.num(dk.tagW[t]) + K.learnYes / 2; });
    }
    Object.keys(dk.tagW).forEach(function (t) { dk.tagW[t] = U.clamp(dk.tagW[t], -0.3, 0.3); });
    Object.keys(dk.uniW).forEach(function (u) { dk.uniW[u] = U.clamp(dk.uniW[u], -0.35, 0.25); });
    dk.shown.push(id);
    if (dk.shown.length > 400) dk.shown = dk.shown.slice(-400);
  };

  C.undoVerdict = function (st) {
    var dk = deckState(st); var id = dk.shown.pop(); if (!id) return null;
    var s = C.data.sById[id]; var d = st.desires && st.desires[id];
    if (s && d) {
      var K = C.DECK;
      if (d.verdict === 'yes') { s.tags.forEach(function (t) { dk.tagW[t] = U.num(dk.tagW[t]) - K.learnYes; }); dk.uniW[s.universe] = U.num(dk.uniW[s.universe]) - K.learnUniYes; }
      if (d.verdict === 'no') { s.tags.forEach(function (t) { dk.tagW[t] = U.num(dk.tagW[t]) + K.learnNo; }); dk.uniW[s.universe] = U.num(dk.uniW[s.universe]) + K.learnUniNo; }
      if (d.verdict === 'done' && st.skills[id] && st.skills[id].level === 1) delete st.skills[id];
      delete st.desires[id];
    }
    return id;
  };

  C.yesDesires = function (st) {
    var d = st.desires || {};
    return Object.keys(d).filter(function (id) { return d[id] && d[id].verdict === 'yes' && C.data.sById[id]; })
      .sort(function (a, b) { return U.num(d[a].priority, 99) - U.num(d[b].priority, 99); });
  };
})(window);
