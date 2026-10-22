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
    diagnosis,
    optimizer,
    recommendations,
    candidatesByRole,
    selectedChampions: picks.map((item) => item.champion),
    currentPicks: picks,
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
    assert.ok(profile.candidates.every((item) => Object.keys(roleSheets).includes(item.role) && !("score" in item) && !("affinity" in item)), "Cada candidato indica una posición válida del catálogo sin puntuaciones internas");
    assert.ok(profile.candidates.every((item) => item.reason.length < 120), "Las justificaciones deben ser breves");
  }
  assert.deepEqual(result.profiles.map((item) => item.priority), [...result.profiles.map((item) => item.priority)].sort((a, b) => a - b));
}

const clear = composition({ top: "Ornn", jungle: "Sejuani", mid: "Orianna", botline: "Jinx", support: "Lulu" });
const clearEvaluation = evaluate(clear);
assert.equal(clearEvaluation.diagnosis.plan.primaryIdentity, "Front to Back");
verify(clearEvaluation.result);
assert.equal(clearEvaluation.result.composition.status, "complete");
assert.equal(clearEvaluation.result.composition.picks.length, 5);
assert.ok(clearEvaluation.result.profiles.every((profile) => Object.values(profile.alternativesByRole).every((items) => items.length <= 3)),
  "El mapeo conserva una reserva breve de alternativas por rol para optimizar el equipo completo");
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
    diagnosis: evaluation.diagnosis,
    optimizer: evaluation.optimizer,
    recommendations: evaluation.recommendations,
    candidatesByRole,
    selectedChampions: evaluation.picks.map((item) => item.champion),
    currentPicks: evaluation.picks,
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
assert.ok(!variedNames.some((name) => name.toLowerCase() === "alpha"),
  "Un nombre con distinta capitalización no resuelve un empate de posiciones sin evidencia");

const explicitSignals = mapCandidates({
  optimizer: { status: "prioritized" },
  recommendations: { status: "recommended", profiles: [
    { id: "engage", label: "Iniciación", improves: "la entrada" },
    { id: "disengage", label: "Desenganche", improves: "la retirada" },
    { id: "frontline", label: "Frente", improves: "el frente propio" },
  ] },
  candidatesByRole: { mid: [
    { champion: "Counter only", identity: "Poke", strengths: "Anti-engage · Anti-frontline" },
    { champion: "Both tools", identity: "Teamfight", strengths: "Engage · Anti-engage · Frontline" },
    { champion: "Initiator", identity: "Dive", strengths: "Engage · Iniciación · Frontline" },
    { champion: "Protector", identity: "Front to Back", strengths: "Peel · Frontline" },
    { champion: "Substring only", identity: "Poke", strengths: "Reengagement" },
  ] },
});
for (const profile of explicitSignals.profiles) {
  const names = profile.candidates.map((item) => item.champion);
  assert.ok(!names.includes("Substring only"), "Una subcadena no acredita una señal estratégica");
  assert.equal(names.includes("Counter only"), profile.id === "disengage",
    "Anti-engage acredita retirada, no iniciación; anti-frontline no acredita frente propio");
  assert.ok(names.includes("Both tools"), "Una capacidad explícita sigue siendo válida si también existe su contra");
}
assert.equal(explicitSignals.profiles.length, 3);

const compositionAware = mapCandidates({
  diagnosis: {
    plan: { primaryIdentity: "Front to Back", secondaryIdentity: "" },
    winCondition: { primary: { identity: "Front to Back" } },
    winConditionCoherence: { status: "coherent" },
    contradictions: { status: "coherent", identities: [] },
  },
  optimizer: { status: "prioritized", priority: { need: { id: "frontToBack", label: "Juego frontal" } } },
  recommendations: { status: "recommended", plan: { primaryIdentity: "Front to Back" }, profiles: [{ id: "frontToBack", label: "Juego frontal", priority: 1, reason: "Sostener el plan.", improves: "la ejecución frontal" }] },
  candidatesByRole: {
    top: [
      { champion: "Context Fit", identity: "Front to Back", strengths: "Frontline" },
      { champion: "Catalog Fit", identity: "Poke", strengths: "Frontline · DPS", function: "Front to Back" },
    ],
    jungle: [{ champion: "DPS Option", identity: "Mage", strengths: "DPS" }],
    mid: [{ champion: "Frontline Option", identity: "Tank", strengths: "Frontline" }],
  },
});
assert.equal(compositionAware.profiles[0].candidates[0].champion, "Context Fit",
  "La identidad del equipo debe pesar más que una ventaja genérica de señales en el catálogo");
assert.ok(compositionAware.profiles[0].candidates.some((candidate) => candidate.champion === "Catalog Fit"),
  "El contexto debe ordenar candidatos compatibles sin eliminar alternativas relevantes");

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
