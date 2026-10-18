(function (root, factory) {
  const advisor = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = advisor;
  } else {
    root.LTAStrategicCounterplayAdvisor = Object.freeze(advisor);
  }
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  const SEVERITY_ORDER = Object.freeze({ alta: 1, media: 2, baja: 3 });
  const COUNTERPLAY_BY_RISK = Object.freeze({
    "priority-uncovered": {
      type: "objective-contest",
      style: "Disputa de objetivos",
      explanation: (risk) => `La falta de apoyo para ${risk.threatens} queda expuesta cuando el rival fuerza una disputa de objetivos.`,
      protection: "Evita peleas que dependan de esa función y disputa objetivos con visión y una respuesta coordinada.",
    },
    "single-point-dependency": {
      type: "focused-dive",
      style: "Dive o pick sobre la pieza clave",
      explanation: (risk) => `Si el rival alcanza la única pieza que sostiene ${risk.threatens}, puede cortar ese apoyo de una vez.`,
      protection: "Mantén visión y herramientas de protección junto a esa pieza; evita dejarla aislada antes de actuar.",
    },
    "identity-unconfirmed": {
      type: "forced-engage",
      style: "Iniciación coordinada y pelea forzada",
      explanation: () => "Sin una identidad común confirmada, una iniciación rival puede forzar respuestas distintas y romper la ejecución del plan.",
      protection: "Acordad el objetivo antes de moveros y evitad responder por separado a la presión rival.",
    },
  });

  function unavailable(status) {
    return { status, threats: [] };
  }

  function adviseCounterplay(input = {}) {
    const risks = input.strategicRisks;
    if (risks?.status !== "assessed") {
      return unavailable(risks?.status === "pending" ? "pending" : "not-assessable");
    }

    const threats = (Array.isArray(risks.risks) ? risks.risks : [])
      .filter((risk) => COUNTERPLAY_BY_RISK[risk?.type]
        && SEVERITY_ORDER[risk.severity]
        && String(risk.threatens || "").trim())
      .sort((left, right) => SEVERITY_ORDER[left.severity] - SEVERITY_ORDER[right.severity]
        || (Number(left.priority) || Number.MAX_SAFE_INTEGER) - (Number(right.priority) || Number.MAX_SAFE_INTEGER)
        || left.type.localeCompare(right.type, "es"))
      .slice(0, 3)
      .map((risk, index) => {
        const counterplay = COUNTERPLAY_BY_RISK[risk.type];
        return {
          priority: index + 1,
          type: counterplay.type,
          style: counterplay.style,
          severity: risk.severity,
          threatens: String(risk.threatens).trim(),
          explanation: counterplay.explanation(risk),
          protection: counterplay.protection,
        };
      });

    return {
      status: threats.length ? "advised" : "no-supported-threat",
      threats,
    };
  }

  return { adviseCounterplay };
});
