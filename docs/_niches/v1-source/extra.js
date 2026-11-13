module.exports = {
 crit: [
  ["dem", "Taille de la demande", "Pratiquants, recherches, dépense des ménages. 5 = plus d'un million d'intéressés en France", 15],
  ["tre", "Croissance et tendance", "Évolution des licences, de l'offre, signaux presse et réseaux. 5 = forte vogue", 10],
  ["pay", "Propension à payer", "Prix observés sur le marché, achat cadeau, budget entreprise. 5 = prix de marché très au-dessus de 22 €", 10],
  ["conc", "Espace concurrentiel", "Intensité et qualité de l'offre existante, gratuit compris. 5 = peu d'offre adaptée au format", 8],
  ["com", "Densité communautaire", "Clubs, associations, groupes, cercles naturels. 5 = communauté dense et visible", 8],
  ["fmt", "Aptitude au format", "Les cinq critères du dossier v2 · résultat en 1 h, montrable, peu de matériel, pas de diplôme légal, on y revient", 18],
  ["off", "Potentiel d'offreurs", "Vivier de personnes capables de transmettre en petit groupe. 5 = vivier immense", 12],
  ["mon", "Monétisation des offreurs", "Revenu possible pour un hôte, séances d'équipe, prestations. 5 = fort", 6],
  ["reg", "Risque réglementaire", "Diplôme obligatoire, alcool, hygiène, sécurité, santé. 5 = aucun risque", 8],
  ["fon", "Adéquation fondateurs", "Musique électronique, IA, enseignement (Antoine). 5 = Antoine peut animer", 5]
 ],
 fmt: {atelier: "Atelier 1 h", arc: "Arc 3 séances", cercle: "Cercle ou salon", chantier: "Chantier 4 à 6 sem.", enligne: "En ligne"},
 mode: {local: "Local", enligne: "En ligne", mixte: "Local et en ligne"},
 verdicts: {prioritaire: ["Prioritaire", "int"], tester: ["À tester", "sent"], tard: ["Plus tard", "wait"], ecarter: ["Écarter", "no"]},
 portfolios: [
  {id: "A", n: "Soirées de quartier", tag: "Boire, manger et musique",
   niches: ["Latte art et mousse de lait", "Mixologie sans alcool", "Cocktails classiques à la maison", "Initiation DJ sur contrôleur", "Salon d'écoute commentée d'un genre", "Première boucle en MAO (Ableton, GarageBand)"],
   syn: [["Lieux communs", "Coffee shop l'après-midi, bar à platines le soir · un même partenaire accueille deux familles de séances"], ["Publics communs", "25-40 ans urbains qui sortent, cadeaux, groupes d'amis, comités d'entreprise"], ["Offreurs croisés", "Barmen qui mixent, DJs qui tiennent un bar, baristas de coffee shops · Antoine anime DJ, MAO et écoute"], ["Format signature", "Soirée « cocktail sans alcool + 20 min de set » qui enchaîne deux cordes et crée le deuxième usage du mois"]],
   risk: "Alcool cantonné aux bars licenciés qui vendent eux-mêmes. Volume sonore et Sacem gérés par le lieu.",
   kpi: "Score moyen le plus élevé des trois portefeuilles, prix de marché 3 à 6 fois supérieurs à notre place"},
  {id: "B", n: "Créer avec l'IA", tag: "Passions augmentées",
   niches: ["Automatiser sa vie avec l'IA", "Créer des images avec l'IA", "Créer un site ou une appli sans coder", "Produire avec l'IA", "Écrire une chanson avec l'IA", "Montage vidéo vertical"],
   syn: [["Lieux communs", "Coworkings, tiers-lieux, médiathèques, cafés calmes avec prises"], ["Publics communs", "Actifs 25-45 ans, indépendants, créatifs, associations"], ["Offreurs croisés", "Designers, développeurs, vidéastes, producteurs · Antoine en premier hôte"], ["Format signature", "Arc de trois séances qui aboutit à une réalisation publiée (site, clip, chanson)"]],
   risk: "Concurrence gratuite des cafés IA, obsolescence des outils, moins de chaleur humaine.",
   kpi: "Meilleure adéquation fondateur, débouché entreprise fort"},
  {id: "C", n: "Mains et objets", tag: "Fait main et réparation",
   niches: ["Linogravure", "Broderie et punch needle", "Crochet · premiers points et amigurumi", "Retouche et raccommodage visible", "Réparer son vélo", "Boutures et rempotage"],
   syn: [["Lieux communs", "Tiers-lieux, ressourceries, merceries, ateliers vélo, cafés"], ["Publics communs", "25-40 ans attentifs au réemploi, majoritairement des femmes pour le textile"], ["Offreurs croisés", "Couturières, illustrateurs, bénévoles de Repair Cafés et d'ateliers vélo"], ["Format signature", "Cercle hebdomadaire « fil et café » et chantier de fanzine ou de marché de créateurs"]],
   risk: "Monétisation faible, concurrence gratuite des associations, matériel à stocker.",
   kpi: "Rétention forte par les cercles, faible prix"}
 ],
 reco: {
  core: ["Latte art et mousse de lait", "Mixologie sans alcool", "Initiation DJ sur contrôleur", "Salon d'écoute commentée d'un genre", "Première boucle en MAO (Ableton, GarageBand)"],
  plus: ["Animer sa première séance"],
  later: ["Cocktails classiques à la maison", "Automatiser sa vie avec l'IA", "Créer des images avec l'IA"]
 },
 geo: {
  paris: [
   ["11e · Oberkampf, Bastille, Parmentier", 3, 3, 3, 2, "Concentration d'ateliers latte art, cocktails et mixologie sans alcool déjà observée sur les plateformes (11e cité trois fois) · bars et coffee shops denses"],
   ["10e · Canal Saint-Martin, Château-d'Eau", 3, 3, 3, 2, "Ateliers latte art observés (10e), écoles DJ près de Château-d'Eau, coffee shops de spécialité"],
   ["20e · Belleville, Ménilmontant", 3, 2, 2, 3, "Bars à platines, studios et tiers-lieux culturels, loyers des lieux plus bas · vivier d'hôtes musiciens"],
   ["9e et 18e sud · Pigalle, Abbesses", 2, 3, 3, 2, "Atelier barista observé (9e), bars de nuit, disquaires de Pigalle"],
   ["3e · Haut-Marais", 2, 3, 2, 1, "Coffee shops et boutiques, public solvable, lieux chers et moins de créneaux creux"]
  ],
  pcrit: ["Public 25-39 ans", "Densité de cafés et bars", "Offre d'ateliers existante", "Lieux à heures creuses abordables"],
  villes: [
   ["Lyon", 3, 3, 3, "Croix-Rousse, Guillotière · deuxième métropole, forte scène électronique, vivier étudiant"],
   ["Bordeaux", 3, 2, 3, "Chartrons, Saint-Michel · Timeleft y est implanté, culture vin et bars"],
   ["Nantes", 3, 3, 2, "Bouffay, Île de Nantes · scène culturelle dense, tiers-lieux"],
   ["Lille", 3, 2, 2, "Wazemmes, Vieux-Lille · population étudiante très jeune, bars nombreux"],
   ["Marseille", 2, 3, 3, "Cours Julien, Notre-Dame-du-Mont · Timeleft implanté, scène musicale active"],
   ["Toulouse", 3, 2, 3, "Carmes, Saint-Cyprien · Timeleft implanté, grande ville étudiante"],
   ["Montpellier", 3, 2, 2, "Écusson, Beaux-Arts · ville jeune, densité étudiante"],
   ["Rennes", 2, 2, 2, "Centre, Sainte-Anne · ville étudiante, scène électronique historique (Trans Musicales)"]
  ],
  vcrit: ["Vivier jeunes actifs et étudiants", "Scène nuit et musique", "Signal de demande (acteurs du lien implantés)"]
 }
};
