# Strategic Knowledge Framework (SKF)

## Objetivo

Este documento describe cómo LTA relaciona los atributos estratégicos ya presentes en el catálogo con las identidades de composición y los perfiles de recomendación existentes. El SKF no es un motor nuevo: es la referencia de vocabulario compartido para revisar y mantener esas relaciones.

## Fuentes y alcance del conocimiento

El conocimiento procede del catálogo local incluido en el proyecto. Sus campos de identidad, función, ritmo, fortalezas y debilidades caracterizan estilos y contribuciones. Los motores existentes interpretan esos campos mediante vocabularios asociados a sus categorías actuales.

La expansión de Phase 1 añade equivalencias y matices generales en esas relaciones. No añade datos de campeones, estadísticas externas, reglas particulares por campeón ni categorías de salida nuevas. El catálogo y el Excel se mantienen intactos.

## Identidades de composición existentes

El analizador relaciona atributos del equipo con estos arquetipos ya existentes:

| Identidad | Señales que reconoce el vocabulario |
| --- | --- |
| Front to Back | Identidad declarada, frontline, peel y DPS. |
| Dive | Iniciación de entrada, dive, engage y acceso a la backline. |
| Pick | Pick, cazadas, ganks, roams, burst y control de mapa/visión. |
| Poke | Poke, desgaste y asedio. |
| Split Push | Side lane, presión lateral, duelos, objetivos y presión de mapa. |
| Teamfight | Teamfight, engage, iniciación, wombo combo y seguimiento. |
| Escalado | Ritmo late o mid/late, escalado y perfiles hypercarry/DPS. |
| Early Game | Ritmo early, tempo, dominio de línea, invasión, snowball, ganks y roams. |

Las señales siguen perteneciendo a las categorías ya existentes. Los términos añadidos como *desgaste*, *resets*, *dominio de línea*, *invasión* y *asedio* hacen explícitas relaciones semánticas presentes en los atributos, sin modificar su peso.

## Perfiles estratégicos existentes

El mapeador de candidatos conserva sus trece perfiles actuales:

| Perfil | Contribución descrita por los atributos |
| --- | --- |
| Engage | Iniciar la pelea. |
| Follow-up | Continuar una entrada aliada y aprovechar resets. |
| Pick | Crear cazadas, ganks o oportunidades de roam. |
| Frontline | Absorber presión y sostener el frente. |
| Peel | Proteger aliados mediante peel, escudos o protección. |
| Disengage | Evitar o romper una entrada rival. |
| Sustained Damage | Aportar DPS, daño sostenido o sustain. |
| Front to Back | Ejecutar una pelea ordenada con frontline, peel y daño posterior. |
| Side Lane | Aportar duelos o presión lateral. |
| Map Control | Controlar visión, objetivos y zonas del mapa. |
| Early Pressure | Aprovechar early, dominio de línea, invasión, presión y snowball. |
| Scaling | Proteger ritmos mid/late, late, escalado y carry. |
| Zone Control | Controlar zonas, visión y asedio. |

Estos perfiles son destinos estratégicos del catálogo, no una lista de campeones preferidos. El sistema sigue resolviendo el encaje con los datos y señales existentes.

## Relaciones incorporadas en Phase 1

- *Desgaste* se reconoce como una señal Poke, además de la etiqueta *Poke*.
- *Dominio de línea* e *invasión* amplían la lectura del plan Early Game y del perfil Early Pressure.
- *Mid/late* y *scaling* se reconocen como expresiones de escalado.
- *Resets* se asocia con seguimiento de una iniciación.
- *Asedio* se relaciona con control de zonas.

Las relaciones se agregan a vocabularios existentes, sin reglas para campeones nombrados y sin modificar fórmulas, pesos o umbrales.

## Criterios de mantenimiento

### Uso contextual durante el draft (v3.5.0)

El Composition Engine reutiliza las capacidades existentes para reconocer
protección ausente: Peel en Poke; Frontline y Peel en Escalado. Son relaciones
de apoyo al plan, distintas de compartir sus señales de identidad. Solo reciben
un ajuste de afinidad si el candidato conserva la dirección reconocida y añade
una capacidad que ningún compañero aporta. Una capacidad repetida no recibe
ese ajuste; Anti-frontline no equivale a frontline propia. No se crean perfiles
ni se modifica el diagnóstico de cinco picks. Véanse la
[comparación y sus límites](Draft-Strategic-Fit-Review.md).

### Reglas generales

1. Añadir una relación solo cuando describa un patrón estratégico general respaldado por atributos del catálogo.
2. Preferir equivalencias semánticas concretas frente a términos genéricos como “fuerte”, “útil” o “bueno”.
3. No usar una relación para rellenar artificialmente combinaciones perfil/rol o identidad/rol que el catálogo no respalde.
4. Mantener el vocabulario junto a las categorías existentes que lo consumen; no crear un motor paralelo.
5. Medir cobertura, diversidad, repetición, diferenciación y fidelidad de las composiciones de referencia antes y después.
6. Si una mejora requiere pesos, umbrales, datos nuevos o categorías nuevas, documentarla por separado y no presentarla como expansión de conocimiento.

## Cobertura conocida y límites

La auditoría actual cubre los ocho arquetipos y los trece perfiles en el conjunto de candidatos. La cobertura de relaciones por rol no llega al 100%: el catálogo no ofrece una relación clara de Split Push para Support ni Side Lane para Support. Esos huecos se conservan como tales; asignarles sinónimos imprecisos aumentaría la cobertura numérica sin mejorar la calidad.

El SKF describe la interpretación local del catálogo. No acredita fuerza competitiva, win rate, popularidad ni compatibilidad frente a un rival concreto. Las métricas de auditoría son reproducibles sobre los casos de referencia, pero no representan todo el espacio de composiciones.
