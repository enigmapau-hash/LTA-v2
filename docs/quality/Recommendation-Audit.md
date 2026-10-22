# Auditoría de recomendaciones estratégicas

Informe reproducible generado a partir del catálogo de campeones incluido en el proyecto.

## Metodología

La herramienta genera diez composiciones de referencia desde nombres de campeones presentes en el catálogo: Front to Back, Dive, Pick, Poke, Split Push, Teamfight, escalado, Early Game, híbrida e incoherente. Los atributos de cada pieza se leen del catálogo; no se duplican ni se inventan para la auditoría.

Para cada equipo ejecuta la cadena existente de diagnóstico, corrección, Composition Optimizer, Strategic Recommendation Engine, Candidate Mapper y Candidate Evaluator. La recomendación mantiene el perfil más directo para la necesidad prioritaria y elige una alternativa compatible con la identidad ya diagnosticada. El mapeo prioriza el ajuste a identidad y win condition antes de usar la cantidad genérica de señales como desempate. Cuenta como recomendación cada candidato evaluado dentro de su perfil estratégico.

La generación y ordenación son deterministas. Para regenerar este informe ejecuta node tools/recommendation-audit.cjs --write; para verificar contratos y reproducibilidad ejecuta node tools/check-recommendation-audit.cjs.

## Métricas

| Métrica | Resultado | Interpretación |
| --- | ---: | --- |
| Composiciones auditadas | 10 | Casos representativos declarados en el generador. |
| Cobertura de recomendaciones | 10/10 (100.0%) | Casos que produjeron al menos un perfil con candidatos evaluados. |
| Menciones de candidatos | 57 | Apariciones en listas por perfil; un campeón puede aparecer en varios perfiles. |
| Campeones distintos recomendados | 32 | Diversidad total del catálogo recomendado. |
| Diversidad de campeones | 56.1% | Campeones únicos dividido por todas las menciones por perfil. |
| Cobertura de rol por perfil | 95.0% | Pares perfil/rol con al menos una alternativa, entre los pares de perfiles recomendados. |
| Perfiles estratégicos distintos | 12 | Variedad de perfiles ofrecidos por la cadena en el conjunto auditado. |
| Pares de composiciones con alta repetición | 2 | Pares que comparten al menos 2 campeones recomendados y Jaccard ≥ 50.0%. |

### Comparación con la línea base anterior al Quality Pass 1

La línea base conserva las métricas generadas por la herramienta en la PR #23, antes de esta recalibración.

| Métrica | Antes | Después | Cambio |
| --- | ---: | ---: | ---: |
| Menciones de candidatos | 83 | 57 | -31.3% |
| Campeones distintos | 32 | 32 | 0.0% |
| Diversidad de campeones | 38.6% | 56.1% | +17.5 p.p. |
| Cobertura de rol por perfil | 95.3% | 95.0% | -0.3 p.p. |
| Campeones repetidos en ≥3 composiciones | 17 | 9 | -47.1% |
| Pares con alta coincidencia | 7 | 2 | -71.4% |
| Máxima frecuencia de un campeón | 5/10 | 4/10 | -20.0% |

La concentración repetida baja: los pares con alta coincidencia pasan de 7 a 2 y los campeones frecuentes de 17 a 9. La cobertura de rol por perfil retrocede 0.3 p.p.; el número de campeones únicos se mantiene. Conviene vigilar la cobertura perfil/rol en auditorías futuras.

### Impacto de la expansión del conocimiento estratégico

La comparación usa la misma versión del algoritmo y el mismo catálogo de campeones. El cambio amplía vocabularios existentes para reconocer atributos del catálogo que antes no estaban vinculados con ciertos estilos o perfiles; no cambia pesos, umbrales, fórmulas ni el formato de recomendación.

| Métrica | Antes | Después | Cambio |
| --- | ---: | ---: | ---: |
| Diversidad de campeones recomendados | 55.4% | 56.1% | +0.7 p.p. |
| Menciones / campeones únicos | 56 / 31 | 57 / 32 | +1 únicos |
| Campeones repetidos en ≥3 composiciones | 10 | 9 | -1 |
| Pares con alta coincidencia | 2 | 2 | 0 |
| Fidelidad de identidad en referencias | 100.0% | 100.0% | 0.0 p.p. |
| Cobertura de perfiles/rol del catálogo | 63/65 (96.9%) | 64/65 (98.5%) | +1 par |
| Cobertura de arquetipos/rol del catálogo | 38/40 (95.0%) | 39/40 (97.5%) | +1 par |
| Cobertura del catálogo con algún perfil | 99.6% | 100.0% | +0.4 p.p. |

