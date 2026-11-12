/* État persistant (localStorage `cordes.v1`) et encodage compact du bilan pour le lien de partage `#b=`.
   Format : préfixe « z » = JSON compact compressé deflate-raw (CompressionStream), « j » = JSON compact, puis base64url. */
(function (W) {
  'use strict';
  var C = W.Cordes, U = C.util;
  var KEY = 'cordes.v1';
  C.STORAGE_KEY = KEY;

  C.defaultState = function () {
    var now = new Date().toISOString();
    return {
      version: 1, mode: null, createdAt: now, updatedAt: now, step: null,
      context: { firstName: '', city: '', lat: null, lon: null, radiusKm: 5, hoursPerWeek: 3, budgetPerMonth: 50, presence: 'both', ageBand: '' },
      intents: [], skills: {}, custom: [], desires: {}, style: { answers: {}, archetype: null },
      offer: { strong: [], goals: [], incomeTarget: 500, hoursPerWeek: 4, audiences: [], formats: [], assets: { material: false, venue: false, audience: 0, teachExp: 1 }, entrepreneur: {}, presence: 'both' },
      plan: { checked: {} }, challenge: { skill: null, checked: {} }, waitlist: null, deck: { tagW: {}, uniW: {}, shown: [] }
    };
  };
  C.mergeState = function (s) {
    var d = C.defaultState();
    if (!s || typeof s !== 'object') return d;
    var out = Object.assign({}, d, s);
    ['context', 'style', 'offer', 'plan', 'challenge', 'deck'].forEach(function (k) { out[k] = Object.assign({}, d[k], s[k] && typeof s[k] === 'object' ? s[k] : {}); });
    out.offer.assets = Object.assign({}, d.offer.assets, (s.offer && s.offer.assets) || {});
    out.skills = s.skills && typeof s.skills === 'object' ? s.skills : {};
    out.desires = s.desires && typeof s.desires === 'object' ? s.desires : {};
    out.custom = Array.isArray(s.custom) ? s.custom : [];
    out.intents = Array.isArray(s.intents) ? s.intents : [];
    return out;
  };
  C.loadState = function () {
    try { var raw = W.localStorage && W.localStorage.getItem(KEY); return raw ? C.mergeState(JSON.parse(raw)) : null; }
    catch (e) { return null; }
  };
  C.saveState = function (st) {
    st.updatedAt = new Date().toISOString();
    try { W.localStorage.setItem(KEY, JSON.stringify(st)); return true; } catch (e) { return false; }
  };
  C.clearState = function () { try { W.localStorage.removeItem(KEY); } catch (e) { /* rien */ } };

  /* ---------- encodage compact ---------- */
  var HZ = ['1m', '3m', '12m'];
  C.compact = function (st) {
    var o = { v: 1, m: st.mode || 'learn', n: (st.context && st.context.firstName) || '', c: (st.context && st.context.city) || '' };
    o.s = Object.keys(st.skills || {}).filter(function (id) { return st.skills[id] && st.skills[id].level > 0; }).map(function (id) { var v = st.skills[id]; return [id, v.level, v.teach ? 1 : 0, U.num(v.love, 1)]; });
    o.d = Object.keys(st.desires || {}).filter(function (id) { return st.desires[id] && st.desires[id].verdict === 'yes'; }).map(function (id) { var d = st.desires[id]; return [id, d.target || 2, d.priority || 9, Math.max(0, HZ.indexOf(d.horizon || '3m'))]; });
    if (st.style && st.style.archetype) o.a = st.style.archetype;
    if (st.custom && st.custom.length) o.k = st.custom.map(function (c) { return [c.name, c.universe, c.level]; });
    if (st.offer && (st.mode === 'offer' || st.mode === 'both')) o.o = { g: st.offer.goals || [], f: st.offer.formats || [], st: st.offer.strong || [] };
    return o;
  };
  C.expand = function (o) {
    var st = C.defaultState();
    if (!o || typeof o !== 'object') return st;
    st.mode = o.m || 'learn';
    st.context.firstName = String(o.n || '').slice(0, 40); st.context.city = String(o.c || '').slice(0, 60);
    U.arr(o.s).forEach(function (r) { if (Array.isArray(r) && C.data.sById[r[0]]) st.skills[r[0]] = { level: U.clamp(r[1], 0, 4), teach: !!r[2], love: U.clamp(r[3] == null ? 1 : r[3], 0, 3) }; });
    U.arr(o.d).forEach(function (r) { if (Array.isArray(r) && C.data.sById[r[0]]) st.desires[r[0]] = { verdict: 'yes', target: U.clamp(r[1], 1, 4), priority: U.num(r[2], 9), horizon: HZ[r[3]] || '3m', motive: [], formats: [] }; });
    if (o.a) st.style.archetype = String(o.a);
    U.arr(o.k).forEach(function (r) { if (Array.isArray(r)) st.custom.push({ id: 'x-' + U.norm(r[0]).replace(/ /g, '-'), name: String(r[0]).slice(0, 60), universe: C.data.uById[r[1]] ? r[1] : 'savoirs', level: U.clamp(r[2], 0, 4) }); });
    if (o.o) { st.offer.goals = U.arr(o.o.g); st.offer.formats = U.arr(o.o.f); st.offer.strong = U.arr(o.o.st).filter(function (id) { return C.data.sById[id]; }); }
    return st;
  };

  function b64urlFromBytes(bytes) {
    var bin = ''; for (var i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function bytesFromB64url(s) {
    s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '=';
    var bin = atob(s), out = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }
  function streamBytes(bytes, stream) {
    var rs = new Blob([bytes]).stream().pipeThrough(stream);
    return new Response(rs).arrayBuffer().then(function (b) { return new Uint8Array(b); });
  }
  C.encodeShare = function (st) {
    var json = JSON.stringify(C.compact(st));
    var bytes = new TextEncoder().encode(json);
    if (typeof W.CompressionStream === 'function') {
      try { return streamBytes(bytes, new W.CompressionStream('deflate-raw')).then(function (z) { return 'z' + b64urlFromBytes(z); }).catch(function () { return 'j' + b64urlFromBytes(bytes); }); }
      catch (e) { /* repli */ }
    }
    return Promise.resolve('j' + b64urlFromBytes(bytes));
  };
  C.decodeShare = function (code) {
    code = String(code || '').trim();
    var m = code.match(/[#&?]b=([A-Za-z0-9_\-]+)/); if (m) code = m[1];
    var kind = code.charAt(0), body = code.slice(1);
    try {
      var bytes = bytesFromB64url(body);
      var p;
      if (kind === 'z') {
        if (typeof W.DecompressionStream !== 'function') return Promise.reject(new Error('Ce navigateur ne sait pas lire les liens compressés.'));
        p = streamBytes(bytes, new W.DecompressionStream('deflate-raw'));
      } else if (kind === 'j') p = Promise.resolve(bytes);
      else return Promise.reject(new Error('Lien de bilan non reconnu.'));
      return p.then(function (b) { var o = JSON.parse(new TextDecoder().decode(b)); return C.expand(o); });
    } catch (e) { return Promise.reject(new Error('Lien de bilan illisible.')); }
  };
  C.shareUrl = function (code) {
    var base = (W.location && W.location.href ? W.location.href.split('#')[0] : '');
    return base + '#b=' + code;
  };
})(window);
