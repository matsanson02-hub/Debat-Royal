# À compléter

Le jeu masque automatiquement tout ce qui est marqué `a_completer` ou n'a pas de source : rien d'inventé n'est affiché. Cette liste dit quoi chercher pour compléter le contenu. État au 14 octobre 2026.

## Bilan du contenu

| Candidat | Mesures sourcées | Questions écrites | Statut |
|---|---|---|---|
| Gabriel Attal | 29/32 | 18 | déclaré |
| Xavier Bertrand | 27/32 | 16 | à vérifier (« Je le serai », sans déclaration officielle) |
| Nicolas Dupont-Aignan | 32/32 | 16 | déclaré |
| Raphaël Glucksmann | 24/32 | 16 | déclaré |
| Marine Le Pen | 32/32 | 18 | déclarée |
| Jean-Luc Mélenchon | 32/32 | 17 | déclaré |
| Édouard Philippe | 32/32 | 17 | déclaré |
| Bruno Retailleau | 28/32 | 17 | déclaré |
| Fabien Roussel | 30/32 | 17 | déclaré |
| François Ruffin | 27/32 | 17 | déclaré |
| Marine Tondelier | 25/32 | 16 | déclarée (vote des adhérents du 10 au 13 décembre 2026) |
| Éric Zemmour | 32/32 | 17 | déclaré |

En plus : 17 légendes (85 questions), 47 refs (vraies citations) et les questions générées automatiquement à partir des mesures.

## À revérifier en priorité

- **Programmes 2027 pas encore publiés.** Beaucoup de mesures viennent encore des programmes 2022 (affichées « Programme 2022 » dans le jeu) : Mélenchon (nouvelle édition annoncée pour le 6/11/2026), Le Pen et Zemmour (presque tout en 2022), Bertrand (projet de 2021). À mettre à jour dès la sortie des programmes.
- **Positions qui ont pu changer.** Le Pen et la sortie du commandement intégré de l'OTAN (position de 2022 ; Bardella s'y est dit opposé en 2025). Dupont-Aignan sur l'âge de départ (son site et l'AFP divergent). Roussel et Ruffin sur le montant du SMIC.
- **Sources fragiles à remplacer par un grand média :** Epoch Times (Retailleau droit du sol, Dupont-Aignan AFP du 20/09/2026), Senioractu (Glucksmann retraites), Vudailleurs.com (Zemmour OTAN), ECOinfos (Tondelier énergie), un article du JDD non ouvert (Attal permis à points).
- **Questions de parcours des légendes et des candidats :** elles s'appuient souvent sur Wikipédia. Une relecture rapide est conseillée.
- **Dates approximatives :** certaines sources n'ont qu'un mois ou une année ; la date du 1er tour ou la date de consultation a alors été utilisée.
- **Refs :** les dates des slogans sont celles du scrutin, pas du lancement du slogan. Aucune ref vérifiée mot pour mot pour Dominique Strauss-Kahn ni Jérôme Lavrilleux.
- **Répliques d'entrée absentes** (la légende entre sans citation) : Dati, Bardella, Juppé, Strauss-Kahn, Poutou, Lassalle, Lavrilleux.

## Répliques cultes ajoutées à la demande

Certaines répliques de la maquette ont été ajoutées comme « classiques » même sans source officielle. Elles portent l'étiquette **MÈME** dans le jeu :
- « Je vais t'attraper, rouquin ! » (Jean-Marie Le Pen) : formulation populaire. Les mots rapportés en 1997 sont « Je vais te faire courir, moi, rouquin… ».
- « Il faut un cap clair » (Glucksmann), « Ils sont dans les campagnes… » et « C'est la honte ! » (Le Pen), « On va itou » (Macron) : aucune trace trouvée. Ce sont des répliques de jeu, signalées comme non sourcées.
- Vérifiées et sourcées : « La République, c'est moi ! » (Mélenchon, 2018), « For sure » (Macron, Davos 2026), « …une double ration de frites » (Sarkozy, 2016), « je traverse la rue, je vous en trouve » (Macron, 2018).

