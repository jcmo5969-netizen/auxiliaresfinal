const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
// Importar todos los modelos para que Sequelize los registre
const { sequelize, Usuario, Servicio, Solicitud, Comentario, HistorialCambio, PlantillaSolicitud, Etiqueta, LogActividad, Mensaje } = require('./models');

// Cargar variables de entorno desde server/.env
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();

// Middleware
// Normalizar origen (CLIENT_URL a veces trae barra final y falla la comparación)
function normalizeOrigin(o) {
  if (!o || typeof o !== 'string') return o;
  return o.trim().replace(/\/$/, '');
}

// Configurar CORS para producción - aceptar múltiples orígenes
const allowedOrigins = [
  ...new Set(
    [
      process.env.CLIENT_URL,
      'https://auxiliaresfrontend.onrender.com',
      'https://sistema-auxiliares.com',
      'http://localhost:5173',
      'http://localhost:3000'
    ]
      .filter(Boolean)
      .map(normalizeOrigin)
  )
];

const corsOptions = {
  origin: function (origin, callback) {
    // Permitir requests sin origen (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    const normalized = normalizeOrigin(origin);
    const permitido =
      allowedOrigins.includes(normalized) || process.env.NODE_ENV === 'development';

    if (permitido) {
      callback(null, true);
    } else {
      console.warn('⚠️ CORS bloqueado para origen:', origin);
      callback(new Error('No permitido por CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Diagnóstico (sin auth): abre en el navegador o curl para ver si PostgreSQL responde
app.get('/api/health', async (req, res) => {
  try {
    await sequelize.authenticate();
    res.json({ ok: true, db: true });
  } catch (e) {
    console.error('GET /api/health — DB no disponible:', e.message);
    res.status(503).json({
      ok: false,
      db: false,
      mensaje: e.message || 'No se pudo conectar a la base de datos'
    });
  }
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/servicios', require('./routes/servicios'));
app.use('/api/solicitudes', require('./routes/solicitudes'));
app.use('/api/auxiliares', require('./routes/auxiliares'));
app.use('/api/qr', require('./routes/qr'));
app.use('/api/comentarios', require('./routes/comentarios'));
app.use('/api/metricas', require('./routes/metricas'));
app.use('/api/historial', require('./routes/historial'));
app.use('/api/plantillas', require('./routes/plantillas'));
app.use('/api/etiquetas', require('./routes/etiquetas'));
app.use('/api/logs', require('./routes/logs'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/auth/2fa', require('./routes/auth2fa'));
app.use('/api/recordatorios', require('./routes/recordatorios'));

// Verificar variables de entorno críticas
if (!process.env.JWT_SECRET) {
  console.error('❌ ERROR: JWT_SECRET no está definido en las variables de entorno');
  console.error('   Por favor, crea un archivo .env en la carpeta server con JWT_SECRET');
  process.exit(1);
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    mensaje: err.message || 'Error del servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ mensaje: 'Ruta no encontrada' });
});

const PORT = process.env.PORT || 5000;

// Arrancar el servidor solo cuando la BD esté lista
const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ PostgreSQL conectado');

    await sequelize.sync({ alter: true });
    console.log('✅ Modelos sincronizados (tablas creadas/verificadas)');

    const initializeAdmin = require('./utils/initializeAdmin');
    await initializeAdmin();

    const seedServiciosOnStartup = require('./utils/seedServiciosOnStartup');
    await seedServiciosOnStartup();
  } catch (err) {
    console.error('❌ Error conectando a PostgreSQL:', err.message);

    if (err.name === 'SequelizeConnectionError') {
      if (err.original && err.original.code === '3D000') {
        console.error('   La base de datos no existe. Ejecuta: npm run create-db');
      } else if (err.original && err.original.code === '28P01') {
        console.error('   Error de autenticación. Verifica usuario y contraseña.');
        console.error('   Si usas DATABASE_URL, verifica que la contraseña en la URL sea correcta.');
        console.error('   Si usas variables individuales, verifica DB_USER y DB_PASSWORD.');
      } else if (/terminated unexpectedly|ECONNRESET|ETIMEDOUT/i.test(String(err.message))) {
        console.error('   Conexión cortada. En Render: usa la Internal Database URL del mismo equipo que el Web Service.');
        console.error('   Si el host es dpg-…-a (interno), no fuerces SSL: ya está desactivado por defecto, o prueba DATABASE_SSL=false.');
        console.error('   Si usas URL externa (*.postgres.render.com), puedes probar DATABASE_SSL=true en variables de entorno.');
      } else {
        console.error('   Verifica que PostgreSQL esté corriendo y que DATABASE_URL sea la copiada del panel de Render.');
      }
    }

    if (process.env.DATABASE_URL) {
      const dbUrl = process.env.DATABASE_URL.replace(/:[^:@]+@/, ':****@');
      console.error('   DATABASE_URL:', dbUrl);
    } else {
      console.error('   Host:', process.env.DB_HOST || 'localhost');
      console.error('   Puerto:', process.env.DB_PORT || 5432);
      console.error('   Base de datos:', process.env.DB_NAME || 'sistema_auxiliares');
      console.error('   Usuario:', process.env.DB_USER || 'postgres');
      console.error('   Password:', process.env.DB_PASSWORD ? '***configurada***' : 'NO configurada');
    }
    // Continuar aunque falle: el servidor arranca igual para no bloquear Render
    console.error('⚠️  El servidor arrancará sin BD lista. Las rutas pueden fallar hasta que la BD responda.');
  }

  // Iniciar HTTP solo después de intentar la BD
  const server = app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
    console.log(`🌐 CORS permitiendo orígenes: ${allowedOrigins.join(', ')}`);
  });

  // Configurar Socket.IO para chat en tiempo real
  const { Server } = require('socket.io');
  const io = new Server(server, {
    cors: {
      origin: allowedOrigins.length > 0 ? allowedOrigins : (process.env.CLIENT_URL || 'http://localhost:5173'),
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // Manejar conexiones Socket.IO
  io.on('connection', (socket) => {
    console.log('✅ Usuario conectado:', socket.id);

    socket.on('unirse-solicitud', (solicitudId) => {
      socket.join(`solicitud-${solicitudId}`);
      console.log(`Usuario ${socket.id} se unió a solicitud ${solicitudId}`);
    });

    socket.on('salir-solicitud', (solicitudId) => {
      socket.leave(`solicitud-${solicitudId}`);
    });

    socket.on('unirse-chat-general', () => {
      socket.join('chat-general');
    });

    socket.on('suscribir-estadisticas', async () => {
      socket.join('estadisticas');
      try {
        const { calcularEstadisticas } = require('./utils/estadisticas');
        const estadisticas = await calcularEstadisticas();
        socket.emit('estadisticas-actualizadas', estadisticas);
      } catch (error) {
        console.error('Error enviando estadísticas:', error);
      }
    });

    socket.on('disconnect', () => {
      console.log('❌ Usuario desconectado:', socket.id);
    });
  });

  // Emitir estadísticas actualizadas cada 30 segundos
  setInterval(async () => {
    try {
      const { calcularEstadisticas } = require('./utils/estadisticas');
      const estadisticas = await calcularEstadisticas();
      io.to('estadisticas').emit('estadisticas-actualizadas', estadisticas);
    } catch (error) {
      console.error('Error actualizando estadísticas:', error);
    }
  }, 30000);

  // Exportar io para usar en otras rutas
  app.set('io', io);
};

startServer();
