// Écrans de l'application : accueil, exploration de la carte, partie.
(function () {
  const esc = GeoJeu.outils.esc;
  const jeu = GeoJeu.jeux.monde;
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

  document.getElementById("btn-accueil").addEventListener("click", accueil);

  let minuterieBulle = null;
  function montrerBulle(texte) {
    bulle.textContent = texte;
    bulle.hidden = false;
    clearTimeout(minuterieBulle);
    minuterieBulle = setTimeout(() => { bulle.hidden = true; }, 2500);
  }
  carte.auZoomAuto = () => montrerBulle("Plusieurs petits pays ici : zoom avant. Touchez à nouveau.");

  // ---------- Accueil ----------
  function accueil() {
    panneau.classList.remove("panneau-grand"); // le bouton ⌂ peut être touché depuis les réglages
    carte.effacerMarques();
    carte.auClic = function () {};
    carte.definirZone(null);
    carte.reinitialiserZoom();
    panneau.innerHTML =
      "<p><strong>Bienvenue !</strong> Que voulez-vous faire ?</p>" +
      '<div class="rangee-boutons">' +
      '<button class="bouton bouton-principal" data-action="localiser">Où se trouve ce pays ?</button>' +
      '<button class="bouton bouton-principal" data-action="nommer">Quel est ce pays ?</button>' +
      '<button class="bouton bouton-principal" data-action="capitale">Quelle est sa capitale ?</button>' +
      '<button class="bouton bouton-principal" data-action="capitaleVersElement">De quel pays est cette capitale ?</button>' +
      '<button class="bouton" data-action="explorer">Explorer la carte</button>' +
      "</div>";
    for (const mode of ["localiser", "nommer", "capitale", "capitaleVersElement"]) {
      panneau.querySelector('[data-action="' + mode + '"]').addEventListener("click", () => preparer(mode));
    }
    panneau.querySelector('[data-action="explorer"]').addEventListener("click", explorer);
  }

  // ---------- Exploration : toucher un pays pour voir sa fiche ----------
  function explorer() {
    carte.effacerMarques();
    panneau.innerHTML = "<p>Touchez un pays pour voir son nom et sa capitale. " +
      "Zoomez avec la molette, les boutons + et −, ou deux doigts.</p>";
    carte.auClic = (clic) => {
      carte.effacerMarques();
      if (!clic.id) {
        panneau.innerHTML = "<p class=\"fiche-nom\">" + esc(clic.territoire || (clic.lonlat ? "La mer" : "")) + "</p>";
        return;
      }
      const el = clic.element;
      carte.marquer(el.id, "choisi");
      const region = jeu.regions.find((r) => r.id === el.cont);
      const caps = el.cap.map((c) => c[0]);
      let html = '<p class="fiche-nom">' + esc(el.nom) + "</p>" +
        "<p>" + (caps.length > 1 ? "Capitales : " : "Capitale : ") + "<strong>" + esc(caps.join(", ")) + "</strong>" +
        " · " + esc(region ? region.nom : "") + "</p>";
      if (el.capNote) html += '<p class="statut">' + esc(el.capNote) + "</p>";
      if (el.statut) html += '<p class="statut">ⓘ Statut particulier : ' + esc(el.statut) + "</p>";
      panneau.innerHTML = html;
    };
  }

  // ---------- Réglages avant la partie : région et difficulté ----------
  const NB_QUESTIONS = 10;
  const CLE_REGLAGES = "geojeu.reglages." + jeu.id;
  let reglages = lireReglages();

  // Mémorisés sur cet appareil pour la prochaine fois (sans conséquence si le navigateur refuse)
  function lireReglages() {
    try {
      const r = JSON.parse(localStorage.getItem(CLE_REGLAGES));
      if (r && jeu.regions.some((x) => x.id === r.region) && jeu.niveaux.some((x) => x.n === r.niveau)) return r;
    } catch (e) { /* stockage indisponible */ }
    return { region: "tout", niveau: 1 };
  }
  function enregistrerReglages() {
    try { localStorage.setItem(CLE_REGLAGES, JSON.stringify(reglages)); } catch (e) { /* stockage indisponible */ }
  }

  function elementsDeLaPartie(niveau) {
    return GeoJeu.selection.selectionner(jeu, { region: reglages.region, niveau: niveau, nb: NB_QUESTIONS }, (id) => carte.aire(id));
  }

  function preparer(idMode) {
    const mode = GeoJeu.modes[idMode];
    carte.effacerMarques();
    carte.auClic = function () {};

    function afficher() {
      const region = jeu.regions.find((r) => r.id === reglages.region);
      carte.definirZone(region); // on montre tout de suite la région choisie
      panneau.classList.add("panneau-grand");
      panneau.innerHTML =
        '<p class="titre-ecran">' + esc(mode.nom(jeu)) + "</p>" +
        '<p class="etiquette" id="etq-region">Région</p>' +
        '<div class="choix" role="group" aria-labelledby="etq-region">' +
        jeu.regions.map((r) => '<button data-region="' + r.id + '" aria-pressed="' + (r.id === reglages.region) + '">' +
          esc(r.nom) + "</button>").join("") + "</div>" +
        '<p class="etiquette" id="etq-niveau">Difficulté</p>' +
        '<div class="choix" role="group" aria-labelledby="etq-niveau">' +
        jeu.niveaux.map((nv) => '<button data-niveau="' + nv.n + '" aria-pressed="' + (nv.n === reglages.niveau) + '">' +
          esc(nv.nom) + ' <span class="nombre">(' + elementsDeLaPartie(nv.n).length + ")</span></button>").join("") + "</div>" +
        '<div class="rangee-boutons">' +
        '<button class="bouton bouton-principal" data-action="commencer">Commencer</button>' +
        '<button class="bouton" data-action="retour">Retour</button></div>';

      panneau.querySelectorAll("[data-region]").forEach((b) => b.addEventListener("click", () => {
        reglages.region = b.getAttribute("data-region");
        afficher();
      }));
      panneau.querySelectorAll("[data-niveau]").forEach((b) => b.addEventListener("click", () => {
        reglages.niveau = Number(b.getAttribute("data-niveau"));
        afficher();
      }));
      panneau.querySelector('[data-action="commencer"]').addEventListener("click", () => {
        panneau.classList.remove("panneau-grand");
        enregistrerReglages();
        jouer(idMode);
      });
      panneau.querySelector('[data-action="retour"]').addEventListener("click", accueil);
    }
    afficher();
  }

  // ---------- Partie ----------
  function jouer(idMode) {
    carte.reinitialiserZoom();
    const partie = new GeoJeu.Partie({
      jeu: jeu,
      carte: carte,
      panneau: panneau,
      mode: GeoJeu.modes[idMode],
      elements: elementsDeLaPartie(reglages.niveau),
      nbQuestions: NB_QUESTIONS,
      quandFini: (p) => {
        panneau.innerHTML =
          '<p class="verdict">Résultat : ' + p.score + " / " + p.questions.length + "</p>" +
          '<div class="rangee-boutons">' +
          '<button class="bouton bouton-principal" data-action="rejouer">Rejouer</button>' +
          '<button class="bouton" data-action="reglages">Changer de région ou de difficulté</button>' +
          '<button class="bouton" data-action="accueil">Accueil</button></div>';
        panneau.querySelector('[data-action="rejouer"]').addEventListener("click", () => jouer(idMode));
        panneau.querySelector('[data-action="reglages"]').addEventListener("click", () => preparer(idMode));
        panneau.querySelector('[data-action="accueil"]').addEventListener("click", accueil);
      }
    });
    partie.demarrer();
  }

  accueil();
})();
