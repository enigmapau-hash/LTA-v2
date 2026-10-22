#!/usr/bin/env node
"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const XLSX = require("../vendor/xlsx.full.min.js");
const { diagnoseComposition } = require("../src/domain/diagnostic-engine.js");
const { proposeCorrections } = require("../src/domain/correction-engine.js");
const { protectComposition } = require("../src/domain/protection-engine.js");
const { optimizeComposition } = require("../src/domain/composition-optimizer.js");
const { recommendProfiles } = require("../src/domain/strategic-recommendation-engine.js");
const { mapCandidates } = require("../src/domain/championship-candidate-mapper.js");
const { evaluateCandidates } = require("../src/domain/candidate-evaluator.js");
const { presentRecommendations } = require("../src/domain/strategic-recommendation-presenter.js");
const { presentForReport } = require("../src/report/strategic-recommendation-presenter-integration.js");
const { polishRecommendation } = require("../src/domain/strategic-recommendation-polisher.js");
const { optimizeStrategicComposition } = require("../src/domain/strategic-composition-optimizer.js");
const { recomposeStrategicTeam } = require("../src/domain/strategic-team-recomposer.js");
const { assessStrategicRisks } = require("../src/domain/strategic-risk-analyzer.js");
const { buildStrategicReport } = require("../src/report/strategic-report.js");

const root = path.resolve(__dirname, "..");
const workbook = XLSX.read(fs.readFileSync(path.join(root, "Draft Pool.xlsx")), { type: "buffer" });
const roleSheets = { top: "Tabla Top", jungle: "Tabla Jungla", mid: "Tabla Mid", botline: "Tabla Botline", support: "Tabla Support" };
const rows = (role) => XLSX.utils.sheet_to_json(workbook.Sheets[roleSheets[role]], { defval: "" });
const candidatesByRole = Object.fromEntries(Object.keys(roleSheets).map((role) => [role, rows(role).map((row) => ({
  champion: row["Campeón"], identity: row["Identidad"], function: row["Función"], tempo: row["Ritmo"], strengths: row["Fortalezas"], weaknesses: row["Debilidades"],
}))]));

function pick(role, champion) {
  const row = rows(role).find((item) => item["Campeón"] === champion);
  assert.ok(row, `${champion} debe existir para ${role}`);
  return { role, champion, identity: row["Identidad"], function: row["Función"], tempo: row["Ritmo"], strengths: row["Fortalezas"], weaknesses: row["Debilidades"] };
}

function analyze(selection) {
  const picks = Object.entries(selection).map(([role, champion]) => pick(role, champion));
  const diagnosis = diagnoseComposition(picks);
  const correction = proposeCorrections({ picks, diagnosis, candidatesByRole });
  const protection = protectComposition({ diagnosis, correction });
  const optimizer = optimizeComposition({ diagnosis, correction });
  const recommendations = recommendProfiles({ diagnosis, optimizer });
  const mappedCandidates = mapCandidates({ optimizer, recommendations, candidatesByRole, selectedChampions: picks.map((item) => item.champion), currentPicks: picks });
  const evaluatedCandidates = evaluateCandidates({ diagnosis, optimizer, recommendations, mappedCandidates });
  const presentation = presentRecommendations({ optimizer, recommendations, mappedCandidates, evaluatedCandidates });
  const integration = presentForReport({ optimizer, recommendations, mappedCandidates, evaluatedCandidates, presentation });
  const polished = polishRecommendation({ optimizer, recommendations, mappedCandidates, evaluatedCandidates, presentation, integration });
  const strategicCompositionOptimization = optimizeStrategicComposition({ optimizer, recommendations, mappedCandidates, evaluatedCandidates, presentation, integration, polished });
  const teamRecomposition = recomposeStrategicTeam({ optimizer, recommendations, mappedCandidates, evaluatedCandidates, presentation, integration, polished });
  const inputs = { optimizer, recommendations, mappedCandidates, evaluatedCandidates, presentation, integration, polished, strategicCompositionOptimization, teamRecomposition };
  const strategicRisks = assessStrategicRisks(inputs);
  const report = buildStrategicReport({
    diagnosis,
    correction,
    protection,
    recommendation: polished.section,
    compositionOptimization: strategicCompositionOptimization,
    teamRecomposition,
    strategicRisks,
  });
  return { diagnosis, inputs, strategicRisks, report };
}

