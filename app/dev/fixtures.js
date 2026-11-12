/* Fixtures de développement (jamais chargées par app/index.html).
   Reproduisent le schéma SCHEMA.md en petit, avec quelques défauts volontaires
   (related inconnu, attrs partiel) pour tester la robustesse du moteur. */
(function (W) {
  var U = [
    ['cuisine', 'Cuisine & boissons', 'Cuisine', 28, '◐'], ['musique', 'Musique & son', 'Musique', 268, '♪'], ['image', 'Arts visuels & image', 'Image', 318, '◇'],
    ['artisanat', 'Artisanat & fait-main', 'Artisanat', 22, '✂'], ['maison', 'Maison, bricolage & réparation', 'Maison', 40, '⌂'], ['nature', 'Nature, jardin & animaux', 'Nature', 110, '❦'],
    ['sport', 'Sport & mouvement', 'Sport', 4, '◎'], ['pleinair', 'Plein air & aventure', 'Plein air', 150, '△'], ['scene', 'Danse, scène & spectacle', 'Scène', 340, '✦'],
    ['parole', 'Parole, langues & écriture', 'Parole', 200, '❝'], ['jeux', 'Jeux & stratégie', 'Jeux', 52, '♞'], ['tech', 'Numérique, tech & IA', 'Tech', 190, '⌘'],
    ['bienetre', 'Bien-être, corps & esprit', 'Bien-être', 170, '○'], ['style', 'Style, beauté & mode', 'Style', 300, '◈'], ['savoirs', 'Culture, sciences & savoirs', 'Savoirs', 230, '∴'],
    ['pratique', 'Vie pratique & débrouille', 'Pratique', 80, '⚙'], ['social', 'Lien social, animation & engagement', 'Social', 130, '◍']
  ];
  // id, nom, univers, domaine, tags, soft, formats, related, attrs [social,physical,creative,intellectual,cost,hours,oneHour,online,demand,monet,teach,trend], regulated
  var S = [
    ['latte-art', 'Latte art', 'cuisine', 'cafe', 'geste precision boisson convivial cafe', 'patience precision creativite', 'atelier cours prestation contenu evenement', 'torrefaction degustation-cafe illustration', [1, 1, 2, 1, 2, 10, 1, 1, 2, 2, 3, 1], null],
    ['degustation-cafe', 'Dégustation de café', 'cuisine', 'cafe', 'degustation boisson cafe sens', 'observation memoire', 'atelier evenement entreprise', 'latte-art oenologie', [2, 0, 1, 2, 1, 8, 1, 1, 1, 1, 3, 1], null],
    ['torrefaction', 'Torréfaction', 'cuisine', 'cafe', 'cafe artisanal chimie', 'rigueur precision', 'atelier produit', 'latte-art inconnu-id', [0, 1, 1, 2, 3, 40, 0, 0, 1, 2, 2, 1], null],
    ['pain-levain', 'Pain au levain', 'cuisine', 'boulange', 'fermentation patisserie geste artisanal', 'patience rigueur', 'atelier cours produit', 'patisserie-francaise', [1, 1, 2, 2, 1, 20, 0, 1, 3, 2, 3, 1], 'alimentaire'],
    ['patisserie-francaise', 'Pâtisserie française', 'cuisine', 'boulange', 'patisserie precision sucre', 'precision rigueur sens-esthetique', 'atelier cours prestation produit', 'pain-levain', [1, 1, 2, 2, 2, 40, 1, 2, 3, 2, 3, 0], 'alimentaire'],
    ['cocktails', 'Cocktails', 'cuisine', 'bar', 'boisson convivial alcool geste', 'creativite precision', 'atelier prestation evenement entreprise', 'oenologie', [3, 1, 2, 1, 2, 15, 1, 1, 3, 2, 3, 1], 'alcool'],
    ['oenologie', 'Œnologie', 'cuisine', 'bar', 'degustation alcool culture sens', 'memoire observation', 'atelier evenement entreprise', 'cocktails degustation-cafe', [2, 0, 0, 2, 2, 30, 1, 1, 2, 2, 3, 0], 'alcool'],
    ['cuisine-monde', 'Cuisine du monde', 'cuisine', 'plats', 'cuisine convivial culture epices', 'curiosite creativite', 'atelier cours prestation evenement', 'patisserie-francaise', [2, 1, 2, 1, 1, 30, 1, 2, 3, 2, 3, 1], 'alimentaire'],
    ['dj', 'DJ', 'musique', 'electro', 'mix rythme ecoute electro soiree', 'ecoute coordination audace', 'cours atelier prestation evenement contenu', 'production-musicale sound-design', [2, 0, 2, 1, 3, 40, 1, 2, 2, 3, 3, 1], null],
    ['production-musicale', 'Production musicale (MAO)', 'musique', 'electro', 'composition production electro numerique', 'creativite rigueur perseverance', 'cours atelier stage contenu produit coaching', 'dj sound-design mixage', [0, 0, 3, 2, 2, 80, 1, 3, 2, 2, 2, 2], null],
    ['mixage', 'Mixage et mastering', 'musique', 'studio', 'production ecoute technique son', 'ecoute precision', 'prestation cours contenu', 'production-musicale', [0, 0, 1, 3, 3, 120, 0, 3, 1, 3, 2, 1], null],
    ['sound-design', 'Sound design', 'musique', 'studio', 'son numerique creation', 'creativite curiosite', 'cours contenu prestation', 'production-musicale', [0, 0, 3, 2, 2, 60, 1, 3, 1, 2, 2, 1], null],
    ['chant', 'Chant', 'musique', 'voix', 'voix scene souffle expression', 'expression ecoute audace', 'cours atelier stage communaute', 'impro-theatre', [2, 1, 2, 1, 0, 40, 1, 1, 3, 2, 3, 0], null],
    ['guitare', 'Guitare', 'musique', 'instruments', 'instrument rythme accords', 'perseverance coordination', 'cours atelier contenu', 'chant', [1, 1, 2, 2, 2, 60, 1, 3, 3, 2, 3, 0], null],
    ['photo-smartphone', 'Photo au smartphone', 'image', 'photo', 'photo cadrage lumiere numerique', 'observation sens-esthetique', 'atelier cours contenu entreprise', 'retouche illustration', [1, 1, 2, 1, 0, 6, 1, 3, 3, 1, 3, 1], null],
    ['illustration', 'Illustration', 'image', 'dessin', 'dessin creation trait couleur', 'creativite sens-esthetique patience', 'atelier cours produit contenu', 'latte-art linogravure', [0, 0, 3, 1, 1, 60, 1, 2, 2, 2, 2, 1], null],
    ['linogravure', 'Linogravure', 'image', 'gravure', 'gravure geste creation artisanal', 'patience precision', 'atelier produit stage', 'illustration', [1, 1, 3, 1, 1, 10, 1, 1, 2, 2, 3, 1], null],
    ['retouche', 'Retouche photo', 'image', 'photo', 'photo numerique logiciel', 'precision', 'cours contenu prestation', 'photo-smartphone', [0, 0, 2, 2, 1, 20, 1, 3, 2, 2, 2, 0], null],
    ['ceramique', 'Céramique (tournage)', 'artisanat', 'terre', 'terre geste artisanal creation', 'patience perseverance', 'atelier stage produit cours', 'linogravure', [1, 2, 3, 1, 3, 40, 1, 0, 3, 2, 3, 1], null],
    ['couture', 'Couture', 'artisanat', 'textile', 'textile geste precision mode', 'patience precision', 'atelier cours prestation produit', 'retouche-vetements', [1, 1, 2, 1, 2, 30, 1, 2, 3, 2, 3, 1], null],
    ['tricot', 'Tricot', 'artisanat', 'textile', 'textile geste patience convivial', 'patience', 'atelier communaute produit', 'couture', [2, 0, 2, 1, 1, 15, 1, 3, 2, 1, 3, 1], null],
    ['reparation-velo', 'Réparation de vélo', 'maison', 'reparation', 'reparation mecanique velo', 'logique autonomie', 'atelier prestation cours', 'bricolage', [1, 2, 0, 2, 1, 10, 1, 2, 2, 1, 3, 1], null],
    ['bricolage', 'Bricolage', 'maison', 'outils', 'outils reparation bois', 'autonomie logique', 'atelier prestation', 'reparation-velo', [1, 2, 1, 1, 2, 30, 1, 2, 3, 2, 2, 0], 'securite'],
    ['permaculture', 'Permaculture', 'nature', 'jardin', 'jardin plantes ecologie dehors', 'patience observation', 'atelier stage communaute', 'plantes-interieur', [2, 2, 1, 2, 1, 40, 0, 1, 2, 1, 3, 1], null],
    ['plantes-interieur', 'Plantes d’intérieur', 'nature', 'jardin', 'plantes soin maison', 'patience observation', 'atelier produit contenu', 'permaculture', [1, 0, 1, 1, 1, 5, 1, 2, 2, 1, 3, 1], null],
    ['escalade', 'Escalade', 'sport', 'grimpe', 'force equilibre dehors defi', 'audace endurance', 'cours atelier evenement', 'yoga', [2, 3, 0, 1, 2, 20, 1, 0, 3, 2, 2, 2], 'sport'],
    ['padel', 'Padel', 'sport', 'raquette', 'raquette equipe defi', 'coordination cooperation', 'cours evenement', 'escalade', [3, 3, 0, 1, 1, 15, 1, 0, 3, 2, 2, 2], 'sport'],
    ['course', 'Course à pied', 'sport', 'endurance', 'endurance dehors souffle', 'endurance perseverance', 'coaching communaute evenement', 'randonnee', [1, 3, 0, 0, 1, 20, 1, 1, 3, 1, 2, 1], 'sport'],
    ['randonnee', 'Randonnée', 'pleinair', 'marche', 'dehors marche nature endurance', 'endurance organisation', 'evenement communaute', 'course permaculture', [2, 2, 0, 1, 1, 10, 1, 0, 3, 1, 2, 1], 'securite'],
    ['kayak', 'Kayak', 'pleinair', 'eau', 'eau dehors equilibre', 'coordination audace', 'cours evenement', 'randonnee', [1, 3, 0, 1, 2, 15, 1, 0, 2, 1, 2, 0], 'sport'],
    ['impro-theatre', 'Improvisation théâtrale', 'scene', 'theatre', 'scene expression ecoute jeu', 'audace ecoute adaptation', 'atelier stage entreprise evenement', 'prise-de-parole chant', [3, 1, 3, 1, 0, 20, 1, 1, 2, 2, 3, 1], null],
    ['magie', 'Magie rapprochée', 'scene', 'magie', 'illusion geste scene', 'precision audace', 'cours prestation evenement contenu', 'impro-theatre', [2, 0, 2, 2, 1, 30, 1, 2, 2, 2, 2, 1], null],
    ['salsa', 'Salsa', 'scene', 'danse', 'danse rythme convivial', 'coordination ecoute', 'cours atelier evenement communaute', 'chant', [3, 2, 1, 0, 0, 25, 1, 1, 3, 2, 3, 0], null],
    ['prise-de-parole', 'Prise de parole en public', 'parole', 'eloquence', 'expression voix argumentation scene', 'expression audace', 'atelier coaching entreprise stage', 'impro-theatre storytelling', [2, 0, 1, 2, 0, 15, 1, 2, 3, 3, 3, 1], null],
    ['storytelling', 'Storytelling', 'parole', 'ecriture', 'ecriture recit expression', 'creativite expression', 'atelier contenu entreprise', 'prise-de-parole podcast', [1, 0, 3, 2, 0, 15, 1, 3, 2, 2, 3, 1], null],
    ['anglais', 'Anglais conversationnel', 'parole', 'langues', 'langue conversation culture', 'memoire perseverance', 'cours atelier communaute', 'storytelling', [2, 0, 0, 2, 0, 200, 0, 3, 3, 2, 3, 0], null],
    ['echecs', 'Échecs', 'jeux', 'echecs', 'strategie logique calcul', 'logique memoire patience', 'cours atelier evenement communaute contenu', 'go', [1, 0, 0, 3, 0, 40, 1, 3, 2, 1, 3, 1], null],
    ['go', 'Jeu de go', 'jeux', 'plateau', 'strategie logique', 'logique patience', 'cours communaute', 'echecs', [1, 0, 1, 3, 0, 40, 1, 3, 1, 1, 2, 0], null],
    ['jeux-societe', 'Animation de jeux de société', 'jeux', 'plateau', 'convivial strategie animation', 'organisation ecoute', 'evenement communaute entreprise', 'echecs', [3, 0, 1, 2, 1, 5, 1, 0, 2, 1, 3, 1], null],
    ['ia-quotidien', 'IA au quotidien', 'tech', 'ia', 'numerique ia automatisation', 'curiosite logique', 'atelier cours entreprise contenu', 'montage-video', [1, 0, 1, 2, 0, 6, 1, 3, 3, 2, 3, 2], null],
    ['montage-video', 'Montage vidéo', 'tech', 'video', 'video numerique recit logiciel', 'creativite rigueur', 'cours atelier contenu prestation', 'photo-smartphone podcast', [0, 0, 2, 2, 1, 25, 1, 3, 3, 2, 2, 1], null],
    ['podcast', 'Podcast', 'tech', 'audio', 'voix recit numerique son', 'expression organisation', 'atelier contenu prestation', 'storytelling mixage', [1, 0, 2, 1, 2, 15, 1, 2, 2, 1, 2, 1], null],
    ['yoga', 'Yoga', 'bienetre', 'corps', 'souffle souplesse calme corps', 'patience ecoute', 'cours atelier stage communaute', 'meditation', [1, 2, 0, 1, 1, 30, 1, 2, 3, 2, 3, 1], 'sport'],
    ['meditation', 'Méditation', 'bienetre', 'esprit', 'calme souffle attention', 'patience ecoute', 'atelier coaching contenu entreprise', 'yoga', [1, 0, 0, 1, 0, 10, 1, 3, 3, 1, 3, 1], null],
    ['maquillage', 'Maquillage', 'style', 'beaute', 'beaute geste couleur', 'sens-esthetique precision', 'atelier prestation contenu', 'couture', [1, 0, 2, 1, 2, 20, 1, 2, 2, 2, 3, 0], null],
    ['retouche-vetements', 'Retouche de vêtements', 'style', 'mode', 'textile mode reparation', 'precision', 'prestation atelier', 'couture', [0, 1, 1, 1, 1, 20, 1, 1, 2, 2, 2, 1], null],
    ['astronomie', 'Astronomie', 'savoirs', 'sciences', 'sciences ciel dehors culture', 'curiosite observation', 'atelier evenement contenu', 'randonnee', [1, 0, 0, 3, 2, 30, 1, 2, 2, 1, 2, 0], null],
    ['histoire-art', 'Histoire de l’art', 'savoirs', 'culture', 'culture art recit', 'curiosite memoire', 'atelier evenement contenu', 'illustration', [1, 0, 1, 3, 0, 40, 1, 3, 2, 1, 3, 0], null],
    ['budget-perso', 'Gérer son budget', 'pratique', 'argent', 'argent organisation logique', 'organisation rigueur', 'atelier coaching contenu', 'ia-quotidien', [0, 0, 0, 2, 0, 5, 1, 3, 2, 1, 3, 0], null],
    ['premiers-secours', 'Premiers secours', 'pratique', 'secours', 'secours soin geste', 'adaptation', 'atelier', 'randonnee', [2, 1, 0, 1, 0, 7, 1, 0, 2, 1, 3, 0], 'securite'],
    ['animation-atelier', 'Animer un atelier collectif', 'social', 'animation', 'animation convivial expression organisation', 'leadership organisation ecoute', 'atelier entreprise coaching', 'jeux-societe prise-de-parole', [3, 0, 1, 1, 0, 15, 1, 1, 2, 2, 3, 1], null],
    ['fresque-climat', 'Animer une Fresque du Climat', 'social', 'engagement', 'ecologie animation sciences', 'pedagogie ecoute', 'atelier entreprise', 'animation-atelier', [3, 0, 1, 2, 0, 10, 1, 1, 2, 2, 3, 1], null]
  ];
  var K = ['social', 'physical', 'creative', 'intellectual', 'cost', 'hoursToBasics', 'oneHourResult', 'online', 'demand', 'monetization', 'teachable', 'trend'];
  var doms = {};
  var skills = S.map(function (r) {
    var a = {}; K.forEach(function (k, i) { a[k] = k === 'oneHourResult' ? !!r[8][i] : r[8][i]; });
    var dom = r[2] + '.' + r[3]; doms[dom] = r[2];
    return {
      id: r[0], name: r[1], universe: r[2], domain: dom, aliases: [], desc: 'Compétence de démonstration : ' + r[1].toLowerCase() + '.',
      levels: ['Premier résultat montrable en ' + r[1].toLowerCase(), 'Se débrouiller seul', 'Pratique autonome avancée', 'Capable de former'],
      attrs: a, regulated: r[9], tags: r[4].split(' '), soft: r[5].split(' '), formats: r[6].split(' '), related: r[7].split(' ')
    };
  });
  W.CORDES_DATA = {
    universes: U.filter(function (u) { return u[0] !== 'social'; }).map(function (u) { return { id: u[0], name: u[1], short: u[2], hue: u[3], desc: 'Univers ' + u[2] + '.', glyph: u[4] }; }),
    domains: Object.keys(doms).map(function (d) { return { id: d, universe: doms[d], name: d.split('.')[1], desc: '' }; }),
    skills: skills,
    softSkills: [{ id: 'patience', name: 'Patience', desc: 'Tenir dans la durée sans se décourager.' }, { id: 'expression', name: 'Expression', desc: 'Dire clairement.' }]
  };
  var allU = U.map(function (u) { return u[0]; });
  var pricing = {}; allU.forEach(function (u) { pricing[u] = { cours: [25, 45], atelier: [25, 50], stage: [70, 180], prestation: [120, 500], coaching: [40, 90], entreprise: [400, 1400], evenement: [10, 25] }; });
  var osm = {}; allU.forEach(function (u) { osm[u] = [{ label: 'Associations', q: 'nwr["club"]' }]; });
  osm.musique = [{ label: 'Écoles de musique', q: 'nwr["amenity"="music_school"]' }, { label: 'Studios', q: 'nwr["amenity"="studio"]' }];
  osm.sport = [{ label: 'Salles d’escalade', q: 'nwr["sport"="climbing"]' }];
  W.CORDES_RESOURCES = {
    updated: '2026-11',
    platforms: [
      { id: 'superprof', name: 'Superprof', url: 'https://www.superprof.fr', sides: ['learn', 'offer'], kinds: ['cours'], universes: ['*'], geo: 'FR', model: 'Annonce gratuite, l’élève paie un pass', fee: { type: 'none' }, audience: '≈ 1 M d’élèves', bestFor: 'Cours particuliers', pros: ['Gratuit pour le prof'], cons: ['Concurrence'], effort: 1, reach: 3, control: 2, verify: false },
      { id: 'wecandoo', name: 'Wecandoo', url: 'https://wecandoo.fr', sides: ['learn', 'offer'], kinds: ['atelier', 'entreprise'], universes: ['artisanat', 'cuisine', 'image', 'nature'], geo: 'FR', model: 'Commission sur les ateliers', fee: { type: 'commission', pct: 25 }, audience: '', bestFor: 'Ateliers artisanaux', pros: [], cons: [], effort: 2, reach: 3, control: 1, verify: true },
      { id: 'airbnb-exp', name: 'Airbnb Expériences', url: 'https://www.airbnb.fr/experiences', sides: ['learn', 'offer'], kinds: ['atelier', 'evenement'], universes: ['*'], geo: 'monde', model: 'Commission', fee: { type: 'commission', pct: 20 }, audience: '', bestFor: 'Touristes', pros: [], cons: [], effort: 2, reach: 3, control: 1, verify: false },
      { id: 'helloasso', name: 'HelloAsso', url: 'https://www.helloasso.com', sides: ['offer'], kinds: ['atelier', 'evenement', 'communaute'], universes: ['*'], geo: 'FR', model: 'Gratuit, pourboire facultatif', fee: { type: 'none' }, audience: '', bestFor: 'Associations', pros: [], cons: [], effort: 1, reach: 1, control: 3, verify: false },
      { id: 'youtube', name: 'YouTube', url: 'https://www.youtube.com', sides: ['learn', 'offer'], kinds: ['contenu'], universes: ['*'], geo: 'monde', model: 'Partage publicitaire', fee: { type: 'commission', pct: 45 }, audience: '', bestFor: 'Tutoriels', pros: [], cons: [], effort: 3, reach: 3, control: 1, verify: false },
      { id: 'patreon', name: 'Patreon', url: 'https://www.patreon.com', sides: ['offer'], kinds: ['contenu', 'communaute'], universes: ['*'], geo: 'monde', model: 'Commission', fee: { type: 'commission', pct: 10 }, audience: '', bestFor: 'Communauté payante', pros: [], cons: [], effort: 2, reach: 1, control: 2, verify: false },
      { id: 'meetup', name: 'Meetup', url: 'https://www.meetup.com', sides: ['learn', 'offer'], kinds: ['evenement', 'communaute'], universes: ['*'], geo: 'monde', model: 'Abonnement organisateur', fee: { type: 'subscription', eurPerMonth: 15 }, audience: '', bestFor: 'Groupes réguliers', pros: [], cons: [], effort: 1, reach: 2, control: 2, verify: true },
      { id: 'malt', name: 'Malt', url: 'https://www.malt.fr', sides: ['offer'], kinds: ['prestation', 'entreprise', 'coaching'], universes: ['tech', 'image', 'musique', 'parole'], geo: 'FR', model: 'Commission', fee: { type: 'commission', pct: 10 }, audience: '', bestFor: 'Freelances', pros: [], cons: [], effort: 1, reach: 2, control: 2, verify: false },
      { id: 'site-perso', name: 'Site et réseaux en direct', url: '', sides: ['offer'], kinds: ['cours', 'atelier', 'prestation', 'stage', 'coaching'], universes: ['*'], geo: 'monde', model: 'Vos propres canaux', fee: { type: 'mixed', pct: 1.5, eurPerMonth: 10, note: 'Paiement en ligne et hébergement' }, audience: '', bestFor: 'Garder la relation', pros: [], cons: [], effort: 3, reach: 0, control: 3, verify: false }
    ],
    learningApps: [{ id: 'lichess', name: 'Lichess', url: 'https://lichess.org', universes: ['jeux'], domains: ['jeux.echecs'], price: 'Gratuit', desc: 'Jouer et apprendre les échecs.' }, { id: 'duolingo', name: 'Duolingo', url: 'https://www.duolingo.com', universes: ['parole'], domains: ['parole.langues'], price: 'Freemium', desc: 'Langues.' }, { id: 'yousician', name: 'Yousician', url: 'https://yousician.com', universes: ['musique'], domains: [], price: 'Abonnement', desc: 'Instruments.' }],
    communityTypes: [
      { id: 'fablab', name: 'Fab lab', desc: 'Atelier partagé.', universes: ['tech', 'artisanat', 'maison'], sides: ['learn', 'offer'], howToFind: 'Réseau français des fablabs', links: [{ label: 'Carte', url: 'https://www.fablabs.io' }], osm: ['nwr["leisure"="hackerspace"]'], paid: 'mixed' },
      { id: 'repair-cafe', name: 'Repair Café', desc: 'Réparer ensemble.', universes: ['maison', 'pratique'], sides: ['learn', 'offer'], howToFind: 'repaircafe.org', links: [], osm: ['nwr["repair"="assisted_self_service"]'], paid: 'free' },
      { id: 'mjc', name: 'MJC et centres sociaux', desc: 'Ateliers à l’année.', universes: ['*'], sides: ['learn', 'offer'], howToFind: 'Mairie', links: [], osm: ['nwr["amenity"="community_centre"]'], paid: 'mixed' }
    ],
    networks: [{ id: 'ffe', name: 'Fédération française des échecs', url: 'https://www.echecs.asso.fr', universes: ['jeux'], domains: ['jeux.echecs'], desc: 'Clubs.' }],
    osmByUniverse: osm,
    statuses: [
      { id: 'benevolat', name: 'Bénévolat', forWhat: 'Transmettre gratuitement', cost: 'Aucun', ceiling: '', pros: [], cons: [], steps: ['Rejoindre une association'], fit: { incomeMin: 0, incomeMax: 0, collective: false }, source: '' },
      { id: 'association', name: 'Association loi 1901', forWhat: 'Projet collectif', cost: 'Pas de cotisation sociale sans salarié', ceiling: '', pros: [], cons: [], steps: ['Déposer les statuts'], fit: { incomeMin: 0, incomeMax: 60000, collective: true }, source: '' },
      { id: 'micro-bnc', name: 'Micro-entreprise (prestations BNC)', forWhat: 'Cours, coaching', cost: 'Cotisations ≈ 24,6 % du CA', ceiling: 'Plafond de CA 77 700 €', pros: [], cons: [], steps: ['Déclaration sur le guichet unique'], fit: { incomeMin: 1000, incomeMax: 77700, collective: false }, source: '' },
      { id: 'micro-vente', name: 'Micro-entreprise (vente)', forWhat: 'Vente', cost: 'Cotisations ≈ 12,3 % du CA', ceiling: 'Plafond 188 700 €', pros: [], cons: [], steps: [], fit: { incomeMin: 1000, incomeMax: 188700, collective: false }, source: '' },
      { id: 'artiste-auteur', name: 'Artiste-auteur', forWhat: 'Œuvres', cost: '≈ 17 % des revenus', ceiling: '', pros: [], cons: [], steps: [], fit: { incomeMin: 0, incomeMax: 100000, collective: false }, source: '' },
      { id: 'cae', name: 'Coopérative d’activité et d’emploi', forWhat: 'Tester', cost: '≈ 10 % du CA + cotisations salariales', ceiling: '', pros: [], cons: [], steps: [], fit: { incomeMin: 3000, incomeMax: 60000, collective: true }, source: '' }
    ],
    regulations: { sport: { title: 'Enseignement sportif contre rémunération', rule: 'Carte professionnelle obligatoire.', risk: '1 an de prison, 15 000 €.', options: ['Passer un CQP', 'Sorties sans enseignement rémunéré'], source: 'https://www.legifrance.gouv.fr' }, alcool: { title: 'Alcool', rule: 'Licence.', risk: '', options: ['Lieu licencié'], source: '' } },
    pricing: pricing,
    projectTemplates: [
      { id: 'compilation', name: 'Compilation collective', desc: 'Un album à plusieurs.', universes: ['musique', 'image'], tags: ['production', 'composition', 'dessin'], size: [4, 10], weeks: 6, output: 'Sortie Bandcamp', roles: ['Porteur', 'Compositeurs', 'Pochette'], steps: ['S1 · thème', 'S6 · sortie'], funding: ['Bandcamp'], paid: 'mixed' },
      { id: 'diner', name: 'Dîner collectif', desc: 'Un dîner à 8 mains.', universes: ['cuisine', 'social'], tags: ['cuisine', 'convivial'], size: [4, 8], weeks: 4, output: 'Dîner de 30 couverts', roles: ['Chef', 'Salle'], steps: ['S1 · menu'], funding: ['HelloAsso'], paid: 'mixed' },
      { id: 'repair', name: 'Repair café éphémère', desc: 'Réparer ensemble.', universes: ['maison', 'pratique'], tags: ['reparation'], size: [4, 12], weeks: 4, output: 'Une après-midi de réparation', roles: ['Accueil', 'Réparateurs'], steps: ['S1 · lieu'], funding: [], paid: 'free' }
    ],
    searchEngines: [
      { id: 'google', name: 'Google', url: 'https://www.google.com/search?q={q}+{city}', sides: ['learn', 'offer'] },
      { id: 'youtube', name: 'YouTube', url: 'https://www.youtube.com/results?search_query={q}', sides: ['learn'] },
      { id: 'meetup', name: 'Meetup', url: 'https://www.meetup.com/fr-FR/find/?keywords={q}&location={city}', sides: ['learn', 'offer'] }
    ]
  };
})(typeof window !== 'undefined' ? window : globalThis);
