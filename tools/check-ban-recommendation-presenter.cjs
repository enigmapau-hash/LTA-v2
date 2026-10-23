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
const { assessStrategicRisks } = require("../src/domain/strategic-risk-analyzer.js");
const { adviseCounterplay } = require("../src/domain/strategic-counterplay-advisor.js");
const { prioritizeBans } = require("../src/domain/ban-prioritizer.js");
const { presentBanRecommendations } = require("../src/domain/ban-recommendation-presenter.js");
const { integrateStrategicReportBans } = require("../src/report/strategic-report-ban-integration.js");
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
  const strategicCompositionOptimization = optimizeStrategicComposition({ optimizer, recommendations, mappedCandidates, evaluatedCandidates, presentation, integration, polished });
  const teamRecomposition = recomposeStrategicTeam({ optimizer, recommendations, mappedCandidates, evaluatedCandidates, presentation, integration, polished });
  const riskInputs = {
    optimizer, recommendations, mappedCandidates, evaluatedCandidates, presentation, integration, polished,
    strategicCompositionOptimization, teamRecomposition,
  };
  const strategicRisks = assessStrategicRisks(riskInputs);
  const strategicCounterplay = adviseCounterplay({ strategicRisks });
  const strategicBans = prioritizeBans({ strategicRisks, strategicCounterplay, protection, mappedCandidates, currentPicks: picks, championCatalog: candidatesByRole });
  const banPresentation = presentBanRecommendations({ banPrioritizer: strategicBans });
  const reportInput = { diagnosis, correction, protection, strategicRisks, strategicCounterplay, strategicBans };
  const report = buildStrategicReport({ ...reportInput, strategicBanPresentation: banPresentation });
  return { diagnosis, mappedCandidates, riskInputs, strategicBans, banPresentation, reportInput, report };
}

const references = [
  ["clara", { top: "Olaf", jungle: "Zyra", mid: "Heimerdinger", botline: "Lucian", support: "Tahm Kench" }, "coherent"],
  ["híbrida", { top: "Camille", jungle: "Vi", mid: "Ahri", botline: "Kai'Sa", support: "Rakan" }, "hybrid"],
  ["incoherente", { top: "Fiora", jungle: "Elise", mid: "Xerath", botline: "Draven", support: "Lulu" }, "incoherent"],
];

for (const [name, selection, expectedCoherence] of references) {
  const result = analyze(selection);
  assert.equal(result.diagnosis.coherence.status, expectedCoherence, `La referencia ${name} conserva su tipo de composición`);
  assert.deepEqual(presentBanRecommendations({ banPrioritizer: result.strategicBans }), result.banPresentation, `La presentación ${name} es determinista`);
  const protectionSection = result.report.sections.find((section) => section.id === "protection");
  const expectedIntegration = integrateStrategicReportBans({ banPresentation: result.banPresentation });
  assert.deepEqual(protectionSection.strategicBans || null, expectedIntegration?.bans || null, `La integración ${name} conserva solo los bans presentados`);
  assert.equal(result.report.sections.length, 3, "La integración conserva los tres bloques existentes del informe");
  assert.equal(result.banPresentation.status, "presented", "Cada draft completo recibe recomendaciones de ban");
  if (result.banPresentation.status === "presented") {
    assert.equal(result.banPresentation.bans.length, 3);
    assert.equal(new Set(result.banPresentation.bans.map((ban) => ban.threat)).size, 3, "Bans sobre amenazas diferentes");
    assert.deepEqual(result.banPresentation.bans.map((ban) => ban.priority), result.banPresentation.bans.map((_, index) => index + 1));
    assert.ok(result.banPresentation.bans.every((ban) => ban.champion && ban.threat && ["alta", "media", "baja"].includes(ban.severity)
      && ban.reason && ban.expectedImpact));
  }
}

