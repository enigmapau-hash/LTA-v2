# Revisión del razonamiento estratégico durante el draft

## Objetivo y alcance

Esta revisión sigue el recorrido que produce los candidatos por rol desde que se elige el primer campeón hasta el quinto. Se centra en el recomendador parcial visible y distingue ese flujo del recomendador estratégico de la composición completa. No cambia los motores, el catálogo ni el comportamiento de la aplicación.

La revisión se basa en el código de `main` que sirve de base a esta rama, las pruebas del Composition Engine y la auditoría reproducible de diez composiciones de referencia. Sus conclusiones describen el sistema y ese corpus; no pretenden medir la calidad competitiva de las recomendaciones en partidas reales.

## Recorrido actual de la decisión

### 1. Catálogo disponible

El lector de datos transforma las hojas del catálogo en listas separadas por rol. Cada ficha conserva campeón, identidad, función, ritmo, fortalezas y debilidades. El selector pasa esas listas al Composition Engine junto con las elecciones válidas que ya existen. En la aplicación, el lector intenta primero el archivo local y tiene una ruta de respaldo a una copia del workbook alojada en GitHub; la auditoría ejecutada para este documento carga el archivo local incluido en el repositorio.

### 2. Construcción del contexto parcial

Tras cada cambio válido, la interfaz vuelve a representar la composición. Si quedan roles vacíos, llama a `recommendPicks` con las piezas seleccionadas y el catálogo. El motor omite los roles ocupados y excluye campeones ya elegidos, así que cada grupo de resultados corresponde a una posición que aún se puede completar. Al estar ocupados los cinco roles, no genera candidatos de draft.

### 3. Lectura de identidad emergente

El Composition Engine puntúa ocho arquetipos con atributos del catálogo: identidad, fortalezas, función, ritmo y, en dos casos, debilidades. Las señales tienen pesos estáticos; una señal compartida por varias piezas recibe cobertura completa, una señal sostenida por una pieza recibe cobertura parcial y las sinergias declaradas pueden añadir un bono. En el draft, la identidad secundaria requiere una diferencia acotada y apoyo de varias piezas para no etiquetar una señal aislada como un plan alternativo.

Esta identidad emergente se calcula dentro del propio Composition Engine. No pasa por el Diagnostic Engine completo: ese diagnóstico exige cinco elecciones válidas y evalúa señales como contradicciones, estabilidad, coherencia de la win condition y confianza.

### 4. Evaluación de cada candidato

Para cada rol libre, el motor agrega cada candidato posible temporalmente a las piezas elegidas y vuelve a puntuar los arquetipos con cinco puestos como tamaño esperado. A partir de esas puntuaciones obtiene la dirección hipotética del equipo completo y calcula una afinidad. La afinidad combina:

- la puntuación del plan que mejor describe la composición hipotética;
- cómo queda la identidad emergente después de añadir el candidato;
- cuánto aumenta la señal del arquetipo que encabezaba el draft;
- señales estratégicas que el candidato comparte con piezas elegidas;
- continuidad con la identidad emergente;
- una bonificación por coincidencia de identidad y una penalización si cambia a una identidad incompatible con el plan emergente.

Además, mide cobertura y especificidad de señales del candidato respecto a la identidad emergente. Esas dos medidas no alteran la afinidad base: sirven para ordenar alternativas que quedan como máximo a un punto de la mejor afinidad. En ese margen estrecho prima la mayor especificidad, después la cobertura, la afinidad y un desempate alfabético. La salida expone tres candidatos por rol por defecto, etiqueta su encaje relativo y adjunta fortalezas y plan asociado.

### 5. Presentación y separación del análisis completo

La tabla visible agrupa los resultados por rol libre y muestra campeón, dirección hipotética, afinidad, fortalezas y el plan asociado sin duplicar planes iguales dentro del grupo.

Cuando el equipo está completo, el resumen estratégico sigue otra cadena: diagnóstico, corrección, prioridad de mejora, perfiles estratégicos, mapeo y evaluación de candidatos, presentación y refinamiento. Esa cadena no genera las sugerencias parciales por rol. Por tanto, las señales de diagnóstico y sus capas de confianza, estabilidad y contradicción no influyen directamente en el ranking del draft actual; solo el Composition Engine hace esa lectura parcial.

## Fortalezas actuales

- El ranking es local, determinista y reproducible; depende del catálogo por rol y no de estadísticas generales, Internet ni servicios externos.
- El candidato se evalúa por su efecto hipotético sobre el equipo, no como una lista independiente del contexto.
- Los campeones elegidos y sus posiciones se excluyen correctamente; las pruebas cubren estados de uno a cuatro picks, continuidad, cambio de dirección y determinismo.
- La selección contiene mecanismos explícitos de continuidad y diferenciación: identidad emergente, aumento marginal de señales, especificidad por arquetipo y variedad acotada entre candidatos casi empatados.
- Las ocho identidades y sus planes asociados dan una explicación legible, y el corpus de referencia conserva cobertura completa de roles vacíos.
- El sistema distingue entre afinidad relativa y orientación inicial cuando todavía no hay evidencia suficiente para confirmar una identidad.

