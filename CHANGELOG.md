# Changelog

## v3.13.6

### Improved
- Audita por qué la corrección se abstiene: plan ya respaldado, contradicción no resuelta, factor no mapeado o alternativas insuficientes.
- Evalúa sustituciones individuales con diagnóstico posterior del mismo rol: mantiene la identidad y señala pérdidas nuevas de frontline, peel u otros requisitos; no confunde rol estadísticamente principal con beneficio estratégico.
- Sustituye la cuota artificial de abstenciones de la auditoría por controles positivos/negativos por composición. Comprueba los dos equipos reales enviados por el usuario y mantiene picks, bans y catálogo sin cambios.


## v3.13.5

### Fixed
- Los bans usan el campeón real, no las variantes de build de Shaco, Kayn y Varus. Evitan sugerir bans contra la otra variante de un campeón aliado, sin cambiar los picks manuales ni atribuir counters no demostrados.


## v3.13.4

### Improved
- Completada la clasificación editorial offline del catálogo: 266/266 parejas; las últimas 63 decisiones manuales son 47 habituales, 14 situacionales y 2 descartadas.
- Mantiene procedencia humana separada de estadísticas, variantes de Shaco/Kayn/Varus diferenciadas, picks manuales y bans intactos.


## v3.13.3

### Improved
- Roles revisados offline: principales editoriales, compatibles y secundarios; alternativas sin verificar solo provisionales.

## v3.13.2

### Improved
- Informe más claro: motivos breves y recomposiciones independientes de las alternativas individuales, sin cambiar rankings.

## v3.13.1

### Fixed
- Distingue plan reconocido de herramientas necesarias; recupera correcciones útiles sin cambiar los rankings del draft parcial.
- Etiquetas menos concluyentes para candidatos con rol sin evidencia estadística vigente.

## v3.13.0

### Changed
- La app solo recomienda cambiar campeones ante requisitos del plan sin cubrir o brechas de cohesión comprobadas; puede abstenerse sin perder Protección.
- La priorización de bans usa los cinco picks también cuando no hay necesidad de sustituir campeones.

## v3.12.1

### Improved
- Explicaciones más claras: evidencia y conexiones entre campeones condensadas, sin frases repetidas ni cambios de decisiones.

## v3.12.0

### Added
- Rediseño del informe: plan y condición de victoria separados, alternativa principal destacada, motivos secundarios y bans desplegables.

## v3.11.2

### Fixed
- Las limitaciones propias de un estilo se muestran como oportunidades, sin afirmar carencias o correcciones no comprobadas.

## v3.11.1

### Fixed
- La sustitución individual verifica mediante diagnóstico que conserva el plan; en caso contrario evita afirmar continuidad sin pruebas.

## v3.11.0

### Added
- Justificaciones estratégicas de recomendaciones finales con evidencia y compañeros beneficiados, sin cambiar decisiones.


## v3.10.0

### Added
- Riesgo propio prioritario y contramedida correspondiente, conectados con la tarjeta de Protección cuando aportan información distinta.
- Integración sin recomputar motores ni alterar los bans existentes; abstención ante datos incompletos y sin duplicados.
- Pruebas del contrato de integración, salida del informe y visibilidad en la PWA.



## v3.9.0

Evidencia de viabilidad de roles para el parche 26.21.

### Added
- Fuentes offline auditables para posiciones verificadas; estado «sin verificar» para el resto de parejas del Excel.
- Recomendaciones con prioridad de viabilidad antes de afinidad y sin desempate implícito por TOP.
- Roles experimentales se omiten en las sugerencias automáticas, pero siguen disponibles para selección manual.
- Pruebas integrales por parejas, empate multirrol, determinismo y compatibilidad PWA.

### Notes
- La evidencia 26.21 todavía es parcial, porque el parche acaba de publicarse. No se inventan clasificadores para las 266 parejas.


## v3.8.1

### Fixed
- Recomposición limitada y validada, roles de candidatos explícitos y bans contextualizados.

## v3.8.0

### Added
- Bans contextualizados para equipos completos: tres amenazas diferenciadas basadas en Protección y el catálogo

## v3.7.2