La expansión mejora la variedad recomendada y hace explícita una relación Poke–desgaste ya presente en los atributos, cubriendo un arquetipo/rol adicional. No altera la identidad esperada de los diez casos. La coincidencia entre pares de equipos permanece igual, por lo que esta iteración mejora la cobertura del vocabulario y la diversidad del conjunto, pero no demuestra una reducción adicional de la similitud entre composiciones.

| Cobertura del conocimiento | Antes | Después |
| --- | ---: | ---: |
| Arquetipos con candidatos | 8/8 | 8/8 |
| Perfiles con candidatos | 13/13 | 13/13 |
| Campeones relacionados con algún arquetipo | 100.0% | 100.0% |
| Campeones relacionados con algún perfil | 99.6% | 100.0% |

### Perfiles recomendados

| Perfil | Composiciones |
| --- | ---: |
| engage | 3/10 |
| pick | 3/10 |
| scaling | 3/10 |
| followUp | 2/10 |
| sideLane | 2/10 |
| disengage | 1/10 |
| earlyPressure | 1/10 |
| frontline | 1/10 |
| frontToBack | 1/10 |
| mapControl | 1/10 |
| peel | 1/10 |
| sustainedDamage | 1/10 |

### Frecuencia de campeones

Conteo completo sobre composiciones distintas, además de apariciones en perfiles.

| Campeón | Composiciones | Menciones por perfil | Perfiles |
| --- | ---: | ---: | ---: |
| Dr. Mundo | 4/10 | 4 | 2 |
| Aurora | 3/10 | 3 | 2 |
| Diana | 3/10 | 3 | 1 |
| Elise | 3/10 | 3 | 1 |
| Illaoi | 3/10 | 3 | 1 |
| Jax | 3/10 | 3 | 1 |
| Morgana | 3/10 | 3 | 1 |
| Pantheon | 3/10 | 3 | 1 |
| Smolder | 3/10 | 3 | 1 |
| Aatrox | 2/10 | 2 | 2 |
| Camille | 2/10 | 2 | 1 |
| Garen | 2/10 | 2 | 1 |
| Mordekaiser | 2/10 | 2 | 1 |
| Viego | 2/10 | 2 | 1 |
| Gragas | 1/10 | 2 | 2 |
| Braum | 1/10 | 1 | 1 |
| Cassiopeia | 1/10 | 1 | 1 |
| Cho'Gath | 1/10 | 1 | 1 |
| Gwen | 1/10 | 1 | 1 |
| Ivern | 1/10 | 1 | 1 |
| K'Sante | 1/10 | 1 | 1 |
| Kled | 1/10 | 1 | 1 |
| Maokai | 1/10 | 1 | 1 |
| Master Yi | 1/10 | 1 | 1 |
| Nunu & Willump | 1/10 | 1 | 1 |
| Poppy | 1/10 | 1 | 1 |
| Tahm Kench | 1/10 | 1 | 1 |
| Talon | 1/10 | 1 | 1 |
| Teemo | 1/10 | 1 | 1 |
| Varus (On-Hit) | 1/10 | 1 | 1 |
| Volibear | 1/10 | 1 | 1 |
| Yasuo | 1/10 | 1 | 1 |

### Repetición y diversidad entre composiciones

Señal de repetición por campeón: aparece en al menos 3 composiciones distintas. Es una alerta exploratoria, no significa por sí sola que una recomendación sea incorrecta.

Campeones con aparición frecuente: Dr. Mundo (4/10), Aurora (3/10), Diana (3/10), Elise (3/10), Illaoi (3/10), Jax (3/10), Morgana (3/10), Pantheon (3/10), Smolder (3/10).

Pares con recomendaciones de alta coincidencia:

| Composición A | Composición B | Campeones compartidos | Jaccard |
| --- | --- | ---: | ---: |
| Front to Back | Híbrida | 6 | 100.0% |
| Teamfight | Incoherente | 4 | 66.7% |

## Casos incluidos

