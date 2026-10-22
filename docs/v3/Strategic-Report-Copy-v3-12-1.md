# Redacción del informe estratégico — v3.12.1

## Objetivo
Reducir repeticiones en el informe tras el rediseño v3.12.0. No cambia ningún cálculo ni la estructura del diagnóstico; se modifica únicamente la prosa presentada.

## Cambios
- El motivo de candidato permanece como explicación contextual; el desplegable muestra **señales del catálogo** en vez de reiterar «Aporta ... acorde con el perfil ...».
- Se conserva la lista completa de evidencias por compañero y su rol en la estructura de datos; la UI ofrece un único resumen de **conexiones con el equipo** con campeón y señal explícita, evitando repetir la misma frase por cada aliado. Sin señales, no se inventan conexiones.
- Se mantiene visible el aviso por contradicciones o limitaciones; las propuestas no pasan a considerarse mejoras verificadas solo por cambiar el texto.
- Las descripciones formadas con una plantilla conocida de recomendación se abrevian en pantalla para no repetir la necesidad y la identidad ya mostradas en la cabecera. Los textos que no siguen esa plantilla se conservan intactos.
- En Protección se elimina la fórmula repetitiva «Es la amenaza prioritaria porque» sin perder su causa. «Refuerza» como rótulo duplicado se sustituye por «Para qué sirve».
- Se corrige la secuencia gramatical «a el» en la presentación, sin alterar los motivos almacenados.

## No cambia
Ninguna salida de los motores de draft, diagnóstico, prioridad, ranking, roles, sustituciones, bans o selección manual. La PWA offline conserva todos los datos, incluidos los de explicación.

## Verificación
La prueba de las diez composiciones de referencia conserva el hash histórico de decisiones. Comprueba que cada compañero citado mantiene su atributo de procedencia y que un resumen con varios aliados es más breve que la repetición previa. UX y PWA verifican los textos visibles.
