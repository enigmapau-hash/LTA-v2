(function (root, factory) {
  const integration = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = integration;
  } else {
    root.LTAStrategicReportBanIntegration = Object.freeze(integration);
  }
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  const MAX_VISIBLE_BANS = 3;
  const SEVERITIES = new Set(["alta", "media", "baja"]);

  function integrateStrategicReportBans(input = {}) {
    const presentation = input.banPresentation;
    if (presentation?.status !== "presented" || !Array.isArray(presentation.bans)) return null;

    const bans = presentation.bans
      .filter((ban) => ban
        && String(ban.champion || "").trim()
        && String(ban.threat || "").trim()
        && SEVERITIES.has(ban.severity)
        && String(ban.reason || "").trim()
        && String(ban.expectedImpact || "").trim())
      .slice(0, MAX_VISIBLE_BANS)
      .map((ban) => ({
        priority: ban.priority,
        champion: String(ban.champion).trim(),
        threat: String(ban.threat).trim(),
        severity: ban.severity,
        reason: String(ban.reason).trim(),
        expectedImpact: String(ban.expectedImpact).trim(),
      }));

    return bans.length ? { status: "integrated", bans } : null;
  }

  return { integrateStrategicReportBans };
});