### Fixed
- Corrección de las claves internas de roles para recuperar la recomposición y los bans estratégicos cuando procedan

## v3.7.1

### Fixed
- Jerarquía visual más clara para diagnóstico, mejora y protección, con candidatos más legibles

## v3.7.0

### Added
- Diagnósticos completos con evidencia explícita para las identidades secundarias, sin alterar el draft


## v3.6.0

### Added
- Explicaciones contextuales de los candidatos durante el draft, sin cambiar rankings ni afinidades


## v3.5.0

### Added
- Cobertura contextual de protección en el draft sin perder cohesión estratégica


## v3.4.0

### Added
- Recomendaciones de draft enriquecidas con señales de identidad estratégica
- Enriquecimiento del vocabulario estratégico y cobertura de recomendaciones


## v3.3.0

### Added
- Refinamiento de identidad y coherencia de recomendaciones durante el draft


## v3.2.0

### Added
- Recalibración contextual de las recomendaciones durante el draft

## v3.1.0

### Added
- Recalibración contextual de las recomendaciones estratégicas


## v3.0.0

### Capability 15 — Strategic Report Closing
- Cerrar el informe con una frase que explicita el estado frágil y la orientación principal ya calculada.
- Omitir el cierre en estados sólidos, de riesgo, incompletos, sin orientación clara o cuando repite contenido visible.

### Capability 14 — Strategic Report Ban Integration
- Integrar hasta dos bans prioritarios en el bloque de protección del informe, con amenaza, motivo e impacto esperado.
- Omitir la integración cuando no hay bans válidos; no se añade una sección estratégica separada.

### Capability 13 — Ban Recommendation Presenter
- Preparar una presentación compacta y determinista de los bans priorizados, ordenada por severidad e impacto ya calculados.
- Conservar campeón, amenaza, motivo e impacto como metadatos internos del informe, sin añadir un bloque visible.

### Capability 12 — Ban Prioritizer
- Priorizar hasta tres campeones del catálogo existente que potencian las amenazas estratégicas ya detectadas, con severidad, motivo e impacto esperado.
- Excluir campeones propios, evitar bans repetidos y conservar la salida como metadato interno del informe.

### Capability 11 — Strategic Counterplay Advisor
- Traducir los riesgos propios ya priorizados a estilos de amenaza generales y contramedidas breves, manteniendo severidad y foco del plan sin analizar un rival concreto.
- Conservar la salida del advisor como metadato interno del informe, sin añadir un bloque visible.

### Capability 10 — Strategic Risk Analyzer
- Priorizar los riesgos propios de la composición según la cobertura de la necesidad principal y la confirmación de una identidad común.
- Explicar la severidad y el aspecto del plan amenazado, dejando la salida como metadato interno sin añadir bloques al informe.

### Capability 9 — Strategic Team Recomposer
- Recomponer el equipo completo comparando las cinco piezas y las alternativas por rol ya evaluadas, con posibilidad de conservar o cambiar varias.
- Explicar la mejora conjunta, la debilidad prioritaria que aborda y si la identidad estratégica se conserva o queda pendiente de confirmar.

### Capability 8 — Strategic Composition Optimizer
- Proponer una versión completa revisada con una sustitución prioritaria del mismo rol, usando candidatos y señales ya evaluados y preservando la identidad cuando existe respaldo.
- Indicar cuándo la identidad de una composición inicialmente incoherente queda pendiente de confirmar, en vez de presentarla como una conclusión analizada.

### Calidad de recomendaciones
- Excluir campeones ya seleccionados y reducir alternativas redundantes, priorizando evidencia estratégica diversa.
- Ajustar el orden y la justificación de candidatos según su relación con la necesidad, el plan, la condición de victoria y los atributos existentes.

### Capability 7 — Strategic Recommendation Polisher
- Refinar la recomendación integrada en el informe para reducir duplicidades y mantener claros la necesidad, el perfil y los candidatos ya priorizados.

### Capability 6 — Strategic Recommendation Presenter Integration
- Integrar en el bloque de mejora del informe la necesidad estratégica, el perfil prioritario y hasta cuatro candidatos justificados, sin añadir una sección redundante.

