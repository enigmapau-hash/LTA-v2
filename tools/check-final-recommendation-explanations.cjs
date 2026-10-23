#!/usr/bin/env node
"use strict";
const assert = require("node:assert/strict");
const { createHash } = require("node:crypto");
const { explainFinalRecommendation } = require("../src/report/final-recommendation-explanations.js");
const { loadCandidateCatalog } = require("./recommendation-audit.cjs");
const { generateRepresentativeCompositions } = require("./recommendation-audit-fixtures.cjs");
const catalog = loadCandidateCatalog();
const call = (file, method, input) => require("../src/" + file + ".js")[method](input);

function chain(picks) {
  const diagnosis = call("domain/diagnostic-engine", "diagnoseComposition", picks);
  const correction = call("domain/correction-engine", "proposeCorrections", { picks, diagnosis, candidatesByRole: catalog });
  const protection = call("domain/protection-engine", "protectComposition", { diagnosis, correction });
  const optimizer = call("domain/composition-optimizer", "optimizeComposition", { diagnosis, correction });
  const recommendations = call("domain/strategic-recommendation-engine", "recommendProfiles", { diagnosis, optimizer });
  const mappedCandidates = call("domain/championship-candidate-mapper", "mapCandidates", {
    diagnosis, optimizer, recommendations, candidatesByRole: catalog, selectedChampions: picks.map(p => p.champion), currentPicks: picks,
  });
  const evaluatedCandidates = call("domain/candidate-evaluator", "evaluateCandidates", { diagnosis, optimizer, recommendations, mappedCandidates });
  const presentation = call("domain/strategic-recommendation-presenter", "presentRecommendations", { optimizer, recommendations, mappedCandidates, evaluatedCandidates });
  const integration = call("report/strategic-recommendation-presenter-integration", "presentForReport", { optimizer, recommendations, mappedCandidates, evaluatedCandidates, presentation });
  const polished = call("domain/strategic-recommendation-polisher", "polishRecommendation", { optimizer, recommendations, mappedCandidates, evaluatedCandidates, presentation, integration });
  const input = { optimizer, recommendations, mappedCandidates, evaluatedCandidates, presentation, integration, polished };
  const compositionOptimization = call("domain/strategic-composition-optimizer", "optimizeStrategicComposition", input);
  const teamRecomposition = call("domain/strategic-team-recomposer", "recomposeStrategicTeam", input);
  const strategicRisks = call("domain/strategic-risk-analyzer", "assessStrategicRisks", {
    ...input, strategicCompositionOptimization: compositionOptimization, teamRecomposition,
  });
  const strategicCounterplay = call("domain/strategic-counterplay-advisor", "adviseCounterplay", { strategicRisks });
  const strategicBans = call("domain/ban-prioritizer", "prioritizeBans", {
    diagnosis, strategicRisks, strategicCounterplay, protection, mappedCandidates, championCatalog: catalog,
  });
  return { ...input, picks, diagnosis, correction, protection, compositionOptimization, teamRecomposition,
    strategicRisks, strategicCounterplay, strategicBans, section: polished.status === "polished" ? polished.section : integration.section };
}

const fixtures = generateRepresentativeCompositions(catalog);
const snapshots = fixtures.map(({ picks }) => chain(picks));
const protectedPoke = fixtures.find(item => item.id === "poke");
const pokeSupport = catalog.support.find(item => item.champion === "Vel'Koz");
assert.ok(protectedPoke && pokeSupport, "Datos reales del arquetipo Poke sin Peel");
const unprotectedPoke = chain(protectedPoke.picks.map(pick => pick.role === "support"
  ? { ...pokeSupport, role: "support" } : pick));
assert.equal(unprotectedPoke.diagnosis.plan.primaryIdentity, "Poke");
assert.equal(unprotectedPoke.correction.status, "proposed", "El requisito explícito de Peel no se silencia");
assert.equal(unprotectedPoke.correction.improvements[0].evidenceType, "required-plan-capability");
const explanationCases = [...snapshots, unprotectedPoke];
for (const state of snapshots.filter(item => item.diagnosis.plan?.clear
  && item.diagnosis.primaryProblem?.type === "identity-risk")) {
  assert.equal(state.correction.status, "no-supported-correction",
    "Arquetipos coherentes con herramientas cubiertas: sin cambio forzado");
  assert.equal(state.optimizer.status, "no-priority");
}

