# Precisión de afirmaciones estratégicas — v3.11.2

## Defecto observado

El diagnóstico trasladaba una limitación inherente al arquetipo (p. ej. «Poca presión lateral» en Front to Back) al informe como «Carencia detectada». La propuesta además decía «Corrige: ...» sin verificar que esa limitación desapareciera. Un estilo puede renunciar deliberadamente a una herramienta para destacar en otra.

## Cambio acotado

- Los motores de diagnóstico, mapeo, evaluación, prioridades, bans y optimización siguen idénticos. Solo cambia la interpretación textual de las señales recibidas.
- Una necesidad procedente de `cohesion-gap` puede mostrarse como carencia cuando diagnóstico y corrección coinciden.
- Una limitación `identity-risk` solo se comunica como **oportunidad de refuerzo** y **contrapartida del estilo**, nunca como carencia demostrada.
- La afirmación «Contribuye a corregir» no se presenta cuando solo existe una limitación inherente al arquetipo. La evidencia positiva y las relaciones con aliados permanecen.
- Las propuestas hablan de «Objetivo del cambio», «Limitación abordada» o «Busca reforzar», sin prometer que se ha corregido un problema.
- Conserva los picks manuales, el catálogo, los rankings, posiciones, y PWA offline.

## Pendiente para el rediseño

No se implementa aún la restricción a roles principales: `Draft Pool.xlsx` acredita solo elegibilidad manual, y la viabilidad de 260 de 266 pares sigue sin verificación por parche. Se ha localizado un agregado público Match-v5 de 30.000 partidas, pero pertenece al parche 16.16, no acredita el rol principal del 26.21 ni proporciona por sí solo permiso expreso de reutilización. No se importará ni se inventarán roles.

La revisión de redacción y rediseño de Diagnóstico, Recomendación y Protección se hará en PRs independientes, respetando su jerarquía y UX responsive.

## Pruebas

La regresión previa de todas las decisiones mantiene su hash al no modificar motores. Tests de explicación, texto de oportunidad, ausencia de falsa corrección, UX y PWA offline.
