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

El Strategic Recommendation Engine traduce la necesidad del Composition Optimizer en entre dos y cuatro perfiles estratégicos ordenados, con el motivo y el aspecto del plan que mejora cada uno. El Championship Candidate Mapper transforma esos perfiles en grupos de candidatos por perfil, excluye las piezas ya seleccionadas y favorece alternativas respaldadas por atributos relevantes y con aportes menos redundantes. Mantiene además una reserva interna acotada por rol para valorar mejoras sin ampliar la lista principal presentada. El Candidate Evaluator refina la prioridad con la relación con la necesidad, la identidad, la condición de victoria, las contradicciones y las señales de atributos disponibles; justifica el aporte de cada alternativa y conserva sus fortalezas y limitaciones conocidas. El Strategic Recommendation Presenter selecciona el perfil principal y prepara sus candidatos evaluados en una salida compacta, con la justificación y el aspecto del plan que mejora.

El Strategic Composition Optimizer usa esa cadena para proponer una sustitución prioritaria del mismo rol. El Strategic Team Recomposer compara las piezas actuales con las alternativas evaluadas por rol y busca una composición conjunta que respalde mejor el perfil prioritario y las alternativas compatibles. Puede conservar o cambiar varias piezas, mantiene campeones y roles únicos y explica la mejora y la limitación abordada. Conserva la identidad existente cuando los candidatos elegidos están alineados; si el diagnóstico no confirma una identidad, la señala como pendiente, sin ejecutar un nuevo análisis. Ambos optimizadores reutilizan señales transportadas por las capas anteriores y no consultan directamente los datos de origen. El alcance posterior del módulo contempla propuestas de bans. Este módulo entrega recomendaciones; no sustituye el análisis de la composición.

### Strategic Risk Analysis

El Strategic Risk Analyzer consume la necesidad prioritaria, la cobertura de sus perfiles en las piezas actuales y el estado de identidad que ya produce la recomposición. Prioriza riesgos de falta de respaldo para el plan, dependencia de una única pieza y falta de identidad confirmada. Cada riesgo expresa severidad, la parte del plan amenazada y una explicación breve. La capa se abstiene cuando la composición está incompleta o no hay señales suficientes; no evalúa rivales ni propone bans.

### Strategic Counterplay Advice

El Strategic Counterplay Advisor transforma los riesgos ya priorizados en estilos de amenaza generales y contramedidas breves. Mantiene la severidad y el aspecto del plan amenazado que recibió del Strategic Risk Analyzer. No vuelve a evaluar la composición ni atribuye picks o intenciones a un rival concreto; tampoco propone bans.

### Report Layer

El Strategic Recommendation Presenter Integration adapta la salida compacta ya preparada por Recommendation Layer al bloque de mejora del informe. El Strategic Recommendation Polisher recibe esa integración y las salidas previas de optimización, perfiles, mapeo, evaluación y presentación; elimina duplicidades de texto o candidatos y normaliza la concisión, conservando orden y prioridad. No genera alternativas ni recalcula señales. El informe muestra la necesidad, el perfil principal y hasta cuatro candidatos priorizados con su motivo, fortalezas relevantes y limitaciones útiles. Ocupa el bloque de mejora existente para evitar duplicar la prioridad estratégica. El Report Layer presenta las conclusiones; no vuelve a analizar la composición ni recalcula decisiones estratégicas.

## 3. Flujo entre módulos

La información estratégica pasa entre los módulos en una secuencia clara:

1. **Composition Analysis** comprende la composición y produce las señales base de su estado estratégico.
2. **Optimization Layer** consume esas señales y la corrección estratégica existente para producir una única necesidad de mejora prioritaria.
3. **Recommendation Layer** convierte esa necesidad en perfiles estratégicos, agrupa candidatos por perfil, los evalúa con las señales existentes y prepara una presentación compacta del perfil principal.
4. **Strategic Recommendation Presenter Integration** adapta la salida del Presenter al bloque de mejora; **Strategic Recommendation Polisher** quita repeticiones evidentes de esa salida sin alterar su decisión ni su orden.
5. **Strategic Composition Optimizer** consume la cadena ya preparada y propone una sustitución prioritaria del mismo rol cuando existe una mejora respaldada.
6. **Strategic Team Recomposer** consume las alternativas evaluadas por rol y su evidencia para seleccionar conjuntamente las cinco piezas del equipo revisado; puede proponer varios cambios y conserva la identidad cuando está respaldada.
7. **Strategic Risk Analyzer** reutiliza las salidas de optimización, recomendación y recomposición para priorizar las vulnerabilidades propias de la composición, sin volver a calcular el análisis base.
8. **Strategic Counterplay Advisor** convierte los riesgos priorizados en estilos de amenaza y pautas generales de protección, sin inferir una composición rival.
9. **Report Layer** muestra la recomendación y, cuando existe una propuesta de recomposición respaldada, la integra en el bloque de mejora existente junto con el diagnóstico y la protección. Conserva los riesgos y la contramedida como metadatos internos hasta que una integración visible aporte valor sin duplicar el informe.

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
- **Recommendation Layer** responde a la necesidad identificada con perfiles y candidatos evaluados y prepara su presentación compacta; no vuelve a generar candidatos, reanaliza la composición desde cero ni sustituye el diagnóstico.
- **Strategic Recommendation Presenter Integration** adapta la presentación preparada al formato del informe; no decide prioridades ni recalcula el análisis.
- **Strategic Recommendation Polisher** refina concisión y duplicidades visibles; no cambia prioridades, candidatos ni conclusiones.
- **Strategic Composition Optimizer** propone una sustitución con la misma prioridad estratégica y el mismo rol; no vuelve a ejecutar el análisis base ni afirma una identidad de equipo no confirmada por las señales disponibles.
- **Strategic Team Recomposer** compara alternativas por rol para valorar el equipo como conjunto; no vuelve a analizar la composición, consulta el origen de datos ni presenta una identidad no confirmada como un hecho.
- **Strategic Risk Analyzer** prioriza vulnerabilidades de la composición con señales ya calculadas; no ejecuta el diagnóstico, no atribuye intenciones a un rival y no formula bans.
- **Strategic Counterplay Advisor** traduce vulnerabilidades existentes a amenazas generales y contramedidas; no diagnostica riesgos nuevos, analiza un rival concreto ni formula bans.
- **Report Layer** comunica los resultados recibidos; no vuelve a analizar la composición ni decide qué recomendación es mejor.

## 6. Principios de coherencia

- Cada módulo responde a una sola pregunta estable: qué describe la composición, qué mejora importa más, qué alternativas responden a esa mejora y cómo comunicar el resultado.
- Una misma señal estratégica se calcula una sola vez y se reutiliza en los módulos que la necesitan.
- El informe consume resultados preparados; no razona de nuevo desde la composición original.
- El flujo mantiene resultados deterministas: las mismas entradas y conclusiones producen las mismas salidas.
- Los módulos pueden evolucionar mientras respeten sus responsabilidades y las salidas que ofrecen a los demás.
