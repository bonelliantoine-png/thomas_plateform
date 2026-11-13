/* Prix conseillé et simulateur de revenus.
   prix = bas + p·(haut − bas), p = 0,45 + niveau + années + preuves + expérience de transmission (borné 0..1),
   × ville (Paris +15 %, grandes villes +5 %) × jauge (atelier : −3 % par place au-delà de 6), arrondi à 5 €. */
(function (W) {
  'use strict';
  var C = W.Cordes, U = C.util;
  C.UNITS = { cours: '€ / heure', atelier: '€ / personne', stage: '€ / personne', prestation: '€ / prestation', coaching: '€ / séance', entreprise: '€ / session', evenement: '€ / entrée', contenu: '€ / accès', produit: '€ / pièce', communaute: '€ / mois' };
  C.BIG_CITIES = ['lyon', 'marseille', 'bordeaux', 'toulouse', 'nice', 'nantes', 'lille', 'strasbourg', 'montpellier', 'rennes', 'grenoble', 'annecy', 'aix en provence', 'versailles', 'boulogne billancourt', 'neuilly sur seine'];
  C.cityFactor = function (city) {
    var n = U.norm(city);
    if (!n) return { f: 1, label: '' };
    if (n === 'paris' || /^paris \d/.test(n) || /^750\d\d/.test(n)) return { f: 1.15, label: 'Paris +15 %' };
    if (C.BIG_CITIES.indexOf(n) >= 0) return { f: 1.05, label: 'Grande ville +5 %' };
    return { f: 1, label: '' };
  };

  C.suggestPrice = function (st, id, fmt, size) {
    var s = C.data.sById[id]; if (!s) return null;
    var v = (st.skills && st.skills[id]) || {};
    var r = C.priceRange(s.universe, fmt);
    var steps = [];
    var p = 0.35;
    steps.push({ label: 'Fourchette observée ' + C.universe(s.universe).short + ' · ' + (C.FORMATS[fmt] || fmt).toLowerCase(), val: U.eur(r.lo) + ' à ' + U.eur(r.hi) + (r.fallback ? ' (repli générique)' : '') });
    var lvl = U.num(v.level, 3);
    var dl = lvl >= 4 ? 0.12 : lvl <= 2 ? -0.18 : 0;
    if (dl) steps.push({ label: 'Niveau ' + C.LEVELS[lvl].toLowerCase(), val: (dl > 0 ? '+' : '') + Math.round(dl * 100) + ' pts' });
    p += dl;
    var yrs = U.num(v.years, 0);
    var dy = Math.min(yrs, 12) / 12 * 0.15;
    if (yrs) steps.push({ label: yrs + ' ans de pratique', val: '+' + Math.round(dy * 100) + ' pts' });
    p += dy;
    var proofs = U.arr(v.proof).length;
    var dp = Math.min(proofs, 3) * 0.04;
    if (proofs) steps.push({ label: proofs + ' preuve' + (proofs > 1 ? 's' : '') + ' (diplôme, réalisations, avis)', val: '+' + Math.round(dp * 100) + ' pts' });
    p += dp;
    var exp = st.offer && st.offer.assets ? U.num(st.offer.assets.teachExp, v.teach ? 2 : 0) : (v.teach ? 2 : 0);
    var de = exp >= 2 ? 0.06 : exp === 0 ? -0.12 : 0;
    if (de) steps.push({ label: exp === 0 ? 'Première expérience de transmission' : 'Expérience de transmission confirmée', val: (de > 0 ? '+' : '') + Math.round(de * 100) + ' pts' });
    p += de;
    p = U.clamp(p, 0.05, 0.9);
    var base = r.lo + p * (r.hi - r.lo);
    steps.push({ label: 'Position dans la fourchette', val: Math.round(p * 100) + ' %' });
    var cf = C.cityFactor(st.context && st.context.city);
    if (cf.label) steps.push({ label: cf.label, val: '×' + String(cf.f).replace('.', ',') });
    base *= cf.f;
    if (fmt === 'atelier' && size > 6) { var g = Math.max(0.8, 1 - 0.03 * (size - 6)); steps.push({ label: 'Jauge de ' + size + ' places', val: '−' + Math.round((1 - g) * 100) + ' %' }); base *= g; }
    if (fmt === 'entreprise' && size > 12) { base *= 1 + Math.min(0.4, (size - 12) * 0.03); steps.push({ label: 'Groupe de ' + size + ' personnes', val: 'majoration' }); }
    var price = U.round5(base);
    return { price: price, lo: U.round5(r.lo * cf.f), hi: U.round5(r.hi * cf.f), p: p, steps: steps, unit: (C.res.pricingUnits && C.res.pricingUnits[fmt] ? C.res.pricingUnits[fmt].replace('€/', '€ / ') : C.UNITS[fmt]) || '€', fallback: r.fallback };
  };

  /* ---------- frais et cotisations ---------- */
  C.feeOf = function (p) {
    var f = (p && p.fee) || { type: 'none' };
    var pct = U.num(f.pct, 0) / 100, sub = U.num(f.eurPerMonth, 0), fix = U.num(f.eur, 0);
    if (f.type === 'commission') return { pct: pct, sub: 0, fix: 0, label: U.rate(pct) + ' de commission' };
    if (f.type === 'subscription') return { pct: 0, sub: sub, fix: 0, label: sub + ' € / mois' };
    if (f.type === 'fixed') return { pct: 0, sub: 0, fix: fix, label: fix + ' € par réservation' };
    if (f.type === 'mixed') return { pct: pct, sub: sub, fix: fix, label: [pct ? U.rate(pct) + '' : '', sub ? sub + ' € / mois' : '', fix ? fix + ' € / résa' : ''].filter(Boolean).join(' + ') || (f.note || 'mixte') };
    if (f.type !== 'none') U.anomaly('resources', 'type de fee inconnu pour ' + (p && p.id) + ' : ' + f.type);
    return { pct: 0, sub: 0, fix: 0, label: 'Sans commission' };
  };

  // taux par défaut par nature de statut, quand le texte ne donne pas de taux de cotisation lisible
  var KIND_RATE = {
    benevole: [0, 'Aucune cotisation'], asso: [0, 'Pas de cotisation sociale sans salarié'], occasionnel: [0.11, 'Estimation : prélèvements sociaux 17,2 % après abattement'],
    bnc: [0.256, ''], bic: [0.212, ''], vente: [0.123, ''], artiste: [0.17, ''], sap: [0.256, 'Taux micro-BNC appliqué'],
    cae: [0.5, 'Estimation : contribution ≈ 10 % puis charges salariales et patronales, net ≈ 50 % du CA'],
    portage: [0.5, 'Estimation : frais de gestion puis charges salariales, net ≈ 50 % du CA'],
    societe: [0.45, 'Estimation : rémunération du dirigeant chargée'], cea: [0.22, 'Estimation : cotisations salariales'], autre: [0.22, 'Estimation']
  };
  C.statusRate = function (s) {
    if (!s) return { rate: 0, est: true, note: '' };
    if (typeof s.rate === 'number') return { rate: s.rate > 1 ? s.rate / 100 : s.rate, est: false, note: '' };
    var kind = C.statusKind ? C.statusKind(s) : 'autre';
    var txt = String(s.cost || '');
    var m = txt.match(/cotisations?(?: sociales)?(?: \d{4})?\s*:?\s*(\d+(?:[.,]\d+)?)\s*%/i);
    if (m && ['bnc', 'bic', 'vente', 'sap'].indexOf(kind) >= 0) return { rate: parseFloat(m[1].replace(',', '.')) / 100, est: false, note: '' };
    if (kind === 'artiste') {
      var r = txt.match(/(\d+)\s*à\s*(\d+)\s*%/);
      if (r) return { rate: (parseInt(r[1], 10) + parseInt(r[2], 10)) / 200, est: false, note: 'Milieu de la fourchette ' + r[1] + ' à ' + r[2] + ' %' };
    }
    if (m && kind === 'autre') return { rate: parseFloat(m[1].replace(',', '.')) / 100, est: false, note: '' };
    var d = KIND_RATE[kind] || KIND_RATE.autre;
    if (kind === 'autre') U.anomaly('resources', 'statut ' + s.id + ' : taux non lisible, estimation 22 %');
    return { rate: d[0], est: !!d[1] && d[1].indexOf('Estimation') === 0, note: d[1] };
  };
  function parseEur(txt, kw) {
    var re = new RegExp(kw + '[^0-9]{0,70}(\\d{1,3}(?:[ \\u202f\\u00a0.]\\d{3})+|\\d{4,})\\s*€', 'i');
    var m = String(txt || '').replace(/[  ]/g, ' ').match(re);
    return m ? parseInt(m[1].replace(/[ .]/g, ''), 10) : null;
  }
  C.statusCeiling = function (s) {
    if (!s) return null;
    var c = parseEur(s.ceiling, 'plafond');
    if (c) return c;
    var k = C.statusKind ? C.statusKind(s) : '';
    if (/^(bnc|bic|vente|sap|artiste)$/.test(k) && s.fit && U.num(s.fit.incomeMax) > 0) return U.num(s.fit.incomeMax);
    return null;
  };
  C.statusVatThreshold = function (s) { return s ? parseEur(s.ceiling, 'franchise en base de TVA') || parseEur(s.cost, 'franchise en base de TVA') : null; };

  /* ---------- simulateur ----------
     p = { hoursPerWeek, sessionMin, price, size, fill, mix: [{platform, share}], status, materialPerSession, weeks } */
  C.simulate = function (p) {
    var sessMin = Math.max(30, U.num(p.sessionMin, 120));
    var prepRatio = U.num(p.prepRatio, 0.35); // préparation, trajet, communication
    var effHours = U.num(p.hoursPerWeek, 4) / (1 + prepRatio);
    var sessionsPerMonth = Math.max(0, Math.floor(effHours * 60 / sessMin * 4.33 * 10) / 10);
    var seats = sessionsPerMonth * Math.max(1, U.num(p.size, 1)) * U.clamp(p.fill, 0, 1);
    var gross = seats * U.num(p.price);
    var fees = 0, subs = 0, detail = [];
    var mix = U.arr(p.mix).filter(function (m) { return m && m.share > 0; });
    var tot = mix.reduce(function (a, m) { return a + m.share; }, 0) || 1;
    mix.forEach(function (m) {
      var share = m.share / tot, f = C.feeOf(m.platform);
      var g = gross * share;
      var fee = g * f.pct + seats * share * f.fix;
      fees += fee; subs += f.sub;
      detail.push({ name: m.platform ? m.platform.name : 'Direct', share: share, gross: g, fee: fee + f.sub, label: f.label });
    });
    var sr = C.statusRate(p.status);
    var afterFees = gross - fees - subs;
    var cotis = Math.max(0, gross * sr.rate);
    var material = sessionsPerMonth * U.num(p.materialPerSession, 0);
    var net = gross - fees - subs - cotis - material;
    // point mort : places par mois pour couvrir les coûts fixes (abonnements)
    var perSeatNet = U.num(p.price) * (1 - (mix.length ? fees / Math.max(1, gross) : 0) - sr.rate) - (U.num(p.materialPerSession, 0) / Math.max(1, U.num(p.size, 1)));
    var breakEvenSeats = perSeatNet > 0 ? Math.ceil(subs / perSeatNet) : Infinity;
    var annual = gross * 12;
    var ceiling = C.statusCeiling(p.status);
    var vat = C.statusVatThreshold(p.status);
    var hourly = U.num(p.hoursPerWeek, 4) > 0 ? net / (U.num(p.hoursPerWeek, 4) * 4.33) : 0;
    return { sessionsPerMonth: sessionsPerMonth, seats: seats, gross: gross, fees: fees + subs, subs: subs, cotis: cotis, rate: sr.rate, rateEst: sr.est, material: material, net: net, afterFees: afterFees, breakEvenSeats: breakEvenSeats, annual: annual, ceiling: ceiling, overCeiling: ceiling ? annual > ceiling : false, vat: vat, overVat: vat ? annual > vat : false, rateNote: sr.note, hourly: hourly, detail: detail };
  };
})(window);
