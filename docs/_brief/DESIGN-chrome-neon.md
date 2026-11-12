---
name: "chrome-neon"
description: "Design system Chrome néon d'Antoine : à appliquer à tout dashboard, outil ou livrable HTML (rapport, doc, note, page) qu'il demande, sauf s'il précise un autre style."
---

# Chrome néon — design system

Style par défaut de toutes les pages HTML d'Antoine : dashboards, outils, rapports, notes, livrables clients en HTML. Il prime sur tes choix esthétiques par défaut. Seule une consigne explicite d'Antoine pour une page donnée le remplace.

Esprit : console d'instrument scientifique. Fond quasi noir, trame de points discrète, panneaux à filets fins, chrome d'interface en monospace, une seule couleur d'accent (cyan), statuts codés par couleur. Dense, précis, sans décoration gratuite.

## 1. Tokens (à copier en tête du `<style>`)

```css
:root{
  --bg:#07080b; --grid:#12151c;
  --panel:#0e1015; --panel-2:#13161d; --hover:#161a23;
  --line:#1d2029; --line-2:#2b2f3b;
  --fg:#f2f4f8; --fg-2:#aeb4c2; --fg-3:#7c8394;
  --accent:#5ee7ff; --accent-ink:#03141a;
  /* sémantique, distincte de l'accent */
  --sent:#4f7dff;   /* cobalt : en attente, info, neutre actif */
  --int:#4dffb5;    /* menthe : positif, en cours, succès */
  --no:#ff9ccb;     /* rose bonbon : négatif, refus, erreur */
  --wait:#e6dcb4;   /* sable clair : échéance, avertissement */
  --idle:#5d6477;   /* inactif, abandonné */
  --f-display:"Marcellus", "Cormorant Garamond", Georgia, serif;
  --f-body:"Spectral", Georgia, serif;
  --f-mono:"IBM Plex Mono", ui-monospace, "SFMono-Regular", Menlo, monospace;
  --r:8px;
  color-scheme:dark;
}
*{box-sizing:border-box}
html{background:var(--bg)}
body{background-color:var(--bg);background-image:radial-gradient(var(--grid) 1px,transparent 1px);background-size:22px 22px;color:var(--fg);font-family:var(--f-mono);font-size:13px;line-height:1.5}
a{color:var(--accent);text-decoration:none} a:hover{text-decoration:underline}
:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
```

Polices Google Fonts : `family=Marcellus&family=Spectral:ital,wght@0,300;0,400;0,500;1,300&family=IBM+Plex+Mono:wght@400;500;600`.

Thème sombre unique et assumé : pas de variante claire, `body` toujours avec fond explicite, aucune couleur en dur hors tokens. Pour un fond teinté de statut : `color-mix(in srgb, var(--x) 14%, transparent)` avec une bordure à 34–38 %.

## 2. Typographie

| Rôle | Police | Usage |
|---|---|---|
| Titre de page, noms propres | Marcellus 400 | h1 30–40px, nom d'entreprise ou de personne en liste 17px, titre de panneau latéral 24px. Jamais en gras. |
| Texte courant | Spectral 300–400 | Prose des livrables (16–17px, interligne 1.6, 68ch max), notes, descriptions, timeline. |
| Interface et données | IBM Plex Mono 400/500 | Tout le reste : libellés, chiffres (`tabular-nums`), boutons, pills, en-têtes de panneau, dates. |

En-têtes de panneau : mono 11.5px, 500, capitales, `letter-spacing:.1em`. Libellés secondaires : mono 10.5–11px, capitales, `--fg-3`. Gros chiffres : mono 500, 26–30px, `letter-spacing:-.02em`.

## 3. Composants communs

