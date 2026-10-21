# Planisphère – jeu de géographie

Un jeu pour apprendre à placer les pays sur la carte du monde et à retrouver leurs capitales,
ainsi que les départements français, leurs numéros et leurs préfectures.
Il fonctionne entièrement dans le navigateur : pas de compte, pas de serveur, et aucune donnée envoyée nulle part.

## Ajouter une autre carte (pour plus tard)

Le moteur du jeu ne connaît aucun pays ni département : chaque carte est un dossier de `donnees/`
avec trois fichiers (réglages `config.js`, liste des éléments, fond de carte), déclaré dans `donnees/catalogue.js`
et dans la liste `FICHIERS` de `sw.js`. Les deux dossiers existants (`monde`, `france`) servent de modèles.

## Ouvrir le jeu sur cet ordinateur

Double-cliquez sur **`index.html`**. Le jeu s'ouvre dans votre navigateur habituel, même sans connexion internet.

Il existe aussi un petit serveur de test local : clic droit sur `outils/serveur-local.ps1` → « Exécuter avec PowerShell », puis ouvrez http://localhost:8123.
Sur ce serveur, le mode hors ligne est désactivé pour toujours voir la dernière version ; pour le tester, ouvrez http://localhost:8123/?hors-ligne.

## Installer le jeu sur un téléphone

Ouvrez **https://najrack.github.io/jeu-geographie/**, puis :

- **iPhone, iPad** : ouvrez le lien dans **Safari** (s'il s'est ouvert dans WhatsApp, Gmail ou Facebook, choisissez « Ouvrir dans Safari »). Bouton Partager (carré avec une flèche vers le haut ; sur les iPhone récents, dans le menu « ⋯ » en bas à droite) → **faites défiler la liste vers le bas** → « Sur l'écran d'accueil » (ou « Ajouter à l'écran d'accueil » selon la version). Si l'option « Ouvrir comme app web » apparaît, laissez-la cochée (plein écran, hors ligne). Si l'option manque, « Modifier les actions… » tout en bas permet de l'ajouter.
- **Android** (Chrome) : menu ⋮ → « Installer l'application » ou « Ajouter à l'écran d'accueil ». Sur Android et sur ordinateur, un lien « Installer le jeu » apparaît aussi en bas de l'accueil.

Le jeu s'ouvre alors comme une application, en plein écran, et **fonctionne sans internet** : tous ses fichiers sont gardés sur l'appareil après la première visite.

Sur iPhone, le jeu installé a sa propre mémoire, séparée de Safari. Pour y retrouver une progression commencée dans Safari : dans Safari, « Sauvegarde » → « Préparer l'envoi » → « Copier le code », puis dans le jeu installé, « Sauvegarde » → coller le code → « Importer ».

## Ce qui existe déjà

- **Deux cartes au choix** en haut de l'accueil : **Le monde** (pays et capitales) et **La France** (101 départements : 96 de métropole et 5 d'outre-mer, montrés en encarts à l'ouest de la Bretagne ; préfectures ; 13 régions + Outre-mer). Chaque joueur retrouve la dernière carte utilisée ; la progression et le bilan sont séparés pour chaque carte.

