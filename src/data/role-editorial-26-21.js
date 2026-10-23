(function (root, factory) {
  const data = factory();
  if (typeof module === "object" && module.exports) module.exports = data;
  else root.LTARoleEditorial = Object.freeze(data);
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";
  // Edición HUMANA de hechos posicionales, no una copia de estadísticas ni una cuota.
  // Principal = juicio editorial corroborado con vista por campeón en OP.GG
  // parche 16.21; no certifica un umbral de muestra ni porcentaje de juegos.
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
    "compatible"
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
  const entries = PAIRS.map(([champion,role,status]) => {
    const primary = status === "principal";
    const experimental = status === "experimental";
    return Object.freeze({
      champion, role, status, reviewedAt: REVIEWED_AT,
      source: primary
        ? "https://op.gg/lol/champions/" + champion.toLowerCase().replace(/[^a-z0-9]/g,"") + "/build"
        : experimental
          ? "https://www.metasrc.com/lol/champions/diana/top/stats"
          : WIKI,
      corroboration: primary ? WIKI : null,
      sourcePatch: primary ? "16.21" : null,
      evidenceType: primary ? "Predominio editorial observado en la vista de campeón (OP.GG, sin cuota certificada)"
        : status === "compatible" ? "Posición reconocida por Riot según listado de League Wiki"
        : experimental ? "Muestra anterior pequeña, no apta para recomendación normal"
        : "Solo 3P en League Wiki; no etiquetar principal",
      scope: primary ? "Global, Emerald+, Solo/Duo (consulta 23/10/2026)"
        : "Listado descriptivo; no certifica cuota ni parche",
    });
  });
  return Object.freeze({ REVIEWED_AT, entries: Object.freeze(entries) });
});
