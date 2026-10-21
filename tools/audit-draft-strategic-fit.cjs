#!/usr/bin/env node
"use strict";

const assert = require("node:assert/strict");
const path = require("node:path");
const current = require("../src/domain/composition-engine.js");
const { loadCandidateCatalog, auditDraftRecommendations, auditRecommendations } = require("./recommendation-audit.cjs");
const { evaluateScenarios, sampleTeams } = require("./draft-strategic-fit-scenarios.cjs");

function independentMatrix(engine, catalog) {
  const mentions = [], transitions = [];
  let aligned = 0, assessable = 0, valid = 0, groups = 0;
  for (const team of sampleTeams(catalog)) {
    let previous;
    for (let size = 1; size <= 4; size++) {
      const picks = team.slice(0, size);
      const identity = engine.analyzeComposition(picks).identity.primary;
      const roles = engine.recommendPicks(picks, catalog);
      for (const [role, items] of Object.entries(roles)) {
        groups++;
        for (const item of items) {
          mentions.push(item.champion);
          if (catalog[role].some((p) => p.champion === item.champion) && !picks.some((p) => p.champion === item.champion)) valid++;
          if (identity) { assessable++; if (item.direction === identity) aligned++; }
        }
        if (previous?.roles[role]) {
          const prior = new Set(previous.roles[role].map((p) => p.champion));
          transitions.push({ stable: Boolean(identity && previous.identity === identity), overlap: items.filter((p) => prior.has(p.champion)).length / 3 });
        }
      }
      previous = { identity, roles };
    }
  }
  const stable = transitions.filter((item) => item.stable);
  const average = (items) => items.reduce((sum, item) => sum + item.overlap, 0) / (items.length || 1);
  return { stages: 128, groups, validRoleRate: valid / mentions.length,
    contextAlignment: aligned / assessable, recommendationStability: average(stable),
    stableTransitions: stable.length, recommendationChangeRate: transitions.filter((item) => item.overlap < 1).length / transitions.length,
    championDiversity: new Set(mentions).size / mentions.length,
    maxChampionMentions: Math.max(...[...new Set(mentions)].map((name) => mentions.filter((item) => item === name).length)) };
}

function main() {
  const baselinePath = process.argv[process.argv.indexOf("--baseline") + 1];
  if (!process.argv.includes("--baseline") || !baselinePath) throw new Error("Uso: node tools/audit-draft-strategic-fit.cjs --baseline <composition-engine-base.cjs>");
  const before = require(path.resolve(baselinePath));
  const catalog = loadCandidateCatalog();
  const oldScenarios = evaluateScenarios(before, catalog), newScenarios = evaluateScenarios(current, catalog);
  const oldDraft = auditDraftRecommendations(catalog, before), newDraft = auditDraftRecommendations(catalog, current);
  for (const team of sampleTeams(catalog)) {
    assert.deepEqual(current.analyzeComposition(team), before.analyzeComposition(team), "Regresión en análisis de equipo completo");
    assert.deepEqual(current.recommendPicks(team, catalog), {});
  }
  const final = auditRecommendations(catalog);
  const oldIndependent = independentMatrix(before, catalog), newIndependent = independentMatrix(current, catalog);
  const lines = ["# Strategic Fit & Gap Coverage — comparación", "",
    "Base: main `31ce60a` (v3.4.0). Catálogo: `Draft Pool.xlsx` sin modificar. Las filas expresan hipótesis estratégicas, no predicciones de victoria ni campeones óptimos absolutos.", "",
    "## Escenarios y top 3", "", "Afinidad entre paréntesis. Las expectativas se validan por atributos del catálogo, sin fijar un ganador nominal.", "",
    "| Escenario / picks | Expectativa | Antes | Después |", "| --- | --- | --- | --- |"];
  const top = (items) => items.map((p) => `${p.champion} (${p.affinity})`).join("; ");
  newScenarios.forEach((scenario, index) => lines.push(`| ${scenario.id}: ${Object.values(scenario.picks).join(", ")} → ${scenario.role} | ${scenario.expectation} | ${top(oldScenarios[index].top)} | ${top(scenario.top)} |`));
  function table(title, oldMetrics, newMetrics, keys) {
    lines.push("", `## ${title}`, "", "| Métrica | Antes | Después |", "| --- | ---: | ---: |");
    for (const key of keys) lines.push(`| ${key} | ${format(oldMetrics[key])} | ${format(newMetrics[key])} |`);
  }
  function format(value) { return Number.isInteger(value) ? String(value) : Number(value.toFixed(3)).toString(); }
  table("Auditoría existente: 40 estados, 300 menciones", oldDraft.metrics, newDraft.metrics,
    ["recommendationCoverage", "contextAlignment", "recommendationStability", "recommendationChangeRate", "crossIdentityDifferentiation", "championDiversity", "repetitionRate", "maxChampionContexts"]);
  table("Matriz ampliada existente", oldDraft.scenarioMatrix.metrics, newDraft.scenarioMatrix.metrics,
    ["orderStability", "sameIdentityOrderStability", "equivalentRecommendationStability", "closePlanRecommendationDifferentiation", "opposingPlanRecommendationDifferentiation", "adaptationAfterIdentityChange", "materiallyDifferentAfterIdentityChange"]);
  table("Muestra independiente: 32 equipos, semilla 3400, 128 estados", oldIndependent, newIndependent,
    ["stages", "groups", "validRoleRate", "contextAlignment", "recommendationStability", "stableTransitions", "recommendationChangeRate", "championDiversity", "maxChampionMentions"]);
  lines.push("", "## Composiciones completas", "",
    `Análisis idéntico antes/después en los 32 equipos de la muestra. Cadena completa existente: ${final.metrics.referenceIdentityMatchCount}/${final.metrics.compositionCount} identidades de referencia, ${final.metrics.totalCandidateMentions} menciones y ${final.metrics.uniqueRecommendedChampions} candidatos distintos. Diagnóstico, correcciones y bans no se modifican.`, "",
    "## Reproducir", "", "Extraer `src/domain/composition-engine.js` del commit `31ce60a` a un archivo temporal `.cjs` y ejecutar:", "",
    "```sh", "node tools/audit-draft-strategic-fit.cjs --baseline /ruta/composition-engine-base.cjs", "node tools/check-draft-strategic-fit.cjs", "```", "",
    "Las proporciones miden el corpus, no calidad competitiva. La alineación por etiqueta puede considerar desalineada una herramienta útil; la estabilidad tampoco es un objetivo absoluto si cambia una necesidad. Revisar las regresiones y fuentes en `Draft-Strategic-Fit-Review.md`.");
  console.log(lines.join("\n"));
}

if (require.main === module) main();
module.exports = { independentMatrix };
