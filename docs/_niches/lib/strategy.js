/* Portefeuilles candidats, géographie, villes, limites, corrections de données et parades manuelles.
   Les portefeuilles sont définis par un circuit de lieux (contrainte opérationnelle), jamais par les compétences d'une équipe.
   La sélection des niches et le classement des portefeuilles sont calculés par build.js. */
const has = (a, b) => a.some(x => b.includes(x));
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
 manualParades: {},
 portfolios: [
  {id: 'comptoirs', n: 'Comptoirs de quartier', tag: 'Cafés, bars, caves, librairies', size: 6, maxSec: 2,
   pick: n => has(n.venues, ['cafe', 'coffee-shop', 'bar', 'cave', 'restaurant', 'librairie']),
   need: [3, 0, 0, 0, 1, 1, 2, 0, 0, 1],
   desc: 'Un circuit de lieux qui ont déjà le matériel et la clientèle, et qui cherchent à remplir leurs heures creuses.',
   risk: 'Alcool limité aux lieux licenciés qui vendent eux-mêmes. Dépendance aux heures creuses des lieux.'},
  {id: 'ateliers', n: 'Ateliers et tiers-lieux', tag: 'Fablabs, ateliers d’artisans, tiers-lieux', size: 6, maxSec: 2,
   pick: n => has(n.venues, ['atelier-artisan', 'fablab', 'tiers-lieu']),
   need: [0, 3, 0, 0, 1, 0, 1, 1, 0, 1],
   desc: 'Des lieux équipés qui accueillent volontiers des collectifs, avec des productions montrables.',
   risk: 'Matériel et sécurité des machines. Tiers-lieux souvent associatifs, donc sensibles au prix.'},
  {id: 'dehors', n: 'Dehors et quartier', tag: 'Parcs, jardins, balades', size: 6, maxSec: 2,
   pick: n => has(n.venues, ['parc', 'nature', 'jardin-partage']),
   need: [0, 0, 3, 0, 0, 0, 1, 2, 1, 0],
   desc: 'Aucun loyer, des sorties le week-end, un ancrage de quartier très visible.',
   risk: 'Météo et saisonnalité. Propension à payer souvent faible, d’où les parades.'},
  {id: 'studios', n: 'Studios et salles', tag: 'Studios de musique et de danse, salles', size: 6, maxSec: 2,
   pick: n => has(n.venues, ['studio-musique', 'studio-danse', 'salle-sport', 'salle-polyvalente']),
   need: [0, 0, 0, 3, 0, 0, 2, 0, 0, 2],
   desc: 'Des salles à heures creuses qui apportent le matériel et l’espace pour le corps et le son.',
   risk: 'Partage de recette avec le studio. Cadre de l’éducateur sportif pour certaines pratiques.'},
  {id: 'savoirs', n: 'Savoirs et médiathèques', tag: 'Médiathèques, librairies, galeries, écoles', size: 6, maxSec: 2,
   pick: n => has(n.venues, ['mediatheque', 'librairie', 'galerie', 'ecole']),
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
 limits: [],
 takeaways: []
};
