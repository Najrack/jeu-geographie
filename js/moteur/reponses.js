// Comparaison souple des réponses tapées : accents, majuscules, tirets, articles et petites fautes.
// Une réponse est rapprochée du nom le plus proche parmi TOUS les éléments du jeu,
// pour ne pas accepter « Irak » quand on attend « Iran ».
(function () {
  const ARTICLE = /^(le|la|les|l|du|de|des) /;

  function normaliser(s) {
    return String(s).toLowerCase()
      .replace(/œ/g, "oe").replace(/æ/g, "ae")
      .normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/['’`´\-_.,;:!?()]/g, " ")
      .replace(/\bst\b/g, "saint").replace(/\bste\b/g, "sainte")
      .replace(/\s+/g, " ").trim()
      .replace(ARTICLE, "");
  }

  // Nombre de fautes (lettre en trop, en moins, remplacée ou deux lettres inversées)
  function distance(a, b) {
    if (a === b) return 0;
    const m = a.length, n = b.length;
    let avant = null, prec = Array.from({ length: n + 1 }, (_, j) => j);
    for (let i = 1; i <= m; i++) {
      const cour = [i];
      for (let j = 1; j <= n; j++) {
        const cout = a[i - 1] === b[j - 1] ? 0 : 1;
        let d = Math.min(prec[j] + 1, cour[j - 1] + 1, prec[j - 1] + cout);
        if (avant && i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d = Math.min(d, avant[j - 2] + 1);
        cour.push(d);
      }
      avant = prec; prec = cour;
    }
    return prec[n];
  }

  // Fautes tolérées selon la longueur du nom
  function tolerance(longueur) {
    if (longueur <= 3) return 0;
    if (longueur <= 5) return 1;
    if (longueur <= 10) return 2;
    return 3;
  }

  // entrees : [{ id, noms: [nom affiché, variantes...] }]
  // Renvoie { id, nom, exact } pour l'entrée reconnue, ou null si la saisie ne ressemble à rien de connu.
  // En cas d'égalité, l'entrée attendue (idAttendu) l'emporte.
  function reconnaitre(saisie, entrees, idAttendu) {
    const s = normaliser(saisie);
    if (!s) return null;
    let meilleur = null;
    for (const e of entrees) {
      for (const nom of e.noms) {
        const n = normaliser(nom);
        const d = distance(s, n);
        if (d > tolerance(n.length)) continue;
        if (!meilleur || d < meilleur.d || (d === meilleur.d && e.id === idAttendu && meilleur.id !== idAttendu)) {
          meilleur = { id: e.id, nom: e.noms[0], d: d };
        }
      }
    }
    return meilleur && { id: meilleur.id, nom: meilleur.nom, exact: meilleur.d === 0 };
  }

  GeoJeu.reponses = { normaliser: normaliser, distance: distance, reconnaitre: reconnaitre };
})();
