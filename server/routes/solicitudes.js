const express = require('express');
const { body, validationResult } = require('express-validator');
const { Solicitud, Servicio, Usuario, Etiqueta, SolicitudEtiqueta } = require('../models');
const { auth } = require('../middleware/auth');
const { enviarNotificacionPush } = require('../utils/notificaciones');
const { registrarCreacion, registrarCambioEstado, registrarAsignacion, registrarActualizacion } = require('../utils/historial');
const { registrarActividad } = require('../utils/logger');
const { Op } = require('sequelize');

const router = express.Router();

// @route   GET /api/solicitudes
// @desc    Obtener todas las solicitudes
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const where = {};
    
    // Si es auxiliar, solo ver sus solicitudes asignadas o pendientes
    if (req.usuario.rol === 'auxiliar') {
      where[Op.or] = [
        { asignadoAId: req.usuario.id },
        { estado: 'pendiente' }
      ];
    }
    
    // Si es personal de enfermería, solo ver solicitudes creadas por el usuario
    if (req.usuario.rol === 'enfermeria') {
      where.solicitadoPorId = req.usuario.id;
    }

    const solicitudes = await Solicitud.findAll({
      where,
      include: [
        { model: Servicio, as: 'servicio', attributes: ['id', 'nombre', 'piso'] },
        { model: Usuario, as: 'solicitadoPor', attributes: ['id', 'nombre', 'email'] },
        { model: Usuario, as: 'asignadoA', attributes: ['id', 'nombre', 'email'], required: false },
        { model: Etiqueta, as: 'etiquetas', attributes: ['id', 'nombre', 'color'], through: { attributes: [] }, required: false }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json(solicitudes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error del servidor' });
  }
});

// @route   GET /api/solicitudes/pendientes
// @desc    Obtener solicitudes pendientes (para auxiliares)
// @access  Private
router.get('/pendientes', auth, async (req, res) => {
  try {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const mañana = new Date(hoy);
    mañana.setDate(mañana.getDate() + 1);

    const solicitudes = await Solicitud.findAll({
      where: { 
        estado: 'pendiente',
        // Incluir solicitudes sin fecha programada O con fecha programada de hoy o anterior
        [Op.and]: [
          { estado: 'pendiente' },
          {
            [Op.or]: [
              { fechaProgramada: null },
              { fechaProgramada: { [Op.lte]: mañana } }
            ]
          },
          {
            [Op.or]: [
              { asignadoAId: null },
              { asignadoAId: { [Op.ne]: req.usuario.id } }
            ]
          }
        ]
      },
      include: [
        { model: Servicio, as: 'servicio', attributes: ['id', 'nombre', 'piso'] },
        { model: Usuario, as: 'solicitadoPor', attributes: ['id', 'nombre', 'email'] }
      ],
      order: [
        ['fechaProgramada', 'ASC NULLS LAST'], // Primero las programadas para hoy
        ['prioridad', 'DESC'],
        ['createdAt', 'DESC']
      ]
    });

    res.json(solicitudes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error del servidor' });
  }
});

// @route   GET /api/solicitudes/mis-asignadas
// @desc    Obtener solicitudes asignadas al auxiliar actual
// @access  Private
router.get('/mis-asignadas', auth, async (req, res) => {
  try {
    const solicitudes = await Solicitud.findAll({
      where: { 
        asignadoAId: req.usuario.id,
        estado: 'en_proceso'
      },
      include: [
        { model: Servicio, as: 'servicio', attributes: ['id', 'nombre', 'piso'] },
        { model: Usuario, as: 'solicitadoPor', attributes: ['id', 'nombre', 'email'] }
      ],
      order: [['fechaAsignacion', 'DESC']]
    });

    res.json(solicitudes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error del servidor' });
  }
});

// @route   GET /api/solicitudes/:id
// @desc    Obtener una solicitud por ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const solicitud = await Solicitud.findByPk(req.params.id, {
      include: [
        { model: Servicio, as: 'servicio', attributes: ['id', 'nombre', 'piso'] },
        { model: Usuario, as: 'solicitadoPor', attributes: ['id', 'nombre', 'email'] },
        { model: Usuario, as: 'asignadoA', attributes: ['id', 'nombre', 'email'], required: false }
      ]
    });

    if (!solicitud) {
      return res.status(404).json({ mensaje: 'Solicitud no encontrada' });
    }

    res.json(solicitud);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error del servidor' });
  }
});

