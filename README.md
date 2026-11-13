# Cordes · bilan de compétences de vie (nom de travail)

Prototype V1 et études du 12-13 novembre 2026. Ouvrir `index.html` à la racine : il relie tout.

## Livrables

| # | Livrable | Fichier | Contenu |
|---|---|---|---|
| 01 | Prototype | `app/index.html` | Bilan demandeur et offreur, recommandations, outils (Autour de moi via OpenStreetMap, recherches préparées, copilote IA optionnel, troc entre amis, passeport exportable, simulateur de revenus, feuille de route 90 jours…). Ouvrable en double-clic, sans serveur. Détails : `app/README.md`. |
| 02 | Étude stratégique | `docs/etude-strategique.html` | Vision, proposition de valeur, éléments ajoutés au prototype, déploiement, acquisition et rétention, business plan 36 mois avec simulateur, marketing et niches géographiques, concurrence, risques et opportunités. |
| 03 | Étude des niches | `docs/niches.html` | Diagnostic des 17 secteurs, arbre secteur, domaine, niche, compétence (199 niches notées), grille pondérable, portefeuilles de lancement. |
| 04 | Projets communautaires | `docs/projets-communautaires.html` | Modèle opérationnel transposé de l'open source, 14 fiches projets, plan du pilote jour par jour, structure juridique, kit de modèles. |
| 05 | Pages SEO | `seo/` | Pages statiques « apprendre X à Paris » et « donner des cours de X » générées depuis la taxonomie (`node app/dev/build-seo.js`). |

## Données

- `app/js/data/taxonomy-a.js`, `taxonomy-b.js` : 17 univers, 103 domaines, 432 compétences, 22 compétences transverses.
- `app/js/data/resources.js` : 65 plateformes, 59 apps, 38 types de lieux et communautés, 47 réseaux, 12 statuts (chiffres 2026), 8 cadres réglementaires, prix par univers et format, 27 gabarits de projets collectifs.
- Contrat de données : `docs/_brief/SCHEMA.md`. Brief produit : `docs/_brief/BRIEF-PRODUIT.md`.

## Vérifier

```bash
node app/dev/test-engine.js
```

```bash
node app/dev/e2e.js /tmp/shots
```

## Fiabilité

Chiffres relevés les 12 et 13 nov. 2026. Plusieurs sites officiels n'étaient pas joignables depuis l'environnement de travail : les valeurs concernées viennent d'extraits de moteurs de recherche et sont marquées dans les documents. Les entrées `verify: true` de `resources.js` sont à revalider. Taux, seuils et commissions à confirmer avec un expert-comptable avant tout lancement.
