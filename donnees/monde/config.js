// Réglages du jeu « Le monde ». Le moteur ne connaît rien d'autre que ce qui est décrit ici,
// dans pays.js (la liste des éléments) et dans carte.js (le fond de carte).
GeoJeu.enregistrer("monde", {
  titre: "Le monde",

  // Mots utilisés dans les questions et les écrans
  libelles: {
    element: "pays", unElement: "un pays", ceElement: "ce pays", lesElements: "les pays",
    capitale: "capitale", capitales: "capitales",
    groupe: "continent"
  },

  // Nom de la collection de formes dans le fond de carte
  objetCarte: "countries",

  // Projections proposées (la première est celle par défaut)
  projections: [
    { id: "equalEarth", nom: "Tailles réelles", aide: "Projection Equal Earth : les surfaces sont respectées" },
    { id: "mercator", nom: "Classique", aide: "Projection Mercator : la carte habituelle, mais les pays du nord paraissent plus grands" }
  ],

  // Régions proposées au joueur. "tout" = toute la carte.
  regions: [
    { id: "tout", nom: "Monde entier" },
    { id: "europe", nom: "Europe" },
    { id: "afrique", nom: "Afrique" },
    { id: "asie", nom: "Asie" },
    { id: "ameriques", nom: "Amériques" },
    { id: "oceanie", nom: "Océanie" }
  ],

  // Formes de la carte à ne pas dessiner du tout
  ignorer: ["010"], // Antarctique

  // Formes rattachées à un autre élément (fusionnées avec lui sur la carte).
  // Clé = id de la forme, ou son nom anglais quand elle n'a pas d'id.
  rattacher: {
    "Somaliland": "706",  // → Somalie
    "N. Cyprus": "196",   // → Chypre
    "Kosovo": "XKX",      // forme sans id dans Natural Earth
    "344": "156",         // Hong Kong → Chine
    "446": "156",         // Macao → Chine
    "248": "246"          // Åland → Finlande
  },

  // Noms français des territoires dessinés mais non jouables (les autres sont « Territoire non jouable »)
  territoires: {
    "732": "Sahara occidental (territoire au statut non réglé)",
    "304": "Groenland (Danemark)",
    "234": "Îles Féroé (Danemark)",
    "630": "Porto Rico (États-Unis)",
    "540": "Nouvelle-Calédonie (France)",
    "258": "Polynésie française (France)",
    "260": "Terres australes françaises (France)",
    "238": "Îles Malouines (Royaume-Uni, revendiquées par l'Argentine)",
    "239": "Géorgie du Sud (Royaume-Uni)",
    "Siachen Glacier": "Glacier de Siachen (disputé entre l'Inde et le Pakistan)"
  }
});
