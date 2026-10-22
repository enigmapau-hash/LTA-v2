# Final Composition Diagnosis Precision

## Base y conclusión

Base: main `5277bd2`, v3.6.0, con la PR #35 fusionada. Revisión finalizada el 22 de octubre de 2026.

El exceso de vías secundarias seguía presente: 9 de 10 referencias y 29 de 32 equipos independientes tenían secundaria. Una frecuencia alta no demuestra por sí sola un error: Front to Back/Teamfight, Dive/Pick y Escalado/Front to Back pueden ser mezclas legítimas. Se corrigen únicamente dos inferencias reproducibles: atribuir protección por una etiqueta genérica Front to Back, y deducir acceso a la backline solo por compartir Engage.

## Flujo revisado y causa

El Composition Engine puntúa los ocho arquetipos. Para el diagnóstico completo seleccionaba el segundo si superaba 45 puntos y el 62% del principal, sin comprobar una herramienta distintiva. Las etiquetas amplias del catálogo y señales compartidas podían bastar. Diagnostic Engine convertía la secundaria en `hybrid`; Win Condition añadía automáticamente su ruta; Coherence la trataba como complementaria; confianza y tono heredaban esa ambigüedad. Los motores de corrección, protección y presentación consumen ese diagnóstico sin repetir el análisis.

Ejemplo: Malphite/Wukong/Yasuo/Miss Fortune/Rell tienen Teamfight, Engage y Follow-up; no tienen Backline, Acceso al carry o Flanqueo registrados. Compartir Engage no basta para atribuirles además la ruta de eliminar rápidamente la backline. Otro caso: Jayce/Nidalee/Xerath/Ezreal/Vel’Koz obtenía Front to Back secundaria pese a no registrar un frente o herramienta protectora; Anti-frontline no acredita un frente propio.

## Cambio localizado

Se mantienen puntuaciones, pesos, umbrales, identidad principal y orden de arquetipos. Solo al confirmar la secundaria en la evaluación completa se exige evidencia mínima:

- **Front to Back:** al menos una fortaleza explícita de Frontline, Peel o Anti-engage.
- **Dive:** al menos una fortaleza explícita de Backline, Acceso al carry o Flanqueo.

Son relaciones declaradas junto a los arquetipos existentes y respaldadas por el SKF; no un motor nuevo ni reglas por campeón. Se reutiliza el matcher de términos completos ya usado por la cobertura de v3.5.0 y las explicaciones de v3.6.0, renombrado `matchesExplicitSignal` al compartirlo con el análisis completo. No se modifica su comportamiento ni el matcher histórico de puntuación. Si el segundo arquetipo carece de evidencia, no se busca otro para rellenar artificialmente la etiqueta híbrida.

El draft usa su selección provisional existente, incluida la evaluación de candidatos que completan el quinto rol: no pasa por esta comprobación de secundaria del diagnóstico completo. Los contrafactuales del diagnóstico completo conservan esa misma política, sin cambiar identidad principal al retirar piezas.

Se descartó exigir simultáneamente Frontline, Peel y DPS explícitos: podía retirar rutas plausibles por etiquetas incompletas del catálogo. La versión aceptada admite protección alternativa (incluido Anti-engage) y Flanqueo, sin exigir literalmente una única palabra. No se suben umbrales ni se persigue una distribución equilibrada.

## Composiciones antes/después

La tabla incluye las 22 referencias y variantes revisadas. Los nombres se resuelven por rol en el catálogo existente; no son listas de ganadores optimizadas para un resultado numérico.

