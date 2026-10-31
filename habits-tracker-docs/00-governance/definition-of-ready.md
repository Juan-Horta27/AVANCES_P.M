# Definición de Listo (DoR)

Una historia de usuario puede entrar a un sprint **solo cuando todo esto es cierto**:

- [ ] El valor de usuario está escrito (Como / Quiero / Para).
- [ ] Los criterios de aceptación están escritos y son verificables (Dado / Cuando / Entonces).
- [ ] Si toca la UI, enlaza una referencia de diseño (wireframe de `Project/HU-02.md` sección 5, o pantalla existente).
- [ ] Si llama al backend, el contrato del API está disponible o simulado en `03-api-and-data/endpoints/`.
- [ ] Están descritos los estados de carga, error, vacío y sin conexión.
- [ ] Están identificadas las dependencias con otras historias.
- [ ] La historia tiene un responsable asignado.
- [ ] La historia está estimada por el equipo.
- [ ] La historia cabe en un sprint (si no, se divide).
- [ ] Si introduce una decisión técnica nueva (librería, patrón, almacenamiento), se identificó que hará falta un ADR.

> Si alguna casilla queda sin marcar, la historia se queda en refinamiento: **no entra al sprint**.

---

## Ejemplo aplicado — HU de registro diario

```
Como paciente en formación de hábitos
Quiero registrar cuánto cumplí de un hábito en una fecha
Para ver crecer mi racha y saber si alcancé mi meta

Dado que tengo el hábito "Beber agua" con meta activa de 8 vasos
Cuando registro 9 vasos para la fecha de hoy
Entonces el registro se guarda con metaCumplida = true
Y la app me confirma "Registro guardado. ¡Meta cumplida!"

Dado que ya existe un registro de "Beber agua" para hoy
Cuando intento crear otro para la misma fecha
Entonces la app lo rechaza con un mensaje explicando el duplicado
```

Referencia de diseño: `Project/HU-02.md` sección 5.3 · Estados: éxito, error de duplicado,
error de valor inválido, hábito sin meta activa.

---

## Nota sobre historias de documentación

Las historias de descubrimiento o decisión (tipo HU-01 y HU-02) no producen código. Para
ellas, el DoR se reduce a: valor claro, criterios de aceptación verificables (qué debe
contener el documento) y ubicación acordada dentro de este repositorio.
