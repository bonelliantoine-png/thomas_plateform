/* Idées à vivre : sélection d'idées de sortie ou de cadeau par occasion, fiche idée, codes de partage #i=.
   Moteur pur (sans DOM), testable sous Node, déterministe à paramètres égaux.
   1. filtres durs (résultat en une heure, formats collectifs, cadre réglementaire, alcool, enfants, lieu, budget)
   2. score = Σ poids de l'occasion × attribut normalisé + bonus (goûts +0,25, mise en avant +0,15, envies +0,10, test +0,20)
   3. diversité MMR (λ = 0,7) par pages de 6 : 2 idées au plus par univers, au moins une nouveauté ≥ 0,6. */
(function (W) {
  'use strict';
  var C = W.Cordes, U = C.util;
  C.PUBLIC_URL = ''; // adresse publique de l'app (vide = mention masquée sur les cartes et bons)
  // périodes où « Idées à vivre » devient la porte principale de l'accueil (sinon le test)
  C.OCCASION_SEASONS = ['11-01:12-31', '02-01:02-14', '03-15:06-30'];
  C.IDEAS = { lambda: 0.7, uniPenalty: 0.08, perUni: 2, page: 6, bonus: { taste: 0.25, pin: 0.15, desire: 0.10, seed: 0.20 }, excludeDefault: ['securite', 'sante', 'animaux'] };
  C.IDEA_PEOPLE = [[1, '1'], [2, '2'], [3, '3-4'], [5, '5-8'], [9, '9+']];
  C.IDEA_BUDGETS = [[0, '0 €'], [20, '< 20 €'], [50, '< 50 €'], [100, '< 100 €'], ['any', 'peu importe']];
  C.IDEA_PLACES = [['home', 'chez soi'], ['out', 'dehors'], ['both', 'les deux']];
  C.IDEA_KIDS = [['3-6', '3-6 ans'], ['7-11', '7-11 ans'], ['12-17', '12-17 ans']];
  C.IDEA_OUT_SITES = ['wecandoo', 'airbnb-experiences', 'meetup', 'google-maps', 'eventbrite'];

  function md(d) { return ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  C.inSeason = function (ranges, date) {
    var t = md(date || new Date());
    return U.arr(ranges).some(function (r) { var p = String(r).split(':'); return p[0] <= p[1] ? (t >= p[0] && t <= p[1]) : (t >= p[0] || t <= p[1]); });
  };
  C.ideasPrimary = function (date) { return C.inSeason(C.OCCASION_SEASONS, date); };

  /* ---------- occasions : normalisation défensive ---------- */
  C.loadOccasions = function (raw) {
    var list = U.arr(raw || W.CORDES_OCCASIONS).filter(function (o) { return o && o.id; });
    if (!list.length) U.anomaly('occasions', 'CORDES_OCCASIONS absent ou vide');
    C.occasions = list.map(function (o) {
      var pins = U.arr(o.pins).filter(function (id) { if (!C.data.sById[id]) { U.anomaly('occasions', o.id + ' : compétence mise en avant inconnue « ' + id + ' », ignorée'); return false; } return true; });
      var people = U.num(o.people, 2);
      return {
        id: String(o.id), label: String(o.label || o.id), kicker: String(o.kicker || ''), intro: String(o.intro || ''),
        people: people >= 9 ? 9 : people >= 5 ? 5 : people >= 3 ? 3 : people >= 2 ? 2 : 1,
        budget: o.budget == null ? 'any' : U.num(o.budget, 50), place: ['home', 'out', 'both'].indexOf(o.place) >= 0 ? o.place : 'both',
        seasons: U.arr(o.seasons), w: o.w || { oneHour: 0.5, social: 0.5 }, exclude: U.arr(o.exclude).length ? U.arr(o.exclude) : C.IDEAS.excludeDefault,
        allowAlcohol: !!o.allowAlcohol, kidsSafe: !!o.kidsSafe, b2b: !!o.b2b, pins: pins
      };
    });
    C.occById = {}; C.occasions.forEach(function (o) { C.occById[o.id] = o; });
    var ex = W.CORDES_IDEAS_EXCLUDE || {};
    C.IDEAS.excludeDomains = U.arr(ex.domains); C.IDEAS.excludeSkills = U.arr(ex.skills);
    // univers les plus fréquents de la taxonomie (pour la « nouveauté »)
    var cnt = {}; C.data.skills.forEach(function (s) { cnt[s.universe] = (cnt[s.universe] || 0) + 1; });
    C.TOP_UNIVERSES = Object.keys(cnt).sort(function (a, b) { return cnt[b] - cnt[a] || (a < b ? -1 : 1); }).slice(0, 4);
    return C.occasions;
  };
  C.occasionsOrdered = function (date) {
    if (!C.occasions) C.loadOccasions();
    return C.occasions.map(function (o, i) { return { o: o, i: i, on: C.inSeason(o.seasons, date) }; })
      .sort(function (a, b) { return (b.on - a.on) || a.i - b.i; }).map(function (x) { x.o.inSeason = x.on; return x.o; });
  };

  /* ---------- options effectives ---------- */
  C.ideaOpts = function (occ, opts) {
    opts = opts || {};
    var o = {
      people: opts.people != null ? U.num(opts.people, occ.people) : occ.people,
      budget: opts.budget != null ? (opts.budget === 'any' ? 'any' : U.num(opts.budget, 50)) : occ.budget,
      place: opts.place || occ.place, zone: String(opts.zone || ''),
      tastes: U.arr(opts.tastes).filter(function (u) { return C.data.uById[u]; }).slice(0, 6),
      kids: opts.kids || null, seed: U.arr(opts.seed), desires: U.arr(opts.desires)
    };
    return o;
  };
  C.ideaTitle = function (s, occ, people) {
    var n = C.nm(s), suf = people >= 9 && occ && occ.b2b ? ' entre collègues' : people >= 3 ? ' en bande' : people === 2 ? ' à deux' : '';
    return 'Apprendre ' + n + suf;
  };

  /* ---------- filtres durs ---------- */
  C.ideaPasses = function (s, occ, o) {
    var a = s.attrs;
    if (C.IDEAS.excludeDomains && (C.IDEAS.excludeDomains.indexOf(s.domain) >= 0 || C.IDEAS.excludeSkills.indexOf(s.id) >= 0)) return false;
    if (!(a.oneHourResult === true || a.hoursToBasics <= 3)) return false;
    if (!s.formats.some(function (f) { return f === 'atelier' || f === 'evenement' || f === 'communaute' || f === 'cours'; })) return false;
    if (s.regulated && occ.exclude.indexOf(s.regulated) >= 0) return false;
    if (s.regulated === 'alcool' && !occ.allowAlcohol) return false;
    if (occ.kidsSafe && (s.regulated === 'enfants' || a.physical >= 3)) return false;
    if (occ.kidsSafe && o.kids === '3-6' && (a.intellectual >= 3 || a.cost >= 2)) return false;
    var homeOk = a.physical <= 2 && a.cost <= 2;
    if (o.place === 'home' && !homeOk) return false;
    if (o.budget !== 'any') {
      var share = Math.max(1, o.people);
      var homeBudgetOk = C.COST_RANGE[a.cost][0] / share <= o.budget;
      var outBudgetOk = C.priceRange(s.universe, 'atelier').lo <= o.budget * 1.2;
      if (o.place === 'home' && !homeBudgetOk) return false;
      if (o.place === 'out' && !outBudgetOk) return false;
      if (o.place === 'both' && !(homeBudgetOk && homeOk) && !outBudgetOk) return false;
    }
    return true;
  };

  /* ---------- score ---------- */
  var WHY = {
    social: 'à faire à plusieurs', creative: 'on repart avec une création à soi', physical: 'on bouge, ça défoule', intellectual: 'ça fait travailler la tête',
    trend: 'très en vogue en ce moment', demand: 'une valeur sûre', oneHour: 'résultat dès la première heure', cheap: 'presque rien à acheter',
    novelty: 'une idée que peu de gens ont', taste: 'colle à ses goûts', pin: 'un classique de cette occasion', desire: 'déjà dans tes envies', seed: 'proche de ta corde cachée'
  };
  C.ideaNovelty = function (s) { return U.clamp(1 - s.attrs.demand / 3 + (C.TOP_UNIVERSES.indexOf(s.universe) < 0 ? 0.3 : 0), 0, 1); };
  C.ideaScore = function (s, occ, o, mean) {
    var a = s.attrs, B = C.IDEAS.bonus;
    var val = {
      social: a.social / 3, creative: a.creative / 3, physical: a.physical / 3, intellectual: a.intellectual / 3,
      trend: U.clamp(a.trend / 3, 0, 1), demand: a.demand / 3, oneHour: a.oneHourResult ? 1 : 0, cheap: 1 - a.cost / 3, novelty: C.ideaNovelty(s)
    };
    var parts = {}, score = 0;
    Object.keys(occ.w).forEach(function (k) { if (val[k] == null) return; parts[k] = occ.w[k] * val[k]; score += parts[k]; });
    if (o.tastes.indexOf(s.universe) >= 0) { parts.taste = B.taste; score += B.taste; }
    if (occ.pins.indexOf(s.id) >= 0) { parts.pin = B.pin; score += B.pin; }
    if (o.desires.indexOf(s.id) >= 0) { parts.desire = B.desire; score += B.desire; }
    if (o.seed.indexOf(s.id) >= 0) { parts.seed = B.seed; score += B.seed; }
    // la raison affichée retient ce qui distingue l'idée des autres (écart à la moyenne des candidates)
    var dist = {}; Object.keys(parts).forEach(function (k) { dist[k] = parts[k] - (mean && mean[k] != null ? occ.w[k] * mean[k] : 0); });
    var top = Object.keys(dist).filter(function (k) { return dist[k] > 0; }).sort(function (x, y) { return dist[y] - dist[x] || (x < y ? -1 : 1); });
    if (!top.length) top = Object.keys(parts).sort(function (x, y) { return parts[y] - parts[x]; });
    var lab = function (k) { return k === 'cheap' && a.cost === 0 ? 'pas besoin de matériel' : k === 'novelty' && occ.id === 'offrir' ? 'rare et facile à offrir' : WHY[k]; };
    var why = top.slice(0, 2).map(lab).filter(Boolean);
    why = why.length ? why[0].charAt(0).toUpperCase() + why[0].slice(1) + (why[1] ? ', ' + why[1] : '') : '';
    return { score: score, parts: parts, why: why, novelty: val.novelty, val: val };
  };

  C.ideaBudgets = function (s, o) {
    var mat = C.COST_RANGE[s.attrs.cost], share = Math.max(1, U.num(o && o.people, 1));
    var r = C.priceRange(s.universe, 'atelier'), cf = C.cityFactor(o && o.zone ? o.zone : '');
    // à Paris, les fourchettes nationales sont majorées de 15 %
    var f = cf.f;
    return { home: { lo: Math.round(mat[0] / share), hi: Math.round(mat[1] / share) }, out: { lo: U.round5(r.lo * f), hi: U.round5(r.hi * f), fallback: r.fallback, paris: f > 1.1 } };
  };

  /* ---------- sélection ---------- */
  C.ideas = function (occasionId, opts) {
    if (!C.occasions) C.loadOccasions();
    var occ = C.occById[occasionId] || C.occasions[0];
    if (!occ) return { items: [], total: 0, occ: null };
    var o = C.ideaOpts(occ, opts), K = C.IDEAS;
    var cands = C.data.skills.filter(function (s) { return C.ideaPasses(s, occ, o); });
    var mean = {}; cands.forEach(function (s) { var v = C.ideaScore(s, occ, o).val; Object.keys(v).forEach(function (k) { mean[k] = (mean[k] || 0) + v[k] / cands.length; }); });
    var pool = cands.map(function (s) {
      var sc = C.ideaScore(s, occ, o, mean);
      return { s: s, score: sc.score, why: sc.why, novelty: sc.novelty, parts: sc.parts };
    }).sort(function (a, b) { return b.score - a.score || (a.s.id < b.s.id ? -1 : 1); }).slice(0, 90);
    var total = pool.length, out = [];
    var maxPages = Math.ceil(Math.min(pool.length, 36) / K.page);
    for (var p = 0; p < maxPages && pool.length; p++) {
      var page = [], uni = {};
      while (page.length < K.page && pool.length) {
        var ctx = out.slice(-3).map(function (x) { return x.s; }).concat(page.map(function (x) { return x.s; }));
        var best = null, bv = -1e9, bi = -1;
        pool.forEach(function (c, i) {
          if ((uni[c.s.universe] || 0) >= K.perUni) return;
          var red = 0, same = 0;
          ctx.forEach(function (r) { red = Math.max(red, C.sim(c.s, r)); if (r.universe === c.s.universe) same++; });
          var v = K.lambda * c.score - (1 - K.lambda) * red - K.uniPenalty * same;
          if (v > bv) { bv = v; best = c; bi = i; }
        });
        if (!best) break;
        page.push(best); pool.splice(bi, 1); uni[best.s.universe] = (uni[best.s.universe] || 0) + 1;
      }
      // au moins une nouveauté par page : la « découverte de niche »
      if (!page.some(function (x) { return x.novelty >= 0.6; })) {
        var nv = null, ni = -1;
        pool.forEach(function (c, i) { if (nv || c.novelty < 0.6) return; var u2 = {}; page.slice(0, -1).forEach(function (x) { u2[x.s.universe] = (u2[x.s.universe] || 0) + 1; }); if ((u2[c.s.universe] || 0) < K.perUni) { nv = c; ni = i; } });
        if (nv && page.length) { var dropped = page.pop(); pool.splice(ni, 1); pool.unshift(dropped); page.push(nv); }
      }
      out = out.concat(page);
    }
    var items = out.map(function (x) {
      var b = C.ideaBudgets(x.s, o);
      return { s: x.s, score: Math.round(x.score * 1000) / 1000, why: x.why, novelty: x.novelty, budgetHome: b.home, budgetOut: b.out,
        title: C.ideaTitle(x.s, occ, o.people), sub: 'À la fin : ' + U.lc(x.s.levels[0]), tags: x.s.tags.slice(0, 3), pinned: occ.pins.indexOf(x.s.id) >= 0 };
    });
    return { items: items, total: total, occ: occ, opts: o };
  };

  /* ---------- fiche idée ---------- */
  C.ideaSheet = function (id, opts) {
    var s = C.data.sById[id]; if (!s) return null;
    opts = opts || {};
    var city = opts.zone || '';
    var links = C.searchLinks(s, 'atelier', city, 'learn').filter(function (l) { return C.IDEA_OUT_SITES.indexOf(l.id) >= 0; })
      .sort(function (a, b) { return C.IDEA_OUT_SITES.indexOf(a.id) - C.IDEA_OUT_SITES.indexOf(b.id); }).slice(0, 5);
    var b = C.ideaBudgets(s, { people: opts.people || 1, zone: city });
    var nb = (C.neighbors[id] || []).map(function (n) { return C.data.sById[n.id]; }).filter(function (x) { return x && (x.attrs.oneHourResult || x.attrs.hoursToBasics <= 3); }).slice(0, 3);
    return {
      s: s, end: s.levels[0], further: [s.levels[1], s.levels[2]], hours: s.attrs.hoursToBasics, budgetHome: b.home, budgetOut: b.out,
      soft: s.soft.map(function (x) { return C.data.softById[x] && C.data.softById[x].name; }).filter(Boolean).slice(0, 3),
      links: links, home: C.firstStep({ context: { city: city } }, s, { formats: ['contenu'] }), neighbors: nb, regulated: s.regulated
    };
  };

  /* ---------- partage #i= ---------- */
  C.encodeIdeas = function (sel) {
    sel = sel || {};
    var o = { v: 1, o: String(sel.o || ''), ids: U.uniq(U.arr(sel.ids).filter(function (id) { return C.data.sById[id]; })).slice(0, 5) };
    if (sel.from) o.f = String(sel.from).slice(0, 40);
    if (sel.when) o.w = String(sel.when).slice(0, 60);
    return C.packCode(o);
  };
  // code tronqué ou illisible : null (jamais d'exception)
  C.decodeIdeas = function (code) {
    var p;
    try { p = C.unpackCode(code, 'i'); } catch (e) { return Promise.resolve(null); }
    return p.then(function (o) {
      if (!o || typeof o !== 'object') return null;
      var ids = U.arr(o.ids).filter(function (id) { return typeof id === 'string' && C.data.sById[id]; }).slice(0, 5);
      if (!ids.length) return null;
      if (!C.occasions) C.loadOccasions();
      return { o: C.occById[o.o] ? o.o : '', ids: ids, from: String(o.f || '').slice(0, 40), when: String(o.w || '').slice(0, 60) };
    }, function () { return null; });
  };
  C.ideasMessage = function (sel, link) {
    var n = U.arr(sel.ids).length, names = U.arr(sel.ids).map(function (id) { return C.nm(C.data.sById[id]); });
    var list = names.length > 1 ? names.slice(0, -1).join(', ') + ' ou ' + names[names.length - 1] : names.join('');
    return (sel.from ? sel.from + ' te propose ' : 'Je te propose ') + n + ' idée' + (n > 1 ? 's' : '') + ' pour ' + (sel.when || 'bientôt') + ' : ' + list + '. On vote ici : ' + (link || '');
  };
  C.voteMessage = function (id, from) { return 'Je vote ' + C.nm(C.data.sById[id]) + (from ? ', merci ' + from : '') + '.'; };
})(window);
