# Strategic Fit & Gap Coverage — comparación

Base: main `31ce60a` (v3.4.0). Catálogo: `Draft Pool.xlsx` sin modificar. Las filas expresan hipótesis estratégicas, no predicciones de victoria ni campeones óptimos absolutos.

## Escenarios y top 3

Afinidad entre paréntesis. Las expectativas se validan por atributos del catálogo, sin fijar un ganador nominal.

| Escenario / picks | Expectativa | Antes | Después |
| --- | --- | --- | --- |
| poke-opening: Xerath → support | Con un único pick, consolidar poke antes de asumir necesidades de un equipo ya formado. | Miss Fortune (63); Vel'Koz (63); Heimerdinger (57) | Miss Fortune (63); Vel'Koz (63); Karma (61) |
| poke-two: Jayce, Xerath → support | Dos artilleros: incorporar una alternativa de poke con protección, sin descartar reforzar el núcleo. | Miss Fortune (70); Vel'Koz (70); Heimerdinger (65) | Miss Fortune (70); Vel'Koz (70); Karma (69) |
| poke-three: Jayce, Xerath, Ezreal → support | Proteger el espacio para seguir desgastando, manteniendo poke. | Miss Fortune (75); Vel'Koz (75); Heimerdinger (73) | Karma (77); Senna (77); Miss Fortune (75) |
| poke-exposed: Jayce, Nidalee, Xerath, Ezreal → support | Poke más peel antes que un cuarto contribuyente de daño a distancia. | Miss Fortune (75); Vel'Koz (75); Heimerdinger (73) | Karma (77); Senna (77); Miss Fortune (75) |
| poke-protected: Jayce, Gragas, Xerath, Ezreal → support | Gragas jungle ya aporta peel: reforzar poke vuelve a ser válido. | Miss Fortune (75); Vel'Koz (75); Heimerdinger (73) | Miss Fortune (75); Vel'Koz (75); Heimerdinger (73) |
| scaling-exposed: Karthus, Azir, Jinx → support | DPS y escalado cubiertos; la primera opción debe aportar frontline y peel. | Sona (66); Veigar (66); Fiddlesticks (67) | Braum (71); Ashe (69); Janna (69) |
| anti-frontline-is-not-frontline: Lillia, Azir, Kog'Maw → support | Anti-frontline es daño al frente rival, no un tanque propio: siguen faltando frontline y peel. | Braum (72); Ashe (70); Janna (70) | Braum (76); Ashe (72); Janna (72) |
| scaling-frontline: Sion, Karthus, Azir, Jinx → support | Sion cubre frontline; sigue siendo relevante proteger los carries. | Braum (79); Ashe (76); Janna (76) | Braum (81); Ashe (78); Janna (78) |
| front-to-back-control: Ornn, Sejuani, Orianna, Jinx → support | Conservar la protección que el recomendador ya encontraba. | Milio (84); Lulu (84); Braum (82) | Milio (84); Lulu (84); Braum (82) |
| teamfight-reinforce: Wukong, Yasuo, Miss Fortune → support | Consolidar iniciación coordinada y teamfight; no imponer peel genérico. | Rell (76); Sett (76); Alistar (72) | Rell (76); Sett (76); Alistar (72) |
| ambiguous-opening: Ahri → support | Conservar herramientas de pick mientras no exista una dirección de dive clara. | Annie (55); Bard (55); Pyke (55) | Annie (55); Bard (55); Pyke (55) |
| ambiguous-dive: Ahri, Vi, Camille → support | La apertura converge en dive: valorar engage y follow-up. | Rakan (69); Alistar (59); Annie (59) | Rakan (69); Alistar (59); Annie (59) |
| ambiguous-pick: Ahri, Elise, Gragas → support | La misma apertura con Elise y Gragas converge en cazadas. | Bard (71); Pyke (70); Camille (70) | Bard (71); Pyke (70); Camille (70) |
| early-reinforce: Renekton, Lee Sin → mid | Mantener presión early; no premiar herramientas de escalado ajenas al tempo. | Kled (73); LeBlanc (70); Talon (70) | Kled (73); LeBlanc (70); Talon (70) |

## Auditoría existente: 40 estados, 300 menciones

| Métrica | Antes | Después |
| --- | ---: | ---: |
| recommendationCoverage | 1 | 1 |
| contextAlignment | 0.979 | 0.979 |
| recommendationStability | 0.829 | 0.829 |
| recommendationChangeRate | 0.617 | 0.617 |
| crossIdentityDifferentiation | 0.975 | 0.976 |
| championDiversity | 0.253 | 0.257 |
| repetitionRate | 0.277 | 0.277 |
| maxChampionContexts | 24 | 24 |

## Matriz ampliada existente

| Métrica | Antes | Después |
| --- | ---: | ---: |
| orderStability | 0.468 | 0.46 |
| sameIdentityOrderStability | 0.897 | 0.88 |
| equivalentRecommendationStability | 0.777 | 0.765 |
| closePlanRecommendationDifferentiation | 1 | 1 |
| opposingPlanRecommendationDifferentiation | 1 | 1 |
| adaptationAfterIdentityChange | 1 | 1 |
| materiallyDifferentAfterIdentityChange | 1 | 1 |

## Muestra independiente: 32 equipos, semilla 3400, 128 estados

| Métrica | Antes | Después |
| --- | ---: | ---: |
| stages | 128 | 128 |
| groups | 320 | 320 |
| validRoleRate | 1 | 1 |
| contextAlignment | 0.995 | 0.995 |
| recommendationStability | 0.86 | 0.827 |
| stableTransitions | 81 | 81 |
| recommendationChangeRate | 0.661 | 0.677 |
| championDiversity | 0.096 | 0.098 |
| maxChampionMentions | 71 | 71 |

## Composiciones completas

Análisis idéntico antes/después en los 32 equipos de la muestra. Cadena completa existente: 10/10 identidades de referencia, 57 menciones y 32 candidatos distintos. Diagnóstico, correcciones y bans no se modifican.

## Reproducir

Extraer `src/domain/composition-engine.js` del commit `31ce60a` a un archivo temporal `.cjs` y ejecutar:

```sh
node tools/audit-draft-strategic-fit.cjs --baseline /ruta/composition-engine-base.cjs
node tools/check-draft-strategic-fit.cjs
```

Las proporciones miden el corpus, no calidad competitiva. La alineación por etiqueta puede considerar desalineada una herramienta útil; la estabilidad tampoco es un objetivo absoluto si cambia una necesidad. Revisar las regresiones y fuentes en `Draft-Strategic-Fit-Review.md`.
