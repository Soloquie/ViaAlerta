# Reporte Vías

App ciudadana para reportar, ubicar en un mapa interactivo y hacer seguimiento a daños viales en Armenia, Quindío. Es un MVP académico de la Universidad del Quindío (Seminario de Ingeniería, metodología Design Thinking).

> **Prototipo académico:** los estados institucionales (En revisión, En proceso, Solucionado) son **simulados**. La app no está integrada con entidades públicas.

## Arquitectura

| Carpeta | Tecnología | Contenido |
| --- | --- | --- |
| `frontend/` | React 19, TypeScript, Vite, Tailwind 4, Leaflet | Interfaz mobile-first. Solo guarda en `localStorage` el token de sesión. |
| `backend/` | Node.js, Express 5, TypeScript, Prisma, Zod, JWT, bcrypt | API REST en `/api`. Toda la lógica de negocio está en `backend/src/services`. |
| `database/` | MySQL 8 | `schema.sql`, diagrama entidad-relación y script de la base de pruebas. |

```
backend/src
├── config/        variables de entorno (Zod) y cliente de Prisma
├── routes/        definición de rutas
├── controllers/   validan la entrada con Zod y llaman a los servicios
├── services/      reglas de negocio
├── middlewares/   JWT, subida de fotos, límites de tasa, manejo de errores
├── validators/    esquemas Zod
└── utils/         geodistancia, fechas, URLs y errores
backend/prisma
├── schema.prisma, migrations/
├── seed.ts                 comando de semilla
└── semilla/                datos de demostración (antes mockData.ts) e imágenes neutras
```

## Puesta en marcha

Requisitos: Node.js 20 o superior y MySQL 8 (con Docker o instalado localmente).

1. **Variables de entorno**
   - Copia `backend/.env.example` a `backend/.env`.
   - Copia `frontend/.env.example` a `frontend/.env`.
2. **MySQL con Docker:** `docker compose up -d`. La primera vez también se crea la base de pruebas `reporte_vias_test`.
3. **Backend**
   ```bash
   cd backend
   npm install
   npx prisma generate         # genera el cliente de Prisma en backend/generated
   npx prisma migrate deploy   # crea las tablas
   npm run prisma:seed         # carga los datos de demostración (puede repetirse)
   npm run dev                 # http://localhost:4000/api
   ```
   Comprueba `http://localhost:4000/api/salud`. Debe responder `{"estado":"ok","baseDatos":"conectada"}`.
4. **Frontend**
   ```bash
   cd frontend
   npm install
   npm run dev                 # http://localhost:3000
   ```

### Usuario de demostración

| Correo | Usuario | Contraseña |
| --- | --- | --- |
| `martin.martinez@email.com` | `@martin.m` | `ReporteVias2026!` |

Los demás usuarios de la semilla (`curtis.fair@email.com`, `michelle.b@email.com`, `valentina.ramos@email.com`) usan la misma contraseña. Si `MODO_DEMO=true`, la pantalla de inicio de sesión muestra el botón **Usar cuenta de demostración**.

Martín tiene el rol `admin`, el único que puede usar el **modo demostración** (avanzar estados simulados y restablecer datos), porque esas acciones afectan los datos de toda la comunidad. Para dar ese rol a otra cuenta:

```sql
UPDATE usuarios SET rol = 'admin' WHERE correo = 'correo@ejemplo.com';
```

### Probar desde el celular (misma red Wi-Fi)

1. Busca la IP de tu PC (`ipconfig` en Windows), por ejemplo `192.168.1.20`.
2. En `frontend/.env`: `VITE_API_URL="http://192.168.1.20:4000/api"`.
3. En `backend/.env`:
   - `CORS_ORIGIN="http://localhost:3000,http://192.168.1.20:3000"`
   - `URL_PUBLICA_UPLOADS="http://192.168.1.20:4000/uploads"`
4. Reinicia el backend y el frontend, y abre `http://192.168.1.20:3000` en el celular.

> El navegador solo permite el GPS en `localhost` o con HTTPS. Desde el celular por IP la ubicación automática puede no funcionar: el pin se puede mover a mano en el mapa.

