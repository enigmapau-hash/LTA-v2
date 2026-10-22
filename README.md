# League Team Analyzer

Analiza composiciones de League of Legends y ofrece una lectura estratégica clara para entender cómo jugarlas.

## Estado de v3

LTA v3 es la versión activa del analizador. Mantiene el análisis de composiciones, añade recomendaciones contextualizadas durante el draft y optimización del equipo completo. Las decisiones se ejecutan de forma determinista en la PWA, sin IA durante su uso.

## Evolución de v2

La v2 amplía la lectura estratégica de composiciones completas con diagnóstico, corrección prioritaria y protección explicable. En composiciones incompletas mantiene recomendaciones para los puestos vacíos. La evolución se documenta en la especificación funcional y la arquitectura de [`docs/`](docs/README.md).

## Características

- Versión visible: `v3.11.1`
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
- `src/data/`: lectura de `Draft Pool.xlsx`; `role-viability-26.21.js` aporta evidencia verificable de posiciones para el parche 26.21 sin conexión en tiempo de ejecución. Las parejas no verificadas conservan explícitamente el estado «sin verificar», nunca reciben una clasificación inventada.
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

## Fiabilidad de los roles — parche 26.21

La lista del Excel decide qué campeones pueden **introducirse manualmente** en cada rol; ningún dato externo bloquea al jugador. El recomendador separa esa elegibilidad de la **viabilidad del rol**.

- **Habitual:** evidencia de uso estable; prioridad sobre otros roles si aporta señales del perfil.
- **Situacional:** se puede recomendar con contexto y se identifica expresamente como tal.
- **Experimental:** no aparece como recomendación estándar; sigue disponible en el selector si figura en el Excel.
- **Sin verificar:** posición incluida en el Excel pero sin prueba externa suficiente. No se finge conocer su viabilidad. Si dos posiciones de un mismo campeón tienen señales y contexto idénticos sin evidencia que las distinga, no se recomienda arbitrariamente la primera del orden de roles.

La fotografía de datos es **26.21, verificada el 22/10/2026**. Incluye únicamente combinaciones con fuentes identificadas; el resto de las 266 parejas genera el estado conservador `sin-verificar`. Al salir parches posteriores, no se debe asumir que las categorías siguen vigentes sin auditoría de datos. Fuente externa en las entradas verificadas: METAsrc (muestras tempranas; consulta individual, no telemetría en directo).

Esta capa es determinista y local: la PWA no solicita datos a los sitios de estadísticas durante su uso. Los tests comprueban integridad, datos no respaldados, selección multirrol y preservación del draft manual.

## Integración de riesgos y contramedidas (v3.10.0)

`Strategic Risk Analyzer` y `Strategic Counterplay Advisor` calculan vulnerabilidades internas y respuestas posibles. Cuando existe evidencia para ambos, el informe incorpora **como máximo una pareja riesgo/contramedida** en Protección, sin repetir texto visible, añadir tarjetas ni presentar inferencias sobre un rival real. Si faltan datos, la presentación se abstiene. Los bans mantienen el flujo previo, las selecciones de draft siguen intactas y la ejecución sigue siendo offline.
