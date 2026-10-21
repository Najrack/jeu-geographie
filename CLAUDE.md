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
- Phase 2 (France, départements : nom, numéro, préfecture) = un nouveau dossier `donnees/france/`, sans réécrire le moteur. Ne pas commencer sans demande.

## Périmètre (décidé le 21/10/2026)
- 193 membres de l'ONU + Vatican, Palestine, Kosovo, Taïwan, chacun avec une mention « statut particulier ».
- Somaliland rattaché à la Somalie, Chypre du Nord à Chypre, Hong Kong et Macao à la Chine, Åland à la Finlande.
- Sahara occidental, Groenland et autres territoires : affichés en gris hachuré, non jouables.
- Cas de capitales délicats (Israël, Palestine, Bolivie, Afrique du Sud…) : à faire valider à l'étape des capitales.

## Étapes de la phase 1
1. Plan ✔ 2. Carte, zoom, projections ✔ 3. Mode « où est ce pays » ✔ (sélection puis validation) 4. Mode saisie du nom ✔ (`js/moteur/reponses.js`)
5. Capitales dans les deux sens ✔ (cas délicats en attente de validation) 6. Pastilles micro-États ✔ 7. Régions + difficulté 8. Répétition espacée
9. Bilan + carte de maîtrise 10. Accueil épuré, niveaux Facile/Moyen/Expert, aide, profils, export/import
11. Défi du jour (série tirée de la date, résultat à partager en texte) 12. PWA hors ligne + mise en ligne

## Après chaque étape
Ouvrir la page, la tester (y compris cliquer sur un petit pays comme le Luxembourg, et à taille téléphone), dire ce qui a été vérifié et ce que le propriétaire doit tester lui-même.
Tester avec `outils/serveur-local.ps1` (port 8123).

## Mise en ligne
GitHub Pages : https://najrack.github.io/jeu-geographie/ (dépôt Najrack/jeu-geographie). Pas de git sur le PC :
le propriétaire envoie les fichiers à la main (Add file → Upload files, sans le dossier `.claude`). Lui rappeler de le faire après chaque étape.
