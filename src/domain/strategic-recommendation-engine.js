(function (root, factory) {
  const engine = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = engine;
  } else {
    root.LTAStrategicRecommendationEngine = Object.freeze(engine);
  }
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  const PROFILE_CATALOGUE = Object.freeze({
    engage: { label: "Iniciación", reason: "crear una entrada coordinada", improves: "el acceso inicial a los objetivos prioritarios" },
    followUp: { label: "Seguimiento", reason: "convertir la entrada en presión continuada", improves: "la continuidad del plan después de iniciar" },
    pick: { label: "Pick", reason: "aprovechar objetivos aislados", improves: "la capacidad de abrir una ventaja antes de la pelea" },
    frontline: { label: "Frontline", reason: "sostener la primera línea", improves: "el espacio y tiempo para ejecutar el plan" },
    peel: { label: "Protección (peel)", reason: "proteger a las piezas que ejecutan el plan", improves: "la supervivencia de las piezas prioritarias" },
    disengage: { label: "Desenganche", reason: "cortar entradas desfavorables", improves: "la capacidad de evitar peleas fuera de ventana" },
    sustainedDamage: { label: "Daño sostenido", reason: "mantener presión durante la pelea", improves: "la capacidad de cerrar peleas prolongadas" },
    frontToBack: { label: "Juego frontal", reason: "ordenar el daño detrás de la frontline", improves: "la ejecución de peleas de frente a fondo" },
    sideLane: { label: "Presión lateral", reason: "amenazar el mapa fuera de la agrupación", improves: "la capacidad de crear presión en líneas laterales" },
    mapControl: { label: "Control del mapa", reason: "preparar el espacio antes de disputar objetivos", improves: "la posición y las rotaciones hacia objetivos" },
    earlyPressure: { label: "Presión temprana", reason: "convertir las ventajas iniciales en ritmo", improves: "la capacidad de acelerar la partida" },
    scaling: { label: "Escalado", reason: "proteger la llegada a los picos de poder", improves: "la transición hacia el tramo fuerte de la composición" },
    zoneControl: { label: "Control de zonas", reason: "limitar los accesos a una zona disputada", improves: "la preparación de peleas y objetivos" },
  });

  const PROFILES_BY_NEED = Object.freeze({
    engage: ["engage", "followUp", "pick"],
    frontline: ["frontline", "peel", "disengage"],
    "sustained-damage": ["sustainedDamage", "frontToBack", "peel"],
    "side-lane": ["sideLane", "mapControl", "scaling"],
    peel: ["peel", "disengage", "frontline"],
    pick: ["pick", "mapControl", "followUp"],
    "early-pressure": ["earlyPressure", "pick", "engage"],
    scaling: ["scaling", "frontline", "peel"],
  });

  function notRecommended(status) {
    return { status, profiles: [] };
  }

  function recommendProfiles(input = {}) {
    const diagnosis = input.diagnosis;
    if (diagnosis?.status !== "assessed") return notRecommended("not-assessable");

    const priority = input.optimizer?.priority;
    const needId = String(priority?.need?.id || "");
    const needLabel = String(priority?.need?.label || "").trim();
    const profileIds = PROFILES_BY_NEED[needId];
    if (input.optimizer?.status !== "prioritized" || !needLabel || !profileIds) {
      return notRecommended("no-priority");
    }

    const identity = diagnosis.plan?.clear
      ? String(diagnosis.plan.primaryIdentity || "").trim()
      : "";
    const profiles = profileIds.map((id, index) => {
      const profile = PROFILE_CATALOGUE[id];
      const alignment = identity ? ` para el plan ${identity}` : "";
      return {
        id,
        label: profile.label,
        priority: index + 1,
        reason: index === 0
          ? `Es la respuesta más directa a «${needLabel}»${alignment}: ${profile.reason}.`
          : `Es una alternativa compatible con «${needLabel}»${alignment}: ${profile.reason}.`,
        improves: profile.improves,
      };
    });

    return {
      status: "recommended",
      plan: {
        primaryIdentity: String(diagnosis.plan?.primaryIdentity || "").trim() || null,
        secondaryIdentity: String(diagnosis.plan?.secondaryIdentity || "").trim() || null,
      },
      profiles,
    };
  }

  return { recommendProfiles };
});
