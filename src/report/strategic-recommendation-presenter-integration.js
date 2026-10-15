(function (root, factory) {
  const presenter = typeof module === "object" && module.exports
    ? require("../domain/strategic-recommendation-presenter.js")
    : root.LTAStrategicRecommendationPresenter;
  const integration = factory(presenter);
  if (typeof module === "object" && module.exports) {
    module.exports = integration;
  } else {
    root.LTAStrategicRecommendationPresenterIntegration = Object.freeze(integration);
  }
})(typeof window !== "undefined" ? window : globalThis, function (presenter) {
  "use strict";

  function presentForReport(input = {}) {
    const result = input.presentation || presenter.presentRecommendations(input);
    if (result.status !== "presented") return { status: result.status, section: null };

    const profile = result.primaryProfile;
    return {
      status: "presented",
      section: {
        need: String(input.optimizer.priority.need.label),
        profile: profile.label,
        reason: profile.reason,
        improves: profile.improves,
        candidates: profile.candidates.map((candidate) => ({
          champion: candidate.champion,
          reason: candidate.reason,
          strengths: candidate.strengths.slice(0, 2),
          limitations: candidate.limitations.slice(0, 1),
        })),
      },
    };
  }

  return { presentForReport };
});
