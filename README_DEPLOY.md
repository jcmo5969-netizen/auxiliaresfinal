# 🚀 Guía Rápida de Deployment

## Deployment en Render (Gratis)

### Requisitos Previos
- Cuenta de GitHub
- Cuenta en [Render.com](https://render.com)

### Pasos Rápidos

1. **Sube tu código a GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/TU_USUARIO/TU_REPO.git
   git push -u origin main
   ```

2. **Crea Base de Datos en Render**
   - New + → PostgreSQL
   - Name: `sistema-auxiliares-db`
   - Plan: Free
   - Guarda las credenciales

3. **Crea Backend en Render**
   - New + → Web Service
   - Conecta tu repo de GitHub
   - Configuración:
     - **Build Command**: `cd server && npm install`
     - **Start Command**: `cd server && node index.js`
   - Variables de entorno:
     ```
     NODE_ENV=production
     PORT=10000
     CLIENT_URL=https://tu-frontend.onrender.com
     JWT_SECRET=tu_secreto_super_seguro_123456
     DB_HOST=<de tu base de datos>
     DB_PORT=5432
     DB_NAME=sistema_auxiliares
     DB_USER=<de tu base de datos>
     DB_PASSWORD=<de tu base de datos>
     ```

4. **Crea Frontend en Render**
   - New + → Static Site
   - Conecta tu repo de GitHub
   - Configuración:
     - **Build Command**: `cd client && npm install && npm run build`
     - **Publish Directory**: `client/dist`
   - Variable de entorno:
     ```
     VITE_API_URL=https://tu-backend.onrender.com
     ```

5. **Actualiza CLIENT_URL en Backend**
   - Ve al servicio backend
   - Actualiza `CLIENT_URL` con la URL de tu frontend

6. **Ejecuta migraciones**
   - Ve al Shell del backend
   - Ejecuta: `cd server && node migrations/add_fecha_programada.js`

¡Listo! Tu app estará en línea.

## URLs Finales
- Frontend: `https://sistema-auxiliares-frontend.onrender.com`
- Backend: `https://sistema-auxiliares-backend.onrender.com`

## Nota Importante
Los servicios gratuitos de Render se "duermen" después de 15 minutos de inactividad. La primera petición puede tardar hasta 50 segundos.

