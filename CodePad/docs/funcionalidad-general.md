# CodePad — Documentación de funcionalidad general

**Producto:** CodePad  
**Tipo:** Bloc de notas técnico y portal de apuntes de programación  
**Desarrollado por:** gaboo-eng  
**Versión documentada:** v1.1.0  
**Fecha:** 2026-11-25

## 1. Descripción general
CodePad es una aplicación web orientada a desarrolladores para gestionar proyectos, notas técnicas y recordatorios en un entorno unificado. Está construida con tecnologías web Vanilla (HTML5 semántico, CSS3 moderno y JavaScript ES6+ modular) e integra Firebase (plan Spark) para autenticación, persistencia de datos, hosting y notificaciones.

## 2. Stack tecnológico
- **Frontend:** HTML5, CSS3 (variables CSS, Flexbox/Grid), JavaScript ES6+ con módulos (`type="module"`), sin frameworks pesados.
- **Backend y servicios (Firebase v10+ Modular SDK):**
  - **Firebase Authentication:** inicio/cierre de sesión con correo y contraseña.
  - **Cloud Firestore:** almacenamiento de proyectos, notas y recordatorios aislados por usuario.
  - **Firebase Hosting:** despliegue web bajo HTTPS y cabeceras de seguridad.
  - **Web Notifications API:** avisos del navegador mientras el dashboard permanece abierto y el usuario concede permiso. Las notificaciones FCM en segundo plano quedan pendientes de configuración adicional.

## 3. Estructura principal del proyecto
```text
codepad/
├── docs/
│   ├── funcionalidad-general.md
│   ├── historial-versiones.md
│   └── actualizaciones/
├── public/
│   ├── index.html
│   ├── login.html
│   ├── firebase-messaging-sw.js
│   ├── assets/ (favicon.svg, logo.svg)
│   ├── css/ (variables.css, login.css, dashboard.css)
│   └── js/ (firebase-config.js, auth.js, db.js, projects.js, notes.js, calendar.js, notifications.js, app.js)
├── firestore.rules
├── firebase.json
└── CHANGELOG.md
```

## 4. Identidad visual y experiencia de usuario
- **Paleta minimalista (máximo 4 colores base):**
  - Fondo principal: `#FAFAFA` (claro) / `#121212` (oscuro).
  - Superficie/Tarjetas: `#FFFFFF` (claro) / `#1E1E1E` (oscuro).
  - Texto principal: `#1F2937` (claro) / `#F3F4F6` (oscuro).
  - Acento primario: azul técnico `#2563EB`.
- **Etiquetas de prioridad (solo bordes/badges en tarjetas):** rojo (alta/relevante), amarillo (media/poco relevante), verde (completado/resuelto/referencia verificada), blanco/neutro (sin clasificar).
- **Modo oscuro/claro:** interruptor accesible con persistencia de preferencia en `localStorage` (sin almacenar credenciales).
- **Logotipo:** SVG minimalista que combina bloc de notas y símbolo de código (`</>`), presente en login y header.
- **Diseño responsive:** adaptación a móviles, tablets y escritorio (menú colapsable/hamburguesa en pantallas pequeñas).

## 5. Autenticación y acceso
- **Vista independiente:** `login.html` para inicio de sesión con correo y contraseña.
- **Gestión de sesión:** delegada a Firebase Authentication mediante `onAuthStateChanged`.
- **Protección de rutas:** si no existe usuario autenticado en vistas protegidas (p. ej. `index.html`), se redirige a `login.html`. Si hay sesión activa en `login.html`, se redirige al dashboard.
- **Privacidad:** no se guardan contraseñas ni tokens sensibles en `localStorage` o `sessionStorage`.
- **Cierre de sesión:** disponible en el header del dashboard, junto al icono de notificaciones.

## 6. Distribución de la interfaz (Dashboard)

### 6.1 Header
- Logotipo y nombre **CodePad**.
- **Buscador contextual:** filtra dinámicamente solo los elementos de la sección activa:
  - *Proyectos:* proyectos y notas dentro de proyectos.
  - *Notas:* notas generales.
  - *Calendario:* eventos/recordatorios.
