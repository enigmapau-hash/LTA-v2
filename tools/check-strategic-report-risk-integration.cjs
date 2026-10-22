#!/usr/bin/env node
"use strict";
const assert = require("node:assert/strict");
const { integrateStrategicReportRisks } = require("../src/report/strategic-report-risk-integration.js");

for (const [type, counter, severity] of [
  ["priority-uncovered", "objective-contest", "alta"],
  ["single-point-dependency", "focused-dive", "media"],
  ["identity-unconfirmed", "forced-engage", "alta"],
]) {
  const input = {
    strategicRisks: { status: "assessed", risks: [
      { type, severity, priority: 1, threatens: "la ventana del plan", explanation: "El equipo depende de una pieza para aplicar la ventana del plan." },
    ] },
    strategicCounterplay: { status: "advised", threats: [
      { type: counter, severity, threatens: "la ventana del plan", protection: "Mantén recursos junto a esa pieza antes de disputar objetivos." },
    ] },
    protectionSection: { answer: "Proteger frente a Poke", action: "Evita el desgaste previo a los objetivos." },
  };
  const before = structuredClone(input);
  const expected = { type, severity, risk: input.strategicRisks.risks[0].explanation,
    response: input.strategicCounterplay.threats[0].protection };
  assert.deepEqual(integrateStrategicReportRisks(input), expected);
  assert.deepEqual(integrateStrategicReportRisks(input), expected, "Salida determinista");
  assert.deepEqual(input, before, "No muta las salidas de los motores");

  const repeatedRisk = structuredClone(input);
  repeatedRisk.protectionSection.explanation = expected.risk;
  assert.equal(integrateStrategicReportRisks(repeatedRisk).risk, "", "No duplica el riesgo");
  const repeatedAdvice = structuredClone(input);
  repeatedAdvice.protectionSection.action = expected.response;
  assert.equal(integrateStrategicReportRisks(repeatedAdvice).response, "", "No duplica el consejo");
  repeatedAdvice.protectionSection.explanation = expected.risk;
  assert.equal(integrateStrategicReportRisks(repeatedAdvice), null, "No aporta contenido redundante");

  const mismatched = structuredClone(input);
  mismatched.strategicCounterplay.threats[0].type = "other";
  assert.equal(integrateStrategicReportRisks(mismatched), null, "No une tipos incompatibles");
  mismatched.strategicCounterplay.threats[0].type = counter;
  mismatched.strategicCounterplay.threats[0].threatens = "otro aspecto";
  assert.equal(integrateStrategicReportRisks(mismatched), null, "No une aspectos distintos");
  mismatched.strategicCounterplay.threats[0].threatens = "la ventana del plan";
  mismatched.strategicCounterplay.threats[0].severity = "baja";
  assert.equal(integrateStrategicReportRisks(mismatched), null, "No une severidades distintas");
}
assert.equal(integrateStrategicReportRisks({}), null);
assert.equal(integrateStrategicReportRisks({
  strategicRisks: { status: "pending", risks: [] },
  strategicCounterplay: { status: "advised", threats: [] },
}), null, "Sin composición evaluable, no afirma riesgos");
assert.equal(integrateStrategicReportRisks({
  strategicRisks: { status: "assessed", risks: [] },
  strategicCounterplay: { status: "no-supported-threat", threats: [] },
}), null, "Se abstiene sin respaldo");
const sorted = {
  strategicRisks: { status: "assessed", risks: [
    { priority: 2, type: "single-point-dependency", severity: "media", threatens: "a", explanation: "A falta respaldo." },
    { priority: 1, type: "priority-uncovered", severity: "alta", threatens: "b", explanation: "B queda sin apoyo." },
  ] },
  strategicCounterplay: { status: "advised", threats: [
    { type: "focused-dive", severity: "media", threatens: "a", protection: "Protege A." },
    { type: "objective-contest", severity: "alta", threatens: "b", protection: "Protege B." },
  ] },
};
assert.equal(integrateStrategicReportRisks(sorted).risk, "B queda sin apoyo.", "Elige el riesgo más severo");
console.log("Integración de riesgos y contramedidas validada: correspondencia, omisión, no duplicación y determinismo.");
