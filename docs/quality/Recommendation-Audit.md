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
| Menciones de candidatos | 56 | Apariciones en listas por perfil; un campeón puede aparecer en varios perfiles. |
| Campeones distintos recomendados | 31 | Diversidad total del catálogo recomendado. |
| Diversidad de campeones | 55.4% | Campeones únicos dividido por todas las menciones por perfil. |
| Cobertura de rol por perfil | 95.0% | Pares perfil/rol con al menos una alternativa, entre los pares de perfiles recomendados. |
| Perfiles estratégicos distintos | 12 | Variedad de perfiles ofrecidos por la cadena en el conjunto auditado. |
| Pares de composiciones con alta repetición | 2 | Pares que comparten al menos 2 campeones recomendados y Jaccard ≥ 50.0%. |

### Comparación con la línea base anterior al Quality Pass 1

La línea base conserva las métricas generadas por la herramienta en la PR #23, antes de esta recalibración.

| Métrica | Antes | Después | Cambio |
| --- | ---: | ---: | ---: |
| Menciones de candidatos | 83 | 56 | -32.5% |
| Campeones distintos | 32 | 31 | -3.1% |
| Diversidad de campeones | 38.6% | 55.4% | +16.8 p.p. |
| Cobertura de rol por perfil | 95.3% | 95.0% | -0.3 p.p. |
| Campeones repetidos en ≥3 composiciones | 17 | 10 | -41.2% |
| Pares con alta coincidencia | 7 | 2 | -71.4% |
| Máxima frecuencia de un campeón | 5/10 | 4/10 | -20.0% |

La concentración repetida baja: los pares con alta coincidencia pasan de 7 a 2 y los campeones frecuentes de 17 a 10. La cobertura de rol por perfil retrocede 0.3 p.p. y el catálogo único recomendado disminuye en 1; conviene vigilar estos dos costes en auditorías futuras.

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
| Aatrox | 3/10 | 3 | 3 |
| Aurora | 3/10 | 3 | 2 |
| Diana | 3/10 | 3 | 1 |
| Elise | 3/10 | 3 | 1 |
| Illaoi | 3/10 | 3 | 1 |
| Jax | 3/10 | 3 | 1 |
| Morgana | 3/10 | 3 | 1 |
| Pantheon | 3/10 | 3 | 1 |
| Smolder | 3/10 | 3 | 1 |
| Camille | 2/10 | 2 | 1 |
| Garen | 2/10 | 2 | 1 |
| Mordekaiser | 2/10 | 2 | 1 |
| Gragas | 1/10 | 2 | 2 |
| Braum | 1/10 | 1 | 1 |
| Cassiopeia | 1/10 | 1 | 1 |
| Cho'Gath | 1/10 | 1 | 1 |
| Darius | 1/10 | 1 | 1 |
| Gwen | 1/10 | 1 | 1 |
| Ivern | 1/10 | 1 | 1 |
| K'Sante | 1/10 | 1 | 1 |
| Kai'Sa | 1/10 | 1 | 1 |
| Kled | 1/10 | 1 | 1 |
| Maokai | 1/10 | 1 | 1 |
| Nunu & Willump | 1/10 | 1 | 1 |
| Poppy | 1/10 | 1 | 1 |
| Tahm Kench | 1/10 | 1 | 1 |
| Teemo | 1/10 | 1 | 1 |
| Varus (On-Hit) | 1/10 | 1 | 1 |
| Volibear | 1/10 | 1 | 1 |
| Yasuo | 1/10 | 1 | 1 |

### Repetición y diversidad entre composiciones

Señal de repetición por campeón: aparece en al menos 3 composiciones distintas. Es una alerta exploratoria, no significa por sí sola que una recomendación sea incorrecta.

Campeones con aparición frecuente: Dr. Mundo (4/10), Aatrox (3/10), Aurora (3/10), Diana (3/10), Elise (3/10), Illaoi (3/10), Jax (3/10), Morgana (3/10), Pantheon (3/10), Smolder (3/10).

Pares con recomendaciones de alta coincidencia:

| Composición A | Composición B | Campeones compartidos | Jaccard |
| --- | --- | ---: | ---: |
| Front to Back | Híbrida | 6 | 100.0% |
| Teamfight | Incoherente | 3 | 50.0% |

## Casos incluidos

| Caso | Identidad detectada | Coherencia | Estado de recomendación | Perfiles |
| --- | --- | --- | --- | --- |
| Front to Back | Front to Back | hybrid | recommended | sideLane, scaling |
| Dive | Dive | hybrid | recommended | engage, pick |
| Pick | Pick | hybrid | recommended | sustainedDamage, frontToBack |
| Poke | Poke | hybrid | recommended | peel, disengage |
| Split Push | Split Push | hybrid | recommended | pick, mapControl |
| Teamfight | Teamfight | hybrid | recommended | engage, followUp |
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

## Cómo interpretar los resultados

Usa cobertura para localizar casos en los que la cadena no logra ofrecer candidatos y diversidad para observar cuánto rota el catálogo recomendado. Las frecuencias altas y los pares similares sirven para priorizar una revisión humana de redundancias. Una concentración puede ser razonable si el catálogo o los atributos respaldan repetidamente a una misma pieza; las métricas no justifican cambiar pesos o comportamiento sin una investigación adicional.

La auditoría es una herramienta interna de observación. Sus cifras no se muestran en la aplicación y no alteran las recomendaciones.

## Auditoría del draft

La auditoría recorre los primeros cuatro picks de cada una de las diez composiciones representativas: 40 estados y hasta 100 combinaciones de estado/rol. En las transiciones compara los tres candidatos por rol que sigue libre.

La alineación contextual mide qué proporción de candidatos apunta a la identidad que ya se puede reconocer en el draft parcial. La adaptación mide cuántas listas por rol cambian tras añadir un pick; la estabilidad mide el solapamiento medio de los tres candidatos cuando la identidad se mantiene. La adaptación no se interpreta aislada: debe leerse junto con alineación y estabilidad.

| Métrica | Resultado actual | Interpretación |
| --- | ---: | --- |
| Estados de draft | 40 | 10 arquetipos de referencia por 4 tamaños de draft. |
| Cobertura de rol | 100.0% | Roles aún vacíos con tres recomendaciones disponibles. |
| Diversidad | 24.0% | Campeones únicos dividido por todas las menciones en los estados auditados. |
| Adaptación al contexto | 97.2% | Candidatos cuya dirección coincide con la identidad reconocible; 285 menciones evaluables. |
| Cambio de listas entre picks | 65.0% | Listas por rol común que cambian al añadir el siguiente campeón. |
| Estabilidad con identidad constante | 82.1% | Solapamiento medio del top 3 entre transiciones que mantienen identidad; 41 comparaciones. |
| Repetición de sugerencias | 36.3% | Menciones pertenecientes a campeones que aparecen en 8 o más contextos draft/rol. |
| Campeones distintos / máxima repetición | 72 / 27 contextos | Variedad del catálogo y máxima frecuencia entre estados. |
| Cobertura de etapas | 40/40 | Estados con recomendaciones desde 1 hasta 4 picks. |

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

### Limitaciones de la auditoría de draft

Los estados parciales son prefijos de composiciones de referencia, no todos los órdenes posibles de selección. La identidad emergente es la lectura provisional del mismo analizador con los picks disponibles; si aún no hay una identidad, esa fila no se incluye en la alineación. El cambio de una lista no equivale por sí solo a una mejora: debe acompañarse de alineación o de una identidad que haya cambiado. La estabilidad mide continuidad de alternativas, no garantiza calidad competitiva.
