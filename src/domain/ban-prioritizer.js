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

  // Threats are derived from the existing Protection engine. The older risk-based
  // path remains available for existing integrations and tests.
  const PROTECTION_TRAITS = Object.freeze({
    "early-game": {
      style: "Presión temprana",
      terms: ["early", "snowball", "invasion", "presion de linea", "dominio de linea", "ganks"],
      impact: "Reduce la presión que podría retrasar los picos de poder del equipo.",
    },
    scaling: {
      style: "Escalado rival",
      terms: ["late", "escalado", "hypercarry", "dps", "dano sostenido"],
      impact: "Reduce una posible ventaja rival en los combates tardíos.",
    },
    poke: {
      style: "Poke y asedio",
      terms: ["poke", "asedio", "control de zonas", "desgaste"],
      impact: "Limita el desgaste previo a entrar o disputar objetivos.",
    },
    dive: {
      style: "Dive sobre la retaguardia",
      terms: ["dive", "flanqueo", "asesino", "burst", "movilidad"],
      impact: "Reduce las opciones rivales de acceder a las piezas prioritarias.",
    },
    pick: {
      style: "Pick y cazadas",
      terms: ["pick", "ganks", "roams", "cazadas", "burst"],
      impact: "Reduce las herramientas para castigar rotaciones aisladas.",
    },
    "split-push": {
      style: "Presión lateral",
      terms: ["side lane", "split push", "duelos", "presion lateral"],
      impact: "Reduce la presión que podría dividir al equipo antes de los objetivos.",
    },
    teamfight: {
      style: "Pelea de equipo",
      terms: ["teamfight", "engage", "iniciacion", "follow-up", "aoe"],
      impact: "Reduce la capacidad rival de imponer una pelea coordinada.",
    },
    "front-to-back": {
      style: "Frontline y daño sostenido",
      terms: ["frontline", "tanque", "dps", "dano sostenido"],
      impact: "Reduce una fuente de resistencia o daño prolongado del rival.",
    },
  });
  const ALL_TRAITS = Object.freeze({ ...THREAT_TRAITS, ...PROTECTION_TRAITS });
  const COMPLEMENTARY_ORDER = Object.freeze(["early-game", "dive", "poke", "pick", "teamfight", "split-push", "front-to-back", "scaling"]);

  function normalize(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("es")
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  // Draft Pool.xlsx distinguishes build variants, but bans in League of
  // Legends apply to the champion. Scope the aliasing to these known builds:
  // never collapse other, potentially meaningful parenthesized names.
  const KNOWN_BUILD_VARIANTS = Object.freeze({
    shaco: Object.freeze(["ad", "ap"]),
    kayn: Object.freeze(["azul", "rojo"]),
    varus: Object.freeze(["letalidad", "on hit"]),
  });

  function canonicalBanChampion(value) {
    const champion = String(value || "").trim();
    const variant = /^(.+?)\\s*\\(([^)]+)\\)$/.exec(champion);
    if (!variant) return champion;
    const base = variant[1].trim();
    const build = normalize(variant[2]);
    return KNOWN_BUILD_VARIANTS[normalize(base)]?.includes(build) ? base : champion;
  }

  function unavailable(status) {
    return { status, bans: [] };
  }

  function collectChampionCatalog(catalog) {
    const entries = Object.entries(catalog || {})
      .flatMap(([rawRole, champions]) => {
        const role = ROLE_ORDER.find((item) => normalize(item) === normalize(rawRole));
        if (!role || !Array.isArray(champions)) return [];
        return champions.map((champion) => ({
          ...champion,
          champion: canonicalBanChampion(champion?.champion),
          role,
        }));
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
    const definition = ALL_TRAITS[threat.type];
    return catalog
      .filter((candidate) => !selected.has(normalize(candidate.champion)))
      .map((candidate) => ({ candidate, signals: candidateSignals(candidate, definition) }))
      .filter((item) => item.signals.length)
      .sort((left, right) => right.signals.length - left.signals.length
        || ROLE_ORDER.indexOf(left.candidate.role) - ROLE_ORDER.indexOf(right.candidate.role)
        || String(left.candidate.champion).localeCompare(String(right.candidate.champion), "es"));
  }

  function presentBan(item, threat, priority, teamIdentity = "") {
    const champion = String(item.candidate.champion).trim();
    const definition = ALL_TRAITS[threat.type];
    const signalText = item.signals.slice(0, 2).join(" y ");
    const explanation = threat.source === "protection"
      ? `${champion} tiene señales de ${signalText}. ${threat.detail || "Este estilo puede dificultar la ejecución del plan."} ${teamIdentity ? `Se valora frente al plan ${teamIdentity};` : "Se valora como"} amenaza potencial, no como counter directo demostrado.`
      : `${champion} aporta ${signalText}, señales que potencian ${definition.style.toLocaleLowerCase("es")} contra ${threat.threatens}.`;
    return {
      priority,
      champion,
      threatType: threat.type,
      threatStyle: definition.style,
      severity: threat.severity,
      explanation,
      expectedImpact: definition.impact,
    };
  }

  function protectionThreats(protection) {
    const seen = new Set();
    const threats = [];
    for (const item of Array.isArray(protection?.threats) ? protection.threats : []) {
      if (!PROTECTION_TRAITS[item?.id] || seen.has(item.id)) continue;
      seen.add(item.id);
      threats.push({
        type: item.id,
        source: "protection",
        severity: item.priority === "principal" ? "alta" : item.priority === "alta" ? "media" : "baja",
        threatens: String(item.style || "el plan del equipo"),
        detail: String(item.explanation || "").trim(),
      });
    }
    // All teams have matchup vulnerabilities, even if the risk sub-engine has
    // no priority. Keep these as possible threats, never as proven hard counters.
    for (const id of COMPLEMENTARY_ORDER) {
      if (seen.has(id)) continue;
      seen.add(id);
      threats.push({ type: id, source: "protection", severity: "baja", threatens: "el plan del equipo" });
    }
    return threats;
  }

  function prioritizeBans(input = {}) {
    const risks = input.strategicRisks;
    const counterplay = input.strategicCounterplay;
    // Bans concern the team, not the availability of a recommendation.
    const composition = input.mappedCandidates?.composition || (Array.isArray(input.currentPicks)
      ? { status: "complete", picks: input.currentPicks }
      : null);
    if (composition?.status === "incomplete" || (!input.protection && (risks?.status === "pending" || counterplay?.status === "pending"))) {
      return unavailable("pending");
    }
    if (composition?.status !== "complete" || !Array.isArray(composition.picks)
      || composition.picks.length !== ROLE_ORDER.length
      || new Set(composition.picks.map((pick) => normalize(pick?.role))).size !== ROLE_ORDER.length
      || !ROLE_ORDER.every((role) => composition.picks.some((pick) => normalize(pick?.role) === role))
      || new Set(composition.picks.map((pick) => normalize(canonicalBanChampion(pick?.champion)))).size !== ROLE_ORDER.length) {
      return unavailable("not-assessable");
    }

    const comprehensive = Boolean(input.protection);
    if (!comprehensive && (risks?.status !== "assessed" || counterplay?.status !== "advised")) {
      return unavailable(counterplay?.status === "no-supported-threat" ? "no-supported-threat" : "not-assessable");
    }
    const threats = comprehensive ? protectionThreats(input.protection) : rankThreats(counterplay, risks);
    if (!threats.length) return unavailable("no-supported-threat");
    const catalog = collectChampionCatalog(input.championCatalog);
    if (!catalog.length) return unavailable("no-candidates");

    const selected = new Set(composition.picks.map((pick) => normalize(canonicalBanChampion(pick?.champion))).filter(Boolean));
    const rankedByThreat = threats.map((threat) => ({
      threat,
      candidates: candidatesForThreat(catalog, selected, threat),
      cursor: 0,
    }));
    const bans = [];
    const selectedBans = new Set();

    // In the complete UI path, take one ban per threat style first, so the
    // same problem is not repeated three times on one composition.
    while (bans.length < MAX_BANS) {
      let addedThisRound = false;
      for (const group of rankedByThreat) {
        if (comprehensive && group.used) continue;
        while (group.cursor < group.candidates.length) {
          const item = group.candidates[group.cursor++];
          const key = normalize(item.candidate.champion);
          if (selectedBans.has(key)) continue;
          selectedBans.add(key);
          bans.push(presentBan(item, group.threat, bans.length + 1, String(input.diagnosis?.plan?.primaryIdentity || "").trim()));
          addedThisRound = true;
          group.used = true;
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
