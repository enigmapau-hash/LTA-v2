#!/usr/bin/env node
"use strict";
// Offline read-only audit. No changes to picks, bans, workbook or decisions.
const assert=require("node:assert/strict");
const {loadCandidateCatalog}=require("./recommendation-audit.cjs");
const {generateRepresentativeCompositions}=require("./recommendation-audit-fixtures.cjs");
const {diagnoseComposition}=require("../src/domain/diagnostic-engine.js");
const {proposeCorrections}=require("../src/domain/correction-engine.js");
const {optimizeComposition}=require("../src/domain/composition-optimizer.js");
const {recommendProfiles}=require("../src/domain/strategic-recommendation-engine.js");
const {mapCandidates}=require("../src/domain/championship-candidate-mapper.js");
const {evaluateCandidates}=require("../src/domain/candidate-evaluator.js");

const catalog=loadCandidateCatalog();
const roles=["top","jungle","mid","botline","support"];
function picksFor(name, selection) {
  return roles.map(role=>{
    const champion=selection[role];
    const found=(catalog[role]||[]).find(item=>item.champion===champion);
    assert.ok(found,name+": missing "+champion+" "+role+" in Draft Pool.xlsx");
    return {...found,role};
  });
}
const screenshotCases=[
  {id:"user-frontline",picks:picksFor("user-frontline",{
    top:"Irelia",jungle:"Kha'Zix",mid:"Jayce",botline:"Nilah",support:"Ashe"})},
  {id:"user-peel",picks:picksFor("user-peel",{
    top:"Garen",jungle:"Elise",mid:"Azir",botline:"Nilah",support:"Brand"})},
];
const cases=[...generateRepresentativeCompositions(catalog),...screenshotCases];
function replacementEvidence(picks, diagnosis, candidate) {
  const original=picks.find(pick=>pick.role===candidate.role);
  if(!original) return {champion:candidate.champion,role:candidate.role,assessable:false,why:"missing-original-role"};
  const normalizeAttrs=value=>Array.isArray(value)?value.join(" · "):String(value||"").trim();
  const next=picks.map(pick=>pick.role===candidate.role?{
    role:pick.role,champion:candidate.champion,identity:normalizeAttrs(candidate.identity),
    function:normalizeAttrs(candidate.function),tempo:normalizeAttrs(candidate.tempo),
    strengths:normalizeAttrs(candidate.strengths),weaknesses:normalizeAttrs(candidate.weaknesses),
  }:pick);
  if(next.some(pick=>!pick.identity||!pick.function||!pick.tempo||!pick.strengths||!pick.weaknesses))
    return {champion:candidate.champion,role:candidate.role,assessable:false,why:"incomplete-candidate-evidence"};
  const revised=diagnoseComposition(next);
  const oldNeedIds=new Set((diagnosis.execution?.missing||[]).map(x=>x.id));
  const newNeedIds=new Set((revised.execution?.missing||[]).map(x=>x.id));
  return {champion:candidate.champion,role:candidate.role,replaces:original.champion,assessable:revised.status==="assessed",
    oldPlan:diagnosis.plan?.primaryIdentity||null,newPlan:revised.plan?.primaryIdentity||null,
    preservesPlan:revised.plan?.primaryIdentity===diagnosis.plan?.primaryIdentity && Boolean(diagnosis.plan?.primaryIdentity),
    previouslyMissing:[...oldNeedIds],remainingMissing:[...newNeedIds],
    fixedMissing:[...oldNeedIds].filter(id=>!newNeedIds.has(id)),
    newDeficits:[...newNeedIds].filter(id=>!oldNeedIds.has(id)),
  };
}
function audit(item){
  const diagnosis=diagnoseComposition(item.picks);
  const correction=proposeCorrections({picks:item.picks,diagnosis,candidatesByRole:catalog});
  const optimizer=optimizeComposition({diagnosis,correction});
  const recommendations=recommendProfiles({diagnosis,optimizer});
  const mappedCandidates=mapCandidates({
    diagnosis,optimizer,recommendations,candidatesByRole:catalog,
    selectedChampions:item.picks.map(p=>p.champion),currentPicks:item.picks,
  });
  const evaluatedCandidates=evaluateCandidates({diagnosis,optimizer,recommendations,mappedCandidates});
  const reasons=[];
  if(diagnosis.status!=="assessed")reasons.push("diagnosis-unavailable");
  if(diagnosis.primaryProblem?.type==="strategic-contradiction")reasons.push("contradictory-plan");
  if(diagnosis.plan?.clear&&!diagnosis.execution?.missing?.length)reasons.push("requirements-covered");
  if(diagnosis.primaryProblem?.type==="cohesion-gap")reasons.push("cohesion-gap");
  if(correction.status==="no-supported-correction"&&correction.limitingFactor)
    reasons.push("correction-factors-without-qualifying-profile");
  if(optimizer.status==="prioritized"&&mappedCandidates.status!=="mapped")
    reasons.push("candidate-mapper-"+mappedCandidates.status);
  if(mappedCandidates.status==="mapped"&&evaluatedCandidates.status!=="evaluated")
    reasons.push("candidate-evaluator-"+evaluatedCandidates.status);
  return {
    id:item.id,
    picks:item.picks.map(({role,champion})=>role+":"+champion),
    plan:diagnosis.plan?.primaryIdentity||null,
    coherence:diagnosis.coherence?.status||null,
    primaryProblem:diagnosis.primaryProblem?.type||null,
    evidence:[...(diagnosis.primaryProblem?.evidence||[])],
    requirementsMissing:(diagnosis.execution?.missing||[]).map(x=>x.label||x.id),
    factorConsidered:correction.limitingFactor||null,
    correctionStatus:correction.status,
    correctionExplanation:correction.explanation,
    correctionProfiles:(correction.improvements||[]).map(x=>({id:x.profile?.id,limitingFactor:x.limitingFactor,previewCount:x.candidates?.length||0})),
    optimizerStatus:optimizer.status,
    recommendationStatus:recommendations.status,
    mapperStatus:mappedCandidates.status,
    evaluatedStatus:evaluatedCandidates.status,
    ...(item.id.startsWith("user-") ? {whatIf:((mappedCandidates.profiles||[])[0]?.candidates||[])
      .map(candidate=>replacementEvidence(item.picks,diagnosis,candidate))} : {}),
    evaluatedProfiles:(evaluatedCandidates.profiles||[]).map(x=>({
      id:x.id,champions:(x.candidates||[]).map(y=>y.champion),
    })),
    mappedRoles:(mappedCandidates.profiles||[]).map(x=>({
      id:x.id,roleAlternativeCounts:Object.fromEntries(Object.entries(x.alternativesByRole||{}).map(([r,a])=>[r,a.length])),
    })),
    analysisReasons:reasons,
  };
}
const traced=cases.map(audit);
assert.equal(traced.length,12);
assert.deepEqual(traced.slice(-2).map(x=>x.id),["user-frontline","user-peel"]);
for(const x of traced.slice(-2)){
  assert.equal(x.correctionStatus,"proposed","The screenshots are positive reference controls: "+x.id);
  assert.equal(x.optimizerStatus,"prioritized","Do not regress user's evidenced priority: "+x.id);
  assert.equal(x.mapperStatus,"mapped","Do not lose the screenshot's candidates: "+x.id);
}
assert.ok(traced.some(x=>x.optimizerStatus==="no-priority"),"The audit needs a true abstention control");
assert.ok(traced.some(x=>x.optimizerStatus==="prioritized"),"The audit needs a positive control");
console.log(JSON.stringify({checkedAt:"2026-10-23",referenceCount:traced.length,
  statuses:traced.reduce((acc,x)=>(acc[x.optimizerStatus]=(acc[x.optimizerStatus]||0)+1,acc),{}),
  cases:traced},null,2));
module.exports={audit,traceCorrections:()=>traced};
