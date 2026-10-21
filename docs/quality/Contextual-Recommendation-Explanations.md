# Contextual Recommendation Explanations

## Objetivo y recorrido revisado

Base: main `63d2559`, v3.5.0. Cambio visible en v3.6.0 limitado a la frase de cada candidato durante el draft.

`app.js` entrega los picks actuales y el catálogo a `CompositionEngine.recommendPicks`. El motor evalúa identidades hipotéticas, afinidad, señales compartidas, continuidad, cobertura de huecos y desempates. `composition-table.js` recibía fortalezas y plan, pero mostraba siempre «Aporta:» seguido de hasta tres fortalezas del campeón, aunque una de ellas ya estuviese cubierta. El plan se agrupa por rol. Los presenters de la recomendación final pertenecen a otra ruta y no se modifican.

El factor de cobertura de v3.5.0 se perdía al devolver el resultado numérico. Ahora `draftFit` conserva ese mismo cálculo y prepara una explicación para los candidatos seleccionados. El renderer sustituye únicamente la línea descriptiva existente: misma lista, cantidad, etiquetas, afinidad, dirección y plan asociado; sin secciones ni diseño nuevos.

## Reglas de explicación

1. **Cobertura efectiva:** solo si `coverageFit > 0`, describir las necesidades que generaron ese término de afinidad. Se reutiliza el mismo array de carencias, sin inferirlo a posteriori desde el texto. La identidad debe conservarse y ningún aliado debe aportar ya la herramienta.
2. **Refuerzo compartido:** describir como máximo dos señales positivas de fortalezas explícitas compartidas con los picks actuales y utilizadas por el arquetipo de afinidad. La dirección hipotética debe conservar ese arquetipo. Si la única señal es el propio nombre del plan, evitar repetirlo dos veces. El ritmo compartido puede justificar el refuerzo cuando no haya una capacidad más específica.
3. **Conservación:** si no se puede verbalizar una relación segura, mantener literalmente la lista factual anterior «Aporta: …». No se inventa un beneficio ni se sustituye por una promesa genérica.

El matcher de cobertura sigue siendo el de v3.5.0, extraído sin cambiarlo: Anti-frontline no cuenta como frontline propia. La explicación de capacidades compartidas también exige términos completos en las fortalezas; no convierte una función como «protege hypercarry» en la afirmación de que el candidato sea un hypercarry. No se corrige ni recalibra el matcher histórico del ranking.

## Ejemplos verificables

Los siguientes candidatos están en el top 3 conservado (se muestra el primero de cada caso). Los atributos proceden del catálogo sin modificar. Una misma frase puede ser correcta para candidatos que satisfacen la misma necesidad; no se fuerza variación textual.

| Composición / rol pendiente | Candidato | Antes | Después | Fortalezas del catálogo |
| --- | --- | --- | --- | --- |
| Xerath → support | Miss Fortune | Aporta: Poke, Teamfight | Refuerza el plan de Poke que ya comparten los picks actuales. | Poke · Teamfight |
| Jayce, Nidalee, Xerath, Ezreal → support | Karma | Aporta: Poke, Peel, Prioridad de línea | Cubre la falta de protección para los carries y mantiene Poke. | Poke · Peel · Prioridad de línea |
| Jayce, Gragas, Xerath, Ezreal → support | Miss Fortune | Aporta: Poke, Teamfight | Refuerza el plan de Poke que ya comparten los picks actuales. | Poke · Teamfight |
| Karthus, Azir, Jinx → support | Braum | Aporta: Peel, Frontline, Anti-engage | Cubre la falta de frontline y protección para los carries y mantiene Escalado. | Peel · Frontline · Anti-engage |
| Lillia, Azir, Kog'Maw → support | Braum | Aporta: Peel, Frontline, Anti-engage | Cubre la falta de frontline y protección para los carries y mantiene Escalado. | Peel · Frontline · Anti-engage |
| Sion, Karthus, Azir, Jinx → support | Braum | Aporta: Peel, Frontline, Anti-engage | Cubre la falta de protección para los carries y mantiene Escalado. | Peel · Frontline · Anti-engage |
| Ornn, Sejuani, Orianna, Jinx → support | Milio | Aporta: Peel, Hypercarry | Aporta: Peel, Hypercarry | Peel · Hypercarry |
| Wukong, Yasuo, Miss Fortune → support | Rell | Aporta: Engage, Teamfight, Frontline | Refuerza Teamfight con engage que ya aporta el equipo. | Engage · Teamfight · Frontline |
| Ahri → support | Annie | Aporta: Engage, Burst, Pick | Refuerza el plan de Pick que ya comparten los picks actuales. | Engage · Burst · Pick |
| Ahri, Vi, Camille → support | Rakan | Aporta: Engage, Follow-up, Peel | Refuerza Dive con engage que ya aporta el equipo. | Engage · Follow-up · Peel |
| Ahri, Elise, Gragas → support | Bard | Aporta: Pick, Movilidad, Control del mapa | Refuerza el plan de Pick que ya comparten los picks actuales. | Pick · Movilidad · Control del mapa |
| Karthus, Azir, Jinx → top | Urgot | Aporta: DPS, Frontline, Ejecución | Cubre la falta de frontline y mantiene Escalado. | DPS · Frontline · Ejecución |
| Xerath → jungle | Shaco (AP) | Aporta: Control de zonas, Objetivos, Desgaste | Aporta: Control de zonas, Objetivos, Desgaste | Control de zonas · Objetivos · Desgaste |
| Camille, Vi, Rakan → mid | Yasuo | Aporta: Follow-up, Teamfight, Movilidad | Refuerza Dive con follow-up que ya aporta el equipo. | Follow-up · Teamfight · Movilidad |
| Jayce, Nidalee, Xerath, Karma → botline | Caitlyn | Aporta: Poke, Asedio, Rango | Refuerza Poke con asedio que ya aporta el equipo. | Poke · Asedio · Rango |

