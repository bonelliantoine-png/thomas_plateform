/* Résultats du demandeur : tableau de bord, plans par envie, où apprendre, utilisations directes du bilan. */
(function (W) {
  'use strict';
  var C = W.Cordes, U = C.util, ui = C.ui, E = ui.e;

  function counter(label, v, sub, kind) { return '<div class="counter"><div class="lbl"><i class="' + (kind || '') + '"></i>' + E(label) + '</div><div class="v">' + v + '</div><div class="s">' + sub + '</div></div>'; }
  ui.counter = counter;

  ui.exportBar = function (st) {
    return '<div class="actionsbar noprint"><button class="btn" data-act="share">' + ui.icon('share') + ' Partager</button><button class="btn" data-act="passport">' + ui.icon('dl') + ' Passeport</button>' +
      '<button class="btn" data-act="ics">' + ui.icon('cal') + ' Agenda</button><button class="btn" data-act="print">' + ui.icon('print') + ' Imprimer</button><button class="btn" data-act="json">' + ui.icon('dl') + ' JSON</button>' +
      '<button class="btn" data-act="card">' + ui.icon('img') + ' Image</button><a class="btn" href="#/comparer">Comparer</a></div>';
  };

  ui.routes.resultats = {
    title: 'Mon bilan',
    render: function (st) {
      if (!st.mode) return ui.emptyBilan();
      var c = st.context, ys = C.yesDesires(st).slice(0, 5);
      var plans = ys.map(function (id) { return C.learnPlan(st, id); }).filter(Boolean);
      var nk = Object.keys(st.skills).filter(function (id) { return st.skills[id] && st.skills[id].level > 0; }).length + (st.custom || []).filter(function (x) { return x.level > 0; }).length;
      var nm = Object.keys(st.skills).filter(function (id) { return st.skills[id] && st.skills[id].level >= 4; }).length;
      var hours = plans.reduce(function (a, p) { return a + p.hours; }, 0), monthly = plans.reduce(function (a, p) { return a + p.monthly; }, 0);
      var arch = C.computeArchetype(st.style.answers);
      var html = '<div class="wrap">';
      html += '<div class="dash-h"><div><div class="kicker">Bilan · ' + E(U.dateShort(new Date())) + ' ' + new Date().getFullYear() + (st.demo ? ' · profil de démonstration' : '') + '</div><h1 class="h1">' + (c.firstName ? E(c.firstName) + ', voici votre bilan' : 'Votre bilan') + '</h1>' +
        '<div class="row">' + (arch.answered ? ui.pill(arch.archetype.name, 'int') : '') + (c.city ? ui.pill(c.city, 'idle') : '') + ui.pill(String(U.num(c.hoursPerWeek, 3)).replace('.', ',') + ' h / semaine', 'idle') + '</div></div>' + ui.exportBar(st) + '</div>';
      html += '<div class="counters">' + counter('Compétences', nk, nm ? 'dont ' + nm + ' maîtrisée' + (nm > 1 ? 's' : '') : 'notées dans le bilan', '') +
        counter('Envies au plan', plans.length, plans[0] ? 'priorité : ' + E(plans[0].s.short || plans[0].s.name) : '<a href="#/bilan/envies">ouvrir le paquet</a>', 'int') +
        counter('Heures à prévoir', U.fmt(hours) + '<small> h</small>', plans.length ? '≈ ' + Math.max.apply(null, plans.map(function (p) { return p.weeks; })) + ' semaines au plus long' : '—', 'sent') +
        counter('Budget mensuel', U.fmt(monthly) + '<small> €</small>', 'pour ' + U.eur(U.num(c.budgetPerMonth, 50)) + ' prévus' + (monthly > U.num(c.budgetPerMonth, 50) ? ' · à étaler' : ''), monthly > U.num(c.budgetPerMonth, 50) ? 'wait' : 'int') + '</div>';
      if (st.mode === 'both') html += '<div class="note int noprint" style="margin-top:14px"><span class="lbl">Votre plan de valorisation est prêt</span><span class="sp">Offres, prix, simulateur de revenus, canaux et feuille de route 90 jours.</span> <a href="#/offre">Ouvrir le plan</a></div>';

      // radar et constellation
      html += '<div class="grid2" style="margin-top:16px"><section class="panel"><div class="ph"><span class="t">Maîtrise et envies par univers</span><span class="legend"><span><span class="sw" style="background:var(--accent)"></span>maîtrise</span><span><span class="sw" style="border:1.5px dashed var(--int)"></span>envies</span></span></div><div class="pb chart">' + C.charts.radarSVG(C.universeProfile(st), { size: 380 }) + '</div></section>' +
        '<section class="panel"><div class="ph"><span class="t">Constellation</span><span class="legend"><span><span class="sw" style="background:var(--fg-2);border-radius:50%"></span>sait faire</span><span><span class="sw" style="border:1.5px solid var(--int);border-radius:50%"></span>envie</span><span>--- passerelle</span></span></div><div class="pb chart">' + C.charts.constellationSVG(st, { size: 420 }) + '</div></section></div>';

      // profil d'apprenant et forces transverses
      html += '<div class="grid2" style="margin-top:16px">' + archPanel(st, arch) + softPanel(st) + '</div>';

      // plans
      html += '<div class="section-h" id="plans" tabindex="-1"><span class="kicker">Plans</span><h2 class="h2">Pour chaque envie, un plan</h2></div>';
      if (!plans.length) html += '<div class="note wait"><span class="lbl">Aucune envie retenue</span><span class="sp">Le paquet de cartes propose des compétences voisines de ce que vous savez.</span> <a href="#/bilan/envies">Ouvrir le paquet</a></div>';
      plans.forEach(function (p, i) { html += planPanel(st, p, i); });

      // passerelle vers l'offre
      var sh = C.shareable(st);
      html += '<div class="section-h" id="partager" tabindex="-1"><span class="kicker">Transmettre</span><h2 class="h2">Ce que vous pourriez partager</h2></div>';
      if (sh.length) {
        html += '<section class="panel"><div class="pb"><p class="prose">Dans ' + sh.length + ' compétence' + (sh.length > 1 ? 's' : '') + ', votre niveau vous permet déjà d’animer un atelier : une personne de niveau n anime les ateliers de niveau n-1. Une séance d’une heure en petit groupe suffit pour commencer : c’est ainsi qu’un apprenant devient hôte.</p></div><div class="gtable">' +
          sh.slice(0, 5).map(function (x) {
            return '<div class="gtr" style="grid-template-columns:minmax(0,1fr) auto"><div><div class="nm" style="font:400 16px var(--f-display)">' + E(x.s.name) + '</div><div style="font-size:12px;color:var(--int);margin-top:2px">Niveau ' + x.level + ' (' + E(C.LEVELS[x.level].toLowerCase()) + ') : ' + E(C.animateText(x.level)) + '</div><div class="faint" style="font-size:11.5px">' + E(C.FORMATS[x.fmt]) + ' · demande ' + x.s.attrs.demand + '/3 · facile à transmettre ' + x.s.attrs.teachable + '/3</div></div><span class="pill int">' + U.eur(x.range.lo) + ' à ' + U.eur(x.range.hi) + '</span></div>';
          }).join('') + '</div><div class="pb noprint"><button class="btn primary" data-act="toOffer">Construire mon offre ' + ui.icon('arrowR') + '</button></div></section>';
      } else html += '<p class="empty">Aucune compétence au niveau 2 (bases acquises) pour l’instant : c’est le niveau qui permet d’animer la découverte. Le jour venu, le parcours « Je transmets » vous aidera à lancer une première séance.</p>';

      // utilisations directes
      html += '<div class="section-h noprint" id="usages" tabindex="-1"><span class="kicker">Utiliser</span><h2 class="h2">Quatorze façons d’utiliser votre bilan</h2></div><div class="tiles noprint">' +
        [['passport', '01', 'Passeport', 'Une page HTML autonome à garder ou envoyer'], ['ics', '02', 'Plan dans l’agenda', 'Premiers pas et jalons en .ics'], ['share', '03', 'Lien de partage', 'Votre bilan lisible par un ami, sans compte'], ['gocompare', '04', 'Comparer, troquer', 'Coller le lien d’un ami pour trouver un troc'],
          ['wishlist', '05', 'Liste d’envies à offrir', 'Des ateliers à offrir pour un anniversaire'], ['challenge', '06', 'Défi 30 jours', 'Un micro-défi par jour sur l’envie prioritaire'], ['cv', '07', 'Pour un CV', 'Centres d’intérêt et compétences transverses'], ['print', '08', 'Imprimer', 'Version papier propre, en PDF'],
          ['card', '09', 'Carte image', 'Une image carrée ou story pour vos réseaux'], ['goGroup', '10', 'Comparer en groupe', 'De 3 à 8 amis : qui apprend quoi à qui'], ['goProgress', '11', 'Mes progrès', 'Instantanés datés et rappel dans 90 jours'], ['goData', '12', 'Mes données', 'Tout exporter ou tout effacer'],
          ['goIdeas', '13', 'Une idée à vivre avec ces envies', 'Une sortie entre amis autour de vos envies, à envoyer au groupe'], ['goTest', '14', 'Fais passer le test à un ami', 'Sa corde cachée en 60 secondes, puis comparer']]
          .map(function (t) { return '<button class="tile" data-act="' + t[0] + '"><span class="n">' + t[1] + '</span><span class="t">' + E(t[2]) + '</span><span class="d">' + E(t[3]) + '</span></button>'; }).join('') + '</div>';

      // copilote
      html += '<div class="section-h noprint" id="copilote" tabindex="-1"><span class="kicker">Synthèse</span><h2 class="h2">Le mot du copilote</h2></div>' + ui.copilotPanel('synth', C.ai.templateSynthesis(st), 'Rédige une synthèse narrative et motivante (180 mots maximum) de ce bilan, puis 3 conseils concrets datés pour les 30 prochains jours.');
      if (ui.afterResults) html += ui.afterResults(st);
      html += '</div>';
      return html;
    },
    mount: function (root) { ui.mountTabs(root); }
  };

  function archPanel(st, arch) {
    if (!arch.answered) return '<section class="panel"><div class="ph"><span class="t">Profil d’apprenant</span></div><div class="pb"><p class="empty">Répondre aux 8 questions de style pour obtenir des formats conseillés.</p><a class="btn" href="#/bilan/style">Répondre</a></div></section>';
    var a = arch.archetype;
    return '<section class="panel"><div class="ph"><span class="t">Profil d’apprenant</span><span class="hint">confiance ' + Math.round(arch.confidence * 100) + ' % · proche : ' + E(arch.second.name) + '</span></div><div class="pb">' +
      '<div class="h3" style="font-size:22px">' + E(a.name) + '</div><p class="sp" style="margin:4px 0 12px">' + E(a.pref) + '</p>' +
      C.STYLE_DIMS.map(function (d, i) { return '<div class="dimrow"><span>' + E(d.lo) + '</span><span class="dimtrack" role="img" aria-label="' + E(d.lo + ' / ' + d.hi + ' : ' + Math.round(arch.vec[i] * 100)) + '"><b style="left:' + Math.round((arch.vec[i] + 1) * 50) + '%"></b></span><span>' + E(d.hi) + '</span></div>'; }).join('') +
      '<div class="lbl" style="margin-top:14px">Formats conseillés</div><div class="row" style="margin-top:6px">' + a.formats.map(function (f) { return ui.pill(C.FORMATS[f], 'idle'); }).join('') + '</div>' +
      '<ul class="clean" style="margin-top:10px">' + a.tips.map(function (t) { return '<li>' + E(t) + '</li>'; }).join('') + '</ul></div></section>';
  }
  function softPanel(st) {
    var sp = C.softProfile(st).slice(0, 6);
    return '<section class="panel"><div class="ph"><span class="t">Forces transverses</span><span class="hint">déduites de vos pratiques</span></div><div class="pb">' +
      (sp.length ? sp.map(function (x) {
        return '<div class="softrow"><div class="top"><span>' + E(x.soft.name) + '</span><span class="faint num">' + Math.round(x.rel * 100) + '</span></div>' + ui.meter(x.rel * 100, 100, 'int') +
          '<div class="from">issue de ' + x.from.slice(0, 3).map(function (f) { return C.nm(f.s); }).join(', ') + (x.soft.desc ? ' · ' + E(x.soft.desc) : '') + '</div></div>';
      }).join('') : '<p class="empty">Noter des compétences pour voir vos forces transverses.</p>') + '</div></section>';
  }

  function resItem(name, url, desc, meta) {
    return '<div class="resitem"><div class="nm">' + (url ? '<a href="' + E(url) + '" target="_blank" rel="noopener noreferrer">' + E(name) + '</a>' : E(name)) + '</div><div>' + (url ? '<a class="btn ghost sm" href="' + E(url) + '" target="_blank" rel="noopener noreferrer" aria-label="Ouvrir ' + E(name) + '">' + ui.icon('ext') + '</a>' : '') + '</div>' + (desc ? '<div class="d">' + E(desc) + '</div>' : '') + (meta ? '<div class="m">' + meta + '</div>' : '') + '</div>';
  }
  function platItem(x) { var p = x.p; var f = C.feeOf(p); return resItem(p.name, p.url, p.bestFor || p.model, E(p.model ? p.model.slice(0, 90) : '') + (p.audience ? ' · ' + E(p.audience.slice(0, 70)) : '') + ' ' + ui.verify(p)); }
  ui.whereHTML = function (st, p) {
    var w = p.where, g = [];
    function grp(label, items) { if (items.length) g.push('<div class="resgroup"><span class="lbl">' + E(label) + '</span><div class="reslist">' + items.join('') + '</div></div>'); }
    if (C.venuesFor && ui.venueLine) { var vs = C.venuesFor(p.s.id, (st.context && st.context.city) || '', 3); if (vs.length) g.push('<div class="resgroup"><span class="lbl">Lieux partenaires près de chez vous</span><div class="reslist">' + vs.map(function (x) { return '<div class="resitem"><div class="nm">' + ui.venueLine(x, 'resultats') + '</div><div></div><div class="m">' + E(C.venueType(x.v.type).label) + ' · ' + E(C.venueSlotsText(x.v).join(', ')) + '</div></div>'; }).join('') + '</div></div>'); }
    grp('Profs et cours', w.teachers.map(platItem));
    grp('Ateliers et stages', w.workshops.map(platItem));
    grp('Apps et ressources pour apprendre seul', w.apps.map(function (a) { return resItem(a.name, a.url, a.desc, E(a.price)); }));
    grp('Communautés et lieux', w.communities.map(function (c) { return resItem(c.name, c.links[0] && c.links[0].url, c.desc, (c.howToFind ? 'Trouver : ' + E(c.howToFind) : '') + ' ' + ui.pill(c.paid === 'free' ? 'gratuit' : c.paid === 'paid' ? 'payant' : 'gratuit ou payant', 'idle')); }));
    grp('En ligne', w.online.map(platItem));
    grp('Réseaux et fédérations', w.networks.map(function (n) { return resItem(n.name, n.url, n.desc); }));
    grp('Projets collectifs à rejoindre', w.projects.map(function (x) { return resItem(x.p.name, '', x.p.desc, x.p.size[0] + ' à ' + x.p.size[1] + ' personnes · ' + x.p.weeks + ' semaines · ' + E(x.p.output)); }));
    return g.join('') || '<p class="empty">Aucune ressource référencée pour cet univers.</p>';
  };
  function planPanel(st, p, i) {
    var id = p.s.id, d = p.d;
    var need = Math.ceil(p.hours / p.horizonW * 10) / 10;
    var html = '<details class="panel desire"' + (i === 0 ? ' open' : '') + ' id="plan-' + E(id) + '"><summary><span class="prio">' + (i + 1) + '</span><div><div class="nm">' + E(p.s.name) + '</div><div class="meta">' + ui.uniTag(p.s.universe) + ' · niveau ' + p.cur + ' → ' + p.target + ' (' + E(C.LEVELS[p.target].toLowerCase()) + ') · ≈ ' + p.hours + ' h · ' + p.weeks + ' sem. · ' + U.eur(p.monthly) + ' / mois</div></div><span class="chev">' + ui.icon('arrowR') + '</span></summary>';
    html += '<div class="tabs" role="tablist" aria-label="Plan de ' + E(p.s.name) + '">' + [['plan', 'Plan'], ['ou', 'Où apprendre'], ['autour', 'Autour de moi'], ['rech', 'Recherches']].map(function (t, k) { return '<button role="tab" id="tab-' + E(id) + '-' + t[0] + '" aria-controls="tp-' + E(id) + '-' + t[0] + '" aria-selected="' + (k === 0) + '" data-tab="' + t[0] + '">' + E(t[1]) + '</button>'; }).join('') + '</div>';
    // plan
    html += '<div class="pb tabpanel" role="tabpanel" id="tp-' + E(id) + '-plan" aria-labelledby="tab-' + E(id) + '-plan"><div class="grid2"><div>' +
      '<div class="note int"><span class="lbl">Premier pas cette semaine</span><span class="sp" style="color:var(--fg)">' + E(p.first.text) + '</span>' + (p.first.link ? ' ' + ui.extLink(p.first.link, p.first.label) : '') + '</div>' +
      '<div class="timeline" style="margin-top:14px">' + p.milestones.map(function (m, k) { return '<div class="tl' + (k === p.milestones.length - 1 ? ' int' : '') + '"><div class="when">' + E(U.dateShort(m.when)) + ' · ' + E(m.label) + '</div><div class="what">' + E(m.text) + '</div></div>'; }).join('') + '</div>' +
      '<div class="lbl" style="margin-top:16px">Paliers à franchir</div>' + ui.palierPath(p.s, p.cur, p.target, p.steps) + '</div>' +
      '<div><div class="counters" style="grid-template-columns:1fr 1fr">' + counter('Heures', p.hours + '<small> h</small>', 'du niveau ' + p.cur + ' au niveau ' + p.target) + counter('Rythme', String(p.hpw).replace('.', ',') + '<small> h/sem</small>', p.weeks + ' semaines', p.fits ? 'int' : 'wait') +
      counter('Matériel', p.material[1] <= 20 ? '≈ 0<small> €</small>' : U.fmt(p.material[0]) + '–' + U.fmt(p.material[1]) + '<small> €</small>', 'budget de départ') + counter('Séances', U.fmt(p.monthly) + '<small> €/mois</small>', p.lessonFmt ? E(C.FORMATS[p.lessonFmt]).toLowerCase() : 'en autonomie', p.overBudget ? 'wait' : '') + '</div>' +
      (!p.fits ? '<div class="note wait" style="margin-top:12px"><span class="lbl">Horizon serré</span><span class="sp">À ' + String(p.hpw).replace('.', ',') + ' h par semaine, il faut ' + p.weeks + ' semaines. Pour tenir ' + ({ '1m': '1 mois', '3m': '3 mois', '12m': '1 an' }[d.horizon || '3m']) + ', prévoir ' + String(need).replace('.', ',') + ' h par semaine, ' + (p.target - 1 > p.cur ? 'ou viser le niveau ' + (p.target - 1) + ' d’abord' : 'ou allonger l’horizon') + '.</span></div>' : '') +
      (p.overBudget ? '<div class="note wait" style="margin-top:12px"><span class="lbl">Budget</span><span class="sp">Les séances encadrées dépassent votre budget mensuel. Alterner une séance par mois avec la pratique en autonomie, ou passer par un club associatif.</span></div>' : '') +
      (p.s.regulated === 'sport' ? '<p class="faint" style="margin-top:10px;font-size:11.5px">Activité sportive : choisissez un encadrant diplômé (carte professionnelle) ou un club fédéré.</p>' : '') +
      '</div></div></div>';
    html += '<div class="pb tabpanel" role="tabpanel" id="tp-' + E(id) + '-ou" aria-labelledby="tab-' + E(id) + '-ou" hidden>' + ui.whereHTML(st, p) + '</div>';
    html += '<div class="pb tabpanel" role="tabpanel" id="tp-' + E(id) + '-autour" aria-labelledby="tab-' + E(id) + '-autour" hidden><p class="sp">Lieux réels issus d’OpenStreetMap pour l’univers ' + E(C.universe(p.s.universe).short) + ', dans un rayon de ' + U.num(st.context.radiusKm, 5) + ' km autour de ' + E(st.context.city || 'votre ville') + '.</p>' +
      '<div class="row" style="margin-top:10px"><button class="btn" data-act="osmInline" data-u="' + p.s.universe + '" data-target="osm-' + E(id) + '">' + ui.icon('pin') + ' Chercher autour de moi</button><a class="btn ghost" href="#/outils/autour/' + p.s.universe + '">Ouvrir l’outil complet</a></div><div id="osm-' + E(id) + '" style="margin-top:12px"></div></div>';
    html += '<div class="pb tabpanel" role="tabpanel" id="tp-' + E(id) + '-rech" aria-labelledby="tab-' + E(id) + '-rech" hidden><p class="sp">Requêtes déjà composées avec la compétence, l’intention et votre ville.</p><div class="linkgrid" style="margin-top:12px">' + p.where.searches.map(function (s) { return '<a href="' + E(s.url) + '" target="_blank" rel="noopener noreferrer">' + E(s.name) + ui.icon('ext') + '</a>'; }).join('') + '</div></div>';
    html += '</details>';
    return html;
  }
  ui.mountTabs = function (root) {
    ui.$$('.tabs[role=tablist]', root).forEach(function (tl) {
      var tabs = ui.$$('button[role=tab]', tl);
      tabs.forEach(function (b, i) {
        b.addEventListener('click', function () { select(i); });
        b.addEventListener('keydown', function (ev) { if (ev.key === 'ArrowRight' || ev.key === 'ArrowLeft') { ev.preventDefault(); ev.stopPropagation(); var j = (i + (ev.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length; select(j); tabs[j].focus(); } });
      });
      function select(i) { tabs.forEach(function (t, k) { t.setAttribute('aria-selected', k === i); t.tabIndex = k === i ? 0 : -1; var pnl = document.getElementById(t.getAttribute('aria-controls')); if (pnl) pnl.hidden = k !== i; }); }
      select(0);
    });
  };
  ui.actions.toOffer = function () { ui.st.mode = 'both'; ui.st.step = 'forces'; ui.save(true); ui.go('#/bilan/forces'); };

  /* ---------- exports et utilisations ---------- */
  ui.actions.passport = function () { C.download(C.fileSlug(ui.st) + '-passeport.html', C.passportHTML(ui.st), 'text/html;charset=utf-8'); ui.toast('Passeport téléchargé'); };
  ui.actions.json = function () { C.download(C.fileSlug(ui.st) + '.json', C.toJSON(ui.st), 'application/json'); ui.toast('Export JSON téléchargé'); };
  ui.actions.print = function () { W.print(); };
  ui.actions.ics = function () {
    var ev = C.learnerEvents(ui.st);
    if (ui.st.mode !== 'learn') { var plan = C.offerPlan(ui.st); ev = ev.concat(C.offerEvents(ui.st, plan)); }
    if (!ev.length) { ui.toast('Aucun jalon à exporter', 'wait'); return; }
    C.download(C.fileSlug(ui.st) + '-plan.ics', C.toICS(ev), 'text/calendar;charset=utf-8'); ui.toast(ev.length + ' événements exportés');
  };
  ui.actions.gocompare = function () { ui.go('#/comparer'); };
  ui.actions.goGroup = function () { ui.go('#/groupe'); };
  ui.actions.goProgress = function () { ui.go('#/progres'); };
  ui.actions.goData = function () { ui.go('#/donnees'); };
  ui.actions.share = function () {
    C.encodeShare(ui.st).then(function (code) {
      var url = C.shareUrl(code);
      ui._copyStore = ui._copyStore || {}; ui._copyStore.shareurl = url;
      ui.drawer('Lien de partage', '<p class="sp">Ce lien contient votre bilan encodé (compétences, envies, profil). Votre ami l’ouvre sans compte, et peut le comparer au sien pour trouver des trocs. Aucune donnée ne transite par un serveur.</p>' +
        '<textarea class="input" readonly style="margin-top:14px;font:12px var(--f-mono);min-height:120px" aria-label="Lien de partage" onclick="this.select()">' + E(url) + '</textarea>' +
        '<div class="row" style="margin-top:10px"><button class="btn primary" data-act="copy" data-id="shareurl">' + ui.icon('copy') + ' Copier le lien</button><span class="faint">' + url.length + ' caractères · ' + (code[0] === 'z' ? 'compressé' : 'JSON compact') + '</span></div>' +
        '<p class="faint" style="margin-top:14px;font-size:11.5px">Le prénom et la ville sont inclus. Les années, preuves et la clé du copilote ne le sont pas.</p>');
    });
  };
  ui.actions.cv = function () {
    var lines = C.cvSection(ui.st);
    ui.drawer('Section CV', '<p class="sp">À coller dans la rubrique « Centres d’intérêt » d’un CV ou d’un profil LinkedIn. Les compétences transverses sont celles que vos pratiques développent.</p>' + ui.copyBlock('Centres d’intérêt et compétences transverses', lines.join('\n')) +
      '<div class="lbl" style="margin-top:18px">Version courte</div>' + ui.copyBlock('Une ligne', lines[0] || ''));
  };
  ui.actions.wishlist = function () {
    var wl = C.wishlist(ui.st);
    if (!wl.length) { ui.toast('Retenir des envies d’abord', 'wait'); return; }
    var name = ui.st.context.firstName || 'moi';
    var txt = 'Idées de cadeaux pour ' + name + ' : un atelier pour apprendre\n' + wl.map(function (x) { return '· ' + x.s.name + ' (atelier découverte, ' + U.eur(x.range.lo) + ' à ' + U.eur(x.range.hi) + ')' + (x.links[0] ? ' : ' + x.links[0].url : ''); }).join('\n');
    ui.drawer('Liste d’envies à offrir', '<p class="sp">Pour un anniversaire ou les fêtes : des ateliers plutôt que des objets. Copiez la liste et envoyez-la à vos proches.</p>' +
      wl.map(function (x) { return '<div class="resitem"><div class="nm">' + E(x.s.name) + '</div><div class="faint num">' + U.eur(x.range.lo) + '–' + U.eur(x.range.hi) + '</div><div class="m">' + x.links.map(function (l) { return ui.extLink(l.url, l.name); }).join(' · ') + (x.searches[0] ? ' · ' + ui.extLink(x.searches[0].url, 'Recherche ' + x.searches[0].name) : '') + '</div></div>'; }).join('') +
      ui.copyBlock('Texte à envoyer', txt));
  };
  ui.actions.challenge = function (el) {
    var ys = C.yesDesires(ui.st);
    if (!ys.length) { ui.toast('Retenir une envie d’abord', 'wait'); return; }
    var id = (el && el.getAttribute('data-id')) || ui.st.challenge.skill || ys[0];
    if (ys.indexOf(id) < 0) id = ys[0];
    ui.st.challenge.skill = id; ui.save();
    var days = C.challenge30(ui.st, id), ck = ui.st.challenge.checked || {};
    var done = days.filter(function (d) { return ck[id + ':' + d.day]; }).length;
    ui.drawer('Défi 30 jours', '<div class="row">' + ys.slice(0, 5).map(function (k) { return '<button class="chip' + (k === id ? ' on' : '') + '" data-act="challenge" data-id="' + E(k) + '"><i></i>' + E(C.data.sById[k].short || C.data.sById[k].name) + '</button>'; }).join('') + '</div>' +
      '<div class="spread" style="margin:14px 0 6px"><span class="lbl">' + done + ' / 30 jours</span><button class="btn sm" data-act="challengeIcs" data-id="' + E(id) + '">' + ui.icon('cal') + ' Agenda</button></div><div class="progress"><b style="width:' + Math.round(done / 30 * 100) + '%"></b></div>' +
      '<div class="daygrid" style="margin-top:14px">' + days.map(function (d) { var on = !!ck[id + ':' + d.day]; return '<label class="day' + (d.milestone ? ' ms' : '') + (on ? ' done' : '') + '"><input type="checkbox" data-act="challengeTick" data-key="' + E(id + ':' + d.day) + '"' + (on ? ' checked' : '') + '><b>J' + d.day + '</b><span>' + E(d.text) + '</span></label>'; }).join('') + '</div>');
  };
  ui.actions.challengeTick = function (el) {
    var k = el.getAttribute('data-key'); ui.st.challenge.checked = ui.st.challenge.checked || {};
    if (el.checked) ui.st.challenge.checked[k] = true; else delete ui.st.challenge.checked[k];
    el.closest('.day').classList.toggle('done', el.checked); ui.save();
  };
  ui.actions.challengeIcs = function (el) { var id = el.getAttribute('data-id'); C.download('cordes-defi-30-jours.ics', C.toICS(C.challengeEvents(ui.st, id)), 'text/calendar;charset=utf-8'); ui.toast('30 rappels exportés'); };

  /* ---------- copilote (panneau réutilisable) ---------- */
  ui.copilotPanel = function (key, template, prompt) {
    ui._ai = ui._ai || {}; ui._ai[key] = { template: template, prompt: prompt };
    return '<section class="panel" id="ai-' + key + '"><div class="ph"><span class="t">' + (C.ai.has() ? 'Copilote · Claude' : 'Synthèse automatique') + '</span><span class="hint">' + (C.ai.has() ? 'clé enregistrée sur cet appareil' : 'version gabarit, sans clé') + '</span></div><div class="pb"><div class="prose" id="ai-out-' + key + '" aria-live="polite">' + E(template).replace(/\n\n/g, '</p><p>').replace(/^/, '<p>').replace(/$/, '</p>').replace(/<p>([A-ZÉÈ ]{4,})<\/p>/g, '<div class="lbl" style="margin-top:12px">$1</div>') + '</div>' +
      '<div class="row noprint" style="margin-top:14px">' + (C.ai.has() ? '<button class="btn" data-act="aiRun" data-key="' + key + '">' + ui.icon('spark') + ' Générer avec Claude</button>' : '<a class="btn ghost" href="#/copilote">' + ui.icon('spark') + ' Activer le copilote IA</a>') + '<button class="btn ghost" data-act="aiCopy" data-key="' + key + '">' + ui.icon('copy') + ' Copier</button></div></div></section>';
  };
  ui.actions.aiCopy = function (el) { var o = ui.$('#ai-out-' + el.getAttribute('data-key')); if (o) ui.copy(o.innerText); };
  ui.actions.aiRun = function (el) {
    var key = el.getAttribute('data-key'), cfg = ui._ai[key], out = ui.$('#ai-out-' + key);
    if (!cfg || !out) return;
    el.disabled = true; out.innerHTML = '<span class="status"><span class="spin"></span>Rédaction en cours…</span>';
    C.ai.ask(cfg.prompt + '\n\nBILAN\n' + C.ai.profileText(ui.st) + (cfg.extra ? '\n\n' + cfg.extra : ''), function (t) { out.textContent = t; out.style.whiteSpace = 'pre-wrap'; })
      .then(function () { el.disabled = false; ui.toast('Texte généré'); })
      .catch(function (e) { el.disabled = false; out.innerHTML = '<div class="note no"><span class="lbl">Copilote indisponible</span><span class="sp">' + E(C.ai.errorText(e)) + '</span></div><p style="margin-top:12px">' + E(cfg.template).replace(/\n/g, '<br>') + '</p>'; });
  };

  ui.emptyBilan = function () {
    return '<div class="wrap narrow"><div class="panel pad" style="margin-top:30px"><div class="kicker">Aucun bilan</div><h1 class="h1">Commencer par le bilan</h1><p class="lead">Dix minutes suffisent. Vous pouvez aussi ouvrir un profil de démonstration.</p><div class="row" style="margin-top:16px"><a class="btn primary" href="#/accueil">Commencer</a><a class="btn" href="#/demo">Voir la démo</a></div></div></div>';
  };
})(window);