| Caso | Identidad detectada | Coherencia | Estado de recomendación | Perfiles |
| --- | --- | --- | --- | --- |
| Front to Back | Front to Back | hybrid | recommended | sideLane, scaling |
| Dive | Dive | hybrid | recommended | engage, pick |
| Pick | Pick | hybrid | recommended | sustainedDamage, frontToBack |
| Poke | Poke | hybrid | recommended | peel, disengage |
| Split Push | Split Push | hybrid | recommended | pick, mapControl |
| Teamfight | Teamfight | coherent | recommended | engage, followUp |
| Escalado | Escalado | hybrid | recommended | earlyPressure, pick |
| Early Game | Early Game | hybrid | recommended | scaling, frontline |
| Híbrida | Front to Back | hybrid | recommended | sideLane, scaling |
| Incoherente | Sin identidad | incoherent | recommended | engage, followUp |

## Limitaciones

- El conjunto es pequeño y curado; representa referencias estratégicas concretas, no todo el espacio posible de composiciones.
- El resultado depende de los atributos y el catálogo actuales. No refleja popularidad, winrate, datos online ni contexto de rival.
- La frecuencia mide exposición dentro de las salidas evaluadas, no calidad competitiva ni probabilidad de victoria.
- La similitud compara nombres de campeones recomendados; no evalúa equivalencia táctica.
- Los umbrales de repetición son señales para revisión manual, no criterios de aprobación ni fallos automáticos del motor.
- La cobertura perfil/rol no califica la calidad ni el orden de cada candidato.
- La matriz ampliada cubre tres órdenes seleccionados y pocos escenarios controlados; no representa todas las permutaciones ni todos los cambios de plan posibles.
- Se considera recomendación materialmente distinta si los top 3 comparten como máximo un campeón; este umbral es una convención de auditoría, no una regla del motor.

## Cómo interpretar los resultados

Usa la sensibilidad al orden junto con la estabilidad ante órdenes alternativos: un valor alto de sensibilidad no es automáticamente un defecto, pero puede revelar que el mismo equipo recibe lecturas muy distintas por el orden de selección. La diferenciación material indica que los top 3 comparten como máximo un campeón; la adaptación tras cambio de identidad solo es útil si las nuevas listas siguen siendo estratégicamente coherentes. La cobertura de escenarios indica cuántos tipos previstos están representados, no la cobertura de todas las composiciones posibles.
La cobertura de candidatos localiza casos donde no se ofrecen alternativas y diversidad muestra cuánto rota el catálogo. Las frecuencias altas y los pares similares priorizan revisión manual. Una concentración puede ser razonable si el catálogo o los atributos respaldan repetidamente una pieza; las métricas no justifican cambiar pesos o comportamiento sin investigación adicional.

La auditoría es una herramienta interna de observación. Sus cifras no se muestran en la aplicación y no alteran las recomendaciones.

## Auditoría del draft

La auditoría recorre los primeros cuatro picks de cada una de las diez composiciones representativas: 40 estados y hasta 100 combinaciones de estado/rol. En las transiciones compara los tres candidatos por rol que sigue libre.

Además, una matriz pequeña y curada recorre cuatro composiciones en tres órdenes cada una (48 prefijos), cuatro sustituciones de campeones que comparten rol, identidad y función, dos cambios de una sola pieza que alteran el plan, un contraste Poke–Dive y dos ramas que comienzan con Ahri. Esta matriz amplía la cobertura sin enumerar permutaciones ni generar cientos de escenarios.

La alineación contextual mide qué proporción de candidatos apunta a la identidad que ya se puede reconocer en el draft parcial. La adaptación mide cuántas listas por rol cambian tras añadir un pick; la estabilidad mide el solapamiento medio de los tres candidatos cuando la identidad se mantiene. La adaptación no se interpreta aislada: debe leerse junto con alineación y estabilidad.

