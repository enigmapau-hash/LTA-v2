"use strict";

const ROLE_ORDER = Object.freeze(["top", "jungle", "mid", "botline", "support"]);

const REPRESENTATIVE_COMPOSITIONS = Object.freeze([
  { id: "front-to-back", label: "Front to Back", expectedIdentity: "Front to Back", picks: { top: "Ornn", jungle: "Sejuani", mid: "Orianna", botline: "Jinx", support: "Lulu" } },
  { id: "dive", label: "Dive", expectedIdentity: "Dive", picks: { top: "Camille", jungle: "Vi", mid: "Ahri", botline: "Kai'Sa", support: "Rakan" } },
  { id: "pick", label: "Pick", expectedIdentity: "Pick", picks: { top: "Gragas", jungle: "Elise", mid: "Ahri", botline: "Jhin", support: "Bard" } },
  { id: "poke", label: "Poke", expectedIdentity: "Poke", picks: { top: "Jayce", jungle: "Nidalee", mid: "Xerath", botline: "Varus (Letalidad)", support: "Karma" } },
  { id: "split-push", label: "Split Push", expectedIdentity: "Split Push", picks: { top: "Fiora", jungle: "Viego", mid: "Twisted Fate", botline: "Ezreal", support: "Braum" } },
  { id: "teamfight", label: "Teamfight", expectedIdentity: "Teamfight", picks: { top: "Malphite", jungle: "Wukong", mid: "Yasuo", botline: "Miss Fortune", support: "Rell" } },
  { id: "scaling", label: "Escalado", expectedIdentity: "Escalado", picks: { top: "Sion", jungle: "Karthus", mid: "Azir", botline: "Smolder", support: "Milio" } },
  { id: "early-game", label: "Early Game", expectedIdentity: "Early Game", picks: { top: "Renekton", jungle: "Lee Sin", mid: "Pantheon", botline: "Draven", support: "Pyke" } },
  { id: "hybrid", label: "Híbrida", expectedIdentity: "Front to Back", picks: { top: "Ornn", jungle: "Sejuani", mid: "Orianna", botline: "Jinx", support: "Rell" } },
  { id: "incoherent", label: "Incoherente", expectedIdentity: null, picks: { top: "Fiora", jungle: "Elise", mid: "Xerath", botline: "Draven", support: "Lulu" } },
]);

function normalize(value) {
  return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es");
}

function generateRepresentativeCompositions(candidatesByRole) {
  return REPRESENTATIVE_COMPOSITIONS.map((fixture) => ({
    id: fixture.id,
    label: fixture.label,
    expectedIdentity: fixture.expectedIdentity,
    picks: ROLE_ORDER.map((role) => {
      const champion = fixture.picks[role];
      const match = (candidatesByRole[role] || []).find((candidate) => normalize(candidate.champion) === normalize(champion));
      if (!match) throw new Error("No se encontró " + champion + " en el catálogo para " + role + " (" + fixture.label + ").");
      return { ...match, role };
    }),
  }));
}

module.exports = { REPRESENTATIVE_COMPOSITIONS, generateRepresentativeCompositions };
