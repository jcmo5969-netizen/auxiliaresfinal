# Sistema de Auxiliares — Hospital de Quilpué

Aplicación web para que enfermería pida un auxiliar de servicio y los auxiliares reciban el aviso
en su celular, tomen la solicitud y la marquen como finalizada.

- **Enfermería** crea la solicitud (servicio, cama, tipo, prioridad, precauciones).
- **Auxiliares** reciben una notificación en el teléfono —también con la pantalla bloqueada— que dice
  **«Solicitud de auxiliar · Cama 12, piso 3»**, la toman y la finalizan.
- **Administración** ve todo en tiempo real: métricas, calendario, personal, registros y chat.

## Cómo está armado

| Parte | Tecnología | Carpeta |
|---|---|---|
| Frontend | React 18, Vite, Tailwind, instalable como app (PWA) | `client/` |
| Backend | Node.js, Express, Socket.IO | `server/` |
| Base de datos | PostgreSQL con Sequelize | — |
| Notificaciones | Web Push estándar (VAPID), sin Firebase | `server/utils/push.js`, `client/public/sw.js` |

En producción un solo servicio entrega todo: el backend sirve la API y también el frontend compilado.

## Notificaciones en el celular

Las notificaciones llegan con el teléfono bloqueado o la app cerrada. Cada persona debe activarlas
**una vez por dispositivo**; la propia app muestra los pasos.

### iPhone / iPad (iOS 16.4 o superior)

Apple solo entrega notificaciones a apps web que están en la pantalla de inicio:

1. Abrir el sitio en **Safari**.
2. Botón **Compartir** → **Agregar a inicio**.
3. Abrir la app desde el ícono **Auxiliares** e iniciar sesión.
4. Tocar **Activar notificaciones** y aceptar el permiso.

Si se abre desde Safari (sin instalar), iOS no permite notificaciones: la app lo detecta y muestra estos pasos.

### Android

1. Abrir el sitio en **Chrome** e iniciar sesión.
2. Tocar **Activar notificaciones** y aceptar el permiso.
3. Opcional: menú ⋮ → **Agregar a pantalla principal**.

### Comprobar que funciona

- Tras activar, la app envía sola una notificación de prueba. El botón **Enviar prueba** la repite.
- En el panel de administración, la lista de **Personal** muestra quién tiene notificaciones activas
  y quién no las ha activado todavía.
- `GET /api/health` responde `"push": true` cuando el servidor está listo para enviar.
- En los registros del servidor cada envío aparece así: `[push] nueva solicitud #41: 6/7 dispositivo(s)`.

Si a alguien no le llegan: revisar que no tenga **No molestar**, que la app tenga permitidas las
notificaciones en los ajustes del teléfono y, en Android, que Chrome no esté con ahorro de batería.

### Qué avisos se envían

| Evento | Quién lo recibe |
|---|---|
| Nueva solicitud | Todos los auxiliares activos |
| Un auxiliar devuelve la solicitud | El resto de los auxiliares |
| Un auxiliar toma la solicitud | Quien la pidió («Auxiliar en camino») |
| Solicitud completada | Quien la pidió |
| Solicitud cancelada | El auxiliar que la tenía asignada |
| Nuevo comentario | Auxiliar asignado, solicitante y enfermería del servicio |
| Recordatorio | La persona que lo creó |

La notificación muestra cama, piso, servicio y tipo de requerimiento. La descripción libre **no** se
incluye, porque en la pantalla de bloqueo la puede leer cualquiera.

## Desarrollo local

Requisitos: Node.js 20 o superior y PostgreSQL.

```bash
npm run install-all            # instala raíz, server y client
cp server/.env.example server/.env   # completa JWT_SECRET y los datos de tu PostgreSQL local
npm run dev                    # backend en :5000 y frontend en :5173
```

En el primer arranque se crean las tablas, los servicios por defecto y un administrador
(`admin@sistema.com` / `admin123`, o los valores de `ADMIN_EMAIL` / `ADMIN_PASSWORD`).
Cambia esa contraseña en cuanto entres.