// The v3.10 snapshot encoded compulsory replacements for every style.
// v3.13 deliberately changes that decision. Check full-chain determinism
// instead, while other suites guard champion roles, bans and draft rankings.
const digest = data => createHash("sha256").update(JSON.stringify(data)).digest("hex");
assert.equal(digest(snapshots), digest(fixtures.map(({ picks }) => chain(picks))),
  "La cadena completa permanece determinista con la nueva abstención");
// In every case that claims preservation, the real team diagnosis must agree.
for (const state of snapshots) {
  const optimization = state.compositionOptimization;
  if (optimization?.status !== "optimized" || optimization.proposal.identity.status !== "preserved") continue;
  const nextPicks = state.mappedCandidates.composition.picks.map((pick) => {
    const replacement = state.mappedCandidates.profiles.flatMap((profile) =>
      profile.alternativesByRole?.[optimization.proposal.change.role] || [])
      .find((candidate) => candidate.champion === optimization.proposal.change.to);
    const source = pick.role === optimization.proposal.change.role ? replacement : pick;
    const field = (value) => Array.isArray(value) ? value.join(" · ") : String(value || "");
    return { role: pick.role, champion: source.champion, identity: field(source.identity),
      function: field(source.function), tempo: field(source.tempo), strengths: field(source.strengths),
      weaknesses: field(source.weaknesses) };
  });
  const diagnosis = call("domain/diagnostic-engine", "diagnoseComposition", nextPicks);
  assert.equal(diagnosis.plan?.primaryIdentity, optimization.proposal.identity.primary,
    "La continuidad declarada debe corresponder al diagnóstico real del equipo propuesto");
}

let explained = 0, beneficiaries = 0;
for (const input of explanationCases) {
  const before = structuredClone(input);
  const result = explainFinalRecommendation(input);
  assert.deepEqual(input, before, "La presentación no muta ningún motor ni sus entradas");
  assert.deepEqual(result, explainFinalRecommendation(input), "Texto determinista");
  if (!result) continue;
  const { detectedNeed, optionalLimitation, ...plain } = result;
  plain.candidates = plain.candidates.map(({ justification, ...candidate }) => candidate);
  assert.deepEqual(plain, input.section, "Solo se añaden explicaciones, nunca se filtra o reordena un candidato");
  for (const candidate of result.candidates) {
    const justification = candidate.justification;
    if (!justification) continue;
    explained++;
    assert.ok(justification.evidence.length);
    assert.match(justification.contribution, /^Señales del catálogo:/, "Solo señales del origen sin reiterar el perfil");
    assert.doesNotMatch(justification.contribution, /acorde con el perfil/, "No repetir la categoría del candidato");
    if (justification.beneficiaries.length) {
      assert.ok(justification.beneficiarySummary, "Las relaciones con aliados deben estar resumidas");
      for (const ally of justification.beneficiaries) {
        assert.ok(justification.beneficiarySummary.includes(ally.champion), "El resumen conserva cada compañero");
        assert.ok(justification.beneficiarySummary.includes(ally.evidence[0].value), "El resumen conserva su evidencia");
      }
      if (justification.beneficiaries.length > 1) {
        assert.ok(justification.beneficiarySummary.length <
          justification.beneficiaries.map((ally) => ally.text).join(" ").length,
          "Un solo enunciado reduce repetición respecto al texto anterior");
      }
    }
    if (input.diagnosis.primaryProblem?.type === "identity-risk" && !input.correction.improvements?.some(item => item.evidenceType === "required-plan-capability")) {
      assert.notEqual(justification.effect?.kind, "correction",
        "La debilidad inherente a una identidad no prueba corrección real");
    }
    if (justification.effect?.kind === "correction") {
      assert.equal(justification.effect.evidence[0], detectedNeed);
      assert.ok([...input.diagnosis.primaryProblem.evidence, ...input.diagnosis.coherence.gaps].includes(detectedNeed)
        || input.correction.improvements?.some(item => item.evidenceType === "required-plan-capability" && item.limitingFactor === detectedNeed));
    }
    for (const ally of justification.beneficiaries) {
      beneficiaries++;
      const pick = input.picks.find(p => p.champion === ally.champion && p.role === ally.role);
      assert.ok(pick && pick.role !== candidate.role, "Solo compañeros conservados en otros roles");
      assert.ok(ally.evidence.every(({ field, value }) => String(pick[field]).includes(value)), "Cada relación cita atributos reales");
    }
  }
  const originalReport = call("report/strategic-report", "buildStrategicReport", { ...input, recommendation: input.section });
  const report = call("report/strategic-report", "buildStrategicReport", { ...input, recommendation: result });
  const reportPlain = structuredClone(report);
  delete reportPlain.sections[1].detectedNeed;
  delete reportPlain.sections[1].optionalLimitation;
  if (optionalLimitation) {
    assert.match(report.sections[1].answer, /^Oportunidad:/,
      "No llamar necesidad a una contrapartida propia del arquetipo");
    reportPlain.sections[1].answer = originalReport.sections[1].answer;
  }
  if (reportPlain.sections[1].candidates) reportPlain.sections[1].candidates = reportPlain.sections[1].candidates.map(({ justification, ...candidate }) => candidate);
  assert.deepEqual(reportPlain, originalReport, "Diagnóstico, protección, bans, propuestas y cierre permanecen intactos");
}
assert.ok(explained > 0 && beneficiaries > 0, "Las brechas acreditadas mantienen justificaciones y evidencia de aliados");

