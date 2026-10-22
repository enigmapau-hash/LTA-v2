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

function evaluate(picks) {
  const diagnosis = diagnoseComposition(picks);
  const correction = proposeCorrections({ picks, diagnosis, candidatesByRole });
  const optimizer = optimizeComposition({ diagnosis, correction });
  const recommendations = recommendProfiles({ diagnosis, optimizer });
  const mappedCandidates = mapCandidates({ diagnosis, optimizer, recommendations, candidatesByRole });
  const result = evaluateCandidates({ diagnosis, optimizer, recommendations, mappedCandidates });
  return { diagnosis, optimizer, recommendations, mappedCandidates, result };
}

function verify(evaluation) {
  const { result, recommendations } = evaluation;
  assert.equal(result.status, "evaluated");
  assert.ok(result.profiles.length > 0);
  assert.deepEqual(result.profiles.map((profile) => profile.id), evaluation.mappedCandidates.profiles
    .filter((profile) => recommendations.profiles.some((item) => item.id === profile.id))
    .map((profile) => profile.id));
  for (const profile of result.profiles) {
    assert.ok(profile.candidates.length >= 2 && profile.candidates.length <= 4);
    assert.ok(profile.candidates.every((item, index) => item.priority === index + 1));
    assert.ok(profile.candidates.every((item) => item.champion && item.reason));
    assert.ok(profile.candidates.every((item) => Array.isArray(item.strengths) && item.strengths.length));
    assert.ok(profile.candidates.every((item) => Array.isArray(item.limitations)));
    assert.ok(profile.candidates.every((item) => !("score" in item) && !("probability" in item)));
    assert.ok(profile.candidates.every((item) => Object.keys(roleSheets).includes(item.role)), "La evaluación conserva el rol avalado por el catálogo");
  }
  assert.deepEqual(evaluateCandidates({
    diagnosis: evaluation.diagnosis,
    optimizer: evaluation.optimizer,
    recommendations: evaluation.recommendations,
    mappedCandidates: evaluation.mappedCandidates,
  }), result, "La evaluación debe ser determinista");
}

const frontToBack = evaluate(composition({
  top: "Ornn", jungle: "Sejuani", mid: "Orianna", botline: "Jinx", support: "Lulu",
}));
assert.equal(frontToBack.diagnosis.plan.primaryIdentity, "Front to Back");
verify(frontToBack);
const scaling = frontToBack.result.profiles.find((profile) => profile.id === "scaling");
assert.ok(scaling?.candidates.some((candidate) => /Front to Back/i.test(candidate.reason)));
assert.ok(scaling.candidates.every((candidate) => candidate.strengths.length));

const dive = evaluate(composition({
  top: "Camille", jungle: "Vi", mid: "Ahri", botline: "Kai'Sa", support: "Rakan",
}));
assert.equal(dive.diagnosis.winCondition.primary.identity, "Dive");
verify(dive);
assert.ok(dive.result.profiles.some((profile) => profile.candidates.some((candidate) => /Dive/i.test(candidate.reason))));

const incoherent = evaluate([
  pick("top", "Fiora"),
  pick("jungle", "Elise"),
  pick("mid", "Xerath"),
  pick("botline", "Draven"),
  pick("support", "Lulu"),
]);
assert.equal(incoherent.diagnosis.coherence.status, "incoherent");
verify(incoherent);
assert.ok(incoherent.result.profiles
  .flatMap((profile) => profile.candidates)
  .some((candidate) => candidate.limitations.includes("El plan global carece de una identidad principal clara.")));

const contradictionDiagnosis = {
  status: "assessed",
  plan: { primaryIdentity: "Poke", secondaryIdentity: "Dive" },
  coherence: { status: "contradictory" },
  contradictions: { status: "contradictory", identities: ["Dive", "Poke"] },
  winCondition: { primary: { identity: "Poke" } },
};
const conflictResult = evaluateCandidates({
  diagnosis: contradictionDiagnosis,
  optimizer: { status: "prioritized", priority: { need: { id: "frontline" } } },
  recommendations: { status: "recommended", profiles: [{ id: "engage" }] },
  mappedCandidates: {
    status: "mapped",
    profiles: [{
      id: "engage",
      label: "Iniciación",
      priority: 1,
      reason: "Responde a la necesidad prioritaria.",
      improves: "el acceso inicial",
      candidates: [
        { champion: "Camille", priority: 1, reason: "Aporta engage.", improves: "el acceso", identity: "⚔️ Engage", strengths: ["Engage"], weaknesses: [] },
        { champion: "Ornn", priority: 2, reason: "Aporta frontline.", improves: "el acceso", identity: "🛡️ Front to Back", strengths: ["Frontline"], weaknesses: [] },
      ],
    }],
  },
});
assert.equal(conflictResult.status, "evaluated");
assert.deepEqual(conflictResult.profiles[0].candidates.map((candidate) => candidate.champion), ["Ornn", "Camille"]);
assert.match(conflictResult.profiles[0].candidates[1].reason, /reforzar Dive, en conflicto con Poke/);
assert.ok(conflictResult.profiles[0].candidates[1].limitations.length);

