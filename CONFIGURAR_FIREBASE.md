# 🔥 Guía Completa para Configurar Firebase Cloud Messaging

Esta guía te ayudará a configurar Firebase para que los auxiliares reciban notificaciones push en sus celulares.

## 📋 Requisitos Previos

- Una cuenta de Google (Gmail)
- Acceso a internet
- 15-20 minutos de tiempo

## 🚀 Paso 1: Crear Proyecto en Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Haz clic en **"Agregar proyecto"** o **"Crear un proyecto"**
3. Ingresa un nombre para tu proyecto (ej: "sistema-auxiliares")
4. Desactiva Google Analytics (opcional, puedes activarlo después)
5. Haz clic en **"Crear proyecto"**
6. Espera a que se cree el proyecto (30-60 segundos)
7. Haz clic en **"Continuar"**

## 📱 Paso 2: Configurar Web App

1. En la página principal de Firebase, haz clic en el ícono de **Web** (`</>`)
2. Registra tu app:
   - **Apodo de la app**: Sistema Auxiliares
   - **También configura Firebase Hosting**: NO (desmarcar)
3. Haz clic en **"Registrar app"**
4. **IMPORTANTE**: Copia la configuración que aparece (firebaseConfig)
5. Haz clic en **"Siguiente"** y luego **"Continuar en la consola"**

## 🔑 Paso 3: Obtener las Claves de Configuración

### 3.1 Configuración del Cliente (Frontend)

La configuración que copiaste en el paso anterior se ve así:

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "tu-proyecto.firebaseapp.com",
  projectId: "tu-proyecto-id",
  storageBucket: "tu-proyecto.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
}
```

### 3.2 Obtener VAPID Key (para notificaciones)

1. En Firebase Console, ve a **Configuración del proyecto** (ícono de engranaje)
2. Ve a la pestaña **"Cloud Messaging"**
3. En **"Configuración de web push"**, haz clic en **"Generar par de claves"**
4. Copia la **"Clave de par"** (VAPID key) - se verá como: `BGxxxxx...`

## 🔐 Paso 4: Configurar Firebase Admin (Backend)

### 4.1 Generar Service Account Key

1. En Firebase Console, ve a **Configuración del proyecto**
2. Ve a la pestaña **"Cuentas de servicio"**
3. Haz clic en **"Generar nueva clave privada"**
4. Se descargará un archivo JSON (ej: `tu-proyecto-firebase-adminsdk-xxxxx.json`)
5. **Renombra este archivo** a: `firebase-service-account.json`
6. **Muévelo** a la carpeta `server/`

## 📝 Paso 5: Actualizar Archivos de Configuración

### 5.1 Actualizar `client/src/utils/firebase.js`

Abre el archivo y reemplaza los valores:

```javascript
const firebaseConfig = {
  apiKey: "TU_API_KEY_AQUI",
  authDomain: "TU_PROYECTO.firebaseapp.com",
  projectId: "TU_PROYECTO_ID",
  storageBucket: "TU_PROYECTO.appspot.com",
  messagingSenderId: "TU_SENDER_ID",
  appId: "TU_APP_ID"
}
```

Y también actualiza:
```javascript
vapidKey: 'TU_VAPID_KEY_AQUI'
```

### 5.2 Verificar archivo `server/firebase-service-account.json`

Asegúrate de que el archivo esté en `server/firebase-service-account.json`

## ✅ Paso 6: Verificar Instalación

1. Reinicia el servidor: `npm run dev`
2. Abre la aplicación en el navegador
3. Inicia sesión como auxiliar
4. Deberías ver un mensaje pidiendo permiso para notificaciones
5. Acepta las notificaciones
6. Crea una solicitud desde el dashboard de administrador
7. El auxiliar debería recibir una notificación

## 🧪 Probar Notificaciones

1. **Como Administrador:**
   - Inicia sesión en el dashboard
   - Crea una nueva solicitud
   - Verifica en la consola del servidor que dice: "✅ Notificaciones enviadas"

2. **Como Auxiliar:**
   - Abre la página de auxiliares en tu celular
   - Acepta los permisos de notificaciones
   - Deberías recibir una notificación cuando se cree una solicitud

## 🔧 Solución de Problemas

### Error: "Firebase no configurado"
- Verifica que `firebase-service-account.json` esté en `server/`
- Verifica que el archivo tenga el formato JSON correcto

### Error: "VAPID key inválido"
- Verifica que copiaste la VAPID key completa
- Asegúrate de que no tenga espacios al inicio o final

### No recibo notificaciones
- Verifica que aceptaste los permisos en el navegador
- Verifica que el navegador soporte notificaciones
- Revisa la consola del navegador para errores
- Verifica que el token FCM se guardó en la base de datos

### Notificaciones solo funcionan en navegador abierto
- Esto es normal para notificaciones web
- Para notificaciones cuando el navegador está cerrado, necesitas un Service Worker (PWA)

## 📱 Notas Importantes

- Las notificaciones funcionan mejor en Chrome, Edge y Firefox
- En iOS Safari, las notificaciones tienen limitaciones
- Las notificaciones funcionan cuando el navegador está abierto
- Para notificaciones en segundo plano, considera crear una PWA

## 🎯 Próximos Pasos (Opcional)

1. **Crear una PWA** para notificaciones en segundo plano
2. **Configurar Service Worker** para notificaciones offline
3. **Agregar sonidos personalizados** a las notificaciones
4. **Configurar badges** en las notificaciones



