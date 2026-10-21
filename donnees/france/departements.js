// Liste des départements jouables : les 96 de métropole et les 5 d'outre-mer (décision du 21/10/2026).
//
// Mêmes champs que les pays du jeu « monde » (voir donnees/monde/pays.js), avec :
//   id   : code officiel INSEE (« 01 », « 2A », « 971 »…), le même que dans le fond de carte
//   num  : numéro du département, à trouver dans les modes « numéro »
//   cont : région (voir regions dans config.js)
//   cap  : préfecture ; chaque préfecture est une liste [nom affiché, variantes acceptées...]

GeoJeu.enregistrer("france", { elements: [

  // ---------- Auvergne-Rhône-Alpes ----------
  { id: "01", num: "01", nom: "Ain", cont: "ara", cap: [["Bourg-en-Bresse", "Bourg"]], n: 2 },
  { id: "03", num: "03", nom: "Allier", cont: "ara", cap: [["Moulins"]], n: 3 },
  { id: "07", num: "07", nom: "Ardèche", cont: "ara", cap: [["Privas"]], n: 2 },
  { id: "15", num: "15", nom: "Cantal", cont: "ara", cap: [["Aurillac"]], n: 3 },
  { id: "26", num: "26", nom: "Drôme", cont: "ara", cap: [["Valence"]], n: 3 },
  { id: "38", num: "38", nom: "Isère", cont: "ara", cap: [["Grenoble"]], n: 1 },
  { id: "42", num: "42", nom: "Loire", cont: "ara", cap: [["Saint-Étienne"]], n: 2 },
  { id: "43", num: "43", nom: "Haute-Loire", cont: "ara", cap: [["Le Puy-en-Velay", "Le Puy"]], n: 3 },
  { id: "63", num: "63", nom: "Puy-de-Dôme", cont: "ara", cap: [["Clermont-Ferrand"]], n: 1 },
  { id: "69", num: "69", nom: "Rhône", cont: "ara", cap: [["Lyon"]], n: 1,
    statut: "Depuis 2015, Lyon et ses environs forment la Métropole de Lyon, une collectivité à part ; elle est montrée ici avec le Rhône." },
  { id: "73", num: "73", nom: "Savoie", cont: "ara", cap: [["Chambéry"]], n: 2 },
  { id: "74", num: "74", nom: "Haute-Savoie", cont: "ara", cap: [["Annecy"]], n: 1 },

  // ---------- Bourgogne-Franche-Comté ----------
  { id: "21", num: "21", nom: "Côte-d'Or", cont: "bfc", cap: [["Dijon"]], n: 1 },
  { id: "25", num: "25", nom: "Doubs", cont: "bfc", cap: [["Besançon"]], n: 2 },
  { id: "39", num: "39", nom: "Jura", cont: "bfc", cap: [["Lons-le-Saunier"]], n: 3 },
  { id: "58", num: "58", nom: "Nièvre", cont: "bfc", cap: [["Nevers"]], n: 3 },
  { id: "70", num: "70", nom: "Haute-Saône", cont: "bfc", cap: [["Vesoul"]], n: 3 },
  { id: "71", num: "71", nom: "Saône-et-Loire", cont: "bfc", cap: [["Mâcon"]], n: 3 },
  { id: "89", num: "89", nom: "Yonne", cont: "bfc", cap: [["Auxerre"]], n: 3 },
  { id: "90", num: "90", nom: "Territoire de Belfort", var: ["Belfort"], cont: "bfc", cap: [["Belfort"]], n: 3 },

  // ---------- Bretagne ----------
  { id: "22", num: "22", nom: "Côtes-d'Armor", cont: "bre", cap: [["Saint-Brieuc"]], n: 2 },
  { id: "29", num: "29", nom: "Finistère", cont: "bre", cap: [["Quimper"]], n: 1,
    capNote: "Brest est la plus grande ville, mais la préfecture est Quimper." },
  { id: "35", num: "35", nom: "Ille-et-Vilaine", cont: "bre", cap: [["Rennes"]], n: 1 },
  { id: "56", num: "56", nom: "Morbihan", cont: "bre", cap: [["Vannes"]], n: 2 },

  // ---------- Centre-Val de Loire ----------
  { id: "18", num: "18", nom: "Cher", cont: "cvl", cap: [["Bourges"]], n: 3 },
  { id: "28", num: "28", nom: "Eure-et-Loir", cont: "cvl", cap: [["Chartres"]], n: 3 },
  { id: "36", num: "36", nom: "Indre", cont: "cvl", cap: [["Châteauroux"]], n: 3 },
  { id: "37", num: "37", nom: "Indre-et-Loire", cont: "cvl", cap: [["Tours"]], n: 2 },
  { id: "41", num: "41", nom: "Loir-et-Cher", cont: "cvl", cap: [["Blois"]], n: 3 },
  { id: "45", num: "45", nom: "Loiret", cont: "cvl", cap: [["Orléans"]], n: 2 },

  // ---------- Corse ----------
  { id: "2A", num: "2A", nom: "Corse-du-Sud", cont: "cor", cap: [["Ajaccio"]], n: 1 },
  { id: "2B", num: "2B", nom: "Haute-Corse", cont: "cor", cap: [["Bastia"]], n: 1 },

  // ---------- Grand Est ----------
  { id: "08", num: "08", nom: "Ardennes", cont: "ges", cap: [["Charleville-Mézières"]], n: 2 },
  { id: "10", num: "10", nom: "Aube", cont: "ges", cap: [["Troyes"]], n: 3 },
  { id: "51", num: "51", nom: "Marne", cont: "ges", cap: [["Châlons-en-Champagne", "Châlons"]], n: 2,
    capNote: "Reims est la plus grande ville, mais la préfecture est Châlons-en-Champagne." },
  { id: "52", num: "52", nom: "Haute-Marne", cont: "ges", cap: [["Chaumont"]], n: 3 },
  { id: "54", num: "54", nom: "Meurthe-et-Moselle", cont: "ges", cap: [["Nancy"]], n: 2 },
  { id: "55", num: "55", nom: "Meuse", cont: "ges", cap: [["Bar-le-Duc"]], n: 3 },
  { id: "57", num: "57", nom: "Moselle", cont: "ges", cap: [["Metz"]], n: 1 },
  { id: "67", num: "67", nom: "Bas-Rhin", cont: "ges", cap: [["Strasbourg"]], n: 1,
    statut: "Avec le Haut-Rhin, il forme depuis 2021 la Collectivité européenne d'Alsace, mais reste un département." },
  { id: "68", num: "68", nom: "Haut-Rhin", cont: "ges", cap: [["Colmar"]], n: 2,
    capNote: "Mulhouse est la plus grande ville, mais la préfecture est Colmar.",
    statut: "Avec le Bas-Rhin, il forme depuis 2021 la Collectivité européenne d'Alsace, mais reste un département." },
  { id: "88", num: "88", nom: "Vosges", cont: "ges", cap: [["Épinal"]], n: 3 },

  // ---------- Hauts-de-France ----------
  { id: "02", num: "02", nom: "Aisne", cont: "hdf", cap: [["Laon"]], n: 3 },
  { id: "59", num: "59", nom: "Nord", cont: "hdf", cap: [["Lille"]], n: 1 },
  { id: "60", num: "60", nom: "Oise", cont: "hdf", cap: [["Beauvais"]], n: 3 },
  { id: "62", num: "62", nom: "Pas-de-Calais", cont: "hdf", cap: [["Arras"]], n: 1,
    capNote: "Calais et Boulogne-sur-Mer sont plus grandes, mais la préfecture est Arras." },
  { id: "80", num: "80", nom: "Somme", cont: "hdf", cap: [["Amiens"]], n: 2 },

  // ---------- Île-de-France ----------
  { id: "75", num: "75", nom: "Paris", cont: "idf", cap: [["Paris"]], n: 1 },
  { id: "77", num: "77", nom: "Seine-et-Marne", cont: "idf", cap: [["Melun"]], n: 2 },
  { id: "78", num: "78", nom: "Yvelines", cont: "idf", cap: [["Versailles"]], n: 2 },
  { id: "91", num: "91", nom: "Essonne", cont: "idf", cap: [["Évry-Courcouronnes", "Évry"]], n: 2 },
  { id: "92", num: "92", nom: "Hauts-de-Seine", cont: "idf", cap: [["Nanterre"]], n: 2 },
  { id: "93", num: "93", nom: "Seine-Saint-Denis", cont: "idf", cap: [["Bobigny"]], n: 2 },
  { id: "94", num: "94", nom: "Val-de-Marne", cont: "idf", cap: [["Créteil"]], n: 2 },
  { id: "95", num: "95", nom: "Val-d'Oise", cont: "idf", cap: [["Cergy", "Cergy-Pontoise", "Pontoise"]], n: 2 },

  // ---------- Normandie ----------
  { id: "14", num: "14", nom: "Calvados", cont: "nor", cap: [["Caen"]], n: 1 },
  { id: "27", num: "27", nom: "Eure", cont: "nor", cap: [["Évreux"]], n: 3 },
  { id: "50", num: "50", nom: "Manche", cont: "nor", cap: [["Saint-Lô"]], n: 2,
    capNote: "Cherbourg est la plus grande ville, mais la préfecture est Saint-Lô." },
  { id: "61", num: "61", nom: "Orne", cont: "nor", cap: [["Alençon"]], n: 3 },
  { id: "76", num: "76", nom: "Seine-Maritime", cont: "nor", cap: [["Rouen"]], n: 1,
    capNote: "Le Havre est la plus grande ville, mais la préfecture est Rouen." },

  // ---------- Nouvelle-Aquitaine ----------
  { id: "16", num: "16", nom: "Charente", cont: "naq", cap: [["Angoulême"]], n: 2 },
  { id: "17", num: "17", nom: "Charente-Maritime", cont: "naq", cap: [["La Rochelle"]], n: 2 },
  { id: "19", num: "19", nom: "Corrèze", cont: "naq", cap: [["Tulle"]], n: 3,
    capNote: "Brive-la-Gaillarde est la plus grande ville, mais la préfecture est Tulle." },
  { id: "23", num: "23", nom: "Creuse", cont: "naq", cap: [["Guéret"]], n: 3 },
  { id: "24", num: "24", nom: "Dordogne", cont: "naq", cap: [["Périgueux"]], n: 2 },
  { id: "33", num: "33", nom: "Gironde", cont: "naq", cap: [["Bordeaux"]], n: 1 },
  { id: "40", num: "40", nom: "Landes", cont: "naq", cap: [["Mont-de-Marsan"]], n: 2 },
  { id: "47", num: "47", nom: "Lot-et-Garonne", cont: "naq", cap: [["Agen"]], n: 3 },
  { id: "64", num: "64", nom: "Pyrénées-Atlantiques", cont: "naq", cap: [["Pau"]], n: 1 },
  { id: "79", num: "79", nom: "Deux-Sèvres", cont: "naq", cap: [["Niort"]], n: 3 },
  { id: "86", num: "86", nom: "Vienne", cont: "naq", cap: [["Poitiers"]], n: 3 },
  { id: "87", num: "87", nom: "Haute-Vienne", cont: "naq", cap: [["Limoges"]], n: 3 },

  // ---------- Occitanie ----------
  { id: "09", num: "09", nom: "Ariège", cont: "occ", cap: [["Foix"]], n: 3 },
  { id: "11", num: "11", nom: "Aude", cont: "occ", cap: [["Carcassonne"]], n: 2 },
  { id: "12", num: "12", nom: "Aveyron", cont: "occ", cap: [["Rodez"]], n: 2 },
  { id: "30", num: "30", nom: "Gard", cont: "occ", cap: [["Nîmes"]], n: 2 },
  { id: "31", num: "31", nom: "Haute-Garonne", cont: "occ", cap: [["Toulouse"]], n: 1 },
  { id: "32", num: "32", nom: "Gers", cont: "occ", cap: [["Auch"]], n: 3 },
  { id: "34", num: "34", nom: "Hérault", cont: "occ", cap: [["Montpellier"]], n: 1 },
  { id: "46", num: "46", nom: "Lot", cont: "occ", cap: [["Cahors"]], n: 3 },
  { id: "48", num: "48", nom: "Lozère", cont: "occ", cap: [["Mende"]], n: 3 },
  { id: "65", num: "65", nom: "Hautes-Pyrénées", cont: "occ", cap: [["Tarbes"]], n: 3 },
  { id: "66", num: "66", nom: "Pyrénées-Orientales", cont: "occ", cap: [["Perpignan"]], n: 2 },
  { id: "81", num: "81", nom: "Tarn", cont: "occ", cap: [["Albi"]], n: 3 },
  { id: "82", num: "82", nom: "Tarn-et-Garonne", cont: "occ", cap: [["Montauban"]], n: 3 },

  // ---------- Pays de la Loire ----------
  { id: "44", num: "44", nom: "Loire-Atlantique", cont: "pdl", cap: [["Nantes"]], n: 1 },
  { id: "49", num: "49", nom: "Maine-et-Loire", cont: "pdl", cap: [["Angers"]], n: 2 },
  { id: "53", num: "53", nom: "Mayenne", cont: "pdl", cap: [["Laval"]], n: 3 },
  { id: "72", num: "72", nom: "Sarthe", cont: "pdl", cap: [["Le Mans"]], n: 2 },
  { id: "85", num: "85", nom: "Vendée", cont: "pdl", cap: [["La Roche-sur-Yon"]], n: 2 },

  // ---------- Provence-Alpes-Côte d'Azur ----------
  { id: "04", num: "04", nom: "Alpes-de-Haute-Provence", cont: "pac", cap: [["Digne-les-Bains", "Digne"]], n: 3 },
  { id: "05", num: "05", nom: "Hautes-Alpes", cont: "pac", cap: [["Gap"]], n: 3 },
  { id: "06", num: "06", nom: "Alpes-Maritimes", cont: "pac", cap: [["Nice"]], n: 1 },
  { id: "13", num: "13", nom: "Bouches-du-Rhône", cont: "pac", cap: [["Marseille"]], n: 1 },
  { id: "83", num: "83", nom: "Var", cont: "pac", cap: [["Toulon"]], n: 1 },
  { id: "84", num: "84", nom: "Vaucluse", cont: "pac", cap: [["Avignon"]], n: 2 },

  // ---------- Outre-mer ----------
  { id: "971", num: "971", nom: "Guadeloupe", cont: "om", cap: [["Basse-Terre"]], n: 1,
    capNote: "Pointe-à-Pitre est plus connue, mais la préfecture est Basse-Terre." },
  { id: "972", num: "972", nom: "Martinique", cont: "om", cap: [["Fort-de-France"]], n: 1 },
  { id: "973", num: "973", nom: "Guyane", cont: "om", cap: [["Cayenne"]], n: 1 },
  { id: "974", num: "974", nom: "La Réunion", var: ["Réunion", "Île de la Réunion"], cont: "om", cap: [["Saint-Denis"]], n: 1 },
  { id: "976", num: "976", nom: "Mayotte", cont: "om", cap: [["Mamoudzou"]], n: 2 }

] });
