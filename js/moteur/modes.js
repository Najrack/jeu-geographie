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
      if (this.mode.filtrer) this.elements = this.mode.filtrer(this.elements);
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

  // Réponse en touchant la carte, en deux temps pour éviter les réponses involontaires :
  // un premier toucher sélectionne l'élément, on confirme avec le bouton ou en le touchant à nouveau.
  function choisirSurCarte(partie, htmlQuestion, valider) {
    const carte = partie.carte;
    const lib = partie.jeu.libelles;
    let choix = null;
    partie.afficher(htmlQuestion +
      '<div class="rangee-boutons"><button class="bouton bouton-principal" data-action="valider" disabled>Valider</button></div>' +
      '<p class="aide-validation">Touchez ' + esc(lib.unElement) + " puis validez, ou touchez-le une seconde fois.</p>");
    const bouton = partie.panneau.querySelector('[data-action="valider"]');

    function confirmer() {
      if (!choix) return;
      carte.auClic = function () {};
      valider(choix);
    }
    bouton.addEventListener("click", confirmer);

    carte.auClic = (clic) => {
      if (choix && clic.id === choix.id) return confirmer();
      if (choix) carte.marquer(choix.id, null);
      choix = clic.id ? clic : null; // toucher la mer ou un territoire non jouable annule la sélection
      if (choix) carte.marquer(choix.id, "choisi");
      bouton.disabled = !choix;
    };
  }

  // ---------- Mode « Où se trouve… ? » : on donne un nom, le joueur touche la carte ----------
  GeoJeu.modes.localiser = {
    nom: function (jeu) { return "Où se trouve " + jeu.libelles.ceElement + " ?"; },

    poser: function (partie, el) {
      partie.carte.annulerZoomAuto();
      choisirSurCarte(partie,
        '<p class="consigne">Trouvez sur la carte :</p><p class="question-nom">' + esc(el.nom) + "</p>",
        (clic) => this.repondre(partie, el, clic));
    },

    repondre: function (partie, el, clic) {
      const carte = partie.carte;
      carte.marquer(el.id, "juste");
      let html;
      if (clic.id === el.id) {
        html = '<p class="verdict">✓ Bravo !</p><p><strong>' + esc(el.nom) + "</strong> est bien ici.</p>";
      } else {
        carte.marquer(clic.id, "faux");
        html = '<p class="verdict">✗ Raté</p><p>Vous avez choisi : <strong>' + esc(clic.element.nom) + "</strong>.</p>" +
          "<p><strong>" + esc(el.nom) + "</strong> (en bleu) était " + texteDistance(carte.distanceKm(el.id, clic.lonlat)) + ".</p>";
        if (carte.estPetit(el.id)) carte.zoomSur(el.id, 12);
      }
      if (el.statut) html += '<p class="statut">ⓘ Statut particulier : ' + esc(el.statut) + "</p>";
      partie.resultat(clic.id === el.id, html);
    }
  };

  // Réponse tapée au clavier. valider(texte) reçoit la saisie, ou null pour « Je ne sais pas ».
  function saisirTexte(partie, htmlQuestion, etiquette, valider) {
    partie.afficher(htmlQuestion +
      '<form class="saisie" autocomplete="off">' +
      '<input type="text" aria-label="' + esc(etiquette) + '" placeholder="' + esc(etiquette) + '"' +
      ' autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" enterkeyhint="done">' +
      '<button type="submit" class="bouton bouton-principal">Valider</button></form>' +
      '<button type="button" class="bouton-lien" data-action="passer">Je ne sais pas</button>');
    const form = partie.panneau.querySelector("form");
    const champ = form.querySelector("input");
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!champ.value.trim()) return champ.focus();
      champ.blur(); // referme le clavier du téléphone pour laisser voir la carte
      valider(champ.value);
    });
    partie.panneau.querySelector('[data-action="passer"]').addEventListener("click", () => valider(null));
    champ.focus({ preventScroll: true });
  }

  // Liste des noms acceptés pour chaque élément du jeu (nom + variantes), calculée une fois
  function entreesNoms(jeu) {
    if (!jeu.entreesNoms) jeu.entreesNoms = jeu.elements.map((e) => ({ id: e.id, noms: [e.nom].concat(e.var || []) }));
    return jeu.entreesNoms;
  }

  // ---------- Mode « Quel est ce pays ? » : un élément est coloré, le joueur tape son nom ----------
  GeoJeu.modes.nommer = {
    nom: function (jeu) { return "Quel est " + jeu.libelles.ceElement + " ?"; },

    poser: function (partie, el) {
      const lib = partie.jeu.libelles;
      partie.carte.marquer(el.id, "cible");
      partie.carte.cadrer(el.id);
      saisirTexte(partie,
        '<p class="consigne">Quel est ' + esc(lib.ceElement) + ' <span class="pastille-legende pastille-cible"></span> en orange ?</p>',
        "Nom du " + lib.element,
        (texte) => this.repondre(partie, el, texte));
    },

    repondre: function (partie, el, texte) {
      const carte = partie.carte;
      const trouve = texte == null ? null : GeoJeu.reponses.reconnaitre(texte, entreesNoms(partie.jeu), el.id);
      const juste = !!trouve && trouve.id === el.id;
      carte.marquer(el.id, "juste");
      let html;
      if (juste) {
        html = '<p class="verdict">✓ Bravo !</p><p>C\'est bien <strong>' + esc(el.nom) + "</strong>." +
          (trouve.exact ? "" : " (On l'écrit ainsi.)") + "</p>";
      } else {
        html = '<p class="verdict">✗ ' + (texte == null ? "Dommage" : "Raté") + "</p>" +
          "<p>C'était <strong>" + esc(el.nom) + "</strong> (en bleu).</p>";
        if (trouve) {
          carte.marquer(trouve.id, "faux");
          html += "<p><strong>" + esc(trouve.nom) + "</strong>, votre réponse, est en orange hachuré.</p>";
        } else if (texte != null) {
          html += "<p>Votre réponse « " + esc(texte.trim()) + " » ne correspond à aucun " + esc(partie.jeu.libelles.element) + ".</p>";
        }
      }
      if (el.statut) html += '<p class="statut">ⓘ Statut particulier : ' + esc(el.statut) + "</p>";
      partie.resultat(juste, html);
    }
  };

  // Une entrée par capitale (une capitale = son nom affiché + ses variantes), rattachée à son élément
  function entreesCapitales(jeu) {
    if (!jeu.entreesCapitales) {
      jeu.entreesCapitales = [];
      for (const e of jeu.elements) for (const c of e.cap || []) jeu.entreesCapitales.push({ id: e.id, noms: c });
    }
    return jeu.entreesCapitales;
  }

  // « Pays · capitale : X » ou « Pays · capitales : X, Y », avec la note éventuelle
  function ficheCapitales(jeu, el) {
    const lib = jeu.libelles;
    const caps = el.cap.map((c) => c[0]);
    let html = "<p><strong>" + esc(el.nom) + "</strong> · " + esc(caps.length > 1 ? lib.capitales : lib.capitale) +
      " : <strong>" + esc(caps.join(", ")) + "</strong></p>";
    if (el.capNote) html += '<p class="statut">' + esc(el.capNote) + "</p>";
    return html;
  }

  function avecCapitale(elements) {
    return elements.filter((e) => e.cap && e.cap.length);
  }

  // ---------- Mode « Quelle est sa capitale ? » : le nom de l'élément est donné, on tape la capitale ----------
  GeoJeu.modes.capitale = {
    nom: function (jeu) { return "Quelle est sa " + jeu.libelles.capitale + " ?"; },
    filtrer: avecCapitale,

    poser: function (partie, el) {
      const lib = partie.jeu.libelles;
      partie.carte.marquer(el.id, "cible");
      partie.carte.cadrer(el.id);
      saisirTexte(partie,
        '<p class="consigne">Quelle est la ' + esc(lib.capitale) + " de ce " + esc(lib.element) + " ?</p>" +
        '<p class="question-nom">' + esc(el.nom) + "</p>",
        "Nom de la " + lib.capitale,
        (texte) => this.repondre(partie, el, texte));
    },

    repondre: function (partie, el, texte) {
      const jeu = partie.jeu;
      const carte = partie.carte;
      const trouve = texte == null ? null : GeoJeu.reponses.reconnaitre(texte, entreesCapitales(jeu), el.id);
      const juste = !!trouve && trouve.id === el.id;
      carte.marquer(el.id, "juste");
      let html;
      if (juste) {
        html = '<p class="verdict">✓ Bravo !</p>' +
          (trouve.exact ? "" : "<p>On écrit <strong>" + esc(trouve.nom) + "</strong>.</p>");
      } else {
        html = '<p class="verdict">✗ ' + (texte == null ? "Dommage" : "Raté") + "</p>";
        if (trouve) {
          const autre = jeu.elements.find((e) => e.id === trouve.id);
          carte.marquer(autre.id, "faux");
          html += "<p>" + esc(trouve.nom) + " est la " + esc(jeu.libelles.capitale) + " d'un autre " + esc(jeu.libelles.element) +
            " : <strong>" + esc(autre.nom) + "</strong> (en orange hachuré).</p>";
        } else if (texte != null) {
          html += "<p>« " + esc(texte.trim()) + " » ne correspond à aucune " + esc(jeu.libelles.capitale) + " connue.</p>";
        }
      }
      html += ficheCapitales(jeu, el);
      if (el.statut) html += '<p class="statut">ⓘ Statut particulier : ' + esc(el.statut) + "</p>";
      partie.resultat(juste, html);
    }
  };

  // ---------- Mode « À quel pays appartient cette capitale ? » : on touche l'élément sur la carte ----------
  GeoJeu.modes.capitaleVersElement = {
    nom: function (jeu) { return "À quel " + jeu.libelles.element + " est cette " + jeu.libelles.capitale + " ?"; },
    filtrer: avecCapitale,

    poser: function (partie, el) {
      const lib = partie.jeu.libelles;
      // Pour les éléments à plusieurs capitales, on en demande une au hasard
      const capitale = el.cap[Math.floor(Math.random() * el.cap.length)][0];
      partie.carte.annulerZoomAuto();
      choisirSurCarte(partie,
        '<p class="consigne">De quel ' + esc(lib.element) + " est-ce la " + esc(lib.capitale) + " ?</p>" +
        '<p class="question-nom">' + esc(capitale) + "</p>",
        (clic) => this.repondre(partie, el, capitale, clic));
    },

    repondre: function (partie, el, capitale, clic) {
      const jeu = partie.jeu;
      const carte = partie.carte;
      const juste = clic.id === el.id;
      carte.marquer(el.id, "juste");
      let html;
      if (juste) {
        html = '<p class="verdict">✓ Bravo !</p>';
      } else {
        carte.marquer(clic.id, "faux");
        html = '<p class="verdict">✗ Raté</p>' +
          "<p>C'était <strong>" + esc(el.nom) + "</strong> (en bleu), " +
          texteDistance(carte.distanceKm(el.id, clic.lonlat)) + " de votre choix.</p>" +
          '<p class="statut">Vous avez choisi : ' + esc(clic.element.nom) + " (" + esc(jeu.libelles.capitale) + " : " +
          esc(clic.element.cap.map((c) => c[0]).join(", ")) + ").</p>";
        if (carte.estPetit(el.id)) carte.zoomSur(el.id, 12);
      }
      html += ficheCapitales(jeu, el);
      if (el.statut) html += '<p class="statut">ⓘ Statut particulier : ' + esc(el.statut) + "</p>";
      partie.resultat(juste, html);
    }
  };

  // ---------- Choix des éléments d'une partie ----------

  function dansRegion(el, region) {
    return !region || region === "tout" || el.cont === region || el.aussi === region;
  }

  // Éléments de la région jusqu'au niveau demandé (champ n : 1 = très connu, 3 = difficile).
  // S'il y en a moins que nb (ex. Océanie au niveau 1 : seulement 2 pays), on complète
  // avec les plus faciles puis les plus grands des niveaux suivants.
  function selectionner(jeu, reglages, aireDe) {
    const region = jeu.elements.filter((e) => dansRegion(e, reglages.region));
    const choisis = region.filter((e) => (e.n || 1) <= reglages.niveau);
    if (choisis.length < reglages.nb) {
      const reste = region.filter((e) => (e.n || 1) > reglages.niveau)
        .sort((a, b) => (a.n || 1) - (b.n || 1) || aireDe(b.id) - aireDe(a.id));
      choisis.push(...reste.slice(0, reglages.nb - choisis.length));
    }
    return choisis;
  }

  GeoJeu.Partie = Partie;
  GeoJeu.selection = { dansRegion: dansRegion, selectionner: selectionner };
  GeoJeu.outils = { esc: esc, melanger: melanger, texteDistance: texteDistance };
})();
