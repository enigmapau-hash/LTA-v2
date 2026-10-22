#!/usr/bin/env node
"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const XLSX = require("../vendor/xlsx.full.min.js");
const { diagnoseComposition } = require("../src/domain/diagnostic-engine.js");
const { proposeCorrections } = require("../src/domain/correction-engine.js");
const { protectComposition } = require("../src/domain/protection-engine.js");
const { optimizeComposition } = require("../src/domain/composition-optimizer.js");
const { recommendProfiles } = require("../src/domain/strategic-recommendation-engine.js");
const { mapCandidates } = require("../src/domain/championship-candidate-mapper.js");
const { evaluateCandidates } = require("../src/domain/candidate-evaluator.js");
const { presentRecommendations } = require("../src/domain/strategic-recommendation-presenter.js");
const { presentForReport } = require("../src/report/strategic-recommendation-presenter-integration.js");
const { polishRecommendation } = require("../src/domain/strategic-recommendation-polisher.js");
const { optimizeStrategicComposition } = require("../src/domain/strategic-composition-optimizer.js");
const { recomposeStrategicTeam } = require("../src/domain/strategic-team-recomposer.js");
const { buildStrategicReport } = require("../src/report/strategic-report.js");

const root = path.resolve(__dirname, "..");
const workbook = XLSX.read(fs.readFileSync(path.join(root, "Draft Pool.xlsx")), { type: "buffer" });
const roleSheets = { top: "Tabla Top", jungle: "Tabla Jungla", mid: "Tabla Mid", botline: "Tabla Botline", support: "Tabla Support" };
const rows = (role) => XLSX.utils.sheet_to_json(workbook.Sheets[roleSheets[role]], { defval: "" });
const candidatesByRole = Object.fromEntries(Object.keys(roleSheets).map((role) => [role, rows(role).map((row) => ({
  champion: row["Campeón"], identity: row["Identidad"], function: row["Función"], tempo: row["Ritmo"], strengths: row["Fortalezas"], weaknesses: row["Debilidades"],
}))]));

function pick(role, champion) {
  const row = rows(role).find((item) => item["Campeón"] === champion);
  assert.ok(row, `${champion} debe existir para ${role}`);
  return { role, champion, identity: row["Identidad"], function: row["Función"], tempo: row["Ritmo"], strengths: row["Fortalezas"], weaknesses: row["Debilidades"] };
}

function analyze(selection) {
  const picks = Object.entries(selection).map(([role, champion]) => pick(role, champion));
  const diagnosis = diagnoseComposition(picks);
  const correction = proposeCorrections({ picks, diagnosis, candidatesByRole });
  const protection = protectComposition({ diagnosis, correction });
  const optimizer = optimizeComposition({ diagnosis, correction });
  const recommendations = recommendProfiles({ diagnosis, optimizer });
  const mappedCandidates = mapCandidates({ optimizer, recommendations, candidatesByRole, selectedChampions: picks.map((item) => item.champion), currentPicks: picks });
  const evaluatedCandidates = evaluateCandidates({ diagnosis, optimizer, recommendations, mappedCandidates });
  const presentation = presentRecommendations({ optimizer, recommendations, mappedCandidates, evaluatedCandidates });
  const integration = presentForReport({ optimizer, recommendations, mappedCandidates, evaluatedCandidates, presentation });
  const polished = polishRecommendation({ optimizer, recommendations, mappedCandidates, evaluatedCandidates, presentation, integration });
  const strategicInputs = { optimizer, recommendations, mappedCandidates, evaluatedCandidates, presentation, integration, polished };
  const teamRecomposition = recomposeStrategicTeam(strategicInputs);
  const report = buildStrategicReport({
    diagnosis,
    correction,
    protection,
    recommendation: polished.section,
    compositionOptimization: optimizeStrategicComposition(strategicInputs),
    teamRecomposition,
  });
  return { picks, diagnosis, teamRecomposition, report, strategicInputs };
}

function verifyProposal(result) {
  const outcome = result.teamRecomposition;
  if (outcome.status !== "recomposed") {
    assert.equal(outcome.status, "no-validated-improvement", "Si no hay mejora verificada, LTA se abstiene");
    assert.equal(result.report.sections[1].teamRecomposition, undefined);
    return;
  }
  const proposal = outcome.proposal;
  assert.equal(proposal.pieces.length, 5);
  assert.deepEqual(proposal.pieces.map((item) => item.role), Object.keys(roleSheets));
  assert.equal(new Set(proposal.pieces.map((item) => item.champion)).size, 5);
  const changes = proposal.pieces.filter((item) => item.action === "replace");
  assert.ok(changes.length>=1 && changes.length<=2, "Nunca se reemplazan tres o más campeones por una necesidad");
  assert.ok(proposal.pieces.every((item) => ["keep", "replace"].includes(item.action)));
  assert.ok(proposal.improvement && proposal.explanation.length < 220);
  assert.ok(proposal.pieces.every((item) => item.reason.length < 180));
  const proposedPicks = proposal.pieces.map(({role, champion}) => pick(role, champion));
  const nextDiagnosis = diagnoseComposition(proposedPicks);
  if (result.diagnosis.plan.primaryIdentity) {
    assert.equal(proposal.identity.status, "preserved", "Se declara conservada solo una identidad verificada");
    assert.equal(nextDiagnosis.plan.primaryIdentity, result.diagnosis.plan.primaryIdentity, "El nuevo equipo conserva de verdad su identidad original");
  } else {
    assert.equal(proposal.identity.status, "unconfirmed", "Sin identidad original confirmada no se promete conservación");
  }
}