### Capability 5 — Strategic Recommendation Presenter
- Preparar una presentación compacta del perfil estratégico principal y sus candidatos ya evaluados, con motivo y mejora del plan.

### Capability 4 — Candidate Evaluator
- Evaluar y priorizar los candidatos ya agrupados según los perfiles, la identidad, la condición de victoria y las contradicciones diagnosticadas; conservar fortalezas y limitaciones conocidas.

### Capability 3 — Championship Candidate Mapper
- Relacionar los perfiles estratégicos priorizados con candidatos de campeón agrupados y justificados usando los atributos existentes.

### Capability 2 — Strategic Recommendation Engine
- Añadir recomendaciones internas y ordenadas de perfiles estratégicos basadas en la necesidad prioritaria, sin seleccionar campeones ni roles.

### Capability 1 — Composition Optimizer
- Añadir una capa interna que expresa una única necesidad estratégica prioritaria a partir del diagnóstico y la corrección existentes, sin elegir campeones ni roles.

### Preparation
- Inicio del desarrollo de la versión v3.
- Preparación de la documentación de v3.


## v2.12.1

### Fixed
- Precisar la explicación de estabilidad con las piezas clave


## v2.12.0

### Added
- Mostrar un cierre estratégico breve solo cuando aporta una acción distinta


## v2.11.0

### Added
- Sintetizar el estado estratégico final como metadato interno del informe


## v2.10.0

### Added
- Añadir un matiz secundario cuando una identidad complementa claramente el plan


## v2.9.0

### Added
- Sintetizar plan, win condition, contradicciones, estabilidad y confianza en un diagnóstico compacto


## v2.8.0

### Added
- Evaluar la estabilidad de la composición ante la pérdida de una pieza


## v2.7.0

### Added
- Evaluar la coherencia entre condición de victoria e identidad


## v2.6.0

### Added
- Explicitar la condición de victoria principal y secundaria


## v2.5.0

### Added
- Detectar y diagnosticar contradicciones estratégicas internas


## v2.4.0

### Added
- Adaptar el tono del informe según la confianza estratégica


## v2.3.0

### Added
- Añadir capa interna de confianza estratégica


## v2.2.0

### Added
- Añadir explicaciones breves al informe estratégico v2


## v2.1.0

### Added
- Primera versión visible del informe estratégico v2


## v2.0.0

### Added
- Inicio de la etapa alpha de v2 con una estructura documental inicial.
- Primera versión de la Functional Specification de LTA v2.
- Primera descripción de la arquitectura funcional de LTA v2.
- Especificación funcional completa de LTA v2 preparada para revisión.
- Núcleo interno inicial del Diagnostic Engine.
- Primera capa interna de corrección estratégica basada en el diagnóstico.
- Primera capa interna de protección estratégica frente a estilos rivales.

## v1.23.0

### Added
- Reducir repetición durante la carga de campeones


## v1.22.0

### Added
- Aclarar el subtítulo de la lectura estratégica


## v1.21.0

### Added
- Simplificar el distintivo de versión


## v1.20.0

### Added
- Eliminar categoría genérica del panel de versión


## v1.19.0

### Added
- Eliminar etiqueta redundante en recomendaciones


## v1.18.0

### Added
- Reducir ruido en estados intermedios


## v1.17.0

### Added
- Aclarar mensajes de ayuda y estados vacíos


## v1.16.0

### Added
- Eliminar el marco visual redundante del informe completo


## v1.15.0

### Added
- Priorizar la composición en el estado completo


## v1.14.0

### Added
- Simplificar la vista de composición incompleta


## v1.13.0

### Added
- Compactar la lectura del informe estratégico


## v1.12.0

### Added
- Identidad propia para League Team Analyzer


## v1.11.0

### Added
- Redesign application layout to prioritize strategic analysis


## v1.10.0

### Added
- Clarify pick recommendation affinity and rationale

## v1.9.0

### Added
- Add deterministic recommendations for incomplete compositions

## v1.8.0

### Added
- Clarify counterfactual composition stability and fallback plans


## v1.7.0

### Added
- Add pick support and identity resilience insights


## v1.6.0

