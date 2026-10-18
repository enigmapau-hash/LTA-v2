# Auditoría de recomendaciones estratégicas

Informe reproducible generado a partir del catálogo de campeones incluido en el proyecto.

## Metodología

La herramienta genera diez composiciones de referencia desde nombres de campeones presentes en el catálogo: Front to Back, Dive, Pick, Poke, Split Push, Teamfight, escalado, Early Game, híbrida e incoherente. Los atributos de cada pieza se leen del catálogo; no se duplican ni se inventan para la auditoría.

Para cada equipo ejecuta la cadena existente de diagnóstico, corrección, Composition Optimizer, Strategic Recommendation Engine, Candidate Mapper y Candidate Evaluator. La auditoría no cambia esos motores ni selecciona alternativas nuevas. Cuenta como recomendación cada candidato evaluado dentro de su perfil estratégico.

La generación y ordenación son deterministas. Para regenerar este informe ejecuta node tools/recommendation-audit.cjs --write; para verificar contratos y reproducibilidad ejecuta node tools/check-recommendation-audit.cjs.

## Métricas

| Métrica | Resultado | Interpretación |
| --- | ---: | --- |
| Composiciones auditadas | 10 | Casos representativos declarados en el generador. |
| Cobertura de recomendaciones | 10/10 (100.0%) | Casos que produjeron al menos un perfil con candidatos evaluados. |
| Menciones de candidatos | 83 | Apariciones en listas por perfil; un campeón puede aparecer en varios perfiles. |
| Campeones distintos recomendados | 32 | Diversidad total del catálogo recomendado. |
| Diversidad de campeones | 38.6% | Campeones únicos dividido por todas las menciones por perfil. |
| Cobertura de rol por perfil | 95.3% | Pares perfil/rol con al menos una alternativa, entre los pares de perfiles recomendados. |
| Perfiles estratégicos distintos | 12 | Variedad de perfiles ofrecidos por la cadena en el conjunto auditado. |
| Pares de composiciones con alta repetición | 7 | Pares que comparten al menos 2 campeones recomendados y Jaccard ≥ 50.0%. |

### Perfiles recomendados

| Perfil | Composiciones |
| --- | ---: |
| pick | 5/10 |
| engage | 4/10 |
| followUp | 4/10 |
| mapControl | 3/10 |
| peel | 3/10 |
| scaling | 3/10 |
| frontline | 2/10 |
| sideLane | 2/10 |
| disengage | 1/10 |
| earlyPressure | 1/10 |
| frontToBack | 1/10 |
| sustainedDamage | 1/10 |

### Frecuencia de campeones

Conteo completo sobre composiciones distintas, además de apariciones en perfiles.

| Campeón | Composiciones | Menciones por perfil | Perfiles |
| --- | ---: | ---: | ---: |
| Aurora | 5/10 | 5 | 2 |
| Morgana | 5/10 | 5 | 1 |
| Pantheon | 5/10 | 5 | 1 |
| Aatrox | 4/10 | 4 | 3 |
| Diana | 4/10 | 4 | 1 |
| Dr. Mundo | 4/10 | 4 | 2 |
| Elise | 4/10 | 4 | 1 |
| Illaoi | 4/10 | 4 | 1 |
| Darius | 3/10 | 3 | 2 |
| Ivern | 3/10 | 3 | 1 |
| Jax | 3/10 | 3 | 1 |
| Maokai | 3/10 | 3 | 1 |
| Nunu & Willump | 3/10 | 3 | 1 |
| Smolder | 3/10 | 3 | 1 |
| Tahm Kench | 3/10 | 3 | 1 |
| Teemo | 3/10 | 3 | 1 |
| Yasuo | 3/10 | 3 | 1 |
| Gragas | 2/10 | 3 | 2 |
| Camille | 2/10 | 2 | 1 |
| Cho'Gath | 2/10 | 2 | 1 |
| K'Sante | 2/10 | 2 | 1 |
| Mordekaiser | 2/10 | 2 | 1 |
| Alistar | 1/10 | 1 | 1 |
| Braum | 1/10 | 1 | 1 |
| Cassiopeia | 1/10 | 1 | 1 |
| Gwen | 1/10 | 1 | 1 |
| Jarvan IV | 1/10 | 1 | 1 |
| Kai'Sa | 1/10 | 1 | 1 |
| Kled | 1/10 | 1 | 1 |
| Poppy | 1/10 | 1 | 1 |
| Varus (On-Hit) | 1/10 | 1 | 1 |
| Volibear | 1/10 | 1 | 1 |

### Repetición y diversidad entre composiciones

Señal de repetición por campeón: aparece en al menos 3 composiciones distintas. Es una alerta exploratoria, no significa por sí sola que una recomendación sea incorrecta.

Campeones con aparición frecuente: Aurora (5/10), Morgana (5/10), Pantheon (5/10), Aatrox (4/10), Diana (4/10), Dr. Mundo (4/10), Elise (4/10), Illaoi (4/10), Darius (3/10), Ivern (3/10), Jax (3/10), Maokai (3/10), Nunu & Willump (3/10), Smolder (3/10), Tahm Kench (3/10), Teemo (3/10), Yasuo (3/10).

Pares con recomendaciones de alta coincidencia:

| Composición A | Composición B | Campeones compartidos | Jaccard |
| --- | --- | ---: | ---: |
| Front to Back | Híbrida | 9 | 100.0% |
| Dive | Incoherente | 6 | 75.0% |
| Dive | Teamfight | 6 | 66.7% |
| Poke | Early Game | 6 | 54.5% |
| Dive | Escalado | 5 | 50.0% |
| Dive | Split Push | 5 | 50.0% |
| Teamfight | Incoherente | 5 | 50.0% |

## Casos incluidos

| Caso | Identidad detectada | Coherencia | Estado de recomendación | Perfiles |
| --- | --- | --- | --- | --- |
| Front to Back | Front to Back | hybrid | recommended | sideLane, mapControl, scaling |
| Dive | Dive | hybrid | recommended | engage, followUp, pick |
| Pick | Pick | hybrid | recommended | sustainedDamage, frontToBack, peel |
| Poke | Poke | hybrid | recommended | peel, disengage, frontline |
| Split Push | Split Push | hybrid | recommended | pick, mapControl, followUp |
| Teamfight | Teamfight | hybrid | recommended | engage, followUp, pick |
| Escalado | Escalado | hybrid | recommended | earlyPressure, pick, engage |
| Early Game | Early Game | hybrid | recommended | scaling, frontline, peel |
| Híbrida | Front to Back | hybrid | recommended | sideLane, mapControl, scaling |
| Incoherente | Sin identidad | incoherent | recommended | engage, followUp, pick |

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
