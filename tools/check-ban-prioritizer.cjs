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
  const strategicBans = prioritizeBans({ strategicRisks, strategicCounterplay, mappedCandidates, championCatalog: candidatesByRole });
  const report = buildStrategicReport({ diagnosis, correction, protection, strategicRisks, strategicCounterplay, strategicBans });
  return { diagnosis, correction, protection, mappedCandidates, riskInputs, strategicRisks, strategicCounterplay, strategicBans, report };
}

const references = [
  ["clara", { top: "Olaf", jungle: "Zyra", mid: "Heimerdinger", botline: "Lucian", support: "Tahm Kench" }, "coherent"],
  ["híbrida", { top: "Camille", jungle: "Vi", mid: "Ahri", botline: "Kai'Sa", support: "Rakan" }, "hybrid"],
  ["incoherente", { top: "Fiora", jungle: "Elise", mid: "Xerath", botline: "Draven", support: "Lulu" }, "incoherent"],
];

for (const [name, selection, expectedCoherence] of references) {
  const result = analyze(selection);
  assert.equal(result.diagnosis.coherence.status, expectedCoherence, `La referencia ${name} conserva su clasificación`);
  assert.deepEqual(prioritizeBans({
    strategicRisks: result.strategicRisks,
    strategicCounterplay: result.strategicCounterplay,
    mappedCandidates: result.mappedCandidates,
    championCatalog: candidatesByRole,
  }), result.strategicBans, `La priorización para composición ${name} es determinista`);
  assert.ok(["prioritized", "no-supported-threat", "no-matching-candidates", "no-candidates", "not-assessable"].includes(result.strategicBans.status));
  if (result.strategicBans.status === "prioritized") {
    assert.ok(result.strategicBans.bans.length <= 3);
    assert.deepEqual(result.strategicBans.bans.map((ban) => ban.priority), result.strategicBans.bans.map((_, index) => index + 1));
    const ownChampions = new Set(result.mappedCandidates.composition.picks.map((item) => item.champion.toLocaleLowerCase("es")));
    assert.ok(result.strategicBans.bans.every((ban) => !ownChampions.has(ban.champion.toLocaleLowerCase("es"))));
    assert.equal(new Set(result.strategicBans.bans.map((ban) => ban.champion.toLocaleLowerCase("es"))).size, result.strategicBans.bans.length);
    assert.ok(result.strategicBans.bans.every((ban) => ban.threatStyle && ["alta", "media", "baja"].includes(ban.severity)
      && ban.explanation && ban.expectedImpact));
  }
}

const rankedRisks = {
  status: "assessed",
  risks: [
    { priority: 3, type: "single-point-dependency", severity: "media", threatens: "la continuidad de la iniciación" },
    { priority: 2, type: "identity-unconfirmed", severity: "alta", threatens: "la coordinación del plan común" },
    { priority: 1, type: "priority-uncovered", severity: "alta", threatens: "la disputa de objetivos" },
  ],
};
const rankedCounterplay = adviseCounterplay({ strategicRisks: rankedRisks });
const banCatalog = {
  top: [
    { champion: "Zona", strengths: "Control de zonas · poke", function: "asedio", identity: "Poke", tempo: "late" },
    { champion: "Carga", strengths: "Iniciación · frontline", function: "engage teamfight", identity: "Teamfight", tempo: "early" },
  ],
  jungle: [
    { champion: "Flanco", strengths: "Dive · pick", function: "flanqueo burst", identity: "Dive", tempo: "early" },
    { champion: "Zona", strengths: "Visión · objetivos", function: "control del mapa", identity: "Poke", tempo: "late" },
  ],
};
const completeMapped = { status: "mapped", composition: { status: "complete", picks: [
  { role: "top", champion: "Ornn" }, { role: "jungle", champion: "Sejuani" }, { role: "mid", champion: "Orianna" },
  { role: "botline", champion: "Jinx" }, { role: "support", champion: "Lulu" },
] } };
const prioritized = prioritizeBans({ strategicRisks: rankedRisks, strategicCounterplay: rankedCounterplay, mappedCandidates: completeMapped, championCatalog: banCatalog });
assert.equal(prioritized.status, "prioritized");
assert.deepEqual(prioritized.bans.map((ban) => [ban.champion, ban.threatType]), [
  ["Zona", "objective-contest"], ["Carga", "forced-engage"], ["Flanco", "focused-dive"],
], "Prioriza severidad y reparte los bans entre estilos de amenaza distintos");
assert.equal(prioritizeBans({ strategicRisks: rankedRisks, strategicCounterplay: rankedCounterplay, mappedCandidates: completeMapped, championCatalog: banCatalog }).bans[0].champion, prioritized.bans[0].champion);
assert.deepEqual(prioritizeBans({ strategicRisks: { status: "pending", risks: [] }, strategicCounterplay: { status: "pending", threats: [] }, mappedCandidates: { composition: { status: "incomplete", picks: [] } }, championCatalog: banCatalog }), { status: "pending", bans: [] });
assert.deepEqual(prioritizeBans({ strategicRisks: { status: "assessed", risks: [] }, strategicCounterplay: { status: "no-supported-threat", threats: [] }, mappedCandidates: completeMapped, championCatalog: banCatalog }), { status: "no-supported-threat", bans: [] });
assert.deepEqual(prioritizeBans({ strategicRisks: rankedRisks, strategicCounterplay: rankedCounterplay, mappedCandidates: completeMapped, championCatalog: {} }), { status: "no-candidates", bans: [] });
assert.deepEqual(prioritizeBans({ strategicRisks: rankedRisks, strategicCounterplay: rankedCounterplay, mappedCandidates: completeMapped, championCatalog: { top: [{ champion: "Ornn", strengths: "frontline" }] } }), { status: "no-matching-candidates", bans: [] }, "No recomienda integrantes del propio equipo ni candidatos sin señal de amenaza");

