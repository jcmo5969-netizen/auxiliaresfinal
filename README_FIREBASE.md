# 🔥 Configuración de Firebase - Resumen

## ¿Qué necesitas hacer?

### Opción 1: Configuración Rápida (Recomendado)
Sigue los pasos en: **`PASOS_RAPIDOS_FIREBASE.md`** (5 minutos)

### Opción 2: Guía Completa
Sigue los pasos en: **`CONFIGURAR_FIREBASE.md`** (15-20 minutos)

## 📋 Checklist de Configuración

- [ ] Proyecto creado en Firebase Console
- [ ] App web agregada al proyecto
- [ ] `client/src/utils/firebase.js` configurado con tus credenciales
- [ ] VAPID Key obtenida y configurada
- [ ] `firebase-service-account.json` descargado y colocado en `server/`
- [ ] Servidor reiniciado

## ✅ Verificar Configuración

Ejecuta este comando para verificar que todo esté bien:

```bash
cd server
npm run verificar-firebase
```

## 🎯 Resultado Esperado

Una vez configurado correctamente:

1. **Al iniciar el servidor**, deberías ver:
   ```
   ✅ Firebase Admin inicializado
   ```

2. **Al iniciar sesión como auxiliar**, deberías ver:
   ```
   ✅ Token FCM registrado en el servidor
   ```

3. **Al crear una solicitud**, deberías ver en el servidor:
   ```
   ✅ Notificaciones enviadas: X/Y
   ```

4. **El auxiliar recibirá** una notificación push en su celular

## 🆘 Problemas Comunes

### "Firebase no configurado"
- Verifica que `firebase-service-account.json` esté en `server/`
- Ejecuta `npm run verificar-firebase` para diagnosticar

### "Token FCM no se guarda"
- Verifica que el usuario esté autenticado
- Revisa la consola del navegador para errores
- Verifica que la ruta `/api/auth/fcm-token` funcione

### "No recibo notificaciones"
- Acepta los permisos de notificaciones en el navegador
- Verifica que el token FCM se guardó en la base de datos
- Revisa los logs del servidor al crear una solicitud

## 📞 Soporte

Si tienes problemas, revisa:
1. `CONFIGURAR_FIREBASE.md` - Guía completa
2. `PASOS_RAPIDOS_FIREBASE.md` - Pasos rápidos
3. Logs del servidor para mensajes de error



