# Issue #52: bloqueo de datos para posiciones principales

Fecha: 23/10/2026. Base: `6035551` (main, v3.13.2). Rama: `codex/issue-52-role-evidence`.
Encargo: https://github.com/enigmapau-hash/LTA-v2/issues/52#issuecomment-6362560309

## Decisión

Detener la implementación en el punto de decisión de datos. No se ha podido verificar una fuente reutilizable con cobertura suficiente. No se activa ningún filtro ni se modifica la PWA, la selección manual, los bans o el ranking. La issue sigue sin resolver: este informe no valida las recomendaciones actuales.

Revisados el Excel, el snapshot 26.21, Championship Candidate Mapper, Candidate Evaluator, Strategic Composition Optimizer y Strategic Team Recomposer. El mapper admite posiciones sin verificar y excluye las experimentales; sus señales textuales no acreditan la posición ni la función real en partida. El evaluador mide encaje estratégico, no evidencia estadística de posición. Ambos optimizadores consumen las alternativas por rol del mapper. Filtrar ahí propagaría la pérdida de cobertura a las dos propuestas.

## Cobertura reproducida

Ejecutar `node tools/audit-issue-52-role-coverage.cjs`. La simulación cambia solo el catálogo recibido por el mapper, en un proceso local; conserva las composiciones originales, diagnóstico y perfiles. No escribe datos ni cambia código de producción.

266 parejas: 260 sin verificar (97,74 %), cuatro habituales, una situacional y una experimental. Las seis entradas externas son solo 2,26 % del catálogo. Ninguna tiene los metadatos completos necesarios para certificar una posición principal estadística del mismo corte y con derechos comprobados. Un filtro realmente estricto con lo disponible dejaría cero parejas y cero perfiles con candidatos.

Como cota optimista se simula aceptar las cuatro «habituales» existentes, SIN considerarlas principales verificadas:

| Rol | Parejas actuales | Habituales retenidas |
| --- | ---: | ---: |
| top | 64 | 0 |
| jungle | 57 | 2 |
| mid | 59 | 1 |
| botline | 40 | 1 |
| support | 46 | 0 |

| Perfil | Parejas con señales antes | Con filtro habitual |
| --- | ---: | ---: |
| engage | 43 | 2 |
| followUp | 95 | 3 |
| pick | 66 | 0 |
| frontline | 49 | 0 |
| peel | 34 | 0 |
| disengage | 38 | 0 |
| sustainedDamage | 56 | 0 |
| frontToBack | 149 | 1 |
| sideLane | 28 | 1 |
| mapControl | 41 | 0 |
| earlyPressure | 50 | 0 |
| scaling | 127 | 2 |
| zoneControl | 22 | 0 |

Ocho de trece perfiles pierden todas sus parejas. Estos recuentos son anteriores a excluir seleccionados, agrupar multirrol, diversificar y exigir al menos dos campeones por perfil; no equivalen a recomendaciones útiles.

| Composición de referencia | Menciones antes | Simulación habitual |
| --- | ---: | ---: |
| front-to-back | 0 | 0 |
| dive | 0 | 0 |
| pick | 0 | 0 |
| poke | 0 | 0 |
| split-push | 0 | 0 |
| teamfight | 0 | 0 |
| scaling | 0 | 0 |
| early-game | 0 | 0 |
| hybrid | 6 | 0 |
| incoherent | 5 | 0 |

Antes hay alternativas en 2/10 referencias; ocho ya se abstienen con la cadena actual y no deben contarse como regresión. Después quedan 10/10 sin alternativas: dos pérdidas adicionales. Híbrida pierde peel/frontline; incoherente pierde engage/followUp. La ausencia previa en Poke, Front to Back y Teamfight no demuestra fallo: depende de que exista necesidad priorizada. No se atribuyen estas abstenciones al filtro. Para un filtro principal estricto, todas las filas posteriores serían también cero.

## Evidencia y límites de acceso

Consultas realizadas el 23/10/2026 a través del proxy configurado:

