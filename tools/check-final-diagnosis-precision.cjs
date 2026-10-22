#!/usr/bin/env node
"use strict";

const assert = require("node:assert/strict");
const { analyzeComposition } = require("../src/domain/composition-engine.js");
const { diagnoseComposition } = require("../src/domain/diagnostic-engine.js");
const { loadCandidateCatalog } = require("./recommendation-audit.cjs");
const { generateRepresentativeCompositions } = require("./recommendation-audit-fixtures.cjs");
const { resolvePicks, sampleTeams } = require("./draft-strategic-fit-scenarios.cjs");

const VARIANTS = [
  { id: "poke-unprotected", primary: "Poke", secondary: null,
    picks: { top: "Jayce", jungle: "Nidalee", mid: "Xerath", botline: "Ezreal", support: "Vel'Koz" },
    reason: "Poke y asedio explícitos, sin protección registrada; Anti-frontline no es un frente propio." },
  { id: "poke-protected", primary: "Poke", secondary: "Front to Back",
    picks: { top: "Jayce", jungle: "Gragas", mid: "Xerath", botline: "Ezreal", support: "Karma" },
    reason: "Se conserva el desgaste principal y la vía de protección respaldada por Peel." },
  { id: "poke-peel-substitution", primary: "Poke", secondary: "Front to Back",
    picks: { top: "Jayce", jungle: "Nidalee", mid: "Xerath", botline: "Ezreal", support: "Karma" },
    reason: "Solo cambia el support respecto a poke-unprotected: Peel permite acreditar la vía protegida." },
  { id: "scaling-unprotected", primary: "Escalado", secondary: null,
    picks: { top: "Kayle", jungle: "Karthus", mid: "Azir", botline: "Jinx", support: "Sona" },
    reason: "Late y DPS no acreditan por sí solos protección de los carries." },
  { id: "scaling-frontline", primary: "Escalado", secondary: "Front to Back",
    picks: { top: "Sion", jungle: "Karthus", mid: "Azir", botline: "Jinx", support: "Sona" },
    reason: "Una sustitución añade Frontline; no se exige un campeón con la etiqueta Peel." },
  { id: "dive-teamfight", primary: "Dive", secondary: "Teamfight",
    picks: { top: "Camille", jungle: "Wukong", mid: "Yasuo", botline: "Miss Fortune", support: "Rell" },
    reason: "Camille añade Backline al mismo núcleo de iniciación y seguimiento de Teamfight." },
  { id: "contradictory", primary: "Poke", secondary: "Dive",
    picks: { top: "Ambessa", jungle: "Evelynn", mid: "Ziggs", botline: "Tristana", support: "Heimerdinger" },
    reason: "Se conserva el conflicto real entre desgaste y acceso a la backline; no se oculta con umbrales más altos." },
  { id: "equivalent-frontline", primary: "Front to Back", secondary: "Escalado",
    picks: { top: "Cho'Gath", jungle: "Sejuani", mid: "Orianna", botline: "Jinx", support: "Lulu" },
    reason: "Cho'Gath conserva el frente y el plan; sus otras señales pueden cambiar la vía secundaria." },
  { id: "equivalent-protection", primary: "Front to Back", secondary: "Teamfight",
    picks: { top: "Ornn", jungle: "Sejuani", mid: "Orianna", botline: "Jinx", support: "Milio" },
    reason: "Milio mantiene Peel y la protección del carry, sin forzar cambios de identidad." },
  { id: "timing-change", primary: "Escalado", secondary: "Front to Back",
    picks: { top: "Ornn", jungle: "Karthus", mid: "Orianna", botline: "Jinx", support: "Lulu" },
    reason: "Karthus sustituye la iniciación de Sejuani por más Late/DPS; permanece una vía protegida de peleas." },
  { id: "flanking-evidence", primary: "Teamfight", secondary: "Dive",
    picks: { top: "Illaoi", jungle: "Darius", mid: "Qiyana", botline: "Kalista", support: "Xerath" },
    reason: "Flanqueo también acredita acceso: no se exige literalmente el término Backline." },
  { id: "anti-engage-evidence", primary: "Escalado", secondary: "Front to Back",
    picks: { top: "Ryze", jungle: "Zyra", mid: "Ekko", botline: "Zeri", support: "Renata Glasc" },
    reason: "Anti-engage es protección ya descrita en el SKF; no se exige literalmente Peel." },
];

function precisionCases(catalog) {
  return [...generateRepresentativeCompositions(catalog).map((item) => ({
    ...item,
    primary: item.expectedIdentity,
    secondary: item.id === "teamfight" ? null : undefined,
  })), ...VARIANTS.map((item) => ({ ...item, picks: resolvePicks(item.picks, catalog) }))];
}

function main() {
  const catalog = loadCandidateCatalog();
  const cases = precisionCases(catalog);
  const snapshot = structuredClone(cases);
  for (const item of cases) {
    const diagnosis = diagnoseComposition(item.picks);
    const analysis = analyzeComposition(item.picks);
    assert.equal(diagnosis.plan.primaryIdentity, item.primary, item.id);
    if (item.secondary !== undefined) assert.equal(diagnosis.plan.secondaryIdentity, item.secondary, item.reason || item.id);
    assert.equal(diagnosis.plan.secondaryIdentity, analysis.identity.secondary);
    assert.equal(diagnosis.winCondition.primary?.identity || null, item.primary);
    assert.equal(diagnosis.winCondition.secondary?.identity || null, analysis.identity.secondary);
    assert.equal(diagnosis.winCondition.primary?.condition || null, analysis.winCondition);
    assert.deepEqual(diagnosis, diagnoseComposition(item.picks), "Diagnóstico determinista");
    assert.deepEqual(analyzeComposition(item.picks).identity, analyzeComposition([...item.picks].reverse()).identity);
  }
  const teamfight = diagnoseComposition(cases.find((item) => item.id === "teamfight").picks);
  assert.equal(teamfight.coherence.status, "coherent");
  assert.equal(teamfight.winConditionCoherence.status, "fully-coherent");
  const hybrid = diagnoseComposition(cases.find((item) => item.id === "hybrid").picks);
  assert.equal(hybrid.coherence.status, "hybrid");
  assert.equal(hybrid.plan.secondaryIdentity, "Teamfight");
  const conflict = diagnoseComposition(cases.find((item) => item.id === "contradictory").picks);
  assert.equal(conflict.contradictions.status, "contradictory");
  assert.equal(conflict.winConditionCoherence.status, "contradictory");

  // Contrato de evidencia mínima, no un objetivo de frecuencia de híbridos.
  const explicit = (picks, terms) => picks.some((pick) => terms.some((term) =>
    new RegExp(`(^|[^a-z0-9-])${term}($|[^a-z0-9-])`, "i").test(pick.strengths)));
  for (const picks of [...cases.map((item) => item.picks), ...sampleTeams(catalog)]) {
    const secondary = analyzeComposition(picks).identity.secondary;
    if (secondary === "Front to Back") assert.ok(explicit(picks, ["frontline", "peel", "anti-engage"]));
    if (secondary === "Dive") assert.ok(explicit(picks, ["backline", "acceso al carry", "flanqueo"]));
  }
  assert.deepEqual(cases, snapshot);
  console.log(`Final diagnosis precision: ${cases.length} referencias/variantes y 32 equipos independientes; identidad, vías secundarias, contradicciones y win conditions coherentes.`);
}

if (require.main === module) main();
module.exports = { precisionCases };
