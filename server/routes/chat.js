const express = require('express');
const { body, validationResult } = require('express-validator');
const { Mensaje, Usuario, Solicitud } = require('../models');
const { auth } = require('../middleware/auth');
const { Op } = require('sequelize');

const router = express.Router();

// @route   GET /api/chat/mensajes
// @desc    Obtener mensajes (por solicitud o general)
// @access  Private
router.get('/mensajes', auth, async (req, res) => {
  try {
    const { solicitudId, destinatarioId, limit = 50 } = req.query;
    
    const where = {};
    
    if (solicitudId) {
      where.solicitudId = solicitudId;
    } else if (destinatarioId) {
      // Chat directo
      where[Op.or] = [
        { remitenteId: req.usuario.id, destinatarioId },
        { remitenteId: destinatarioId, destinatarioId: req.usuario.id }
      ];
    } else {
      // Chat general (sin destinatario específico)
      where.destinatarioId = null;
      where.solicitudId = null;
    }

    const mensajes = await Mensaje.findAll({
      where,
      include: [
        { model: Usuario, as: 'remitente', attributes: ['id', 'nombre', 'email', 'rol'] },
        { model: Usuario, as: 'destinatario', attributes: ['id', 'nombre', 'email', 'rol'], required: false },
        { model: Solicitud, as: 'solicitud', attributes: ['id', 'tipoRequerimiento'], required: false }
      ],
      order: [['createdAt', 'ASC']],
      limit: parseInt(limit)
    });

    res.json(mensajes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error del servidor' });
  }
});

// @route   POST /api/chat/mensajes
// @desc    Enviar mensaje
// @access  Private
router.post('/mensajes', [
  body('contenido').notEmpty().withMessage('El contenido es requerido')
], auth, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errores: errors.array() });
    }

    const { contenido, destinatarioId, solicitudId } = req.body;

    const mensaje = await Mensaje.create({
      remitenteId: req.usuario.id,
      destinatarioId: destinatarioId || null,
      solicitudId: solicitudId || null,
      contenido
    });

    const mensajeCompleto = await Mensaje.findByPk(mensaje.id, {
      include: [
        { model: Usuario, as: 'remitente', attributes: ['id', 'nombre', 'email', 'rol'] },
        { model: Usuario, as: 'destinatario', attributes: ['id', 'nombre', 'email', 'rol'], required: false },
        { model: Solicitud, as: 'solicitud', attributes: ['id', 'tipoRequerimiento'], required: false }
      ]
    });

    // Emitir mensaje a través de Socket.IO
    const io = req.app.get('io');
    if (io) {
      if (solicitudId) {
        io.to(`solicitud-${solicitudId}`).emit('nuevo-mensaje', mensajeCompleto);
      } else if (destinatarioId) {
        // Enviar a ambos usuarios en chat directo
        io.to(`usuario-${req.usuario.id}`).emit('nuevo-mensaje', mensajeCompleto);
        io.to(`usuario-${destinatarioId}`).emit('nuevo-mensaje', mensajeCompleto);
      } else {
        io.to('chat-general').emit('nuevo-mensaje', mensajeCompleto);
      }
    }

    res.status(201).json(mensajeCompleto);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error del servidor' });
  }
});

// @route   PUT /api/chat/mensajes/:id/leido
// @desc    Marcar mensaje como leído
// @access  Private
router.put('/mensajes/:id/leido', auth, async (req, res) => {
  try {
    const mensaje = await Mensaje.findByPk(req.params.id);
    
    if (!mensaje) {
      return res.status(404).json({ mensaje: 'Mensaje no encontrado' });
    }

    // Solo el destinatario puede marcar como leído
    if (mensaje.destinatarioId !== req.usuario.id) {
      return res.status(403).json({ mensaje: 'No tienes permiso para esta acción' });
    }

    await mensaje.update({
      leido: true,
      fechaLeido: new Date()
    });

    res.json(mensaje);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error del servidor' });
  }
});

// @route   GET /api/chat/conversaciones
// @desc    Obtener lista de conversaciones
// @access  Private
router.get('/conversaciones', auth, async (req, res) => {
  try {
    // Obtener últimas conversaciones del usuario
    const conversaciones = await Mensaje.findAll({
      where: {
        [Op.or]: [
          { remitenteId: req.usuario.id },
          { destinatarioId: req.usuario.id }
        ]
      },
      include: [
        { model: Usuario, as: 'remitente', attributes: ['id', 'nombre', 'email', 'rol'] },
        { model: Usuario, as: 'destinatario', attributes: ['id', 'nombre', 'email', 'rol'], required: false },
        { model: Solicitud, as: 'solicitud', attributes: ['id', 'tipoRequerimiento'], required: false }
      ],
      order: [['createdAt', 'DESC']],
      group: ['remitenteId', 'destinatarioId', 'solicitudId']
    });

    res.json(conversaciones);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error del servidor' });
  }
});

// @route   GET /api/chat/general
// @desc    Obtener mensajes del chat general
// @access  Private
router.get('/general', auth, async (req, res) => {
  try {
    const mensajes = await Mensaje.findAll({
      where: {
        destinatarioId: null,
        solicitudId: null
      },
      include: [
        { model: Usuario, as: 'remitente', attributes: ['id', 'nombre', 'email', 'rol'] }
      ],
      order: [['createdAt', 'ASC']],
      limit: 100
    });

    // Agregar campo 'usuario' para compatibilidad con componentes antiguos
    const mensajesFormateados = mensajes.map(mensaje => {
      const mensajeJson = mensaje.toJSON();
      return {
        ...mensajeJson,
        usuario: mensajeJson.remitente,
        usuarioId: mensajeJson.remitenteId
      };
    });

    res.json(mensajesFormateados);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error del servidor' });
  }
});

// @route   POST /api/chat/general
// @desc    Enviar mensaje al chat general
// @access  Private
router.post('/general', [
  body('contenido').notEmpty().withMessage('El contenido es requerido')
], auth, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errores: errors.array() });
    }

    const { contenido } = req.body;

    const mensaje = await Mensaje.create({
      remitenteId: req.usuario.id,
      destinatarioId: null,
      solicitudId: null,
      contenido
    });

    const mensajeCompleto = await Mensaje.findByPk(mensaje.id, {
      include: [
        { model: Usuario, as: 'remitente', attributes: ['id', 'nombre', 'email', 'rol'] }
      ]
    });

    // Formatear mensaje para compatibilidad
    const mensajeFormateado = {
      ...mensajeCompleto.toJSON(),
      usuario: mensajeCompleto.remitente,
      usuarioId: mensajeCompleto.remitenteId
    };

    // Emitir mensaje a través de Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.to('chat-general').emit('mensaje-chat-general', mensajeFormateado);
      io.to('chat-general').emit('nuevo-mensaje', mensajeFormateado);
    }

    res.status(201).json(mensajeFormateado);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error del servidor' });
  }
});

module.exports = router;



