const express = require('express');
const { body, validationResult } = require('express-validator');
const { Solicitud, Servicio, Usuario, Etiqueta, SolicitudEtiqueta, sequelize } = require('../models');
const { auth } = require('../middleware/auth');
const push = require('../utils/push');
const { emitirCambioSolicitud } = require('../utils/tiempoReal');
const { registrarCreacion, registrarCambioEstado, registrarAsignacion, registrarCambio } = require('../utils/historial');
const { registrarActividad } = require('../utils/logger');
const { Op, QueryTypes } = require('sequelize');
const { send500 } = require('../utils/sendError');

const router = express.Router();

/** Texto comparable para detectar solicitudes duplicadas por doble envío */
function normalizarDuplicado(t) {
  return String(t ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function mismoMinutoProgramada(a, b) {
  if (a == null && b == null) return true;
  if (a == null || b == null) return false;
  const ta = a instanceof Date ? a.getTime() : new Date(a).getTime();
  const tb = b instanceof Date ? b.getTime() : new Date(b).getTime();
  if (Number.isNaN(ta) || Number.isNaN(tb)) return false;
  return Math.floor(ta / 60000) === Math.floor(tb / 60000);
}

const INCLUDE_COMPLETO = [
  { model: Servicio, as: 'servicio', attributes: ['id', 'nombre', 'piso'] },
  { model: Usuario, as: 'solicitadoPor', attributes: ['id', 'nombre', 'email'] },
  { model: Usuario, as: 'asignadoA', attributes: ['id', 'nombre', 'email'], required: false }
];

const cargarCompleta = (id, conEtiquetas = false) =>
  Solicitud.findByPk(id, {
    include: conEtiquetas
      ? [
          ...INCLUDE_COMPLETO,
          { model: Etiqueta, as: 'etiquetas', attributes: ['id', 'nombre', 'color'], through: { attributes: [] }, required: false }
        ]
      : INCLUDE_COMPLETO
  });

const texto = (v, max) => {
  if (v == null) return null;
  const t = String(v).trim();
  return t ? t.slice(0, max) : null;
};

const idValido = (v) => /^\d+$/.test(String(v));

/** Enfermería solo puede actuar sobre solicitudes de su servicio (o las que creó). */
function enfermeriaPuedeGestionar(usuario, solicitud) {
  if (usuario.rol !== 'enfermeria') return true;
  if (solicitud.solicitadoPorId === usuario.id) return true;
  return Boolean(usuario.servicioId) && Number(usuario.servicioId) === Number(solicitud.servicioId);
}

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

    const includeBase = [
      { model: Servicio, as: 'servicio', attributes: ['id', 'nombre', 'piso'] },
      { model: Usuario, as: 'solicitadoPor', attributes: ['id', 'nombre', 'email'] },
      { model: Usuario, as: 'asignadoA', attributes: ['id', 'nombre', 'email'], required: false }
    ];

    let rawList;
    try {
      rawList = await Solicitud.findAll({
        where,
        include: [
          ...includeBase,
          { model: Etiqueta, as: 'etiquetas', attributes: ['id', 'nombre', 'color'], through: { attributes: [] }, required: false }
        ],
        order: [['createdAt', 'DESC']]
      });
    } catch (err) {
      console.error(
        'GET /api/solicitudes: fallo con etiquetas, reintentando sin etiquetas:',
        err.parent?.message || err.message
      );
      try {
        rawList = await Solicitud.findAll({
          where,
          include: includeBase,
          order: [['createdAt', 'DESC']]
        });
        rawList.forEach((s) => {
          if (!s.etiquetas) s.setDataValue('etiquetas', []);
        });
      } catch (err2) {
        console.error(
          'GET /api/solicitudes: fallo con joins, listado mínimo (instancias):',
          err2.parent?.message || err2.message
        );
        try {
          rawList = await Solicitud.findAll({
            where,
            order: [['createdAt', 'DESC']],
            limit: 10000
          });
          rawList.forEach((s) => {
            s.setDataValue('etiquetas', []);
          });
        } catch (err3) {
          console.error(
            'GET /api/solicitudes: listado mínimo (raw):',
            err3.parent?.message || err3.message
          );
          try {
            rawList = await Solicitud.findAll({
              where,
              order: [['createdAt', 'DESC']],
              limit: 10000,
              raw: true
            });
            rawList = rawList.map((row) => ({ ...row, etiquetas: [] }));
          } catch (err4) {
            console.error('GET /api/solicitudes: SQL directo (solo admin):', err4.parent?.message || err4.message);
            if (req.usuario.rol === 'administrador' && Object.keys(where).length === 0) {
              const rows = await sequelize.query(
                'SELECT * FROM solicitudes ORDER BY id DESC LIMIT 10000',
                { type: QueryTypes.SELECT }
              );
              return res.json(rows.map((r) => ({ ...r, etiquetas: [] })));
            }
            throw err4;
          }
        }
      }
    }

    if (!Array.isArray(rawList)) {
      rawList = [];
    }

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
    return send500(res, error, 'GET /api/solicitudes');
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
    if (!idValido(req.params.id)) {
      return res.status(400).json({ mensaje: 'ID de solicitud inválido' });
    }
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
  body('tipoRequerimiento').isIn(['alta', 'traslado', 'pabellon', 'otro', 'gescas']).withMessage('Tipo de requerimiento inválido'),
  body('prioridad').optional({ values: 'falsy' }).isIn(['baja', 'media', 'alta', 'urgente']).withMessage('Prioridad inválida')
], auth, async (req, res) => {
  try {
    // Aceptar tanto 'servicio' como 'servicioId' del frontend
    let servicioId = req.body.servicioId || req.body.servicio;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errores: errors.array() });
    }

    if (req.usuario.rol === 'auxiliar') {
      return res.status(403).json({ mensaje: 'Los auxiliares no pueden crear solicitudes' });
    }

    // Si es personal de enfermería, solo puede crear solicitudes en su servicio
    if (req.usuario.rol === 'enfermeria') {
      if (!servicioId && req.usuario.servicioId) {
        servicioId = req.usuario.servicioId;
      }
      if (req.usuario.servicioId && Number(servicioId) !== Number(req.usuario.servicioId)) {
        return res.status(403).json({ mensaje: 'Solo puedes crear solicitudes en tu servicio asignado' });
      }
    }

    if (!servicioId || !idValido(servicioId)) {
      return res.status(400).json({ mensaje: 'El servicio es requerido' });
    }
    servicioId = Number(servicioId);

    const servicio = await Servicio.findByPk(servicioId, { attributes: ['id'] });
    if (!servicio) {
      return res.status(400).json({ mensaje: 'El servicio indicado no existe' });
    }

    // Solo se aceptan estos campos del cliente: estado, asignación y tiempos los controla el servidor
    const datosSolicitud = {
      servicioId,
      solicitadoPorId: req.usuario.id,
      tipoRequerimiento: req.body.tipoRequerimiento,
      descripcion: texto(req.body.descripcion, 2000),
      cama: texto(req.body.cama, 100),
      prioridad: req.body.prioridad || 'media',
      prioridadInmediato: Boolean(req.body.prioridadInmediato),
      tipoServicio: texto(req.body.tipoServicio, 100),
      tipoTraslado: texto(req.body.tipoTraslado, 100),
      destinoGescas: texto(req.body.destinoGescas, 255),
      precaucionesEstandar: Boolean(req.body.precaucionesEstandar),
      tipoPrecaucion: texto(req.body.tipoPrecaucion, 255)
    };

    // "YYYY-MM-DD" como medianoche UTC se ve día anterior en Chile; usar mediodía UTC.
    const rawFecha = req.body.fechaProgramada;
    datosSolicitud.fechaProgramada = null;
    if (rawFecha && String(rawFecha).trim() !== '' && String(rawFecha) !== 'Invalid date') {
      const str = String(rawFecha).trim();
      const fecha = /^\d{4}-\d{2}-\d{2}$/.test(str)
        ? new Date(str + 'T12:00:00.000Z')
        : new Date(str);
      if (!isNaN(fecha.getTime())) {
        datosSolicitud.fechaProgramada = fecha;
      }
    }

    // Normalizar campos de traslado y prioridad inmediata
    if (datosSolicitud.tipoRequerimiento !== 'traslado') {
      datosSolicitud.tipoServicio = null;
      datosSolicitud.tipoTraslado = null;
    }
    if (datosSolicitud.tipoRequerimiento !== 'gescas') {
      datosSolicitud.destinoGescas = null;
    }
    if (datosSolicitud.prioridadInmediato) {
      datosSolicitud.prioridad = 'urgente';
    }

    // Evitar duplicados por doble clic / doble envío (misma persona, mismos datos, pocos segundos)
    const ventanaSegundos = 120;
    const desde = new Date(Date.now() - ventanaSegundos * 1000);
    const recientes = await Solicitud.findAll({
      where: {
        solicitadoPorId: req.usuario.id,
        servicioId,
        tipoRequerimiento: datosSolicitud.tipoRequerimiento,
        estado: { [Op.in]: ['pendiente', 'asignada', 'en_proceso'] },
        createdAt: { [Op.gte]: desde }
      },
      order: [['createdAt', 'DESC']],
      limit: 20
    });
    const descN = normalizarDuplicado(datosSolicitud.descripcion);
    const camaN = normalizarDuplicado(datosSolicitud.cama);
    const duplicado = recientes.find((s) => {
      if (normalizarDuplicado(s.descripcion) !== descN) return false;
      if (normalizarDuplicado(s.cama) !== camaN) return false;
      if ((s.prioridad || '') !== (datosSolicitud.prioridad || '')) return false;
      return mismoMinutoProgramada(s.fechaProgramada, datosSolicitud.fechaProgramada);
    });
    if (duplicado) {
      return res.status(409).json({
        mensaje: 'Ya existe una solicitud igual creada hace unos momentos. Revisa el listado; no hace falta volver a enviarla.',
        solicitudId: duplicado.id
      });
    }

    const solicitud = await Solicitud.create(datosSolicitud);

    // Agregar etiquetas si se proporcionan
    if (Array.isArray(req.body.etiquetas)) {
      for (const etiquetaId of req.body.etiquetas) {
        if (!idValido(etiquetaId)) continue;
        try {
          await SolicitudEtiqueta.findOrCreate({
            where: { solicitudId: solicitud.id, etiquetaId: Number(etiquetaId) }
          });
        } catch (e) {
          console.error('Etiqueta no asociada:', e.parent?.message || e.message);
        }
      }
    }

    let solicitudCompleta;
    try {
      solicitudCompleta = await cargarCompleta(solicitud.id, true);
    } catch (e) {
      solicitudCompleta = await cargarCompleta(solicitud.id);
    }

    await registrarCreacion(solicitudCompleta, req.usuario.id);

    await registrarActividad({
      usuarioId: req.usuario.id,
      accion: 'crear',
      entidad: 'solicitud',
      entidadId: solicitud.id,
      detalles: { tipo: solicitud.tipoRequerimiento, prioridad: solicitud.prioridad },
      ip: req.ip,
      userAgent: req.get('user-agent')
    });

    // Aviso al celular de los auxiliares. No se espera la respuesta de Apple/Google
    // para no demorar a quien está creando la solicitud.
    push.notificarNuevaSolicitud(solicitudCompleta);
    emitirCambioSolicitud(req.app, 'creada', solicitudCompleta);

    res.status(201).json(solicitudCompleta);
  } catch (error) {
    return send500(res, error, 'POST /api/solicitudes');
  }
});

