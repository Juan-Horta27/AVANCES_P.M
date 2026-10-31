# Observabilidad

> **Estado actual: no hay observabilidad de ningún tipo.** Sin reporte de fallos, sin analítica
> y sin banderas de funcionalidad. Es aceptable mientras la app solo corre en los teléfonos del
> equipo vía Expo Go; **deja de serlo en el momento en que se distribuya a alguien más**.

---

## Reporte de fallos

- Se integra desde el **primer build distribuido fuera del equipo**, no después.
- Herramienta prevista: **Sentry** con `sentry-expo`, que es la integración soportada del
  ecosistema y sube los mapas de símbolos automáticamente en los builds de EAS.
- Se monitorizan **usuarios libres de fallos** y **sesiones libres de fallos**; objetivo:
  99,5 % o más.
- Los builds se suben con sus *source maps* para que las trazas sean legibles: sin ellos, un
  error de JavaScript en un bundle minificado no dice nada.
- Una caída por debajo del umbral es disparador de reversión
  ([signing-and-stores.md](./signing-and-stores.md)).

### Qué NO debe llegar al reporte de fallos

La app maneja datos de salud. En el contexto de cada evento **nunca** se incluyen:

- Edad, peso ni estatura.
- El correo del usuario (solo un identificador opaco).
- El contenido de las notas de un registro, que es texto libre escrito por la persona.
- El token JWT, ni ninguna cabecera de autorización.

---

## Analítica

Se capturan los eventos del embudo principal, no todo lo que se mueve. El producto vive de una
sola métrica: **¿la gente sigue registrando?**

| Evento | Por qué importa |
|--------|-----------------|
| `cuenta_creada` | Activación |
| `primer_habito_creado` | El usuario configuró algo suyo |
| `primera_meta_creada` | El usuario se puso un objetivo |
| `registro_creado` | **La acción central del producto** |
| `racha_alcanzada` (con el número de días) | Retención: ¿las rachas funcionan como motivación? |
| `historial_consultado` | ¿Se usa la vista de progreso? |

**Propiedades permitidas:** identificador opaco de usuario, marca de tiempo, categoría del
hábito, y para `racha_alcanzada` el número de días.
**Propiedades prohibidas:** nombre del hábito (lo escribe el usuario y puede contener datos
personales), valor registrado, notas, y cualquier dato antropométrico.

Los eventos se definen **antes** de instrumentarlos, con nombre y propiedades. No se instrumenta
"por si acaso".

---

## Banderas de funcionalidad

- Las funcionalidades arriesgadas se despliegan tras una bandera, para poder apagarlas **sin
  publicar una versión nueva**. En móvil esto importa más que en web: una corrección puede tardar
  días en pasar la revisión de App Store.
- Toda bandera tiene un responsable y una fecha de retirada. Las banderas obsoletas se eliminan.
- Una bandera nueva **nace apagada** en producción hasta validarse.

**Primera candidata real:** el cambio de datos en memoria a backend real. Poder conmutar entre
la fuente simulada y el API permitiría demostrar la app aunque el servidor esté caído durante la
sustentación.

---

## Actualizaciones sobre el aire (EAS Update)

Expo permite publicar cambios de JavaScript sin pasar por la revisión de las tiendas.

- **Se usa para:** correcciones de bugs en JavaScript, ajustes de textos y de interfaz.
- **No se usa para:** cambios que requieran código nativo nuevo, ni para saltarse la revisión de
  funcionalidad de las tiendas, lo cual va contra sus políticas.
- Cada actualización queda vinculada a un canal por perfil de EAS.

---

## Señales de salud a vigilar en cada release

| Señal | Objetivo |
|-------|----------|
| Sesiones libres de fallos | 99,5 % o más |
| Tasa de ANR (Android) | Por debajo del umbral de la plataforma |
| `registro_creado` por usuario activo | Sin regresión respecto de la release anterior |
| Tasa de error del API observada por el cliente | Estable |
| Arranque en frío | Dentro del [presupuesto](../04-quality/performance-budgets.md) |

---

## Consentimiento

Antes de activar cualquier analítica en una app que maneja datos de salud, hay que:

1. Pedir consentimiento explícito al usuario.
2. Declararlo en las etiquetas de privacidad de ambas tiendas.
3. Ofrecer una forma de desactivarlo.

> Esto no es burocracia: es el motivo por el que la lista de propiedades permitidas de arriba es
> tan corta. Cuanto menos se recoge, menos hay que declarar, proteger y justificar.
