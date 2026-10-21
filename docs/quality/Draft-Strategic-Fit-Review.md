# Strategic Fit & Gap Coverage

## Causa y cambio localizado

`recommendPicks` ya puntúa el equipo hipotético y mantiene su identidad, pero el
término de sinergia solo reconoce señales compartidas. La protección no figura
entre las señales de Poke ni Escalado: añadir más daño o repetir late puede
puntuar mejor que habilitar a los carries existentes. El bono marginal tampoco
resuelve una herramienta que no forma parte de esas señales.

Se declaran dos relaciones dentro de los arquetipos existentes: Poke necesita
peel; Escalado puede necesitar frontline y peel. Se reutiliza el vocabulario de
`STRATEGIC_GAPS`, sin nuevos perfiles, fichas, catálogo ni motor. Una cobertura
ausente aporta como máximo cuatro puntos de afinidad, repartidos entre las
necesidades del plan. El límite es deliberadamente inferior al premio máximo de
señales compartidas (12) y a la penalización de cambio de identidad (12).

El bono exige una identidad reconocida y que el candidato conserve esa misma
dirección hipotética. Si la capacidad ya existe, su repetición no recibe ese
bono. La cohesión, el desempate, la selección por rol y las explicaciones siguen
siendo los existentes. `Anti-frontline` no cuenta como frontline propia al
calcular estas coberturas; se usan términos completos, sin modificar el matcher
del diagnóstico ni sus puntuaciones.

Se descartó una variante que premiaba además las coberturas de Front to Back y
perdonaba cambios de etiqueta: mejoraba algunos ejemplos pero reducía la
alineación original de 0.979 a 0.954 y la estabilidad entre órdenes con igual
identidad de 0.897 a 0.803. La solución final conserva la barrera de identidad y
no recalibra el diagnóstico ni añade una recompensa universal por diversidad.

## Evidencia y criterio de aceptación

La [comparación reproducible](Draft-Strategic-Fit-Comparison.md) incluye los
top 3 antes/después y expectativas explícitas para 14 escenarios de 1–4 picks,
la auditoría original, su matriz ampliada y 128 estados adicionales de 32
equipos muestreados con semilla fija, sin seleccionar por resultado.

- En poke expuesto, Karma y Senna aportan simultáneamente Poke y Peel según el
  Excel; desplazan duplicaciones de daño sin forzar engage ni abandonar Poke.
- Al sustituir Nidalee por Gragas jungle, los otros tres picks
  conservan Poke pero ya tienen Peel. El top vuelve a reforzar daño a distancia:
  complementar deja de ser prioritario cuando no cubre un hueco.
- Con Karthus, Azir y Jinx, Braum aporta Frontline y Peel frente a nuevas piezas
  de escalado sin protección. El caso adicional con Lillia y Kog'Maw confirma que
  Anti-frontline no debe ocultar la ausencia de un frente propio.
- Front to Back conserva sus opciones de protección, Teamfight su iniciación,
  y la apertura Ahri se distingue entre Dive y Pick al añadir compañeros. No se
  exigen nombres ganadores en las pruebas: se contrastan atributos disponibles.

Las pruebas también comprueban que un candidato pierda el valor de cobertura
al aparecer un compañero que ya aporta esa herramienta. Se mantienen rol,
exclusiones, top 3, determinismo e invariancia al orden de almacenamiento. Los
32 análisis completos se comparan íntegramente con la versión anterior.

## Regresiones y límites

La comparación publica también las bajadas de estabilidad de la matriz y de
la muestra independiente. Parte de ese coste es intencional: cuando entra un
aliado con Peel, deja de premiarse otro protector y vuelve a subir el refuerzo
del plan. No debe confundirse estabilidad entre prefijos diferentes con
invariancia al orden del mismo conjunto de picks, que se conserva exactamente.

| Indicador | Antes | Después |
| --- | ---: | ---: |
| Alineación / estabilidad / adaptación, 40 estados originales | 97.9% / 82.9% / 61.7% | 97.9% / 82.9% / 61.7% |
| Estabilidad entre órdenes con identidad igual, matriz ampliada | 89.7% | 88.0% |
| Estabilidad ante sustituciones equivalentes, matriz ampliada | 77.7% | 76.5% |
| Estabilidad con identidad constante, 128 estados independientes | 86.0% | 82.7% |
| Alineación / validez por rol, muestra independiente | 99.5% / 100% | 99.5% / 100% |

