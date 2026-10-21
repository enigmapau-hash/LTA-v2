#!/usr/bin/env node
"use strict";

const assert = require("node:assert/strict");
const engine = require("../src/domain/composition-engine.js");
const { loadCandidateCatalog } = require("./recommendation-audit.cjs");
const { evaluateScenarios, resolvePicks, sampleTeams } = require("./draft-strategic-fit-scenarios.cjs");
const catalog = loadCandidateCatalog();
const snapshot = structuredClone(catalog);
const scenarios = evaluateScenarios(engine, catalog);

for (const scenario of scenarios) {
  const options = (scenario.amongTopThree ? scenario.top : scenario.top.slice(0, 1))
    .map((item) => catalog[scenario.role].find((candidate) => candidate.champion === item.champion));
  const best = options[0];
  assert.ok(options.some((candidate) => (scenario.needs || []).every((term) => candidate.strengths.toLowerCase().includes(term))),
    `${scenario.id}: ${scenario.expectation}`);
  if (scenario.tempo) assert.ok(best.tempo.startsWith(scenario.tempo), scenario.expectation);
}

const exposed = scenarios.find((item) => item.id === "poke-exposed");
const protectedPoke = scenarios.find((item) => item.id === "poke-protected");
assert.equal(exposed.identity, protectedPoke.identity);
assert.notDeepEqual(exposed.top.map((p) => p.champion), protectedPoke.top.map((p) => p.champion),
  "Dos planes Poke casi iguales deben distinguir si ya hay peel");
const dive = scenarios.find((item) => item.id === "ambiguous-dive");
const pick = scenarios.find((item) => item.id === "ambiguous-pick");
assert.equal(dive.identity, "Dive");
assert.equal(pick.identity, "Pick");
assert.notEqual(dive.top[0].champion, pick.top[0].champion, "Ahri debe reaccionar a sus compañeros");

// El mismo candidato conserva sus atributos: solo cambia la necesidad del equipo.
const karmaExposed = engine.recommendPicks(resolvePicks(exposed.picks, catalog), catalog, 100).support.find((p) => p.champion === "Karma");
const karmaProtected = engine.recommendPicks(resolvePicks(protectedPoke.picks, catalog), catalog, 100).support.find((p) => p.champion === "Karma");
assert.ok(karmaExposed.affinity > karmaProtected.affinity, "El peel pierde el bono cuando ya está cubierto");

let stages = 0;
for (const team of sampleTeams(catalog)) {
  assert.deepEqual(engine.recommendPicks(team, catalog), {}, "Un equipo completo no genera picks de draft");
  for (let size = 1; size <= 4; size++) {
    const picks = team.slice(0, size);
    const before = structuredClone(picks);
    const result = engine.recommendPicks(picks, catalog);
    assert.deepEqual(result, engine.recommendPicks([...picks].reverse(), catalog), "El orden de almacenamiento no importa");
    assert.deepEqual(picks, before);
    assert.equal(Object.keys(result).length, 5 - size);
    for (const [role, recommendations] of Object.entries(result)) {
      assert.equal(picks.some((p) => p.role === role), false);
      assert.equal(recommendations.length, 3);
      assert.equal(new Set(recommendations.map((p) => p.champion)).size, 3);
      for (const recommendation of recommendations) {
        assert.ok(catalog[role].some((p) => p.champion === recommendation.champion));
        assert.equal(picks.some((p) => p.champion === recommendation.champion), false);
        assert.ok(recommendation.affinity >= 0 && recommendation.affinity <= 100);
      }
    }
    stages++;
  }
}
assert.deepEqual(catalog, snapshot);
console.log(`Draft strategic fit: ${scenarios.length} escenarios estratégicos y ${stages} estados independientes; roles, exclusiones, orden, determinismo y catálogo intactos.`);
