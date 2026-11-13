/* Accueil, démo, liste d'attente, copilote, page « Comment ça marche ». */
(function (W) {
  'use strict';
  var C = W.Cordes, U = C.util, ui = C.ui, E = ui.e;

  ui.routes.accueil = {
    title: 'Bilan de compétences de vie',
    render: function (st) {
      var D = C.data, R = C.res;
      var has = st.mode && (Object.keys(st.skills).length || st.step);
      var html = '<div class="wrap"><section class="hero"><div><div class="kicker">Bilan de compétences de vie · gratuit · sans compte</div>' +
        '<h1 class="h1">Tout ce que vous savez faire, et tout ce que vous voulez apprendre.</h1>' +
        '<p class="lead">Cuisine, musique, bricolage, éloquence, magie, jardin… En dix minutes, faites le point sur vos savoir-faire et vos envies. Cordes vous dit où, avec qui et comment apprendre, ou comment transmettre et en tirer un revenu.</p>' +
        '<div class="row" style="margin-top:16px">' + ui.pill(D.skills.length + ' compétences', 'idle', false) + ui.pill(D.universes.length + ' univers', 'idle', false) + ui.pill(R.platforms.length + ' plateformes réelles', 'idle', false) + '<a class="pill int pilllink" href="#/donnees"><i></i>vos données restent sur cet appareil</a></div></div>' +
        '<div class="modes" role="group" aria-label="Choisir un parcours">' +
        [['learn', 'J’apprends', 'Faire le point en 3 minutes, découvrir ce qui me tente et obtenir un plan concret pour y arriver.'], ['offer', 'Je transmets', 'Transformer un savoir-faire en offres, en prix, en canaux et en revenus, avec une feuille de route de 90 jours.'], ['both', 'Les deux', 'Apprendre et transmettre, avec des idées de troc : ce que je sais contre ce que je veux.']]
          .map(function (m) { return '<button class="choice' + (st.mode === m[0] && has ? ' on' : '') + '" data-act="start" data-mode="' + m[0] + '"><span class="h3">' + E(m[1]) + ui.icon('arrowR') + '</span><p class="sp">' + E(m[2]) + '</p></button>'; }).join('') + '</div></section>';
      if (has) {
        var done = st.step === 'done';
        html += '<section class="panel" style="margin-top:22px"><div class="ph"><span class="t">Votre bilan en cours</span><span class="hint">' + (st.demo ? 'profil de démonstration' : 'enregistré sur cet appareil') + '</span></div><div class="pb spread"><p class="sp">' + (st.context.firstName ? E(st.context.firstName) + ' · ' : '') + ({ learn: 'J’apprends', offer: 'Je transmets', both: 'Les deux' }[st.mode]) + ' · ' + Object.keys(st.skills).filter(function (k) { return st.skills[k].level > 0; }).length + ' compétences · ' + C.yesDesires(st).length + ' envies' + (done ? '' : ' · étape « ' + E(ui.STEP_DEFS[st.step] || 'Vous') + ' »') + '</p>' +
          '<div class="row">' + (done ? '<a class="btn primary" href="' + ui.resultRoute(st) + '">Voir mes résultats</a><a class="btn" href="#/bilan/contexte">Modifier</a>' : '<a class="btn primary" href="#/bilan/' + (st.step || 'contexte') + '">Reprendre</a>') + '<button class="btn ghost danger" data-act="reset">Réinitialiser</button></div></div></section>';
      }
      html += '<div class="section-h"><span class="kicker">Exemples</span><h2 class="h2">Voir un résultat en un clic</h2></div><div class="grid3">' + C.DEMOS.map(demoCard).join('') + '</div>';
      html += '<div class="section-h"><span class="kicker">Catalogue</span><h2 class="h2">17 univers, du plus courant au plus rare</h2></div><div class="unistrip">' + D.universes.map(function (u) { return '<span><span class="sw" style="background:' + C.hue(u.id) + '"></span>' + E(u.name) + ' <b class="faint" style="font-weight:400">' + D.byUniverse[u.id].length + '</b></span>'; }).join('') + '</div>';
      html += '<div class="section-h"><span class="kicker">Outils</span><h2 class="h2">Utiles même sans bilan</h2></div><div class="tiles">' +
        [['#/outils/autour', 'Autour de moi', 'Écoles, clubs, ateliers et tiers-lieux réels près de chez vous, via OpenStreetMap'], ['#/outils/recherches', 'Recherches préparées', 'Liens directs vers Superprof, Meetup, Eventbrite, YouTube, HelloAsso…'], ['#/comparer', 'Comparer avec un ami', 'Coller son lien de bilan : compétences communes et trocs possibles'], ['#/groupe', 'Comparer en groupe', 'De 3 à 8 amis : qui peut apprendre quoi à qui'],
          ['#/lieu', 'Proposer un lieu', 'Café, bar, studio, atelier : vos heures creuses deviennent des séances'], ['#/progres', 'Mes progrès', 'Comparer deux bilans datés, rappel tous les 3 mois'], ['#/donnees', 'Mes données', 'Ce qui reste sur l’appareil, export et suppression'], ['#/comment', 'Comment ça marche', 'Les algorithmes expliqués, avec leurs poids réels']]
          .map(function (t) { return '<a class="tile" href="' + t[0] + '" style="text-decoration:none"><span class="t">' + E(t[1]) + '</span><span class="d">' + E(t[2]) + '</span></a>'; }).join('') + '</div>';
      var zone = C.zoneOf(st.context.city) || 'Paris 11e';
      html += '<div class="section-h"><span class="kicker">Bientôt</span><h2 class="h2">La plateforme ouvre quartier par quartier</h2></div><div class="grid2"><section class="panel"><div class="pb">' +
        '<p class="prose">Des séances d’une heure en groupe de 2 à 4, près de chez vous, dans des cafés, ateliers et studios partenaires aux heures creuses. Un quartier ouvre quand ' + C.OPEN_GOAL + ' voisins se sont inscrits.</p>' +
        '<div class="row" style="margin-top:14px"><a class="btn primary" href="#/attente">Rejoindre la liste</a><a class="btn" href="#/attente/host">Devenir hôte</a><a class="btn" href="#/lieu">Proposer un lieu</a></div></div></section>' +
        '<section class="panel"><div class="ph"><span class="t">Ouverture</span><span class="hint">' + E(zone) + '</span></div><div class="pb">' + ui.quarterHTML(zone, { noText: false }) + '</div></section></div>';
      return html + '</div>';
    }
  };
  function demoCard(d) {
    return '<section class="panel democard"><div class="pb"><div class="lbl">' + E({ learn: 'J’apprends', offer: 'Je transmets', both: 'Les deux' }[d.mode]) + '</div><div class="h3" style="margin-top:6px">' + E(d.name) + ' · ' + E(d.tag) + '</div><p class="sp" style="margin-top:6px">' + E(d.blurb) + '</p><button class="btn dc-go" data-act="loadDemo" data-id="' + d.id + '">Voir le résultat ' + ui.icon('arrowR') + '</button></div></section>';
  }
  ui.actions.loadDemo = function (el) {
    var id = el.getAttribute('data-id');
    if (ui.st.mode && !ui.st.demo && Object.keys(ui.st.skills).length) {
      try { W.localStorage.setItem('cordes.v1.backup', JSON.stringify(ui.st)); } catch (e) { /* plein */ }
      ui.toast('Votre bilan est mis de côté : le restaurer depuis la page Démo', 'wait');
    }
    ui.st = C.buildDemo(id); ui.save(true);
    ui.go(ui.resultRoute(ui.st));
  };
  ui.actions.restoreBackup = function () {
    try { var b = JSON.parse(W.localStorage.getItem('cordes.v1.backup')); if (b) { ui.st = C.mergeState(b); W.localStorage.removeItem('cordes.v1.backup'); ui.save(true); ui.toast('Bilan restauré'); ui.go(ui.resultRoute()); } } catch (e) { ui.toast('Sauvegarde illisible', 'no'); }
  };

  ui.routes.demo = {
    title: 'Démo',
    render: function () {
      var backup = null; try { backup = W.localStorage.getItem('cordes.v1.backup'); } catch (e) { backup = null; }
      return '<div class="wrap"><div class="kicker">Démo</div><h1 class="h1">Trois profils fictifs</h1><p class="lead">Chaque profil est un bilan complet, préremplis à partir du vrai catalogue. Les résultats sont calculés en direct par les mêmes algorithmes que pour vous.</p>' +
        (backup ? '<div class="note wait" style="margin-top:16px"><span class="lbl">Bilan mis de côté</span><span class="sp">Votre propre bilan a été sauvegardé avant l’ouverture d’une démo.</span> <button class="btn sm" data-act="restoreBackup">Restaurer mon bilan</button></div>' : '') +
        '<div class="grid3" style="margin-top:20px">' + C.DEMOS.map(demoCard).join('') + '</div></div>';
    }
  };

  /* ---------- copilote ---------- */
  ui.routes.copilote = {
    title: 'Copilote IA',
    render: function (st) {
      var has = C.ai.has();
      var sugg = st.mode ? ['Par quoi commencer cette semaine, concrètement ?', 'Comment trouver un créneau régulier avec mon emploi du temps ?', st.mode !== 'learn' ? 'Écris l’annonce de ma première séance.' : 'Quelle envie choisir en premier, et pourquoi ?', 'Quelles compétences combiner pour un projet collectif ?'] : ['Comment apprendre la poterie sans acheter de tour ?', 'Quel prix pour un atelier de cuisine de 2 h à Lyon ?'];
      return '<div class="wrap narrow"><div class="kicker">Facultatif</div><h1 class="h1">Copilote IA</h1><p class="lead">Avec votre propre clé API Claude, le copilote rédige une synthèse de votre bilan, des trames de séance détaillées, des publications et répond à vos questions. Sans clé, l’app reste complète : chaque texte a une version gabarit.</p>' +
        '<section class="panel" style="margin-top:20px"><div class="ph"><span class="t">Clé API</span>' + (has ? ui.pill('enregistrée', 'int') : ui.pill('aucune clé', 'idle')) + '</div><div class="pb">' +
        '<label class="field" style="margin-top:0"><span class="lbl">Clé Anthropic (commence par sk-ant-)</span><input class="input" type="password" id="ai-key" autocomplete="off" spellcheck="false" placeholder="' + (has ? '•••••••• enregistrée' : 'sk-ant-…') + '"></label>' +
        '<div class="row" style="margin-top:12px"><button class="btn primary" data-act="aiSave">Enregistrer</button>' + (has ? '<button class="btn ghost danger" data-act="aiDel">Supprimer la clé</button>' : '') + '</div>' +
        '<p class="faint" style="margin-top:12px;font-size:11.5px">La clé reste dans ce navigateur (localStorage), n’est jamais incluse dans les exports ni dans les liens de partage, et part directement vers api.anthropic.com. Modèle utilisé : ' + E(C.AI_MODEL) + '. Les appels sont facturés sur votre compte Anthropic.</p></div></section>' +
        '<section class="panel" style="margin-top:16px"><div class="ph"><span class="t">Poser une question</span><span class="hint">' + (st.mode ? 'votre bilan est joint à la question' : 'aucun bilan : réponse générale') + '</span></div><div class="pb">' +
        '<div class="chips">' + sugg.map(function (s) { return '<button class="chip" data-act="aiSugg"><i></i>' + E(s) + '</button>'; }).join('') + '</div>' +
        '<textarea class="input" id="ai-q" style="margin-top:12px" placeholder="Votre question"></textarea><div class="row" style="margin-top:10px"><button class="btn primary" data-act="aiAsk"' + (has ? '' : ' disabled') + '>' + ui.icon('spark') + ' Demander</button>' + (has ? '' : '<span class="faint">Enregistrer une clé pour activer</span>') + '</div>' +
        '<div id="ai-ans" class="prose" style="margin-top:16px;white-space:pre-wrap" aria-live="polite"></div></div></section></div>';
    }
  };
  ui.actions.aiSave = function () { var k = ui.$('#ai-key').value.trim(); if (!k) { ui.toast('Coller une clé', 'wait'); return; } if (!/^sk-ant-/.test(k)) ui.toast('Format inhabituel, clé enregistrée quand même', 'wait'); else ui.toast('Clé enregistrée'); C.ai.setKey(k); ui.render(); };
  ui.actions.aiDel = function () { C.ai.setKey(''); ui.toast('Clé supprimée', 'wait'); ui.render(); };
  ui.actions.aiSugg = function (el) { var q = ui.$('#ai-q'); q.value = el.textContent; q.focus(); };
  ui.actions.aiAsk = function (el) {
    var q = ui.$('#ai-q').value.trim(), out = ui.$('#ai-ans'); if (!q) { ui.toast('Écrire une question', 'wait'); return; }
    el.disabled = true; out.innerHTML = '<span class="status"><span class="spin"></span>Réflexion…</span>';
    C.ai.ask(q + (ui.st.mode ? '\n\nBILAN\n' + C.ai.profileText(ui.st) : ''), function (t) { out.textContent = t; })
      .then(function () { el.disabled = false; }).catch(function (e) { el.disabled = false; out.innerHTML = '<div class="note no"><span class="lbl">Erreur</span><span class="sp">' + E(C.ai.errorText(e)) + '</span></div>'; });
  };

  /* ---------- comment ça marche ---------- */
  ui.routes.comment = {
    title: 'Comment ça marche',
    render: function () {
      var R = C.res, D = C.data, w = C.SIM_WEIGHTS, dk = C.DECK;
      var nv = R.platforms.filter(function (p) { return p.verify; }).length;
      var secs = [['donnees', 'Les données'], ['similarite', 'Similarité'], ['paquet', 'Paquet d’inspiration'], ['archetype', 'Archétype'], ['plan', 'Plan d’apprentissage'], ['prix', 'Prix conseillé'], ['canaux', 'Canaux'], ['statut', 'Statut'], ['niche', 'Niche'], ['troc', 'Troc'], ['partage', 'Partage et exports'], ['autour', 'Autour de moi'], ['limites', 'Limites']];
      var f = function (x) { return String(x).replace('.', ','); };
      return '<div class="wrap"><div class="kicker">Transparence</div><h1 class="h1">Comment ça marche</h1><p class="lead">Aucune boîte noire : chaque recommandation vient d’une formule simple, appliquée au catalogue et à vos réponses, entièrement dans votre navigateur. Les poids ci-dessous sont lus dans le code en direct.</p>' +
        '<div class="doc" style="margin-top:24px"><nav class="toc" aria-label="Sommaire">' + secs.map(function (s) { return '<a href="#" data-act="scrollTo" data-target="d-' + s[0] + '">' + E(s[1]) + '</a>'; }).join('') + '</nav><div class="prose" style="max-width:none">' +
        '<section id="d-donnees" tabindex="-1"><h2>Les données</h2><div class="counters">' + ui.counter('Compétences', D.skills.length, D.domains.length + ' domaines') + ui.counter('Plateformes', R.platforms.length, nv + ' à vérifier', 'sent') + ui.counter('Lieux types', R.communityTypes.length, R.networks.length + ' réseaux', 'int') + ui.counter('Statuts', R.statuses.length, 'relevé ' + E(R.updated || ''), 'wait') + '</div>' +
        '<p style="margin-top:12px">Chaque compétence porte 4 jalons observables, 12 attributs (social, physique, créatif, coût, heures pour se débrouiller, demande, potentiel de revenu, tendance…), des tags partagés, des compétences transverses et des formats d’offre. Les plateformes portent leur commission, leur audience, l’effort de mise en route et la maîtrise de la relation client. Le badge « à vérifier » signale un chiffre non confirmé à la source.</p>' +
        (C.anomalies.length ? '<div class="note wait" style="margin-top:12px"><span class="lbl">Anomalies de données contournées (' + C.anomalies.length + ')</span><ul class="clean">' + C.anomalies.slice(0, 12).map(function (a) { return '<li>' + E(a.msg) + '</li>'; }).join('') + '</ul></div>' : '<div class="note int" style="margin-top:12px"><span class="lbl">Contrôle des données</span>Aucune anomalie détectée au chargement : ids uniques, liens « related » valides, attributs dans leurs bornes.</div>') + '</section>' +
        '<section id="d-similarite" tabindex="-1"><h2>Similarité entre compétences</h2><div class="formula">sim(a,b) = ' + f(w.tags) + ' × JaccardIDF(tags) + ' + f(w.universe) + ' × même univers + ' + f(w.domain) + ' × même domaine\n          + ' + f(w.related) + ' × lien « related » + ' + f(w.attrs) + ' × proximité des attributs + ' + f(w.soft) + ' × Jaccard(soft skills)</div>' +
        '<p>Le Jaccard des tags est pondéré par la rareté (IDF) : partager « precision », présent sur ' + countTag('precision') + ' compétences, rapproche peu ; partager un tag rare rapproche beaucoup. La proximité des attributs est un cosinus sur des vecteurs centrés (social, physique, créatif, intellectuel, en ligne, transmissible, coût). Le graphe des 12 plus proches voisins de chaque compétence est calculé au chargement, soit ' + U.fmt(D.skills.length * (D.skills.length - 1) / 2) + ' paires.</p></section>' +
        '<section id="d-paquet" tabindex="-1"><h2>Paquet d’inspiration</h2><div class="formula">score = ' + f(dk.w.aff) + ' × affinité + ' + f(dk.w.ctx) + ' × contexte + ' + f(dk.w.trend) + ' × tendance + ' + f(dk.w.explore) + ' × exploration\n      + ' + f(dk.w.bridge) + ' × passerelle + ' + f(dk.w.demand) + ' × demande + appris(tags, univers)\nchoix = argmax  ' + f(dk.lambda) + ' × score − ' + f(Math.round((1 - dk.lambda) * 100) / 100) + ' × max sim(cartes récentes) − ' + f(dk.uniPenalty) + ' × univers répétés   (MMR)</div>' +
        '<p><strong>Affinité</strong> : moyenne pondérée des 3 meilleures similarités à vos ancres (compétences notées, pondérées par niveau et plaisir, et envies déjà acceptées). <strong>Contexte</strong> : coût de départ comparé à votre budget, heures nécessaires comparées à votre temps, présentiel ou en ligne, et vos intentions (rencontres → compétences sociales, défi → intellectuelles ou physiques). <strong>Passerelle</strong> : proche d’ancres situées dans deux univers différents. <strong>Exploration</strong> : bonus aux univers jamais touchés. <strong>Apprentissage en ligne</strong> : chaque « ça me tente » ajoute ' + f(dk.learnYes) + ' à chacun de ses tags et ' + f(dk.learnUniYes) + ' à son univers ; chaque « pas pour moi » retire ' + f(dk.learnNo) + ' et ' + f(dk.learnUniNo) + '. Le panneau « Ce que le paquet a appris » affiche ces poids.</p></section>' +
        '<section id="d-archetype" tabindex="-1"><h2>Archétype d’apprenant</h2><p>Les 8 réponses construisent un vecteur sur 6 axes (' + C.STYLE_DIMS.map(function (d) { return d.lo.toLowerCase() + ' / ' + d.hi.toLowerCase(); }).join(', ') + '). L’archétype est le plus proche des ' + C.ARCHETYPES.length + ' centroïdes (distance euclidienne) ; la confiance mesure l’écart avec le deuxième. Ce sont des préférences de format, pas des traits de personnalité.</p></section>' +
        '<section id="d-plan" tabindex="-1"><h2>Plan d’apprentissage</h2><div class="formula">heures   = hoursToBasics × (facteur(cible) − facteur(niveau actuel))   facteurs : ' + C.LEVEL_FACTOR.join(' / ') + '\nsemaines = heures ÷ (temps hebdo ÷ min(envies, 3))   (× 1,4 pour l’envie prioritaire)\nbudget   = matériel selon « cost » + séances encadrées selon le format préféré (fourchette pricing)</div><p>Les jalons de 1re heure, 1er mois et objectif reprennent les 4 niveaux observables de la compétence. Le premier pas choisit, dans l’ordre, une app si vous apprenez seul, un atelier découverte sur une plateforme spécialisée, une communauté locale, ou un prof.</p></section>' +
        '<section id="d-prix" tabindex="-1"><h2>Prix conseillé</h2><div class="formula">p = 0,35 + niveau (−0,18 à +0,12) + années (jusqu’à +0,15) + preuves (+0,04 chacune, 3 au plus) + transmission (−0,12 à +0,06), borné à [0,05 ; 0,9]\nprix = (bas + p × (haut − bas)) × ville (Paris × 1,15, grandes villes × 1,05) × jauge, arrondi à 5 €</div><p>Les fourchettes viennent de <em>pricing[univers][format]</em> (relevés ' + E(R.updated || '') + '). ' + E(R.pricingNotes || '') + '</p></section>' +
        '<section id="d-canaux" tabindex="-1"><h2>Recommandation de canaux</h2><div class="formula">score = √(part de vos offres couverte par la plateforme) × adéquation univers\n      × (w_audience × audience + w_commission × (1 − frais) + w_effort × facilité + w_relation × maîtrise)\n      × modulateurs (caméra pour les canaux vidéo, présentiel ou en ligne)</div><p>Les poids changent avec l’objectif : « en vivre » pèse la maîtrise de la relation (' + f(C.channelWeights({ offer: { goals: ['activite'] } }).control) + ') ; « complément » pèse l’audience et la facilité. Les frais combinent commission, abonnement rapporté au revenu visé et frais fixes par réservation.</p></section>' +
        '<section id="d-statut" tabindex="-1"><h2>Statut</h2><p>Chaque statut du fichier de ressources est noté : revenu annuel visé dans la plage <em>fit</em> (+2), projet collectif (+1), puis règles par nature : cours et ateliers → micro-entreprise BNC, vente de créations → micro vente, œuvres et contenus artistiques → artiste-auteur, cours à domicile pour enfants ou seniors → services à la personne (crédit d’impôt de 50 % pour le client), faible goût pour l’administratif → CAE, revenus au-delà des plafonds → société. Les taux de cotisation sont lus dans le texte du statut ; à défaut, une estimation signalée comme telle.</p></section>' +
        '<section id="d-niche" tabindex="-1"><h2>Niche différenciante</h2><div class="formula">score(a,b) = (' + f(C.NICHE_W.comp) + ' × complémentarité + ' + f(C.NICHE_W.demand) + ' × demande + ' + f(C.NICHE_W.monet) + ' × revenu + ' + f(C.NICHE_W.rare) + ' × rareté + ' + f(C.NICHE_W.fmt) + ' × formats communs) × niveau × plausibilité\ncomplémentarité = (1 − JaccardIDF(tags)) × (univers différents ? 1 : 0,6) ; rareté = 1 − sim(a,b)</div></section>' +
        '<section id="d-troc" tabindex="-1"><h2>Troc</h2><p>A peut apprendre x de B si A veut x et que B sait x au niveau 3 ou plus, ou une compétence très proche (similarité ≥ 0,55). Un troc est une paire « A apprend x de B, B apprend y de A », classée par niveaux et priorités. Les envies communes deviennent des activités à deux, les compétences communes des séances à animer ensemble.</p></section>' +
        '<section id="d-partage" tabindex="-1"><h2>Partage et exports</h2><p>Le lien de partage contient le bilan compacté (ids, niveaux, envies), compressé en <em>deflate-raw</em> par CompressionStream quand le navigateur le permet, puis encodé en base64url après <code>#b=</code> : rien ne passe par un serveur. Le passeport est un fichier HTML unique qui embarque les données et un mini-rendu. L’agenda suit la norme iCalendar (lignes pliées à 75 octets).</p></section>' +
        '<section id="d-autour" tabindex="-1"><h2>Autour de moi</h2><p>La ville est géocodée par Nominatim (une requête par seconde au plus, résultat gardé en cache local, repli sur une table de ' + Object.keys(C.CITIES).length + ' villes). Les lieux viennent de l’API Overpass d’OpenStreetMap : une requête <em>around:</em> assemblée à partir des sélecteurs par univers et des types de communautés, triée par distance (formule de haversine). Données © contributeurs OpenStreetMap, licence ODbL.</p></section>' +
        '<section id="d-limites" tabindex="-1"><h2>Limites</h2><ul class="clean"><li>Les niveaux sont déclaratifs : aucune vérification.</li><li>Les attributs du catalogue sont des estimations éditoriales, pas des mesures.</li><li>Les prix et commissions sont des relevés publics de 2026, à confronter au marché local.</li><li>Le statut recommandé est une orientation, pas un conseil juridique ou fiscal.</li><li>OpenStreetMap est inégalement renseigné selon les villes ; zéro résultat ne veut pas dire zéro lieu.</li></ul></section>' +
        '</div></div></div>';
    }
  };
  function countTag(t) { return C.data.skills.filter(function (s) { return s.tags.indexOf(t) >= 0; }).length; }
})(window);