| Métrica | Resultado actual | Interpretación |
| --- | ---: | --- |
| Estados de draft | 40 | 10 arquetipos de referencia por 4 tamaños de draft. |
| Identidades secundarias | 16/40 (40.0%) | En el draft requiere apoyo de varias piezas; en un equipo completo conserva una señal rival fuerte para detectar contradicciones. |
| Estabilidad de identidad principal | 81.5% | Transiciones consecutivas con la misma identidad entre casos reconocibles: 22/27. |
| Diferenciación entre identidades distintas | 97.6% | Uno menos el Jaccard medio de los top 3 por rol, entre estados del mismo tamaño con identidad distinta; 369 pares. |
| Categorías estratégicas utilizadas | 8 | Categorías de identidad usadas en las recomendaciones del corpus. |
| Cobertura de rol | 100.0% | Roles aún vacíos con tres recomendaciones disponibles. |
| Diversidad | 25.7% | Campeones únicos dividido por todas las menciones en los estados auditados. |
| Adaptación al contexto | 97.9% | Candidatos cuya dirección coincide con la identidad reconocible; 285 menciones evaluables. |
| Cambio de listas entre picks | 61.7% | Listas por rol común que cambian al añadir el siguiente campeón. |
| Estabilidad con identidad constante | 82.9% | Solapamiento medio del top 3 entre transiciones que mantienen identidad; 41 comparaciones. |
| Repetición de sugerencias | 27.7% | Menciones pertenecientes a campeones que aparecen en 8 o más contextos draft/rol. |
| Campeones distintos / máxima repetición | 77 / 24 contextos | Variedad del catálogo y máxima frecuencia entre estados. |
| Diferenciación entre composiciones cercanas | 95.4% | 1 menos el solapamiento medio de recomendaciones tras sustituir una pieza y obtener otra identidad; 189 pares. |
| Órdenes guiados por señales estratégicas | 2.3% | Pares de candidatos invertidos respecto a su afinidad bruta mediante la huella de señales, dentro de un punto de afinidad; 7/300 pares. |
| Cobertura de etapas | 40/40 | Estados con recomendaciones desde 1 hasta 4 picks. |
| Sensibilidad al orden | 60.0% | Comparaciones de top 3 por rol que cambian al variar el orden de una misma composición; 60 comparaciones. |
| Estabilidad al cambiar el orden | 46.0% | Jaccard medio del top 3 por rol para la misma composición y tamaño de draft bajo órdenes distintos. |
| Estabilidad con identidad constante entre órdenes | 88.0% | Jaccard medio solo cuando ambos órdenes reconocen la misma identidad; 30 comparaciones. |
| Estabilidad de identidad ante equivalentes | 81.3% | Prefijos donde la identidad se conserva tras sustituir una pieza por otra del mismo rol, identidad y función; 16 comparaciones en 4 sustituciones. |
| Estabilidad de recomendaciones ante equivalentes | 76.5% | Jaccard medio de candidatos por rol tras las sustituciones equivalentes; 40 comparaciones. |
| Diferenciación entre planes cercanos | 100.0% | Comparaciones de una sola sustitución que cambian identidad y dejan como máximo un candidato compartido entre los top 3; 2 pares. |
| Diferenciación media de planes cercanos | 100.0% | Uno menos el Jaccard medio de recomendaciones para esos pares. |
| Diferenciación de planes opuestos | 100.0% | Uno menos el Jaccard medio de candidatos entre Poke y Dive en drafts de 2, 3 y 4 picks. |
| Adaptación tras cambio de identidad | 100.0% | Listas por rol que cambian entre ramas con el mismo primer pick cuando sus identidades divergen; 8 comparaciones. |
| Recomendaciones distintas tras cambio de identidad | 100.0% | Comparaciones anteriores cuyo top 3 comparte como máximo un candidato. |
| Cobertura efectiva de escenarios | 6/6 (100.0%) | Tipos cubiertos: orden, equivalentes, plan cercano, planes opuestos, apertura ambigua y tamaños de draft. |
| Cobertura de tamaños | 4/4 (100.0%) | Tamaños con al menos un escenario evaluado: 1, 2, 3 y 4 picks. |

#### Escenarios ampliados

| Escenario | Casos incluidos |
| --- | --- |
| Órdenes de la misma composición | 48 prefijos: cuatro composiciones × tres órdenes × cuatro tamaños. |
| Sustituciones equivalentes | 4 reemplazos verificados por rol, identidad y función. |
| Plan cercano distinto | 2 pares de una sustitución; identidades: Front to Back → Escalado; Teamfight → Dive. |
| Planes opuestos | Poke frente a Dive en 2, 3 y 4 picks; 6 comparaciones por rol disponible. |
| Apertura ambigua | Ahri abre las ramas Dive y Pick. |
| Tamaños cubiertos | 1, 2, 3 y 4 picks. |

