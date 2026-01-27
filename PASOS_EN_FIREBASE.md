# 📍 Pasos Exactos en Firebase Console

## 🎯 Estás aquí: Página de Overview

### PASO 1: Agregar App Web (2 minutos)

1. **Haz clic en el botón azul**: `+ Agregar app` (arriba a la izquierda)

2. **Selecciona el ícono**: `</>` (Web - primera opción)

3. **Completa el formulario**:
   - **Apodo de la app**: `Sistema Auxiliares`
   - **NO marques** "También configurar Firebase Hosting"
   - Haz clic en **"Registrar app"**

4. **Se mostrará la configuración** - Se verá algo así:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIza...",
     authDomain: "sistema-auxiliares.firebaseapp.com",
     projectId: "sistema-auxiliares",
     storageBucket: "sistema-auxiliares.appspot.com",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:abc123"
   };
   ```

5. **COPIA TODO** este objeto (lo necesitarás para el script)

6. Haz clic en **"Siguiente"** y luego **"Continuar en la consola"**

---

### PASO 2: Obtener VAPID Key (1 minuto)

1. **Haz clic en el ícono de engranaje** ⚙️ (arriba a la izquierda, junto al nombre del proyecto)
   - O ve a: **Configuración del proyecto**

2. **Ve a la pestaña**: **"Cloud Messaging"**

3. **Desplázate hasta**: **"Configuración de web push"**

4. **Haz clic en**: **"Generar par de claves"**

5. **Se generará una clave** - Se verá algo así:
   ```
   BGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

6. **COPIA esta clave completa** (la necesitarás para el script)

---

### PASO 3: Descargar Service Account (1 minuto)

1. **Sigue en**: ⚙️ **Configuración del proyecto**

2. **Ve a la pestaña**: **"Cuentas de servicio"**

3. **Haz clic en**: **"Generar nueva clave privada"**

4. **Aparecerá un mensaje** - Haz clic en **"Generar clave"**

5. **Se descargará un archivo JSON** - Normalmente se guarda en:
   - Windows: `C:\Users\TuUsuario\Downloads\`
   - Nombre del archivo: `sistema-auxiliares-firebase-adminsdk-xxxxx.json`

6. **Recuerda dónde se guardó** (necesitarás la ruta completa para el script)

---

## ✅ Cuando tengas todo listo:

1. **La configuración de firebaseConfig** (del Paso 1)
2. **La VAPID Key** (del Paso 2)
3. **La ruta del archivo JSON descargado** (del Paso 3)

Ejecuta el script:

```bash
cd server
npm run configurar-firebase
```

El script te pedirá estos valores y configurará todo automáticamente.

---

## 🆘 Si te pierdes:

- **Para volver a Overview**: Haz clic en "Descripción general" en el menú izquierdo
- **Para Configuración**: Haz clic en el ícono ⚙️ junto al nombre del proyecto
- **Para agregar app**: Busca el botón azul `+ Agregar app` en la parte superior