// @route   PUT /api/solicitudes/:id/asignar
// @desc    Asignar una solicitud a un auxiliar
// @access  Private
router.put('/:id/asignar', auth, async (req, res) => {
  try {
    if (!idValido(req.params.id)) {
      return res.status(400).json({ mensaje: 'ID de solicitud inválido' });
    }
    if (req.usuario.rol === 'enfermeria') {
      return res.status(403).json({ mensaje: 'No tienes permiso para asignar solicitudes' });
    }

    const solicitud = await Solicitud.findByPk(req.params.id);
    if (!solicitud) {
      return res.status(404).json({ mensaje: 'Solicitud no encontrada' });
    }

    // Si es auxiliar, solo puede asignarse a sí mismo
    let auxiliarId = req.usuario.id;
    if (req.usuario.rol === 'administrador' && req.body.auxiliarId) {
      if (!idValido(req.body.auxiliarId)) {
        return res.status(400).json({ mensaje: 'Auxiliar inválido' });
      }
      const auxiliar = await Usuario.findByPk(req.body.auxiliarId, { attributes: ['id', 'rol', 'activo'] });
      if (!auxiliar || auxiliar.rol !== 'auxiliar' || !auxiliar.activo) {
        return res.status(400).json({ mensaje: 'El auxiliar indicado no existe o está inactivo' });
      }
      auxiliarId = auxiliar.id;
    }

    const fechaAsignacion = new Date();
    const tiempoRespuesta = solicitud.createdAt
      ? Math.max(0, Math.round((fechaAsignacion - new Date(solicitud.createdAt)) / 60000))
      : null;

    // Actualización atómica: si dos auxiliares tocan "Asignarme" al mismo tiempo, solo uno la obtiene
    const [afectadas] = await Solicitud.update(
      { asignadoAId: auxiliarId, estado: 'en_proceso', fechaAsignacion, tiempoRespuesta },
      { where: { id: solicitud.id, estado: 'pendiente' } }
    );
    if (afectadas === 0) {
      return res.status(409).json({ mensaje: 'Otro auxiliar ya tomó esta solicitud o ya no está pendiente' });
    }

    await registrarAsignacion(solicitud.id, req.usuario.id, auxiliarId);
    await registrarCambioEstado(solicitud.id, req.usuario.id, 'pendiente', 'en_proceso');

    const solicitudCompleta = await cargarCompleta(solicitud.id);

    push.notificarSolicitudTomada(solicitudCompleta, req.usuario.id);
    emitirCambioSolicitud(req.app, 'asignada', solicitudCompleta);

    res.json(solicitudCompleta);
  } catch (error) {
    return send500(res, error, 'PUT /api/solicitudes/:id/asignar');
  }
});

