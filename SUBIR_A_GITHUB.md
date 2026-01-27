# 📤 Guía Rápida: Subir Código a GitHub

## Opción 1: Usando GitHub Desktop (Más Fácil)

### Paso 1: Instalar GitHub Desktop
1. Ve a [desktop.github.com](https://desktop.github.com)
2. Descarga e instala GitHub Desktop
3. Inicia sesión con tu cuenta de GitHub

### Paso 2: Agregar el Repositorio
1. En GitHub Desktop: **File** → **Add Local Repository**
2. Haz clic en **"Choose..."** y selecciona la carpeta: `C:\Users\gestor.cama\Desktop\cursor\sistema auxiliares`
3. Si te pregunta si quieres crear un repositorio, haz clic en **"create a repository"**

### Paso 3: Hacer Commit
1. En la pestaña **"Changes"**, verás todos los archivos
2. En la parte inferior, escribe un mensaje: `"Preparado para deployment en Render"`
3. Haz clic en **"Commit to main"**

### Paso 4: Publicar en GitHub
1. Haz clic en **"Publish repository"** (botón azul arriba)
2. **NO marques** "Keep this code private" (o sí, como prefieras)
3. Haz clic en **"Publish repository"**
4. Espera a que termine

¡Listo! Tu código está en GitHub.

---

## Opción 2: Usando Git desde Terminal

### Paso 1: Instalar Git
1. Ve a [git-scm.com/download/win](https://git-scm.com/download/win)
2. Descarga e instala Git para Windows
3. Durante la instalación, acepta todas las opciones por defecto
4. Reinicia tu terminal después de instalar

### Paso 2: Crear Repositorio en GitHub
1. Ve a [github.com](https://github.com)
2. Haz clic en el botón **"+"** (arriba derecha) → **"New repository"**
3. Nombre: `sistema-auxiliares`
4. **NO marques** "Initialize with README"
5. Haz clic en **"Create repository"**

### Paso 3: Subir el Código
Abre PowerShell en la carpeta del proyecto y ejecuta:

```powershell
# Inicializar Git
git init

# Agregar todos los archivos
git add .

# Hacer commit
git commit -m "Preparado para deployment en Render"

# Conectar con GitHub (reemplaza TU_USUARIO)
git remote add origin https://github.com/TU_USUARIO/sistema-auxiliares.git

# Cambiar a rama main
git branch -M main

# Subir el código
git push -u origin main
```

**Si te pide usuario y contraseña:**
- Usuario: Tu usuario de GitHub
- Contraseña: Usa un **Personal Access Token** (no tu contraseña normal)
  - Ve a: GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
  - Generate new token → Selecciona `repo` → Generate
  - Copia el token y úsalo como contraseña

---

## Opción 3: Subir Archivos Manualmente (Solo si las otras no funcionan)

1. Ve a [github.com](https://github.com)
2. Crea un nuevo repositorio
3. Haz clic en **"uploading an existing file"**
4. Arrastra y suelta todos los archivos de tu proyecto
5. Haz clic en **"Commit changes"**

**⚠️ Nota**: Esta opción no es ideal para proyectos grandes, pero funciona.

---

## Después de Subir a GitHub

Una vez que tu código esté en GitHub:

1. Ve a Render
2. En el servicio backend, haz clic en **"Settings"**
3. En **"Repository"**, haz clic en **"Connect a different repository"**
4. Selecciona tu repositorio `sistema-auxiliares`
5. Render detectará automáticamente el código y hará un nuevo deploy

---

## ¿Cuál Opción Usar?

- **GitHub Desktop**: Más fácil, interfaz visual
- **Git Terminal**: Más control, para usuarios avanzados
- **Subir Manualmente**: Solo si las otras no funcionan

