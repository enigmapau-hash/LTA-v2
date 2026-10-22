(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.LTAFinalRecommendationExplanations = Object.freeze(api);
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  const text = (value) => String(value || "").trim();
  const normalize = (value) => text(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es").replace(/[^a-z0-9]+/g, " ").trim();
  const list = (value) => (Array.isArray(value) ? value : text(value).split(/[·,;]/)).map(text).filter(Boolean);
  const same = (left, right) => Boolean(normalize(left)) && normalize(left) === normalize(right);
  const pair = (left, right) => same(left?.champion, right?.champion) && same(left?.role, right?.role);

  function contains(value, term) {
    const signal = normalize(term);
    // As in the mapper, anti-engage cannot substantiate engage.
    const source = signal.startsWith("anti ") ? normalize(value) : normalize(value).replace(/\banti [a-z0-9]+\b/g, " ");
    return Boolean(signal) && (" " + source + " ").includes(" " + signal + " ");
  }

  // These are explanations of explicit catalogue attributes, never selection rules.
  // Each relationship requires the candidate's matching profile signal and an ally's
  // own attribute; it does not assert a tested ability combo or a guaranteed outcome.
  const BENEFITS = Object.freeze({
    engage: { terms: ["follow-up", "teamfight", "backline"], action: "ofrece una entrada para aprovechar" },
    followUp: { terms: ["engage", "iniciación"], action: "ofrece continuidad a" },
    frontline: { terms: ["dps", "poke", "hypercarry"], action: "ofrece espacio para aplicar" },
    peel: { terms: ["dps", "poke", "hypercarry"], action: "ofrece protección para aplicar" },
    disengage: { terms: ["poke", "escalado", "hypercarry"], action: "ayuda a evitar entradas que interrumpan" },
    sustainedDamage: { terms: ["frontline", "peel", "control de zonas"], action: "aporta daño continuado para aprovechar" },
    frontToBack: { terms: ["frontline", "peel"], action: "complementa el juego frontal respaldado por" },
    pick: { terms: ["pick", "follow-up", "burst"], action: "ofrece oportunidades de cazada para combinar con" },
    sideLane: { terms: ["objetivos", "control del mapa", "control de visión"], action: "añade presión lateral como complemento a" },
    mapControl: { terms: ["pick", "side lane", "objetivos"], action: "ofrece preparación del mapa para apoyar" },
    earlyPressure: { terms: ["early", "tempo", "snowball"], action: "acompaña la ventana temprana respaldada por" },
    scaling: { terms: ["late", "escalado", "hypercarry"], action: "acompaña la ventana de escalado respaldada por" },
    zoneControl: { terms: ["poke", "asedio", "objetivos"], action: "ofrece control del espacio para acompañar" },
  });
  const DIRECT_PROFILE = Object.freeze({ engage: "engage", frontline: "frontline", "sustained-damage": "sustainedDamage",
    "side-lane": "sideLane", peel: "peel", pick: "pick", "early-pressure": "earlyPressure", scaling: "scaling" });

  function beneficiaryEvidence(profileId, picks, candidate) {
    const relation = BENEFITS[profileId];
    if (!relation) return [];
    return picks.filter((pick) => !same(pick.role, candidate.role) && !same(pick.champion, candidate.champion))
      .flatMap((pick) => {
        const evidence = ["strengths", "function", "tempo"].flatMap((field) =>
          list(pick[field]).filter((value) => relation.terms.some((term) => contains(value, term)))
            .map((value) => ({ field, value })));
        return evidence.length ? [{ champion: pick.champion, role: pick.role, evidence,
          text: `${pick.champion}: ${relation.action} «${evidence[0].value}».` }] : [];
      });
  }

  function explainFinalRecommendation(input = {}) {
    const section = input.section;
    if (!section || !Array.isArray(section.candidates) || input.diagnosis?.status !== "assessed"
      || input.optimizer?.status !== "prioritized" || input.presentation?.status !== "presented"
      || input.mappedCandidates?.status !== "mapped" || input.evaluatedCandidates?.status !== "evaluated") return section;
    const profile = input.presentation.primaryProfile;
    if (!profile?.id || !same(profile.label, section.profile) || !same(section.need, input.optimizer.priority?.need?.label)) return section;
    const mapped = input.mappedCandidates.profiles?.find((item) => item.id === profile.id);
    const evaluated = input.evaluatedCandidates.profiles?.find((item) => item.id === profile.id);
    if (!mapped || !evaluated) return section;
    const picks = Array.isArray(input.picks) ? input.picks : [];
    const factor = text(input.optimizer.priority?.problemAvoided);
    const diagnosticFactors = [...(input.diagnosis.primaryProblem?.evidence || []), ...(input.diagnosis.coherence?.gaps || [])];
    const improvement = input.correction?.status === "proposed" && input.correction.improvements?.find((item) =>
      item.profile?.id === input.optimizer.priority?.need?.id && same(item.limitingFactor, factor));
    const evidencedFactor = improvement && diagnosticFactors.some((item) => same(item, factor));
    // An archetype's inherent tradeoff is not a demonstrated missing capability.
    const structuralGap = input.diagnosis.primaryProblem?.type === "cohesion-gap";
    const detectedNeed = evidencedFactor && structuralGap ? factor : "";
    const optionalLimitation = evidencedFactor && !structuralGap
      && input.diagnosis.primaryProblem?.type === "identity-risk" ? factor : "";

    return {
      ...section,
      ...(detectedNeed ? { detectedNeed } : {}),
      ...(optionalLimitation ? { optionalLimitation } : {}),
      candidates: section.candidates.map((candidate) => {
        const source = mapped.candidates?.find((item) => pair(item, candidate));
        const assessment = evaluated.candidates?.find((item) => pair(item, candidate));
        const presented = profile.candidates?.some((item) => pair(item, candidate));
        if (!source || !assessment || !presented) return candidate;
        const evidence = (source.signals || []).filter((signal) =>
          (source.matchedFields || []).some((field) => ["identity", "strengths", "function", "tempo"].includes(field)
            && contains(source[field], signal)));
        if (!evidence.length) return candidate;
        const shared = evidence.filter((signal) => picks.some((pick) => !same(pick.role, candidate.role)
          && ["strengths", "function", "tempo"].some((field) => contains(pick[field], signal))));
        // A contradictory candidate may still be displayed by the existing chain;
        // do not turn its warning into a positive claim or change its ranking.
        const compatible = assessment.contradictsPlan === false;
        const effect = compatible && detectedNeed && DIRECT_PROFILE[input.optimizer.priority.need.id] === profile.id
          ? { kind: "correction", text: `Contribuye a corregir «${detectedNeed}».`, evidence: [detectedNeed] }
          : compatible && shared.length
            ? { kind: "reinforcement", text: `Refuerza una fortaleza ya presente: ${shared.join(" y ")}.`, evidence: shared }
            : null;
        return { ...candidate, justification: {
          contribution: `Aporta ${evidence.slice(0, 2).join(" y ")}, acorde con el perfil ${profile.label}.`,
          evidence,
          ...(effect ? { effect } : {}),
          beneficiaries: compatible ? beneficiaryEvidence(profile.id, picks, candidate) : [],
        } };
      }),
    };
  }

  return { explainFinalRecommendation };
});
