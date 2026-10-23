(function (root, factory) {
  const editorial = typeof module === "object" && module.exports
    ? require("./role-editorial-26-21.js")
    : root.LTARoleEditorial;
  const api = factory(editorial);
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  } else {
    root.LTARoleViability = Object.freeze(api);
  }
})(typeof window !== "undefined" ? window : globalThis, function (editorial) {
  "use strict";

  // Only verified evidence is classified. Every other workbook champion/role
  // pair receives "sin-verificar", NOT a guessed habitual/situational rating.
  // Snapshot is offline and versioned; metadata is never queried at runtime.
  const PATCH = "26.21";
  const CHECKED_AT = "2026-10-22";
  const SOURCE = "METAsrc";
  const evidence = Object.freeze([
    {
      champion: "Diana", role: "top", status: "experimental",
      games: 124, source: "https://www.metasrc.com/lol/champions/diana/top/stats",
      note: "Muestra pequeña para TOP; no recomendar como elección estándar.",
    },
    {
      champion: "Diana", role: "jungle", status: "habitual", games: 9806, roleRate: 45.08,
      source: "https://www.metasrc.com/lol/champions/diana/jungle/stats",
    },
    {
      champion: "Diana", role: "mid", status: "habitual", games: 10740, roleRate: 49.37,
      source: "https://www.metasrc.com/lol/champions/diana/build?patch=26.20",
    },
    {
      champion: "Viego", role: "jungle", status: "habitual", games: 14618, roleRate: 93.08,
      source: "https://www.metasrc.com/lol/champions/viego/stats?region=euw",
    },
    {
      champion: "Smolder", role: "botline", status: "habitual", games: 13870, roleRate: 76.41,
      source: "https://www.metasrc.com/lol/champions/smolder/stats?region=lan",
    },
    {
      champion: "Smolder", role: "top", status: "situacional", games: 356, roleRate: 11.73,
      source: "https://www.metasrc.com/es/lol/champions/smolder/top/stats?region=euw",
      note: "Elección secundaria con muestra limitada; requiere motivo contextual.",
    },
  ]);

  const ORDER = Object.freeze({
    principal: 5, compatible: 4, habitual: 3, situacional: 2,
    "sin-verificar": 1, secundaria: 0, experimental: 0, descartada: 0,
  });

  function normalize(value) {
    return String(value || "").normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es")
      .replace(/[^a-z0-9]+/g, " ").trim();
  }

  const byPair = new Map(evidence.map((item) => [
    `${normalize(item.champion)}|${normalize(item.role)}`,
    Object.freeze({ ...item, patch: PATCH, checkedAt: CHECKED_AT, provider: SOURCE }),
  ]));

  const reviewed = new Map((editorial?.entries || []).map((item) => [
    `${normalize(item.champion)}|${normalize(item.role)}`, item,
  ]));
  function assess(champion, role) {
    const key = `${normalize(champion)}|${normalize(role)}`;
    const curated = reviewed.get(key);
    if (curated) return {
      ...curated, patch: PATCH, checkedAt: curated.reviewedAt,
      provider: curated.source?.includes("leagueofgraphs.com") ? "LeagueOfGraphs / League Wiki"
        : curated.manualRoleReview ? (curated.source
          ? "League Wiki / criterio manual del usuario" : "Criterio manual del usuario")
        : curated.status === "experimental" ? "METAsrc" : "League Wiki / revisión editorial",
      reviewed: true,
    };
    const known = byPair.get(key);
    return known || {
      champion: String(champion || "").trim(),
      role: String(role || "").trim(),
      status: "sin-verificar",
      patch: PATCH,
      checkedAt: CHECKED_AT,
      provider: "Draft Pool.xlsx",
      source: null,
      games: null,
      note: "El catálogo admite esta posición, pero su viabilidad no ha sido verificada en el parche.",
    };
  }

  function priority(record) {
    return ORDER[record?.status] ?? ORDER["sin-verificar"];
  }

  function isReviewedRecommendation(record) {
    return record?.status === "principal" || record?.status === "compatible"
      || record?.status === "habitual";
  }

  function isExcluded(record) {
    return record?.status === "secundaria" || record?.status === "experimental"
      || record?.status === "descartada";
  }

  function candidatesForReview(candidatesByRole = {}) {
    return Object.entries(candidatesByRole).flatMap(([role, items]) =>
      (Array.isArray(items) ? items : []).map((item) => assess(item.champion, role))
    );
  }

  return Object.freeze({
    PATCH, CHECKED_AT, assess, priority, isReviewedRecommendation, isExcluded,
    candidatesForReview, evidence, reviewedEvidence: editorial?.entries || [],
  });
});
