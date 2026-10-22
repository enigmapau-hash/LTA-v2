# Validación del plan tras una sustitución individual — v3.11.1

## Problema

Hasta v3.11.0, el optimizador individual atribuía conservación de la identidad al equipo propuesto basándose en el ajuste del **candidato** a la identidad principal. La afinidad individual no prueba que el **conjunto de cinco piezas** conserve su plan.

## Corrección acotada

- Se mantiene exactamente la selección de perfil, puesto más débil, candidato, orden, rol y composición propuesta.
- Se reconstruyen los cinco picks con los atributos existentes, sustituyendo solo la pieza propuesta. Se invoca el mismo `Diagnostic Engine` que usa el análisis del equipo y el recompositor.
- `identity.status = "preserved"` únicamente si el nuevo diagnóstico es válido, presenta un plan claro y su identidad principal coincide con la original.
- Si no hay identidad inicial o faltan datos completos, no se confunde la etiqueta del candidato con la identidad del nuevo equipo: `unconfirmed`, sin proponer una identidad global especulativa.
- Si el nuevo diagnóstico no confirma el plan original, el informe advierte que no se puede confirmar su continuidad. La **existencia** de una alternativa sigue siendo una sugerencia, no una garantía de mejora.
- No se cambia ningún motor de ranking, el catálogo, el draft, la recomposición multipieza, los bans ni los selects manuales. La PWA continúa offline.

## Pruebas

`tools/check-strategic-composition-optimizer.cjs` comprueba conservación respaldada con cinco fichas completas, discrepancia de identidad pese a una valoración favorable del candidato, atributos insuficientes, plan original inexistente, rol canónico, abstención por composición incompleta y determinismo.

`tools/check-final-recommendation-explanations.cjs` mantiene el contrato de decisiones de v3.11.0, normalizando **solo** las afirmaciones históricas de identidad y explicación del optimizador individual para conservar la línea base. También comprueba con el diagnóstico real cada identidad declarada conservada.

GitHub Actions ejecuta además la suite de dominio, UX y PWA offline.
