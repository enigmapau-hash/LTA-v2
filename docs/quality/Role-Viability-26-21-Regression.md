# Regresión de candidatos con viabilidad 26.21 — PR #42

Base reproducida: `732e3af`, rama `feature/role-viability-26-21-v3-9-0`.
Comparación del 22/10/2026 con los mismos diez fixtures del catálogo, sin modificar
el Excel, los datos 26.21, el diagnóstico ni el motor del draft.

## Causa y corrección

La abstención ante posiciones multirrol empatadas sin verificar reduce las
alternativas. Al retirar el antiguo desempate por rol, Anivia ocupa huecos de
iniciación: el mapper encontraba `engage` dentro de `Anti-engage`. Aparecía en
tres casos de iniciación y tres de escalado, superando el máximo histórico.
También se confundía `Anti-frontline` con capacidad de frontline propia.

El mapper ahora exige términos completos y distingue las capacidades de sus
contras. Conserva las señales explícitas `Anti-engage` para disengage y permite
que una pieza tenga simultáneamente ambas herramientas. No introduce cuotas de
frecuencia, excepciones por campeón ni cambios de pesos.

El desempate del mismo campeón tampoco usa la capitalización de su nombre como
evidencia de posición. Los roles igualmente respaldados se ordenan de forma
canónica; el empate sin verificar sigue provocando abstención. La viabilidad
precede a las señales al elegir posición; entre campeones sigue primando el
contexto estratégico. Diana TOP experimental permanece excluida de candidatos
y sustituciones, pero disponible para selección manual.

## Métricas comparables

| Medida, diez composiciones completas | main anterior (v3.8.1) | PR antes | PR corregida |
| --- | ---: | ---: | ---: |
| Menciones | 57 | 56 | 56 |
| Campeones distintos | 32 | 29 | 30 |
| Diversidad (distintos/menciones) | 56,1 % | 51,8 % | 53,6 % |
| Máximo de composiciones con el mismo campeón | 4 | 6 | 4 |
| Composiciones que recomiendan Anivia | 0 | 6 | 3 |
| Pares con alta coincidencia | 2 | 2 | 2 |
| Cobertura de recomendaciones | 10/10 | 10/10 | 10/10 |
| Identidades de referencia conservadas | 10/10 | 10/10 | 10/10 |

Antes y después de la corrección se mantienen 14 candidaturas alineadas con la
identidad principal, 8 con la secundaria y 34 sin relación de identidad confirmada
según Candidate Evaluator; ninguna contradice el plan. Esto no acredita calidad
competitiva individual. La diversidad sigue por debajo de main porque se conserva
la abstención conservadora de 26.21.

El draft permanece idéntico: 77 campeones en 300 menciones (25,7 %), repetición
27,7 %, alineación contextual 97,9 % y estabilidad 82,9 %.

## Pruebas y PWA

- Reproducido el fallo original de `check-recommendation-audit.cjs:57`.
- 36/36 scripts `tools/check-*.cjs` aprobados, incluidos auditoría, viabilidad,
  mapper, composición, recomendaciones, recomposición, bans, UX y versión.
- Pruebas nuevas de anti-señales, términos completos, capacidades coexistentes,
  capitalización y orden del catálogo. En 32 equipos independientes: 889
  candidaturas revisadas, ninguna experimental y resultados invariantes al
  invertir roles y catálogo; lo mismo en los diez fixtures de referencia.
- Chromium: instalación, actualización desde v12, análisis completo offline,
  Diana TOP manual y Diana en posición respaldada como recomendación.
- Se carga el módulo 26.21 antes del mapper y se precarga en el service worker,
  junto con cuatro dependencias diagnósticas que faltaban en la caché. La prueba
  anterior solo comprobaba selección parcial offline. Ahora exige informe completo
  y que todos los scripts de la página estén precargados. Caché v80; app v3.9.0.
- `git diff --check` correcto.

Se mantienen todos los umbrales de calidad, incluido máximo inferior a cinco
composiciones. Solo cambia la expectativa de texto de la tabla QP1: compara su
línea base histórica (38,6 %) con el resultado actual (53,6 %, +15,0 puntos),
en vez de exigir el resultado anterior a viabilidad (56,1 %). Los snapshots
históricos fijos de QP2 y QP3 permanecen intactos.