Ejemplos explícitos de pérdida de continuidad (top 3 de support, en orden):

| Estado | Antes | Después |
| --- | --- | --- |
| Ryze, Zyra jungle, Ekko | Sona, Veigar, Seraphine | Seraphine, Braum, Lulu |
| Mismo equipo + Zeri | Sona, Veigar, Seraphine | Braum, Ashe, Janna |
| Gangplank, Viego, Hwei | Sona, Veigar, Seraphine | Seraphine, Lulu, Braum |
| Mismo equipo + Ashe | Sona, Veigar, Seraphine | Sona, Veigar, Seraphine |

En el primer par no cambia la presencia de protección y se pierden dos
alternativas compartidas: es una regresión residual de estabilidad. Las nuevas
opciones siguen aportando Peel, pero no se demuestra que cada sustitución sea
necesaria. En el segundo par Ashe ya aporta Peel y se retira el bono, por lo que
parte del cambio representa la adaptación buscada. El sistema todavía puede
volver a sugerir daño redundante al quedar otra necesidad menos premiada.

No toda variación queda justificada por una necesidad nueva. El empate de un
punto y la especificidad existentes pueden sustituir una tercera alternativa
al variar levemente la afinidad. Es un coste residual de esta mejora, no una
ganancia estratégica demostrada. Se acepta el ajuste acotado por las mejoras
observables en varios escenarios, manteniendo alineación, adaptación y
estabilidad en el corpus original; no se persigue maximizar diversidad.

La protección sigue siendo binaria: un único Peel ya cubre el hueco. No se
evalúan alcance, enfriamientos, habilidad, rival, redundancia táctica fina ni
grado de protección. Con un solo Jinx no se elimina toda preferencia por
Escalado; cambiar esa lectura exigiría revisar la penalización de identidad,
descartada aquí por sus regresiones. El significado de etiquetas del Excel
continúa limitando las conclusiones: una cobertura nominal no garantiza calidad
competitiva. Las relaciones nuevas se limitan a los dos planes demostrados;
no se extrapolan carencias universales a Pick, Dive o Early Game.

## Fuentes y conocimiento

Consulta: 21 de octubre de 2026. Los atributos de cada escenario proceden de
`Draft Pool.xlsx`; las fuentes contrastan su interpretación estratégica y no
se consultan desde la aplicación.

- [Dignitas, guía de composiciones Poke, soduh, 13-08-2021](https://dignitas.gg/articles/team-composition-guide-to-poke-compositions-in-league-of-legends):
  describe el desgaste previo a objetivos, la necesidad de evitar entradas y el
  papel defensivo de Gragas y Karma. Se reutilizan esos principios duraderos;
  sus objetos, enfriamientos y valoraciones del meta de 2021 se excluyen.
- [Riot: Lulu](https://www.leagueoflegends.com/en-us/champions/lulu/): la ficha
  describe el escudo aliado y la ayuda a ataques. Es evidencia cualitativa de
  habilitación y protección; no prueba que Lulu deba ganar ningún ranking.
- [Riot: Braum](https://www.leagueoflegends.com/en-us/champions/braum/): rol
  Tank/Support y control que puede encadenarse con ataques aliados. Respalda
  cualitativamente la combinación de frente y control registrada en el Excel.

La inferencia de ingeniería es que cubrir una herramienta protectora ausente
puede habilitar el plan existente. Las fuentes no prescriben el bono numérico
ni una tier list. No se importan estadísticas, builds o datos de parche. El
catálogo permanece intacto y el cálculo sigue siendo local y determinista.

## Validación

Se ejecutan todas las comprobaciones Node existentes, las pruebas nuevas,
auditorías antes/después, sincronización de v3.5.0 y `git diff --check`. La
actualización menor usa el mecanismo existente y cambia la caché de v71 a v72.

Chromium se descargó usando los certificados del sistema tras un fallo TLS,
pero su ejecutable dio `spawn UNKNOWN` en este entorno Windows. Las tres suites
Playwright existentes pasaron con el Chrome instalado mediante
`LTA_CHROMIUM_PATH`: ciclo PWA/offline, selectores/duplicados y UX/teclado en
320, 375, 390, 768 y 1280 px. No se añaden dependencias al proyecto.
