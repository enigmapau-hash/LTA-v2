#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const XLSX = require("../vendor/xlsx.full.min.js");
const { diagnoseComposition } = require("../src/domain/diagnostic-engine.js");
const { proposeCorrections } = require("../src/domain/correction-engine.js");
const { optimizeComposition } = require("../src/domain/composition-optimizer.js");
const { recommendProfiles } = require("../src/domain/strategic-recommendation-engine.js");
const { mapCandidates } = require("../src/domain/championship-candidate-mapper.js");
const { evaluateCandidates } = require("../src/domain/candidate-evaluator.js");
const { generateRepresentativeCompositions } = require("./recommendation-audit-fixtures.cjs");
const compositionEngine = require("../src/domain/composition-engine.js");
const { recommendPicks, analyzeComposition } = compositionEngine;

const ROLE_SHEETS = Object.freeze({
  top: "Tabla Top",
  jungle: "Tabla Jungla",
  mid: "Tabla Mid",
  botline: "Tabla Botline",
  support: "Tabla Support",
});
const REPEAT_CASE_THRESHOLD = 3;
const PAIR_OVERLAP_THRESHOLD = 0.5;
const PAIR_MIN_SHARED_CHAMPIONS = 2;
// Historical snapshot captured from the PR #23 report before the first recalibration.
const PRE_QUALITY_PASS_BASELINE = Object.freeze({
  candidateMentions: 83,
  uniqueChampions: 32,
  championDiversity: 0.386,
  profileRoleCoverage: 0.953,
  repeatedChampions: 17,
  similarPairs: 7,
  maxChampionCases: 5,
});
// Captured from the same 40 draft states before Quality Pass 2 recalibration.
const PRE_QUALITY_PASS_2_DRAFT_BASELINE = Object.freeze({
  totalCandidateMentions: 300,
  uniqueRecommendedChampions: 66,
  championDiversity: 0.22,
  repetitionRate: 0.403,
  repeatedChampionCount: 10,
  maxChampionContexts: 27,
  recommendationCoverage: 1,
  contextAlignment: 0.765,
  assessableRecommendations: 285,
  recommendationChangeRate: 0.85,
  transitionCount: 60,
  recommendationStability: 0.618,
  stableIdentityTransitions: 41,
});
const PRE_QUALITY_PASS_3_DRAFT_BASELINE = Object.freeze({
  totalCandidateMentions: 300,
  uniqueRecommendedChampions: 72,
  secondaryIdentityRate: 0.9,
  identityStability: 22 / 27,
  crossIdentityDifferentiation: 0.973,
  championDiversity: 0.24,
  repetitionRate: 0.363,
  contextAlignment: 0.972,
  recommendationStability: 0.821,
  recommendationChangeRate: 0.65,
  categoryCount: 8,
  topCategoryShare: 83 / 300,
  categories: Object.freeze({ "Front to Back": 83, Pick: 34, Dive: 23, Teamfight: 42, Poke: 27, "Early Game": 42, "Split Push": 36, Escalado: 13 }),
});
const PRE_QUALITY_PASS_4_DRAFT_BASELINE = Object.freeze({
  secondaryIdentityRate: 0.4,
  championDiversity: 0.24,
  repetitionRate: 0.363,
  crossIdentityDifferentiation: 0.972,
  recommendationStability: 0.829,
  contextAlignment: 0.979,
  recommendationChangeRate: 0.65,
  identityStability: 0.815,
  distinctCategories: 8,
  topCategoryShare: 0.27,
  nearCompositionDifferentiation: 0.939,
  nearCompositionPairs: 189,
  signalGuidedOrderRate: 0,
  categories: Object.freeze({ "Front to Back": 81, "Early Game": 42, Teamfight: 42, "Split Push": 36, Pick: 34, Poke: 27, Dive: 23, Escalado: 15 }),
});
const root = path.resolve(__dirname, "..");

function loadCandidateCatalog(workbookPath = path.join(root, "Draft Pool.xlsx")) {
  const workbook = XLSX.read(fs.readFileSync(workbookPath), { type: "buffer" });
  return Object.fromEntries(Object.entries(ROLE_SHEETS).map(([role, sheetName]) => {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) throw new Error("No se encontró la hoja " + sheetName + " en el catálogo.");
    const candidates = XLSX.utils.sheet_to_json(sheet, { defval: "" }).map((row) => ({
      champion: String(row["Campeón"] || "").trim(),
      identity: String(row["Identidad"] || "").trim(),
      function: String(row["Función"] || "").trim(),
      tempo: String(row["Ritmo"] || "").trim(),
      strengths: String(row["Fortalezas"] || "").trim(),
      weaknesses: String(row["Debilidades"] || "").trim(),
    })).filter((candidate) => candidate.champion);
    return [role, candidates];
  }));
}

function normalize(value) {
  return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es");
}

function runPipeline(picks, candidatesByRole) {
  const diagnosis = diagnoseComposition(picks);
  const correction = proposeCorrections({ picks, diagnosis, candidatesByRole });
  const optimizer = optimizeComposition({ diagnosis, correction });
  const recommendations = recommendProfiles({ diagnosis, optimizer });
  const mappedCandidates = mapCandidates({
    diagnosis,
    optimizer,
    recommendations,
    candidatesByRole,
    selectedChampions: picks.map((pick) => pick.champion),
    currentPicks: picks,
  });
  const evaluatedCandidates = evaluateCandidates({ diagnosis, optimizer, recommendations, mappedCandidates });
  return { diagnosis, recommendations, mappedCandidates, evaluatedCandidates };
}

function roundRatio(value) {
  return Number(value.toFixed(3));
}