// @route   POST /api/solicitudes
// @desc    Crear una nueva solicitud
// @access  Private
router.post('/', [
  body('tipoRequerimiento').isIn(['alta', 'traslado', 'pabellon', 'otro']).withMessage('Tipo de requerimiento inválido')
], auth, async (req, res) => {
  try {
    // Aceptar tanto 'servicio' como 'servicioId' del frontend
    let servicioId = req.body.servicioId || req.body.servicio;
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errores: errors.array() });
    }

    // Si es personal de enfermería, solo puede crear solicitudes en su servicio
    if (req.usuario.rol === 'enfermeria') {
      // Si no tiene servicioId en el body, usar el del usuario
      if (!servicioId && req.usuario.servicioId) {
        servicioId = req.usuario.servicioId;
      }
      // Validar que el servicioId coincida con el del usuario
      if (req.usuario.servicioId && servicioId !== req.usuario.servicioId) {
        return res.status(403).json({ mensaje: 'Solo puedes crear solicitudes en tu servicio asignado' });
      }
    }
    
    if (!servicioId) {
      return res.status(400).json({ mensaje: 'El servicio es requerido' });
    }

    // Preparar datos para crear la solicitud
    const datosSolicitud = {
      ...req.body,
      servicioId: servicioId,
      solicitadoPorId: req.usuario.id
    };

    // Si hay fechaProgramada, convertirla a Date
    if (req.body.fechaProgramada) {
      datosSolicitud.fechaProgramada = new Date(req.body.fechaProgramada);
    }

    // Normalizar campos de traslado y prioridad inmediata
    if (datosSolicitud.tipoRequerimiento !== 'traslado') {
      datosSolicitud.tipoServicio = null;
      datosSolicitud.tipoTraslado = null;
    }
    if (datosSolicitud.prioridadInmediato && datosSolicitud.prioridad !== 'urgente') {
      datosSolicitud.prioridad = 'urgente';
    }

    const crearSolicitudConRetry = async () => {
      try {
        return await Solicitud.create(datosSolicitud);
      } catch (error) {
        if (error.name === 'SequelizeDatabaseError' && !error._reintentado) {
          // Intentar sincronizar la tabla por si faltan columnas nuevas
          await Solicitud.sync({ alter: true });
          error._reintentado = true;
          return await Solicitud.create(datosSolicitud);
        }
        throw error;
      }
    };

    const solicitud = await crearSolicitudConRetry();

    // Agregar etiquetas si se proporcionan
    if (req.body.etiquetas && Array.isArray(req.body.etiquetas)) {
      for (const etiquetaId of req.body.etiquetas) {
        await SolicitudEtiqueta.findOrCreate({
          where: { solicitudId: solicitud.id, etiquetaId }
        });
      }
    }

    // Cargar solicitud con todas las relaciones
    const solicitudCompleta = await Solicitud.findByPk(solicitud.id, {
      include: [
        { model: Servicio, as: 'servicio', attributes: ['id', 'nombre', 'piso'] },
        { model: Usuario, as: 'solicitadoPor', attributes: ['id', 'nombre', 'email'] },
        { model: Etiqueta, as: 'etiquetas', attributes: ['id', 'nombre', 'color'], through: { attributes: [] }, required: false }
      ]
    });

    // Registrar en historial
    await registrarCreacion(solicitudCompleta, req.usuario.id);

    // Registrar actividad
    await registrarActividad({
      usuarioId: req.usuario.id,
      accion: 'crear',
      entidad: 'solicitud',
      entidadId: solicitud.id,
      detalles: { tipo: solicitud.tipoRequerimiento, prioridad: solicitud.prioridad },
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent')
    });

    // Enviar notificaciones push a todos los auxiliares
    await enviarNotificacionPush(solicitudCompleta);

    // Emitir evento Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.emit('nueva-solicitud', solicitudCompleta);
    }

    res.status(201).json(solicitudCompleta);
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      mensaje: 'Error del servidor',
      ...(process.env.NODE_ENV === 'development' && { detalle: error.message })
    });
  }
});

