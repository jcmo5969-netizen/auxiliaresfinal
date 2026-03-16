const express = require('express');
const { body, validationResult } = require('express-validator');
const { Solicitud, Servicio, Usuario, Etiqueta, SolicitudEtiqueta } = require('../models');
const { auth } = require('../middleware/auth');
const { enviarNotificacionPush } = require('../utils/notificaciones');
const { registrarCreacion, registrarCambioEstado, registrarAsignacion, registrarCambio } = require('../utils/historial');
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
    
    // Si es personal de enfermería, ver solicitudes de su servicio (piso)
    if (req.usuario.rol === 'enfermeria') {
      if (req.usuario.servicioId) {
        where.servicioId = req.usuario.servicioId;
      } else {
        where.solicitadoPorId = req.usuario.id;
      }
    }

    const rawList = await Solicitud.findAll({
      where,
      distinct: true,
      include: [
        { model: Servicio, as: 'servicio', attributes: ['id', 'nombre', 'piso'] },
        { model: Usuario, as: 'solicitadoPor', attributes: ['id', 'nombre', 'email'] },
        { model: Usuario, as: 'asignadoA', attributes: ['id', 'nombre', 'email'], required: false },
        { model: Etiqueta, as: 'etiquetas', attributes: ['id', 'nombre', 'color'], through: { attributes: [] }, required: false }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Evitar duplicados por el JOIN con etiquetas (belongsToMany)
    const seen = new Set();
    const solicitudes = rawList.filter((s) => {
      const id = s.id;
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
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
    const incluirFuturas = req.query.incluirFuturas === '1' || req.query.incluirFuturas === 'true';
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const mañana = new Date(hoy);
    mañana.setDate(mañana.getDate() + 1);

    const wherePendientes = {
      estado: 'pendiente',
      [Op.or]: [
        { asignadoAId: null },
        { asignadoAId: { [Op.ne]: req.usuario.id } }
      ]
    };
    if (!incluirFuturas) {
      wherePendientes[Op.and] = [
        {
          [Op.or]: [
            { fechaProgramada: null },
            { fechaProgramada: { [Op.lte]: mañana } }
          ]
        }
      ];
    }

    const solicitudes = await Solicitud.findAll({
      where: wherePendientes,
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
  body('tipoRequerimiento').isIn(['alta', 'traslado', 'pabellon', 'otro', 'gescas']).withMessage('Tipo de requerimiento inválido')
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

    // Si hay fechaProgramada, convertirla a Date. "YYYY-MM-DD" como medianoche UTC se ve día anterior en Chile; usar mediodía UTC.
    const rawFecha = req.body.fechaProgramada;
    if (rawFecha && String(rawFecha).trim() !== '' && String(rawFecha) !== 'Invalid date') {
      const str = String(rawFecha).trim();
      const fecha = /^\d{4}-\d{2}-\d{2}$/.test(str)
        ? new Date(str + 'T12:00:00.000Z')  // mediodía UTC = mismo día en cualquier zona
        : new Date(str);
      if (!isNaN(fecha.getTime())) {
        datosSolicitud.fechaProgramada = fecha;
      } else {
        datosSolicitud.fechaProgramada = null;
      }
    } else {
      datosSolicitud.fechaProgramada = null;
    }

    // Normalizar campos de traslado y prioridad inmediata
    if (datosSolicitud.tipoRequerimiento !== 'traslado') {
      datosSolicitud.tipoServicio = null;
      datosSolicitud.tipoTraslado = null;
    }
    if (datosSolicitud.tipoRequerimiento !== 'gescas') {
      datosSolicitud.destinoGescas = null;
    }
    if (datosSolicitud.prioridadInmediato && datosSolicitud.prioridad !== 'urgente') {
      datosSolicitud.prioridad = 'urgente';
    }
    datosSolicitud.precaucionesEstandar = Boolean(req.body.precaucionesEstandar);
    datosSolicitud.tipoPrecaucion = req.body.tipoPrecaucion && String(req.body.tipoPrecaucion).trim() ? String(req.body.tipoPrecaucion).trim() : null;

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

// @route   PUT /api/solicitudes/:id/desasignar
// @desc    El auxiliar se devuelve la solicitud (vuelve a pendiente)
// @access  Private (solo el auxiliar asignado)
router.put('/:id/desasignar', auth, async (req, res) => {
  try {
    const solicitud = await Solicitud.findByPk(req.params.id);
    if (!solicitud) {
      return res.status(404).json({ mensaje: 'Solicitud no encontrada' });
    }
    if (solicitud.estado !== 'en_proceso') {
      return res.status(400).json({ mensaje: 'Solo puedes devolver una solicitud que tengas en proceso' });
    }
    if (solicitud.asignadoAId !== req.usuario.id) {
      return res.status(403).json({ mensaje: 'Solo puedes devolver solicitudes asignadas a ti' });
    }

    const estadoAnterior = solicitud.estado;
    const asignadoAnterior = solicitud.asignadoAId;
    await solicitud.update({
      estado: 'pendiente',
      asignadoAId: null,
      fechaAsignacion: null,
      tiempoRespuesta: null
    });

    await registrarCambioEstado(solicitud.id, req.usuario.id, estadoAnterior, 'pendiente', 'Auxiliar devolvió la solicitud');
    await registrarCambio(solicitud.id, req.usuario.id, 'desasignar', 'asignadoAId', String(asignadoAnterior), null, 'Solicitud devuelta a pendientes');

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

// @route   PUT /api/solicitudes/:id/estado
// @desc    Actualizar estado de una solicitud (opcional: motivoCancelacion si estado es cancelada)
// @access  Private
router.put('/:id/estado', [
  body('estado').isIn(['pendiente', 'asignada', 'en_proceso', 'completada', 'cancelada']),
  body('motivoCancelacion').optional().trim()
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

    if (req.body.estado === 'cancelada') {
      const motivo = req.body.motivoCancelacion && String(req.body.motivoCancelacion).trim();
      if (!motivo) {
        return res.status(400).json({ mensaje: 'Debe indicar el motivo de la cancelación' });
      }
    }

    const estadoAnterior = solicitud.estado;
    const updateData = { estado: req.body.estado };
    if (req.body.estado === 'completada') {
      const fechaCompletada = new Date();
      updateData.fechaCompletada = fechaCompletada;
      if (solicitud.fechaAsignacion) {
        const tiempoCompletado = Math.round((fechaCompletada - new Date(solicitud.fechaAsignacion)) / 60000);
        updateData.tiempoCompletado = tiempoCompletado;
      }
    }
    if (req.body.estado === 'cancelada') {
      updateData.motivoCancelacion = (req.body.motivoCancelacion && String(req.body.motivoCancelacion).trim()) || null;
    } else {
      updateData.motivoCancelacion = null; // limpiar si se reactiva
    }
    // Al pasar a pendiente (p. ej. revertir un "completado" por error), dejar la solicitud disponible de nuevo
    if (req.body.estado === 'pendiente') {
      updateData.asignadoAId = null;
      updateData.fechaAsignacion = null;
      updateData.fechaCompletada = null;
      updateData.tiempoCompletado = null;
      updateData.tiempoRespuesta = null;
    }

    await solicitud.update(updateData);

    if (estadoAnterior !== req.body.estado) {
      const descripcionAdicional = req.body.estado === 'cancelada' && updateData.motivoCancelacion
        ? `Motivo: ${updateData.motivoCancelacion}`
        : null;
      await registrarCambioEstado(solicitud.id, req.usuario.id, estadoAnterior, req.body.estado, descripcionAdicional);
    }

    // Actualizar estadísticas en tiempo real al completar o al revertir a pendiente
    if (req.body.estado === 'completada' || req.body.estado === 'pendiente') {
      try {
        const io = req.app.get('io');
        const { calcularEstadisticas } = require('../utils/estadisticas');
        const estadisticas = await calcularEstadisticas();
        if (io) io.to('estadisticas').emit('estadisticas-actualizadas', estadisticas);
      } catch (e) {
        console.error('Error emitiendo estadísticas:', e);
      }
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

// @route   PUT /api/solicitudes/:id
// @desc    Modificar datos de una solicitud (servicio, prioridad, descripción, etc.)
// @access  Private (solo administrador o personal de enfermería)
router.put('/:id', [
  body('tipoRequerimiento').optional().isIn(['alta', 'traslado', 'pabellon', 'otro', 'gescas']),
  body('prioridad').optional().isIn(['baja', 'media', 'alta', 'urgente'])
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

    const puedeModificar =
      req.usuario.rol === 'administrador' ||
      req.usuario.rol === 'enfermeria';

    if (!puedeModificar) {
      return res.status(403).json({ mensaje: 'No tienes permiso para modificar esta solicitud' });
    }

    const updateData = {};
    const servicioId = req.body.servicioId ?? req.body.servicio;
    if (servicioId !== undefined) updateData.servicioId = servicioId ? Number(servicioId) : null;
    if (req.body.tipoRequerimiento !== undefined) updateData.tipoRequerimiento = req.body.tipoRequerimiento;
    if (req.body.destinoGescas !== undefined) updateData.destinoGescas = req.body.destinoGescas || null;
    if (req.body.descripcion !== undefined) updateData.descripcion = req.body.descripcion || null;
    if (req.body.tipoServicio !== undefined) updateData.tipoServicio = req.body.tipoServicio || null;
    if (req.body.tipoTraslado !== undefined) updateData.tipoTraslado = req.body.tipoTraslado || null;
    if (req.body.prioridadInmediato !== undefined) {
      updateData.prioridadInmediato = Boolean(req.body.prioridadInmediato);
      if (updateData.prioridadInmediato) updateData.prioridad = 'urgente';
    }
    if (req.body.cama !== undefined) updateData.cama = req.body.cama || null;
    if (req.body.prioridad !== undefined) updateData.prioridad = req.body.prioridad;
    if (req.body.fechaProgramada !== undefined) {
      const raw = req.body.fechaProgramada && String(req.body.fechaProgramada).trim();
      if (raw) {
        const fecha = /^\d{4}-\d{2}-\d{2}$/.test(raw) ? new Date(raw + 'T12:00:00.000Z') : new Date(raw);
        updateData.fechaProgramada = !isNaN(fecha.getTime()) ? fecha : null;
      } else {
        updateData.fechaProgramada = null;
      }
    }
    if (req.body.precaucionesEstandar !== undefined) updateData.precaucionesEstandar = Boolean(req.body.precaucionesEstandar);
    if (req.body.tipoPrecaucion !== undefined) updateData.tipoPrecaucion = req.body.tipoPrecaucion || null;

    if (updateData.tipoRequerimiento && updateData.tipoRequerimiento !== 'traslado') {
      updateData.tipoServicio = null;
      updateData.tipoTraslado = null;
    }
    if (updateData.tipoRequerimiento && updateData.tipoRequerimiento !== 'gescas') {
      updateData.destinoGescas = null;
    }

    await solicitud.update(updateData);

    const solicitudCompleta = await Solicitud.findByPk(solicitud.id, {
      include: [
        { model: Servicio, as: 'servicio', attributes: ['id', 'nombre', 'piso'] },
        { model: Usuario, as: 'solicitadoPor', attributes: ['id', 'nombre', 'email'] },
        { model: Usuario, as: 'asignadoA', attributes: ['id', 'nombre', 'email'], required: false },
        { model: Etiqueta, as: 'etiquetas', attributes: ['id', 'nombre', 'color'], through: { attributes: [] }, required: false }
      ]
    });

    await registrarCambio(
      solicitud.id,
      req.usuario.id,
      'actualizar',
      null,
      null,
      null,
      `Solicitud modificada: ${Object.keys(updateData).join(', ')}`
    );

    res.json(solicitudCompleta);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error del servidor' });
  }
});

module.exports = router;
