#!/usr/bin/env node
"use strict";

const assert = require("node:assert/strict");
const { polishRecommendation } = require("../src/domain/strategic-recommendation-polisher.js");

const candidateNames = ["Camille", "Elise", "Nautilus", "Bard", "Ahri"];
const input = {
  optimizer: { status: "prioritized", priority: { need: { label: "Pick y control del mapa" } } },
  recommendations: { status: "recommended", profiles: [{ id: "pick" }] },
  mappedCandidates: { status: "mapped", profiles: [{ id: "pick" }] },
  evaluatedCandidates: { status: "evaluated", profiles: [{ id: "pick" }] },
  presentation: {
    status: "presented",
    primaryProfile: {
      id: "pick",
      label: "Pick",
      candidates: candidateNames.map((champion) => ({ champion })),
    },
  },
  integration: {
    status: "presented",
    section: {
      need: "  Pick y control del mapa ",
      profile: "Pick",
      reason: "Es la respuesta más directa: aprovechar objetivos aislados.",
      improves: "abrir una ventaja antes de la pelea",
      candidates: [
        { champion: "Camille", reason: "Encaja con Pick. Refuerza abrir una ventaja antes de la pelea.", strengths: ["Pick", "Pick", "Duelos"], limitations: ["Situacional", "Situacional"] },
        { champion: "Elise", reason: "Aporta presión de cazada. Refuerza abrir una ventaja antes de la pelea.", strengths: ["Ganks"], limitations: [] },
        { champion: "Nautilus", reason: "Facilita encontrar objetivos aislados.", strengths: ["Engage"], limitations: ["Escala poco"] },
        { champion: "Bard", reason: "Ofrece control de visión.", strengths: ["Roams"], limitations: [] },
        { champion: "Ahri", reason: "Quinta opción fuera del límite.", strengths: [], limitations: [] },
        { champion: "camille", reason: "Duplicado que debe descartarse.", strengths: [], limitations: [] },
        { champion: "Nuevo campeón", reason: "No pertenece a la salida evaluada.", strengths: [], limitations: [] },
      ],
    },
  },
};

const result = polishRecommendation(input);
assert.equal(result.status, "polished");
assert.deepEqual(result.section, {
  need: "Pick y control del mapa",
  profile: "Pick",
  reason: "Es la respuesta más directa: aprovechar objetivos aislados.",
  improves: "abrir una ventaja antes de la pelea",
  candidates: [
    { champion: "Camille", reason: "Encaja con Pick", strengths: ["Pick", "Duelos"], limitations: ["Situacional"] },
    { champion: "Elise", reason: "Aporta presión de cazada", strengths: ["Ganks"], limitations: [] },
    { champion: "Nautilus", reason: "Facilita encontrar objetivos aislados.", strengths: ["Engage"], limitations: ["Escala poco"] },
    { champion: "Bard", reason: "Ofrece control de visión.", strengths: ["Roams"], limitations: [] },
  ],
});
assert.equal(result.compact, "Pick y control del mapa · Pick: Camille, Elise, Nautilus, Bard.");
assert.deepEqual(polishRecommendation(input), result, "El refinado es determinista");

assert.deepEqual(polishRecommendation({ integration: { status: "no-priority" } }), {
  status: "no-priority", section: null, compact: "",
});
assert.equal(polishRecommendation({ ...input, presentation: { status: "not-presented" } }).status, "incomplete-presentation-chain");
assert.equal(polishRecommendation({ ...input, integration: { ...input.integration, section: { ...input.integration.section, profile: "Engage" } } }).status, "inconsistent-presentation-chain");
assert.equal(polishRecommendation({ ...input, integration: { ...input.integration, section: { ...input.integration.section, candidates: [] } } }).status, "no-useful-candidates");

console.log("Strategic Recommendation Polisher validado: texto compacto, deduplicación estable y respeto de la cadena calculada.");
