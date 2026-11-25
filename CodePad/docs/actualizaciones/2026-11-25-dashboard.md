# Actualización: Dashboard CodePad

**Fecha:** 2026-11-25  
**Versión:** v1.1.0  
**Área:** Dashboard, Firestore, proyectos, notas, calendario y recordatorios

## Resumen
Se incorporó el dashboard protegido de CodePad, con interfaz adaptable a móvil y escritorio. Los proyectos, notas y recordatorios se guardan en Cloud Firestore bajo el UID del usuario autenticado.

## Funcionalidades agregadas
- Vista principal con navegación para Proyectos, Notas y Calendario.
- Alta, edición y eliminación de proyectos. Al eliminar un proyecto, sus notas se conservan y pasan a la biblioteca de notas generales.
- Alta, edición y eliminación de notas independientes o asociadas a proyectos, con texto, clasificación por prioridad y campos HTML/CSS/JavaScript.
- Vista previa opcional del código dentro de un `iframe` con `sandbox="allow-scripts"` y política de contenido restringida.
- Calendario mensual con selección de fecha y CRUD de recordatorios con hora.
- Búsqueda contextual limitada a la sección activa y ordenación de notas.
- Preferencia de tema conectada al interruptor existente, navegación móvil y salida de sesión.
- Campana con lista de próximos recordatorios. Las notificaciones del navegador se comprueban mientras el dashboard permanece abierto y el usuario concede permiso.

## Almacenamiento y seguridad
Las colecciones utilizadas son:
- `/users/{uid}/projects`
- `/users/{uid}/notes`
- `/users/{uid}/reminders`

Las operaciones usan Firebase Authentication y Cloud Firestore. Se mantiene la regla de acceso por UID existente en `firestore.rules`. No se almacenan credenciales en `localStorage` ni en `sessionStorage`.

## Limitaciones actuales
- Las notificaciones de navegador funcionan mientras el dashboard está abierto; el envío push en segundo plano con FCM requiere configuración adicional (VAPID, Service Worker y una fuente confiable que programe/envíe los mensajes).
- No se añadió registro de usuarios; las cuentas se crean en Firebase Authentication.
- Para ejecutar la aplicación se deben completar los valores de Firebase en `public/js/firebase-config.js`, habilitar Authentication con Email/Password y crear Cloud Firestore.
