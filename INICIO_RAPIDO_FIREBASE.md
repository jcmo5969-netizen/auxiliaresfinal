# 🚀 Inicio Rápido - Configuración de Firebase

## ⚡ Método Automático (5 minutos)

### Paso 1: Preparar Firebase Console

1. **Abre**: https://console.firebase.google.com/
2. **Crea proyecto** (si no tienes uno):
   - Nombre: `sistema-auxiliares`
   - Clic en "Crear proyecto"
   - Espera y haz clic en "Continuar"

3. **Agrega app web**:
   - Clic en ícono `</>` (Web)
   - Apodo: `Sistema Auxiliares`
   - **NO marques** "Firebase Hosting"
   - Clic en "Registrar app"
   - **DEJA ABIERTA** esta página (necesitarás copiar valores)

4. **Obtén VAPID Key**:
   - Configuración del proyecto (⚙️) → Cloud Messaging
   - "Generar par de claves" → **COPIA** la clave

5. **Descarga Service Account**:
   - Configuración del proyecto → Cuentas de servicio
   - "Generar nueva clave privada" → **Descarga** el JSON

### Paso 2: Ejecutar Asistente

```bash
cd server
npm run configurar-firebase
```

El asistente te pedirá:
- Los valores de `firebaseConfig` (los copias de la página que dejaste abierta)
- La VAPID Key (la que copiaste)
- La ruta del archivo JSON descargado

**¡Eso es todo!** El script configurará todo automáticamente.

### Paso 3: Verificar

```bash
npm run verificar-firebase
```

### Paso 4: Reiniciar

```bash
cd ..
npm run dev
```

## ✅ Listo!

Ahora las notificaciones push funcionarán completamente.

---

## 📸 Guía Visual Rápida

### 1. Crear Proyecto
```
Firebase Console → Agregar proyecto → Nombre → Crear
```

### 2. Agregar App Web
```
Proyecto → </> (Web) → Registrar app → Copiar configuración
```

### 3. VAPID Key
```
⚙️ Configuración → Cloud Messaging → Generar par de claves → Copiar
```

### 4. Service Account
```
⚙️ Configuración → Cuentas de servicio → Generar clave → Descargar JSON
```

### 5. Ejecutar Script
```
cd server
npm run configurar-firebase
```

## 🆘 Ayuda

Si el script no funciona, sigue la guía manual en `CONFIGURAR_FIREBASE.md`



