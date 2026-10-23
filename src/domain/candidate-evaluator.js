(function (root, factory) {
  const diagnosticEngine = typeof module === "object" && module.exports
    ? require("./diagnostic-engine.js")
    : root.LTADiagnosticEngine;
  const engine = factory(diagnosticEngine);
  if (typeof module === "object" && module.exports) {
    module.exports = engine;
  } else {
    root.LTACandidateEvaluator = Object.freeze(engine);
  }
})(typeof window !== "undefined" ? window : globalThis, function (diagnosticEngine) {
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

  const REQUIREMENT_LABELS = Object.freeze({
    frontline: "frontline", peel: "protección para los carries",
    "sustained-damage": "daño sostenido", engage: "iniciación",
    pick: "capacidad de pick", "side-lane": "presión lateral",
    "early-pressure": "presión temprana",
  });

  function fieldText(value) {
    return (Array.isArray(value) ? value.join(" · ") : String(value || "")).trim();
  }

  // Compare a proposed SAME-ROLE replacement against the actual five picks.
  // Profile labels, role frequencies and generic strengths do not establish
  // net improvement; absent attributes must not be interpreted as evidence.
  function validateReplacement(candidate, diagnosis, composition) {
    const originalPlan = String(diagnosis?.plan?.primaryIdentity || "").trim();
    const missing = Array.isArray(diagnosis?.execution?.missing) ? diagnosis.execution.missing : [];
    const picks = composition?.picks;
    if (!originalPlan || !missing.length || composition?.status !== "complete"
      || !Array.isArray(picks) || picks.length !== 5
      || !candidate?.role || typeof diagnosticEngine?.diagnoseComposition !== "function") return null;
    if (new Set(picks.map(item => normalize(item?.role))).size !== 5) return null;
    if (!picks.some(item => normalize(item.role) === normalize(candidate.role))) return null;
    const nextPicks = picks.map(pick => normalize(pick.role) === normalize(candidate.role)
      ? {
          role: pick.role, champion: candidate.champion,
          identity: fieldText(candidate.identity), function: fieldText(candidate.function),
          tempo: fieldText(candidate.tempo), strengths: fieldText(candidate.strengths),
          weaknesses: fieldText(candidate.weaknesses),
        }
      : pick);
    if (!nextPicks.every(pick => pick.champion && pick.identity && pick.function
      && pick.tempo && pick.strengths && pick.weaknesses)) return null;
    const revised = diagnosticEngine.diagnoseComposition(nextPicks);
    if (revised.status !== "assessed") return null;
    const oldIds = new Set(missing.map(item=>item.id).filter(Boolean));
    const newIds = new Set((revised.execution?.missing || []).map(item=>item.id).filter(Boolean));
    const resolved = [...oldIds].filter(id => !newIds.has(id));
    const introduced = [...newIds].filter(id => !oldIds.has(id));
    const preserved = revised.plan?.clear
      && normalize(revised.plan.primaryIdentity) === normalize(originalPlan);
    const status = !preserved ? "plan-changed"
      : !resolved.length ? "does-not-fix"
        : introduced.length ? "new-gap"
          : "validated";
    return {status, resolved, introduced, originalPlan,
      revisedPlan: revised.plan?.primaryIdentity || null};
  }

  function replacementLimitation(check) {
    if (check?.status === "plan-changed")
      return "La sustitución no conserva el plan " + check.originalPlan + " según el nuevo diagnóstico.";
    if (check?.status === "new-gap")
      return "La sustitución cubre una carencia, pero introduce otra: "
        + check.introduced.map(id => REQUIREMENT_LABELS[id] || id).join(", ") + ".";
    if (check?.status === "does-not-fix")
      return "La sustitución no acredita resolver la carencia prioritaria del equipo.";
    return null;
  }

  function candidateAssessment(candidate, profile, diagnosis, composition) {
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

    const replacementCheck = validateReplacement(candidate, diagnosis, composition);
    const limitations = [...candidate.weaknesses];
    const replacementWarning = replacementLimitation(replacementCheck);
    if (replacementWarning) limitations.unshift(replacementWarning);
    if (contradictsPlan) {
      limitations.unshift("Puede acentuar la contradicción entre " + primaryIdentity + " y " + opposingIdentity + ".");
    }
    if (diagnosis?.coherence?.status === "incoherent") {
      limitations.push("El plan global carece de una identidad principal clara.");
    }

    return {
      candidate,
      replacementCheck,
      replacementPriority: ({ validated: 4, "new-gap": 2, "does-not-fix": 1, "plan-changed": 0 })[replacementCheck?.status] ?? null,
      viabilityPriority: ({ principal: 5, compatible: 4, habitual: 3, situacional: 2, "sin-verificar": 1 })[candidate.viabilityStatus] || 1,
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

  function assessCandidates(candidates, profile, diagnosis, composition) {
    return (Array.isArray(candidates) ? candidates : [])
      .map((candidate) => candidateAssessment(candidate, profile, diagnosis, composition))
      .sort((a, b) => Number(a.contradictsPlan) - Number(b.contradictsPlan)
        // Compare verified net improvement first when BOTH replacements can
        // be assessed; otherwise preserve the existing editorial role order.
        || (a.replacementPriority !== null && b.replacementPriority !== null
          ? b.replacementPriority - a.replacementPriority : 0)
        || b.viabilityPriority - a.viabilityPriority
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
      ...(item.candidate.viabilityStatus ? { viabilityStatus: item.candidate.viabilityStatus } : {}),
      ...(item.candidate.viabilityPatch ? { viabilityPatch: item.candidate.viabilityPatch } : {}),
      ...(item.candidate.otherPrincipalRoles?.length ? { otherPrincipalRoles: item.candidate.otherPrincipalRoles } : {}),
      contradictsPlan: item.contradictsPlan,
      strategicFit: item.supportsPrimary
        ? "primary-identity"
        : item.supportsWinCondition
          ? "win-condition"
          : item.supportsSecondary
            ? "secondary-identity"
            : "unconfirmed",
      reason: item.reason,
      ...(item.replacementCheck ? { replacementCheck: item.replacementCheck } : {}),
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

      const assessed = assessCandidates(mappedProfile.candidates, mappedProfile, input.diagnosis, input.mappedCandidates.composition);
      const alternativesByRole = Object.fromEntries(Object.entries(mappedProfile.alternativesByRole || {}).map(([role, candidates]) => {
        const evaluated = assessCandidates(candidates, mappedProfile, input.diagnosis, input.mappedCandidates.composition);
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
