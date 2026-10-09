# Reglas de desarrollo de Reporte Vías

- Mantener una arquitectura `frontend/` (React 19, TypeScript, Vite, Tailwind y Leaflet) y `backend/` (Node.js, Express y TypeScript).
- Conservar la interfaz mobile-first, sus colores, textos, flujos y disposición; solo se permiten los cambios funcionales solicitados (autenticación y estados de carga/error incluidos).
- El backend usa MySQL 8 y Prisma. Las tablas y columnas se nombran en español, `snake_case`, y almacenan fechas UTC en `DATETIME`.
- Toda lógica de negocio reside en `backend/src/services`; rutas y controladores no contienen reglas de negocio.
- Validar entradas con Zod. Usar JWT, bcrypt, Helmet, CORS restringido y límites de tasa en login y creación de reportes.
- Las fotos se validan y guardan como archivos en `backend/uploads`; MySQL almacena únicamente su URL. `uploads/` no se versiona.
- Las respuestas de la API usan camelCase compatible con los tipos del frontend y los errores usan `{ error: { codigo, mensaje } }` en español.
- No guardar datos de dominio en localStorage; únicamente se permite conservar el token de sesión.
- `mockData.ts` debe migrar al seed idempotente de Prisma. No usar imágenes de incendios o catástrofes.
- Documentar configuración, credenciales del usuario semilla y pruebas en el README en español. Nunca versionar archivos `.env`.
- Cada regla de negocio debe tener al menos una prueba con Vitest y Supertest.
- Mantener visible en el detalle de un reporte: “Prototipo académico: los estados institucionales son simulados.”
