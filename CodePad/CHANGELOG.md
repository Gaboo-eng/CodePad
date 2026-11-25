# Changelog

Registro resumido de versiones de **CodePad**.

El formato sigue una convención basada en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y versionado semántico.

## [1.0.0] - 2026-11-24

### Añadido
- Estructura inicial del proyecto CodePad (frontend Vanilla HTML5/CSS3/JS ES6+ modular y configuración base de Firebase).
- Configuración de Firebase Hosting con cabeceras de seguridad y reglas estrictas de Firestore aisladas por UID.
- Inicialización modular de Firebase (Auth, Firestore y Messaging) en `public/js/firebase-config.js`.
- Documentación inicial: guía de funcionalidad general, historial de versiones y carpeta de actualizaciones.
- Vista de inicio de sesión (`login.html`) con estilos dedicados, paleta de variables (modo claro/oscuro) y lógica base de autenticación/protección de rutas (`auth.js`).
- Identidad visual inicial: logotipo y favicon SVG minimalistas.
