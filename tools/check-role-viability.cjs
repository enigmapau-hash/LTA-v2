#!/usr/bin/env node
"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const XLSX = require("../vendor/xlsx.full.min.js");
const viability = require("../src/data/role-viability-26-21.js");
const { mapCandidates } = require("../src/domain/championship-candidate-mapper.js");

const root = path.resolve(__dirname, "..");
const sheetNames = {
  top: "Tabla Top", jungle: "Tabla Jungla", mid: "Tabla Mid",
  botline: "Tabla Botline", support: "Tabla Support",
};
const workbook = XLSX.read(fs.readFileSync(path.join(root, "Draft Pool.xlsx")), { type: "buffer" });
const catalog = Object.fromEntries(Object.entries(sheetNames).map(([role, sheet]) => [
  role, XLSX.utils.sheet_to_json(workbook.Sheets[sheet], { defval: "" })
    .filter((row) => row["Campeón"])
    .map((row) => ({
      champion: String(row["Campeón"]),
      identity: String(row["Identidad"]),
      function: String(row["Función"]),
      tempo: String(row["Ritmo"]),
      strengths: String(row["Fortalezas"]),
      weaknesses: String(row["Debilidades"]),
    })),
]));

const pairs = viability.candidatesForReview(catalog);
assert.equal(viability.PATCH, "26.21");
assert.equal(pairs.length, 266, "Todas las parejas del workbook tienen una evaluación, aunque no haya evidencia externa");
assert.deepEqual(Object.keys(catalog), Object.keys(sheetNames));
assert.ok(pairs.every((item) => item.patch === "26.21"
  && ["principal", "compatible", "secundaria", "descartada", "habitual", "situacional", "experimental", "sin-verificar"].includes(item.status)));
assert.ok(pairs.every((item) => item.status !== "sin-verificar"),
  "El catálogo queda clasificado por fuentes fechadas o por criterio manual identificado");

const sourceKeys = new Set(pairs.map((item) => `${item.champion.toLocaleLowerCase("es")}|${item.role}`));
for (const item of viability.evidence) {
  assert.ok(sourceKeys.has(`${item.champion.toLocaleLowerCase("es")}|${item.role}`), "Evidencia solo de parejas reales: " + item.champion);
  assert.match(item.source, /^https:\/\//);
  assert.equal(item.patch, undefined, "La versión del parche se fija en una sola constante");
  assert.ok(item.games > 0, "La muestra publicada está identificada");
}
assert.equal(viability.assess("Diana", "top").status, "experimental");
assert.equal(viability.assess("Diana", "mid").status, "principal");
assert.equal(viability.assess("Diana", "jungle").status, "principal");
assert.equal(viability.assess("Viego", "jungle").status, "habitual",
  "Viego JUNGLA está confirmado manualmente, sin afirmar que el respaldo sea estadístico");
assert.equal(viability.assess("Smolder", "top").status, "secundaria");
assert.equal(viability.assess("Smolder", "botline").status, "compatible");
assert.equal(viability.assess("Unverified Champion", "top").status, "sin-verificar");
assert.equal(viability.assess("Unverified Champion", "top").source, null, "Sin evidencia no se inventa fuente");

const make = (champion, identity = "Teamfight") => ({
  champion, identity, function: "Duelista", tempo: "Mid",
  strengths: champion === "Viego" ? "Iniciación · Teamfight" : "Engage · Teamfight",
  weaknesses: "Alcance corto",
});
const candidateCatalog = {
  top: [make("Diana"), make("Viego", "Front to Back"), make("Flexible")],
  jungle: [make("Diana"), make("Viego", "Front to Back"), make("Flexible")],
  mid: [make("Diana"), make("MidUnique", "Pick")],
  botline: [make("BotUnique", "Front to Back")],
  support: [make("SupportUnique", "Pick")],
};
const inputs = {
  optimizer: { status: "prioritized" },
  recommendations: { status: "recommended", profiles: [{
    id: "engage", label: "Iniciación", priority: 1,
    reason: "Necesita una entrada", improves: "entrada inicial",
  }] },
  candidatesByRole: candidateCatalog,
};
const first = mapCandidates(inputs);
assert.equal(first.status, "mapped");
const recommended = first.profiles[0].candidates;
assert.ok(recommended.every((item) => item.role !== "top" || item.champion !== "Diana"),
  "Diana TOP experimental nunca se recomienda aunque aparezca en el Excel");
assert.ok(!recommended.some((item) => item.champion === "Flexible"),
  "Cuando dos posiciones no verificadas son idénticas se abstiene, sin preferir TOP");
assert.ok(recommended.some((item) => item.champion === "Diana" && ["mid", "jungle"].includes(item.role)),
  "Se propone Diana en posición respaldada cuando sus señales lo justifican");
assert.ok(recommended.every((item) => item.viabilityStatus && (!item.viabilityPatch || item.viabilityPatch === "16.21")),
  "La versión del corte se atribuye solo cuando la fuente la proporciona");
assert.ok(!first.profiles[0].alternativesByRole.top.some((item) => item.champion === "Diana"),
  "La recomposición tampoco puede proponer la posición experimental");
assert.ok(first.profiles[0].alternativesByRole.jungle.some((item) => item.champion === "Viego"),
  "La posición habitual permanece disponible para recomposición");
assert.deepEqual(mapCandidates(inputs), first, "La prioridad por rol es determinista y local");

const renamedInputs = structuredClone(inputs);
renamedInputs.candidatesByRole.jungle.find((item) => item.champion === "Flexible").champion = "flexible";
assert.ok(!mapCandidates(renamedInputs).profiles[0].candidates.some((item) => item.champion.toLowerCase() === "flexible"),
  "Las mayúsculas del nombre no son evidencia para desempatar posiciones sin verificar");
const reorderedInputs = { ...inputs, candidatesByRole: Object.fromEntries(
  Object.entries(candidateCatalog).reverse().map(([role, items]) => [role, [...items].reverse()])
) };
assert.deepEqual(mapCandidates(reorderedInputs), first,
  "La selección no depende del orden de los roles ni del catálogo");

console.log("Viabilidad por rol 26.21 validada: 266 parejas, evidencia explícita, sin inventar etiquetas, no TOP automático, sin bloquear el draft.");
