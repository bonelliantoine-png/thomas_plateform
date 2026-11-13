/* Croissance et étude : liste d'attente localisée (A1), données et consentement (A2), mesure d'audience sans cookie (A3),
   historique des bilans (A5), questionnaire de fin et test de prix (A6), comparaison de groupe (A7),
   compteur d'ouverture par quartier (A8), parcours lieu partenaire (A10).
   Tout reste dans le navigateur (localStorage, clés « cordes.* ») tant que les constantes d'envoi sont vides. */
(function (W) {
  'use strict';
  var C = W.Cordes, U = C.util;

  /* ---------- configuration (à renseigner pour la mise en ligne) ---------- */
  // URL d'un formulaire ou d'une API qui accepte un POST JSON (Formspree, Tally, Apps Script, Supabase…). Vide = aucun envoi.
  C.WAITLIST_ENDPOINT = '';
  // Mesure d'audience : provider « plausible » ou « umami », domaine du site, URL du script. Vide = événements gardés en local.
  C.ANALYTICS = { provider: '', domain: '', src: '', websiteId: '' };
  C.OPEN_GOAL = 50; // inscrits nécessaires pour ouvrir un quartier

  C.KEYS = {
    state: 'cordes.v1', backup: 'cordes.v1.backup', waitlist: 'cordes.waitlist', metrics: 'cordes.metrics', metricsDemo: 'cordes.metrics.demo',
    metricsOff: 'cordes.metrics.off', survey: 'cordes.survey', history: 'cordes.history', priceArm: 'cordes.priceArm', apikey: 'cordes.apikey', geo: 'cordes.geo', venue: 'cordes.venue', quiz: 'cordes.quiz', ideas: 'cordes.ideas'
  };
  var LS = {
    get: function (k, d) { try { var r = W.localStorage.getItem(k); return r == null ? d : JSON.parse(r); } catch (e) { return d; } },
    set: function (k, v) { try { W.localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } },
    del: function (k) { try { W.localStorage.removeItem(k); } catch (e) { /* rien */ } }
  };
  C.LS = LS;
  function uid() { return Date.now().toString(36) + Math.floor(Math.random() * 1e8).toString(36); }

  /* ---------- zones : arrondissements de Paris ou ville ---------- */
  C.PARIS_ARR = []; for (var a = 1; a <= 20; a++) C.PARIS_ARR.push(a === 1 ? '1er' : a + 'e');
  C.isParis = function (city) { var n = U.norm(city); return n === 'paris' || /^paris \d/.test(n) || /^75\d{3}$/.test(n); };
  // « Paris 11e » si un arrondissement est connu, sinon la ville telle que saisie
  C.zoneOf = function (city, arr) {
    city = String(city || '').trim();
    var m = U.norm(city).match(/^paris (\d{1,2})/) || U.norm(city).match(/^750(\d{2})$/);
    if (!arr && m) arr = +m[1] === 1 ? '1er' : (+m[1]) + 'e';
    if ((C.isParis(city) || (!city && arr)) && arr) return 'Paris ' + arr;
    if (C.isParis(city)) return 'Paris';
    return city ? city.charAt(0).toUpperCase() + city.slice(1) : '';
  };

  /* ---------- A1 · liste d'attente ---------- */
  C.ROLES = { apprendre: 'Apprendre', transmettre: 'Transmettre', lieu: 'Lieu partenaire' };
  C.waitlist = {
    list: function () { var l = LS.get(C.KEYS.waitlist, []); return Array.isArray(l) ? l : []; },
    // compétences pré-remplies : envies retenues et compétences de niveau 2 ou plus (de quoi animer au moins la découverte)
    prefill: function (st) {
      var wants = C.yesDesires(st || {}).slice(0, 8);
      var offers = Object.keys((st && st.skills) || {}).filter(function (id) { return st.skills[id] && C.topPalier(st.skills[id].level) >= 1 && C.data.sById[id]; })
        .sort(function (x, y) { return st.skills[y].level - st.skills[x].level; }).slice(0, 8);
      return { wants: wants, offers: offers };
    },
    validate: function (e) {
      var errs = [];
      if (!C.ROLES[e.role]) errs.push('Choisir un rôle');
      if (!e.zone) errs.push('Indiquer une ville ou un arrondissement');
      if (e.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e.email)) errs.push('E-mail invalide');
      if (!e.consent) errs.push('Cocher la case de consentement');
      return errs;
    },
    add: function (e) {
      var entry = Object.assign({ at: new Date().toISOString(), source: 'prototype', wants: [], offers: [] }, e);
      if (!entry.id) entry.id = uid();
      entry.consentAt = entry.consent ? (entry.consentAt || entry.at) : null;
      var l = C.waitlist.list().filter(function (x) { return x.id !== entry.id && !(entry.email && x.email === entry.email); });
      l.push(entry); LS.set(C.KEYS.waitlist, l);
      return entry;
    },
    remove: function (id) { LS.set(C.KEYS.waitlist, C.waitlist.list().filter(function (x) { return x.id !== id; })); },
    csv: function (list) {
      var cols = ['date', 'role', 'zone', 'email', 'envies', 'competences', 'lieu', 'consentement', 'source'];
      var esc = function (v) { v = String(v == null ? '' : v); return /[";,\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
      var names = function (ids) { return U.arr(ids).map(function (id) { var s = C.data.sById[id]; return s ? s.name : id; }).join(' | '); };
      var rows = (list || C.waitlist.list()).map(function (e) {
        return [e.at, C.ROLES[e.role] || e.role, e.zone, e.email || '', names(e.wants), names(e.offers), e.venue ? e.venue.name + ' (' + e.venue.type + ')' : '', e.consent ? 'oui ' + (e.consentAt || '') : 'non', e.source || ''].map(esc).join(';');
      });
      return '﻿' + cols.join(';') + '\r\n' + rows.join('\r\n') + (rows.length ? '\r\n' : '');
    },
    // envoi : POST JSON vers C.WAITLIST_ENDPOINT si renseigné, sinon rien ne sort de l'appareil
    send: function (entry, fetchFn) {
      var url = C.WAITLIST_ENDPOINT;
      if (!url) return Promise.resolve({ sent: false, reason: 'local' });
      var f = fetchFn || W.fetch;
      var body = { role: entry.role, zone: entry.zone, email: entry.email || '', wants: entry.wants, offers: entry.offers, venue: entry.venue || null, consent: !!entry.consent, consentAt: entry.consentAt, at: entry.at, source: entry.source };
      return f(url, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(body) })
        .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return { sent: true }; });
    }
  };

  /* ---------- A8 · compteur d'ouverture par quartier ---------- */
  // valeur de démonstration déterministe par zone (9 à 38), toujours affichée comme telle
  C.quarterCount = function (zone) {
    zone = zone || 'Paris 11e';
    var local = C.waitlist.list().filter(function (e) { return U.norm(e.zone) === U.norm(zone); }).length;
    var demo = 9 + Math.floor(U.hash('quartier|' + U.norm(zone)) * 30);
    var total = demo + local;
    return { zone: zone, local: local, demo: demo, total: total, goal: C.OPEN_GOAL, missing: Math.max(0, C.OPEN_GOAL - total), open: total >= C.OPEN_GOAL, pct: Math.min(1, total / C.OPEN_GOAL) };
  };
  C.zoneLabel = function (zone) { var m = String(zone || '').match(/^Paris (\d+)(er|e)$/); return m ? 'Le ' + m[1] + m[2] : String(zone || ''); };

  /* ---------- A3 · mesure d'audience anonyme ---------- */
  // identifiant de visite aléatoire, gardé le temps de l'onglet (sessionStorage), jamais relié à une personne
  var SESSION = (function () { try { var k = W.sessionStorage && W.sessionStorage.getItem('cordes.session'); if (!k) { k = uid(); W.sessionStorage.setItem('cordes.session', k); } return k; } catch (e) { return uid(); } })();
  C.metrics = {
    session: function () { return SESSION; },
    off: function () { return !!LS.get(C.KEYS.metricsOff, false); },
    setOff: function (b) { if (b) LS.set(C.KEYS.metricsOff, true); else LS.del(C.KEYS.metricsOff); },
    events: function (src) { var l = LS.get(src === 'demo' ? C.KEYS.metricsDemo : C.KEYS.metrics, []); return Array.isArray(l) ? l : []; },
    clear: function (src) { LS.del(src === 'demo' ? C.KEYS.metricsDemo : C.KEYS.metrics); }
  };
  // aucune donnée personnelle : nom d'événement, horodatage, identifiant de visite aléatoire, quelques propriétés fermées
  C.track = function (name, props) {
    if (C.metrics.off()) return false;
    var ev = { e: String(name), t: Date.now(), s: SESSION };
    if (props && typeof props === 'object') ev.p = props;
    var l = C.metrics.events();
    l.push(ev); if (l.length > 3000) l = l.slice(l.length - 3000);
    LS.set(C.KEYS.metrics, l);
    try {
      var A = C.ANALYTICS;
      if (A.provider === 'plausible' && typeof W.plausible === 'function') W.plausible(name, { props: props || {} });
      else if (A.provider === 'umami' && W.umami && typeof W.umami.track === 'function') W.umami.track(name, props || {});
    } catch (e) { /* le service externe ne doit jamais bloquer l'app */ }
    return true;
  };
  // charge le script du service de mesure si configuré (sans cookie : Plausible et Umami)
  C.loadAnalytics = function () {
    var A = C.ANALYTICS; if (!A.provider || !A.src || C.metrics.off() || !W.document) return false;
    var sc = W.document.createElement('script'); sc.defer = true; sc.src = A.src;
    if (A.provider === 'plausible') sc.setAttribute('data-domain', A.domain);
    if (A.provider === 'umami') sc.setAttribute('data-website-id', A.websiteId);
    W.document.head.appendChild(sc); return true;
  };

  var isView = function (re) { return function (ev) { return ev.e === 'view' && ev.p && re.test(ev.p.r); }; };
  C.FUNNEL = [
    { id: 'visit', label: 'Visite', test: function () { return true; } },
    { id: 'start', label: 'Bilan commencé', test: function (ev) { return ev.e === 'start' || isView(/^bilan\//)(ev); } },
    { id: 'maitrise', label: 'Ce que je sais', test: isView(/^bilan\/maitrise/) },
    { id: 'envies', label: 'Envies ou forces', test: isView(/^bilan\/(envies|forces)/) },
    { id: 'results', label: 'Résultats', test: isView(/^(resultats|offre)$/) },
    { id: 'use', label: 'Partage ou export', test: function (ev) { return ev.e === 'use'; } },
    { id: 'survey', label: 'Questionnaire', test: function (ev) { return ev.e === 'survey'; } },
    { id: 'waitlist', label: 'Liste d’attente', test: function (ev) { return ev.e === 'waitlist'; } }
  ];
  // entonnoir des curieux : idées à vivre et test, jusqu'au bilan et à la liste d'attente
  var isE = function (re) { return function (ev) { return re.test(ev.e); }; };
  C.FUNNEL_CURIOUS = [
    { id: 'c-visit', label: 'Idées ou test ouverts', test: function (ev) { return /^(idees_open|test_start|idees_recv)$/.test(ev.e) || isView(/^(idees|test)/)(ev); } },
    { id: 'c-engage', label: 'Idée ajoutée ou test fini', test: isE(/^(idees_add|test_done)$/) },
    { id: 'c-share', label: 'Partage ou bon cadeau', test: isE(/^(idees_share|idees_gift|test_share)$/) },
    { id: 'c-bilan', label: 'Bilan démarré', test: function (ev) { return /^(idees_to_bilan|test_to_bilan)$/.test(ev.e) || ev.e === 'start'; } },
    { id: 'c-wait', label: 'Liste d’attente', test: function (ev) { return ev.e === 'waitlist' || /^(idees_to_waitlist|test_to_waitlist)$/.test(ev.e); } }
  ];
  function median(a) { if (!a.length) return 0; a = a.slice().sort(function (x, y) { return x - y; }); var m = Math.floor(a.length / 2); return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2; }
  C.metricsReport = function (events) {
    var bySess = {};
    events.forEach(function (ev) { if (ev && ev.s) (bySess[ev.s] = bySess[ev.s] || []).push(ev); });
    var sess = Object.keys(bySess);
    sess.forEach(function (k) { bySess[k].sort(function (a, b) { return a.t - b.t; }); });
    var mkFunnel = function (def) {
      var fl = def.map(function (f) { return { id: f.id, label: f.label, n: sess.filter(function (k) { return bySess[k].some(f.test); }).length }; });
      fl.forEach(function (f, i) { f.rate = fl[0].n ? f.n / fl[0].n : 0; f.conv = i && fl[i - 1].n ? f.n / fl[i - 1].n : (i ? 0 : 1); });
      return fl;
    };
    var funnel = mkFunnel(C.FUNNEL), curious = mkFunnel(C.FUNNEL_CURIOUS);
    // coefficient viral estimé : ouvertures de liens reçus (#i=, #t=) rapportées aux partages
    var nShare = events.filter(function (ev) { return /^(idees_share|test_share|test_compare)$/.test(ev.e); }).length;
    var nRecv = events.filter(function (ev) { return /^(idees_recv|test_recv)$/.test(ev.e); }).length;
    var viral = { shares: nShare, opens: nRecv, k: nShare ? nRecv / nShare : null };
    // temps passé par écran : écart jusqu'à l'événement suivant de la même visite (plafonné à 30 min)
    var dur = {};
    sess.forEach(function (k) {
      var l = bySess[k];
      l.forEach(function (ev, i) {
        if (ev.e !== 'view' || !ev.p || !l[i + 1]) return;
        var r = ev.p.r.replace(/^bilan\//, 'bilan · ');
        var d = Math.min(1800, (l[i + 1].t - ev.t) / 1000);
        if (d > 0) (dur[r] = dur[r] || []).push(d);
      });
    });
    var durations = Object.keys(dur).map(function (r) { return { route: r, n: dur[r].length, median: median(dur[r]), total: dur[r].reduce(function (a, b) { return a + b; }, 0) }; })
      .sort(function (a, b) { return b.total - a.total; });
    var sessionLen = sess.map(function (k) { var l = bySess[k]; return (l[l.length - 1].t - l[0].t) / 1000; });
    var counts = {};
    events.forEach(function (ev) { var k = ev.e === 'use' && ev.p ? 'use:' + ev.p.k : ev.e === 'start' && ev.p ? 'start:' + ev.p.m : ev.e; if (ev.e !== 'view') counts[k] = (counts[k] || 0) + 1; });
    var survey = C.surveyReport(events.filter(function (ev) { return ev.e === 'survey' && ev.p; }).map(function (ev) { return ev.p; }));
    var first = events.length ? Math.min.apply(null, events.map(function (e) { return e.t; })) : null, last = events.length ? Math.max.apply(null, events.map(function (e) { return e.t; })) : null;
    return { events: events.length, sessions: sess.length, funnel: funnel, curious: curious, viral: viral, durations: durations, medianSession: median(sessionLen), counts: counts, survey: survey, first: first, last: last };
  };
  C.metricsCSV = function (events) {
    return 'horodatage;visite;evenement;proprietes\r\n' + events.map(function (ev) { return [new Date(ev.t).toISOString(), ev.s, ev.e, ev.p ? JSON.stringify(ev.p).replace(/;/g, ',') : ''].join(';'); }).join('\r\n') + '\r\n';
  };

  // données simulées pour la démonstration du tableau de bord (stockées à part, jamais mélangées aux vraies)
  C.simulateMetrics = function (n, seed) {
    n = n || 60; seed = seed || 'demo';
    var out = [], t0 = Date.now() - 21 * 86400000;
    // générateur pseudo-aléatoire reproductible (mulberry32)
    var rnd = (function () { var a = Math.floor(U.hash(seed) * 4294967295) >>> 0; return function () { a = (a + 0x6D2B79F5) >>> 0; var t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; })();
    var arms = [12, 15, 19];
    for (var k = 0; k < n; k++) {
      var s = 'demo-' + k, t = t0 + Math.floor(rnd() * 20 * 86400000), mode = rnd() < 0.62 ? 'learn' : rnd() < 0.6 ? 'offer' : 'both';
      var push = function (e, p, dt) { t += Math.round(dt * 1000); var ev = { e: e, t: t, s: s }; if (p) ev.p = p; out.push(ev); };
      push('view', { r: 'accueil' }, 0);
      // un tiers des visites passe d'abord par les idées à vivre ou le test (curieux)
      if (rnd() < 0.34) {
        var viaTest = rnd() < 0.45;
        if (rnd() < 0.3) push(viaTest ? 'test_recv' : 'idees_recv', { n: 3 }, 1);
        push('view', { r: viaTest ? 'test' : 'idees' }, 5);
        push(viaTest ? 'test_start' : 'idees_open', viaTest ? null : { o: ['offrir', 'amis', 'anniv', 'couple'][Math.floor(rnd() * 4)] }, 3);
        if (rnd() < 0.3) continue;
        push(viaTest ? 'test_done' : 'idees_add', viaTest ? { profile: 'palais' } : { id: 'latte-art' }, 40 + rnd() * 40);
        if (rnd() < 0.55) push(viaTest ? 'test_share' : 'idees_share', { n: 3, via: 'copie' }, 20 + rnd() * 30);
        if (rnd() < 0.55) continue;
        push(viaTest ? 'test_to_bilan' : 'idees_to_bilan', null, 10);
      } else if (rnd() < 0.24) continue;
      push('start', { m: mode }, 20 + rnd() * 40);
      push('view', { r: 'bilan/contexte' }, 1);
      if (rnd() < 0.1) continue;
      push('view', { r: 'bilan/maitrise' }, 40 + rnd() * 50);
      if (rnd() < 0.16) continue;
      push('view', { r: mode === 'offer' ? 'bilan/forces' : 'bilan/envies' }, 120 + rnd() * 120);
      if (rnd() < 0.18) continue;
      push('view', { r: mode === 'offer' ? 'bilan/offre' : 'bilan/affinage' }, 140 + rnd() * 200);
      push('view', { r: mode === 'offer' ? 'bilan/profil' : 'bilan/style' }, 60 + rnd() * 80);
      if (rnd() < 0.08) continue;
      push('view', { r: mode === 'offer' ? 'offre' : 'resultats' }, 50 + rnd() * 60);
      if (rnd() < 0.55) push('use', { k: ['share', 'passport', 'card', 'ics', 'json'][Math.floor(rnd() * 5)] }, 90 + rnd() * 200);
      if (rnd() < 0.45) {
        var arm = arms[Math.floor(rnd() * 3)], u = 2 + Math.floor(rnd() * 4), nps = Math.min(10, Math.max(0, Math.round(5 + u + (rnd() - 0.6) * 4)));
        var pay = rnd() < (arm === 12 ? 0.48 : arm === 15 ? 0.36 : 0.22) ? 'oui' : rnd() < 0.5 ? 'peut-etre' : 'non';
        push('survey', { u: u, nps: nps, int: rnd() < 0.55 ? 'oui' : rnd() < 0.6 ? 'peut-etre' : 'non', arm: arm, pay: pay }, 40 + rnd() * 60);
      }
      if (rnd() < 0.3) push('waitlist', { role: mode === 'offer' ? 'transmettre' : rnd() < 0.1 ? 'lieu' : 'apprendre' }, 30 + rnd() * 40);
    }
    LS.set(C.KEYS.metricsDemo, out);
    return out;
  };

  /* ---------- A6 · questionnaire de fin de bilan et test du prix ---------- */
  C.PRICE_ARMS = [12, 15, 19];
  // prix attribué au hasard une seule fois par appareil (test monadique : chaque répondant ne voit qu'un prix)
  C.priceArm = function () {
    var a = LS.get(C.KEYS.priceArm, null);
    if (C.PRICE_ARMS.indexOf(a) < 0) { a = C.PRICE_ARMS[Math.floor(Math.random() * C.PRICE_ARMS.length)]; LS.set(C.KEYS.priceArm, a); }
    return a;
  };
  C.survey = {
    list: function () { var l = LS.get(C.KEYS.survey, []); return Array.isArray(l) ? l : []; },
    save: function (ans) {
      var a = Object.assign({ at: new Date().toISOString(), arm: C.priceArm() }, ans);
      var l = C.survey.list(); l.push(a); LS.set(C.KEYS.survey, l);
      C.track('survey', { u: a.u, nps: a.nps, int: a.int, arm: a.arm, pay: a.pay, mode: a.mode });
      return a;
    },
    last: function () { var l = C.survey.list(); return l[l.length - 1] || null; }
  };
  C.surveyReport = function (answers) {
    var n = answers.length;
    var avgU = n ? answers.reduce(function (a, x) { return a + U.num(x.u); }, 0) / n : 0;
    var withNps = answers.filter(function (x) { return x.nps != null; });
    var pro = withNps.filter(function (x) { return x.nps >= 9; }).length, det = withNps.filter(function (x) { return x.nps <= 6; }).length;
    var nps = withNps.length ? Math.round((pro - det) / withNps.length * 100) : null;
    var dist = function (key, vals) { var o = {}; vals.forEach(function (v) { o[v] = answers.filter(function (x) { return x[key] === v; }).length; }); return o; };
    var arms = C.PRICE_ARMS.map(function (p) {
      var g = answers.filter(function (x) { return x.arm === p; });
      var yes = g.filter(function (x) { return x.pay === 'oui'; }).length, maybe = g.filter(function (x) { return x.pay === 'peut-etre'; }).length;
      return { price: p, n: g.length, yes: yes, maybe: maybe, no: g.length - yes - maybe, rate: g.length ? yes / g.length : 0, revenueIndex: g.length ? p * yes / g.length : 0 };
    });
    var best = arms.filter(function (a) { return a.n; }).sort(function (a, b) { return b.revenueIndex - a.revenueIndex; })[0] || null;
    return { n: n, avgUtility: avgU, nps: nps, promoters: pro, detractors: det, interest: dist('int', ['oui', 'peut-etre', 'non']), utility: dist('u', [1, 2, 3, 4, 5]), arms: arms, best: best };
  };

  /* ---------- A5 · historique des bilans ---------- */
  C.snapshot = function (st, label) {
    var skills = {}, desires = {}, done = [];
    Object.keys(st.skills || {}).forEach(function (id) { var v = st.skills[id]; if (v && v.level > 0) skills[id] = v.level; });
    Object.keys(st.desires || {}).forEach(function (id) { var d = st.desires[id]; if (!d) return; if (d.verdict === 'yes') desires[id] = U.clamp(d.target || 2, 1, C.LEVEL_MAX); else if (d.verdict === 'done') done.push(id); });
    var d0 = new Date();
    return { id: uid(), v: C.SCHEMA_VERSION, at: d0.toISOString(), label: label || ('Bilan du ' + U.dateShort(d0) + ' ' + d0.getFullYear()), mode: st.mode, name: (st.context && st.context.firstName) || '', skills: skills, desires: desires, done: done, arch: (st.style && st.style.archetype) || null };
  };
  C.history = {
    // les instantanés du schéma 1 (échelle 0 à 4) sont convertis à la lecture
    list: function () { var l = LS.get(C.KEYS.history, []); return Array.isArray(l) ? l.map(C.migrateSnapshot).sort(function (a, b) { return a.at < b.at ? -1 : 1; }) : []; },
    add: function (snap) { var l = C.history.list(); l.push(snap); LS.set(C.KEYS.history, l); return snap; },
    // un instantané par jour au plus : celui du jour est remplacé
    upsertToday: function (st) {
      var snap = C.snapshot(st), day = snap.at.slice(0, 10);
      var l = C.history.list().filter(function (x) { return x.at.slice(0, 10) !== day || x.manual; });
      l.push(snap); LS.set(C.KEYS.history, l); return snap;
    },
    remove: function (id) { LS.set(C.KEYS.history, C.history.list().filter(function (x) { return x.id !== id; })); },
    clear: function () { LS.del(C.KEYS.history); }
  };
  C.migrateSnapshot = function (x) {
    if (!x || typeof x !== 'object' || U.num(x.v, 1) >= 2) return x;
    Object.keys(x.skills || {}).forEach(function (id) { x.skills[id] = C.migrateLevel(x.skills[id]); });
    Object.keys(x.desires || {}).forEach(function (id) { x.desires[id] = C.migrateTarget(x.desires[id]); });
    x.v = C.SCHEMA_VERSION; return x;
  };
  // instantané fictif « il y a 3 mois » pour les profils de démonstration, clairement marqué
  C.demoPastSnapshot = function (st) {
    var now = C.snapshot(st), past = JSON.parse(JSON.stringify(now));
    past.id = 'demo-past'; past.demo = true;
    var d = U.addDays(new Date(), -96); past.at = d.toISOString(); past.label = 'Instantané fictif · ' + U.dateShort(d) + ' ' + d.getFullYear();
    var known = Object.keys(now.skills).sort(function (a, b) { return now.skills[b] - now.skills[a]; });
    // une compétence apprise depuis (envie réalisée), deux niveaux gagnés
    var learned = known.filter(function (id) { return now.skills[id] >= 2 && now.skills[id] <= 3; })[0];
    if (learned) { past.desires[learned] = now.skills[learned]; delete past.skills[learned]; }
    known.filter(function (id) { return id !== learned && now.skills[id] >= 2; }).slice(0, 2).forEach(function (id) { past.skills[id] = now.skills[id] - 1; });
    // une envie apparue depuis
    var cur = Object.keys(now.desires); if (cur.length > 1) delete past.desires[cur[cur.length - 1]];
    return past;
  };
  C.compareSnapshots = function (a, b) {
    var gained = [], newSkills = [], realized = [], newDesires = [], dropped = [], kept = [];
    Object.keys(b.skills).forEach(function (id) {
      if (!C.data.sById[id]) return;
      var was = a.skills[id] || 0, is = b.skills[id];
      if (!was) newSkills.push({ id: id, to: is }); else if (is > was) gained.push({ id: id, from: was, to: is });
    });
    Object.keys(a.desires).forEach(function (id) {
      if (!C.data.sById[id]) return;
      var lvl = b.skills[id] || 0;
      if (lvl >= a.desires[id] || U.arr(b.done).indexOf(id) >= 0) realized.push({ id: id, target: a.desires[id], level: lvl });
      else if (b.desires[id]) kept.push({ id: id, level: lvl, progress: (lvl - (a.skills[id] || 0)) });
      else dropped.push({ id: id });
    });
    Object.keys(b.desires).forEach(function (id) { if (!a.desires[id] && C.data.sById[id]) newDesires.push({ id: id }); });
    var levelsUp = gained.reduce(function (s, x) { return s + x.to - x.from; }, 0) + newSkills.reduce(function (s, x) { return s + x.to; }, 0);
    return { days: Math.max(0, Math.round((new Date(b.at) - new Date(a.at)) / 86400000)), gained: gained, newSkills: newSkills, realized: realized, newDesires: newDesires, dropped: dropped, kept: kept, levelsUp: levelsUp };
  };
  C.rebilanEvent = function (from) {
    var d = U.addDays(from || new Date(), 90);
    return { uid: 'cordes-rebilan', date: d, title: 'Refaire mon bilan Cordes', desc: 'Trois mois après : noter ce qui a bougé, cocher les envies réalisées, en choisir de nouvelles.\nOuvrir Cordes puis « Mes progrès ».', rrule: 'FREQ=MONTHLY;INTERVAL=3;COUNT=4' };
  };

  /* ---------- A7 · comparaison de groupe ---------- */
  C.groupCompare = function (members) {
    var n = members.length, M = [];
    for (var i = 0; i < n; i++) { M.push([]); for (var j = 0; j < n; j++) M[i].push(i === j ? null : C.troc(members[j].st, members[i].st).aFromB); }
    // M[i][j] = ce que i peut apprendre à j
    var count = function (field, min) {
      var o = {};
      members.forEach(function (m, i) {
        var src = field === 'skills' ? Object.keys(m.st.skills || {}).filter(function (id) { return m.st.skills[id].level >= min; }) : C.yesDesires(m.st);
        src.forEach(function (id) { if (C.data.sById[id]) (o[id] = o[id] || []).push(i); });
      });
      return Object.keys(o).filter(function (id) { return o[id].length >= 2; }).map(function (id) { return { id: id, who: o[id] }; }).sort(function (a, b) { return b.who.length - a.who.length; });
    };
    // qui anime quoi : pour chaque envie, le membre qui peut animer un palier pour le plus de membres (règle d'animation),
    // à égalité celui qui pratique la compétence exacte, puis le niveau le plus haut
    var cand = {};
    for (i = 0; i < n; i++) for (j = 0; j < n; j++) if (M[i][j]) M[i][j].forEach(function (x) {
      var w = cand[x.want] = cand[x.want] || {};
      var c = w[i] = w[i] || { want: x.want, teacher: i, via: x.via, level: x.level, exact: x.exact, learners: [], paliers: {} };
      if (c.learners.indexOf(j) < 0) c.learners.push(j);
      c.paliers[j] = x.palier;
      if (x.exact && !c.exact) { c.exact = true; c.via = x.via; c.level = x.level; }
    });
    var hostList = Object.keys(cand).map(function (w) {
      return Object.keys(cand[w]).map(function (k) { return cand[w][k]; }).sort(function (a, b) { return b.learners.length - a.learners.length || (b.exact - a.exact) || b.level - a.level; })[0];
    }).map(function (h) {
      var pals = U.uniq(h.learners.map(function (j) { return h.paliers[j]; })).sort();
      h.palier = pals[pals.length - 1]; h.paliersList = pals; return h;
    }).sort(function (a, b) { return b.learners.length - a.learners.length || b.level - a.level; });
    var commonSkills = count('skills', 2), commonWants = count('wants');
    var links = 0; for (i = 0; i < n; i++) for (j = 0; j < n; j++) if (M[i][j] && M[i][j].length) links++;
    var pool = commonWants.map(function (x) { return C.data.sById[x.id]; }).concat(hostList.slice(0, 4).map(function (h) { return C.data.sById[h.via]; }), commonSkills.map(function (x) { return C.data.sById[x.id]; }));
    var projects = C.projectsFor(pool.length ? pool : [].concat.apply([], members.map(function (m) { return Object.keys(m.st.skills).map(function (id) { return C.data.sById[id]; }); })).filter(Boolean), 4);
    var ideas = [];
    hostList.slice(0, 3).forEach(function (h) { ideas.push(members[h.teacher].name + ' (niveau ' + h.level + ') anime l’atelier de niveau ' + h.paliersList.join(' et ') + ' ' + C.de(C.data.sById[h.via]) + ' pour ' + h.learners.map(function (k) { return members[k].name; }).join(', ')); });
    commonWants.slice(0, 2).forEach(function (x) { ideas.push('Réserver à ' + x.who.length + ' un atelier découverte ' + C.de(C.data.sById[x.id]) + ' : ' + x.who.map(function (k) { return members[k].name; }).join(', ')); });
    if (hostList.length >= 3) ideas.push('Un cercle mensuel tournant : chaque mois, un membre transmet pendant une heure');
    return { n: n, matrix: M, links: links, density: n > 1 ? links / (n * (n - 1)) : 0, hosts: hostList, commonSkills: commonSkills, commonWants: commonWants, projects: projects, ideas: ideas };
  };

  // deux amis fictifs qui complètent les trois profils de démonstration pour la comparaison de groupe
  // niveaux sur l'échelle 0 à 5, choisis pour illustrer la règle (niveau n → ateliers de niveau n-1)
  C.GROUP_FRIENDS = [
    { id: 'yanis', name: 'Yanis', city: 'Lyon', skills: [['escalade-bloc', 3], ['chant-technique', 3], ['podcast', 4], ['randonnee-journee', 3]], desires: [['live-electronique', 2], ['pain-levain', 2], ['photo-smartphone', 2]] },
    { id: 'lea', name: 'Léa', city: 'Lyon', skills: [['poterie-tournage', 3], ['latte-art', 3], ['fermentation-lacto', 3], ['dessin-illustration', 4], ['eloquence', 3], ['anglais-conversation', 2]], desires: [['eloquence', 4], ['beatmaking', 3], ['anglais-conversation', 3], ['escalade-bloc', 2]] }
  ];
  C.buildFriend = function (id) {
    var f = C.GROUP_FRIENDS.filter(function (x) { return x.id === id; })[0]; if (!f) return null;
    var st = C.defaultState(); st.mode = 'both'; st.demo = 'ami-' + f.id; st.step = 'done';
    st.context.firstName = f.name; st.context.city = f.city;
    f.skills.forEach(function (r) { var id2 = C.resolve([r[0]]); if (id2) st.skills[id2] = { level: r[1], love: 2 }; });
    f.desires.forEach(function (r, i) { var id2 = C.resolve([r[0]]); if (id2 && (!st.skills[id2] || st.skills[id2].level < r[1])) st.desires[id2] = { verdict: 'yes', target: r[1], priority: i + 1, horizon: '3m', formats: ['atelier'], motive: [] }; });
    return st;
  };

  /* ---------- A10 · lieu partenaire ---------- */
  C.VENUE_TYPES = [['cafe', 'Café'], ['bar', 'Bar'], ['studio', 'Studio'], ['atelier', 'Atelier ou fab lab'], ['librairie', 'Librairie ou tiers-lieu'], ['autre', 'Autre lieu']];
  C.VENUE_EQUIP = [['tables', 'Grandes tables'], ['cuisine', 'Cuisine ou plan de travail'], ['evier', 'Point d’eau'], ['machine', 'Machine à café pro'], ['ecran', 'Écran ou projecteur'], ['sono', 'Sono'], ['piano', 'Piano ou instruments'], ['parquet', 'Parquet ou espace dégagé'], ['etabli', 'Établi et outils'], ['exterieur', 'Terrasse ou cour'], ['calme', 'Coin calme'], ['pmr', 'Accès PMR']];
  C.VENUE_FORMULAS = [
    ['creuse', 'Heure creuse contre consommation', 'Le lieu prête un créneau creux ; chaque participant consomme sur place. Aucun loyer, aucun engagement.'],
    ['membre', 'Avantage membre', 'Les membres Cordes ont une remise permanente chez vous ; le lieu gagne une clientèle de quartier fidèle.'],
    ['recette', 'Partage de recette', 'Une part du prix de chaque place revient au lieu, en plus des consommations.']
  ];
  C.VENUE_DAYS = ['lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.', 'dim.'];
  C.VENUE_MOMENTS = [['matin', 'Matin'], ['aprem', 'Après-midi'], ['soir', 'Soir']];
  var UNI_EQUIP = { cuisine: ['cuisine', 'evier', 'machine'], musique: ['sono', 'piano', 'calme'], image: ['tables', 'calme'], artisanat: ['tables', 'etabli', 'evier'], maison: ['etabli', 'tables'], nature: ['exterieur', 'evier'], sport: ['parquet', 'exterieur'], pleinair: ['exterieur'], scene: ['parquet', 'sono'], parole: ['tables', 'calme', 'ecran'], jeux: ['tables'], tech: ['ecran', 'tables'], bienetre: ['parquet', 'calme'], style: ['tables', 'evier'], savoirs: ['ecran', 'tables', 'calme'], pratique: ['tables'], social: ['tables'] };
  var TYPE_UNI = { cafe: ['cuisine', 'parole', 'jeux', 'image', 'social', 'savoirs', 'pratique'], bar: ['cuisine', 'jeux', 'musique', 'parole', 'social', 'scene'], studio: ['sport', 'scene', 'bienetre', 'musique'], atelier: ['artisanat', 'maison', 'tech', 'image', 'style'], librairie: ['parole', 'savoirs', 'jeux', 'image', 'social'], autre: [] };
  var SIGNATURE = ['machine', 'piano', 'etabli', 'parquet', 'cuisine', 'sono', 'exterieur', 'evier'];
  C.VENUE_TICKET = { cafe: 6, bar: 9, studio: 0, atelier: 0, librairie: 5, autre: 4 };
  C.defaultVenue = function () { return { name: '', type: 'cafe', city: '', arr: '', slots: [], capacity: 8, equip: ['tables'], formula: 'creuse', contact: '' }; };
  C.venueMatch = function (v, n) {
    var eq = U.arr(v.equip), tu = TYPE_UNI[v.type] || [];
    var big = eq.indexOf('parquet') >= 0 || eq.indexOf('exterieur') >= 0;
    var out = C.data.skills.map(function (s) {
      var a = s.attrs, need = UNI_EQUIP[s.universe] || [];
      if (a.physical >= 3 && !big) return null;
      if (s.regulated === 'alcool' && v.type !== 'bar') return null;
      if (s.regulated === 'securite' || s.regulated === 'animaux') return null;
      if (s.universe === 'pleinair' && eq.indexOf('exterieur') < 0) return null;
      if (U.overlap(s.formats, ['atelier', 'cours', 'communaute', 'evenement']) === 0) return null;
      var equipFit = need.length ? U.overlap(need, eq) / Math.min(2, need.length) : 0.5;
      if (s.domain === 'cuisine.cafe' && eq.indexOf('machine') >= 0) equipFit = 1.2;
      if (s.universe === 'cuisine' && s.domain !== 'cuisine.cafe' && eq.indexOf('cuisine') < 0 && s.attrs.cost >= 2) return null;
      var typeFit = tu.indexOf(s.universe) >= 0 ? 1 : 0.2;
      // équipement distinctif (machine à café, piano, établi, parquet…) : bonus, c'est ce qui rend le lieu unique
      var signature = U.overlap(need, U.arr(eq).filter(function (k) { return SIGNATURE.indexOf(k) >= 0; })) ? 0.1 : 0;
      if (s.domain === 'cuisine.cafe' && eq.indexOf('machine') >= 0) signature = 0.16;
      var score = 0.38 * Math.min(1, equipFit) + 0.24 * typeFit + 0.18 * a.demand / 3 + 0.1 * a.teachable / 3 + 0.06 * a.social / 3 + 0.04 * (a.oneHourResult ? 1 : 0) + signature;
      return { s: s, score: score };
    }).filter(function (x) { return x && x.score > 0.45; }).sort(function (x, y) { return y.score - x.score; });
    // diversité : 3 compétences au plus par univers
    var per = {}, res = [];
    out.forEach(function (x) { if ((per[x.s.universe] = (per[x.s.universe] || 0) + 1) <= 3 && res.length < (n || 10)) res.push(x); });
    var unis = {}; out.slice(0, 60).forEach(function (x) { unis[x.s.universe] = (unis[x.s.universe] || 0) + 1; });
    return { skills: res, universes: Object.keys(unis).sort(function (a, b) { return unis[b] - unis[a]; }).slice(0, 6), total: out.length };
  };
  // fréquentation : une séance par créneau creux, groupes de 2 à 8, remplissage prudent de 60 %
  C.venueEstimate = function (v) {
    var slots = U.arr(v.slots).length;
    var sessions = Math.min(slots, 10) * 4.33;
    var seats = U.clamp(Math.min(U.num(v.capacity, 8), 8), 2, 8);
    var visitors = Math.round(sessions * seats * 0.6);
    var ticket = C.VENUE_TICKET[v.type] == null ? 4 : C.VENUE_TICKET[v.type];
    var conso = Math.round(visitors * ticket);
    var share = v.formula === 'recette' ? Math.round(visitors * 12 * 0.15) : 0;
    var newClients = Math.round(visitors * 0.35);
    return { slots: slots, sessions: Math.round(sessions), seats: seats, visitors: visitors, ticket: ticket, conso: conso, share: share, revenue: conso + share, newClients: newClients };
  };
  C.venueSheet = function (v) {
    var m = C.venueMatch(v, 8), e = C.venueEstimate(v);
    var type = (C.VENUE_TYPES.filter(function (t) { return t[0] === v.type; })[0] || ['', 'Lieu'])[1];
    var f = (C.VENUE_FORMULAS.filter(function (x) { return x[0] === v.formula; })[0] || C.VENUE_FORMULAS[0]);
    var slots = U.arr(v.slots).map(function (k) { var p = k.split(':'); return C.VENUE_DAYS[+p[0]] + ' ' + (C.VENUE_MOMENTS.filter(function (x) { return x[0] === p[1]; })[0] || ['', p[1]])[1].toLowerCase(); });
    var eq = U.arr(v.equip).map(function (k) { return (C.VENUE_EQUIP.filter(function (x) { return x[0] === k; })[0] || ['', k])[1].toLowerCase(); });
    return [
      'FICHE LIEU PARTENAIRE · ' + (v.name || 'Mon lieu') + ' (' + type.toLowerCase() + ')',
      'Zone : ' + (C.zoneOf(v.city, v.arr) || 'à préciser'),
      'Créneaux creux : ' + (slots.join(', ') || 'à préciser'),
      'Capacité : ' + U.num(v.capacity, 8) + ' personnes · groupes Cordes de 2 à ' + e.seats,
      'Équipements : ' + (eq.join(', ') || 'à préciser'),
      'Formule souhaitée : ' + f[1] + '. ' + f[2],
      'Compétences compatibles : ' + m.skills.map(function (x) { return x.s.name; }).join(', '),
      'Estimation : ' + e.sessions + ' séances et environ ' + e.visitors + ' participants par mois, dont ' + e.newClients + ' nouveaux clients' + (e.ticket ? ', soit ' + U.eur(e.conso) + ' de consommations' : '') + (e.share ? ' et ' + U.eur(e.share) + ' de partage de recette' : '') + '.',
      'Hypothèses : une séance par créneau, 60 % de remplissage, ticket moyen ' + U.eur(e.ticket) + ', 35 % de premières visites.'
    ].join('\n');
  };

  /* ---------- A2 · données sur l'appareil ---------- */
  C.storedKeys = function () {
    var out = [];
    try { for (var i = 0; i < W.localStorage.length; i++) { var k = W.localStorage.key(i); if (k && k.indexOf('cordes.') === 0) out.push({ key: k, size: (W.localStorage.getItem(k) || '').length }); } } catch (e) { /* rien */ }
    return out.sort(function (a, b) { return a.key < b.key ? -1 : 1; });
  };
  C.KEY_LABELS = { 'cordes.v1': 'Votre bilan', 'cordes.v1.backup': 'Bilan mis de côté', 'cordes.waitlist': 'Inscriptions à la liste d’attente', 'cordes.metrics': 'Mesure d’audience anonyme', 'cordes.metrics.demo': 'Mesure simulée (démonstration)', 'cordes.metrics.off': 'Refus de la mesure', 'cordes.survey': 'Réponses au questionnaire', 'cordes.history': 'Historique des bilans', 'cordes.priceArm': 'Prix affiché au questionnaire', 'cordes.apikey': 'Clé du copilote IA', 'cordes.geo': 'Villes déjà localisées', 'cordes.venue': 'Fiche lieu partenaire', 'cordes.quiz': 'Test « Ta corde cachée » (réponses, résultat, défi)', 'cordes.ideas': 'Idées à vivre (sélection en cours)' };
  // export complet : toutes les clés « cordes.* », la clé d'API masquée
  C.exportAll = function () {
    var data = {};
    C.storedKeys().forEach(function (x) {
      var raw = W.localStorage.getItem(x.key);
      if (x.key === C.KEYS.apikey) { data[x.key] = raw ? 'masquée (' + raw.length + ' caractères)' : ''; return; }
      try { data[x.key] = JSON.parse(raw); } catch (e) { data[x.key] = raw; }
    });
    return JSON.stringify({ app: 'Cordes', format: 'cordes.export-complet.v1', exportedAt: new Date().toISOString(), note: 'Toutes les données que Cordes garde dans ce navigateur. La clé d’API est masquée.', data: data }, null, 2);
  };
  C.eraseAll = function () {
    var n = 0;
    C.storedKeys().forEach(function (x) { LS.del(x.key); n++; });
    try { if (W.sessionStorage) Object.keys(W.sessionStorage).forEach(function (k) { if (k.indexOf('cordes.') === 0) W.sessionStorage.removeItem(k); }); } catch (e) { /* rien */ }
    return n;
  };
})(window);
