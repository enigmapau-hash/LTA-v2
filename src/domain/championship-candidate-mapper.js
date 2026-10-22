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
    followUp: { fields: ["strengths"], terms: ["follow-up", "teamfight", "resets"] },
    pick: { fields: ["strengths", "function"], terms: ["pick", "ganks", "roams"] },
    frontline: { fields: ["strengths", "function"], terms: ["frontline", "tanque"] },
    peel: { fields: ["strengths"], terms: ["peel", "escudos", "protección"] },
    disengage: { fields: ["strengths"], terms: ["anti-engage", "anti-dash", "peel"] },
    sustainedDamage: { fields: ["strengths", "function"], terms: ["dps", "daño sostenido", "sustain"] },
    frontToBack: { fields: ["identity", "strengths"], terms: ["front to back", "frontline", "dps"] },
    sideLane: { fields: ["strengths"], terms: ["side lane", "presión lateral", "duelos"] },
    mapControl: { fields: ["strengths"], terms: ["control del mapa", "control de visión", "visión", "objetivos"] },
    earlyPressure: { fields: ["tempo", "strengths"], terms: ["early", "tempo", "presión de línea", "dominio de línea", "invasión", "snowball"] },
    scaling: { fields: ["tempo", "strengths", "function"], terms: ["late", "escalado", "hypercarry"] },
    zoneControl: { fields: ["strengths"], terms: ["control de zonas", "control de visión", "asedio"] },
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
    return right.contextFit - left.contextFit
      || right.signals.length - left.signals.length
      || right.matchedFields.length - left.matchedFields.length
      || ROLE_ORDER.indexOf(left.role) - ROLE_ORDER.indexOf(right.role)
      || left.champion.localeCompare(right.champion, "es");
  }

  function normalizeIdentity(value) {
    return normalize(value).replace(/\s+/g, " ").trim();
  }

  function identityMatches(candidateIdentity, targetIdentity) {
    const candidate = normalizeIdentity(candidateIdentity);
    const target = normalizeIdentity(targetIdentity);
    if (!candidate || !target) return false;
    return candidate === target || candidate.split(" · ").includes(target) || candidate.includes(target);
  }

  function contextFit(candidate, diagnosis) {
    const primary = diagnosis?.plan?.primaryIdentity;
    const secondary = diagnosis?.plan?.secondaryIdentity;
    const winCondition = diagnosis?.winCondition?.primary?.identity;
    const supportsPrimary = identityMatches(candidate.identity, primary);
    const supportsSecondary = identityMatches(candidate.identity, secondary);
    const supportsWinCondition = diagnosis?.winConditionCoherence?.status !== "contradictory"
      && identityMatches(candidate.identity, winCondition);
    const opposingIdentities = (diagnosis?.contradictions?.identities || [])
      .filter((identity) => !identityMatches(identity, primary));
    const contradictsPlan = diagnosis?.contradictions?.status === "contradictory"
      && opposingIdentities.some((identity) => identityMatches(candidate.identity, identity));

    // Give composition evidence precedence over generic catalog signal counts.
    // The final tie-breakers still prefer stronger profile evidence and remain stable.
    return (supportsPrimary ? 4 : 0)
      + (supportsWinCondition ? 2 : 0)
      + (supportsSecondary ? 1 : 0)
      - (contradictsPlan ? 8 : 0);
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

  function presentCandidate(candidate, profile, priority) {
    return {
      champion: candidate.champion,
      role: candidate.role,
      function: String(candidate.candidate.function || "").trim(),
      tempo: String(candidate.candidate.tempo || "").trim(),
      priority,
      reason: `Sus atributos incluyen ${candidate.signals.join(" y ")}, acorde con el perfil «${profile.label}».`,
      improves: profile.improves,
      identity: String(candidate.candidate.identity || "").trim(),
      strengths: listAttributes(candidate.candidate.strengths),
      weaknesses: listAttributes(candidate.candidate.weaknesses),
      signals: candidate.signals,
      matchedFields: candidate.matchedFields,
    };
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
        const item = {
          champion,
          role: candidate.role,
          signals,
          matchedFields,
          contextFit: contextFit(candidate, input.diagnosis),
          candidate,
        };
        if (!existing || candidateOrder(item, existing) < 0) ranked.set(key, item);
      }

      const topCandidates = selectDiverseCandidates([...ranked.values()]);
      if (topCandidates.length < 2) continue;
      const alternativesByRole = Object.fromEntries(ROLE_ORDER.map((role) => [
        role,
        selectDiverseCandidates([...ranked.values()].filter((candidate) => candidate.role === role))
          .map((candidate, index) => presentCandidate(candidate, profile, index + 1)),
      ]));

      profiles.push({
        id: profile.id,
        label: profile.label,
        priority: profile.priority,
        reason: profile.reason,
        improves: profile.improves,
        candidates: topCandidates.map((candidate, index) => presentCandidate(candidate, profile, index + 1)),
        alternativesByRole,
      });
    }

    const currentPicks = Array.isArray(input.currentPicks) ? input.currentPicks : null;
    const composition = currentPicks ? {
      status: currentPicks.length === ROLE_ORDER.length
        && new Set(currentPicks.map((pick) => normalize(pick?.role))).size === ROLE_ORDER.length
        && currentPicks.every((pick) => String(pick?.champion || "").trim())
        ? "complete"
        : "incomplete",
      picks: currentPicks.map((pick) => {
        const fitByProfile = {};
        for (const profile of input.recommendations.profiles || []) {
          const signalDefinition = PROFILE_SIGNALS[profile?.id];
          if (!signalDefinition) continue;
          fitByProfile[profile.id] = findSignals(pick, signalDefinition);
        }
        return {
          role: String(pick?.role || "").trim(),
          champion: String(pick?.champion || "").trim(),
          identity: String(pick?.identity || "").trim(),
          function: String(pick?.function || "").trim(),
          tempo: String(pick?.tempo || "").trim(),
          strengths: String(pick?.strengths || "").trim(),
          weaknesses: String(pick?.weaknesses || "").trim(),
          fitByProfile,
        };
      }),
    } : null;

    return profiles.length
      ? { status: "mapped", profiles, ...(composition ? { composition } : {}) }
      : notMapped("no-matching-candidates");
  }

  function auditProfileKnowledge(candidatesByRole = {}) {
    const candidates = Object.entries(candidatesByRole).flatMap(([role, items]) =>
      (Array.isArray(items) ? items : []).map((candidate) => ({ ...candidate, role }))
    );
    const profiles = Object.entries(PROFILE_SIGNALS).map(([id, signalDefinition]) => {
      const matches = candidates.filter((candidate) => findSignals(candidate, signalDefinition).signals.length > 0);
      return {
        id,
        candidateCount: matches.length,
        roleCount: new Set(matches.map((candidate) => candidate.role)).size,
        roles: [...new Set(matches.map((candidate) => candidate.role))].sort(),
      };
    });
    const coveredCandidates = candidates.filter((candidate) => Object.values(PROFILE_SIGNALS).some((signalDefinition) =>
      findSignals(candidate, signalDefinition).signals.length > 0
    )).length;
    const profileRolePairs = profiles.reduce((sum, profile) => sum + profile.roleCount, 0);

    return {
      candidateCount: candidates.length,
      coveredCandidateCount: coveredCandidates,
      candidateCoverage: candidates.length ? coveredCandidates / candidates.length : 0,
      profileCount: profiles.filter((item) => item.candidateCount > 0).length,
      profileCountTotal: profiles.length,
      profileRolePairs,
      profileRolePairsTotal: profiles.length * Object.keys(candidatesByRole).length,
      profiles,
    };
  }

  return { mapCandidates, auditProfileKnowledge };
});
