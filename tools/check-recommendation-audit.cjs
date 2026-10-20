#!/usr/bin/env node
"use strict";

const assert = require("node:assert/strict");
const { REPRESENTATIVE_COMPOSITIONS } = require("./recommendation-audit-fixtures.cjs");
const { loadCandidateCatalog, auditRecommendations, auditDraftRecommendations, renderMarkdown } = require("./recommendation-audit.cjs");

const catalog = loadCandidateCatalog();
const snapshot = structuredClone(catalog);
const first = auditRecommendations(catalog);
const second = auditRecommendations(catalog);
const firstDraft = auditDraftRecommendations(catalog);
const secondDraft = auditDraftRecommendations(catalog);

assert.deepEqual(catalog, snapshot, "La auditoría no modifica el catálogo ni los atributos de origen");
assert.deepEqual(first, second, "Los resultados agregados deben ser deterministas");
assert.deepEqual(firstDraft, secondDraft, "La auditoría de draft debe ser determinista");
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
assert.equal(first.metrics.referenceIdentityMatchCount, 10, "La expansión conserva las identidades esperadas de los fixtures");
assert.equal(first.metrics.referenceIdentityFidelity, 1);
assert.equal(first.metrics.archetypeCandidateCoverage, 1);
assert.equal(first.metrics.distinctArchetypesCovered, 8);
assert.equal(first.metrics.archetypeRolePairs, 39, "Desgaste amplía la cobertura Poke a jungle usando una etiqueta ya existente");
assert.equal(first.metrics.profileCandidateCoverage, 1, "Cada campeón del catálogo debe estar relacionado con algún perfil");
assert.equal(first.metrics.distinctProfilesCovered, 13);
assert.equal(first.metrics.profileRoleKnowledgePairs, 64, "La auditoría registra la cobertura perfil/rol del catálogo");
assert.equal(first.metrics.totalCandidateMentions, 57);
assert.equal(first.metrics.uniqueRecommendedChampions, 32);
assert.equal(first.metrics.championDiversity, 0.561);
assert.equal(first.metrics.similarPairCount, 2, "La expansión no debe afirmar una caída de coincidencias no observada");
assert.ok(first.metrics.totalCandidateMentions < 83, "Quality Pass 1 debe reducir menciones redundantes frente a la línea base");
assert.ok(first.metrics.championDiversity > 0.386, "Quality Pass 1 debe aumentar la diversidad frente a la línea base");
assert.ok(first.metrics.similarPairCount < 7, "Quality Pass 1 debe reducir pares de composiciones con alta coincidencia");
assert.ok(first.champions[0].cases < 5, "Ningún campeón debe repetirse tanto como el máximo de la línea base");

