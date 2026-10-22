(function (root, factory) {
  const compositionEngine = typeof module === "object" && module.exports
    ? require("./composition-engine.js")
    : root.LTACompositionEngine;
  const engine = factory(compositionEngine);
  if (typeof module === "object" && module.exports) {
    module.exports = engine;
  } else {
    root.LTACorrectionEngine = Object.freeze(engine);
  }
})(typeof window !== "undefined" ? window : globalThis, function (compositionEngine) {
  "use strict";

  const ROLE_ORDER = ["top", "jungle", "mid", "botline", "support"];
  const MAX_PROFILES = 2;
  const CANDIDATES_PER_PROFILE = 3;

  const PROFILES = [
    {
      id: "engage",
      label: "Iniciación y seguimiento",
      matches: ["engage", "follow-up", "playmaking", "acceso al carry"],
      signals: ["iniciación", "engage", "follow-up", "playmaking"],
    },
    {
      id: "frontline",
      label: "Frontline",
      matches: ["frontline", "tanque", "juggernaut"],
      signals: ["frontline", "tanque"],
    },
    {
      id: "sustained-damage",
      label: "Daño sostenido",
      matches: ["dps", "hypercarry", "sustain"],
      signals: ["daño sostenido", "dps", "hypercarry"],
    },
    {
      id: "side-lane",
      label: "Presión lateral",
      matches: ["side lane", "duelos", "presión global", "global", "duelista"],
      signals: ["presión lateral", "side lane", "duelos", "presión global"],
    },
    {
      id: "peel",
      label: "Protección y disengage",
      matches: ["peel", "protección", "anti-engage", "autoprotección"],
      signals: ["peel", "protección", "anti-engage", "autoprotección"],
    },
    {
      id: "pick",
      label: "Pick y control del mapa",
      matches: ["pick", "ganks", "roams", "control de visión", "control del mapa"],
      signals: ["pick", "ganks", "roams", "control del mapa"],
    },
    {
      id: "early-pressure",
      label: "Presión temprana",
      matches: ["early", "snowball", "tempo", "ganks", "dominio de línea", "prioridad de línea"],
      signals: ["early", "snowball", "tempo", "prioridad de línea"],
    },
    {
      id: "scaling",
      label: "Escalado",
      matches: ["escalado", "hypercarry", "late", "dps"],
      signals: ["escalado", "hypercarry", "late", "dps"],
    },
  ];

  const FACTOR_PROFILES = [
    { terms: ["iniciación compartida", "iniciacion compartida", "iniciación coordinada", "falla la iniciación", "falla la iniciacion"], profile: "engage" },
    { terms: ["frontline"], profile: "frontline" },
    { terms: ["daño sostenido", "dano sostenido"], profile: "sustained-damage" },
    { terms: ["presión lateral", "presion lateral", "side lane"], profile: "side-lane" },
    { terms: ["engages directos", "engage directo", "protección para los carries", "proteccion para los carries"], profile: "peel" },
    { terms: ["teamfights prolongadas", "teamfight prolongada"], profile: "pick" },
    { terms: ["early vulnerable", "early débil", "early debil"], profile: "early-pressure" },
    { terms: ["partida se alarga", "pierde valor si la partida"], profile: "scaling" },
  ];

  function normalize(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  function fieldValues(value) {
    if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
    return String(value || "").split(/[·,;]/).map((item) => item.trim()).filter(Boolean);
  }

  function profileForFactor(factor) {
    const text = normalize(factor);
    const match = FACTOR_PROFILES.find((item) => item.terms.some((term) => text.includes(normalize(term))));
    return match ? PROFILES.find((profile) => profile.id === match.profile) || null : null;
  }

  function diagnosticFactors(diagnosis) {
    const primary = Array.isArray(diagnosis?.primaryProblem?.evidence)
      ? diagnosis.primaryProblem.evidence
      : [];
    if (primary.length) return primary;
    const gaps = Array.isArray(diagnosis?.coherence?.gaps) ? diagnosis.coherence.gaps : [];
    return gaps;
  }

  function candidateSignals(candidate) {
    return [
      ...fieldValues(candidate?.strengths),
      ...fieldValues(candidate?.function),
      ...fieldValues(candidate?.tempo),
    ];
  }

  function rankCandidates(profile, candidatesByRole, selectedChampions) {
    const ranked = new Map();
    for (const role of ROLE_ORDER) {
      const candidates = Array.isArray(candidatesByRole?.[role]) ? candidatesByRole[role] : [];
      for (const candidate of candidates) {
        const champion = String(candidate?.champion || "").trim();
        const key = normalize(champion);
        if (!champion || selectedChampions.has(key)) continue;

        const matchingSignals = candidateSignals(candidate).filter((signal) =>
          profile.matches.some((term) => normalize(signal).includes(normalize(term)))
        );
        const uniqueSignals = [...new Map(matchingSignals.map((signal) => [normalize(signal), signal])).values()];
        if (!uniqueSignals.length) continue;

        const item = {
          champion,
          role,
          contribution: uniqueSignals.slice(0, 3),
          score: uniqueSignals.length,
        };
        const existing = ranked.get(key);
        if (!existing || item.score > existing.score) ranked.set(key, item);
      }
    }

    return [...ranked.values()]
      .sort((a, b) => b.score - a.score || ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role) || a.champion.localeCompare(b.champion, "es"))
      .slice(0, CANDIDATES_PER_PROFILE)
      .map(({ score, ...candidate }) => candidate);
  }

  function proposeCorrections(input) {
    const picks = Array.isArray(input?.picks) ? input.picks.filter(Boolean) : [];
    const diagnosis = input?.diagnosis;
    if (diagnosis?.status !== "assessed") {
      return {
        status: "not-assessable",
        limitingFactor: null,
        explanation: "Se necesita un diagnóstico completo para proponer una corrección.",
        improvements: [],
      };
    }

    const problemType = diagnosis.primaryProblem?.type;
    const clearPlan = diagnosis.plan?.clear && diagnosis.plan?.primaryIdentity;
    const missingRequirements = clearPlan && problemType === "identity-risk"
      ? compositionEngine.assessPlanNeeds({ picks, identity: diagnosis.plan.primaryIdentity })
      : [];
    // Inherent archetype tradeoffs cannot themselves justify a replacement.
    const factors = clearPlan
      ? missingRequirements.map((need) => need.label)
      : problemType === "cohesion-gap" ? diagnosticFactors(diagnosis) : [];
    const selectedChampions = new Set(picks.map((pick) => normalize(pick?.champion)).filter(Boolean));
    const improvements = [];
    const seenProfiles = new Set();
    let limitingFactor = null;

    for (const factor of factors) {
      const label = String(factor || "").trim();
      const profile = profileForFactor(label);
      if (!profile || seenProfiles.has(profile.id)) continue;
      if (!limitingFactor) limitingFactor = label;
      seenProfiles.add(profile.id);
      const candidates = rankCandidates(profile, input?.candidatesByRole, selectedChampions);
      if (candidates.length < 2) continue;

      improvements.push({
        profile: { id: profile.id, label: profile.label },
        limitingFactor: label,
        evidenceType: clearPlan ? "required-plan-capability" : "cohesion-gap",
        priority: improvements.length === 0 ? "principal" : "alternativa",
        explanation: `Falta respaldo para «${label}». ${profile.label} puede cubrir esa necesidad; debe verificarse el plan resultante de cualquier cambio.`,
        candidates,
      });
      if (improvements.length >= MAX_PROFILES) break;
    }

    return {
      status: improvements.length ? "proposed" : "no-supported-correction",
      limitingFactor,
      explanation: improvements.length
        ? "La prioridad procede de una herramienta exigida por el plan que falta o de una brecha de cohesión explícita."
        : clearPlan && !missingRequirements.length
          ? "No hay una sustitución prioritaria demostrada: las limitaciones propias del estilo no obligan a cambiar campeones."
          : problemType === "strategic-contradiction"
            ? "Los planes estratégicos entran en conflicto; no se ha demostrado qué cambio individual resolvería la contradicción."
            : "Las señales disponibles no justifican una corrección concreta.",
      improvements,
    };
  }

  return { proposeCorrections };
});
