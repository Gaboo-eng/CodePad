# Historial de versiones — CodePad

Registro detallado de versiones, fechas, cambios realizados y motivos.

---

## v1.0.0 — 2026-11-24

**Tipo de versión:** Inicial (base del proyecto)  
**Estado:** En construcción (alcance base entregado en esta iteración)

### Descripción de cambios
- Creación de la estructura de carpetas completa definida para CodePad.
- Incorporación de configuración base de Firebase:
  - `firebase.json` con hosting público en `public/` y cabeceras de seguridad (`X-Content-Type-Options`, `X-Frame-Options`, entre otras).
  - `firestore.rules` con reglas estrictas de aislamiento por usuario (`/users/{userId}/{document=**}`).
  - `public/js/firebase-config.js` con inicialización modular de Firebase v10+ (Auth, Firestore y Messaging con detección de compatibilidad).
- Creación de documentación inicial del proyecto:
  - `docs/funcionalidad-general.md` con la guía funcional completa.
  - `docs/historial-versiones.md` (este documento).
  - `docs/actualizaciones/` como espacio para documentos por función agregada/actualizada.
  - `CHANGELOG.md` con registro resumido.
- Implementación inicial de la vista de acceso:
  - `public/login.html` (HTML5 semántico, metadatos SEO/base, favicon y logotipo).
  - `public/css/variables.css` (paleta minimalista de 4 colores base, variables de tema claro/oscuro y estados de prioridad).
  - `public/css/login.css` (estilos exclusivos y responsive del login).
  - `public/js/auth.js` (inicio de sesión, cierre de sesión, protección/redirección por estado de autenticación y aplicación de preferencia de tema sin almacenar credenciales).
- Inclusión de identidad visual inicial en SVG (`assets/logo.svg`, `assets/favicon.svg`).

### Motivo
Establecer una base sólida, segura y documentada para el desarrollo incremental de CodePad, garantizando desde el inicio la estructura acordada, el aislamiento de datos por usuario, la configuración de hosting seguro y una experiencia de acceso coherente con la identidad visual y los requisitos técnicos del proyecto.
