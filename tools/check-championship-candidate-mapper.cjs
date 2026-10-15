#!/usr/bin/env node
"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const XLSX = require("../vendor/xlsx.full.min.js");
const { diagnoseComposition } = require("../src/domain/diagnostic-engine.js");
const { proposeCorrections } = require("../src/domain/correction-engine.js");
const { optimizeComposition } = require("../src/domain/composition-optimizer.js");
const { recommendProfiles } = require("../src/domain/strategic-recommendation-engine.js");
const { mapCandidates } = require("../src/domain/championship-candidate-mapper.js");

const root = path.resolve(__dirname, "..");
const workbook = XLSX.read(fs.readFileSync(path.join(root, "Draft Pool.xlsx")), { type: "buffer" });
const roleSheets = {
  top: "Tabla Top",
  jungle: "Tabla Jungla",
  mid: "Tabla Mid",
  botline: "Tabla Botline",
  support: "Tabla Support",
};

function rows(role) {
  return XLSX.utils.sheet_to_json(workbook.Sheets[roleSheets[role]], { defval: "" });
}

function pick(role, champion) {
  const row = rows(role).find((item) => item["Campeón"] === champion);
  assert.ok(row, `${champion} debe existir para ${role}`);
  return {
    role,
    champion,
    identity: row["Identidad"],
    function: row["Función"],
    tempo: row["Ritmo"],
    strengths: row["Fortalezas"],
    weaknesses: row["Debilidades"],
  };
}

function composition(selection) {
  return Object.entries(selection).map(([role, champion]) => pick(role, champion));
}

const candidatesByRole = Object.fromEntries(Object.keys(roleSheets).map((role) => [
  role,
  rows(role).map((row) => ({
    champion: row["Campeón"],
    identity: row["Identidad"],
    function: row["Función"],
    tempo: row["Ritmo"],
    strengths: row["Fortalezas"],
    weaknesses: row["Debilidades"],
  })),
]));

function evaluate(picks) {
  const diagnosis = diagnoseComposition(picks);
  const correction = proposeCorrections({ picks, diagnosis, candidatesByRole });
  const optimizer = optimizeComposition({ diagnosis, correction });
  const recommendations = recommendProfiles({ diagnosis, optimizer });
  const result = mapCandidates({
    optimizer,
    recommendations,
    candidatesByRole,
    selectedChampions: picks.map((item) => item.champion),
  });
  return { picks, diagnosis, optimizer, recommendations, result };
}

function verify(result) {
  assert.equal(result.status, "mapped");
  assert.ok(result.profiles.length > 0);
  assert.ok(result.profiles.every((profile) => profile.id && profile.label && profile.reason && profile.improves));
  for (const profile of result.profiles) {
    assert.ok(profile.candidates.length >= 2 && profile.candidates.length <= 4, `${profile.id} devuelve entre 2 y 4 candidatos`);
    assert.deepEqual(profile.candidates.map((item) => item.priority), profile.candidates.map((_, index) => index + 1));
    assert.equal(new Set(profile.candidates.map((item) => item.champion)).size, profile.candidates.length, "No se repiten campeones dentro del perfil");
    assert.ok(profile.candidates.every((item) => item.reason && item.improves === profile.improves));
    assert.ok(profile.candidates.every((item) => item.identity && item.strengths.length && Array.isArray(item.weaknesses)));
    assert.ok(profile.candidates.every((item) => item.signals.length && item.matchedFields.length));
    assert.ok(profile.candidates.every((item) => !("role" in item) && !("score" in item) && !("affinity" in item)));
    assert.ok(profile.candidates.every((item) => item.reason.length < 120), "Las justificaciones deben ser breves");
  }
  assert.deepEqual(result.profiles.map((item) => item.priority), [...result.profiles.map((item) => item.priority)].sort((a, b) => a - b));
}

const clear = composition({ top: "Ornn", jungle: "Sejuani", mid: "Orianna", botline: "Jinx", support: "Lulu" });
const clearEvaluation = evaluate(clear);
assert.equal(clearEvaluation.diagnosis.plan.primaryIdentity, "Front to Back");
verify(clearEvaluation.result);
assert.ok(clearEvaluation.result.profiles.flatMap((profile) => profile.candidates)
  .every((candidate) => !clear.some((pick) => pick.champion === candidate.champion)), "No se recomiendan campeones ya elegidos");
assert.ok(clearEvaluation.result.profiles.every((profile) => clearEvaluation.recommendations.profiles.some((recommended) => recommended.id === profile.id)));

const hybrid = composition({ top: "Camille", jungle: "Vi", mid: "Ahri", botline: "Kai'Sa", support: "Rakan" });
const hybridEvaluation = evaluate(hybrid);
assert.equal(hybridEvaluation.diagnosis.coherence.status, "hybrid");
verify(hybridEvaluation.result);

