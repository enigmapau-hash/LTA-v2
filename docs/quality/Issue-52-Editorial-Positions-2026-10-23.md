# Issue #52 — Revisión editorial ligera de posiciones (23/10/2026)

## Alcance real y límites

Esta intervención sustituye el enfoque de recolección Match-V5 por un **catálogo editorial pequeño** y offline. No se recopilan estadísticas en bloque, ni se crea scraper, API, infraestructura o actualización automática. La fuente se consulta para confirmar hechos puntuales y se guardan únicamente clasificaciones humanas mínimas, enlaces de atribución y metadatos.

**No es una certificación estadística de cuota por campeón/rol.** `principal` designa aquí una *conclusión editorial de predominio* corroborada con la posición destacada de OP.GG para el parche 16.21 y la posición Riot del listado de League Wiki; no afirmamos porcentaje, umbral de muestra ni predominio demostrado con un corte uniforme de partidas. Las páginas de OP.GG muestran métricas de pick rate relativas a esa posición y no aportan por sí solas un denominador por campeón y todos sus roles. El rotulado de la PWA dice explícitamente **«Principal · criterio editorial»** y jamás «principal estadísticamente verificado». Esta limitación mantiene la cuestión de una verificación estadística exhaustiva abierta.

**Compatibilidad**: la lista de posiciones de la League Wiki distingue `Riot` de `3P`. Se han elegido roles con marca Riot para clasificar `compatible`; esto no prueba qué porcentaje de partidas ni asegura que sea habitual en un parche. **Secundaria**: posición que la lista atribuye solo a `3P`, insuficiente para recomendación normal. **Experimental**: evidencia anterior pequeña. **Sin verificar**: hoja del Excel, ninguna prueba externa suficiente.

### Procedencia y reutilización

- [League Wiki, posiciones por campeón](https://wiki.leagueoflegends.com/en-us/List_of_champions_by_draft_position). Se usan hechos editoriales y atribución por enlace; no se importa ni transcribe la tabla ni imágenes. La Wiki es de colaboración comunitaria: «Riot» en esta página describe la procedencia de las posiciones del cliente, no que la Wiki sea una publicación oficial de Riot. Su texto puede tener licencia CC BY-SA; no se copia contenido protegido y se mantiene un enlace explícito.
- [OP.GG, ejemplo Maokai](https://op.gg/lol/champions/maokai/build), [Aatrox](https://op.gg/lol/champions/aatrox/build), [K'Sante](https://op.gg/lol/champions/ksante/build), [Diana](https://op.gg/lol/champions/diana/build), [Aurora](https://op.gg/lol/champions/aurora/build), [Seraphine](https://op.gg/lol/champions/seraphine/build). Corte observado 16.21 (correspondiente a denominación de temporada 26.21); modo Solo/Duo, Global, Emerald+ en la vista de consulta. **No** se descargan o redistribuyen agregados ni se infiere que el acceso web otorgue licencia para ello. Cada entrada mantiene un enlace, no un volcado.
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

La distinción entre Diana JUNGLA/MID es explícita: ambas pueden figurar como principales editoriales (sin una relación ordenada entre ellas); cuando el desempate de contexto no basta, el informe expone ambas posiciones, sin declararla predominante por ser TOP u orden alfabético.

### Comportamiento de la cadena

1. `Championship Candidate Mapper` descarta posiciones `secundaria` y `experimental` solo de sugerencias automáticas. El catálogo y la selección manual no cambian.
2. A igual coherencia, una posición `principal` o `compatible` se prefiere por evidencia a una `sin-verificar`. Si en un perfil faltan **dos campeones distintos** con posiciones revisadas, se pueden mostrar alternativas no verificadas para no vaciar el diagnóstico, pero **rotuladas como provisionales**. No se convierten en principales.
3. `alternativesByRole`, utilizada por `Strategic Composition Optimizer` y `Strategic Team Recomposer`, contiene **solo** posiciones revisadas de las dos clases admitidas. Una posición no revisada nunca justifica una sustitución automática.
4. `Candidate Evaluator` conserva la prioridad de viabilidad cuando compara el encaje contextual; una ventaja de `contextFit` no puede convertir una posición desconocida en principal. La justificación estratégica sigue supeditada a señales reales.
5. No se cambia el algoritmo de bans ni las opciones manuales. Se conserva comportamiento totalmente local.

### Puerta de calidad

`node tools/check-editorial-role-evidence.cjs` audita que los 49 pares están realmente en el Excel, no hay duplicados, la fuente/parche no se inventan, y los 13 perfiles retienen al menos dos parejas revisadas **antes de excluir campeones seleccionados y agrupar por diversidad**. Las diez composiciones de referencia se evalúan con la misma cadena sin modificar el catálogo. Se revisan expresamente los casos híbrido e incoherente, que antes sí ofrecían recomendaciones. Los escenarios con `no-priority` deben permanecer así sin forzar cambios.

**Límite de la cobertura:** 49/266 no significa que todos los equipos y perfiles tengan dos alternativas revisadas tras excluir picks. Por ello se mantiene el fallback provisional solo para el listado informativo, no para sustituciones. Si falla la cobertura real de los casos prioritarios o algún test de motor, **la PR no debe fusionarse** y la curación debe ampliarse antes de integrar.
