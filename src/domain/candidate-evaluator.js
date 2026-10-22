(function (root, factory) {
  const engine = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = engine;
  } else {
    root.LTACandidateEvaluator = Object.freeze(engine);
  }
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  const IDENTITY_FAMILIES = Object.freeze({
    "front to back": ["Front to Back"],
    engage: ["Dive", "Teamfight"],
  });

  function normalize(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("es")
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  function identitiesFor(value) {
    const key = normalize(value);
    return IDENTITY_FAMILIES[key] || [String(value || "").trim()].filter(Boolean);
  }

  function identityRelation(candidateIdentity, targetIdentity) {
    const target = normalize(targetIdentity);
    if (!target) return false;
    return identitiesFor(candidateIdentity).some((identity) => normalize(identity) === target);
  }

  function fitsAny(candidateIdentity, identities) {
    return (Array.isArray(identities) ? identities : [])
      .some((identity) => identityRelation(candidateIdentity, identity));
  }

  function candidateAssessment(candidate, profile, diagnosis) {
    const primaryIdentity = diagnosis?.plan?.primaryIdentity;
    const secondaryIdentity = diagnosis?.plan?.secondaryIdentity;
    const winCondition = diagnosis?.winCondition?.primary;
    const opposingIdentities = (diagnosis?.contradictions?.identities || [])
      .filter((identity) => normalize(identity) !== normalize(primaryIdentity));
    const contradictsPlan = diagnosis?.contradictions?.status === "contradictory"
      && fitsAny(candidate.identity, opposingIdentities);
    const winConditionConflictsWithPlan = diagnosis?.winConditionCoherence?.status === "contradictory";
    const supportsWinCondition = Boolean(winCondition)
      && identityRelation(candidate.identity, winCondition.identity)
      && (!winConditionConflictsWithPlan || identityRelation(candidate.identity, primaryIdentity));
    const supportsPrimary = identityRelation(candidate.identity, primaryIdentity);
    const supportsSecondary = identityRelation(candidate.identity, secondaryIdentity);
    const opposingIdentity = opposingIdentities.find((identity) => identityRelation(candidate.identity, identity));

    const contribution = [...(Array.isArray(candidate.signals) ? candidate.signals : [])]
      .map((signal) => String(signal || "").trim())
      .filter(Boolean)
      .slice(0, 2)
      .join(" y ");
    const improvement = String(candidate.improves || profile.improves || "").trim().replace(/[.]$/, "");
    const reason = contradictsPlan
      ? "Puede reforzar " + opposingIdentity + ", en conflicto con " + primaryIdentity + "."
      : supportsWinCondition
        ? "Apoya " + winCondition.identity + " y refuerza " + improvement + "."
        : supportsPrimary
          ? "Refuerza " + primaryIdentity + " al mejorar " + improvement + "."
          : supportsSecondary
            ? "Complementa " + secondaryIdentity + " y mejora " + improvement + " sin apartar " + primaryIdentity + "."
            : (contribution ? "Aporta " + contribution : "Sus atributos encajan con " + profile.label.toLocaleLowerCase("es"))
              + " y ayuda a " + improvement + (primaryIdentity ? " dentro del plan " + primaryIdentity : "") + ".";

    const limitations = [...candidate.weaknesses];
    if (contradictsPlan) {
      limitations.unshift("Puede acentuar la contradicción entre " + primaryIdentity + " y " + opposingIdentity + ".");
    }
    if (diagnosis?.coherence?.status === "incoherent") {
      limitations.push("El plan global carece de una identidad principal clara.");
    }

    return {
      candidate,
      contradictsPlan,
      supportsWinCondition,
      supportsPrimary,
      supportsSecondary,
      signalCount: Array.isArray(candidate.signals) ? candidate.signals.length : 0,
      fieldCoverage: Array.isArray(candidate.matchedFields) ? candidate.matchedFields.length : 0,
      reason,
      limitations: [...new Set(limitations)],
    };
  }

  function notEvaluated(status) {
    return { status, profiles: [] };
  }

  function assessCandidates(candidates, profile, diagnosis) {
    return (Array.isArray(candidates) ? candidates : [])
      .map((candidate) => candidateAssessment(candidate, profile, diagnosis))
      .sort((a, b) => Number(a.contradictsPlan) - Number(b.contradictsPlan)
        || Number(b.supportsWinCondition) - Number(a.supportsWinCondition)
        || Number(b.supportsPrimary) - Number(a.supportsPrimary)
        || Number(b.supportsSecondary) - Number(a.supportsSecondary)
        || b.fieldCoverage - a.fieldCoverage
        || b.signalCount - a.signalCount
        || a.candidate.priority - b.candidate.priority);
  }

  function presentAssessment(item, index) {
    return {
      champion: item.candidate.champion,
      ...(item.candidate.role ? { role: item.candidate.role } : {}),
      priority: index + 1,
      contradictsPlan: item.contradictsPlan,
      strategicFit: item.supportsPrimary
        ? "primary-identity"
        : item.supportsWinCondition
          ? "win-condition"
          : item.supportsSecondary
            ? "secondary-identity"
            : "unconfirmed",
      reason: item.reason,
      strengths: [...item.candidate.strengths],
      limitations: item.limitations,
    };
  }

  function evaluateCandidates(input = {}) {
    if (input.optimizer?.status !== "prioritized") return notEvaluated("no-priority");
    if (input.recommendations?.status !== "recommended") return notEvaluated("no-profiles");
    if (input.mappedCandidates?.status !== "mapped") return notEvaluated("no-candidates");
    if (input.diagnosis?.status !== "assessed") return notEvaluated("no-diagnosis");

    const mappedById = new Map((input.mappedCandidates.profiles || []).map((profile) => [profile.id, profile]));
    const profiles = [];
    for (const recommendedProfile of input.recommendations.profiles || []) {
      const mappedProfile = mappedById.get(recommendedProfile.id);
      if (!mappedProfile) continue;

      const assessed = assessCandidates(mappedProfile.candidates, mappedProfile, input.diagnosis);
      const alternativesByRole = Object.fromEntries(Object.entries(mappedProfile.alternativesByRole || {}).map(([role, candidates]) => {
        const evaluated = assessCandidates(candidates, mappedProfile, input.diagnosis);
        return [role, evaluated.map(presentAssessment)];
      }));

      if (!assessed.length) continue;
      profiles.push({
        id: mappedProfile.id,
        label: mappedProfile.label,
        priority: mappedProfile.priority,
        reason: mappedProfile.reason,
        improves: mappedProfile.improves,
        candidates: assessed.map(presentAssessment),
        alternativesByRole,
      });
    }

    return profiles.length ? { status: "evaluated", profiles } : notEvaluated("no-evaluable-candidates");
  }

  return { evaluateCandidates };
});
