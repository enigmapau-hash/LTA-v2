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
  const strategicBans = prioritizeBans({ strategicRisks, strategicCounterplay, protection, mappedCandidates, currentPicks: picks, championCatalog: candidatesByRole });
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
    protection: result.protection,
    mappedCandidates: result.mappedCandidates,
    currentPicks: Object.entries(selection).map(([role, champion]) => ({ role, champion })),
    championCatalog: candidatesByRole,
  }), result.strategicBans, `La priorización para composición ${name} es determinista`);
  assert.equal(result.strategicBans.status, "prioritized", `Cinco picks válidos generan bans en ${name}`);
  assert.equal(result.strategicBans.bans.length, 3, `La composición ${name} cubre tres amenazas`);
  assert.equal(new Set(result.strategicBans.bans.map((ban) => ban.threatType)).size, 3, `La composición ${name} no repite un estilo de amenaza`);
  if (result.strategicBans.status === "prioritized") {
    assert.ok(result.strategicBans.bans.length <= 3);
    assert.deepEqual(result.strategicBans.bans.map((ban) => ban.priority), result.strategicBans.bans.map((_, index) => index + 1));
    const ownChampions = new Set(Object.values(selection).map((name) => name.toLocaleLowerCase("es")));
    assert.ok(result.strategicBans.bans.every((ban) => !ownChampions.has(ban.champion.toLocaleLowerCase("es"))));
    assert.equal(new Set(result.strategicBans.bans.map((ban) => ban.champion.toLocaleLowerCase("es"))).size, result.strategicBans.bans.length);
    assert.ok(result.strategicBans.bans.every((ban) => ban.threatStyle && ["alta", "media", "baja"].includes(ban.severity)
      && ban.explanation && ban.expectedImpact));
  }
}

