# Contrat de données · cartographie des niches v2

Décisions d'Antoine (13 nov. 2026) :
- **Aucun biais fondateur** : les compétences des fondateurs ne sont ni un critère, ni un argument, ni un exemple privilégié. Analyse agnostique.
- **≈ 1 000 niches**, rangées sur au moins 3 niveaux au-dessus de la niche : secteur > catégorie > sous-catégorie > niche.
- **5 niveaux de maîtrise** par niche, et la règle « le niveau n enseigne au niveau n-1 » (le niveau 1 n'enseigne pas ; un hôte de niveau 2 anime les ateliers de niveau 1 ; le niveau 5 anime le niveau 4 et forme les hôtes).
- La taxonomie de l'app (432 compétences, `app/js/data/taxonomy-*.js`) reste **séparée**, mais chaque niche pointe vers les compétences de l'app qui la recouvrent (`appSkills`).

## Échelle de maîtrise (commune à l'app et à l'étude)

| n | Libellé | Ce que sait faire la personne | Peut animer |
|---|---|---|---|
| 0 | Jamais pratiqué | rien | non |
| 1 | Je découvre | a fait une première séance, connaît les gestes de base | non |
| 2 | Bases acquises | fait seul un résultat simple et reproductible | ateliers de niveau 1 (découverte) |
| 3 | Je consolide | régulier, varie, corrige ses erreurs | ateliers de niveau 2 |
| 4 | Je maîtrise | résultat sûr, personnel, explique le pourquoi | ateliers de niveau 3 |
| 5 | Référent | niveau avancé reconnu, crée ses méthodes | ateliers de niveau 4 et formation des hôtes |

Un atelier « de niveau k » amène des participants du niveau k-1 au niveau k (le niveau 1 accueille des débutants complets).

## Secteurs (niveau 1, ids figés, identiques aux univers de l'app)

cuisine, musique, image, artisanat, maison, nature, sport, pleinair, scene, parole, jeux, tech, bienetre, style, savoirs, pratique, social.

## Fichiers de données

Un fichier JSON par secteur : `docs/_niches/data/<secteurId>.json`, UTF-8, JSON strict (pas de commentaires), forme :

```json
{
  "sector": "cuisine",
  "categories": [
    { "id": "cuisine.boissons", "name": "Boissons et bar", "desc": "Une phrase.",
      "subcategories": [
        { "id": "cuisine.boissons.cafe", "name": "Café", "desc": "Une phrase." }
      ] }
  ],
  "niches": [ { …niche… } ]
}
```

Volumes par secteur : 4 à 8 catégories, 2 à 5 sous-catégories par catégorie, **55 à 70 niches par secteur** (≈ 1 000 au total), 1 à 6 niches par sous-catégorie.

### Niche

```json
{
  "id": "latte-art",
  "name": "Latte art",
  "sector": "cuisine",
  "category": "cuisine.boissons",
  "subcategory": "cuisine.boissons.cafe",
  "desc": "Dessiner dans la mousse de lait : cœur, tulipe, rosette.",
  "audience": "25-40 ans urbains, amateurs de cafés de spécialité, cadeaux",
  "skills": ["Texturer le lait", "Verser un cœur", "Tulipe et rosette", "Régler un espresso"],
  "appSkills": ["latte-art", "cafe-filtre"],
  "levels": [
    { "n": 1, "title": "Premier cœur", "goal": "Texturer le lait et verser un cœur reconnaissable", "format": "atelier", "duration": "1 h", "group": "2-4", "price": [20, 35] },
    { "n": 2, "title": "Tulipe et rosette", "goal": "…", "format": "atelier", "duration": "1 h 30", "group": "2-4", "price": [30, 45] },
    { "n": 3, "title": "Régularité et contraste", "goal": "…", "format": "arc", "duration": "3 × 1 h 30", "group": "2-4", "price": [90, 140] },
    { "n": 4, "title": "Motifs complexes et etching", "goal": "…", "format": "stage", "duration": "1 journée", "group": "2-6", "price": [120, 220] },
    { "n": 5, "title": "Préparer une compétition, former des baristas", "goal": "…", "format": "coaching", "duration": "4 × 2 h", "group": "1-3", "price": [250, 500] }
  ],
  "scores": {
    "demand": 3, "trend": 4, "wtp": 4, "space": 3, "community": 2, "format": 5,
    "supply": 3, "hostIncome": 3, "regulatory": 5, "cost": 3, "local": 5, "online": 1
  },
  "venues": ["cafe", "coffee-shop"],
  "moments": ["semaine-soir", "weekend-matin"],
  "publics": ["jeunes-actifs", "couples", "entreprises"],
  "senses": ["gout", "vue", "geste"],
  "outputs": ["boisson", "photo"],
  "energy": "calme",
  "mixTags": ["cafe", "dessin", "convivial", "geste", "boisson"],
  "competitors": ["Funbooker", "coffee shops"],
  "regulated": null,
  "verdict": "prioritaire",
  "why": "Une à deux phrases factuelles qui justifient le verdict.",
  "confidence": "estimation"
}
```

Champs et listes fermées :
- `levels` : exactement 5 objets n = 1..5. `format` ∈ `atelier` (1 à 2 h, petit groupe), `arc` (3 séances), `cercle` (salon récurrent 6-10 pers.), `stage` (demi-journée ou journée), `chantier` (projet collectif 4-6 semaines), `coaching` (suivi individuel), `enligne`, `sortie` (en extérieur). `price` : fourchette indicative en € par personne pour le niveau, cohérente avec le marché français 2026 (ce sont des estimations).
- `scores` : entiers de 0 à 5. **Aucun critère fondateur.**
  - `demand` taille de la demande grand public · `trend` dynamique · `wtp` propension à payer · `space` espace concurrentiel (5 = peu d'offre de qualité) · `community` densité de clubs, groupes, communautés · `format` aptitude au format court en petit groupe (résultat en 1 h, montrable, on y revient) · `supply` vivier d'hôtes potentiels (beaucoup de gens de niveau ≥ 2) · `hostIncome` potentiel de revenu pour un hôte · `regulatory` 5 = aucun frein réglementaire · `cost` 5 = matériel et lieu peu coûteux · `local` aptitude au présentiel de quartier · `online` aptitude au distanciel.
- `venues` ∈ `cafe`, `coffee-shop`, `bar`, `cave`, `restaurant`, `cuisine-pro`, `studio-musique`, `studio-danse`, `salle-polyvalente`, `atelier-artisan`, `fablab`, `tiers-lieu`, `mediatheque`, `librairie`, `galerie`, `parc`, `jardin-partage`, `nature`, `domicile`, `boutique`, `salle-sport`, `ecole`, `entreprise`, `en-ligne`, `bateau`, `montagne`.
- `moments` ∈ `semaine-midi`, `semaine-soir`, `weekend-matin`, `weekend-apres-midi`, `weekend-soir`, `journee`, `vacances`.
- `publics` ∈ `etudiants`, `jeunes-actifs`, `couples`, `familles`, `enfants`, `ados`, `seniors`, `entreprises`, `touristes`, `expatries`, `parents`, `neurodivers`.
- `senses` ∈ `gout`, `odorat`, `ouie`, `vue`, `toucher`, `geste`, `mouvement`, `parole`, `reflexion`, `emotion`.
- `outputs` ∈ `plat`, `boisson`, `objet`, `photo`, `video`, `son`, `performance`, `texte`, `savoir`, `service`, `plante`, `vetement`, `jeu`, `carte`, `rencontre`.
- `energy` ∈ `calme`, `modere`, `intense`.
- `mixTags` : 3 à 7 mots-clés libres en kebab-case, réutilisés entre niches de secteurs différents (sert à proposer des mixes).
- `regulated` : `null` | `sport` | `alcool` | `alimentaire` | `enfants` | `sante` | `securite` | `animaux` | `droit`.
- `verdict` ∈ `prioritaire`, `a-tester`, `plus-tard`, `ecarter`.
- `confidence` ∈ `source`, `estimation`, `hypothese`.
- `appSkills` : ids existants de `app/js/data/taxonomy-a.js` ou `taxonomy-b.js` (vérifier), 0 à 4.
- Textes en français sobre : pas d'emoji, pas de tirets d'incise, `desc` ≤ 120 caractères, `goal` ≤ 110 caractères.
