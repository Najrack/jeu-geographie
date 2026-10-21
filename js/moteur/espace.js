// Point de rencontre entre le moteur et les jeux de données.
// Chaque fichier de données appelle GeoJeu.enregistrer("nom-du-jeu", { ... }) ;
// les morceaux d'un même jeu (réglages, éléments, fond de carte) sont réunis ici.
window.GeoJeu = {
  jeux: {},
  modes: {},

  enregistrer: function (id, morceau) {
    GeoJeu.jeux[id] = Object.assign(GeoJeu.jeux[id] || { id: id }, morceau);
  }
};