const winConditionConflict = evaluateCandidates({
  diagnosis: {
    ...contradictionDiagnosis,
    plan: { primaryIdentity: "Poke", secondaryIdentity: "" },
    coherence: { status: "coherent" },
    contradictions: { status: "coherent", identities: [] },
    winCondition: { primary: { identity: "Dive" } },
    winConditionCoherence: { status: "contradictory" },
  },
  optimizer: { status: "prioritized" },
  recommendations: { status: "recommended", profiles: [{ id: "engage" }] },
  mappedCandidates: {
    status: "mapped",
    profiles: [{
      id: "engage",
      label: "Iniciación",
      priority: 1,
      reason: "Responde a la necesidad prioritaria.",
      improves: "el acceso inicial",
      candidates: [
        { champion: "Camille", priority: 1, reason: "Aporta Dive.", improves: "el acceso", identity: "⚔️ Dive", strengths: ["Dive"], weaknesses: [] },
        { champion: "Xerath", priority: 2, reason: "Aporta Poke.", improves: "el acceso", identity: "Poke", strengths: ["Poke"], weaknesses: [] },
      ],
    }],
  },
});
assert.deepEqual(
  winConditionConflict.profiles[0].candidates.map((candidate) => candidate.champion),
  ["Xerath", "Camille"],
  "Una win condition contradictoria no debe imponerse sobre la identidad principal del plan"
);

const evidenceInput = {
  diagnosis: {
    status: "assessed",
    plan: { primaryIdentity: "Front to Back", secondaryIdentity: "Poke" },
    coherence: { status: "coherent" },
    contradictions: { status: "coherent", identities: [] },
    winCondition: { primary: { identity: "Front to Back" } },
  },
  optimizer: { status: "prioritized", priority: { need: { id: "frontline" } } },
  recommendations: { status: "recommended", profiles: [{ id: "frontline" }] },
  mappedCandidates: {
    status: "mapped",
    profiles: [{
      id: "frontline", label: "Frontline", priority: 1, reason: "Sostener la línea.", improves: "el espacio para ejecutar el plan",
      candidates: [
        { champion: "Poca evidencia", priority: 1, reason: "Encaja con frontline.", improves: "el espacio", identity: "Mage", strengths: ["DPS"], weaknesses: [], signals: ["frontline"], matchedFields: ["strengths"] },
        { champion: "Más evidencia", priority: 2, reason: "Encaja con frontline.", improves: "el espacio", identity: "Mage", strengths: ["Frontline", "Peel"], weaknesses: [], signals: ["frontline", "peel"], matchedFields: ["strengths", "function"] },
        { champion: "Plan alineado", priority: 3, reason: "Encaja con frontline.", improves: "el espacio", identity: "Front to Back", strengths: ["Frontline"], weaknesses: [], signals: ["frontline"], matchedFields: ["strengths"] },
      ],
    }],
  },
};
const evidencePriority = evaluateCandidates(evidenceInput);
assert.deepEqual(evidencePriority.profiles[0].candidates.map((candidate) => candidate.champion), [
  "Plan alineado", "Más evidencia", "Poca evidencia",
], "La prioridad combina alineación estratégica y evidencia de atributos");
assert.match(evidencePriority.profiles[0].candidates[0].reason, /Apoya Front to Back y refuerza/);
assert.match(evidencePriority.profiles[0].candidates[1].reason, /Aporta frontline y peel/);
assert.deepEqual(evaluateCandidates(evidenceInput), evidencePriority, "La valoración y las justificaciones deben ser deterministas");

assert.deepEqual(evaluateCandidates({ optimizer: { status: "no-priority" } }), { status: "no-priority", profiles: [] });
assert.deepEqual(evaluateCandidates({ optimizer: { status: "prioritized" }, recommendations: { status: "recommended" } }), { status: "no-candidates", profiles: [] });

console.log("Candidate Evaluator validado: alineación con identidad y win condition, cautela ante contradicciones, fortalezas, limitaciones y determinismo.");
