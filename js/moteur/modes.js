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

  const PAUSE_APRES_AFFICHAGE = 450; // ms

  // Verdicts : variés et encourageants, avec le nombre de bonnes réponses de suite à partir de 3
  const BRAVOS = ["Bravo !", "Exact !", "Bien joué !", "Parfait !", "Très bien !"];
  function verdictJuste(partie) {
    const n = (partie.serie || 0) + 1;
    return '<p class="verdict">✓ ' + BRAVOS[Math.floor(Math.random() * BRAVOS.length)] +
      (n >= 3 ? ' <span class="serie">' + n + " de suite !</span>" : "") + "</p>";
  }
  // km : distance de l'erreur sur la carte (null si sans objet) ; passe : le joueur a choisi « Je ne sais pas »
  function verdictFaux(km, passe) {
    if (passe) return '<p class="verdict verdict-neutre">ⓘ Voici la réponse</p>';
    return '<p class="verdict">✗ ' + (km != null && km < 300 ? "Presque !" : "Pas tout à fait") + "</p>";
  }

  // « , à environ 350 km de votre choix », ou rien si la distance n'a pas de sens (encart d'outre-mer)
  function avecDistance(km, suite) {
    return km == null ? "" : ", " + texteDistance(km) + suite;
  }

  class Partie {
    // options : { jeu, carte, panneau, mode, elements, nbQuestions, progression, strict, quandFini }
    //   strict : orthographe moins tolérante dans les réponses tapées.
    //   Avec une progression, les questions sont tirées par répétition espacée et les réponses y sont notées.
    constructor(options) {
      Object.assign(this, options);
      if (this.mode.filtrer) this.elements = this.mode.filtrer(this.elements);
      const nb = this.nbQuestions || 10;
      this.questions = this.progression
        ? this.progression.choisir(this.mode.competence, this.elements, nb)
        : melanger(this.elements).slice(0, nb);
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
      this.panneau.classList.toggle("panneau-grand", !!this.mode.panneauGrand);
      this.mode.poser(this, this.questions[this.index]);
    }

    entete() {
      return '<div class="progression"><span>Question ' + (this.index + 1) + " / " + this.questions.length +
        '</span><span>Score : ' + this.score + "</span></div>";
    }

    // Chaque nouvel affichage ignore les touchers pendant un court instant : un double toucher
    // ne doit pas répondre à la question suivante, ni faire passer la correction sans la voir.
    afficher(html) {
      this.panneau.innerHTML = this.entete() + html;
      this.panneau.classList.add("panneau-pause");
      clearTimeout(this.minuteriePause);
      this.minuteriePause = setTimeout(() => this.panneau.classList.remove("panneau-pause"), PAUSE_APRES_AFFICHAGE);
    }

    // Appelé par le mode une fois la réponse jugée.
    // parCompetence (facultatif) : { carte: vrai/faux, capitale: vrai/faux } pour un mode qui en fait travailler plusieurs
    resultat(juste, html, parCompetence) {
      if (!this.enAttente) return;
      this.enAttente = false;
      if (juste) this.score++;
      this.serie = juste ? (this.serie || 0) + 1 : 0;
      const id = this.questions[this.index].id;
      this.resultats.push({ id: id, juste: juste });
      if (this.progression) {
        const notes = parCompetence || { [this.mode.competence]: juste };
        for (const c in notes) this.progression.noter(c, id, notes[c]);
      }
      this.afficher('<div class="retour ' + (juste ? "retour-juste" : "retour-faux") + '">' + html + "</div>" +
        '<button class="bouton bouton-principal" data-action="suivante">' +
        (this.index + 1 < this.questions.length ? "Question suivante" : "Voir le résultat") + "</button>");
      const bouton = this.panneau.querySelector('[data-action="suivante"]');
      bouton.addEventListener("click", () => this.suivante());
      // Focus un peu plus tard : une touche Entrée maintenue ne doit pas sauter la correction
      setTimeout(() => { if (bouton.isConnected) bouton.focus({ preventScroll: true }); }, PAUSE_APRES_AFFICHAGE);
    }

    terminer() {
      this.panneau.classList.remove("panneau-grand");
      this.carte.auClic = function () {};
      this.carte.reinitialiserZoom();
      if (this.quandFini) this.quandFini(this);
    }
  }

  // Toucher la mer, un territoire non jouable ou un élément hors de la région : on explique quoi faire
  function indiquerOuToucher(partie) {
    const lib = partie.jeu.libelles;
    partie.carte.signaler("Touchez " + lib.unElement + (partie.carte.zone ? " de la région en couleur." : "."));
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
      if (!clic.id) indiquerOuToucher(partie);
      choix = clic.id ? clic : null; // toucher la mer ou un territoire non jouable annule la sélection
      if (choix) carte.marquer(choix.id, "choisi");
      bouton.disabled = !choix;
    };
  }

  // ---------- Mode « Où se trouve… ? » : on donne un nom, le joueur touche la carte ----------
  // competence : ce que le mode fait travailler, pour la répétition espacée (« carte » ou « capitale »)
  GeoJeu.modes.localiser = {
    nom: function (jeu) { return "Où se trouve " + jeu.libelles.ceElement + " ?"; },
    competence: "carte",

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
        html = verdictJuste(partie) + "<p><strong>" + esc(el.nom) + "</strong> est bien ici.</p>";
      } else {
        carte.marquer(clic.id, "faux");
        const km = carte.distanceKm(el.id, clic.lonlat);
        html = verdictFaux(km) + "<p>Vous avez choisi : <strong>" + esc(clic.element.nom) + "</strong>.</p>" +
          "<p><strong>" + esc(el.nom) + "</strong> est en bleu" + avecDistance(km, " de votre choix") + ".</p>";
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
    competence: "carte",

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
      const trouve = texte == null ? null : GeoJeu.reponses.reconnaitre(texte, entreesNoms(partie.jeu), el.id, partie.strict);
      const juste = !!trouve && trouve.id === el.id;
      carte.marquer(el.id, "juste");
      let html;
      if (juste) {
        html = verdictJuste(partie) + "<p>C'est bien <strong>" + esc(el.nom) + "</strong>." +
          (trouve.exact ? "" : " (On l'écrit ainsi.)") + "</p>";
      } else {
        html = verdictFaux(null, texte == null) +
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
    competence: "capitale",
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
      const trouve = texte == null ? null : GeoJeu.reponses.reconnaitre(texte, entreesCapitales(jeu), el.id, partie.strict);
      const juste = !!trouve && trouve.id === el.id;
      carte.marquer(el.id, "juste");
      let html;
      if (juste) {
        html = verdictJuste(partie) +
          (trouve.exact ? "" : "<p>On écrit <strong>" + esc(trouve.nom) + "</strong>.</p>");
      } else {
        html = verdictFaux(null, texte == null);
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
    competence: "capitale",
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
        html = verdictJuste(partie);
      } else {
        carte.marquer(clic.id, "faux");
        const km = carte.distanceKm(el.id, clic.lonlat);
        html = verdictFaux(km) +
          "<p>C'était <strong>" + esc(el.nom) + "</strong> (en bleu)" + avecDistance(km, " de votre choix") + ".</p>" +
          '<p class="statut">Vous avez choisi : ' + esc(clic.element.nom) + " (" + esc(jeu.libelles.capitale) + " : " +
          esc(clic.element.cap.map((c) => c[0]).join(", ")) + ").</p>";
        if (carte.estPetit(el.id)) carte.zoomSur(el.id, 12);
      }
      html += ficheCapitales(jeu, el);
      if (el.statut) html += '<p class="statut">ⓘ Statut particulier : ' + esc(el.statut) + "</p>";
      partie.resultat(juste, html);
    }
  };

  // ---------- Numéros (départements) ----------
  function avecNumero(elements) {
    return elements.filter((e) => e.num);
  }

  // Mode « Quel est son numéro ? » : l'élément est nommé et coloré, on tape son numéro
  GeoJeu.modes.numero = {
    nom: function (jeu) { return "Quel est son " + jeu.libelles.numero + " ?"; },
    competence: "numero",
    filtrer: avecNumero,

    poser: function (partie, el) {
      const lib = partie.jeu.libelles;
      partie.carte.marquer(el.id, "cible");
      partie.carte.cadrer(el.id);
      saisirTexte(partie,
        '<p class="consigne">Quel est le ' + esc(lib.numero) + " de ce " + esc(lib.element) + " ?</p>" +
        '<p class="question-nom">' + esc(el.nom) + "</p>",
        majusculeInitiale(lib.numero),
        (texte) => this.repondre(partie, el, texte));
    },

    repondre: function (partie, el, texte) {
      const lib = partie.jeu.libelles;
      const trouve = texte == null ? null : GeoJeu.reponses.reconnaitreNumero(texte, partie.jeu.elements);
      const juste = !!trouve && trouve.id === el.id;
      partie.carte.marquer(el.id, "juste");
      let html;
      if (juste) {
        html = verdictJuste(partie) + "<p><strong>" + esc(el.nom) + "</strong> : " + esc(el.num) + "</p>";
      } else {
        html = verdictFaux(null, texte == null) +
          "<p><strong>" + esc(el.nom) + "</strong> : c'était le <strong>" + esc(el.num) + "</strong>.</p>";
        if (trouve) {
          partie.carte.marquer(trouve.id, "faux");
          html += "<p>Votre réponse, " + esc(trouve.num) + " : " + esc(trouve.nom) + " (en orange hachuré).</p>";
        } else if (texte != null) {
          html += "<p>« " + esc(texte.trim()) + " » n'est le " + esc(lib.numero) + " d'aucun " + esc(lib.element) + ".</p>";
        }
      }
      partie.resultat(juste, html);
    }
  };

  // Mode « Quel département porte ce numéro ? » : on touche l'élément sur la carte
  GeoJeu.modes.numeroVersElement = {
    nom: function (jeu) { return "Quel " + jeu.libelles.element + " porte ce " + jeu.libelles.numero + " ?"; },
    competence: "numero",
    filtrer: avecNumero,

    poser: function (partie, el) {
      const lib = partie.jeu.libelles;
      partie.carte.annulerZoomAuto();
      choisirSurCarte(partie,
        '<p class="consigne">Quel ' + esc(lib.element) + " porte le " + esc(lib.numero) + " :</p>" +
        '<p class="question-nom">' + esc(el.num) + "</p>",
        (clic) => this.repondre(partie, el, clic));
    },

    repondre: function (partie, el, clic) {
      const carte = partie.carte;
      const juste = clic.id === el.id;
      carte.marquer(el.id, "juste");
      let html;
      if (juste) {
        html = verdictJuste(partie) + "<p>" + esc(el.num) + " : <strong>" + esc(el.nom) + "</strong></p>";
      } else {
        carte.marquer(clic.id, "faux");
        const km = carte.distanceKm(el.id, clic.lonlat);
        html = verdictFaux(km) +
          "<p>" + esc(el.num) + " : c'était <strong>" + esc(el.nom) + "</strong> (en bleu)" + avecDistance(km, " de votre choix") + ".</p>" +
          '<p class="statut">Vous avez choisi : ' + esc(clic.element.nom) + " (" + esc(clic.element.num) + ").</p>";
        if (carte.estPetit(el.id)) carte.zoomSur(el.id, 12);
      }
      partie.resultat(juste, html);
    }
  };

  // ---------- Mode « à la carte » : une information est donnée, le joueur trouve celles qu'il a choisies ----------
  // Informations possibles d'un élément, et la compétence que le joueur montre en la trouvant
  const COMPETENCE_INFO = { nom: "carte", carte: "carte", capitale: "capitale", numero: "numero" };

  function infosDuJeu(jeu) {
    return jeu.libelles.numero ? ["nom", "numero", "capitale", "carte"] : ["nom", "capitale", "carte"];
  }

  function nomInfo(jeu, info) {
    const lib = jeu.libelles;
    return { nom: "Le nom", numero: "Le " + lib.numero, capitale: "La " + lib.capitale, carte: "La carte" }[info];
  }

  GeoJeu.modes.alaCarte = {
    nom: function () { return "À la carte"; },
    panneauGrand: true, // jusqu'à trois champs et un bouton : le panneau peut prendre plus de hauteur
    infos: infosDuJeu,
    nomInfo: nomInfo,

    // Version du mode pour des réglages donnés : { donne: "hasard" | info, trouver: [infos] }
    configurer: function (jeu, options) {
      const enJeu = new Set(options.trouver.concat(options.donne === "hasard" ? infosDuJeu(jeu) : [options.donne]));
      return Object.assign(Object.create(this), {
        options: options,
        competence: [...new Set([...enJeu].map((i) => COMPETENCE_INFO[i]))],
        filtrer: (elements) => elements.filter((e) =>
          (!enJeu.has("capitale") || (e.cap && e.cap.length)) && (!enJeu.has("numero") || e.num))
      });
    },

    poser: function (partie, el) {
      const jeu = partie.jeu;
      const lib = jeu.libelles;
      const carte = partie.carte;
      const opts = this.options;
      let donne = opts.donne;
      if (donne === "hasard") {
        // Au hasard, mais il doit rester au moins une chose à trouver
        const possibles = infosDuJeu(jeu).filter((i) => opts.trouver.some((t) => t !== i));
        donne = possibles[Math.floor(Math.random() * possibles.length)];
      }
      const aTrouver = infosDuJeu(jeu).filter((i) => i !== donne && opts.trouver.includes(i));
      const capitale = el.cap && el.cap.length ? el.cap[Math.floor(Math.random() * el.cap.length)][0] : "";
      const champ = (cle, etiquette) => '<label class="champ-trio"><span>' + esc(etiquette) + "</span>" +
        '<input data-champ="' + cle + '" type="text" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" enterkeyhint="next"></label>';

      let html;
      if (donne === "carte") {
        carte.marquer(el.id, "cible");
        carte.cadrer(el.id);
        html = '<p class="consigne">Ce ' + esc(lib.element) + ' <span class="pastille-legende pastille-cible"></span> en orange :</p>';
      } else {
        carte.annulerZoomAuto();
        const donnee = { nom: el.nom, capitale: capitale, numero: el.num }[donne];
        const intro = { nom: "Ce " + lib.element, capitale: "Cette " + lib.capitale, numero: "Le " + lib.element + " " + lib.numero }[donne];
        html = '<p class="consigne">' + esc(intro) + " :</p>" + '<p class="question-nom">' + esc(donnee) + "</p>";
      }
      for (const info of aTrouver) {
        if (info === "carte") {
          html += '<p class="etape-trio" data-etape-carte>' +
            (donne === "nom" ? "Touchez-le" : "Touchez son " + esc(lib.element)) + " sur la carte</p>";
        } else if (info === "nom") html += champ("nom", donne === "carte" ? "Son nom" : "Le nom du " + lib.element);
        else if (info === "capitale") html += champ("capitale", "Sa " + lib.capitale);
        else if (info === "numero") html += champ("numero", "Son " + lib.numero);
      }
      partie.afficher('<form class="form-trio" autocomplete="off">' + html +
        '<button type="submit" class="bouton bouton-principal">Valider</button>' +
        '<p class="message-erreur" role="alert"></p></form>' +
        '<button type="button" class="bouton-lien" data-action="passer">Je ne sais pas</button>');

      const form = partie.panneau.querySelector("form");
      const champs = [...form.querySelectorAll("input")];
      const avecCarte = aTrouver.includes("carte");
      let choix = null;
      if (!avecCarte) {
        if (champs[0]) champs[0].focus({ preventScroll: true });
      } else {
        // Un toucher sélectionne (en orange) ; un autre toucher change de choix
        carte.auClic = (clic) => {
          if (choix) carte.marquer(choix.id, null);
          if (!clic.id) indiquerOuToucher(partie);
          choix = clic.id ? clic : null;
          if (choix) carte.marquer(choix.id, "choisi");
          form.querySelector("[data-etape-carte]").classList.toggle("fait", !!choix);
        };
      }
      // Entrée dans un champ passe au champ suivant encore vide, plutôt que de valider trop tôt
      champs.forEach((c, i) => c.addEventListener("keydown", (e) => {
        if (e.key !== "Enter") return;
        const suivant = champs.slice(i + 1).find((x) => !x.value.trim());
        if (suivant) { e.preventDefault(); suivant.focus(); }
      }));
      const valeur = (cle) => {
        const c = form.querySelector('[data-champ="' + cle + '"]');
        return c ? c.value : null;
      };
      const fin = (reponse) => {
        carte.auClic = function () {};
        if (document.activeElement) document.activeElement.blur(); // referme le clavier du téléphone
        this.repondre(partie, el, donne, aTrouver, reponse);
      };
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        if (avecCarte && !choix) {
          form.querySelector(".message-erreur").textContent = "Touchez d'abord le " + lib.element + " sur la carte.";
          return;
        }
        fin({ clic: choix, nom: valeur("nom"), capitale: valeur("capitale"), numero: valeur("numero") });
      });
      partie.panneau.querySelector('[data-action="passer"]').addEventListener("click", () => fin(null));
    },

    // Chaque information demandée est jugée à part ; le point n'est gagné que si tout est juste
    repondre: function (partie, el, donne, aTrouver, reponse) {
      const jeu = partie.jeu;
      const lib = jeu.libelles;
      const carte = partie.carte;
      const lignes = [];
      const ligne = (ok, etiquette, texte) => lignes.push('<li class="' + (ok ? "ok" : "ko") + '">' + (ok ? "✓ " : "✗ ") +
        "<strong>" + esc(etiquette) + " :</strong> " + texte + "</li>");
      const tape = (t) => (t && t.trim() ? " (vous avez écrit « " + esc(t.trim()) + " »)" : "");
      carte.marquer(el.id, "juste");
      const resultats = {}; // info -> juste ou faux

      if (aTrouver.includes("carte")) {
        const carteOk = resultats.carte = !!reponse && reponse.clic.id === el.id;
        if (carteOk) ligne(true, "Sur la carte", "bien placé");
        else if (reponse) {
          carte.marquer(reponse.clic.id, "faux");
          ligne(false, "Sur la carte", "vous avez choisi " + esc(reponse.clic.element.nom) +
            avecDistance(carte.distanceKm(el.id, reponse.clic.lonlat), " du bon endroit") + " ; le bon est en bleu");
        } else ligne(false, "Sur la carte", "en bleu");
        if (!carteOk && carte.estPetit(el.id)) carte.zoomSur(el.id, 12);
      }
      if (aTrouver.includes("nom")) {
        const t = reponse && reponse.nom;
        const trouve = t ? GeoJeu.reponses.reconnaitre(t, entreesNoms(jeu), el.id, partie.strict) : null;
        const nomOk = resultats.nom = !!trouve && trouve.id === el.id;
        let texte = esc(el.nom);
        if (nomOk) texte += trouve.exact ? "" : " (on l'écrit ainsi)";
        else {
          texte = "c'était " + texte + tape(t);
          if (trouve) {
            carte.marquer(trouve.id, "faux");
            texte += " : " + esc(trouve.nom) + " est un autre " + esc(lib.element) + ", en orange hachuré";
          }
        }
        ligne(nomOk, "Nom", texte);
      }
      if (aTrouver.includes("numero")) {
        const t = reponse && reponse.numero;
        const trouve = t ? GeoJeu.reponses.reconnaitreNumero(t, jeu.elements) : null;
        const numOk = resultats.numero = !!trouve && trouve.id === el.id;
        let texte = numOk ? esc(el.num) : "c'était " + esc(el.num) + tape(t);
        if (!numOk && trouve) texte += " ; " + esc(trouve.num) + " : " + esc(trouve.nom);
        ligne(numOk, majusculeInitiale(lib.numero), texte);
      }
      if (aTrouver.includes("capitale")) {
        const t = reponse && reponse.capitale;
        const trouve = t ? GeoJeu.reponses.reconnaitre(t, entreesCapitales(jeu), el.id, partie.strict) : null;
        const capOk = resultats.capitale = !!trouve && trouve.id === el.id;
        const toutes = esc(el.cap.map((c) => c[0]).join(", "));
        let texte;
        if (capOk) texte = esc(trouve.nom) + (el.cap.length > 1 ? " (" + esc(lib.capitales) + " : " + toutes + ")" : "");
        else {
          texte = "c'était " + toutes + tape(t);
          if (trouve) texte += " : " + esc(trouve.nom) + " est la " + esc(lib.capitale) + " d'un autre " + esc(lib.element) +
            " (" + esc(jeu.elements.find((e) => e.id === trouve.id).nom) + ")";
        }
        ligne(capOk, majusculeInitiale(lib.capitale), texte);
      }

      const notes = Object.values(resultats);
      const juste = notes.every(Boolean);
      const verdict = juste ? verdictJuste(partie)
        : !reponse ? verdictFaux(null, true)
        : notes.some(Boolean) ? '<p class="verdict">◐ En partie</p>' : verdictFaux(null);
      let html = verdict + "<p><strong>" + esc(el.nom) + "</strong>" +
        (el.num ? " (" + esc(el.num) + ")" : "") + "</p>" +
        '<ul class="detail-trio">' + lignes.join("") + "</ul>";
      if (el.capNote && (donne === "capitale" || aTrouver.includes("capitale"))) html += '<p class="statut">' + esc(el.capNote) + "</p>";
      if (el.statut) html += '<p class="statut">ⓘ Statut particulier : ' + esc(el.statut) + "</p>";

      // Pour la répétition espacée : chaque information trouvée compte pour sa compétence.
      // Si c'est la capitale ou le numéro qui était donné, retrouver l'élément (nom ou carte) montre qu'on le connaît.
      const parCompetence = {};
      for (const info in resultats) {
        const c = COMPETENCE_INFO[info];
        parCompetence[c] = (parCompetence[c] !== false) && resultats[info];
      }
      if (donne === "capitale" || donne === "numero") {
        const identifie = ["nom", "carte"].filter((i) => i in resultats);
        if (identifie.length) parCompetence[COMPETENCE_INFO[donne]] = identifie.some((i) => resultats[i]);
      }
      partie.resultat(juste, html, parCompetence);
    }
  };

  function majusculeInitiale(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

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