### Revisión de consistencia contextual (PR33)

La sensibilidad al orden de la matriz compara prefijos del mismo tamaño, pero esos prefijos contienen campeones distintos; por tanto mide cambio de contexto durante el draft, no dependencia del orden del mismo conjunto. Una prueba directa invierte el orden de almacenamiento de los mismos picks y confirma que el resultado permanece idéntico. La estabilidad entre órdenes con la misma identidad (88.0%) y la adaptación tras cambio de identidad (100.0%) muestran que la mayor parte de la variación coincide con cambios reales de contexto.

Las sustituciones de la matriz comparten rol, identidad y función, pero no todas las señales estratégicas. Por ejemplo, las parejas Sejuani/Amumu y Lulu/Milio difieren en fortalezas y debilidades declaradas. Esa evidencia también alimenta el ranking, así que un cambio de candidatos no demuestra por sí solo una inconsistencia. La métrica actual de equivalencia es orientativa y no representa identidad completa de atributos.

Se ensayó localmente dejar de usar la identidad provisional mejor puntuada hasta que alcance el umbral de identidad confirmada. El cambio elevó ligeramente diversidad y diferenciación de composiciones cercanas, pero redujo estabilidad de recomendaciones; por ello no se incorpora.

| Métrica | Base v3.4.0 | Ensayo descartado | Cambio |
| --- | ---: | ---: | ---: |
| Alineación contextual | 97.9% | 97.9% | 0.0 p.p. |
| Diversidad | 25.3% | 25.7% | +0.4 p.p. |
| Repetición | 27.7% | 27.7% | 0.0 p.p. |
| Diferenciación de composiciones cercanas | 95.4% | 97.4% | +2.0 p.p. |
| Estabilidad general entre picks de identidad constante | 82.9% | 81.3% | -1.6 p.p. |
| Estabilidad ante órdenes de identidad constante | 89.7% | 87.0% | -2.7 p.p. |
| Estabilidad ante sustituciones equivalentes | 77.7% | 72.2% | -5.5 p.p. |

La diferenciación de planes cercanos/opuestos y la adaptación tras un cambio de identidad se mantuvieron en 100% durante el ensayo, pero no compensaron la pérdida medida de estabilidad. Aquella revisión PR33 conservó el comportamiento v3.4.0 sin cambios funcionales. La comparación aislada de v3.5.0 se documenta en Draft-Strategic-Fit-Comparison.md.

La oportunidad pendiente es refinar la definición de equivalencia para comparar picks con huellas estratégicas realmente equivalentes. La auditoría actual aporta cuatro pares pequeños, insuficientes para justificar una regla general de normalización del motor.


### Impacto del conocimiento en el draft

La ampliación histórica de vocabulario reconoce Desgaste como una señal de Poke. Estas columnas comparan esa línea base con el resultado actual y acumulan mejoras posteriores; no aíslan el efecto de una sola relación. Véase Draft-Strategic-Fit-Comparison.md para aislar v3.5.0.

| Métrica | Antes | Después | Cambio |
| --- | ---: | ---: | ---: |
| Diversidad | 24.0% | 25.7% | +1.7 p.p. |
| Repetición | 36.3% | 27.7% | -8.6 p.p. |
| Diferenciación entre identidades | 97.2% | 97.6% | +0.4 p.p. |

### Comparación con la línea base anterior al Quality Pass 2

| Métrica | Antes | Después | Cambio |
| --- | ---: | ---: | ---: |
| Diversidad | 22.0% | 24.0% | +2.0 p.p. |
| Adaptación al contexto | 76.5% | 97.2% | +20.7 p.p. |
| Cambio de listas entre picks | 85.0% | 65.0% | -20.0 p.p. |
| Estabilidad con identidad constante | 61.8% | 82.1% | +20.3 p.p. |
| Repetición de sugerencias | 40.3% | 36.3% | -4.0 p.p. |
| Cobertura de rol | 100.0% | 100.0% | 0.0 p.p. |
| Menciones / campeones distintos | 300 / 66 | 300 / 72 | — |

### Comparación antes/después del Quality Pass 3

