// Point de rencontre entre le moteur et les jeux de données.
// Chaque fichier de données appelle GeoJeu.enregistrer("nom-du-jeu", { ... }) ;
// les morceaux d'un même jeu (réglages, éléments, fond de carte) sont réunis ici.
window.GeoJeu = {
  jeux: {},
  modes: {},
  catalogue: [], // rempli par donnees/catalogue.js : [{ id, titre, fichiers }]

  enregistrer: function (id, morceau) {
    GeoJeu.jeux[id] = Object.assign(GeoJeu.jeux[id] || { id: id }, morceau);
  },

  // Charge les fichiers d'un jeu de données la première fois qu'on le choisit.
  // Simples balises <script>, pour que cela marche aussi en ouvrant index.html depuis un fichier.
  charger: function (id) {
    const entree = GeoJeu.catalogue.find((j) => j.id === id);
    if (!entree) return Promise.reject(new Error("Jeu inconnu : " + id));
    if (entree.charge) return entree.charge;
    entree.charge = entree.fichiers.reduce((suite, fichier) => suite.then(() => new Promise((ok, echec) => {
      const s = document.createElement("script");
      s.src = fichier;
      s.onload = ok;
      s.onerror = () => echec(new Error("Fichier introuvable : " + fichier));
      document.body.appendChild(s);
    })), Promise.resolve()).then(() => GeoJeu.jeux[id]);
    return entree.charge;
  }
};