| Caso / cinco picks | Diagnóstico v3.6.0 | Diagnóstico v3.7.0 | Justificación |
| --- | --- | --- | --- |
| front-to-back: Ornn, Sejuani, Orianna, Jinx, Lulu | Front to Back · secundaria: Teamfight | Front to Back · secundaria: Teamfight | Referencia conservada; no se fuerza la desaparición de una secundaria respaldada. |
| dive: Camille, Vi, Ahri, Kai'Sa, Rakan | Dive · secundaria: Pick | Dive · secundaria: Pick | Referencia conservada; no se fuerza la desaparición de una secundaria respaldada. |
| pick: Gragas, Elise, Ahri, Jhin, Bard | Pick · secundaria: Dive | Pick · secundaria: Dive | Referencia conservada; no se fuerza la desaparición de una secundaria respaldada. |
| poke: Jayce, Nidalee, Xerath, Varus (Letalidad), Karma | Poke · secundaria: Early Game | Poke · secundaria: Early Game | Referencia conservada; no se fuerza la desaparición de una secundaria respaldada. |
| split-push: Fiora, Viego, Twisted Fate, Ezreal, Braum | Split Push · secundaria: Escalado | Split Push · secundaria: Escalado | Referencia conservada; no se fuerza la desaparición de una secundaria respaldada. |
| teamfight: Malphite, Wukong, Yasuo, Miss Fortune, Rell | Teamfight · secundaria: Dive | Teamfight | Iniciación y seguimiento no acreditan acceso a backline. |
| scaling: Sion, Karthus, Azir, Smolder, Milio | Escalado · secundaria: Front to Back | Escalado · secundaria: Front to Back | Referencia conservada; no se fuerza la desaparición de una secundaria respaldada. |
| early-game: Renekton, Lee Sin, Pantheon, Draven, Pyke | Early Game · secundaria: Pick | Early Game · secundaria: Pick | Referencia conservada; no se fuerza la desaparición de una secundaria respaldada. |
| hybrid: Ornn, Sejuani, Orianna, Jinx, Rell | Front to Back · secundaria: Teamfight | Front to Back · secundaria: Teamfight | Referencia conservada; no se fuerza la desaparición de una secundaria respaldada. |
| incoherent: Fiora, Elise, Xerath, Draven, Lulu | Sin identidad clara | Sin identidad clara | Referencia conservada; no se fuerza la desaparición de una secundaria respaldada. |
| poke-unprotected: Jayce, Nidalee, Xerath, Ezreal, Vel'Koz | Poke · secundaria: Front to Back | Poke | Poke y asedio explícitos, sin protección registrada; Anti-frontline no es un frente propio. |
| poke-protected: Jayce, Gragas, Xerath, Ezreal, Karma | Poke · secundaria: Front to Back | Poke · secundaria: Front to Back | Se conserva el desgaste principal y la vía de protección respaldada por Peel. |
| poke-peel-substitution: Jayce, Nidalee, Xerath, Ezreal, Karma | Poke · secundaria: Front to Back | Poke · secundaria: Front to Back | Solo cambia el support respecto a poke-unprotected: Peel permite acreditar la vía protegida. |
| scaling-unprotected: Kayle, Karthus, Azir, Jinx, Sona | Escalado · secundaria: Front to Back | Escalado | Late y DPS no acreditan por sí solos protección de los carries. |
| scaling-frontline: Sion, Karthus, Azir, Jinx, Sona | Escalado · secundaria: Front to Back | Escalado · secundaria: Front to Back | Una sustitución añade Frontline; no se exige un campeón con la etiqueta Peel. |
| dive-teamfight: Camille, Wukong, Yasuo, Miss Fortune, Rell | Dive · secundaria: Teamfight | Dive · secundaria: Teamfight | Camille añade Backline al mismo núcleo de iniciación y seguimiento de Teamfight. |
| contradictory: Ambessa, Evelynn, Ziggs, Tristana, Heimerdinger | Poke · secundaria: Dive | Poke · secundaria: Dive | Se conserva el conflicto real entre desgaste y acceso a la backline; no se oculta con umbrales más altos. |
| equivalent-frontline: Cho'Gath, Sejuani, Orianna, Jinx, Lulu | Front to Back · secundaria: Escalado | Front to Back · secundaria: Escalado | Cho'Gath conserva el frente y el plan; sus otras señales pueden cambiar la vía secundaria. |
| equivalent-protection: Ornn, Sejuani, Orianna, Jinx, Milio | Front to Back · secundaria: Teamfight | Front to Back · secundaria: Teamfight | Milio mantiene Peel y la protección del carry, sin forzar cambios de identidad. |
| timing-change: Ornn, Karthus, Orianna, Jinx, Lulu | Escalado · secundaria: Front to Back | Escalado · secundaria: Front to Back | Karthus sustituye la iniciación de Sejuani por más Late/DPS; permanece una vía protegida de peleas. |
| flanking-evidence: Illaoi, Darius, Qiyana, Kalista, Xerath | Teamfight · secundaria: Dive | Teamfight · secundaria: Dive | Flanqueo también acredita acceso: no se exige literalmente el término Backline. |
| anti-engage-evidence: Ryze, Zyra, Ekko, Zeri, Renata Glasc | Escalado · secundaria: Front to Back | Escalado · secundaria: Front to Back | Anti-engage es protección ya descrita en el SKF; no se exige literalmente Peel. |

