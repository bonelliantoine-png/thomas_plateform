# Cordes · prototype V1 du bilan de compétences de vie

Un bilan de tout ce qu’on sait faire et veut faire en dehors du travail (cuisine, musique, sport, éloquence, bricolage…), qui dit où, avec qui et comment apprendre ou transmettre. Deux parcours (« J’apprends », « Je transmets ») et un mode mixte avec trocs. Nom de travail : Cordes.

## Lancer

- Ouvrir `app/index.html` dans un navigateur récent (Chrome, Edge, Firefox, Safari). Aucun serveur, aucune installation, aucune étape de build : scripts classiques, compatibles `file://`.
- Sans réseau, tout fonctionne sauf les polices Google (repli système), « Autour de moi » (OpenStreetMap, avec message et recherches préparées en repli) et le copilote IA.
- Pages SEO : `seo/index.html` (générées, voir plus bas).
- Démo en un clic : page d’accueil ou `#/demo` (Inès, demandeuse ; Malik, DJ-producteur ; Claire, cuisine et éloquence). Inès et Claire illustrent un troc valide selon la règle d’animation (voir plus bas).

### Tests

```
node app/dev/test-engine.js          # moteur sous Node, vraies données : 485 vérifications
node app/dev/e2e.js [dossier]        # Playwright (Chromium) en file:// à 375 et 1440 px : 108 vérifications, 0 erreur console tolérée
node app/dev/build-seo.js [dossier]  # régénère seo/ (61 pages)
```

`e2e.js` simule Nominatim et Overpass, contrôle les débordements horizontaux à 375 px et échoue à la moindre erreur ou alerte console.

## Échelle de maîtrise et règle d’animation

Toute l’app utilise une échelle de 0 à 5 (`C.LEVELS` dans `js/engine/core.js`) :

| n | Libellé | Peut animer |
|---|---|---|
| 0 | Jamais pratiqué | non |
| 1 | Je découvre | non |
| 2 | Bases acquises | ateliers de niveau 1 (découverte) |
| 3 | Je consolide | ateliers de niveau 2 |
| 4 | Je maîtrise | ateliers de niveau 3 |
| 5 | Référent | ateliers de niveau 4 et formation des hôtes |

- Un atelier de niveau k amène du niveau k-1 au niveau k. Règle stricte : une personne de niveau n anime les ateliers de niveau n-1. Constante `C.TEACH_RULE = 'strict'` (par défaut) ou `'below'` (tout niveau inférieur), non exposée à l’utilisateur. Fonctions : `C.canAnimate(n, k)`, `C.topPalier(n)`, `C.animatedPaliers(n)`, `C.paliersOnPath(n, cur, cible)`, `C.hostLevel(k)`, `C.animateText(n)`. Le palier 5 (vers « référent ») n’a pas d’atelier au-dessus : il passe par la formation des hôtes, menée par un référent.
- Jalons (`C.milestone(s, k)`) : niveau 1 = jalon générique formulé à partir du nom (« Première séance de poterie faite, gestes de base connus ») ; niveaux 2 à 5 = `levels[0..3]` de la taxonomie (données inchangées).
- Inventaire : un appui monte d’un cran (le sixième remet à zéro), touches 0 à 5 au clavier sur une compétence ; légende des 5 niveaux et aide d’une ligne sur la règle.
- Envies : niveau visé de 2 à 5, plan découpé en paliers (`plan.steps` : atelier, heures, coût, niveau de l’hôte requis), affiché comme « Qui peut vous faire progresser ».
- Offreur : chaque offre cible le palier n-1 (« Vous êtes niveau 4 : vous pouvez animer les ateliers de niveau 3 (Je consolide) ») ; le prix conseillé dépend du palier animé (`C.PALIER_PRICE`) ; échelle de progression par compétence (`C.hostLadder`) et étape « Monter d’un niveau » dans la feuille de route.
- Passerelle demandeur → offreur, liste d’attente : compétences au niveau 2 ou plus. Troc et groupe : B fait progresser A sur x si B peut animer un palier du chemin de A (niveau actuel + 1 → niveau visé), donc niveau(B) = niveau visé + 1 pour le dernier palier ; les compétences connues au mauvais niveau sont signalées avec le niveau d’hôte requis.
- Migration (schéma 2, `version: 2`) : les bilans `cordes.v1`, la sauvegarde, l’historique et les liens `#b=` de l’ancienne échelle 0-4 sont convertis à la lecture : 1→1, 2→2, 3→4, 4→4 avec `teach: true` ; niveaux visés bornés à 2 au moins. La conversion est enregistrée au démarrage et n’est jamais appliquée deux fois. Les nouveaux liens portent `v: 2`.

