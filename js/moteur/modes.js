// Déroulement d'une partie et types de questions (modes).
// Un mode décrit comment poser une question et comment juger la réponse ;
// la Partie s'occupe de l'enchaînement, du score et de l'affichage dans le panneau.
(function () {
  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  function melanger(liste) {
    const a = liste.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // « environ 350 km », arrondi selon l'ordre de grandeur
  function texteDistance(km) {
    if (km == null) return "";
    if (km < 50) return "à moins de 50 km";
    const pas = km < 500 ? 10 : km < 2000 ? 50 : 100;
    return "à environ " + (Math.round(km / pas) * pas).toLocaleString("fr-FR") + " km";
  }

  class Partie {
    // options : { jeu, carte, panneau, mode, elements, nbQuestions, quandFini }
    constructor(options) {
      Object.assign(this, options);
      this.questions = melanger(this.elements).slice(0, this.nbQuestions || 10);
      this.index = -1;
      this.score = 0;
      this.resultats = [];
    }

    demarrer() {
      this.suivante();
    }

    suivante() {
      this.index++;
      this.carte.effacerMarques();
      if (this.index >= this.questions.length) return this.terminer();
      this.enAttente = true;
      this.mode.poser(this, this.questions[this.index]);
    }

    entete() {
      return '<div class="progression"><span>Question ' + (this.index + 1) + " / " + this.questions.length +
        '</span><span>Score : ' + this.score + "</span></div>";
    }

    afficher(html) {
      this.panneau.innerHTML = this.entete() + html;
    }

    // Appelé par le mode une fois la réponse jugée
    resultat(juste, html) {
      if (!this.enAttente) return;
      this.enAttente = false;
      if (juste) this.score++;
      this.resultats.push({ id: this.questions[this.index].id, juste: juste });
      this.afficher('<div class="retour ' + (juste ? "retour-juste" : "retour-faux") + '">' + html + "</div>" +
        '<button class="bouton bouton-principal" data-action="suivante">' +
        (this.index + 1 < this.questions.length ? "Question suivante" : "Voir le résultat") + "</button>");
      const bouton = this.panneau.querySelector('[data-action="suivante"]');
      bouton.addEventListener("click", () => this.suivante());
      bouton.focus({ preventScroll: true });
    }

    terminer() {
      this.carte.auClic = function () {};
      this.carte.reinitialiserZoom();
      if (this.quandFini) this.quandFini(this);
    }
  }

  // ---------- Mode « Où se trouve… ? » : on donne un nom, le joueur touche la carte ----------
  GeoJeu.modes.localiser = {
    nom: function (jeu) { return "Où se trouve " + jeu.libelles.ceElement + " ?"; },

    poser: function (partie, el) {
      partie.afficher('<p class="consigne">Touchez sur la carte :</p>' +
        '<p class="question-nom">' + esc(el.nom) + "</p>");
      partie.carte.auClic = (clic) => this.repondre(partie, el, clic);
    },

    repondre: function (partie, el, clic) {
      if (!clic.id && !clic.lonlat) return; // clic hors du globe : on ignore
      const carte = partie.carte;
      carte.auClic = function () {};
      carte.marquer(el.id, "juste");
      let html;
      if (clic.id === el.id) {
        html = '<p class="verdict">✓ Bravo !</p><p><strong>' + esc(el.nom) + "</strong> est bien ici.</p>";
      } else {
        if (clic.id) carte.marquer(clic.id, "faux");
        const touche = clic.id ? esc(clic.element.nom) : clic.territoire ? esc(clic.territoire) : "la mer";
        html = '<p class="verdict">✗ Raté</p><p>Vous avez touché : <strong>' + touche + "</strong>.</p>" +
          "<p><strong>" + esc(el.nom) + "</strong> (en bleu) était " + texteDistance(carte.distanceKm(el.id, clic.lonlat)) + ".</p>";
        if (carte.estPetit(el.id)) carte.zoomSur(el.id, 12);
      }
      if (el.statut) html += '<p class="statut">ⓘ Statut particulier : ' + esc(el.statut) + "</p>";
      partie.resultat(clic.id === el.id, html);
    }
  };

  GeoJeu.Partie = Partie;
  GeoJeu.outils = { esc: esc, melanger: melanger, texteDistance: texteDistance };
})();
