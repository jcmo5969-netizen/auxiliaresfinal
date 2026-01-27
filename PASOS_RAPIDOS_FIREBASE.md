# 🚀 Pasos Rápidos para Configurar Firebase

## ⚡ Resumen Ejecutivo (5 minutos)

### 1. Crear Proyecto Firebase
- Ve a: https://console.firebase.google.com/
- Clic en "Agregar proyecto"
- Nombre: `sistema-auxiliares`
- Clic en "Crear proyecto"

### 2. Agregar App Web
- Clic en el ícono `</>` (Web)
- Apodo: `Sistema Auxiliares`
- **COPIA** la configuración que aparece

### 3. Obtener VAPID Key
- Configuración del proyecto → Cloud Messaging
- En "Configuración de web push" → "Generar par de claves"
- **COPIA** la clave generada

### 4. Obtener Service Account
- Configuración del proyecto → Cuentas de servicio
- "Generar nueva clave privada"
- Descarga el JSON
- **Renombra** a `firebase-service-account.json`
- **Mueve** a la carpeta `server/`

### 5. Actualizar Código

**Archivo: `client/src/utils/firebase.js`**
- Reemplaza `firebaseConfig` con los valores copiados
- Reemplaza `VAPID_KEY` con la clave VAPID

**Archivo: `server/firebase-service-account.json`**
- Ya debería estar en la carpeta `server/`

### 6. Reiniciar
```bash
npm run dev
```

## ✅ Verificación

1. Abre la app como auxiliar
2. Deberías ver: "Notificaciones push activadas"
3. Crea una solicitud como admin
4. El auxiliar debería recibir notificación

## 🆘 Si algo falla

Revisa `CONFIGURAR_FIREBASE.md` para la guía completa con capturas y solución de problemas.



