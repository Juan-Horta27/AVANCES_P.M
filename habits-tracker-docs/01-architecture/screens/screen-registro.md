# Pantalla — Crear cuenta

- **Ruta:** `Registro` (`RootStackParamList`, grupo sin sesión)
- **Feature:** [autenticación](../features/feature-autenticacion.md)
- **Referencia de diseño:** `Project/HU-02.md` sección 5.1.2; M-01
- **Archivo:** `src/screens/RegisterScreen.tsx`

---

## Propósito

Darse de alta como **paciente** con los datos de la cuenta y, si se quiere, edad, peso y estatura.
Al terminar, la sesión queda abierta. Las cuentas de profesional no se crean aquí (ADR-011).

---

## Regiones de la interfaz

| Región | Componente | Notas |
|--------|------------|-------|
| Marca | `View`, `Text` | Ícono 🌱 y título "Crear cuenta" |
| Formulario | `Card` con `Input` | Nombres *, Apellidos, Correo *, "Contraseña * (8+, mayúscula y número)", Edad, Peso (kg), Estatura |
| Botón | `AppButton` | "Crear cuenta" |
| Enlace | `Pressable` | "¿Ya tienes cuenta? Iniciar sesion" → vuelve al login |

---

## Estados

| Estado | Disparador | Interfaz |
|--------|------------|----------|
| Inicial | Abrir la pantalla | Formulario vacío |
| Enviando | Pulsar "Crear cuenta" | Botón deshabilitado |
| Error local | Falta nombre, correo o contraseña | "Nombres, correo y contraseña son obligatorios" |
| Error del servidor | Contraseña débil, correo repetido (`409 DUPLICATE_EMAIL`), rangos | El primer error de campo o el `detail` del servidor |
| Sin conexión | Sin red | "No pudimos conectar. Revisa tu conexión e intenta de nuevo." |

---

## Acciones

| Acción | Resultado | Caso de uso / evento |
|--------|-----------|----------------------|
| Pulsar "Crear cuenta" | `crearCuenta(...)` → `POST /auth/register`; guarda el token y `AppNavigator` muestra las pestañas del paciente (no hay `navigation.replace`: el árbol reacciona a la sesión) | M-01 |
| "Iniciar sesion" | Vuelve a `Login` | — |

> Las reglas de la contraseña (8 o más caracteres, una mayúscula y un número) y los rangos de
> edad (12–120), peso (20–350 kg) y estatura (0,80–2,50 m) los valida la API (E-02); la pantalla
> solo comprueba los obligatorios.

---

## Accesibilidad

- [x] Cada campo tiene etiqueta visible y accesible; los numéricos abren el teclado numérico.
- [x] Los errores se muestran como texto sobre el formulario.
- [ ] Texto escalable con el tamaño de fuente del sistema: sin verificar en dispositivo.
- [x] Colores del tema.