function auditRecommendations(candidatesByRole) {
  const fixtures = generateRepresentativeCompositions(candidatesByRole);
  const cases = fixtures.map((fixture) => {
    const result = runPipeline(fixture.picks, candidatesByRole);
    const profiles = Array.isArray(result.evaluatedCandidates.profiles) ? result.evaluatedCandidates.profiles : [];
    const mentions = profiles.flatMap((profile) => (profile.candidates || []).map((candidate) => ({
      champion: String(candidate.champion || "").trim(),
      profile: profile.id,
      priority: candidate.priority,
    }))).filter((candidate) => candidate.champion);
    const mappedById = new Map((result.mappedCandidates.profiles || []).map((profile) => [profile.id, profile]));
    const rolePairs = profiles.flatMap((profile) => Object.entries(
      mappedById.get(profile.id)?.alternativesByRole || {}
    ).filter(([, alternatives]) => alternatives.length > 0).map(([role]) => profile.id + ":" + role));

    return {
      id: fixture.id,
      label: fixture.label,
      diagnosis: result.diagnosis.status,
      identity: result.diagnosis.plan?.primaryIdentity || null,
      coherence: result.diagnosis.coherence?.status || "unknown",
      recommendationStatus: result.recommendations.status,
      profiles: profiles.map((profile) => profile.id),
      mentions,
      champions: [...new Set(mentions.map((item) => normalize(item.champion)))].sort(),
      rolePairs: [...new Set(rolePairs)].sort(),
    };
  });

  const championStats = new Map();
  for (const item of cases) {
    for (const mention of item.mentions) {
      const key = normalize(mention.champion);
      const stat = championStats.get(key) || { champion: mention.champion, mentions: 0, cases: new Set(), profiles: new Set() };
      stat.mentions += 1;
      stat.cases.add(item.id);
      stat.profiles.add(mention.profile);
      championStats.set(key, stat);
    }
  }

  const champions = [...championStats.values()].map((stat) => ({
    champion: stat.champion,
    mentions: stat.mentions,
    cases: stat.cases.size,
    profiles: stat.profiles.size,
  })).sort((left, right) => right.cases - left.cases
    || right.mentions - left.mentions
    || left.champion.localeCompare(right.champion, "es"));
  const repeatedChampions = champions.filter((item) => item.cases >= REPEAT_CASE_THRESHOLD);

  const similarPairs = [];
  for (let leftIndex = 0; leftIndex < cases.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < cases.length; rightIndex += 1) {
      const left = cases[leftIndex];
      const right = cases[rightIndex];
      const shared = left.champions.filter((champion) => right.champions.includes(champion));
      const union = new Set([...left.champions, ...right.champions]).size;
      const jaccard = union ? shared.length / union : 0;
      if (shared.length >= PAIR_MIN_SHARED_CHAMPIONS && jaccard >= PAIR_OVERLAP_THRESHOLD) {
        similarPairs.push({ left: left.label, right: right.label, shared: shared.length, overlap: roundRatio(jaccard) });
      }
    }
  }
  similarPairs.sort((left, right) => right.overlap - left.overlap
    || right.shared - left.shared
    || left.left.localeCompare(right.left, "es")
    || left.right.localeCompare(right.right, "es"));

  const totalMentions = cases.reduce((sum, item) => sum + item.mentions.length, 0);
  const totalProfileRolePairs = cases.reduce((sum, item) => sum + item.profiles.length * Object.keys(ROLE_SHEETS).length, 0);
  const coveredProfileRolePairs = cases.reduce((sum, item) => sum + item.rolePairs.length, 0);
  const recommendedCases = cases.filter((item) => item.recommendationStatus === "recommended" && item.mentions.length > 0).length;
  const profileCounts = new Map();
  for (const item of cases) for (const profile of item.profiles) profileCounts.set(profile, (profileCounts.get(profile) || 0) + 1);

  return {
    cases,
    champions,
    repeatedChampions,
    similarPairs,
    metrics: {
      compositionCount: cases.length,
      recommendedCaseCount: recommendedCases,
      recommendationCoverage: roundRatio(recommendedCases / cases.length),
      totalCandidateMentions: totalMentions,
      uniqueRecommendedChampions: championStats.size,
      championDiversity: totalMentions ? roundRatio(championStats.size / totalMentions) : 0,
      profileRoleCoverage: totalProfileRolePairs ? roundRatio(coveredProfileRolePairs / totalProfileRolePairs) : 0,
      distinctProfiles: profileCounts.size,
      similarPairCount: similarPairs.length,
    },
    profileCounts: [...profileCounts.entries()].map(([profile, casesCount]) => ({ profile, cases: casesCount }))
      .sort((left, right) => right.cases - left.cases || left.profile.localeCompare(right.profile, "es")),
    thresholds: {
      repeatedChampionCases: REPEAT_CASE_THRESHOLD,
      pairSharedChampions: PAIR_MIN_SHARED_CHAMPIONS,
      pairJaccard: PAIR_OVERLAP_THRESHOLD,
    },
  };
}

function auditNearCompositionDifferentiation(fixtures, candidatesByRole, engine = compositionEngine) {
  const comparisons = new Map();
  const normalizePicks = (picks) => picks.map((pick) => normalize(pick.champion)).sort().join("|");
  const overlap = (left, right) => {
    const leftSet = new Set(left.map((item) => normalize(item.champion)));
    const rightSet = new Set(right.map((item) => normalize(item.champion)));
    const shared = [...leftSet].filter((champion) => rightSet.has(champion)).length;
    const union = new Set([...leftSet, ...rightSet]).size;
    return union ? shared / union : 0;
  };

  for (const fixture of fixtures) {
    for (const count of [2, 3, 4]) {
      const basePicks = fixture.picks.slice(0, count);
      const baseIdentity = engine.analyzeComposition(basePicks).identity.primary;
      if (!baseIdentity) continue;
      const baseRecommendations = engine.recommendPicks(basePicks, candidatesByRole, 3);
      for (let pickIndex = 0; pickIndex < basePicks.length; pickIndex += 1) {
        const original = basePicks[pickIndex];
        for (const alternativeFixture of fixtures) {
          const replacement = alternativeFixture.picks[pickIndex];
          if (!replacement || normalize(replacement.champion) === normalize(original.champion)
            || basePicks.some((pick, index) => index !== pickIndex
              && normalize(pick.champion) === normalize(replacement.champion))) continue;

          const variantPicks = basePicks.map((pick, index) => index === pickIndex ? replacement : pick);
          const variantIdentity = engine.analyzeComposition(variantPicks).identity.primary;
          if (!variantIdentity || variantIdentity === baseIdentity) continue;
          const signatures = [normalizePicks(basePicks), normalizePicks(variantPicks)].sort();
          const pairKey = count + ":" + signatures.join("::");
          if (comparisons.has(pairKey)) continue;

          const variantRecommendations = engine.recommendPicks(variantPicks, candidatesByRole, 3);
          const roleOverlaps = Object.keys(baseRecommendations)
            .filter((role) => variantRecommendations[role]?.length)
            .map((role) => overlap(baseRecommendations[role], variantRecommendations[role]));
          if (!roleOverlaps.length) continue;
          comparisons.set(pairKey, {
            identityA: baseIdentity,
            identityB: variantIdentity,
            overlap: roleOverlaps.reduce((sum, value) => sum + value, 0) / roleOverlaps.length,
          });
        }
      }
    }
  }

  const pairs = [...comparisons.values()];
  const meanOverlap = pairs.length
    ? pairs.reduce((sum, pair) => sum + pair.overlap, 0) / pairs.length
    : 0;
  return {
    pairCount: pairs.length,
    meanOverlap: roundRatio(meanOverlap),
    differentiation: roundRatio(1 - meanOverlap),
  };
}

