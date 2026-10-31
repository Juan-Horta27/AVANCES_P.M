# Entidad local — usuario

> **Estado: implementada (2026-10-25; `rol` desde el 2026-10-28)** en `src/storage/cache.ts`, clave
> `hst:v1:usuario`. Solo para el rol `paciente` y solo en Android e iOS.

- **Almacén:** `AsyncStorage` (clave-valor, JSON serializado)
- **Clave:** `hst:v1:usuario`
- **Versión de esquema en que se introduce:** v1
- **Tipo de dominio equivalente:** `Usuario` en `src/types/index.ts`
- **Tabla del servidor:** `usuario` ([data-model.md §2.1](../data-model.md))

---

## Forma almacenada

Un objeto, el **perfil básico**: `aPerfilBasico()` pone a `null` los datos de salud antes de guardar.

```json
{ "id": 1, "nombres": "Carlos", "apellidos": "Gómez", "correo": "paciente@habitos.test",
  "edad": null, "peso": null, "estatura": null, "rol": "paciente" }
```

---

## Campos

| Campo | Tipo | Nulo | Notas |
|-------|------|------|-------|
| `id` | `number` | No | Id del servidor |
| `nombres` | `string` | No | Para el saludo "Hola, Carlos" |
| `apellidos` | `string` | Sí | Opcionales (D-13) |
| `correo` | `string` | No | En minúsculas |
| `edad`, `peso`, `estatura` | `number` | Sí | **Siempre `null` en la caché**: son datos de salud y `AsyncStorage` no está cifrado (security-rules.md). En memoria sí están |
| `rol` | `'paciente' \| 'profesional'` | No | ADR-011 |

> `contrasena` no existe en el tipo ni llega en ninguna respuesta. El **token** no está aquí: vive
> en `expo-secure-store` (`hst.token`).

---

## Unicidad e índices

Un solo objeto por dispositivo: la sesión activa. Sin índices.

---

## Relaciones

| Entidad relacionada | Clave | Cardinalidad |
|---------------------|-------|--------------|
| `habitos` | Implícita: todo lo cacheado es de este usuario | 1:N |

---

## Sincronización

- **¿Se sincroniza?** Solo lectura: se reemplaza con `GET /usuarios/me` en cada arranque con red.
- **Política de conflictos:** gana el servidor.

---

## Notas de migración

- Introducida en v1. Reconstruible desde el API: descartarla es una migración válida.
- El campo `rol` se añadió el 2026-10-28 sin cambiar la versión: un perfil antiguo sin `rol` no se
  usa nunca solo, porque al arrancar con red llega el perfil nuevo; y el profesional no usa caché.
- Se borra al cerrar sesión (`limpiarCache`, hallazgo S-03).
