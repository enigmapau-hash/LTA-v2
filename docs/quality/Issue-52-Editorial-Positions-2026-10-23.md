# Issue #52 — Revisión editorial ligera de posiciones (23/10/2026)

## Alcance real y límites

Esta intervención sustituye el enfoque de recolección Match-V5 por un **catálogo editorial pequeño** y offline. No se recopilan estadísticas en bloque, ni se crea scraper, API, infraestructura o actualización automática. La fuente se consulta para confirmar hechos puntuales y se guardan únicamente clasificaciones humanas mínimas, enlaces de atribución y metadatos.

**No es una certificación de predominio universal.** `principal` identifica una *conclusión editorial* respaldada por siete porcentajes puntuales de la distribución de partidas del campeón por posición en LeagueOfGraphs (parche 16.21, ventana de dos días, todas las regiones, Platino+, normales y clasificatorias). No representa todos los rangos, una estimación de incertidumbre o un dataset de todas las posiciones y parches. La condición editorial es: **posición con al menos 60 % de las partidas del campeón**, o **dos posiciones con al menos 30 % cada una y una diferencia no superior a cinco puntos porcentuales**. Este criterio explica el multirrol Diana sin convertir roles secundarios en principales. En la PWA la etiqueta es «Principal · criterio editorial», no «principal estadísticamente verificado». La muestra y la licencia del agregador no permiten una certificación exhaustiva ni la importación de tablas.

**Compatibilidad**: la lista de posiciones de la League Wiki distingue `Riot` de `3P`. Se han elegido roles con marca Riot para clasificar `compatible`; esto no prueba qué porcentaje de partidas ni asegura que sea habitual en un parche. **Secundaria**: posición que la lista atribuye solo a `3P`, insuficiente para recomendación normal. **Experimental**: evidencia anterior pequeña. **Sin verificar**: hoja del Excel, ninguna prueba externa suficiente.

### Procedencia y reutilización

