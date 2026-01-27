# 🤖 Configuración Automática de Firebase

## 🚀 Método Rápido (Recomendado)

Ejecuta el asistente interactivo que te guiará paso a paso:

```bash
cd server
node scripts/configurarFirebase.js
```

El asistente te pedirá:
1. Las credenciales de Firebase (las copias desde Firebase Console)
2. La VAPID Key
3. La ruta del archivo Service Account

**Todo se configurará automáticamente** ✨

## 📋 Pasos Previos (Antes de ejecutar el script)

### 1. Crear Proyecto en Firebase (2 minutos)

1. Ve a: https://console.firebase.google.com/
2. Haz clic en **"Agregar proyecto"** o **"Crear un proyecto"**
3. Nombre: `sistema-auxiliares` (o el que prefieras)
4. Desactiva Google Analytics (opcional)
5. Haz clic en **"Crear proyecto"**
6. Espera y haz clic en **"Continuar"**

### 2. Agregar App Web (1 minuto)

1. En la página principal, haz clic en el ícono **`</>`** (Web)
2. Apodo: `Sistema Auxiliares`
3. **NO** marques "También configurar Firebase Hosting"
4. Haz clic en **"Registrar app"**
5. **COPIA** la configuración que aparece (tendrás que usarla en el script)

### 3. Obtener VAPID Key (1 minuto)

1. Ve a: **Configuración del proyecto** (⚙️)
2. Pestaña **"Cloud Messaging"**
3. En **"Configuración de web push"**, haz clic en **"Generar par de claves"**
4. **COPIA** la clave que aparece

### 4. Descargar Service Account (1 minuto)

1. En **Configuración del proyecto** → **"Cuentas de servicio"**
2. Haz clic en **"Generar nueva clave privada"**
3. Se descargará un archivo JSON
4. **Recuerda dónde lo guardaste** (necesitarás la ruta para el script)

## 🎯 Ejecutar el Asistente

Una vez que tengas todo listo:

```bash
cd server
node scripts/configurarFirebase.js
```

El script te pedirá cada valor y configurará todo automáticamente.

## ✅ Verificar

Después de ejecutar el script:

```bash
cd server
npm run verificar-firebase
```

Deberías ver:
- ✅ firebase-service-account.json encontrado
- ✅ firebase.js configurado correctamente

## 🚀 Reiniciar

```bash
npm run dev
```

¡Listo! Las notificaciones push deberían funcionar.

## 🆘 Si algo falla

1. Revisa que copiaste los valores correctamente
2. Verifica que el archivo Service Account esté en `server/`
3. Revisa `CONFIGURAR_FIREBASE.md` para la guía manual



