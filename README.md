# League Team Analyzer

Analiza composiciones de League of Legends y ofrece una lectura estratégica clara para entender cómo jugarlas.

## Estado de v3

LTA v3 es la versión activa del analizador. Mantiene el análisis de composiciones, añade recomendaciones contextualizadas durante el draft y optimización del equipo completo. Las decisiones se ejecutan de forma determinista en la PWA, sin IA durante su uso.

## Evolución de v2

La v2 amplía la lectura estratégica de composiciones completas con diagnóstico, corrección prioritaria y protección explicable. En composiciones incompletas mantiene recomendaciones para los puestos vacíos. La evolución se documenta en la especificación funcional y la arquitectura de [`docs/`](docs/README.md).

## Características

- Versión visible: `v3.13.4`
- El informe separa la recomposición de dos campeones de las alternativas individuales; elimina afirmaciones repetidas y mantiene evidencia consultable.
- La identidad estratégica reconocida no equivale a un plan ejecutable: el diagnóstico verifica recursos necesarios y la recomendación corrige las carencias acreditadas.
- Las correcciones de equipos completos exigen una brecha de cohesión o una herramienta explícitamente requerida por el plan que falte. No se fuerzan cambios por debilidades normales del arquetipo. Protección y bans siguen funcionando aunque no se recomienden sustituciones.
- El informe resume los atributos y las conexiones con aliados en una sola explicación sin reiterar el perfil; conserva la evidencia y las advertencias de cada candidato.
- Informe estratégico con jerarquía visual renovada: diagnóstico legible, principal alternativa destacada, alternativas secundarias y bans plegables. Los diagnósticos, decisiones y advertencias siguen intactos.
- El informe distingue las limitaciones inherentes al estilo de las carencias diagnosticadas y evita afirmar que una propuesta corrigió una debilidad no comprobada.
- La sustitución individual vuelve a diagnosticar la composición propuesta antes de afirmar que conserva el plan; con evidencia insuficiente presenta la identidad como no confirmada. [Criterios](docs/v3/Single-Replacement-Identity-Validation.md).
- Las recomendaciones finales explican la carencia, la contribución de cada candidato y los compañeros beneficiados cuando existe evidencia. Distinguen corrección y refuerzo sin cambiar decisiones, rankings o posiciones. [Alcance y límites](docs/v3/Final-Recommendation-Explanations.md).
- No permite campeones repetidos.
- Muestra iconos oficiales de campeones cuando están disponibles.
- El selector, la vista rápida y el resultado se actualizan sin recargar.
- El draft reconoce protección ausente en planes de poke y escalado, conservando su dirección estratégica. [Comparación y límites](docs/quality/Draft-Strategic-Fit-Review.md).
- SheetJS se incluye localmente; Data Dragon aporta iconos opcionales cuando hay conexión.

## Estructura del proyecto

- `index.html` y los CSS de la raíz: documento y estilos de la interfaz.
- `src/ui/`: controlador de la aplicación y comportamiento de los selectores, la navegación, la vista previa y la versión.
- `src/data/`: lectura de `Draft Pool.xlsx`; `role-editorial-26-21.js` añade una curación offline de las 266 parejas del catálogo (cobertura editorial completa; no verificación estadística) con procedencia estadística, Wiki o criterio manual explícitos; roles situacionales no equivalen a recomendación normal ni a descarte; `role-viability-26-21.js` combina la clasificación con seis observaciones históricas, sin consultas de red. El estado «sin verificar» se reserva para campeones/posiciones externos al catálogo; las decisiones manuales nunca se atribuyen a fuentes estadísticas.
- `src/domain/composition-logic.js`: validación y búsquedas puras usadas por la interfaz actual.
- `src/domain/composition-engine.js`: evaluación determinista y pura de la composición con los atributos del workbook. Informa identidad principal/secundaria, condición de victoria, fortalezas, debilidades y cohesión; alimenta el análisis estratégico del informe visible.
- `src/domain/diagnostic-engine.js`: diagnóstico de composiciones completas, con plan, coherencia, robustez, dependencias y problema principal.
- `src/domain/*-engine.js`: capas estratégicas deterministas para corrección, protección, confianza, contradicción, condición de victoria, estabilidad y síntesis.
- `src/report/`: presentación de la tabla de composición y del informe estratégico construido a partir de las capas internas.
- `src/utils/`: utilidades compartidas de texto.
- `sw.js`: caché offline de los recursos de la app, incluida la librería SheetJS.
- `vendor/xlsx.full.min.js`: versión local de SheetJS para que la lectura del Excel funcione offline.
- `.github/workflows/pwa-validation.yml`: pruebas de arquetipos del motor y pruebas con Chromium para el ciclo PWA, la lógica de composición, el flujo de teclado y los tamaños responsive.
- `tools/check-composition-engine.cjs`: compara el análisis con ocho arquetipos de referencia, una composición híbrida y otra descompensada. Se ejecuta con `npm run test:composition-engine`.
- `tools/check-diagnostic-engine.cjs`: valida diagnósticos de composiciones claras, híbridas e incoherentes. Se ejecuta con `npm run test:diagnostic-engine`.
- `tools/check-composition.cjs`: compara cada selector con su hoja del Excel y comprueba duplicados, entradas inválidas y actualización en tiempo real.
- `tools/check-ux.cjs`: verifica el flujo por teclado, las etiquetas, el foco visible y el desbordamiento en 320, 375, 768 y 1280 px.
- `tools/bump-version.cjs`: sincroniza la versión y el changelog.
- `vendor/README.md` y `vendor/LICENSE.txt`: procedencia y licencia de SheetJS.

