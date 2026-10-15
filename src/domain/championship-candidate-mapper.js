(function (root, factory) {
  const engine = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = engine;
  } else {
    root.LTAChampionshipCandidateMapper = Object.freeze(engine);
  }
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  const PROFILE_SIGNALS = Object.freeze({
    engage: { fields: ["strengths", "function"], terms: ["engage", "iniciación"] },
    followUp: { fields: ["strengths"], terms: ["follow-up", "teamfight"] },
    pick: { fields: ["strengths", "function"], terms: ["pick", "ganks", "roams"] },
    frontline: { fields: ["strengths", "function"], terms: ["frontline", "tanque"] },
    peel: { fields: ["strengths"], terms: ["peel", "escudos", "protección"] },
    disengage: { fields: ["strengths"], terms: ["anti-engage", "anti-dash", "peel"] },
    sustainedDamage: { fields: ["strengths", "function"], terms: ["dps", "daño sostenido", "sustain"] },
    frontToBack: { fields: ["identity", "strengths"], terms: ["front to back", "frontline", "dps"] },
    sideLane: { fields: ["strengths"], terms: ["side lane", "presión lateral", "duelos"] },
    mapControl: { fields: ["strengths"], terms: ["control del mapa", "control de visión", "visión", "objetivos"] },
    earlyPressure: { fields: ["tempo", "strengths"], terms: ["early", "tempo", "presión de línea", "snowball"] },
    scaling: { fields: ["tempo", "strengths", "function"], terms: ["late", "escalado", "hypercarry"] },
    zoneControl: { fields: ["strengths"], terms: ["control de zonas", "control de visión"] },
  });

  const ROLE_ORDER = Object.freeze(["top", "jungle", "mid", "botline", "support"]);
  const MAX_CANDIDATES_PER_PROFILE = 3;

  function normalize(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("es")
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  function findSignals(candidate, signalDefinition) {
    const signals = [];
    const matchedFields = [];
    for (const field of signalDefinition.fields) {
      const value = normalize(candidate[field]);
      const matches = signalDefinition.terms.filter((term) => value.includes(normalize(term)));
      if (matches.length) matchedFields.push(field);
      signals.push(...matches);
    }
    return {
      signals: [...new Set(signals)],
      matchedFields,
    };
  }

  function listAttributes(value) {
    return String(value || "").split("·").map((item) => item.trim()).filter(Boolean);
  }

  function notMapped(status) {
    return { status, profiles: [] };
  }

  function candidateSimilarity(left, right) {
    const leftSignals = new Set(left.signals.map(normalize));
    const rightSignals = new Set(right.signals.map(normalize));
    const shared = [...leftSignals].filter((signal) => rightSignals.has(signal)).length;
    const union = new Set([...leftSignals, ...rightSignals]).size;
    const overlap = union ? shared / union : 0;
    const sameIdentity = normalize(left.candidate.identity) === normalize(right.candidate.identity);
    return (sameIdentity && overlap >= 0.5) || (Math.min(leftSignals.size, rightSignals.size) >= 2 && overlap >= 0.8);
  }

  function candidateOrder(left, right) {
    return right.signals.length - left.signals.length
      || right.matchedFields.length - left.matchedFields.length
      || ROLE_ORDER.indexOf(left.role) - ROLE_ORDER.indexOf(right.role)
      || left.champion.localeCompare(right.champion, "es");
  }

  function selectDiverseCandidates(ranked) {
    const selected = [];
    for (const candidate of ranked.sort(candidateOrder)) {
      if (selected.some((item) => candidateSimilarity(item, candidate))) continue;
      selected.push(candidate);
      if (selected.length === MAX_CANDIDATES_PER_PROFILE) break;
    }
    return selected;
  }

  function mapCandidates(input = {}) {
    if (input.optimizer?.status !== "prioritized") return notMapped("no-priority");
    if (input.recommendations?.status !== "recommended") return notMapped("no-profiles");

    const candidatesByRole = input.candidatesByRole || {};
    const candidates = Object.entries(candidatesByRole).flatMap(([role, roleCandidates]) =>
      (Array.isArray(roleCandidates) ? roleCandidates : []).map((candidate) => ({ ...candidate, role }))
    );
    if (!candidates.length) return notMapped("no-candidates");

    const selectedChampions = new Set([
      ...(Array.isArray(input.selectedChampions) ? input.selectedChampions : []),
      ...(Array.isArray(input.picks) ? input.picks.map((pick) => pick?.champion) : []),
    ].map(normalize).filter(Boolean));

    const profiles = [];
    for (const profile of input.recommendations.profiles || []) {
      const signalDefinition = PROFILE_SIGNALS[profile?.id];
      if (!signalDefinition || !profile.label || !profile.improves) continue;

      const ranked = new Map();
      for (const candidate of candidates) {
        const champion = String(candidate?.champion || "").trim();
        if (!champion || selectedChampions.has(normalize(champion))) continue;
        const { signals, matchedFields } = findSignals(candidate, signalDefinition);
        if (!signals.length) continue;

        const key = normalize(champion);
        const existing = ranked.get(key);
        const item = { champion, role: candidate.role, signals, matchedFields, candidate };
        if (!existing || candidateOrder(item, existing) < 0) ranked.set(key, item);
      }

      const topCandidates = selectDiverseCandidates([...ranked.values()]);
      if (topCandidates.length < 2) continue;

      profiles.push({
        id: profile.id,
        label: profile.label,
        priority: profile.priority,
        reason: profile.reason,
        improves: profile.improves,
        candidates: topCandidates.map((candidate, index) => ({
          champion: candidate.champion,
          priority: index + 1,
          reason: `Sus atributos incluyen ${candidate.signals.join(" y ")}, acorde con el perfil «${profile.label}».`,
          improves: profile.improves,
          identity: String(candidate.candidate.identity || "").trim(),
          strengths: listAttributes(candidate.candidate.strengths),
          weaknesses: listAttributes(candidate.candidate.weaknesses),
          signals: candidate.signals,
          matchedFields: candidate.matchedFields,
        })),
      });
    }

    return profiles.length ? { status: "mapped", profiles } : notMapped("no-matching-candidates");
  }

  return { mapCandidates };
});
