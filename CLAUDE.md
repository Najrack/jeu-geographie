# Consignes du projet

Jeu web en français pour apprendre la géographie : placer les pays sur un planisphère et retrouver les capitales.
Le propriétaire n'est pas développeur : expliquer simplement, avancer par petites étapes, demander avant d'installer ou de publier quoi que ce soit.
Il préfère qu'on prenne des initiatives et qu'on travaille de façon autonome entre deux validations.

## Public et contraintes
- Pour le propriétaire et son entourage (pas forcément à l'aise avec l'informatique), partagé par un simple lien.
- Pas de compte, pas de serveur, pas de base de données, pas d'outil de statistiques tiers. Rien n'est envoyé nulle part. Fonctionne hors ligne une fois chargé.
- Site statique HTML/CSS/JS + D3, sans framework ni compilation. Bibliothèques et données copiées dans le projet.
- Les données sont du JSON enveloppé dans des fichiers `.js` (`GeoJeu.enregistrer(...)`) pour que `index.html` s'ouvre par double-clic.
- Couleurs lisibles par les daltoniens (palette Okabe-Ito, faux = hachuré), textes grands, cibles tactiles ≥ 44 px, petits écrans.
- Progression en localStorage, par profil (prénom), avec export/import par code à copier-coller.
- Hébergement final statique gratuit (GitHub Pages ou Netlify) : ne rien publier sans accord explicite.

## Architecture
- `js/moteur/` ne connaît aucun pays : tout vient du jeu de données (`donnees/<jeu>/config.js`, liste d'éléments, fond de carte TopoJSON).
- Jeux de données listés dans `donnees/catalogue.js`, chargés à la demande (`GeoJeu.charger`). Fond de carte TopoJSON (`topo`) ou GeoJSON (`geo` + `cleForme`), projection(s) et encarts décrits dans chaque config.

## Phase 2 : la France (commencée le 21/10/2026)
Décisions : 101 départements (96 + 5 DROM en encarts, sans distance affichée pour eux) ; Corse 2A/2B (20 refusé) ;
Rhône (69) = une zone avec la Métropole de Lyon ; 67 et 68 séparés ; niveaux par notoriété (n = 1 : ~30).
Étapes : A données ✔ ; B moteur (choix de la carte à l'accueil, GeoJSON, projection conique, encarts, régions calculées) ✔ ;
C ✔ modes `numero` / `numeroVersElement` (compétence « numero ») + mode `alaCarte` (réglages `alaCarte: { donne, trouver }`
par joueur et par jeu ; remplace le mode trio, aussi pour le monde) ;
D finitions ✔ (aide pour les deux cartes, accueil compact sur téléphone, lien « Sauvegarde », descriptions). Phase 2 terminée.

## Périmètre (décidé le 21/10/2026)
- 193 membres de l'ONU + Vatican, Palestine, Kosovo, Taïwan, chacun avec une mention « statut particulier ».
- Somaliland rattaché à la Somalie, Chypre du Nord à Chypre, Hong Kong et Macao à la Chine, Åland à la Finlande.
- Sahara occidental, Groenland et autres territoires : affichés en gris hachuré, non jouables.
- Capitales délicates (validé) : Israël = Jérusalem (note Tel-Aviv) ; Palestine = Jérusalem-Est ou Ramallah ; Bolivie, Afrique du Sud, Sri Lanka, Eswatini = toutes leurs capitales officielles ; sièges de gouvernement ou capitales économiques (La Haye, Abidjan, Cotonou, Putrajaya…) seulement en note.

## Étapes de la phase 1
1. Plan ✔ 2. Carte, zoom, projections ✔ 3. Mode « où est ce pays » ✔ (sélection puis validation) 4. Mode saisie du nom ✔ (`js/moteur/reponses.js`)
5. Capitales dans les deux sens ✔ (choix des cas délicats validés le 21/10/2026 : plusieurs réponses seulement pour les capitales multiples officielles) 6. Pastilles micro-États ✔ 7. Régions + difficulté ✔ (champ `n` des éléments, `regions`/`niveaux` dans config.js) 8. Répétition espacée ✔ (`js/moteur/progression.js`, boîtes de Leitner par compétence « carte »/« capitale » ; l'ancien profil « Moi » est repris par le premier prénom créé)
9. Bilan + carte de maîtrise ✔ (su = boîte ≥ 3, hésitant = 1-2, à revoir = 0) 10. Accueil épuré, niveaux Facile/Moyen/Expert, aide, profils, export/import ✔ (`js/moteur/profils.js` ; niveaux dans config.js ; code « GEO1- » + base64 d'un JSON compact ; aussi en lien `…/#importer=<code base64url>` et bouton de partage)

## Synchronisation (décidé le 21/10/2026)
Pas de synchronisation en ligne (pas de serveur ni de service tiers) : transfert par lien, partage ou code, avec fusion. Le code ne peut pas être court ni mémorisable puisqu'il contient les données elles-mêmes.
11. Défi du jour : abandonné à la demande du propriétaire (21/10/2026), ne pas le réintroduire 12. PWA hors ligne + mise en ligne ✔ (`manifest.webmanifest`, `sw.js`, `icones/`)

Ajout demandé après l'étape 12 : mode « Nom, capitale et carte », remplacé en phase 2 par le mode « à la carte » (`GeoJeu.modes.alaCarte`).

## Règles pour chaque modification (depuis l'étape 12)
- Augmenter `VERSION` dans `sw.js` (planisphere-v1, v2…) à chaque changement d'un fichier du jeu, sinon les appareils gardent l'ancienne copie.
- Tout nouveau fichier nécessaire au jeu doit être ajouté à la liste `FICHIERS` de `sw.js`.
- Le service worker est désactivé sur localhost (sauf `?hors-ligne`) pour que les tests voient la dernière version.

## Après chaque étape
Ouvrir la page, la tester (y compris cliquer sur un petit pays comme le Luxembourg, et à taille téléphone), dire ce qui a été vérifié et ce que le propriétaire doit tester lui-même.
Tester avec `outils/serveur-local.ps1` (port 8123).

## Mise en ligne
GitHub Pages : https://najrack.github.io/jeu-geographie/ (dépôt Najrack/jeu-geographie). Pas de git sur le PC :
le propriétaire envoie les fichiers à la main (Add file → Upload files, sans le dossier `.claude`). Lui rappeler de le faire après chaque étape.
