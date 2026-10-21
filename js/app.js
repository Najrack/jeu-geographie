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
    carte.effacerMarques();
    carte.auClic = function () {};
    carte.reinitialiserZoom();
    panneau.innerHTML =
      "<p><strong>Bienvenue !</strong> Que voulez-vous faire ?</p>" +
      '<div class="rangee-boutons">' +
      '<button class="bouton bouton-principal" data-action="localiser">Où se trouve ce pays ?</button>' +
      '<button class="bouton" data-action="explorer">Explorer la carte</button>' +
      "</div>";
    panneau.querySelector('[data-action="localiser"]').addEventListener("click", () => jouer("localiser"));
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

  // ---------- Partie ----------
  function jouer(idMode) {
    const partie = new GeoJeu.Partie({
      jeu: jeu,
      carte: carte,
      panneau: panneau,
      mode: GeoJeu.modes[idMode],
      elements: jeu.elements,
      nbQuestions: 10,
      quandFini: (p) => {
        panneau.innerHTML =
          '<p class="verdict">Résultat : ' + p.score + " / " + p.questions.length + "</p>" +
          '<div class="rangee-boutons">' +
          '<button class="bouton bouton-principal" data-action="rejouer">Rejouer</button>' +
          '<button class="bouton" data-action="accueil">Accueil</button></div>';
        panneau.querySelector('[data-action="rejouer"]').addEventListener("click", () => jouer(idMode));
        panneau.querySelector('[data-action="accueil"]').addEventListener("click", accueil);
      }
    });
    partie.demarrer();
  }

  accueil();
})();
