#!/usr/bin/env node
"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const XLSX = require("../vendor/xlsx.full.min.js");
const { diagnoseComposition } = require("../src/domain/diagnostic-engine.js");
const { proposeCorrections } = require("../src/domain/correction-engine.js");

const root = path.resolve(__dirname, "..");
const workbook = XLSX.read(fs.readFileSync(path.join(root, "Draft Pool.xlsx")), { type: "buffer" });
const roleSheets = {
  top: "Tabla Top",
  jungle: "Tabla Jungla",
  mid: "Tabla Mid",
  botline: "Tabla Botline",
  support: "Tabla Support",
};

function rows(role) {
  return XLSX.utils.sheet_to_json(workbook.Sheets[roleSheets[role]], { defval: "" });
}

function pick(role, champion) {
  let row = rows(role).find((item) => item["Campeón"] === champion);
  if (!row && champion === "Maokai") {
    row = XLSX.utils.sheet_to_json(workbook.Sheets["Tabla Top"], { defval: "" })
      .find((item) => item["Campeón"] === champion);
  }
  assert.ok(row, `${champion} debe existir para ${role}`);
  return {
    role,
    champion,
    identity: row["Identidad"],
    function: row["Función"],
    tempo: row["Ritmo"],
    strengths: row["Fortalezas"],
    weaknesses: row["Debilidades"],
  };
}

function composition(selection) {
  return Object.entries(selection).map(([role, champion]) => pick(role, champion));
}

const candidatesByRole = Object.fromEntries(Object.keys(roleSheets).map((role) => [
  role,
  rows(role).map((row) => ({
    champion: row["Campeón"],
    identity: row["Identidad"],
    function: row["Función"],
    tempo: row["Ritmo"],
    strengths: row["Fortalezas"],
    weaknesses: row["Debilidades"],
  })),
]));

const frontToBack = composition({
  top: "Ornn", jungle: "Sejuani", mid: "Orianna", botline: "Jinx", support: "Lulu",
});
const dive = composition({
  top: "Camille", jungle: "Vi", mid: "Ahri", botline: "Kai'Sa", support: "Rakan",
});
const incoherent = [
  pick("top", "Fiora"),
  pick("jungle", "Elise"),
  pick("mid", "Xerath"),
  pick("botline", "Draven"),
  pick("support", "Lulu"),
];

function verifyCandidates(result, selected) {
  assert.ok(result.improvements.length >= 1 && result.improvements.length <= 2);
  for (const improvement of result.improvements) {
    assert.ok(improvement.explanation);
    assert.ok(improvement.candidates.length >= 2 && improvement.candidates.length <= 3);
    assert.equal(new Set(improvement.candidates.map((candidate) => candidate.champion)).size, improvement.candidates.length);
    assert.ok(improvement.candidates.every((candidate) => candidate.contribution.length > 0));
    assert.ok(improvement.candidates.every((candidate) => !selected.has(candidate.champion)));
  }
}

const clearDiagnosis = diagnoseComposition(dive);
const clearCorrection = proposeCorrections({ picks: dive, diagnosis: clearDiagnosis, candidatesByRole });
assert.equal(clearDiagnosis.primaryProblem.type, "identity-risk");
assert.equal(clearCorrection.status, "no-supported-correction", "Dive: falla de inicio es un riesgo, no ausencia de recurso");
assert.deepEqual(clearCorrection.improvements, []);
assert.equal(clearCorrection.reasonCode, "requirements-covered",
  "Una composición con capacidades acreditadas puede abstenerse justificadamente");
assert.deepEqual(clearCorrection.consideredFactors, []);

const hybridDiagnosis = diagnoseComposition(frontToBack);
assert.equal(hybridDiagnosis.coherence.status, "hybrid");
const hybridCorrection = proposeCorrections({ picks: frontToBack, diagnosis: hybridDiagnosis, candidatesByRole });
assert.equal(hybridCorrection.status, "no-supported-correction", "Front to Back no necesita presión lateral por defecto");
assert.equal(hybridCorrection.limitingFactor, null);
assert.equal(hybridCorrection.reasonCode, "requirements-covered");

