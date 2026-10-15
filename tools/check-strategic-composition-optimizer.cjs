#!/usr/bin/env node
"use strict";

const assert = require("node:assert/strict");
const { optimizeStrategicComposition } = require("../src/domain/strategic-composition-optimizer.js");

function pipeline({ primaryIdentity = "Front to Back", secondaryIdentity = null, compositionStatus = "complete" } = {}) {
  const picks = [
    { role: "top", champion: "Ornn", fitByProfile: { engage: { signals: [], matchedFields: [] } } },
    { role: "jungle", champion: "Sejuani", fitByProfile: { engage: { signals: ["engage"], matchedFields: ["strengths"] } } },
    { role: "mid", champion: "Orianna", fitByProfile: { engage: { signals: ["teamfight"], matchedFields: ["strengths"] } } },
    { role: "botline", champion: "Jinx", fitByProfile: { engage: { signals: ["follow-up"], matchedFields: ["strengths"] } } },
    { role: "support", champion: "Lulu", fitByProfile: { engage: { signals: ["peel"], matchedFields: ["strengths"] } } },
  ];
  const replacements = [
    { champion: "Sion", priority: 1, identity: "Front to Back" },
    { champion: "Rell", priority: 2, identity: "Teamfight" },
  ];
  const evaluated = replacements.map((candidate, index) => ({
    ...candidate,
    priority: index + 1,
    strategicFit: candidate.identity === primaryIdentity ? "primary-identity" : "unconfirmed",
    reason: "Refuerza el plan.",
  }));
  return {
    optimizer: { status: "prioritized", priority: { need: { id: "engage", label: "Iniciación" }, reinforces: "iniciación", problemAvoided: "falta de entrada coordinada" } },
    recommendations: {
      status: "recommended",
      plan: { primaryIdentity, secondaryIdentity },
      profiles: [{ id: "engage", label: "Iniciación", priority: 1, improves: "el acceso inicial" }],
    },
    mappedCandidates: {
      status: "mapped",
      composition: { status: compositionStatus, picks },
      profiles: [{ id: "engage", alternativesByRole: { top: replacements } }],
    },
    evaluatedCandidates: {
      status: "evaluated",
      profiles: [{ id: "engage", alternativesByRole: { top: evaluated } }],
    },
    presentation: { status: "presented" },
    integration: { status: "presented" },
    polished: { status: "polished" },
  };
}

const clear = optimizeStrategicComposition(pipeline());
assert.equal(clear.status, "optimized");
assert.deepEqual(clear.proposal.change, { role: "top", from: "Ornn", to: "Sion" }, "Reemplaza la pieza con menor ajuste a la necesidad y conserva el rol");
assert.equal(clear.proposal.identity.status, "preserved");
assert.equal(clear.proposal.identity.primary, "Front to Back");
assert.equal(clear.proposal.composition.length, 5);
assert.ok(clear.proposal.composition.some((pick) => pick.role === "top" && pick.champion === "Sion"));
assert.equal(clear.proposal.improvement, "el acceso inicial");
assert.equal(clear.proposal.limitationCorrected, "falta de entrada coordinada");

const uiRoleLabels = pipeline();
uiRoleLabels.mappedCandidates.composition.picks[0].role = "Top";
assert.equal(optimizeStrategicComposition(uiRoleLabels).proposal.change.to, "Sion",
  "La selección del recambio admite las etiquetas de rol que llegan del informe");

const hybrid = optimizeStrategicComposition(pipeline({ secondaryIdentity: "Teamfight" }));
assert.equal(hybrid.proposal.identity.primary, "Front to Back", "Un plan híbrido conserva su identidad principal si hay una alternativa alineada");
assert.equal(hybrid.proposal.identity.status, "preserved");

const incoherent = optimizeStrategicComposition(pipeline({ primaryIdentity: null, compositionStatus: "complete" }));
assert.equal(incoherent.status, "optimized");
assert.equal(incoherent.proposal.identity.status, "unconfirmed");
assert.equal(incoherent.proposal.identity.proposed, "Front to Back", "La alternativa señala una dirección, pero no afirma que el equipo completo ya tenga esa identidad");
assert.match(incoherent.proposal.explanation, /debe confirmarse con un análisis completo/);

const incomplete = pipeline({ compositionStatus: "incomplete" });
incomplete.mappedCandidates.composition.picks = incomplete.mappedCandidates.composition.picks.slice(0, 4);
assert.equal(optimizeStrategicComposition(incomplete).status, "pending", "Una alineación incompleta queda pendiente y no se optimiza como equipo cerrado");
assert.equal(optimizeStrategicComposition({ optimizer: { status: "no-priority" } }).status, "no-priority");
assert.deepEqual(optimizeStrategicComposition(pipeline()), clear, "La propuesta completa es determinista");

const noIdentityPreservingReplacement = pipeline();
noIdentityPreservingReplacement.mappedCandidates.profiles[0].alternativesByRole.top = [
  { champion: "Rell", priority: 1, identity: "Teamfight" },
];
noIdentityPreservingReplacement.evaluatedCandidates.profiles[0].alternativesByRole.top = [
  { champion: "Rell", priority: 1, strategicFit: "secondary-identity", reason: "Complementa el plan." },
];
assert.equal(optimizeStrategicComposition(noIdentityPreservingReplacement).status, "no-supported-replacement",
  "No desplaza la identidad principal por una opción que solo respalda el plan secundario");

const contradictoryReplacement = pipeline({ primaryIdentity: null });
contradictoryReplacement.evaluatedCandidates.profiles[0].alternativesByRole.top[0].contradictsPlan = true;
assert.equal(optimizeStrategicComposition(contradictoryReplacement).status, "optimized",
  "Puede elegir la siguiente alternativa evaluada si la primera contradice el plan");
assert.equal(optimizeStrategicComposition(contradictoryReplacement).proposal.change.to, "Rell");

console.log("Strategic Composition Optimizer validado: composición completa, debilidad prioritaria, conservación de identidad, híbridos, incoherencia, estado pendiente y determinismo.");