assert.equal(firstDraft.stages.length, 40, "La auditoría incluye estados de 1, 2, 3 y 4 picks para cada fixture");
assert.deepEqual(firstDraft.stages.map((item) => item.count).slice(0, 4), [1, 2, 3, 4]);
assert.equal(firstDraft.metrics.totalCandidateMentions, 300, "Evalúa tres candidatos por cada rol vacío en los 40 estados");
assert.equal(firstDraft.metrics.recommendationCoverage, 1, "Todos los roles pendientes de los estados auditados deben recibir candidatos");
const firstFrontToBackStage = firstDraft.stages.find((stage) => stage.fixtureId === "front-to-back" && stage.count === 1);
assert.equal(firstFrontToBackStage.identity, "Front to Back");
assert.equal(firstFrontToBackStage.secondaryIdentity, null, "Un solo pick no debe producir una identidad secundaria especulativa");
assert.ok(firstDraft.metrics.championDiversity > 0.22, "Quality Pass 2 debe aumentar la diversidad durante el draft");
assert.ok(firstDraft.metrics.repetitionRate < 0.403, "Quality Pass 2 debe reducir las menciones dominadas por campeones repetidos");
assert.ok(firstDraft.metrics.contextAdaptation > 0.765, "Las recomendaciones deben alinearse más con la identidad emergente");
assert.ok(firstDraft.metrics.recommendationChangeRate >= 0.6, "Las listas deben responder a una proporción sustancial de los picks añadidos");
assert.ok(firstDraft.metrics.recommendationStability > 0.618, "Las alternativas deben mantener más continuidad cuando la identidad no cambia");
assert.ok(firstDraft.metrics.secondaryIdentityRate <= 0.4, "Una identidad secundaria requiere evidencia compartida por varias piezas");
assert.ok(firstDraft.metrics.identityStability >= (22 / 27), "El refinamiento no debe reducir la estabilidad de la identidad principal");
assert.equal(firstDraft.metrics.distinctCategories, 8, "La calibración conserva el uso de las ocho categorías estratégicas del corpus");
assert.ok(firstDraft.metrics.categoryCounts.Escalado >= 13, "El contexto de draft debe conservar recomendaciones para composiciones de escalado");
assert.ok(firstDraft.metrics.contextAlignment >= 0.972, "La dirección recomendada debe seguir alineada con la identidad emergente");
assert.ok(firstDraft.metrics.repetitionRate < 0.403, "La repetición debe seguir por debajo de la línea base previa a QP2");
assert.ok(firstDraft.metrics.repetitionRate <= 0.363, "QP3 no debe aumentar la repetición respecto a QP2");
assert.ok(firstDraft.metrics.recommendationStability >= 0.821, "QP3 conserva la estabilidad de recomendaciones de QP2 cuando la identidad no cambia");
assert.ok(firstDraft.metrics.crossIdentityDifferentiation >= 0.972, "Composiciones con identidad distinta mantienen recomendaciones diferenciadas");
assert.equal(firstDraft.metrics.championDiversity, 0.243, "La nueva relación Poke no reduce la diversidad durante el draft");
assert.equal(firstDraft.metrics.repetitionRate, 0.363, "La nueva relación Poke mantiene la repetición del draft");
assert.equal(firstDraft.metrics.crossIdentityDifferentiation, 0.973, "La nueva relación Poke conserva y mejora levemente la diferenciación");
for (const stage of firstDraft.stages) {
  const selected = new Set(stage.selected.map((name) => name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es")));
  for (const items of Object.values(stage.roles)) {
    assert.equal(items.length, 3, "Cada rol vacío conserva tres candidatos");
    for (const item of items) {
      assert.equal(selected.has(item.champion.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es")), false,
        "La auditoría de draft no recomienda picks ya seleccionados");
    }
  }
}

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
assert.equal(renderMarkdown(first, firstDraft), renderMarkdown(second, secondDraft), "El informe Markdown debe ser idéntico entre ejecuciones");
assert.match(renderMarkdown(first, firstDraft), /Metodología[\s\S]*Métricas[\s\S]*Limitaciones[\s\S]*Cómo interpretar/);
assert.match(renderMarkdown(first, firstDraft), /Comparación con la línea base anterior al Quality Pass 1/);
assert.match(renderMarkdown(first, firstDraft), /Impacto de la expansión del conocimiento estratégico[\s\S]*Cobertura de perfiles\/rol del catálogo[\s\S]*Cobertura de arquetipos\/rol del catálogo/);
assert.match(renderMarkdown(first, firstDraft), /Impacto del conocimiento en el draft[\s\S]*Diferenciación entre identidades/);
assert.match(renderMarkdown(first, firstDraft), /Auditoría del draft[\s\S]*Comparación con la línea base anterior al Quality Pass 2/);
assert.match(renderMarkdown(first, firstDraft), /Comparación antes\/después del Quality Pass 3[\s\S]*Estabilidad de identidad principal[\s\S]*Uso de categorías después/);
assert.match(renderMarkdown(first, firstDraft), /38\.6% \| 56\.1% \| \+17\.5 p\.p\./,
  "El informe conserva la comparación de diversidad antes/después");

const noRecommendations = auditRecommendations(Object.fromEntries(Object.keys(catalog).map((role) => [
  role,
  catalog[role].map((champion) => ({ ...champion, strengths: "", function: "", tempo: "", identity: "" })),
])));
assert.deepEqual(auditRecommendations(Object.fromEntries(Object.keys(catalog).map((role) => [
  role,
  catalog[role].map((champion) => ({ ...champion, strengths: "", function: "", tempo: "", identity: "" })),
]))), noRecommendations, "El estado sin señales mantiene la salida determinista");

console.log("Recommendation Audit validada: fixtures completos y parciales, cobertura, adaptación, estabilidad, diversidad, repetición y Markdown deterministas.");
