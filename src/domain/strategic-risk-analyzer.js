(function (root, factory) {
  const analyzer = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = analyzer;
  } else {
    root.LTAStrategicRiskAnalyzer = Object.freeze(analyzer);
  }
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  const ROLE_ORDER = Object.freeze(["top", "jungle", "mid", "botline", "support"]);
  const SEVERITY_ORDER = Object.freeze({ alta: 1, media: 2, baja: 3 });

  function unavailable(status) {
    return { status, risks: [] };
  }

  function normalize(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("es")
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  function validCompleteComposition(composition) {
    if (composition?.status !== "complete" || !Array.isArray(composition.picks)
      || composition.picks.length !== ROLE_ORDER.length) return false;
    const roles = composition.picks.map((pick) => normalize(pick?.role));
    const champions = composition.picks.map((pick) => normalize(pick?.champion));
    return roles.every(Boolean)
      && ROLE_ORDER.every((role) => roles.includes(role))
      && new Set(roles).size === ROLE_ORDER.length
      && champions.every(Boolean)
      && new Set(champions).size === ROLE_ORDER.length;
  }

  function hasEvidence(fit) {
    return Boolean((Array.isArray(fit?.signals) && fit.signals.length)
      || (Array.isArray(fit?.matchedFields) && fit.matchedFields.length));
  }

  function assessStrategicRisks(input = {}) {
    if (input.optimizer?.status !== "prioritized") return unavailable("no-priority");
    if (input.recommendations?.status !== "recommended"
      || input.mappedCandidates?.status !== "mapped"
      || input.evaluatedCandidates?.status !== "evaluated"
      || input.presentation?.status !== "presented"
      || input.integration?.status !== "presented"
      || input.polished?.status !== "polished") return unavailable("incomplete-recommendation-chain");

    const composition = input.mappedCandidates.composition;
    if (composition?.status === "incomplete") return unavailable("pending");
    if (!validCompleteComposition(composition)) return unavailable("not-assessable");

    const profile = [...(input.recommendations.profiles || [])]
      .filter((item) => item?.id && Number.isFinite(item.priority))
      .sort((left, right) => left.priority - right.priority)[0];
    if (!profile) return unavailable("no-priority-profile");
    const evaluatedProfile = (input.evaluatedCandidates.profiles || []).find((item) => item.id === profile.id);
    if (!evaluatedProfile) return unavailable("profile-not-evaluated");

    const supportedPicks = composition.picks.filter((pick) => hasEvidence(pick.fitByProfile?.[profile.id]));
    const planAspect = String(profile.improves || input.optimizer.priority.reinforces || profile.label).trim();
    const risks = [];

    if (supportedPicks.length === 0) {
      risks.push({
        type: "priority-uncovered",
        severity: "alta",
        threatens: planAspect,
        explanation: `Ningún campeón actual aporta señales para ${profile.label}; la prioridad de mejora queda sin apoyo dentro del equipo.`,
      });
    } else if (supportedPicks.length === 1) {
      const soleSupport = supportedPicks[0];
      risks.push({
        type: "single-point-dependency",
        severity: "media",
        threatens: planAspect,
        explanation: `${soleSupport.champion} es la única pieza con señales para ${profile.label}; si pierde capacidad de actuar, el plan pierde su principal apoyo en ${planAspect}.`,
      });
    }

    const recomposedIdentity = input.teamRecomposition?.proposal?.identity;
    if (input.teamRecomposition?.status === "recomposed" && recomposedIdentity?.status === "unconfirmed") {
      risks.push({
        type: "identity-unconfirmed",
        severity: "alta",
        threatens: "la coordinación del plan común",
        explanation: "Las señales disponibles no confirman una identidad común; el equipo puede carecer de una prioridad compartida para ejecutar su plan.",
      });
    }

    risks.sort((left, right) => SEVERITY_ORDER[left.severity] - SEVERITY_ORDER[right.severity]
      || left.type.localeCompare(right.type, "es"));

    return {
      status: "assessed",
      risks: risks.map((risk, index) => ({ priority: index + 1, ...risk })),
    };
  }

  return { assessStrategicRisks };
});
