/* Portefeuilles candidats, géographie, villes, limites, corrections de données et parades manuelles.
   Les portefeuilles sont définis par un circuit de lieux (contrainte opérationnelle), jamais par les compétences d'une équipe.
   La sélection des niches et le classement des portefeuilles sont calculés par build.js. */
const has = (a, b) => a.some(x => b.includes(x)); /* les portefeuilles lisent les deux lieux principaux d'une niche */
const ARR = [
  // [arrondissement, repères, comptoirs, ateliers et tiers-lieux, dehors, studios et salles, savoirs, entreprises, jeunes actifs, familles, seniors, étudiants]
  ['1er', 'Halles, Palais-Royal', 2, 1, 2, 1, 2, 3, 2, 1, 2, 1],
  ['2e', 'Sentier, Montorgueil', 3, 2, 1, 1, 2, 3, 3, 1, 1, 2],
  ['3e', 'Haut-Marais', 3, 2, 1, 1, 2, 2, 3, 1, 2, 1],
  ['4e', 'Marais, îles', 2, 1, 2, 1, 3, 1, 2, 1, 2, 1],
  ['5e', 'Quartier latin, Jardin des Plantes', 2, 1, 3, 1, 3, 1, 2, 2, 2, 3],
  ['6e', 'Saint-Germain, Luxembourg', 2, 1, 3, 1, 3, 2, 1, 2, 3, 3],
  ['7e', 'Invalides, Champ-de-Mars', 1, 1, 3, 1, 2, 2, 1, 2, 3, 1],
  ['8e', 'Madeleine, Monceau', 2, 1, 2, 1, 1, 3, 1, 1, 2, 1],
  ['9e', 'Pigalle, Martyrs', 3, 2, 1, 2, 2, 3, 3, 2, 2, 2],
  ['10e', 'Canal Saint-Martin, gares', 3, 3, 2, 2, 2, 2, 3, 2, 1, 2],
  ['11e', 'Oberkampf, Bastille, Voltaire', 3, 3, 1, 3, 2, 2, 3, 2, 2, 2],
  ['12e', 'Bercy, Coulée verte, Vincennes', 2, 2, 3, 2, 2, 2, 2, 3, 3, 1],
  ['13e', 'Butte-aux-Cailles, Paris Rive Gauche', 2, 3, 2, 2, 3, 2, 2, 3, 2, 3],
  ['14e', 'Montparnasse, Alésia, Montsouris', 2, 2, 3, 2, 2, 2, 2, 3, 3, 2],
  ['15e', 'Convention, Javel, Brassens', 2, 1, 2, 2, 2, 2, 2, 3, 3, 1],
  ['16e', 'Auteuil, Passy, Boulogne', 1, 1, 3, 1, 2, 1, 1, 2, 3, 1],
  ['17e', 'Batignolles, Clichy-Batignolles', 2, 2, 2, 2, 2, 2, 2, 3, 2, 1],
  ['18e', 'Montmartre, Goutte-d’Or, La Chapelle', 3, 3, 2, 2, 2, 1, 3, 2, 2, 2],
  ['19e', 'Buttes-Chaumont, Villette, canal de l’Ourcq', 2, 3, 3, 2, 2, 1, 2, 3, 2, 2],
  ['20e', 'Belleville, Ménilmontant, Père-Lachaise', 3, 3, 3, 2, 2, 1, 3, 3, 2, 2]
];
const GCRIT = ['Comptoirs (cafés, bars, caves)', 'Ateliers et tiers-lieux', 'Dehors (parcs, jardins)', 'Studios et salles', 'Savoirs (médiathèques, librairies)', 'Entreprises (bureaux)', 'Jeunes actifs', 'Familles', 'Seniors', 'Étudiants'];

