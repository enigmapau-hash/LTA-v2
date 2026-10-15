(function (root, factory) {
  const engine = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = engine;
  } else {
    root.LTAStrategicCompositionOptimizer = Object.freeze(engine);
  }
})(typeof window !== "undefined" ? window : globalThis, function () {
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
      const candidateIdentity = String(replacement.candidate.identity || "").trim() || null;
      const identity = primaryIdentity
        ? { status: "preserved", primary: primaryIdentity, proposed: primaryIdentity }
        : { status: "unconfirmed", primary: null, proposed: candidateIdentity };
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
          explanation: primaryIdentity
            ? `Reemplaza la pieza menos alineada con ${recommendation.label.toLocaleLowerCase("es")} por una alternativa priorizada que conserva ${primaryIdentity}.`
            : `Reemplaza la pieza menos alineada con ${recommendation.label.toLocaleLowerCase("es")}; la nueva identidad del equipo debe confirmarse con un análisis completo.`,
        },
      };
    }

    return unavailable("no-supported-replacement", "No hay una alternativa del mismo rol que mejore el plan sin perder respaldo estratégico.");
  }

  return { optimizeStrategicComposition };
});
