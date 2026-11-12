# Contrats de données partagés · prototype « Cordes » (nom de travail)

Source de vérité unique pour tous les agents. Ne pas dévier des noms de champs.
Tous les fichiers de données sont des scripts classiques (pas de modules ES : l'app doit s'ouvrir en `file://`).

## 1. Taxonomie des compétences

Fichiers : `app/js/data/taxonomy-a.js` (univers 1 à 9) et `app/js/data/taxonomy-b.js` (univers 10 à 17).
Chaque fichier commence par :

```js
window.CORDES_DATA = window.CORDES_DATA || { universes: [], domains: [], skills: [], softSkills: [] };
(function (D) {
  D.universes.push(/* ... */);
  D.domains.push(/* ... */);
  D.skills.push(/* ... */);
})(window.CORDES_DATA);
```

`softSkills` est rempli uniquement par `taxonomy-a.js` (liste fermée ci-dessous).

### Univers (17, ids figés)

| # | id | Nom | Fichier |
|---|---|---|---|
| 1 | `cuisine` | Cuisine & boissons | a |
| 2 | `musique` | Musique & son | a |
| 3 | `image` | Arts visuels & image | a |
| 4 | `artisanat` | Artisanat & fait-main | a |
| 5 | `maison` | Maison, bricolage & réparation | a |
| 6 | `nature` | Nature, jardin & animaux | a |
| 7 | `sport` | Sport & mouvement | a |
| 8 | `pleinair` | Plein air & aventure | a |
| 9 | `scene` | Danse, scène & spectacle (dont magie, cirque) | a |
| 10 | `parole` | Parole, langues & écriture (dont éloquence) | b |
| 11 | `jeux` | Jeux & stratégie | b |
| 12 | `tech` | Numérique, tech & IA | b |
| 13 | `bienetre` | Bien-être, corps & esprit | b |
| 14 | `style` | Style, beauté & mode | b |
| 15 | `savoirs` | Culture, sciences & savoirs | b |
| 16 | `pratique` | Vie pratique & débrouille | b |
| 17 | `social` | Lien social, animation & engagement | b |

```js
{ id: "cuisine", name: "Cuisine & boissons", short: "Cuisine", hue: 28, // teinte HSL 0-360 pour la data-viz
  desc: "Une phrase factuelle.", glyph: "◐" } // glyph : un caractère unicode simple (pas d'emoji)
```

### Domaine (4 à 7 par univers)

```js
{ id: "cuisine.cafe", universe: "cuisine", name: "Café & barista", desc: "Une phrase." }
```

### Compétence (22 à 28 par univers, viser large : du très courant au très niche)

```js
{
  id: "latte-art",                 // kebab-case, unique globalement
  name: "Latte art",
  universe: "cuisine",
  domain: "cuisine.cafe",
  aliases: ["dessin sur café", "barista"],     // pour la recherche
  desc: "Dessiner dans la mousse de lait : cœur, tulipe, rosette.",   // ≤ 110 caractères
  levels: [                         // 4 jalons concrets, observables, du niveau 1 au niveau 4
    "Réussir un cœur reconnaissable",
    "Tulipe et rosette régulières",
    "Motifs complexes et superposés",
    "Niveau compétition, capable de former"
  ],
  attrs: {
    social: 1,        // 0 solo … 3 intrinsèquement collectif
    physical: 1,      // 0 assis … 3 très physique
    creative: 2,      // 0 … 3
    intellectual: 1,  // 0 … 3 (technique, théorie, mémoire)
    cost: 2,          // budget matériel de départ : 0 nul, 1 < 50 €, 2 < 300 €, 3 > 300 €
    hoursToBasics: 10,   // heures de pratique pour « se débrouiller » (niveau 2), ordre de grandeur
    oneHourResult: true, // repart-on avec un résultat montrable après 1 h ?
    online: 1,        // 0 impossible à apprendre en ligne … 3 parfaitement
    demand: 2,        // 0 … 3 envie d'apprendre dans le grand public (France)
    monetization: 2,  // 0 … 3 potentiel de revenu pour quelqu'un qui maîtrise
    teachable: 3,     // 0 … 3 facilité à transmettre en petit groupe
    trend: 1          // -1 en déclin, 0 stable, 1 en croissance, 2 très en vogue
  },
  regulated: null,  // null | "sport" | "alcool" | "alimentaire" | "enfants" | "sante" | "securite" | "animaux" | "droit"
  tags: ["geste", "precision", "boisson", "convivial", "cafe"],  // 3 à 7, vocabulaire réutilisé entre compétences (sert à la similarité)
  soft: ["patience", "precision", "creativite"],                   // 2 à 4 ids de softSkills
  formats: ["atelier", "cours", "prestation", "contenu", "evenement"], // formats d'offre pertinents (liste fermée ci-dessous)
  related: ["torrefaction", "degustation-cafe", "illustration"]    // 2 à 5 ids de compétences voisines (peuvent être dans l'autre fichier)
}
```

