# Issue #58 — Auditoría de abstenciones y costes de corrección (23/10/2026)

## Objeto
Determinar por qué algunas composiciones muestran «Sin cambio prioritario», sin convertir todas las debilidades de un arquetipo en sustituciones obligatorias. Mantener sin cambios el catálogo, las decisiones manuales de roles, la selección del draft y los bans.

## Reproducción offline

Ejecutar:
```bash
node tools/audit-correction-decisions.cjs
node tools/check-correction-engine.cjs
node tools/check-composition-optimizer.cjs
node tools/check-recommendation-audit.cjs
```

La auditoría recorre el diagnóstico, requisitos no cubiertos, factores de corrección, prioridad, perfiles, mapeador y evaluación. Incluye **10 composiciones de referencia** y **2 composiciones reales aportadas por el usuario**.

**Resultado inicial sobre v3.13.5, antes de cambiar decisiones:**

- 8/10 fixtures: `no-priority`, con **cero requisitos obligatorios pendientes** en sus respectivos planes (Front to Back, Dive, Pick, Poke, Split Push, Teamfight, Escalado y Early Game). Sus debilidades genéricas no justifican por sí solas cambiar campeones.
- 2/10 fixtures: `prioritized` (híbrida sin peel, incoherente con brecha de iniciación/frontline).
- Ambos equipos del usuario: `prioritized`, con candidatos y roles viables. No existe un corte general en el mapeador ni en los dos ejemplos.
- La antigua condición agregada «al menos cinco de diez sin prioridad» era una **cuota artificial**, no garantía de buen análisis. Se reemplaza por pruebas por caso que acreditan requisitos cubiertos y conservan los dos controles positivos.

## Sustituciones de los equipos aportados

| Equipo | Cambio individual | Requisito que resuelve | Diagnóstico tras el cambio |
| --- | --- | --- | --- |
| Irelia / Kha'Zix / Jayce / Nilah / Ashe | Ashe SUPPORT → Swain SUPPORT | Frontline | Conserva Front to Back, **pierde peel** |
| Igual | Irelia TOP → Aatrox TOP | Frontline | Conserva Front to Back, **pierde daño sostenido** |
| Igual | Irelia TOP → K'Sante TOP | Frontline | **No conserva la identidad Front to Back** según el diagnóstico |
| Garen / Elise / Azir / Nilah / Brand | Nilah BOTLINE → Ashe BOTLINE | Peel | Conserva Front to Back y cubre el requisito, sin nueva carencia obligatoria detectada |
| Igual | Brand SUPPORT → Alistar SUPPORT | Peel | Conserva Front to Back y cubre el requisito, sin nueva carencia obligatoria detectada |

Estos resultados son **una simulación con los atributos editoriales del Excel**, no tasas reales de victoria, counters estadísticos ni una certificación competitiva. En la segunda composición **ambos cambios cumplen los requisitos en el modelo**; los datos no permiten afirmar que uno sea superior sin revisar la función que se sacrifica.

## Cambios

1. `Correction Engine` conserva su puerta de calidad (solo carencia requerida o brecha explícita), pero distingue con `reasonCode` y `consideredFactors`: necesidades cubiertas, diagnóstico indisponible, contradicción sin resolver, factor no mapeado y candidatos insuficientes.
2. El informe deja de rotular todas esas situaciones como «Sin cambio prioritario justificado». Mantiene dicha frase cuando están cubiertos los requisitos, y expresa de forma distinta las carencias no resueltas. La reducción por confianza no oculta el motivo de abstención.
3. `Candidate Evaluator` simula **una sustitución del mismo rol** para los equipos con plan claro y necesidad explícita, siempre que existan atributos completos. Prioriza, entre candidatos evaluables, aquellos que resuelven la necesidad **sin introducir otra carencia y sin perder la identidad original**. Las alternativas condicionadas siguen visibles con su coste estratégico, en vez de afirmarse que corrigen gratuitamente la composición. No atribuye certeza cuando falta evidencia.
4. No se incrementa artificialmente la cantidad de equipos que reciben propuestas. Los optimizadores siguen siendo responsables de validar sustituciones y recomposiciones completas; una alternativa contextual no garantiza mejora global.

## Pruebas y límites

- Diez fixtures tradicionales, las dos capturas del usuario y pruebas focalizadas de abstención: positivas (necesidad de frontline/peel) y negativas (requisitos ya cubiertos).
- Simulación específica de coste de Swain, Aatrox, K'Sante, Ashe y Alistar; el rol estadístico principal no puede imponerse sobre una pérdida estratégica demostrada.
- No cambia el comportamiento de los bans, picks manuales, Excel, roles editoriales ni el service worker aparte de la revisión de versión.
- La capacidad se sigue determinando mediante señales de texto del catálogo. Una etiqueta aislada puede no reflejar el efecto de juego; futuras mejoras requieren observaciones reales reproducibles, no aumentar recomendaciones por decreto.
