# Rediseño del informe estratégico — v3.12.0

## Objetivo

Hacer comprensible el informe con una lectura rápida (plan, acción, amenaza) y detalles opcionales, sin cambiar las decisiones de ningún motor, el catálogo, la prioridad de candidatos o los bans.

## Cambios visuales

- **Diagnóstico:** tarjeta completa de entrada; identidad/certeza y condición de victoria tienen dos niveles visuales distintos, con explicación contextual visible.
- **Recomendación:** se evita duplicar necesidad y perfil cuando coinciden literalmente. La primera alternativa se destaca y conserva sus datos. El resto muestra siempre campeón, rol y viabilidad, con motivos ampliables. Se conserva la justificación por candidato para quienes quieran la evidencia detallada. Las advertencias siguen disponibles.
- **Protección:** se muestran la amenaza, la acción, el riesgo propio y la contramedida. Los tres bans conservan nombre y tipo de amenaza visibles, mientras razones e impacto se consultan individualmente en detalles.
- **Responsive:** a menos de 1100 px, tarjetas apiladas en lugar de estrechas columnas. Botones y resúmenes `details/summary` accesibles por ratón y teclado, con foco visible.

## Seguridad funcional

`renderStrategicReport` sigue llamando exactamente los mismos motores, sin cambiar los parámetros. El informe consume sus objetos y solo transforma la presentación; el número y orden de candidatos, opciones manuales y bans no varía.

**El filtro de posiciones principales no está incluido**: siguen sin existir datos completos y verificables por campeón/parche para efectuarlo responsablemente. Se separará de los cambios visuales.

## Verificación

Las pruebas de dominio existentes deben seguir pasando. Las pruebas UX comprueban las tres tarjetas, orden, foco, accesibilidad de detalles y ausencia de desbordamiento entre 320 y 1280 px. La PWA prueba despliegue, actualización, funcionamiento offline y disponibilidad de todos los motivos.