// @route   PUT /api/solicitudes/:id/asignar
// @desc    Asignar una solicitud a un auxiliar
// @access  Private
router.put('/:id/asignar', auth, async (req, res) => {
  try {
    const solicitudId = req.params.id;
    
    if (!solicitudId || solicitudId === 'undefined') {
      return res.status(400).json({ mensaje: 'ID de solicitud inválido' });
    }

    const solicitud = await Solicitud.findByPk(solicitudId);
    if (!solicitud) {
      return res.status(404).json({ mensaje: 'Solicitud no encontrada' });
    }

    if (solicitud.estado !== 'pendiente') {
      return res.status(400).json({ mensaje: 'La solicitud ya está asignada, en proceso o completada' });
    }

    // Si es auxiliar, solo puede asignarse a sí mismo
    const auxiliarId = req.usuario.rol === 'auxiliar' 
      ? req.usuario.id 
      : req.body.auxiliarId || req.usuario.id;

    const estadoAnterior = solicitud.estado;
    
    const fechaAsignacion = new Date();
    await solicitud.update({
      asignadoAId: auxiliarId,
      estado: 'en_proceso',
      fechaAsignacion: fechaAsignacion
    });

    // Calcular tiempo de respuesta (desde creación hasta asignación)
    if (solicitud.createdAt) {
      const tiempoRespuesta = Math.round((fechaAsignacion - new Date(solicitud.createdAt)) / 60000); // minutos
      await solicitud.update({ tiempoRespuesta });
    }

    // Registrar en historial
    await registrarAsignacion(solicitud.id, req.usuario.id, auxiliarId);
    await registrarCambioEstado(solicitud.id, req.usuario.id, estadoAnterior, 'en_proceso');

    const solicitudCompleta = await Solicitud.findByPk(solicitud.id, {
      include: [
        { model: Servicio, as: 'servicio', attributes: ['id', 'nombre', 'piso'] },
        { model: Usuario, as: 'solicitadoPor', attributes: ['id', 'nombre', 'email'] },
        { model: Usuario, as: 'asignadoA', attributes: ['id', 'nombre', 'email'] }
      ]
    });

    res.json(solicitudCompleta);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error del servidor' });
  }
});

// @route   PUT /api/solicitudes/:id/estado
// @desc    Actualizar estado de una solicitud
// @access  Private
router.put('/:id/estado', [
  body('estado').isIn(['pendiente', 'asignada', 'en_proceso', 'completada', 'cancelada'])
], auth, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errores: errors.array() });
    }

    const solicitud = await Solicitud.findByPk(req.params.id);
    if (!solicitud) {
      return res.status(404).json({ mensaje: 'Solicitud no encontrada' });
    }

    // Verificar permisos: auxiliares solo pueden actualizar sus propias solicitudes
    if (req.usuario.rol === 'auxiliar' && solicitud.asignadoAId !== req.usuario.id) {
      return res.status(403).json({ mensaje: 'No tienes permiso para actualizar esta solicitud' });
    }

    const estadoAnterior = solicitud.estado;
    const updateData = { estado: req.body.estado };
    if (req.body.estado === 'completada') {
      const fechaCompletada = new Date();
      updateData.fechaCompletada = fechaCompletada;
      
      // Calcular tiempo total de completado (desde asignación hasta completado)
      if (solicitud.fechaAsignacion) {
        const tiempoCompletado = Math.round((fechaCompletada - new Date(solicitud.fechaAsignacion)) / 60000); // minutos
        updateData.tiempoCompletado = tiempoCompletado;
      }
    }
    
    await solicitud.update(updateData);
    
    // Registrar cambio de estado en historial
    if (estadoAnterior !== req.body.estado) {
      await registrarCambioEstado(solicitud.id, req.usuario.id, estadoAnterior, req.body.estado);
    }

    const solicitudCompleta = await Solicitud.findByPk(solicitud.id, {
      include: [
        { model: Servicio, as: 'servicio', attributes: ['id', 'nombre', 'piso'] },
        { model: Usuario, as: 'solicitadoPor', attributes: ['id', 'nombre', 'email'] },
        { model: Usuario, as: 'asignadoA', attributes: ['id', 'nombre', 'email'], required: false }
      ]
    });

    res.json(solicitudCompleta);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error del servidor' });
  }
});

module.exports = router;