- **Joueurs** : au premier lancement, un court texte d'aide puis « quel est votre prénom ? ». Chaque prénom a sa propre progression et ses réglages sur l'appareil, sans mot de passe. « Changer de joueur » permet d'en ajouter, d'en choisir un autre ou d'en supprimer (✕). L'aide reste accessible depuis l'accueil.
- **Sauvegarde** (changer d'appareil) : « Préparer l'envoi » propose trois façons de transmettre sa progression :
  - **Envoyer…** (sur téléphone) ouvre le menu de partage (SMS, WhatsApp, e-mail…) avec un lien ;
  - **Copier le lien** : touché sur l'autre appareil, ce lien ouvre le jeu qui propose aussitôt l'import ;
  - **Copier le code** : à coller sur l'autre appareil dans « Sauvegarde » → « Importer ».

  La progression est contenue dans le lien après le signe `#` : cette partie n'est jamais transmise au site, elle reste sur l'appareil. Si le prénom existe déjà, les deux progressions sont fusionnées (le résultat le plus récent de chaque pays est gardé). Il n'y a pas de synchronisation automatique : pour mettre à jour l'autre appareil, on renvoie un lien.
- La carte du monde avec zoom (molette, boutons + / −, deux doigts) et déplacement (glisser).
- Deux types de carte : « Tailles réelles » (Equal Earth) et « Classique » (Mercator).
- Des pastilles pour les tout petits pays (Vatican, Monaco, Luxembourg, Maldives…). Quand plusieurs sont collées, toucher l'une d'elles zoome sur la zone.
- « Explorer la carte » : touchez un pays pour voir son nom et sa capitale.
- « Où se trouve ce pays ? » : 10 pays au hasard à trouver sur la carte. Un premier toucher sélectionne le pays (en orange) ; on confirme avec « Valider » ou en le touchant une seconde fois. En cas d'erreur, le jeu affiche le bon pays, le nom du pays choisi et la distance.
- « Quel est ce pays ? » : un pays est coloré en orange et la carte se cadre dessus ; on tape son nom. Les accents, majuscules, tirets et petites fautes sont tolérés (« kirgizistan », « etats unis », « usa » sont acceptés), mais un autre pays existant est refusé (« Irak » pour l'Iran) et montré sur la carte. « Je ne sais pas » donne la réponse.
- « Quelle est sa capitale ? » : le pays est nommé et coloré, on tape sa capitale (mêmes tolérances). Pour les pays à plusieurs capitales (Bolivie, Afrique du Sud…), chacune est acceptée. Si on donne la capitale d'un autre pays, ce pays est montré.
- « De quel pays est cette capitale ? » : une capitale est donnée, on touche son pays sur la carte (sélection puis validation).
- **Numéros** (France) : « Quel est son numéro ? » (on tape le numéro : « 1 » ou « 01 », « 2a » ou « 2A » sont acceptés, « 20 » est refusé pour la Corse) et « Quel département porte ce numéro ? » (on le touche sur la carte).
- **À la carte** : avant la partie, on choisit l'information donnée (au hasard, le nom, la capitale ou préfecture, le numéro pour la France, ou la carte) et celles à trouver. Par défaut : une information au hasard, toutes les autres à trouver. Chaque partie de la réponse est corrigée à part (✓/✗) ; le point n'est gagné que si tout est juste. Les réponses comptent pour chaque compétence concernée dans la répétition espacée et le bilan (onglet « Numéros » pour la France).
- Avant chaque partie : choix de la **région** (Monde, Europe, Afrique, Asie, Amériques, Océanie ; la carte se cadre aussitôt dessus) et du **niveau** : **Facile** (les pays les plus connus, 10 questions), **Moyen** (connus et moyens, 10 questions), **Expert** (tous les pays, 15 questions, une faute d'orthographe de moins tolérée). Le nombre de pays possibles est affiché. S'il y en a trop peu (Océanie), le jeu complète avec les plus grands pays du niveau suivant. Ces choix sont retenus pour chaque joueur.
- Quand on joue sur un continent, le reste du monde est estompé et ne peut pas être touché ; on ne peut pas non plus dézoomer ni s'éloigner au-delà du continent.
- **Répétition espacée** : le jeu retient, pour chaque pays, s'il a été réussi ou raté (séparément pour la carte et pour les capitales). Les pays ratés reviennent beaucoup plus souvent, ceux qui sont sus de moins en moins. Cette mémoire reste dans le navigateur de l'appareil ; rien n'est envoyé.
- **Mon bilan** : une carte de maîtrise où chaque pays est coloré selon ce que vous savez (bleu = su, jaune = hésitant, vermillon hachuré = à revoir, beige = jamais demandé), séparément pour la carte et pour les capitales. En touchant un pays, on voit combien de fois il a été réussi. Un tableau donne le nombre de pays sus, hésitants et à revoir par continent.
- Un toucher qui suit de près un déplacement ou un zoom de la carte est ignoré, pour éviter les réponses involontaires.

## Mettre en ligne et partager

Le jeu est hébergé gratuitement par GitHub Pages, à l'adresse :

**https://najrack.github.io/jeu-geographie/**

Pour le partager, il suffit d'envoyer ce lien (SMS, e-mail, messagerie). Il s'ouvre sur ordinateur comme sur téléphone.

### Mettre à jour la version en ligne

1. Ouvrez https://github.com/Najrack/jeu-geographie (en étant connecté).
2. Cliquez sur **Add file → Upload files**.
3. Dans l'explorateur Windows, ouvrez le dossier `jeu-geographie`, sélectionnez tout (Ctrl+A), **désélectionnez le dossier `.claude`** (Ctrl+clic dessus), puis glissez la sélection sur la page GitHub. Les fichiers existants sont remplacés.
4. En bas, cliquez sur **Commit changes**.
5. Attendez 1 à 2 minutes, puis rechargez le jeu.

Comme le jeu garde une copie de lui-même sur chaque appareil (pour marcher hors ligne), la nouvelle version est téléchargée en arrière-plan à l'ouverture suivante et s'affiche à l'ouverture d'après. Pour que les appareils remarquent la mise à jour, le numéro `VERSION` en haut du fichier `sw.js` doit changer à chaque nouvelle version (Claude s'en charge quand il modifie le jeu).

### Première mise en ligne (déjà faite, pour mémoire)

1. Créer un compte gratuit sur https://github.com/signup.
2. Créer un dépôt **public** nommé `jeu-geographie` sur https://github.com/new (sans README ni licence).
3. Envoyer les fichiers comme ci-dessus (lien « uploading an existing file »).
4. Dans le dépôt : **Settings → Pages**, « Source » : **Deploy from a branch**, branche **main**, dossier **/ (root)**, puis **Save**.

Pourquoi ne pas simplement envoyer le fichier `index.html` ? Sur téléphone, un fichier ouvert depuis l'appareil s'affiche dans un aperçu qui ne fait pas fonctionner le jeu : il faut le lien internet.

### Pourquoi GitHub Pages (et pas Netlify)

Les deux sont gratuits et conviennent. Netlify est plus simple au départ (glisser-déposer un dossier) ; GitHub Pages a été choisi pour la suite : historique de toutes les versions, adresse stable, et mises à jour qui pourront être préparées automatiquement plus tard. Inconvénient : le dépôt est public (le code du jeu est visible, ce qui ne pose pas de problème ici ; aucune donnée de joueur n'y est jamais envoyée).

## Organisation des fichiers

| Dossier / fichier | Rôle |
|---|---|
| `index.html` | La page du jeu |
| `manifest.webmanifest`, `icones/` | Nom et icône de l'application installée sur l'écran d'accueil |
| `sw.js` | Copie du jeu sur l'appareil pour le mode hors ligne (`VERSION` à changer à chaque mise à jour) |
| `css/style.css` | Couleurs et mise en page |
| `js/lib/` | Bibliothèques D3 et topojson-client (copiées ici, pas de chargement depuis internet) |
| `js/moteur/` | Le moteur du jeu, indépendant de la carte utilisée |
| `js/app.js` | Les écrans (accueil, joueurs, réglages, partie, bilan, sauvegarde, aide) |
| `donnees/catalogue.js` | La liste des cartes proposées à l'accueil |
| `donnees/monde/` | Le jeu de données « monde » : réglages, liste des pays, fond de carte |
| `donnees/france/` | Le jeu de données « France » : réglages, liste des départements, fond de carte |
| `outils/` | Fichiers sources, serveur de test et fabrication des icônes (pas nécessaires pour jouer) |
| `LICENCES.md` | Licences des sources utilisées |
