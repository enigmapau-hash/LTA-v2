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
// Compare the complete pre-v3.11.1 chain against the v3.11.0 reference.
 // Only identity/explanation of an individual replacement may be corrected;
 // restore their legacy *claims* before hashing all other decisions.
function priorOptimizerClaims(state) {
  if (state.compositionOptimization?.status !== "optimized") return state;
  const proposal = state.compositionOptimization.proposal;
  const originalIdentity = String(state.recommendations?.plan?.primaryIdentity || "").trim();
  const candidate = (state.mappedCandidates?.profiles || [])
    .flatMap((profile) => profile.alternativesByRole?.[proposal.change.role] || [])
    .find((item) => item.champion === proposal.change.to);
  const candidateIdentity = String(candidate?.identity || "").trim() || null;
  return {
    ...state,
    compositionOptimization: {
      ...state.compositionOptimization,
      proposal: {
        ...proposal,
        identity: originalIdentity
          ? { status: "preserved", primary: originalIdentity, proposed: originalIdentity }
          : { status: "unconfirmed", primary: null, proposed: candidateIdentity },
        explanation: originalIdentity
          ? `Reemplaza la pieza menos alineada con ${proposal.profile.label.toLocaleLowerCase("es")} por una alternativa priorizada que conserva ${originalIdentity}.`
          : `Reemplaza la pieza menos alineada con ${proposal.profile.label.toLocaleLowerCase("es")}; la nueva identidad del equipo debe confirmarse con un análisis completo.`,
      },
    },
  };
}
const digest = createHash("sha256").update(JSON.stringify(snapshots.map(priorOptimizerClaims))).digest("hex");
// Captured against main b979e2a before adding any explanations; all decision fields,
// candidate positions/order, recommendations, replacements, risks and bans are covered.
assert.equal(digest, "371618db468bf9e142d5b958ad70e4e6b194d0d083985c90106c4035d40aa1e4", "Las decisiones completas de v3.10.0 permanecen idénticas");

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
for (const input of snapshots) {
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
    if (input.diagnosis.primaryProblem?.type === "identity-risk") {
      assert.notEqual(justification.effect?.kind, "correction",
        "La debilidad inherente a una identidad no prueba corrección real");
    }
    if (justification.effect?.kind === "correction") {
      assert.equal(justification.effect.evidence[0], detectedNeed);
      assert.ok([...input.diagnosis.primaryProblem.evidence, ...input.diagnosis.coherence.gaps].includes(detectedNeed));
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
assert.ok(explained > 10 && beneficiaries > 5, "Las justificaciones llegan a los casos existentes con evidencia de compañeros");

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
console.log(`Justificaciones finales validadas: ${fixtures.length} equipos, ${explained} candidatos, ${beneficiaries} relaciones; decisiones idénticas a v3.10.0.`);
