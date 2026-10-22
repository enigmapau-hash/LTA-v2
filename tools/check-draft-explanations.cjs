#!/usr/bin/env node
"use strict";

const assert = require("node:assert/strict");
const { createHash } = require("node:crypto");
const engine = require("../src/domain/composition-engine.js");
const { loadCandidateCatalog } = require("./recommendation-audit.cjs");
const { generateRepresentativeCompositions } = require("./recommendation-audit-fixtures.cjs");
const { SCENARIOS, resolvePicks, sampleTeams } = require("./draft-strategic-fit-scenarios.cjs");

// Catálogo existente; cinco roles × cuatro tamaños. No se fijan ganadores.
const ROLE_CASES = {
  top: [{ botline: "Jinx" }, { mid: "Azir", botline: "Jinx" },
    { jungle: "Karthus", mid: "Azir", botline: "Jinx" },
    { jungle: "Karthus", mid: "Azir", botline: "Jinx", support: "Milio" }],
  jungle: [{ mid: "Xerath" }, { mid: "Azir", botline: "Jinx" },
    { mid: "Xerath", botline: "Ezreal", support: "Karma" },
    { top: "Jayce", mid: "Xerath", botline: "Ezreal", support: "Karma" }],
  mid: [{ botline: "Jinx" }, { top: "Sion", botline: "Jinx" },
    { top: "Camille", jungle: "Vi", support: "Rakan" },
    { top: "Camille", jungle: "Vi", botline: "Kai'Sa", support: "Rakan" }],
  botline: [{ top: "Ornn" }, { top: "Ornn", support: "Lulu" },
    { top: "Ornn", jungle: "Sejuani", support: "Lulu" },
    { top: "Jayce", jungle: "Nidalee", mid: "Xerath", support: "Karma" }],
  support: [{ mid: "Xerath" }, { top: "Jayce", mid: "Xerath" },
    { jungle: "Karthus", mid: "Azir", botline: "Jinx" },
    { top: "Jayce", jungle: "Nidalee", mid: "Xerath", botline: "Ezreal" }],
};

function withoutExplanations(result) {
  return Object.fromEntries(Object.entries(result).map(([role, items]) =>
    [role, items.map(({ explanation, ...unchanged }) => unchanged)]));
}

function compatibilitySnapshot(subject, catalog, cases) {
  return cases.map((picks) => ({
    picks: picks.map(({ role, champion }) => ({ role, champion })),
    recommendations: [1, 3, 100].map((limit) => withoutExplanations(subject.recommendPicks(picks, catalog, limit))),
    analysis: subject.analyzeComposition(picks),
  }));
}

function corpus(catalog) {
  return [[], ...sampleTeams(catalog).flatMap((team) => [1, 2, 3, 4, 5].map((size) => team.slice(0, size))),
    ...generateRepresentativeCompositions(catalog).flatMap(({ picks }) => [1, 2, 3, 4, 5].map((size) => picks.slice(0, size))),
    ...SCENARIOS.map(({ picks }) => resolvePicks(picks, catalog)),
    ...Object.values(ROLE_CASES).flat().map((picks) => resolvePicks(picks, catalog))];
}