const example = snapshots.find(input => input.presentation.primaryProfile?.id === "engage");
assert.ok(example);
const mutate = () => structuredClone(example);
assert.equal(explainFinalRecommendation({ ...example, diagnosis: { status: "not-assessable" } }), example.section);
for (const field of ["mappedCandidates", "evaluatedCandidates", "presentation"]) {
  assert.equal(explainFinalRecommendation({ ...example, [field]: {} }), example.section, "Sin cadena completa no se inventa texto");
}
const noEvidence = mutate();
noEvidence.mappedCandidates.profiles.find(p => p.id === "engage").candidates.forEach(c => { c.signals = []; });
assert.ok(explainFinalRecommendation(noEvidence).candidates.every(c => !c.justification));
const anti = mutate();
anti.mappedCandidates.profiles.find(p => p.id === "engage").candidates.forEach(c => {
  c.signals = ["engage"]; c.matchedFields = ["strengths"]; c.strengths = ["Anti-engage"];
});
assert.ok(explainFinalRecommendation(anti).candidates.every(c => !c.justification), "Anti-engage no justifica una entrada");
const wrongRole = mutate();
wrongRole.section.candidates[0].role = "other";
assert.equal(explainFinalRecommendation(wrongRole).candidates[0].justification, undefined, "El nombre no basta: se comprueba la posición");
const contradicted = mutate();
contradicted.evaluatedCandidates.profiles.find(p => p.id === "engage").candidates.forEach(c => { c.contradictsPlan = true; });
assert.ok(explainFinalRecommendation(contradicted).candidates.every(c => !c.justification?.effect && !c.justification?.beneficiaries.length), "No transforma una contradicción en un beneficio");
const noFactor = mutate(); noFactor.diagnosis.primaryProblem.evidence = []; noFactor.diagnosis.coherence.gaps = [];
assert.equal(explainFinalRecommendation(noFactor).detectedNeed, undefined, "La prioridad no es prueba suficiente de una carencia");
const noAllies = mutate(); noAllies.picks = [];
assert.ok(explainFinalRecommendation(noAllies).candidates.every(c => !c.justification?.beneficiaries.length));

// A shared explicit signal supports reinforcement even when no diagnosed gap
// substantiates a correction. Renaming allies changes the explanation, not decisions.
const reinforcement = mutate();
reinforcement.diagnosis.primaryProblem.evidence = []; reinforcement.diagnosis.coherence.gaps = [];
reinforcement.picks = [{ role: "support", champion: "Compañero de prueba", strengths: "Engage · Teamfight" }];
const reinforced = explainFinalRecommendation(reinforcement).candidates.find(c => c.role !== "support");
assert.equal(reinforced.justification.effect.kind, "reinforcement");
assert.equal(reinforced.justification.beneficiaries[0].champion, "Compañero de prueba");
assert.ok(!reinforced.justification.beneficiaries.some(ally => ally.role === reinforced.role));
const frozen = structuredClone(example);
function freeze(value) { if (value && typeof value === "object") { Object.values(value).forEach(freeze); Object.freeze(value); } return value; }
assert.deepEqual(explainFinalRecommendation(freeze(frozen)), explainFinalRecommendation(example));
console.log(`Justificaciones finales v3.13: ${explanationCases.length} equipos, ${explained} candidatos y ${beneficiaries} relaciones; cambios de prioridad deliberados.`);
