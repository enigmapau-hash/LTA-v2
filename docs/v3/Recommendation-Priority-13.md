# LTA v3.13.0 — Recomendaciones solo con evidencia

## Defecto y corrección

El recomendador interpretaba debilidades genéricas de los arquetipos como obligaciones de cambiar campeones. «Poca presión lateral» es una limitación normal de Front to Back, no una carencia que exija automáticamente sustituir a alguien.

La corrección usa las necesidades explícitas `draftNeeds` y `STRATEGIC_GAPS` ya declaradas en Composition Engine, también para equipos completos. Si el plan principal es claro, solo prioriza una herramienta requerida que falta en las fortalezas registradas de los cinco picks: actualmente Poke exige Peel; Escalado declara Frontline y Peel. No se inventan requisitos para otros arquetipos. Con plan incoherente, solo utiliza brechas de cohesión reconocidas por el diagnóstico. Las contradicciones entre planes no se declaran resueltas por un reemplazo hipotético.

Sin evidencia de una mejora necesaria, devuelve `no-supported-correction` y no impone candidatos: **«Sin cambio prioritario justificado»**. Esta abstención no equivale a declarar la composición perfecta; significa que los datos disponibles no respaldan un cambio concreto.

Cada mejora explicita su procedencia (`evidenceType` de requisito del plan o brecha de cohesión), que se conserva hasta la explicación final.

## Protección y bans

El Ban Prioritizer puede leer los cinco picks directamente mediante `currentPicks` cuando no hay mapa de candidatos. Se mantienen sus comprobaciones de roles y duplicados, su priorización original y la Protección estratégica. El algoritmo de bans no ha cambiado.

## Pruebas y límites

Los casos cubren Front to Back y Dive con abstención, Poke sin Peel con recomendación, Poke protegido sin cambio, incoherencia con propuestas y ejecución offline. La auditoría del equipo completo pasa de contar candidatos a comprobar pertinencia y abstención; la auditoría de draft incompleto mantiene sus comparativas.

**Pendiente por separado:** recomendar exclusivamente roles principales acreditados requiere evidencia externa fiable y vigente. El Excel sigue permitiendo elecciones manuales, sin catalogar un rol como principal por intuición.
