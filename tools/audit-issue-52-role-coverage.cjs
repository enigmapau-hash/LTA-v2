'use strict';
const base = require('node:path').resolve(__dirname, '..') + '/';
const {loadCandidateCatalog,auditRecommendations}=require(base+'tools/recommendation-audit.cjs');
const {auditProfileKnowledge}=require(base+'src/domain/championship-candidate-mapper.js');
const v=require(base+'src/data/role-viability-26-21.js');
const c=loadCandidateCatalog();
const filtered=Object.fromEntries(Object.entries(c).map(([r,cs])=>[r,cs.filter(x=>v.assess(x.champion,r).status==='habitual')]));
const counts={};for(const x of v.candidatesForReview(c))counts[x.status]=(counts[x.status]||0)+1;
// Keep original fixture picks: audit function generates fixtures from its catalog.
// Override only mapper's catalog through module wrapper in an isolated process.
const mapper=require(base+'src/domain/championship-candidate-mapper.js');
const original=mapper.mapCandidates;
const before=auditRecommendations(c);
mapper.mapCandidates=x=>original({...x,candidatesByRole:filtered});
delete require.cache[require.resolve(base+'tools/recommendation-audit.cjs')];
const after=require(base+'tools/recommendation-audit.cjs').auditRecommendations(c);
console.log(JSON.stringify({counts,roles:Object.fromEntries(Object.entries(c).map(([r,cs])=>[r,{before:cs.length,habitual:filtered[r].length}])),profiles:auditProfileKnowledge(c).profiles.map((p,i)=>({...p,habitual:auditProfileKnowledge(filtered).profiles[i].candidateCount})),cases:before.cases.map((x,i)=>({id:x.id,before:x.mentions.length,habitual:after.cases[i].mentions.length,profilesBefore:x.profiles,profilesHabitual:after.cases[i].profiles}))},null,2));