const incompleteRun = analyze({ top: "Olaf", jungle: "Zyra", mid: "Heimerdinger", botline: "Lucian", support: "Tahm Kench" });
const incompleteMapped = structuredClone(incompleteRun.mappedCandidates);
incompleteMapped.composition = { status: "incomplete", picks: incompleteMapped.composition.picks.slice(0, 4) };
const incompleteRisks = assessStrategicRisks({ ...incompleteRun.riskInputs, mappedCandidates: incompleteMapped });
const incompleteCounterplay = adviseCounterplay({ strategicRisks: incompleteRisks });
assert.deepEqual(prioritizeBans({ strategicRisks: incompleteRisks, strategicCounterplay: incompleteCounterplay, mappedCandidates: incompleteMapped, championCatalog: candidatesByRole }), { status: "pending", bans: [] }, "Una composición incompleta aún no genera bans");

const ownPick = { ...completeMapped.composition.picks[0], strengths: "control de zonas poke visión objetivos" };
const ownOnlyMapped = { status: "mapped", composition: { status: "complete", picks: [ownPick, ...completeMapped.composition.picks.slice(1)] } };
assert.deepEqual(prioritizeBans({
  strategicRisks: { status: "assessed", risks: [{ type: "priority-uncovered", severity: "alta", threatens: "la disputa de objetivos" }] },
  strategicCounterplay: { status: "advised", threats: [{ priority: 1, type: "objective-contest", severity: "alta", threatens: "la disputa de objetivos" }] },
  mappedCandidates: ownOnlyMapped,
  championCatalog: { top: [{ champion: "Ornn", strengths: "control de zonas poke visión objetivos" }] },
}), { status: "no-matching-candidates", bans: [] }, "Nunca recomienda banear una pieza de la composición propia");

const clearReportInput = analyze({ top: "Ornn", jungle: "Sejuani", mid: "Orianna", botline: "Jinx", support: "Lulu" });
const reportWithBans = buildStrategicReport({
  diagnosis: clearReportInput.diagnosis,
  correction: clearReportInput.correction,
  protection: clearReportInput.protection,
  strategicRisks: rankedRisks,
  strategicCounterplay: rankedCounterplay,
  strategicBans: prioritized,
});
const referenceReport = buildStrategicReport({
  diagnosis: clearReportInput.diagnosis,
  correction: clearReportInput.correction,
  protection: clearReportInput.protection,
  strategicRisks: rankedRisks,
  strategicCounterplay: rankedCounterplay,
});
assert.deepEqual(reportWithBans.sections, referenceReport.sections, "Los bans se conservan como metadato y no añaden un bloque visible");
assert.deepEqual(reportWithBans.strategicBans, prioritized);
assert.equal(JSON.stringify(reportWithBans.sections).includes("Zona"), false);

console.log("Ban Prioritizer validado: referencias claras, híbridas e incoherentes, catálogo, exclusión del equipo propio, priorización estable, estado incompleto, determinismo y metadatos internos del informe.");