### Condición de victoria y lectura visible

La condición principal permanece idéntica en los 54 estados completos comparados. Solo desaparece la condición secundaria ligada a una identidad sin respaldo. Por ejemplo:

- Poke expuesto mantiene «Desgastar antes de pelear y evitar engages directos.», sin ofrecer como alternativa la protección del ADC que no acredita el equipo.
- Teamfight conserva «Iniciar una pelea coordinada y encadenar las definitivas.», sin convertir esa iniciación en una segunda ruta Dive.
- Kayle/Karthus/Azir/Jinx/Sona conserva Escalado; sustituir solo Kayle por Sion habilita la vía secundaria Front to Back por Frontline.
- Sustituir Malphite por Camille en la referencia Teamfight mantiene el cambio ya existente a Dive/Teamfight: Backline aparece con un único cambio real.
- Los casos con Renata Glasc y Qiyana preservan las vías secundarias por Anti-engage y Flanqueo; no se exige exclusivamente Peel o Backline.

En los casos ahora inequívocos la confianza existente puede pasar de media a alta y el informe cambia «Plan probable» por «Plan principal». Esto expresa certeza sobre la identidad, no fuerza competitiva ni ausencia de debilidades. No se añaden frases, secciones ni listas; el texto del bloque estratégico no aumenta en ninguno de los 54 estados comparados.

## Métricas y compatibilidad

| Medida | v3.6.0 | v3.7.0 | Lectura |
| --- | ---: | ---: | --- |
| Identidad principal de las referencias | 10/10 | 10/10 | Conservada, incluida la composición sin identidad. |
| Referencias con secundaria | 9/10 | 8/10 | Solo se elimina Dive de la referencia Teamfight. |
| Equipos independientes con secundaria | 29/32 | 25/32 | Cuatro vías sin evidencia explícita se retiran. |
| Identidades principales / win conditions principales iguales | — | 54/54 | No se redefine el plan principal. |
| Puntuaciones de arquetipo iguales | — | 54/54 | No hay recalibración numérica. |
| Alineación draft original | 97.9% | 97.9% | Sin cambio. |
| Estabilidad draft original | 82.9% | 82.9% | Sin cambio. |
| Diversidad / repetición draft | 25.7% / 27.7% | 25.7% / 27.7% | Sin cambio. |
| Matriz: estabilidad con identidad igual / sustituciones equivalentes | 88.0% / 76.5% | 88.0% / 76.5% | Sin cambio. |
| Matriz: diferenciación planes cercanos/opuestos | 100% / 100% | 100% / 100% | Sin cambio. |
| Muestra parcial independiente: estabilidad / alineación | 82.716% / 99.520% | 82.716% / 99.520% | Sin cambio. |
| Recomendación final de referencia: menciones / candidatos únicos | 57 / 32 | 57 / 32 | Sin cambio de métricas ni ranking de referencias. |
| Bans iguales en estados completos revisados | — | 54/54 | Sin recalibrar amenazas o bans. |

Estas cifras describen el corpus, no precisión poblacional ni una mejora por reducir híbridos. La mejora se fundamenta en los atributos de los ejemplos y en la retirada de sus condiciones secundarias no acreditadas. Los híbridos legítimos y el caso Poke/Dive contradictorio se conservan.

## Efectos derivados y regresiones revisadas

