#!/usr/bin/env node
"use strict";

const assert = require("node:assert/strict");
const { integrateStrategicReportBans } = require("../src/report/strategic-report-ban-integration.js");

const examples = [
  ["clara", [
    { priority: 1, champion: "Poppy", threat: "engage", severity: "alta", reason: "Dificulta proteger al tirador.", expectedImpact: "Reduce la amenaza de iniciación." },
    { priority: 2, champion: "Ziggs", threat: "asedio", severity: "media", reason: "Alarga la defensa de torres.", expectedImpact: "Facilita disputar objetivos." },
  ]],
  ["híbrida", [
    { priority: 1, champion: "Janna", threat: "disengage", severity: "alta", reason: "Frena la entrada coordinada.", expectedImpact: "Abre una ventana para el dive." },
    { priority: 2, champion: "Anivia", threat: "control de zonas", severity: "media", reason: "Separa al equipo antes de pelear.", expectedImpact: "Mantiene el acceso a la backline." },
  ]],
  ["incoherente", [
    { priority: 1, champion: "Teemo", threat: "poke", severity: "alta", reason: "Castiga el avance descoordinado.", expectedImpact: "Reduce el desgaste previo a objetivos." },
    { priority: 2, champion: "Trundle", threat: "frontline", severity: "baja", reason: "Aprovecha una primera línea aislada.", expectedImpact: "Debilita la entrada frontal." },
  ]],
];

for (const [name, bans] of examples) {
  const presentation = { status: "presented", bans };
  const result = integrateStrategicReportBans({ banPresentation: presentation });
  assert.equal(result.status, "integrated", `Integra la presentación ${name}`);
  assert.deepEqual(result.bans, bans, `Conserva los campos, la prioridad y el orden de ${name}`);
  assert.deepEqual(integrateStrategicReportBans({ banPresentation: presentation }), result, `Es determinista para ${name}`);
}

const ordered = { status: "presented", bans: [
  { priority: 1, champion: "A", threat: "engage", severity: "alta", reason: "Motivo A.", expectedImpact: "Impacto A." },
  { priority: 2, champion: "B", threat: "poke", severity: "media", reason: "Motivo B.", expectedImpact: "Impacto B." },
  { priority: 3, champion: "C", threat: "split push", severity: "baja", reason: "Motivo C.", expectedImpact: "Impacto C." },
] };
const snapshot = structuredClone(ordered);
const compact = integrateStrategicReportBans({ banPresentation: ordered });
assert.deepEqual(compact.bans.map((ban) => ban.champion), ["A", "B"], "Limita la salida a los dos bans más relevantes en el orden recibido");
assert.deepEqual(ordered, snapshot, "No modifica la entrada del Presenter");
assert.equal(compact.bans.some((ban) => ban.champion === "C"), false, "Omite los candidatos menos prioritarios");
assert.equal(integrateStrategicReportBans({ banPresentation: { status: "pending", bans: [] } }), null);
assert.equal(integrateStrategicReportBans({ banPresentation: { status: "no-bans", bans: [] } }), null);
assert.equal(integrateStrategicReportBans({ banPresentation: { status: "presented", bans: [{ champion: "Incomplete" }] } }), null);

console.log("Strategic Report Ban Integration validada: referencias claras, híbridas e incoherentes, orden, límite, omisión sin valor y determinismo.");
