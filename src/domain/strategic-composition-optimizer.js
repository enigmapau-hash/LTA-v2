(function (root, factory) {
  const diagnosticEngine = typeof module === "object" && module.exports
    ? require("./diagnostic-engine.js")
    : root.LTADiagnosticEngine;
  const engine = factory(diagnosticEngine);
  if (typeof module === "object" && module.exports) {
    module.exports = engine;
  } else {
    root.LTAStrategicCompositionOptimizer = Object.freeze(engine);
  }
})(typeof window !== "undefined" ? window : globalThis, function (diagnosticEngine) {
  "use strict";

  const ROLE_ORDER = Object.freeze(["top", "jungle", "mid", "botline", "support"]);

  function normalize(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("es")
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  function fieldText(value) {
    return (Array.isArray(value) ? value.join(" · ") : String(value || "")).trim();
  }

  function verifiesPreservation(currentPicks, replacement, replacedRole, originalIdentity) {
    if (!originalIdentity || typeof diagnosticEngine?.diagnoseComposition !== "function") return false;

    const nextPicks = currentPicks.map((pick) => {
      const source = normalize(pick.role) === normalize(replacedRole) ? replacement : pick;
      return {
        role: ROLE_ORDER.find((role) => normalize(role) === normalize(pick.role)) || pick.role,
        champion: String(source.champion || "").trim(),
        identity: fieldText(source.identity),
        function: fieldText(source.function),
        tempo: fieldText(source.tempo),
        strengths: fieldText(source.strengths),
        weaknesses: fieldText(source.weaknesses),
      };
    });

    // All strategic attributes are needed before trusting a new team diagnosis.
    // Missing candidate data must never be interpreted as evidence of preservation.
    if (!nextPicks.every((pick) => pick.champion && pick.identity && pick.function
      && pick.tempo && pick.strengths && pick.weaknesses)) return false;

    const revised = diagnosticEngine.diagnoseComposition(nextPicks);
    return revised.status === "assessed" && revised.plan?.clear
      && normalize(revised.plan.primaryIdentity) === normalize(originalIdentity);
  }

  function unavailable(status, reason = "") {
    return { status, reason, proposal: null };
  }

  function compareFit(left, right) {
    const leftFit = left.fitByProfile || {};
    const rightFit = right.fitByProfile || {};
    const leftStrength = (leftFit.signals?.length || 0) * 2 + (leftFit.matchedFields?.length || 0);
    const rightStrength = (rightFit.signals?.length || 0) * 2 + (rightFit.matchedFields?.length || 0);
    return leftStrength - rightStrength
      || ROLE_ORDER.indexOf(left.role) - ROLE_ORDER.indexOf(right.role)
      || left.champion.localeCompare(right.champion, "es");
  }

  function weakestPick(picks, profileId) {
    return picks
      .filter((pick) => pick?.champion && pick?.role)
      .map((pick) => ({
        ...pick,
        fitByProfile: pick.fitByProfile?.[profileId] || { signals: [], matchedFields: [] },
      }))
      .sort(compareFit)[0] || null;
  }

  function profileOrder(profiles) {
    return [...(Array.isArray(profiles) ? profiles : [])]
      .filter((profile) => Number.isFinite(profile?.priority))
      .sort((left, right) => left.priority - right.priority);
  }

  function optimizeStrategicComposition(input = {}) {
    if (input.optimizer?.status !== "prioritized") return unavailable("no-priority");
    if (input.recommendations?.status !== "recommended"
      || input.mappedCandidates?.status !== "mapped"
      || input.evaluatedCandidates?.status !== "evaluated"
      || input.presentation?.status !== "presented"
      || input.integration?.status !== "presented"
      || input.polished?.status !== "polished") {
      return unavailable("incomplete-recommendation-chain");
    }

    const composition = input.mappedCandidates.composition;
    if (composition?.status !== "complete" || !Array.isArray(composition.picks)) {
      return unavailable("pending", "La optimización completa requiere cinco picks válidos.");
    }
    const currentPicks = composition.picks;
    if (currentPicks.length !== ROLE_ORDER.length
      || new Set(currentPicks.map((pick) => normalize(pick.role))).size !== ROLE_ORDER.length
      || new Set(currentPicks.map((pick) => normalize(pick.champion))).size !== ROLE_ORDER.length) {
      return unavailable("pending", "La optimización completa requiere cinco picks válidos.");
    }

    const mappedById = new Map((input.mappedCandidates.profiles || []).map((profile) => [profile.id, profile]));
    const evaluatedById = new Map((input.evaluatedCandidates.profiles || []).map((profile) => [profile.id, profile]));
    const recommendationById = new Map((input.recommendations.profiles || []).map((profile) => [profile.id, profile]));
    const selectedNames = new Set(currentPicks.map((pick) => normalize(pick.champion)));
    const primaryIdentity = String(input.recommendations.plan?.primaryIdentity || "").trim();

    for (const profile of profileOrder(input.recommendations.profiles)) {
      const mapped = mappedById.get(profile.id);
      const evaluated = evaluatedById.get(profile.id);
      const recommendation = recommendationById.get(profile.id);
      if (!mapped || !evaluated || !recommendation) continue;

      const weakest = weakestPick(currentPicks, profile.id);
      if (!weakest) continue;
      const roleKey = ROLE_ORDER.find((role) => normalize(role) === normalize(weakest.role));
      if (!roleKey) continue;
      const evaluatedCandidates = evaluated.alternativesByRole?.[roleKey] || [];
      const mappedCandidates = mapped.alternativesByRole?.[roleKey] || [];
      const evaluatedByChampion = new Map(evaluatedCandidates
        .map((candidate) => [normalize(candidate.champion), candidate]));
      const replacements = mappedCandidates
        .filter((candidate) => !selectedNames.has(normalize(candidate.champion)))
        .map((candidate) => ({ candidate, evaluation: evaluatedByChampion.get(normalize(candidate.champion)) }))
        .filter((item) => item.evaluation?.priority && !item.evaluation.contradictsPlan)
        .sort((left, right) => left.evaluation.priority - right.evaluation.priority);
      const replacement = primaryIdentity
        ? replacements.find((item) => item.evaluation.strategicFit === "primary-identity")
        : replacements[0];
      if (!replacement) continue;

      const nextPicks = currentPicks.map((pick) => normalize(pick.role) === normalize(weakest.role)
        ? { role: pick.role, champion: replacement.candidate.champion }
        : { role: pick.role, champion: pick.champion });
      // The evaluator's strategicFit is a candidate-level assessment, not proof
      // that a five-pick team retains the same strategic identity.
      const preserved = verifiesPreservation(currentPicks, replacement.candidate, weakest.role, primaryIdentity);
      const identity = preserved
        ? { status: "preserved", primary: primaryIdentity, proposed: primaryIdentity }
        : { status: "unconfirmed", primary: null, proposed: null };
      const correctedLimitation = String(input.optimizer.priority.problemAvoided || "").trim();

      return {
        status: "optimized",
        proposal: {
          identity,
          profile: { id: recommendation.id, label: recommendation.label },
          change: {
            role: weakest.role,
            from: weakest.champion,
            to: replacement.candidate.champion,
          },
          composition: nextPicks,
          improvement: String(recommendation.improves || input.optimizer.priority.reinforces || "").trim(),
          limitationCorrected: correctedLimitation,
          explanation: preserved
            ? `Reemplaza la pieza menos alineada con ${recommendation.label.toLocaleLowerCase("es")} por una alternativa priorizada; el diagnóstico del nuevo equipo confirma ${primaryIdentity}.`
            : primaryIdentity
              ? `Reemplaza la pieza menos alineada con ${recommendation.label.toLocaleLowerCase("es")}; no se puede confirmar que el equipo propuesto mantenga ${primaryIdentity}.`
              : `Reemplaza la pieza menos alineada con ${recommendation.label.toLocaleLowerCase("es")}; la identidad del equipo propuesto no está confirmada.`,
        },
      };
    }

    return unavailable("no-supported-replacement", "No hay una alternativa del mismo rol que mejore el plan sin perder respaldo estratégico.");
  }

  return { optimizeStrategicComposition };
});
