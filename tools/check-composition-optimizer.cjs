#!/usr/bin/env node
"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const XLSX = require("../vendor/xlsx.full.min.js");
const { diagnoseComposition } = require("../src/domain/diagnostic-engine.js");
const { proposeCorrections } = require("../src/domain/correction-engine.js");
const { optimizeComposition } = require("../src/domain/composition-optimizer.js");

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
  return { diagnosis, correction };
}

function verifyPriority(result, expectedNeed, expectedProblem) {
  assert.equal(result.status, "prioritized");
  assert.deepEqual(Object.keys(result.priority), ["need", "reason", "reinforces", "problemAvoided"]);
  assert.equal(result.priority.need.id, expectedNeed);
  assert.ok(result.priority.need.label);
  assert.ok(result.priority.reason);
  assert.equal(result.priority.reinforces, result.priority.need.label);
  assert.equal(result.priority.problemAvoided, expectedProblem);
  assert.doesNotMatch(JSON.stringify(result), /champion|role|candidates/i);
}

const clear = composition({ top: "Camille", jungle: "Vi", mid: "Ahri", botline: "Kai'Sa", support: "Rakan" });
const clearInputs = evaluate(clear);
assert.deepEqual(optimizeComposition(clearInputs), { status: "no-priority", priority: null });
const hybrid = composition({ top: "Ornn", jungle: "Sejuani", mid: "Orianna", botline: "Jinx", support: "Lulu" });
const hybridInputs = evaluate(hybrid);
assert.equal(hybridInputs.diagnosis.coherence.status, "hybrid");
assert.deepEqual(optimizeComposition(hybridInputs), { status: "no-priority", priority: null });

const poke = composition({ top: "Jayce", jungle: "Nidalee", mid: "Xerath", botline: "Ezreal", support: "Vel'Koz" });
const pokeInputs = evaluate(poke);
const pokeOptimizer = optimizeComposition(pokeInputs);
verifyPriority(pokeOptimizer, "peel", "protección para los carries");

const incoherent = [pick("top", "Fiora"), pick("jungle", "Elise"), pick("mid", "Xerath"), pick("botline", "Draven"), pick("support", "Lulu")];
const incoherentInputs = evaluate(incoherent);
verifyPriority(optimizeComposition(incoherentInputs), "engage", "iniciación compartida");
assert.deepEqual(optimizeComposition({ diagnosis: { status: "not-assessable" }, correction: pokeInputs.correction }), { status: "not-assessable", priority: null });
assert.deepEqual(optimizeComposition(pokeInputs), pokeOptimizer, "Resultado determinista");

console.log("Composition Optimizer validado: planes claros, híbridos, incoherentes, prioridad única y determinismo.");
