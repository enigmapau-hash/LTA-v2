# Justificaciones de recomendaciones finales — v3.11.0

## Comportamiento

La recomendación final explica la carencia detectada y ofrece una justificación desplegable para cada candidato con evidencia suficiente. Expone qué atributos aporta, si contribuye a corregir una debilidad o refuerza una fortaleza existente y qué compañeros de otros roles pueden aprovecharlo. Conserva las tres tarjetas del informe.

## Evidencia y límites

`src/report/final-recommendation-explanations.js` es un adaptador de presentación que se ejecuta después de todos los motores. Recibe sus salidas sin modificarlas; no selecciona, puntúa, filtra ni reordena candidatos. Ningún motor consume las explicaciones.

- La carencia debe coincidir en diagnóstico, corrección y prioridad del optimizador.
- La contribución enlaza el mismo perfil, campeón y posición en mapper, evaluación y presentación, y comprueba las señales contra los campos que las respaldan.
- Se habla de corrección solo para el perfil directamente correspondiente a la necesidad diagnosticada. «Contribuye a corregir» expresa una orientación, no que el problema haya desaparecido.
- Se habla de refuerzo solo cuando un compañero conservado comparte una señal explícita del candidato. Una prioridad por sí sola no demuestra ausencia de esa capacidad.
- Los compañeros beneficiados se justifican con atributos explícitos del catálogo, como seguimiento que aprovecha iniciación, DPS que aprovecha frontline o presión de objetivos que complementa presión lateral. No se fijan nombres de campeones ni combos de habilidades.
- Se excluye al campeón del puesto del candidato, porque una sustitución no conservaría ambos en ese rol. Las relaciones describen oportunidades estratégicas, no ganancias medidas ni garantías competitivas.
- El rótulo indica «equipo actual»: no atribuye esos beneficios al equipo alternativo que pueda presentar la recomposición mediante otros cambios.
- Ante señales ausentes, posiciones que no coinciden o cadena incompleta se omite el nuevo texto. Una contradicción conserva el aviso original y no recibe afirmaciones positivas de corrección o beneficio.
- No cambia la clasificación de posiciones del parche 26.21 ni las elecciones manuales. Toda explicación funciona sin conexión.

## Verificación

`node tools/check-final-recommendation-explanations.cjs` fija la salida completa de la cadena de v3.10.0 (`main` b979e2a) para los diez equipos de referencia existentes. Comprueba decisiones, posiciones, orden, correcciones, optimización, recomposición, riesgos y bans. Al retirar únicamente los nuevos campos explicativos, el informe conserva su salida anterior. Incluye abstención, anti-engage, contradicción, posiciones incompatibles, conservación de compañeros y entradas inmutables.

Las pruebas existentes de UX y PWA comprueban apertura por teclado, foco visible, tamaños de 320 a 1280 px, contribución, carencia, corrección y compañeros en el informe offline. La nueva dependencia se precarga en el service worker y se incrementa la versión de caché.

Al salir de un selector puede volver a dibujarse la misma tabla. El informe se reconstruye si su nodo ha desaparecido aunque su firma de composición no cambie, de modo que las justificaciones siguen accesibles. Esta corrección afecta únicamente al ciclo de presentación.

La prueba de teclado también detectó pérdida de foco si ese redibujado deshabilitaba momentáneamente «Limpiar selección» justo después de recibir Tab. Se restaura el foco al terminar el render síncrono, sin cambiar el análisis.
