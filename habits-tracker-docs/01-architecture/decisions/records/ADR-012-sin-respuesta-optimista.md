# ADR-012 — La app espera la respuesta del servidor: se descarta la respuesta optimista

- **ID:** ADR-012
- **Fecha:** 2026-10-28
- **Estado:** Aceptado (confirmado por el equipo el 2026-10-28)
- **Resuelve:** la contradicción C2 de la [auditoría E2E del 2026-10-26](../../../04-quality/auditoria-e2e-2026-10-26.md) (REQ-048)
- **Autores:** Juan José Horta Vanegas, Daniel Felipe Fernandez Rojas — redactado con asistencia de Claude Code

---

## Contexto

HU-01 §3 (RF-06), HU-02 Flujo 3 y `03-api-and-data/README.md` describían una **respuesta
optimista**: la app replicaba las reglas del dominio (registro único por día, meta activa única,
`metaCumplida`), mostraba el resultado al instante y luego lo corregía con la respuesta del servidor.

Desde la integración con la API (2026-10-25, [ADR-008](./ADR-008-reconciliacion-contrato-api.md) D-18),
la implementación hace lo contrario: **el servidor es la única autoridad** y la app espera su
respuesta para mostrar el resultado. La auditoría lo marcó como "requiere aclaración" y no cambió
el comportamiento. Hacía falta decidirlo antes de la entrega C3 para que documentación y código
digan lo mismo.

**Restricciones conocidas:**
- El equipo es de dos personas; duplicar reglas en dos lenguajes (TypeScript en la app y en la API) duplica las pruebas y el riesgo de que diverjan.
- La app se usa con un solo dispositivo por persona (ADR-008, D-20): no hay escrituras concurrentes que justifiquen la complejidad.
- La falta de red sí es real (RNF-02), y ya tiene su propio mecanismo: la cola S-06 ([ADR-011](./ADR-011-roles-y-alcance-completo.md)).

---

## Decisión

**Decidimos:** la app **no** muestra resultados optimistas. Cada escritura espera la respuesta de la
API; la pantalla muestra lo que el servidor decidió (`metaCumplida`, `409`, `422`...) y el botón
queda en "cargando" mientras tanto. Sin red, el registro diario no se da por hecho: queda
**pendiente** (⏳) y así se muestra hasta que el servidor lo acepta.

**Justificación:**
- Una sola fuente de verdad: lo que ve la persona es lo que quedó guardado. No hay "¡Meta cumplida!" que después se desdiga.
- Las reglas viven una vez, en la API, con pruebas e2e contra PostgreSQL.
- La espera es corta en uso normal (una petición) y la cola S-06 cubre el caso que de verdad importa: registrar sin señal.
- Lo único que la app sigue calculando es lo que **se deriva** de datos ya confirmados: rachas,
  gráfica semanal e historial, para que cambien en pantalla sin volver a pedir la lista.

---

## Alternativas evaluadas

| Alternativa | Pros | Contras | Razón del descarte |
|-------------|------|---------|--------------------|
| **Esperar al servidor (elegida)** | Una sola verdad; reglas en un solo lugar; menos código y menos pruebas | Una espera breve en cada escritura | — (elegida) |
| Respuesta optimista con corrección posterior | Sensación de inmediatez | Reglas duplicadas en la app; mensajes que pueden desdecirse; hay que deshacer el estado si el servidor rechaza | El beneficio no compensa el riesgo para un equipo de dos personas |
| Optimista solo para el registro diario | Inmediatez en la acción más frecuente | La cola S-06 ya da una respuesta inmediata y honesta ("pendiente") sin fingir el resultado | Redundante con S-06 |

---

## Consecuencias

**Positivas:**
- Documentación y código coinciden: `03-api-and-data/README.md`, HU-01 y HU-02 quedan anotados con esta decisión.
- El contexto (`AppContext`) no repite invariantes: traduce respuestas en mensajes.

**Negativas / riesgos:**
- Con mala señal (pero con señal), cada escritura tarda lo que tarde la red, hasta el *timeout* de 10 s. Mitigación: indicador de carga en el botón y, para el registro diario, la cola S-06.

**Neutras:**
- `03-api-and-data/api-contract.md` §7 (concurrencia "optimista por versión") **no** es esto: habla de control de versiones entre dispositivos y sigue aplazado (D-20).

---

## Verificación

- `src/context/AppContext.tsx`: `crearRegistro` y `editarRegistro` toman `metaCumplida` de la respuesta (prueba `editarRegistro_usaLaDecisionDelServidorSobreLaMeta`).
- Recorrido por la interfaz del 2026-10-28: el mensaje "Registro actualizado." aparece tras la respuesta y el ⭕/✅ refleja el valor del servidor ([TC-007](../../../04-quality/test-cases/TC-007-editar-registro.md)).
