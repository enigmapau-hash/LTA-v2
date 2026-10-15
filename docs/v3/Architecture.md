# LTA v3 — Architecture

## Objetivo

Describir la organización funcional de LTA v3 y las responsabilidades de sus grandes módulos, sin definir capacidades concretas ni decisiones de implementación.

## Índice

1. [Visión general](#1-visión-general)
2. [Grandes módulos](#2-grandes-módulos)
3. [Principios arquitectónicos](#3-principios-arquitectónicos)

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

## 3. Principios arquitectónicos

- **Responsabilidad única:** cada módulo tiene un propósito definido y evita asumir las decisiones de otro.
- **Reutilización de motores existentes:** las capas consumen las conclusiones ya disponibles y evitan reconstruir análisis equivalentes.
- **Flujo determinista:** ante la misma composición y los mismos datos, las capas producen resultados consistentes.
- **Separación entre análisis y presentación:** el informe comunica resultados, pero no contiene lógica de análisis ni decisión estratégica.
- **Evitar lógica duplicada:** cada señal y decisión estratégica se determina en una sola responsabilidad y se reutiliza donde haga falta.