function auditDraftRecommendations(candidatesByRole, engine = compositionEngine) {
  const auditRecommendPicks = engine.recommendPicks;
  const auditAnalyzeComposition = engine.analyzeComposition;
  const fixtures = generateRepresentativeCompositions(candidatesByRole);
  const stages = fixtures.flatMap((fixture) => [1, 2, 3, 4].map((count) => {
    const picks = fixture.picks.slice(0, count);
    const recommendations = auditRecommendPicks(picks, candidatesByRole, 3);
    const compositionIdentity = auditAnalyzeComposition(picks).identity;
    const roles = Object.fromEntries(Object.entries(recommendations).map(([role, items]) => [
      role,
      items.map((item) => ({ champion: item.champion, direction: item.direction, affinity: item.affinity })),
    ]));
    return {
      id: fixture.id + "-" + count,
      fixtureId: fixture.id,
      label: fixture.label,
      count,
      identity: compositionIdentity.primary,
      secondaryIdentity: compositionIdentity.secondary,
      selected: picks.map((pick) => pick.champion),
      roles,
    };
  }));

  const mentions = stages.flatMap((stage) => Object.entries(stage.roles).flatMap(([role, items]) =>
    items.map((item) => ({ ...item, fixtureId: stage.fixtureId, stage: stage.count, role }))
  ));
  const championCounts = new Map();
  for (const mention of mentions) {
    const key = normalize(mention.champion);
    const entry = championCounts.get(key) || { champion: mention.champion, mentions: 0, contexts: new Set() };
    entry.mentions += 1;
    entry.contexts.add([mention.fixtureId, mention.stage, mention.role].join("/"));
    championCounts.set(key, entry);
  }
  const champions = [...championCounts.values()].map((item) => ({
    champion: item.champion,
    mentions: item.mentions,
    contexts: item.contexts.size,
  })).sort((left, right) => right.contexts - left.contexts
    || right.mentions - left.mentions
    || left.champion.localeCompare(right.champion, "es"));

  let expectedRoleSlots = 0;
  let coveredRoleSlots = 0;
  let alignedRecommendations = 0;
  let assessableRecommendations = 0;
  let repeatedMentions = 0;
  let transitionCount = 0;
  let changedTransitions = 0;
  let stableIdentityTransitions = 0;
  let stableIdentityOverlap = 0;
  let identityTransitions = 0;
  let stablePrimaryIdentityTransitions = 0;
  let signalPairComparisons = 0;
  let signalGuidedPairCount = 0;
  let maxSignalGuidedAffinityGap = 0;
  const byFixture = new Map(fixtures.map((fixture) => [fixture.id, []]));

  for (const stage of stages) byFixture.get(stage.fixtureId).push(stage);
  for (const stage of stages) {
    for (const items of Object.values(stage.roles)) {
      for (let left = 0; left < items.length; left += 1) {
        for (let right = left + 1; right < items.length; right += 1) {
          signalPairComparisons += 1;
          const affinityGap = items[left].affinity - items[right].affinity;
          if (affinityGap < 0) {
            signalGuidedPairCount += 1;
            maxSignalGuidedAffinityGap = Math.max(maxSignalGuidedAffinityGap, Math.abs(affinityGap));
          }
        }
      }
    }
    const availableRoles = Object.keys(candidatesByRole).filter((role) => !stage.selected.some((champion) =>
      normalize(champion) === normalize(fixtures.find((fixture) => fixture.id === stage.fixtureId).picks.find((pick) => pick.role === role)?.champion)
    ));
    expectedRoleSlots += availableRoles.length;
    for (const role of availableRoles) {
      const items = stage.roles[role] || [];
      if (items.length) coveredRoleSlots += 1;
      for (const item of items) {
        if (stage.identity) {
          assessableRecommendations += 1;
          if (normalize(item.direction) === normalize(stage.identity)) alignedRecommendations += 1;
        }
      }
    }
  }

  for (const fixtureStages of byFixture.values()) {
    fixtureStages.sort((left, right) => left.count - right.count);
    for (let index = 1; index < fixtureStages.length; index += 1) {
      const previous = fixtureStages[index - 1];
      const current = fixtureStages[index];
      if (previous.identity && current.identity) {
        identityTransitions += 1;
        if (previous.identity === current.identity) stablePrimaryIdentityTransitions += 1;
      }
      const commonRoles = Object.keys(previous.roles).filter((role) => Object.hasOwn(current.roles, role));
      for (const role of commonRoles) {
        const previousNames = previous.roles[role].map((item) => normalize(item.champion));
        const currentNames = current.roles[role].map((item) => normalize(item.champion));
        transitionCount += 1;
        if (previousNames.join("|") !== currentNames.join("|")) changedTransitions += 1;
        if (previous.identity && previous.identity === current.identity) {
          stableIdentityTransitions += 1;
          const common = previousNames.filter((name) => currentNames.includes(name)).length;
          stableIdentityOverlap += previousNames.length ? common / previousNames.length : 0;
        }
      }
    }
  }

  const repeatThreshold = Math.max(6, Math.ceil(stages.length / 5));
  const repeatedChampions = champions.filter((item) => item.contexts >= repeatThreshold);
  const contextsInRepeatedSuggestions = repeatedChampions.reduce((sum, item) => sum + item.contexts, 0);
  repeatedMentions = mentions.filter((item) => repeatedChampions.some((repeated) => normalize(repeated.champion) === normalize(item.champion))).length;
  const totalMentions = mentions.length;
  let crossIdentityPairs = 0;
  let crossIdentitySimilarity = 0;
  for (let leftIndex = 0; leftIndex < stages.length; leftIndex += 1) {
    const left = stages[leftIndex];
    if (!left.identity) continue;
    for (let rightIndex = leftIndex + 1; rightIndex < stages.length; rightIndex += 1) {
      const right = stages[rightIndex];
      if (left.fixtureId === right.fixtureId || left.count !== right.count || !right.identity || left.identity === right.identity) continue;
      const sharedRoles = Object.keys(left.roles).filter((role) => Object.hasOwn(right.roles, role));
      for (const role of sharedRoles) {
        const leftNames = new Set(left.roles[role].map((item) => normalize(item.champion)));
        const rightNames = new Set(right.roles[role].map((item) => normalize(item.champion)));
        const intersection = [...leftNames].filter((name) => rightNames.has(name)).length;
        const union = new Set([...leftNames, ...rightNames]).size;
        crossIdentitySimilarity += union ? intersection / union : 0;
        crossIdentityPairs += 1;
      }
    }
  }

  return {
    stages,
    champions,
    repeatedChampions,
    metrics: {
      compositionCount: fixtures.length,
      stageCount: stages.length,
      totalCandidateMentions: totalMentions,
      uniqueRecommendedChampions: championCounts.size,
      championDiversity: totalMentions ? roundRatio(championCounts.size / totalMentions) : 0,
      repetitionRate: totalMentions ? roundRatio(repeatedMentions / totalMentions) : 0,
      repeatedChampionCount: repeatedChampions.length,
      maxChampionContexts: champions[0]?.contexts || 0,
      recommendationCoverage: expectedRoleSlots ? roundRatio(coveredRoleSlots / expectedRoleSlots) : 0,
      contextAlignment: assessableRecommendations ? roundRatio(alignedRecommendations / assessableRecommendations) : 0,
      assessableRecommendations,
      contextAdaptation: assessableRecommendations ? roundRatio(alignedRecommendations / assessableRecommendations) : 0,
      recommendationChangeRate: transitionCount ? roundRatio(changedTransitions / transitionCount) : 0,
      transitionCount,
      recommendationStability: stableIdentityTransitions ? roundRatio(stableIdentityOverlap / stableIdentityTransitions) : 0,
      stableIdentityTransitions,
      identityStability: identityTransitions ? roundRatio(stablePrimaryIdentityTransitions / identityTransitions) : 0,
      identityTransitions,
      stablePrimaryIdentityTransitions,
      crossIdentityDifferentiation: crossIdentityPairs ? roundRatio(1 - crossIdentitySimilarity / crossIdentityPairs) : 0,
      crossIdentityPairs,
      secondaryIdentityCount: stages.filter((stage) => stage.secondaryIdentity).length,
      secondaryIdentityRate: stages.length ? roundRatio(stages.filter((stage) => stage.secondaryIdentity).length / stages.length) : 0,
      categoryCounts: mentions.reduce((counts, item) => {
        const key = item.direction || "Sin dirección";
        counts[key] = (counts[key] || 0) + 1;
        return counts;
      }, {}),
      distinctCategories: new Set(mentions.map((item) => item.direction || "Sin dirección")).size,
      signalGuidedOrderRate: signalPairComparisons ? roundRatio(signalGuidedPairCount / signalPairComparisons) : 0,
      signalGuidedPairCount,
      signalPairComparisons,
      maxSignalGuidedAffinityGap,
      topCategoryShare: totalMentions ? roundRatio(Math.max(...Object.values(mentions.reduce((counts, item) => {
        const key = item.direction || "Sin dirección";
        counts[key] = (counts[key] || 0) + 1;
        return counts;
      }, {}))) / totalMentions) : 0,
      repeatedContexts: contextsInRepeatedSuggestions,
      nearCompositionDifferentiation: auditNearCompositionDifferentiation(fixtures, candidatesByRole, engine),
    },
    thresholds: { repeatedContexts: repeatThreshold },
  };
}