const prioritization = {
  status: "prioritized",
  bans: [
    { priority: 3, champion: "B", severity: "media", threatStyle: "Dive", explanation: "B potencia el dive sobre la backline.", expectedImpact: "Reduce el acceso a la pieza clave." },
    { priority: 2, champion: "A", severity: "alta", threatStyle: "Disputa de objetivos", explanation: "A potencia el control de zonas contra el plan.", expectedImpact: "Reduce el control previo a objetivos." },
    { priority: 1, champion: "C", severity: "alta", threatStyle: "Engage", explanation: "C potencia la iniciación coordinada.", expectedImpact: "Reduce la capacidad de forzar peleas." },
    { priority: 4, champion: "D", severity: "baja", threatStyle: "Pick", explanation: "D facilita cazadas.", expectedImpact: "Reduce la amenaza de pick." },
    { priority: 5, champion: "a", severity: "alta", threatStyle: "Poke", explanation: "Duplicado normalizado.", expectedImpact: "No debe desplazar la primera entrada." },
  ],
};
const snapshot = structuredClone(prioritization);
const compact = presentBanRecommendations({ banPrioritizer: prioritization });
assert.equal(compact.status, "presented");
assert.deepEqual(compact.bans.map((ban) => ban.champion), ["C", "A", "B"], "Prioriza severidad y orden fuente, limita a tres y elimina duplicados");
assert.deepEqual(prioritization, snapshot, "No modifica la priorización recibida");
assert.deepEqual(presentBanRecommendations({ banPrioritizer: prioritization }), compact, "Mantiene orden y contenido entre ejecuciones");
assert.deepEqual(presentBanRecommendations({ banPrioritizer: { status: "pending", bans: [] } }), { status: "pending", bans: [] });
assert.deepEqual(presentBanRecommendations({ banPrioritizer: { status: "not-assessable", bans: [] } }), { status: "not-assessable", bans: [] });
assert.deepEqual(presentBanRecommendations({ banPrioritizer: { status: "no-supported-threat", bans: [] } }), { status: "not-assessable", bans: [] });
assert.deepEqual(presentBanRecommendations({ banPrioritizer: { status: "prioritized", bans: [] } }), { status: "no-bans", bans: [] });

const completeBase = analyze({ top: "Fiora", jungle: "Elise", mid: "Xerath", botline: "Draven", support: "Lulu" });
const incompleteMapped = structuredClone(completeBase.mappedCandidates);
assert.equal(incompleteMapped.composition?.status, "complete", "La brecha de cohesión permite comprobar el flujo incompleto");
incompleteMapped.composition = { status: "incomplete", picks: incompleteMapped.composition.picks.slice(0, 4) };
const incompleteRisks = assessStrategicRisks({ ...completeBase.riskInputs, mappedCandidates: incompleteMapped });
const incompleteCounterplay = adviseCounterplay({ strategicRisks: incompleteRisks });
const incompleteBans = prioritizeBans({ strategicRisks: incompleteRisks, strategicCounterplay: incompleteCounterplay, mappedCandidates: incompleteMapped, championCatalog: candidatesByRole });
const incomplete = presentBanRecommendations({ banPrioritizer: incompleteBans });
assert.equal(incompleteBans.status, "pending");
assert.deepEqual(incomplete, { status: "pending", bans: [] }, "La composición incompleta mantiene la presentación pendiente");
const incompleteReport = buildStrategicReport({ ...completeBase.reportInput, strategicBanPresentation: incomplete });
assert.equal(incompleteReport.sections.find((section) => section.id === "protection").strategicBans, undefined, "No se muestran bans cuando la composición sigue incompleta");

const clear = analyze({ top: "Ornn", jungle: "Sejuani", mid: "Orianna", botline: "Jinx", support: "Lulu" });
const reportWithoutPresentation = buildStrategicReport(clear.reportInput);
assert.equal(clear.report.sections.length, reportWithoutPresentation.sections.length, "Integra bans en un bloque existente sin añadir secciones");
assert.deepEqual(clear.report.sections.slice(0, 2), reportWithoutPresentation.sections.slice(0, 2), "No altera diagnóstico ni corrección");
assert.deepEqual(clear.report.sections[2].strategicBans, clear.banPresentation.bans.slice(0, 3), "La integración muestra tres bans dentro de protección");
assert.deepEqual(clear.report.strategicBanPresentation, clear.banPresentation, "El informe conserva la presentación solo como dato interno");
assert.equal(JSON.stringify(clear.report.sections).includes("strategicBanPresentation"), false, "No filtra el nombre de la capa interna a los bloques del informe");

console.log("Ban Recommendation Presenter validado: composiciones claras, híbridas e incoherentes, estado incompleto, severidad, compacidad, deduplicación, determinismo e integración interna.");