**Mismo candidato, distinto contexto:** Karma pasa de «Cubre la falta de protección para los carries y mantiene Poke.» con Jayce/Nidalee/Xerath/Ezreal a «Refuerza el plan de Poke que ya comparten los picks actuales.» al sustituir Nidalee por Gragas. Gragas ya tiene Peel. Esta segunda comprobación usa la lista completa de candidatos: Karma no necesita estar en el top 3 de ambos estados para verificar que el motivo cambia correctamente.

**Cobertura en Jungle:** con Azir/Jinx, Ivern conserva su puesto entre los tres candidatos y explica «Cubre la falta de protección para los carries y mantiene Escalado.», respaldado por Peel/Escudos/Control. No se fuerza que una explicación nueva aparezca en cada campeón: Shaco (AP) conserva su descripción factual cuando no hay una relación explícita suficientemente segura para esta frase.

## Compatibilidad y auditoría antes/después

Todas las métricas siguientes se calcularon en ambas versiones con el mismo catálogo y corpus. Coinciden exactamente; no se atribuye a este cambio una mejora de calidad del ranking.

| Corpus / métrica | v3.5.0 | v3.6.0 |
| --- | ---: | ---: |
| Draft original: cobertura | 100% | 100% |
| Draft original: alineación | 97.9% | 97.9% |
| Draft original: estabilidad | 82.9% | 82.9% |
| Draft original: adaptación (cambio de listas al añadir picks) | 61.7% | 61.7% |
| Draft original: diversidad | 25.7% | 25.7% |
| Draft original: repetición | 27.7% | 27.7% |
| Matriz: estabilidad entre prefijos con identidad igual | 88.0% | 88.0% |
| Matriz: sustituciones equivalentes | 76.5% | 76.5% |
| Matriz: diferenciación de planes cercanos / opuestos | 100% / 100% | 100% / 100% |
| Matriz: adaptación tras cambio de identidad | 100% | 100% |
| Muestra independiente: alineación | 99.520% | 99.520% |
| Muestra independiente: estabilidad | 82.716% | 82.716% |
| Muestra independiente: validez por rol | 100% | 100% |
| Muestra independiente: diversidad | 9.792% | 9.792% |

La auditoría final sigue dando 10/10 identidades de referencia, 57 menciones y 32 candidatos distintos. Los 32 análisis completos independientes coinciden íntegramente con la base; diagnóstico, corrección y bans conservan sus pruebas. No se repite la investigación ni se incorporan los ajustes descartados en la evaluación anterior.

## Pruebas y reproducción

- `node tools/check-draft-explanations.cjs`: 245 estados (vacío, referencias, muestras independientes, 14 escenarios de PR #34 y 20 casos adicionales de cinco roles × tamaños 1–4). Comprueba longitud, ausencia de carencias ya cubiertas, capacidades explícitas, determinismo e invariancia al orden.
- El mismo test fija el contrato previo mediante SHA-256 de todos los campos originales y análisis para límites 1, 3 y 100, capturado antes del cambio desde `63d2559`. La única propiedad nueva excluida del snapshot es `explanation` en cada recomendación.
- `node tools/check-recommendation-audit.cjs`: auditoría original, matriz ampliada, determinismo y límites existentes.
- `node tools/check-draft-strategic-fit.cjs`: las 14 expectativas estratégicas anteriores y 128 estados independientes.
- `node tools/check-ux.cjs`: texto visible Poke sin/con protección en 320, 375, 390, 768 y 1280 px, sin desbordamiento; mantiene las comprobaciones de teclado y accesibilidad.
- Suite completa de scripts `tools/check-*.cjs`, incluidas composición, PWA, informe y bans, sincronización de versión y `git diff --check`.

Para repetir la comparación con la base, guardar `src/domain/composition-engine.js` de `63d2559` en un archivo temporal `.cjs`, invocar `auditDraftRecommendations(catalog, engine)` y `independentMatrix(engine, catalog)` para ambas versiones y comparar los objetos de métricas. `compatibilitySnapshot` y `corpus`, exportados por la prueba de explicaciones, permiten comparar además todos los campos previos sin depender de una etiqueta visible.

## Límites

Las frases explican factores reales, no una prueba de optimalidad ni el desglose completo del ranking. No inventan sinergias específicas entre habilidades ni relaciones que no estén registradas. El estado provisional del draft sigue dependiendo de etiquetas generales y la cobertura sigue siendo binaria. Las limitaciones y la estabilidad residual de v3.5.0 permanecen intactas. Las explicaciones no cambian identidad, pesos, afinidad, ordenación, recomendaciones finales, bans ni el informe completo. No se modifica el Excel, no hay consultas externas y no se añaden dependencias.
