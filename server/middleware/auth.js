const jwt = require('jsonwebtoken');
const { QueryTypes } = require('sequelize');
const { Usuario, Servicio, sequelize } = require('../models');
const { send500 } = require('../utils/sendError');

// Cache de usuarios para no consultar la BD en cada request
// TTL: 60 segundos — suficiente para el polling del dashboard
const _userCache = new Map();
const USER_CACHE_TTL = 60000;

function getCachedUser(userId) {
  const entry = _userCache.get(userId);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) { _userCache.delete(userId); return null; }
  return entry.usuario;
}
function setCachedUser(userId, usuario) {
  _userCache.set(userId, { usuario, expiresAt: Date.now() + USER_CACHE_TTL });
}
// Permite invalidar el cache cuando el usuario cambia (logout, actualización)
function invalidateUserCache(userId) {
  _userCache.delete(userId);
}
module.exports.invalidateUserCache = invalidateUserCache;

/**
 * Carga usuario sin ORM (último recurso si Sequelize revienta al mapear la fila).
 */
async function cargarUsuarioPorSql(userId, cargarServicioEnfermeria) {
  const filas = await sequelize.query(
    `SELECT id, nombre, email, rol, activo, servicio_id AS "servicioId"
     FROM usuarios WHERE id = :id LIMIT 1`,
    { replacements: { id: userId }, type: QueryTypes.SELECT }
  );
  if (!filas || !filas[0]) return null;
  const u = filas[0];
  if (cargarServicioEnfermeria && u.servicioId) {
    const srv = await sequelize.query(
      'SELECT id, nombre, piso FROM servicios WHERE id = :sid LIMIT 1',
      { replacements: { sid: u.servicioId }, type: QueryTypes.SELECT }
    );
    u.servicio = srv && srv[0] ? srv[0] : null;
  }
  return u;
}

const auth = async (req, res, next) => {
  try {
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET no está definido');
      return res.status(500).json({ mensaje: 'Error de configuración del servidor' });
    }

    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ mensaje: 'No hay token, acceso denegado' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    // Usar cache para evitar consultas repetidas a la BD en cada request
    let usuario = getCachedUser(userId);

    if (!usuario) {
      // Cargar usuario con servicio si es enfermería
      const includeOptions = decoded.rol === 'enfermeria'
        ? [{ model: Servicio, as: 'servicio', attributes: ['id', 'nombre', 'piso'], required: false }]
        : [];

      try {
        usuario = await Usuario.findByPk(userId, {
          attributes: { exclude: ['password'] },
          include: includeOptions
        });
      } catch (dbErr) {
        console.error(
          'auth: findByPk con include falló, reintentando sin include:',
          dbErr.parent?.message || dbErr.message
        );
        try {
          usuario = await Usuario.findByPk(userId, {
            attributes: { exclude: ['password'] }
          });
        } catch (dbErr2) {
          console.error(
            'auth: findByPk sin include falló, usando SQL directo:',
            dbErr2.parent?.message || dbErr2.message
          );
          usuario = await cargarUsuarioPorSql(userId, decoded.rol === 'enfermeria');
        }
      }

      if (!usuario) {
        usuario = await cargarUsuarioPorSql(userId, decoded.rol === 'enfermeria');
      }

      if (usuario && usuario.activo !== false && usuario.activo !== 0) {
        setCachedUser(userId, usuario);
      }
    }

    if (!usuario || usuario.activo === false || usuario.activo === 0) {
      return res.status(401).json({ mensaje: 'Usuario no válido o inactivo' });
    }

    req.usuario = usuario;
    next();
  } catch (error) {
    const sqlMsg = error.parent?.message || error.original?.message;
    console.error('Error en middleware auth:', error.message, sqlMsg ? `| SQL: ${sqlMsg}` : '');
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ mensaje: 'Token no válido' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ mensaje: 'Token expirado' });
    }
    return send500(res, error, 'Error en middleware auth');
  }
};

const esAdministrador = (req, res, next) => {
  if (req.usuario.rol !== 'administrador') {
    return res.status(403).json({ mensaje: 'Acceso denegado. Se requieren permisos de administrador' });
  }
  next();
};

module.exports = { auth, esAdministrador };
