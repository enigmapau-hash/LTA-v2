(function (root, factory) {
  const engine = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = engine;
  } else {
    root.LTABanPrioritizer = Object.freeze(engine);
  }
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  const ROLE_ORDER = Object.freeze(["top", "jungle", "mid", "botline", "support"]);
  const MAX_BANS = 3;
  const SEVERITY_ORDER = Object.freeze({ alta: 1, media: 2, baja: 3 });
  const THREAT_TRAITS = Object.freeze({
    "objective-contest": {
      style: "Disputa de objetivos",
      terms: ["objetivos", "control de zonas", "control del mapa", "poke", "asedio", "vision", "tempo"],
      impact: "Reduce su control de zonas y su capacidad para disputar objetivos antes de que el equipo pueda prepararse.",
    },
    "focused-dive": {
      style: "Dive o pick sobre la pieza clave",
      terms: ["backline", "flanqueo", "movilidad", "burst", "pick", "dive", "asesino", "engage"],
      impact: "Reduce las herramientas rivales para alcanzar o aislar la pieza que sostiene el plan.",
    },
    "forced-engage": {
      style: "Iniciación coordinada y pelea forzada",
      terms: ["engage", "iniciacion", "teamfight", "frontline", "seguimiento", "burst", "pick"],
      impact: "Reduce la capacidad rival de forzar una pelea coordinada y desordenar la ejecución del plan.",
    },
  });

  function normalize(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("es")
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  function unavailable(status) {
    return { status, bans: [] };
  }

  function collectChampionCatalog(catalog) {
    const entries = Object.entries(catalog || {})
      .flatMap(([rawRole, champions]) => {
        const role = ROLE_ORDER.find((item) => normalize(item) === normalize(rawRole));
        if (!role || !Array.isArray(champions)) return [];
        return champions.map((champion) => ({ ...champion, role }));
      });
    const unique = new Map();
    for (const champion of entries) {
      const key = normalize(champion.champion);
      if (!key) continue;
      const existing = unique.get(key);
      const strengthText = String(champion.strengths || "");
      const existingStrengthText = String(existing?.strengths || "");
      if (!existing || strengthText.length > existingStrengthText.length
        || (strengthText.length === existingStrengthText.length
          && ROLE_ORDER.indexOf(champion.role) < ROLE_ORDER.indexOf(existing.role))) {
        unique.set(key, champion);
      }
    }
    return [...unique.values()];
  }

  function candidateSignals(candidate, threat) {
    const fields = [candidate.strengths, candidate.function, candidate.identity, candidate.tempo]
      .map(normalize)
      .filter(Boolean);
    return threat.terms.filter((term) => {
      const normalizedTerm = normalize(term);
      return fields.some((field) => field.includes(normalizedTerm));
    });
  }

  function riskSupportsThreat(risks, threat) {
    const target = normalize(threat.threatens);
    return (Array.isArray(risks?.risks) ? risks.risks : []).some((risk) => risk.severity === threat.severity
      && normalize(risk.threatens) === target);
  }

  function rankThreats(counterplay, risks) {
    return (Array.isArray(counterplay?.threats) ? counterplay.threats : [])
      .filter((threat) => THREAT_TRAITS[threat?.type]
        && SEVERITY_ORDER[threat.severity]
        && String(threat.threatens || "").trim()
        && riskSupportsThreat(risks, threat))
      .sort((left, right) => SEVERITY_ORDER[left.severity] - SEVERITY_ORDER[right.severity]
        || (Number(left.priority) || Number.MAX_SAFE_INTEGER) - (Number(right.priority) || Number.MAX_SAFE_INTEGER)
        || left.type.localeCompare(right.type, "es"));
  }

  function candidatesForThreat(catalog, selected, threat) {
    const definition = THREAT_TRAITS[threat.type];
    return catalog
      .filter((candidate) => !selected.has(normalize(candidate.champion)))
      .map((candidate) => ({ candidate, signals: candidateSignals(candidate, definition) }))
      .filter((item) => item.signals.length)
      .sort((left, right) => right.signals.length - left.signals.length
        || ROLE_ORDER.indexOf(left.candidate.role) - ROLE_ORDER.indexOf(right.candidate.role)
        || String(left.candidate.champion).localeCompare(String(right.candidate.champion), "es"));
  }

  function presentBan(item, threat, priority) {
    const champion = String(item.candidate.champion).trim();
    const definition = THREAT_TRAITS[threat.type];
    const signalText = item.signals.slice(0, 2).join(" y ");
    return {
      priority,
      champion,
      threatType: threat.type,
      threatStyle: definition.style,
      severity: threat.severity,
      explanation: `${champion} aporta ${signalText}, señales que potencian ${definition.style.toLocaleLowerCase("es")} contra ${threat.threatens}.`,
      expectedImpact: definition.impact,
    };
  }

  function prioritizeBans(input = {}) {
    const risks = input.strategicRisks;
    const counterplay = input.strategicCounterplay;
    const composition = input.mappedCandidates?.composition;
    if (risks?.status === "pending" || counterplay?.status === "pending" || composition?.status === "incomplete") {
      return unavailable("pending");
    }
    if (risks?.status !== "assessed" || composition?.status !== "complete" || !Array.isArray(composition.picks)) {
      return unavailable("not-assessable");
    }
    if (counterplay?.status === "no-supported-threat") return unavailable("no-supported-threat");
    if (counterplay?.status !== "advised") return unavailable("not-assessable");

    const threats = rankThreats(counterplay, risks);
    if (!threats.length) return unavailable("no-supported-threat");
    const catalog = collectChampionCatalog(input.championCatalog);
    if (!catalog.length) return unavailable("no-candidates");

    const selected = new Set(composition.picks.map((pick) => normalize(pick?.champion)).filter(Boolean));
    const rankedByThreat = threats.map((threat) => ({
      threat,
      candidates: candidatesForThreat(catalog, selected, threat),
      cursor: 0,
    }));
    const bans = [];
    const selectedBans = new Set();

    while (bans.length < MAX_BANS) {
      let addedThisRound = false;
      for (const group of rankedByThreat) {
        while (group.cursor < group.candidates.length) {
          const item = group.candidates[group.cursor++];
          const key = normalize(item.candidate.champion);
          if (selectedBans.has(key)) continue;
          selectedBans.add(key);
          bans.push(presentBan(item, group.threat, bans.length + 1));
          addedThisRound = true;
          break;
        }
        if (bans.length === MAX_BANS) break;
      }
      if (!addedThisRound) break;
    }

    return bans.length ? { status: "prioritized", bans } : unavailable("no-matching-candidates");
  }

  return { prioritizeBans };
});
