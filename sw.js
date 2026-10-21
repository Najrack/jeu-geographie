// Service worker : garde une copie de tous les fichiers du jeu sur l'appareil pour qu'il marche hors ligne.
//
// IMPORTANT : à chaque mise en ligne d'une nouvelle version, augmenter VERSION.
// Les appareils voient alors que ce fichier a changé, téléchargent la nouvelle version
// et l'utilisent à la prochaine ouverture du jeu.
const VERSION = "planisphere-v9";

const FICHIERS = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "css/style.css",
  "js/lib/d3.min.js",
  "js/lib/topojson-client.min.js",
  "js/moteur/espace.js",
  "js/moteur/carte.js",
  "js/moteur/reponses.js",
  "js/moteur/modes.js",
  "js/moteur/progression.js",
  "js/moteur/profils.js",
  "donnees/catalogue.js",
  "donnees/monde/config.js",
  "donnees/monde/pays.js",
  "donnees/monde/carte.js",
  "donnees/france/config.js",
  "donnees/france/departements.js",
  "donnees/france/carte.js",
  "js/app.js",
  "icones/icone-180.png",
  "icones/icone-192.png",
  "icones/icone-512.png"
];

// Installation : on télécharge tout d'un coup (cache: "reload" pour ne pas reprendre une vieille copie du navigateur)
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(VERSION)
      .then((cache) => cache.addAll(FICHIERS.map((f) => new Request(f, { cache: "reload" }))))
      .then(() => self.skipWaiting())
  );
});

// Activation : on supprime les copies des anciennes versions
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((cles) => Promise.all(cles.filter((c) => c !== VERSION).map((c) => caches.delete(c))))
      .then(() => self.clients.claim())
  );
});

// Chaque demande de fichier : la copie sur l'appareil d'abord (rapide, et marche sans réseau),
// sinon le réseau
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then((copie) => copie || fetch(e.request))
  );
});