## Limitaciones detectadas

### La lectura provisional y la evaluación hipotética usan escalas distintas

La identidad emergente se obtiene puntuando el prefijo con su longitud actual como tamaño esperado; la puntuación previa de afinidad y cada composición hipotética se puntúan con tamaño esperado cinco. Es una distinción funcional —describir lo elegido frente a estimar el equipo completado—, pero introduce dos escalas de evidencia en una misma decisión. Las pruebas validan ejemplos y límites de afinidad, no la calibración de esa transición por tamaño de draft.

### Las señales complementarias y las repetidas no están claramente separadas

La afinidad recompensa señales del arquetipo que el candidato comparte con al menos una pieza existente. Eso captura cohesión, pero no equivale a cubrir una necesidad ausente: la medida no distingue explícitamente entre completar un hueco del plan y duplicar una fortaleza ya bien representada. El catálogo contiene fortalezas y debilidades, pero no todas se incorporan al cálculo con el mismo alcance; las debilidades son señales directas solo para los arquetipos de escalado y early game.

### La identidad secundaria no guía de forma directa el ranking de draft

El análisis parcial puede producir identidad primaria y secundaria. La afinidad y la huella de especificidad se centran en el arquetipo que encabeza la lista. La secundaria puede influir indirectamente en la identidad hipotética después de sumar un candidato, pero no tiene un término de ajuste propio ni una regla explícita para conservar un híbrido útil.

### Parte de la diferenciación depende de los candidatos posibles y del desempate

Cada lista se limita a un rol, a los campeones cargados para ese rol y a tres resultados. Los candidatos fuera del vocabulario de señales de los arquetipos no aportan afinidad contextual clara. La especificidad se usa solo entre candidatos con afinidad a un punto de la máxima; fuera de esa franja, el orden refleja principalmente la afinidad. La cobertura del catálogo indica si hay señales reconocibles, no si esas señales expresan matices tácticos suficientes.

### El flujo de draft no consume las conclusiones estratégicas completas

Esto evita intentar ejecutar un diagnóstico de cinco campeones sobre un estado parcial y mantiene acotado el cálculo. A la vez, limita la transferencia de conocimiento: win condition explícita, coherencia, contradicciones, dependencias, estabilidad y confianza existen en la cadena completa pero no están disponibles para ordenar candidatos parciales. La corrección debe considerar cómo exponer solo las señales válidas para un prefijo sin fingir que ya existe un diagnóstico completo.

### Las pruebas y la auditoría cubren un subconjunto del espacio real

Las pruebas fijan ocho referencias principales y algunas composiciones especiales. La auditoría de draft genera los prefijos de uno a cuatro picks en el orden fijo de los roles de las fixtures; no cubre permutaciones de orden, secuencias de rol alternativas ni cambios aislados de atributo. La auditoría compara tres resultados por rol y métricas agregadas. No muestra qué señales concretas cambiaron el puesto de cada candidato ni evalúa equivalencia táctica, calidad en partida o comprensión del usuario.

## Conocimiento estratégico desaprovechado o usado de forma parcial

1. **Debilidades del catálogo:** salvo señales de vulnerabilidad a early o escalado, suelen quedar fuera de la afinidad de draft. Podrían ayudar a evitar completar un equipo con una exposición ya conocida, si la relación es clara y no se convierte en una penalización universal.
2. **Identidad secundaria:** está calculada durante el draft, pero su contribución al ranking no es explícita. Su valor sería conservar una composición híbrida coherente, no darle el mismo peso que a la identidad principal.
3. **Win condition y estructura de diagnóstico:** la cadena completa tiene señales más ricas, pero no puede usarse directamente en prefijos porque el diagnóstico formal requiere un equipo completo. Hay que evitar derivar win conditions firmes de evidencia parcial.
4. **Función y ritmo:** se consultan en señales concretas de arquetipos, pero la mayoría del vocabulario de identidad depende de fortalezas. Si dos candidatos comparten fortaleza genérica, función y ritmo no siempre los distinguen.
5. **Sinergia por pares:** la señal actual detecta solapamiento de atributos dentro de un arquetipo y solo una sinergia de arquetipo tiene un bono explícito. No representa relaciones generales entre piezas ni distingue por sí sola habilitadores, seguimiento y cobertura complementaria.

## Métricas disponibles y cómo leerlas

