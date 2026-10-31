# Pantalla — Pacientes

- **Ruta:** `Pacientes` (`RootStackParamList`, grupo del rol `profesional`)
- **Feature:** [panel del profesional](../features/feature-panel-profesional.md)
- **Referencia de diseño:** `Project/HU-02.md`, Flujo 5 y M-09; [ADR-011](../decisions/records/ADR-011-roles-y-alcance-completo.md)
- **Archivo:** `src/screens/PacientesScreen.tsx`

---

## Propósito

Es la pantalla de inicio del profesional de bienestar: muestra los pacientes del centro y, al tocar
uno, abre su progreso. El profesional **no crea ni modifica** datos de pacientes.

---

## Regiones de la interfaz

| Región | Componente | Notas |
|--------|------------|-------|
| Encabezado | `ScreenHeader` | "🩺 Pacientes", subtítulo "Hola, <nombre> · N paciente(s)" y enlace **Salir** a la derecha |
| Lista | `FlatList` de `Card` dentro de `Pressable` | Por paciente: nombre completo, correo, "Ver progreso ›" y una fila con Edad, Peso y Estatura ("—" si faltan) |
| Vacío | `EmptyState` | "Sin pacientes · Todavía no hay pacientes registrados en el centro." |

---

## Estados

| Estado | Disparador | Interfaz |
|--------|------------|----------|
| Cargando | Primera carga | `PantallaEstado` "Cargando pacientes…" |
| Cargado | `GET /usuarios?rol=paciente` responde | La lista, en orden alfabético (lo ordena el servidor) |
| Refrescando | Deslizar hacia abajo | Indicador de refresco de la lista |
| Vacío | La lista llega vacía | `EmptyState` |
| Error | Falla la petición (incluida la falta de red) | `PantallaEstado` con el mensaje, **Reintentar** y **Cerrar sesión** |
| Sin conexión | Igual que Error: el panel no usa caché | — |

---

## Acciones

| Acción | Resultado | Caso de uso / evento |
|--------|-----------|----------------------|
| Tocar un paciente | Abre `ProgresoPaciente` con `{ usuarioId, nombre }` | M-09 |
| Deslizar hacia abajo | Vuelve a pedir la lista | — |
| **Salir** | Confirmación "¿Seguro que quieres salir?"; al aceptar, `cerrarSesion()` y el stack vuelve solo al login | Cerrar sesión |

---

## Accesibilidad

- [x] Cada tarjeta es un botón con la etiqueta "Ver el progreso de <nombre>".
- [x] "Salir" tiene rol de botón y la etiqueta "Cerrar sesión".
- [x] Las tarjetas ocupan todo el ancho: el área táctil supera 44×44 pt.
- [ ] Texto escalable con el tamaño de fuente del sistema: sin verificar en dispositivo.
- [x] Colores del tema (`theme.ts`), con texto principal sobre fondo oscuro.
