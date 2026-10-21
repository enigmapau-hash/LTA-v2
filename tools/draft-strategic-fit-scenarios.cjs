"use strict";

// Solo referencias al Excel existente; las expectativas describen herramientas,
// no ganadores concretos ni fuerza competitiva dependiente del parche.
const SCENARIOS = [
  { id: "poke-opening", picks: { mid: "Xerath" }, role: "support", expectation: "Con un único pick, consolidar poke antes de asumir necesidades de un equipo ya formado.", needs: ["poke"] },
  { id: "poke-two", picks: { top: "Jayce", mid: "Xerath" }, role: "support", expectation: "Dos artilleros: incorporar una alternativa de poke con protección, sin descartar reforzar el núcleo.", needs: ["poke", "peel"], amongTopThree: true },
  { id: "poke-three", picks: { top: "Jayce", mid: "Xerath", botline: "Ezreal" }, role: "support", expectation: "Proteger el espacio para seguir desgastando, manteniendo poke.", needs: ["poke", "peel"] },
  { id: "poke-exposed", picks: { top: "Jayce", jungle: "Nidalee", mid: "Xerath", botline: "Ezreal" }, role: "support", expectation: "Poke más peel antes que un cuarto contribuyente de daño a distancia.", needs: ["poke", "peel"] },
  { id: "poke-protected", picks: { top: "Jayce", jungle: "Gragas", mid: "Xerath", botline: "Ezreal" }, role: "support", expectation: "Gragas jungle ya aporta peel: reforzar poke vuelve a ser válido.", needs: ["poke"] },
  { id: "scaling-exposed", picks: { jungle: "Karthus", mid: "Azir", botline: "Jinx" }, role: "support", expectation: "DPS y escalado cubiertos; la primera opción debe aportar frontline y peel.", needs: ["frontline", "peel"] },
  { id: "anti-frontline-is-not-frontline", picks: { jungle: "Lillia", mid: "Azir", botline: "Kog'Maw" }, role: "support", expectation: "Anti-frontline es daño al frente rival, no un tanque propio: siguen faltando frontline y peel.", needs: ["frontline", "peel"] },
  { id: "scaling-frontline", picks: { top: "Sion", jungle: "Karthus", mid: "Azir", botline: "Jinx" }, role: "support", expectation: "Sion cubre frontline; sigue siendo relevante proteger los carries.", needs: ["peel"] },
  { id: "front-to-back-control", picks: { top: "Ornn", jungle: "Sejuani", mid: "Orianna", botline: "Jinx" }, role: "support", expectation: "Conservar la protección que el recomendador ya encontraba.", needs: ["peel"] },
  { id: "teamfight-reinforce", picks: { jungle: "Wukong", mid: "Yasuo", botline: "Miss Fortune" }, role: "support", expectation: "Consolidar iniciación coordinada y teamfight; no imponer peel genérico.", needs: ["engage", "teamfight"] },
  { id: "ambiguous-opening", picks: { mid: "Ahri" }, role: "support", expectation: "Conservar herramientas de pick mientras no exista una dirección de dive clara.", needs: ["pick"] },
  { id: "ambiguous-dive", picks: { mid: "Ahri", jungle: "Vi", top: "Camille" }, role: "support", expectation: "La apertura converge en dive: valorar engage y follow-up.", needs: ["engage", "follow-up"] },
  { id: "ambiguous-pick", picks: { mid: "Ahri", jungle: "Elise", top: "Gragas" }, role: "support", expectation: "La misma apertura con Elise y Gragas converge en cazadas.", needs: ["pick"] },
  { id: "early-reinforce", picks: { top: "Renekton", jungle: "Lee Sin" }, role: "mid", expectation: "Mantener presión early; no premiar herramientas de escalado ajenas al tempo.", tempo: "Early" },
];

function resolvePicks(names, catalog) {
  return Object.entries(names).map(([role, champion]) => {
    const candidate = catalog[role]?.find((item) => item.champion === champion);
    if (!candidate) throw new Error(`${champion} no está en el catálogo de ${role}`);
    return { ...candidate, role };
  });
}

function evaluateScenarios(engine, catalog) {
  return SCENARIOS.map((scenario) => {
    const picks = resolvePicks(scenario.picks, catalog);
    return { ...scenario, identity: engine.analyzeComposition(picks).identity.primary,
      top: engine.recommendPicks(picks, catalog)[scenario.role] };
  });
}

// Muestra separada de las referencias estratégicas: semilla y catálogo fijos,
// sin filtrar equipos según identidad, campeones favorecidos o resultado.
function sampleTeams(catalog, count = 32) {
  let seed = 3400;
  function next(max) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed % max;
  }
  return Array.from({ length: count }, () => {
    const selected = new Set();
    return Object.entries(catalog).map(([role, candidates]) => {
      const available = candidates.filter((item) => !selected.has(item.champion));
      const pick = available[next(available.length)];
      selected.add(pick.champion);
      return { ...pick, role };
    });
  });
}

module.exports = { SCENARIOS, resolvePicks, evaluateScenarios, sampleTeams };
