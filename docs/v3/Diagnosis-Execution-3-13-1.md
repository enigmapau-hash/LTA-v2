# LTA v3.13.1 — Diagnóstico de ejecución del plan

## Problema

V3.13.0 interpretaba un estilo detectado por similitud con el catálogo como prueba de que el equipo ya podía ejecutarlo. Solo Poke y Escalado tenían requisitos explícitos, por lo que muchas composiciones nunca recibían correcciones. Reconocer Front to Back con Aurora, Kha'Zix, Hwei, Seraphine y Brand no demuestra la existencia de frontline.

## Solución

- Se establecen **requisitos de ejecución de equipo completo** para los ocho arquetipos a partir de las señales existentes de Composition Engine: Front to Back necesita frontline, protección y daño sostenido; Dive iniciación; Pick cazadas; Poke protección; Split Push presión lateral; Teamfight iniciación; Escalado frontline y protección; Early Game presión temprana.
- Los nuevos requisitos están **separados de los requisitos del draft incompleto**, para no cambiar el orden de recomendaciones durante la selección de campeones.
- `Diagnostic Engine` expone `execution.status` y `execution.missing`; el diagnóstico visible distingue plan reconocible y recursos acreditados para llevarlo a cabo.
- `Correction Engine` utiliza las mismas carencias que ya calculó el diagnóstico; no convierte las debilidades inherentes (poca presión lateral en Front to Back, vulnerabilidad al early de Escalado) en cambios obligatorios.
- La primera alternativa muestra un rótulo provisional si su rol no está acreditado por datos externos; no se inventan roles principales.

## Casos de aceptación

1. Aurora TOP / Kha'Zix JUNGLA / Hwei MID / Seraphine BOTLINE / Brand SUPPORT: falta frontline y existe prioridad justificada, aunque Front to Back sea un plan probable.
2. Aurora TOP / Karthus JUNGLA / Hwei MID / Seraphine BOTLINE / Brand SUPPORT: Escalado requiere frontline y protege su identidad.
3. Ornn / Sejuani / Orianna / Jinx / Lulu: no se obliga a añadir presión lateral.
4. Poke con Vel'Koz sin Peel sí debe recomendar protección; con Karma ya acreditada, no debe inventar el mismo defecto.
5. Se preservan los bans y el orden del draft incompleto.

## Siguientes trabajos separados

Calidad y vigencia de las posiciones principales: requieren fuente defendible por posición y parche. Diversificación y relevancia de bans: se tratará en otra PR; no se modifica su algoritmo aquí.
