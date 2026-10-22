(function (root, factory) {
  const integration = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = integration;
  } else {
    root.LTAStrategicReportRiskIntegration = Object.freeze(integration);
  }
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  const RISK_TO_THREAT = Object.freeze({
    "priority-uncovered": "objective-contest",
    "single-point-dependency": "focused-dive",
    "identity-unconfirmed": "forced-engage",
  });
  const SEVERITY = Object.freeze({ alta: 1, media: 2, baja: 3 });

  function normalize(value) {
    return String(value || "").normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es")
      .replace(/\s+/g, " ").trim();
  }

  function alreadyVisible(message, texts) {
    const value = normalize(message);
    return Boolean(value && texts.some((text) => normalize(text).includes(value)));
  }

  function integrateStrategicReportRisks(input = {}) {
    const risks = input.strategicRisks;
    const counterplay = input.strategicCounterplay;
    if (risks?.status !== "assessed" || counterplay?.status !== "advised") return null;

    const protection = input.protectionSection || {};
    const visible = [
      protection.title, protection.answer, protection.explanation, protection.action,
      ...(Array.isArray(protection.strategicBans) ? protection.strategicBans.flatMap((ban) => [
        ban.threat, ban.reason, ban.expectedImpact,
      ]) : []),
    ];
    const ordered = [...(Array.isArray(risks.risks) ? risks.risks : [])]
      .filter((risk) => RISK_TO_THREAT[risk?.type] && SEVERITY[risk.severity]
        && String(risk.threatens || "").trim() && String(risk.explanation || "").trim())
      .sort((left, right) => SEVERITY[left.severity] - SEVERITY[right.severity]
        || (Number(left.priority) || Number.MAX_SAFE_INTEGER) - (Number(right.priority) || Number.MAX_SAFE_INTEGER)
        || left.type.localeCompare(right.type, "es"));
    for (const risk of ordered) {
      const threat = (Array.isArray(counterplay.threats) ? counterplay.threats : [])
        .find((candidate) => candidate?.type === RISK_TO_THREAT[risk.type]
          && candidate.severity === risk.severity
          && normalize(candidate.threatens) === normalize(risk.threatens)
          && String(candidate.protection || "").trim());
      if (!threat) continue;
      const explanation = String(risk.explanation).trim();
      const protectionAdvice = String(threat.protection).trim();
      const riskText = alreadyVisible(explanation, visible) ? "" : explanation;
      const responseText = alreadyVisible(protectionAdvice, visible) ? "" : protectionAdvice;
      if (!riskText && !responseText) continue;
      return {
        type: risk.type,
        severity: risk.severity,
        risk: riskText,
        response: responseText,
      };
    }
    return null;
  }

  return { integrateStrategicReportRisks };
});