La comparación usa el resultado consolidado del Quality Pass 2 como línea base; el corpus, los roles y el tamaño de las listas se mantienen iguales. Durante el draft, Quality Pass 3 exige apoyo de varias piezas para asignar una identidad secundaria; en composiciones completas conserva el criterio anterior para no alterar el análisis ya establecido. También aumenta de 8 a 12 la penalización draft por recomendar una dirección que contradice la identidad emergente.

| Métrica | Antes (QP2) | Después (QP3) | Cambio |
| --- | ---: | ---: | ---: |
| Identidad secundaria asignada | 90.0% | 40.0% | -50.0 p.p. |
| Estabilidad de identidad principal | 81.5% | 81.5% | +0.0 p.p. |
| Diferenciación entre identidades distintas | 97.3% | 97.2% | -0.1 p.p. |
| Categorías estratégicas utilizadas | 8 | 8 | +0 |
| Concentración en la categoría más frecuente | 27.7% | 27.0% | -0.7 p.p. |
| Diversidad de candidatos | 24.0% | 24.0% | 0.0 p.p. |
| Repetición de sugerencias | 36.3% | 36.3% | 0.0 p.p. |
| Diferenciación contextual (alineación) | 97.2% | 97.9% | +0.7 p.p. |
| Estabilidad de recomendaciones con identidad constante | 82.1% | 82.9% | +0.8 p.p. |

Uso de categorías antes (QP2): Front to Back 83; Pick 34; Dive 23; Teamfight 42; Poke 27; Early Game 42; Split Push 36; Escalado 13.
Uso de categorías después (QP3): Front to Back 81; Early Game 42; Teamfight 42; Split Push 36; Pick 34; Poke 27; Dive 23; Escalado 15.

La reducción de identidades secundarias refleja un umbral más exigente de evidencia: no se etiqueta como híbrida una composición por una señal aislada. La estabilidad de identidad mide continuidad de la identidad principal entre etapas adyacentes con identidad reconocible. La alineación y la estabilidad de recomendaciones permiten comprobar que el ajuste mantiene precisión y continuidad del draft.

### Comparación antes/después del Quality Pass 4

La línea base se ejecuta con el código de `origin/main` previo a QP4 sobre el mismo catálogo y los mismos casos. La nueva selección usa la huella de señales del arquetipo emergente para desempatar recomendaciones cuya afinidad queda a un punto de la mejor, conservando la afinidad como límite de calidad. Para medir composiciones cercanas, el corpus sustituye una pieza en prefijos de 2, 3 y 4 picks; solo compara pares cuya identidad principal cambia y calcula el solapamiento medio del top 3 en los roles todavía vacíos.

| Métrica | Antes (QP3) | Actual (QP4 y posteriores) | Cambio acumulado |
| --- | ---: | ---: | ---: |
| Diversidad de candidatos | 24.0% | 25.7% | +1.7 p.p. |
| Repetición de sugerencias | 36.3% | 27.7% | -8.6 p.p. |
| Diferenciación entre identidades distintas | 97.2% | 97.6% | +0.4 p.p. |
| Diferenciación entre composiciones cercanas | 93.9% | 95.4% | +1.5 p.p. |
| Pares cercanos auditados | 189 | 189 | — |
| Alineación contextual | 97.9% | 97.9% | 0.0 p.p. |
| Estabilidad con identidad constante | 82.9% | 82.9% | 0.0 p.p. |
| Decisiones de orden guiadas por señales | 0.0% | 2.3% | +2.3 p.p. |
| Estabilidad de identidad principal | 81.5% | 81.5% | 0.0 p.p. |
| Categorías estratégicas utilizadas | 8 | 8 | +0 |
| Concentración en la categoría más frecuente | 27.0% | 27.0% | 0.0 p.p. |

QP4 amplía el catálogo recomendado y reduce la repetición, a la vez que distingue mejor composiciones cercanas y conserva la estabilidad de identidad y de listas cuando el plan no cambia. La cobertura del corpus estratégico sigue en ocho categorías, sin ampliar el modelo de identidades.

### Limitaciones de la auditoría de draft

Los estados parciales son prefijos de composiciones de referencia, no todos los órdenes posibles de selección. La identidad emergente es la lectura provisional del mismo analizador con los picks disponibles; si aún no hay una identidad, esa fila no se incluye en la alineación. El cambio de una lista no equivale por sí solo a una mejora: debe acompañarse de alineación o de una identidad que haya cambiado. La estabilidad mide continuidad de alternativas, no garantiza calidad competitiva.
