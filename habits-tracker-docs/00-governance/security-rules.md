# Reglas de Seguridad

Reglas de seguridad no negociables, a nivel de código, para cada build de la app.

> El complemento en tiempo de ejecución, con checklist por release, está en
> [`04-quality/mobile-security.md`](../04-quality/mobile-security.md).

---

## Secretos y credenciales

- Nunca se commitean claves de API, tokens ni credenciales, ni se empaquetan en texto plano.
- **En Expo, todo lo que empiece por `EXPO_PUBLIC_` viaja dentro del bundle y es legible por
  cualquiera.** Solo se usa para valores no sensibles (por ejemplo, la URL base del API).
  Un secreto jamás lleva ese prefijo.
- Los secretos de build se inyectan desde EAS Secrets / GitHub Secrets, nunca desde el repositorio.
- Las credenciales de firma (keystore de Android, certificados de iOS) viven en el almacén de
  secretos del CI.

## Tokens de usuario

- El JWT del usuario se guarda **solo** en almacenamiento seguro de la plataforma
  (`expo-secure-store` → Keychain en iOS / Keystore en Android).
- Nunca en `AsyncStorage`, ni en archivos locales, ni en una base de datos sin cifrar.
- El token se adjunta en un **único punto** (`apiFetch`), no pantalla por pantalla.

## Transporte

- Todo el tráfico de red va por TLS. **Sin HTTP en claro en builds de release.**
- En desarrollo se permite HTTP contra la IP de la máquina del equipo (ej.
  `http://192.168.1.10:3000/api/v1`), y queda restringido al perfil `dev` de EAS — nunca a `prod`.
- Se habilita **certificate pinning** para los endpoints de autenticación cuando el backend
  esté publicado en un dominio estable.

## Datos en reposo

- No se cachea información personal que la app no necesite.
- Datos sensibles del perfil (edad, peso, estatura) no se registran en logs ni en analítica.
- **Al cerrar sesión se limpia todo:** token, caché local y estado global en memoria. Así lo
  hace `cerrarSesion()` desde el 2026-10-25 (token de `expo-secure-store` y claves `hst:` de
  `AsyncStorage`).

## Permisos

- Se piden los permisos mínimos en tiempo de ejecución, justo cuando se necesitan y con una
  justificación visible para el usuario.
- **Estado actual: la app no solicita ningún permiso nativo.** Si una iteración futura añade
  notificaciones o cámara, cada permiso se declara aquí antes de aparecer en `app.json`.
- Nunca se pide un permiso "por si acaso lo necesitamos después".

## Endurecimiento del build

- Los builds de release se generan minificados y con los logs de depuración eliminados.
- Sin banderas de depuración ni logging verboso en producción.
- `console.log` con datos de usuario está prohibido en código que llegue a `main`.

## Datos de ejemplo

- `src/constants/mockData.ts` (usuario y datos de demostración) **se eliminó** al conectar el
  backend (2026-10-25). Ningún archivo del repositorio debe contener datos de una persona real.
- El login valida contra el API: ya no existe la entrada con cualquier credencial (hallazgo S-01 resuelto).
  El día que exista `POST /auth/login`, esa ruta de escape desaparece.

## Manejo de vulnerabilidades

- Las vulnerabilidades sospechadas se reportan en privado al tech lead del sprint, nunca en un
  issue público.
- Las dependencias con vulnerabilidad conocida se parchean dentro del sprint siguiente a su
  divulgación (`npm audit` en cada PR).