- Las correcciones internas no cambian en los 54 estados. La protección principal tampoco cambia. En siete estados cambian pesos o amenazas secundarias internas al desaparecer una vía no respaldada: no se ha modificado Protection Engine.
- En cinco estados se modifica el orden de candidatos finales, aunque **no cambia ninguno de los rankings del draft**. Es el efecto del evaluador existente al dejar de premiar afinidad con una secundaria descartada; no se cambian sus pesos.
- En Kayle/Karthus/Azir/Jinx/Sona y dos equipos independientes de Escalado: Early Pressure pasa de Volibear/Kled/Talon a Kled/Volibear/Talon; Pick pasa de Morgana/Elise/Pantheon a Elise/Pantheon/Morgana. Los conjuntos se mantienen. No se afirma que cada desempate sea competitivamente superior.
- En Teemo/Zyra/Annie/Syndra/Neeko y Quinn/Lillia/Zoe/Taliyah/Zyra: Daño sostenido mantiene Varus (On-Hit) primero e intercambia Dr. Mundo/Aatrox. El perfil alternativo interno cambia de Peel a Front to Back. Ese perfil alternativo no implica añadir una identidad secundaria al diagnóstico y no es la recomendación principal presentada. Se publica como efecto relevante, no como ganancia demostrada de calidad de ranking.
- La muestra no permite descartar falsos negativos fuera del corpus: si el catálogo no registra protección o acceso, podría omitirse una vía viable en partida. Las guardas admiten Anti-engage y Flanqueo para evitar dos restricciones demasiado literales.

## Fortalezas, carencias y límites mantenidos

Se revisaron, pero no se reescriben las fortalezas/debilidades generales de cada arquetipo ni la priorización del problema principal. En equipos con identidad clara los gaps del análisis siguen vacíos y el riesgo principal procede del perfil: esta PR no convierte esa plantilla en un inventario exhaustivo de capacidades. No se afirma que un equipo sin secundaria sea más equilibrado o resistente. Es una mejora acotada de identidad y coherencia de la ruta secundaria, no una solución completa a toda limitación histórica del diagnóstico.

No cambian la fuente de datos, UI, selector, Excel o arquitectura. No hay estadísticas, APIs en ejecución, reglas particulares de campeones o dependencias nuevas.

## Fuentes y fundamento

Consultadas el 22 de octubre de 2026. Los atributos concretos proceden de `Draft Pool.xlsx`; los principios de protección del carry, acceso a la backline y separación entre iniciación y ejecución ya están descritos en el SKF.

- [Riot, Champion Insights: Sett](https://www.leagueoflegends.com/en-sg/news/dev/champion-insights-sett/): describe la protección de la retaguardia mediante el frente y cómo una entrada altera esa disposición. Se usa ese principio estable; no se importan builds ni valoraciones del campeón.
- [Riot, /dev: Matchmaking Real Talk, 26-02-2018](https://www.leagueoflegends.com/en-gb/news/dev/dev-matchmaking-real-talk/): distingue protección del ADC, control del espacio por tanques y acceso de asesinos a la retaguardia como contribuciones diferentes. Solo respalda esa distinción conceptual; no se usa su discusión de matchmaking ni cifras históricas.

La decisión de exigir evidencia mínima para una etiqueta secundaria es una regla conservadora del modelo, no una regla universal demostrada por esas fuentes. No se incorporan datos dependientes del parche.

## Validación y reproducción

- `node tools/check-final-diagnosis-precision.cjs`: 22 referencias/variantes y 32 equipos independientes; mezcla legítima, contradicción real, sustituciones equivalentes y cambios de plan, identidad y win condition.
- `node tools/check-draft-explanations.cjs`: contrato de recomendaciones completo intacto respecto a la base, límites 1/3/100 en 245 estados. El fingerprint de análisis se separa del de draft para recoger explícitamente los cambios de diagnóstico de v3.7.0 sin eliminar cobertura.
- `node tools/check-recommendation-audit.cjs` y `node tools/check-draft-strategic-fit.cjs`: auditorías deterministas y regresiones del draft.
- Suite completa de `tools/check-*.cjs`, incluidas diagnóstico, recomendaciones, bans, informe, composición, PWA y UX. Chrome instalado mediante `LTA_CHROMIUM_PATH` cuando se ejecuta localmente.
- `node tools/check-version-sync.cjs` y `git diff --check`.

Para reproducir el antes/después, usar el mismo catálogo y los casos exportados por `precisionCases(catalog)`, ejecutar el análisis en `5277bd2` y en esta rama, y comparar identidades, puntuaciones, condiciones de victoria y el pipeline. Las auditorías existentes aceptan el Composition Engine como parámetro para comparar el draft; para la cadena final ejecutar la auditoría en cada revisión. La actualización publicada usa v3.7.0 y caché v74.
