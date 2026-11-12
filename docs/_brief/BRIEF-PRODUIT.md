# Brief produit · prototype V1 « Cordes » (nom de travail)

Commanditaire : Antoine. Contexte : `docs/_brief/contexte-dossier-v2.txt` (dossier de cadrage, plateforme d'échange de compétences par abonnement, Paris) et `docs/_brief/contexte-atlas.txt` (atlas de 97 mécanismes inspirés de l'open source). Rien n'y est acté.

## 1. L'idée en une phrase

Avant d'avoir une communauté, on offre un outil utile seul (principe G1 de l'Atlas : Ravelry, Letterboxd ont grandi comme carnets personnels) : **un bilan de compétences de vie**, qui ne parle pas de carrière mais de tout ce qu'on sait faire et veut faire (cuisine, sport, latte art, musique, magie, éloquence, bricolage…), puis qui dit **où, avec qui et comment** apprendre ou transmettre. Le bilan nourrit le futur graphe de compétences de la plateforme : chaque bilan est un futur membre, ses envies sont de la demande, ses compétences de l'offre.

## 2. Deux parcours, un tronc commun

### Demandeur · « J'apprends »
- Le volet « ce que je sais déjà » doit être **rapide** (2 à 3 min) : grille d'univers, puces de compétences, tap pour cycler le niveau (0 → 1 je connais un peu → 2 je me débrouille → 3 je maîtrise → 4 je pourrais l'enseigner). Recherche plein texte + ajout libre.
- Le volet « ce que je veux développer » est le **cœur** : un paquet de cartes d'inspiration (Ça me tente / Pas pour moi / Déjà fait, raccourcis clavier ← → ↓) choisies par l'algorithme (voisines de ce que je sais, diversité d'univers, compétences « passerelles », tendance), puis un affinage des 3 à 5 envies retenues : motivation, niveau visé, horizon, format préféré.
- Un mini-questionnaire de style (8 questions) donne un **profil d'apprenant** (archétype calculé, pas de pseudo-psychologie : formulé comme des préférences).
- **Résultat** : radar maîtrise × envie par univers, constellation des compétences, forces transverses (soft skills déduites), et pour chaque envie un **plan d'apprentissage** : premier pas cette semaine, jalons (1re heure, 1er mois, 3 mois) tirés des `levels`, heures estimées, budget, puis **où apprendre** : profs (plateformes), ateliers, communautés en ligne et locales, lieux autour de moi (OpenStreetMap), apps pour apprendre seul, projets collectifs à rejoindre, recherches préparées.
- Le bilan révèle aussi **ce que le demandeur pourrait partager** (niveau ≥ 3) : passerelle vers le parcours offreur. C'est la boucle apprenant → hôte du dossier v2.

### Offreur · « Je transmets »
- Inventaire plus profond sur ses 3 à 6 compétences fortes : niveau, années de pratique, preuves (diplômes, réalisations, portfolio), expérience de transmission, matériel ou lieu disponible, audience existante.
- « Que voulez-vous et pouvez-vous proposer ? » : objectifs (bénévolat, complément, activité principale, projets collectifs), formats (liste fermée), publics (enfants, adultes débutants, passionnés, entreprises, touristes, seniors), heures par semaine, revenu visé, rayon ou en ligne.
- Profil entrepreneurial (6 questions) : goût du risque, aisance commerciale, aisance face caméra, tolérance à l'administratif, solo ou collectif.
- **Résultat : un plan de valorisation complet**
  1. **Offres générées** (3 à 6) : titre, accroche, format, durée, jauge, prix conseillé (algorithme), trame minutée d'une séance, matériel.
  2. **Niche différenciante** : croisement de 2 compétences (ex. latte art × illustration) et matrice « j'aime / je maîtrise / ça se demande / ça se paie ».
  3. **Simulateur de revenus** interactif : heures, prix, taux de remplissage, mix de canaux (commissions), cotisations selon statut, net mensuel, point mort.
  4. **Canaux classés** : plateformes réelles notées pour ce profil (audience, commission, effort, maîtrise de la relation), dont « notre plateforme » (bientôt : liste d'attente « hôte fondateur »).
  5. **Statut recommandé** et cadre réglementaire (sport, alcool, hygiène, enfants…) avec parades.
  6. **Feuille de route 90 jours** cochable (persistée) : tester, prix, premiers clients, canaux, récurrence, collectif.
  7. **Kit de lancement** : bio, pitch, 10 idées de posts, message de prospection pour un lieu partenaire, mots-clés.
  8. **Collectif** : gabarits de projets à rejoindre ou lancer selon ses compétences, réseaux et fédérations, lieux.

### Les deux (mode « both »)
Le parcours enchaîne les deux et propose des **trocs** : ce que je sais contre ce que je veux.

## 3. Utilisations directes du bilan (à rendre concrètes dans l'app)

1. **Passeport** exportable : page HTML autonome interactive (un seul fichier, données embarquées), impression PDF propre, JSON.
2. **Plan dans l'agenda** : export `.ics` des premiers pas et jalons.
3. **Lien de partage** : bilan encodé dans l'URL (`#b=` base64 compressé), lisible par un ami sans compte.
4. **Comparer avec un ami / troc** : coller le lien d'un ami → compétences communes, « tu sais ce que je veux apprendre et inversement », idées d'activités à deux. C'est la mise en relation de la future plateforme, jouée entre proches avant la communauté.
5. **Liste d'envies à offrir** : liste partageable « offrez-moi un atelier de… » avec liens vers ateliers (anniversaires, Noël).
6. **Défi 30 jours** : un micro-défi par jour tiré de l'envie prioritaire.
7. **Section « centres d'intérêt et compétences transverses » pour CV** générée.

## 4. Outils à intégrer (éléments ajoutés à la proposition de valeur)

- **Autour de moi** : recherche réelle de lieux via OpenStreetMap (Nominatim pour géocoder la ville, Overpass API pour les lieux par univers, carte en SVG ou liste triée par distance). Appels navigateur directs, CORS OK, avec gestion d'erreur et repli.
- **Recherches préparées** : liens profonds vers Google, YouTube, Meetup, Eventbrite, Wecandoo, Superprof, Airbnb Expériences, Reddit, HelloAsso, Facebook groupes, avec requête composée (compétence + ville + intention).
- **Copilote IA optionnel** (clé API Claude de l'utilisateur, stockée en local, appel direct navigateur) : synthèse narrative du bilan, trame de séance, posts, réponses aux questions. Repli à base de gabarits toujours disponible : l'app doit être 100 % fonctionnelle sans clé.
- **Comment ça marche** : page qui explique les algorithmes (transparence, utile pour l'étude).
- **Démo** : 3 profils fictifs préremplis pour voir les résultats en un clic (une demandeuse curieuse ; un offreur DJ-producteur qui veut en vivre ; un profil mixte cuisine + éloquence).
- **Liste d'attente** de la future plateforme (locale dans le proto) avec rôle (apprendre, transmettre, lieu partenaire).

## 5. Algorithmes (à implémenter réellement, documentés)

- **Similarité entre compétences** : Jaccard sur `tags` + bonus même domaine / même univers + lien explicite `related` + proximité des `attrs` (distance cosinus). Graphe de voisinage précalculé au chargement.
- **Paquet d'inspiration** : score = affinité (similarité aux compétences aimées et aux envies acceptées) + préférences de contexte (budget, temps, présentiel, social) + tendance + exploration ; diversité par MMR (pénalité de redondance d'univers) ; apprentissage en ligne des verdicts (chaque « oui » renforce les voisins, chaque « non » pénalise tags et univers).
- **Archétype** : vecteur de préférences issu du questionnaire, plus proche centroïde parmi 6 à 8 archétypes.
- **Plan d'apprentissage** : heures = `hoursToBasics` × facteur niveau visé ; semaines = heures / temps dispo ; budget depuis `cost`.
- **Recommandation de canaux** : score par plateforme = adéquation format × univers × objectif (revenu, audience, effort accepté, maîtrise de la relation) × profil entrepreneurial.
- **Prix conseillé** : fourchette `pricing[univers][format]` modulée par niveau, années, preuves, ville (Paris +15 %), jauge.
- **Statut** : règles sur revenu visé annuel, collectif ou non, type d'activité (artistique, vente, prestation), services à la personne.
- **Niche** : score des paires de compétences maîtrisées = complémentarité (tags différents, univers différents) × demande × monétisation × rareté.
- **Troc** : appariement bilatéral entre deux bilans (A veut ce que B sait au niveau ≥ 3 et réciproquement).

## 6. Exigences de qualité

- Ouvrable directement en `file://` (scripts classiques), aucune étape de build, aucune dépendance externe obligatoire (polices Google en option).
- Design system **Chrome néon** d'Antoine (fichier de skill : `/root/.claude/skills/synced/ed058a8c-5b60-4d40-913f-9ef3de82f44d_598321b9-e9e3-4aa5-9e4c-7bff6580e333/chrome-neon/SKILL.md`), adapté à un produit grand public : même tokens, même rigueur, un seul accent cyan, statuts colorés, mais parcours chaleureux en Spectral pour les textes d'accompagnement.
- Mobile d'abord (le bilan se fait sur téléphone), clavier complet sur desktop.
- Persistance localStorage, reprise du parcours là où on l'a laissé, réinitialisation.
- Français, rédaction sobre (règles de la skill : pas d'emoji, pas de tirets d'incise, verbes à l'infinitif sur les boutons).
- Accessibilité : contrastes, focus visibles, aria sur les contrôles, `prefers-reduced-motion`.