function verifyPriorities(result) {
  assert.equal(result.status, "assessed");
  assert.ok(result.risks.length <= 2, "El análisis limita los hallazgos a riesgos sustentados por señales disponibles");
  assert.deepEqual(result.risks.map((risk) => risk.priority), result.risks.map((_, index) => index + 1));
  assert.ok(result.risks.every((risk) => risk.type && ["alta", "media", "baja"].includes(risk.severity)
    && risk.threatens && risk.explanation && risk.explanation.length < 180));
}

const clear = analyze({ top: "Ornn", jungle: "Sejuani", mid: "Orianna", botline: "Jinx", support: "Lulu" });
assert.equal(clear.diagnosis.plan.primaryIdentity, "Front to Back");
assert.deepEqual(clear.strategicRisks, { status: "no-priority", risks: [] });
const hybrid = analyze({ top: "Camille", jungle: "Vi", mid: "Ahri", botline: "Kai'Sa", support: "Rakan" });
assert.equal(hybrid.diagnosis.coherence.status, "hybrid");
assert.deepEqual(hybrid.strategicRisks, { status: "no-priority", risks: [] });
const incoherent = analyze({ top: "Fiora", jungle: "Elise", mid: "Xerath", botline: "Draven", support: "Lulu" });
assert.equal(incoherent.diagnosis.coherence.status, "incoherent");
verifyPriorities(incoherent.strategicRisks);
if (incoherent.inputs.teamRecomposition.status === "recomposed"
  && incoherent.inputs.teamRecomposition.proposal.identity.status === "unconfirmed") {
  assert.ok(incoherent.strategicRisks.risks.some(risk => risk.type === "identity-unconfirmed" && risk.severity === "alta"));
} else {
  assert.ok(!incoherent.strategicRisks.risks.some(risk => risk.type === "identity-unconfirmed"));
}
const primaryProfileId = incoherent.inputs.recommendations.profiles[0].id;
const uncoveredInput = structuredClone(incoherent.inputs);
for (const pick of uncoveredInput.mappedCandidates.composition.picks) pick.fitByProfile[primaryProfileId] = { signals: [], matchedFields: [] };
const uncovered = assessStrategicRisks(uncoveredInput);
assert.equal(uncovered.risks[0].type, "priority-uncovered");
assert.equal(uncovered.risks[0].severity, "alta");

const dependentInput = structuredClone(incoherent.inputs);
for (const pick of dependentInput.mappedCandidates.composition.picks) pick.fitByProfile[primaryProfileId] = { signals: [], matchedFields: [] };
dependentInput.mappedCandidates.composition.picks[1].fitByProfile[primaryProfileId] = { signals: ["engage"], matchedFields: ["strengths"] };
const dependent = assessStrategicRisks(dependentInput);
assert.equal(dependent.risks[0].type, "single-point-dependency");
assert.equal(dependent.risks[0].severity, "media");
assert.match(dependent.risks[0].explanation, /Elise/);

const bothRisksInput = structuredClone(uncoveredInput);
bothRisksInput.teamRecomposition = { status: "recomposed", proposal: { identity: { status: "unconfirmed" } } };
const prioritized = assessStrategicRisks(bothRisksInput);
assert.deepEqual(prioritized.risks.map((risk) => risk.type), ["identity-unconfirmed", "priority-uncovered"]);
assert.deepEqual(prioritized.risks.map((risk) => risk.priority), [1, 2], "El orden mantiene severidad y desempate deterministas");
assert.deepEqual(assessStrategicRisks(structuredClone(bothRisksInput)), prioritized, "La priorización no cambia entre ejecuciones");

for (const count of [1, 4]) {
  const incomplete = structuredClone(incoherent.inputs);
  incomplete.mappedCandidates.composition = { status: "incomplete", picks: incomplete.mappedCandidates.composition.picks.slice(0, count) };
  assert.deepEqual(assessStrategicRisks(incomplete), { status: "pending", risks: [] }, `Con ${count} picks el análisis queda pendiente`);
}
assert.deepEqual(assessStrategicRisks({ optimizer: { status: "no-priority" } }), { status: "no-priority", risks: [] });

assert.deepEqual(clear.report.sections.map((section) => section.id), ["diagnosis", "correction", "protection"],
  "La integración interna no añade bloques visibles al informe");
assert.equal(clear.report.strategicRisks, undefined, "La abstención no inventa riesgos de una prioridad inexistente");
assert.deepEqual(incoherent.report.strategicRisks, incoherent.strategicRisks, "Los riesgos reales se conservan como metadato interno");
assert.ok(!clear.report.sections.some((section) => section.risks), "Los riesgos no se muestran como una lista nueva");

console.log("Strategic Risk Analyzer validado: planes claros, híbridos e incoherentes, equipos incompletos, severidad, priorización, determinismo e integración interna.");
