(function (root, factory) {
  const engine = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = engine;
  } else {
    root.LTACompositionOptimizer = Object.freeze(engine);
  }
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  function primaryImprovement(correction) {
    const improvements = Array.isArray(correction?.improvements) ? correction.improvements : [];
    return improvements.find((item) => item?.priority === "principal") || improvements[0] || null;
  }

  function optimizeComposition(input = {}) {
    const diagnosis = input.diagnosis;
    if (diagnosis?.status !== "assessed") {
      return { status: "not-assessable", priority: null };
    }

    const correction = input.correction;
    const improvement = primaryImprovement(correction);
    const need = improvement?.profile;
    const limitingFactor = String(improvement?.limitingFactor || correction?.limitingFactor || "").trim();
    if (correction?.status !== "proposed" || !need?.id || !need?.label || !limitingFactor) {
      return { status: "no-priority", priority: null };
    }

    return {
      status: "prioritized",
      priority: {
        need: { id: String(need.id), label: String(need.label) },
        reason: String(correction.explanation || improvement.explanation || ""),
        reinforces: String(need.label),
        problemAvoided: limitingFactor,
      },
    };
  }

  return { optimizeComposition };
});
