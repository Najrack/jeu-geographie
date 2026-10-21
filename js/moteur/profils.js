// Profils des joueurs sur cet appareil (un prénom, sans mot de passe) et code de sauvegarde
// pour transférer une progression d'un appareil à un autre par copier-coller.
//
// Stockage (localStorage) :
//   geojeu.profils     : { noms: [...], actif: "Marie", reglages: { "Marie": { "<jeu>": {...} } } }
//   geojeu.progression : voir progression.js (une entrée par prénom)
(function () {
  const CLE = "geojeu.profils";
  const CLE_PROGRESSION = "geojeu.progression";
  const PREFIXE = "GEO1-";
  const ANCIEN_PROFIL = "Moi"; // progression jouée avant l'arrivée des profils

  function lire(cle, defaut) {
    try {
      const v = JSON.parse(localStorage.getItem(cle));
      return v == null ? defaut : v;
    } catch (e) { return defaut; }
  }

  function ecrire(cle, valeur) {
    try { localStorage.setItem(cle, JSON.stringify(valeur)); return true; } catch (e) { return false; }
  }

  function etat() {
    const e = lire(CLE, {});
    e.noms = e.noms || [];
    e.reglages = e.reglages || {};
    return e;
  }

  // Texte <-> base64, en passant par l'UTF-8 (pour les accents des prénoms)
  function versBase64(texte) {
    const octets = new TextEncoder().encode(texte);
    let bin = "";
    for (const o of octets) bin += String.fromCharCode(o);
    return btoa(bin);
  }
  function depuisBase64(b64) {
    const bin = atob(b64);
    const octets = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) octets[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(octets);
  }

  // La fiche la plus récente l'emporte ; à date égale, celle qui a le plus d'historique
  function plusRecente(a, b) {
    if (!a) return b;
    if (!b) return a;
    return b.d > a.d || (b.d === a.d && b.v > a.v) ? b : a;
  }

  GeoJeu.profils = {
    noms: function () { return etat().noms; },

    actif: function () {
      const e = etat();
      return e.noms.includes(e.actif) ? e.actif : null;
    },

    choisir: function (nom) {
      const e = etat();
      e.actif = nom;
      ecrire(CLE, e);
    },

    // Crée le profil et le rend actif. Renvoie un message d'erreur, ou null si tout va bien.
    ajouter: function (nom) {
      nom = String(nom || "").trim().replace(/\s+/g, " ");
      if (!nom) return "Écrivez un prénom.";
      if (nom.length > 20) return "Ce prénom est trop long (20 lettres au plus).";
      const e = etat();
      if (e.noms.some((n) => n.toLowerCase() === nom.toLowerCase())) return "Ce prénom existe déjà sur cet appareil.";
      if (e.noms.length === 0) {
        const p = lire(CLE_PROGRESSION, {});
        if (p[ANCIEN_PROFIL] && !p[nom]) {
          p[nom] = p[ANCIEN_PROFIL];
          delete p[ANCIEN_PROFIL];
          ecrire(CLE_PROGRESSION, p);
        }
      }
      e.noms.push(nom);
      e.actif = nom;
      ecrire(CLE, e);
      return null;
    },

    supprimer: function (nom) {
      const e = etat();
      e.noms = e.noms.filter((n) => n !== nom);
      delete e.reglages[nom];
      if (e.actif === nom) e.actif = null;
      ecrire(CLE, e);
      const p = lire(CLE_PROGRESSION, {});
      delete p[nom];
      ecrire(CLE_PROGRESSION, p);
    },

    reglages: function (nom, idJeu) {
      return (etat().reglages[nom] || {})[idJeu] || null;
    },

    enregistrerReglages: function (nom, idJeu, reglages) {
      const e = etat();
      e.reglages[nom] = e.reglages[nom] || {};
      e.reglages[nom][idJeu] = reglages;
      ecrire(CLE, e);
    },

    // ---------- Code de sauvegarde ----------

    // Pour que le code reste court (à envoyer par message), chaque compétence est écrite en une ligne :
    // "id:boîte.vus.justes.jour,id:…" où le jour est compté à partir du plus ancien (base).
    exporter: function (nom) {
      const prog = lire(CLE_PROGRESSION, {})[nom] || {};
      let base = Infinity;
      for (const j in prog) for (const c in prog[j]) for (const id in prog[j][c]) base = Math.min(base, prog[j][c][id].d);
      if (!isFinite(base)) base = 0;
      const compact = {};
      for (const j in prog) {
        compact[j] = {};
        for (const c in prog[j]) {
          compact[j][c] = Object.keys(prog[j][c]).map((id) => {
            const f = prog[j][c][id];
            return id + ":" + f.b + "." + f.v + "." + f.j + "." + (f.d - base);
          }).join(",");
        }
      }
      const donnees = { v: 1, nom: nom, base: base, progression: compact, reglages: etat().reglages[nom] || {} };
      return PREFIXE + versBase64(JSON.stringify(donnees));
    },

    // Décode un code collé ; lève une erreur au message compréhensible s'il est abîmé
    lireCode: function (code) {
      const brut = String(code || "").replace(/\s+/g, "");
      if (!brut) throw new Error("Collez d'abord un code.");
      if (!brut.startsWith(PREFIXE)) throw new Error("Ce texte n'est pas un code de sauvegarde du jeu.");
      let d;
      try { d = JSON.parse(depuisBase64(brut.slice(PREFIXE.length))); } catch (e) { d = null; }
      const abime = new Error("Ce code est incomplet ou abîmé : recopiez-le en entier.");
      if (!d || d.v !== 1 || typeof d.nom !== "string" || typeof d.base !== "number" || !d.progression || typeof d.progression !== "object") throw abime;
      // Retour au format des fiches { b, v, j, d }
      const progression = {};
      for (const j in d.progression) {
        progression[j] = {};
        for (const c in d.progression[j]) {
          const fiches = progression[j][c] = {};
          const texte = d.progression[j][c];
          if (typeof texte !== "string") throw abime;
          for (const morceau of texte ? texte.split(",") : []) {
            const [id, valeurs] = morceau.split(":");
            const n = (valeurs || "").split(".").map(Number);
            if (!id || n.length !== 4 || n.some((x) => !Number.isInteger(x) || x < 0)) throw abime;
            fiches[id] = { b: Math.min(n[0], 5), v: n[1], j: n[2], d: n[3] + d.base };
          }
        }
      }
      d.progression = progression;
      return d;
    },

    // Ajoute la progression d'un code au profil nomCible (créé s'il n'existe pas), sans rien perdre :
    // pour chaque élément, la fiche la plus récente est gardée.
    importer: function (donnees, nomCible) {
      if (!this.noms().includes(nomCible)) {
        const erreur = this.ajouter(nomCible);
        if (erreur) return erreur;
      }
      const p = lire(CLE_PROGRESSION, {});
      const cible = p[nomCible] = p[nomCible] || {};
      for (const idJeu in donnees.progression) {
        const jeu = cible[idJeu] = cible[idJeu] || {};
        for (const comp in donnees.progression[idJeu]) {
          const fiches = jeu[comp] = jeu[comp] || {};
          const nouvelles = donnees.progression[idJeu][comp];
          for (const id in nouvelles) fiches[id] = plusRecente(fiches[id], nouvelles[id]);
        }
      }
      if (!ecrire(CLE_PROGRESSION, p)) return "Impossible d'enregistrer sur cet appareil (stockage plein ou bloqué).";
      const e = etat();
      if (!e.reglages[nomCible] && donnees.reglages) e.reglages[nomCible] = donnees.reglages;
      e.actif = nomCible;
      ecrire(CLE, e);
      return null;
    }
  };
})();
