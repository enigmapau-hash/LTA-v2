(function (root, factory) {
  const data = factory();
  if (typeof module === "object" && module.exports) module.exports = data;
  else root.LTARoleEditorial = Object.freeze(data);
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";
  // Edición HUMANA de hechos posicionales, no una copia de estadísticas ni una cuota.
  // Principal = juicio editorial corroborado con cuota de partidas del campeón
  // por rol en LeagueOfGraphs parche 16.21, sin importar bases ni tablas.
  // Compatible = posición marcada Riot en League Wiki (no cuota estadística).
  // Secundaria = solo 3P en League Wiki. Experimental = evidencia previa escasa.
  // Wiki: https://wiki.leagueoflegends.com/en-us/List_of_champions_by_draft_position
  const REVIEWED_AT = "2026-10-23";
  const WIKI = "https://wiki.leagueoflegends.com/en-us/List_of_champions_by_draft_position";
  const PAIRS = Object.freeze([
  [
    "Aatrox",
    "top",
    "principal"
  ],
  [
    "K'Sante",
    "top",
    "principal"
  ],
  [
    "Maokai",
    "support",
    "principal"
  ],
  [
    "Diana",
    "jungle",
    "principal"
  ],
  [
    "Diana",
    "mid",
    "principal"
  ],
  [
    "Aurora",
    "mid",
    "principal"
  ],
  [
    "Seraphine",
    "support",
    "principal"
  ],
  [
    "Ornn",
    "top",
    "compatible"
  ],
  [
    "Malphite",
    "top",
    "compatible"
  ],
  [
    "Camille",
    "top",
    "compatible"
  ],
  [
    "Fiora",
    "top",
    "compatible"
  ],
  [
    "Jayce",
    "top",
    "compatible"
  ],
  [
    "Garen",
    "top",
    "compatible"
  ],
  [
    "Shen",
    "top",
    "compatible"
  ],
  [
    "Gwen",
    "top",
    "compatible"
  ],
  [
    "Aurora",
    "top",
    "compatible"
  ],
  [
    "Viego",
    "jungle",
    "compatible"
  ],
  [
    "Wukong",
    "jungle",
    "compatible"
  ],
  [
    "Sejuani",
    "jungle",
    "compatible"
  ],
  [
    "Amumu",
    "jungle",
    "compatible"
  ],
  [
    "Jarvan IV",
    "jungle",
    "compatible"
  ],
  [
    "Gragas",
    "jungle",
    "compatible"
  ],
  [
    "Evelynn",
    "jungle",
    "compatible"
  ],
  [
    "Elise",
    "jungle",
    "compatible"
  ],
  [
    "Poppy",
    "jungle",
    "compatible"
  ],
  [
    "Galio",
    "mid",
    "compatible"
  ],
  [
    "Yasuo",
    "mid",
    "habitual"
  ],
  [
    "Orianna",
    "mid",
    "compatible"
  ],
  [
    "Ahri",
    "mid",
    "compatible"
  ],
  [
    "Taliyah",
    "mid",
    "compatible"
  ],
  [
    "Twisted Fate",
    "mid",
    "compatible"
  ],
  [
    "Jhin",
    "botline",
    "compatible"
  ],
  [
    "Jinx",
    "botline",
    "compatible"
  ],
  [
    "Miss Fortune",
    "botline",
    "compatible"
  ],
  [
    "Ezreal",
    "botline",
    "compatible"
  ],
  [
    "Smolder",
    "botline",
    "compatible"
  ],
  [
    "Seraphine",
    "botline",
    "compatible"
  ],
  [
    "Kai'Sa",
    "botline",
    "compatible"
  ],
  [
    "Lulu",
    "support",
    "compatible"
  ],
  [
    "Milio",
    "support",
    "compatible"
  ],
  [
    "Rell",
    "support",
    "compatible"
  ],
  [
    "Nautilus",
    "support",
    "compatible"
  ],
  [
    "Braum",
    "support",
    "compatible"
  ],
  [
    "Janna",
    "support",
    "compatible"
  ],
  [
    "Maokai",
    "top",
    "secundaria"
  ],
  [
    "Corki",
    "mid",
    "secundaria"
  ],
  [
    "Jayce",
    "mid",
    "secundaria"
  ],
  [
    "Smolder",
    "top",
    "secundaria"
  ],
  [
    "Diana",
    "top",
    "experimental"
  ]
]);
  // Ampliación por campeón, curación editorial puntual del 23/10/2026.
  // Riot Wiki = compatibilidad; LeagueOfGraphs = distribución, sin importar tablas.
  const ADDITIONAL_PAIRS = Object.freeze([
  [
    "Brand",
    "support",
    "principal"
  ],
  
  [
    "Jax",
    "top",
    "principal"
  ],
  [
    "Senna",
    "support",
    "principal"
  ],
  [
    "Swain",
    "support",
    "principal"
  ],
  [
    "Ashe",
    "botline",
    "principal"
  ],
  [
    "Poppy",
    "support",
    "habitual"
  ],
  [
    "Pantheon",
    "top",
    "habitual"
  ],
  [
    "Pantheon",
    "support",
    "habitual"
  ],
  [
    "Xerath",
    "mid",
    "habitual"
  ],
  [
    "Xerath",
    "support",
    "habitual"
  ],
  [
    "Swain",
    "botline",
    "habitual"
  ],
  [
    "Brand",
    "mid",
    "habitual"
  ],
  [
    "Jax",
    "jungle",
    "habitual"
  ],
  [
    "Lux",
    "mid",
    "habitual"
  ],
  [
    "Brand",
    "jungle",
    "secundaria"
  ],
  [
    "Pantheon",
    "mid",
    "secundaria"
  ],
  [
    "Yasuo",
    "top",
    "compatible"
  ],
  [
    "Yasuo",
    "botline",
    "compatible"
  ],
  [
    "Bel'Veth",
    "jungle",
    "compatible"
  ],
  [
    "Briar",
    "jungle",
    "compatible"
  ],
  [
    "Ekko",
    "jungle",
    "compatible"
  ],
  [
    "Fiddlesticks",
    "jungle",
    "compatible"
  ],
  [
    "Graves",
    "jungle",
    "compatible"
  ],
  [
    "Hecarim",
    "jungle",
    "compatible"
  ],
  [
    "Ivern",
    "jungle",
    "compatible"
  ],
  [
    "Kindred",
    "jungle",
    "compatible"
  ],
  [
    "Lee Sin",
    "jungle",
    "compatible"
  ],
  [
    "Lillia",
    "jungle",
    "compatible"
  ],
  [
    "Nocturne",
    "jungle",
    "compatible"
  ],
  [
    "Rammus",
    "jungle",
    "compatible"
  ],
  [
    "Skarner",
    "jungle",
    "compatible"
  ],
  [
    "Vi",
    "jungle",
    "compatible"
  ],
  [
    "Shyvana",
    "jungle",
    "compatible"
  ],
  [
    "Cho'Gath",
    "top",
    "compatible"
  ],
  [
    "Darius",
    "top",
    "compatible"
  ],
  [
    "Dr. Mundo",
    "top",
    "compatible"
  ],
  [
    "Gnar",
    "top",
    "compatible"
  ],
  [
    "Illaoi",
    "top",
    "compatible"
  ],
  [
    "Irelia",
    "top",
    "compatible"
  ],
  [
    "Kayle",
    "top",
    "compatible"
  ],
  [
    "Mordekaiser",
    "top",
    "compatible"
  ],
  [
    "Renekton",
    "top",
    "compatible"
  ],
  [
    "Riven",
    "top",
    "compatible"
  ],
  [
    "Sion",
    "top",
    "compatible"
  ],
  [
    "Volibear",
    "top",
    "compatible"
  ],
  [
    "Aphelios",
    "botline",
    "compatible"
  ],
  [
    "Caitlyn",
    "botline",
    "compatible"
  ],
  [
    "Corki",
    "botline",
    "compatible"
  ],
  [
    "Draven",
    "botline",
    "compatible"
  ],
  [
    "Lucian",
    "botline",
    "compatible"
  ],
  [
    "Nilah",
    "botline",
    "compatible"
  ],
  [
    "Samira",
    "botline",
    "compatible"
  ],
  [
    "Sivir",
    "botline",
    "compatible"
  ],
  [
    "Xayah",
    "botline",
    "compatible"
  ],
  [
    "Zeri",
    "botline",
    "compatible"
  ],
  [
    "Alistar",
    "support",
    "compatible"
  ],
  [
    "Blitzcrank",
    "support",
    "compatible"
  ],
  [
    "Leona",
    "support",
    "compatible"
  ],
  [
    "Nami",
    "support",
    "compatible"
  ],
  [
    "Pyke",
    "support",
    "compatible"
  ],
  [
    "Rakan",
    "support",
    "compatible"
  ],
  [
    "Thresh",
    "support",
    "compatible"
  ],
  [
    "Yuumi",
    "support",
    "compatible"
  ],
  [
    "Ashe",
    "support",
    "compatible"
  ],
  [
    "Akali",
    "mid",
    "compatible"
  ],
  [
    "Anivia",
    "mid",
    "compatible"
  ],
  [
    "Azir",
    "mid",
    "compatible"
  ],
  [
    "Kassadin",
    "mid",
    "compatible"
  ],
  [
    "Katarina",
    "mid",
    "compatible"
  ],
  [
    "LeBlanc",
    "mid",
    "compatible"
  ],
  [
    "Qiyana",
    "mid",
    "compatible"
  ],
  [
    "Syndra",
    "mid",
    "compatible"
  ],
  [
    "Yone",
    "mid",
    "compatible"
  ],
  [
    "Zed",
    "mid",
    "compatible"
  ],
  [
    "Swain",
    "mid",
    "compatible"
  ]
]);

  // Seven manually transcribed positional facts (NOT a third-party dataset).
  // Source: LeagueOfGraphs, patch 16.21; all regions, Platinum+,
  // normal and ranked, last two days as observed on 2026-10-23.
  // Share is among matches WITH THIS CHAMPION, not the pick rate in the lane.
  const STATISTICAL_SHARE = Object.freeze({
    "Aatrox|top": [84.3, "jungle", 11.9],
    "K'Sante|top": [93.6, "mid", 3.2],
    "Maokai|support": [65.3, "jungle", 19.2],
    "Diana|jungle": [47.7, "mid", 48.5],
    "Diana|mid": [48.5, "jungle", 47.7],
    "Aurora|mid": [79.5, "top", 16.3],
    "Seraphine|support": [92.0, "botline", 5.8],
    "Brand|support": [62.2,"mid",16.2],
    "Lux|support": [61,"mid",32.1],
    "Jax|top": [80.4,"jungle",16.1],
    "Senna|support": [90.8,"botline",7.8],
    "Swain|support": [61,"botline",16],
    "Ashe|botline": [82.5,"support",14.4],
    "Poppy|support": [57.6],
    "Pantheon|top": [42.6],
    "Pantheon|support": [36.7],
    "Yasuo|mid": [59.8],
    "Xerath|mid": [50.9],
    "Xerath|support": [40.5],
    "Swain|botline": [16],
    "Brand|mid": [16.2],
    "Jax|jungle": [16.1],
    "Lux|mid": [32.1],
    "Brand|jungle": [5.3],
    "Pantheon|mid": [11.1],
  });
  const PRIMARY_SOURCE = "https://www.leagueofgraphs.com/en/champions/stats/";
  // Posición predominante externa al Excel: sirve para descartar predominio
  // de Lux MID, NO para aumentar artificialmente la cobertura del catálogo.
  const externalDominance = Object.freeze([
    Object.freeze({ champion: "Lux", role: "support", roleSharePct: 61.0,
      sourcePatch: "16.21", reviewedAt: REVIEWED_AT,
      source: PRIMARY_SOURCE + "lux" }),
  ]);
  const entries = [...PAIRS, ...ADDITIONAL_PAIRS].map(([champion,role,status]) => {
    const primary = status === "principal";
    const experimental = status === "experimental";
    const roleShare = STATISTICAL_SHARE[champion + "|" + role] || null;
    return Object.freeze({
      champion, role, status, reviewedAt: REVIEWED_AT,
      source: roleShare
        ? PRIMARY_SOURCE + champion.toLowerCase().replace(/[^a-z0-9]/g,"")
        : experimental
          ? "https://www.metasrc.com/lol/champions/diana/top/stats"
          : WIKI,
      corroboration: roleShare ? WIKI : null,
      ...(roleShare ? {
        roleSharePct: roleShare[0],
        ...(roleShare.length > 1 ? { runnerUpRole: roleShare[1], runnerUpSharePct: roleShare[2] } : {}),
      } : {}),
      sourcePatch: roleShare ? "16.21" : null,
      evidenceType: roleShare
        ? "Distribución puntual de partidas del campeón; estado editorial: " + status
        : status === "compatible" ? "Posición reconocida por Riot según listado de League Wiki"
        : experimental ? "Muestra anterior pequeña, no apta para recomendación normal"
        : "Solo 3P en League Wiki; no etiquetar principal",
      scope: roleShare ? "Todas las regiones, Platino+, normales y clasificatorias, ventana de dos días (consulta 23/10/2026)"
        : "Listado descriptivo; no certifica cuota ni parche",
    });
  });
  return Object.freeze({ REVIEWED_AT, entries: Object.freeze(entries), externalDominance });
});
