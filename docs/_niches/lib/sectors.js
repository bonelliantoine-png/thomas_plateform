// 17 secteurs = 17 univers de SCHEMA.md (ids figés).
// ch : chiffres [type S|E|H, texte, [sources]] · b : bench [acteur, modèle, prix, forces, failles]
// dm : public potentiel en millions (15 ans et plus, France) pour la taille des bulles, dmT type, dmN raisonnement
// dom : domaines [id, nom, défauts {p public, c concurrents, o offreurs, l lieux, r risques}]
module.exports = [
{
 id: "cuisine", n: "Cuisine & boissons", g: "◐",
 diag: "Le secteur le plus évident pour le format d'une heure. Le résultat se boit ou se mange, le lieu partenaire existe déjà (café, bar, cave) et les prix de marché à Paris sont très au-dessus de notre place à 22 €. Les deux contraintes sont l'alcool et l'hygiène.",
 ch: [
  ["S", "Atelier latte art à Paris · 85 à 150 € la séance de 2 h selon les plateformes", ["funblatte", "caplatte"]],
  ["S", "Atelier cocktails à Paris · dès 60 à 90 €, mixologie sans alcool à 59,90 € pour 1 h 30", ["capcocktail", "funbmocktail"]],
  ["S", "Cours d'œnologie à Paris · 40 à 120 € selon durée et vins", ["winalist", "capoeno"]],
  ["S", "2 500 brasseries en France en 2025, 209 fermetures et 213 ouvertures dans l'année", ["brasseurs"]],
  ["S", "L'Atelier des Chefs · 230 000 clients et 13 M€ de CA dès 2013 · la demande de cours de cuisine loisir est ancienne", ["adc"]],
  ["S", "Vente d'alcool à consommer sur place · licence et permis d'exploitation obligatoires, exception limitée aux cercles privés non commerciaux", ["drogues"]],
  ["S", "Loisirs premium · 33 % des Français en ont acheté un en 2025, 50 % des 18-24 ans", ["credoc348"]],
  ["E", "Public potentiel ≈ 12 M de 15 ans et plus. Raisonnement · un adulte sur quatre ou cinq déclare vouloir mieux cuisiner ou déguster, ordre de grandeur cohérent avec la fréquentation des ateliers marchands. À confirmer par sondage.", []]
 ],
 b: [
  ["L'Atelier des Chefs", "Cours en ateliers franchisés, B2C et entreprises", "≈ 40 à 90 € le cours (relevé indicatif)", "Marque connue, cuisines équipées, offre entreprise", "Cours pros sans lien entre participants, réseau qui s'est contracté"],
  ["Wecandoo", "Commission sur ateliers d'artisans (≈ 20 % selon la presse)", "30 à 100 € par personne", "Cadeau, 3 000 artisans, groupes d'entreprise", "Achat ponctuel, aucune communauté après l'atelier"],
  ["Funbooker · Cap Adrénaline", "Places de marché d'activités, commission", "60 à 150 € (latte art, cocktails)", "Catalogue large, SEO, cadeaux", "Prix élevés, expérience transactionnelle"],
  ["Airbnb Expériences", "Expériences sélectionnées, commission", "≈ 170 € pour les expériences de chefs", "Audience mondiale, contenu premium", "Cible touristes, volumes locaux faibles"],
  ["Cavistes et coffee shops", "Ateliers maison en direct", "40 à 100 €", "Lieu, matériel, crédibilité", "Communication faible, créneaux rares"],
  ["Timeleft", "Dîners entre inconnus, ticket ou abonnement", "dès 17,99 € par mois", "Rituel hebdo, 3 M d'utilisateurs revendiqués", "Aucun apprentissage, concurrent sur la promesse de lien"]
 ],
 sig: ["Mixologie sans alcool mise en avant par les prestataires parisiens", "Funflation · 33 % des Français ont acheté un loisir premium, 50 % des 18-24 ans (Crédoc)", "Recul de la consommation d'alcool et fermetures de brasseries · la dégustation se déplace vers le sans alcool et le café"],
 opp: "Notre place à 22 € est 3 à 6 fois moins chère que le marché pour un format plus court. Les cafés et bars ont des heures creuses. Priorité au café et au sans alcool, alcool seulement dans un lieu licencié qui vend lui-même.",
 dm: 12, dmT: "E", dmN: "Estimation · un quart des adultes intéressés par apprendre à cuisiner ou déguster",
 dom: [
  ["cuisine.cafe", "Café & barista", {p: "25-40 ans urbains, amateurs de cafés de spécialité, idées cadeaux", c: "Funbooker, Cap Adrénaline, coffee shops, La Caféothèque (formations pros)", o: "Baristas de coffee shops, anciens baristas, torréfacteurs", l: "Coffee shops entre 14 h et 17 h, torréfacteurs", r: "Machine professionnelle requise, donc lieu obligatoire"}],
  ["cuisine.bar", "Cocktails & bar", {p: "25-40 ans, soirées entre amis, EVJF, comités d'entreprise", c: "Cap Adrénaline, Funbooker, Wecandoo, masterclass de bars", o: "Barmen en poste ou reconvertis", l: "Bars entre 17 h et 19 h", r: "Alcool · le lieu licencié vend, l'hôte n'encaisse pas l'alcool, pas de mineurs"}],
  ["cuisine.degust", "Vin, bière & dégustation", {p: "28-55 ans, couples, cadeaux", c: "Cavistes, Prodégustation, Les Caves du Louvre, bars à vin", o: "Cavistes, sommeliers amateurs certifiés, brasseurs", l: "Caves, bars à vin, bars à bières, brasseries", r: "Alcool · licence du lieu, modération, éthylotests"}],
  ["cuisine.monde", "Cuisine du quotidien & du monde", {p: "Actifs pressés, couples, foodies", c: "L'Atelier des Chefs, Airbnb Expériences, Wecandoo, YouTube, applis de recettes", o: "Cuisiniers amateurs, diasporas, chefs à domicile", l: "Cuisines partagées, tiers-lieux nourriciers, restaurants hors service", r: "Hygiène alimentaire, cuisine équipée nécessaire"}],
  ["cuisine.boulange", "Boulangerie, pâtisserie & fermentation", {p: "Amateurs de fait maison, post-confinement", c: "Boulangers et pâtissiers en atelier, Wecandoo, YouTube", o: "Boulangers amateurs, pâtissiers, passionnés de fermentation", l: "Fournils, boulangeries, cuisines partagées", r: "Temps de pousse ou de fermentation qui dépasse 1 h, four"}]
 ]
},
{
 id: "musique", n: "Musique & son", g: "♪",
 diag: "Passion forte et cercles naturels, mais la pratique amateur recule, de 20 % des 15 ans et plus en 1988 à 11 % en 2018. La production assistée par ordinateur et le DJing captent une part croissante des jeunes pratiquants.",
 ch: [
  ["S", "Pratique musicale amateur · 11 % des 15 ans et plus en 2018, contre 20 % en 1988", ["cultfdm"]],
  ["S", "16 % déclarent jouer actuellement d'un instrument, davantage chez les jeunes", ["cnm"]],
  ["S", "Chant choral · environ 5 % de la population", ["anchoral"]],
  ["S", "Superprof · piano 32 €/h en moyenne et 13 645 profs, cours de musique à Paris 38 €/h", ["sppiano", "spmusparis"]],
  ["S", "Cours de DJ à Paris · ≈ 38 €/h, écoles en forfaits de 110 à 510 € (2 à 10 h)", ["spdj"]],
  ["S", "Musiques électroniques · CA estimé à 416 M€ en France (Technopol), événements multipliés par 4 entre 2014 et 2017", ["europe1electro"]],
  ["S", "Monde · 12,9 Md$ pour les musiques électroniques en 2024 (IMS)", ["imsbill"]],
  ["S", "Les musiques électroniques françaises figurent à l'inventaire du patrimoine culturel immatériel", ["pcielectro"]],
  ["E", "Public potentiel ≈ 6 M. Calcul · 11 % × environ 54 M de 15 ans et plus.", ["cultfdm"]]
 ],
 b: [
  ["Superprof", "Annonces gratuites, pass élève (39 € selon le dossier v2)", "25 à 45 €/h", "Vivier immense, SEO", "Cours individuel, aucune appartenance"],
  ["Écoles DJ et MAO (Rythmik, All Music Four School)", "Forfaits d'heures, cursus", "110 à 1 600 €", "Matériel, pédagogie structurée", "Cher, logique de cursus"],
  ["Conservatoires et écoles municipales", "Cursus annuels subventionnés", "Tarif selon quotient", "Prix bas, qualité", "Listes d'attente, solfège, enfants d'abord"],
  ["YouTube, Ableton Learn, Splice", "Gratuit ou abonnement", "0 à 15 €/mois", "Accès illimité", "Solitude, abandon fréquent"],
  ["Studios de répétition", "Location horaire", "15 à 40 €/h la salle", "Lieu et matériel", "Aucune pédagogie, salles vides en journée"],
  ["Disquaires et listening bars", "Événements gratuits ou à la consommation", "Gratuit à 15 €", "Communauté, culture", "Pas de format d'apprentissage"]
 ],
 sig: ["Tendance électronique et DJ portée par les 18-35 ans", "IA générative musicale (génération, séparation de stems) qui rend la production plus accessible", "Studios à heures creuses disponibles (hypothèse du dossier v2)"],
 opp: "Formats prioritaires · initiation DJ, première boucle en MAO, salon d'écoute commenté, production avec l'IA. Le lieu partenaire (bar à platines, studio, disquaire) apporte le matériel.",
 dm: 6, dmT: "E", dmN: "11 % des 15 ans et plus pratiquent (DEPS 2018)",
 dom: [
  ["musique.electro", "Musique électronique & production", {p: "18-40 ans, musiciens, fans de musiques électroniques", c: "Superprof MAO (24 à 45 €/h), écoles (SAE, Rythmik), YouTube, Ableton Learn", o: "Producteurs amateurs et semi-pros", l: "Studios à heures creuses, tiers-lieux culturels, disquaires", r: "Ordinateur portable requis, licences logicielles (versions d'essai)"}],
  ["musique.ia", "Musique & IA", {p: "Créatifs 18-45 ans, vidéastes, musiciens curieux", c: "Tutoriels YouTube, outils en ligne (génération, séparation de stems), formations pros", o: "Producteurs à l'aise avec l'IA", l: "Studios, coworkings, tiers-lieux culturels", r: "Droits d'auteur des contenus générés, abonnements aux outils"}],
  ["musique.dj", "DJ & sélection", {p: "20-40 ans, fêtards curieux, organisateurs de soirées", c: "Écoles DJ (forfaits 110 à 510 €), Superprof (≈ 38 €/h à Paris), YouTube", o: "DJs amateurs et résidents de bars, très nombreux", l: "Bars équipés de platines, disquaires, studios", r: "Matériel (contrôleur 200 à 300 €) fourni par le lieu, volume sonore"}],
  ["musique.instru", "Instruments & accords", {p: "Adultes débutants ou ex-musiciens", c: "Superprof, conservatoires, écoles privées, applis (Yousician, Simply Piano)", o: "Musiciens amateurs, étudiants de conservatoire", l: "Cafés, bars, MJC, studios", r: "Prêt d'instruments, niveaux hétérogènes"}],
  ["musique.voix", "Voix & chant", {p: "Adultes de tous âges", c: "Chorales associatives, coachs vocaux, Superprof", o: "Chanteurs amateurs, chefs de chœur", l: "Salles associatives, bars, églises", r: "Gêne au début, besoin d'un piano ou d'une enceinte"}],
  ["musique.ecoute", "Écoute & culture musicale", {p: "Mélomanes 25-55 ans", c: "Listening bars, podcasts, conférences de médiathèques", o: "DJs, journalistes musicaux, collectionneurs", l: "Disquaires, listening bars, médiathèques", r: "Résultat moins tangible, droits de diffusion dans le lieu (Sacem du lieu)"}]
 ]
},
{
 id: "image", n: "Arts visuels & image", g: "◩",
 diag: "La photographie est la première pratique amateur des Français (19 % des 15 ans et plus en 2018), devant le dessin (12 %). Le résultat se montre par définition, le coût d'entrée est faible et les lieux sont partout. Les niveaux sont très hétérogènes.",
 ch: [
  ["S", "Photographie · 19 % des 15 ans et plus en 2018, pratique amateur la plus répandue", ["deps22", "inseefps"]],
  ["S", "Dessin · 12 % des 15 ans et plus au cours des 12 derniers mois", ["deps22"]],
  ["S", "61 % des amateurs utilisent des outils numériques pour créer, partager ou se former", ["inseefps"]],
  ["S", "Domestika revendique plus de 8 millions de créatifs, revenus issus des cours", ["domapp", "domtc"]],
  ["S", "Pratique amateur hors sciences · 39 % en 2018 contre 50 % en 2008", ["deps22"]],
  ["S", "Repère européen · dans la plupart des pays de l'UE, plus de la moitié des 16 ans et plus ont participé à une activité culturelle en 2022 (module EU-SILC)", ["eurostat"]],
  ["E", "Public potentiel ≈ 10 M. Calcul · 19 % × environ 54 M de 15 ans et plus.", ["deps22"]]
 ],
 b: [
  ["Domestika", "Cours vidéo à l'unité, communauté gratuite", "≈ 10 à 20 € le cours en promotion (relevé indicatif)", "Catalogue créatif mondial, qualité de production", "Solitaire, taux de complétion faible"],
  ["Wecandoo", "Ateliers d'artisans à commission", "30 à 100 €", "Gravure, illustration, cadeau", "Ponctuel"],
  ["Ateliers des Beaux-Arts de la Ville de Paris", "Cours annuels municipaux", "Tarif selon quotient", "Prix bas, qualité", "Inscription annuelle, places rares"],
  ["Paint and sip (Wine & Paint, Art Sip)", "Soirées peinture avec boisson", "≈ 35 à 50 € (hypothèse)", "Convivial, EVJF, entreprises", "Reproduction d'un modèle, peu de progression"],
  ["Urban Sketchers et groupes Meetup", "Communautés gratuites", "Gratuit", "Sorties régulières, liens", "Aucun encadrement pour débutants"]
 ],
 sig: ["Photo au smartphone universelle", "Retour du fait main (linogravure, carnet de voyage)", "Outils d'IA image qui déplacent la valeur vers la direction artistique"],
 opp: "Photo au smartphone, carnet de croquis urbain et linogravure passent les cinq critères. L'image se combine avec les autres secteurs (latte art × illustration, pochette d'une compilation musicale).",
 dm: 10, dmT: "E", dmN: "19 % des 15 ans et plus pratiquent la photo (DEPS 2018)",
 dom: [
  ["image.photo", "Photographie", {p: "Tous âges, possesseurs de smartphone ou d'hybride", c: "Domestika, YouTube, photographes en atelier, Airbnb Expériences", o: "Photographes amateurs avancés, très nombreux", l: "Rues et parcs, cafés pour la retouche", r: "Droit à l'image des passants"}],
  ["image.dessin", "Dessin & illustration", {p: "Adultes qui ont arrêté de dessiner enfants", c: "Ateliers municipaux, Domestika, écoles privées", o: "Étudiants en art, illustrateurs, graphistes", l: "Cafés, musées, bibliothèques", r: "Niveaux hétérogènes"}],
  ["image.gravure", "Gravure & impression", {p: "Créatifs 25-45 ans", c: "Wecandoo, ateliers de gravure, fab labs", o: "Graveurs, sérigraphes, illustrateurs", l: "Ateliers d'artistes, tiers-lieux, fab labs", r: "Gouges et encres, petite casse"}],
  ["image.video", "Vidéo & animation", {p: "Créateurs, commerçants, associations", c: "YouTube, formations CPF, Domestika", o: "Monteurs, vidéastes, community managers", l: "Coworkings, médiathèques", r: "Concurrence des tutoriels gratuits"}],
  ["image.peinture", "Peinture", {p: "Adultes, groupes, EVJF", c: "Paint and sip, ateliers municipaux, cours privés", o: "Peintres amateurs, étudiants en art", l: "Bars, ateliers d'artistes, salles associatives", r: "Taches, matériel à fournir"}]
 ]
},
{
 id: "artisanat", n: "Artisanat & fait-main", g: "✶",
 diag: "Secteur porté par l'envie de fait main et par les réseaux sociaux (céramique, crochet, broderie). Wecandoo y a prouvé la demande de découverte en présentiel. Les techniques à four ou à machine sortent du format d'une heure.",
 ch: [
  ["S", "Wecandoo · près de 3 000 artisans, plus de 6 000 initiations et 700 000 participants cumulés (fév. 2025)", ["wcdcma"]],
  ["S", "Wecandoo · 1 320 ateliers ouverts aux groupes de 10 et plus, soit 25 % de l'offre, de 30 à 100 € par personne", ["wcdgroupes"]],
  ["S", "Wecandoo · commission d'environ 20 % sur le prix de l'atelier, inscription gratuite des artisans", ["wcdcomm"]],
  ["S", "Loisirs créatifs · marché estimé à 2,4 Md€ en 2019, dernière estimation connue", ["bpiloisirs"]],
  ["S", "Cafés céramique complets, 17 créneaux de 30 places par semaine dans l'exemple cité", ["cafeceram"]],
  ["S", "Poterie · loisir à la mode, vigilance sur les émaux (métaux lourds)", ["reporterrepoterie"]],
  ["S", "Tricot et crochet popularisés par les adolescents et jeunes adultes sur les réseaux", ["sudradio"]],
  ["E", "Public potentiel ≈ 5 M. Raisonnement · marché de 2,4 Md€ et dépense annuelle de quelques centaines d'euros par pratiquant actif.", ["bpiloisirs"]]
 ],
 b: [
  ["Wecandoo", "Commission sur ateliers d'artisans", "30 à 100 €", "Notoriété, cadeau, 700 000 participants", "Aucun lien après l'atelier, prix élevés"],
  ["Cafés céramique", "Entrée + pièce à peindre", "≈ 25 à 45 € (hypothèse)", "Convivial, sans prérequis", "Peinture sur biscuit, peu d'apprentissage"],
  ["Ateliers de céramique indépendants", "Cours trimestriels, stages", "≈ 250 à 450 € le trimestre (hypothèse)", "Four, matériel, progression", "Complets, engagement long"],
  ["Merceries et Domestika", "Kits, cours vidéo", "10 à 40 €", "Autonomie", "Solitaire"],
  ["Cercles tricot associatifs", "Gratuit ou adhésion", "0 à 30 €/an", "Liens forts", "Peu visibles, vieillissants"],
  ["Obby (Royaume-Uni, repère européen)", "Place de marché d'ateliers créatifs à Londres", "Prix fixés par les hôtes", "Catalogue local large, multi-disciplines", "Racheté par ClassBento, n'accepte plus de réservations · le modèle catalogue seul tient mal"]
 ],
 sig: ["Engouement céramique documenté par la presse", "Crochet et tricot chez les 18-30 ans", "Groupes d'entreprise · 25 % de l'offre Wecandoo"],
 opp: "Viser les techniques sans four ni machine en 1 h (crochet, broderie, modelage à cuisson différée, linogravure) et le format cercle pour le tricot et le crochet. La céramique au tour reste chez les ateliers spécialisés.",
 dm: 5, dmT: "E", dmN: "Estimation à partir du marché des loisirs créatifs",
 dom: [
  ["artisanat.ceram", "Céramique", {p: "25-45 ans, majoritairement des femmes, cadeaux", c: "Wecandoo, ateliers céramique, cafés céramique", o: "Céramistes, amateurs avancés", l: "Ateliers céramique, cafés céramique", r: "Cuisson différée (2 à 3 semaines), four, émaux"}],
  ["artisanat.textile", "Fils & textile", {p: "18-35 ans via les réseaux, seniors expérimentés", c: "Merceries, YouTube, Domestika, cercles associatifs", o: "Tricoteuses et crocheteuses, vivier énorme", l: "Cafés, merceries, bibliothèques", r: "Faible"}],
  ["artisanat.bois", "Bois & cuir", {p: "Adultes manuels, 25-50 ans", c: "Wecandoo, ateliers partagés, fab labs", o: "Artisans, amateurs outillés", l: "Ateliers partagés, tiers-lieux de fabrication", r: "Outils tranchants, machines"}],
  ["artisanat.objets", "Bijoux, bougies & cosmétiques", {p: "Groupes, EVJF, cadeaux", c: "Wecandoo, Funbooker, kits", o: "Créatrices de bijoux et de bougies", l: "Boutiques de créateurs, cafés", r: "Produits chimiques (soude), réglementation cosmétique à la vente"}],
  ["artisanat.papier", "Papier & reliure", {p: "Amateurs de carnets et de papeterie", c: "Ateliers de reliure, Wecandoo", o: "Relieurs, papetiers", l: "Papeteries, librairies, cafés", r: "Faible"}]
 ]
},
{
 id: "maison", n: "Maison, bricolage & réparation", g: "⌂",
 diag: "Demande utilitaire et ancrage local très forts, mais concurrence gratuite (Repair Cafés, ateliers vélo associatifs, ateliers d'enseignes). La valeur se trouve dans les bases du bricolage pour primo-locataires et dans la réparation.",
 ch: [
  ["S", "Marché du bricolage (GSB) · 22,1 Md€ en 2024, −4,3 %", ["fmb"]],
  ["S", "Plus de 400 Repair Cafés en France", ["connexrepair"]],
  ["S", "La Ville de Paris recense et promeut les lieux de réparation (Repair Cafés, ateliers vélo, artisans)", ["parisreparer"]],
  ["S", "Plus de 125 associations d'ateliers vélo participatifs fédérées par L'Heureux Cyclage", ["af3v"]],
  ["S", "Tiers-lieux · 1 540 lieux de fabrication (fab labs, makerspaces, ateliers partagés) en 2023", ["ftl23"]],
  ["E", "Public potentiel ≈ 10 M. Raisonnement · ménages qui bricolent au moins un peu, dont une part de jeunes urbains sans compétence de base.", []]
 ],
 b: [
  ["Repair Cafés", "Bénévolat, gratuit", "Gratuit", "400 lieux, image positive", "Réparation à la place de l'usager, horaires rares"],
  ["Ateliers vélo participatifs", "Adhésion associative", "≈ 10 à 40 €/an (hypothèse)", "Outillage, autonomie", "Affluence, accueil inégal"],
  ["Leroy Merlin · Castorama", "Ateliers gratuits en magasin", "Gratuit", "Outillage, audience", "Objectif commercial, format magasin"],
  ["YouTube", "Tutoriels gratuits", "Gratuit", "Exhaustif", "Pas de geste corrigé"],
  ["Artisans et Superprof bricolage", "Prestation ou cours", "30 à 60 €/h", "Expertise", "Peu orienté transmission"]
 ],
 sig: ["Primo-locataires peu outillés", "Réparation encouragée (bonus réparation, Repair Cafés)", "Ateliers non mixtes de bricolage"],
 opp: "Bases du bricolage et réparation de vélo en atelier d'1 h dans un tiers-lieu ou un atelier vélo partenaire. Positionnement · apprendre le geste, à la différence du Repair Café qui répare.",
 dm: 10, dmT: "E", dmN: "Estimation à partir du marché du bricolage",
 dom: [
  ["maison.repar", "Réparation", {p: "Urbains attentifs au réemploi, cyclistes", c: "Repair Cafés, ateliers vélo associatifs, YouTube", o: "Bénévoles de Repair Cafés, mécaniciens vélo, électroniciens amateurs", l: "Ateliers vélo, tiers-lieux, ressourceries", r: "Concurrence gratuite, sécurité électrique"}],
  ["maison.brico", "Bricolage du quotidien", {p: "Primo-locataires, jeunes, ateliers non mixtes", c: "Ateliers d'enseignes, YouTube, artisans", o: "Bricoleurs avertis, artisans retraités", l: "Tiers-lieux, ressourceries, magasins partenaires", r: "Outillage, sécurité"}],
  ["maison.deco", "Rénovation & déco", {p: "Propriétaires et locataires, 30-55 ans", c: "Décorateurs, Instagram, ateliers d'enseignes", o: "Décorateurs amateurs, artisans", l: "Ateliers partagés, ressourceries", r: "Chantiers longs, poussière"}],
  ["maison.energie", "Énergie & écogestes", {p: "Ménages attentifs à leurs factures", c: "Espaces conseil France Rénov', associations", o: "Conseillers, ingénieurs, militants", l: "Médiathèques, tiers-lieux", r: "Peu de résultat montrable"}]
 ]
},
{
 id: "nature", n: "Nature, jardin & animaux", g: "❦",
 diag: "Envie forte et saisonnière. Les plantes d'intérieur et le potager de balcon conviennent aux urbains. La cueillette, la mycologie et l'apiculture portent des risques ou des obligations qui les écartent du lancement.",
 ch: [
  ["S", "69 % des Français interrogés cultivent un potager ou des plantes comestibles (Unep-Ifop 2025)", ["unep25"]],
  ["S", "68 571 apiculteurs déclarés fin 2023, déclaration obligatoire dès la première ruche", ["franceagrimer"]],
  ["S", "Tiers-lieux nourriciers recensés parmi les 3 500 tiers-lieux de 2023", ["ftl23"]],
  ["E", "Public potentiel ≈ 10 M en contexte urbain. Raisonnement · une part des 69 % sans jardin qui jardine sur balcon ou en intérieur.", ["unep25"]]
 ],
 b: [
  ["Jardineries (Truffaut, Botanic)", "Ateliers en magasin", "Gratuit à 30 €", "Matériel, conseil", "Commercial"],
  ["Jardins partagés associatifs", "Adhésion", "Faible", "Lieu, communauté", "Places limitées"],
  ["Fleuristes et ateliers floraux", "Ateliers bouquets", "≈ 50 à 80 € (hypothèse)", "Résultat très montrable", "Prix élevés"],
  ["LPO et naturalistes", "Sorties associatives", "Gratuit à faible", "Expertise", "Peu visibles des 25-40 ans"]
 ],
 sig: ["Plantes d'intérieur et troc de boutures chez les 25-40 ans", "Saisonnalité du potager (mars à octobre)"],
 opp: "Boutures et rempotage, kokedama et bouquets de saison en atelier d'1 h. Potager de balcon en arc saisonnier au printemps.",
 dm: 10, dmT: "E", dmN: "Estimation à partir du baromètre Unep-Ifop",
 dom: [
  ["nature.jardin", "Jardin & potager", {p: "Urbains sans jardin, familles", c: "Jardineries, jardins partagés, YouTube", o: "Jardiniers amateurs, maraîchers", l: "Jardins partagés, tiers-lieux nourriciers, toits", r: "Saisonnalité"}],
  ["nature.plantes", "Plantes & fleurs", {p: "25-40 ans urbains", c: "Fleuristes, jardineries, Instagram", o: "Passionnés de plantes, fleuristes", l: "Fleuristes, cafés, boutiques de plantes", r: "Faible"}],
  ["nature.natura", "Naturalisme & cueillette", {p: "Curieux de nature, familles", c: "LPO, sociétés mycologiques, guides nature", o: "Naturalistes, botanistes amateurs", l: "Parcs, bois, sorties", r: "Toxicité des plantes et champignons, responsabilité"}],
  ["nature.animaux", "Animaux", {p: "Propriétaires d'animaux", c: "Éducateurs canins, clubs canins, apiculteurs formateurs", o: "Éducateurs, apiculteurs", l: "Parcs, ruchers écoles", r: "Réglementation animaux, piqûres, déclaration des ruches"}]
 ]
},
{
 id: "sport", n: "Sport & mouvement", g: "◭",
 diag: "La demande la plus massive (58 à 61 % des 15 ans et plus pratiquent régulièrement), mais l'enseignement contre rémunération est réservé aux diplômés déclarés. Un amateur ne peut pas être hôte rémunéré. Seuls les formats sans enseignement (sortie collective, jeu) restent ouverts.",
 ch: [
  ["S", "58 % des 15 ans et plus pratiquent une activité sportive régulière en 2024, 59 % en 2023", ["injep24", "injep23"]],
  ["S", "Édition 2025 du baromètre · 61 % de pratique régulière (relais)", ["injep25"]],
  ["S", "Marche et course · 48 % des Français, premier univers de pratique", ["injep24"]],
  ["S", "Padel · plus de 100 000 licenciés, +42,7 % en un an, 3 200 pistes en 2025", ["fftpadel", "fftpistes"]],
  ["S", "Course à pied · plus de 12 millions de pratiquants en 2025 selon l'Observatoire du running", ["marathonsrun"]],
  ["S", "Environ 13 millions de coureurs sur un an, contre 7 millions en 2017", ["connexrun"]],
  ["S", "Services récréatifs et sportifs des ménages · 20,6 Md€ en 2025, 19,1 % des dépenses culturelles, sportives et de loisirs", ["inseedep"]],
  ["S", "Enseigner contre rémunération une activité physique exige une qualification enregistrée et une déclaration (carte professionnelle). Sanction · un an de prison et 15 000 € d'amende", ["legisport", "ffmeoblig", "dossierv2"]],
  ["S", "Yoga et pilates relèvent de la même obligation selon l'analyse juridique citée", ["simonnet"]],
  ["E", "Public potentiel ≈ 31 M. Calcul · 58 % × environ 54 M de 15 ans et plus.", ["injep24"]]
 ],
 b: [
  ["Urban Sports Club", "Abonnement multi-lieux", "24 à 165 €/mois à Paris", "17 700 lieux, paliers", "Long à construire, pros uniquement"],
  ["ClassPass", "Crédits contre places invendues", "Variable", "Remplit les heures creuses", "Reversements jugés trop bas par des studios"],
  ["Clubs fédérés", "Licence annuelle", "100 à 400 €/an", "Encadrement diplômé", "Engagement annuel"],
  ["Run clubs de marques (Hoka, PSG Running)", "Gratuit, marketing", "Gratuit", "Communauté, image", "Aucun modèle payant pour nous"],
  ["Strava", "Social gratuit, fonctions payantes", "≈ 10 €/mois", "1 million de clubs", "Pas d'apprentissage en présentiel"]
 ],
 sig: ["Boom du padel et du running social", "Food running clubs à Paris depuis 2024", "Clubs Strava multipliés par trois entre 2024 et 2025 (international)"],
 opp: "Écarter l'enseignement sportif au lancement. Garder deux usages compatibles · le run club social comme rituel de lien (sans coaching payé) et les hôtes titulaires d'une carte professionnelle plus tard.",
 dm: 31, dmT: "E", dmN: "58 % des 15 ans et plus pratiquent (INJEP 2024)",
 dom: [
  ["sport.raquette", "Sports de raquette", {p: "25-45 ans actifs", c: "Clubs FFT, centres privés de padel, Urban Sports Club", o: "Moniteurs diplômés seulement", l: "Centres de padel, clubs", r: "Enseignement réservé aux diplômés"}],
  ["sport.course", "Course & marche", {p: "25-45 ans, nouveaux coureurs", c: "Run clubs gratuits, clubs Strava, marques", o: "Coureurs bénévoles, coachs diplômés", l: "Cafés point de départ, parcs", r: "Coaching rémunéré réservé aux diplômés"}],
  ["sport.fitness", "Fitness & renforcement", {p: "Actifs sédentaires", c: "Salles, studios, ClassPass, applis", o: "Coachs diplômés", l: "Studios, parcs", r: "Enseignement réservé aux diplômés"}],
  ["sport.combat", "Combat & défense", {p: "Adultes, souvent des femmes pour la self-défense", c: "Clubs, salles de boxe", o: "Enseignants diplômés", l: "Dojos, salles", r: "Diplôme, blessures"}],
  ["sport.glisse", "Glisse urbaine", {p: "Adultes débutants", c: "Écoles de skate, associations", o: "Pratiquants confirmés, moniteurs", l: "Skateparks", r: "Chutes, diplôme pour enseigner"}]
 ]
},
{
 id: "pleinair", n: "Plein air & aventure", g: "△",
 diag: "Envie d'évasion réelle chez les citadins, mais encadrement sportif réglementé et sécurité. La randonnée en groupe sans encadrement payant et la théorie (carte, bivouac) restent possibles.",
 ch: [
  ["S", "FFRandonnée · environ 243 700 licenciés et 3 500 clubs", ["ffrando"]],
  ["S", "FFME · record de 125 000 membres en 2024-2025", ["ffme25"]],
  ["S", "Salles d'escalade privées · fréquentation −5 % en 2025 par rapport à 2024", ["uscescalade"]],
  ["E", "Public potentiel ≈ 8 M. Raisonnement · sous-ensemble des 48 % qui marchent ou courent, intéressés par la randonnée ou l'aventure.", ["injep24"]]
 ],
 b: [
  ["Clubs FFRandonnée", "Licence et sorties encadrées par bénévoles", "≈ 30 à 60 €/an (hypothèse)", "3 500 clubs", "Public âgé, peu visible"],
  ["UCPA", "Séjours et stages encadrés", "Variable", "Encadrement diplômé", "Séjours, pas de proximité"],
  ["Salles d'escalade privées", "Entrée et abonnement", "≈ 15 à 20 € l'entrée (hypothèse)", "Lieux urbains, communauté", "Fréquentation en baisse"],
  ["Meetup randonnée", "Gratuit", "Gratuit", "Volume", "Qualité inégale"]
 ],
 sig: ["Record de licences en escalade, salles privées en recul", "Micro-aventure et bivouac"],
 opp: "Plus tard. Lecture de carte et bivouac en atelier théorique, sorties collectives sans enseignement payant pour animer les cercles.",
 dm: 8, dmT: "E", dmN: "Estimation à partir de la pratique de la marche",
 dom: [
  ["pleinair.rando", "Randonnée & orientation", {p: "Citadins 25-50 ans", c: "Clubs FFRandonnée, Meetup, guides", o: "Randonneurs expérimentés", l: "Gares, forêts d'Île-de-France", r: "Encadrement rémunéré réglementé en montagne"}],
  ["pleinair.verticale", "Escalade & verticalité", {p: "25-40 ans", c: "Salles privées, clubs FFME", o: "Moniteurs diplômés", l: "Salles d'escalade", r: "Diplôme obligatoire, chute"}],
  ["pleinair.eau", "Eau & glisse", {p: "Adultes urbains", c: "Clubs nautiques, bases de loisirs", o: "Moniteurs diplômés", l: "Bases nautiques", r: "Noyade, diplôme"}],
  ["pleinair.bivouac", "Bivouac & autonomie", {p: "Citadins en quête de micro-aventure", c: "Magasins de sport, YouTube, guides", o: "Randonneurs expérimentés, guides", l: "Magasins partenaires, parcs", r: "Feu, sécurité, réglementation du bivouac"}]
 ]
},
{
 id: "scene", n: "Danse, scène & spectacle", g: "✧",
 diag: "Des pratiques intrinsèquement collectives, avec des cercles naturels (soirées salsa, ligues d'impro, amicales de magie). La magie rapprochée et l'impro passent les cinq critères. Le théâtre ne touche qu'environ 1 % des 15 ans et plus.",
 ch: [
  ["S", "Danse · plus de 3 millions de pratiquants réguliers ou occasionnels selon la FFDanse (2018)", ["helloassodanse"]],
  ["S", "Salsa, bachata et kizomba en progression, sans comptage fédéral", ["sportmagsbk"]],
  ["S", "Théâtre et cirque · environ 1 % des 15 ans et plus chacun", ["deps22"]],
  ["S", "Bordeaux · 800 à 1 000 improvisateurs et une quarantaine de ligues (ordre de grandeur non sourcé par la Ville)", ["bdximpro"]],
  ["S", "Magie · FISM, plus de 80 000 magiciens dans 51 pays ; FFM, plus de 45 amicales en France", ["fism", "cmpffm"]],
  ["E", "Public potentiel ≈ 3,5 M. Raisonnement · 3 M de danseurs plus environ 1 % de théâtre et d'impro.", ["helloassodanse", "deps22"]]
 ],
 b: [
  ["Écoles de danse", "Cours annuels ou à la carte", "≈ 15 à 20 € le cours (hypothèse)", "Professeurs, salles", "Engagement annuel"],
  ["Soirées SBK", "Entrée avec cours d'initiation", "≈ 10 à 15 € (hypothèse)", "Communauté, rencontres", "Initiation de masse, peu de suivi"],
  ["Ligues et écoles d'impro (LIFI, Improvidence)", "Cours annuels, spectacles", "≈ 300 à 600 €/an (hypothèse)", "Pédagogie éprouvée", "Annuel, listes d'attente"],
  ["Amicales de magie (FFAP, FFM)", "Adhésion associative", "Faible", "Transmission entre pairs", "Peu visibles, codes d'entrée"],
  ["Comedy clubs", "Open mics gratuits, cours payants", "Gratuit à 300 €", "Scène disponible", "Rude pour débutants"]
 ],
 sig: ["Danses de couple latines en croissance", "Impro utilisée en entreprise et pour la confiance en soi"],
 opp: "Magie rapprochée et impro en atelier ou en arc, dans des bars à l'étage. Salsa en arc de trois séances avec soirée de fin.",
 dm: 3.5, dmT: "E", dmN: "FFDanse (3 M) et DEPS (théâtre 1 %)",
 dom: [
  ["scene.couple", "Danses de couple", {p: "25-45 ans, célibataires et couples", c: "Écoles de danse, soirées SBK, associations", o: "Danseurs avancés, animateurs de soirées", l: "Bars avec piste, studios de danse", r: "Déséquilibre guideurs et suiveurs"}],
  ["scene.urbain", "Danses urbaines & solo", {p: "18-35 ans", c: "Écoles de danse, YouTube, TikTok", o: "Danseurs hip-hop et afro", l: "Studios, MJC", r: "Espace et sol adaptés"}],
  ["scene.theatre", "Théâtre & impro", {p: "25-45 ans, actifs en quête de confiance", c: "Ligues d'impro, cours de théâtre annuels", o: "Improvisateurs et comédiens amateurs", l: "Salles à l'étage de bars, théâtres associatifs", r: "Faible"}],
  ["scene.magie", "Magie & cirque", {p: "20-45 ans, parents, curieux", c: "Amicales FFAP et FFM, boutiques de magie, YouTube", o: "Magiciens amateurs des amicales", l: "Bars, boutiques de magie", r: "Faible"}],
  ["scene.humour", "Humour & clown", {p: "22-40 ans", c: "Comedy clubs, cours de stand-up", o: "Humoristes amateurs", l: "Comedy clubs, bars", r: "Trac, public parfois rude"}]
 ]
},
{
 id: "parole", n: "Parole, langues & écriture", g: "❝",
 diag: "Zéro matériel, utilité perçue forte et vague de l'éloquence portée par les concours et le grand oral. La prise de parole se monétise (entreprises), les langues ont un vivier d'offreurs natifs mais une concurrence gratuite (cafés polyglottes).",
 ch: [
  ["S", "Cours d'éloquence · 29 €/h en moyenne sur Superprof", ["speloq"]],
  ["S", "Demande croissante des étudiants, portée par le pitch et les concours", ["letudiant"]],
  ["S", "Programme public « Prenez la parole ! » · 40 heures de formation pour une centaine de jeunes", ["prenez"]],
  ["S", "Ateliers municipaux de prise de parole à Paris, ouverts dès 16 ans", ["pariseloq"]],
  ["S", "Ateliers d'écriture · de 60 € l'atelier à 2 600 € le cycle", ["edithetnous"]],
  ["S", "Écriture · pratique amateur qui se maintient dans le temps", ["inseefps"]],
  ["E", "Public potentiel ≈ 3 M. Raisonnement · actifs et étudiants qui veulent progresser à l'oral ou en langue, hors formation professionnelle.", []]
 ],
 b: [
  ["Superprof", "Cours individuels", "≈ 29 €/h (éloquence)", "Vivier", "Individuel"],
  ["Toastmasters", "Clubs associatifs, cotisation", "Faible", "Méthode, régularité", "Codes anglo-saxons, formel"],
  ["Eloquentia", "Ateliers et concours, jeunes", "Gratuit ou subventionné", "Image, impact social", "Cible scolaire"],
  ["Coachs et formations entreprise", "Prestations B2B", "Plusieurs centaines à milliers d'euros", "Budget formation", "Hors de portée des particuliers"],
  ["Cafés polyglottes et Tandem", "Gratuit", "Gratuit", "Volume", "Pas de progression structurée"],
  ["Ateliers d'écriture (Les Mots, Gallimard)", "Cycles payants", "195 à 2 600 €", "Qualité éditoriale", "Cher"]
 ],
 sig: ["Concours d'éloquence dans les écoles et les villes", "Grand oral du bac", "Offre municipale gratuite à Paris"],
 opp: "Prise de parole en arc de trois séances, storytelling oral et pitch. Débouché entreprise pour les séances d'équipe.",
 dm: 3, dmT: "E", dmN: "Estimation",
 dom: [
  ["parole.eloquence", "Éloquence & prise de parole", {p: "Actifs 25-45 ans, étudiants", c: "Superprof, Toastmasters, coachs, Eloquentia", o: "Comédiens, avocats, formateurs, enseignants", l: "Salles à l'étage de bars, librairies, coworkings", r: "Faible"}],
  ["parole.langues", "Langues", {p: "Adultes qui veulent débloquer l'oral", c: "Cafés polyglottes, Tandem, Superprof, applis", o: "Natifs, très nombreux à Paris", l: "Bars, cafés", r: "Concurrence gratuite"}],
  ["parole.ecriture", "Écriture", {p: "30-60 ans", c: "Ateliers payants, ateliers municipaux", o: "Auteurs, animateurs d'ateliers", l: "Librairies, cafés, bibliothèques", r: "Faible"}],
  ["parole.relation", "Communication & relation", {p: "Actifs, parents", c: "Formateurs CNV, coachs", o: "Formateurs certifiés, coachs", l: "Salles associatives, coworkings", r: "Promesses de développement personnel à cadrer"}]
 ]
},
{
 id: "jeux", n: "Jeux & stratégie", g: "♞",
 diag: "Les échecs vivent une hausse record de licences et les jeux de société sont un marché de plus d'un milliard d'euros. Les lieux existent (bars à jeux, cafés) et les cercles sont naturels. La propension à payer pour apprendre reste faible.",
 ch: [
  ["S", "FFE · environ 76 100 licences en 2024, 86 049 au 10 avril 2026", ["inseelic", "statsechecs"]],
  ["S", "Jeux de société · ≈ 1,1 Md€ en 2025 (Circana, puzzles probablement inclus), France premier marché européen", ["republikjeux"]],
  ["S", "Bars à jeux parisiens installés de longue date (Oya Café depuis 1995, plus de 1 600 jeux)", ["sortirjeux", "parisjeux"]],
  ["E", "Public potentiel ≈ 8 M. Raisonnement · joueurs réguliers adultes de jeux de société, d'échecs ou de rôle.", ["republikjeux"]]
 ],
 b: [
  ["Lichess · Chess.com", "Gratuit ou abonnement", "0 à 10 €/mois", "Apprentissage illimité", "En ligne, solitaire"],
  ["Clubs FFE", "Licence annuelle", "≈ 50 à 150 €/an (hypothèse)", "Compétition, encadrement", "Compétitif, intimidant"],
  ["Bars à jeux (Oya, Meisia, The Good Game)", "Entrée ou consommation", "≈ 5 à 8 € l'entrée (hypothèse)", "Ludothèque, animateurs", "Pas de progression"],
  ["Associations de jeu de rôle", "Adhésion", "Faible", "Maîtres du jeu", "Peu visibles"]
 ],
 sig: ["Licences d'échecs en forte hausse", "Jeux de société adultes revenus à la mode"],
 opp: "Échecs en cercle hebdomadaire dans un café, initiation au jeu de rôle en arc. Monétisation faible · le jeu sert surtout la rétention (deuxième usage mensuel).",
 dm: 8, dmT: "E", dmN: "Estimation à partir du marché des jeux de société",
 dom: [
  ["jeux.echecs", "Échecs & jeux abstraits", {p: "20-40 ans, enfants", c: "Clubs FFE, Lichess, Chess.com", o: "Joueurs classés", l: "Cafés, bars", r: "Concurrence gratuite en ligne"}],
  ["jeux.societe", "Jeux de société", {p: "25-40 ans, groupes d'amis", c: "Bars à jeux, ludothèques", o: "Passionnés, animateurs ludiques", l: "Bars à jeux, cafés", r: "Faible monétisation"}],
  ["jeux.role", "Jeux de rôle & narratifs", {p: "20-40 ans", c: "Associations, bars à jeux, Roll20", o: "Maîtres du jeu", l: "Bars à jeux, salles associatives", r: "Durée des parties (3 h et plus)"}],
  ["jeux.cartes", "Cartes & énigmes", {p: "Adultes", c: "Clubs de bridge et tarot, escape games", o: "Joueurs confirmés", l: "Cafés, clubs", r: "Jeux d'argent (poker)"}]
 ]
},
{
 id: "tech", n: "Numérique, tech & IA", g: "⌘",
 diag: "L'IA générative est utilisée par 48 % des Français, mais seuls 11 % des utilisateurs se jugent très compétents. La demande utilitaire est massive et récente. Limites · moins de chaleur, concurrence des tutoriels et des cafés IA gratuits.",
 ch: [
  ["S", "IA générative · 48 % de la population en 2025, +15 points en un an, 85 % des 18-24 ans", ["arcep", "medialeader"]],
  ["S", "Parmi les utilisateurs · 11 % se jugent très compétents, 27 % pas du tout", ["arcep"]],
  ["S", "Cafés IA (CNNum) · démarche gratuite qui a touché 50 000 citoyens en 2025", ["cafeia"]],
  ["S", "Ateliers gratuits de découverte de l'IA dans les médiathèques et à la Ville de Paris", ["parisia"]],
  ["E", "Public potentiel ≈ 7 M. Calcul · 27 % d'utilisateurs qui ne se jugent pas compétents × 48 % × environ 54 M de 15 ans et plus.", ["arcep"]]
 ],
 b: [
  ["Cafés IA (CNNum) et médiathèques", "Gratuit, public", "Gratuit", "Légitimité, maillage", "Découverte, peu de pratique créative"],
  ["Formations CPF", "Formation pro financée", "Plusieurs centaines d'euros", "Financement", "Hors loisir, format long"],
  ["YouTube et newsletters", "Gratuit", "Gratuit", "Actualité", "Bruit, pas d'accompagnement"],
  ["Domestika · Skillshare", "Cours vidéo", "10 à 30 €", "Créatif", "Obsolescence rapide"],
  ["Fab labs", "Adhésion, ateliers", "Faible", "Machines", "Public technophile"]
 ],
 sig: ["Adoption très rapide de l'IA générative", "Besoin d'esprit critique et de vérification", "Créatifs qui veulent intégrer l'IA (musique, image)"],
 opp: "L'IA appliquée à une passion (musique, image, site perso) et l'IA pour s'organiser au quotidien, en atelier d'1 h avec un résultat concret.",
 dm: 7, dmT: "E", dmN: "Utilisateurs d'IA qui ne se jugent pas compétents (Arcep)",
 dom: [
  ["tech.ia", "IA au quotidien", {p: "Actifs 30-60 ans, parents, seniors", c: "Cafés IA, médiathèques, formations CPF, YouTube", o: "Profils tech, enseignants", l: "Cafés, coworkings, médiathèques", r: "Concurrence gratuite, obsolescence rapide"}],
  ["tech.creer", "Créer avec l'IA", {p: "Créatifs 20-45 ans, indépendants", c: "Domestika, YouTube, formations pros", o: "Designers, vidéastes, développeurs", l: "Coworkings, tiers-lieux, studios", r: "Droits d'auteur, abonnements payants aux outils"}],
  ["tech.code", "Code & no-code", {p: "Curieux, indépendants", c: "OpenClassrooms, bootcamps, YouTube", o: "Développeurs", l: "Coworkings, fab labs", r: "Niveaux hétérogènes"}],
  ["tech.hygiene", "Hygiène numérique", {p: "Seniors, parents, tous publics", c: "Conseillers numériques, associations", o: "Profils tech", l: "Médiathèques, cafés", r: "Faible"}],
  ["tech.maker", "Électronique & fabrication", {p: "Makers, parents-enfants", c: "Fab labs, associations", o: "Makers", l: "Fab labs", r: "Matériel, soudure"}]
 ]
},
{
 id: "bienetre", n: "Bien-être, corps & esprit", g: "◯",
 diag: "Forte demande, mais deux verrous. Le yoga et le pilates relèvent de l'enseignement sportif réglementé. Les pratiques de soin touchent aux monopoles de santé (kinésithérapie) et au risque de dérive. Le format cercle convient à la méditation et à l'écriture introspective.",
 ch: [
  ["S", "Yoga et pilates · enseignement contre rémunération soumis à qualification selon l'analyse juridique citée", ["simonnet"]],
  ["E", "Pratiquants de yoga · chiffres publics divergents (2,5 à 12 M selon les sources commerciales), aucune source officielle trouvée. Hypothèse retenue · 3 à 5 M de pratiquants réguliers.", []],
  ["E", "Public potentiel ≈ 6 M. Raisonnement · pratiquants de yoga, méditation et pratiques douces.", []]
 ],
 b: [
  ["Petit Bambou · Headspace", "Abonnement appli", "≈ 60 €/an (hypothèse)", "Accessible", "Solitaire"],
  ["Studios de yoga", "Cours à l'unité, abonnements", "≈ 20 à 30 € le cours (hypothèse)", "Diplômés, lieux", "Prix, réglementation"],
  ["ClassPass · Urban Sports Club", "Crédits", "Variable", "Choix", "Pros uniquement"],
  ["Centres MBSR", "Programmes de 8 semaines", "≈ 300 à 500 € (hypothèse)", "Méthode validée", "Engagement long"]
 ],
 sig: ["Santé mentale et sommeil", "Applications de méditation installées"],
 opp: "Plus tard, sauf écriture introspective et méditation en cercle sans promesse thérapeutique. Le yoga n'entre qu'avec des hôtes diplômés.",
 dm: 6, dmT: "H", dmN: "Hypothèse, aucune source officielle",
 dom: [
  ["bienetre.corps", "Pratiques corporelles douces", {p: "25-55 ans, majoritairement des femmes", c: "Studios, ClassPass, applis", o: "Enseignants diplômés", l: "Studios, salles associatives", r: "Enseignement réglementé"}],
  ["bienetre.esprit", "Esprit & méditation", {p: "Actifs stressés 25-55 ans", c: "Applis, centres MBSR, associations", o: "Instructeurs formés", l: "Salles calmes, librairies", r: "Promesses thérapeutiques, dérives"}],
  ["bienetre.soins", "Soins & toucher", {p: "Couples, parents", c: "Instituts, kinésithérapeutes", o: "Praticiens", l: "Cabinets", r: "Monopole de santé, contact physique"}],
  ["bienetre.hygiene", "Sommeil & alimentation", {p: "Adultes", c: "Diététiciens, applis", o: "Professionnels de santé", l: "Salles associatives", r: "Titres protégés (diététicien)"}]
 ]
},
{
 id: "style", n: "Style, beauté & mode", g: "◇",
 diag: "La couture rajeunit et l'upcycling profite de la seconde main. Les ateliers d'accès aux machines existent déjà à bas prix. La coiffure et l'esthétique sur autrui exigent une qualification.",
 ch: [
  ["S", "Couture · clientèle rajeunie, de plus en plus d'adolescentes (Singer France)", ["reporterrecouture"]],
  ["S", "Accès libre aux machines à coudre à Paris dès 5 € de l'heure dans certains lieux", ["pariscouture"]],
  ["S", "Coiffure à domicile · qualification requise (CAP au minimum)", ["inpicoiff"]],
  ["E", "Public potentiel ≈ 4 M. Raisonnement · couture, retouche, maquillage et conseil en style chez les adultes.", []]
 ],
 b: [
  ["Ateliers couture associatifs (La Cadette)", "Accès machines, cours", "≈ 5 €/h l'accès", "Prix, machines", "Peu de pédagogie"],
  ["Merceries et Mondial Tissus", "Cours en magasin", "Variable", "Fournitures", "Commercial"],
  ["Wecandoo", "Ateliers couture et tissage", "30 à 100 €", "Cadeau", "Ponctuel"],
  ["Conseillères en image", "Prestation individuelle", "≈ 100 à 300 € (hypothèse)", "Personnalisé", "Cher"]
 ],
 sig: ["Seconde main et réparation", "Rajeunissement de la couture"],
 opp: "Retouche et raccommodage visible en atelier d'1 h, couture machine en arc. Synergie forte avec le secteur artisanat (même public, mêmes lieux).",
 dm: 4, dmT: "E", dmN: "Estimation",
 dom: [
  ["style.couture", "Couture & retouche", {p: "20-45 ans, majoritairement des femmes", c: "Ateliers couture, merceries, Wecandoo", o: "Couturières amateurs, retoucheuses", l: "Ateliers couture, tiers-lieux, ressourceries", r: "Machines à fournir"}],
  ["style.upcycling", "Upcycling & seconde main", {p: "18-35 ans", c: "Ressourceries, Instagram", o: "Créateurs upcycling, chineurs", l: "Ressourceries, friperies", r: "Faible"}],
  ["style.beaute", "Beauté & soin de soi", {p: "Adultes", c: "Instituts, YouTube, enseignes", o: "Maquilleuses, coiffeurs", l: "Boutiques, salons partenaires", r: "Qualification pour toute prestation sur autrui"}],
  ["style.image", "Style & image", {p: "25-50 ans", c: "Conseillères en image, Instagram", o: "Stylistes, conseillères", l: "Friperies, boutiques", r: "Faible"}]
 ]
},
{
 id: "savoirs", n: "Culture, sciences & savoirs", g: "◎",
 diag: "Aucun matériel et un format salon naturel, mais un résultat moins tangible. Utile pour fabriquer le deuxième usage mensuel (salons, quiz, fresques) plus que comme produit d'appel.",
 ch: [
  ["S", "Fresque du Climat · près de 2 millions de participants et 87 000 bénévoles revendiqués", ["fresque"]],
  ["S", "Pratiques scientifiques amateurs incluses dans les 23,4 M d'amateurs de 2018", ["inseefps"]],
  ["E", "Public potentiel ≈ 4 M. Raisonnement · visiteurs de musées, lecteurs et curieux de sciences qui cherchent un format social.", []]
 ],
 b: [
  ["Conférenciers et guides", "Visites payantes", "≈ 15 à 30 € (hypothèse)", "Expertise", "Carte de guide-conférencier exigée dans certains sites"],
  ["Universités populaires et du temps libre", "Cotisation annuelle", "Faible", "Programmes riches", "Public senior"],
  ["Pub quiz", "Gratuit, consommation", "Gratuit", "Rituel hebdo", "Pas d'apprentissage"],
  ["Fresques (Climat, Numérique)", "Bénévolat, B2B payant", "Gratuit à B2B", "Réseau d'animateurs", "Thèmes militants"]
 ],
 sig: ["Formats salons et cafés philo", "Fresques en entreprise"],
 opp: "Salons à 6-10 personnes pour les cercles (philo, astronomie, histoire du quartier). Pas un produit de lancement.",
 dm: 4, dmT: "E", dmN: "Estimation",
 dom: [
  ["savoirs.art", "Art & patrimoine", {p: "30-65 ans", c: "Conférenciers, Paris Musées", o: "Historiens de l'art, passionnés", l: "Musées, rues", r: "Carte de guide-conférencier dans certains monuments"}],
  ["savoirs.sciences", "Sciences & ciel", {p: "Curieux, familles", c: "Clubs d'astronomie, musées de sciences", o: "Astronomes amateurs, scientifiques", l: "Parcs, toits, médiathèques", r: "Météo, pollution lumineuse"}],
  ["savoirs.idees", "Histoire & idées", {p: "Adultes curieux", c: "Cafés philo, clubs de lecture, conférences", o: "Enseignants, passionnés", l: "Cafés, librairies", r: "Résultat peu tangible"}],
  ["savoirs.ludique", "Culture ludique & fresques", {p: "25-45 ans", c: "Pub quiz, fresques bénévoles", o: "Animateurs de fresques, quizmasters", l: "Bars, entreprises", r: "Faible monétisation"}]
 ]
},
{
 id: "pratique", n: "Vie pratique & débrouille", g: "▣",
 diag: "Demande réelle (budget, démarches, anti-gaspi) mais peu de plaisir et peu de résultat montrable. Le conseil financier personnalisé est réglementé. Ce secteur sert l'utilité perçue du bilan plus que les séances.",
 ch: [
  ["S", "Premiers secours · formations PSC1 délivrées par des organismes agréés (réglementation, hors source chiffrée)", []],
  ["E", "Public potentiel ≈ 5 M. Raisonnement · jeunes actifs et primo-locataires qui cherchent des bases de budget, démarches et organisation.", []]
 ],
 b: [
  ["Associations de consommateurs", "Ateliers budget", "Gratuit", "Neutralité", "Peu visibles"],
  ["Influenceurs finance", "Contenus gratuits, formations", "0 à 500 €", "Audience jeune", "Qualité variable, conflits d'intérêts"],
  ["Croix-Rouge · Protection civile", "PSC1 agréé", "≈ 60 € (hypothèse)", "Certification", "Agrément obligatoire"]
 ],
 sig: ["Pouvoir d'achat et anti-gaspi", "Éducation financière des jeunes"],
 opp: "Plus tard. Ateliers anti-gaspi et budget dans les cercles, sans conseil personnalisé en investissement.",
 dm: 5, dmT: "E", dmN: "Estimation",
 dom: [
  ["pratique.argent", "Argent & administratif", {p: "18-35 ans, primo-actifs", c: "Associations, influenceurs, banques", o: "Comptables, juristes, passionnés de finance", l: "Coworkings, médiathèques", r: "Conseil en investissement réglementé"}],
  ["pratique.quotidien", "Logement & quotidien", {p: "Jeunes actifs, familles", c: "Instagram, YouTube", o: "Organisateurs, cuisiniers", l: "Cafés, cuisines partagées", r: "Faible"}],
  ["pratique.mobilite", "Mobilité & voyage", {p: "Jeunes adultes", c: "Auto-écoles, blogs voyage", o: "Voyageurs, mécaniciens", l: "Cafés, garages solidaires", r: "Conduite réglementée"}],
  ["pratique.famille", "Famille & secours", {p: "Jeunes parents", c: "Organismes agréés, maternités", o: "Formateurs agréés, monitrices de portage", l: "Salles associatives", r: "Agrément pour les premiers secours"}]
 ]
},
{
 id: "social", n: "Lien social, animation & engagement", g: "⊕",
 diag: "Le secteur de la boucle centrale du projet · apprendre à animer fabrique les futurs hôtes. Le bénévolat associatif touche 24 % des Français. Timeleft prouve que le lien entre inconnus se paie.",
 ch: [
  ["S", "Bénévolat associatif · 24 % des Français en 2024, environ 12,5 M de bénévoles", ["benevole"]],
  ["S", "Timeleft · plus de 3 millions d'utilisateurs revendiqués, 1 M€ de revenus mensuels atteints en 10 mois, abonnement dès 17,99 €", ["timeleftapp", "timeleftrev", "oniva"]],
  ["S", "Tiers-lieux · 3 500 en 2023, 4 050 recensés en 2026", ["ftl23", "ftl26"]],
  ["E", "Public potentiel ≈ 2 M. Raisonnement · personnes prêtes à animer ou organiser, sous-ensemble des bénévoles et des membres actifs d'associations.", ["benevole"]]
 ],
 b: [
  ["Timeleft", "Dîners entre inconnus, abonnement", "dès 17,99 €/mois", "Rituel, échelle", "Aucun savoir-faire transmis"],
  ["Meetup", "Organisateurs payants, membres gratuits", "Abonnement organisateur", "Volume", "Qualité inégale"],
  ["Réseaux d'échanges de savoirs, SACO, Onsaitfaire", "Troc gratuit", "Gratuit", "Principe compris", "Restent petits"],
  ["France Bénévolat · JeVeuxAider", "Plateformes de bénévolat", "Gratuit", "Missions", "Pas de format compétence"]
 ],
 sig: ["Solitude urbaine et rituels de rencontre", "Tiers-lieux en croissance"],
 opp: "« Animer sa première séance » est la niche interne qui transforme les apprenants en hôtes. Les dîners partagés servent de rituel de cercle.",
 dm: 2, dmT: "E", dmN: "Sous-ensemble des bénévoles (Recherches & Solidarités)",
 dom: [
  ["social.animer", "Animer & fédérer", {p: "Futurs hôtes, membres actifs d'associations", c: "Formations à l'animation, facilitateurs", o: "Animateurs, enseignants", l: "Tiers-lieux, coworkings", r: "Faible"}],
  ["social.engagement", "Engagement & citoyenneté", {p: "Bénévoles, porteurs de projets", c: "France Bénévolat, maisons des associations", o: "Responsables associatifs", l: "Maisons des associations", r: "Faible"}],
  ["social.rencontres", "Rencontres & convivialité", {p: "25-40 ans urbains, nouveaux arrivants", c: "Timeleft, Meetup, supper clubs", o: "Hôtes cuisiniers, animateurs", l: "Cafés, restaurants, appartements", r: "Hygiène si repas payant, sécurité des rencontres"}]
 ]
}
];