function main() {
  const catalog = loadCandidateCatalog();
  const before = structuredClone(catalog);
  const cases = corpus(catalog);
  const snapshots = compatibilitySnapshot(engine, catalog, cases);
  const digest = (value) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
  // Separar el contrato de draft intacto de la precisión de diagnóstico completo
  // revisada en v3.7.0. Se mantienen todos los campos cubiertos, no solo el ranking.
  assert.equal(digest(snapshots.map(({ analysis, ...draft }) => draft)), "3b7000e7d2dc07ff5f56e9824a5548e945609997eb969c7992d922b0215bea90",
    "Todos los campos previos de recomendaciones deben permanecer idénticos a v3.6.0");
  assert.equal(digest(snapshots.map(({ analysis }) => analysis)), "07e2404fed71dde0a54088aa90ec7a6595f2801c36e594e23788acf251769c26",
    "Los análisis deben conservar el contrato aprobado de v3.7.0");

  const normalize = (value) => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const explicit = (pick, term) => new RegExp(`(^|[^a-z0-9-])${normalize(term)}($|[^a-z0-9-])`).test(normalize(pick.strengths));
  let checked = 0;
  for (const picks of cases) {
    const result = engine.recommendPicks(picks, catalog);
    assert.deepEqual(result, engine.recommendPicks([...picks].reverse(), catalog), "Texto y ranking independientes del orden de almacenamiento");
    for (const [role, items] of Object.entries(result)) {
      for (const item of items) {
        const candidate = catalog[role].find((pick) => pick.champion === item.champion);
        assert.equal(typeof item.explanation, "string");
        assert.ok(item.explanation.length > 0 && item.explanation.length <= 150, "Una frase breve por candidato");
        assert.doesNotMatch(item.explanation, /\n|\d+%|afinidad|puntuaci[oó]n/i);
        if (item.explanation.startsWith("Cubre la falta de ")) {
          for (const [label, term] of [["frontline", "frontline"], ["protección para los carries", "peel"]]) {
            if (!item.explanation.includes(label)) continue;
            assert.ok(explicit(candidate, term), `${item.champion} debe aportar realmente ${term}`);
            assert.ok(!picks.some((pick) => explicit(pick, term)), `${term} no debe estar cubierto`);
          }
          const identity = engine.analyzeComposition(picks).identity.primary;
          assert.ok(["Poke", "Escalado"].includes(identity));
          assert.equal(item.direction, identity, "La cobertura verbalizada conserva el plan que recibió el bono");
        }
        const shared = item.explanation.match(/^Refuerza .+ con (.+) que ya aporta el equipo\.$/);
        if (shared) for (const term of shared[1].split(" y ")) {
          assert.ok(explicit(candidate, term), `${item.champion}: capacidad compartida explícita`);
          assert.ok(picks.some((pick) => explicit(pick, term)), "La capacidad también existe en los picks actuales");
        }
        checked++;
      }
    }
  }

  const recommendation = (picks, role, champion) => engine.recommendPicks(resolvePicks(picks, catalog), catalog, 100)[role]
    .find((item) => item.champion === champion);
  const exposed = { top: "Jayce", jungle: "Nidalee", mid: "Xerath", botline: "Ezreal" };
  const protectedPoke = { ...exposed, jungle: "Gragas" };
  assert.match(recommendation(exposed, "support", "Karma").explanation, /Cubre la falta de protección.*mantiene Poke/);
  assert.doesNotMatch(recommendation(protectedPoke, "support", "Karma").explanation, /falta|sin protección/);
  assert.notEqual(recommendation(exposed, "support", "Karma").explanation,
    recommendation(protectedPoke, "support", "Karma").explanation, "Un mismo candidato necesita un mensaje distinto al desaparecer la carencia");

  const scaling = { jungle: "Lillia", mid: "Azir", botline: "Kog'Maw" };
  assert.match(recommendation(scaling, "support", "Braum").explanation, /falta de frontline y protección/,
    "Anti-frontline no acredita frontline propia");
  assert.doesNotMatch(recommendation({ ...scaling, top: "Sion" }, "support", "Braum").explanation, /falta de frontline/);
  assert.doesNotMatch(recommendation({ top: "Ornn", jungle: "Sejuani", support: "Lulu" }, "mid", "Azir").explanation, /falta/);
  assert.match(recommendation({ jungle: "Wukong", mid: "Yasuo", botline: "Miss Fortune" }, "support", "Rell").explanation, /Teamfight con engage/);
  assert.match(recommendation({ mid: "Ahri", jungle: "Vi", top: "Camille" }, "support", "Rakan").explanation, /Dive/);
  assert.match(recommendation({ mid: "Ahri", jungle: "Elise", top: "Gragas" }, "support", "Bard").explanation, /Pick/);

  // La protección de este candidato no recibió el bono: el equipo hipotético
  // cambia de dirección. No atribuirle retrospectivamente ese motivo al ranking.
  for (const items of Object.values(engine.recommendPicks(resolvePicks({ mid: "Xerath" }, catalog), catalog, 100))) {
    for (const item of items) if (item.direction !== "Poke") assert.doesNotMatch(item.explanation, /Cubre la falta/);
  }
  const offPlan = recommendation({ mid: "Xerath" }, "support", "Alistar");
  assert.ok(offPlan.strengths.includes("Peel"));
  assert.notEqual(offPlan.direction, "Poke");
  assert.doesNotMatch(offPlan.explanation, /Cubre la falta/, "Tener Peel no basta: la cobertura debe haber influido en la afinidad");
  assert.equal(recommendation({ top: "Ornn" }, "botline", "Brand").explanation, "Aporta: Anti-frontline, Teamfight",
    "No atribuir frontline propia por una coincidencia parcial del matcher histórico");
  assert.equal(engine.recommendPicks([], { mid: [{ champion: "Sin datos" }] }).mid[0].explanation,
    "Aporta: sin señales suficientes", "Sin evidencia, conservar una descripción factual sin inventar un plan");
  assert.deepEqual(catalog, before);
  console.log(`Draft explanations: ${cases.length} estados, ${checked} mensajes; cinco roles, 1–4 picks, cobertura veraz, brevedad, determinismo y contrato de recomendaciones intacto.`);
}

if (require.main === module) main();
module.exports = { ROLE_CASES, corpus, compatibilitySnapshot };
