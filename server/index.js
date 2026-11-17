const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Cargar variables de entorno desde server/.env antes de cualquier otro módulo
dotenv.config({ path: path.join(__dirname, '.env') });

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const jwt = require('jsonwebtoken');
const { sequelize, Usuario } = require('./models');
const { version } = require('./package.json');

if (!process.env.JWT_SECRET) {
  console.error('ERROR: JWT_SECRET no está definido en las variables de entorno');
  console.error('   Local: crea server/.env a partir de server/.env.example');
  console.error('   Render: agrégalo en Environment (o usa el render.yaml, que lo genera solo)');
  process.exit(1);
}

const esProduccion = process.env.NODE_ENV === 'production';
const app = express();

// Render (y cualquier proxy) entrega la IP real en X-Forwarded-For
app.set('trust proxy', 1);
app.disable('x-powered-by');

// ─── Orígenes permitidos ────────────────────────────────────────────────────
function normalizeOrigin(o) {
  if (!o || typeof o !== 'string') return o;
  return o.trim().replace(/\/$/, '');
}

const allowedOrigins = [
  ...new Set(
    [
      ...String(process.env.CLIENT_URL || '').split(','),
      process.env.RENDER_EXTERNAL_URL, // la propia URL del servicio en Render
      'https://auxiliaresfrontend.onrender.com',
      'https://sistema-auxiliares.com',
      'http://localhost:5173',
      'http://localhost:3000'
    ]
      .filter(Boolean)
      .map(normalizeOrigin)
      .filter(Boolean)
  )
];

function origenPermitido(origin, host) {
  if (!origin) return true; // apps móviles, curl, mismo origen sin cabecera
  const normalizado = normalizeOrigin(origin);
  if (allowedOrigins.includes(normalizado)) return true;
  if (!esProduccion) return true;
  try {
    // Mismo origen: el frontend lo sirve este mismo servidor
    return Boolean(host) && new URL(normalizado).host === host;
  } catch {
    return false;
  }
}

// ─── Middleware ─────────────────────────────────────────────────────────────
app.use(
  helmet({
    // La app usa scripts en línea en index.html y WebSocket; la CSP se deja fuera a propósito
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginEmbedderPolicy: false
  })
);
app.use(compression());
app.use(
  cors((req, callback) => {
    const permitido = origenPermitido(req.header('Origin'), req.header('Host'));
    if (!permitido) console.warn('CORS bloqueado para origen:', req.header('Origin'));
    callback(null, { origin: permitido, credentials: true, optionsSuccessStatus: 200 });
  })
);
app.use(express.json({ limit: '200kb' }));
app.use(express.urlencoded({ extended: true, limit: '200kb' }));

// ─── Salud ──────────────────────────────────────────────────────────────────
// /healthz: lo consulta Render. Responde siempre que el proceso esté vivo, para que
// una caída momentánea de la base de datos no provoque reinicios en cadena.
app.get('/healthz', (req, res) => res.json({ ok: true }));

// /api/health: diagnóstico completo (base de datos y notificaciones)
app.get('/api/health', async (req, res) => {
  const { estadoPush } = require('./utils/push');
  const base = {
    version,
    uptimeSegundos: Math.round(process.uptime()),
    push: estadoPush().listo
  };
  try {
    await sequelize.authenticate();
    res.json({ ok: true, db: true, ...base });
  } catch (e) {
    console.error('GET /api/health — DB no disponible:', e.message);
    res.status(503).json({
      ok: false,
      db: false,
      ...base,
      mensaje: 'No se pudo conectar a la base de datos'
    });
  }
});

// Reinicia el pool de conexiones (útil tras una recuperación de la BD).
// Solo existe si se define RECONNECT_KEY: no hay clave por defecto.
app.post('/api/reconnect', async (req, res) => {
  const esperada = process.env.RECONNECT_KEY;
  const clave = req.headers['x-reconnect-key'];
  if (!esperada || clave !== esperada) {
    return res.status(403).json({ ok: false, mensaje: 'No autorizado' });
  }
  try {
    await sequelize.connectionManager.pool.drain();
    await sequelize.connectionManager.pool.clear();
    await sequelize.authenticate();
    console.log('Pool de conexiones reiniciado');
    res.json({ ok: true, mensaje: 'Pool reconectado' });
  } catch (e) {
    console.error('Error al reconectar pool:', e.message);
    res.status(503).json({ ok: false, mensaje: 'No se pudo reconectar' });
  }
});

