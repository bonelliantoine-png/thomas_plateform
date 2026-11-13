/* Statut recommandé : règles sur revenu annuel visé, collectif, type d'activité (artistique, vente, prestation),
   services à la personne, tolérance à l'administratif. Cadre réglementaire lu dans `regulations`. */
(function (W) {
  'use strict';
  var C = W.Cordes, U = C.util;
  C.statusKind = function (s) {
    var k = U.norm(s.id + ' ' + s.name);
    if (/benevol/.test(k)) return 'benevole';
    if (/cheque|cea/.test(k)) return 'cea';
    if (/portage/.test(k)) return 'portage';
    if (/\bcae\b|cooperative|coop/.test(k)) return 'cae';
    if (/personne|\bsap\b/.test(k)) return 'sap';
    if (/artiste|auteur/.test(k)) return 'artiste';
    if (/vente|commerce|marchandise/.test(k)) return 'vente';
    if (/bnc|liberal/.test(k)) return 'bnc';
    if (/bic|prestation|artisan/.test(k)) return 'bic';
    if (/occasion|particulier/.test(k)) return 'occasionnel';
    if (/\bsas\b|eurl|sarl|societe|sasu/.test(k)) return 'societe';
    if (/asso/.test(k)) return 'asso';
    return 'autre';
  };

  C.recommendStatus = function (st, offers) {
    var o = st.offer || {}, g = U.arr(o.goals);
    var annual = U.num(o.incomeTarget, 0) * 12;
    var E = C.computeEntrepreneur(o.entrepreneur).vals;
    var collective = g.indexOf('projets') >= 0 || E.collective >= 2.5;
    var fm = {}; U.arr(offers).forEach(function (x) { fm[x.fmt] = (fm[x.fmt] || 0) + 1; });
    var n = U.arr(offers).length || 1;
    var share = function (f) { return (fm[f] || 0) / n; };
    var artistic = U.arr(offers).some(function (x) { return ['musique', 'image', 'scene'].indexOf(x.s.universe) >= 0 && (x.fmt === 'produit' || x.fmt === 'contenu'); });
    var repair = U.arr(offers).some(function (x) { return ['maison', 'pratique', 'style'].indexOf(x.s.universe) >= 0 && x.fmt === 'prestation'; });
    var kids = U.arr(o.audiences).indexOf('enfants') >= 0 || U.arr(o.audiences).indexOf('seniors') >= 0;
    var onlyBenevolat = g.length && g.every(function (x) { return x === 'benevolat'; });
    var res = C.res.statuses.map(function (s) {
      var kind = C.statusKind(s), sc = 0, why = [];
      var fit = s.fit || {};
      var mn = U.num(fit.incomeMin, 0), mx = fit.incomeMax == null ? 1e9 : U.num(fit.incomeMax, 1e9);
      if (annual >= mn && annual <= mx) { sc += 2; why.push('Revenu visé (' + U.eur(annual) + ' / an) dans la plage du statut'); }
      else if (annual > mx) { sc -= 2 + Math.min(3, (annual - mx) / Math.max(1, mx)); why.push('Revenu visé au-delà du plafond'); }
      else sc -= 0.5;
      if (fit.collective === true) { if (collective) { sc += 1.5; why.push('Adapté à un projet collectif'); } else sc -= 0.4; }
      switch (kind) {
        case 'benevole': if (onlyBenevolat) { sc += 4; why.push('Objectif bénévole'); } else sc -= 2; break;
        case 'asso': if (onlyBenevolat) sc += 2; if (collective) { sc += 1; why.push('Porter des projets à plusieurs, avec des lieux et des subventions'); } if (g.indexOf('activite') >= 0) { sc -= 3; why.push('Ne permet pas de se verser un revenu comme dirigeant'); } else if (g.indexOf('complement') >= 0) sc -= 1.5; break;
        case 'bnc': if (share('cours') + share('atelier') + share('coaching') + share('stage') + share('entreprise') >= 0.5) { sc += 2; why.push('Cours, ateliers et coaching relèvent des prestations intellectuelles'); } if (E.admin <= 1) { sc += 0.5; why.push('Comptabilité réduite, déclaration mensuelle ou trimestrielle en ligne'); } if (g.indexOf('activite') >= 0 || g.indexOf('complement') >= 0) { sc += 1.2; why.push('Le statut le plus simple pour encaisser un revenu personnel'); } break;
        case 'bic': if (repair) { sc += 2; why.push('Prestation manuelle (réparation, retouche)'); } else sc -= 0.5; break;
        case 'vente': if (share('produit') >= 0.3) { sc += 2.5; why.push('Une part de l’activité est la vente de créations'); } else sc -= 1; break;
        case 'artiste': if (artistic) { sc += 1.8; why.push('Œuvres et contenus artistiques ; les cours restent en BNC'); } else sc -= 1.5; break;
        case 'cae': if (E.admin <= 1 || E.risk <= 1) { sc += 0.8; why.push('Tester sans créer de structure, comptabilité gérée par la coopérative'); } if (annual < 3000) sc -= 1; sc -= 0.6; break;
        case 'portage': if (share('entreprise') + share('coaching') >= 0.3 && annual > 12000) { sc += 1; why.push('Clients entreprises, statut salarié'); } else sc -= 1; break;
        case 'sap': if (kids && share('cours') > 0) { sc += 2; why.push('Cours à domicile : vos clients récupèrent 50 % en crédit d’impôt'); } else sc -= 1; break;
        case 'occasionnel': if (annual < 3000 && g.indexOf('activite') < 0) { sc += 1.5; why.push('Revenus faibles et ponctuels'); } else sc -= 2; break;
        case 'societe': if (annual > 83600) { sc += 3; why.push('Chiffre d’affaires au-delà des plafonds de la micro'); } else sc -= 2; break;
        case 'cea': sc -= 2.5; why.push('Réservé aux associations qui salarient un intervenant'); break;
      }
      if (g.indexOf('benevolat') >= 0 && !onlyBenevolat && (kind === 'asso')) { sc += 0.5; }
      return { s: s, kind: kind, score: sc, why: why, rate: C.statusRate(s), ceiling: C.statusCeiling(s) };
    });
    res.sort(function (a, b) { return b.score - a.score; });
    return res;
  };

  C.regulationsFor = function (skills) {
    var by = {};
    skills.forEach(function (s) { if (s && s.regulated) { by[s.regulated] = by[s.regulated] || []; by[s.regulated].push(s); } });
    return Object.keys(by).map(function (k) {
      var r = C.res.regulations[k];
      if (!r) U.anomaly('resources', 'regulations : pas d’entrée pour « ' + k + ' »');
      return { id: k, skills: by[k], r: r || { title: 'Activité encadrée (' + k + ')', rule: 'Vérifier la réglementation applicable avant de proposer une activité rémunérée.', risk: '', options: ['Se renseigner auprès de la fédération ou de la préfecture'], source: '' } };
    });
  };
})(window);
