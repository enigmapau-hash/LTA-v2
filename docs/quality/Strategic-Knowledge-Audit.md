# Strategic Knowledge Audit

## Objetivo y alcance

Esta auditoría revisa cómo aprovecha LTA v3 el conocimiento estratégico existente en seis áreas: diagnóstico de composición, recomendaciones durante el draft, recomendaciones finales, ranking de candidatos, bans e informe. Busca las mejoras con mayor valor perceptible y menor coste, sin cambiar el producto ni sus algoritmos.

La revisión toma como base `main` en la versión 3.1.0 y las herramientas y pruebas que contiene. No incluye cambios que estén únicamente en ramas o PR abiertas. No se han modificado motores, recomendaciones, interfaz ni versión.

## Metodología

1. Se revisaron los motores de dominio, el generador de recomendaciones, el constructor del informe, las pruebas de referencia y la auditoría reproducible de recomendaciones finales.
2. Se separaron las métricas existentes de las observaciones cualitativas. Las primeras describen el conjunto de referencia actual; no se extrapolan al catálogo completo.
3. Se contrastaron los resultados para composiciones distintas buscando coincidencias, cobertura ausente y señales calculadas que no parezcan influir en la salida.
4. Las oportunidades se ordenan por beneficio esperado para el usuario y coste estimado. Son propuestas para futuros Quality Passes; no son cambios implementados ni una recalibración aprobada.

La auditoría existente se puede regenerar con `node tools/recommendation-audit.cjs --write` y validar con `node tools/check-recommendation-audit.cjs`. La herramienta y las pruebas comprueban orden determinista, cobertura y repetición para diez composiciones de referencia.

## Análisis por módulos

### 1. Diagnóstico de composición

**Fortalezas.** El diagnóstico reutiliza la lectura de identidad y las señales de win condition, coherencia, contradicción, estabilidad y confianza. Distingue plan, cohesión, robustez, dependencias y problema estructural; sus resultados tienen casos de prueba reproducibles.

**Limitaciones y oportunidad de conocimiento.** La validación disponible usa arquetipos curados. No hay una métrica poblacional de calibración que indique con qué frecuencia composiciones cercanas cambian de diagnóstico ni si un cambio de una sola pieza produce una diferencia estratégica proporcional. La auditoría de recomendaciones informa que nueve casos de referencia se clasifican como `hybrid` y el caso incoherente como `incoherent`, incluso cuando sus identidades principales son arquetipos nítidos. Esto no prueba un defecto por sí solo, pero sí justifica revisar si la etiqueta secundaria expresa una mezcla útil o rebaja demasiado la distinción entre plan claro e híbrido.

**Mejora de alta relación valor/coste.** Añadir a una futura auditoría una matriz pequeña de variantes controladas por arquetipo y medir estabilidad del diagnóstico ante cambios de una pieza. Revisar manualmente los casos clasificados como híbridos junto a sus señales secundarias antes de cambiar cualquier regla.

### 2. Recomendaciones durante el draft

**Fortalezas.** `recommendPicks` vuelve a evaluar la composición hipotética al añadir un candidato, excluye campeones ya seleccionados y roles ocupados, y devuelve alternativas ordenadas por rol. Las pruebas cubren estados parciales de uno a cuatro campeones y determinismo.

**Limitaciones observadas.** La suite verifica coherencia de ejemplos, pero la auditoría agregada de `main` no mide cuánto cambian los candidatos cuando cambia la composición parcial. Tampoco compara estabilidad entre pasos consecutivos, cobertura por rol vacío ni similitud entre listas de contextos distintos. Por eso no hay una cifra objetiva actual para “adaptación al contexto” ni para repetición durante el draft.

**Mejora de alta relación valor/coste.** Ampliar la auditoría con un conjunto fijo de estados parciales construidos a partir de las mismas composiciones de referencia. Medir cobertura de cada rol vacío, solapamiento de candidatos entre contextos distintos y cambio de ranking al añadir una pieza. Separar variación razonable de cambios bruscos con revisión de los casos, en vez de optimizar solo por diversidad.

### 3. Recomendaciones finales

**Fortalezas.** La cadena usa identidad, win condition y necesidad estratégica para producir candidatos agrupados por perfil. La auditoría existente cuantifica cobertura, variedad, frecuencia y coincidencia entre composiciones; además conserva una comparación antes/después del Quality Pass 1.

