const jwt = require('jsonwebtoken');
const { Usuario, Servicio } = require('../models');
const { send500 } = require('../utils/sendError');

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
    
    // Cargar usuario con servicio si es enfermería
    const includeOptions = decoded.rol === 'enfermeria' 
      ? [{ model: Servicio, as: 'servicio', attributes: ['id', 'nombre', 'piso'], required: false }]
      : [];
    
    let usuario;
    try {
      usuario = await Usuario.findByPk(decoded.id, {
        attributes: { exclude: ['password'] },
        include: includeOptions
      });
    } catch (dbErr) {
      console.error(
        'auth: findByPk con include falló, reintentando sin include:',
        dbErr.parent?.message || dbErr.message
      );
      usuario = await Usuario.findByPk(decoded.id, {
        attributes: { exclude: ['password'] }
      });
    }
    
    if (!usuario || !usuario.activo) {
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
