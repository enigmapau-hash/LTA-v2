(function (root, factory) {
  const polisher = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = polisher;
  } else {
    root.LTAStrategicRecommendationPolisher = Object.freeze(polisher);
  }
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  function normalize(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("es")
      .replace(/\s+/g, " ")
      .trim();
  }

  function cleanText(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function uniqueText(values, limit) {
    const found = new Set();
    const result = [];
    for (const value of Array.isArray(values) ? values : []) {
      const text = cleanText(value);
      const key = normalize(text);
      if (!key || found.has(key)) continue;
      found.add(key);
      result.push(text);
      if (result.length === limit) break;
    }
    return result;
  }

  function notPolished(status) {
    return { status, section: null, compact: "" };
  }

  function matchingProfile(input, id) {
    const groups = [input.recommendations?.profiles, input.mappedCandidates?.profiles, input.evaluatedCandidates?.profiles];
    return groups.every((profiles) => Array.isArray(profiles) && profiles.some((profile) => profile?.id === id));
  }

  function polishRecommendation(input = {}) {
    if (input.integration?.status !== "presented" || !input.integration?.section) {
      return notPolished(input.integration?.status || "not-presented");
    }
    if (input.optimizer?.status !== "prioritized"
      || input.recommendations?.status !== "recommended"
      || input.mappedCandidates?.status !== "mapped"
      || input.evaluatedCandidates?.status !== "evaluated"
      || input.presentation?.status !== "presented") {
      return notPolished("incomplete-presentation-chain");
    }

    const source = input.integration.section;
    const profile = input.presentation.primaryProfile;
    const need = cleanText(input.optimizer.priority?.need?.label);
    if (!profile?.id || !matchingProfile(input, profile.id)
      || normalize(source.need) !== normalize(need)
      || normalize(source.profile) !== normalize(profile.label)) {
      return notPolished("inconsistent-presentation-chain");
    }

    const presentedNames = new Set((profile.candidates || []).map((candidate) => normalize(candidate.champion)));
    const candidateNames = new Set();
    const improves = cleanText(source.improves);
    const duplicateClause = `. Refuerza ${improves}.`;
    const candidates = [];
    for (const candidate of Array.isArray(source.candidates) ? source.candidates : []) {
      const champion = cleanText(candidate?.champion);
      const key = normalize(champion);
      if (!key || candidateNames.has(key) || !presentedNames.has(key)) continue;
      candidateNames.add(key);

      let reason = cleanText(candidate.reason);
      if (improves && reason.toLocaleLowerCase("es").endsWith(duplicateClause.toLocaleLowerCase("es"))) {
        reason = reason.slice(0, -duplicateClause.length).trim();
      }
      candidates.push({
        champion,
        reason,
        strengths: uniqueText(candidate.strengths, 2),
        limitations: uniqueText(candidate.limitations, 1),
      });
      if (candidates.length === 4) break;
    }

    if (!candidates.length) return notPolished("no-useful-candidates");

    const section = {
      need,
      profile: cleanText(source.profile),
      reason: cleanText(source.reason),
      improves,
      candidates,
    };
    const compact = `${section.need} · ${section.profile}: ${candidates.map((candidate) => candidate.champion).join(", ")}.`;
    return { status: "polished", section, compact };
  }

  return { polishRecommendation };
});
