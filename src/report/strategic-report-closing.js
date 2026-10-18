(function (root, factory) {
  const integration = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = integration;
  } else {
    root.LTAStrategicReportClosing = Object.freeze(integration);
  }
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  const CLOSING_REASONS = new Set([
    "no-common-plan",
    "incompatible-plans",
    "key-pick-dependency",
  ]);

  function normalize(value) {
    return String(value || "").trim().toLocaleLowerCase("es");
  }

  function integrateStrategicReportClosing(input = {}) {
    const strategicState = input.strategicState || {};
    const guidance = String(input.guidance || "").trim();
    const reason = String(strategicState.reason || "");

    if (strategicState.status !== "fragile" || !CLOSING_REASONS.has(reason) || !guidance) return null;

    const visibleSections = Array.isArray(input.sections) ? input.sections : [];
    const guidanceText = normalize(guidance);
    const duplicated = visibleSections.some((section) => [
      section?.title,
      section?.answer,
      section?.explanation,
      section?.action,
    ].some((value) => normalize(value).includes(guidanceText)));
    if (duplicated) return null;

    const readableGuidance = `${guidance.charAt(0).toLocaleLowerCase("es")}${guidance.slice(1)}`;
    return {
      status: "presented",
      state: strategicState.status,
      reason,
      guidance,
      text: `Composición frágil: ${readableGuidance}`,
    };
  }

  return { integrateStrategicReportClosing };
});
