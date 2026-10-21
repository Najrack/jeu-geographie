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

  // Projections proposées (la première est celle par défaut).
  //   creer(lon0)   : fabrique la projection, centrée sur la longitude lon0
  //   etendue(lon0) : ce qui doit tenir à l'écran (sans etendue : toutes les formes de la carte)
  projections: [
    { id: "equalEarth", nom: "Tailles réelles", aide: "Projection Equal Earth : les surfaces sont respectées",
      creer: function (lon0) { return d3.geoEqualEarth().rotate([-lon0, 0]); },
      etendue: function () { return { type: "Sphere" }; } },
    { id: "mercator", nom: "Classique", aide: "Projection Mercator : la carte habituelle, mais les pays du nord paraissent plus grands",
      creer: function (lon0) { return d3.geoMercator().rotate([-lon0, 0]); },
      etendue: function (lon0) { return { type: "MultiPoint", coordinates: [[lon0 - 179.9, -57], [lon0 + 179.9, 83]] }; } }
  ],

  // Régions proposées au joueur. "tout" = toute la carte.
  //   cadre  : [[longitude ouest, latitude sud], [longitude est, latitude nord]] montré au début de la partie
  //   centre : longitude placée au milieu de la carte (pour ne pas couper le Pacifique en deux)
  regions: [
    { id: "tout", nom: "Monde entier" },
    { id: "europe", nom: "Europe", cadre: [[-25, 34], [45, 71]] },
    { id: "afrique", nom: "Afrique", cadre: [[-26, -36], [58, 38]] },
    { id: "asie", nom: "Asie", cadre: [[25, -11], [150, 70]], centre: 80 },
    { id: "ameriques", nom: "Amériques", cadre: [[-170, -56], [-30, 72]], centre: -90 },
    { id: "oceanie", nom: "Océanie", cadre: [[110, -48], [192, 12]], centre: 150 }
  ],

  // Niveaux proposés au joueur ; chacun règle tout d'un coup :
  //   n      : éléments demandés jusqu'à cette difficulté (champ n des éléments : 1 = très connu, 3 = difficile)
  //   nb     : nombre de questions par partie
  //   strict : orthographe moins tolérante (une faute de moins acceptée)
  niveaux: [
    { id: "facile", nom: "Facile", n: 1, nb: 10, description: "Les pays les plus connus, 10 questions." },
    { id: "moyen", nom: "Moyen", n: 2, nb: 10, description: "Les pays connus et moyens, 10 questions." },
    { id: "expert", nom: "Expert", n: 3, nb: 15, strict: true, description: "Tous les pays, 15 questions, orthographe plus exigeante." }
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