- https://opgg.gg/en/champions-tier/ranked — CONNECT 403; no se han verificado cobertura, parche, ámbito ni términos.
- https://wiki.leagueoflegends.com/en-us/List_of_champions_by_draft_position — CONNECT 403; no se han verificado licencia ni fecha. Una posición descriptiva del cliente no acredita predominio estadístico.
- https://www.metasrc.com/lol/champions/maokai/top/stats — CONNECT 403; no se pueden completar las observaciones ni comprobar derechos de reutilización.
- https://developer.riotgames.com/policies/general — CONNECT 403; la alternativa de adquisición mediante API requiere revisar sus condiciones y autorización antes de importar.

Los bloqueos son de acceso del entorno; no prueban que esas fuentes carezcan de datos o derechos. No se elude el proxy ni se importan materiales. El snapshot existente usa una constante global 26.21, pero Diana MID enlaza explícitamente `patch=26.20`; Viego usa EUW y Smolder BOT LAN, mientras otras entradas carecen de ámbito explícito. No permite comparar cuotas entre roles con denominadores homogéneos; tampoco registra cola, rango y licencia por observación.

| Parejas exigidas | Evidencia local | Conclusión para esta tarea |
| --- | --- | --- |
| Aatrox TOP, K'Sante TOP, Maokai TOP/SUPPORT | Sin verificar | No certificar principal ni secundario |
| Diana JUNGLE/MID | Habituales; MID enlaza 26.20 | No comparar como un mismo corte 26.21 |
| Aurora TOP/MID | Sin verificar | No resolver multirrol por señales estratégicas |
| Seraphine BOTLINE/SUPPORT | Sin verificar | No resolver multirrol por orden o intuición |

## Plan de adquisición y normalización

1. Habilitar acceso a las fuentes propuestas y sus condiciones, o aportar un export autorizado. Registrar licencia/permiso concreto, atribución, versión de términos y derecho a redistribuir un snapshot offline. Si solo hay posiciones de cliente, mantenerlas en un nivel descriptivo separado.
2. Obtener conteos para TODOS los roles de cada campeón dentro del mismo parche, región, cola y rango, incluidos roles ausentes del Excel, para construir el denominador. Guardar identificador Riot, partidas por rol y totales, cuota, fecha UTC de captura, procedencia y controles de integridad. Separar datos ausentes de ceros observados.
3. Normalizar jungle/bot/support a las claves internas y resolver alias/variantes del Excel mediante IDs auditados, sin convertir dos builds en dos campeones distintos. Conservar los datos brutos autorizados y una transformación reproducible.
4. Proponer para revisión, antes de activar: mínimo de muestra total y por rol; rol de mayor cuota dentro de un corte único; intervalos de incertidumbre para distinguir predominio de empate. Los empates o diferencias insuficientes deben quedar ambiguos, sin desempate alfabético. No se fijan umbrales numéricos arbitrarios sin observar la distribución de la fuente y validar su estabilidad.
5. Medir cobertura por pareja, perfil y rol; excluir campeones presentes y ejecutar las diez referencias y el caso Aurora/Elise/Corki/Miss Fortune/Lulu. Validar explícitamente las parejas de la tabla, incluida la función real de frontline. Revisar las alternativas útiles tras el mínimo de dos candidatos, no solo el porcentaje de catálogo. Si hay huecos importantes, ampliar muestra o ventana documentada sin presentar otro parche como vigente; no degradar automáticamente a roles desconocidos.
6. Solo tras superar esa revisión, implementar snapshot offline y filtro antes de evaluar, conservando selección manual. Añadir regresiones multirrol y ejecutar lifecycle PWA, offline, teclado y responsive.

## Validación de esta entrega

Aprobados: role-viability, championship-candidate-mapper, candidate-evaluator, strategic-composition-optimizer y strategic-team-recomposer. También aprobados: composition-engine, draft-strategic-fit (14 escenarios y 128 estados), draft-explanations (245 estados), diagnostic-engine y recommendation-audit. La auditoría adicional reproduce los recuentos anteriores. `git diff --check` y la comprobación de sintaxis del script pasan.

PWA y UX: primer intento bloqueado por permiso de socket local; con ejecución ampliada llegan al navegador, pero falta el ejecutable Chromium de Playwright. No se declaran comprobados lifecycle, teclado ni responsive. No hay cambios de producto que validar visualmente en esta entrega.
