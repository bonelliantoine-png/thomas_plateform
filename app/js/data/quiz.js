/* Ta corde cachée · questions et profils (contenu éditorial). Chargé après resources.js.
   Chaque réponse ajoute des points d'axes (so social, ph physique, cr création, in intellect) et des points d'univers
   (identifiants de la taxonomie). Q8 fixe le coût maximal du matériel (0 à 2, null = pas de filtre).
   Profils : univers regroupés ; à égalité, l'axe le plus fort départage (axis). Portraits rédigés à la main. */
window.CORDES_QUIZ = {
  questions: [
    { id: 'q1', q: 'Dimanche, 10 h. Tu es plutôt…', opts: [
      { t: 'Encore au lit avec un livre ou un podcast', ax: { in: 2 }, uni: { savoirs: 2, parole: 1 } },
      { t: 'Au marché, puis aux fourneaux', ax: { ph: 1 }, uni: { cuisine: 3 } },
      { t: 'En train de bricoler ou de réparer un truc', ax: { ph: 1 }, uni: { maison: 2, artisanat: 1 } },
      { t: 'Dehors : vélo, parc, balade', ax: { ph: 2 }, uni: { pleinair: 2, nature: 1, sport: 1 } },
      { t: 'Déjà au café avec des amis', ax: { so: 2 }, uni: { social: 2, jeux: 1 } }] },
    { id: 'q2', q: 'Ce que tes proches te demandent toujours', opts: [
      { t: '« Tu peux me prendre en photo ? »', ax: { cr: 1 }, uni: { image: 3 } },
      { t: '« On mange quoi ce soir ? »', ax: {}, uni: { cuisine: 3 } },
      { t: '« Tu peux réparer ça ? »', ax: {}, uni: { maison: 2, tech: 1 } },
      { t: '« Tu mets la musique ? »', ax: {}, uni: { musique: 3 } },
      { t: '« Raconte encore cette histoire »', ax: { so: 1 }, uni: { parole: 2, scene: 1 } }] },
    { id: 'q3', q: 'Ta galerie photo est surtout pleine de…', opts: [
      { t: 'Plats et cafés', ax: {}, uni: { cuisine: 2, image: 1 } },
      { t: 'Plantes, ciel, paysages', ax: {}, uni: { nature: 2, pleinair: 1 } },
      { t: 'Captures d’écran d’idées à tester', ax: { in: 1 }, uni: { pratique: 2, tech: 1 } },
      { t: 'Amis en soirée', ax: { so: 2 }, uni: { scene: 1, social: 1 } },
      { t: 'Objets, déco, tenues', ax: { cr: 1 }, uni: { style: 2, artisanat: 1 } }] },
    { id: 'q4', q: 'En soirée, tu es celui ou celle qui…', opts: [
      { t: 'Sort un jeu', ax: { so: 1 }, uni: { jeux: 3 } },
      { t: 'Tient la playlist', ax: {}, uni: { musique: 3 } },
      { t: 'Refait le monde', ax: { in: 1 }, uni: { parole: 2, savoirs: 1 } },
      { t: 'Danse en premier', ax: { ph: 2 }, uni: { scene: 2 } },
      { t: 'Finit en cuisine', ax: {}, uni: { cuisine: 2, social: 1 } }] },
    { id: 'q5', q: 'Fin de journée, ce qui te ferait du bien', opts: [
      { t: 'Faire quelque chose de tes mains', ax: { ph: 1, cr: 1 }, uni: { artisanat: 2 } },
      { t: 'Bouger, transpirer', ax: { ph: 2 }, uni: { sport: 2 } },
      { t: 'Créer un truc à toi', ax: { cr: 2 }, uni: { image: 1, musique: 1 } },
      { t: 'Apprendre une astuce utile', ax: { in: 1 }, uni: { pratique: 2, tech: 1 } },
      { t: 'Ralentir, au calme', ax: {}, uni: { bienetre: 3 } }] },
    { id: 'q6', q: 'Après une heure, tu préfères repartir avec…', opts: [
      { t: 'Un objet fait main', ax: { cr: 1 }, uni: { artisanat: 2 } },
      { t: 'Un plat ou une boisson', ax: {}, uni: { cuisine: 2 } },
      { t: 'Un son, une photo ou une vidéo', ax: { cr: 1 }, uni: { musique: 1, image: 1, tech: 1 } },
      { t: 'Un geste qui simplifie ton quotidien', ax: {}, uni: { pratique: 2, maison: 1, tech: 1 } },
      { t: 'Une rencontre', ax: { so: 2 }, uni: { social: 2 } }] },
    { id: 'q7', q: 'Plutôt…', opts: [
      { t: 'En solo', ax: { so: -1 }, uni: {} },
      { t: 'À deux', ax: {}, uni: {} },
      { t: 'En petite bande', ax: { so: 1 }, uni: {} },
      { t: 'En grande tablée', ax: { so: 2 }, uni: {} }] },
    { id: 'q8', q: 'Ton budget plaisir ce mois-ci', opts: [
      { t: '0 €', ax: {}, uni: {}, cost: 0, budget: 0 },
      { t: 'Moins de 20 €', ax: {}, uni: {}, cost: 1, budget: 15 },
      { t: 'Moins de 50 €', ax: {}, uni: {}, cost: 2, budget: 40 },
      { t: 'On verra', ax: {}, uni: {}, cost: null, budget: 80 }] }
  ],
  profiles: [
    { id: 'main-or', name: 'Main d’or', universes: ['artisanat', 'maison'], axis: 'ph', portrait: 'Tu comprends les choses en les fabriquant.' },
    { id: 'palais', name: 'Palais curieux', universes: ['cuisine'], axis: 'so', portrait: 'Pour toi, une soirée réussie se termine autour d’une table.' },
    { id: 'oreille', name: 'Oreille fine', universes: ['musique'], axis: 'cr', portrait: 'Tu entends ce que les autres laissent passer, et une bonne chanson peut changer ta journée.' },
    { id: 'oeil', name: 'Œil vif', universes: ['image', 'style'], axis: 'cr', portrait: 'Tu remarques les couleurs, les cadrages et les détails avant tout le monde.' },
    { id: 'conteur', name: 'Conteur né', universes: ['parole'], axis: 'so', portrait: 'Tes histoires font rire la table, et tu trouves facilement les mots justes.' },
    { id: 'scene', name: 'Scène ouverte', universes: ['scene'], axis: 'so', portrait: 'Être regardé ne te fait pas peur quand il s’agit de faire passer un bon moment.' },
    { id: 'corps', name: 'Corps en mouvement', universes: ['sport', 'pleinair'], axis: 'ph', portrait: 'Tu réfléchis mieux en marchant, et une journée sans bouger te paraît longue.' },
    { id: 'pied-vert', name: 'Pied vert', universes: ['nature'], axis: 'ph', portrait: 'Tu te sens bien dehors, au contact de ce qui pousse et de ce qui vit.' },
    { id: 'jeu', name: 'Esprit de jeu', universes: ['jeux'], axis: 'in', portrait: 'Une règle à comprendre et une partie à gagner suffisent à réunir tout le monde.' },
    { id: 'quartier', name: 'Âme du quartier', universes: ['social'], axis: 'so', portrait: 'Tu aimes que les gens se rencontrent, et tu es souvent celui ou celle qui fait le lien.' },
    { id: 'bidouille', name: 'Bidouilleur malin', universes: ['tech', 'pratique'], axis: 'in', portrait: 'Devant un problème, ton premier réflexe est de chercher l’astuce qui le règle.' },
    { id: 'tete', name: 'Tête chercheuse', universes: ['savoirs'], axis: 'in', portrait: 'Une question te mène à une autre, et tu aimes comprendre comment le monde fonctionne.' },
    { id: 'tranquille', name: 'Esprit tranquille', universes: ['bienetre'], axis: 'cr', portrait: 'Tu sais que prendre soin de soi s’apprend, et tu cherches le calme quand tout va vite.' }
  ]
};
