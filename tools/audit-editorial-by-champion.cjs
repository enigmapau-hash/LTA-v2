#!/usr/bin/env node
"use strict";
// Auditoría offline por campeón. Nunca convierte ausencia de prueba en posición secundaria.
const { loadCandidateCatalog } = require("./recommendation-audit.cjs");
const viability = require("../src/data/role-viability-26-21.js");

function canon(champion) {
  return String(champion || "").replace(/&amp;/g, "&")
    .replace(/ \((?:Azul|Rojo|Letalidad|On-Hit|AD|AP)\)$/, "")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es").trim();
}
function analyze(catalog = loadCandidateCatalog()) {
  const roles = viability.candidatesForReview(catalog);
  const map = new Map();
  for (const role of roles) {
    const id = canon(role.champion);
    if (!map.has(id)) map.set(id, { id, names: new Set(), roles: [], sourceMaxPct: null });
    const g = map.get(id);
    g.names.add(role.champion);
    g.roles.push({ champion: role.champion, role: role.role, status: role.status,
      share: Number.isFinite(role.roleSharePct) ? role.roleSharePct : null });
  }
  const groups = [...map.values()].map(g => {
    // Only a quantitatively supported >=60% primary proves that a *different* role
    // cannot be a co-principal under the same patch/scope. This is NOT a veto
    // of compatible, habitual or manually selected positions.
    const max = Math.max(0, ...g.roles.filter(r => r.status === "principal" && r.share !== null)
      .map(r => r.share));
    const dominant = max >= 60 ? g.roles.find(r => r.status === "principal" && r.share === max) : null;
    return {
      id: g.id, variants: [...g.names].sort(), pairCount: g.roles.length,
      reviewed: g.roles.filter(r => r.status !== "sin-verificar").length,
      pending: g.roles.filter(r => r.status === "sin-verificar").length,
      // Informative inference only; never written back as an automatic ban.
      nonPrincipalByExclusion: dominant ? g.roles.filter(r =>
        !(r.role === dominant.role && r.status === "principal")).map(r => r.role) : [],
      roles: g.roles,
    };
  }).sort((a,b)=>b.pending-a.pending || b.pairCount-a.pairCount || a.id.localeCompare(b.id,"es"));
  return {
    champions: groups.length,
    distinctCatalogNames: new Set(roles.map(r => r.champion)).size,
    pairs: roles.length,
    reviewed: roles.filter(r=>r.status !== "sin-verificar").length,
    pending: roles.filter(r=>r.status === "sin-verificar").length,
    withPending: groups.filter(g=>g.pending>0).length,
    excludedPrincipalNotInferredInApp: groups.reduce((n,g)=>n+g.nonPrincipalByExclusion.length,0),
    groups,
  };
}
module.exports = { analyze, canon };
if (require.main === module) {
  const a = analyze();
  console.log(JSON.stringify({ ...a, groups: a.groups.filter(g=>g.pending>0) }, null, 2));
}
