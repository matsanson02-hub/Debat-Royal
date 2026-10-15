# Images à générer pour Débat Royale

Le jeu affiche les illustrations qu'on lui fournit. Je ne peux pas dessiner moi-même les personnalités : il faut les générer avec le même outil que tes maquettes, puis me les envoyer.

## Ce qui est déjà en place

- **Portraits provisoires** de 28 personnages, découpés dans tes maquettes (`public/persos/<id>-portrait.png`). Ils sont petits (environ 140 px) et parfois coupés : à remplacer par de vraies images.
- **Il manque complètement** : Bruno Retailleau, François Ruffin et Marine Tondelier (ils apparaissent en silhouette).
- **Personnages détourés pour le plateau** (`<id>-pied.png`), tirés de ta planche « Tous les légendaires » : Le Pen, Mélenchon, Zemmour, Dupont-Aignan, Roussel et 16 légendes. Sur le plateau, ils apparaissent derrière un pupitre à leur nom.
- **Sans version détourée** (montrés en grand portrait encadré sur le plateau) : Attal, Bertrand, Glucksmann, Philippe, Retailleau, Ruffin, Tondelier. Ce sont les images en pied à générer en priorité.
- **Pas de décor peint** : le plateau est dessiné en CSS. Avec l'image de décor, il aura exactement le rendu de ta maquette.

## Comment me les donner

Le plus simple : **glisse les images directement dans la conversation**, en me disant de qui il s'agit. Je les découpe, les nomme et les intègre au jeu. PNG ou WebP, peu importe.

Si tu préfères les déposer toi-même sur GitHub : dossier `public/persos/` (ou `public/decor/`, `public/intervenants/`), avec les noms exacts ci-dessous.

---

## 1. Le style commun (à coller au début de chaque prompt)

> Illustration cartoon style « chibi » de jeu mobile, très colorée, caricature bon enfant et reconnaissable, grosse tête expressive, contours noirs épais, couleurs vives et saturées, ombrage cel-shading, éclairage de plateau TV, style identique aux images précédentes de la série « Débat Royale ». Aucun texte, aucun logo, aucune bulle de dialogue dans l'image.

Garde la même conversation dans ton outil pour que tous les personnages aient le même style.

## 2. Portrait carré (un par personnage)

**Fichier :** `<id>-portrait.png` · **format** 1024 × 1024

> [style commun] Portrait en buste de **[NOM]**, de face, légèrement de trois quarts, expression **[EXPRESSION]**, fond uni dégradé **[COULEUR]**, un accessoire symbolique discret à côté : **[ACCESSOIRE]**. Cadrage serré, visage bien centré, épaules visibles.

## 3. Personnage en pied (pour le plateau de combat)

**Fichier :** `<id>-pied.png` · **format** 1024 × 1280 · **fond transparent**

> [style commun] **[NOM]** en pied, corps entier de la tête aux chaussures, en pose de combat dynamique tournée **vers la droite** (pointe du doigt, poing levé ou bras croisés), expression **[EXPRESSION]**, costume habituel, **fond transparent** (PNG sans arrière-plan), aucune ombre au sol, aucun texte sur les vêtements.

Une seule orientation suffit : le jeu retourne l'image pour le camp adverse. C'est pour ça qu'il ne faut pas de texte sur les vêtements.

## 4. Le décor du plateau

**Fichier :** `public/decor/plateau.png` · **format** 1536 × 1024

> [style commun] Plateau de télévision d'un grand débat présidentiel français, vu de face, **sans aucun personnage au premier plan ni au centre**. Au fond, un grand écran bleu « LE GRAND DÉBAT PRÉSIDENTIEL » avec des drapeaux tricolores, une rampe de projecteurs, des faisceaux de lumière. À gauche, une ambiance bleue ; à droite, une ambiance rose et rouge. Des gradins de public avec des pancartes sur les deux côtés, deux pupitres en arrière-plan, un sol circulaire lumineux au centre. Le bas de l'image doit rester sombre et dégagé (l'interface s'y affiche). Aucun logo de chaîne réelle.

## 5. Le modérateur et les intervenants

| Fichier | Prompt (après le style commun) |
|---|---|
| `public/decor/bouleau-pied.png` | ✅ déjà intégré (Gilles Bouleau debout, micro en main) |
| `public/intervenants/praud.png` | Pascal Praud en pied qui entre en trombe en levant les bras, fond transparent |
| `public/intervenants/hanouna.png` | Cyril Hanouna en pied, bras écartés, ambiance show, fond transparent |

## 6. La liste des personnages

Remplace **[COULEUR]** par la couleur indiquée. Choisis librement l'expression et l'accessoire (tes maquettes en donnent de bonnes idées), en restant bon enfant pour tout le monde.

### Candidats (prioritaires : portrait + en pied)

| id | Nom | Couleur de fond | Statut actuel |
|---|---|---|---|
| `attal` | Gabriel Attal | jaune | portrait provisoire |
| `bertrand` | Xavier Bertrand | bleu | portrait provisoire |
| `dupont-aignan` | Nicolas Dupont-Aignan | bleu marine | portrait provisoire |
| `glucksmann` | Raphaël Glucksmann | rose | portrait provisoire |
| `le-pen` | Marine Le Pen | bleu foncé | portrait provisoire |
| `melenchon` | Jean-Luc Mélenchon | rouge | portrait provisoire |
| `philippe` | Édouard Philippe | bleu ciel | portrait provisoire |
| `retailleau` | Bruno Retailleau | bleu | **manquant** |
| `roussel` | Fabien Roussel | rouge vif | portrait provisoire |
| `ruffin` | François Ruffin | orange | **manquant** |
| `tondelier` | Marine Tondelier | vert | **manquant** |
| `zemmour` | Éric Zemmour | bleu nuit | portrait provisoire |

### Légendes (portrait seulement, ou carte 768 × 1024 nommée `public/legendes/<id>-carte.png`)

`macron` Emmanuel Macron · `hollande` François Hollande · `sarkozy` Nicolas Sarkozy · `dati` Rachida Dati · `bardella` Jordan Bardella · `juppe` Alain Juppé · `royal` Ségolène Royal · `strauss-kahn` Dominique Strauss-Kahn · `bayrou` François Bayrou · `hidalgo` Anne Hidalgo · `pecresse` Valérie Pécresse · `valls` Manuel Valls · `hamon` Benoît Hamon · `poutou` Philippe Poutou · `lassalle` Jean Lassalle · `loiseau` Nathalie Loiseau · `lavrilleux` Jérôme Lavrilleux

Elles ont toutes un portrait provisoire tiré de ta maquette.

## Ordre conseillé

1. Les 3 portraits manquants (Retailleau, Ruffin, Tondelier).
2. Le décor du plateau.
3. Les 12 candidats en pied : c'est ce qui donnera le rendu de ta maquette de combat.
4. Les portraits en haute définition, pour remplacer les découpes provisoires.
5. Le modérateur et les intervenants.
