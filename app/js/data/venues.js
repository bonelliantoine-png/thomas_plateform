/* Lieux partenaires : types de lieux (famille, ticket moyen estimé, formules recommandées, univers adaptés, pitch)
   et six lieux FICTIFS de démonstration. Chargé après resources.js.
   Pitchs en trois phrases : étude stratégique § 06c « Par type de lieu », copiés tels quels, sauf fab lab et autre lieu
   (absents de l'étude, rédigés dans le même esprit). Tickets : estimations modifiables dans le simulateur. */
window.CORDES_VENUE_FAMILIES = [
  ['boire', 'Boire et manger'], ['livres', 'Livres, disques, art'], ['faire', 'Faire et bouger'], ['commerces', 'Commerces'], ['accueillir', 'Accueillir'], ['publics', 'Lieux publics et associatifs']
];
window.CORDES_VENUE_TYPES = [
  { id: 'cafe', label: 'Café de quartier', family: 'boire', ticket: 6, margin: 0.7, formulas: ['creuse', 'une'], universes: ['cuisine', 'parole', 'jeux', 'image', 'social', 'savoirs', 'pratique'],
    pitch: 'Votre salle est calme le mardi à 15 h. Nous y amenons quatre voisins qui apprennent un geste en une heure et consomment chez vous. Vous choisissez le créneau, nous faisons venir les gens et l’assurance est la nôtre.' },
  { id: 'coffee', label: 'Coffee shop', family: 'boire', ticket: 6, margin: 0.7, formulas: ['creuse', 'membre'], universes: ['cuisine', 'image', 'parole', 'jeux', 'social'],
    pitch: 'Vos baristas savent déjà faire ce que nos membres veulent apprendre. Une séance de latte art l’après-midi remplit le comptoir aux heures creuses et vend du café en grains. Votre équipe peut animer elle-même, payée 12 € par participant.' },
  { id: 'bar', label: 'Bar', family: 'boire', ticket: 10, margin: 0.7, formulas: ['creuse', 'soiree'], universes: ['cuisine', 'jeux', 'musique', 'parole', 'social', 'scene'], licensed: true,
    pitch: 'Vos débuts de soirée sont creux. Nous y organisons des séances d’une heure et une soirée découverte par mois. Chaque participant consomme au moins une boisson, et le bar reste à vous.' },
  { id: 'cave', label: 'Cave à vin', family: 'boire', ticket: 15, margin: 0.7, formulas: ['creuse', 'membre'], universes: ['cuisine', 'savoirs', 'social', 'jeux'], licensed: true,
    pitch: 'Une dégustation commentée attire exactement vos futurs clients. Nous remplissons six places un soir calme, vous gardez les ventes de bouteilles. Vous êtes le lieu licencié qui rend ces séances possibles.' },
  { id: 'restaurant', label: 'Restaurant', family: 'boire', ticket: 12, margin: 0.7, formulas: ['creuse', 'programme'], universes: ['cuisine', 'social', 'parole'], licensed: true,
    pitch: 'Entre 15 h et 18 h, votre salle dort. Une séance de cuisine ou de pâtisserie à six vous apporte des consommations et des clients pour le soir. Nous apportons l’hôte, le public et l’assurance.' },
  { id: 'librairie', label: 'Librairie', family: 'livres', ticket: 5, margin: 0.7, formulas: ['membre', 'creuse'], universes: ['parole', 'savoirs', 'jeux', 'image', 'social'],
    pitch: 'Un atelier d’écriture, de croquis ou de reliure fait entrer des lecteurs qui achètent. Les membres ont une remise chez vous et reviennent. Aucun loyer, aucune exclusivité.' },
  { id: 'disquaire', label: 'Disquaire', family: 'livres', ticket: 0, margin: 0.35, formulas: ['membre', 'soiree'], universes: ['musique', 'savoirs', 'image'],
    pitch: 'Un salon d’écoute commentée le samedi fait venir des curieux qui repartent avec un disque. Nous organisons, vous recevez le public et les ventes. Votre boutique apparaît dans les idées de sortie du quartier.' },
  { id: 'galerie', label: 'Galerie', family: 'livres', ticket: 0, margin: 0.7, formulas: ['soiree', 'programme'], universes: ['image', 'artisanat', 'savoirs', 'style'],
    pitch: 'Une séance de croquis devant vos œuvres fait venir un public qui ne pousse pas la porte d’une galerie. Une soirée découverte par mois anime votre lieu sans frais. Les participants partagent leurs dessins, et votre exposition avec.' },
  { id: 'atelier-artisan', label: 'Atelier d’artisan', family: 'faire', ticket: 0, margin: 1, formulas: ['recette'], universes: ['artisanat', 'maison', 'style', 'image'],
    pitch: 'Vous avez l’établi, le four ou le tour, et des heures creuses. Nous les remplissons avec des groupes de quatre et vous versons 4 € par place, ou 12 € par participant si vous animez. Vos participants découvrent votre travail et vos stages.' },
  { id: 'studio-musique', label: 'Studio de musique', family: 'faire', ticket: 0, margin: 1, formulas: ['recette'], universes: ['musique', 'parole'],
    pitch: 'Vos cabines sont vides en journée. Une initiation y remplit une heure à 4 € par place, sans engagement. Ceux qui accrochent réservent ensuite vos heures de répétition.' },
  { id: 'studio-danse', label: 'Studio de danse', family: 'faire', ticket: 0, margin: 1, formulas: ['recette'], universes: ['scene', 'sport', 'bienetre'],
    pitch: 'Votre parquet est libre en milieu de journée. Nous y organisons des séances de découverte animées par des enseignants diplômés, avec une part fixe par place pour vous. Les débutants qui aiment s’inscrivent à vos cours.' },
  { id: 'salle-sport', label: 'Salle de sport', family: 'faire', ticket: 0, margin: 1, formulas: ['recette', 'membre'], universes: ['sport', 'bienetre'],
    pitch: 'Vos heures creuses sont connues. Une séance de découverte encadrée par un coach diplômé y fait entrer des non-pratiquants. Ceux qui reviennent deviennent vos abonnés.' },
  { id: 'fablab', label: 'Fab lab', family: 'faire', ticket: 0, margin: 1, formulas: ['recette'], universes: ['tech', 'artisanat', 'maison', 'image'],
    pitch: 'Vos machines et vos postes sont libres certains après-midi. Nous y amenons des groupes de quatre pour une initiation d’une heure, avec une part fixe par place pour vous. Ceux qui accrochent prennent ensuite votre abonnement.' },
  { id: 'boutique-materiel', label: 'Boutique de matériel', family: 'commerces', ticket: 0, basket: 30, margin: 0.35, formulas: ['membre', 'programme'], universes: ['artisanat', 'cuisine', 'image', 'style', 'musique'],
    pitch: 'Chaque séance de latte art crée un acheteur de pichet, chaque initiation au crochet un acheteur de laine. Accueillez des séances ou offrez une remise aux participants, et nous les envoyons chez vous. Vos produits figurent dans la liste de matériel de nos fiches.' },
  { id: 'hotel', label: 'Hôtel', family: 'accueillir', ticket: 0, margin: 0.7, formulas: ['programme'], universes: ['cuisine', 'image', 'parole', 'savoirs', 'bienetre'],
    pitch: 'Vos clients cherchent une expérience locale. Une séance d’une heure animée par un habitant dans votre lobby, 200 € HT tout compris. Vous animez votre lieu et vos réseaux sans recruter.' },
  { id: 'coworking', label: 'Coworking', family: 'accueillir', ticket: 0, margin: 0.7, formulas: ['programme', 'creuse'], universes: ['tech', 'parole', 'bienetre', 'social', 'pratique'],
    pitch: 'Vos membres restent pour la communauté. Deux séances par mois au déjeuner ou après 18 h, 200 € HT chacune, hôte et matériel compris. Ils apprennent, se rencontrent et en parlent.' },
  { id: 'entreprise', label: 'Entreprise avec salle', family: 'accueillir', ticket: 0, margin: 0.7, formulas: ['programme'], universes: ['social', 'parole', 'tech', 'cuisine'],
    pitch: 'Votre salle de réunion est vide le jeudi soir. Ouvrez-la à une séance pour vos salariés et des habitants, ou commandez une séance d’équipe à 450 € HT. Des collègues se découvrent, et vos salariés hôtes sont reconnus.' },
  { id: 'tiers-lieu', label: 'Tiers-lieu', family: 'publics', ticket: 5, margin: 0.7, formulas: ['creuse', 'soiree', 'public'], universes: ['social', 'artisanat', 'jeux', 'parole', 'nature', 'maison'],
    pitch: 'Vous cherchez de l’animation, pas du loyer. Nous programmons des séances régulières et une soirée découverte par mois, animées par des habitants. Vous recevez un public nouveau et des chiffres pour vos financeurs.' },
  { id: 'mediatheque', label: 'Médiathèque', family: 'publics', ticket: 0, margin: 0.7, formulas: ['public'], universes: ['savoirs', 'parole', 'image', 'jeux', 'tech'],
    pitch: 'Six ateliers gratuits par trimestre pour vos usagers, animés par des habitants. Hôtes, matériel et bilan de fréquentation fournis pour votre rapport d’activité. 3 000 € HT par trimestre sur le budget d’action culturelle.' },
  { id: 'mjc', label: 'MJC, centre d’animation', family: 'publics', ticket: 0, margin: 1, formulas: ['public', 'recette'], universes: ['scene', 'musique', 'artisanat', 'social', 'jeux'],
    pitch: 'Vos ateliers annuels demandent un engagement que beaucoup n’osent pas prendre. Des séances d’une heure servent de porte d’entrée vers vos activités. Vos salles creuses accueillent nos groupes contre une part fixe par place.' },
  { id: 'autre', label: 'Autre lieu', family: 'accueillir', ticket: 4, margin: 0.7, formulas: ['creuse'], universes: [], legacy: true,
    pitch: 'Une table ou une salle libre à un moment calme suffit. Nous y amenons des groupes de quatre qui apprennent un geste en une heure. Vous choisissez le créneau, nous faisons venir les gens et l’assurance est la nôtre.' }
];
// lieux FICTIFS : noms inventés, coordonnées approximatives d'arrondissement, toujours affichés comme « lieu fictif de démonstration »
window.CORDES_DEMO_VENUES = [
  { slug: 'comptoir-tranquille', name: 'Le Comptoir Tranquille', type: 'cafe', city: 'Paris', arr: '11e', lat: 48.859, lon: 2.379, capacity: 10, slots: ['1:aprem', '3:aprem', '5:matin'], equip: ['tables', 'machine', 'calme', 'evier'], formulas: ['creuse'] },
  { slug: 'fabrique-a-soirees', name: 'La Fabrique à Soirées', type: 'bar', city: 'Paris', arr: '10e', lat: 48.876, lon: 2.361, capacity: 30, slots: ['0:soir', '1:soir', '2:soir'], equip: ['tables', 'sono', 'ecran'], formulas: ['creuse', 'soiree'] },
  { slug: 'studio-contretemps', name: 'Studio Contretemps', type: 'studio-musique', city: 'Paris', arr: '20e', lat: 48.864, lon: 2.398, capacity: 8, slots: ['0:matin', '2:aprem', '4:aprem'], equip: ['sono', 'piano', 'calme'], formulas: ['recette'] },
  { slug: 'pages-et-tasses', name: 'Pages et Tasses', type: 'librairie', city: 'Paris', arr: '3e', lat: 48.863, lon: 2.360, capacity: 12, slots: ['1:matin', '3:soir', '6:aprem'], equip: ['tables', 'calme', 'machine'], formulas: ['membre', 'creuse'] },
  { slug: 'fil-et-laine', name: 'Le Fil et la Laine', type: 'boutique-materiel', city: 'Paris', arr: '18e', lat: 48.892, lon: 2.348, capacity: 8, slots: ['2:aprem', '5:matin'], equip: ['tables', 'evier'], formulas: ['membre'] },
  { slug: 'mediatheque-du-square', name: 'Médiathèque du Square', type: 'mediatheque', city: 'Paris', arr: '12e', lat: 48.840, lon: 2.395, capacity: 20, slots: ['2:aprem', '5:matin', '5:aprem'], equip: ['tables', 'ecran', 'calme', 'pmr'], formulas: ['public'] }
];
