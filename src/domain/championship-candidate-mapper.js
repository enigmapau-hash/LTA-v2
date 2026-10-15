(function (root, factory) {
  const engine = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = engine;
  } else {
    root.LTAChampionshipCandidateMapper = Object.freeze(engine);
  }
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  const PROFILE_SIGNALS = Object.freeze({
    engage: { fields: ["strengths", "function"], terms: ["engage", "iniciación"] },
    followUp: { fields: ["strengths"], terms: ["follow-up", "teamfight"] },
    pick: { fields: ["strengths", "function"], terms: ["pick", "ganks", "roams"] },
    frontline: { fields: ["strengths", "function"], terms: ["frontline", "tanque"] },
    peel: { fields: ["strengths"], terms: ["peel", "escudos", "protección"] },
    disengage: { fields: ["strengths"], terms: ["anti-engage", "anti-dash", "peel"] },
    sustainedDamage: { fields: ["strengths", "function"], terms: ["dps", "daño sostenido", "sustain"] },
    frontToBack: { fields: ["identity", "strengths"], terms: ["front to back", "frontline", "dps"] },
    sideLane: { fields: ["strengths"], terms: ["side lane", "presión lateral", "duelos"] },
    mapControl: { fields: ["strengths"], terms: ["control del mapa", "control de visión", "visión", "objetivos"] },
    earlyPressure: { fields: ["tempo", "strengths"], terms: ["early", "tempo", "presión de línea", "snowball"] },
    scaling: { fields: ["tempo", "strengths", "function"], terms: ["late", "escalado", "hypercarry"] },
    zoneControl: { fields: ["strengths"], terms: ["control de zonas", "control de visión"] },
  });

  function normalize(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("es")
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  function findSignals(candidate, signalDefinition) {
    const fields = signalDefinition.fields.map((field) => normalize(candidate[field])).join(" ");
    return signalDefinition.terms.filter((term) => fields.includes(normalize(term)));
  }

  function listAttributes(value) {
    return String(value || "").split("·").map((item) => item.trim()).filter(Boolean);
  }

  function notMapped(status) {
    return { status, profiles: [] };
  }

  function mapCandidates(input = {}) {
    if (input.optimizer?.status !== "prioritized") return notMapped("no-priority");
    if (input.recommendations?.status !== "recommended") return notMapped("no-profiles");

    const candidates = Object.values(input.candidatesByRole || {}).flat();
    if (!candidates.length) return notMapped("no-candidates");

    const profiles = [];
    for (const profile of input.recommendations.profiles || []) {
      const signalDefinition = PROFILE_SIGNALS[profile?.id];
      if (!signalDefinition || !profile.label || !profile.improves) continue;

      const ranked = new Map();
      for (const candidate of candidates) {
        const champion = String(candidate?.champion || "").trim();
        if (!champion) continue;
        const signals = findSignals(candidate, signalDefinition);
        if (!signals.length) continue;

        const key = normalize(champion);
        const existing = ranked.get(key);
        if (!existing || signals.length > existing.signals.length) {
          ranked.set(key, { champion, signals, candidate });
        } else if (signals.length === existing.signals.length) {
          const mergedSignals = [...new Set([...existing.signals, ...signals])];
          ranked.set(key, { ...existing, signals: mergedSignals });
        }
      }

      const topCandidates = [...ranked.values()]
        .sort((a, b) => b.signals.length - a.signals.length || a.champion.localeCompare(b.champion, "es"))
        .slice(0, 3);
      if (topCandidates.length < 2) continue;

      profiles.push({
        id: profile.id,
        label: profile.label,
        priority: profile.priority,
        reason: profile.reason,
        improves: profile.improves,
        candidates: topCandidates.map((candidate, index) => ({
          champion: candidate.champion,
          priority: index + 1,
          reason: `Sus atributos incluyen ${candidate.signals.join(" y ")}, acorde con el perfil «${profile.label}».`,
          improves: profile.improves,
          identity: String(candidate.candidate.identity || "").trim(),
          strengths: listAttributes(candidate.candidate.strengths),
          weaknesses: listAttributes(candidate.candidate.weaknesses),
        })),
      });
    }

    return profiles.length ? { status: "mapped", profiles } : notMapped("no-matching-candidates");
  }

  return { mapCandidates };
});