// ─── Rutas de la API ────────────────────────────────────────────────────────
app.use('/api/auth/2fa', require('./routes/auth2fa'));
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
app.use('/api/recordatorios', require('./routes/recordatorios'));
app.use('/api/push', require('./routes/push'));

app.use('/api', (req, res) => {
  res.status(404).json({ mensaje: 'Ruta no encontrada' });
});

// ─── Frontend (un solo servicio en Render) ──────────────────────────────────
// Si existe client/dist (lo genera `npm run build`), este servidor también entrega la app.
const dirCliente = path.join(__dirname, '..', 'client', 'dist');
const sirveCliente = fs.existsSync(path.join(dirCliente, 'index.html'));

if (sirveCliente) {
  const SIN_CACHE = new Set(['index.html', 'sw.js', 'manifest.json']);
  app.use(
    express.static(dirCliente, {
      index: false,
      setHeaders(res, archivo) {
        if (SIN_CACHE.has(path.basename(archivo))) {
          // El service worker y el index deben actualizarse en cada despliegue
          res.setHeader('Cache-Control', 'no-cache');
        } else if (archivo.includes(`${path.sep}assets${path.sep}`)) {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        }
      }
    })
  );
  app.get('*', (req, res, next) => {
    if (req.method !== 'GET' || path.extname(req.path)) return next();
    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(path.join(dirCliente, 'index.html'));
  });
}

app.use((req, res) => {
  res.status(404).json({ mensaje: 'Ruta no encontrada' });
});

// Manejo de errores
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ mensaje: 'JSON inválido' });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ mensaje: 'Solicitud demasiado grande' });
  }
  console.error('Error no controlado:', err);
  const status = err.status || 500;
  res.status(status).json({
    mensaje: status >= 500 ? 'Error del servidor' : err.message,
    ...(!esProduccion && { detalle: err.message })
  });
});

const PORT = process.env.PORT || 5000;

// ─── Socket.IO ──────────────────────────────────────────────────────────────
function configurarSockets(server) {
  const { Server } = require('socket.io');
  const io = new Server(server, {
    cors: {
      origin: (origin, callback) => callback(null, origenPermitido(origin, null) || !origin),
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // Solo personal con sesión válida puede conectarse
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('No autorizado'));
      const { id } = jwt.verify(token, process.env.JWT_SECRET);
      const usuario = await Usuario.findByPk(id, {
        attributes: ['id', 'nombre', 'rol', 'servicioId', 'activo']
      });
      if (!usuario || !usuario.activo) return next(new Error('No autorizado'));
      socket.data.usuario = {
        id: usuario.id,
        nombre: usuario.nombre,
        rol: usuario.rol,
        servicioId: usuario.servicioId
      };
      next();
    } catch {
      next(new Error('No autorizado'));
    }
  });

  const emitirConectadosChat = async () => {
    try {
      const sockets = await io.in('chat-general').fetchSockets();
      const vistos = new Map();
      sockets.forEach((s) => {
        const u = s.data.usuario;
        if (u) vistos.set(u.id, { id: u.id, nombre: u.nombre, rol: u.rol });
      });
      io.to('chat-general').emit('usuarios-conectados', [...vistos.values()]);
    } catch (error) {
      console.error('Error listando conectados al chat:', error.message);
    }
  };

  io.on('connection', (socket) => {
    const { id, rol } = socket.data.usuario;
    socket.join(`usuario-${id}`);
    socket.join(`rol-${rol}`);

    socket.on('unirse-solicitud', (solicitudId) => {
      if (/^\d+$/.test(String(solicitudId))) socket.join(`solicitud-${solicitudId}`);
    });

    socket.on('salir-solicitud', (solicitudId) => {
      socket.leave(`solicitud-${solicitudId}`);
    });

    socket.on('unirse-chat-general', () => {
      socket.join('chat-general');
      emitirConectadosChat();
    });

    socket.on('suscribir-estadisticas', async () => {
      socket.join('estadisticas');
      try {
        const { calcularEstadisticas } = require('./utils/estadisticas');
        socket.emit('estadisticas-actualizadas', await calcularEstadisticas());
      } catch (error) {
        console.error('Error enviando estadísticas:', error.message);
      }
    });

    socket.on('disconnect', () => {
      emitirConectadosChat();
    });
  });

  // Estadísticas cada 30 s, solo si alguien las está mirando
  const intervalo = setInterval(async () => {
    try {
      const sala = io.sockets.adapter.rooms.get('estadisticas');
      if (!sala || sala.size === 0) return;
      const { calcularEstadisticas } = require('./utils/estadisticas');
      io.to('estadisticas').emit('estadisticas-actualizadas', await calcularEstadisticas());
    } catch (error) {
      console.error('Error actualizando estadísticas:', error.message);
    }
  }, 30000);
  intervalo.unref();

  return io;
}

