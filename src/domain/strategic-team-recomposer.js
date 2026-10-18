(function (root, factory) {
  const engine = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = engine;
  } else {
    root.LTAStrategicTeamRecomposer = Object.freeze(engine);
  }
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  const ROLE_ORDER = Object.freeze(["top", "jungle", "mid", "botline", "support"]);

  function normalize(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("es")
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  function unavailable(status, reason = "") {
    return { status, reason, proposal: null };
  }

  function roleKey(value) {
    const normalized = normalize(value);
    return ROLE_ORDER.find((role) => normalize(role) === normalized) || null;
  }

  function evidenceScore(fit) {
    return (Array.isArray(fit?.signals) ? fit.signals.length : 0) * 2
      + (Array.isArray(fit?.matchedFields) ? fit.matchedFields.length : 0);
  }

  function validComposition(composition) {
    if (composition?.status !== "complete" || !Array.isArray(composition.picks)
      || composition.picks.length !== ROLE_ORDER.length) return false;
    const roles = composition.picks.map((pick) => roleKey(pick?.role));
    const champions = composition.picks.map((pick) => normalize(pick?.champion));
    return roles.every(Boolean)
      && new Set(roles).size === ROLE_ORDER.length
      && champions.every(Boolean)
      && new Set(champions).size === ROLE_ORDER.length;
  }

  function planProfiles(input) {
    const recommendations = [...(input.recommendations.profiles || [])]
      .filter((profile) => profile?.id && Number.isFinite(profile.priority))
      .sort((left, right) => left.priority - right.priority);
    const mapped = new Map((input.mappedCandidates.profiles || []).map((profile) => [profile.id, profile]));
    const evaluated = new Map((input.evaluatedCandidates.profiles || []).map((profile) => [profile.id, profile]));
    return recommendations
      .map((recommendation) => ({ recommendation, mapped: mapped.get(recommendation.id), evaluated: evaluated.get(recommendation.id) }))
      .filter((item) => item.mapped && item.evaluated);
  }

  function candidateOptions(input, composition, profiles, primaryIdentity) {
    const byRole = Object.fromEntries(ROLE_ORDER.map((role) => [role, []]));
    const selectedNames = new Set(composition.picks.map((pick) => normalize(pick.champion)));

    for (const pick of composition.picks) {
      const role = roleKey(pick.role);
      byRole[role].push({
        champion: String(pick.champion).trim(),
        identity: String(pick.identity || "").trim(),
        strengths: String(pick.strengths || "").split("·").map((item) => item.trim()).filter(Boolean),
        weaknesses: String(pick.weaknesses || "").split("·").map((item) => item.trim()).filter(Boolean),
        current: true,
        fitByProfile: pick.fitByProfile || {},
        evaluations: {},
      });
    }

    for (const { recommendation, mapped, evaluated } of profiles) {
      const evaluatedByRole = evaluated.alternativesByRole || {};
      for (const [rawRole, candidates] of Object.entries(mapped.alternativesByRole || {})) {
        const role = roleKey(rawRole);
        if (!role) continue;
        const evaluatedByName = new Map((evaluatedByRole[role] || [])
          .map((candidate) => [normalize(candidate.champion), candidate]));
        for (const candidate of Array.isArray(candidates) ? candidates : []) {
          const name = normalize(candidate?.champion);
          const evaluation = evaluatedByName.get(name);
          if (!name || selectedNames.has(name) || !evaluation || evaluation.contradictsPlan) continue;
          if (primaryIdentity && evaluation.strategicFit !== "primary-identity") continue;

          let option = byRole[role].find((item) => normalize(item.champion) === name);
          if (!option) {
            option = {
              champion: String(candidate.champion).trim(),
              identity: String(candidate.identity || "").trim(),
              strengths: Array.isArray(candidate.strengths) ? [...candidate.strengths] : [],
              weaknesses: Array.isArray(candidate.weaknesses) ? [...candidate.weaknesses] : [],
              current: false,
              fitByProfile: {},
              evaluations: {},
            };
            byRole[role].push(option);
          }
          option.fitByProfile[recommendation.id] = {
            signals: Array.isArray(candidate.signals) ? candidate.signals : [],
            matchedFields: Array.isArray(candidate.matchedFields) ? candidate.matchedFields : [],
          };
          option.evaluations[recommendation.id] = evaluation;
        }
      }
    }

    return byRole;
  }

  function optionValue(option, profiles) {
    let prioritySupport = 0;
    let overallSupport = 0;
    let evaluatorSupport = 0;
    for (const { recommendation } of profiles) {
      const weight = Math.max(1, 5 - recommendation.priority);
      const fit = option.fitByProfile[recommendation.id];
      const evidence = evidenceScore(fit);
      if (recommendation.priority === 1) prioritySupport += evidence;
      overallSupport += evidence * weight;
      const rank = option.evaluations[recommendation.id]?.priority;
      if (Number.isFinite(rank)) evaluatorSupport += Math.max(0, 5 - rank) * weight;
    }
    return [prioritySupport, overallSupport, evaluatorSupport, option.current ? 1 : 0];
  }

  function compareValues(left, right) {
    for (let index = 0; index < left.length; index += 1) {
      if (left[index] !== right[index]) return left[index] - right[index];
    }
    return 0;
  }

  function chooseTeam(optionsByRole, profiles) {
    let best = null;
    const chosen = [];
    const used = new Set();

    function visit(index, totals) {
      if (index === ROLE_ORDER.length) {
        if (!best || compareValues(totals, best.totals) > 0) best = { picks: [...chosen], totals: [...totals] };
        return;
      }
      const role = ROLE_ORDER[index];
      const options = [...optionsByRole[role]].sort((left, right) =>
        compareValues(optionValue(right, profiles), optionValue(left, profiles))
          || left.champion.localeCompare(right.champion, "es"));
      for (const option of options) {
        const key = normalize(option.champion);
        if (!key || used.has(key)) continue;
        used.add(key);
        chosen.push({ role, option });
        const value = optionValue(option, profiles);
        visit(index + 1, totals.map((total, slot) => total + value[slot]));
        chosen.pop();
        used.delete(key);
      }
    }

    visit(0, [0, 0, 0, 0]);
    return best;
  }

  function identityForProposal(picks, primaryIdentity) {
    if (primaryIdentity) return { status: "preserved", primary: primaryIdentity, proposed: primaryIdentity };
    const counts = new Map();
    for (const { option } of picks) {
      const identity = String(option.identity || "").trim();
      const key = normalize(identity);
      if (key) counts.set(key, { identity, count: (counts.get(key)?.count || 0) + 1 });
    }
    const proposed = [...counts.values()].sort((left, right) => right.count - left.count
      || left.identity.localeCompare(right.identity, "es"))[0]?.identity || null;
    return { status: "unconfirmed", primary: null, proposed };
  }

  function recomposeStrategicTeam(input = {}) {
    if (input.optimizer?.status !== "prioritized") return unavailable("no-priority");
    if (input.recommendations?.status !== "recommended"
      || input.mappedCandidates?.status !== "mapped"
      || input.evaluatedCandidates?.status !== "evaluated"
      || input.presentation?.status !== "presented"
      || input.integration?.status !== "presented"
      || input.polished?.status !== "polished") {
      return unavailable("incomplete-recommendation-chain");
    }

    const composition = input.mappedCandidates.composition;
    if (composition?.status !== "complete") return unavailable("pending", "La recomposición requiere una composición completa.");
    if (!validComposition(composition)) return unavailable("invalid-composition", "La recomposición requiere cinco roles y campeones distintos.");

    const profiles = planProfiles(input);
    if (!profiles.length) return unavailable("no-evaluable-profiles");
    const primaryIdentity = String(input.recommendations.plan?.primaryIdentity || "").trim();
    const optionsByRole = candidateOptions(input, composition, profiles, primaryIdentity);
    if (ROLE_ORDER.some((role) => !optionsByRole[role].length)) return unavailable("incomplete-role-coverage");

    const team = chooseTeam(optionsByRole, profiles);
    if (!team) return unavailable("no-valid-team");
    const changes = team.picks.filter(({ option }) => !option.current);
    if (!changes.length) return unavailable("no-material-improvement", "Las señales disponibles no respaldan una recomposición mejor que la actual.");

    const profile = profiles[0].recommendation;
    const pieces = team.picks.map(({ role, option }) => {
      const original = composition.picks.find((pick) => roleKey(pick.role) === role);
      return {
        role,
        champion: option.champion,
        action: option.current ? "keep" : "replace",
        ...(option.current ? {} : { from: original.champion }),
        alignment: evidenceScore(original.fitByProfile?.[profile.id]) > 0 ? "supports-plan" : "weakens-plan",
        reason: option.current
          ? (evidenceScore(original.fitByProfile?.[profile.id]) > 0
            ? `Aporta al perfil ${profile.label.toLocaleLowerCase("es")}.`
            : "Se conserva porque las alternativas disponibles no ofrecen una mejora respaldada.")
          : (option.evaluations[profile.id]?.reason || option.evaluations[Object.keys(option.evaluations)[0]]?.reason || "Refuerza el plan priorizado."),
      };
    });
    const identity = identityForProposal(team.picks, primaryIdentity);
    const limitation = String(input.optimizer.priority.problemAvoided || "").trim();
    const improvement = String(profile.improves || input.optimizer.priority.reinforces || "").trim();
    const replacedNames = changes.map(({ option }) => option.champion);

    return {
      status: "recomposed",
      proposal: {
        identity,
        profile: { id: profile.id, label: profile.label },
        pieces,
        composition: pieces.map(({ role, champion }) => ({ role, champion })),
        improvement,
        weaknessesCorrected: limitation ? [limitation] : [],
        explanation: primaryIdentity
          ? `Recompone ${changes.length} ${changes.length === 1 ? "pieza" : "piezas"} alrededor de ${profile.label.toLocaleLowerCase("es")} y conserva el plan ${primaryIdentity}.`
          : `Recompone ${changes.length} ${changes.length === 1 ? "pieza" : "piezas"} alrededor de ${profile.label.toLocaleLowerCase("es")}; la identidad resultante debe confirmarse con un análisis completo.`,
        changeSummary: replacedNames.join(", "),
      },
    };
  }

  return { recomposeStrategicTeam };
});