## Variables de entorno del backend

| Variable | Descripción |
| --- | --- |
| `DATABASE_URL` | Conexión a MySQL de desarrollo. |
| `DATABASE_URL_TEST` | Base **distinta** usada por `npm test` (se borra y se vuelve a llenar). |
| `JWT_SECRET` | Clave de firma de los tokens (mínimo 32 caracteres). |
| `JWT_EXPIRA_EN` | Duración de la sesión, por ejemplo `7d`. |
| `CORS_ORIGIN` | Orígenes permitidos, separados por coma. |
| `MODO_DEMO` | `true` habilita avanzar estados simulados y restablecer datos. |
| `GEOCODIFICACION_EXTERNA` | `false` evita consultar Nominatim y devuelve coordenadas. |
| `NOMINATIM_USER_AGENT` | Identificación exigida por OpenStreetMap Nominatim. |
| `URL_PUBLICA_UPLOADS` | URL pública de la carpeta de fotos. |
| `DIRECTORIO_UPLOADS` | Carpeta donde se guardan las fotos (por defecto `uploads`, no se versiona). |
| `LIMITE_LOGIN_POR_15_MIN` | Intentos de inicio de sesión por IP cada 15 minutos (10). |
| `LIMITE_REPORTES_POR_HORA` | Reportes por usuario cada hora (20). |

## Reglas de negocio

| Regla | Dónde |
| --- | --- |
| Registro con autorización de tratamiento de datos (Ley 1581 de 2012), correo y usuario únicos, contraseña de 8+ caracteres con letras y números. | `auth.service.ts` |
| La foto es obligatoria y se valida por su contenido real (JPG, PNG o WebP, máximo 5 MB). MySQL guarda solo la URL. | `archivos.service.ts` |
| **Duplicados:** un reporte de la misma categoría, no solucionado, a 30 m o menos se considera duplicado. El usuario puede sumar su confirmación o publicar de todos modos. | `reportes.service.ts` |
| Al publicar, el autor sigue el reporte y cuenta como la primera confirmación "sigue ahí". | `reportes.service.ts` |
| Se avisa a los ciudadanos que han reportado a 1 km o menos (preferencia "reportes cerca"). | `reportes.service.ts` |
| **Confirmaciones:** una por usuario y reporte. Repetir la misma opción la retira y elegir la otra la cambia. | `participacion.service.ts` |
| Con 3 o más "ya fue reparado" se muestra el aviso comunitario y se notifica una sola vez, **sin cambiar el estado**. | `participacion.service.ts` |
| Seguir o dejar de seguir reportes y ciudadanos (operaciones idempotentes). | `participacion.service.ts`, `usuarios.service.ts` |
| Los aportes notifican al autor ("nuevo comentario") y a los seguidores ("respuestas a comentarios"). | `participacion.service.ts` |
| Las notificaciones respetan las preferencias de cada usuario y se agrupan en hoy, ayer y esta semana (hora de Colombia). | `notificaciones.service.ts` |
| **Modo demo** (solo `admin` y con `MODO_DEMO=true`): Reportado → En revisión → En proceso → Solucionado. Se detiene en Solucionado y los mensajes indican que es simulado. | `demo.service.ts` |
| Geocodificación inversa con caché en MySQL y máximo 1 solicitud por segundo a Nominatim. | `geocodificacion.service.ts` |
| Límites de tasa en el inicio de sesión y en la creación de reportes. | `middlewares/limites.ts` |

**Estadísticas del perfil:**

- **Alertas:** confirmaciones enviadas.
- **Zonas:** celdas de ~1 km donde el usuario ha reportado.
- **Incidentes:** reportes creados.
- **Actualizaciones:** aportes publicados.

## API

Todas las rutas empiezan por `/api`. Las rutas privadas requieren `Authorization: Bearer <token>`. Los errores tienen la forma `{ "error": { "codigo": "...", "mensaje": "..." } }`.

