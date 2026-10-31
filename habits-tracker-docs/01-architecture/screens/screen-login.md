# Pantalla — Login

- **Ruta:** `Login` (pantalla inicial del `RootStackParamList`)
- **Feature:** [autenticacion](../features/feature-autenticacion.md)
- **Referencia de diseño:** `Project/HU-02.md` sección 5.1.1
- **Archivo:** `src/screens/LoginScreen.tsx`

---

## Propósito

Pantalla de bienvenida y punto de entrada a la aplicación móvil. Permite a los usuarios autenticarse mediante su correo y contraseña. Valida que los campos no estén vacíos y autentica contra `POST /auth/login`; si el servidor rechaza las credenciales, muestra su mensaje ("Credenciales incorrectas.").

---

## Regiones de la interfaz

| Región | Componente | Notas |
|--------|------------|-------|
| Marca / Logo | `View`, `Text` | Ícono 🌱, título "Habitos Saludables" y subtítulo de bienvenida |
| Tarjeta del Formulario | `Card` | Contenedor principal con fondo `surface` y borde sutil |
| Alerta de Error | `View`, `Text` | Muestra mensaje en rojo si faltan campos o las credenciales son inválidas |
| Campos de Entrada | 2 × `Input` | Correo electrónico (`keyboardType="email-address"`) y Contraseña (`esContrasena={true}`) |
| Botón Principal | `AppButton` | Dispara `manejarIngreso()` para validar y acceder |
| Separador y Enlace | `View`, `Pressable` | Enlace "¿No tienes cuenta? Registrate aqui" que navega a `Registro` |

---

## Acciones y Navegación

| Acción del usuario | Disparador | Comportamiento |
|--------------------|------------|----------------|
| Ingresar credenciales y pulsar botón | `onPress` en `AppButton` | Ejecuta `iniciarSesion(correo, contrasena)` en `AppContext`. Si es exitoso, `AppNavigator` monta las rutas del **rol** que trae la respuesta: pestañas del paciente o `Pacientes` del profesional (ADR-011). No hay `navigation.replace` |
| Pulsar "Registrate aqui" | `onPress` en `Pressable` | Ejecuta `navigation.navigate('Registro')` |

---

## Accesibilidad

- [x] Inputs declaran etiquetas claras y accesibles asociadas al control.
- [x] Botón principal `AppButton` con `accessibilityRole="button"`.
- [x] `KeyboardAvoidingView` evita que el teclado cubra los campos en dispositivos móviles.
