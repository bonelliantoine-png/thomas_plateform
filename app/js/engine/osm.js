/* Autour de moi : géocodage Nominatim (1 requête par seconde au plus, cache local, repli sur une table de villes)
   et lieux via l'API Overpass (requête around: construite depuis osmByUniverse et communityTypes[].osm). */
(function (W) {
  'use strict';
  var C = W.Cordes, U = C.util;
  var NOMINATIM = 'https://nominatim.openstreetmap.org/search';
  var OVERPASS = ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter'];
  // repli hors ligne : principales villes françaises (lat, lon)
  C.CITIES = {
    paris: [48.8566, 2.3522], marseille: [43.2965, 5.3698], lyon: [45.764, 4.8357], toulouse: [43.6047, 1.4442], nice: [43.7102, 7.262], nantes: [47.2184, -1.5536],
    montpellier: [43.6108, 3.8767], strasbourg: [48.5734, 7.7521], bordeaux: [44.8378, -0.5792], lille: [50.6292, 3.0573], rennes: [48.1173, -1.6778], reims: [49.2583, 4.0317],
    'saint etienne': [45.4397, 4.3872], toulon: [43.1242, 5.928], 'le havre': [49.4944, 0.1079], grenoble: [45.1885, 5.7245], dijon: [47.322, 5.0415], angers: [47.4784, -0.5632],
    nimes: [43.8367, 4.3601], villeurbanne: [45.7719, 4.8902], 'clermont ferrand': [45.7772, 3.087], 'le mans': [48.0061, 0.1996], 'aix en provence': [43.5297, 5.4474],
    brest: [48.3904, -4.4861], tours: [47.3941, 0.6848], amiens: [49.8941, 2.2958], limoges: [45.8336, 1.2611], annecy: [45.8992, 6.1294], perpignan: [42.6887, 2.8948],
    metz: [49.1193, 6.1757], besancon: [47.2378, 6.0241], orleans: [47.9029, 1.9093], rouen: [49.4432, 1.0999], caen: [49.1829, -0.3707], nancy: [48.6921, 6.1844],
    avignon: [43.9493, 4.8055], poitiers: [46.5802, 0.3404], 'la rochelle': [46.1603, -1.1511], pau: [43.2951, -0.3708], bayonne: [43.4929, -1.4748], ajaccio: [41.9192, 8.7386],
    montreuil: [48.8638, 2.4485], 'boulogne billancourt': [48.8397, 2.2399], versailles: [48.8049, 2.1204], 'saint denis': [48.9362, 2.3574], lorient: [47.7486, -3.3667], vannes: [47.6582, -2.7608]
  };
  var lastNominatim = 0;
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function fetchTimeout(url, opts, ms) {
    var ctl = typeof AbortController === 'function' ? new AbortController() : null;
    var t = setTimeout(function () { if (ctl) ctl.abort(); }, ms);
    if (ctl) opts = Object.assign({}, opts, { signal: ctl.signal });
    return fetch(url, opts).then(function (r) { clearTimeout(t); return r; }, function (e) { clearTimeout(t); if (e && e.name === 'AbortError') { var x = new Error('timeout'); x.code = 'timeout'; throw x; } throw e; });
  }
  function geoCache() { try { return JSON.parse(W.localStorage.getItem('cordes.geo') || '{}'); } catch (e) { return {}; } }

  C.geocode = function (city) {
    var key = U.norm(city);
    if (!key) return Promise.reject(new Error('Indiquer une ville.'));
    var cache = geoCache();
    if (cache[key]) return Promise.resolve(Object.assign({ source: 'cache' }, cache[key]));
    var wait = Math.max(0, 1100 - (Date.now() - lastNominatim));
    return sleep(wait).then(function () {
      lastNominatim = Date.now();
      // la politique de Nominatim demande d'identifier l'application ; un navigateur ne peut pas fixer User-Agent,
      // le Referer est envoyé quand la page est servie en http(s). Usage : une requête par recherche, cache local.
      var url = NOMINATIM + '?format=jsonv2&limit=1&addressdetails=0&accept-language=fr&countrycodes=fr,be,ch,lu&q=' + encodeURIComponent(city);
      return fetchTimeout(url, { headers: { 'Accept': 'application/json' } }, 12000);
    }).then(function (r) {
      if (!r.ok) { var e = new Error('Nominatim ' + r.status); e.code = r.status; throw e; }
      return r.json();
    }).then(function (j) {
      if (!j || !j.length) throw Object.assign(new Error('Ville introuvable'), { code: 'notfound' });
      var o = { lat: +j[0].lat, lon: +j[0].lon, label: j[0].display_name };
      cache[key] = o; try { W.localStorage.setItem('cordes.geo', JSON.stringify(cache)); } catch (e) { /* plein */ }
      return Object.assign({ source: 'nominatim' }, o);
    }).catch(function (err) {
      var fb = C.CITIES[key];
      if (fb) return { lat: fb[0], lon: fb[1], label: city, source: 'table', warning: err && err.code === 'notfound' ? '' : 'Géocodage en ligne indisponible, position approximative du centre-ville.' };
      throw err;
    });
  };

  var SEL_RE = /^(nwr|node|way|relation|nw|nr|wr)(\[[^\[\]]+\])+$/;
  C.osmSelectors = function (universes, side) {
    var out = [], seen = {};
    U.arr(universes).forEach(function (u) {
      U.arr(C.res.osmByUniverse[u]).forEach(function (x) {
        var q = x && (x.q || x.query); if (typeof q !== 'string') return;
        q = q.trim(); if (seen[q]) return;
        if (!SEL_RE.test(q)) { U.anomaly('resources', 'sélecteur OSM ignoré (forme inattendue) : ' + q); return; }
        seen[q] = 1; out.push({ q: q, label: x.label || q, universe: u });
      });
      C.res.communityTypes.forEach(function (c) {
        if (!C.matchUniverse(c.universes, u) || c.universes.indexOf('*') >= 0 && universes.length > 1) return;
        if (side && c.sides.indexOf(side) < 0) return;
        c.osm.forEach(function (q) {
          q = q.trim(); if (seen[q]) return;
          if (!SEL_RE.test(q)) { U.anomaly('resources', 'sélecteur OSM ignoré (forme inattendue) : ' + q); return; }
          seen[q] = 1; out.push({ q: q, label: c.name, universe: u, community: c.id });
        });
      });
    });
    return out.slice(0, 24);
  };
  C.overpassQuery = function (sels, lat, lon, radiusM) {
    var r = Math.round(U.clamp(radiusM, 200, 30000));
    var parts = sels.map(function (s) { return s.q + '(around:' + r + ',' + lat.toFixed(5) + ',' + lon.toFixed(5) + ');'; });
    return '[out:json][timeout:25];(' + parts.join('') + ');out center tags 120;';
  };
  function parseSel(q) {
    var conds = [], re = /\["?([^"=~!\]]+)"?(?:(=|~|!=)"?([^"\]]*)"?)?\]/g, m;
    while ((m = re.exec(q))) conds.push({ k: m[1], op: m[2] || 'has', v: m[3] });
    return conds;
  }
  function matches(tags, conds) {
    return conds.every(function (c) {
      var t = tags[c.k];
      if (c.op === 'has') return t != null;
      if (c.op === '=') return t === c.v;
      if (c.op === '!=') return t !== c.v;
      if (c.op === '~') { try { return t != null && new RegExp(c.v, 'i').test(t); } catch (e) { return false; } }
      return false;
    });
  }
  C.haversine = function (a, b, c, d) {
    var R = 6371, toR = Math.PI / 180, dLat = (c - a) * toR, dLon = (d - b) * toR;
    var x = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(a * toR) * Math.cos(c * toR) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return 2 * R * Math.asin(Math.sqrt(x));
  };
  C.parseOverpass = function (json, sels, lat, lon) {
    var parsed = sels.map(function (s) { return { s: s, c: parseSel(s.q) }; });
    var out = [];
    U.arr(json && json.elements).forEach(function (el) {
      var la = el.lat != null ? el.lat : el.center && el.center.lat, lo = el.lon != null ? el.lon : el.center && el.center.lon;
      if (la == null || lo == null) return;
      var tags = el.tags || {};
      var hit = parsed.filter(function (p) { return matches(tags, p.c); })[0];
      var name = tags.name || tags['name:fr'] || tags.operator || tags.brand;
      out.push({
        id: el.type + '/' + el.id, type: el.type, osmId: el.id, lat: la, lon: lo, name: name || (hit ? hit.s.label : 'Lieu sans nom'), unnamed: !name,
        category: hit ? hit.s.label : 'Autre', universe: hit ? hit.s.universe : null,
        dist: C.haversine(lat, lon, la, lo),
        address: [tags['addr:housenumber'], tags['addr:street'], tags['addr:city']].filter(Boolean).join(' '),
        website: tags.website || tags['contact:website'] || '', phone: tags.phone || tags['contact:phone'] || '', hours: tags.opening_hours || '',
        url: 'https://www.openstreetmap.org/' + el.type + '/' + el.id
      });
    });
    out.sort(function (a, b) { return (a.unnamed - b.unnamed) || a.dist - b.dist; });
    // les lieux nommés d'abord, triés par distance ; puis tri global par distance
    out.sort(function (a, b) { return a.dist - b.dist; });
    return out;
  };
  C.overpass = function (sels, lat, lon, radiusM) {
    if (!sels.length) return Promise.reject(Object.assign(new Error('Aucun type de lieu connu pour cette sélection.'), { code: 'nosel' }));
    var body = 'data=' + encodeURIComponent(C.overpassQuery(sels, lat, lon, radiusM));
    function attempt(i) {
      return fetchTimeout(OVERPASS[i], { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: body }, 30000)
        .then(function (r) {
          if (r.status === 429 || r.status === 504 || r.status === 503) { var e = new Error('Overpass saturé (' + r.status + ')'); e.code = r.status; throw e; }
          if (!r.ok) { var e2 = new Error('Overpass ' + r.status); e2.code = r.status; throw e2; }
          return r.json();
        }).then(function (j) { return { items: C.parseOverpass(j, sels, lat, lon), server: OVERPASS[i] }; })
        .catch(function (err) { if (i + 1 < OVERPASS.length) return sleep(800).then(function () { return attempt(i + 1); }); throw err; });
    }
    return attempt(0);
  };
  C.osmErrorText = function (err) {
    var c = err && err.code;
    if (c === 'timeout') return 'Le serveur OpenStreetMap n’a pas répondu à temps. Réessayer avec un rayon plus petit ou moins d’univers.';
    if (c === 429 || c === 503 || c === 504) return 'Le serveur Overpass est saturé. Réessayer dans une minute.';
    if (c === 'notfound') return 'Ville introuvable. Vérifier l’orthographe ou indiquer une ville voisine plus grande.';
    if (c === 'nosel') return err.message;
    return 'Recherche impossible pour le moment (réseau bloqué ou serveur indisponible). Les recherches préparées ci-dessous restent utilisables.';
  };
})(window);
