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
const { adviseCounterplay } = require("../src/domain/strategic-counterplay-advisor.js");
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
  const strategicRisks = assessStrategicRisks({
    optimizer, recommendations, mappedCandidates, evaluatedCandidates, presentation, integration, polished,
    strategicCompositionOptimization, teamRecomposition,
  });
  const riskInputs = {
    optimizer, recommendations, mappedCandidates, evaluatedCandidates, presentation, integration, polished,
    strategicCompositionOptimization, teamRecomposition,
  };
  const strategicCounterplay = adviseCounterplay({ strategicRisks });
  const report = buildStrategicReport({ diagnosis, correction, protection, strategicRisks, strategicCounterplay });
  return { diagnosis, mappedCandidates, riskInputs, strategicRisks, strategicCounterplay, report };
}

function assertAdvisedShape(result) {
  assert.equal(result.status, "advised");
  assert.ok(result.threats.length <= 3);
  assert.deepEqual(result.threats.map((threat) => threat.priority), result.threats.map((_, index) => index + 1));
  assert.ok(result.threats.every((threat) => threat.type && threat.style && ["alta", "media", "baja"].includes(threat.severity)
    && threat.threatens && threat.explanation && threat.protection));
  assert.equal(JSON.stringify(result).includes("impact"), false, "No filtra puntuaciones del análisis de riesgos");
}

for (const [name, selection, expectedCoherence] of [
  ["clara", { top: "Olaf", jungle: "Zyra", mid: "Heimerdinger", botline: "Lucian", support: "Tahm Kench" }, "coherent"],
  ["híbrida", { top: "Camille", jungle: "Vi", mid: "Ahri", botline: "Kai'Sa", support: "Rakan" }, "hybrid"],
  ["incoherente", { top: "Fiora", jungle: "Elise", mid: "Xerath", botline: "Draven", support: "Lulu" }, "incoherent"],
]) {
  const result = analyze(selection);
  assert.equal(result.diagnosis.coherence.status, expectedCoherence, `La referencia ${name} debe conservar su clasificación`);
  assert.equal(result.strategicCounterplay.status, result.strategicRisks.status === "no-priority" ? "no-priority" : result.strategicRisks.risks.length ? "advised" : "no-supported-threat");
  if (result.strategicCounterplay.status === "advised") assertAdvisedShape(result.strategicCounterplay);
  assert.deepEqual(adviseCounterplay({ strategicRisks: result.strategicRisks }), result.strategicCounterplay, `La recomendación ${name} debe ser determinista`);
}

const sourceRisks = {
  status: "assessed",
  risks: [
    { priority: 2, type: "single-point-dependency", severity: "media", threatens: "la continuidad de la iniciación" },
    { priority: 1, type: "identity-unconfirmed", severity: "alta", threatens: "la coordinación del plan común" },
    { priority: 3, type: "priority-uncovered", severity: "alta", threatens: "la presión lateral" },
  ],
};
const sourceSnapshot = structuredClone(sourceRisks);
const counterplay = adviseCounterplay({ strategicRisks: sourceRisks });
assertAdvisedShape(counterplay);
assert.deepEqual(counterplay.threats.map((threat) => threat.type), ["forced-engage", "objective-contest", "focused-dive"]);
assert.deepEqual(counterplay.threats.map((threat) => threat.priority), [1, 2, 3]);
assert.deepEqual(sourceRisks, sourceSnapshot, "El advisor no modifica los riesgos recibidos");
assert.deepEqual(adviseCounterplay({ strategicRisks: sourceRisks }), counterplay, "El orden y el texto se mantienen entre ejecuciones");

assert.deepEqual(adviseCounterplay({ strategicRisks: { status: "assessed", risks: [] } }), { status: "no-supported-threat", threats: [] });
assert.deepEqual(adviseCounterplay({ strategicRisks: { status: "pending", risks: [] } }), { status: "pending", threats: [] });
assert.deepEqual(adviseCounterplay({ strategicRisks: { status: "not-assessable", risks: [] } }), { status: "not-assessable", threats: [] });
assert.deepEqual(adviseCounterplay({ strategicRisks: { status: "assessed", risks: [{ type: "unknown", severity: "alta", threatens: "algo" }] } }), { status: "no-supported-threat", threats: [] });

const completeForPartialState = analyze({ top: "Fiora", jungle: "Elise", mid: "Xerath", botline: "Draven", support: "Lulu" });
const incompleteInputs = structuredClone(completeForPartialState.riskInputs);
incompleteInputs.mappedCandidates.composition = {
  status: "incomplete",
  picks: incompleteInputs.mappedCandidates.composition.picks.slice(0, 4),
};
const incompleteRisks = assessStrategicRisks(incompleteInputs);
assert.equal(incompleteRisks.status, "pending");
assert.deepEqual(adviseCounterplay({ strategicRisks: incompleteRisks }), { status: "pending", threats: [] }, "Con composición incompleta no inventa amenazas");

const clear = analyze({ top: "Ornn", jungle: "Sejuani", mid: "Orianna", botline: "Jinx", support: "Lulu" });
const counterplayReport = buildStrategicReport({
  diagnosis: clear.diagnosis,
  strategicRisks: sourceRisks,
  strategicCounterplay: counterplay,
});
assert.deepEqual(counterplayReport.sections.map((section) => section.id), clear.report.sections.map((section) => section.id), "No añade secciones al informe visible");
assert.deepEqual(counterplayReport.strategicCounterplay, counterplay, "El informe conserva la salida para su integración futura");
assert.equal(JSON.stringify(counterplayReport.sections).includes("objective-contest"), false, "No filtra la salida interna a los bloques visibles");

console.log("Strategic Counterplay Advisor validado: composiciones claras, híbridas e incoherentes, estado incompleto, amenazas, severidad, orden estable, determinismo e integración interna.");
