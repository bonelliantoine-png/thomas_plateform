/* Recommandation de canaux.
   score(p) = adéquation format × adéquation univers × Σ wᵢ·critèreᵢ (audience, commission, effort, maîtrise de la relation)
   × modulateurs du profil entrepreneurial (caméra, aisance commerciale). Poids selon l'objectif. */
(function (W) {
  'use strict';
  var C = W.Cordes, U = C.util;
  C.CORDES_CHANNEL = {
    id: 'cordes', name: 'Cordes · bientôt', url: '', sides: ['learn', 'offer'], kinds: ['atelier', 'cours', 'communaute', 'evenement'], universes: ['*'], geo: 'FR',
    model: 'Séances d’une heure en petit groupe (2 à 4) dans des lieux partenaires, payées 12 € par place occupée ou 2 crédits par séance',
    fee: { type: 'none' }, audience: 'Lancement à Paris, membres fondateurs', bestFor: 'Ateliers découverte, arcs de 3 séances, cercles par passion',
    pros: ['Pas de prospection : les membres réservent', 'Lieux partenaires sans loyer', 'Copilote pour construire la trame'], cons: ['Pas encore ouvert', 'Format court imposé (1 h)'],
    effort: 0, reach: 1, control: 2, soon: true
  };

  C.channelWeights = function (st) {
    var g = (st.offer && st.offer.goals) || [];
    var w = { reach: 0.32, fee: 0.26, effort: 0.22, control: 0.20 };
    if (g.indexOf('activite') >= 0) { w = { reach: 0.28, fee: 0.26, effort: 0.12, control: 0.34 }; }
    else if (g.indexOf('complement') >= 0) { w = { reach: 0.32, fee: 0.24, effort: 0.26, control: 0.18 }; }
    else if (g.indexOf('benevolat') >= 0 && g.length === 1) { w = { reach: 0.36, fee: 0.34, effort: 0.24, control: 0.06 }; }
    if (g.indexOf('projets') >= 0) { w.control += 0.04; w.reach -= 0.04; }
    return w;
  };

  C.rankChannels = function (st, offers) {
    var E = C.computeEntrepreneur(st.offer && st.offer.entrepreneur).vals;
    var fmts = {}, unis = {};
    U.arr(offers).forEach(function (o, i) { fmts[o.fmt] = (fmts[o.fmt] || 0) + (i < 2 ? 1.5 : 1); unis[o.s.universe] = 1; });
    var fmtList = Object.keys(fmts);
    var w = C.channelWeights(st);
    var income = Math.max(150, U.num(st.offer && st.offer.incomeTarget, 500));
    var avgPrice = offers && offers.length ? offers.reduce(function (a, o) { return a + o.price; }, 0) / offers.length : 30;
    var presence = (st.offer && st.offer.presence) || (st.context && st.context.presence) || 'both';
    var plats = C.res.platforms.filter(function (p) { return p.sides.indexOf('offer') >= 0; }).concat([C.CORDES_CHANNEL]);
    var ranked = plats.map(function (p) {
      var fmtW = 0, fmtTot = 0;
      fmtList.forEach(function (f) { fmtTot += fmts[f]; if (p.kinds.indexOf(f) >= 0) fmtW += fmts[f]; });
      var fmtFit = fmtTot ? Math.sqrt(fmtW / fmtTot) : 0;
      if (!p.kinds.length) fmtFit = 0.3;
      var uniFit = p.universes.indexOf('*') >= 0 ? 0.8 : (Object.keys(unis).some(function (u) { return p.universes.indexOf(u) >= 0; }) ? 1 : 0.1);
      var f = C.feeOf(p);
      var feeRate = f.pct + f.sub / income + (f.fix ? f.fix / Math.max(5, avgPrice) : 0);
      var feeScore = 1 - Math.min(1, feeRate * 2.2);
      var tolerance = (E.admin + E.sales + E.risk) / 9; // 0..1
      var effortScore = 1 - (p.effort / 3) * (1 - 0.6 * tolerance);
      var reachScore = p.reach / 3 * (1 + (1.5 - E.sales) * 0.12);
      var controlScore = p.control / 3;
      var base = w.reach * reachScore + w.fee * feeScore + w.effort * effortScore + w.control * controlScore;
      var mod = 1, notes = [];
      var contentOnly = p.kinds.length && p.kinds.every(function (k) { return k === 'contenu' || k === 'communaute'; });
      if (contentOnly) { mod *= 0.45 + 0.2 * E.camera; if (E.camera <= 1) notes.push('Canal vidéo : demande d’être à l’aise face caméra'); }
      if (presence === 'online' && !contentOnly && p.kinds.indexOf('cours') < 0 && p.kinds.indexOf('coaching') < 0) mod *= 0.7;
      if (presence === 'local' && contentOnly) mod *= 0.75;
      if (p.soon) {
        var small = (fmts.atelier || 0) + (fmts.cours || 0) + (fmts.communaute || 0);
        mod *= 0.75 + 0.25 * Math.min(1, small / Math.max(1, fmtTot));
        if (presence === 'online') mod *= 0.6;
      }
      var score = fmtFit * uniFit * base * mod;
      var reasons = [];
      if (p.reach >= 3 && E.sales <= 1.5) reasons.push('Amène des clients sans prospection');
      if (p.control >= 3) reasons.push('Vous gardez la relation, vos données et vos marges');
      if (f.pct >= 0.2) reasons.push('Commission élevée : à réserver aux premiers clients');
      if (f.sub > 0) reasons.push('Coût fixe de ' + f.sub + ' € par mois, rentable dès ' + Math.ceil(f.sub / Math.max(5, avgPrice * 0.75)) + ' place(s)');
      if (p.effort >= 3) reasons.push('Mise en route longue (site, contenus, référencement)');
      if (p.effort <= 1 && p.reach >= 2) reasons.push('Ouvert en une soirée');
      if (p.soon) reasons.push('Rémunération 12 € par place ou 2 crédits, places remplies par la plateforme');
      return { p: p, score: Math.round(U.clamp(score, 0, 1) * 100), parts: { fmt: fmtFit, uni: uniFit, reach: reachScore, fee: feeScore, effort: effortScore, control: controlScore, mod: mod }, fee: f, feeRate: feeRate, reasons: reasons.concat(notes) };
    }).filter(function (x) { return x.parts.fmt > 0 && x.parts.uni > 0.1; });
    ranked.sort(function (a, b) { return b.score - a.score; });
    return ranked;
  };
})(window);