const poke = composition({ top: "Jayce", jungle: "Nidalee", mid: "Xerath", botline: "Ezreal", support: "Vel'Koz" });
const protectedPoke = composition({ top: "Jayce", jungle: "Nidalee", mid: "Xerath", botline: "Ezreal", support: "Karma" });
const { assessPlanNeeds } = require("../src/domain/composition-engine.js");
assert.deepEqual(assessPlanNeeds({ picks: poke, identity: "Poke" }), [{ id: "peel", label: "protección para los carries" }]);
assert.deepEqual(assessPlanNeeds({ picks: protectedPoke, identity: "Poke" }), []);
const pokeDiagnosis = diagnoseComposition(poke);
assert.equal(pokeDiagnosis.plan.primaryIdentity, "Poke");
const pokeCorrection = proposeCorrections({ picks: poke, diagnosis: pokeDiagnosis, candidatesByRole });
assert.equal(pokeCorrection.status, "proposed", "Poke sin Peel merece apoyo");
assert.equal(pokeCorrection.improvements[0].profile.id, "peel");
verifyCandidates(pokeCorrection, new Set(poke.map((item) => item.champion)));
// Screenshots reported by the user: the recognized identity must not be
// mistaken for proof of an executable Front to Back or Scaling plan.
const frontWithoutTank = composition({
  top: "Aurora", jungle: "Kha'Zix", mid: "Hwei", botline: "Seraphine", support: "Brand",
});
const scalingWithoutTank = composition({
  top: "Aurora", jungle: "Karthus", mid: "Hwei", botline: "Seraphine", support: "Brand",
});
for (const [picks, identity] of [
  [frontWithoutTank, "Front to Back"],
  [scalingWithoutTank, "Escalado"],
]) {
  const diagnosis = diagnoseComposition(picks);
  assert.equal(diagnosis.plan.primaryIdentity, identity, "Identidad reconocida en la captura");
  assert.equal(diagnosis.execution.status, "missing-required-capabilities");
  assert.ok(diagnosis.execution.missing.some((need) => need.id === "frontline"),
    "Una frontline ausente no puede tratarse como un plan ya cubierto");
  const correction = proposeCorrections({ picks, diagnosis, candidatesByRole });
  assert.equal(correction.status, "proposed", "No abstenerse ante la carencia principal");
  assert.equal(correction.improvements[0].profile.id, "frontline");
  assert.equal(correction.improvements[0].evidenceType, "required-plan-capability");
  verifyCandidates(correction, new Set(picks.map((pick) => pick.champion)));
}
const fakeAntifrontline = {
  top: [
    { champion: "Anti-frontline A", strengths: "Anti-frontline", function: "Asesino AD" },
    { champion: "Anti-frontline B", strengths: "Anti-frontline", function: "Asesino AP" },
  ],
};
assert.equal(proposeCorrections({
  picks: frontWithoutTank,
  diagnosis: diagnoseComposition(frontWithoutTank),
  candidatesByRole: fakeAntifrontline,
}).status, "no-supported-correction",
  "Anti-frontline no demuestra la capacidad propia de sostener una frontline");
const insufficient=proposeCorrections({picks: frontWithoutTank,
  diagnosis: diagnoseComposition(frontWithoutTank),candidatesByRole:fakeAntifrontline});
assert.equal(insufficient.reasonCode,"insufficient-candidate-evidence",
  "La falta de candidatos útiles es distinta de un equipo que ya cubre sus necesidades");
assert.ok(insufficient.consideredFactors.some(x=>x.result==="insufficient-candidates"));
const unresolved=proposeCorrections({picks:frontWithoutTank,
  diagnosis:{
    status:"assessed",plan:{clear:true,primaryIdentity:"Front to Back"},
    primaryProblem:{type:"strategic-contradiction"},
    execution:{missing:[{id:"frontline",label:"frontline"}]},
  },candidatesByRole});
assert.equal(unresolved.reasonCode,"unresolved-contradiction",
  "Nunca forzar una sustitución basada solo en una identidad contradictoria");
const unmapped=proposeCorrections({picks:frontWithoutTank,
  diagnosis:{
    status:"assessed",plan:{clear:true,primaryIdentity:"Front to Back"},
    primaryProblem:{type:"identity-risk"},
    execution:{missing:[{id:"invented",label:"una carencia sin perfil registrado"}]},
  },candidatesByRole});
assert.equal(unmapped.reasonCode,"unmapped-diagnostic-factor");

const protectedDiagnosis = diagnoseComposition(protectedPoke);
assert.equal(proposeCorrections({ picks: protectedPoke, diagnosis: protectedDiagnosis, candidatesByRole }).status,
  "no-supported-correction", "Con Peel acreditado no se fuerza reemplazo");

const incoherentDiagnosis = diagnoseComposition(incoherent);
const incoherentCorrection = proposeCorrections({ picks: incoherent, diagnosis: incoherentDiagnosis, candidatesByRole });
assert.equal(incoherentCorrection.limitingFactor, "iniciación compartida");
assert.equal(incoherentCorrection.improvements[0].profile.id, "engage");
verifyCandidates(incoherentCorrection, new Set(incoherent.map((item) => item.champion)));

assert.deepEqual(proposeCorrections({ picks: poke, diagnosis: pokeDiagnosis, candidatesByRole }), pokeCorrection);
assert.equal(proposeCorrections({ picks: poke, diagnosis: pokeDiagnosis, candidatesByRole: {} }).status, "no-supported-correction");

const incomplete = proposeCorrections({ picks: dive.slice(0, 4), diagnosis: { status: "not-assessable" }, candidatesByRole });
assert.equal(incomplete.status, "not-assessable");

console.log("Correction Engine: abstención en planes coherentes, Peel requerido y brechas de cohesión, determinismo.");
