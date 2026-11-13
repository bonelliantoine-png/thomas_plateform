/* Plan d'apprentissage, où apprendre, recherches préparées, défi 30 jours, synthèses du bilan.
   heures = hoursToBasics × (facteur(cible) − facteur(niveau actuel)) ; semaines = heures / temps dispo par envie. */
(function (W) {
  'use strict';
  var C = W.Cordes, U = C.util;
  // hoursToBasics mène au niveau 2 : facteur relatif par niveau
  C.LEVEL_FACTOR = [0, 0.3, 1, 3, 7];
  C.COST_RANGE = [[0, 20], [20, 50], [50, 300], [300, 900]];
  C.FORMAT_DEFAULT_PRICES = { cours: [25, 50], atelier: [25, 55], stage: [80, 220], prestation: [150, 500], coaching: [45, 95], entreprise: [350, 1200], evenement: [10, 30], contenu: [8, 40], produit: [15, 70], communaute: [8, 30] };

  C.priceRange = function (uni, fmt) {
    var p = C.res.pricing[uni];
    var r = p && Array.isArray(p[fmt]) && p[fmt].length === 2 ? p[fmt] : null;
    if (!r) { U.anomaly('resources', 'pricing sans fourchette « ' + fmt + ' » (' + uni + ') : repli générique'); r = C.FORMAT_DEFAULT_PRICES[fmt] || [20, 50]; return { lo: r[0], hi: r[1], fallback: true }; }
    return { lo: U.num(r[0]), hi: U.num(r[1]), fallback: false };
  };

  function slug(x) { return U.norm(x).replace(/ /g, '-'); }
  function fmtPart(x, f) { if (f === 'slug') return slug(x); if (f === 'hashtag') return U.norm(x).replace(/ /g, ''); return encodeURIComponent(x); }
  C.searchLinks = function (s, intent, city, side) {
    var q = (s ? (typeof s === 'string' ? s : s.name) : '') + (intent ? ' ' + intent : '');
    return C.res.searchEngines.filter(function (e) { return !side || e.sides.indexOf(side) >= 0; }).map(function (e) {
      var qq = e.qFormat === 'hashtag' ? (s ? (typeof s === 'string' ? s : s.name) : q) : q;
      var url = e.url.replace(/\{q\}/g, fmtPart(qq, e.qFormat)).replace(/\{city\}/g, city ? fmtPart(city, e.cityFormat) : '');
      if (!city) url = url.replace(/\+(?=&|$|\/)/g, '').replace(/\/\/+$/, '/').replace(/france--\//, 'france/');
      return { id: e.id, name: e.name, url: url, q: q };
    });
  };

  C.learnPlan = function (st, id) {
    var s = C.data.sById[id]; if (!s) return null;
    var d = (st.desires && st.desires[id]) || {};
    var ctx = st.context || {};
    var cur = U.clamp((st.skills && st.skills[id] && st.skills[id].level) || 0, 0, 4);
    var target = U.clamp(d.target || 2, 1, 4);
    if (target <= cur) target = Math.min(4, cur + 1);
    var nb = Math.max(1, C.yesDesires(st).length);
    var hpw = Math.max(0.5, U.num(ctx.hoursPerWeek, 3) / Math.min(nb, 3));
    // l'envie prioritaire reçoit plus de temps
    if (d.priority === 1 && nb > 1) hpw *= 1.4;
    var hours = Math.round(s.attrs.hoursToBasics * (C.LEVEL_FACTOR[target] - C.LEVEL_FACTOR[cur]));
    hours = Math.max(2, hours);
    var weeks = Math.ceil(hours / hpw);
    var horizonW = { '1m': 4, '3m': 13, '12m': 52 }[d.horizon || '3m'] || 13;
    var fits = weeks <= horizonW;
    // budget : matériel de départ + séances encadrées selon le format préféré
    var mat = C.COST_RANGE[s.attrs.cost];
    var fmts = U.arr(d.formats).length ? d.formats : ['atelier'];
    var lessonFmt = fmts.indexOf('cours') >= 0 ? 'cours' : fmts.indexOf('atelier') >= 0 ? 'atelier' : fmts.indexOf('stage') >= 0 ? 'stage' : fmts.indexOf('communaute') >= 0 ? 'communaute' : null;
    var lesson = lessonFmt ? C.priceRange(s.universe, lessonFmt) : { lo: 0, hi: 0 };
    var lessonsPerMonth = lessonFmt === 'stage' ? 0.34 : lessonFmt === 'communaute' ? 1 : lessonFmt ? 2 : 0;
    var monthly = Math.round(lessonsPerMonth * (lesson.lo + lesson.hi) / 2);
    var months = Math.max(1, Math.round(weeks / 4.33));
    var total = Math.round(monthly * months + (mat[0] + mat[1]) / 2);
    var now = new Date();
    var reach = function (n) { return U.addDays(now, n); };
    var first = C.firstStep(st, s, d);
    var milestones = [
      { id: id + ':h1', when: reach(7), label: '1re heure', text: s.attrs.oneHourResult ? s.levels[0] : 'Découvrir le geste de base et repartir avec une liste de questions' },
      { id: id + ':m1', when: reach(30), label: '1er mois', text: cur >= 1 ? s.levels[Math.min(3, cur)] : (s.attrs.oneHourResult ? 'Refaire seul « ' + U.lc(s.levels[0]) + ' », sans aide' : s.levels[0]) },
      { id: id + ':m3', when: reach(Math.min(90, Math.max(45, weeks * 7))), label: weeks * 7 <= 90 ? 'Objectif' : '3 mois', text: weeks * 7 <= 90 ? s.levels[target - 1] : (target - 2 > cur && target - 2 >= 1 ? s.levels[target - 2] : 'À mi-chemin : ' + U.lc(s.levels[target - 1]) + ', avec de l\u2019aide') }
    ];
    if (weeks * 7 > 90) milestones.push({ id: id + ':goal', when: reach(weeks * 7), label: 'Objectif', text: s.levels[target - 1] });
    return {
      s: s, d: d, cur: cur, target: target, hours: hours, hpw: Math.round(hpw * 10) / 10, weeks: weeks, fits: fits, horizonW: horizonW,
      material: mat, lessonFmt: lessonFmt, lesson: lesson, monthly: monthly, total: total, months: months,
      overBudget: monthly > U.num(ctx.budgetPerMonth, 50) * 1.05,
      first: first, milestones: milestones, where: C.whereToLearn(st, s, d)
    };
  };

  C.firstStep = function (st, s, d) {
    var city = (st.context && st.context.city) || '';
    var fm = U.arr(d && d.formats);
    var ws = C.res.platforms.filter(function (p) { return p.sides.indexOf('learn') >= 0 && C.matchUniverse(p.universes, s.universe) && p.kinds.indexOf('atelier') >= 0 && p.universes.indexOf('*') < 0; });
    var apps = C.appsFor(s);
    var arch = st.style && st.style.archetype;
    if ((fm.indexOf('contenu') >= 0 || arch === 'autodidacte' || (st.context && st.context.presence === 'online')) && apps.length && s.attrs.online >= 2)
      return { text: 'Installer ' + apps[0].name + ' et pratiquer 20 minutes, deux soirs cette semaine', link: apps[0].url, label: apps[0].name };
    if (ws.length && (s.attrs.oneHourResult || fm.indexOf('atelier') >= 0 || fm.indexOf('stage') >= 0))
      return { text: 'Réserver un atelier découverte « ' + s.name + ' » sur ' + ws[0].name + (city ? ' à ' + city : ''), link: ws[0].url, label: ws[0].name };
    var com = C.res.communityTypes.filter(function (c) { return c.sides.indexOf('learn') >= 0 && C.matchUniverse(c.universes, s.universe) && c.universes.indexOf('*') < 0; });
    if (com.length && s.attrs.social >= 2)
      return { text: 'Repérer un(e) ' + C.nm(com[0]) + ' près de chez vous et y passer lors d’une séance ouverte', link: com[0].links[0] && com[0].links[0].url, label: com[0].name };
    if (apps.length && s.attrs.online >= 2)
      return { text: 'Faire 3 séances de 20 minutes avec ' + apps[0].name, link: apps[0].url, label: apps[0].name };
    var anyP = C.res.platforms.filter(function (p) { return p.sides.indexOf('learn') >= 0 && C.matchUniverse(p.universes, s.universe) && p.kinds.indexOf('cours') >= 0; })[0];
    if (anyP) return { text: 'Contacter 2 profs sur ' + anyP.name + ' et réserver une 1re heure d’essai', link: anyP.url, label: anyP.name };
    return { text: 'Regarder 3 tutoriels « ' + s.name + ' débutant » et noter le geste qui revient', link: '', label: '' };
  };

  C.appsFor = function (s) {
    var byDom = C.res.learningApps.filter(function (a) { return a.domains.indexOf(s.domain) >= 0; });
    var byU = C.res.learningApps.filter(function (a) { return byDom.indexOf(a) < 0 && a.universes.indexOf(s.universe) >= 0 && (!a.domains.length || a.domains.every(function (d) { return d.split('.')[0] !== s.universe; })); });
    return byDom.concat(byU);
  };

  C.whereToLearn = function (st, s, d) {
    var fm = U.arr(d && d.formats);
    var city = (st.context && st.context.city) || '';
    var plats = C.res.platforms.filter(function (p) { return p.sides.indexOf('learn') >= 0 && C.matchUniverse(p.universes, s.universe); })
      .map(function (p) {
        var kindFit = U.overlap(p.kinds, s.formats) > 0 ? 1 : 0.3;
        var prefFit = fm.length ? (U.overlap(p.kinds, fm) > 0 ? 1 : 0.4) : 0.7;
        var spec = p.universes.indexOf('*') >= 0 ? 0.75 : 1;
        var onlineFit = p.kinds.indexOf('contenu') >= 0 ? s.attrs.online / 3 : 1;
        return { p: p, score: kindFit * prefFit * spec * onlineFit * (0.5 + p.reach / 6) };
      }).filter(function (x) { return x.score > 0.12; }).sort(function (a, b) { return b.score - a.score; });
    var teachers = plats.filter(function (x) { return x.p.kinds.indexOf('cours') >= 0 || x.p.kinds.indexOf('coaching') >= 0; }).slice(0, 4);
    var workshops = plats.filter(function (x) { return U.overlap(x.p.kinds, ['atelier', 'stage', 'evenement']) > 0; }).slice(0, 4);
    var online = plats.filter(function (x) { return U.overlap(x.p.kinds, ['contenu', 'communaute']) > 0; }).slice(0, 3);
    var communities = C.res.communityTypes.filter(function (c) { return c.sides.indexOf('learn') >= 0 && C.matchUniverse(c.universes, s.universe); })
      .sort(function (a, b) { return (a.universes.indexOf('*') >= 0) - (b.universes.indexOf('*') >= 0); }).slice(0, 5);
    var networks = C.res.networks.filter(function (n) { return n.domains.indexOf(s.domain) >= 0 || C.matchUniverse(n.universes, s.universe); })
      .sort(function (a, b) { return (b.domains.indexOf(s.domain) >= 0) - (a.domains.indexOf(s.domain) >= 0); }).slice(0, 4);
    var projects = C.projectsFor([s], 3);
    return {
      teachers: teachers, workshops: workshops, online: online, apps: C.appsFor(s).slice(0, 4), communities: communities, networks: networks, projects: projects,
      searches: C.searchLinks(s, fm.indexOf('cours') >= 0 ? 'cours' : 'atelier débutant', city, 'learn')
    };
  };

  C.projectsFor = function (skills, n) {
    var tags = {}, unis = {}, idf = C.tagIdf || {};
    skills.forEach(function (s) { if (!s) return; s.tags.concat(U.norm(s.name).split(' ')).forEach(function (t) { tags[t] = (tags[t] || 0) + 1; }); unis[s.universe] = (unis[s.universe] || 0) + 1; });
    return C.res.projectTemplates.map(function (p) {
      var tagHit = 0; p.tags.forEach(function (t) { if (tags[t]) tagHit += Math.min(2, tags[t]) * (idf[t] == null ? 1 : Math.min(3, idf[t])) / 2; });
      var uniHit = 0; p.universes.forEach(function (u, i) { if (unis[u]) uniHit += (i === 0 ? 1 : 0.6) * Math.min(2, unis[u]); });
      return { p: p, score: tagHit * 1.2 + uniHit, tagHit: tagHit };
    }).filter(function (x) { return x.score > 0; }).sort(function (a, b) { return b.score - a.score; }).slice(0, n || 4);
  };

  /* ---------- défi 30 jours ---------- */
  C.challenge30 = function (st, id) {
    var s = C.data.sById[id]; if (!s) return [];
    var L = s.levels, t = s.tags, mins = s.attrs.hoursToBasics > 60 ? 25 : 15;
    var app = C.appsFor(s)[0];
    var T = [
      'Regarder 2 démonstrations ' + C.de(s) + ' et noter le geste qui revient',
      'Préparer le matériel minimum et le ranger à portée de main',
      mins + ' min : viser « ' + L[0].toLowerCase() + ' », même maladroitement',
      'Refaire la même chose qu’hier, en chronométrant',
      'Trouver 1 personne qui pratique et lui poser 3 questions',
      'Photographier ou filmer votre essai du jour',
      'Repos actif : lire ou écouter 20 min sur ' + (t[0] || C.nm(s))
    ];
    var T2 = [
      mins + ' min sur le point le plus difficile de la semaine dernière',
      'Copier un exemple réussi à l’identique',
      app ? '20 min sur ' + app.name : 'Suivre un tutoriel de niveau débutant jusqu’au bout',
      'Montrer votre progrès à un proche',
      mins + ' min en variant un seul paramètre (vitesse, outil, rythme)',
      'Chercher un atelier ou un club et noter un créneau',
      'Bilan : comparer avec la photo du jour 6'
    ];
    var T3 = [
      mins + ' min vers « ' + L[1].toLowerCase() + ' »',
      'Faire une séance avec quelqu’un (ami, club, atelier)',
      'Inventer votre propre variante',
      'Corriger un défaut repéré sur vos vidéos',
      mins * 2 + ' min de pratique libre',
      'Partager une réalisation en ligne ou en vrai',
      'Repos et rangement'
    ];
    var days = [];
    for (var i = 0; i < 30; i++) {
      var w = Math.floor(i / 7), k = i % 7, text;
      if (i === 29) text = 'Jour final : refaire l’exercice du jour 3 et mesurer la différence';
      else if (w === 0) text = T[k];
      else if (w === 1) text = T2[k];
      else if (w === 2) text = T3[k];
      else text = [mins + ' min vers « ' + L[1].toLowerCase() + ' »', 'Préparer une mini démonstration de 2 min', 'Réserver la suite : un cours, un atelier ou un stage', 'Montrer votre démonstration à quelqu’un', mins + ' min de pratique libre', 'Écrire ce que vous ferez le mois prochain', 'Repos et récupération'][k];
      days.push({ day: i + 1, id: 'c' + (i + 1), text: text, milestone: i === 6 || i === 13 || i === 20 || i === 29 });
    }
    return days;
  };

  /* ---------- synthèses ---------- */
  C.universeProfile = function (st) {
    var out = {};
    C.data.universes.forEach(function (u) { out[u.id] = { u: u, mastery: 0, desire: 0, count: 0 }; });
    Object.keys(st.skills || {}).forEach(function (id) {
      var s = C.data.sById[id], v = st.skills[id]; if (!s || !v || !v.level) return;
      out[s.universe].mastery += v.level; out[s.universe].count++;
    });
    (st.custom || []).forEach(function (c) { if (out[c.universe] && c.level) { out[c.universe].mastery += c.level; out[c.universe].count++; } });
    Object.keys(st.desires || {}).forEach(function (id) {
      var s = C.data.sById[id], d = st.desires[id]; if (!s || !d || d.verdict !== 'yes') return;
      out[s.universe].desire += 2 + (d.target || 2) * 0.5;
    });
    var maxM = 0, maxD = 0;
    Object.keys(out).forEach(function (k) { maxM = Math.max(maxM, out[k].mastery); maxD = Math.max(maxD, out[k].desire); });
    Object.keys(out).forEach(function (k) {
      // échelle racine : un univers avec une seule compétence reste visible
      out[k].m = maxM ? Math.sqrt(out[k].mastery / maxM) : 0;
      out[k].d = maxD ? Math.sqrt(out[k].desire / maxD) : 0;
    });
    return out;
  };

  C.softProfile = function (st) {
    var acc = {};
    Object.keys(st.skills || {}).forEach(function (id) {
      var s = C.data.sById[id], v = st.skills[id]; if (!s || !v || !v.level) return;
      s.soft.forEach(function (x) { acc[x] = acc[x] || { score: 0, from: [] }; acc[x].score += v.level; acc[x].from.push({ s: s, level: v.level }); });
    });
    var list = Object.keys(acc).map(function (k) { return { soft: C.data.softById[k], score: acc[k].score, from: acc[k].from.sort(function (a, b) { return b.level - a.level; }) }; });
    list.sort(function (a, b) { return b.score - a.score; });
    var max = list[0] ? list[0].score : 1;
    list.forEach(function (x) { x.rel = x.score / max; });
    return list;
  };

  C.shareable = function (st) {
    return Object.keys(st.skills || {}).filter(function (id) { return C.data.sById[id] && st.skills[id] && st.skills[id].level >= 3; })
      .map(function (id) {
        var s = C.data.sById[id];
        var fmt = s.formats.indexOf('atelier') >= 0 ? 'atelier' : s.formats.indexOf('cours') >= 0 ? 'cours' : s.formats[0];
        var r = C.priceRange(s.universe, fmt);
        var demandScore = s.attrs.demand * 0.5 + s.attrs.teachable * 0.3 + s.attrs.monetization * 0.2;
        return { s: s, level: st.skills[id].level, fmt: fmt, range: r, score: demandScore };
      }).sort(function (a, b) { return b.score - a.score || b.level - a.level; });
  };

  C.cvSection = function (st) {
    var soft = C.softProfile(st).slice(0, 4).map(function (x) { return C.nm(x.soft); });
    var top = Object.keys(st.skills || {}).filter(function (id) { return C.data.sById[id] && st.skills[id].level >= 2; })
      .sort(function (a, b) { return st.skills[b].level - st.skills[a].level; }).slice(0, 6).map(function (id) {
        var s = C.data.sById[id], v = st.skills[id];
        return s.name + ' (' + C.LEVELS[v.level].toLowerCase() + (v.years ? ', ' + v.years + ' ans' : '') + ')';
      });
    var learning = C.yesDesires(st).slice(0, 3).map(function (id) { return C.nm(C.data.sById[id]); });
    var lines = [];
    if (top.length) lines.push('Centres d’intérêt et savoir-faire : ' + top.join(' · ') + '.');
    if (soft.length) lines.push('Compétences transverses développées par ces pratiques : ' + soft.join(', ') + '.');
    if (learning.length) lines.push('En apprentissage : ' + learning.join(', ') + '.');
    var teach = Object.keys(st.skills || {}).filter(function (id) { return st.skills[id].teach || st.skills[id].level >= 4; }).map(function (id) { return C.data.sById[id] && C.nm(C.data.sById[id]); }).filter(Boolean);
    if (teach.length) lines.push('Transmission : anime ou peut animer des séances de ' + teach.slice(0, 3).join(', ') + '.');
    return lines;
  };

  C.wishlist = function (st) {
    var city = (st.context && st.context.city) || '';
    return C.yesDesires(st).map(function (id) {
      var s = C.data.sById[id];
      var r = C.priceRange(s.universe, 'atelier');
      var ws = C.res.platforms.filter(function (p) { return p.sides.indexOf('learn') >= 0 && C.matchUniverse(p.universes, s.universe) && U.overlap(p.kinds, ['atelier', 'stage']) > 0; })
        .sort(function (a, b) { return (a.universes.indexOf('*') >= 0) - (b.universes.indexOf('*') >= 0) || b.reach - a.reach; }).slice(0, 3);
      return { s: s, range: r, links: ws, searches: C.searchLinks(s, 'atelier cadeau', city, 'learn').slice(0, 2) };
    });
  };
})(window);