- [League Wiki, posiciones por campeón](https://wiki.leagueoflegends.com/en-us/List_of_champions_by_draft_position). Se usan hechos editoriales y atribución por enlace; no se importa ni transcribe la tabla ni imágenes. La Wiki es de colaboración comunitaria: «Riot» en esta página describe la procedencia de las posiciones del cliente, no que la Wiki sea una publicación oficial de Riot. Su texto puede tener licencia CC BY-SA; no se copia contenido protegido y se mantiene un enlace explícito.
- **Predominio editorial:** las páginas de LeagueOfGraphs para [Maokai](https://www.leagueofgraphs.com/en/champions/stats/maokai/support), [Aatrox](https://www.leagueofgraphs.com/en/champions/stats/aatrox/top), [K'Sante](https://www.leagueofgraphs.com/en/champions/stats/ksante/top), [Diana](https://www.leagueofgraphs.com/en/champions/stats/diana/jungle), [Aurora](https://www.leagueofgraphs.com/en/champions/stats/aurora/middle) y [Seraphine](https://www.leagueofgraphs.com/en/champions/stats/seraphine/support) muestran el corte 16.21 y la proporción de partidas por posición. Se conservan **siete hechos numéricos aislados**, atribuidos y fechados; no se descargan bases, capturas, HTML ni estadísticas masivas. Ventana de dos días; el valor en vivo puede variar tras la revisión. La página y sus datos de terceros no se presuponen reutilizables en bloque.
- **Contraste y derechos:** [OP.GG](https://op.gg/lol/champions-tier/ranked) se consulta como segunda referencia para posiciones y parche; su [Centro de Ayuda sobre uso de datos](https://help.op.gg/hc/en-us/articles/31091405109401-Can-I-use-OP-GG-data) exige atribución y alerta sobre usos comerciales sin ella y consultas excesivas. Esto **no es una licencia de redistribución de una base completa**. La PWA no consume ni descarga datos de terceros.
- La antigua muestra METAsrc para Diana TOP solo justifica **excluir** su recomendación estándar, no titular otras posiciones «principal 26.21».

### Datos revisados

**266** parejas existentes en Draft Pool.xlsx. Snapshot curado en `src/data/role-editorial-26-21.js`: **49** parejas, compuestas por 7 `principal` editorial, 37 `compatible` (Riot en Wiki), 4 `secundaria` (3P en Wiki) y 1 `experimental` (Diana TOP). **217** sin verificar. La cobertura y pertenencia a las hojas se validan mediante `tools/check-editorial-role-evidence.cjs`, que además comprueba señales de los 13 perfiles y referencias. La fecha de curación es 23/10/2026. Las entradas Wiki carecen deliberadamente de parche: no se les asigna uno ficticio.

| Campeón | TOP | JUNGLA | MID | BOTLINE | SUPPORT |
| --- | --- | --- | --- | --- | --- |
| Maokai | Secundaria (solo 3P) | Sin verificar | — | — | Principal editorial |
| Aatrox | Principal editorial | — | — | — | — |
| K'Sante | Principal editorial | — | — | — | — |
| Diana | Experimental | Principal editorial | Principal editorial | — | — |
| Aurora | Compatible (Riot) | — | Principal editorial | — | — |
| Seraphine | — | — | — | Compatible (Riot) | Principal editorial |

Datos puntuales de posición principal, capturados el 23/10/2026 (porcentaje de las partidas del **campeón**, no cuota de selección del carril):

| Campeón / rol principal | Cuota de partidas del campeón | Otra posición destacada |
| --- | ---: | --- |
| Aatrox TOP | 84,3 % | JUNGLA 11,9 % |
| K'Sante TOP | 93,6 % | MID 3,2 % |
| Maokai SUPPORT | 65,3 % | JUNGLA 19,2 %; TOP 14,8 % |
| Diana MID | 48,5 % | JUNGLA 47,7 % |
| Diana JUNGLA | 47,7 % | MID 48,5 % |
| Aurora MID | 79,5 % | TOP 16,3 % |
| Seraphine SUPPORT | 92,0 % | BOTLINE 5,8 % |

La distinción entre Diana JUNGLA/MID es explícita: ambas pueden figurar como principales editoriales (sin una relación ordenada entre ellas); cuando el desempate de contexto no basta, el informe expone ambas posiciones, sin declararla predominante por ser TOP u orden alfabético.

**Interpretación:** Aurora TOP y Seraphine BOTLINE son compatibles según la clasificación del cliente, aunque no son principales en esta muestra. Maokai TOP es secundario (14,8 %) y solo 3P. Diana MID/JUNGLA sí cumple el umbral editorial de dos posiciones comparables. Son resultados del corte descrito, no una regla intemporal.

### Comportamiento de la cadena

1. `Championship Candidate Mapper` descarta posiciones `secundaria` y `experimental` solo de sugerencias automáticas. El catálogo y la selección manual no cambian.
2. A igual coherencia, una posición `principal` o `compatible` se prefiere por evidencia a una `sin-verificar`. Si en un perfil faltan **dos campeones distintos** con posiciones revisadas, se pueden mostrar alternativas no verificadas para no vaciar el diagnóstico, pero **rotuladas como provisionales**. No se convierten en principales.
3. `alternativesByRole`, utilizada por `Strategic Composition Optimizer` y `Strategic Team Recomposer`, contiene **solo** posiciones revisadas de las dos clases admitidas. Una posición no revisada nunca justifica una sustitución automática.
4. `Candidate Evaluator` conserva la prioridad de viabilidad cuando compara el encaje contextual; una ventaja de `contextFit` no puede convertir una posición desconocida en principal. La justificación estratégica sigue supeditada a señales reales.
5. No se cambia el algoritmo de bans ni las opciones manuales. Se conserva comportamiento totalmente local.

### Puerta de calidad

`node tools/check-editorial-role-evidence.cjs` audita que los 49 pares están realmente en el Excel, no hay duplicados, la fuente/parche no se inventan, y los 13 perfiles retienen al menos dos parejas revisadas **antes de excluir campeones seleccionados y agrupar por diversidad**. Las diez composiciones de referencia se evalúan con la misma cadena sin modificar el catálogo. En la ejecución del 23/10/2026 se conservaron **2 de 2 casos con recomendaciones previamente presentes**: híbrida 5 menciones (antes 6) e incoherente 5 (antes 5); los otros ocho no tenían prioridad estratégica y no se han contado como pérdida. Esas cifras verifican continuidad mínima, no equivalencia completa de listas ni ausencia de degradación en cualquier draft. Se revisan expresamente los casos híbrido e incoherente, que antes sí ofrecían recomendaciones. Los escenarios con `no-priority` deben permanecer así sin forzar cambios.

**Límite de la cobertura:** 49/266 no significa que todos los equipos y perfiles tengan dos alternativas revisadas tras excluir picks. Por ello se mantiene el fallback provisional solo para el listado informativo, no para sustituciones. Si falla la cobertura real de los casos prioritarios o algún test de motor, **la PR no debe fusionarse** y la curación debe ampliarse antes de integrar.
