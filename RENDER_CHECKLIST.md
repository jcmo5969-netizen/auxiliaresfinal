# ✅ Checklist de Deployment en Render

Usa este checklist para asegurarte de que todo esté configurado correctamente.

## 📦 Preparación

- [ ] Código subido a GitHub
- [ ] Repositorio público o privado configurado
- [ ] Cuenta de Render creada
- [ ] Cuenta de GitHub conectada a Render

## 🗄️ Base de Datos PostgreSQL

- [ ] Servicio PostgreSQL creado en Render
- [ ] Plan "Free" seleccionado
- [ ] Credenciales guardadas:
  - [ ] Host
  - [ ] Port
  - [ ] Database name
  - [ ] User
  - [ ] Password
- [ ] Estado: "Available" (verde)

## 🔧 Backend

- [ ] Servicio Web creado
- [ ] Repositorio conectado
- [ ] Configuración:
  - [ ] Name: `sistema-auxiliares-backend`
  - [ ] Root Directory: `server`
  - [ ] Build Command: `npm install`
  - [ ] Start Command: `node index.js`
  - [ ] Plan: "Free"
- [ ] Variables de entorno configuradas:
  - [ ] `NODE_ENV=production`
  - [ ] `PORT=10000`
  - [ ] `CLIENT_URL` (con URL del frontend)
  - [ ] `JWT_SECRET` (secreto seguro)
  - [ ] `DB_HOST` (de la base de datos)
  - [ ] `DB_PORT=5432`
  - [ ] `DB_NAME=sistema_auxiliares`
  - [ ] `DB_USER` (de la base de datos)
  - [ ] `DB_PASSWORD` (de la base de datos)
- [ ] Estado: "Live" (verde)
- [ ] URL del backend copiada

## 🎨 Frontend

- [ ] Servicio Static Site creado
- [ ] Repositorio conectado
- [ ] Configuración:
  - [ ] Name: `sistema-auxiliares-frontend`
  - [ ] Root Directory: `client`
  - [ ] Build Command: `npm install && npm run build`
  - [ ] Publish Directory: `dist`
  - [ ] Plan: "Free"
- [ ] Variable de entorno configurada:
  - [ ] `VITE_API_URL` (con URL del backend)
- [ ] Estado: "Live" (verde)
- [ ] URL del frontend copiada

## 🔄 Actualización de Variables

- [ ] `CLIENT_URL` en backend actualizada con URL real del frontend
- [ ] `VITE_API_URL` en frontend actualizada con URL real del backend
- [ ] Backend reiniciado después de cambios

## 🗃️ Base de Datos

- [ ] Migración ejecutada: `node migrations/add_fecha_programada.js`
- [ ] Conexión verificada exitosamente
- [ ] Usuario administrador creado: `node utils/initializeAdmin.js`

## 🧪 Pruebas

- [ ] Frontend accesible sin errores
- [ ] Backend responde correctamente
- [ ] Login funciona con credenciales de administrador
- [ ] Dashboard carga correctamente
- [ ] Conexión entre frontend y backend funciona
- [ ] Socket.IO funciona (chat en tiempo real)

## 🔒 Seguridad

- [ ] Contraseña de administrador cambiada
- [ ] `JWT_SECRET` es un valor seguro y único
- [ ] Variables de entorno no están expuestas públicamente

## 📊 Monitoreo

- [ ] Logs del backend revisados (sin errores críticos)
- [ ] Logs del frontend revisados (sin errores críticos)
- [ ] Estado de servicios verificado (todos en verde)

## 📝 Documentación

- [ ] URLs finales guardadas:
  - [ ] Frontend: `https://...`
  - [ ] Backend: `https://...`
- [ ] Credenciales guardadas de forma segura
- [ ] Documentación de deployment guardada

---

## 🎉 ¡Deployment Completado!

Si todos los items están marcados, tu aplicación está lista y funcionando en producción.

---

## ⚠️ Recordatorios Importantes

- Los servicios gratuitos se "duermen" después de 15 minutos de inactividad
- La primera petición después de estar dormido puede tardar hasta 50 segundos
- PostgreSQL gratuito tiene 90 días de prueba
- Revisa los logs regularmente para detectar problemas

---

## 🔗 Enlaces Útiles

- Dashboard de Render: [dashboard.render.com](https://dashboard.render.com)
- Documentación de Render: [render.com/docs](https://render.com/docs)
- Tu aplicación: (URL del frontend)

