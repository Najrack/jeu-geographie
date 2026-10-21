// Écrans de l'application : bienvenue, choix du joueur, accueil, aide, sauvegarde,
// réglages avant la partie, partie, bilan, exploration de la carte.
(function () {
  const esc = GeoJeu.outils.esc;
  const profils = GeoJeu.profils;
  const jeu = GeoJeu.jeux.monde;
  const lib = jeu.libelles;
  const pluriel = lib.lesElements.replace(/^les /, ""); // « pays »
  const majuscule = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const panneau = document.getElementById("panneau");
  const bulle = document.getElementById("bulle");
  const carte = new GeoJeu.Carte(document.getElementById("zone-carte"), jeu);
  window.carte = carte; // pratique pour tester depuis la console du navigateur
  document.getElementById("message-chargement").remove();

  // ---------- Barre du haut ----------
  const choixProjection = document.getElementById("choix-projection");
  for (const p of jeu.projections) {
    const b = document.createElement("button");
    b.textContent = p.nom;
    b.title = p.aide;
    b.setAttribute("aria-pressed", String(p.id === carte.projectionId));
    b.addEventListener("click", () => {
      carte.changerProjection(p.id);
      for (const autre of choixProjection.children) autre.setAttribute("aria-pressed", String(autre === b));
    });
    choixProjection.appendChild(b);
  }

  document.querySelector(".boutons-zoom").addEventListener("click", (e) => {
    const z = e.target.closest("[data-zoom]");
    if (!z) return;
    const action = z.getAttribute("data-zoom");
    if (action === "plus") carte.zoomer(2);
    else if (action === "moins") carte.zoomer(0.5);
    else carte.reinitialiserZoom();
  });

  document.getElementById("btn-accueil").addEventListener("click", () => accueil());

  let minuterieBulle = null;
  function montrerBulle(texte) {
    bulle.textContent = texte;
    bulle.hidden = false;
    clearTimeout(minuterieBulle);
    minuterieBulle = setTimeout(() => { bulle.hidden = true; }, 2500);
  }
  carte.auZoomAuto = () => montrerBulle("Plusieurs petits pays ici : zoom avant. Touchez à nouveau.");

  // Affiche un écran dans le panneau du bas ; grand = le panneau peut prendre plus de hauteur
  function ecran(html, grand) {
    panneau.classList.toggle("panneau-grand", !!grand);
    panneau.innerHTML = html;
    panneau.scrollTop = 0;
  }
  function surAction(action, fonction) {
    const b = panneau.querySelector('[data-action="' + action + '"]');
    if (b) b.addEventListener("click", fonction);
  }
  function carteAuRepos() {
    carte.effacerMarques();
    carte.auClic = function () {};
    carte.definirZone(null);
    carte.reinitialiserZoom();
  }

  // ---------- Joueur en cours ----------
  let joueur = null;
  let progression = null;
  let reglages = null;

  function chargerJoueur(nom) {
    profils.choisir(nom);
    joueur = nom;
    progression = new GeoJeu.Progression(nom, jeu.id);
    reglages = lireReglages();
  }

  function demarrer() {
    const nom = profils.actif();
    if (!profils.noms().length) bienvenue();
    else if (nom) { chargerJoueur(nom); accueil(); }
    else quiJoue();
  }

  // ---------- Aide ----------
  const AIDE =
    '<ul class="aide">' +
    "<li>Choisissez un jeu, puis une région et un niveau : <strong>Facile</strong>, <strong>Moyen</strong> ou <strong>Expert</strong>.</li>" +
    "<li>Pour vous déplacer sur la carte, faites-la glisser. Pour zoomer : deux doigts, la molette, ou les boutons + et −.</li>" +
    "<li>Pour répondre, touchez " + esc(lib.unElement) + " : il devient orange. Validez avec le bouton, ou en le touchant une seconde fois.</li>" +
    "<li>Les tout petits " + esc(pluriel) + " ont une pastille ronde. Quand plusieurs sont collées, la carte zoome d'abord.</li>" +
    "<li>Les " + esc(pluriel) + " ratés reviennent plus souvent. « Mon bilan » montre vos progrès.</li>" +
    "<li>Tout reste sur cet appareil : rien n'est envoyé sur internet.</li>" +
    "</ul>";

  function aide() {
    carteAuRepos();
    ecran('<p class="titre-ecran">Comment jouer</p>' + AIDE +
      '<div class="rangee-boutons"><button class="bouton bouton-principal" data-action="retour">J\'ai compris</button></div>', true);
    surAction("retour", () => accueil());
  }

  // ---------- Premier lancement ----------
  function bienvenue() {
    carteAuRepos();
    ecran('<p class="titre-ecran">Bienvenue !</p>' +
      "<p>Ce jeu vous aide à apprendre où sont les " + esc(pluriel) + " du monde et leurs " + esc(lib.capitales) + ".</p>" +
      AIDE +
      '<form class="saisie-profil" autocomplete="off">' +
      '<label for="prenom" class="etiquette">Pour commencer, quel est votre prénom ?</label>' +
      '<div class="saisie"><input id="prenom" type="text" maxlength="20" autocomplete="given-name" enterkeyhint="go">' +
      '<button type="submit" class="bouton bouton-principal">C\'est parti</button></div>' +
      '<p class="message-erreur" role="alert"></p></form>', true);
    brancherAjout(() => accueil());
  }

  // Formulaire « prénom » : crée le profil puis appelle ensuite()
  function brancherAjout(ensuite) {
    const form = panneau.querySelector(".saisie-profil");
    const champ = form.querySelector("input");
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const erreur = profils.ajouter(champ.value);
      if (erreur) {
        form.querySelector(".message-erreur").textContent = erreur;
        champ.focus();
        return;
      }
      chargerJoueur(profils.actif());
      ensuite();
    });
  }

  // ---------- Qui joue ? ----------
  function quiJoue() {
    carteAuRepos();
    const noms = profils.noms();
    ecran('<p class="titre-ecran">Qui joue ?</p>' +
      '<div class="liste-profils">' +
      noms.map((n, i) => '<div class="ligne-profil">' +
        '<button class="bouton' + (n === joueur ? " bouton-principal" : "") + '" data-index="' + i + '">' + esc(n) + "</button>" +
        '<button class="bouton-supprimer" data-supprimer="' + i + '" aria-label="Supprimer ' + esc(n) + '" title="Supprimer">✕</button></div>').join("") +
      "</div>" +
      '<form class="saisie-profil" autocomplete="off">' +
      '<label for="prenom" class="etiquette">Nouveau joueur</label>' +
      '<div class="saisie"><input id="prenom" type="text" maxlength="20" placeholder="Prénom" enterkeyhint="go">' +
      '<button type="submit" class="bouton">Ajouter</button></div>' +
      '<p class="message-erreur" role="alert"></p></form>', true);

    panneau.querySelectorAll("[data-index]").forEach((b) => b.addEventListener("click", () => {
      chargerJoueur(noms[Number(b.getAttribute("data-index"))]);
      accueil();
    }));
    panneau.querySelectorAll("[data-supprimer]").forEach((b) => b.addEventListener("click", () => {
      const nom = noms[Number(b.getAttribute("data-supprimer"))];
      if (!window.confirm("Supprimer " + nom + " et toute sa progression sur cet appareil ?")) return;
      profils.supprimer(nom);
      if (nom === joueur) joueur = null;
      if (!profils.noms().length) bienvenue(); else quiJoue();
    }));
    brancherAjout(() => accueil());
  }

  // ---------- Accueil ----------
  function accueil() {
    if (!joueur) return demarrer();
    carteAuRepos();
    const bouton = (mode, texte) => '<button class="bouton bouton-principal" data-action="' + mode + '">' + texte + "</button>";
    ecran('<div class="entete-accueil"><span>Bonjour <strong>' + esc(joueur) + "</strong> !</span>" +
      '<button class="bouton-lien" data-action="joueurs">Changer de joueur</button></div>' +
      '<p class="etiquette">' + esc(majuscule(lib.lesElements)) + "</p>" +
      '<div class="grille-jeux">' + bouton("localiser", "Où se trouve ce " + esc(lib.element) + " ?") +
      bouton("nommer", "Quel est ce " + esc(lib.element) + " ?") + "</div>" +
      '<p class="etiquette">' + esc(majuscule(lib.capitales)) + "</p>" +
      '<div class="grille-jeux">' + bouton("capitale", "Quelle est sa " + esc(lib.capitale) + " ?") +
      bouton("capitaleVersElement", "De quel " + esc(lib.element) + " est cette " + esc(lib.capitale) + " ?") + "</div>" +
      '<div class="liens-accueil">' +
      '<button class="bouton-lien" data-action="bilan">Mon bilan</button>' +
      '<button class="bouton-lien" data-action="explorer">Explorer la carte</button>' +
      '<button class="bouton-lien" data-action="aide">Aide</button>' +
      '<button class="bouton-lien" data-action="sauvegarde">Changer d\'appareil</button></div>');
    for (const mode of ["localiser", "nommer", "capitale", "capitaleVersElement"]) surAction(mode, () => preparer(mode));
    surAction("joueurs", quiJoue);
    surAction("bilan", () => bilan("carte"));
    surAction("explorer", explorer);
    surAction("aide", aide);
    surAction("sauvegarde", sauvegarde);
  }

  // ---------- Changer d'appareil : code de sauvegarde ----------
  function sauvegarde() {
    carteAuRepos();
    ecran('<p class="titre-ecran">Changer d\'appareil</p>' +
      "<p>Pour retrouver la progression de <strong>" + esc(joueur) + "</strong> sur un autre téléphone ou ordinateur :</p>" +
      '<ol class="aide"><li>Créez le code ci-dessous et copiez-le.</li>' +
      "<li>Envoyez-le-vous (message, e-mail…).</li>" +
      "<li>Sur l'autre appareil, ouvrez le jeu, touchez « Changer d'appareil » et collez le code en bas.</li></ol>" +
      '<button class="bouton bouton-principal" data-action="creer">Créer mon code</button>' +
      '<div class="zone-code" hidden><textarea readonly rows="3" aria-label="Code de sauvegarde"></textarea>' +
      '<button class="bouton" data-action="copier">Copier le code</button><p class="message-info" role="status"></p></div>' +
      '<p class="etiquette">Récupérer une progression</p>' +
      '<textarea class="code-a-importer" rows="3" placeholder="Collez le code ici" aria-label="Code à importer"></textarea>' +
      '<button class="bouton" data-action="importer">Importer</button>' +
      '<p class="message-erreur" role="alert"></p>' +
      '<div class="rangee-boutons"><button class="bouton" data-action="retour">Retour</button></div>', true);

    const zone = panneau.querySelector(".zone-code");
    const champCode = zone.querySelector("textarea");
    const info = zone.querySelector(".message-info");
    surAction("creer", () => {
      champCode.value = profils.exporter(joueur);
      zone.hidden = false;
      info.textContent = "";
    });
    surAction("copier", () => {
      const repli = () => {
        champCode.focus();
        champCode.select();
        info.textContent = "Le code est sélectionné : copiez-le (appui long → Copier).";
      };
      if (navigator.clipboard) navigator.clipboard.writeText(champCode.value).then(() => { info.textContent = "✓ Code copié."; }, repli);
      else repli();
    });
    surAction("importer", () => {
      const erreur = panneau.querySelector(".message-erreur");
      let donnees;
      try { donnees = profils.lireCode(panneau.querySelector(".code-a-importer").value); } catch (e) {
        erreur.textContent = e.message;
        return;
      }
      confirmerImport(donnees);
    });
    surAction("retour", () => accueil());
  }

  function confirmerImport(donnees) {
    const existant = profils.noms().find((n) => n.toLowerCase() === donnees.nom.toLowerCase());
    const cible = existant || donnees.nom;
    let nbFiches = 0;
    for (const j in donnees.progression) for (const c in donnees.progression[j]) nbFiches += Object.keys(donnees.progression[j][c]).length;
    ecran('<p class="titre-ecran">Importer la progression</p>' +
      "<p>Ce code contient la progression de <strong>" + esc(donnees.nom) + "</strong> (" + nbFiches + " réponses mémorisées).</p>" +
      "<p>" + (existant
        ? "Elle sera ajoutée à celle de <strong>" + esc(cible) + "</strong> déjà présente sur cet appareil ; pour chaque " + esc(lib.element) + ", le résultat le plus récent est gardé."
        : "Un joueur <strong>" + esc(cible) + "</strong> sera créé sur cet appareil.") + "</p>" +
      '<div class="rangee-boutons"><button class="bouton bouton-principal" data-action="ok">Importer</button>' +
      '<button class="bouton" data-action="annuler">Annuler</button></div>' +
      '<p class="message-erreur" role="alert"></p>', true);
    surAction("ok", () => {
      const erreur = profils.importer(donnees, cible);
      if (erreur) {
        panneau.querySelector(".message-erreur").textContent = erreur;
        return;
      }
      chargerJoueur(cible);
      ecran("<p class=\"verdict\">✓ C'est fait !</p><p>La progression de <strong>" + esc(cible) + "</strong> est sur cet appareil.</p>" +
        '<div class="rangee-boutons"><button class="bouton bouton-principal" data-action="accueil">Accueil</button></div>');
      surAction("accueil", () => accueil());
    });
    surAction("annuler", sauvegarde);
  }

  // ---------- Exploration : toucher un pays pour voir sa fiche ----------
  function explorer() {
    carteAuRepos();
    ecran("<p>Touchez " + esc(lib.unElement) + " pour voir son nom et sa " + esc(lib.capitale) + ". " +
      "Zoomez avec la molette, les boutons + et −, ou deux doigts.</p>" +
      '<div class="rangee-boutons"><button class="bouton" data-action="retour">Retour</button></div>');
    surAction("retour", () => accueil());
    carte.auClic = (clic) => {
      carte.effacerMarques();
      let html;
      if (!clic.id) {
        html = '<p class="fiche-nom">' + esc(clic.territoire || (clic.lonlat ? "La mer" : "")) + "</p>";
      } else {
        const el = clic.element;
        carte.marquer(el.id, "choisi");
        const region = jeu.regions.find((r) => r.id === el.cont);
        const caps = el.cap.map((c) => c[0]);
        html = '<p class="fiche-nom">' + esc(el.nom) + "</p>" +
          "<p>" + esc(majuscule(caps.length > 1 ? lib.capitales : lib.capitale)) + " : <strong>" + esc(caps.join(", ")) + "</strong>" +
          " · " + esc(region ? region.nom : "") + "</p>";
        if (el.capNote) html += '<p class="statut">' + esc(el.capNote) + "</p>";
        if (el.statut) html += '<p class="statut">ⓘ Statut particulier : ' + esc(el.statut) + "</p>";
      }
      ecran(html + '<div class="rangee-boutons"><button class="bouton" data-action="retour">Retour</button></div>');
      surAction("retour", () => accueil());
    };
  }

  // ---------- Réglages avant la partie : région et niveau ----------

  function lireReglages() {
    const r = profils.reglages(joueur, jeu.id);
    if (r && jeu.regions.some((x) => x.id === r.region) && jeu.niveaux.some((x) => x.id === r.niveau)) return r;
    return { region: "tout", niveau: jeu.niveaux[0].id };
  }

  function niveauActuel() {
    return jeu.niveaux.find((n) => n.id === reglages.niveau);
  }

  // Zone de carte d'une région : son cadre, et quels éléments en font partie (les autres sont estompés)
  function zoneDe(idRegion) {
    const region = jeu.regions.find((r) => r.id === idRegion);
    if (!region || !region.cadre) return null;
    return Object.assign({}, region, { contient: (el) => GeoJeu.selection.dansRegion(el, region.id) });
  }

  function elementsDeLaPartie(niveau) {
    return GeoJeu.selection.selectionner(jeu, { region: reglages.region, niveau: niveau.n, nb: niveau.nb }, (id) => carte.aire(id));
  }

  function preparer(idMode) {
    const mode = GeoJeu.modes[idMode];
    carte.effacerMarques();
    carte.auClic = function () {};

    function afficher() {
      carte.definirZone(zoneDe(reglages.region)); // on montre tout de suite la région choisie
      const nv = niveauActuel();
      ecran('<p class="titre-ecran">' + esc(mode.nom(jeu)) + "</p>" +
        '<p class="etiquette" id="etq-region">Région</p>' +
        '<div class="choix" role="group" aria-labelledby="etq-region">' +
        jeu.regions.map((r) => '<button data-region="' + r.id + '" aria-pressed="' + (r.id === reglages.region) + '">' +
          esc(r.nom) + "</button>").join("") + "</div>" +
        '<p class="etiquette" id="etq-niveau">Niveau</p>' +
        '<div class="choix" role="group" aria-labelledby="etq-niveau">' +
        jeu.niveaux.map((n) => '<button data-niveau="' + n.id + '" aria-pressed="' + (n.id === nv.id) + '">' + esc(n.nom) + "</button>").join("") +
        "</div>" +
        '<p class="description-niveau">' + esc(nv.description) + " (" + elementsDeLaPartie(nv).length + " " + esc(pluriel) + " possibles)</p>" +
        '<div class="rangee-boutons">' +
        '<button class="bouton bouton-principal" data-action="commencer">Commencer</button>' +
        '<button class="bouton" data-action="retour">Retour</button></div>', true);

      panneau.querySelectorAll("[data-region]").forEach((b) => b.addEventListener("click", () => {
        reglages.region = b.getAttribute("data-region");
        afficher();
      }));
      panneau.querySelectorAll("[data-niveau]").forEach((b) => b.addEventListener("click", () => {
        reglages.niveau = b.getAttribute("data-niveau");
        afficher();
      }));
      surAction("commencer", () => {
        profils.enregistrerReglages(joueur, jeu.id, reglages);
        jouer(idMode);
      });
      surAction("retour", () => accueil());
    }
    afficher();
  }

  // ---------- Partie ----------
  function jouer(idMode) {
    const nv = niveauActuel();
    panneau.classList.remove("panneau-grand");
    carte.reinitialiserZoom();
    const partie = new GeoJeu.Partie({
      jeu: jeu,
      carte: carte,
      panneau: panneau,
      mode: GeoJeu.modes[idMode],
      elements: elementsDeLaPartie(nv),
      nbQuestions: nv.nb,
      strict: !!nv.strict,
      progression: progression,
      quandFini: (p) => {
        const rates = p.resultats.filter((r) => !r.juste).length;
        ecran('<p class="verdict">Résultat : ' + p.score + " / " + p.questions.length + "</p>" +
          "<p>" + (rates === 0 ? "Parfait ! Ces " + esc(pluriel) + " reviendront moins souvent."
            : rates === 1 ? "Celui que vous avez raté reviendra plus souvent dans les prochaines parties."
            : "Les " + rates + " que vous avez ratés reviendront plus souvent dans les prochaines parties.") + "</p>" +
          '<div class="rangee-boutons">' +
          '<button class="bouton bouton-principal" data-action="rejouer">Rejouer</button>' +
          '<button class="bouton" data-action="reglages">Changer de région ou de niveau</button>' +
          '<button class="bouton" data-action="accueil">Accueil</button></div>');
        surAction("rejouer", () => jouer(idMode));
        surAction("reglages", () => preparer(idMode));
        surAction("accueil", () => accueil());
      }
    });
    partie.demarrer();
  }

  // ---------- Bilan : carte de maîtrise et statistiques par continent ----------
  const ETATS = [
    { id: "su", nom: "Su", pluriel: "Sus" },
    { id: "hesitant", nom: "Hésitant", pluriel: "Hésitants" },
    { id: "a-revoir", nom: "À revoir", pluriel: "À revoir" },
    { id: "nouveau", nom: "Jamais demandé", pluriel: "Jamais demandés" }
  ];
  const COMPETENCES = [
    { id: "carte", nom: "Carte des " + pluriel },
    { id: "capitale", nom: majuscule(lib.capitales) }
  ];

  function bilan(competence) {
    carteAuRepos();

    const etats = new Map(jeu.elements.map((e) => [e.id, progression.etat(competence, e.id)]));
    const marques = new Map();
    for (const [id, etat] of etats) if (etat !== "nouveau") marques.set(id, "maitrise-" + etat);
    carte.definirMarques(marques);

    // Comptes par état, au total et par groupe (continent principal de chaque élément)
    const groupes = jeu.regions.filter((r) => r.id !== "tout");
    const vide = () => ({ total: 0, su: 0, hesitant: 0, "a-revoir": 0, nouveau: 0 });
    const parGroupe = new Map(groupes.map((g) => [g.id, vide()]));
    const total = vide();
    for (const el of jeu.elements) {
      const etat = etats.get(el.id);
      for (const c of [parGroupe.get(el.cont), total]) {
        if (!c) continue;
        c.total++;
        c[etat]++;
      }
    }

    const ligne = (nom, c, classe) => "<tr" + (classe ? ' class="' + classe + '"' : "") + "><th scope=\"row\">" + esc(nom) + "</th>" +
      "<td>" + c.su + " / " + c.total + '<span class="barre-maitrise"><span style="width:' + Math.round(100 * c.su / c.total) + '%"></span></span></td>' +
      "<td>" + c.hesitant + "</td><td>" + c["a-revoir"] + "</td></tr>";

    ecran('<p class="titre-ecran">Bilan de ' + esc(joueur) + "</p>" +
      '<div class="choix" role="group" aria-label="Compétence">' +
      COMPETENCES.map((c) => '<button data-competence="' + c.id + '" aria-pressed="' + (c.id === competence) + '">' + esc(c.nom) + "</button>").join("") +
      "</div>" +
      '<ul class="legende">' +
      ETATS.map((e) => '<li><span class="echantillon echantillon-' + e.id + '"></span>' + esc(e.pluriel) + " : <strong>" + total[e.id] + "</strong></li>").join("") +
      "</ul>" +
      (total.nouveau === total.total
        ? "<p>Vous n'avez pas encore joué à ce type de questions : le bilan se remplira au fil des parties.</p>"
        : '<p id="info-element" class="statut">Touchez ' + esc(lib.unElement) + " sur la carte pour voir où vous en êtes.</p>" +
          '<table class="tableau-bilan"><thead><tr><th scope="col">' + esc(majuscule(lib.groupe)) +
          '</th><th scope="col">Sus</th><th scope="col">Hésitants</th><th scope="col">À revoir</th></tr></thead><tbody>' +
          groupes.map((g) => ligne(g.nom, parGroupe.get(g.id))).join("") + ligne("Total", total, "ligne-total") +
          "</tbody></table>") +
      '<div class="rangee-boutons"><button class="bouton" data-action="accueil">Retour</button></div>', true);

    panneau.querySelectorAll("[data-competence]").forEach((b) => b.addEventListener("click", () => bilan(b.getAttribute("data-competence"))));
    surAction("accueil", () => accueil());

    const info = panneau.querySelector("#info-element");
    carte.auClic = (clic) => {
      if (!clic.id || !info) return;
      const f = progression.fiche(competence, clic.id);
      const etat = ETATS.find((e) => e.id === etats.get(clic.id));
      info.innerHTML = "<strong>" + esc(clic.element.nom) + "</strong> : " + esc(etat.nom) +
        (f ? " (réussi " + f.j + " fois sur " + f.v + ")" : "");
    };
  }

  demarrer();
})();
