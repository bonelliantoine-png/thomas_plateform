/* Idées à vivre · occasions (contenu éditorial). Chargé après resources.js.
   seasons : périodes « MM-JJ:MM-JJ » où l'occasion passe en tête de la grille.
   w : poids du score (social, creative, physical, intellectual, trend, demand, oneHour, cheap, novelty).
   pins : 3 compétences mises en avant (identifiants vérifiés au chargement, un identifiant absent est ignoré). */
window.CORDES_OCCASIONS = [
  { id: 'offrir', label: 'Un cadeau à offrir', kicker: 'Noël, anniversaire, merci', people: 2, budget: 50, place: 'both', seasons: ['11-01:12-24', '05-10:05-31', '06-01:06-21'],
    intro: 'Une heure pour apprendre un geste qu’on garde toute la vie : un cadeau qui ne finit pas dans un placard.',
    w: { social: 0.10, creative: 0.20, oneHour: 0.20, trend: 0.15, demand: 0.15, novelty: 0.20 }, exclude: ['securite', 'sante', 'animaux'], pins: ['latte-art', 'linogravure', 'calligraphie'] },
  { id: 'anniv', label: 'Fêter un anniversaire', kicker: 'Une fête qui change du restaurant', people: 6, budget: 50, place: 'out',
    intro: 'Tout le monde apprend la même chose en même temps, et la fête a enfin un moment dont on se souvient.',
    w: { social: 0.30, oneHour: 0.25, creative: 0.15, trend: 0.15, novelty: 0.15 }, pins: ['murder-party', 'magie-close-up', 'quiz-animation'] },
  { id: 'evjf', label: 'EVJF ou EVG', kicker: 'Une journée qui ressemble au couple', people: 8, budget: 100, place: 'out', seasons: ['03-15:06-30'], allowAlcohol: true,
    intro: 'Un atelier où toute la bande repart avec quelque chose de fait ensemble, et des photos qui racontent la journée.',
    w: { social: 0.35, oneHour: 0.25, novelty: 0.25, physical: 0.15 }, pins: ['cocktails', 'salsa-bachata', 'bijoux-perles'] },
  { id: 'couple', label: 'En amoureux', kicker: 'Une sortie à deux, sans écran', people: 2, budget: 50, place: 'both', seasons: ['01-20:02-14'],
    intro: 'Apprendre à deux, c’est se voir maladroit, rire, et rentrer avec quelque chose à refaire ensemble.',
    w: { social: 0.20, creative: 0.30, oneHour: 0.25, novelty: 0.25 }, pins: ['pates-fraiches', 'modelage-ceramique', 'swing-lindy-hop'] },
  { id: 'amis', label: 'Entre amis, un soir', kicker: 'Mieux qu’un verre de plus', people: 4, budget: 20, place: 'both',
    intro: 'Une soirée où l’on fait quelque chose ensemble plutôt que de se raconter sa semaine.',
    w: { social: 0.35, oneHour: 0.30, trend: 0.20, novelty: 0.15 }, pins: ['jeux-de-societe-regles', 'sushi', 'improvisation-theatrale'] },
  { id: 'famille', label: 'En famille, avec enfants', kicker: 'Petits et grands à la même table', people: 4, budget: 20, place: 'both', kidsSafe: true,
    intro: 'Une activité où les enfants ne regardent pas les adultes faire : chacun a ses mains dedans.',
    w: { social: 0.25, oneHour: 0.35, creative: 0.25, physical: 0.15 }, pins: ['origami-modulaire', 'stop-motion', 'kokedama'] },
  { id: 'equipe', label: 'Entre collègues', kicker: 'Une sortie d’équipe qui fait parler', people: 9, budget: 50, place: 'out', b2b: true,
    intro: 'Faire équipe sur un terrain où personne n’est expert : la hiérarchie s’efface le temps d’un atelier.',
    w: { social: 0.35, oneHour: 0.30, intellectual: 0.15, novelty: 0.20 }, pins: ['improvisation-theatrale', 'creation-enigmes', 'pizza-napolitaine'] },
  { id: 'dimanche', label: 'Un dimanche pluvieux', kicker: 'Chez soi, avec presque rien', people: 1, budget: 20, place: 'home',
    intro: 'De quoi transformer un après-midi gris en un savoir-faire de plus, sans sortir de chez soi.',
    w: { oneHour: 0.40, creative: 0.25, cheap: 0.20, novelty: 0.15 }, pins: ['crochet', 'aquarelle', 'origami-modulaire'] },
  { id: 'nouveau', label: 'Nouveau dans le quartier', kicker: 'Rencontrer ses voisins', people: 1, budget: 20, place: 'out',
    intro: 'Le plus simple pour connaître du monde : apprendre quelque chose avec des gens qui habitent à côté.',
    w: { social: 0.45, oneHour: 0.25, trend: 0.15, demand: 0.15 }, pins: ['jam-session-groupe', 'bal-folk', 'jeux-de-societe-regles'] }
];