const incoherent = [
  pick("top", "Fiora"),
  pick("jungle", "Elise"),
  pick("mid", "Xerath"),
  pick("botline", "Draven"),
  pick("support", "Lulu"),
];
const incoherentEvaluation = evaluate(incoherent);
assert.equal(incoherentEvaluation.diagnosis.coherence.status, "incoherent");
verify(incoherentEvaluation.result);

for (const evaluation of [clearEvaluation, hybridEvaluation, incoherentEvaluation]) {
  const repeated = mapCandidates({
    optimizer: evaluation.optimizer,
    recommendations: evaluation.recommendations,
    candidatesByRole,
    selectedChampions: evaluation.picks.map((item) => item.champion),
  });
  assert.deepEqual(repeated, evaluation.result, "El mapeo debe ser determinista");
}

const varied = mapCandidates({
  optimizer: { status: "prioritized", priority: { need: { id: "pick", label: "Pick" } } },
  recommendations: {
    status: "recommended",
    profiles: [{ id: "pick", label: "Pick", priority: 1, reason: "Abrir una ventaja.", improves: "la capacidad de encontrar objetivos aislados" }],
  },
  candidatesByRole: {
    top: [{ champion: "Alpha", identity: "Assassin", function: "Pick", strengths: "Ganks · Pick" }],
    jungle: [{ champion: "Beta", identity: "Assassin", function: "Pick", strengths: "Ganks · Pick" }],
    mid: [{ champion: "Gamma", identity: "Mage", function: "Pick", strengths: "Roams · Ganks" }],
    botline: [{ champion: "Delta", identity: "Marksman", function: "Pick", strengths: "Roams · Ganks" }],
    support: [
      { champion: "Epsilon", identity: "Support", function: "Pick", strengths: "Roams · Pick" },
      { champion: "alpha", identity: "Assassin", function: "Pick", strengths: "Ganks · Pick" },
    ],
  },
});
assert.equal(varied.status, "mapped");
assert.equal(varied.profiles[0].candidates.length, 3);
const variedNames = varied.profiles[0].candidates.map((candidate) => candidate.champion);
assert.ok(variedNames.some((name) => ["Alpha", "Beta"].includes(name)));
assert.ok(variedNames.some((name) => ["Gamma", "Delta"].includes(name)));
assert.ok(!(variedNames.includes("Alpha") && variedNames.includes("Beta")), "No conserva dos candidatos prácticamente equivalentes");
assert.ok(!(variedNames.includes("Gamma") && variedNames.includes("Delta")), "La lista evita duplicar el mismo perfil funcional");
assert.equal(new Set(variedNames.map((name) => name.toLocaleLowerCase("es"))).size, variedNames.length,
  "Un campeón disponible en varias posiciones solo aparece una vez");
const selectedAlpha = mapCandidates({
  optimizer: { status: "prioritized", priority: { need: { id: "pick", label: "Pick" } } },
  recommendations: { status: "recommended", profiles: [{ id: "pick", label: "Pick", priority: 1, reason: "Abrir una ventaja.", improves: "encontrar objetivos" }] },
  selectedChampions: ["alpha"],
  candidatesByRole: {
    top: [{ champion: "Alpha", identity: "Assassin", function: "Pick", strengths: "Ganks · Pick" }],
    jungle: [{ champion: "Beta", identity: "Assassin", function: "Pick", strengths: "Ganks · Pick" }],
    mid: [{ champion: "Gamma", identity: "Mage", function: "Pick", strengths: "Roams · Ganks" }],
    botline: [{ champion: "Delta", identity: "Marksman", function: "Pick", strengths: "Roams · Ganks" }],
    support: [{ champion: "Epsilon", identity: "Support", function: "Pick", strengths: "Roams · Pick" }],
  },
});
assert.ok(selectedAlpha.profiles.flatMap((profile) => profile.candidates).every((candidate) => candidate.champion !== "Alpha"),
  "La exclusión de picks ignora mayúsculas y minúsculas");

assert.deepEqual(mapCandidates({ optimizer: { status: "no-priority" } }), { status: "no-priority", profiles: [] });
assert.deepEqual(mapCandidates({ optimizer: clearEvaluation.optimizer, recommendations: { status: "none" } }), { status: "no-profiles", profiles: [] });
assert.deepEqual(mapCandidates({ optimizer: clearEvaluation.optimizer, recommendations: clearEvaluation.recommendations, candidatesByRole: {} }), { status: "no-candidates", profiles: [] });
assert.deepEqual(mapCandidates({
  optimizer: clearEvaluation.optimizer,
  recommendations: { status: "recommended", profiles: [{ id: "unknown", label: "Desconocido", priority: 1, reason: "", improves: "" }] },
  candidatesByRole,
}), { status: "no-matching-candidates", profiles: [] });

console.log("Championship Candidate Mapper validado: candidatos no seleccionados, priorización por evidencia, variedad, determinismo y casos sin datos.");