- **Barre d'app collante** : 52px, fond `color-mix(--bg 86%)` + `backdrop-filter:blur(10px)`, filet bas `--line`, `top:env(safe-area-inset-top,0px)`. À gauche une marque (petit logo de 4 carrés arrondis, accent + menthe + 2 filets) + fil d'Ariane mono (`registre / candidatures`). À droite l'état des données : pastille 7px (menthe = frais, sable = périmé) + « Gmail · lu 13 oct. 18:45 ».
- **Panneau** : fond `--panel`, bordure 1px `--line`, rayon 8px. En-tête 46px avec titre mono capitales, indication `--fg-3`, compteur en pastille accent, actions à droite.
- **Rangée de compteurs** : cellules jointes (`gap:1px` sur fond `--line`, rayon 8px sur le conteneur). Libellé mono capitales avec carré 6px de la couleur du statut, valeur mono 30px, sous-ligne `--fg-2`. Une cellule peut porter une sparkline de barres 3px (accent si valeur > 0, `--line-2` sinon).
- **Pill de statut** : 22px, rayon 999px, point 6px plein, fond teinté 14 %, bordure 34 %, texte `--fg`. Marque ✎ en accent si la valeur a été saisie à la main.
- **Chips de filtre** : 26px, rayon 999px, point 6px, compteur en `<b>` `--fg-3` ; état actif = fond `--panel-2` + bordure de la couleur du statut.
- **Contrôle segmenté** et **boutons** : 28–30px, rayon 6px, bordure `--line-2`. Un seul bouton primaire par vue : fond accent, texte `--accent-ink`, 600.
- **Recherche** : champ 30px sur `--bg`, loupe SVG à gauche, `<kbd>/</kbd>` à droite.
- **`<kbd>`** : mono 10.5px, bordure `--line-2` avec bord bas 2px, fond `--panel-2`. Afficher une ligne de raccourcis en pied de page (masquée au tactile).
- **Liste d'alertes** : lignes séparées par filets ; trait vertical 3px de la couleur du sens, étiquette mono capitales colorée, titre Spectral 15.5px, motif mono `--fg-2`, bouton fantôme « Ouvrir ».
- **Table** : lignes en grille CSS (pas de `<table>` pour les tables interactives), en-têtes mono capitales triables avec ↑↓, ligne 56px, survol `--hover`, sélection = fond `--panel-2` + barre accent 2px à gauche. Colonne « âge » avec jauge 3px. Sous 1040px, chaque ligne passe en carte deux colonnes.
- **Panneau latéral** : 460px max, fixé à droite, ombre `-24px 0 60px -20px #000`, voile `--bg` à 60 %. En-tête Marcellus + bouton Esc, grille clé/valeur jointe, timeline (points 9px cerclés de la couleur de l'étape, fil `--line-2`), formulaire.
- **Formulaires** : champs sur `--bg`, bordure `--line-2`, rayon 6px, mono 13px ; zones de texte en Spectral 15px. Libellés mono capitales `--fg-3`.
- **Toast** : pilule centrée en bas, point de couleur, texte court (« Enregistré »).

## 4. Livrables documentaires (rapport, note, doc)

Même fond, mêmes tokens, même barre. Le contenu adapte la console à la lecture :
- Colonne de lecture 68ch en Spectral 17px, interligne 1.6 ; sommaire collant à gauche (220px, mono 12px, entrée active = filet accent) qui passe en haut sous 900px.
- En-tête de document : fil d'Ariane mono, h1 Marcellus, chapô Spectral italique `--fg-2`, puis une grille de métadonnées jointe (date, auteur, statut, version) au format compteurs.
- Sections : étiquette mono `--accent` (« 01 · contexte ») seulement si l'ordre compte, h2 Marcellus 26–30px, filet bas.
- Encarts : panneau `--panel` avec trait gauche 3px de couleur sémantique (accent = à retenir, menthe = recommandation, sable = point de vigilance, rose = risque), étiquette mono capitales colorée. Trait gauche sans rayon.
- Tableaux de données : `<table>` dans un conteneur `overflow-x:auto`, filets horizontaux `--line`, en-têtes mono capitales `--fg-3`, chiffres mono alignés à droite.
- Code et formules : bloc `--panel-2`, mono 12.5px, numéros de ligne `--fg-3`.

## 5. Graphiques

- SVG inline dessiné à l'échelle, textes en IBM Plex Mono 9–11px colorés par tokens (`--fg-3` pour les axes, `--fg` pour la valeur mise en avant).
- Barres et cellules à coins 3px, couleur = statut ; jours vides marqués d'un tiret 4×2 `--line-2` ; week-ends en fond `--bg` ; aujourd'hui encadré `--line-2` avec libellé « auj. » accent.
- Répartition : barre 100 % de 10px (segments séparés de 2px) + liste libellé / nombre / %.
- Légende mono 11.5px avec carrés 8px. Jamais la couleur seule : toujours un libellé ou un nombre.

## 6. Rédaction

- Français, phrases courtes et factuelles, vocabulaire d'outil : « 23 j sans réponse · relancer ou classer », « Entretien du 1 oct. · aucune suite notée ».
- Le point médian `·` sépare les fragments d'information. Dates courtes (« 13 oct. »), durées en `j`.
- Pas de chapô lyrique, pas de « Il est à noter », pas de tirets d'incise, pas de « non pas X mais Y », pas de deux-points dramatiques, pas d'emoji.
- Boutons : verbe à l'infinitif, 1 à 3 mots (« Ajouter », « Enregistrer », « Ouvrir »). États vides : ce qui manque et comment le remplir, en une ligne.

## 7. Contraintes techniques

- Largeur max 1280px, gouttière `padding-inline:clamp(16px,3vw,32px)`, grilles qui passent en une colonne sous ~1040px et ~560px. Aucun débordement horizontal hors tables, SVG et code dans leur conteneur.
- Respecter `prefers-reduced-motion`. Pas de dégradés décoratifs ni de lueurs ; la seule ombre est celle du panneau latéral.
- Pour un artifact, données persistantes dans la capacité `db` plutôt que dans le code de la page.

## Référence vivante

Le « Registre des candidatures » (https://claude.ai/artifact/9Sdsk4MpbA3PkSMYrktZXZ) est l'implémentation de référence pour un dashboard : s'y reporter pour les détails de composants et de comportements (raccourcis J/K/Entrée/N/Esc, panneau latéral, tri).