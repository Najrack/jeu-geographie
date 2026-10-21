# Planisphère – jeu de géographie

Un jeu pour apprendre à placer les pays sur la carte du monde et à retrouver leurs capitales.
Il fonctionne entièrement dans le navigateur : pas de compte, pas de serveur, et aucune donnée envoyée nulle part.

## Ouvrir le jeu sur cet ordinateur

Double-cliquez sur **`index.html`**. Le jeu s'ouvre dans votre navigateur habituel, même sans connexion internet.

Pour tester ce qui nécessite une vraie adresse web (l'installation sur téléphone et le mode hors ligne, à venir), il y a un petit serveur local :
clic droit sur `outils/serveur-local.ps1` → « Exécuter avec PowerShell », puis ouvrez http://localhost:8123.

## Ce qui existe déjà

- La carte du monde avec zoom (molette, boutons + / −, deux doigts) et déplacement (glisser).
- Deux types de carte : « Tailles réelles » (Equal Earth) et « Classique » (Mercator).
- Des pastilles pour les tout petits pays (Vatican, Monaco, Luxembourg, Maldives…). Quand plusieurs sont collées, toucher l'une d'elles zoome sur la zone.
- « Explorer la carte » : touchez un pays pour voir son nom et sa capitale.
- « Où se trouve ce pays ? » : 10 pays au hasard à trouver sur la carte. Un premier toucher sélectionne le pays (en orange) ; on confirme avec « Valider » ou en le touchant une seconde fois. En cas d'erreur, le jeu affiche le bon pays, le nom du pays choisi et la distance.
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

### Première mise en ligne (déjà faite, pour mémoire)

1. Créer un compte gratuit sur https://github.com/signup.
2. Créer un dépôt **public** nommé `jeu-geographie` sur https://github.com/new (sans README ni licence).
3. Envoyer les fichiers comme ci-dessus (lien « uploading an existing file »).
4. Dans le dépôt : **Settings → Pages**, « Source » : **Deploy from a branch**, branche **main**, dossier **/ (root)**, puis **Save**.

Pourquoi ne pas simplement envoyer le fichier `index.html` ? Sur téléphone, un fichier ouvert depuis l'appareil s'affiche dans un aperçu qui ne fait pas fonctionner le jeu : il faut le lien internet.

## Organisation des fichiers

| Dossier / fichier | Rôle |
|---|---|
| `index.html` | La page du jeu |
| `css/style.css` | Couleurs et mise en page |
| `js/lib/` | Bibliothèques D3 et topojson-client (copiées ici, pas de chargement depuis internet) |
| `js/moteur/` | Le moteur du jeu, indépendant de la carte utilisée |
| `js/app.js` | Les écrans (accueil, exploration, partie) |
| `donnees/monde/` | Le jeu de données « monde » : réglages, liste des pays, fond de carte |
| `outils/` | Fichiers sources et petit serveur de test (pas nécessaires pour jouer) |
| `LICENCES.md` | Licences des sources utilisées |
