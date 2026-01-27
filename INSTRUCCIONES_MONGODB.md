# Instrucciones para Configurar MongoDB

El sistema requiere MongoDB para funcionar. Tienes dos opciones:

## Opción 1: MongoDB Atlas (Recomendado - Gratis y Fácil)

1. Ve a https://www.mongodb.com/cloud/atlas
2. Crea una cuenta gratuita
3. Crea un nuevo cluster (gratis)
4. Crea un usuario de base de datos
5. Obtén la cadena de conexión (Connection String)
6. Actualiza el archivo `server/.env` con tu cadena de conexión:

```
MONGODB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/sistema-auxiliares?retryWrites=true&w=majority
```

## Opción 2: MongoDB Local

### Instalación en Windows:

1. Descarga MongoDB Community Server desde: https://www.mongodb.com/try/download/community
2. Instala MongoDB
3. Inicia MongoDB como servicio o manualmente:

```powershell
# Como servicio (recomendado)
net start MongoDB

# O manualmente
mongod --dbpath "C:\data\db"
```

4. El archivo `.env` ya está configurado para usar MongoDB local:
```
MONGODB_URI=mongodb://localhost:27017/sistema-auxiliares
```

## Verificar la Conexión

Una vez que MongoDB esté corriendo, reinicia el servidor y deberías ver:
```
✅ MongoDB conectado
```

Si ves errores, verifica:
- Que MongoDB esté corriendo
- Que la cadena de conexión en `.env` sea correcta
- Que el puerto 27017 no esté bloqueado por el firewall



