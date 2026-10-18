(function (root, factory) {
  const presenter = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = presenter;
  } else {
    root.LTABanRecommendationPresenter = Object.freeze(presenter);
  }
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  const SEVERITY_ORDER = Object.freeze({ alta: 1, media: 2, baja: 3 });
  const MAX_PRESENTED_BANS = 3;

  function unavailable(status) {
    return { status, bans: [] };
  }

  function presentBanRecommendations(input = {}) {
    const prioritization = input.banPrioritizer;
    if (prioritization?.status === "pending") return unavailable("pending");
    if (prioritization?.status !== "prioritized" || !Array.isArray(prioritization.bans)) {
      return unavailable("not-assessable");
    }

    const unique = new Map();
    for (const ban of prioritization.bans) {
      const champion = String(ban?.champion || "").trim();
      const severity = ban?.severity;
      const reason = String(ban?.explanation || "").trim();
      const impact = String(ban?.expectedImpact || "").trim();
      const threat = String(ban?.threatStyle || "").trim();
      if (!champion || !SEVERITY_ORDER[severity] || !reason || !impact || !threat) continue;
      const key = champion.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es");
      if (unique.has(key)) continue;
      unique.set(key, {
        sourcePriority: Number.isFinite(ban.priority) ? ban.priority : Number.MAX_SAFE_INTEGER,
        champion,
        threat,
        severity,
        reason,
        expectedImpact: impact,
      });
    }

    const bans = [...unique.values()]
      .sort((left, right) => SEVERITY_ORDER[left.severity] - SEVERITY_ORDER[right.severity]
        || left.sourcePriority - right.sourcePriority
        || left.champion.localeCompare(right.champion, "es"))
      .slice(0, MAX_PRESENTED_BANS)
      .map(({ champion, threat, severity, reason, expectedImpact }, index) => ({
        priority: index + 1,
        champion,
        threat,
        severity,
        reason,
        expectedImpact,
      }));

    return bans.length ? { status: "presented", bans } : unavailable("no-bans");
  }

  return { presentBanRecommendations };
});
