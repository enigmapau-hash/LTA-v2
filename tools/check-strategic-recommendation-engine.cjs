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
  return { diagnosis, optimizer };
}

function verify(result, expectedProfiles) {
  assert.equal(result.status, "recommended");
  assert.ok(result.profiles.length >= 2 && result.profiles.length <= 4);
  assert.deepEqual(result.profiles.map((item) => item.id), expectedProfiles);
  assert.deepEqual(result.profiles.map((item) => item.priority), expectedProfiles.map((_, index) => index + 1));
  assert.ok(result.profiles.every((item) => item.label && item.reason && item.improves));
  assert.ok(result.profiles.every((item) => !("champion" in item) && !("role" in item)));
  assert.doesNotMatch(JSON.stringify(result), /Camille|Rakan|Ornn|Jinx|champion|candidates/i);
}

const clear = composition({ top: "Camille", jungle: "Vi", mid: "Ahri", botline: "Kai'Sa", support: "Rakan" });
const clearInputs = evaluate(clear);
const clearRecommendations = recommendProfiles(clearInputs);
assert.deepEqual(clearRecommendations, { status: "no-priority", profiles: [] });
const hybrid = composition({ top: "Ornn", jungle: "Sejuani", mid: "Orianna", botline: "Jinx", support: "Lulu" });
const hybridInputs = evaluate(hybrid);
assert.deepEqual(recommendProfiles(hybridInputs), { status: "no-priority", profiles: [] });
const poke = composition({ top: "Jayce", jungle: "Nidalee", mid: "Xerath", botline: "Ezreal", support: "Vel'Koz" });
const pokeInputs = evaluate(poke);
const pokeRecommendations = recommendProfiles(pokeInputs);
verify(pokeRecommendations, ["peel", "disengage"]);
const incoherent = [pick("top", "Fiora"), pick("jungle", "Elise"), pick("mid", "Xerath"), pick("botline", "Draven"), pick("support", "Lulu")];
const incoherentInputs = evaluate(incoherent);
verify(recommendProfiles(incoherentInputs), ["engage", "followUp"]);

const unavailableDiagnosis = recommendProfiles({
  diagnosis: { status: "not-assessed" },
  optimizer: clearInputs.optimizer,
});
assert.deepEqual(unavailableDiagnosis, { status: "not-assessable", profiles: [] });
assert.deepEqual(recommendProfiles({
  diagnosis: clearInputs.diagnosis,
  optimizer: { status: "no-priority", priority: null },
}), { status: "no-priority", profiles: [] });

assert.deepEqual(recommendProfiles(pokeInputs), pokeRecommendations, "La necesidad demostrada es determinista");
const needIds = ["engage", "frontline", "sustained-damage", "side-lane", "peel", "pick", "early-pressure", "scaling"];
for (const id of needIds) {
  const result = recommendProfiles({
    diagnosis: { status: "assessed", plan: { clear: false, primaryIdentity: null } },
    optimizer: { status: "prioritized", priority: { need: { id, label: id } } },
  });
  assert.ok(result.profiles.length >= 2 && result.profiles.length <= 4, `${id}: devuelve de 2 a 4 perfiles`);
}

console.log("Strategic Recommendation Engine validado: perfiles ordenados para planes claros, híbridos e incoherentes; ausencia de picks y determinismo.");