**Resultados medidos.** En diez composiciones de referencia hubo cobertura en 10/10 casos, 56 menciones de candidatos, 31 campeones únicos y diversidad de 55,4%. La cobertura perfil/rol fue 95,0%. Dos pares de composiciones superaron el umbral de alta coincidencia: Front to Back–Híbrida compartieron los seis candidatos (Jaccard 100%) y Teamfight–Incoherente compartieron tres (50%). Frente a la línea base previa al Quality Pass 1, los pares de alta coincidencia bajaron de siete a dos y la diversidad subió de 38,6% a 55,4%; la cobertura perfil/rol bajó 0,3 puntos porcentuales.

**Limitaciones observadas.** La lista de candidatos y los pares de coincidencia miden nombres, no si dos campeones son sustitutos tácticos equivalentes ni si el orden es mejor. La repetición entre arquetipos puede ser correcta cuando comparten una necesidad. El conjunto de diez casos es demasiado pequeño para representar todas las composiciones.

**Mejora de alta relación valor/coste.** Añadir a la auditoría una comparación contextual de candidatos por necesidad y rol, distinguiendo identidad exacta de semejanza de perfil. Mantener las métricas actuales para detectar regresiones y añadir una revisión acotada de los pares que coinciden mucho, sin convertir umbrales exploratorios en una puntuación de calidad.

### 4. Ranking de candidatos

**Fortalezas.** El evaluador ordena candidatos ya producidos por adecuación a la necesidad, coherencia con win condition e identidad, señales de perfil y prioridad previa. También devuelve motivo, fortalezas y limitaciones, de forma determinista.

**Limitaciones observadas.** La prueba de auditoría de recomendaciones observa el conjunto final, pero no explica cuánto contribuye cada criterio al orden ni cuántas posiciones cambian al variar una señal. No existe una métrica de margen entre candidatos ni una evaluación independiente de la calidad semántica de los motivos. Los desempates estables ayudan a reproducir resultados, pero pueden ocultar alternativas casi equivalentes.

**Mejora de alta relación valor/coste.** Exponer en la auditoría, solo como datos internos, la estabilidad del orden ante casos de referencia y los motivos asociados a los primeros puestos. Revisar pares de candidatos con señales similares antes de añadir puntuaciones o nuevos criterios.

### 5. Recomendaciones de bans

**Fortalezas.** El priorizador deriva amenazas de riesgos existentes, excluye campeones propios y limita la salida. El presentador ordena y compacta los resultados. Las pruebas comprueban composiciones claras, híbridas e incoherentes, estados y determinismo.

**Limitaciones observadas.** La cobertura de pruebas es pequeña y no hay métricas de frecuencia, diversidad o estabilidad de bans para una colección amplia. La selección depende de vocabularios de amenazas y atributos del catálogo; un campeón puede aparecer por coincidencia de señales sin que eso pruebe que sea el ban más útil en un draft real. No se dispone de rival concreto ni de datos externos, de modo que la salida es una protección general, no una predicción de selección rival.

**Mejora de alta relación valor/coste.** Crear escenarios de auditoría coherentes con los riesgos de referencia y medir cobertura, duplicados y estabilidad del top de bans. Inspeccionar coincidencias de vocabulario con el catálogo para detectar lagunas o concentración. Mantener explícita la limitación de que esto no valida impacto competitivo contra un rival real.

### 6. Informe final

**Fortalezas.** El informe consume salidas ya calculadas, conserva un orden estratégico y presenta diagnóstico, mejora prioritaria y protección con explicaciones breves. La confianza modula el tono; las pruebas protegen estructura, textos y determinismo.

**Limitaciones observadas.** Los tests pueden detectar cambios estructurales y regresiones textuales, pero no miden comprensión, longitud percibida ni si dos bloques aportan información distinta. Tampoco existe una evaluación objetiva del vínculo entre diagnóstico y recomendación visible más allá de los contratos de dominio.

**Mejora de alta relación valor/coste.** Añadir una revisión automatizable de contenido que marque duplicados literales, repeticiones de campeones y bloques vacíos en el informe; acompañarla de una revisión humana breve de casos representativos. No usar longitud como sustituto de claridad.