La auditoría publicada en [`Recommendation-Audit.md`](Recommendation-Audit.md) cubre 40 prefijos —diez composiciones por cuatro tamaños—, con tres candidatos en cada rol libre. En el corpus actual informa 100% de cobertura de etapa y rol, 25,3% de diversidad, 27,7% de repetición de menciones, 97,9% de alineación contextual, 82,9% de solapamiento medio cuando la identidad permanece constante, 95,4% de diferenciación para composiciones cercanas y 2,3% de órdenes guiados por señales entre pares casi empatados.

Estas cifras describen el corpus, no una calidad absoluta. La alineación compara la dirección del candidato añadido con la identidad ya reconocible; no prueba que esa identidad sea la mejor interpretación posible. El cambio entre etapas puede ser correcto o abrupto, así que se debe leer junto con continuidad y alineación. La métrica de “órdenes guiados” es baja porque solo captura inversiones del orden por huella de señales dentro de un punto de afinidad; no mide toda influencia contextual ejercida antes, en la afinidad. La auditoría tampoco identifica qué criterio movió cada recomendación. Las métricas agregadas no sustituyen revisar los casos ni medir resultados reales.

## Oportunidades compatibles con la arquitectura actual

| Prioridad | Oportunidad | Impacto esperado | Complejidad | Razón y cautela |
| --- | --- | --- | --- | --- |
| 1 | Añadir a la auditoría variantes con distintos órdenes de rol y sustituciones controladas, conservando las métricas actuales | Alto | Baja | Permite distinguir sensibilidad estratégica real de artefactos del orden fijo; no altera el producto. |
| 2 | Medir por separado cuánto aporta cohesión compartida y cuánto aporta cubrir una señal ausente | Alto | Media | Aclara si el ranking favorece redundancia o complementariedad antes de tocar pesos o fórmula. Mantenerlo primero como medición. |
| 3 | Evaluar la contribución de identidad secundaria solo cuando existe apoyo suficiente | Medio-alto | Media | Puede conservar híbridos coherentes sin desdibujar la identidad principal. Fijar casos de referencia antes de cualquier criterio nuevo. |
| 4 | Revisar cómo la afinidad transita entre prefijos y composición hipotética de cinco puestos | Medio-alto | Media | Evita saltos por comparar escalas distintas; requiere controles por tamaño y secuencias parciales. |
| 5 | Auditar cobertura y uso de función, ritmo y debilidades por arquetipo y rol | Medio | Baja | Identifica huecos de conocimiento sustentados en catálogo sin inventar categorías ni reglas de campeón. |
| 6 | Crear trazas de auditoría que expliquen el orden de cada top candidato por criterios existentes | Medio | Media | Hace los resultados explicables durante la calibración; los detalles permanecen internos y no añaden texto a la UI. |

## Recomendación priorizada para Epic 1

1. **Empezar por una matriz de validación del draft**, ampliando el corpus fijo con permutaciones y sustituciones de una pieza en estados de uno a cuatro picks. Informar identidad observada, candidatos por rol y señales que participan en el orden. Esto permite reproducir diferencias y evita una recalibración basada solo en diversidad agregada.
2. **Revisar después el equilibrio entre cohesión y cobertura de huecos.** Comparar casos donde el equipo necesita repetir una señal para ejecutar el plan con otros donde le conviene añadir una función ausente. No asumir que complementar siempre supera a compartir.
3. **Validar la identidad secundaria y la transición entre tamaños** con escenarios claros, híbridos e incoherentes y orden de selección variable. Solo después decidir si hacen falta ajustes contenidos al criterio existente.
4. **Aplicar una corrección acotada al Composition Engine**, si las mediciones anteriores muestran un patrón repetible. Conservar su API y sus ocho arquetipos; no crear un motor nuevo ni llamar al diagnóstico completo desde un estado incompleto.

La primera tarea de Epic 1 debería ser esa matriz de auditoría y revisión de casos. El material actual ya indica buena cobertura y alta alineación en fixtures, pero la combinación de escala distinta, señal secundaria no explícita y falta de permutaciones impide concluir con precisión dónde una mejora algorítmica produciría la mayor ganancia.

## Límites

- No se propone una recalibración ni se altera ningún resultado visible en esta revisión.
- No se crean motores, perfiles, categorías, dependencias ni datos de campeón.
- La revisión no incorpora datos de partidas, win rate, meta, rival ni estadísticas externas.
- El ranking no consulta esas estadísticas, aunque la carga del workbook en la aplicación conserva su ruta de respaldo remota existente.
- La Functional Specification v3 deja las recomendaciones durante el draft fuera del alcance funcional nuevo. Las sugerencias parciales aquí analizadas son comportamiento existente heredado de la aplicación; este documento no amplía ese alcance aprobado.
