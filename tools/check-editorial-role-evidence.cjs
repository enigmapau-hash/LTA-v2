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
assert.equal(editorial.entries.length,203,"Curación editorial y tercera ronda de 65 dictámenes manuales; no inventar clasificación total");
assert.equal(new Set(editorial.entries.map(key)).size,203,"Sin duplicar pares");
for(const item of editorial.entries){
  assert.ok(workbookPairs.has(key(item)),item.champion+" "+item.role+" debe figurar en Draft Pool.xlsx");
  if(item.manualRoleReview && !item.source) {
    assert.ok(["habitual","situacional","descartada"].includes(item.status));
    assert.equal(item.sourcePatch,null);
    assert.equal(item.manualProvenance,"Declaración del usuario de LTA, no estadística");
  } else assert.match(item.source,/^https:\/\//);
  assert.equal(item.reviewedAt,"2026-10-23");
  if(item.status==="principal") {
    assert.equal(item.sourcePatch,"16.21");
    assert.match(item.source,/leagueofgraphs.com/);
    assert.ok(item.roleSharePct > 0 && item.roleSharePct <= 100,
      "La clasificación principal documenta la cuota relativa de la posición");
    assert.ok(item.runnerUpSharePct >= 0 && item.runnerUpSharePct < 100);
    assert.ok(item.roleSharePct >= 60
      || (item.roleSharePct >= 30 && item.runnerUpSharePct >= 30
        && Math.abs(item.roleSharePct-item.runnerUpSharePct) <= 5),
      "Principal dominante (>60%) o multirrol comparable (dos roles >=30%, diferencia <=5 pp)");
    if(item.roleSharePct < 60) {
      const partner=editorial.entries.find(other=>other.champion===item.champion
        && other.role===item.runnerUpRole && other.status==="principal");
      assert.ok(partner, "No promover multirrol sin las dos posiciones corroboradas");
      assert.equal(partner.roleSharePct, item.runnerUpSharePct);
    }
  } else if (item.sourcePatch) {
    assert.match(item.source,/leagueofgraphs.com/,"La cuota editorial tiene una fuente cuantitativa");
    assert.ok(Number.isFinite(item.roleSharePct),"Cada observación estadística incluye porcentaje");
    if(item.status==="habitual") assert.ok(item.roleSharePct>=15 && item.roleSharePct<60,
      "Habitual documentado: 15-60%, sin llamarlo principal");
    if(item.status==="secundaria") assert.ok(item.roleSharePct<15,
      "Secundaria estadística: cuota inferior al 15%");
  }else assert.equal(item.sourcePatch,null,"No asignar parche de la estadística a una posición Wiki");
}
const counts=Object.fromEntries(["principal","compatible","habitual","situacional","descartada","secundaria","experimental","sin-verificar"].map(status=>[status,records.filter(item=>item.status===status).length]));
assert.deepEqual(counts,{principal:12,compatible:87,habitual:57,situacional:26,descartada:14,secundaria:6,experimental:1,"sin-verificar":63});
assert.equal(viability.assess("Diana","mid").provider,"LeagueOfGraphs / League Wiki",
  "Los porcentajes editoriales proceden de LeagueOfGraphs, no de OP.GG");
assert.equal(viability.assess("Aurora","top").provider,"League Wiki / revisión editorial");
assert.equal(viability.assess("Diana","top").provider,"METAsrc",
  "La evidencia experimental histórica no debe atribuirse a League Wiki");
for(const [champion,role,status] of [
  ["Maokai","support","principal"],["Maokai","top","secundaria"],["Aatrox","top","principal"],
  ["K'Sante","top","principal"],["Diana","jungle","principal"],["Diana","mid","principal"],
  ["Aurora","mid","principal"],["Aurora","top","compatible"],
  ["Seraphine","support","principal"],["Seraphine","botline","compatible"],
  ["Smolder","top","secundaria"],["Corki","mid","secundaria"],
]){
 assert.equal(viability.assess(champion,role).status,status,champion+" "+role);
}
// Campeones tratados como una sola unidad para la revisión, no como 217 consultas.
const {analyze: analyzeByChampion,canon}=require("./audit-editorial-by-champion.cjs");
const byChampion=analyzeByChampion(catalog);
assert.equal(byChampion.pairs,266);
assert.equal(byChampion.reviewed,203);
assert.equal(byChampion.pending,63);
assert.ok(byChampion.champions < byChampion.distinctCatalogNames,
  "Las builds de Kayn/Varus/Shaco comparten campeón; no necesariamente rol verificado");
assert.equal(canon("Kayn (Azul)"),canon("Kayn (Rojo)"));
assert.equal(canon("Varus (On-Hit)"),canon("Varus (Letalidad)"));
// Descartar 'principal' por cuota no equivale a descartar viabilidad ni draft manual.
for(const [champion,role,expected] of [
  ["Brand","support","principal"],["Brand","jungle","secundaria"],["Brand","mid","habitual"],
  ["Lux","mid","habitual"],
  ["Jax","top","principal"],
  ["Senna","support","principal"],["Swain","support","principal"],
  ["Swain","botline","habitual"],["Ashe","botline","principal"],["Ashe","support","compatible"],
  ["Pantheon","top","habitual"],["Pantheon","support","habitual"],
  ["Yasuo","mid","habitual"],["Yasuo","top","compatible"],["Yasuo","botline","compatible"],
  ["Poppy","support","habitual"],["Xerath","mid","habitual"],["Xerath","support","habitual"],
]) assert.equal(viability.assess(champion,role).status,expected,champion+" "+role);
assert.equal(editorial.externalDominance.length,1,"La fuente dominante fuera del Excel no cuenta como pareja revisada");
assert.ok(!workbookPairs.has("lux|support"));
assert.ok(byChampion.groups.find(x=>x.id==="lux").nonPrincipalByExclusion.includes("mid"),
  "Lux MID no es principal en este corte, pero sigue siendo elegible como habitual");
assert.ok(!byChampion.groups.find(x=>x.id==="pantheon").nonPrincipalByExclusion.length,
  "No forzar principal de Pantheon por ser TOP o SUPPORT");
assert.ok(viability.isReviewedRecommendation(viability.assess("Poppy","support")),
  "Una posición habitual documentada también se puede recomendar");

// Fuente de estas posiciones: confirmaciones humanas (no porcentajes externos).
const manuallyConfirmed=[["Maokai","support","principal"],["Poppy","top","habitual"],["Poppy","support","habitual"],["Gragas","top","habitual"],["Gragas","mid","habitual"],["Galio","mid","habitual"],["Cho'Gath","jungle","habitual"],["Cho'Gath","top","habitual"],["Garen","top","habitual"],["Dr. Mundo","jungle","habitual"],["Dr. Mundo","top","habitual"],["Nautilus","support","habitual"],["Viego","jungle","habitual"],["Fiddlesticks","jungle","habitual"],["Brand","support","principal"],["Yorick","top","habitual"]];
assert.equal(manuallyConfirmed.length,16);
for(const [champion,role,status] of manuallyConfirmed) {
  const actual=viability.assess(champion,role);
  assert.equal(actual.status,status,champion+" "+role);
  assert.equal(actual.manualRoleReview,"habitual");
  assert.equal(actual.manualProvenance,"Declaración del usuario de LTA, no estadística");
}
for(const [champion,role] of [["Poppy","top"],["Gragas","top"],["Gragas","mid"],["Cho'Gath","jungle"],["Dr. Mundo","jungle"],["Yorick","top"]]) {
  const record=viability.assess(champion,role);
  assert.equal(record.source,null,"No inventar fuente externa");
  assert.equal(record.sourcePatch,null,"Una declaración humana no acredita parche");
  assert.equal(record.provider,"Criterio manual del usuario");
  assert.ok(viability.isReviewedRecommendation(record));
}

assert.equal(viability.assess("Galio","mid").provider,"League Wiki / criterio manual del usuario");
assert.equal(viability.assess("Maokai","support").provider,"LeagueOfGraphs / League Wiki",
  "No rebajar evidencia numérica a mera declaración manual");

// Segunda ronda del usuario: situacional NO equivale a descartada.
const userSituational=[["Galio","top"],["Galio","support"],
  ["Garen","jungle"],["Garen","mid"],["Fiddlesticks","support"],["Brand","botline"]];
const userDiscarded=[["Dr. Mundo","mid"],["Nautilus","jungle"],
  ["Viego","top"],["Yorick","jungle"]];
assert.equal(userSituational.length,6);
assert.equal(userDiscarded.length,4);
assert.ok(!workbookPairs.has("maokai|jungle"),"No incorporar Maokai JUNGLA al catálogo sin estar en Excel");
assert.deepEqual(editorial.manualOutsideCatalog.map(x=>[x.champion,x.role,x.status]),
  [["Maokai","jungle","situacional"]]);
assert.equal(viability.assess("Maokai","jungle").status,"sin-verificar",
  "El usuario puede considerarlo situacional fuera del catálogo sin activar recomendaciones");
for(const [champion,role] of userSituational) {
  const record=viability.assess(champion,role);
  assert.equal(record.status,"situacional");
  assert.equal(record.manualRoleReview,"situacional");
  assert.equal(record.provider,"Criterio manual del usuario");
  assert.equal(record.source,null);
  assert.equal(record.sourcePatch,null);
  assert.ok(!viability.isExcluded(record),"Situacional no es prohibido");
  assert.ok(!viability.isReviewedRecommendation(record),
    "Situacional no se propone en cambios normales sin justificación contextual");
}
for(const [champion,role] of userDiscarded) {
  const record=viability.assess(champion,role);
  assert.equal(record.status,"descartada");
  assert.equal(record.manualRoleReview,"descartada");
  assert.equal(record.source,null);
  assert.equal(record.sourcePatch,null);
  assert.equal(record.provider,"Criterio manual del usuario");
  assert.ok(viability.isExcluded(record),"Descartada queda fuera de picks automáticos");
  assert.ok(!viability.isReviewedRecommendation(record));
}
// Dictamen de usuario (tanda de 30 campeones + Ekko JUNGLA, 23/10/2026).
// Estos juicios no atribuyen porcentajes ni un parche a la frecuencia de uso.
const thirdRound={"habitual":"Annie:mid;Akshan:mid;Cassiopeia:mid;Hwei:mid;Heimerdinger:top,mid;Karma:support;Karthus:jungle;Morgana:support;Neeko:mid;Tristana:botline;Aurelion Sol:mid;Ekko:mid,jungle;Naafiri:mid;Ryze:top,mid;Veigar:mid;Viktor:mid;Ziggs:mid,botline;Zoe:mid;Yone:top;Twitch:botline;Teemo:top;Warwick:jungle;Zac:jungle;Sylas:mid,jungle;Talon:mid,jungle;Zyra:support;Trundle:top,jungle;Kled:top","situacional":"Annie:support;Cassiopeia:top,botline;Karma:top;Karthus:botline;Morgana:jungle,mid;Neeko:support;Tristana:mid;Aurelion Sol:botline;Irelia:mid;Naafiri:top;Veigar:botline,support;Viktor:botline;Yone:botline;Teemo:jungle;Warwick:top;Zac:top;Zyra:jungle","descartada":"Akshan:botline;Hwei:botline;Heimerdinger:support;Karma:mid;Lucian:top,mid;Ziggs:top;Zoe:support;Twitch:support;Kled:mid"};
const submissions=Object.entries(thirdRound).flatMap(([status,text]) =>
  text.split(";").flatMap(fragment => {
    const [champion,roles]=fragment.split(":");
    return roles.split(",").map(role=>({champion,role,status}));
  }));
assert.equal(submissions.length,65,"64 posiciones del formulario + Ekko JUNGLA adicional");
assert.equal(new Set(submissions.map(item=>item.champion+"|"+item.role)).size,65);
for(const item of submissions){
  assert.ok(workbookPairs.has(key(item)),item.champion+" "+item.role+" debe pertenecer a Draft Pool.xlsx");
  const record=viability.assess(item.champion,item.role);
  assert.equal(record.status,item.status,item.champion+" "+item.role);
  assert.equal(record.manualRoleReview,item.status,"Etiqueta manual explícita");
  assert.equal(record.manualProvenance,"Declaración del usuario de LTA, no estadística");
  assert.ok(!record.sourcePatch,"No asignar parche a testimonios manuales sin estadística");
  if(item.status==="descartada"){
    assert.ok(viability.isExcluded(record));
    assert.ok(!viability.isReviewedRecommendation(record));
  } else if(item.status==="situacional"){
    assert.ok(!viability.isExcluded(record));
    assert.ok(!viability.isReviewedRecommendation(record),"Sin auto-sustituciones situacionales normales");
  } else {
    assert.ok(viability.isReviewedRecommendation(record),"Habitual puede alimentar optimizadores");
  }
}
const ekkoJungle=viability.assess("Ekko","jungle");
assert.equal(ekkoJungle.status,"habitual");
assert.match(ekkoJungle.source,/wiki.leagueoflegends.com/,
  "La evidencia Wiki existente continúa siendo compatibilidad, no estadística de predominio");
assert.equal(ekkoJungle.provider,"League Wiki / criterio manual del usuario");
assert.equal(viability.assess("Ekko","mid").status,"habitual","Ekko multirrol manual");
for(const [champion,role] of [["Dr. Mundo","mid"],["Nautilus","jungle"],["Viego","top"],["Yorick","jungle"]])
  assert.ok(viability.isExcluded(viability.assess(champion,role)),
    "Los descartes manuales de la ronda anterior permanecen");

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
const situationMock=mapCandidates({...mock, candidatesByRole:{
  support:[{champion:"Fiddlesticks",identity:"Front to Back",strengths:"Frontline · Tanque",
    function:"Tanque",tempo:"Mid"},
    {champion:"Poppy",identity:"Front to Back",strengths:"Frontline · Tanque",
      function:"Tanque",tempo:"Mid"}],
  jungle:[{champion:"Nautilus",identity:"Front to Back",strengths:"Frontline · Tanque",
    function:"Tanque",tempo:"Mid"}]
}});
assert.ok(situationMock.profiles.every(profile => profile.candidates.every(candidate =>
  !(candidate.champion==="Nautilus" && candidate.role==="jungle"))),
  "Nautilus JUNGLA descartado nunca debe reaparecer como alternativa automática");
assert.ok(situationMock.profiles.every(profile => Object.values(profile.alternativesByRole)
  .flat().every(candidate => candidate.viabilityStatus!=="situacional"
    && candidate.viabilityStatus!=="descartada")),
  "El optimizador no debe usar roles situacionales ni descartados como correcciones normales");


// The reported user composition must never resurrect Maokai TOP via a
// secondary profile, the evaluator or role-specific optimizer alternatives.
const {diagnoseComposition}=require("../src/domain/diagnostic-engine.js");
const {proposeCorrections}=require("../src/domain/correction-engine.js");
const {optimizeComposition}=require("../src/domain/composition-optimizer.js");
const {recommendProfiles}=require("../src/domain/strategic-recommendation-engine.js");
const userSelection={top:"Aurora",jungle:"Elise",mid:"Corki",botline:"Miss Fortune",support:"Lulu"};
const userPicks=Object.entries(userSelection).map(([role,champion])=>{
  const entry=catalog[role].find(item=>item.champion===champion);
  assert.ok(entry,"El caso del usuario está presente en Draft Pool: "+champion+" "+role);
  return {...entry,role};
});
const userDiagnosis=diagnoseComposition(userPicks);
const userCorrection=proposeCorrections({picks:userPicks,diagnosis:userDiagnosis,candidatesByRole:catalog});
const userOptimizer=optimizeComposition({diagnosis:userDiagnosis,correction:userCorrection});
const userRecommendations=recommendProfiles({diagnosis:userDiagnosis,optimizer:userOptimizer});
const userMapped=mapCandidates({diagnosis:userDiagnosis,optimizer:userOptimizer,
 recommendations:userRecommendations,candidatesByRole:catalog,
 selectedChampions:userPicks.map(p=>p.champion),currentPicks:userPicks});
assert.equal(userMapped.status,"mapped", "El equipo Aurora/Elise/Corki/Miss Fortune/Lulu conserva recomendaciones útiles");
for(const profile of userMapped.profiles){
  for(const item of profile.candidates){
    assert.ok(!Object.values(userSelection).includes(item.champion),"Nunca recomendar un campeón seleccionado");
    assert.ok(!(item.champion==="Maokai" && item.role==="top"),"Maokai TOP no reaparece en candidatos");
  }
  for(const [role,alternatives] of Object.entries(profile.alternativesByRole)){
    for(const item of alternatives){
      assert.ok(viability.isReviewedRecommendation(viability.assess(item.champion,role)),
        "La optimización solo recibe posiciones revisadas: "+item.champion+" "+role);
    }
  }
}
const provisional=mapCandidates({...mock,candidatesByRole:{top:[
 {champion:"Unverified A",identity:"Front to Back",strengths:"Frontline",function:"Vanguardia",tempo:"Mid"},
 {champion:"Unverified B",identity:"Teamfight",strengths:"Tanque",function:"Protección",tempo:"Mid"}
]}});
assert.equal(provisional.status,"mapped");
assert.ok(provisional.profiles[0].candidates.every(item=>item.viabilityStatus==="sin-verificar"),
  "La salida degradada se identifica como provisional");
assert.ok(provisional.profiles[0].alternativesByRole.top.length===0,
  "Nunca convertir candidatos provisionales en sustituciones automáticas");

console.log(JSON.stringify({catalogPairs:records.length,counts,byRole:countByRole,
 profiles:filtered.map((p,i)=>({id:p.id,reviewed:p.candidateCount,original:full[i].candidateCount})),
 cases:beforeCases.map(c=>({id:c.id,alternatives:c.mentions.length})),status:"ok"},null,2));
