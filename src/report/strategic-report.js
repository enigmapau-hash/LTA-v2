(function (root, factory) {
  const explanations = typeof module === "object" && module.exports
    ? require("./strategic-explanations.js")
    : root.LTAStrategicExplanations;
  const confidenceEngine = typeof module === "object" && module.exports
    ? require("../domain/confidence-engine.js")
    : root.LTAConfidenceEngine;
  const diagnosticSummaryEngine = typeof module === "object" && module.exports
    ? require("../domain/diagnostic-summary-engine.js")
    : root.LTADiagnosticSummaryEngine;
  const secondaryObservationEngine = typeof module === "object" && module.exports
    ? require("../domain/secondary-observation-engine.js")
    : root.LTASecondaryObservationEngine;
  const strategicStateEngine = typeof module === "object" && module.exports
    ? require("../domain/strategic-state-engine.js")
    : root.LTAStrategicStateEngine;
  const strategicClosingEngine = typeof module === "object" && module.exports
    ? require("../domain/strategic-closing-engine.js")
    : root.LTAStrategicClosingEngine;
  const banIntegration = typeof module === "object" && module.exports
    ? require("./strategic-report-ban-integration.js")
    : root.LTAStrategicReportBanIntegration;
  const riskIntegration = typeof module === "object" && module.exports
    ? require("./strategic-report-risk-integration.js")
    : root.LTAStrategicReportRiskIntegration;
  const closingIntegration = typeof module === "object" && module.exports
    ? require("./strategic-report-closing.js")
    : root.LTAStrategicReportClosing;
  const builder = factory(explanations, confidenceEngine, diagnosticSummaryEngine, secondaryObservationEngine, strategicStateEngine, strategicClosingEngine, banIntegration, closingIntegration, riskIntegration);
  if (typeof module === "object" && module.exports) {
    module.exports = builder;
  } else {
    root.LTAStrategicReportBuilder = Object.freeze(builder);
  }
})(typeof window !== "undefined" ? window : globalThis, function (explanations, confidenceEngine, diagnosticSummaryEngine, secondaryObservationEngine, strategicStateEngine, strategicClosingEngine, banIntegration, closingIntegration, riskIntegration) {
  "use strict";

  function diagnosisSection(diagnosis, summary) {
    const primary = diagnosis?.plan?.primaryIdentity;
    if (!diagnosis || diagnosis.status !== "assessed") {
      return {
        id: "diagnosis",
        title: "Diagnóstico",
        answer: "Diagnóstico pendiente",
        explanation: summary.summary,
      };
    }
    if (!diagnosis.plan?.clear || !primary) {
      return {
        id: "diagnosis",
        title: "Diagnóstico",
        answer: "Sin un plan de partida claro",
        explanation: summary.summary,
      };
    }
    const winCondition = String(diagnosis.winCondition?.primary?.condition || "").trim();
    return {
      id: "diagnosis",
      title: "Diagnóstico",
      answer: `Plan principal: ${primary}${winCondition ? ` · Cómo ganar: ${winCondition}` : ""}`,
      explanation: summary.summary,
    };
  }

  function correctionSection(correction) {
    const improvements = Array.isArray(correction?.improvements) ? correction.improvements : [];
    const improvement = improvements.find((item) => item?.priority === "principal") || improvements[0];
    if (!improvement) {
      return {
        id: "correction",
        title: "Corrección",
        answer: "Sin una mejora respaldada",
        explanation: explanations.explainCorrection(correction),
      };
    }
    const profile = String(improvement.profile?.label || "un perfil complementario");
    return {
      id: "correction",
      title: "Mejora prioritaria",
      answer: `Reforzar ${profile.toLowerCase()}`,
      explanation: explanations.explainCorrection(correction),
    };
  }

  function recommendationSection(recommendation, compositionOptimization, teamRecomposition) {
    if (!recommendation || !Array.isArray(recommendation.candidates) || !recommendation.candidates.length) return null;
    return {
      id: "correction",
      title: "Recomendación estratégica",
      answer: `${recommendation.optionalLimitation ? "Oportunidad" : "Necesidad"}: ${recommendation.need} · Perfil: ${recommendation.profile}`,
      explanation: recommendation.reason,
      improves: recommendation.improves,
      candidates: recommendation.candidates,
      ...(recommendation.detectedNeed ? { detectedNeed: recommendation.detectedNeed } : {}),
      ...(recommendation.optionalLimitation ? { optionalLimitation: recommendation.optionalLimitation } : {}),
      ...(compositionOptimization?.status === "optimized" && compositionOptimization.proposal
        ? { compositionOptimization: compositionOptimization.proposal }
        : {}),
      ...(teamRecomposition?.status === "recomposed" && teamRecomposition.proposal
        ? { teamRecomposition: teamRecomposition.proposal }
        : {}),
    };
  }

  function protectionSection(protection, banPresentation) {
    const threats = Array.isArray(protection?.threats) ? protection.threats : [];
    const threat = threats.find((item) => item?.priority === "principal") || threats[0];
    const section = !threat ? {
      id: "protection",
      title: "Protección",
      answer: "Sin una amenaza prioritaria",
      explanation: explanations.explainProtection(protection),
    } : {
      id: "protection",
      title: "Protección estratégica",
      answer: `Proteger el plan frente a ${String(threat.style || "la amenaza principal")}`,
      explanation: explanations.explainProtection(protection),
      action: String(threat.protection || ""),
    };
    const integratedBans = banIntegration.integrateStrategicReportBans({ banPresentation });
    return { ...section, ...(integratedBans ? { strategicBans: integratedBans.bans } : {}) };
  }

  function adaptSectionTone(section, level) {
    if (level === "alta" || Array.isArray(section.candidates)) return section;
    const action = section.action
      ? level === "media"
        ? `Como orientación, ${section.action.charAt(0).toLocaleLowerCase("es")}${section.action.slice(1)}`
        : `De forma provisional, ${section.action.charAt(0).toLocaleLowerCase("es")}${section.action.slice(1)}`
      : section.action;

    if (level === "media") {
      const answer = section.id === "diagnosis"
        ? section.answer.replace(/^Plan principal:/, "Plan probable:")
        : section.id === "correction"
          ? section.answer.replace(/^Reforzar\s+/, "Orientación: reforzar ")
          : section.answer.replace(/^Proteger el plan frente a\s+/, "Conviene proteger el plan frente a ");
      return { ...section, answer, ...(action ? { action } : {}) };
    }

    const answer = section.id === "diagnosis"
      ? `Lectura provisional: ${section.answer}`
      : section.id === "correction"
        ? section.answer.startsWith("Reforzar ")
          ? section.answer.replace(/^Reforzar\s+/, "Posible mejora: reforzar ")
          : "Sin mejora prioritaria respaldada por ahora"
        : section.answer.startsWith("Proteger el plan frente a ")
          ? section.answer.replace(/^Proteger el plan frente a\s+/, "Protección provisional frente a ")
          : "Sin amenaza prioritaria por ahora";
    return { ...section, answer, ...(action ? { action } : {}) };
  }

  function buildStrategicReport(input = {}) {
    const diagnosis = input.diagnosis;
    const confidence = confidenceEngine.assessConfidence({
      diagnosis,
      correction: input.correction,
      protection: input.protection,
    });
    const diagnosticSummary = diagnosticSummaryEngine.buildDiagnosticSummary({
      diagnosis,
      confidence: confidence.conclusions.diagnosis,
    });
    const secondaryObservation = secondaryObservationEngine.findSecondaryObservation({
      diagnosis,
    });
    const diagnosisExplanation = [diagnosticSummary.summary, secondaryObservation]
      .filter(Boolean)
      .join(" ");
    const strategicState = strategicStateEngine.summarizeStrategicState({
      diagnosis,
      diagnosticSummary,
      secondaryObservation,
    });
    const strategicRecommendation = recommendationSection(input.recommendation, input.compositionOptimization, input.teamRecomposition);
    const sections = [
      diagnosisSection(diagnosis, { ...diagnosticSummary, summary: diagnosisExplanation }),
      strategicRecommendation || correctionSection(input.correction),
      protectionSection(input.protection, input.strategicBanPresentation),
    ].map((section) => adaptSectionTone(section, confidence.conclusions[section.id]?.level));
    const riskGuidance = diagnosis?.status === "assessed"
      ? riskIntegration.integrateStrategicReportRisks({
        strategicRisks: input.strategicRisks,
        strategicCounterplay: input.strategicCounterplay,
        protectionSection: sections[2],
      })
      : null;
    if (riskGuidance) sections[2] = { ...sections[2], riskGuidance };
    const closingGuidance = strategicClosingEngine.buildStrategicClosing({ strategicState });
    const closing = closingIntegration.integrateStrategicReportClosing({
      strategicState,
      guidance: closingGuidance,
      sections,
    });
    return {
      status: diagnosis?.status === "assessed" ? "assessed" : "not-assessable",
      title: "Cómo jugarla",
      confidence,
      strategicState,
      ...(input.strategicRisks?.status === "assessed" ? { strategicRisks: input.strategicRisks } : {}),
      ...(input.strategicCounterplay?.status === "advised" ? { strategicCounterplay: input.strategicCounterplay } : {}),
      ...(input.strategicBans?.status === "prioritized" ? { strategicBans: input.strategicBans } : {}),
      ...(input.strategicBanPresentation?.status === "presented" ? { strategicBanPresentation: input.strategicBanPresentation } : {}),
      ...(closing ? { closing } : {}),
      sections,
    };
  }

  return { buildStrategicReport };
});