## Architecture

```
app/
  index.html               coquille : barre d’app, vue, pied, panneau latéral, toast ; ordre de chargement des scripts
  css/app.css              design system Chrome néon (tokens d’Antoine, un accent cyan, statuts colorés), mobile d’abord, impression
  js/data/                 taxonomie (17 univers, 432 compétences) et ressources (plateformes, statuts, prix…) : figées, ne pas modifier
  js/engine/               moteur pur, sans DOM (sauf téléchargement), testé sous Node
    core.js                espace de noms window.Cordes, utilitaires, normalisation défensive des données (anomalies relevées, jamais d’exception)
    similarity.js          similarité entre compétences et graphe des 12 voisins
    inspiration.js         paquet de cartes, apprentissage des verdicts
    archetype.js           archétype d’apprenant, profil entrepreneurial
    plan.js                plan d’apprentissage, où apprendre, recherches préparées, défi 30 jours, CV, liste d’envies
    pricing.js channels.js status.js niche.js offers.js   plan de valorisation de l’offreur
    troc.js share.js       troc entre deux bilans ; état localStorage « cordes.v1 » et lien #b=
    osm.js ai.js demo.js export.js   OpenStreetMap, copilote Claude, profils de démo, JSON/.ics/passeport
    growth.js              lot 2 : liste d’attente, mesure, questionnaire, historique, groupe, quartier, lieu, données
  js/ui/                   écrans (une route = { render, mount, title }), actions déléguées data-act, champs data-bind
    app.js                 routeur par hash, rendu (protégé contre la réentrance), enregistrement différé et forcé à la fermeture
    screens-*.js card.js   parcours, résultats, offre, accueil, outils, croissance ; carte image Canvas
  dev/                     tests et générateur SEO
```

Stockage local (tout sous le préfixe `cordes.`) : `cordes.v1` (bilan), `.waitlist`, `.history`, `.survey`, `.priceArm`, `.metrics` (et `.metrics.demo`, `.metrics.off`), `.venue`, `.geo`, `.apikey`. La page `#/donnees` les liste, les exporte et les efface.

## Écrans

| Route | Écran |
|---|---|
| `#/accueil` | choix du parcours, démos, catalogue, outils, ouverture du quartier |
| `#/bilan/contexte … profil` | parcours : vous, ce que je sais, envies (paquet ← → ↓), affiner, style, forces, offre, profil pro |
| `#/resultats` | radar, constellation, archétype, forces transverses, un plan par envie (plan, où apprendre, autour de moi, recherches), 12 utilisations, copilote, questionnaire, quartier |
| `#/offre` | offres, niche, simulateur, canaux, statut et cadre, 90 jours, kit, collectif, questionnaire, quartier |
| `#/outils/autour`, `#/outils/recherches` | OpenStreetMap ; liens profonds préremplis |
| `#/comparer`, `#/groupe` | troc avec un ami ; comparaison de groupe (A7) |
| `#/progres` | historique et avant/après (A5) |
| `#/attente`, `#/attente/host`, `#/lieu` | liste d’attente localisée (A1, A8) ; parcours lieu partenaire (A10) |
| `#/donnees` | données sur l’appareil, export, suppression (A2) |
| `#/admin/metrics` | entonnoir, temps passé, questionnaire et test du prix (A3, A6) |
| `#/copilote`, `#/comment`, `#/demo`, `#b=…` | copilote IA ; transparence des algorithmes ; démos ; bilan partagé |

## Algorithmes (détail et poids en direct dans `#/comment`)