## Candidats pas encore ajoutés

Ajouts suivants prévus par le prompt : Nathalie Arthaud, David Lisnard, Delphine Batho, Florian Philippot, Bernard Cazeneuve. Statut à vérifier : François Asselineau, Laurent Wauquiez. Pour chacun, créer `candidats/<id>.json`, `programmes/<id>.json` et `questions/<id>.json` sur le modèle des autres (voir le README). La liste officielle du Conseil constitutionnel est attendue en mars 2027.

## Détail par candidat


# À compléter / à mettre à jour — groupe A (le-pen, melenchon, philippe)

Aucune mesure n'est en statut `a_completer` : les 96 mesures sont `ok`. Les lignes ci-dessous signalent les mesures à mettre à jour en millésime 2027 dès que les sources seront disponibles.

- melenchon / tous sujets / melenchon-*-* : les 32 mesures viennent du programme 2022 (laec.fr, éd. novembre 2021). L'édition 2025 de L'Avenir en commun (melenchon2027.fr/programme2025/livre/chapitreN) renvoie une erreur 404 au 14/10/2026 ; une nouvelle édition (6 chapitres) est annoncée pour le 6 novembre 2026 (LCP). À revérifier en novembre 2026, notamment le montant du SMIC (1 400 € nets en 2022 ; certains agrégateurs citent 1 600 € pour la version actuelle, chiffre non vérifié).
- melenchon / tous sujets / melenchon-*-* : le champ `source.date` « 2021-11-01 » est approximatif (seul le mois de l'édition, novembre 2021, est connu). À remplacer par la date exacte de parution du livre-programme (éd. du Seuil).
- le-pen / education, retraites, pouvoir-achat, sante, securite / le-pen-*-* : mesures de millésime 2022 (mlafrance.fr, « 22 mesures pour 2022 »). Le programme 2027 complet du RN n'est pas publié ; seuls le logement et la priorité nationale ont été détaillés (franceinfo, 13/09/2026). À mettre à jour à la publication du programme, notamment pour les retraites (abrogation de la réforme de 2023, à sourcer).
- le-pen / tous sujets / le-pen-*-* : le champ `source.date` « 2022-04-10 » (date du 1er tour) est approximatif pour la page programme mlafrance.fr. Chercher la date de publication des « 22 mesures » (PDF mlafrance.fr/pdfs/22-mesures-pour-2022.pdf).
- le-pen / europe / le-pen-europe-3 : sortie du commandement intégré de l'OTAN = position 2022 (conférence du 13/04/2022). En 2025, Jordan Bardella s'est dit contre une telle sortie tant que la guerre en Ukraine dure (Europe 1). Vérifier la position 2027 de Marine Le Pen.
- philippe / sante / philippe-sante-1..u : le site de campagne contient peu de mesures sur le soin (hôpital, déserts médicaux). Les mesures retenues portent sur les arrêts maladie, la prévention et la santé mentale à l'école. Chercher l'entretien santé de mai 2026 (cité par L'Argus de l'assurance, accès 403) et l'interview BFMTV du 30/08/2026 (AME maintenue sous forme contrôlée).
- philippe / tous sujets / philippe-*-* : le champ `source.date` « 2026-10-14 » est la date de consultation du site edouardphilippe.fr (aucune date de publication n'y figure).

# Groupe B — mesures à compléter (attal, glucksmann, retailleau)

- attal / pouvoir-achat / attal-pouvoir-achat-2 : autre mesure pouvoir d'achat sourcée (ex. objectif de salaire médian à 3 000 €, droit opposable à la garde d'enfant : seulement relayés par presseagence.fr) ; chercher le document Renaissance « Pour une nouvelle donne économique et climatique » ou un grand média
- attal / pouvoir-achat / attal-pouvoir-achat-3 : idem ; vérifier aussi la « désmicardisation » (Europe 1, 2024) dans une source accessible
- attal / sante / attal-sante-3 : mesure santé 2027 (plan santé mentale des jeunes, « assistant médical souverain » annoncés au meeting de Lyon du 10/10/2026) : trouver un compte rendu d'un grand média
- glucksmann / retraites / glucksmann-retraites-3 : pas de 3e mesure retraites sourcée (pensions décentes, parcours hachés : non chiffrés) ; attendre le programme de mandat annoncé après la primaire
- glucksmann / immigration / glucksmann-immigration-3 : pas de 3e mesure immigration nationale sourcée ; vérifier le programme présidentiel (post-primaire) et le livre « Nous avons encore envie »
- glucksmann / sante / glucksmann-sante-1 : idem
- glucksmann / sante / glucksmann-sante-2 : idem
- glucksmann / sante / glucksmann-sante-3 : idem ; le programme européen 2024 (PDF « Réveiller l'Europe », 338 mesures) a peut-être un volet santé (médicaments) : non accessible
- glucksmann / sante / glucksmann-sante-u : aucune proposition santé trouvée dans un grand média (hôpital, déserts médicaux, santé mentale seulement sur des agrégateurs type wikiglucksmann.fr / France-Vote) ; chercher programme officiel, Argus de l'assurance « Spécial Reavie » (accès payant), APMnews
- glucksmann / securite / glucksmann-securite-2 : police de proximité, plan contre les violences sexistes (1 Md€) : seulement sur des agrégateurs ; chercher le chapitre « La sécurité n'est pas un thème de droite » du livre de 2026
- glucksmann / securite / glucksmann-securite-3 : idem
- retailleau / sante / retailleau-sante-1 : aucune proposition santé 2026 trouvée hors jour de carence (propositions hôpital/4e année de médecine de 2022 écartées car antérieures à la candidature) ; chercher programme santé LR 2027 / interviews
- retailleau / sante / retailleau-sante-2 : idem (déserts médicaux, hôpital) ; consulter republicains.fr et la presse santé (APMnews, Quotidien du médecin)
- retailleau / sante / retailleau-sante-3 : idem
- retailleau / europe / retailleau-europe-3 : position sur Schengen / pacte asile-migration ou défense européenne et Ukraine : seulement trouvée sur des agrégateurs ; vérifier dans l'entretien au Monde (septembre 2026) ou un discours

# À compléter — groupe C (Bertrand, Zemmour, Tondelier)

Vérifié le 2026-10-14.

## bertrand
- bertrand / education / bertrand-education-3 : aucune 3e proposition éducative sourcée (le projet 2027 n'est pas publié). Chercher dans sa déclaration de candidature attendue fin 2026 et sur nousfrance.fr (rubrique « Agir pour notre jeunesse »).
- bertrand / retraites / bertrand-retraites-2 : pas d'autre mesure retraites sourcée depuis 2021 (sa contre-proposition de 2019 évoquait une pension minimale de 1 000 €, non vérifiée). Chercher Le Point (25/03/2021), JDD, et son projet 2027.
- bertrand / retraites / bertrand-retraites-3 : idem ; modalités de la capitalisation non détaillées (Contexte, 11/05/2026, réservé aux abonnés).
- bertrand / sante / bertrand-sante-2 : tribune santé dans L'Express (2021, gouvernance « davantage médicale », hausse du nombre de médecins formés) non consultée directement. Retrouver la tribune et sa date.
- bertrand / sante / bertrand-sante-3 : « grande loi pluriannuelle de santé » évoquée dans Le Parisien (janvier 2026, republié sur nousfrance.fr) mais date exacte introuvable. Retrouver l'article original du Parisien.

## zemmour
- Aucun manque : les 32 mesures sont sourcées. Point d'attention : 31 mesures viennent du programme 2022 (millésime 2022) ou de propos de 2021, et une seule de 2027 (expulsion après un an sans emploi). À mettre à jour quand Reconquête publiera son programme 2027.

## tondelier
- tondelier / retraites / tondelier-retraites-1 : financement (retour sur une partie des exonérations de cotisations, cité par des agrégateurs) non vérifié. Chercher le programme des Écologistes du 13/07/2026 (lesecologistes.fr) et L'Opinion (13/07/2026).
- tondelier / retraites / tondelier-retraites-2 : objectif « retour final à 60 ans » attribué par France-Vote à L'Opinion (13/07/2026), non vérifié. Même piste.
- tondelier / retraites / tondelier-retraites-3 : pénibilité / semaine de 32 h pour métiers pénibles (fiches candidats non datées). Chercher le programme officiel ou CNews (02/10/2026).
- tondelier / immigration / tondelier-immigration-2 : voies légales de migration, refus des quotas (fiches candidats non sourcées). Chercher le programme 2027 des Écologistes.
- tondelier / immigration / tondelier-immigration-3 : abrogation de la loi immigration (Europe 1, juillet 2024, page inaccessible). Retrouver l'extrait Europe 1 et sa date.
- tondelier / europe / tondelier-europe-2 : hausse du budget de défense / « bond en avant » de l'UE (message X du 5 mars 2025 environ, non consultable). Retrouver une source presse.
- tondelier / europe / tondelier-europe-3 : opposition au traité UE-Mercosur (communiqué des Écologistes du 09/01/2026 cité par France-Vote, introuvable). Chercher sur lesecologistes.fr.

# À compléter — groupe D (Roussel, Ruffin, Dupont-Aignan)

## roussel
- roussel / immigration / roussel-immigration-2 : aucune autre proposition précise et sourcée trouvée (au-delà de la régularisation des travailleurs sans papiers et de la fermeture des CRA). Chercher dans le programme 2027 du PCF quand il sera publié, l'interview BFMTV de juin 2026 sur l'immigration, ou le livret « La France des Jours heureux » 2022 (PDF officiel, chapitre immigration/asile).
- roussel / immigration / roussel-immigration-3 : idem ; vérifier aussi ses déclarations de décembre 2023 sur la loi immigration (Europe 1, « consensus républicain », non consultable).

## ruffin
- ruffin / retraites / ruffin-retraites-2 : pas de mesure retraite détaillée et sourcée au-delà de la retraite à 60 ans et du trimestre bonus pénibilité. Chercher un futur cahier de campagne sur nouspresident.fr (rubrique « Cahiers de campagne »), ses interventions sur la suspension de la réforme (LFSS 2026) ou une proposition de loi déposée à l'Assemblée.
- ruffin / retraites / ruffin-retraites-3 : idem (financement des retraites, durée de cotisation, minimum de pension).
- ruffin / immigration / ruffin-immigration-3 : aucune troisième mesure précise ; chercher sa note de blog de mai 2026 sur l'immigration (francoisruffin.fr) et l'interview France 2 du 28 avril 2026, ou un futur cahier de campagne.
- ruffin / sante / ruffin-sante-3 : pas de cahier « santé » publié au 14/10/2026 ; chercher sur nouspresident.fr, et ses positions sur les Ehpad/aides-soignantes (soutien aux grévistes de l'Ehpad des Feuillants, avril 2026).
- ruffin / sante / ruffin-sante-u : idem ; mesure emblématique santé à identifier (hôpital, déserts médicaux, formation des médecins évoquée sur France 2 le 28/04/2026 sans mesure chiffrée).

## dupont-aignan
- Aucune mesure manquante. À surveiller : les pages thématiques du site debout-la-france.fr (éducation, environnement, Europe) ne sont pas datées et le parti indique « actualiser » son programme pour 2027 ; la page « Retraites » du site (maintien de l'âge actuel) contredit la proposition de septembre 2026 (62 ans et 9 mois, AFP) retenue ici. Revérifier à la publication du programme 2027 (livre annoncé).
