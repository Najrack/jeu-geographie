// Réglages du jeu « La France » (départements). Même principe que donnees/monde/config.js.
GeoJeu.enregistrer("france", {
  titre: "La France",

  libelles: {
    element: "département", unElement: "un département", ceElement: "ce département", lesElements: "les départements",
    capitale: "préfecture", capitales: "préfectures",
    groupe: "région",
    numero: "numéro"
  },

  // Fond de carte : GeoJSON (carte.js), chaque forme porte le code du département dans properties.code
  cleForme: function (f) { return f.properties.code; },

  // Projection conique conforme, comme les cartes de France habituelles (Lambert 93)
  projections: [
    { id: "lambert", nom: "France", aide: "Projection conique conforme (type Lambert)",
      creer: function () { return d3.geoConicConformal().parallels([44, 49]).rotate([-3, 0]); } }
  ],
  graticule: false,

  // Outre-mer en encarts, rangés en colonne à l'ouest de la Bretagne.
  // vers : position [longitude, latitude] où placer le centre du territoire ; echelle : agrandissement
  encarts: {
    "971": { vers: [-8.2, 50.2], echelle: 1.2 },
    "972": { vers: [-8.2, 48.7], echelle: 2 },
    "973": { vers: [-8.2, 46.9], echelle: 0.4 },
    "974": { vers: [-8.2, 45.0], echelle: 2 },
    "976": { vers: [-8.2, 43.6], echelle: 3 }
  },

  // Régions : le cadre de chacune est calculé à partir de ses départements
  regions: [
    { id: "tout", nom: "Toute la France" },
    { id: "ara", nom: "Auvergne-Rhône-Alpes" },
    { id: "bfc", nom: "Bourgogne-Franche-Comté" },
    { id: "bre", nom: "Bretagne" },
    { id: "cvl", nom: "Centre-Val de Loire" },
    { id: "cor", nom: "Corse" },
    { id: "ges", nom: "Grand Est" },
    { id: "hdf", nom: "Hauts-de-France" },
    { id: "idf", nom: "Île-de-France" },
    { id: "nor", nom: "Normandie" },
    { id: "naq", nom: "Nouvelle-Aquitaine" },
    { id: "occ", nom: "Occitanie" },
    { id: "pdl", nom: "Pays de la Loire" },
    { id: "pac", nom: "Provence-Alpes-Côte d'Azur" },
    { id: "om", nom: "Outre-mer" }
  ],

  niveaux: [
    { id: "facile", nom: "Facile", n: 1, nb: 10, description: "Les départements les plus connus, 10 questions." },
    { id: "moyen", nom: "Moyen", n: 2, nb: 10, description: "Une soixantaine de départements, 10 questions." },
    { id: "expert", nom: "Expert", n: 3, nb: 15, strict: true, description: "Tous les départements, 15 questions, orthographe plus exigeante." }
  ]
});
