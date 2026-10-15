# LTA v3 — Functional Specification

## Objetivo

Definir la filosofía y el alcance funcional de LTA v3. Esta primera parte no especifica arquitectura ni capacidades concretas.

## Índice

1. [Resumen ejecutivo](#1-resumen-ejecutivo)
2. [Misión](#2-misión)
3. [Alcance](#3-alcance)
4. [Fuera del alcance](#4-fuera-del-alcance)
5. [Principios de diseño](#5-principios-de-diseño)

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
