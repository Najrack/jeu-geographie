// Jeux de données proposés à l'accueil. Pour en ajouter un : créer son dossier dans donnees/
// (config.js, liste des éléments, fond de carte) puis l'ajouter ici et dans la liste FICHIERS de sw.js.
GeoJeu.catalogue = [
  { id: "monde", titre: "Le monde",
    fichiers: ["donnees/monde/config.js", "donnees/monde/pays.js", "donnees/monde/carte.js"] },
  { id: "france", titre: "La France",
    fichiers: ["donnees/france/config.js", "donnees/france/departements.js", "donnees/france/carte.js"] }
];
