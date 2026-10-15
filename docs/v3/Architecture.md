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

El Composition Optimizer determina qué necesidad estratégica representa la mejora de mayor valor para la composición, reutilizando la prioridad ya establecida por el diagnóstico y la corrección de la v2. Devuelve una única necesidad, su motivo, el aspecto del plan que refuerza y el problema que busca evitar. No elige campeones ni roles y no genera recomendaciones visibles.

### Recommendation Layer

El Strategic Recommendation Engine traduce la necesidad del Composition Optimizer en entre dos y cuatro perfiles estratégicos ordenados, con el motivo y el aspecto del plan que mejora cada uno. El Championship Candidate Mapper transforma esos perfiles en grupos de dos a cuatro campeones candidatos por perfil, priorizados y justificados a partir de los atributos disponibles. Consume los perfiles y la necesidad ya calculados; no vuelve a analizar la composición ni aplana los candidatos en una lista sin contexto. El alcance posterior del módulo contempla propuestas para optimizar composiciones completas y propuestas de bans. Este módulo entrega recomendaciones; no sustituye el análisis de la composición.

### Report Layer

Presenta al usuario las conclusiones del análisis, la necesidad de mejora y las recomendaciones. Su responsabilidad es exclusivamente de presentación: no vuelve a analizar la composición ni recalcula decisiones estratégicas.

## 3. Flujo entre módulos

La información estratégica pasa entre los módulos en una secuencia clara:

1. **Composition Analysis** comprende la composición y produce las señales base de su estado estratégico.
2. **Optimization Layer** consume esas señales y la corrección estratégica existente para producir una única necesidad de mejora prioritaria.
3. **Recommendation Layer** convierte esa necesidad en perfiles estratégicos priorizados y los relaciona con candidatos agrupados por perfil, justificando su contribución con atributos disponibles.
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
- **Recommendation Layer** responde a la necesidad identificada con perfiles y candidatos agrupados; no reanaliza la composición desde cero ni sustituye el diagnóstico.
- **Report Layer** comunica los resultados recibidos; no vuelve a analizar la composición ni decide qué recomendación es mejor.

## 6. Principios de coherencia

- Cada módulo responde a una sola pregunta estable: qué describe la composición, qué mejora importa más, qué alternativas responden a esa mejora y cómo comunicar el resultado.
- Una misma señal estratégica se calcula una sola vez y se reutiliza en los módulos que la necesitan.
- El informe consume resultados preparados; no razona de nuevo desde la composición original.
- El flujo mantiene resultados deterministas: las mismas entradas y conclusiones producen las mismas salidas.
- Los módulos pueden evolucionar mientras respeten sus responsabilidades y las salidas que ofrecen a los demás.
