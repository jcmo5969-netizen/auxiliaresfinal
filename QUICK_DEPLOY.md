# 🚀 Deployment Rápido - 5 Minutos

## Opción Más Rápida: Render

### 1. Sube tu código a GitHub (2 min)
```bash
git init
git add .
git commit -m "Ready for deployment"
git remote add origin https://github.com/TU_USUARIO/TU_REPO.git
git push -u origin main
```

### 2. Crea cuenta en Render (1 min)
- Ve a [render.com](https://render.com)
- Regístrate con GitHub
- Conecta tu cuenta

### 3. Crea Base de Datos (1 min)
1. Click "New +" → "PostgreSQL"
2. Name: `sistema-db`
3. Plan: **Free**
4. Click "Create"
5. **Copia las credenciales** (las necesitarás)

### 4. Crea Backend (1 min)
1. Click "New +" → "Web Service"
2. Conecta tu repo de GitHub
3. Configura:
   - **Name**: `sistema-backend`
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `node index.js`
   - **Plan**: Free
4. En "Environment Variables", agrega:
   ```
   NODE_ENV=production
   PORT=10000
   CLIENT_URL=https://sistema-frontend.onrender.com
   JWT_SECRET=tu_secreto_super_seguro_123456789
   DB_HOST=<del paso 3>
   DB_PORT=5432
   DB_NAME=<del paso 3>
   DB_USER=<del paso 3>
   DB_PASSWORD=<del paso 3>
   ```
5. Click "Create Web Service"
6. **Copia la URL** del backend (ej: `https://sistema-backend.onrender.com`)

### 5. Crea Frontend (1 min)
1. Click "New +" → "Static Site"
2. Conecta tu repo de GitHub
3. Configura:
   - **Name**: `sistema-frontend`
   - **Root Directory**: `client`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
   - **Plan**: Free
4. En "Environment Variables", agrega:
   ```
   VITE_API_URL=<URL del backend del paso 4>
   ```
5. Click "Create Static Site"
6. **Copia la URL** del frontend

### 6. Actualiza Backend (30 seg)
1. Ve al servicio backend
2. En "Environment", actualiza:
   ```
   CLIENT_URL=<URL del frontend del paso 5>
   ```
3. Guarda (se reinicia automáticamente)

### 7. Ejecuta Migraciones (30 seg)
1. Ve al backend → "Shell"
2. Ejecuta:
   ```bash
   node migrations/add_fecha_programada.js
   ```

### 8. Crea Admin (30 seg)
1. En el mismo Shell:
   ```bash
   node utils/initializeAdmin.js
   ```

## ✅ ¡Listo!

Tu app está en:
- Frontend: `https://sistema-frontend.onrender.com`
- Backend: `https://sistema-backend.onrender.com`

## 🔑 Credenciales por Defecto
- Email: `admin@sistema.com`
- Password: `admin123`

## ⚠️ Nota
Los servicios gratuitos se "duermen" después de 15 min sin uso. La primera petición puede tardar ~50 segundos.