- **Interruptor de tema:** modo oscuro/claro.
- **Campana de notificaciones:** badge con contador y menú desplegable con recordatorios programados desde el calendario.
- **Botón de cerrar sesión:** ubicado inmediatamente al lado del icono de notificaciones.

### 6.2 Navegación principal (`<nav>`)
1. **Proyectos**
   - Creación, edición y eliminación de proyectos ilimitados.
   - Los proyectos se despliegan como **subsecciones anidadas** dinámicamente bajo *Proyectos* en la navegación.
   - Cada proyecto tiene un espacio de trabajo con notas asociadas exclusivamente a él (crear, editar, eliminar y ordenar por fecha de creación/actualización o prioridad).
   - **Soporte de código (HTML, CSS, JS):** cada nota puede incluir texto/apuntes y bloques de código. Por defecto se muestra texto y código formateado; la **vista previa visual solo se renderiza al pulsar "Ver Interfaz / Previsualizar"** dentro de un `<iframe sandbox="allow-scripts">` con política de contenido restringida.
2. **Notas**
   - Apuntes generales independientes (no vinculados a proyectos).
   - Crear, editar, eliminar y ordenar por fecha.
3. **Calendario**
   - Vista mensual interactiva para seleccionar fechas y registrar notas/recordatorios con hora.
   - Los recordatorios aparecen en la campana y en la agenda. Los avisos del navegador se comprueban mientras CodePad permanece abierto, con permiso del usuario. Push en segundo plano con FCM aún requiere Service Worker, VAPID y un emisor confiable.

### 6.3 Sistema de clasificación por color (Notas de proyectos y generales)
Selector manual con 4 estados visuales aplicados como borde/badge:
- **Blanco (por defecto):** sin clasificar / nota normal.
- **Rojo:** relevante / alta prioridad.
- **Amarillo:** poco relevante / media prioridad.
- **Verde:** completado / resuelto / referencia verificada.

### 6.4 Footer
Contenido único: `© 2026 CodePad. Todos los derechos reservados. Desarrollado por gaboo-eng` con enlace al perfil/repositorio del desarrollador (configurable).

## 7. Datos y seguridad (Firestore)
- **Aislamiento por usuario:** todas las colecciones bajo `/users/{userId}/...` (p. ej. `projects`, `notes`, `reminders`).
- **Datos actuales:** `/users/{uid}/projects`, `/users/{uid}/notes` y `/users/{uid}/reminders`. Las notas guardan opcionalmente `projectId`; al eliminar un proyecto, sus notas se conservan como notas generales.
- **Sincronización:** el dashboard escucha cambios de Firestore en tiempo real para las tres colecciones.
- **Reglas de seguridad:** acceso de lectura/escritura permitido solo al usuario autenticado propietario (`request.auth.uid == userId`).
- **Hosting seguro:** servicio bajo HTTPS con cabeceras de seguridad configuradas en `firebase.json` (incluye `X-Content-Type-Options` y `X-Frame-Options`).

## 8. Estado y puesta en marcha
- `public/index.html` contiene el dashboard protegido por Firebase Authentication.
- Para usar datos reales, completa el objeto `firebaseConfig` de `public/js/firebase-config.js`, habilita Email/Password en Firebase Authentication, crea Cloud Firestore y publica `firestore.rules`.
- Las cuentas se crean en la consola Firebase; la interfaz actual incluye inicio y cierre de sesión, no registro.
- Si Firestore rechaza una operación, comprueba que la sesión esté activa, que las reglas estén publicadas y que se utilice la ruta `/users/{uid}/...`.

## 9. Documentación y versionado del proyecto
- **`docs/funcionalidad-general.md`:** guía funcional completa y actualizable.
- **`docs/historial-versiones.md`:** registro detallado por versión (fecha, cambios y motivo).
- **`docs/actualizaciones/`:** documentos específicos por cada función agregada o actualizada.
- **`CHANGELOG.md`:** resumen de versiones.

La documentación es mantenida como parte del ciclo de desarrollo para facilitar su exportación o conversión a PDF cuando se requiera.