// ─── Base de datos ──────────────────────────────────────────────────────────
async function prepararBaseDeDatos() {
  await sequelize.authenticate();
  console.log('PostgreSQL conectado');

  // Por defecto solo se crean las tablas que falten. Las columnas nuevas las agrega
  // ensureSchema. `alter` reescribe tablas completas, así que solo corre si se pide
  // de forma explícita (nunca por accidente contra la base de producción).
  const alter = process.env.DB_SYNC_ALTER === 'true';
  await sequelize.sync(alter ? { alter: true } : {});
  console.log(`Modelos sincronizados${alter ? ' (alter)' : ''}`);

  const ensureSchema = require('./utils/ensureSchema');
  await ensureSchema(sequelize);

  const initializeAdmin = require('./utils/initializeAdmin');
  await initializeAdmin();

  const seedServiciosOnStartup = require('./utils/seedServiciosOnStartup');
  await seedServiciosOnStartup();

  const { inicializarPush } = require('./utils/push');
  await inicializarPush();
}

function explicarErrorBD(err) {
  console.error('Error conectando a PostgreSQL:', err.message);
  const codigo = err.original?.code;
  if (codigo === '3D000') {
    console.error('   La base de datos no existe. Ejecuta: npm run create-db');
  } else if (codigo === '28P01') {
    console.error('   Usuario o contraseña incorrectos. Revisa DATABASE_URL (o DB_USER / DB_PASSWORD).');
  } else if (/terminated unexpectedly|ECONNRESET|ETIMEDOUT/i.test(String(err.message))) {
    console.error('   Conexión cortada. En Render usa la Internal Database URL del mismo equipo que el Web Service.');
    console.error('   Host interno (dpg-…-a): sin SSL. URL externa (*.postgres.render.com): DATABASE_SSL=true.');
  } else {
    console.error('   Verifica que PostgreSQL esté corriendo y que DATABASE_URL sea la del panel de Render.');
  }
  console.error('   El servidor sigue arriba; las rutas responderán cuando la BD vuelva.');
}

// ─── Arranque ───────────────────────────────────────────────────────────────
const startServer = async () => {
  let bdLista = false;
  try {
    await prepararBaseDeDatos();
    bdLista = true;
  } catch (err) {
    explicarErrorBD(err);
  }

  const server = app.listen(PORT, () => {
    console.log(`Servidor v${version} en puerto ${PORT} (${esProduccion ? 'producción' : 'desarrollo'})`);
    console.log(`   Frontend servido por este servidor: ${sirveCliente ? 'sí' : 'no (solo API)'}`);
    console.log(`   Orígenes permitidos: ${allowedOrigins.join(', ')}`);
  });

  const io = configurarSockets(server);
  app.set('io', io);

  const { iniciarAvisosRecordatorios } = require('./utils/recordatoriosJob');
  iniciarAvisosRecordatorios();

  // Ping cada 20 s: si la BD se cae limpia el pool, y cuando vuelve termina la preparación pendiente
  let bdViva = bdLista;
  const ping = setInterval(async () => {
    try {
      await sequelize.authenticate();
      if (!bdViva) {
        console.log('BD reconectada');
        bdViva = true;
      }
      if (!bdLista) {
        await prepararBaseDeDatos();
        bdLista = true;
      }
    } catch (err) {
      if (bdViva) {
        console.warn('BD no disponible, limpiando pool:', err.message);
        bdViva = false;
      }
      try {
        await sequelize.connectionManager.pool.drain();
        await sequelize.connectionManager.pool.clear();
      } catch (_) { /* ignorar errores del pool */ }
    }
  }, 20000);
  ping.unref();

  // Cierre ordenado: Render envía SIGTERM en cada despliegue
  let cerrando = false;
  const cerrar = (senal) => {
    if (cerrando) return;
    cerrando = true;
    console.log(`${senal} recibido, cerrando…`);
    clearInterval(ping);
    io.close();
    server.close(async () => {
      try { await sequelize.close(); } catch (_) { /* ya cerrado */ }
      process.exit(0);
    });
    setTimeout(() => process.exit(0), 10000).unref();
  };
  process.on('SIGTERM', () => cerrar('SIGTERM'));
  process.on('SIGINT', () => cerrar('SIGINT'));
};

process.on('unhandledRejection', (motivo) => {
  console.error('Promesa rechazada sin manejar:', motivo);
});

startServer();
