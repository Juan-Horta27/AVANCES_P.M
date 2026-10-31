# ADR-011 — Roles, panel del profesional y alcance completo del corte 3

- **ID:** ADR-011
- **Fecha:** 2026-10-28
- **Estado:** Aceptado (2026-10-28: el equipo eligió panel en la misma app, edición de las tres entidades e incluir S-06)
- **Resuelve:** ADR-008 D-24 (roles y M-09) y HU-02 §5.8 (canal del panel del profesional). Revisa D-18 (registros no editables)
- **Autores:** Juan José Horta Vanegas, Daniel Felipe Fernandez Rojas — redactado con asistencia de Claude Code

---

## Contexto

La guía del corte 3 (§3) pide entregar el **producto completo** documentado, no el MVP, con estos mínimos:

- CRUD completo en al menos tantas entidades como integrantes (el equipo tiene dos válidos).
- Al menos dos roles con permisos distintos (401 sin token y 403 con el rol equivocado).
- Datos semilla con un usuario por rol.
- Almacenamiento local con un uso real.

HU-02 ya documentaba lo que faltaba para cumplirlos:

- **M-09** (*Must*): panel del profesional, Flujo 5. Quedaba pendiente decidir el canal (§5.8) y los roles (ADR-008, D-24).
- **C-04**: edición de hábitos, metas y registros.
- **S-06** (*Should*): registro sin conexión. La estrategia está en `offline-sync.md`.

Hoy solo `Habito` tiene CRUD completo en el API; no hay roles, y la app no tiene pantallas de edición.

---

## Decisión

**Decidimos** entregar como alcance cerrado (ficha del README) M-09, C-04 y S-06, además de lo ya
implementado, con estas reglas:

### 1. Roles
- `usuario.rol`: `paciente` | `profesional`, con `paciente` por omisión. El rol viaja en el token
  y se comprueba en el servidor con una guardia de roles.
- `POST /auth/register` crea **solo pacientes**. Las cuentas de profesional se crean como datos
  semilla (migración).
- **Paciente:** todos los endpoints de hábitos, metas y registros sobre sus propios datos.
- **Profesional:** `GET /usuarios?rol=paciente` y `GET /reportes/progreso`. No crea ni modifica
  datos de pacientes.
- Ambos: `GET /usuarios/me` y `GET /categorias`.
- Un rol que llama a un endpoint del otro recibe **`403 FORBIDDEN_ROLE`**. `FORBIDDEN_RESOURCE`
  sigue reservado para un recurso de otra persona.

### 2. Panel del profesional (M-09)
- **Canal:** la misma app. Al iniciar sesión, el profesional ve sus propias pestañas: **Pacientes**
  (lista) y, al elegir uno, **Progreso del paciente** con un rango de fechas.
- **Qué pacientes ve:** todos los pacientes del centro, como en el Flujo 5 de HU-02
  (`GET /usuarios` → "pacientes del centro"). No se crea una relación profesional–paciente, porque
  la documentación no la define.
- **Reporte por hábito en el rango:** días evaluados (registros), días cumplidos, porcentaje de
  adherencia y racha máxima. Son los datos que pide la persona "Dra. Laura" en HU-02 §2.

### 3. Edición (C-04)
- **Hábitos:** se usa `PUT /habitos/:id`, que ya existe (nombre, descripción, unidad).
- **Metas:** `PATCH /metas/:id` acepta además `valorObjetivo` y `descripcion`. Se añade
  `DELETE /metas/:id`; los registros no dependen de la meta, porque `metaCumplida` ya está guardada en ellos.
- **Registros:** `PUT /registros/:id` cambia `valorRegistrado` y `notas`. El hábito y la fecha no
  cambian. Al editar, `metaCumplida` se recalcula con la meta activa en ese momento, como ya
  preveía `api-contract.md` §7 ("el servidor gana"). Esto **revisa D-18**: el registro deja de
  estar congelado solo cuando la persona lo edita.

### 4. Registro sin conexión (S-06)
- Si `POST /registros` falla por red, el registro se guarda en la cola `hst:v1:pendientes`
  (AsyncStorage, que en el navegador usa `localStorage`) con su `clienteId`. Se muestra como
  "pendiente de subir" y se reenvía al recuperar la conexión, sin duplicarse (D-17).
- Si al reenviar el servidor responde `409 DUPLICATE_DAILY_LOG`, gana el servidor: el pendiente se
  descarta y se avisa a la persona (`offline-sync.md`).
- En el navegador la cola sí funciona. Así el almacenamiento local queda demostrable sin teléfono.
- Al cerrar sesión con pendientes, la app avisa de que se perderán antes de borrar la caché.

---

## Alternativas evaluadas

| Alternativa | Pros | Contras | Motivo de descarte |
|-------------|------|---------|--------------------|
| **Panel del profesional como pestañas de la misma app (elegida)** | Un solo cliente; reutiliza sesión, navegación y `apiFetch` | Tablas anchas en pantalla de teléfono | — (elegida) |
| Vista web aparte | Mejor para escritorio | Otro cliente fuera de los cuatro repositorios obligatorios | Más alcance sin respaldo en la guía |
| Añadir un rol administrador (categorías) | Cubre a la persona "Roberto" | HU-02 no diseña sus pantallas | Fuera de la ficha |
| Relación profesional–paciente | Privacidad más fina | Entidad no documentada | No se inventan entidades |
| Registros siempre congelados (D-18 original) | Historial inmutable | Sin edición, `RegistroDiario` no tiene CRUD completo | Requisito del curso |

---

## Consecuencias

**Positivas:**
- `Habito`, `Meta` y `RegistroDiario` quedan con CRUD completo y relacionadas entre sí.
- Dos roles con permisos distintos, comprobables con 401 y 403.
- El almacenamiento local se puede probar en el navegador.

**Negativas / Compromisos:**
- El profesional ve a todos los pacientes: es aceptable para el centro piloto, pero una
  publicación real exigiría asignar pacientes a cada profesional.
- Las contraseñas de los usuarios semilla son **de prueba** y están documentadas en el manual de
  implementación; una instalación real debe cambiarlas.

**Impacto en el sistema:**
- Migración: columna `usuario.rol` y usuarios semilla.
- API: guardia de roles, módulo de reportes, nuevos endpoints de edición y borrado.
- App: navegación según el rol, pantallas de edición, Pacientes y Progreso del paciente, y la cola sin conexión.
- Documentos: `api-contract.md`, `data-model.md`, `authentication.md`, `offline-sync.md`, las
  fichas de features y pantallas, y TC nuevos.

---

## Referencias

- Guía del proyecto de aula del corte 3, §3, §5, §6 y §9.
- HU-02 §2 (persona Dra. Laura), §4 (M-09, S-06, C-04), §5.8 y Flujo 5.
- Relacionado con: [ADR-008](./ADR-008-reconciliacion-contrato-api.md), [ADR-010](./ADR-010-separacion-en-cuatro-repositorios.md).
