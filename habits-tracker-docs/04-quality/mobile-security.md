# Seguridad Móvil (Checklist de Ejecución)

Complementa [`../00-governance/security-rules.md`](../00-governance/security-rules.md) con las
comprobaciones que se ejecutan **antes de cada release**.

> **La checklist completa todavía no está en verde** (revisada el 2026-10-28). Lo pendiente es lo
> que exige publicar en tienda (TLS con dominio, build de release, `npm audit` en CI); lo que cubre la
> entrega académica está en verde. La columna de estado refleja la realidad, no el ideal.

---

## Almacenamiento

- [x] El token vive **solo** en `expo-secure-store` (Keychain / Keystore); en la web, solo en memoria — `src/storage/seguro.ts`
- [x] `AsyncStorage` no contiene contraseñas, tokens ni datos antropométricos — el perfil se guarda sin edad, peso ni estatura; cubierto por `src/storage/cache.test.ts`
- [x] Al cerrar sesión se limpian almacén seguro, caché y estado en memoria — cubierto por `src/context/AppContext.test.tsx`
- [x] La cola sin conexión (`hst:v1:pendientes`) guarda solo hábito, fecha, valor, notas y `clienteId`, con su `usuarioId` dueño; se borra al cerrar sesión — cubierto por `src/storage/pendientes.test.ts`
- [x] El profesional no descarga ni guarda en caché datos de pacientes (ADR-011)
- [ ] No se cachea información personal que la app no necesite — la caché guarda nombres y correo del propio paciente para abrir sin red; se acepta, pero se revisa antes de publicar

## Transporte

- [ ] Todo el tráfico va por TLS; sin HTTP en claro en builds de release — *Pendiente: no hay backend publicado con dominio ni build de release*
- [ ] El HTTP de desarrollo contra la IP local está restringido al perfil `dev` de EAS
- [ ] Certificate pinning activo en los endpoints de autenticación — Previsto para cuando el backend tenga dominio estable

## Permisos

- [x] Solo se piden los permisos mínimos, justo cuando se necesitan — **La app no solicita ningún permiso nativo**
- [x] No hay permisos sin usar declarados en `app.json`

## Build

- [ ] El build de release está minificado y sin logs de depuración
- [ ] Banderas de depuración y logging verboso desactivados en producción
- [x] No hay claves de API ni credenciales en el bundle ni en el repositorio
- [ ] Ninguna variable `EXPO_PUBLIC_*` contiene un secreto — Recordatorio: **todo lo `EXPO_PUBLIC_` es legible dentro del bundle**

## Servidor (`habits-tracker-api`)

- [x] Contraseñas con bcrypt (10 rondas); nunca viajan en una respuesta — `auth.service.spec.ts`
- [x] El secreto JWT se exige al arrancar, con mínimo 32 caracteres — `config/validar-entorno.ts` y su prueba
- [x] Toda ruta exige token salvo login y registro (`JwtAuthGuard` global): 401 sin token, alterado o vencido — `test/seguridad.e2e-spec.ts`
- [x] Permisos por rol (`RolesGuard`): 403 `FORBIDDEN_ROLE` con el rol equivocado — `test/roles.e2e-spec.ts` y Postman
- [x] El `usuarioId` sale del token (D-03); los recursos ajenos responden 403 o 404 sin revelarse
- [x] Los DTO rechazan campos no declarados (`whitelist` + `forbidNonWhitelisted`): no se puede enviar `rol` al registrarse
- [x] Cuerpo máximo de 10 MB (413) y errores 500 sin detalles internos
- [x] Ningún secreto en los repositorios: solo `.env.example` con valores de ejemplo; `.env` en `.gitignore` en `-app`, `-api` e `-infra`

## Dependencias

- [ ] `npm audit` ejecutado; paquetes con vulnerabilidad conocida parcheados
- [x] SDK de terceros revisados: **la app solo usa Expo y React Navigation**; ninguna librería de analítica ni de publicidad recoge datos

## Datos y privacidad

- [x] Los datos antropométricos no aparecen en logs ni en analítica: la app solo escribe avisos genéricos (`console.warn` sin contenido) y la API solo registra la traza de los errores 500
- [x] No hay analítica de terceros integrada
- [x] `mockData.ts` eliminado antes de publicar en tienda

---

## Hallazgos de la v1.0.0 y su estado

| # | Hallazgo | Severidad | Estado |
|---|----------|-----------|--------|
| S-01 | **El login acepta cualquier credencial no vacía.** La contraseña se recoge, se valida su longitud y se descarta | Crítica **si se publicara** | ✅ **Resuelto (2026-10-25):** el login valida contra `POST /auth/login` (bcrypt + JWT) |
| S-02 | No hay guardia de navegación: nada impide montar `Tabs` sin usuario | Alta | ✅ **Resuelto:** el stack raíz monta `Tabs` solo con sesión (`AppNavigator.tsx`); un 401 cierra la sesión |
| S-03 | `cerrarSesion()` solo limpia el estado en memoria | Media | ✅ **Resuelto:** borra el token de `expo-secure-store`, la caché de `AsyncStorage` y todo el estado |
| S-04 | `mockData.ts` incluye un usuario de demostración con correo y datos antropométricos | Baja | ✅ **Resuelto:** `mockData.ts` eliminado |
| S-05 | Sin ejecución regular de `npm audit` | Media | Se añade al pipeline de CI |

> S-01 era la razón por la que la v1.0.0 no podía publicarse; ya está resuelto. Lo que hoy impide
> publicar en tienda es el transporte (sin dominio ni TLS) y la falta de build de release, no la
> autenticación. La app se demuestra con Expo Go y la web durante la sustentación.
> La checklist completa debe estar en verde antes de cualquier distribución pública.

---

## Cuándo se ejecuta esta checklist

- Completa, antes de etiquetar una release (queda registrada en
  [`../05-release/_template-release-checklist.md`](../05-release/_template-release-checklist.md)).
- Los puntos de **Dependencias** y **Build**, en cada PR que toque `package.json` o `app.json`.
