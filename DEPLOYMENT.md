# Guía de Deployment Gratuito

Esta guía te ayudará a subir tu aplicación a servicios de hosting gratuitos.

## Opción 1: Render (Recomendado - Gratis)

Render ofrece hosting gratuito para frontend, backend y base de datos PostgreSQL.

### Paso 1: Preparar el repositorio

1. Crea una cuenta en [GitHub](https://github.com) si no tienes una
2. Crea un nuevo repositorio
3. Sube tu código al repositorio:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/TU_REPOSITORIO.git
git push -u origin main
```

### Paso 2: Crear cuenta en Render

1. Ve a [render.com](https://render.com)
2. Regístrate con tu cuenta de GitHub
3. Conecta tu cuenta de GitHub con Render

### Paso 3: Crear Base de Datos PostgreSQL

1. En el dashboard de Render, haz clic en "New +"
2. Selecciona "PostgreSQL"
3. Configura:
   - **Name**: `sistema-auxiliares-db`
   - **Database**: `sistema_auxiliares`
   - **User**: `sistema_user`
   - **Plan**: Free
4. Haz clic en "Create Database"
5. **IMPORTANTE**: Guarda las credenciales que te muestra (las necesitarás después)

### Paso 4: Crear Servicio Backend

1. En el dashboard, haz clic en "New +"
2. Selecciona "Web Service"
3. Conecta tu repositorio de GitHub
4. Configura:
   - **Name**: `sistema-auxiliares-backend`
   - **Environment**: Node
   - **Build Command**: `cd server && npm install`
   - **Start Command**: `cd server && node index.js`
   - **Plan**: Free
5. En "Environment Variables", agrega:
   ```
   NODE_ENV=production
   PORT=10000
   CLIENT_URL=https://sistema-auxiliares-frontend.onrender.com
   JWT_SECRET=tu_secreto_jwt_muy_seguro_cambiar_en_produccion_123456789
   DB_HOST=<el host de tu base de datos PostgreSQL>
   DB_PORT=5432
   DB_NAME=sistema_auxiliares
   DB_USER=<el usuario de tu base de datos>
   DB_PASSWORD=<la contraseña de tu base de datos>
   ```
6. Haz clic en "Create Web Service"
7. Espera a que el build termine y copia la URL del backend (ej: `https://sistema-auxiliares-backend.onrender.com`)

### Paso 5: Crear Servicio Frontend

1. En el dashboard, haz clic en "New +"
2. Selecciona "Static Site"
3. Conecta tu repositorio de GitHub
4. Configura:
   - **Name**: `sistema-auxiliares-frontend`
   - **Build Command**: `cd client && npm install && npm run build`
   - **Publish Directory**: `client/dist`
   - **Plan**: Free
5. En "Environment Variables", agrega:
   ```
   VITE_API_URL=https://sistema-auxiliares-backend.onrender.com
   ```
   (Reemplaza con la URL real de tu backend)
6. Haz clic en "Create Static Site"
7. Espera a que el build termine y copia la URL del frontend

### Paso 6: Actualizar Variables de Entorno

1. Ve al servicio del backend en Render
2. En "Environment", actualiza `CLIENT_URL` con la URL de tu frontend
3. Guarda los cambios (Render reiniciará automáticamente)

### Paso 7: Ejecutar Migraciones de Base de Datos

1. Ve al servicio del backend en Render
2. Haz clic en "Shell"
3. Ejecuta:
```bash
cd server
node migrations/add_fecha_programada.js
```

### Paso 8: Crear Usuario Administrador

1. Ve al servicio del backend en Render
2. Haz clic en "Shell"
3. Ejecuta:
```bash
cd server
node utils/initializeAdmin.js
```

## Opción 2: Vercel (Frontend) + Render (Backend)

### Frontend en Vercel

1. Ve a [vercel.com](https://vercel.com)
2. Conecta tu cuenta de GitHub
3. Importa tu repositorio
4. Configura:
   - **Framework Preset**: Vite
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Agrega variable de entorno:
   ```
   VITE_API_URL=https://tu-backend.onrender.com
   ```
6. Haz clic en "Deploy"

### Backend en Render

Sigue los pasos 3-4 y 6-8 de la Opción 1.

## Opción 3: Netlify (Frontend) + Railway (Backend)

### Frontend en Netlify

1. Ve a [netlify.com](https://netlify.com)
2. Conecta tu cuenta de GitHub
3. "New site from Git"
4. Selecciona tu repositorio
5. Configura:
   - **Base directory**: `client`
   - **Build command**: `npm run build`
   - **Publish directory**: `client/dist`
6. Agrega variable de entorno:
   ```
   VITE_API_URL=https://tu-backend.railway.app
   ```
7. Haz clic en "Deploy site"

### Backend en Railway

1. Ve a [railway.app](https://railway.app)
2. Conecta tu cuenta de GitHub
3. "New Project" → "Deploy from GitHub repo"
4. Selecciona tu repositorio
5. Configura:
   - **Root Directory**: `server`
   - **Start Command**: `node index.js`
6. Agrega PostgreSQL como servicio adicional
7. Configura las variables de entorno similares a Render

## Variables de Entorno Necesarias

### Backend (.env)
```
NODE_ENV=production
PORT=10000
CLIENT_URL=https://tu-frontend.onrender.com
JWT_SECRET=tu_secreto_jwt_muy_seguro_cambiar_en_produccion
DB_HOST=tu-host-postgresql
DB_PORT=5432
DB_NAME=sistema_auxiliares
DB_USER=tu_usuario
DB_PASSWORD=tu_contraseña
```

### Frontend
```
VITE_API_URL=https://tu-backend.onrender.com
```

## Notas Importantes

1. **Render Free Tier**: Los servicios gratuitos se "duermen" después de 15 minutos de inactividad. La primera petición puede tardar hasta 50 segundos en responder.

2. **Base de Datos**: Render ofrece PostgreSQL gratuito con 90 días de prueba. Después puedes usar:
   - [Supabase](https://supabase.com) (gratis)
   - [Neon](https://neon.tech) (gratis)
   - [ElephantSQL](https://www.elephantsql.com) (gratis con limitaciones)

3. **Dominio Personalizado**: Puedes agregar un dominio personalizado en Render (gratis).

4. **WebSockets**: Render soporta WebSockets, así que Socket.IO funcionará correctamente.

5. **Archivos Estáticos**: Si necesitas subir archivos, considera usar:
   - [Cloudinary](https://cloudinary.com) (gratis)
   - [AWS S3](https://aws.amazon.com/s3) (con free tier)

## Solución de Problemas

### El backend no se conecta a la base de datos
- Verifica que las variables de entorno estén correctamente configuradas
- Asegúrate de que la base de datos esté en la misma región que el backend

### El frontend no puede conectarse al backend
- Verifica que `VITE_API_URL` esté configurada correctamente
- Asegúrate de que el backend esté corriendo y accesible
- Verifica los CORS en el backend

### Error 502 Bad Gateway
- Espera unos minutos, el servicio puede estar iniciando
- Revisa los logs del servicio en Render
- Verifica que el puerto esté configurado correctamente (Render usa el puerto de la variable PORT)

## URLs de Ejemplo

Después del deployment, tus URLs serán algo como:
- Frontend: `https://sistema-auxiliares-frontend.onrender.com`
- Backend: `https://sistema-auxiliares-backend.onrender.com`
- Base de datos: Solo accesible desde el backend

¡Listo! Tu aplicación estará disponible en internet de forma gratuita.

