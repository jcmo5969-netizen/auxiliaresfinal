# Sistema de Gestión de Auxiliares

Sistema full stack para la gestión de solicitudes de auxiliares en servicios hospitalarios, con notificaciones push y acceso móvil mediante QR.

## 🚀 Características

- **Autenticación y Autorización**: Sistema de usuarios con roles (Administrador y Auxiliar)
- **Gestión de Servicios**: Crear y administrar servicios por piso
- **Solicitudes de Auxiliares**: Crear solicitudes con diferentes tipos de requerimientos (alta, traslado, pabellón, etc.)
- **Código QR**: Generación de QR para acceso móvil de auxiliares
- **Plataforma Móvil**: Interfaz responsive para que los auxiliares vean y asignen solicitudes desde su celular
- **Notificaciones Push**: Notificaciones en tiempo real cuando se crea una nueva solicitud
- **Dashboard**: Panel de control con estadísticas y gestión de solicitudes

## 📋 Requisitos Previos

- Node.js (v16 o superior)
- MongoDB (local o remoto)
- Firebase Cloud Messaging (para notificaciones push - opcional)

## 🛠️ Instalación

1. **Clonar o descargar el proyecto**

2. **Instalar dependencias**:
```bash
npm run install-all
```

3. **Configurar variables de entorno**:
   - Copiar `server/.env.example` a `server/.env`
   - Editar `server/.env` con tus configuraciones:
   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/sistema-auxiliares
   JWT_SECRET=tu_secreto_jwt_muy_seguro_aqui
   JWT_EXPIRE=7d
   CLIENT_URL=http://localhost:5173
   ```

4. **Configurar Firebase (Opcional para notificaciones push)**:
   - Crear un proyecto en Firebase Console
   - Descargar el archivo de credenciales de servicio
   - Guardarlo como `server/firebase-service-account.json`

5. **Iniciar MongoDB**:
   - Asegúrate de que MongoDB esté corriendo

6. **Iniciar la aplicación**:
```bash
npm run dev
```

Esto iniciará:
- Backend en `http://localhost:5000`
- Frontend en `http://localhost:5173`

## 👤 Usuario por Defecto

Al iniciar el servidor por primera vez, se crea automáticamente un usuario administrador:

- **Email**: `admin@sistema.com`
- **Password**: `admin123`

⚠️ **IMPORTANTE**: Cambia la contraseña después del primer inicio de sesión.

## 📱 Uso del Sistema

### Para Administradores:

1. Iniciar sesión con las credenciales de administrador
2. Crear servicios (nombre, piso, descripción)
3. Crear solicitudes de auxiliares desde el dashboard
4. Generar código QR desde el botón "Ver QR" para que los auxiliares accedan
5. Ver todas las solicitudes y su estado

### Para Auxiliares:

1. Escanear el código QR desde la página principal
2. Iniciar sesión (si no están autenticados)
3. Ver todas las solicitudes pendientes
4. Asignarse a solicitudes disponibles
5. Recibir notificaciones push cuando hay nuevas solicitudes

## 🔔 Notificaciones Push

Para habilitar las notificaciones push:

1. Configura Firebase Cloud Messaging
2. Agrega el archivo `firebase-service-account.json` en la carpeta `server/`
3. Los auxiliares deben permitir notificaciones en su navegador
4. El sistema enviará automáticamente notificaciones cuando se cree una nueva solicitud

## 🏗️ Estructura del Proyecto

```
sistema-auxiliares/
├── server/              # Backend (Node.js/Express)
│   ├── models/         # Modelos de MongoDB
│   ├── routes/          # Rutas de la API
│   ├── middleware/      # Middleware (auth, etc.)
│   ├── utils/           # Utilidades
│   └── index.js         # Punto de entrada del servidor
├── client/              # Frontend (React/Vite)
│   ├── src/
│   │   ├── components/  # Componentes React
│   │   ├── pages/       # Páginas
│   │   ├── context/     # Context API
│   │   └── App.jsx      # Componente principal
│   └── package.json
└── package.json         # Scripts principales
```

## 🔐 API Endpoints

### Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/registro` - Registrar usuario (solo admin)
- `GET /api/auth/me` - Obtener usuario actual
- `POST /api/auth/fcm-token` - Guardar token FCM

### Servicios
- `GET /api/servicios` - Listar servicios
- `POST /api/servicios` - Crear servicio (solo admin)
- `PUT /api/servicios/:id` - Actualizar servicio (solo admin)
- `DELETE /api/servicios/:id` - Eliminar servicio (solo admin)

### Solicitudes
- `GET /api/solicitudes` - Listar solicitudes
- `GET /api/solicitudes/pendientes` - Listar pendientes
- `POST /api/solicitudes` - Crear solicitud
- `PUT /api/solicitudes/:id/asignar` - Asignar solicitud
- `PUT /api/solicitudes/:id/estado` - Actualizar estado

### QR
- `GET /api/qr/generar` - Generar código QR

## 🎨 Tecnologías Utilizadas

- **Backend**: Node.js, Express, MongoDB, Mongoose
- **Frontend**: React, Vite, Tailwind CSS
- **Autenticación**: JWT
- **QR Codes**: qrcode, qrcode.react
- **Notificaciones**: Firebase Cloud Messaging
- **UI**: Lucide React (iconos), React Hot Toast (notificaciones)

## 📝 Notas

- El sistema está diseñado para ser responsive y funcionar bien en dispositivos móviles
- Las notificaciones push requieren HTTPS en producción
- Asegúrate de configurar las variables de entorno correctamente
- MongoDB debe estar corriendo antes de iniciar el servidor

## 🐛 Solución de Problemas

- **Error de conexión a MongoDB**: Verifica que MongoDB esté corriendo y la URI sea correcta
- **Notificaciones no funcionan**: Verifica la configuración de Firebase
- **Error de CORS**: Asegúrate de que las URLs en `.env` sean correctas

## 📄 Licencia

ISC