const expandedReferences = [
  { top: "Fiora", jungle: "Evelynn", mid: "Galio", botline: "Kai'Sa", support: "Milio" },
  { top: "Ornn", jungle: "Sejuani", mid: "Orianna", botline: "Jinx", support: "Lulu" },
  { top: "Jayce", jungle: "Nidalee", mid: "Xerath", botline: "Ezreal", support: "Karma" },
  { top: "Malphite", jungle: "Wukong", mid: "Yasuo", botline: "Miss Fortune", support: "Rell" },
  { top: "Fiora", jungle: "Viego", mid: "Twisted Fate", botline: "Ezreal", support: "Braum" },
];
for (const selection of expandedReferences) {
  const analyzed = analyze(selection);
  const { strategicBans: bans } = analyzed;
  assert.equal(bans.status, "prioritized", "El draft completo siempre obtiene bans respaldados por el catálogo");
  assert.equal(bans.bans.length, 3);
  assert.equal(new Set(bans.bans.map((ban) => ban.champion)).size, 3);
  assert.equal(new Set(bans.bans.map((ban) => ban.threatType)).size, 3, "Diversidad de amenaza");
  assert.ok(bans.bans.every((ban) => !Object.values(selection).includes(ban.champion)), "No banea picks propios");
  assert.deepEqual(prioritizeBans({
    strategicRisks: analyzed.strategicRisks,
    strategicCounterplay: analyzed.strategicCounterplay,
    protection: analyzed.protection,
    mappedCandidates: analyzed.mappedCandidates,
    currentPicks: Object.entries(selection).map(([role, champion]) => ({ role, champion })),
    championCatalog: candidatesByRole,
  }), bans, "Determinismo");
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
// The workbook splits Shaco/Kayn/Varus by build, but the game bans the
// champion once. Candidate names and allied picks must use the same identity.
const buildCatalog = {
  jungle: [
    { champion: "Kayn (Azul)", strengths: "Dive · flanqueo · movilidad", function: "Asesino", identity: "Dive", tempo: "Early" },
    { champion: "Kayn (Rojo)", strengths: "Dive · teamfight · movilidad", function: "Bruiser", identity: "Teamfight", tempo: "Mid" },
    { champion: "Shaco (AD)", strengths: "Dive · burst", function: "Asesino", identity: "Pick", tempo: "Early" },
    { champion: "Shaco (AP)", strengths: "Pick · ganks · burst", function: "Mago", identity: "Pick", tempo: "Mid" },
  ],
  botline: [
    { champion: "Varus (On-Hit)", strengths: "DPS · daño sostenido", function: "Carry", identity: "Front to Back", tempo: "Late" },
    { champion: "Varus (Letalidad)", strengths: "Poke · asedio", function: "Carry", identity: "Poke", tempo: "Mid" },
  ],
};
const buildBasedBans = prioritizeBans({
  protection: { status: "assessed", threats: [
    { id: "dive", priority: "principal", style: "Dive" },
    { id: "pick", priority: "alta", style: "Pick" },
    { id: "scaling", priority: "alta", style: "Escalado" },
  ] },
  mappedCandidates: completeMapped,
  championCatalog: buildCatalog,
});
assert.equal(buildBasedBans.status,"prioritized");
assert.deepEqual(buildBasedBans.bans.map(b => b.champion).sort(),["Kayn","Shaco","Varus"],
  "Kayn, Shaco y Varus se banean por campeón base, nunca por build");
assert.equal(new Set(buildBasedBans.bans.map(b => b.champion)).size,buildBasedBans.bans.length);
assert.ok(buildBasedBans.bans.every(b => !/[()]/.test(b.champion)),
  "El nombre mostrado en un ban es el del campeón, no el de su build");
const buildAlliedPicks = [
  {role:"top",champion:"Ornn"}, {role:"jungle",champion:"Kayn (Azul)"},
  {role:"mid",champion:"Orianna"}, {role:"botline",champion:"Varus (On-Hit)"},
  {role:"support",champion:"Shaco (AP)"},
];
const mixedBans=prioritizeBans({
  protection:{status:"assessed",threats: [
    {id:"dive",priority:"principal",style:"Dive"},
    {id:"pick",priority:"alta",style:"Pick"},
  ]},
  currentPicks:buildAlliedPicks,
  championCatalog:{
    ...buildCatalog,
    top:[{champion:"Contrincante",strengths:"Dive · pick",function:"Asesino",identity:"Dive",tempo:"Early"}],
  },
});
assert.equal(mixedBans.status,"prioritized");
assert.deepEqual(mixedBans.bans.map(b=>b.champion),["Contrincante"],
  "No banear Kayn, Shaco o Varus aliados aunque aparezca su otra variante en el catálogo");
assert.deepEqual(prioritizeBans({
  protection:{status:"assessed",threats:[]},
  currentPicks:[
    {role:"top",champion:"Ornn"}, {role:"jungle",champion:"Kayn (Azul)"},
    {role:"mid",champion:"Orianna"}, {role:"botline",champion:"Varus (Letalidad)"},
    {role:"support",champion:"Kayn (Rojo)"},
  ],
  championCatalog:buildCatalog,
}),{status:"not-assessable",bans:[]},
  "Dos builds del mismo campeón no pueden ocupar picks aliados independientes");
const unknownBuildName=prioritizeBans({
  protection:{status:"assessed",threats:[{id:"dive",priority:"principal",style:"Dive"}]},
  mappedCandidates:completeMapped,
  championCatalog:{jungle:[{
    champion:"Personaje (Variante ajena)",strengths:"Dive",function:"Asesino",identity:"Dive",tempo:"Early",
  }]},
});
assert.equal(unknownBuildName.bans[0].champion,"Personaje (Variante ajena)",
  "No transformar nombres parentéticos fuera de las tres familias conocidas");
assert.deepEqual(prioritizeBans({
  protection:{status:"assessed",threats:[]},mappedCandidates:completeMapped,championCatalog:buildCatalog,
}),prioritizeBans({
  protection:{status:"assessed",threats:[]},mappedCandidates:completeMapped,
  championCatalog:Object.fromEntries(Object.entries(buildCatalog).reverse().map(([role,items])=>[role,[...items].reverse()])),
}),"Los bans canónicos deben ser independientes del orden del Excel");

const prioritized = prioritizeBans({ strategicRisks: rankedRisks, strategicCounterplay: rankedCounterplay, mappedCandidates: completeMapped, championCatalog: banCatalog });
assert.equal(prioritized.status, "prioritized");
assert.deepEqual(prioritized.bans.map((ban) => [ban.champion, ban.threatType]), [
  ["Zona", "objective-contest"], ["Carga", "forced-engage"], ["Flanco", "focused-dive"],
], "Prioriza severidad y reparte los bans entre estilos de amenaza distintos");
assert.equal(prioritizeBans({ strategicRisks: rankedRisks, strategicCounterplay: rankedCounterplay, mappedCandidates: completeMapped, championCatalog: banCatalog }).bans[0].champion, prioritized.bans[0].champion);
assert.deepEqual(prioritizeBans({ strategicRisks: { status: "pending", risks: [] }, strategicCounterplay: { status: "pending", threats: [] }, mappedCandidates: { composition: { status: "incomplete", picks: [] } }, championCatalog: banCatalog }), { status: "pending", bans: [] });
assert.deepEqual(prioritizeBans({ strategicRisks: { status: "assessed", risks: [] }, strategicCounterplay: { status: "no-supported-threat", threats: [] }, mappedCandidates: completeMapped, championCatalog: banCatalog }), { status: "no-supported-threat", bans: [] }, "La ruta legada conserva su condición anterior");
const fallback = prioritizeBans({
  strategicRisks: { status: "assessed", risks: [] },
  strategicCounterplay: { status: "no-supported-threat", threats: [] },
  protection: { status: "no-supported-threat", threats: [] },
  mappedCandidates: completeMapped, championCatalog: banCatalog,
});
assert.equal(fallback.status, "prioritized", "La protección general cubre equipos completos aunque no existan riesgos específicos");
assert.equal(fallback.bans.length, 3, "Tres estilos de amenaza cuando el catálogo permite tres");
assert.equal(new Set(fallback.bans.map((ban) => ban.threatType)).size, 3);
const fallbackWithoutRecommendation = prioritizeBans({
  strategicRisks: { status: "no-priority", risks: [] },
  strategicCounterplay: { status: "not-assessable", threats: [] },
  protection: { status: "no-supported-threat", threats: [] },
  mappedCandidates: { status: "no-priority", profiles: [] },
  currentPicks: completeMapped.composition.picks,
  championCatalog: banCatalog,
});
assert.deepEqual(fallbackWithoutRecommendation.bans, fallback.bans,
  "La ausencia deliberada de reemplazos no altera los bans de Protección");
assert.deepEqual(prioritizeBans({
  protection: { status: "assessed", threats: [] },
  mappedCandidates: { status: "no-priority" },
  currentPicks: completeMapped.composition.picks.slice(0, 4),
  championCatalog: banCatalog,
}), { status: "not-assessable", bans: [] }, "El fallback no acepta cuatro picks como equipo completo");

assert.deepEqual(prioritizeBans({ strategicRisks: rankedRisks, strategicCounterplay: rankedCounterplay, mappedCandidates: completeMapped, championCatalog: {} }), { status: "no-candidates", bans: [] });
assert.deepEqual(prioritizeBans({ strategicRisks: rankedRisks, strategicCounterplay: rankedCounterplay, mappedCandidates: completeMapped, championCatalog: { top: [{ champion: "Ornn", strengths: "frontline" }] } }), { status: "no-matching-candidates", bans: [] }, "No recomienda integrantes del propio equipo ni candidatos sin señal de amenaza");

const incompleteRun = analyze({ top: "Fiora", jungle: "Elise", mid: "Xerath", botline: "Draven", support: "Lulu" });
const incompleteMapped = structuredClone(incompleteRun.mappedCandidates);
assert.equal(incompleteMapped.composition?.status, "complete", "La brecha real permite comprobar la ruta incompleta");
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