## Uso local

No hay paso de compilación ni dependencias npm necesarias. Sirve los archivos con un servidor estático desde la raíz del proyecto:

```bash
python -m http.server 8000
```

Abre `http://localhost:8000`. SheetJS está incluido en el repositorio y el service worker guarda sus archivos junto con el workbook. Tras cargar la página una vez, se pueden seleccionar campeones y generar el resultado sin conexión. Los iconos de Data Dragon son opcionales y solo aparecen cuando hay conexión.

## Despliegue

El proyecto contiene los archivos de una web estática y puede publicarse con un hosting estático, incluido GitHub Pages. La configuración de publicación depende de los ajustes del repositorio.

## Versionado de cambios

Actualiza la versión en la misma rama y PR que introduce cada cambio que se vaya a publicar:

```bash
npm run version:bump -- patch "Resumen del cambio"
```

Usa `minor` para una mejora funcional compatible y `major` para un cambio incompatible. El comando sincroniza el badge y la versión de `README.md`, `version.json`, el fallback de `src/ui/version.js`, `package.json`, `CHANGELOG.md` y la caché del service worker en `sw.js`. Ejecuta `npm run version:check` para comprobar que los números visibles y el changelog siguen sincronizados. No requiere instalar dependencias para versionar. El workflow instala Chromium de forma temporal y prueba el ciclo PWA, los cinco selectores, duplicados, entradas inválidas, actualización en tiempo real, el uso por teclado y el diseño en varios anchos; también detecta errores de JavaScript y consola.

## Fiabilidad de los roles — revisión del 23/10/2026

El Excel determina únicamente las **posiciones que el usuario puede elegir manualmente**. La recomendación automática aplica un snapshot editorial offline y mantiene separada la certeza sobre el rol:

- **Principal (criterio editorial):** predominio cualitativo contrastado con la posición destacada de OP.GG (parche 16.21) y listado Riot en League Wiki. Sin cuota homogénea ni certificación estadística.
- **Compatible:** posición recogida por Riot en el listado de League Wiki; no equivale a predominio de partidas en un parche.
- **Secundaria o experimental:** posición no admitida en propuestas automáticas normales, pero sí seleccionable manualmente cuando aparece en el Excel.
- **Sin verificar:** se mantiene como alternativa **provisional** solo cuando faltan dos opciones revisadas para ese perfil. Los dos optimizadores consumen exclusivamente alternativas revisadas.

La curación cubre **266 de 266 parejas** (12 principales editoriales basadas en evidencia cuantitativa, 104 habituales, 87 compatibles, 40 situacionales, 16 descartadas para recomendaciones automáticas, 6 secundarias y 1 experimental); quedan **0 sin clasificar dentro del Excel**. Es una **cobertura editorial**, no una verificación estadística universal. Se preservan fecha y procedencia de cada criterio sin descargar bases de terceros ni atribuir a Riot una clasificación personal. Las pruebas revisan el conjunto cerrado de parejas, perfiles y diez composiciones de referencia; se excluye Maokai TOP de sugerencias estándar y se permite SUPPORT. Diana puede justificar JUNGLA y MID sin una preferencia arbitraria.

[Primera tanda y fuentes](docs/quality/Issue-52-Editorial-Positions-2026-10-23.md) · [Cobertura editorial completa y criterios manuales](docs/quality/Issue-52-Champion-First-Curation-2026-10-23.md). La evidencia estadística exhaustiva sigue siendo una limitación, sin APIs ni actualización automática en esta versión.

## Integración de riesgos y contramedidas (v3.10.0)

`Strategic Risk Analyzer` y `Strategic Counterplay Advisor` calculan vulnerabilidades internas y respuestas posibles. Cuando existe evidencia para ambos, el informe incorpora **como máximo una pareja riesgo/contramedida** en Protección, sin repetir texto visible, añadir tarjetas ni presentar inferencias sobre un rival real. Si faltan datos, la presentación se abstiene. Los bans mantienen el flujo previo, las selecciones de draft siguen intactas y la ejecución sigue siendo offline.