module.exports = {
 fixes: [],
 manualParades: {
  'image-photo-smartphone': {p: ['sortie-atelier', 'entreprise-cse', 'bon-cadeau'], why: 'Balade photo dans un quartier puis tri au café. Les équipes veulent produire leurs propres visuels : la formule entreprise paie le format grand public.'},
  'musique-chorale-ephemere': {p: ['entreprise-cse', 'preventes-restitution', 'programmation-publique'], why: 'Chœur d’entreprise à midi, concert de restitution billetté, chorales éphémères déjà programmées par les mairies et conservatoires.'},
  'sport-course-run-club-social': {p: ['duo-premium', 'marque-partenaire', 'lieu-payeur'], why: 'La course reste gratuite et entre pairs (pas d’encadrement sportif rémunéré). Le croissant ou le café qui suit se paie, une marque de running sponsorise.'},
  'social-repair-cafe-animation': {p: ['prix-libre', 'programmation-publique', 'marque-partenaire'], why: 'Modèle Repair Café : gratuit, dons libres, salle prêtée par la mairie, outils fournis par une enseigne.'},
  'jeux-echecs-ouvertures': {p: ['lieu-payeur', 'pass-saison', 'pass-culture'], why: 'Les bars à jeux vendent la consommation. Le club hebdomadaire entre dans l’abonnement. Les échecs sont une offre scolaire reconnue.'},
  'artisanat-raccommodage-visible': {p: ['kit-objet', 'prix-libre', 'marque-partenaire'], why: 'Kit de fils et aiguilles de sashiko vendu avec la séance. Une marque de mode durable finance la visibilité.'},
  'social-numerique-seniors-aide': {p: ['prevention-sante', 'programmation-publique', 'bailleur-residence'], why: 'Les caisses de retraite financent déjà des ateliers numériques gratuits pour les retraités (PRIF), les mairies et bailleurs aussi.'},
  'cuisine-anti-gaspi': {p: ['bailleur-residence', 'programmation-publique', 'duo-premium'], why: 'Lutte contre le gaspillage alimentaire financée par les collectivités et les bailleurs. En duo avec une pâtisserie pour le grand public.'},
  'musique-salon-ecoute': {p: ['duo-premium', 'lieu-payeur', 'pass-saison'], why: 'Le salon d’écoute devient la seconde moitié d’une dégustation de vin (mix Vin et vinyles) ou le rendez-vous d’un bar à vinyles.'}
 },
 portfolios: [
  {id: 'comptoirs', n: 'Comptoirs de quartier', tag: 'Cafés, bars, caves, librairies', size: 6, maxSec: 2,
   pick: n => has(n.venues.slice(0, 2), ['cafe', 'coffee-shop', 'bar', 'cave', 'restaurant', 'librairie']),
   need: [3, 0, 0, 0, 1, 1, 2, 0, 0, 1],
   desc: 'Un circuit de lieux qui ont déjà le matériel et la clientèle, et qui cherchent à remplir leurs heures creuses.',
   risk: 'Alcool limité aux lieux licenciés qui vendent eux-mêmes. Dépendance aux heures creuses des lieux.'},
  {id: 'ateliers', n: 'Ateliers et tiers-lieux', tag: 'Fablabs, ateliers d’artisans, tiers-lieux', size: 6, maxSec: 2,
   pick: n => has(n.venues.slice(0, 2), ['atelier-artisan', 'fablab', 'tiers-lieu']),
   need: [0, 3, 0, 0, 1, 0, 1, 1, 0, 1],
   desc: 'Des lieux équipés qui accueillent volontiers des collectifs, avec des productions montrables.',
   risk: 'Matériel et sécurité des machines. Tiers-lieux souvent associatifs, donc sensibles au prix.'},
  {id: 'dehors', n: 'Dehors et quartier', tag: 'Parcs, jardins, balades', size: 6, maxSec: 2,
   pick: n => has(n.venues.slice(0, 2), ['parc', 'nature', 'jardin-partage']),
   need: [0, 0, 3, 0, 0, 0, 1, 2, 1, 0],
   desc: 'Aucun loyer, des sorties le week-end, un ancrage de quartier très visible.',
   risk: 'Météo et saisonnalité. Propension à payer souvent faible, d’où les parades.'},
  {id: 'studios', n: 'Salles de quartier', tag: 'Salles polyvalentes, studios de musique et de danse', size: 6, maxSec: 2,
   pick: n => has(n.venues.slice(0, 2), ['studio-musique', 'studio-danse', 'salle-sport', 'salle-polyvalente']),
   need: [0, 0, 0, 3, 0, 0, 2, 0, 0, 2],
   desc: 'Des salles municipales, associatives ou de studio, libres en heures creuses, qui accueillent la voix, le corps, le jeu et la vie pratique.',
   risk: 'Partage de recette avec le studio. Cadre de l’éducateur sportif pour certaines pratiques.'},
  {id: 'savoirs', n: 'Savoirs et médiathèques', tag: 'Médiathèques, librairies, galeries, écoles', size: 6, maxSec: 2,
   pick: n => has(n.venues.slice(0, 2), ['mediatheque', 'librairie', 'galerie', 'ecole']),
   need: [0, 1, 0, 0, 3, 0, 1, 1, 1, 1],
   desc: 'Des lieux publics qui programment et paient des intervenants, avec des publics variés.',
   risk: 'Rythme des marchés publics. Propension à payer individuelle faible, à compenser par le tiers payeur.'},
  {id: 'equipes', n: 'Formats d’équipe', tag: 'Entreprises et CSE', size: 6, maxSec: 2,
   pick: n => n.publics.includes('entreprises'),
   need: [1, 0, 0, 0, 0, 3, 2, 0, 0, 0],
   desc: 'Des séances d’équipe vendues au forfait, qui financent les formats grand public.',
   risk: 'Cycle de vente long, saisonnalité forte, dépendance aux budgets d’entreprise.'}
 ],
 geo: pf => {
  const rows = ARR.map(a => ({ a: a[0], q: a[1], v: a.slice(2) }));
  const per = pf.map(p => {
   const need = module.exports.portfolios.find(x => x.id === p.id).need, sw = need.reduce((x, y) => x + y, 0) || 1;
   const sc = rows.map(r => [r.a, Math.round(r.v.reduce((t, v, i) => t + v * need[i], 0) / (3 * sw) * 100)]).sort((x, y) => y[1] - x[1]);
   return { id: p.id, top: sc.slice(0, 5), all: Object.fromEntries(sc) };
  });
  return { crit: GCRIT, rows, per };
 },
 villes: [
  ['Lyon', 3, 3, 3, 'Croix-Rousse, Guillotière · deuxième métropole, vivier étudiant, nombreux tiers-lieux'],
  ['Nantes', 3, 3, 2, 'Bouffay, Île de Nantes · scène culturelle dense, tiers-lieux'],
  ['Bordeaux', 3, 2, 3, 'Chartrons, Saint-Michel · Timeleft implanté, culture du vin et des bars'],
  ['Lille', 3, 2, 2, 'Wazemmes, Vieux-Lille · population très jeune, bars nombreux'],
  ['Toulouse', 3, 2, 3, 'Carmes, Saint-Cyprien · grande ville étudiante, Timeleft implanté'],
  ['Marseille', 2, 3, 3, 'Cours Julien, Notre-Dame-du-Mont · Timeleft implanté, scène associative active'],
  ['Montpellier', 3, 2, 2, 'Écusson, Beaux-Arts · ville jeune, densité étudiante'],
  ['Rennes', 2, 2, 2, 'Centre, Sainte-Anne · ville étudiante, vie associative forte']
 ],
 pfNote: 'Les écarts entre les cinq premiers portefeuilles sont faibles (4 points) et sensibles aux poids. Comptoirs de quartier reste le meilleur terrain pour les mixes signature de soirée (Vin et vinyles, Tours de comptoir, Chorale de comptoir). Formats d’équipe finance le reste.',
 limits: [
  'Toutes les notes sont des estimations produites en cinq lots parallèles, harmonisées a posteriori. Aucune n’est mesurée sur le terrain. La propension à payer en particulier doit être vérifiée par des préventes.',
  'Le recentrage par secteur corrige des biais de lot mais efface aussi une partie des écarts réels. Il est documenté et réversible dans le script de construction (constante SHRINK).',
  'Les prix des paliers sont des fourchettes de marché indicatives pour Paris en 2026. Ils ne tiennent pas compte de la TVA ni du statut de l’hôte.',
  '36 paires de noms proches entre secteurs (quasi-doublons) restent dans le catalogue. Une partie sont de vrais doublons à fusionner, d’autres des angles différents.',
  'Les mini-économies des parades et le simulateur reposent sur des hypothèses (forfaits, taux de conversion, parts des hôtes). Les montants publics cités (pass Culture, TFPB, budgets de CSE) changent chaque année.',
  'Le moteur de mix note la cohérence à partir des mots-clés, sens, lieux, moments et productions déclarés. Il ne connaît pas le marché réel : l’originalité est approchée par la rareté des paires de secteurs. Les mixes doivent être testés en séance pilote.',
  'La géographie note les arrondissements de 1 à 3 à dire d’expert, à remplacer par un recensement des lieux partenaires (OpenStreetMap, annuaires de tiers-lieux).',
  'Le cadre réglementaire est résumé. L’enseignement rémunéré du sport, les premiers secours, l’alcool et l’accueil de mineurs demandent une vérification juridique avant tout lancement.'
 ],
 takeaways: [
  '<strong>1 034 niches</strong> rangées en 17 secteurs, 113 catégories et 333 sous-catégories, chacune avec une échelle de cinq paliers, du « je découvre » au « référent ». La règle n → n-1 fixe qui peut animer : un hôte de niveau 2 suffit pour une découverte, ce qui rend le vivier d’hôtes large dès le départ.',
  '<strong>Analyse agnostique.</strong> La grille compte douze critères de marché, d’offre et de format, sans aucun critère d’équipe. Tous les classements, portefeuilles et exemples en découlent.',
  '<strong>Le top 15</strong> mêle prise de parole, vidéo verticale, bouquet de saison, crochet, magie, jeu de rôle, photo au smartphone, pâtes fraîches, plantes d’intérieur et petits travaux. Quatre niches y entrent grâce à leur parade.',
  '<strong>366 niches ont une propension à payer de 2 ou moins</strong>, dont 159 restent au-dessus de la médiane du catalogue sur tous les autres critères. Seize parades les financent : tiers payeurs (entreprise, collectivité, médiathèque, bailleur, caisse de retraite, pass Culture, marque, lieu), packages (duo premium, sortie et atelier, bon cadeau, kit) et formes communautaires (prix libre, temps contre accès).',
  '<strong>Les mixes inventent l’offre introuvable.</strong> Le moteur note chaque paire sur neuf composantes et refuse les paires sans pont de sens. 51 mixes sont rédigés à la main, en tête Vin et vinyles, Carnet relié carnet écrit, Blind test improvisé, Fanzine de nouvelles et Main contre machine.',
  '<strong>Portefeuille recommandé</strong> : Ateliers et tiers-lieux en cœur, Salles de quartier en complément, à ouvrir dans le 13e, le 20e, le 10e et le 11e. Comptoirs et Formats d’équipe suivent de près.'
 ]
};