## Métricas disponibles y límites

| Área | Evidencia disponible en `main` | Lo que todavía no mide |
| --- | --- | --- |
| Diagnóstico | Casos de arquetipo; coherencia, identidad y estado de salida | Calibración poblacional y sensibilidad ante variantes de una pieza |
| Draft | Pruebas de estados con 1–4 picks y determinismo | Cobertura agregada, adaptación contextual, solapamiento y estabilidad por paso |
| Recomendación final | 10 casos, cobertura 100%, diversidad 55,4%, frecuencia y coincidencias | Calidad semántica, adecuación competitiva y equivalencia táctica |
| Ranking | Orden y motivos fijados por pruebas unitarias | Margen/calibración de ranking y aporte aislado de cada criterio |
| Bans | Pruebas representativas, orden, filtrado y determinismo | Cobertura poblacional, diversidad y validación contra drafts reales |
| Informe | Contratos de salida, textos y estructura | Comprensión real, redundancia semántica y utilidad percibida |

Las métricas de recomendaciones finales proceden del informe [`Recommendation-Audit.md`](Recommendation-Audit.md). No se han generado aquí métricas ficticias para las áreas que aún no tienen un auditor agregado. En particular, los resultados del draft, bans y lectura del informe requieren nuevas mediciones antes de afirmar una mejora cuantitativa.

## Oportunidades priorizadas

Las complejidades son estimaciones relativas a la base actual; “baja” supone reutilizar los fixtures y motores existentes sin alterar el producto.

| Prioridad | Oportunidad | Impacto esperado | Complejidad | Motivo |
| --- | --- | --- | --- | --- |
| 1 | Auditar recomendaciones parciales de draft con cobertura, solapamiento entre contextos y cambio entre pasos | Alto | Baja | Es el principal vacío de medición sobre una experiencia que debe responder al contexto cambiante. |
| 2 | Auditar estabilidad del diagnóstico y revisar la etiqueta híbrida en referencias nítidas | Alto | Baja | Puede aclarar si las señales de identidad separan bien un plan dominante de una mezcla real. |
| 3 | Ampliar la auditoría final con comparación contextual por perfil/rol y revisión de pares muy similares | Alto | Media | Aprovecha métricas existentes y ayuda a distinguir diversidad nominal de valor estratégico diferente. |
| 4 | Auditar cobertura, repetición y estabilidad de bans con escenarios de riesgo representativos | Medio | Baja | Permite descubrir sesgos de vocabulario y concentración sin cambiar la lógica. |
| 5 | Revisar el ranking mediante estabilidad de puestos y explicación de los primeros candidatos | Medio | Media | Aclara qué señales separan candidatos cercanos sin crear una nueva puntuación visible. |
| 6 | Revisar redundancia entre bloques del informe con detección simple y evaluación humana | Medio | Baja | Completa los tests de estructura con una comprobación de contenido, sin rediseñar el informe. |

## Roadmap recomendado para próximos Quality Passes

1. **Draft Context Audit:** medir cobertura y sensibilidad contextual en los estados de uno a cuatro campeones, con comparaciones entre composiciones y entre pasos consecutivos.
2. **Diagnostic Calibration Review:** investigar las referencias etiquetadas como híbridas y medir cómo cambia el diagnóstico al reemplazar una pieza, antes de tocar reglas.
3. **Final Recommendation Similarity Review:** enriquecer la auditoría existente con similitud estratégica por perfil/rol y revisión de los pares de coincidencia alta.
4. **Ban Coverage Audit:** añadir un conjunto reproducible de casos derivados de los riesgos existentes y medir cobertura, repetición y estabilidad.
5. **Candidate Ranking Review:** comprobar estabilidad del orden y suficiencia de los motivos para candidatos cercanos.
6. **Report Content Review:** complementar las pruebas estructurales con comprobaciones de redundancia y una lectura humana de referencias completas e incompletas.

Este roadmap prioriza primero obtener evidencia objetiva donde hoy falta y después revisar las áreas que ya disponen de mediciones. Ninguna de estas prioridades autoriza por sí misma a recalibrar algoritmos; cualquier cambio funcional deberá justificarse con resultados reproducibles y una PR propia.
