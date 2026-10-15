# LTA v3 — Architecture

## Objetivo

Describir la organización funcional de LTA v3 y las responsabilidades de sus grandes módulos, sin definir capacidades concretas ni decisiones de implementación.

## Índice

1. [Visión general](#1-visión-general)
2. [Grandes módulos](#2-grandes-módulos)
3. [Flujo entre módulos](#3-flujo-entre-módulos)
4. [Reutilización desde v2](#4-reutilización-desde-v2)
5. [Responsabilidades excluidas](#5-responsabilidades-excluidas)
6. [Principios de coherencia](#6-principios-de-coherencia)

## 1. Visión general

LTA v3 evoluciona desde un analizador estratégico hacia un sistema capaz de analizar composiciones, identificar cómo optimizarlas y justificar las recomendaciones resultantes. Para mantener el razonamiento claro, organiza ese trabajo en responsabilidades separadas: análisis, optimización, recomendaciones y presentación.

Cada bloque recibe conclusiones del bloque anterior y aporta una salida con un propósito definido. La presentación comunica esas conclusiones al usuario sin asumir responsabilidades de análisis o decisión.

## 2. Grandes módulos

### Composition Analysis

Comprende la composición y describe su estado estratégico. Sus conclusiones incluyen:

- Identidad estratégica.
- Condición de victoria.
- Coherencia del plan.
- Estabilidad.
- Contradicciones.
- Confianza de las conclusiones.

### Optimization Layer

Determina qué necesidad estratégica representa la mejora de mayor valor para la composición. Define qué debe mejorar sin elegir ni proponer campeones.

### Recommendation Layer

Traduce la necesidad estratégica en alternativas concretas y justificadas. Su alcance funcional contempla candidatos por rol, propuestas para optimizar composiciones completas y propuestas de bans. Este módulo entrega recomendaciones; no sustituye el análisis de la composición.

### Report Layer

Presenta al usuario las conclusiones del análisis, la necesidad de mejora y las recomendaciones. Su responsabilidad es exclusivamente de presentación: no vuelve a analizar la composición ni recalcula decisiones estratégicas.

## 3. Flujo entre módulos

La información estratégica pasa entre los módulos en una secuencia clara:

1. **Composition Analysis** comprende la composición y produce las señales base de su estado estratégico.
2. **Optimization Layer** interpreta esas señales y determina qué necesidad de mejora aporta más valor.
3. **Recommendation Layer** convierte esa necesidad en recomendaciones concretas y justificables.
4. **Report Layer** presenta el resultado final al usuario.

Cada módulo consume las salidas que necesita de los anteriores. Ninguno vuelve a calcular una señal o decisión ya producida, salvo que sea necesario para mantener una conclusión válida.

## 4. Reutilización desde v2

La v3 evoluciona sobre el comportamiento estratégico consolidado en la v2; no parte de cero. Reutiliza funcionalmente las conclusiones y explicaciones existentes sobre:

- Identidad estratégica.
- Condición de victoria.
- Coherencia.
- Contradicciones.
- Estabilidad.
- Confianza.
- Explicaciones estratégicas.
- Estado estratégico de la composición.

Estas señales forman la base que las capas de optimización y recomendación aprovechan para proponer mejoras coherentes con la composición.

## 5. Responsabilidades excluidas

Los límites entre módulos se mantienen explícitos:

- **Composition Analysis** comprende y diagnostica la composición; no recomienda campeones ni decide cómo presentar las recomendaciones.
- **Optimization Layer** determina la necesidad estratégica prioritaria; no elige campeones ni presenta el resultado al usuario.
- **Recommendation Layer** responde a la necesidad identificada con alternativas; no reanaliza la composición desde cero ni sustituye el diagnóstico.
- **Report Layer** comunica los resultados recibidos; no vuelve a analizar la composición ni decide qué recomendación es mejor.

## 6. Principios de coherencia

- Cada módulo responde a una sola pregunta estable: qué describe la composición, qué mejora importa más, qué alternativas responden a esa mejora y cómo comunicar el resultado.
- Una misma señal estratégica se calcula una sola vez y se reutiliza en los módulos que la necesitan.
- El informe consume resultados preparados; no razona de nuevo desde la composición original.
- El flujo mantiene resultados deterministas: las mismas entradas y conclusiones producen las mismas salidas.
- Los módulos pueden evolucionar mientras respeten sus responsabilidades y las salidas que ofrecen a los demás.
