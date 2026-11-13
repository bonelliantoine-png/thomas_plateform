# Brief V2 · prototype « Cordes » · attirer les curieux, donner envie aux lieux

Destinataire : l'agent qui code l'app (`app/`). Source : `docs/etude-strategique.html`, sections 06b « Attirer les curieux » et 06c « Lieux partenaires » (13 nov. 2026). Rien n'est acté côté produit final : c'est la spécification du prototype.

## 0. Principes communs

- **Pourquoi.** Le bilan attire des gens qui cherchent déjà à apprendre. La cible principale, les **curieux**, ne cherche rien : elle veut une idée de sortie, un cadeau, un moment drôle à partager. Les deux fonctions ci-dessous les font venir pour cette autre raison, puis leur montrent en chemin un savoir-faire concret (« en une heure, vous saurez faire un cœur dans un latte ») et les mènent au bilan, à la liste d'attente et, plus tard, à une séance.
- **Contraintes inchangées.** Vanilla JS, scripts classiques, ouvrable en `file://`, aucune étape de build, aucun `fetch` vers un service externe dans les nouveaux écrans (l'app est aussi publiée comme page claude.ai). Téléchargements par `C.download` (déjà routé vers `window.claude.use("downloads")` par `js/host.js`). IA facultative : `window.claude.use("sample")` si présent, sinon clé utilisateur (`js/engine/ai.js`), sinon gabarits ; l'écran doit être complet sans IA. Pas de `confirm` ni d'`alert` : utiliser le toast et des boutons à deux temps.
- **Données figées.** Ne pas modifier `js/data/taxonomy-*.js` ni `resources.js`. Les nouveaux contenus vont dans de **nouveaux fichiers de données** (`js/data/occasions.js`, `js/data/quiz.js`, `js/data/defis.js`) chargés après `resources.js`.
- **Design et rédaction.** Chrome néon (`docs/_brief/DESIGN-chrome-neon.md`) : un seul accent cyan, statuts colorés, Spectral pour les textes d'accompagnement, mono pour l'interface. Boutons à l'infinitif, 1 à 3 mots. Pas d'emoji, pas de tirets d'incise. Tutoiement sur ces deux fonctions grand public (ton de la plateforme de marque, étude § 08), vouvoiement conservé dans le bilan existant.
- **Nature des chiffres affichés.** Tout prix ou durée montré au curieux vient de la taxonomie (`attrs.cost`, `hoursToBasics`, `levels`) ou de `resources.pricing` via `C.priceRange`, et porte la mention « fourchette indicative ». Aucun chiffre inventé dans les textes éditoriaux.

---

## 1. Attirer les curieux : « Idées à vivre » puis « Ta corde cachée »

Ordre recommandé par l'étude : **A. Idées à vivre** d'abord (lancement avant Noël, semaine du 14 déc. 2026), **B. Ta corde cachée** ensuite (semaine du 28 déc., « ta corde 2027 »). Les deux partagent le moteur de sélection, la carte image et les passerelles vers le bilan.

### 1.1 La boucle à rendre possible

```
curieux (cadeau, sortie, test drôle)
  → découverte : 6 idées concrètes, « en 1 h tu sauras… »
  → envie : « ça nous tente », bon cadeau, partage au groupe
  → bilan pré-rempli (les idées retenues deviennent des cartes « Ça me tente » proposées en premier)
  → liste d'attente localisée (wants pré-remplis, source = idees | test)
  → séance (plus tard : séance de groupe privée, place à l'unité, séance chez un lieu partenaire)
```

Chaque écran a une sortie vers l'étape suivante, jamais d'impasse.

### 1.2 Entrées dans l'app

- **Accueil (`#/accueil`)** : la zone héro propose trois portes au même niveau, dans cet ordre :
  1. « Trouver une idée de sortie ou de cadeau » → `#/idees` (primaire du 1er nov. au 31 déc., puis du 1er au 14 févr., et du 15 mars au 30 juin pour les EVJF ; calcul par la date du jour, table `C.OCCASION_SEASONS`).
  2. « Faire le test · 60 s » → `#/test` (primaire le reste de l'année).
  3. Les trois parcours du bilan existants, regroupés sous « Faire mon bilan · 10 min ».
  Un seul bouton primaire par vue (règle du design system).
- **Barre de navigation et tiroir** : ajouter « Idées à vivre » et « Le test » après « Accueil ».
- **Résultats du bilan et de l'offre** : ajouter une tuile « Une idée à vivre avec ces envies » (ouvre `#/idees/amis` avec les envies retenues en tête) et « Fais passer le test à un ami » (`#/test`).
- **Liens entrants** : `#i=<code>` (sélection d'idées partagée), `#t=<code>` (résultat du test partagé). Étendre `ui.parseHash` comme pour `#b=`.

### 1.3 Fonction A · « Idées à vivre » (`#/idees`)

**Promesse au curieux** : « Une idée de sortie ou de cadeau qui sort de l'ordinaire, en 30 secondes. »

#### Écrans

| Route | Écran | Contenu |
|---|---|---|
| `#/idees` | A1 · Occasion | Kicker « Idées à vivre · gratuit · sans compte ». Titre Marcellus « Qu'est-ce qu'on fait ? ». Grille de 9 cartes d'occasion (ordre : occasions de saison d'abord). Lien discret « Je ne sais pas pour qui : faire passer le test » → `#/test`. |
| `#/idees/<occasion>` | A2 · Réglages + A3 · Idées | En haut, réglages compacts sur une ligne (chips) : nombre de personnes (1, 2, 3-4, 5-8, 9+), budget par personne (0 €, < 20 €, < 50 €, < 100 €, peu importe), lieu (chez soi, dehors, les deux), arrondissement ou ville (facultatif, champ texte, réutiliser `C.zoneOf`). Pour `offrir` : chips « ses goûts » (univers, 6 max) ou « je ne sais pas ». Pour `famille` : âge des enfants (3-6, 7-11, 12-17). En dessous, **6 cartes d'idées** puis « Voir 6 autres ». Panneau collant « Votre sélection (n) » à droite au-delà de 1040 px, en bas d'écran en dessous. |
| panneau latéral | A4 · Fiche idée | Ouvert au clic sur une carte (`ui.openDrawer`). Titre Marcellus, « À la fin de l'heure » (levels[0]), « Pour aller plus loin » (levels[1] et levels[2]), durée pour les bases (`hoursToBasics`), budget chez soi (`C.COST_RANGE[attrs.cost]`, ramené par personne si matériel partageable) et en atelier (`C.priceRange(universe, 'atelier')` × 1,15 à Paris), forces mobilisées (`soft`), « Où le faire » (liens de `C.searchLinks(s, 'learn', ville)` limités à 5 : Wecandoo, Airbnb Expériences, Meetup, Google Maps, Eventbrite), « Le faire chez soi » (`C.firstStep`), voisins (`C.neighbors`, 3 au plus) en « Si ça vous plaît ». Boutons : « Ajouter », « Offrir », « Où le faire ». |
| sélection | A5 · Envoyer au groupe | Liste des idées retenues (2 à 5), champ prénom facultatif, champ « pour quand » libre. Boutons : « Copier le message », « Partager » (Web Share API si dispo, sinon copie), « Bon cadeau », « Ajouter à mes envies ». Message généré (gabarit, ou IA si dispo, voir plus bas). |
| `#i=<code>` | A6 · Vue reçue | « Léa te propose 3 idées · EVJF ». Les cartes, chacune avec « Je vote pour celle-là » (compose un message de réponse : « Je vote latte art »), puis deux passerelles : « Et toi, quelle est ta corde cachée ? Test en 60 s » et « Être prévenu quand ces séances ouvrent près de chez moi » (`#/attente` pré-rempli). |
| modale | A7 · Bon cadeau | Choix : « Bon pour une heure de… » (une idée) ou « Bon pour une sortie à choisir » (la sélection). Champs : de, pour, mot (120 caractères). Rendu Canvas 1080 × 1350 (PNG) dans le style de `js/ui/card.js` + version imprimable A6 (fenêtre d'impression de l'app). Mention en pied : « Idée trouvée sur Cordes · cordes.app » (constante `C.PUBLIC_URL`, vide = masquée). |

#### Occasions (`js/data/occasions.js`)

```js
window.CORDES_OCCASIONS = [
  { id: 'offrir',   label: 'Un cadeau à offrir',        kicker: 'Noël, anniversaire, merci', people: 2, budget: 50,  place: 'both',  seasons: ['11-01:12-24', '05-10:05-31', '06-01:06-21'],
    w: { social: 0.10, creative: 0.20, oneHour: 0.20, trend: 0.15, demand: 0.15, novelty: 0.20 }, boost: {}, exclude: ['securite','sante','animaux'], pins: ['latte-art', 'poterie-tournage', 'linogravure'] },
  { id: 'anniv',    label: 'Fêter un anniversaire',     people: 6, budget: 50,  place: 'out',  w: { social: 0.30, oneHour: 0.25, creative: 0.15, trend: 0.15, novelty: 0.15 } },
  { id: 'evjf',     label: 'EVJF ou EVG',               people: 8, budget: 100, place: 'out',  seasons: ['03-15:06-30'], allowAlcohol: true, w: { social: 0.35, oneHour: 0.25, novelty: 0.25, physical: 0.15 } },
  { id: 'couple',   label: 'En amoureux',               people: 2, budget: 50,  place: 'both', seasons: ['01-20:02-14'], w: { social: 0.20, creative: 0.30, oneHour: 0.25, novelty: 0.25 } },
  { id: 'amis',     label: 'Entre amis, un soir',       people: 4, budget: 20,  place: 'both', w: { social: 0.35, oneHour: 0.30, trend: 0.20, novelty: 0.15 } },
  { id: 'famille',  label: 'En famille, avec enfants',  people: 4, budget: 20,  place: 'both', kidsSafe: true, w: { social: 0.25, oneHour: 0.35, creative: 0.25, physical: 0.15 } },
  { id: 'equipe',   label: 'Entre collègues',           people: 9, budget: 50,  place: 'out',  b2b: true, w: { social: 0.35, oneHour: 0.30, intellectual: 0.15, novelty: 0.20 } },
  { id: 'dimanche', label: 'Un dimanche pluvieux',      people: 1, budget: 20,  place: 'home', w: { oneHour: 0.40, creative: 0.25, cheap: 0.20, novelty: 0.15 } },
  { id: 'nouveau',  label: 'Nouveau dans le quartier',  people: 1, budget: 20,  place: 'out',  w: { social: 0.45, oneHour: 0.25, trend: 0.15, demand: 0.15 } }
];
```

Pour chaque occasion, ajouter un `intro` (une phrase Spectral, écrite à la main), 3 `pins` (identifiants vérifiés dans la taxonomie au chargement : un identifiant absent est ignoré et signalé dans `C.anomalies`, jamais d'exception) et, si `b2b`, un encart « Pour une équipe de 8 à 20 : séance d'équipe clé en main » vers `#/attente` avec rôle « entreprise » noté dans `source`. Les identifiants cités ici sont des exemples : prendre ceux qui existent réellement (`node -e` sur la taxonomie).

#### Sélection des idées (`js/engine/ideas.js`, nouveau, pur, testable sous Node)

`C.ideas(occasionId, opts) → { items: [{ s, score, why, budgetHome, budgetOut, tags }], total }`

1. **Filtres durs** : `attrs.oneHourResult === true` ou `hoursToBasics <= 3` ; `formats` contient au moins `atelier`, `evenement`, `communaute` ou `cours` ; `regulated` hors `occasion.exclude` (par défaut `securite`, `sante`, `animaux`) ; `alcool` seulement si `allowAlcohol` ; `enfants` et `physical >= 3` exclus si `kidsSafe` ; lieu `home` : `physical <= 2` et pas de domaine nécessitant un équipement lourd (`attrs.cost <= 2`) ; budget : `C.COST_RANGE[attrs.cost][0] / max(1, personnes partageant le matériel)` ≤ budget par personne, et pour `out` : bas de `C.priceRange(universe,'atelier')` ≤ budget × 1,2.
2. **Score** = Σ poids de l'occasion × attribut normalisé sur 0-1 (`social/3`, `creative/3`, `physical/3`, `intellectual/3`, `trend/3`, `demand/3`, `oneHour` = 1 si résultat en une heure, `cheap` = 1 − cost/3, `novelty` = 1 − demand/3 + 0,3 si l'univers n'est pas dans les 4 plus fréquents de la taxonomie) + 0,25 si l'univers est choisi dans « ses goûts » + 0,15 si `pins` + 0,10 si la compétence figure dans les envies du bilan local.
3. **Diversité** : MMR (λ = 0,7) avec pénalité d'univers répété ; 2 idées au plus par univers dans les 6 premières ; au moins 1 idée de `novelty >= 0,6` dans les 6 premières (c'est la « découverte de niche »).
4. **`why`** : une phrase générée par gabarit à partir du plus fort contributeur du score (« À faire à plusieurs, résultat dès la première heure », « Rare et facile à offrir », « Pas besoin de matériel »).
5. **Titre de carte** : gabarit `« Apprendre {name} {suffixe} »` avec suffixe selon `people` (« à deux », « en bande », « entre collègues », vide si 1) ; sous-titre « À la fin : {levels[0]} ».

Déterministe à paramètres égaux (tests reproductibles) ; « Voir 6 autres » prend les 6 suivants.

#### Partage et codes

- `C.encodeIdeas({ o, ids, from, when }) → code` : JSON compact, compressé et encodé comme `C.encodeShare` (réutiliser la même fonction de compression), 5 identifiants au plus. `C.decodeIdeas(code)` tolère un code tronqué (renvoie `null` et l'écran A6 affiche « Lien incomplet · demander un nouveau lien » avec un bouton vers `#/idees`).
- Message par défaut (gabarit) : « {from} te propose {n} idées pour {when|bientôt} : {liste}. On vote ici : {lien} ». Avec IA (`window.claude.use('sample')` ou clé) : bouton « Réécrire le message » qui envoie l'occasion, les noms et le ton souhaité (drôle, sobre) ; réponse limitée à 400 caractères ; échec = gabarit + toast « IA indisponible · message standard ».

#### Liens avec le bilan et la liste d'attente

- « Ajouter à mes envies » : crée `st.desires[id] = { verdict: 'yes', source: 'idees', target: 2, horizon: '3m', formats: ['atelier'], priority: n }` sans démarrer le parcours ; si aucun bilan, propose « Faire mon bilan avec ces envies » qui ouvre `#/bilan/contexte` et place ces idées en tête du paquet d'inspiration (paramètre `st.deck.seed = [ids]`, lu par `inspiration.js` : bonus de +1 au score des cartes présentes dans `seed`, une modification minimale du moteur).
- Liste d'attente : `#/attente` accepte un pré-remplissage `ui._prefill = { wants: ids, source: 'idees' | 'idees-partage' | 'test' }` ; le champ `source` existe déjà dans l'entrée (`C.waitlist.add`) et doit être conservé dans l'export CSV (ajouter la colonne `source`).

#### Mesure (événements `C.track`)

`idees_open {o}`, `idees_filter {k}`, `idees_card {id}`, `idees_add {id}`, `idees_share {n, via}`, `idees_gift {fmt}`, `idees_out {platform}`, `idees_recv {n}`, `idees_to_test`, `idees_to_bilan`, `idees_to_waitlist`. Ajouter à `C.FUNNEL` un entonnoir « curieux » : visite d'idées → idée ajoutée → partage ou bon → bilan démarré → liste d'attente.

### 1.4 Fonction B · « Ta corde cachée » (`#/test`)

**Promesse au curieux** : « 8 questions sur ta vie, pas sur tes compétences. Découvre le savoir-faire qui te ressemble, et ce que tu saurais faire en une heure. »

#### Écrans

| Route | Écran | Contenu |
|---|---|---|
| `#/test` | B1 · Accroche | Titre « Quelle est ta corde cachée ? », sous-titre « 8 questions · 60 secondes · sans compte », bouton primaire « Commencer ». Rappel « tes réponses restent sur cet appareil ». |
| `#/test/q` | B2 · Questions | Une question par écran, barre de progression 8 segments, réponses en grandes options (une tape = réponse et question suivante, animation coupée si `prefers-reduced-motion`). Clavier : 1 à 5 pour répondre, ← pour revenir. |
| `#/test/r` | B3 · Résultat | Nom de la corde (Marcellus 40 px), phrase portrait (Spectral), radar simple des 4 axes (réutiliser `charts.js`). **3 savoir-faire** en cartes : « l'évidente », « la voisine », « la surprise », chacune avec « en 1 h tu sauras… » (levels[0]) et le bouton « Ça me tente ». **Défi de la semaine** (15 minutes, chez soi). Actions : « Partager ma carte » (Canvas story 1080 × 1920 et carré 1080 × 1080), « Comparer avec un ami » (lien `#t=`), « Trouver une idée à vivre » (`#/idees/amis` avec les 3 savoir-faire en tête), « Aller plus loin · bilan 10 min » (pré-rempli), « Être prévenu près de chez moi » (liste d'attente). Bouton secondaire « Une autre surprise » (pioche la suivante). |
| `#t=<code>` | B4 · Résultat reçu | « La corde cachée de Léa : Palais curieux ». Ses 3 savoir-faire, puis « Et toi ? Faire le test » ; si le visiteur a déjà fait le test, écran de comparaison : cordes, axes superposés, « ce que vous pourriez apprendre ensemble » (2 savoir-faire au plus proche des deux vecteurs) et lien vers `#/idees/amis` avec ces savoir-faire. |

#### Contenu (`js/data/quiz.js`)

Chaque réponse ajoute des points d'axes (`so` social, `ph` physique, `cr` création, `in` intellect, de −1 à +2) et des points d'univers (identifiants réels de la taxonomie).

| # | Question | Réponses → effets |
|---|---|---|
| Q1 | Dimanche, 10 h. Tu es plutôt… | encore au lit avec un livre ou un podcast → in+2, savoirs+2, parole+1 · au marché, puis aux fourneaux → ph+1, cuisine+3 · en train de bricoler ou de réparer un truc → ph+1, maison+2, artisanat+1 · dehors : vélo, parc, balade → ph+2, pleinair+2, nature+1, sport+1 · déjà au café avec des amis → so+2, social+2, jeux+1 |
| Q2 | Ce que tes proches te demandent toujours | « tu peux me prendre en photo ? » → cr+1, image+3 · « on mange quoi ce soir ? » → cuisine+3 · « tu peux réparer ça ? » → maison+2, tech+1 · « tu mets la musique ? » → musique+3 · « raconte encore cette histoire » → so+1, parole+2, scene+1 |
| Q3 | Ta galerie photo est surtout pleine de… | plats et cafés → cuisine+2, image+1 · plantes, ciel, paysages → nature+2, pleinair+1 · captures d'écran d'idées à tester → in+1, pratique+2, tech+1 · amis en soirée → so+2, scene+1, social+1 · objets, déco, tenues → cr+1, style+2, artisanat+1 |
| Q4 | En soirée, tu es celui ou celle qui… | sort un jeu → so+1, jeux+3 · tient la playlist → musique+3 · refait le monde → in+1, parole+2, savoirs+1 · danse en premier → ph+2, scene+2 · finit en cuisine → cuisine+2, social+1 |
| Q5 | Fin de journée, ce qui te ferait du bien | faire quelque chose de tes mains → ph+1, cr+1, artisanat+2 · bouger, transpirer → ph+2, sport+2 · créer un truc à toi → cr+2, image+1, musique+1 · apprendre une astuce utile → in+1, pratique+2, tech+1 · ralentir, au calme → bienetre+3 |
| Q6 | Après une heure, tu préfères repartir avec… | un objet fait main → artisanat+2, cr+1 · un plat ou une boisson → cuisine+2 · un son, une photo ou une vidéo → cr+1, musique+1, image+1, tech+1 · un geste qui simplifie ton quotidien → pratique+2, maison+1, tech+1 · une rencontre → so+2, social+2 |
| Q7 | Plutôt… | en solo → so−1 · à deux → so+0 · en petite bande → so+1 · en grande tablée → so+2 |
| Q8 | Ton budget plaisir ce mois-ci | 0 € → coût max 0 · moins de 20 € → coût max 1 · moins de 50 € → coût max 2 · on verra → pas de filtre |

**13 cordes** (profil = univers dominant, regroupés ; égalité départagée par l'axe le plus fort) :

| Corde | Univers | Portrait (une phrase à écrire, ton chaleureux, sans pseudo-psychologie) |
|---|---|---|
| Main d'or | artisanat, maison | « Tu comprends les choses en les fabriquant. » |
| Palais curieux | cuisine | « Pour toi, une soirée réussie se termine autour d'une table. » |
| Oreille fine | musique | |
| Œil vif | image, style | |
| Conteur né | parole | |
| Scène ouverte | scene | |
| Corps en mouvement | sport, pleinair | |
| Pied vert | nature | |
| Esprit de jeu | jeux | |
| Âme du quartier | social | |
| Bidouilleur malin | tech, pratique | |
| Tête chercheuse | savoirs | |
| Esprit tranquille | bienetre | |

Les 13 portraits sont rédigés à la main (contenu éditorial) ; l'IA peut proposer des variantes, jamais en direct à l'écran.

#### Calcul du résultat (`js/engine/quiz.js`, nouveau, pur)

- `C.quizScore(answers) → { axes: {so, ph, cr, in}, uni: {id: points}, costMax, profile }`.
- `C.quizPicks(result, opts) → [evidente, voisine, surprise]` sur les compétences filtrées (`oneHourResult`, `regulated` hors `securite`, `sante`, `animaux`, `attrs.cost <= costMax`) :
  - score = 0,45 × uni[s.universe] / max(uni) + 0,25 × cosinus(axes, attrs centrés) + 0,15 × trend/3 + 0,15 × demand/3 ;
  - **évidente** = meilleur score ; **voisine** = meilleur score parmi `C.neighbors(evidente)` d'un autre domaine ; **surprise** = meilleur score parmi les univers hors des 3 premiers du profil, avec `demand <= 2` (rareté) et un tag commun avec l'évidente (passerelle). C'est ici que le curieux découvre une niche.
  - « Une autre surprise » = suivante dans la même liste, jusqu'à 5.
- Déterministe ; aucune donnée ne quitte l'appareil.

#### Défi de la semaine (`js/data/defis.js`)

Objet `{ skillId: { titre, minutes, materiel, etapes: [3 étapes], reussi: 'phrase' } }` pour les 60 compétences les plus souvent tirées (liste à extraire avec un script sur les 13 profils × budgets). Repli sans entrée : gabarit construit avec `C.firstStep` et `levels[0]`. Affichage : « Cette semaine, en 15 minutes » + case « Fait » (persistée dans `cordes.quiz`) ; le bouton « Fait » propose « Partager ma réussite » (carte image avec le titre du défi).

#### Carte image

Étendre `card.js` avec `ui.drawQuizCard(canvas, result, fmt)` : fond `--bg`, trame, nom de la corde en Marcellus, 3 savoir-faire en mono, mention « Ta corde cachée · fais le test » et l'URL publique si renseignée. Formats story et carré, comme la carte du bilan (A4). Partage par Web Share API si disponible, sinon téléchargement par `C.download`.

#### Passerelles

- **Vers le bilan** : `C.quizToState(result) → st` partiel : `context.budgetPerMonth` (0, 15, 40, 80 selon Q8), `context.presence` (`both`), `intents: ['learn']`, `deck.seed` = les 3 savoir-faire, `deck.uniW` initialisé par `uni` (normalisé, plafond 0,5) pour que le paquet d'inspiration parte du profil. Le volet « ce que je sais » n'est pas pré-rempli (le test ne mesure aucune compétence).
- **Vers la liste d'attente** : wants = savoir-faire marqués « Ça me tente », `source: 'test'`.
- **Vers Idées à vivre** : `#/idees/amis` avec `opts.seed = picks` (bonus +0,2 au score).

#### Stockage et données

Nouvelle clé `cordes.quiz` : `{ answers, result, picksSeen, defiDone, at }`. Ajouter les libellés dans `C.KEY_LABELS`, l'export et l'effacement de `#/donnees`. Le lien `#t=` contient prénom facultatif, réponses (8 chiffres) et rien d'autre.

#### Mesure

`test_start`, `test_answer {q}`, `test_done {profile}`, `test_share {fmt}`, `test_compare`, `test_more`, `test_defi_done`, `test_to_bilan`, `test_to_idees`, `test_to_waitlist`. Entonnoir : début → fin → partage → bilan démarré → liste d'attente. Le tableau `#/admin/metrics` affiche le **coefficient viral estimé** = ouvertures de liens `#t=` et `#i=` / partages (sur l'appareil en prototype, agrégé une fois la mesure branchée).

### 1.5 Pages SEO (facultatif, lot suivant)

Étendre `app/dev/build-seo.js` : 9 pages « Idées de sortie et de cadeau · {occasion} à Paris » (6 idées générées par `C.ideas`, fourchettes de prix, lien vers l'app), et 13 pages « Corde cachée : {nom} » (portrait, savoir-faire, lien vers le test). Contenu propre à chaque page, pas de page vide (règle de l'étude § 06).

### 1.6 Tests à prévoir

**Moteur (`app/dev/test-engine.js`)**
- `C.ideas` : pour chaque occasion, 6 résultats, aucun `regulated` exclu, `alcool` absent hors `evjf`, aucun résultat `physical >= 3` pour `famille`, budget respecté (`0 €` → `attrs.cost == 0` chez soi), au plus 2 par univers, au moins 1 nouveauté ≥ 0,6, déterminisme (deux appels égaux), `pins` absents ignorés sans exception.
- `C.encodeIdeas` / `C.decodeIdeas` : aller-retour, code tronqué → `null`, 5 identifiants au plus.
- `C.quizScore` : les 8 réponses × 5 choix donnent toujours un profil parmi les 13 ; chaque profil est atteignable (recherche exhaustive ou 10 000 tirages) ; `costMax` respecté par les 3 savoir-faire ; évidente, voisine et surprise distinctes ; la surprise hors des 3 univers du profil.
- `C.quizToState` : état valide pour `C.mergeState`, `deck.seed` lu par `inspiration.js` (les 3 savoir-faire sont dans les 10 premières cartes).
- Pas de régression : les 391 vérifications existantes passent.

**Bout en bout (`app/dev/e2e.js`, 375 et 1440 px, `file://`, 0 erreur console)**
- Idées : accueil → occasion « EVJF » → filtres → ajouter 3 idées → copier le message → ouvrir le lien `#i=` dans un nouvel onglet → vue reçue → test → résultat → liste d'attente pré-remplie avec `source`.
- Bon cadeau : génération PNG (taille > 10 ko), impression sans débordement.
- Test : 8 réponses au clavier, résultat, « Une autre surprise », carte story, lien `#t=` → comparaison, « Aller plus loin » → bilan avec les 3 savoir-faire en tête du paquet.
- Aucun débordement horizontal à 375 px, focus visible sur chaque option, `aria-pressed` ou `aria-checked` cohérents, lecture d'écran du résultat (`aria-live` sur le nom de la corde).
- Mode page publiée : `window.claude` simulé, téléchargements et `sample` routés, aucun `fetch` réseau dans les nouveaux écrans (intercepter et échouer si une requête sort).

### 1.7 Hors périmètre de ce lot

- Agenda local agrégé (« que faire cette semaine »), lettre hebdomadaire, Grand Jeu de saison : retenus plus tard par l'étude (contenus pour la lettre, données ouvertes « Que faire à Paris », un service central est nécessaire pour la fraîcheur).
- Paiement des bons cadeaux et séances de groupe privées : temps 2, avec la plateforme.
- Votes agrégés d'un groupe : impossibles sans service central ; le prototype compose des messages de réponse.

---

## 2. Donner envie aux lieux : parcours `#/lieu` et mise en avant

Source : étude § 06c. Le parcours `#/lieu` (A10) existe : type, créneaux, capacité, équipements, trois formules, compétences compatibles, estimation de fréquentation, fiche texte, inscription. Ce lot le transforme en **outil de prospection** que le fondateur ouvre sur téléphone devant un gérant, et en **vitrine** des lieux dans l'app.

### 2.1 Données (`js/engine/growth.js`, extension, et `js/data/venues.js`, nouveau)

**Types de lieux** : remplacer les 6 types par 19, groupés en 6 familles (affichage en chips groupées). Garder les identifiants existants (`cafe`, `bar`, `studio`, `atelier`, `librairie`, `autre`) pour la compatibilité des fiches déjà enregistrées ; migration douce : `studio` → `studio-musique` si `sono` ou `piano`, sinon `studio-danse` ; `atelier` → `atelier-artisan`.

| Famille | Types (id) | Ticket moyen par défaut (estimation, modifiable) | Formule recommandée |
|---|---|---|---|
| Boire et manger | `cafe` 6 €, `coffee` 6 €, `bar` 10 €, `cave` 15 €, `restaurant` 12 € | entre parenthèses | 1 (+ 2 pour coffee et cave, + 6 pour bar) |
| Livres, disques, art | `librairie` 5 € (si café), `disquaire` 0, `galerie` 0 | | 2, 6 |
| Faire et bouger | `atelier-artisan`, `studio-musique`, `studio-danse`, `salle-sport`, `fablab` | 0 | 3 |
| Commerces | `boutique-materiel` (panier lié 30 €) | | 2 |
| Accueillir | `hotel`, `coworking`, `entreprise` | 0 | 4 |
| Lieux publics et associatifs | `tiers-lieu` 5 €, `mediatheque`, `mjc` | 0 | 7 (+ 1 et 6 pour tiers-lieu) |

`C.VENUE_TYPES = [[id, label, famille, ticket, formulesRecommandées, pitch]]` : le **pitch en trois phrases** de chaque type est celui du tableau de l'étude (§ 06c, « Par type de lieu »), copié tel quel.

**Formules** : `C.VENUE_FORMULAS` passe de 3 à 7 objets :

```js
{ id: 'creuse', n: 1, label: 'Heure creuse contre consommation', gives: '…', gets: '…', platform: 'Ne paie rien, ne touche rien', engagement: 'Aucun, créneau fermable sous 7 jours', kpis: ['remplissage', 'consommations par participant', 'premières visites'], paid: false, from: 1 }
{ id: 'membre',    n: 2, label: 'Avantage membre et ventes liées', … , from: 1 }
{ id: 'recette',   n: 3, label: 'Partage de recette', shareSeat: 4, shareMin: 15, from: 1 }
{ id: 'programme', n: 4, label: 'Programme commandé', priceHT: 200, from: 7, paid: true }
{ id: 'une',       n: 5, label: 'Lieu à la une', priceHT: 39, from: 10, paid: true }
{ id: 'soiree',    n: 6, label: 'Soirée découverte co-organisée', ticketTTC: 12, people: 30, barPerHead: 10, from: 4 }
{ id: 'public',    n: 7, label: 'Programme public', priceHT: 3000, per: 'trimestre', sessions: 6, from: 13 }
```

Textes `gives`, `gets`, `platform`, `engagement` : ceux des cartes de l'étude (§ 06c, « Sept formules »). Une fiche peut cocher **plusieurs formules** (`v.formulas: []`, migration depuis `v.formula`).

**Lieux de démonstration** (`js/data/venues.js`) : 6 lieux **fictifs**, marqués `demo: true` et toujours libellés « lieu fictif de démonstration » (un café du 11e, un bar du 10e, un studio de musique du 20e, une librairie-café du 3e, une boutique de loisirs créatifs du 18e, une médiathèque du 12e), avec type, créneaux, équipements, formules, coordonnées approximatives d'arrondissement. Aucun nom de commerce réel.

### 2.2 Simulateur de gain (`C.venueGain(v, f)`, pur)

Remplace `C.venueEstimate` (garder l'ancien nom comme alias). Entrées éditables dans l'écran, avec valeurs par défaut issues du type :

- créneaux par semaine (depuis la grille, plafonné à 10), participants par séance (2 à 8, défaut 4), hôte compté comme consommateur (oui par défaut), ticket moyen, marge brute (70 % boissons, 35 % ventes de matériel, défaut selon le type), part de premières visites (35 %), taux de retour des nouveaux (défaut 20 %, « à mesurer »), visites par mois d'un client revenu (2).

Sorties par formule cochée, sur un mois (4,33 semaines) :

| Formule | Calcul |
|---|---|
| 1 | CA = séances × (participants + hôte) × ticket ; marge = CA × marge brute |
| 2 | CA ventes liées = séances × participants × 25 % × panier |
| 3 | versement = séances × max(4 € × participants, 15 €) |
| 4 | coût pour le lieu = séances commandées × 200 € HT (affiché en coût, avec « ce que vous recevez » en texte) |
| 5 | coût 39 € HT par mois ; seuil de rentabilité affiché : « rentable si 1 client fidèle par mois » |
| 6 | CA bar = 30 × 10 € par soirée (1 par mois par défaut) |
| 7 | coût 3 000 € HT par trimestre, 6 ateliers, public estimé = 6 × jauge × remplissage |

Plus une ligne **« valeur des nouveaux clients sur 6 mois »** = premières visites × taux de retour × visites par mois × 6 × ticket, clairement marquée « hypothèse à mesurer ». Toutes les valeurs par défaut portent un badge `estimation` (sable) ou `hypothèse` (cobalt), comme dans l'étude.

Affichage : rangée de compteurs (séances, participants, CA additionnel, marge), puis un **graphique de barres horizontales** CA et marge par formule cochée (SVG, `charts.js`), puis un tableau « Hypothèses » repliable. Un bouton « Comparer les formules » affiche les 7 côte à côte pour ce lieu (barres grisées pour celles qui ne s'appliquent pas au type).

### 2.3 Écran `#/lieu` réorganisé en 4 étapes

Garder une seule page avec une barre d'étapes (comme le bilan), pour que le gérant voie tout :

1. **Votre lieu** : nom, ville, arrondissement, type (19 chips en 6 familles), capacité, équipements. Dès que le type est choisi, encart « Pourquoi des séances chez vous » avec le pitch en trois phrases du type.
2. **Vos heures creuses** : grille 7 × 3 existante, plus « nombre de séances par créneau » (1 par défaut).
3. **Ce que vous y gagnez** : formule recommandée cochée par défaut (`formulesRecommandées[0]`), cartes des 7 formules (cochables, celles qui ne démarrent pas encore portent « à partir de M10 » etc.), simulateur de gain (2.2), compétences compatibles (`C.venueMatch` existant, 10 au plus, avec « en 1 h : levels[0] »).
4. **Devenir partenaire** : aperçu de la **fiche partenaire enrichie** (2.4), de la **charte** (2.5), du **kit** (2.6), e-mail facultatif, consentement non coché, « Inscrire mon lieu » (inchangé : `C.waitlist.add` rôle `lieu`, avec `venue.formulas` et `venue.gain` résumé).

**Mode présentation** : `#/lieu/pitch` affiche les mêmes données en plein écran, 4 diapositives (le principe, ce que vous gagnez avec ses chiffres, comment ça marche en 5 étapes, la charte), navigation ← → et balayage, gros caractères (Marcellus 32 px pour les titres, chiffres mono 40 px). Sert au fondateur sur tablette ou téléphone pendant la prospection. Bouton « Présenter » dans l'étape 3.

### 2.4 Fiche partenaire enrichie

- **Aperçu à l'écran** (panneau) : nom, type, quartier, badge formule(s), créneaux en clair (« mar. après-midi, jeu. soir »), équipements, 6 séances possibles avec résultat en une heure, « Ce que les participants s'engagent à faire » (consommation minimale, ponctualité, rangement), mention « lieu fictif de démonstration » si `demo`.
- **Téléchargement** : page HTML autonome d'un seul fichier (même technique que le passeport, `js/engine/export.js`), imprimable en A4, et la version texte actuelle. Nom de fichier `cordes-lieu-<slug>.html`.

### 2.5 Charte partenaire

`C.venueCharter(v) → texte` : les 10 clauses de l'étude (§ 06c, « Le contrat : une charte d'une page »), remplies avec les créneaux, la ou les formules et leurs montants, date du jour, durée 12 mois. Téléchargeable en `.txt` et en HTML imprimable avec deux zones de signature vides. Mention en pied : « Modèle indicatif, à faire relire par un juriste avant usage. »

### 2.6 Kit de communication du lieu

Généré par gabarits (IA facultative via `window.claude.use('sample')` ou la clé, bouton « Réécrire », repli gabarit) :

- **Affiche A4** et **chevalet de table A6** (Canvas → PNG, et HTML imprimable) : « Ici, on apprend en une heure », 3 séances compatibles, créneaux, lien court du lieu (`C.PUBLIC_URL + '#/l/' + slug`, ou texte « cordes · <nom du lieu> » si la constante est vide). QR code : seulement si un encodeur local sans dépendance est ajouté dans `app/js/vendor/` (licence MIT, < 25 ko) ; sinon pas de QR, aucun appel réseau.
- **3 posts** pour ses réseaux (annonce, coulisses d'une séance, résultat), **1 story** (Canvas 1080 × 1920), **1 message** à ses clients habitués.
- Bouton « Tout télécharger » : enchaîne les téléchargements via `C.download` (une archive n'est pas nécessaire).

### 2.7 Mise en avant des lieux dans l'app

- **Idées à vivre** (section 1) : pour une idée `out`, si un lieu (de démo ou inscrit sur l'appareil) a l'équipement et l'univers compatibles (`C.venueMatch` inversé : `C.venuesFor(skillId, zone)`), afficher « À faire chez Café des Volontaires · 11e · lieu fictif de démonstration » sous l'idée, avec ouverture de la fiche.
- **Résultats du bilan** : dans « Où apprendre », bloc « Lieux partenaires près de chez vous » (au plus 3, démo signalée).
- **Liste d'attente et compteur de quartier** : « 2 lieux prêts dans le 11e » à côté du compteur d'inscrits, rappel du seuil d'ouverture (150 inscrits, 8 hôtes, 2 lieux, 3 envies récurrentes, étude § 05).
- **Accueil** : la tuile « Proposer un lieu » devient « Votre lieu, vos heures creuses · simuler le gain ».
- **Route publique** `#/l/<slug>` : fiche d'un lieu (démo ou local), cible des liens du kit.

### 2.8 Mesure

`venue_type {t}`, `venue_formula {f}`, `venue_sim_edit {k}`, `venue_compare`, `venue_pitch_open`, `venue_pitch_slide {n}`, `venue_sheet_dl {fmt}`, `venue_charter_dl`, `venue_kit_dl {item}`, `venue_join {formulas}`, `venue_card_click {id, from}`. Entonnoir lieu dans `#/admin/metrics` : type choisi → créneaux → simulateur vu → kit ou charte téléchargé → inscription.

### 2.9 Tests à prévoir

**Moteur**
- `C.venueGain` : valeurs de l'étude retrouvées avec les défauts (café 1 créneau : CA 130 €, marge 91 € ; bar 217 € et 152 € ; cave 325 € et 227 € ; studio 69 € ; boutique 130 € et 45 € ; soirée 300 € et 210 €), arrondis à l'euro ; 0 créneau → 0 partout sans erreur ; participants bornés à 2-8.
- Migration : une fiche v1 (`type: 'studio'`, `formula: 'recette'`) se charge en `studio-musique` ou `studio-danse` et `formulas: ['recette']`.
- `C.venueCharter` : contient les 10 clauses, les créneaux et les montants ; aucun `undefined`.
- Chaque type a un pitch de trois phrases (compter les points), une formule recommandée valide, un ticket numérique.
- `C.venuesFor` : ne renvoie jamais un lieu dont l'équipement exclut la compétence (règles de `C.venueMatch`), signale `demo`.

**Bout en bout (375 et 1440 px, `file://`, 0 erreur console)**
- Parcours complet d'un bar : type, 3 créneaux, formules 1 et 6, simulateur (modifier le ticket met à jour CA et graphique), comparer, présenter (4 diapositives au clavier), télécharger fiche HTML, charte, affiche PNG, inscription.
- Mode page publiée : téléchargements routés par `window.claude.use('downloads')`, aucun `fetch`.
- Idées à vivre « amis » : au moins une idée affiche « À faire chez … · lieu fictif de démonstration ».
- Aucun débordement horizontal à 375 px dans le mode présentation et le simulateur.

### 2.10 Hors périmètre

Signature électronique, paiement des formules 4, 5 et 7, versements de la formule 3, rapport mensuel automatique : ils supposent un service central (plateforme, temps 2). Le prototype produit les documents et la fiche, pas les flux d'argent.

