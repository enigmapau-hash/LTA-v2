# LTA v3 — Functional Specification

## Objetivo

Definir la filosofía y el alcance funcional de LTA v3. Esta primera parte no especifica arquitectura ni capacidades concretas.

## Índice

1. [Resumen ejecutivo](#1-resumen-ejecutivo)
2. [Misión](#2-misión)
3. [Alcance](#3-alcance)
4. [Fuera del alcance](#4-fuera-del-alcance)
5. [Principios de diseño](#5-principios-de-diseño)
6. [Flujo de razonamiento](#6-flujo-de-razonamiento)
7. [Información analizada](#7-información-analizada)
8. [Información generada](#8-información-generada)
9. [Filosofía de las recomendaciones](#9-filosofía-de-las-recomendaciones)
10. [Principios del informe](#10-principios-del-informe)

## 1. Resumen ejecutivo

La v3 evoluciona LTA desde un analizador estratégico de composiciones hacia un asesor que ayuda a optimizarlas. Su propósito es ayudar al usuario a construir una mejor versión de su composición y a entender las consecuencias estratégicas de las decisiones, manteniendo un informe breve y la sencillez del producto.

La v2 permanece como referencia estable. Esta especificación define la filosofía y los límites del producto antes de concretar su evolución funcional.

## 2. Misión

Ayudar al usuario a construir la mejor versión posible de una composición explicando las consecuencias estratégicas de cada decisión.

## 3. Alcance

LTA v3 orientará la optimización de composiciones completas. La evolución del producto se centrará en:

- Hacer que el informe estratégico ayude a valorar cómo mejorar una composición.
- Mejorar el sistema de recomendaciones para que contribuya a la composición como conjunto.
- Explicar las consecuencias estratégicas de las decisiones y el razonamiento que las sustenta.
- Mantener una lectura breve, clara y centrada en lo útil para el usuario.

## 4. Fuera del alcance

La v3 no incluye:

- Champion Select en tiempo real.
- Adaptación dinámica pick a pick.
- Recomendaciones durante el draft.
- Análisis del rival durante la selección de campeones.

## 5. Principios de diseño

### Optimización estratégica

> La mejor composición no es la más equilibrada, sino la que ejecuta su plan con el menor número posible de debilidades evitables.

### Conservación del plan

> LTA preserva la identidad estratégica siempre que sea viable.

### Explicación antes que recomendación

> El usuario debe entender el problema antes de conocer las posibles soluciones.

### Optimización de composiciones

> LTA optimiza composiciones; no recomienda campeones de forma aislada.

## 6. Flujo de razonamiento

LTA v3 seguirá un proceso lógico orientado a mejorar la composición como conjunto:

1. Analiza la composición.
2. Comprende su identidad y el plan que intenta ejecutar.
3. Detecta sus fortalezas y debilidades estratégicas.
4. Explica el estado estratégico de la composición.
5. Identifica la mejora que tendría mayor impacto.
6. Propone las mejores alternativas disponibles para esa mejora.
7. Justifica cada recomendación y sus consecuencias estratégicas.

La prioridad de mejora se expresa primero como una única necesidad estratégica. Esta etapa no selecciona campeones ni roles y no genera recomendaciones visibles.

## 7. Información analizada

LTA analizará la composición y las señales estratégicas aprobadas para entender cómo funciona como equipo:

- Identidad estratégica.
- Condición de victoria.
- Coherencia del plan.
- Estabilidad de la composición.
- Contradicciones estratégicas.
- Fortalezas y debilidades.
- Amenazas estratégicas.
- Confianza de las conclusiones.

## 8. Información generada

Según la composición y las conclusiones que resulten útiles, LTA podrá generar:

- Un informe estratégico que explique el estado de la composición.
- Una necesidad estratégica prioritaria que indique qué aspecto del plan conviene reforzar y qué problema busca evitar.
- Perfiles estratégicos compatibles y ordenados que respondan a esa necesidad, seguidos de candidatos agrupados por perfil.
- Candidatos priorizados dentro de cada perfil según su ajuste a la necesidad, la identidad, la condición de victoria y las señales de contradicción ya disponibles.
- La lista evita campeones que ya estén seleccionados y reduce alternativas redundantes, favoreciendo candidatos con señales estratégicas distintas cuando respaldan igual de bien el perfil.
- La prioridad y la justificación de cada candidato consideran conjuntamente su relación con el plan, la condición de victoria, las contradicciones y la evidencia de sus atributos disponibles.
- Para cada candidato, el motivo principal, las fortalezas que aporta y las limitaciones conocidas en sus atributos. La recomendación principal se integra en el bloque de mejora del informe, sin constituir un análisis de draft.
- Una presentación compacta que destaque el perfil estratégico principal y sus candidatos priorizados, con el motivo y el aspecto del plan que refuerza.
- La recomendación principal integrada en el bloque de mejora del informe: necesidad estratégica, perfil prioritario y hasta cuatro candidatos con motivo, fortalezas relevantes y limitaciones conocidas cuando aporten valor.
- Una versión refinada de esa presentación que reduce repeticiones evidentes y conserva la necesidad, el perfil y los candidatos útiles ya priorizados, sin crear recomendaciones nuevas.
- Recomendaciones para mejorarla y candidatos por rol cuando corresponda.
- Una propuesta de optimización que identifica una sustitución prioritaria del mismo rol para reforzar la necesidad estratégica.
- Una recomposición estratégica del equipo completo que valora la aportación conjunta de las cinco piezas y puede conservar o sustituir varias. Explica la identidad resultante, la mejora global y la debilidad que corrige. Mantiene la identidad del plan cuando los candidatos disponibles la respaldan; si la composición no tiene una identidad clara, deja la identidad propuesta pendiente de confirmar mediante un análisis completo.
- Una evaluación priorizada de los riesgos propios de la composición, indicando su severidad, qué parte del plan amenazan y por qué. Solo se muestran riesgos respaldados por señales estratégicas existentes; no identifican un rival ni proponen bans.
- Una traducción de esos riesgos propios a estilos de amenaza y contramedidas estratégicas generales, priorizadas y explicables. La orientación describe patrones posibles; no analiza una composición rival concreta ni propone bans.
- Una lista breve y priorizada de campeones del catálogo disponible que potencian las amenazas detectadas, con la severidad, el motivo y el impacto estratégico esperado de cada ban. No simula una selección rival completa.
- Una presentación compacta de los bans priorizados que conserva el orden por severidad e impacto, con el campeón, la amenaza, el motivo y el efecto esperado. Reutiliza los bans calculados y no vuelve a analizar la composición; su salida se prepara para el informe sin añadir todavía un bloque visible.
- Cuando aporta valor, el informe incorpora hasta dos de esos bans dentro del bloque de protección, indicando qué amenaza castigan, por qué importan y el impacto esperado si se banean. No crea una sección independiente ni muestra contenido si no hay bans utilizables.
- Advertencias sobre riesgos o debilidades estratégicas.
- Propuestas de bans como orientación estratégica.

Estas salidas deben ayudar a entender y mejorar la composición sin convertir el informe en una lista extensa. Las propuestas de bans no implican análisis del rival durante la selección de campeones ni recomendaciones en tiempo real durante el draft.

## 9. Filosofía de las recomendaciones

- LTA explica el problema antes de recomendar una solución.
- Las recomendaciones buscan mejorar el plan existente siempre que sea viable.
- Solo propone cambios cuando aportan un beneficio estratégico claro.
- No intenta maximizar estadísticas aisladas ni recomendar campeones fuera del contexto de la composición.

## 10. Principios del informe

El informe estratégico debe ser:

- Breve.
- Comprensible.
- Útil para decidir cómo mejorar la composición.
- Justificable a partir de la información analizada.
- Determinista.
- Libre de puntuaciones y probabilidades visibles.
