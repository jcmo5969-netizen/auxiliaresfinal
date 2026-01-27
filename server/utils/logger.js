const { LogActividad } = require('../models');

/**
 * Registra una actividad en el sistema
 * @param {Object} options - Opciones de la actividad
 * @param {number} options.usuarioId - ID del usuario que realiza la acción
 * @param {string} options.accion - Acción realizada (ej: 'crear', 'actualizar', 'eliminar')
 * @param {string} options.entidad - Entidad afectada (ej: 'solicitud', 'usuario', 'servicio')
 * @param {number} options.entidadId - ID de la entidad afectada
 * @param {Object} options.detalles - Detalles adicionales
 * @param {string} options.ip - IP del usuario
 * @param {string} options.userAgent - User agent del navegador
 */
const registrarActividad = async (options) => {
  try {
    await LogActividad.create({
      usuarioId: options.usuarioId || null,
      accion: options.accion,
      entidad: options.entidad,
      entidadId: options.entidadId || null,
      detalles: options.detalles || {},
      ip: options.ip || null,
      userAgent: options.userAgent || null
    });
  } catch (error) {
    console.error('Error registrando actividad:', error);
    // No lanzar error para no interrumpir el flujo principal
  }
};

/**
 * Middleware para registrar automáticamente actividades
 */
const middlewareLogger = (req, res, next) => {
  // Registrar después de que la respuesta se envíe
  const originalSend = res.json;
  res.json = function(data) {
    // Solo registrar si fue exitoso
    if (res.statusCode >= 200 && res.statusCode < 300) {
      // Extraer información de la petición
      const accion = req.method.toLowerCase();
      const entidad = req.path.split('/')[2] || 'general';
      
      registrarActividad({
        usuarioId: req.usuario?.id,
        accion: accion,
        entidad: entidad,
        entidadId: req.params.id ? parseInt(req.params.id) : null,
        detalles: {
          metodo: req.method,
          ruta: req.path,
          body: req.body
        },
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent')
      });
    }
    
    return originalSend.call(this, data);
  };
  
  next();
};

module.exports = {
  registrarActividad,
  middlewareLogger
};