Listes fermées :
- `formats` : `cours` (individuel), `atelier` (petit groupe), `stage` (intensif), `prestation` (service rendu : animer une soirée, réparer, cuisiner pour un événement), `produit` (vendre ses créations), `contenu` (vidéo, newsletter, cours en ligne, livre), `coaching` (accompagnement suivi), `evenement` (soirée, tournoi, concert, sortie), `entreprise` (team building, formation en entreprise), `communaute` (club, cercle payant).
- `softSkills` (ids) : `patience`, `precision`, `creativite`, `endurance`, `coordination`, `ecoute`, `expression`, `memoire`, `logique`, `rigueur`, `audace`, `empathie`, `leadership`, `organisation`, `observation`, `adaptation`, `pedagogie`, `curiosite`, `sens-esthetique`, `perseverance`, `cooperation`, `autonomie`.

```js
// softSkills (taxonomy-a.js uniquement)
{ id: "patience", name: "Patience", desc: "Une phrase." }
```

## 2. Ressources, plateformes, cadre

Fichier : `app/js/data/resources.js` → `window.CORDES_RESOURCES = { ... }`.

```js
window.CORDES_RESOURCES = {
  updated: "2026-11",

  // Plateformes et canaux réels (40 à 70). Côté apprendre ET côté transmettre/monétiser.
  platforms: [{
    id: "superprof", name: "Superprof", url: "https://www.superprof.fr",
    sides: ["learn", "offer"],          // learn = utile au demandeur, offer = utile à l'offreur
    kinds: ["cours"],                    // formats de la liste fermée concernés
    universes: ["*"],                    // "*" ou liste d'ids d'univers
    geo: "FR",                           // "FR" | "EU" | "monde"
    model: "Annonce gratuite, l'élève paie un pass mensuel",  // texte court
    fee: { type: "none" },               // { type: "commission", pct: 15 } | { type: "subscription", eurPerMonth: 29 } | { type: "fixed", eur: 1 } | { type: "none" } | { type: "mixed", pct: 5, eurPerMonth: 0, note: "..." }
    audience: "≈ 1 M d'élèves en France (déclaratif)",  // ordre de grandeur sourcé si possible, sinon ""
    bestFor: "Cours particuliers réguliers, toutes matières",
    pros: ["..."], cons: ["..."],
    effort: 1,                           // 0 … 3 effort de mise en route pour l'offreur
    reach: 3,                            // 0 … 3 audience accessible
    control: 1,                          // 0 … 3 maîtrise de la relation client (fuite, données, marque)
    verify: false                        // true si le chiffre ou la commission n'a pas pu être vérifié
  }],

  // Apps et ressources pour apprendre seul (30 à 60), rattachées à des univers ou domaines
  learningApps: [{ id: "lichess", name: "Lichess", url: "https://lichess.org", universes: ["jeux"], domains: ["jeux.echecs"], price: "Gratuit", desc: "..." }],

  // Types de communautés et lieux (25 à 40) : associations, MJC, clubs fédérés, fab labs, repair cafés, tiers-lieux, conservatoires,
  // jardins partagés, AMAP, ateliers d'artistes, bibliothèques, ressourceries, cafés associatifs, scènes ouvertes, etc.
  communityTypes: [{
    id: "fablab", name: "Fab lab / makerspace", desc: "...",
    universes: ["tech", "artisanat", "maison"],
    sides: ["learn", "offer"],
    howToFind: "Annuaire du Réseau français des fablabs, carte France Tiers-Lieux",
    links: [{ label: "Carte des fablabs", url: "https://..." }],
    osm: ['nwr["leisure"="hackerspace"]', 'nwr["club"="makerspace"]'],  // sélecteurs Overpass QL (sans zone ni sortie)
    paid: "mixed"      // "free" | "paid" | "mixed" (bénévole ou rémunéré)
  }],

  // Fédérations et réseaux nationaux par univers (30 à 50) : FFE échecs, FFME escalade, Réseau Repair Café, Fresque du Climat...
  networks: [{ id: "ffe", name: "Fédération française des échecs", url: "https://www.echecs.asso.fr", universes: ["jeux"], domains: ["jeux.echecs"], desc: "..." }],

  // Sélecteurs Overpass par univers pour l'outil « Autour de moi »
  osmByUniverse: { musique: [{ label: "Écoles de musique", q: 'nwr["amenity"="music_school"]' }] /* … les 17 univers */ },

  // Statuts pour exercer (8 à 12) : bénévolat, association loi 1901, micro-entreprise BNC, micro-entreprise BIC prestation, micro vente,
  // artiste-auteur, CAE, portage salarial, services à la personne (crédit d'impôt 50 %), chèque emploi associatif, SAS/EURL, revenus occasionnels entre particuliers
  statuses: [{
    id: "micro-bnc", name: "Micro-entreprise (prestations BNC)",
    forWhat: "Cours, coaching, conseil",
    cost: "Cotisations ≈ X % du CA (taux 2026 à vérifier)",
    ceiling: "Plafond de CA ...",
    pros: ["..."], cons: ["..."],
    steps: ["Déclaration sur le guichet unique de l'INPI", "..."],
    fit: { incomeMin: 0, incomeMax: 77700, collective: false },   // pour l'algorithme de recommandation, en €/an
    source: "https://..."
  }],

  // Cadre réglementaire, une entrée par valeur possible de `regulated`
  regulations: { sport: { title: "Enseignement sportif contre rémunération", rule: "...", risk: "...", options: ["..."], source: "https://..." } /* alcool, alimentaire, enfants, sante, securite, animaux, droit */ },

  // Fourchettes de prix observées (France, 2025-2026) par univers, en € TTC
  pricing: { musique: { cours: [25, 45], atelier: [20, 45], stage: [60, 180], prestation: [150, 600], coaching: [40, 90], entreprise: [400, 1500] } /* les 17 */ },

  // Gabarits de projets collectifs (20 à 30), inspirés de l'Atlas : jam, compilation, fanzine, repair café, dîner collectif, chantier participatif...
  projectTemplates: [{
    id: "compilation-ambient", name: "Compilation collective", desc: "...",
    universes: ["musique", "image"], tags: ["composition", "production", "illustration"],   // tags de la taxonomie
    size: [4, 10], weeks: 6, output: "Sortie publique datée sur Bandcamp + soirée d'écoute",
    roles: ["Porteur", "Compositeurs", "Mastering", "Pochette", "Communication"],
    steps: ["S1 · ...", "S2 · ..."], funding: ["Bandcamp", "Ulule"], paid: "mixed"
  }],

  // Moteurs de recherche préremplis (liens profonds), {q} = requête, {city} = ville
  searchEngines: [{ id: "google", name: "Google", url: "https://www.google.com/search?q={q}+{city}", sides: ["learn", "offer"] }]
};
```

## 3. Profil utilisateur (stocké en localStorage, clé `cordes.v1`)

Produit et consommé uniquement par l'app. Les docs peuvent s'y référer.

```js
{
  version: 1,
  mode: "learn" | "offer" | "both",
  createdAt, updatedAt,
  context: { firstName, city, lat, lon, radiusKm, hoursPerWeek, budgetPerMonth, presence: "local"|"online"|"both", ageBand },
  intents: ["plaisir", "defi", "rencontres", "equilibre", "transmettre", "complement", "activite", "projets"],
  skills: { "<skillId>": { level: 0-4, teach: bool, years, proof, love: 0-3 } },   // ce que je sais faire
  custom: [{ id, name, universe, level }],                                        // compétences hors catalogue
  desires: { "<skillId>": { verdict: "yes"|"no"|"done", priority, motive: [...], target: 1-4, horizon: "1m"|"3m"|"12m", formats: [...] } },
  style: { answers: {...}, archetype: "..." },
  offer: { goals: [...], incomeTarget, hoursPerWeek, audiences: [...], formats: [...], assets: {...}, entrepreneur: {...} },
  plan: { checked: { "<taskId>": true } },
  waitlist: { email?, role, at }
}
```
