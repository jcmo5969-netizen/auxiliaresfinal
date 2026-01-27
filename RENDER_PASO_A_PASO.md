# 🚀 Guía Paso a Paso: Deployment en Render

Esta guía te llevará paso a paso para subir tu aplicación a Render de forma completamente gratuita.

---

## 📋 Requisitos Previos

- ✅ Cuenta de GitHub (gratis)
- ✅ Cuenta en Render (gratis)
- ✅ Tu código funcionando localmente

---

## PASO 1: Preparar el Código en GitHub

### 1.1. Inicializar Git (si no lo has hecho)

Abre tu terminal en la carpeta del proyecto y ejecuta:

```bash
git init
```

### 1.2. Agregar todos los archivos

```bash
git add .
```

### 1.3. Hacer el primer commit

```bash
git commit -m "Preparado para deployment en Render"
```

### 1.4. Crear repositorio en GitHub

1. Ve a [github.com](https://github.com)
2. Haz clic en el botón **"+"** (arriba derecha) → **"New repository"**
3. Nombre del repositorio: `sistema-auxiliares` (o el que prefieras)
4. **NO marques** "Initialize with README"
5. Haz clic en **"Create repository"**

### 1.5. Conectar y subir el código

GitHub te mostrará comandos. Ejecuta estos (reemplaza `TU_USUARIO` con tu usuario):

```bash
git remote add origin https://github.com/TU_USUARIO/sistema-auxiliares.git
git branch -M main
git push -u origin main
```

**Si te pide usuario y contraseña:**
- Usuario: Tu usuario de GitHub
- Contraseña: Usa un **Personal Access Token** (no tu contraseña)
  - Ve a: GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
  - Generate new token → Selecciona `repo` → Generate
  - Copia el token y úsalo como contraseña

---

## PASO 2: Crear Cuenta en Render

### 2.1. Registrarse

1. Ve a [render.com](https://render.com)
2. Haz clic en **"Get Started for Free"**
3. Selecciona **"Sign up with GitHub"**
4. Autoriza Render para acceder a tu cuenta de GitHub

### 2.2. Verificar Email

- Render te enviará un email de verificación
- Haz clic en el enlace del email para verificar tu cuenta

---

## PASO 3: Crear Base de Datos PostgreSQL

### 3.1. Crear el servicio de base de datos

1. En el dashboard de Render, haz clic en el botón **"New +"** (arriba derecha)
2. Selecciona **"PostgreSQL"**

### 3.2. Configurar la base de datos

Completa el formulario:

- **Name**: `sistema-auxiliares-db`
- **Database**: `sistema_auxiliares`
- **User**: `sistema_user`
- **Region**: Elige la más cercana (ej: `Oregon (US West)`)
- **PostgreSQL Version**: `16` (o la más reciente)
- **Plan**: Selecciona **"Free"** (tiene un ícono de "Free" al lado)

### 3.3. Crear y guardar credenciales

1. Haz clic en **"Create Database"**
2. Espera 2-3 minutos mientras Render crea la base de datos
3. Una vez creada, haz clic en el servicio de base de datos
4. Ve a la pestaña **"Connections"** o **"Info"**
5. **IMPORTANTE**: Copia y guarda estas credenciales en un lugar seguro:
   - **Internal Database URL**: `postgresql://usuario:password@host:5432/database`
   - **Host**: `dpg-xxxxx-a.oregon-postgres.render.com`
   - **Port**: `5432`
   - **Database**: `sistema_auxiliares`
   - **User**: `sistema_user`
   - **Password**: `xxxxx` (cópiala, no la podrás ver después)

**⚠️ GUARDA ESTAS CREDENCIALES - Las necesitarás en el siguiente paso**

---

## PASO 4: Crear Servicio Backend

### 4.1. Crear nuevo servicio web

1. En el dashboard de Render, haz clic en **"New +"**
2. Selecciona **"Web Service"**

### 4.2. Conectar repositorio

1. Si es la primera vez, haz clic en **"Connect account"** y autoriza Render
2. Busca tu repositorio `sistema-auxiliares` en la lista
3. Haz clic en **"Connect"** junto a tu repositorio

### 4.3. Configurar el servicio

Completa el formulario:

- **Name**: `sistema-auxiliares-backend`
- **Region**: La misma que elegiste para la base de datos
- **Branch**: `main` (o `master` si usas master)
- **Root Directory**: `server` (importante: solo `server`, no `./server`)
- **Runtime**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `node index.js`
- **Plan**: Selecciona **"Free"**

### 4.4. Configurar Variables de Entorno

Antes de crear el servicio, haz clic en **"Advanced"** y luego en **"Add Environment Variable"**

Agrega estas variables **UNA POR UNA** (haz clic en "Add" después de cada una):

```
NODE_ENV = production
```

```
PORT = 10000
```

```
CLIENT_URL = https://sistema-auxiliares-frontend.onrender.com
```
*(Por ahora usa este nombre, lo actualizarás después con la URL real)*

```
JWT_SECRET = tu_secreto_super_seguro_cambiar_123456789
```
*(Cambia esto por un texto aleatorio largo y seguro)*

```
DB_HOST = <pega aquí el Host de la base de datos del Paso 3>
```

```
DB_PORT = 5432
```

```
DB_NAME = sistema_auxiliares
```

```
DB_USER = sistema_user
```

```
DB_PASSWORD = <pega aquí el Password de la base de datos del Paso 3>
```

### 4.5. Crear el servicio

1. Revisa que todas las variables estén correctas
2. Haz clic en **"Create Web Service"**
3. Render comenzará a construir tu backend (esto puede tardar 3-5 minutos)

### 4.6. Obtener la URL del backend

1. Espera a que el build termine (verás "Live" en verde cuando esté listo)
2. En la parte superior de la página verás la URL: `https://sistema-auxiliares-backend.onrender.com`
3. **Copia esta URL** - La necesitarás para el frontend

**⚠️ Si el build falla:**
- Ve a la pestaña **"Logs"** para ver el error
- Verifica que las variables de entorno estén correctas
- Asegúrate de que `Root Directory` sea `server` (sin punto ni barra)

---

## PASO 5: Crear Servicio Frontend

### 5.1. Crear nuevo sitio estático

1. En el dashboard de Render, haz clic en **"New +"**
2. Selecciona **"Static Site"**

### 5.2. Conectar repositorio

1. Selecciona el mismo repositorio `sistema-auxiliares`
2. Haz clic en **"Connect"**

### 5.3. Configurar el sitio

Completa el formulario:

- **Name**: `sistema-auxiliares-frontend`
- **Branch**: `main` (o `master`)
- **Root Directory**: `client` (importante: solo `client`)
- **Build Command**: `npm install && npm run build`
- **Publish Directory**: `dist` (importante: solo `dist`, no `client/dist`)
- **Plan**: Selecciona **"Free"**

### 5.4. Configurar Variable de Entorno

Antes de crear, haz clic en **"Advanced"** → **"Add Environment Variable"**

Agrega:

```
VITE_API_URL = https://sistema-auxiliares-backend.onrender.com
```
*(Reemplaza con la URL real de tu backend del Paso 4.6)*

### 5.5. Crear el sitio

1. Haz clic en **"Create Static Site"**
2. Render comenzará a construir tu frontend (puede tardar 3-5 minutos)

### 5.6. Obtener la URL del frontend

1. Espera a que el build termine (verás "Live" en verde)
2. En la parte superior verás la URL: `https://sistema-auxiliares-frontend.onrender.com`
3. **Copia esta URL** - Esta es tu aplicación web

---

## PASO 6: Actualizar Variables de Entorno

### 6.1. Actualizar CLIENT_URL en el backend

1. Ve al servicio del backend (`sistema-auxiliares-backend`)
2. Ve a la pestaña **"Environment"**
3. Busca la variable `CLIENT_URL`
4. Haz clic en el ícono de edición (lápiz)
5. Cambia el valor a la URL real de tu frontend: `https://sistema-auxiliares-frontend.onrender.com`
6. Haz clic en **"Save Changes"**
7. Render reiniciará automáticamente el servicio

---

## PASO 7: Ejecutar Migraciones de Base de Datos

### 7.1. Abrir Shell del backend

1. Ve al servicio del backend
2. Haz clic en la pestaña **"Shell"** (en la parte superior)
3. Se abrirá una terminal en tu navegador

### 7.2. Ejecutar migración

En el Shell, ejecuta:

```bash
cd server
node migrations/add_fecha_programada.js
```

Deberías ver un mensaje de éxito.

### 7.3. Verificar conexión

Ejecuta:

```bash
node -e "const {sequelize} = require('./models'); sequelize.authenticate().then(() => console.log('✅ Base de datos conectada')).catch(e => console.error('❌ Error:', e.message))"
```

Si ves "✅ Base de datos conectada", todo está bien.

---

## PASO 8: Crear Usuario Administrador

### 8.1. Ejecutar script de inicialización

En el mismo Shell del backend, ejecuta:

```bash
node utils/initializeAdmin.js
```

Esto creará un usuario administrador con:
- **Email**: `admin@sistema.com`
- **Password**: `admin123`

**⚠️ IMPORTANTE**: Cambia esta contraseña después del primer inicio de sesión.

---

## PASO 9: Probar la Aplicación

### 9.1. Abrir la aplicación

1. Ve a la URL de tu frontend: `https://sistema-auxiliares-frontend.onrender.com`
2. La primera vez puede tardar hasta 50 segundos (el servicio está "dormido")

### 9.2. Iniciar sesión

1. Usa las credenciales del administrador:
   - Email: `admin@sistema.com`
   - Password: `admin123`
2. Si todo funciona, ¡felicidades! 🎉

---

## 🔧 Solución de Problemas Comunes

### El backend muestra "Application Error"

1. Ve a **"Logs"** del backend
2. Busca errores en rojo
3. Verifica:
   - Que las variables de entorno estén correctas
   - Que `DB_HOST`, `DB_USER`, `DB_PASSWORD` sean correctos
   - Que `Root Directory` sea `server` (sin punto ni barra)

### El frontend no se conecta al backend

1. Verifica que `VITE_API_URL` en el frontend tenga la URL correcta del backend
2. Verifica que `CLIENT_URL` en el backend tenga la URL correcta del frontend
3. Asegúrate de que ambos servicios estén "Live" (verde)

### Error 502 Bad Gateway

- Espera 1-2 minutos más (el servicio puede estar iniciando)
- Revisa los logs del servicio
- Verifica que el puerto sea `10000` en las variables de entorno

### La base de datos no se conecta

1. Verifica que la base de datos esté "Available" (verde)
2. Verifica que las credenciales en las variables de entorno sean correctas
3. Asegúrate de que `DB_HOST` no tenga `http://` o `https://`, solo el hostname

### El build falla

1. Ve a **"Logs"** del servicio
2. Busca el error específico
3. Verifica:
   - Que `Root Directory` sea correcto (`server` o `client`)
   - Que `Build Command` sea correcto
   - Que `Publish Directory` sea `dist` (para frontend)

---

## 📝 Checklist Final

Antes de considerar que todo está listo, verifica:

- [ ] Backend está "Live" (verde)
- [ ] Frontend está "Live" (verde)
- [ ] Base de datos está "Available" (verde)
- [ ] Puedes acceder al frontend sin errores
- [ ] Puedes iniciar sesión con el usuario administrador
- [ ] Las variables de entorno están correctas
- [ ] Las migraciones se ejecutaron correctamente

---

## 🎯 URLs Finales

Después de completar todos los pasos, tendrás:

- **Frontend**: `https://sistema-auxiliares-frontend.onrender.com`
- **Backend**: `https://sistema-auxiliares-backend.onrender.com`
- **Base de datos**: Solo accesible desde el backend

---

## ⚠️ Limitaciones del Plan Gratuito

1. **Servicios "dormidos"**: Después de 15 minutos sin uso, los servicios se "duermen"
2. **Primera petición lenta**: La primera petición después de estar dormido puede tardar hasta 50 segundos
3. **Base de datos**: PostgreSQL gratuito tiene 90 días de prueba, luego necesitarás migrar a otra opción gratuita (Supabase, Neon, etc.)
4. **Límites de recursos**: CPU y RAM limitados (suficiente para desarrollo y pruebas)

---

## 🚀 Próximos Pasos

1. **Cambiar contraseña del administrador** después del primer login
2. **Configurar dominio personalizado** (opcional, gratis en Render)
3. **Configurar backups** de la base de datos
4. **Monitorear logs** regularmente

---

## 📞 ¿Necesitas Ayuda?

Si tienes problemas:

1. Revisa los **Logs** de cada servicio
2. Verifica las **Variables de Entorno**
3. Consulta la documentación de Render: [render.com/docs](https://render.com/docs)

---

¡Felicidades! Tu aplicación está ahora en línea y accesible desde cualquier lugar del mundo. 🌍