| Método | Ruta | Descripción |
| --- | --- | --- |
| POST | `/auth/registro` · `/auth/login` | Crear cuenta / iniciar sesión (con correo o usuario). |
| GET · PUT | `/auth/yo` · `/auth/contrasena` | Perfil de la sesión / cambiar contraseña. |
| GET | `/reportes` · `/reportes/:id` · `/reportes/mios` | Consultar reportes. |
| GET | `/reportes/duplicados?categoria&lat&lng` | Verificar un posible duplicado antes de publicar. |
| POST | `/reportes` (multipart, campo `foto`) | Publicar. Responde 409 `REPORTE_DUPLICADO`, salvo que se envíe `forzar=true`. |
| POST | `/reportes/:id/confirmaciones` | `{ "tipo": "sigue" \| "reparado" }`. |
| POST · DELETE | `/reportes/:id/seguimiento` | Seguir o dejar de seguir un reporte. |
| POST | `/reportes/:id/aportes` (multipart) | Aporte con texto y foto opcional. |
| POST | `/reportes/:id/avanzar-estado` | Modo demostración. |
| PATCH | `/usuarios/yo` (multipart) | Editar perfil y foto. |
| GET | `/usuarios/comunidad` · `/usuarios/seguidos` | Vista Social. |
| POST · DELETE | `/usuarios/:id/seguimiento` | Seguir o dejar de seguir a un ciudadano. |
| GET · PATCH | `/notificaciones` · `/notificaciones/leidas` · `/notificaciones/:id/leida` | Notificaciones. |
| GET · PUT | `/notificaciones/preferencias` | Preferencias de notificación. |
| GET | `/alertas` | Alertas viales (Noticias). |
| GET | `/geocodificacion/inversa?lat&lng` | Dirección aproximada de una coordenada. |
| POST · GET | `/eventos` · `/eventos/resumen?desde=2026-10-01` | Registrar eventos de uso / resumen para las métricas. |
| GET · POST | `/demo` · `/demo/restablecer` | Estado del modo demo / restablecer los datos de prueba. |

### Métricas y código QR

El frontend registra estos eventos de uso:

- `mapa_abierto`
- `marcador_tocado`
- `reporte_iniciado`
- `reporte_paso_completado`
- `reporte_publicado`
- `reporte_seguido`
- `confirmacion_enviada`
- `mis_reportes_abierto`
- `alerta_abierta`

Si la app se abre con `?utm_source=...` (por ejemplo, el QR del afiche apunta a `http://.../?utm_source=qr_afiche`), ese origen se guarda con cada evento. `GET /api/eventos/resumen` devuelve el total y los usuarios distintos por evento.

## Pruebas

Las pruebas usan Vitest y Supertest contra una base MySQL real (`DATABASE_URL_TEST`). Cada regla de negocio tiene al menos una prueba.

1. Agrega `DATABASE_URL_TEST` a `backend/.env` (ver `.env.example`).
2. Si tu contenedor de MySQL ya existía antes de esta versión, crea la base de pruebas una sola vez:
   - **PowerShell:**
     ```powershell
     Get-Content database/init/01-base-pruebas.sql | docker exec -i reporte-vias-mysql mysql -uroot -proot_reportevias
     ```
   - **Bash:**
     ```bash
     docker exec -i reporte-vias-mysql mysql -uroot -proot_reportevias < database/init/01-base-pruebas.sql
     ```
3. Ejecuta las pruebas en `backend/`:
   ```bash
   npm test
   ```
   El comando aplica las migraciones en la base de pruebas, ejecuta los 56 casos y borra las fotos de prueba (`uploads-test/`).

Comprobación de tipos: `npm run lint` en `backend/` y en `frontend/`.

## Datos de la semilla

`npm run prisma:seed` es idempotente: puede ejecutarse varias veces sin duplicar registros. Carga:

- 16 usuarios (4 visibles y 12 de apoyo para confirmaciones).
- 6 categorías con sus subtipos.
- 11 reportes con historial, confirmaciones, seguimientos y aportes.
- 2 alertas viales.
- 6 notificaciones.

Las imágenes de la semilla son ilustraciones neutras de vías (sin incendios ni catástrofes) y se copian a `uploads/seed`. En modo demostración, **Configuración → Restablecer datos de prueba** vuelve a dejar la semilla como al inicio y borra los reportes creados después.