- **Similarité** : 0,36 × Jaccard des tags pondéré par la rareté (IDF) + 0,10 même univers + 0,08 même domaine + 0,18 lien `related` + 0,20 cosinus des attributs centrés + 0,08 Jaccard des soft skills. Graphe des 12 voisins précalculé.
- **Paquet d’inspiration** : affinité (3 meilleures similarités aux ancres), contexte (budget, temps, présentiel, intentions), tendance, exploration, passerelle entre univers, demande ; diversité par MMR (λ = 0,72, pénalité d’univers répété) ; chaque « oui » renforce tags et univers, chaque « non » les pénalise.
- **Archétype** : vecteur sur 6 axes issu de 8 questions, plus proche des 7 centroïdes ; confiance = écart au second.
- **Plan** : heures = hoursToBasics × (facteur cible − facteur actuel), facteurs 0 / 0,1 / 1 / 2,5 / 6 / 12 pour les niveaux 0 à 5 (hoursToBasics mène aux bases acquises) ; un palier par niveau à franchir, avec ses heures, son coût et l’hôte requis ; semaines selon le temps hebdomadaire réparti entre envies ; budget = matériel + séances selon le format préféré.
- **Prix conseillé** : position dans la fourchette `pricing[univers][format]` modulée par le palier animé (−0,16 / −0,05 / +0,05 / +0,13 pour les ateliers de niveau 1 à 4), années, preuves, expérience, × ville (Paris +15 %), × jauge, arrondi à 5 €.
- **Canaux, statut, niche, troc** : voir `#/comment`.
- **Lot 2** : troc appliqué à toutes les paires d’un groupe ; adéquation d’un lieu (équipements, type, demande, bonus d’équipement distinctif) et fréquentation = créneaux × 4,33 × min(capacité, 8) × 60 % ; entonnoir par visite et temps médian par écran ; NPS ; test de prix monadique (12, 15 ou 19 € tiré une fois par appareil, indice = prix × part de « oui ») ; avant/après entre instantanés (niveaux gagnés, envies atteintes au niveau visé, nouvelles envies).

## Fonctionnalités

**Socle (brief)** : deux parcours complets et le mode mixte ; 7 utilisations directes du bilan (passeport HTML autonome, agenda .ics, lien `#b=` compressé, comparaison et troc, liste d’envies à offrir, défi 30 jours, section CV) plus impression ; Autour de moi (Nominatim + Overpass, carte SVG zoomée, repli) ; recherches préparées ; copilote IA optionnel (clé locale, gabarits sans clé) ; Comment ça marche ; démo à 3 profils ; reprise du parcours, réinitialisation.

**Lot 2 (étude stratégique)**
- **A1 Liste d’attente** : rôle (apprendre, transmettre, lieu partenaire), ville et arrondissement parisien, envies et compétences ≥ 3 pré-remplies, case de consentement non cochée et finalité écrite, stockage local, export CSV. Envoi : constante `C.WAITLIST_ENDPOINT` dans `js/engine/growth.js` (vide par défaut ; si renseignée, POST JSON).
- **A2 Données** : `#/donnees` explique ce qui quitte l’appareil, liste le stockage, exporte tout en JSON (clé d’API masquée), efface tout en un geste après confirmation, permet de refuser la mesure.
- **A3 Mesure sans cookie** : événements anonymes (vues, départs, usages, questionnaire, inscription) stockés localement, identifiant de visite par onglet ; tableau de bord `#/admin/metrics` (entonnoir, temps par écran, événements, CSV) avec une source « démonstration » clairement marquée. Brancher Plausible ou Umami : renseigner `C.ANALYTICS` (provider, domaine, URL du script).
- **A4 Carte image** : Canvas 1080 × 1080 ou 1080 × 1920 (radar, archétype, 3 compétences, 3 envies), PNG téléchargeable, Web Share API si le navigateur partage des fichiers.
- **A5 Re-bilan** : instantané daté à chaque arrivée aux résultats (un par jour) ou à la demande, comparaison de deux dates, rappel .ics tous les 3 mois ; instantané « avant » fictif et signalé pour les démos.
- **A6 Questionnaire** : utilité 1 à 5, NPS, intérêt, test de prix, « qu’est-ce qui manque » ; résultats dans `#/admin/metrics`.
- **A7 Groupe** : 2 à 8 liens (avec ou sans son bilan), matrice des trocs, qui anime quoi, envies et compétences communes, activités et projets ; bande de démo (3 profils + 2 amis fictifs).
- **A8 Quartier** : « Le 11e ouvre à 50 inscrits : n/50 », inscriptions locales + valeur de démonstration fixe par zone, toujours libellée comme telle.
- **A9 SEO** : `app/dev/build-seo.js` génère `seo/` : index (avec l’échelle des 5 paliers et la règle) + 30 « Apprendre X à Paris » (5 paliers, heures cumulées, hôte requis) + 30 « Donner des cours de X à Paris » (rang = demande, tendance, facilité à transmettre, revenu ; 3 par univers au plus), jalons et heures, budget, où apprendre, prix observés, offre et trame, canaux, cadre, JSON-LD, liens vers l’app.
- **A10 Lieu partenaire** : créneaux creux (7 jours × 3 moments), capacité, équipements, type, formule (heure creuse contre consommation, avantage membre, partage de recette) ; compétences compatibles, estimation de fréquentation et de consommations, fiche partenaire copiable et téléchargeable, inscription avec rôle « lieu ».