function renderMarkdown(audit, draftAudit = null) {
  const { metrics, cases, champions, repeatedChampions, similarPairs, profileCounts, thresholds } = audit;
  const pct = (ratio) => (ratio * 100).toFixed(1) + "%";
  const relativeChange = (before, after) => ((after - before) / before * 100).toFixed(1) + "%";
  const percentagePointChange = (before, after) => {
    const difference = (after - before) * 100;
    return (difference > 0 ? "+" : "") + difference.toFixed(1) + " p.p.";
  };
  const afterRepeatedCount = repeatedChampions.length;
  const afterMaxChampionCases = champions[0]?.cases || 0;
  const lines = [
    "# Auditoría de recomendaciones estratégicas",
    "",
    "Informe reproducible generado a partir del catálogo de campeones incluido en el proyecto.",
    "",
    "## Metodología",
    "",
    "La herramienta genera diez composiciones de referencia desde nombres de campeones presentes en el catálogo: Front to Back, Dive, Pick, Poke, Split Push, Teamfight, escalado, Early Game, híbrida e incoherente. Los atributos de cada pieza se leen del catálogo; no se duplican ni se inventan para la auditoría.",
    "",
    "Para cada equipo ejecuta la cadena existente de diagnóstico, corrección, Composition Optimizer, Strategic Recommendation Engine, Candidate Mapper y Candidate Evaluator. La recomendación mantiene el perfil más directo para la necesidad prioritaria y elige una alternativa compatible con la identidad ya diagnosticada. El mapeo prioriza el ajuste a identidad y win condition antes de usar la cantidad genérica de señales como desempate. Cuenta como recomendación cada candidato evaluado dentro de su perfil estratégico.",
    "",
    "La generación y ordenación son deterministas. Para regenerar este informe ejecuta node tools/recommendation-audit.cjs --write; para verificar contratos y reproducibilidad ejecuta node tools/check-recommendation-audit.cjs.",
    "",
    "## Métricas",
    "",
    "| Métrica | Resultado | Interpretación |",
    "| --- | ---: | --- |",
    "| Composiciones auditadas | " + metrics.compositionCount + " | Casos representativos declarados en el generador. |",
    "| Cobertura de recomendaciones | " + metrics.recommendedCaseCount + "/" + metrics.compositionCount + " (" + pct(metrics.recommendationCoverage) + ") | Casos que produjeron al menos un perfil con candidatos evaluados. |",
    "| Menciones de candidatos | " + metrics.totalCandidateMentions + " | Apariciones en listas por perfil; un campeón puede aparecer en varios perfiles. |",
    "| Campeones distintos recomendados | " + metrics.uniqueRecommendedChampions + " | Diversidad total del catálogo recomendado. |",
    "| Diversidad de campeones | " + pct(metrics.championDiversity) + " | Campeones únicos dividido por todas las menciones por perfil. |",
    "| Cobertura de rol por perfil | " + pct(metrics.profileRoleCoverage) + " | Pares perfil/rol con al menos una alternativa, entre los pares de perfiles recomendados. |",
    "| Perfiles estratégicos distintos | " + metrics.distinctProfiles + " | Variedad de perfiles ofrecidos por la cadena en el conjunto auditado. |",
    "| Pares de composiciones con alta repetición | " + metrics.similarPairCount + " | Pares que comparten al menos " + thresholds.pairSharedChampions + " campeones recomendados y Jaccard ≥ " + pct(thresholds.pairJaccard) + ". |",
    "",
    "### Comparación con la línea base anterior al Quality Pass 1",
    "",
    "La línea base conserva las métricas generadas por la herramienta en la PR #23, antes de esta recalibración.",
    "",
    "| Métrica | Antes | Después | Cambio |",
    "| --- | ---: | ---: | ---: |",
    "| Menciones de candidatos | " + PRE_QUALITY_PASS_BASELINE.candidateMentions + " | " + metrics.totalCandidateMentions + " | " + relativeChange(PRE_QUALITY_PASS_BASELINE.candidateMentions, metrics.totalCandidateMentions) + " |",
    "| Campeones distintos | " + PRE_QUALITY_PASS_BASELINE.uniqueChampions + " | " + metrics.uniqueRecommendedChampions + " | " + relativeChange(PRE_QUALITY_PASS_BASELINE.uniqueChampions, metrics.uniqueRecommendedChampions) + " |",
    "| Diversidad de campeones | " + pct(PRE_QUALITY_PASS_BASELINE.championDiversity) + " | " + pct(metrics.championDiversity) + " | " + percentagePointChange(PRE_QUALITY_PASS_BASELINE.championDiversity, metrics.championDiversity) + " |",
    "| Cobertura de rol por perfil | " + pct(PRE_QUALITY_PASS_BASELINE.profileRoleCoverage) + " | " + pct(metrics.profileRoleCoverage) + " | " + percentagePointChange(PRE_QUALITY_PASS_BASELINE.profileRoleCoverage, metrics.profileRoleCoverage) + " |",
    "| Campeones repetidos en ≥3 composiciones | " + PRE_QUALITY_PASS_BASELINE.repeatedChampions + " | " + afterRepeatedCount + " | " + relativeChange(PRE_QUALITY_PASS_BASELINE.repeatedChampions, afterRepeatedCount) + " |",
    "| Pares con alta coincidencia | " + PRE_QUALITY_PASS_BASELINE.similarPairs + " | " + metrics.similarPairCount + " | " + relativeChange(PRE_QUALITY_PASS_BASELINE.similarPairs, metrics.similarPairCount) + " |",
    "| Máxima frecuencia de un campeón | " + PRE_QUALITY_PASS_BASELINE.maxChampionCases + "/10 | " + afterMaxChampionCases + "/10 | " + relativeChange(PRE_QUALITY_PASS_BASELINE.maxChampionCases, afterMaxChampionCases) + " |",
    "",
    "La concentración repetida baja: los pares con alta coincidencia pasan de " + PRE_QUALITY_PASS_BASELINE.similarPairs + " a " + metrics.similarPairCount + " y los campeones frecuentes de " + PRE_QUALITY_PASS_BASELINE.repeatedChampions + " a " + afterRepeatedCount + ". La cobertura de rol por perfil retrocede " + Math.abs((metrics.profileRoleCoverage - PRE_QUALITY_PASS_BASELINE.profileRoleCoverage) * 100).toFixed(1) + " p.p. y el catálogo único recomendado disminuye en " + (PRE_QUALITY_PASS_BASELINE.uniqueChampions - metrics.uniqueRecommendedChampions) + "; conviene vigilar estos dos costes en auditorías futuras.",
    "",
    "### Perfiles recomendados",
    "",
    "| Perfil | Composiciones |",
    "| --- | ---: |",
    ...profileCounts.map((item) => "| " + item.profile + " | " + item.cases + "/" + metrics.compositionCount + " |"),
    "",
    "### Frecuencia de campeones",
    "",
    "Conteo completo sobre composiciones distintas, además de apariciones en perfiles.",
    "",
    "| Campeón | Composiciones | Menciones por perfil | Perfiles |",
    "| --- | ---: | ---: | ---: |",
    ...champions.map((item) => "| " + item.champion + " | " + item.cases + "/" + metrics.compositionCount + " | " + item.mentions + " | " + item.profiles + " |"),
    "",
    "### Repetición y diversidad entre composiciones",
    "",
    "Señal de repetición por campeón: aparece en al menos " + thresholds.repeatedChampionCases + " composiciones distintas. Es una alerta exploratoria, no significa por sí sola que una recomendación sea incorrecta.",
    "",
    repeatedChampions.length
      ? "Campeones con aparición frecuente: " + repeatedChampions.map((item) => item.champion + " (" + item.cases + "/" + metrics.compositionCount + ")").join(", ") + "."
      : "No se detectaron campeones que superen el umbral de repetición definido.",
    "",
    similarPairs.length ? "Pares con recomendaciones de alta coincidencia:" : "No se detectaron pares por encima del umbral de coincidencia.",
    ...(similarPairs.length ? [
      "",
      "| Composición A | Composición B | Campeones compartidos | Jaccard |",
      "| --- | --- | ---: | ---: |",
      ...similarPairs.map((item) => "| " + item.left + " | " + item.right + " | " + item.shared + " | " + pct(item.overlap) + " |"),
    ] : []),
    "",
    "## Casos incluidos",
    "",
    "| Caso | Identidad detectada | Coherencia | Estado de recomendación | Perfiles |",
    "| --- | --- | --- | --- | --- |",
    ...cases.map((item) => "| " + item.label + " | " + (item.identity || "Sin identidad") + " | " + item.coherence + " | " + item.recommendationStatus + " | " + (item.profiles.length ? item.profiles.join(", ") : "—") + " |"),
    "",
    "## Limitaciones",
    "",
    "- El conjunto es pequeño y curado; representa referencias estratégicas concretas, no todo el espacio posible de composiciones.",
    "- El resultado depende de los atributos y el catálogo actuales. No refleja popularidad, winrate, datos online ni contexto de rival.",
    "- La frecuencia mide exposición dentro de las salidas evaluadas, no calidad competitiva ni probabilidad de victoria.",
    "- La similitud compara nombres de campeones recomendados; no evalúa equivalencia táctica.",
    "- Los umbrales de repetición son señales para revisión manual, no criterios de aprobación ni fallos automáticos del motor.",
    "- La cobertura perfil/rol no califica la calidad ni el orden de cada candidato.",
    "",
    "## Cómo interpretar los resultados",
    "",
    "Usa cobertura para localizar casos en los que la cadena no logra ofrecer candidatos y diversidad para observar cuánto rota el catálogo recomendado. Las frecuencias altas y los pares similares sirven para priorizar una revisión humana de redundancias. Una concentración puede ser razonable si el catálogo o los atributos respaldan repetidamente a una misma pieza; las métricas no justifican cambiar pesos o comportamiento sin una investigación adicional.",
    "",
    "La auditoría es una herramienta interna de observación. Sus cifras no se muestran en la aplicación y no alteran las recomendaciones.",
    "",
  ];
  if (draftAudit) {
    const draft = draftAudit.metrics;
    const baseline = PRE_QUALITY_PASS_2_DRAFT_BASELINE;
    const afterQp2 = PRE_QUALITY_PASS_3_DRAFT_BASELINE;
    const afterQp3 = PRE_QUALITY_PASS_4_DRAFT_BASELINE;
    const draftPct = (ratio) => (ratio * 100).toFixed(1) + "%";
    const draftDelta = (before, after) => {
      const difference = (after - before) * 100;
      return (difference > 0 ? "+" : "") + difference.toFixed(1) + " p.p.";
    };
    lines.splice(lines.length - 1, 0,
      "",
      "## Auditoría del draft",
      "",
      "La auditoría recorre los primeros cuatro picks de cada una de las diez composiciones representativas: 40 estados y hasta 100 combinaciones de estado/rol. En las transiciones compara los tres candidatos por rol que sigue libre.",
      "",
      "La alineación contextual mide qué proporción de candidatos apunta a la identidad que ya se puede reconocer en el draft parcial. La adaptación mide cuántas listas por rol cambian tras añadir un pick; la estabilidad mide el solapamiento medio de los tres candidatos cuando la identidad se mantiene. La adaptación no se interpreta aislada: debe leerse junto con alineación y estabilidad.",
      "",
      "| Métrica | Resultado actual | Interpretación |",
      "| --- | ---: | --- |",
      "| Estados de draft | " + draft.stageCount + " | 10 arquetipos de referencia por 4 tamaños de draft. |",
      "| Identidades secundarias | " + draft.secondaryIdentityCount + "/" + draft.stageCount + " (" + draftPct(draft.secondaryIdentityRate) + ") | En el draft requiere apoyo de varias piezas; en un equipo completo conserva una señal rival fuerte para detectar contradicciones. |",
      "| Estabilidad de identidad principal | " + draftPct(draft.identityStability) + " | Transiciones consecutivas con la misma identidad entre casos reconocibles: " + draft.stablePrimaryIdentityTransitions + "/" + draft.identityTransitions + ". |",
      "| Diferenciación entre identidades distintas | " + draftPct(draft.crossIdentityDifferentiation) + " | Uno menos el Jaccard medio de los top 3 por rol, entre estados del mismo tamaño con identidad distinta; " + draft.crossIdentityPairs + " pares. |",
      "| Categorías estratégicas utilizadas | " + draft.distinctCategories + " | Categorías de identidad usadas en las recomendaciones del corpus. |",
      "| Cobertura de rol | " + draftPct(draft.recommendationCoverage) + " | Roles aún vacíos con tres recomendaciones disponibles. |",
      "| Diversidad | " + draftPct(draft.championDiversity) + " | Campeones únicos dividido por todas las menciones en los estados auditados. |",
      "| Adaptación al contexto | " + draftPct(draft.contextAdaptation) + " | Candidatos cuya dirección coincide con la identidad reconocible; " + draft.assessableRecommendations + " menciones evaluables. |",
      "| Cambio de listas entre picks | " + draftPct(draft.recommendationChangeRate) + " | Listas por rol común que cambian al añadir el siguiente campeón. |",
      "| Estabilidad con identidad constante | " + draftPct(draft.recommendationStability) + " | Solapamiento medio del top 3 entre transiciones que mantienen identidad; " + draft.stableIdentityTransitions + " comparaciones. |",
      "| Repetición de sugerencias | " + draftPct(draft.repetitionRate) + " | Menciones pertenecientes a campeones que aparecen en " + draftAudit.thresholds.repeatedContexts + " o más contextos draft/rol. |",
      "| Campeones distintos / máxima repetición | " + draft.uniqueRecommendedChampions + " / " + draft.maxChampionContexts + " contextos | Variedad del catálogo y máxima frecuencia entre estados. |",
      "| Diferenciación entre composiciones cercanas | " + draftPct(draft.nearCompositionDifferentiation.differentiation) + " | 1 menos el solapamiento medio de recomendaciones tras sustituir una pieza y obtener otra identidad; " + draft.nearCompositionDifferentiation.pairCount + " pares. |",
      "| Órdenes guiados por señales estratégicas | " + draftPct(draft.signalGuidedOrderRate) + " | Pares de candidatos invertidos respecto a su afinidad bruta mediante la huella de señales, dentro de un punto de afinidad; " + draft.signalGuidedPairCount + "/" + draft.signalPairComparisons + " pares. |",
      "| Cobertura de etapas | " + draft.stageCount + "/" + (draft.compositionCount * 4) + " | Estados con recomendaciones desde 1 hasta 4 picks. |",
      "",
      "### Comparación con la línea base anterior al Quality Pass 2",
      "",
      "| Métrica | Antes | Después | Cambio |",
      "| --- | ---: | ---: | ---: |",
      "| Diversidad | " + draftPct(baseline.championDiversity) + " | " + draftPct(afterQp2.championDiversity) + " | " + draftDelta(baseline.championDiversity, afterQp2.championDiversity) + " |",
      "| Adaptación al contexto | " + draftPct(baseline.contextAlignment) + " | " + draftPct(afterQp2.contextAlignment) + " | " + draftDelta(baseline.contextAlignment, afterQp2.contextAlignment) + " |",
      "| Cambio de listas entre picks | " + draftPct(baseline.recommendationChangeRate) + " | " + draftPct(afterQp2.recommendationChangeRate) + " | " + draftDelta(baseline.recommendationChangeRate, afterQp2.recommendationChangeRate) + " |",
      "| Estabilidad con identidad constante | " + draftPct(baseline.recommendationStability) + " | " + draftPct(afterQp2.recommendationStability) + " | " + draftDelta(baseline.recommendationStability, afterQp2.recommendationStability) + " |",
      "| Repetición de sugerencias | " + draftPct(baseline.repetitionRate) + " | " + draftPct(afterQp2.repetitionRate) + " | " + draftDelta(baseline.repetitionRate, afterQp2.repetitionRate) + " |",
      "| Cobertura de rol | " + draftPct(baseline.recommendationCoverage) + " | " + draftPct(1) + " | " + draftDelta(baseline.recommendationCoverage, 1) + " |",
      "| Menciones / campeones distintos | " + baseline.totalCandidateMentions + " / " + baseline.uniqueRecommendedChampions + " | " + afterQp2.totalCandidateMentions + " / " + afterQp2.uniqueRecommendedChampions + " | — |",
      "",
    "### Comparación antes/después del Quality Pass 3",
    "",
    "La comparación usa el resultado consolidado del Quality Pass 2 como línea base; el corpus, los roles y el tamaño de las listas se mantienen iguales. Durante el draft, Quality Pass 3 exige apoyo de varias piezas para asignar una identidad secundaria; en composiciones completas conserva el criterio anterior para no alterar el análisis ya establecido. También aumenta de 8 a 12 la penalización draft por recomendar una dirección que contradice la identidad emergente.",
    "",
    "| Métrica | Antes (QP2) | Después (QP3) | Cambio |",
    "| --- | ---: | ---: | ---: |",
    "| Identidad secundaria asignada | " + pct(PRE_QUALITY_PASS_3_DRAFT_BASELINE.secondaryIdentityRate) + " | " + pct(afterQp3.secondaryIdentityRate) + " | " + percentagePointChange(PRE_QUALITY_PASS_3_DRAFT_BASELINE.secondaryIdentityRate, afterQp3.secondaryIdentityRate) + " |",
    "| Estabilidad de identidad principal | " + pct(PRE_QUALITY_PASS_3_DRAFT_BASELINE.identityStability) + " | " + pct(afterQp3.identityStability) + " | " + percentagePointChange(PRE_QUALITY_PASS_3_DRAFT_BASELINE.identityStability, afterQp3.identityStability) + " |",
    "| Diferenciación entre identidades distintas | " + pct(PRE_QUALITY_PASS_3_DRAFT_BASELINE.crossIdentityDifferentiation) + " | " + pct(afterQp3.crossIdentityDifferentiation) + " | " + percentagePointChange(PRE_QUALITY_PASS_3_DRAFT_BASELINE.crossIdentityDifferentiation, afterQp3.crossIdentityDifferentiation) + " |",
    "| Categorías estratégicas utilizadas | " + PRE_QUALITY_PASS_3_DRAFT_BASELINE.categoryCount + " | " + afterQp3.distinctCategories + " | " + (afterQp3.distinctCategories - PRE_QUALITY_PASS_3_DRAFT_BASELINE.categoryCount >= 0 ? "+" : "") + (afterQp3.distinctCategories - PRE_QUALITY_PASS_3_DRAFT_BASELINE.categoryCount) + " |",
    "| Concentración en la categoría más frecuente | " + pct(PRE_QUALITY_PASS_3_DRAFT_BASELINE.topCategoryShare) + " | " + pct(afterQp3.topCategoryShare) + " | " + percentagePointChange(PRE_QUALITY_PASS_3_DRAFT_BASELINE.topCategoryShare, afterQp3.topCategoryShare) + " |",
    "| Diversidad de candidatos | " + pct(PRE_QUALITY_PASS_3_DRAFT_BASELINE.championDiversity) + " | " + pct(afterQp3.championDiversity) + " | " + percentagePointChange(PRE_QUALITY_PASS_3_DRAFT_BASELINE.championDiversity, afterQp3.championDiversity) + " |",
    "| Repetición de sugerencias | " + pct(PRE_QUALITY_PASS_3_DRAFT_BASELINE.repetitionRate) + " | " + pct(afterQp3.repetitionRate) + " | " + percentagePointChange(PRE_QUALITY_PASS_3_DRAFT_BASELINE.repetitionRate, afterQp3.repetitionRate) + " |",
    "| Diferenciación contextual (alineación) | " + pct(PRE_QUALITY_PASS_3_DRAFT_BASELINE.contextAlignment) + " | " + pct(afterQp3.contextAlignment) + " | " + percentagePointChange(PRE_QUALITY_PASS_3_DRAFT_BASELINE.contextAlignment, afterQp3.contextAlignment) + " |",
    "| Estabilidad de recomendaciones con identidad constante | " + pct(PRE_QUALITY_PASS_3_DRAFT_BASELINE.recommendationStability) + " | " + pct(afterQp3.recommendationStability) + " | " + percentagePointChange(PRE_QUALITY_PASS_3_DRAFT_BASELINE.recommendationStability, afterQp3.recommendationStability) + " |",
    "",
    "Uso de categorías antes (QP2): " + Object.entries(PRE_QUALITY_PASS_3_DRAFT_BASELINE.categories).map(([name, count]) => name + " " + count).join("; ") + ".",
    "Uso de categorías después (QP3): " + Object.entries(afterQp3.categories).map(([name, count]) => name + " " + count).join("; ") + ".",
    "",
    "La reducción de identidades secundarias refleja un umbral más exigente de evidencia: no se etiqueta como híbrida una composición por una señal aislada. La estabilidad de identidad mide continuidad de la identidad principal entre etapas adyacentes con identidad reconocible. La alineación y la estabilidad de recomendaciones permiten comprobar que el ajuste mantiene precisión y continuidad del draft.",
    "",
    "### Comparación antes/después del Quality Pass 4",
    "",
    "La línea base se ejecuta con el código de `origin/main` previo a QP4 sobre el mismo catálogo y los mismos casos. La nueva selección usa la huella de señales del arquetipo emergente para desempatar recomendaciones cuya afinidad queda a un punto de la mejor, conservando la afinidad como límite de calidad. Para medir composiciones cercanas, el corpus sustituye una pieza en prefijos de 2, 3 y 4 picks; solo compara pares cuya identidad principal cambia y calcula el solapamiento medio del top 3 en los roles todavía vacíos.",
    "",
    "| Métrica | Antes (QP3) | Después (QP4) | Cambio |",
    "| --- | ---: | ---: | ---: |",
    "| Diversidad de candidatos | " + draftPct(PRE_QUALITY_PASS_4_DRAFT_BASELINE.championDiversity) + " | " + draftPct(draft.championDiversity) + " | " + draftDelta(PRE_QUALITY_PASS_4_DRAFT_BASELINE.championDiversity, draft.championDiversity) + " |",
    "| Repetición de sugerencias | " + draftPct(PRE_QUALITY_PASS_4_DRAFT_BASELINE.repetitionRate) + " | " + draftPct(draft.repetitionRate) + " | " + draftDelta(PRE_QUALITY_PASS_4_DRAFT_BASELINE.repetitionRate, draft.repetitionRate) + " |",
    "| Diferenciación entre identidades distintas | " + draftPct(PRE_QUALITY_PASS_4_DRAFT_BASELINE.crossIdentityDifferentiation) + " | " + draftPct(draft.crossIdentityDifferentiation) + " | " + draftDelta(PRE_QUALITY_PASS_4_DRAFT_BASELINE.crossIdentityDifferentiation, draft.crossIdentityDifferentiation) + " |",
    "| Diferenciación entre composiciones cercanas | " + draftPct(PRE_QUALITY_PASS_4_DRAFT_BASELINE.nearCompositionDifferentiation) + " | " + draftPct(draft.nearCompositionDifferentiation.differentiation) + " | " + draftDelta(PRE_QUALITY_PASS_4_DRAFT_BASELINE.nearCompositionDifferentiation, draft.nearCompositionDifferentiation.differentiation) + " |",
    "| Pares cercanos auditados | " + PRE_QUALITY_PASS_4_DRAFT_BASELINE.nearCompositionPairs + " | " + draft.nearCompositionDifferentiation.pairCount + " | — |",
    "| Alineación contextual | " + draftPct(PRE_QUALITY_PASS_4_DRAFT_BASELINE.contextAlignment) + " | " + draftPct(draft.contextAlignment) + " | " + draftDelta(PRE_QUALITY_PASS_4_DRAFT_BASELINE.contextAlignment, draft.contextAlignment) + " |",
    "| Estabilidad con identidad constante | " + draftPct(PRE_QUALITY_PASS_4_DRAFT_BASELINE.recommendationStability) + " | " + draftPct(draft.recommendationStability) + " | " + draftDelta(PRE_QUALITY_PASS_4_DRAFT_BASELINE.recommendationStability, draft.recommendationStability) + " |",
    "| Decisiones de orden guiadas por señales | " + draftPct(PRE_QUALITY_PASS_4_DRAFT_BASELINE.signalGuidedOrderRate) + " | " + draftPct(draft.signalGuidedOrderRate) + " | " + draftDelta(PRE_QUALITY_PASS_4_DRAFT_BASELINE.signalGuidedOrderRate, draft.signalGuidedOrderRate) + " |",
    "| Estabilidad de identidad principal | " + draftPct(PRE_QUALITY_PASS_4_DRAFT_BASELINE.identityStability) + " | " + draftPct(draft.identityStability) + " | " + draftDelta(PRE_QUALITY_PASS_4_DRAFT_BASELINE.identityStability, draft.identityStability) + " |",
    "| Categorías estratégicas utilizadas | " + PRE_QUALITY_PASS_4_DRAFT_BASELINE.distinctCategories + " | " + draft.distinctCategories + " | " + (draft.distinctCategories - PRE_QUALITY_PASS_4_DRAFT_BASELINE.distinctCategories >= 0 ? "+" : "") + (draft.distinctCategories - PRE_QUALITY_PASS_4_DRAFT_BASELINE.distinctCategories) + " |",
    "| Concentración en la categoría más frecuente | " + draftPct(PRE_QUALITY_PASS_4_DRAFT_BASELINE.topCategoryShare) + " | " + draftPct(draft.topCategoryShare) + " | " + draftDelta(PRE_QUALITY_PASS_4_DRAFT_BASELINE.topCategoryShare, draft.topCategoryShare) + " |",
    "",
    "QP4 amplía el catálogo recomendado y reduce la repetición, a la vez que distingue mejor composiciones cercanas y conserva la estabilidad de identidad y de listas cuando el plan no cambia. La cobertura del corpus estratégico sigue en ocho categorías, sin ampliar el modelo de identidades.",
    "",
    "### Limitaciones de la auditoría de draft",
      "",
      "Los estados parciales son prefijos de composiciones de referencia, no todos los órdenes posibles de selección. La identidad emergente es la lectura provisional del mismo analizador con los picks disponibles; si aún no hay una identidad, esa fila no se incluye en la alineación. El cambio de una lista no equivale por sí solo a una mejora: debe acompañarse de alineación o de una identidad que haya cambiado. La estabilidad mide continuidad de alternativas, no garantiza calidad competitiva.",
      ""
    );
  }
  return lines.join("\n");
}

function main() {
  const audit = auditRecommendations(loadCandidateCatalog());
  const draftAudit = auditDraftRecommendations(loadCandidateCatalog());
  const markdown = `${renderMarkdown(audit, draftAudit).trimEnd()}\n`;
  if (process.argv.includes("--write")) {
    const outputPath = path.join(root, "docs", "quality", "Recommendation-Audit.md");
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, markdown, "utf8");
    console.log("Informe de auditoría actualizado: " + path.relative(root, outputPath));
    return;
  }
  process.stdout.write(markdown);
}

if (require.main === module) main();

module.exports = { ROLE_SHEETS, loadCandidateCatalog, auditRecommendations, auditDraftRecommendations, auditNearCompositionDifferentiation, renderMarkdown };