### Changed
- Simplify strategic report for faster reading


## v1.5.0

### Added
- Improve champion selection and replacement flow


## v1.4.0

### Added
- Integrate Composition Engine analysis into the visible report


## v1.3.0

### Added
- Motor determinista interno de análisis de composiciones y reconocimiento de arquetipos


## v1.2.6

### Fixed
- Reorganización interna de UI, datos, lógica de composición e informes


## v1.2.5

### Fixed
- Mejoras de accesibilidad, navegación por teclado y experiencia responsive


## v1.2.4

### Added
- Comprobación Chromium de las listas por rol frente a `Draft Pool.xlsx`.
- Casos reproducibles para duplicados, entradas inválidas y resultado en tiempo real.


## v1.2.3

### Fixed
- SheetJS se incluye en el repositorio y en la caché del service worker para leer el Excel sin conexión.
- Las solicitudes offline fallidas ya no reciben el HTML de la app como si fuera un recurso solicitado.

### Added
- Iconos PNG de 192 y 512 px para la instalación de la PWA.
- Prueba con Chromium para primera carga, migración desde la caché v12 y selección offline.


## v1.2.2

### Added
- Activado el service worker para que la caché offline se registre en la app.
- Actualizada la caché a v12 para propagar la versión visible a instalaciones existentes.

## v1.2.1

### Fixed
- Corregida la fuente del Excel para cargar `Draft Pool.xlsx` desde este repositorio.

## v1.2.0

### Added
- README ampliado con flujo, estructura y uso.
- Capturas de referencia añadidas al repositorio.
- Arquitectura actualizada para reflejar la base actual.

### Notes
- La base funcional se mantiene intacta.
- La versión visible avanza con cada entrega publicada.

## v1.1.8

### Fixed
- Restaurado el clic sobre las opciones del selector tras el refactor.
- Añadido `data-role` a cada opción para aplicar correctamente el campeón.

### Notes
- El selector vuelve a funcionar tanto al escribir como al elegir con clic.
- La versión visible avanza con cada entrega publicada.

## v1.1.7

### Added
- CSS consolidado en menos archivos.
- Helpers compartidos para normalización y escape de texto.
- Assets obsoletos eliminados del despliegue.
- Carga de scripts y caché más consistente.

### Notes
- Refactor interno sin cambio funcional.
- La versión visible avanza con cada entrega publicada.

## v1.1.6

### Added
- Márgenes y alineaciones refinados.
- Iconos y tarjetas más compactos.
- Responsive móvil y tablet pulido.
- Colores más consistentes.

### Notes
- El pulido visual mejora la lectura sin tocar la lógica.

## v1.1.5

### Added
- Sinergia global plegable por defecto.
- Menos ruido visual en el resultado cuando la composición ya está completa.
- Lectura rápida más clara sin perder el detalle.

## v1.1.4

### Added
- Sinergia global encima del resultado.
- Identidades resumidas por frecuencia.
- Funciones resumidas por frecuencia.
- Fortalezas y debilidades destacadas.

## v1.1.3

### Added
- Identidad en la vista rápida.
- Función en la vista rápida.
- Resumen rápido más completo sobre la tabla.

## v1.1.2

### Added
- Resumen visual compacto encima de la tabla de resultado.
- Vista rápida con estado general y chips por rol.
- Mantiene el detalle tabulado sin cambiar la lógica del Excel.

## v1.1.1

### Added
- Búsqueda inteligente en el selector.
- Coincidencias por parte del nombre.
- Acrónimos como MF, KOG o LEE.
- Ordenación mejorada de resultados.

## v1.1.0

### Added
- Selector compacto con iconos.
- Campeones duplicados ocultos en el desplegable.
- Análisis en tiempo real.
- Despliegue de Pages y caché corregidos para incluir los assets nuevos.

## v1.0.0

### Added
- Selector unificado y estable.
- Lectura directa del Excel.
- Reproducción de la pestaña **Composición**.
- Responsive para móvil, tablet y escritorio.
- Sin IA ni pasos intermedios.

### Notes
- Base cerrada de la miniapp.
- Las mejoras futuras se tratarán como nuevas versiones menores.
