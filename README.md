# Débat Royale

*Que le meilleur programme gagne.*

Jeu de combat-débat au tour par tour, à usage privé : les candidats à la présidentielle 2027 s'affrontent sur un plateau télé façon TF1, modéré par Gilles Bouleau. Chaque attaque est une vraie mesure de programme, chaque question est sourcée. Mieux tu connais les programmes, plus tu fais mal.

---

## Mettre le jeu en ligne (GitHub puis Vercel)

Pas besoin d'installer quoi que ce soit sur ton ordinateur : Vercel construit le jeu tout seul.

### 1. Déposer le code sur GitHub
1. Crée un compte sur https://github.com si tu n'en as pas.
2. En haut à droite, **+ → New repository**. Nom : `debat-royale`. Coche **Private** (le jeu est à usage privé). Clique **Create repository**.
3. Sur la page du dépôt vide, clique le lien **uploading an existing file**.
4. Ouvre le dossier `debat-royale` sur ton ordinateur, sélectionne **tout son contenu** (pas le dossier lui-même : les fichiers et dossiers qu'il contient, dont `src`, `public`, `package.json`, `index.html`…) et glisse-le dans la page.
5. Clique **Commit changes**.

### 2. Publier avec Vercel
1. Va sur https://vercel.com et connecte-toi **avec ton compte GitHub**.
2. **Add New… → Project**, choisis le dépôt `debat-royale`, clique **Import**.
3. Vercel détecte **Vite** tout seul. Ne change rien. Clique **Deploy**.
4. Au bout d'une minute environ, Vercel te donne l'adresse du jeu (`https://debat-royale-xxxx.vercel.app`).

Chaque fois que tu modifies un fichier sur GitHub, Vercel republie le jeu automatiquement.

---

## Ajouter les images des personnages

Tant qu'une image manque, le jeu affiche une silhouette colorée avec les initiales : rien ne bloque. Les fichiers peuvent être en `.webp` ou en `.png`. **Le guide complet, avec des prompts prêts à l'emploi, est dans `IMAGES_A_GENERER.md`.** Le décor peint du plateau se dépose dans `public/decor/plateau.png`. Pour ajouter tes illustrations, dépose-les dans le dossier `public/` (sur GitHub : ouvre le dossier, puis **Add file → Upload files**) avec exactement ces noms :

| Quoi | Dossier | Nom du fichier | Taille |
|---|---|---|---|
| Portrait d'un candidat | `public/persos/` | `<id>-portrait.webp` (ex. `le-pen-portrait.webp`) | 512 × 512 |
| Candidat en pied | `public/persos/` | `<id>-pied.webp` | 1024 × 1280, fond transparent |
| Carte de légende | `public/legendes/` | `<id>-carte.webp` (ex. `macron-carte.webp`) | 768 × 1024 |
| Intervenant | `public/intervenants/` | `praud.webp`, `hanouna.webp` | en pied, fond transparent |
| Gilles Bouleau à son bureau | `public/decor/` | `bouleau-bureau.webp` | fond transparent |
| Sons (facultatif) | `public/sons/` | `ovation.mp3`, `alarme.mp3`, `foule.mp3`… | — |

Les identifiants (`<id>`) sont ceux des fichiers de `src/data/candidats/` et de `src/data/legendes.json` : `le-pen`, `melenchon`, `philippe`, `attal`, `glucksmann`, `retailleau`, `bertrand`, `zemmour`, `tondelier`, `roussel`, `ruffin`, `dupont-aignan`, `macron`, `hollande`, etc. Sans fichier son, le jeu joue de petits sons de synthèse.

---

## Le contenu (programmes, questions, citations)

Tout le contenu est dans `src/data/`, en JSON :

| Fichier | Contenu |
|---|---|
| `candidats/<id>.json` | fiche du candidat, surnom, couleur, réplique d'entrée, 3 arguments + 1 ultime par sujet |
| `programmes/<id>.json` | mesures par sujet, avec source, millésime (2027 ou 2022) et date de vérification |
| `questions/<id>.json` | questions écrites à la main (programme, parcours, moments cultes) |
| `legendes.json` | 17 légendes invocables, avec effet, rareté et questions |
| `refs.json` | vraies citations collectionnables (bonus de dégâts) |
| `chaos.json` | 19 cartes chaos : effets + animation décrite en données |
| `sujets.json`, `moderateur.json` | les 8 sujets et les répliques de jeu du modérateur |
| `urnes.json`, `plateaux.json`, `boutique.json`, `tenues.json` | économie |

**Règles :**
- Aucune mesure, aucun chiffre, aucune citation sans source. Une entrée avec `"statut": "a_completer"` ou sans source est **masquée** par le jeu.
- Le jeu fabrique aussi des questions automatiquement à partir des mesures sourcées (« Quel candidat propose… ? », « Que propose X ? », « Laquelle de ces mesures X ne propose pas ? »). Les pièges sont de vraies propositions d'autres candidats.
- `A_COMPLETER.md` liste ce qui manque.
- Les répliques du modérateur sont des textes de jeu, pas des citations de Gilles Bouleau.

**Ajouter un candidat :** créer `candidats/<id>.json`, `programmes/<id>.json` et `questions/<id>.json` sur le modèle des autres. Il apparaît tout seul dans la sélection dès qu'il a au moins un sujet sourcé.
**Ajouter une carte chaos :** ajouter un objet dans `chaos.json` (effets + `scene`) et, si besoin, une image dans `public/intervenants/`. Le composant `ChaosScene` la jouera sans autre code.

---

## Comment jouer

1. Premier lancement : tutoriel, débat guidé, puis dépouillement de 3 urnes de départ (500 Paluches, 20 Parrainages offerts).
2. **Jouer** → débat ciblé (1 sujet, 3 manches) ou général (4 sujets tirés au sort) → choisis ton candidat et ton adversaire → ton deck (2 légendes, 3 cartes chaos, 3 refs) → débat !
3. À chaque tour : choisis un argument, réponds à la question en 12 s. Bonne réponse = dégâts (bonus de rapidité, combo, programme adverse, refs). Mauvaise réponse = −4 PV.
4. Jauges : **Super** (ultime), **Invocation** (légende), **Ambiance** (carte chaos, question sur le programme adverse ; ratée = −15 PV pour toi).

---

## Pour les développeurs

```bash
npm install
npm run dev        # serveur local
npm test           # tests du moteur (Vitest) + vérification du contenu
npm run typecheck  # vérification TypeScript
npm run build      # build de production (dossier dist/)
```

**Architecture**
- `src/moteur/` : TypeScript pur, sans React. `combat.ts` est un reducer `reduire(etat, action, catalogue)` déterministe (aléatoire à graine), réutilisable côté serveur pour le futur duel en ligne et le défi du jour. Tests : `*.test.ts`.
- `src/scenes/` : plateau en couches, public animé, moteur de particules canvas, `ChaosScene` générique piloté par `chaos.json`.
- `src/ecrans/` : Accueil, Tutoriel, ChoixDebat, Selection, Deck, Combat, Fin, Programmes (fiches, comparateur, entraînement), Collection, Boutique, Depouillement.
- `src/sauvegarde.ts` : sauvegarde dans `localStorage`, derrière une interface `Stockage` pour passer plus tard à un compte (Supabase).
- `src/lib/paiement.ts` : achats **simulés** (mode démo). Pour un vrai paiement : implémenter `Paiement` avec une fonction serveur Vercel (`/api/checkout`) créant une session Stripe Checkout, et créditer le compte via un webhook. L'économie (`moteur/economie.ts`) ne change pas.

**Équilibrage** (`src/moteur/constantes.ts`) : 100 PV pour tous, puissances 14/16/18 et ultime 32 pour tous, chrono 12 s, IA à 60/70/80 % selon le plateau. Seules les refs équipées changent les dégâts, et seulement sur une bonne réponse.
