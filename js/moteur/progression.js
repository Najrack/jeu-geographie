// Mémoire de ce que le joueur sait, et choix des questions par répétition espacée (boîtes de Leitner).
//
// Chaque élément a, pour chaque compétence (« carte » : le situer ou le reconnaître ; « capitale »),
// une boîte de 0 à 5 : une bonne réponse le fait monter d'une boîte, une erreur le renvoie en boîte 0.
// Plus la boîte est basse, plus l'élément a de chances d'être tiré ; il en a davantage encore
// quand le délai de révision de sa boîte est dépassé.
//
// Tout est enregistré dans le navigateur (localStorage), par profil et par jeu de données :
//   { "<profil>": { "<jeu>": { "<compétence>": { "<id>": { b: boîte, v: vus, j: justes, d: jour } } } } }
(function () {
  const CLE = "geojeu.progression";
  const BOITE_MAX = 5;
  const POIDS_BOITE = [8, 4, 2, 1, 0.5, 0.25];
  const POIDS_NOUVEAU = 3;
  const DELAI_JOURS = [0, 1, 2, 4, 8, 16];

  function aujourdhui() {
    return Math.floor((Date.now() - new Date().getTimezoneOffset() * 60000) / 86400000);
  }

  function lireTout() {
    try { return JSON.parse(localStorage.getItem(CLE)) || {}; } catch (e) { return {}; }
  }

  class Progression {
    constructor(profil, idJeu) {
      this.profil = profil;
      this.idJeu = idJeu;
      this.tout = lireTout();
    }

    fiches(competence) {
      const p = this.tout[this.profil] = this.tout[this.profil] || {};
      const j = p[this.idJeu] = p[this.idJeu] || {};
      return j[competence] = j[competence] || {};
    }

    noter(competence, id, juste) {
      const fiches = this.fiches(competence);
      const f = fiches[id] = fiches[id] || { b: 0, v: 0, j: 0, d: 0 };
      f.v++;
      if (juste) {
        f.j++;
        // Su du premier coup : inutile de le redemander souvent
        f.b = Math.min(BOITE_MAX, f.b + (f.v === 1 ? 2 : 1));
      } else {
        f.b = 0;
      }
      f.d = aujourdhui();
      this.enregistrer();
    }

    enregistrer() {
      try { localStorage.setItem(CLE, JSON.stringify(this.tout)); } catch (e) { /* stockage plein ou refusé */ }
    }

    poids(competence, id) {
      const f = this.fiches(competence)[id];
      if (!f) return POIDS_NOUVEAU;
      const enRetard = aujourdhui() - f.d >= DELAI_JOURS[f.b];
      return POIDS_BOITE[f.b] * (enRetard ? 2 : 1);
    }

    // Tire nb éléments différents, chacun avec une chance proportionnelle à son poids
    choisir(competence, elements, nb) {
      return elements
        .map((el) => ({ el: el, cle: Math.pow(Math.random(), 1 / this.poids(competence, el.id)) }))
        .sort((a, b) => b.cle - a.cle)
        .slice(0, nb)
        .map((x) => x.el);
    }

    // { b, v, j, d } de l'élément, ou undefined s'il n'a jamais été demandé
    fiche(competence, id) {
      return this.fiches(competence)[id];
    }

    // "nouveau" (jamais vu), "a-revoir" (raté la dernière fois), "hesitant" ou "su"
    etat(competence, id) {
      const f = this.fiches(competence)[id];
      if (!f) return "nouveau";
      if (f.b === 0) return "a-revoir";
      return f.b >= 3 ? "su" : "hesitant";
    }
  }

  GeoJeu.Progression = Progression;
})();
