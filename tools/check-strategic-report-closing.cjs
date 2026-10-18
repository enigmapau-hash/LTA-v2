#!/usr/bin/env node
"use strict";

const assert = require("node:assert/strict");
const { integrateStrategicReportClosing } = require("../src/report/strategic-report-closing.js");

const fragileCases = [
  {
    reason: "no-common-plan",
    guidance: "Antes de jugar, definid un enfoque común.",
    text: "Composición frágil: antes de jugar, definid un enfoque común.",
  },
  {
    reason: "incompatible-plans",
    guidance: "Elegid qué identidad debe guiar las peleas.",
    text: "Composición frágil: elegid qué identidad debe guiar las peleas.",
  },
  {
    reason: "key-pick-dependency",
    guidance: "Preparad una alternativa si falta la pieza que sostiene el plan.",
    text: "Composición frágil: preparad una alternativa si falta la pieza que sostiene el plan.",
  },
];

for (const example of fragileCases) {
  const input = {
    strategicState: { status: "fragile", reason: example.reason },
    guidance: example.guidance,
    sections: [{ title: "Diagnóstico", explanation: "La composición pierde coherencia." }],
  };
  const result = integrateStrategicReportClosing(input);
  assert.deepEqual(result, {
    status: "presented",
    state: "fragile",
    reason: example.reason,
    guidance: example.guidance,
    text: example.text,
  });
  assert.deepEqual(integrateStrategicReportClosing(input), result, "La presentación es determinista");
  assert.ok(result.text.split(/\s+/).length <= 14, "El cierre debe caber en una lectura breve");
  assert.doesNotMatch(result.text, /%|puntuaci[oó]n|probabilidad|candidatos/i);
}

for (const state of [
  { status: "solid", reason: "aligned-and-stable" },
  { status: "risk", reason: "complementary-secondary-path" },
  { status: "not-assessed", reason: "composition-incomplete" },
  { status: "fragile", reason: "unclassified-fragility" },
]) {
  assert.equal(integrateStrategicReportClosing({
    strategicState: state,
    guidance: "Antes de jugar, definid un enfoque común.",
  }), null, `No crea un cierre visible para ${state.status}/${state.reason}`);
}

assert.equal(integrateStrategicReportClosing({
  strategicState: { status: "fragile", reason: "no-common-plan" },
  guidance: "Antes de jugar, definid un enfoque común.",
  sections: [{ explanation: "Antes de jugar, definid un enfoque común." }],
}), null, "Omite una orientación ya mostrada en el informe");
assert.equal(integrateStrategicReportClosing({
  strategicState: { status: "fragile", reason: "no-common-plan" },
  guidance: "",
}), null, "Omite un cierre sin orientación útil");

console.log("Strategic Report Closing validado: estado, causa y orientación breves; omisión cuando no aporta valor o duplica el informe.");
