#!/usr/bin/env node
"use strict";
// Reproducible offline editorial audit. No network, no scraping, no APIs.
const assert=require("node:assert/strict");
const viability=require("../src/data/role-viability-26-21.js");
const editorial=require("../src/data/role-editorial-26-21.js");
const {loadCandidateCatalog,auditRecommendations}=require("./recommendation-audit.cjs");
const {auditProfileKnowledge,mapCandidates}=require("../src/domain/championship-candidate-mapper.js");
const catalog=loadCandidateCatalog();
const countByRole=Object.fromEntries(Object.entries(catalog).map(([r,cs])=>[r,cs.length]));
assert.equal(Object.values(countByRole).reduce((n,c)=>n+c,0),266);
const records=viability.candidatesForReview(catalog);
const key=(item)=>item.champion.toLocaleLowerCase("es")+"|"+item.role;
const workbookPairs=new Set(records.map(key));
assert.equal(editorial.entries.length,49,"Revisión editorial limitada a 49 parejas, no al catálogo completo");
assert.equal(new Set(editorial.entries.map(key)).size,49,"Sin duplicar pares");
for(const item of editorial.entries){
  assert.ok(workbookPairs.has(key(item)),item.champion+" "+item.role+" debe figurar en Draft Pool.xlsx");
  assert.match(item.source,/^https:\/\//);
  assert.equal(item.reviewedAt,"2026-10-23");
  if(item.status==="principal") {
    assert.equal(item.sourcePatch,"16.21");
    assert.match(item.source,/op.gg/);
  }else assert.equal(item.sourcePatch,null,"No asignar parche de OP.GG a una posición Wiki");
}
const counts=Object.fromEntries(["principal","compatible","secundaria","experimental","sin-verificar"].map(status=>[status,records.filter(item=>item.status===status).length]));
assert.deepEqual(counts,{principal:7,compatible:37,secundaria:4,experimental:1,"sin-verificar":217});
for(const [champion,role,status] of [
  ["Maokai","support","principal"],["Maokai","top","secundaria"],["Aatrox","top","principal"],
  ["K'Sante","top","principal"],["Diana","jungle","principal"],["Diana","mid","principal"],
  ["Aurora","mid","principal"],["Aurora","top","compatible"],
  ["Seraphine","support","principal"],["Seraphine","botline","compatible"],
  ["Smolder","top","secundaria"],["Corki","mid","secundaria"],
]){
 assert.equal(viability.assess(champion,role).status,status,champion+" "+role);
}
const reviewedCatalog=Object.fromEntries(Object.entries(catalog).map(([role,cs])=>[
 role,cs.filter(c=>viability.isReviewedRecommendation(viability.assess(c.champion,role)))
]));
const full=auditProfileKnowledge(catalog).profiles;
const filtered=auditProfileKnowledge(reviewedCatalog).profiles;
for(let i=0;i<filtered.length;i++)
 assert.ok(filtered[i].candidateCount>=2,filtered[i].id+" requiere al menos dos parejas avaladas");
const beforeCases=auditRecommendations(catalog).cases;
assert.equal(beforeCases.length,10);
for(const name of ["hybrid","incoherent"]){
 const fixture=beforeCases.find(item=>item.id===name);
 assert.ok(fixture?.mentions.length>0,name+" mantiene alternativas priorizadas");
}
const mock={optimizer:{status:"prioritized"},recommendations:{status:"recommended",profiles:[{
 id:"frontline",label:"Primera línea",priority:1,reason:"Prueba",improves:"resistencia",
}]},candidatesByRole:{top:[
 {champion:"Maokai",identity:"Front to Back",strengths:"Frontline · Tanque",function:"Tanque",tempo:"Mid"},
 {champion:"Aatrox",identity:"Front to Back",strengths:"Frontline · Tanque",function:"Tanque",tempo:"Mid"},
 {champion:"K'Sante",identity:"Front to Back",strengths:"Frontline · Tanque",function:"Tanque",tempo:"Mid"},
 {champion:"Unverified",identity:"Front to Back",strengths:"Frontline · Tanque",function:"Tanque",tempo:"Mid"},
],support:[{champion:"Maokai",identity:"Front to Back",strengths:"Frontline · Tanque",function:"Tanque",tempo:"Mid"}]}};
const mapped=mapCandidates(mock);
assert.equal(mapped.status,"mapped");
assert.ok(mapped.profiles[0].candidates.every(c=>c.viabilityStatus!=="secundaria"));
assert.ok(!mapped.profiles[0].alternativesByRole.top.some(c=>c.champion==="Maokai"),"No proponer Maokai TOP como sustitución");
assert.ok(mapped.profiles[0].alternativesByRole.support.some(c=>c.champion==="Maokai"),"Maokai SUPPORT sí se admite");
assert.deepEqual(mapCandidates(mock),mapped,"Determinismo sin runtime network");
console.log(JSON.stringify({catalogPairs:records.length,counts,byRole:countByRole,
 profiles:filtered.map((p,i)=>({id:p.id,reviewed:p.candidateCount,original:full[i].candidateCount})),
 cases:beforeCases.map(c=>({id:c.id,alternatives:c.mentions.length})),status:"ok"},null,2));
