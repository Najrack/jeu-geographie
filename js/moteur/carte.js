// Dessin de la carte d'un jeu de données : formes, zoom, déplacement, pastilles des petits éléments,
// marquage des réponses. Ne connaît aucun pays en particulier : tout vient du jeu de données.
(function () {
  const SEUIL_PASTILLE = 10;  // taille à l'écran (px) sous laquelle un élément reçoit une pastille
  const RAYON_PASTILLE = 5;   // rayon visible (px)
  const RAYON_TOUCHER = 15;   // rayon de la zone qu'on peut toucher du doigt (px)
  const ECART_GROUPE = 22;    // deux pastilles plus proches que ça (px) : on zoome au lieu de choisir
  const ZOOM_MAX = 400;
  const ZOOM_CADRAGE = 6;       // grossissement maximal pour montrer un élément en gardant des repères autour
  const DELAI_APRES_GESTE = 350; // ms pendant lesquelles un clic après un déplacement est ignoré
  const RAYON_TERRE_KM = 6371;

  // Personnes sensibles aux mouvements (réglage « réduire les animations » du téléphone) : zooms sans animation
  const MOUVEMENT_REDUIT = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function duree(ms) {
    return MOUVEMENT_REDUIT ? 0 : ms;
  }

  // Réunit les formes GeoJSON d'un élément en un seul MultiPolygon.
  // d3 attend les contours extérieurs dans le sens des aiguilles d'une montre : on retourne ceux qui
  // sont dans l'autre sens (sinon le polygone couvrirait toute la Terre sauf le département).
  function fusionnerGeo(features) {
    const polygones = [];
    for (const f of features) {
      const g = f.geometry;
      for (const poly of g.type === "Polygon" ? [g.coordinates] : g.coordinates) {
        const aEnvers = d3.geoArea({ type: "Polygon", coordinates: poly }) > 2 * Math.PI;
        polygones.push(aEnvers ? poly.map((anneau) => anneau.slice().reverse()) : poly);
      }
    }
    return { type: "MultiPolygon", coordinates: polygones };
  }

  // Déplace une géométrie autour d'un nouveau centre (encart) ; l'écart en longitude est corrigé
  // selon la latitude pour que la forme ne soit pas écrasée ou étirée.
  function deplacer(geometrie, encart) {
    const c = d3.geoCentroid(geometrie);
    const [x, y] = encart.vers;
    const s = encart.echelle || 1;
    const etirement = Math.cos(c[1] * Math.PI / 180) / Math.cos(y * Math.PI / 180);
    const point = (p) => [x + (p[0] - c[0]) * s * etirement, y + (p[1] - c[1]) * s];
    return {
      type: "MultiPolygon",
      coordinates: geometrie.coordinates.map((poly) => poly.map((anneau) => anneau.map(point)))
    };
  }

  class Carte {
    constructor(conteneur, jeu) {
      this.conteneur = conteneur;
      this.jeu = jeu;
      this.projectionId = jeu.projections[0].id;
      this.marques = new Map();          // id d'élément -> nom de marque (juste, faux, cible, choisi…)
      this.t = d3.zoomIdentity;
      this.zone = null;                  // région montrée (voir definirZone)
      this.pastilles = [];
      this.auClic = function () {};      // remplacé par le jeu : function (clic) {...}
      this.auZoomAuto = function () {};  // prévenu quand un clic sur un groupe de pastilles zoome
      this.auMessage = function () {};   // affiche un court message au joueur (remplacé par l'application)

      this.preparerFormes();

      this.svg = d3.select(conteneur).append("svg")
        .attr("class", "carte")
        .attr("role", "img")
        .attr("aria-label", "Carte : " + jeu.titre);
      this.svg.append("defs").html(
        '<pattern id="hachures" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">' +
        '<rect width="6" height="6" class="hachures-fond"/><line x1="0" y1="0" x2="0" y2="6" class="hachures-trait"/></pattern>' +
        // Erreurs et pays « à revoir » : hachurés, pour ne pas reposer que sur la couleur
        '<pattern id="motif-faux" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">' +
        '<rect width="6" height="6" class="motif-faux-fond"/><line x1="0" y1="0" x2="0" y2="6" class="motif-faux-trait"/></pattern>');
      this.fondMer = this.svg.append("rect").attr("class", "ocean");
      this.g = this.svg.append("g");

      this.zoom = d3.zoom()
        .scaleExtent([1, ZOOM_MAX])
        .clickDistance(4)
        .on("start", (e) => {
          this.tDebutGeste = e.transform;
          if (e.sourceEvent) this.visee = null; // le joueur reprend la main sur la carte
        })
        .on("zoom", (e) => this.surZoom(e.transform))
        .on("end", (e) => {
          // Un vrai déplacement ou zoom de la main : les clics qui suivent de près sont ignorés
          const t0 = this.tDebutGeste;
          if (e.sourceEvent && t0 && (Math.hypot(e.transform.x - t0.x, e.transform.y - t0.y) > 8 || e.transform.k !== t0.k)) {
            this.finGeste = Date.now();
          }
        });
      this.svg.call(this.zoom).on("dblclick.zoom", null);
      this.svg.on("click", (e) => this.surClic(e));

      this.dessiner();
      let attente = null;
      this.observateur = new ResizeObserver(() => {
        clearTimeout(attente);
        attente = setTimeout(() => {
          if (this.conteneur.clientWidth !== this.W || this.conteneur.clientHeight !== this.H) this.dessiner();
        }, 60);
      });
      this.observateur.observe(conteneur);
    }

    signaler(texte) {
      this.auMessage(texte);
    }

    // Retire la carte de la page (pour passer à un autre jeu de données)
    detruire() {
      this.observateur.disconnect();
      this.svg.interrupt().remove();
    }

    // Regroupe les formes du fond de carte par élément du jeu (avec les rattachements du jeu de données).
    // Le fond de carte est soit du TopoJSON (jeu.topo + jeu.objetCarte), soit du GeoJSON (jeu.geo + jeu.cleForme).
    preparerFormes() {
      const jeu = this.jeu;
      const topo = jeu.topo;
      const rattacher = jeu.rattacher || {};
      const ignorer = jeu.ignorer || [];
      const parElement = new Map(jeu.elements.map((el) => [el.id, []]));
      const autres = [];

      const formesBrutes = jeu.geo ? jeu.geo.features : topo.objects[jeu.objetCarte].geometries;
      for (const g of formesBrutes) {
        const nom = g.properties && g.properties.name;
        const cleForme = jeu.geo ? jeu.cleForme(g) : g.id || nom;
        if (ignorer.includes(cleForme)) continue;
        const cle = rattacher[cleForme] || cleForme;
        if (parElement.has(cle)) parElement.get(cle).push(g);
        else autres.push({ cle: cleForme, g: g });
      }

      this.formes = new Map();
      for (const el of jeu.elements) {
        const geoms = parElement.get(el.id);
        let feature = null;
        if (geoms.length) {
          feature = { type: "Feature", id: el.id, geometry: jeu.geo ? fusionnerGeo(geoms) : topojson.merge(topo, geoms) };
        }
        // Territoire éloigné montré en encart (ex. outre-mer) : déplacé près du reste de la carte
        const encart = jeu.encarts && jeu.encarts[el.id];
        if (feature && encart) feature.geometry = deplacer(feature.geometry, encart);
        this.formes.set(el.id, {
          el: el,
          feature: feature,
          encart: !!encart,
          aire: feature ? d3.geoArea(feature) : 0, // surface réelle (sert à classer du plus grand au plus petit)
          pt: el.pt || (feature ? d3.geoCentroid(feature) : null)
        });
      }

      const noms = jeu.territoires || {};
      this.territoires = autres.map((o) => ({
        nom: noms[o.cle] || "Territoire non jouable",
        feature: jeu.geo ? o.g : topojson.feature(topo, o.g)
      }));
    }

    // Cadre [[ouest, sud], [est, nord]] des éléments qui passent le filtre (pour montrer une région)
    cadreDe(filtre) {
      const features = [];
      for (const f of this.formes.values()) if (f.feature && filtre(f.el)) features.push(f.feature);
      return features.length ? d3.geoBounds({ type: "FeatureCollection", features: features }) : null;
    }

    changerProjection(id) {
      this.projectionId = id;
      this.dessiner();
    }

    // Montre une région du jeu de données, ou toute la carte si null.
    // zone : { id, cadre, centre, contient(element) } ; les éléments hors de la zone sont estompés et inactifs.
    definirZone(zone) {
      if ((zone && zone.id) === (this.zone && this.zone.id)) return;
      this.zone = zone;
      this.visee = null;
      this.forcerVueInitiale = true;
      this.dessiner();
    }

    dessiner() {
      const W = this.conteneur.clientWidth, H = this.conteneur.clientHeight;
      if (!W || !H) return;
      // Si la carte était zoomée (et la projection inchangée), on garde le même endroit au centre après redessin.
      const ti = this.tInitial;
      const surVueInitiale = ti && Math.abs(this.t.k - ti.k) < 0.01 && Math.abs(this.t.x - ti.x) < 2 && Math.abs(this.t.y - ti.y) < 2;
      const garder = this.proj && this.t.k > 1 && !surVueInitiale && !this.forcerVueInitiale && this.projDessinee === this.projectionId
        ? { centre: this.proj.invert(this.t.invert([this.W / 2, this.H / 2])), k: this.t.k } : null;
      this.forcerVueInitiale = false;
      this.projDessinee = this.projectionId;
      this.W = W; this.H = H;
      this.svg.attr("viewBox", "0 0 " + W + " " + H).attr("width", W).attr("height", H);

      // Projection décrite par le jeu de données, ajustée pour que son « étendue » tienne à l'écran
      const m = 6;
      const lon0 = this.zone && this.zone.centre ? this.zone.centre : 0;
      const def = this.jeu.projections.find((p) => p.id === this.projectionId) || this.jeu.projections[0];
      this.etendue = def.etendue ? def.etendue(lon0) : {
        type: "FeatureCollection",
        features: [...this.formes.values()].filter((f) => f.feature).map((f) => f.feature)
      };
      this.proj = def.creer(lon0).fitExtent([[m, m], [W - m, H - m]], this.etendue);
      const path = d3.geoPath(this.proj);
      this.chemin = path;

      // Mer : le globe entier s'il tient à l'écran (monde), sinon tout le fond
      this.fondMer.attr("width", W).attr("height", H).style("display", this.etendue.type === "Sphere" ? "none" : null);
      const g = this.g;
      g.selectAll("*").remove();
      if (this.etendue.type === "Sphere") g.append("path").datum({ type: "Sphere" }).attr("class", "ocean").attr("d", path);
      if (this.jeu.graticule !== false) g.append("path").datum(d3.geoGraticule10()).attr("class", "graticule").attr("d", path);

      const zone = this.zone && this.zone.cadre ? this.zone : null;
      const gTerr = g.append("g");
      for (const t of this.territoires) {
        const c = d3.geoCentroid(t.feature);
        const dedans = !zone || (c[0] >= zone.cadre[0][0] && c[0] <= zone.cadre[1][0] && c[1] >= zone.cadre[0][1] && c[1] <= zone.cadre[1][1]);
        gTerr.append("path").attr("class", dedans ? "territoire" : "territoire hors-zone").attr("d", path(t.feature)).datum(t);
      }

      const gHors = g.append("g");
      const gEncarts = g.append("g");
      const gPays = g.append("g");
      const gPast = g.append("g");
      this.pastilles = [];
      for (const [id, f] of this.formes) {
        f.noeud = null; f.pastille = null;
        f.taille = f.feature ? Math.sqrt(path.area(f.feature)) : 0;
        const horsZone = zone && !zone.contient(f.el);
        if (f.encart && f.feature) {
          // Cadre autour d'un encart, pour montrer qu'il n'est pas à sa vraie place
          const [[x0, y0], [x1, y1]] = path.bounds(f.feature);
          const marge = 6;
          gEncarts.append("rect").attr("class", "cadre-encart" + (horsZone ? " hors-zone" : ""))
            .attr("x", x0 - marge).attr("y", y0 - marge).attr("width", x1 - x0 + 2 * marge).attr("height", y1 - y0 + 2 * marge);
        }
        if (f.feature) {
          f.noeud = (horsZone ? gHors : gPays).append("path").attr("class", horsZone ? "element hors-zone" : "element")
            .attr("data-id", horsZone ? null : id).attr("d", path(f.feature)).node();
        }
        if (horsZone) continue;
        if ((!f.feature || f.taille < SEUIL_PASTILLE) && f.pt) {
          const xy = this.proj(f.pt);
          if (!xy) continue;
          const p = gPast.append("g").attr("class", "pastille").attr("data-id", id)
            .attr("transform", "translate(" + xy[0] + "," + xy[1] + ")");
          p.append("circle").attr("class", "toucher");
          p.append("circle").attr("class", "point");
          f.pastille = p.node();
          f.xy = xy;
          this.pastilles.push(f);
        }
      }

      this.appliquerMarques();
      this.zoom.translateExtent([[0, 0], [W, H]]).extent([[0, 0], [W, H]]).scaleExtent([1, ZOOM_MAX]);
      if (zone) {
        // En mode région : on ne peut ni dézoomer au-delà de la région, ni s'en éloigner
        const t0 = this.vueInitiale();
        const [[x0, y0], [x1, y1]] = this.cadrePx;
        const mx = (x1 - x0) * 0.15, my = (y1 - y0) * 0.15;
        this.zoom.scaleExtent([t0.k, ZOOM_MAX]).translateExtent([[x0 - mx, y0 - my], [x1 + mx, y1 + my]]);
      }
      this.svg.interrupt();
      // Un zoom automatique en cours (ou fini) vise un endroit précis : on y va directement,
      // même s'il a été interrompu par le changement de taille (clavier du téléphone qui s'ouvre).
      const t = this.visee ? this.transformVers(this.visee.lonlat, this.visee.k)
        : garder ? this.transformVers(garder.centre, garder.k) : this.vueInitiale();
      this.svg.call(this.zoom.transform, t);
    }

    // Vue de départ : toute la carte, sauf sur un écran en hauteur (téléphone) où la carte
    // remplit la hauteur et se parcourt en glissant, sinon elle serait minuscule.
    // Avec une région : la région remplit l'écran.
    vueInitiale() {
      if (!this.chemin) return d3.zoomIdentity; // carte pas encore dessinée (page pas encore affichée)
      const b = this.chemin.bounds(this.etendue);
      const hCarte = b[1][1] - b[0][1];
      // Seulement pour une carte très allongée (le monde) : la France, presque carrée, reste entière
      const allongee = (b[1][0] - b[0][0]) / hCarte > 1.6;
      const enHauteur = allongee && isFinite(hCarte) && hCarte < this.H * 0.7;
      const kRemplir = enHauteur ? Math.min(5, this.H / hCarte) : 1;
      const yCentre = (b[0][1] + b[1][1]) / 2;

      const cadre = this.zone && this.zone.cadre;
      if (cadre) {
        // Bords du cadre échantillonnés (les méridiens et parallèles sont courbes en Equal Earth)
        const pts = [];
        const [[o, s], [e, n]] = cadre;
        const pasLon = Math.max((e - o) / 10, 0.01), pasLat = Math.max((n - s) / 10, 0.01);
        for (let lon = o; lon <= e + 1e-9; lon += pasLon) pts.push(this.proj([lon, s]), this.proj([lon, n]));
        for (let lat = s; lat <= n + 1e-9; lat += pasLat) pts.push(this.proj([o, lat]), this.proj([e, lat]));
        const xs = pts.filter(Boolean).map((p) => p[0]), ys = pts.filter(Boolean).map((p) => p[1]);
        const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
        this.cadrePx = [[x0, y0], [x1, y1]];
        const k = Math.max(kRemplir, Math.min(ZOOM_CADRAGE * 2, 0.95 * Math.min(this.W / (x1 - x0), this.H / (y1 - y0))));
        return (this.tInitial = d3.zoomIdentity.translate(this.W / 2, this.H / 2).scale(k)
          .translate(-(x0 + x1) / 2, -(y0 + y1) / 2));
      }
      if (!enHauteur) return (this.tInitial = d3.zoomIdentity);
      const x = this.proj([this.jeu.longitudeTelephone || 15, 0])[0];
      return (this.tInitial = d3.zoomIdentity.translate(this.W / 2, this.H / 2).scale(kRemplir).translate(-x, -yCentre));
    }

    // Transformation qui place un point (lon, lat) au centre avec le grossissement k
    transformVers(lonlat, k) {
      const xy = this.proj(lonlat);
      k = Math.min(ZOOM_MAX, Math.max(1, k));
      return d3.zoomIdentity.translate(this.W / 2, this.H / 2).scale(k).translate(-xy[0], -xy[1]);
    }

    surZoom(t) {
      this.t = t;
      this.g.attr("transform", t);
      const k = t.k;
      for (const f of this.pastilles) {
        const visible = !f.feature || f.taille * k < SEUIL_PASTILLE || this.marques.has(f.el.id) && f.taille * k < SEUIL_PASTILLE * 2;
        f.visible = visible;
        f.pastille.style.display = visible ? "" : "none";
        if (visible) {
          f.pastille.firstChild.setAttribute("r", RAYON_TOUCHER / k);
          f.pastille.lastChild.setAttribute("r", RAYON_PASTILLE / k);
        }
      }
    }

    // ---------- Clics ----------

    surClic(e) {
      if (e.defaultPrevented) return; // fin d'un glisser : pas un clic
      if (this.finGeste && Date.now() - this.finGeste < DELAI_APRES_GESTE) return;
      const ecran = d3.pointer(e, this.svg.node());
      let lonlat = this.proj.invert(this.t.invert(ecran));
      if (!lonlat || !isFinite(lonlat[0]) || Math.abs(lonlat[0]) > 180 || Math.abs(lonlat[1]) > 90) lonlat = null;

      const cible = e.target.closest("[data-id]");
      if (cible) {
        const id = cible.getAttribute("data-id");
        const f = this.formes.get(id);
        if (cible.classList.contains("pastille")) {
          if (this.groupeDense(f)) {
            this.zoomVers(f.pt, Math.max(this.t.k * 4, 6));
            this.auZoomAuto();
            return;
          }
          lonlat = f.pt;
        }
        this.auClic({ id: id, element: f.el, lonlat: lonlat });
        return;
      }
      const terr = e.target.classList.contains("territoire") ? d3.select(e.target).datum() : null;
      this.auClic({ id: null, territoire: terr ? terr.nom : null, lonlat: lonlat });
    }

    // Vrai si d'autres pastilles visibles sont trop proches pour être distinguées au doigt.
    groupeDense(f) {
      if (this.t.k >= ZOOM_MAX / 2) return false;
      const k = this.t.k;
      return this.pastilles.some((o) => o !== f && o.visible &&
        Math.hypot((o.xy[0] - f.xy[0]) * k, (o.xy[1] - f.xy[1]) * k) < ECART_GROUPE);
    }

    // ---------- Marques (couleurs des réponses) ----------

    marquer(id, marque) {
      if (marque) this.marques.set(id, marque); else this.marques.delete(id);
      this.appliquerMarques();
    }

    effacerMarques() {
      this.marques.clear();
      this.appliquerMarques();
    }

    // Remplace toutes les marques d'un coup (Map id -> marque), par exemple pour la carte de maîtrise
    definirMarques(marques) {
      this.marques = new Map(marques);
      this.appliquerMarques();
    }

    appliquerMarques() {
      for (const [id, f] of this.formes) {
        const m = this.marques.get(id) || null;
        for (const n of [f.noeud, f.pastille]) {
          if (!n) continue;
          if (m) n.setAttribute("data-marque", m); else n.removeAttribute("data-marque");
        }
        // Un élément marqué passe au premier plan pour que son contour soit visible
        if (m && f.noeud) f.noeud.parentNode.appendChild(f.noeud);
      }
      if (this.t) this.surZoom(this.t);
    }

    // ---------- Zoom ----------

    zoomer(facteur) {
      this.visee = null;
      this.svg.transition().duration(duree(300)).call(this.zoom.scaleBy, facteur);
    }

    reinitialiserZoom() {
      this.visee = null;
      this.svg.transition().duration(duree(500)).call(this.zoom.transform, this.vueInitiale());
    }

    // Revient à la vue de départ si c'est le jeu qui avait zoomé (pas si le joueur a zoomé lui-même)
    annulerZoomAuto() {
      if (this.visee) this.reinitialiserZoom();
    }

    zoomVers(lonlat, k) {
      if (!this.proj || !this.proj(lonlat)) return;
      this.visee = { lonlat: lonlat, k: k };
      this.svg.transition().duration(duree(700)).call(this.zoom.transform, this.transformVers(lonlat, k));
    }

    // Cadre un élément ; kMax limite le grossissement pour garder des repères autour.
    zoomSur(id, kMax) {
      const f = this.formes.get(id);
      if (!f || !this.chemin) return;
      kMax = kMax || 30;
      if (!f.feature) return this.zoomVers(f.pt, kMax);
      const b = this.chemin.bounds(f.feature);
      const dx = b[1][0] - b[0][0], dy = b[1][1] - b[0][1];
      const k = Math.min(kMax, 0.5 / Math.max(dx / this.W, dy / this.H, 1e-6));
      this.zoomVers(this.proj.invert([(b[0][0] + b[1][0]) / 2, (b[0][1] + b[1][1]) / 2]), k);
    }

    // Montre un élément avec ses alentours pour qu'on puisse le reconnaître.
    // On cadre sa plus grande partie (la métropole pour la France, pas la Guyane).
    cadrer(id) {
      const f = this.formes.get(id);
      if (!f || !this.chemin) return;
      const kMin = this.tInitial ? this.tInitial.k : 1;
      if (!f.feature) return this.zoomVers(f.pt, Math.max(kMin, ZOOM_CADRAGE));
      let principal = null, aireMax = -1;
      for (const poly of f.feature.geometry.coordinates) {
        const p = { type: "Polygon", coordinates: poly };
        const a = d3.geoArea(p);
        if (a > aireMax) { aireMax = a; principal = p; }
      }
      // Taille d'après l'encombrement à l'écran, centre d'après le centre géographique
      // (plus fiable pour un pays coupé par la ligne de changement de date, comme la Russie)
      const b = this.chemin.bounds(principal);
      const dx = b[1][0] - b[0][0], dy = b[1][1] - b[0][1];
      const k = Math.max(kMin, Math.min(ZOOM_CADRAGE, 0.35 / Math.max(dx / this.W, dy / this.H, 1e-6)));
      this.zoomVers(d3.geoCentroid(principal), k);
    }

    aire(id) {
      const f = this.formes.get(id);
      return f ? f.aire : 0;
    }

    // Vrai si l'élément est trop petit pour être vu sans zoom
    estPetit(id) {
      const f = this.formes.get(id);
      return !f || !f.feature || f.taille < SEUIL_PASTILLE * 2;
    }

    // ---------- Distances ----------

    // Distance approximative (km) entre un point et le bord le plus proche de l'élément (0 si dedans).
    distanceKm(id, lonlat) {
      const f = this.formes.get(id);
      if (!f || !lonlat || f.encart) return null; // un encart n'est pas à sa vraie place : pas de distance
      if (!f.feature) return d3.geoDistance(lonlat, f.pt) * RAYON_TERRE_KM;
      if (d3.geoContains(f.feature, lonlat)) return 0;
      let min = Infinity;
      for (const poly of f.feature.geometry.coordinates)
        for (const anneau of poly)
          for (const c of anneau) {
            const d = d3.geoDistance(lonlat, c);
            if (d < min) min = d;
          }
      return min * RAYON_TERRE_KM;
    }
  }

  GeoJeu.Carte = Carte;
})();
