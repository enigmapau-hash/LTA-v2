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
const { evaluateCandidates } = require("../src/domain/candidate-evaluator.js");
const { presentRecommendations } = require("../src/domain/strategic-recommendation-presenter.js");

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
  assert.ok(row, champion + " debe existir para " + role);
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

function present(picks) {
  const diagnosis = diagnoseComposition(picks);
  const correction = proposeCorrections({ picks, diagnosis, candidatesByRole });
  const optimizer = optimizeComposition({ diagnosis, correction });
  const recommendations = recommendProfiles({ diagnosis, optimizer });
  const mappedCandidates = mapCandidates({ optimizer, recommendations, candidatesByRole });
  const evaluatedCandidates = evaluateCandidates({ diagnosis, optimizer, recommendations, mappedCandidates });
  const result = presentRecommendations({ optimizer, recommendations, mappedCandidates, evaluatedCandidates });
  return { diagnosis, optimizer, recommendations, mappedCandidates, evaluatedCandidates, result };
}

function verify(evaluation) {
  const { recommendations, mappedCandidates, evaluatedCandidates, result } = evaluation;
  assert.equal(result.status, "presented");
  assert.ok(result.primaryProfile);
  assert.equal(result.primaryProfile.id, recommendations.profiles[0].id);
  assert.equal(result.primaryProfile.priority, recommendations.profiles[0].priority);
  assert.ok(result.primaryProfile.reason);
  assert.ok(result.primaryProfile.improves);
  assert.ok(result.primaryProfile.candidates.length >= 2 && result.primaryProfile.candidates.length <= 4);
  assert.deepEqual(result.primaryProfile.candidates.map((candidate) => candidate.priority),
    result.primaryProfile.candidates.map((_, index) => index + 1));

  const mapped = mappedCandidates.profiles.find((profile) => profile.id === result.primaryProfile.id);
  const evaluated = evaluatedCandidates.profiles.find((profile) => profile.id === result.primaryProfile.id);
  assert.ok(mapped && evaluated);
  assert.ok(result.primaryProfile.candidates.every((candidate) =>
    mapped.candidates.some((mappedCandidate) => mappedCandidate.champion === candidate.champion)
    && evaluated.candidates.some((evaluatedCandidate) => evaluatedCandidate.champion === candidate.champion)));
  assert.ok(result.primaryProfile.candidates.every((candidate) => candidate.reason
    && Array.isArray(candidate.strengths) && Array.isArray(candidate.limitations)));
  assert.ok(result.compact.length < 240, "La presentación compacta debe ser breve");
  assert.ok(!("role" in result.primaryProfile) && !("score" in result.primaryProfile));
  assert.ok(result.primaryProfile.candidates.every((candidate) => Object.keys(roleSheets).includes(candidate.role) && !("score" in candidate)), "Se muestra el rol sin exponer puntuaciones");

  assert.deepEqual(presentRecommendations({
    optimizer: evaluation.optimizer,
    recommendations,
    mappedCandidates,
    evaluatedCandidates,
  }), result, "La presentación debe ser determinista");
}

const frontToBack = present(composition({
  top: "Ornn", jungle: "Sejuani", mid: "Orianna", botline: "Jinx", support: "Lulu",
}));
assert.equal(frontToBack.diagnosis.plan.primaryIdentity, "Front to Back");
verify(frontToBack);
assert.ok(frontToBack.result.compact.includes(frontToBack.optimizer.priority.need.label.toLocaleLowerCase("es")));
assert.ok(frontToBack.result.compact.includes(frontToBack.result.primaryProfile.label));
assert.ok(frontToBack.result.compact.includes(frontToBack.result.primaryProfile.improves));
assert.ok(frontToBack.result.primaryProfile.candidates.every((candidate) => frontToBack.result.compact.includes(candidate.champion)));

const dive = present(composition({
  top: "Camille", jungle: "Vi", mid: "Ahri", botline: "Kai'Sa", support: "Rakan",
}));
assert.equal(dive.diagnosis.winCondition.primary.identity, "Dive");
verify(dive);

const incoherent = present([
  pick("top", "Fiora"),
  pick("jungle", "Elise"),
  pick("mid", "Xerath"),
  pick("botline", "Draven"),
  pick("support", "Lulu"),
]);
assert.equal(incoherent.diagnosis.coherence.status, "incoherent");
verify(incoherent);

const base = {
  optimizer: { status: "prioritized", priority: { need: { id: "frontline", label: "sostener la primera línea" } } },
  recommendations: { status: "recommended", profiles: [{ id: "frontline", priority: 1, label: "Frontline", reason: "Sostiene el plan.", improves: "el espacio para ejecutar" }] },
  mappedCandidates: { status: "mapped", profiles: [{ id: "frontline", candidates: [{ champion: "Ornn" }] }] },
  evaluatedCandidates: { status: "evaluated", profiles: [{ id: "frontline", candidates: [{ champion: "Ornn", priority: 1, reason: "Refuerza la identidad.", strengths: [], limitations: [] }] }] },
};
assert.deepEqual(presentRecommendations({ ...base, optimizer: { status: "none" } }), {
  status: "no-priority", primaryProfile: null, compact: "",
});
assert.deepEqual(presentRecommendations({ ...base, evaluatedCandidates: { status: "no-candidates" } }), {
  status: "no-evaluated-candidates", primaryProfile: null, compact: "",
});
assert.equal(presentRecommendations({
  ...base,
  mappedCandidates: { status: "mapped", profiles: [{ id: "another", candidates: [] }] },
}).status, "no-presentable-profile");

console.log("Strategic Recommendation Presenter validado: perfil principal, candidatos evaluados, formato compacto, estados incompletos y determinismo.");
