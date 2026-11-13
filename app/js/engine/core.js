/* Cordes · noyau : espace de noms, utilitaires, normalisation défensive des données.
   Scripts classiques (file://), aucun module ES. */
(function (W) {
  'use strict';
  var C = W.Cordes = W.Cordes || {};
  C.version = '1.1.0';
  C.anomalies = [];

  /* ---------- utilitaires ---------- */
  var U = C.util = {};
  U.clamp = function (x, a, b) { x = +x; if (isNaN(x)) x = a; return Math.max(a, Math.min(b, x)); };
  U.num = function (x, d) { var n = +x; return isFinite(n) ? n : (d === undefined ? 0 : d); };
  U.arr = function (x) { return Array.isArray(x) ? x : (x == null ? [] : [x]); };
  U.uniq = function (a) { var s = {}, o = []; for (var i = 0; i < a.length; i++) { var k = a[i]; if (!s[k]) { s[k] = 1; o.push(k); } } return o; };
  U.norm = function (s) {
    return String(s == null ? '' : s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[œ]/g, 'oe').replace(/[æ]/g, 'ae').replace(/[^a-z0-9]+/g, ' ').trim();
  };
  U.esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  // minuscule initiale sauf sigle (DJ, IA, MAO)
  U.lc = function (s) { s = String(s || ''); return (s.length > 1 && s.charAt(1) === s.charAt(1).toUpperCase() && /[A-Z]/.test(s.charAt(1))) ? s : s.charAt(0).toLowerCase() + s.slice(1); };
  U.round5 = function (x) { return x < 20 ? Math.round(x) : Math.round(x / 5) * 5; };
  U.eur = function (x, dec) {
    x = U.num(x);
    var s = (dec ? x.toFixed(dec) : String(Math.round(x))).replace('.', ',');
    var parts = s.split(',');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return parts.join(',') + ' €';
  };
  U.fmt = function (x) { return String(Math.round(U.num(x))).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); };
  U.rate = function (r) { return String(Math.round(U.num(r) * 1000) / 10).replace('.', ',') + '\u00a0%'; };
  U.pct = function (x) { return Math.round(U.num(x) * 100) + ' %'; };
  // hachage déterministe (pour un aléa reproductible)
  U.hash = function (s) { var h = 2166136261; s = String(s); for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967295; };
  U.jaccard = function (a, b) {
    if (!a.length && !b.length) return 0;
    var s = {}, inter = 0, i; for (i = 0; i < a.length; i++) s[a[i]] = 1;
    var uni = a.length; for (i = 0; i < b.length; i++) { if (s[b[i]] === 1) { inter++; s[b[i]] = 2; } else if (!s[b[i]]) uni++; }
    return uni ? inter / uni : 0;
  };
  U.overlap = function (a, b) { var s = {}, n = 0; a.forEach(function (x) { s[x] = 1; }); b.forEach(function (x) { if (s[x]) n++; }); return n; };
  U.sortBy = function (a, f, desc) { return a.slice().sort(function (x, y) { var d = f(x) - f(y); return desc ? -d : d; }); };
  U.addDays = function (d, n) { var x = new Date(d.getTime()); x.setDate(x.getDate() + n); return x; };
  U.MONTHS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
  U.dateShort = function (d) { return d.getDate() + ' ' + U.MONTHS[d.getMonth()]; };
  U.anomaly = function (kind, msg) {
    var key = kind + '|' + msg;
    if (C._anomalyKeys && C._anomalyKeys[key]) return;
    C._anomalyKeys = C._anomalyKeys || {}; C._anomalyKeys[key] = 1;
    C.anomalies.push({ kind: kind, msg: msg });
  };

  /* ---------- listes fermées ---------- */
  C.FORMATS = {
    cours: 'Cours individuel', atelier: 'Atelier en petit groupe', stage: 'Stage intensif', prestation: 'Prestation',
    produit: 'Vente de créations', contenu: 'Contenu en ligne', coaching: 'Coaching suivi', evenement: 'Événement',
    entreprise: 'Entreprise', communaute: 'Club ou cercle'
  };
  C.FORMAT_IDS = Object.keys(C.FORMATS);
  /* ---------- échelle de maîtrise (0 à 5) et règle d'animation ----------
     Un atelier « de niveau k » amène du niveau k-1 au niveau k. Règle stricte : une personne de niveau n
     anime les ateliers de niveau n-1 (le niveau 1 n'anime pas ; le niveau 5 anime le niveau 4 et forme les hôtes).
     'below' : une personne de niveau n anime tout atelier de niveau inférieur à n. Non exposé à l'utilisateur. */
  C.TEACH_RULE = 'strict';
  C.LEVEL_MAX = 5;
  C.SCHEMA_VERSION = 2;
  C.LEVELS = ['Jamais pratiqué', 'Je découvre', 'Bases acquises', 'Je consolide', 'Je maîtrise', 'Référent'];
  C.LEVELS_SHORT = ['0', 'Découvre', 'Bases', 'Consolide', 'Maîtrise', 'Référent'];
  C.LEVEL_DESC = ['Rien encore', 'A fait une première séance, connaît les gestes de base', 'Fait seul un résultat simple et reproductible',
    'Régulier, varie, corrige ses erreurs', 'Résultat sûr et personnel, explique le pourquoi', 'Niveau avancé reconnu, crée ses méthodes'];
  // niveau requis pour animer l'atelier de niveau k (le minimum en mode « below »)
  C.hostLevel = function (k) { return Math.min(C.LEVEL_MAX, U.clamp(k, 1, C.LEVEL_MAX) + 1); };
  // une personne de niveau n peut-elle animer l'atelier de niveau k ?
  // le palier 5 (vers « référent ») n'a pas d'atelier au-dessus : il passe par la formation des hôtes, menée par un référent
  C.canAnimate = function (n, k) {
    n = U.num(n); k = U.num(k);
    if (k < 1 || k > C.LEVEL_MAX || n < 2) return false;
    if (k === C.LEVEL_MAX) return n === C.LEVEL_MAX;
    return C.TEACH_RULE === 'below' ? n >= k + 1 : n === k + 1;
  };
  C.palierName = function (k) { return k === 1 ? 'Atelier découverte' : k >= C.LEVEL_MAX ? 'Formation des hôtes' : 'Atelier de niveau ' + k; };
  // palier le plus haut qu'anime une personne de niveau n (0 si aucun)
  C.topPalier = function (n) { n = U.clamp(n, 0, C.LEVEL_MAX); return n >= 2 ? n - 1 : 0; };
  // paliers animés par une personne de niveau n
  C.animatedPaliers = function (n) { var t = C.topPalier(n), o = []; if (!t) return o; if (C.TEACH_RULE === 'below') { for (var k = 1; k <= t; k++) o.push(k); } else o.push(t); return o; };
  // paliers du chemin cur → target qu'une personne de niveau n peut animer
  C.paliersOnPath = function (n, cur, target) {
    var o = []; cur = U.clamp(cur, 0, C.LEVEL_MAX); target = U.clamp(target, 0, C.LEVEL_MAX);
    for (var k = cur + 1; k <= target; k++) if (C.canAnimate(n, k)) o.push(k);
    return o;
  };
  // « vous pouvez animer les ateliers de niveau 3 (Je consolide) »
  C.animateText = function (n) {
    var t = C.topPalier(n);
    if (!t) return n === 1 ? 'Au niveau 1, on n’anime pas encore : passer au niveau 2 pour animer la découverte' : '';
    var lab = function (k) { return 'niveau ' + k + ' (' + C.LEVELS[k] + ')'; };
    if (C.TEACH_RULE === 'below' && t > 1) return 'vous pouvez animer les ateliers de niveau 1 à ' + t + ', jusqu’au ' + lab(t);
    return 'vous pouvez animer les ateliers de ' + lab(t) + (n >= C.LEVEL_MAX ? ' et former les hôtes' : '');
  };
  // jalon observable du niveau k pour une compétence : 1 = première séance (générique), 2 à 5 = levels[0..3]
  C.milestone = function (s, k) {
    k = U.clamp(k, 0, C.LEVEL_MAX);
    if (!s || !k) return '';
    if (k === 1) return 'Première séance ' + C.de(s) + ' faite, gestes de base connus';
    return (s.levels && s.levels[k - 2]) || C.LEVEL_DESC[k];
  };
  // ancienne échelle (0 à 4 : un peu, débrouille, maîtrise, pourrait enseigner) vers la nouvelle (0 à 5)
  C.OLD_LEVEL_MAP = [0, 1, 2, 4, 4];
  C.migrateLevel = function (old) { old = Math.round(U.clamp(old, 0, 4)); return C.OLD_LEVEL_MAP[old]; };
  C.migrateTarget = function (old) { return Math.max(2, C.migrateLevel(old)); };
  C.REG_IDS = ['sport', 'alcool', 'alimentaire', 'enfants', 'sante', 'securite', 'animaux', 'droit'];
  C.ATTR_DEFAULTS = { social: 1, physical: 1, creative: 1, intellectual: 1, cost: 1, hoursToBasics: 20, oneHourResult: false, online: 1, demand: 1, monetization: 1, teachable: 2, trend: 0 };
  C.UNIVERSE_IDS = ['cuisine', 'musique', 'image', 'artisanat', 'maison', 'nature', 'sport', 'pleinair', 'scene', 'parole', 'jeux', 'tech', 'bienetre', 'style', 'savoirs', 'pratique', 'social'];
  var UNIVERSE_FALLBACK = {
    cuisine: ['Cuisine & boissons', 'Cuisine', 28], musique: ['Musique & son', 'Musique', 268], image: ['Arts visuels & image', 'Image', 318],
    artisanat: ['Artisanat & fait-main', 'Artisanat', 22], maison: ['Maison, bricolage & réparation', 'Maison', 40], nature: ['Nature, jardin & animaux', 'Nature', 110],
    sport: ['Sport & mouvement', 'Sport', 4], pleinair: ['Plein air & aventure', 'Plein air', 150], scene: ['Danse, scène & spectacle', 'Scène', 340],
    parole: ['Parole, langues & écriture', 'Parole', 200], jeux: ['Jeux & stratégie', 'Jeux', 52], tech: ['Numérique, tech & IA', 'Tech', 190],
    bienetre: ['Bien-être, corps & esprit', 'Bien-être', 170], style: ['Style, beauté & mode', 'Style', 300], savoirs: ['Culture, sciences & savoirs', 'Savoirs', 230],
    pratique: ['Vie pratique & débrouille', 'Pratique', 80], social: ['Lien social, animation & engagement', 'Social', 130]
  };
  var SOFT_FALLBACK = {
    patience: 'Patience', precision: 'Précision', creativite: 'Créativité', endurance: 'Endurance', coordination: 'Coordination', ecoute: 'Écoute',
    expression: 'Expression', memoire: 'Mémoire', logique: 'Logique', rigueur: 'Rigueur', audace: 'Audace', empathie: 'Empathie', leadership: 'Leadership',
    organisation: 'Organisation', observation: 'Observation', adaptation: 'Adaptation', pedagogie: 'Pédagogie', curiosite: 'Curiosité',
    'sens-esthetique': 'Sens esthétique', perseverance: 'Persévérance', cooperation: 'Coopération', autonomie: 'Autonomie'
  };

  /* ---------- normalisation ---------- */
  function str(x, d) { return (typeof x === 'string' && x.trim()) ? x.trim() : (d || ''); }

  C.loadData = function (rawData, rawRes) {
    C.anomalies = []; C._anomalyKeys = {};
    var D = rawData || { universes: [], domains: [], skills: [], softSkills: [] };
    var R = rawRes || {};
    if (!rawData) U.anomaly('data', 'CORDES_DATA absent : taxonomie vide');
    if (!rawRes) U.anomaly('data', 'CORDES_RESOURCES absent : ressources vides');

    // Univers
    var uById = {}, universes = [];
    U.arr(D.universes).forEach(function (u) {
      if (!u || !u.id) { U.anomaly('universe', 'univers sans id ignoré'); return; }
      if (uById[u.id]) { U.anomaly('universe', 'univers en double : ' + u.id); return; }
      var fb = UNIVERSE_FALLBACK[u.id] || [u.id, u.id, 200];
      var o = { id: u.id, name: str(u.name, fb[0]), short: str(u.short, fb[1]), hue: U.num(u.hue, fb[2]), desc: str(u.desc), glyph: str(u.glyph, '·') };
      uById[o.id] = o; universes.push(o);
    });
    C.UNIVERSE_IDS.forEach(function (id) {
      if (!uById[id]) {
        var fb = UNIVERSE_FALLBACK[id];
        U.anomaly('universe', 'univers manquant dans la taxonomie, recréé : ' + id);
        var o = { id: id, name: fb[0], short: fb[1], hue: fb[2], desc: '', glyph: '·', missing: true };
        uById[id] = o; universes.push(o);
      }
    });
    var order = {}; C.UNIVERSE_IDS.forEach(function (id, i) { order[id] = i; });
    universes.sort(function (a, b) { return (order[a.id] == null ? 99 : order[a.id]) - (order[b.id] == null ? 99 : order[b.id]); });

    // Domaines
    var dById = {}, domains = [];
    U.arr(D.domains).forEach(function (d) {
      if (!d || !d.id) return;
      if (dById[d.id]) { U.anomaly('domain', 'domaine en double : ' + d.id); return; }
      var uni = d.universe || String(d.id).split('.')[0];
      if (!uById[uni]) { U.anomaly('domain', 'domaine ' + d.id + ' rattaché à un univers inconnu : ' + uni); return; }
      var o = { id: d.id, universe: uni, name: str(d.name, d.id), desc: str(d.desc) };
      dById[o.id] = o; domains.push(o);
    });

    // Compétences transverses
    var softById = {}, soft = [];
    U.arr(D.softSkills).forEach(function (s) { if (s && s.id && !softById[s.id]) { softById[s.id] = { id: s.id, name: str(s.name, SOFT_FALLBACK[s.id] || s.id), desc: str(s.desc) }; soft.push(softById[s.id]); } });
    Object.keys(SOFT_FALLBACK).forEach(function (id) { if (!softById[id]) { softById[id] = { id: id, name: SOFT_FALLBACK[id], desc: '' }; soft.push(softById[id]); } });

    // Compétences
    var sById = {}, skills = [];
    U.arr(D.skills).forEach(function (s, idx) {
      if (!s || !s.id || !s.name) { U.anomaly('skill', 'compétence sans id ou nom ignorée (index ' + idx + ')'); return; }
      if (sById[s.id]) { U.anomaly('skill', 'id de compétence en double ignoré : ' + s.id); return; }
      var uni = s.universe;
      if (!uById[uni]) {
        var guess = s.domain ? String(s.domain).split('.')[0] : '';
        if (uById[guess]) { U.anomaly('skill', s.id + ' : univers inconnu « ' + uni + ' », déduit du domaine'); uni = guess; }
        else { U.anomaly('skill', s.id + ' : univers inconnu « ' + uni + ' », compétence ignorée'); return; }
      }
      var dom = s.domain;
      if (!dom || !dById[dom]) {
        if (dom) U.anomaly('skill', s.id + ' : domaine inconnu « ' + dom + ' »');
        var did = uni + '._autres';
        if (!dById[did]) { dById[did] = { id: did, universe: uni, name: 'Autres', desc: '' }; domains.push(dById[did]); }
        dom = did;
      }
      var a = s.attrs || {}, attrs = {};
      if (!s.attrs) U.anomaly('skill', s.id + ' : attrs absents, valeurs par défaut');
      Object.keys(C.ATTR_DEFAULTS).forEach(function (k) {
        var d = C.ATTR_DEFAULTS[k];
        if (k === 'oneHourResult') attrs[k] = typeof a[k] === 'boolean' ? a[k] : !!a[k];
        else if (k === 'hoursToBasics') attrs[k] = U.clamp(a[k] == null ? d : a[k], 1, 2000);
        else if (k === 'trend') attrs[k] = U.clamp(a[k] == null ? d : a[k], -1, 2);
        else attrs[k] = U.clamp(a[k] == null ? d : a[k], 0, 3);
      });
      var levels = U.arr(s.levels).filter(function (l) { return typeof l === 'string' && l.trim(); }).slice(0, 4);
      if (levels.length < 4) {
        if (s.levels) U.anomaly('skill', s.id + ' : ' + levels.length + ' jalons au lieu de 4, complétés');
        var gen = ['Premiers gestes de base', 'Se débrouiller seul', 'Pratique autonome et régulière', 'Capable de transmettre'];
        while (levels.length < 4) levels.push(gen[levels.length]);
      }
      var tags = U.uniq(U.arr(s.tags).filter(function (t) { return typeof t === 'string'; }).map(function (t) { return U.norm(t).replace(/ /g, '-'); }).filter(Boolean));
      var softs = U.arr(s.soft).filter(function (x) { if (!softById[x]) { U.anomaly('skill', s.id + ' : soft inconnu « ' + x + ' »'); return false; } return true; });
      var formats = U.arr(s.formats).filter(function (f) { if (!C.FORMATS[f]) { U.anomaly('skill', s.id + ' : format hors liste « ' + f + ' »'); return false; } return true; });
      if (!formats.length) formats = ['atelier', 'cours'];
      var reg = s.regulated || null;
      if (reg && C.REG_IDS.indexOf(reg) < 0) { U.anomaly('skill', s.id + ' : regulated inconnu « ' + reg + ' »'); }
      var o = {
        id: String(s.id), name: String(s.name), universe: uni, domain: dom,
        aliases: U.arr(s.aliases).filter(function (x) { return typeof x === 'string'; }),
        desc: str(s.desc), levels: levels, attrs: attrs, regulated: reg, tags: tags, soft: softs, formats: formats,
        related: U.arr(s.related).filter(function (x) { return typeof x === 'string'; })
      };
      var sh = o.name.replace(/\s*\([^)]*\)\s*/g, ' ').trim();
      if (sh.indexOf(' : ') > 1) sh = sh.split(' : ')[0];
      o.short = sh || o.name;
      o._search = U.norm([o.name, o.aliases.join(' '), o.tags.join(' '), o.desc].join(' '));
      o._name = U.norm(o.name);
      sById[o.id] = o; skills.push(o);
    });
    // related vers des ids inconnus
    var badRel = 0;
    skills.forEach(function (s) {
      s.related = U.uniq(s.related.filter(function (r) { if (!sById[r] || r === s.id) { badRel++; U.anomaly('related', s.id + ' → ' + r + ' (id inconnu)'); return false; } return true; }));
    });
    C.stats = { badRelated: badRel };

    var byUniverse = {}; universes.forEach(function (u) { byUniverse[u.id] = []; });
    skills.forEach(function (s) { byUniverse[s.universe].push(s); });
    universes.forEach(function (u) { if (!byUniverse[u.id].length) U.anomaly('universe', 'univers sans compétence : ' + u.id); });

    C.data = { universes: universes, uById: uById, domains: domains, dById: dById, skills: skills, sById: sById, soft: soft, softById: softById, byUniverse: byUniverse };
    C.res = C.normalizeResources(R);
    return C.data;
  };

  C.normalizeResources = function (R) {
    function list(name, req) {
      var a = U.arr(R[name]).filter(function (x) { return x && typeof x === 'object'; });
      if (!a.length) U.anomaly('resources', name + ' vide ou absent');
      return a.filter(function (x) { if (req && !x[req]) { U.anomaly('resources', name + ' : entrée sans ' + req + ' ignorée'); return false; } return true; });
    }
    function unis(x) { var u = U.arr(x.universes); return u.length ? u : ['*']; }
    var platforms = list('platforms', 'id').map(function (p) {
      var fee = p.fee && typeof p.fee === 'object' ? p.fee : { type: 'none' };
      if (!p.fee) U.anomaly('resources', 'plateforme ' + p.id + ' sans fee');
      return {
        id: p.id, name: str(p.name, p.id), url: str(p.url), sides: U.arr(p.sides).length ? U.arr(p.sides) : ['learn', 'offer'],
        kinds: U.arr(p.kinds), universes: unis(p), geo: str(p.geo, 'FR'), model: str(p.model), fee: fee, audience: str(p.audience),
        bestFor: str(p.bestFor), pros: U.arr(p.pros), cons: U.arr(p.cons), effort: U.clamp(p.effort == null ? 1 : p.effort, 0, 3),
        reach: U.clamp(p.reach == null ? 1 : p.reach, 0, 3), control: U.clamp(p.control == null ? 1 : p.control, 0, 3), verify: !!p.verify, note: str(p.note), sourceDate: str(p.sourceDate)
      };
    });
    var R2 = {
      updated: str(R.updated, ''),
      platforms: platforms,
      learningApps: list('learningApps', 'id').map(function (a) { return { id: a.id, name: str(a.name, a.id), url: str(a.url), universes: unis(a), domains: U.arr(a.domains), price: str(a.price), desc: str(a.desc) }; }),
      communityTypes: list('communityTypes', 'id').map(function (c) { return { id: c.id, name: str(c.name, c.id), desc: str(c.desc), universes: unis(c), sides: U.arr(c.sides).length ? U.arr(c.sides) : ['learn', 'offer'], howToFind: str(c.howToFind), links: U.arr(c.links).filter(function (l) { return l && l.url; }), osm: U.arr(c.osm).filter(function (q) { return typeof q === 'string'; }), paid: str(c.paid, 'mixed') }; }),
      networks: list('networks', 'id').map(function (n) { return { id: n.id, name: str(n.name, n.id), url: str(n.url), universes: unis(n), domains: U.arr(n.domains), desc: str(n.desc) }; }),
      osmByUniverse: (R.osmByUniverse && typeof R.osmByUniverse === 'object') ? R.osmByUniverse : {},
      statuses: list('statuses', 'id').map(function (s) { return { id: s.id, name: str(s.name, s.id), forWhat: str(s.forWhat), cost: str(s.cost), ceiling: str(s.ceiling), pros: U.arr(s.pros), cons: U.arr(s.cons), steps: U.arr(s.steps), fit: s.fit || {}, source: str(s.source), rate: s.rate, raw: s }; }),
      regulations: (R.regulations && typeof R.regulations === 'object') ? R.regulations : {},
      pricing: (R.pricing && typeof R.pricing === 'object') ? R.pricing : {},
      pricingUnits: (R.pricingUnits && typeof R.pricingUnits === 'object') ? R.pricingUnits : {},
      pricingNotes: typeof R.pricingNotes === 'string' ? R.pricingNotes : '',
      projectTemplates: list('projectTemplates', 'id').map(function (p) { return { id: p.id, name: str(p.name, p.id), desc: str(p.desc), universes: unis(p), tags: U.arr(p.tags).map(function (t) { return U.norm(t).replace(/ /g, '-'); }), size: U.arr(p.size).length === 2 ? p.size : [3, 8], weeks: U.num(p.weeks, 6), output: str(p.output), roles: U.arr(p.roles), steps: U.arr(p.steps), funding: U.arr(p.funding), paid: str(p.paid, 'mixed') }; }),
      searchEngines: list('searchEngines', 'url').map(function (e) { return { id: e.id || e.name, name: str(e.name, e.id), url: e.url, sides: U.arr(e.sides).length ? U.arr(e.sides) : ['learn', 'offer'] }; })
    };
    C.UNIVERSE_IDS.forEach(function (u) {
      if (!U.arr(R2.osmByUniverse[u]).length) U.anomaly('resources', 'osmByUniverse sans sélecteur pour ' + u);
      if (!R2.pricing[u]) U.anomaly('resources', 'pricing sans fourchette pour ' + u);
    });
    C.REG_IDS.forEach(function (r) { if (!R2.regulations[r]) U.anomaly('resources', 'regulations sans entrée pour ' + r); });
    return R2;
  };

  /* ---------- requêtes utiles ---------- */
  C.de = function (s) { var n = C.nm(s); return (/^[aeiouyhâàéèêîïôûœ]/i.test(n) ? 'd\u2019' : 'de ') + n; };
  C.nm = function (s) { return s ? U.lc(s.short || s.name) : ''; };
  C.skill = function (id) { return C.data && C.data.sById[id]; };
  C.universe = function (id) { return (C.data && C.data.uById[id]) || { id: id, name: id, short: id, hue: 200, glyph: '·' }; };
  C.hue = function (uid, l) { var u = C.universe(uid); return 'hsl(' + u.hue + ' 38% ' + (l || 62) + '%)'; };
  C.matchUniverse = function (list, uid) { list = U.arr(list); return list.indexOf('*') >= 0 || list.indexOf(uid) >= 0; };

  C.search = function (q, limit) {
    var n = U.norm(q); if (!n) return [];
    var words = n.split(' ');
    var out = [];
    C.data.skills.forEach(function (s) {
      var sc = 0;
      if (s._name === n) sc += 10;
      if (s._name.indexOf(n) === 0) sc += 6;
      else if (s._name.indexOf(n) >= 0) sc += 4;
      var all = true;
      words.forEach(function (w) { if (s._search.indexOf(w) >= 0) sc += 1; else all = false; });
      if (!all && sc < 4) return;
      if (sc > 0) out.push({ s: s, sc: sc });
    });
    out.sort(function (a, b) { return b.sc - a.sc || b.s.attrs.demand - a.s.attrs.demand; });
    return out.slice(0, limit || 30).map(function (x) { return x.s; });
  };

  // résout une liste de candidats (ids ou noms) vers un id de compétence existant
  C.resolve = function (cands, universe) {
    cands = U.arr(cands);
    for (var i = 0; i < cands.length; i++) if (C.data.sById[cands[i]]) return cands[i];
    for (i = 0; i < cands.length; i++) {
      var r = C.search(String(cands[i]).replace(/-/g, ' '), 5).filter(function (s) { return !universe || s.universe === universe; });
      if (r.length) return r[0].id;
    }
    if (universe && C.data.byUniverse[universe] && C.data.byUniverse[universe].length) {
      var pool = U.sortBy(C.data.byUniverse[universe], function (s) { return s.attrs.demand; }, true);
      var k = Math.floor(U.hash(cands.join('|')) * Math.min(pool.length, 6));
      return pool[k].id;
    }
    return null;
  };
})(window);
