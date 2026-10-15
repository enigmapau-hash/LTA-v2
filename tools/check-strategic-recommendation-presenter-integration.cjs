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
const { presentForReport } = require("../src/report/strategic-recommendation-presenter-integration.js");
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

function reportFor(selection) {
  const picks = Object.entries(selection).map(([role, champion]) => pick(role, champion));
  const diagnosis = diagnoseComposition(picks);
  const correction = proposeCorrections({ picks, diagnosis, candidatesByRole });
  const protection = protectComposition({ diagnosis, correction });
  const optimizer = optimizeComposition({ diagnosis, correction });
  const recommendations = recommendProfiles({ diagnosis, optimizer });
  const mappedCandidates = mapCandidates({ optimizer, recommendations, candidatesByRole });
  const evaluatedCandidates = evaluateCandidates({ diagnosis, optimizer, recommendations, mappedCandidates });
  const recommendation = presentForReport({ optimizer, recommendations, mappedCandidates, evaluatedCandidates });
  return buildStrategicReport({ diagnosis, correction, protection, recommendation: recommendation.section });
}

const selection = { top: "Ornn", jungle: "Sejuani", mid: "Orianna", botline: "Jinx", support: "Lulu" };
const report = reportFor(selection);
assert.equal(report.status, "assessed");
assert.deepEqual(report.sections.map((section) => section.id), ["diagnosis", "correction", "protection"], "La recomendación ocupa el bloque de mejora existente");
const recommendation = report.sections[1];
assert.equal(recommendation.title, "Recomendación estratégica");
assert.match(recommendation.answer, /Necesidad: .+ · Perfil: .+/);
assert.ok(recommendation.explanation);
assert.ok(recommendation.improves);
assert.ok(recommendation.candidates.length >= 2 && recommendation.candidates.length <= 4);
assert.ok(recommendation.candidates.every((candidate) => candidate.champion && candidate.reason));
assert.ok(recommendation.candidates.every((candidate) => candidate.strengths.length <= 2 && candidate.limitations.length <= 1));
assert.deepEqual(reportFor(selection), report, "La salida visible es determinista");

const noRecommendation = buildStrategicReport({ diagnosis: { status: "not-assessable" } });
assert.equal(noRecommendation.sections.length, 3);
assert.equal(noRecommendation.sections[1].title, "Corrección", "El informe conserva el bloque anterior si no hay recomendación disponible");
assert.deepEqual(presentForReport({ optimizer: { status: "no-priority" } }), { status: "no-priority", section: null });

console.log("Integración visible de recomendaciones validada: necesidad, perfil, candidatos priorizados, concisión y respaldo del bloque anterior.");
