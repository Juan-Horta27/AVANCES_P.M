# Persistencia Local

> **Estado (2026-10-25): implementado** en `src/storage/seguro.ts` (token) y `src/storage/cache.ts`
> (caché de dominio), según [ADR-004](../01-architecture/decisions/records/ADR-004-persistencia-local.md).
> Al abrir la app con sesión, se muestra la caché al instante y se piden datos frescos en segundo
> plano; sin red, se siguen mostrando los datos guardados con un aviso "Sin conexión" y la opción
> de reintentar. En la **web** la caché está desactivada: el token no sobrevive a una recarga, así
> que la caché nunca se usaría y solo dejaría datos de salud en el navegador.

---

## Dos almacenes, dos propósitos

| Qué se guarda | Dónde | Por qué |
|---------------|-------|---------|
| Token JWT | `expo-secure-store` | Es un secreto. Cifrado por la plataforma |
| Caché de dominio (categorías, hábitos, metas, registros, perfil básico) | `AsyncStorage` | No es secreto, pero debe sobrevivir al cierre de la app |
| Formularios, filtros, pestaña activa, mes seleccionado | En memoria | Es estado efímero de la interfaz: no tiene sentido persistirlo |

**Por qué no una base de datos local:** el volumen es pequeño (un usuario con 10 hábitos y un
año de registros diarios está en el orden de 3.600 filas) y todas las consultas de la app ya se
resuelven con métodos de arreglo en memoria. `expo-sqlite` añadiría esquema, migraciones y un
lenguaje de consulta para reemplazar un `Array.filter`. El razonamiento completo y su umbral de
reevaluación están en el ADR.

---

## Módulo de acceso

Todo pasa por `src/storage/`. Ninguna pantalla importa `AsyncStorage` ni `SecureStore`
directamente.

```
src/storage/
├── seguro.ts      guardarToken / leerToken / borrarToken      → expo-secure-store
└── cache.ts       guardarDominio / leerDominio / limpiar      → AsyncStorage
```

---

## Claves de `AsyncStorage`

Una clave por colección, con prefijo de espacio de nombres y versión de esquema:

| Clave | Contenido |
|-------|-----------|
| `hst:v1:categorias` | `CategoriaHabito[]` |
| `hst:v1:habitos` | `Habito[]` |
| `hst:v1:metas` | `Meta[]` |
| `hst:v1:registros` | `RegistroDiario[]` |
| `hst:v1:usuario` | Perfil básico, **sin datos antropométricos** |
| `hst:v1:sincronizado` | Marca de tiempo de la última sincronización con el API |
| `hst:v1:pendientes` | `{ usuarioId, registros: RegistroPendiente[] }`: la cola de registros hechos sin conexión (S-06, 2026-10-28). **No es caché**: no se descarta en migraciones y funciona también en la web |

- `hst` = *healthy habits tracker*. El prefijo evita colisiones y hace trivial limpiar todo.
- `v1` es la **versión de esquema** y es la que habilita las migraciones (ver más abajo).
- La clave del token **no está en esta tabla**: vive en el almacén seguro, bajo `hst.token` (SecureStore no admite `:` en las claves). En la web no hay almacén seguro: el token vive solo en memoria y la sesión se pierde al recargar.

---

## Qué NO se guarda en `AsyncStorage`

`AsyncStorage` **no está cifrado**. Por tanto, nunca se guardan allí:

- La contraseña, en ninguna forma.
- El token JWT.
- Los datos antropométricos (edad, peso, estatura). Son información de salud y se vuelven a
  consultar al API tras iniciar sesión.

---

## Modelo persistido frente a modelo de dominio

Los tipos de `src/types/index.ts` se serializan **tal cual** a JSON, sin un modelo persistido
aparte. Es viable porque el dominio ya es JSON plano: números, cadenas y booleanos. Las fechas
son texto `'YYYY-MM-DD'`, así que la serialización es la identidad
([ADR-003](../01-architecture/decisions/records/ADR-003-fechas-como-texto-iso.md)).

> Si algún día un tipo del dominio incorporara un `Date`, un `Map` o una clase, esta
> equivalencia se rompe y habrá que introducir un modelo persistido con su mapeo.

---

## Ciclo de lectura y escritura

```
Arranque → leer las 5 claves → hidratar AppContext → mostrar la app
   │
   └─ en paralelo: pedir datos frescos al API → reemplazar → reescribir el caché

Mutación (crear/eliminar) → actualizar estado → reescribir la clave afectada
```

- Al arrancar, la app se muestra con el caché mientras pide datos frescos: el usuario no ve una
  pantalla en blanco.
- Tras cada mutación se reescribe **solo la clave afectada**, no todas.
- La escritura es asíncrona y no bloquea la interfaz. Si falla, se registra y se reintenta en la
  siguiente mutación: el estado en memoria sigue siendo la verdad de la sesión en curso.

---

## Migraciones

- La versión de esquema está **en la propia clave** (`hst:v1:`). Un cambio de forma
  incompatible pasa a `hst:v2:`.
- Al arrancar, si se encuentran claves de una versión anterior, la app **las migra o las
  descarta**, y siempre borra las antiguas.
- Las migraciones son hacia adelante y no se modifican una vez publicadas.
- Como el caché es reconstruible desde el API, **descartar es una migración válida** para
  cambios menores: se limpia y se vuelve a pedir todo. Se documenta cuando se haga.
- Toda migración se prueba contra un almacén **con datos**, no vacío.

---

## Entidades documentadas

| Entidad | Documento |
|---------|-----------|
| `registros` | [entities/entity-registros.md](./entities/entity-registros.md) |

Para definir una entidad nueva, copia [`_template-entity.md`](./_template-entity.md) a
`entities/`.
