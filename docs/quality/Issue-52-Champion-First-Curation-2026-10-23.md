# Issue #52 — Segunda curación por campeón (23/10/2026)

## Qué cambia

Se han revisado **74 parejas adicionales**, sobre las 49 del corte anterior: **123/266** parejas del catálogo ahora tienen evidencia editorial y **143/266** continúan sin verificar. Este avance NO es una certificación estadística de todos los campeones.

| Estado | Antes | Propuesto |
| --- | ---: | ---: |
| Principal, criterio editorial | 7 | 12 |
| Habitual con frecuencia documentada | 0 | 9 |
| Compatible por posición Riot (League Wiki) | 37 | 95 |
| Secundaria / no normal | 4 | 6 |
| Experimental | 1 | 1 |
| Sin verificar | 217 | 143 |
| **Total** | **266** | **266** |

Las 74 nuevas parejas no incluyen Lux SUPPORT ni Jax JUNGLA, ausentes del Excel. Su predominio cuantitativo se conserva como **referencia externa**, pero nunca suma cobertura ni añade el campeón a esa posición.\n\nLa única reclasificación de la primera tanda es **Yasuo MID**: compatible → habitual, apoyada por una distribución concreta. Se incorporan más posiciones del cliente Riot *manualmente seleccionadas*, sin importar la tabla comunitaria ni construir un scraper. La inclusión en `Draft Pool.xlsx` **no** basta por sí sola como prueba; cada pareja nueva tiene referencia y fecha.

## Descarte correcto (sin exclusión indebida)

1. Agrupar por **campeón real**, no por fila: la auditoría `tools/audit-editorial-by-champion.cjs` agrupa variantes de Kayn, Varus y Shaco pero no promueve automáticamente cada variante. El informe distingue nombres originales, parejas revisadas y pendientes.
2. Una posición con cuota **≥60 % de todas las partidas del campeón** es **principal editorial** en la muestra. También se admiten **dos** posiciones principales con ≥30 % cada una y diferencia ≤5 puntos porcentuales, como Diana MID/JUNGLA en la tanda anterior.
3. Cuando una posición alcanza ≥60 %, ninguna **otra** posición puede satisfacer el mismo criterio en esa muestra; puede descartarse **su carácter de principal**, pero **no** su compatibilidad, su valor situacional o su selección manual. Este descarte aparece solo como evidencia informativa en la auditoría, **no como ban ni filtro implícito**.
4. **Habitual documentada**: entre 15 % y 60 % sin cumplir el criterio de co-principal. Se puede proponer como alternativa revisada, pero la UI no la llama principal.
5. **Secundaria cuantificada**: inferior a 15 % en las observaciones incorporadas, o **solo 3P** cuando no hay porcentajes (criterio de la primera tanda); queda excluida de las recomendaciones automáticas normales. Es una decisión editorial del corte, revisable en otro parche.
6. **Sin verificar**: ausencia de evidencia suficiente. No asumir que una posición ausente de League Wiki es inviable. Fallback provisional solo informativo; optimizadores usan posiciones revisadas.

### Observaciones cuantitativas seleccionadas, parche 16.21

Fuente de cada campeón: **LeagueOfGraphs**, `https://www.leagueofgraphs.com/en/champions/stats/{campeón}`. Consulta 23/10/2026, Platino+, todas las regiones, normales y clasificatorias, ventana móvil de dos días. Son porcentajes **entre las partidas del campeón**, no popularidad del campeón en el carril ni tasas de victoria.

| Campeón | Distribución observada relevante | Clasificación actualizada |
| --- | --- | --- |
| Brand | SUPPORT 62,2 %; MID 16,2 %; JUNGLA 5,3 % | SUPPORT principal, MID habitual, JUNGLA secundaria |
| Lux | SUPPORT 61,0 % (**fuera del Excel**); MID 32,1 % | MID habitual; predominio de SUPPORT usado solo como evidencia de descarte |
| Jax | TOP 80,4 %; JUNGLA 16,1 % (**fuera del Excel**) | TOP principal; cuota de JUNGLA conservada solo como comparación |
| Senna | SUPPORT 90,8 %; BOTLINE 7,8 % | SUPPORT principal |
| Swain | SUPPORT 61,0 %; BOTLINE 16,0 %; MID 13,7 % | SUPPORT principal, BOTLINE habitual, MID compatible Riot |
| Ashe | BOTLINE 82,5 %; SUPPORT 14,4 % | BOTLINE principal, SUPPORT compatible Riot |
| Poppy | SUPPORT 57,6 %; TOP 26,9 %; JUNGLA 14,5 % | SUPPORT habitual, TOP/JUNGLA compatibles Riot |
| Pantheon | TOP 42,6 %; SUPPORT 36,7 %; MID 11,1 % | TOP/SUPPORT habituales; MID secundaria |
| Yasuo | MID 59,8 %; TOP 22,8 %; BOTLINE 16,4 % | MID habitual; TOP/BOTLINE compatibles Riot |
| Xerath | MID 50,9 %; SUPPORT 40,5 % | Ambos habituales, ninguno principal |

**Contraejemplos al descarte simplista:** Poppy SUPPORT lidera en la muestra, pero 57,6 % no alcanza 60 %. Pantheon TOP y SUPPORT son frecuentes, pero la diferencia de 5,9 pp impide clasificarlos simultáneamente como principales según la regla vigente. Yasuo MID se queda en 59,8 %: no se redondea a 60 %.

La documentación y los porcentajes son hechos puntuales fechados; pueden variar dentro del mismo parche. No se extrae ni redistribuye la base estadística completa. **League Wiki** (https://wiki.leagueoflegends.com/en-us/List_of_champions_by_draft_position) aporta la marca Riot/3P de una selección de posiciones compatible, sin atribuirle cuotas numéricas. No se copia su tabla. Las páginas públicas de LeagueOfGraphs son fuente de consulta, **no** una licencia para republicar o extraer sus estadísticas masivamente.

## Integración y seguridad

- `role-editorial-26-21.js` conserva el snapshot offline y el detalle fuente/corte por pareja.
- `role-viability-26-21.js` admite `habitual` con evidencia numérica en las listas revisadas del mapper y de los dos optimizadores.
- `tools/check-editorial-role-evidence.cjs` comprueba cobertura, corte temporal, umbrales, Fuente, Pantheon/Yasuo/Lux/Poppy, selección actual y escenarios representativos sin rebajar la puerta de calidad.
- `tools/audit-editorial-by-champion.cjs` enumera agrupaciones, alias de builds y descartes **de posición principal** matemáticamente justificados, sin afectar runtime.
- No se han cambiado el algoritmo de bans, el Excel, las selecciones manuales ni la dependencia offline de la PWA.

## Límites y decisión de integración

**141 parejas siguen pendientes**; la reducción de filas investigables se consigue agrupando por campeón, pero no autoriza a inventar el rol de las variantes o roles ausentes de fuentes. El estado `compatible` sigue siendo reconocimiento de cliente, no garantía estadística de predominio. La cobertura por perfil medida antes de excluir picks no prueba disponibilidad universal en cualquier draft.

Exigir **GitHub Actions completamente verde** (auditoría editorial, PWA lifecycle, UX/teclado, dos optimizadores y versionado 3.13.4), revisar diferencias en los 10 casos de referencia, y comprobar que el caso Aurora TOP / Elise JUNGLA / Corki MID / Miss Fortune BOTLINE / Lulu SUPPORT no incorpore Maokai TOP.

**Mantener PR sin fusionar hasta revisión humana; issue #52 sigue abierta** por las parejas restantes.
