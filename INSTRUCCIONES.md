# Instrucciones de Instalación y Configuración

## 📦 Paso 1: Instalar Dependencias

Ejecuta el siguiente comando en la raíz del proyecto:

```bash
npm run install-all
```

Esto instalará las dependencias del proyecto principal, del servidor y del cliente.

## 🗄️ Paso 2: Configurar MongoDB

Asegúrate de tener MongoDB instalado y corriendo. Puedes usar MongoDB local o MongoDB Atlas (cloud).

### MongoDB Local:
- Instala MongoDB desde https://www.mongodb.com/try/download/community
- Inicia el servicio de MongoDB

### MongoDB Atlas (Recomendado para desarrollo):
- Crea una cuenta en https://www.mongodb.com/cloud/atlas
- Crea un cluster gratuito
- Obtén la cadena de conexión

## ⚙️ Paso 3: Configurar Variables de Entorno

1. Ve a la carpeta `server/`
2. Crea un archivo `.env` (copia el contenido de `.env.example` si existe, o créalo manualmente)
3. Configura las siguientes variables:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/sistema-auxiliares
# O si usas MongoDB Atlas:
# MONGODB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/sistema-auxiliares

JWT_SECRET=tu_secreto_jwt_muy_seguro_aqui_cambialo
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:5173
```

## 🔔 Paso 4: Configurar Notificaciones Push (Opcional)

Las notificaciones push requieren Firebase Cloud Messaging:

1. Ve a https://console.firebase.google.com/
2. Crea un nuevo proyecto o usa uno existente
3. Ve a "Configuración del proyecto" > "Cuentas de servicio"
4. Haz clic en "Generar nueva clave privada"
5. Descarga el archivo JSON
6. Renombra el archivo a `firebase-service-account.json`
7. Colócalo en la carpeta `server/`

**Nota**: Si no configuras Firebase, el sistema funcionará pero las notificaciones push no se enviarán.

## 🚀 Paso 5: Iniciar la Aplicación

En la raíz del proyecto, ejecuta:

```bash
npm run dev
```

Esto iniciará:
- **Backend**: http://localhost:5000
- **Frontend**: http://localhost:5173

## 👤 Credenciales por Defecto

Al iniciar el servidor por primera vez, se crea automáticamente un usuario administrador:

- **Email**: `admin@sistema.com`
- **Password**: `admin123`

⚠️ **IMPORTANTE**: Cambia la contraseña después del primer inicio de sesión.

## 📱 Uso del Sistema

### Para Administradores:

1. Inicia sesión en http://localhost:5173/login
2. Ve al Dashboard
3. Crea servicios (botón "+" en la lista de servicios)
4. Crea solicitudes de auxiliares (botón "Nueva Solicitud")
5. Genera el código QR (botón "Ver QR") para que los auxiliares accedan

### Para Auxiliares:

1. Escanea el código QR desde la página principal
2. O accede directamente a: http://localhost:5173/auxiliar/acceso
3. Inicia sesión con tus credenciales
4. Verás todas las solicitudes pendientes
5. Puedes asignarte a las solicitudes disponibles

## 🔧 Solución de Problemas

### Error: "Cannot find module"
- Ejecuta `npm run install-all` nuevamente
- Asegúrate de estar en la raíz del proyecto

### Error de conexión a MongoDB
- Verifica que MongoDB esté corriendo
- Revisa la URI en el archivo `.env`
- Si usas MongoDB Atlas, verifica que tu IP esté en la whitelist

### Las notificaciones push no funcionan
- Verifica que el archivo `firebase-service-account.json` esté en `server/`
- Asegúrate de que los auxiliares hayan permitido notificaciones en su navegador
- En producción, necesitas HTTPS para que funcionen las notificaciones

### Error de CORS
- Verifica que `CLIENT_URL` en `.env` coincida con la URL del frontend
- Por defecto debería ser `http://localhost:5173`

## 📝 Notas Adicionales

- El sistema está diseñado para funcionar en dispositivos móviles
- Los auxiliares pueden acceder desde cualquier dispositivo escaneando el QR
- Las notificaciones push funcionan mejor en dispositivos móviles con navegadores modernos
- Para producción, configura HTTPS y actualiza las URLs en `.env`




