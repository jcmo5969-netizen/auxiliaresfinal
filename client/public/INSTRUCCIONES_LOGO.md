# 🏥 Instrucciones para Agregar el Logo del Hospital de Quilpué

## 📋 Pasos para Agregar el Logo

### Paso 1: Preparar la Imagen

1. Asegúrate de tener el logo en formato PNG o SVG
2. Nombre recomendado: `logo-hospital-quilpue.png`
3. Tamaño recomendado: 
   - Ancho: 200-400px
   - Alto: proporcional
   - Formato: PNG con fondo transparente (preferible) o SVG

### Paso 2: Colocar la Imagen

1. Copia el archivo del logo a la carpeta:
   ```
   auxiliares/client/public/logo-hospital-quilpue.png
   ```

2. La ruta en el código ya está configurada como `/logo-hospital-quilpue.png`

### Paso 3: Verificar

1. Inicia el servidor de desarrollo:
   ```bash
   cd auxiliares/client
   npm run dev
   ```

2. Ve a la página de Login o Dashboard
3. Deberías ver el logo del Hospital de Quilpué

## 📁 Estructura de Archivos

```
auxiliares/client/
  └── public/
      └── logo-hospital-quilpue.png  ← Coloca aquí tu logo
```

## 🎨 Personalización

El logo se mostrará en:
- ✅ Página de Login (`/login`)
- ✅ Dashboard (`/dashboard`)
- ✅ Componente Logo reutilizable (`src/components/Logo.jsx`)

## 🔧 Si el Logo No Aparece

1. Verifica que el archivo esté en `public/logo-hospital-quilpue.png`
2. Verifica que el nombre del archivo sea exacto (sin espacios, minúsculas)
3. Verifica que el formato sea PNG, JPG o SVG
4. Si usas otro nombre, actualiza la ruta en:
   - `src/components/Logo.jsx`
   - `src/pages/Login.jsx`
   - `src/pages/Dashboard.jsx`

## 📝 Nota

Si no tienes el logo aún, el sistema mostrará un fallback con las iniciales "HQ" hasta que agregues la imagen.

