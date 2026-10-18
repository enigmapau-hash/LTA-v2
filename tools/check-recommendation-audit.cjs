#!/usr/bin/env node
"use strict";

const assert = require("node:assert/strict");
const { REPRESENTATIVE_COMPOSITIONS } = require("./recommendation-audit-fixtures.cjs");
const { loadCandidateCatalog, auditRecommendations, renderMarkdown } = require("./recommendation-audit.cjs");

const catalog = loadCandidateCatalog();
const snapshot = structuredClone(catalog);
const first = auditRecommendations(catalog);
const second = auditRecommendations(catalog);

assert.deepEqual(catalog, snapshot, "La auditoría no modifica el catálogo ni los atributos de origen");
assert.deepEqual(first, second, "Los resultados agregados deben ser deterministas");
assert.equal(first.cases.length, REPRESENTATIVE_COMPOSITIONS.length);
assert.deepEqual(first.cases.map((item) => item.id), REPRESENTATIVE_COMPOSITIONS.map((item) => item.id));
assert.ok(first.cases.every((item) => item.diagnosis === "assessed"), "Todos los fixtures completos deben poder diagnosticarse");
assert.ok(first.cases.every((item) => ["recommended", "no-priority", "not-assessable"].includes(item.recommendationStatus)));
assert.ok(first.metrics.recommendedCaseCount > 0, "Al menos una composición debe producir recomendaciones");
for (const identity of ["Front to Back", "Dive", "Pick", "Poke", "Split Push", "Teamfight", "Escalado", "Early Game"]) {
  assert.ok(first.cases.some((item) => item.identity === identity), "El conjunto debe representar " + identity);
}
assert.ok(first.cases.some((item) => item.coherence === "hybrid"), "Incluye una composición híbrida");
assert.ok(first.cases.some((item) => item.coherence === "incoherent"), "Incluye una composición incoherente");
assert.ok(first.metrics.recommendationCoverage >= 0 && first.metrics.recommendationCoverage <= 1);
assert.ok(first.metrics.championDiversity >= 0 && first.metrics.championDiversity <= 1);
assert.ok(first.metrics.profileRoleCoverage >= 0 && first.metrics.profileRoleCoverage <= 1);
assert.equal(first.metrics.compositionCount, 10);
assert.ok(first.metrics.totalCandidateMentions < 83, "Quality Pass 1 debe reducir menciones redundantes frente a la línea base");
assert.ok(first.metrics.championDiversity > 0.386, "Quality Pass 1 debe aumentar la diversidad frente a la línea base");
assert.ok(first.metrics.similarPairCount < 7, "Quality Pass 1 debe reducir pares de composiciones con alta coincidencia");
assert.ok(first.champions[0].cases < 5, "Ningún campeón debe repetirse tanto como el máximo de la línea base");

for (const item of first.cases) {
  const selected = new Set(REPRESENTATIVE_COMPOSITIONS.find((fixture) => fixture.id === item.id)
    .picks && Object.values(REPRESENTATIVE_COMPOSITIONS.find((fixture) => fixture.id === item.id).picks)
      .map((name) => name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es")));
  for (const mention of item.mentions) {
    assert.equal(selected.has(mention.champion.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es")), false,
      "No cuenta como candidato a un campeón ya seleccionado: " + item.label + "/" + mention.champion);
  }
  assert.deepEqual(item.champions, [...new Set(item.mentions.map((mention) => mention.champion
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es")))].sort());
}

assert.deepEqual(first.champions, [...first.champions].sort((left, right) => right.cases - left.cases
  || right.mentions - left.mentions
  || left.champion.localeCompare(right.champion, "es")), "La frecuencia tiene un orden estable");
assert.ok(first.repeatedChampions.every((item) => item.cases >= first.thresholds.repeatedChampionCases));
assert.ok(first.similarPairs.every((pair) => pair.shared >= first.thresholds.pairSharedChampions
  && pair.overlap >= first.thresholds.pairJaccard));
assert.equal(renderMarkdown(first), renderMarkdown(second), "El informe Markdown debe ser idéntico entre ejecuciones");
assert.match(renderMarkdown(first), /Metodología[\s\S]*Métricas[\s\S]*Limitaciones[\s\S]*Cómo interpretar/);
assert.match(renderMarkdown(first), /Comparación con la línea base anterior al Quality Pass 1/);
assert.match(renderMarkdown(first), /38\.6% \| 55\.4% \| \+16\.8 p\.p\./,
  "El informe conserva la comparación de diversidad antes/después");

const noRecommendations = auditRecommendations(Object.fromEntries(Object.keys(catalog).map((role) => [
  role,
  catalog[role].map((champion) => ({ ...champion, strengths: "", function: "", tempo: "", identity: "" })),
])));
assert.deepEqual(auditRecommendations(Object.fromEntries(Object.keys(catalog).map((role) => [
  role,
  catalog[role].map((champion) => ({ ...champion, strengths: "", function: "", tempo: "", identity: "" })),
]))), noRecommendations, "El estado sin señales mantiene la salida determinista");

console.log("Recommendation Audit validada: fixtures del catálogo, exclusión de picks propios, cobertura, diversidad, repetición y Markdown deterministas.");