> **Cuidado con `server/.env`:** si `DATABASE_URL` apunta a la base de Render, el servidor local
> trabaja sobre los datos reales. Para desarrollar usa una base local.

Pruebas del backend:

```bash
npm test
```

## Despliegue en Render

### Actualizar un despliegue existente (recomendado si ya está en producción)

Conserva la base de datos y los usuarios actuales. En el servicio web del backend:

1. **Settings → Build & Deploy**
   - Root Directory: vacío (raíz del repositorio)
   - Build Command: `npm run render-build`
   - Start Command: `npm start`
   - Health Check Path: `/healthz`
2. **Environment**: verifica `NODE_ENV=production`, `JWT_SECRET` y `DATABASE_URL`
   (la *Internal Database URL* de tu base). Las variables de Firebase ya no se usan y se pueden borrar.
3. Subir los cambios a `main`. Render compila y despliega.

Con esto la URL del backend entrega también la app. Si tenías un *Static Site* aparte para el
frontend puedes seguir usándolo (deja `VITE_API_URL` apuntando al backend y `CLIENT_URL` en el
backend apuntando al sitio) o eliminarlo y usar solo la URL del backend.

Al desplegar esta versión, cada persona debe tocar **Activar notificaciones** una vez
(las suscripciones antiguas de Firebase no sirven con el sistema nuevo).

### Despliegue nuevo desde cero

Render → **New → Blueprint** → elegir el repositorio. El archivo [`render.yaml`](render.yaml) crea el
servicio web y la base de datos, genera `JWT_SECRET` y pide el correo y la clave del administrador.

### Limitaciones del plan gratuito de Render

- **El servicio se duerme** tras 15 minutos sin uso y tarda cerca de un minuto en despertar. La
  primera solicitud después de una pausa se demora ese tiempo en salir. Para un uso clínico real
  conviene el plan de pago más básico, que mantiene el servicio siempre encendido.
- **La base de datos gratuita caduca** a los 30 días. Respáldala antes con `npm run backup`
  (dentro de `server/`) y restáurala con `npm run restore`.

## Variables de entorno

| Variable | Obligatoria | Para qué |
|---|---|---|
| `JWT_SECRET` | Sí | Firma de sesiones |
| `DATABASE_URL` | Sí (en Render) | Conexión a PostgreSQL |
| `NODE_ENV` | Sí (en Render) | `production` |
| `CLIENT_URL` | No | URL del frontend si está en otro dominio (CORS y código QR) |
| `JWT_EXPIRE` | No | Duración de la sesión (por defecto `7d`) |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | No | Administrador inicial |
| `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` | No | Claves push propias (si no, se generan y guardan en la base) |
| `VITE_API_URL` (frontend) | No | URL del backend cuando el frontend se publica aparte |

Detalle completo en [`server/.env.example`](server/.env.example).

## Seguridad

- Contraseñas con bcrypt, sesiones con JWT, bloqueo tras 10 intentos fallidos de login.
- Cabeceras de seguridad (helmet), CORS restringido, sockets solo con sesión válida.
- Cada rol accede solo a lo suyo: enfermería a su servicio, auxiliares a sus solicitudes.
- Las credenciales y los respaldos con datos reales están excluidos del repositorio (`.gitignore`).

## Estructura

```
client/
  public/sw.js               service worker de notificaciones
  public/manifest.json       datos de la app instalable
  src/pages/                 pantallas por rol (auxiliar, enfermería, administración)
  src/components/            componentes; NotificacionesPush.jsx guía la activación
  src/utils/push.js          suscripción del dispositivo
  src/utils/socket.js        actualización en tiempo real
server/
  index.js                   arranque, seguridad, sockets, entrega del frontend
  routes/                    API REST
  models/                    tablas (Sequelize)
  utils/push.js              envío de notificaciones
  utils/textoNotificacion.js textos de las notificaciones
  test/                      pruebas automáticas
render.yaml                  despliegue en Render
```
