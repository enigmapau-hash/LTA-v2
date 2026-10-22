(function (root, factory) {
  const presenter = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = presenter;
  } else {
    root.LTAStrategicRecommendationPresenter = Object.freeze(presenter);
  }
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  const MAX_PRESENTED_CANDIDATES = 4;

  function notPresented(status) {
    return { status, primaryProfile: null, compact: "" };
  }

  function prioritizedProfiles(profiles) {
    return [...(Array.isArray(profiles) ? profiles : [])]
      .filter((profile) => Number.isFinite(profile?.priority))
      .sort((a, b) => a.priority - b.priority);
  }

  function presentRecommendations(input = {}) {
    if (input.optimizer?.status !== "prioritized" || !input.optimizer?.priority?.need?.label) {
      return notPresented("no-priority");
    }
    if (input.recommendations?.status !== "recommended") return notPresented("no-profiles");
    if (input.mappedCandidates?.status !== "mapped") return notPresented("no-mapped-candidates");
    if (input.evaluatedCandidates?.status !== "evaluated") return notPresented("no-evaluated-candidates");

    const recommendedProfiles = prioritizedProfiles(input.recommendations.profiles);
    const mappedById = new Map((input.mappedCandidates.profiles || []).map((profile) => [profile.id, profile]));
    const evaluatedById = new Map((input.evaluatedCandidates.profiles || []).map((profile) => [profile.id, profile]));

    for (const recommendation of recommendedProfiles) {
      const mapped = mappedById.get(recommendation.id);
      const evaluated = evaluatedById.get(recommendation.id);
      if (!mapped || !evaluated || !recommendation.label || !recommendation.improves) continue;

      const mappedChampions = new Set((mapped.candidates || []).map((candidate) => candidate.champion));
      const candidates = prioritizedProfiles(evaluated.candidates)
        .filter((candidate) => mappedChampions.has(candidate.champion) && candidate.champion && candidate.reason)
        .slice(0, MAX_PRESENTED_CANDIDATES)
        .map((candidate, index) => ({
          champion: candidate.champion,
          ...(candidate.role ? { role: candidate.role } : {}),
          priority: index + 1,
          reason: candidate.reason,
          strengths: [...(Array.isArray(candidate.strengths) ? candidate.strengths : [])],
          limitations: [...(Array.isArray(candidate.limitations) ? candidate.limitations : [])],
        }));
      if (!candidates.length) continue;

      const profile = {
        id: recommendation.id,
        label: recommendation.label,
        priority: recommendation.priority,
        reason: recommendation.reason,
        improves: recommendation.improves,
        candidates,
      };
      const candidateNames = candidates.map((candidate) => candidate.champion).join(", ");
      const needLabel = input.optimizer.priority.need.label.toLocaleLowerCase("es");
      const compact = `Para ${needLabel}: ${profile.label} (${candidateNames}). Refuerza ${profile.improves}.`;
      return { status: "presented", primaryProfile: profile, compact };
    }

    return notPresented("no-presentable-profile");
  }

  return { presentRecommendations };
});