const clear = analyze({ top: "Ornn", jungle: "Sejuani", mid: "Orianna", botline: "Jinx", support: "Lulu" });
assert.equal(clear.diagnosis.plan.primaryIdentity, "Front to Back");
verifyProposal(clear);

const hybrid = analyze({ top: "Camille", jungle: "Vi", mid: "Ahri", botline: "Kai'Sa", support: "Rakan" });
assert.equal(hybrid.diagnosis.coherence.status, "hybrid");
verifyProposal(hybrid);

const incoherent = analyze({ top: "Fiora", jungle: "Elise", mid: "Xerath", botline: "Draven", support: "Lulu" });
assert.equal(incoherent.diagnosis.coherence.status, "incoherent");
verifyProposal(incoherent);

const userCase = analyze({ top: "Darius", jungle: "Garen", mid: "Azir", botline: "Cassiopeia", support: "Heimerdinger" });
verifyProposal(userCase);
assert.ok(userCase.teamRecomposition.status !== "recomposed" ||
  userCase.teamRecomposition.proposal.pieces.filter((piece) => piece.action === "replace").length<=2,
  "La composición aportada por el usuario no se sustituye entera");

assert.deepEqual(analyze({ top: "Ornn", jungle: "Sejuani", mid: "Orianna", botline: "Jinx", support: "Lulu" }).teamRecomposition,
  clear.teamRecomposition, "La recomposición sigue siendo determinista");

const roles = Object.keys(roleSheets);
const currentPicks = roles.map((role, index) => ({
  role, champion: `Actual ${index}`, identity: "Front to Back", fitByProfile: { engage: { signals: [], matchedFields: [] } },
}));
const alternativesByRole = Object.fromEntries(roles.map((role, index) => [role, [{
  champion: `Alternativa ${index}`, identity: "Front to Back", signals: ["engage"], matchedFields: ["strengths"], strengths: ["Iniciación"], weaknesses: [],
}]]));
const evaluatedAlternativesByRole = Object.fromEntries(roles.map((role, index) => [role, [{
  champion: `Alternativa ${index}`, priority: 1, strategicFit: "primary-identity", contradictsPlan: false, reason: "Refuerza la identidad principal.",
}]]));
const multiPieceInput = {
  optimizer: { status: "prioritized", priority: { need: { id: "engage", label: "Iniciación" }, reinforces: "la entrada coordinada", problemAvoided: "la falta de entrada" } },
  recommendations: { status: "recommended", plan: { primaryIdentity: null }, profiles: [{ id: "engage", label: "Iniciación", priority: 1, improves: "la entrada coordinada" }] },
  mappedCandidates: { status: "mapped", composition: { status: "complete", picks: currentPicks }, profiles: [{ id: "engage", alternativesByRole }] },
  evaluatedCandidates: { status: "evaluated", profiles: [{ id: "engage", alternativesByRole: evaluatedAlternativesByRole }] },
  presentation: { status: "presented" }, integration: { status: "presented" }, polished: { status: "polished" },
};
const multiPieceProposal = recomposeStrategicTeam(multiPieceInput);
assert.equal(multiPieceProposal.status, "recomposed");
assert.equal(multiPieceProposal.proposal.pieces.filter((item) => item.action === "replace").length, 2,
  "El optimizador sintético mejora dos posiciones y conserva las tres restantes");

const incomplete = { ...clear.strategicInputs, mappedCandidates: { ...clear.strategicInputs.mappedCandidates, composition: { status: "incomplete", picks: clear.picks.slice(0, 4) } } };
assert.equal(recomposeStrategicTeam(incomplete).status, "pending", "Una selección de cuatro campeones queda pendiente");
assert.equal(recomposeStrategicTeam({ ...incomplete, mappedCandidates: { ...incomplete.mappedCandidates, composition: { status: "incomplete", picks: clear.picks.slice(0, 1) } } }).status, "pending",
  "Una selección parcial no se trata como equipo completo");
assert.equal(recomposeStrategicTeam({ optimizer: { status: "no-priority" } }).status, "no-priority");

assert.deepEqual(clear.report.sections.map((section) => section.id), ["diagnosis", "correction", "protection"], "La propuesta reutiliza el bloque existente y no crea una sección nueva");
if (clear.teamRecomposition.status === "recomposed") assert.deepEqual(clear.report.sections[1].teamRecomposition, clear.teamRecomposition.proposal);
if (hybrid.teamRecomposition.status === "recomposed") assert.equal(hybrid.report.sections[1].teamRecomposition.identity.status, "preserved");
if (incoherent.teamRecomposition.status === "recomposed") assert.equal(incoherent.report.sections[1].teamRecomposition.identity.status, "unconfirmed");

console.log("Strategic Team Recomposer validado: equipos claros, híbridos e incoherentes, cinco roles, estado pendiente, identidad, informe y determinismo.");
