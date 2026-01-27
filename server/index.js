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
// Configurar CORS para producción
const corsOptions = {
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// Connect to PostgreSQL
const connectDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ PostgreSQL conectado');
    
    // Sincronizar modelos (crear tablas si no existen)
    // Usar alter: true para crear nuevas tablas sin modificar las existentes
    await sequelize.sync({ alter: true });
    console.log('✅ Modelos sincronizados (tablas creadas/verificadas)');
    
    // Inicializar usuario admin
    const initializeAdmin = require('./utils/initializeAdmin');
    await initializeAdmin();
  } catch (err) {
    console.error('❌ Error conectando a PostgreSQL:', err.message);
    
    if (err.name === 'SequelizeConnectionError') {
      if (err.original && err.original.code === '3D000') {
        console.error('   La base de datos no existe. Ejecuta: npm run create-db');
      } else if (err.original && err.original.code === '28P01') {
        console.error('   Error de autenticación. Verifica usuario y contraseña en .env');
      } else {
        console.error('   Verifica que PostgreSQL esté corriendo');
      }
    }
    
    console.error('   Host:', process.env.DB_HOST || 'localhost');
    console.error('   Puerto:', process.env.DB_PORT || 5432);
    console.error('   Base de datos:', process.env.DB_NAME || 'sistema_auxiliares');
    console.error('   Usuario:', process.env.DB_USER || 'postgres');
    // No salir del proceso, permitir que el servidor siga corriendo
    // pero las rutas verificarán la conexión
  }
};

connectDatabase();

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

// Configuración para Render y otros servicios de hosting
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
const server = app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});

// Configurar Socket.IO para chat en tiempo real
const { Server } = require('socket.io');
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

// Manejar conexiones Socket.IO
io.on('connection', (socket) => {
  console.log('✅ Usuario conectado:', socket.id);

  // Unirse a una sala de solicitud
  socket.on('unirse-solicitud', (solicitudId) => {
    socket.join(`solicitud-${solicitudId}`);
    console.log(`Usuario ${socket.id} se unió a solicitud ${solicitudId}`);
  });

  // Salir de una sala de solicitud
  socket.on('salir-solicitud', (solicitudId) => {
    socket.leave(`solicitud-${solicitudId}`);
  });

  // Unirse a una sala de chat general
  socket.on('unirse-chat-general', () => {
    socket.join('chat-general');
  });

  // Suscribirse a estadísticas en tiempo real
  socket.on('suscribir-estadisticas', async () => {
    socket.join('estadisticas');
    // Enviar estadísticas iniciales
    try {
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

// Función para calcular estadísticas en tiempo real
async function calcularEstadisticas() {
  try {
    const { Op } = require('sequelize');
    const totalSolicitudes = await Solicitud.count();
    const pendientes = await Solicitud.count({ where: { estado: 'pendiente' } });
    const enProceso = await Solicitud.count({ where: { estado: 'en_proceso' } });
    
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const completadasHoy = await Solicitud.count({
      where: {
        estado: 'completada',
        fechaCompletada: {
          [Op.gte]: hoy
        }
      }
    });

    // Tiempo promedio
    const solicitudesCompletadas = await Solicitud.findAll({
      where: {
        estado: 'completada',
        fechaAsignacion: { [Op.ne]: null },
        fechaCompletada: { [Op.ne]: null }
      },
      attributes: [
        [require('sequelize').fn('AVG', 
          require('sequelize').literal(`EXTRACT(EPOCH FROM ("fecha_completada" - "fecha_asignacion")) / 60`)
        ), 'tiempoPromedio']
      ],
      raw: true
    });

    const tiempoPromedio = solicitudesCompletadas[0]?.tiempoPromedio || 0;

    // Auxiliares activos (con solicitudes asignadas)
    const auxiliaresActivos = await Usuario.count({
      include: [{
        model: Solicitud,
        as: 'solicitudesAsignadas',
        where: { estado: { [Op.in]: ['en_proceso', 'asignada'] } },
        required: true
      }],
      distinct: true
    });

    // Tasa de completación
    const tasaCompletacion = totalSolicitudes > 0 
      ? (completadasHoy / totalSolicitudes) * 100 
      : 0;

    return {
      solicitudesTotales: totalSolicitudes,
      pendientes,
      enProceso,
      completadasHoy,
      tiempoPromedio: Math.round(tiempoPromedio),
      auxiliaresActivos,
      tasaCompletacion: Math.round(tasaCompletacion * 10) / 10
    };
  } catch (error) {
    console.error('Error calculando estadísticas:', error);
    return {
      solicitudesTotales: 0,
      pendientes: 0,
      enProceso: 0,
      completadasHoy: 0,
      tiempoPromedio: 0,
      auxiliaresActivos: 0,
      tasaCompletacion: 0
    };
  }
}

// Emitir estadísticas actualizadas cada 30 segundos
setInterval(async () => {
  try {
    const estadisticas = await calcularEstadisticas();
    io.to('estadisticas').emit('estadisticas-actualizadas', estadisticas);
  } catch (error) {
    console.error('Error actualizando estadísticas:', error);
  }
}, 30000); // Cada 30 segundos

// Exportar io para usar en otras rutas
app.set('io', io);
