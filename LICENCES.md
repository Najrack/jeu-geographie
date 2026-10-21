# Sources et licences

| Élément | Source | Licence |
|---|---|---|
| Fond de carte du monde (frontières 1:50m) | [Natural Earth](https://www.naturalearthdata.com/) v4.1.0 | Domaine public |
| Conversion du fond de carte au format TopoJSON | [world-atlas](https://github.com/topojson/world-atlas) 2.0.2, Mike Bostock | ISC (libre, mention du copyright) |
| Bibliothèque de dessin | [D3](https://d3js.org/) 7.9.0, Mike Bostock | ISC |
| Lecture du format TopoJSON | [topojson-client](https://github.com/topojson/topojson-client) 3.1.0, Mike Bostock | ISC |
| Liste des pays, noms français, capitales, variantes | Rédigée pour ce projet | — |
| Contours des départements français (métropole et outre-mer) | [france-geojson](https://github.com/gregoiredavid/france-geojson), Grégoire David, d'après IGN Admin Express COG et INSEE (édition 2018) | [Licence Ouverte Etalab](https://www.etalab.gouv.fr/licence-ouverte-open-licence) (réutilisation libre avec mention de la source) |
| Liste des départements, numéros, préfectures, régions | Rédigée pour ce projet (d'après le Code officiel géographique de l'INSEE) | — |
| Icônes de l'application (`icones/`) | Dessinées pour ce projet par `outils/creer-icones.ps1` | — |

Pour les départements, la carte a été rassemblée et ses coordonnées arrondies (environ 100 m) ; les cinq départements d'outre-mer sont déplacés en encarts près de la métropole. Fichiers d'origine dans `outils/source/france/`.

Le texte complet des licences ISC est dans `outils/source/` (`d3-LICENSE.txt`, `topojson-LICENSE.txt`, `world-atlas-LICENSE.txt`).

Remarque : Natural Earth représente les frontières telles qu'elles sont contrôlées sur le terrain. Le jeu ajoute une mention « statut particulier » pour le Vatican, la Palestine, le Kosovo et Taïwan.