// @route   PUT /api/solicitudes/:id/desasignar
// @desc    El auxiliar se devuelve la solicitud (vuelve a pendiente)
// @access  Private (solo el auxiliar asignado)
router.put('/:id/desasignar', auth, async (req, res) => {
  try {
    if (!idValido(req.params.id)) {
      return res.status(400).json({ mensaje: 'ID de solicitud inválido' });
    }
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

    const solicitudCompleta = await cargarCompleta(solicitud.id);

    // Vuelve a quedar disponible: se avisa de nuevo al resto de auxiliares
    push.notificarSolicitudDevuelta(solicitudCompleta, req.usuario.id);
    emitirCambioSolicitud(req.app, 'devuelta', solicitudCompleta);

    res.json(solicitudCompleta);
  } catch (error) {
    return send500(res, error, 'PUT /api/solicitudes/:id/desasignar');
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
    if (!idValido(req.params.id)) {
      return res.status(400).json({ mensaje: 'ID de solicitud inválido' });
    }

    const solicitud = await Solicitud.findByPk(req.params.id);
    if (!solicitud) {
      return res.status(404).json({ mensaje: 'Solicitud no encontrada' });
    }

    // Auxiliares solo pueden actualizar sus propias solicitudes
    if (req.usuario.rol === 'auxiliar' && solicitud.asignadoAId !== req.usuario.id) {
      return res.status(403).json({ mensaje: 'No tienes permiso para actualizar esta solicitud' });
    }
    if (!enfermeriaPuedeGestionar(req.usuario, solicitud)) {
      return res.status(403).json({ mensaje: 'Solo puedes gestionar solicitudes de tu servicio' });
    }

    const nuevoEstado = req.body.estado;
    const motivo = texto(req.body.motivoCancelacion, 1000);
    if (nuevoEstado === 'cancelada' && !motivo) {
      return res.status(400).json({ mensaje: 'Debe indicar el motivo de la cancelación' });
    }

    const estadoAnterior = solicitud.estado;
    const asignadoAnterior = solicitud.asignadoAId;
    const updateData = { estado: nuevoEstado };
    if (nuevoEstado === 'completada') {
      const fechaCompletada = new Date();
      updateData.fechaCompletada = fechaCompletada;
      if (solicitud.fechaAsignacion) {
        updateData.tiempoCompletado = Math.max(0, Math.round((fechaCompletada - new Date(solicitud.fechaAsignacion)) / 60000));
      }
    }
    updateData.motivoCancelacion = nuevoEstado === 'cancelada' ? motivo : null; // se limpia si se reactiva
    // Al pasar a pendiente (p. ej. revertir un "completado" por error), dejar la solicitud disponible de nuevo
    if (nuevoEstado === 'pendiente') {
      updateData.asignadoAId = null;
      updateData.fechaAsignacion = null;
      updateData.fechaCompletada = null;
      updateData.tiempoCompletado = null;
      updateData.tiempoRespuesta = null;
    }

    await solicitud.update(updateData);

    const cambio = estadoAnterior !== nuevoEstado;
    if (cambio) {
      const descripcionAdicional = nuevoEstado === 'cancelada' && motivo ? `Motivo: ${motivo}` : null;
      await registrarCambioEstado(solicitud.id, req.usuario.id, estadoAnterior, nuevoEstado, descripcionAdicional);
    }

    const solicitudCompleta = await cargarCompleta(solicitud.id);

    if (cambio) {
      if (nuevoEstado === 'completada') {
        push.notificarSolicitudCompletada(solicitudCompleta, req.usuario.id);
      } else if (nuevoEstado === 'cancelada') {
        push.notificarSolicitudCancelada(solicitudCompleta, asignadoAnterior, req.usuario.id);
      } else if (nuevoEstado === 'pendiente') {
        push.notificarSolicitudDevuelta(solicitudCompleta, req.usuario.id);
      }
      emitirCambioSolicitud(req.app, 'estado', solicitudCompleta);
    }

    res.json(solicitudCompleta);
  } catch (error) {
    return send500(res, error, 'PUT /api/solicitudes/:id/estado');
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
    if (!idValido(req.params.id)) {
      return res.status(400).json({ mensaje: 'ID de solicitud inválido' });
    }

    const solicitud = await Solicitud.findByPk(req.params.id);
    if (!solicitud) {
      return res.status(404).json({ mensaje: 'Solicitud no encontrada' });
    }

    const puedeModificar =
      req.usuario.rol === 'administrador' ||
      (req.usuario.rol === 'enfermeria' && enfermeriaPuedeGestionar(req.usuario, solicitud));

    if (!puedeModificar) {
      return res.status(403).json({ mensaje: 'No tienes permiso para modificar esta solicitud' });
    }

    const updateData = {};
    const servicioId = req.body.servicioId ?? req.body.servicio;
    if (servicioId !== undefined && servicioId !== null && servicioId !== '') {
      if (!idValido(servicioId) || !(await Servicio.findByPk(servicioId, { attributes: ['id'] }))) {
        return res.status(400).json({ mensaje: 'El servicio indicado no existe' });
      }
      if (req.usuario.rol === 'enfermeria' && req.usuario.servicioId && Number(servicioId) !== Number(req.usuario.servicioId)) {
        return res.status(403).json({ mensaje: 'Solo puedes usar tu servicio asignado' });
      }
      updateData.servicioId = Number(servicioId);
    }
    if (req.body.tipoRequerimiento !== undefined) updateData.tipoRequerimiento = req.body.tipoRequerimiento;
    if (req.body.destinoGescas !== undefined) updateData.destinoGescas = texto(req.body.destinoGescas, 255);
    if (req.body.descripcion !== undefined) updateData.descripcion = texto(req.body.descripcion, 2000);
    if (req.body.tipoServicio !== undefined) updateData.tipoServicio = texto(req.body.tipoServicio, 100);
    if (req.body.tipoTraslado !== undefined) updateData.tipoTraslado = texto(req.body.tipoTraslado, 100);
    if (req.body.cama !== undefined) updateData.cama = texto(req.body.cama, 100);
    if (req.body.prioridad !== undefined) updateData.prioridad = req.body.prioridad;
    if (req.body.prioridadInmediato !== undefined) {
      updateData.prioridadInmediato = Boolean(req.body.prioridadInmediato);
      if (updateData.prioridadInmediato) updateData.prioridad = 'urgente';
    }
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
    if (req.body.tipoPrecaucion !== undefined) updateData.tipoPrecaucion = texto(req.body.tipoPrecaucion, 255);

    if (updateData.tipoRequerimiento && updateData.tipoRequerimiento !== 'traslado') {
      updateData.tipoServicio = null;
      updateData.tipoTraslado = null;
    }
    if (updateData.tipoRequerimiento && updateData.tipoRequerimiento !== 'gescas') {
      updateData.destinoGescas = null;
    }

    await solicitud.update(updateData);

    let solicitudCompleta;
    try {
      solicitudCompleta = await cargarCompleta(solicitud.id, true);
    } catch (e) {
      solicitudCompleta = await cargarCompleta(solicitud.id);
    }

    await registrarCambio(
      solicitud.id,
      req.usuario.id,
      'actualizar',
      null,
      null,
      null,
      `Solicitud modificada: ${Object.keys(updateData).join(', ')}`
    );

    emitirCambioSolicitud(req.app, 'editada', solicitudCompleta);

    res.json(solicitudCompleta);
  } catch (error) {
    return send500(res, error, 'PUT /api/solicitudes/:id');
  }
});

module.exports = router;