## Correctifs de cette version

- Échelle 0 à 5 et règle d’animation (voir plus haut) ; démos et amis fictifs du groupe recalés sur la nouvelle échelle pour illustrer la règle (Inès, anglais 4, anime le palier 3 visé par Claire ; Claire, pain au levain 3, anime le palier 2 visé par Inès ; Claire, référente en éloquence, anime le palier 4 visé par Léa).
- Trame d’atelier : « point d’attention : patience » au lieu d’un article mal accordé.
- Page Comment ça marche : la colonne de texte ne déborde plus à 375 px.

- Panneau latéral resté marqué `open` alors que masqué, qui interceptait les clics : état du tiroir rendu cohérent (minuteur annulé à la réouverture) et `[hidden]{display:none!important}`.
- Enregistrement différé perdu si l’onglet se ferme dans les 250 ms : écriture forcée à `pagehide` et au passage en arrière-plan (seulement si une écriture est en attente).
- Rendu réentrant (un champ qui perd le focus pendant un changement d’écran) : rendu différé.
- Revue visuelle à 375 et 1440 px : constellation lisible sur mobile (libellés sans chevauchement), carte Autour de moi zoomée sur les lieux trouvés, barre de parcours alignée sur le contenu, cartes de démo alignées, compteurs sur deux lignes au mobile, en-têtes de section homogènes.

## Limites connues

- Données déclaratives et attributs éditoriaux ; prix et commissions relevés en 2026, à vérifier localement ; statut recommandé = orientation.
- La liste d’attente, la mesure et le questionnaire restent sur l’appareil tant que les constantes d’envoi sont vides : aucune agrégation entre utilisateurs.
- La valeur de démonstration du compteur de quartier est fictive ; le compteur réel suppose un service central.
- Le test de prix ne devient lisible qu’avec une trentaine de réponses par prix.
- OpenStreetMap est inégal selon les villes ; Nominatim limite à une requête par seconde.
- Les liens de partage contiennent prénom et ville ; les pages SEO sont générées pour Paris uniquement.
- Partage d’image : dépend de la Web Share API (mobile surtout) ; sinon téléchargement.

## Idées V2

- Service d’inscription et de mesure réels (Plausible, formulaire ou base légère), compteurs de quartier en direct.
- Bilan d’équipe anonymisé (A11), affiliation tracée vers les ateliers (A12), application installable hors ligne (A13).
- Pages SEO par arrondissement et pour d’autres villes, enrichies des lieux OpenStreetMap.
- Paquet d’inspiration nourri des verdicts agrégés de tous les utilisateurs (filtrage collaboratif).
- Mise en relation réelle des trocs et des groupes, réservation de créneaux chez les lieux partenaires.
