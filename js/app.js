// Écrans de l'application : bienvenue, choix du joueur, accueil, aide, sauvegarde,
// réglages avant la partie, partie, bilan, exploration de la carte.
(function () {
  const esc = GeoJeu.outils.esc;
  const profils = GeoJeu.profils;
  // Adresse en ligne du jeu, pour fabriquer les liens de sauvegarde quand la page est ouverte depuis un fichier
  const ADRESSE_PUBLIQUE = "https://najrack.github.io/jeu-geographie/";
  const majuscule = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const panneau = document.getElementById("panneau");
  const bulle = document.getElementById("bulle");
  const zoneCarte = document.getElementById("zone-carte");
  const choixProjection = document.getElementById("choix-projection");

  // ---------- Jeu de données en cours (le monde, la France…) ----------
  let jeu = null;     // réglages et éléments du jeu ouvert
  let lib = null;     // ses mots (« pays », « capitale »…)
  let pluriel = "";   // « pays », « départements »
  let carte = null;

  function ouvrirJeu(id) {
    return GeoJeu.charger(id).then((donnees) => {
      if (carte) carte.detruire();
      jeu = donnees;
      lib = jeu.libelles;
      pluriel = lib.lesElements.replace(/^les /, "");
      carte = new GeoJeu.Carte(zoneCarte, jeu);
      window.carte = carte; // pratique pour tester depuis la console du navigateur
      carte.auZoomAuto = () => montrerBulle("Plusieurs petits " + pluriel + " ici : zoom avant. Touchez à nouveau.");
      carte.auMessage = montrerBulle;
      construireChoixProjection();
      if (joueur) {
        progression = new GeoJeu.Progression(joueur, jeu.id);
        reglages = lireReglages();
        profils.enregistrerReglages(joueur, "_general", { jeu: jeu.id });
      }
    });
  }

  // Dernier jeu ouvert par ce joueur (le monde par défaut)
  function jeuDuJoueur(nom) {
    const general = nom && profils.reglages(nom, "_general");
    const id = general && general.jeu;
    return GeoJeu.catalogue.some((j) => j.id === id) ? id : GeoJeu.catalogue[0].id;
  }

  // ---------- Barre du haut ----------
  // Choix de projection, seulement si le jeu en propose plusieurs
  function construireChoixProjection() {
    choixProjection.innerHTML = "";
    choixProjection.hidden = jeu.projections.length < 2;
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
  }

  document.querySelector(".boutons-zoom").addEventListener("click", (e) => {
    const z = e.target.closest("[data-zoom]");
    if (!z) return;
    const action = z.getAttribute("data-zoom");
    if (action === "plus") carte.zoomer(2);
    else if (action === "moins") carte.zoomer(0.5);
    else carte.reinitialiserZoom();
  });

  // ⌂ : retour à l'accueil, avec confirmation si une partie est en cours (un toucher par erreur arrive vite)
  document.getElementById("btn-accueil").addEventListener("click", () => {
    if (partieEnCours && partieEnCours.resultats.length &&
        !window.confirm("Quitter la partie en cours ? Les réponses déjà données restent enregistrées.")) return;
    accueil();
  });

  let minuterieBulle = null;
  function montrerBulle(texte) {
    bulle.textContent = texte;
    bulle.hidden = false;
    clearTimeout(minuterieBulle);
    minuterieBulle = setTimeout(() => { bulle.hidden = true; }, 2500);
  }

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
  // Adresse du jeu à mettre dans les liens partagés
  function adresseDuJeu() {
    return location.protocol.startsWith("http") ? location.origin + location.pathname : ADRESSE_PUBLIQUE;
  }

  // Copie un texte ; renvoie une promesse vraie si c'est fait, fausse si le navigateur refuse
  function copierTexte(texte) {
    if (!navigator.clipboard) return Promise.resolve(false);
    return navigator.clipboard.writeText(texte).then(() => true, () => false);
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
    if (nom) chargerJoueur(nom);
    const lien = lireLienImport();
    if (lien && lien.erreur) return erreurLien(lien.erreur);
    if (lien) return confirmerImport(lien.donnees);
    if (!profils.noms().length) bienvenue();
    else if (nom) accueil();
    else quiJoue();
  }

  // Page ouverte depuis un lien de sauvegarde (…/#importer=GEO1-…) ? La partie après # reste sur l'appareil.
  function lireLienImport() {
    const m = location.hash.match(/^#importer=(.+)$/);
    if (!m) return null;
    history.replaceState(null, "", location.pathname + location.search); // pour ne pas réimporter en rechargeant
    try { return { donnees: profils.lireCode(decodeURIComponent(m[1])) }; } catch (e) { return { erreur: e.message }; }
  }

  function erreurLien(message) {
    carteAuRepos();
    ecran('<p class="titre-ecran">Lien de sauvegarde illisible</p>' +
      "<p>" + esc(message) + "</p>" +
      "<p>Le lien a peut-être été coupé en route. Demandez-le à nouveau, ou utilisez plutôt le code (« Sauvegarde »).</p>" +
      '<div class="rangee-boutons"><button class="bouton bouton-principal" data-action="continuer">Continuer</button></div>');
    surAction("continuer", demarrer);
  }

  // ---------- Aide ----------
  const texteAide = () =>
    '<ul class="aide">' +
    "<li>En haut de l'accueil, choisissez la carte : <strong>Le monde</strong> (pays et capitales) ou <strong>La France</strong> " +
    "(départements, numéros et préfectures).</li>" +
    "<li>Choisissez un jeu, puis une région et un niveau : <strong>Facile</strong>, <strong>Moyen</strong> ou <strong>Expert</strong>. " +
    "« À la carte » vous laisse choisir ce qui est donné et ce qu'il faut trouver.</li>" +
    "<li>Pour vous déplacer sur la carte, faites-la glisser. Pour zoomer : deux doigts, la molette, ou les boutons + et −.</li>" +
    "<li>Pour répondre sur la carte, touchez " + esc(lib.unElement) + " : il devient orange. Validez avec le bouton, ou en le touchant une seconde fois.</li>" +
    "<li>Les tout petits " + esc(pluriel) + " ont une pastille ronde. Quand plusieurs sont collées, la carte zoome d'abord.</li>" +
    "<li>Les réponses tapées acceptent les fautes légères, les accents oubliés et les majuscules.</li>" +
    "<li>Les " + esc(pluriel) + " ratés reviennent plus souvent. « Mon bilan » montre vos progrès, carte par carte.</li>" +
    "<li>Tout reste sur cet appareil : rien n'est envoyé sur internet.</li>" +
    "</ul>";

  function aide() {
    carteAuRepos();
    ecran('<p class="titre-ecran">Comment jouer</p>' + texteAide() +
      '<p class="titre-ecran">Mettre le jeu sur l\'écran d\'accueil</p>' +
      '<ul class="aide">' +
      "<li><strong>iPhone, iPad</strong> : ouvrez le jeu dans <strong>Safari</strong> (pas depuis WhatsApp ou Gmail : utilisez « Ouvrir dans Safari »). " +
      "Touchez le bouton Partager (carré avec une flèche vers le haut ; sur les iPhone récents, il est dans le menu « ⋯ »), " +
      "<strong>faites défiler la liste vers le bas</strong>, puis « Sur l'écran d'accueil » (ou « Ajouter à l'écran d'accueil »). " +
      "Si l'option « Ouvrir comme app web » apparaît, laissez-la <strong>cochée</strong>. " +
      "Absent ? Tout en bas : « Modifier les actions… » pour l'ajouter.</li>" +
      "<li><strong>Android</strong> (Chrome) : menu ⋮ en haut à droite, puis « Installer l'application » ou « Ajouter à l'écran d'accueil ».</li>" +
      "<li>Une fois installé, le jeu s'ouvre comme une application et marche aussi <strong>sans internet</strong>.</li>" +
      "<li>Sur iPhone, le jeu installé a sa propre mémoire, séparée de Safari : pour y retrouver une progression, " +
      "utilisez « Sauvegarde » → « Copier le code » dans Safari, puis collez le code dans le jeu installé.</li>" +
      "</ul>" +
      '<div class="rangee-boutons"><button class="bouton bouton-principal" data-action="retour">J\'ai compris</button></div>', true);
    surAction("retour", () => accueil());
  }

  // ---------- Premier lancement ----------
  function bienvenue() {
    carteAuRepos();
    ecran('<p class="titre-ecran">Bienvenue !</p>' +
      "<p>Ce jeu vous aide à apprendre où sont les pays du monde et leurs capitales, ainsi que les départements français.</p>" +
      texteAide() +
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
    partieEnCours = null;
    if (!joueur) return demarrer();
    carteAuRepos();
    // Espace insécable avant « ? » pour qu'il ne se retrouve pas seul à la ligne
    const bouton = (mode, texte) => '<button class="bouton bouton-principal" data-action="' + mode + '">' +
      texte.replace(/ \?$/, " ?") + "</button>";
    ecran('<div class="entete-accueil"><span>Bonjour <strong>' + esc(joueur) + "</strong> !</span>" +
      '<button class="bouton-lien" data-action="joueurs">Changer de joueur</button></div>' +
      '<div class="choix choix-jeu" role="group" aria-label="Carte">' +
      GeoJeu.catalogue.map((j) => '<button data-jeu="' + j.id + '" aria-pressed="' + (j.id === jeu.id) + '">' + esc(j.titre) + "</button>").join("") +
      "</div>" +
      '<p class="etiquette">' + esc(majuscule(lib.lesElements)) + "</p>" +
      '<div class="grille-jeux">' + bouton("localiser", "Où se trouve ce " + esc(lib.element) + " ?") +
      bouton("nommer", "Quel est ce " + esc(lib.element) + " ?") + "</div>" +
      '<p class="etiquette">' + esc(majuscule(lib.capitales)) + "</p>" +
      '<div class="grille-jeux">' + bouton("capitale", "Quelle est sa " + esc(lib.capitale) + " ?") +
      bouton("capitaleVersElement", "De quel " + esc(lib.element) + " est cette " + esc(lib.capitale) + " ?") + "</div>" +
      (lib.numero
        ? '<p class="etiquette">' + esc(majuscule(lib.numero)) + "s</p>" +
          '<div class="grille-jeux">' + bouton("numero", "Quel est son " + esc(lib.numero) + " ?") +
          bouton("numeroVersElement", "Quel " + esc(lib.element) + " porte ce " + esc(lib.numero) + " ?") + "</div>"
        : "") +
      '<p class="etiquette">Tout ensemble</p>' +
      '<button class="bouton bouton-principal bouton-large" data-action="alaCarte">À la carte' +
      "<span>Choisissez ce qui est donné et ce qu'il faut trouver</span></button>" +
      '<div class="liens-accueil">' +
      '<button class="bouton-lien" data-action="bilan">Mon bilan</button>' +
      '<button class="bouton-lien" data-action="explorer">Explorer</button>' +
      '<button class="bouton-lien" data-action="aide">Aide</button>' +
      '<button class="bouton-lien" data-action="sauvegarde" title="Changer d\'appareil">Sauvegarde</button>' +
      (demandeInstallation ? '<button class="bouton-lien" data-action="installer">Installer</button>' : "") +
      "</div>", true);
    surAction("installer", installer);
    panneau.querySelectorAll("[data-jeu]").forEach((b) => b.addEventListener("click", () => {
      const id = b.getAttribute("data-jeu");
      if (id !== jeu.id) ouvrirJeu(id).then(accueil);
    }));
    for (const mode of ["localiser", "nommer", "capitale", "capitaleVersElement", "numero", "numeroVersElement", "alaCarte"]) {
      surAction(mode, () => preparer(mode));
    }
    surAction("joueurs", quiJoue);
    surAction("bilan", () => bilan("carte"));
    surAction("explorer", explorer);
    surAction("aide", aide);
    surAction("sauvegarde", sauvegarde);
  }

  // ---------- Changer d'appareil : code de sauvegarde ----------
  function sauvegarde() {
    carteAuRepos();
    ecran('<p class="titre-ecran">Sauvegarde : changer d\'appareil</p>' +
      "<p>Pour retrouver la progression de <strong>" + esc(joueur) + "</strong> sur un autre téléphone ou ordinateur :</p>" +
      '<ol class="aide"><li>Touchez « Préparer l\'envoi ».</li>' +
      "<li>« Envoyer » ouvre le partage du téléphone (message, e-mail…). Vous pouvez aussi copier le lien, ou le code.</li>" +
      "<li>Sur l'autre appareil, touchez le lien reçu : le jeu s'ouvre et propose l'import. " +
      "Avec le code : « Sauvegarde », puis collez-le en bas de l'écran.</li></ol>" +
      '<button class="bouton bouton-principal" data-action="creer">Préparer l\'envoi</button>' +
      '<div class="zone-code" hidden><div class="rangee-boutons">' +
      (navigator.share ? '<button class="bouton bouton-principal" data-action="partager">Envoyer…</button>' : "") +
      '<button class="bouton" data-action="copier-lien">Copier le lien</button>' +
      '<button class="bouton" data-action="copier-code">Copier le code</button></div>' +
      '<p class="message-info" role="status"></p>' +
      '<details><summary>Voir le code</summary><textarea readonly rows="3" aria-label="Code de sauvegarde"></textarea></details></div>' +
      '<p class="etiquette">Récupérer une progression</p>' +
      '<textarea class="code-a-importer" rows="3" placeholder="Collez le code ici" aria-label="Code à importer"></textarea>' +
      '<button class="bouton" data-action="importer">Importer</button>' +
      '<p class="message-erreur" role="alert"></p>' +
      '<div class="rangee-boutons"><button class="bouton" data-action="retour">Retour</button></div>', true);

    const zone = panneau.querySelector(".zone-code");
    const champCode = zone.querySelector("textarea");
    const info = zone.querySelector(".message-info");
    let code = "", lien = "";
    surAction("creer", () => {
      code = profils.exporter(joueur);
      lien = adresseDuJeu() + "#importer=" + profils.codePourLien(code);
      champCode.value = code;
      zone.hidden = false;
      info.textContent = "";
    });
    // Copie dans le presse-papiers ; si le navigateur refuse, on montre le texte sélectionné à copier à la main
    function copier(texte, quoi) {
      copierTexte(texte).then((ok) => {
        if (ok) {
          info.textContent = "✓ " + majuscule(quoi) + " copié.";
          return;
        }
        champCode.value = texte;
        champCode.parentNode.open = true;
        champCode.focus();
        champCode.select();
        info.textContent = "Le " + quoi + " est sélectionné : copiez-le (appui long → Copier).";
      });
    }
    surAction("copier-lien", () => copier(lien, "lien"));
    surAction("copier-code", () => copier(code, "code"));
    surAction("partager", () => {
      navigator.share({
        title: "Planisphère – progression de " + joueur,
        text: "Pour retrouver la progression de " + joueur + " dans le jeu de géographie, ouvre ce lien sur l'autre appareil :",
        url: lien
      }).catch(() => { /* partage annulé */ });
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
    surAction("annuler", () => (joueur ? sauvegarde() : demarrer()));
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
        html = '<p class="fiche-nom">' + esc(el.nom) + (el.num ? " <span class=\"numero\">(" + esc(el.num) + ")</span>" : "") + "</p>" +
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
    let r = profils.reglages(joueur, jeu.id);
    if (!(r && jeu.regions.some((x) => x.id === r.region) && jeu.niveaux.some((x) => x.id === r.niveau))) {
      r = { region: "tout", niveau: jeu.niveaux[0].id };
    }
    // Mode « à la carte » : par défaut, une information au hasard et toutes les autres à trouver
    const infos = GeoJeu.modes.alaCarte.infos(jeu);
    const a = r.alaCarte;
    if (!(a && (a.donne === "hasard" || infos.includes(a.donne)) && Array.isArray(a.trouver) && a.trouver.every((t) => infos.includes(t)))) {
      r.alaCarte = { donne: "hasard", trouver: infos.slice() };
    }
    return r;
  }

  // Le mode « à la carte » se règle avant chaque partie ; les autres modes sont fixes
  function modeDe(idMode) {
    return idMode === "alaCarte" ? GeoJeu.modes.alaCarte.configurer(jeu, reglages.alaCarte) : GeoJeu.modes[idMode];
  }

  // Ce qui reste à trouver avec les réglages « à la carte » (vide = réglage impossible)
  function aTrouverAlaCarte() {
    const a = reglages.alaCarte;
    return a.trouver.filter((t) => a.donne === "hasard" || t !== a.donne);
  }

  function reglagesAlaCarte() {
    const a = reglages.alaCarte;
    const alaCarte = GeoJeu.modes.alaCarte;
    const infos = alaCarte.infos(jeu);
    return '<p class="etiquette" id="etq-donne">On vous donne</p>' +
      '<div class="choix" role="group" aria-labelledby="etq-donne">' +
      ["hasard"].concat(infos).map((i) => '<button data-donne="' + i + '" aria-pressed="' + (i === a.donne) + '">' +
        esc(i === "hasard" ? "Au hasard" : alaCarte.nomInfo(jeu, i)) + "</button>").join("") + "</div>" +
      '<p class="etiquette" id="etq-trouver">À trouver</p>' +
      '<div class="choix" role="group" aria-labelledby="etq-trouver">' +
      infos.filter((i) => a.donne === "hasard" || i !== a.donne).map((i) => '<button data-trouver="' + i + '" aria-pressed="' +
        a.trouver.includes(i) + '">' + esc(alaCarte.nomInfo(jeu, i)) + "</button>").join("") + "</div>" +
      (aTrouverAlaCarte().length ? "" : '<p class="message-erreur">Choisissez au moins une information à trouver.</p>');
  }

  function niveauActuel() {
    return jeu.niveaux.find((n) => n.id === reglages.niveau);
  }

  // Zone de carte d'une région : son cadre, et quels éléments en font partie (les autres sont estompés).
  // Sans cadre dans les réglages (régions françaises), il est calculé à partir de ses éléments.
  function zoneDe(idRegion) {
    const region = jeu.regions.find((r) => r.id === idRegion);
    if (!region || region.id === "tout") return null;
    const contient = (el) => GeoJeu.selection.dansRegion(el, region.id);
    const cadre = region.cadre || carte.cadreDe(contient);
    return cadre ? Object.assign({}, region, { cadre: cadre, contient: contient }) : null;
  }

  function elementsDeLaPartie(niveau) {
    return GeoJeu.selection.selectionner(jeu, { region: reglages.region, niveau: niveau.n, nb: niveau.nb }, (id) => carte.aire(id));
  }

  function preparer(idMode) {
    const mode = GeoJeu.modes[idMode];
    carte.effacerMarques();
    carte.auClic = function () {};

    // boutonTouche : sélecteur du bouton qui vient d'être touché. L'écran est alors redessiné
    // sans remonter en haut, et ce bouton garde le focus (utile au clavier).
    function afficher(boutonTouche) {
      const defilement = panneau.scrollTop;
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
        (idMode === "alaCarte" ? reglagesAlaCarte() : "") +
        '<div class="rangee-boutons barre-actions">' +
        '<button class="bouton bouton-principal" data-action="commencer"' +
        (idMode === "alaCarte" && !aTrouverAlaCarte().length ? " disabled" : "") + ">Commencer</button>" +
        '<button class="bouton" data-action="retour">Retour</button></div>', true);
      if (boutonTouche) {
        panneau.scrollTop = defilement;
        const b = panneau.querySelector(boutonTouche);
        if (b) b.focus({ preventScroll: true });
      }

      panneau.querySelectorAll("[data-region]").forEach((b) => b.addEventListener("click", () => {
        reglages.region = b.getAttribute("data-region");
        afficher('[data-region="' + reglages.region + '"]');
      }));
      panneau.querySelectorAll("[data-niveau]").forEach((b) => b.addEventListener("click", () => {
        reglages.niveau = b.getAttribute("data-niveau");
        afficher('[data-niveau="' + reglages.niveau + '"]');
      }));
      panneau.querySelectorAll("[data-donne]").forEach((b) => b.addEventListener("click", () => {
        reglages.alaCarte.donne = b.getAttribute("data-donne");
        afficher('[data-donne="' + reglages.alaCarte.donne + '"]');
      }));
      panneau.querySelectorAll("[data-trouver]").forEach((b) => b.addEventListener("click", () => {
        const info = b.getAttribute("data-trouver");
        const t = reglages.alaCarte.trouver;
        reglages.alaCarte.trouver = t.includes(info) ? t.filter((x) => x !== info) : t.concat(info);
        afficher('[data-trouver="' + info + '"]');
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
  let partieEnCours = null; // pour demander confirmation avant de quitter une partie commencée

  // elementsImposes : pour « Revoir les ratés », la partie ne porte que sur ces éléments
  function jouer(idMode, elementsImposes) {
    const nv = niveauActuel();
    panneau.classList.remove("panneau-grand");
    carte.reinitialiserZoom();
    partieEnCours = new GeoJeu.Partie({
      jeu: jeu,
      carte: carte,
      panneau: panneau,
      mode: modeDe(idMode),
      elements: elementsImposes || elementsDeLaPartie(nv),
      nbQuestions: elementsImposes ? elementsImposes.length : nv.nb,
      strict: !!nv.strict,
      progression: progression,
      quandFini: (p) => {
        partieEnCours = null;
        finDePartie(idMode, p);
      }
    });
    partieEnCours.demarrer();
  }

  // Résultat : un mot d'encouragement, la liste des ratés avec la bonne réponse, et de quoi les revoir tout de suite
  function finDePartie(idMode, p) {
    const total = p.questions.length;
    const rates = p.resultats.filter((r) => !r.juste).map((r) => jeu.elements.find((e) => e.id === r.id));
    const part = p.score / total;
    const mot = part === 1 ? "Parfait, aucune erreur !" : part >= 0.8 ? "Très bien !" : part >= 0.5 ? "Pas mal, continuez comme ça !"
      : "Chaque partie vous fait progresser.";
    const detail = (el) => "<li><strong>" + esc(el.nom) + "</strong>" + (el.num ? " (" + esc(el.num) + ")" : "") +
      (el.cap && el.cap.length ? " · " + esc(el.cap.map((c) => c[0]).join(", ")) : "") + "</li>";
    ecran('<p class="verdict">Résultat : ' + p.score + " / " + total + "</p>" +
      "<p>" + mot + "</p>" +
      (rates.length
        ? '<p class="etiquette">À revoir</p><ul class="liste-rates">' + rates.map(detail).join("") + "</ul>" +
          '<p class="statut">Ils reviendront plus souvent dans les prochaines parties.</p>'
        : '<p class="statut">Ces ' + esc(pluriel) + " reviendront moins souvent.</p>") +
      '<div class="rangee-boutons barre-actions">' +
      (rates.length ? '<button class="bouton bouton-principal" data-action="revoir">Revoir ' +
        (rates.length === 1 ? "celui-ci" : "ces " + rates.length) + " maintenant</button>" : "") +
      '<button class="bouton' + (rates.length ? "" : " bouton-principal") + '" data-action="rejouer">Nouvelle partie</button>' +
      '<button class="bouton" data-action="reglages">Changer de région ou de niveau</button>' +
      '<button class="bouton" data-action="accueil">Accueil</button></div>', true);
    surAction("revoir", () => jouer(idMode, rates));
    surAction("rejouer", () => jouer(idMode));
    surAction("reglages", () => preparer(idMode));
    surAction("accueil", () => accueil());
  }

  // ---------- Bilan : carte de maîtrise et statistiques par continent ----------
  const ETATS = [
    { id: "su", nom: "Su", pluriel: "Sus" },
    { id: "hesitant", nom: "Hésitant", pluriel: "Hésitants" },
    { id: "a-revoir", nom: "À revoir", pluriel: "À revoir" },
    { id: "nouveau", nom: "Jamais demandé", pluriel: "Jamais demandés" }
  ];
  const competences = () => [
    { id: "carte", nom: "Carte des " + pluriel },
    { id: "capitale", nom: majuscule(lib.capitales) }
  ].concat(lib.numero ? [{ id: "numero", nom: majuscule(lib.numero) + "s" }] : []);

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
      competences().map((c) => '<button data-competence="' + c.id + '" aria-pressed="' + (c.id === competence) + '">' + esc(c.nom) + "</button>").join("") +
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

  // ---------- Hors ligne et installation ----------
  // Le service worker garde le jeu sur l'appareil (impossible quand la page est ouverte depuis un fichier).
  // Sur le serveur de test local, il est désactivé pour toujours voir la dernière version, sauf avec ?hors-ligne.
  const local = location.hostname === "localhost" || location.hostname === "127.0.0.1";
  if ("serviceWorker" in navigator && location.protocol !== "file:" && (!local || location.search.includes("hors-ligne"))) {
    navigator.serviceWorker.register("sw.js").catch(() => { /* le jeu marche quand même, en ligne */ });
  }

  // Android et ordinateur : le navigateur propose l'installation, on la garde pour un bouton de l'accueil
  let demandeInstallation = null;
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    demandeInstallation = e;
    if (panneau.querySelector(".liens-accueil")) accueil();
  });
  window.addEventListener("appinstalled", () => { demandeInstallation = null; });

  function installer() {
    if (!demandeInstallation) return aide();
    demandeInstallation.prompt();
    demandeInstallation.userChoice.finally(() => {
      demandeInstallation = null;
      accueil();
    });
  }

  // Démarrage : on ouvre le dernier jeu du joueur, puis on affiche le bon écran
  ouvrirJeu(jeuDuJoueur(profils.actif())).then(() => {
    document.getElementById("message-chargement").remove();
    demarrer();
  }, (e) => {
    document.querySelector("#message-chargement p").textContent = "Le jeu n'a pas pu se charger : " + e.message;
  });
})();
