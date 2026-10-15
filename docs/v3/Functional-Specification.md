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
- Recomendaciones para mejorarla y candidatos por rol cuando corresponda.
- Una propuesta de optimización para una composición completa.
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
