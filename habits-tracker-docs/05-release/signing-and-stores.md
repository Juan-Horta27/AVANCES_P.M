# Firma y Distribución en Tiendas

> **Estado actual: la app nunca se ha firmado ni subido a ninguna tienda.** Se distribuye vía
> Expo Go para demos y sustentaciones. Este documento define el procedimiento para cuando se
> publique.

---

## ⛔ Bloqueo previo a cualquier publicación

La v1.0.0 **no puede publicarse en ninguna tienda** mientras el hallazgo **S-01** siga abierto:
el login acepta cualquier credencial no vacía porque no hay backend contra el que autenticar
(ver [`../04-quality/mobile-security.md`](../04-quality/mobile-security.md)).

Publicar una app de seguimiento de salud sin autenticación real sería un problema de seguridad,
y además ambas tiendas rechazan aplicaciones con funcionalidad incompleta o simulada.

---

## Firma

Las credenciales de firma las gestiona **EAS**, por [ADR-002](../01-architecture/decisions/records/ADR-002-react-native-expo.md).

| Plataforma | Credencial | Dónde vive |
|------------|------------|------------|
| Android | Keystore de release | Generado y custodiado por EAS; se puede descargar y respaldar |
| iOS | Certificado de distribución + perfil de aprovisionamiento | Gestión automática de EAS con la cuenta de desarrollador |

**Reglas:**
- Las credenciales **nunca** se commitean al repositorio.
- El keystore de Android se respalda fuera de EAS, en un lugar acordado por el equipo.
  **Perderlo significa no poder actualizar nunca más la app publicada.**
- El acceso queda documentado: quién lo tiene y desde cuándo.
- Al rotar integrantes en el equipo, se revisa el acceso.

---

## Versionado

- La versión sigue SemVer y se declara **en dos sitios que deben coincidir**:
  `app.json` (`expo.version`) y `package.json` (`version`). Hoy ambos dicen `1.0.0`.
- El número de build (`android.versionCode` e `ios.buildNumber`) es un entero monótono que se
  incrementa en **cada** subida a tienda y nunca se reutiliza. EAS puede gestionarlo
  automáticamente con `autoIncrement`.
- La versión se sube **antes** de etiquetar la release.
- Ver [`../00-governance/git-conventions.md`](../00-governance/git-conventions.md).

---

## Metadatos de tienda pendientes

`app.json` está incompleto para publicar. Falta:

| Campo | Estado |
|-------|--------|
| `expo.android.package` | ❌ **Ausente**. Obligatorio. Propuesta: `co.edu.corhuila.habitos` |
| `expo.ios.bundleIdentifier` | ❌ **Ausente**. Obligatorio. Misma propuesta |
| `expo.icon` | ❌ Ausente: solo está definido el color de fondo del icono adaptativo |
| `expo.android.adaptiveIcon.foregroundImage` | ❌ Ausente |
| `expo.splash.image` | ❌ Ausente: solo hay color de fondo y `resizeMode` |
| `expo.name`, `slug`, `version`, `orientation`, `scheme` | ✅ Definidos |

> El identificador de paquete es **irreversible una vez publicado**: no se puede cambiar sin
> publicar una app nueva y perder a los usuarios. Conviene acordarlo antes del primer build de
> producción, no durante.

---

## Despliegue escalonado

- Se publica con lanzamiento por fases: **5 % → 20 % → 50 % → 100 %**.
- El despliegue se **detiene** ante un pico de fallos o ANR, o ante un reporte de un bug crítico.
- Los metadatos de tienda (capturas, changelog, etiquetas de privacidad) se versionan junto con
  la release.

### Etiquetas de privacidad

La app recoge **datos de salud** (edad, peso, estatura, hábitos de sueño y ejercicio). Ambas
tiendas exigen declararlo con precisión:

- App Store: sección *App Privacy*, categoría "Health & Fitness".
- Google Play: formulario *Data safety*.

Declarar mal esto es motivo de rechazo y, peor, de retirada posterior. Se revisa junto con
[`../04-quality/mobile-security.md`](../04-quality/mobile-security.md) antes de cada envío.

---

## Actualización forzada

- Se mantiene una bandera remota de **versión mínima soportada**.
- Cuando una release contiene un cambio incompatible del API o un arreglo crítico, se sube esa
  versión mínima para forzar la actualización de los clientes antiguos.
- **Caso concreto previsible:** cuando entre la autenticación real, los clientes con la versión
  simulada dejarán de funcionar contra el backend. Esa será la primera actualización forzada.

---

## Reversión

- El build anterior permanece disponible en la consola de cada tienda.
- **Disparadores de reversión:** sesiones libres de fallos por debajo del 99 %, imposibilidad de
  iniciar sesión, o pérdida de registros del usuario.
- Quien decide: el tech lead del sprint, tras consultar con el otro integrante.

> Reversión no es lo mismo que despublicar. En Android se detiene el despliegue escalonado y se
> promueve el build anterior; en iOS hay que enviar un build nuevo, así que la prevención pesa
> más.
