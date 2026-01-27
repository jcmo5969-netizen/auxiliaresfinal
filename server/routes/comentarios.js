const express = require('express');
const { body, validationResult } = require('express-validator');
const { Comentario, Solicitud, Usuario } = require('../models');
const { auth } = require('../middleware/auth');
const { Op } = require('sequelize');

const router = express.Router();

// @route   GET /api/comentarios/solicitud/:id
// @desc    Obtener comentarios de una solicitud
// @access  Private
router.get('/solicitud/:id', auth, async (req, res) => {
  try {
    const comentarios = await Comentario.findAll({
      where: { solicitudId: req.params.id },
      include: [
        { model: Usuario, as: 'usuario', attributes: ['id', 'nombre', 'email', 'rol'] }
      ],
      order: [['createdAt', 'ASC']]
    });

    res.json(comentarios);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error del servidor' });
  }
});

// @route   POST /api/comentarios
// @desc    Crear un comentario
// @access  Private
router.post('/', [
  body('solicitudId').isInt().withMessage('ID de solicitud inválido'),
  body('contenido').notEmpty().withMessage('El contenido es requerido')
], auth, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errores: errors.array() });
    }

    // Verificar que la solicitud existe
    const solicitud = await Solicitud.findByPk(req.body.solicitudId);
    if (!solicitud) {
      return res.status(404).json({ mensaje: 'Solicitud no encontrada' });
    }

    // Verificar permisos: solo puede comentar si es admin, solicitante o asignado
    const puedeComentar = 
      req.usuario.rol === 'administrador' ||
      solicitud.solicitadoPorId === req.usuario.id ||
      solicitud.asignadoAId === req.usuario.id;

    if (!puedeComentar) {
      return res.status(403).json({ mensaje: 'No tienes permiso para comentar en esta solicitud' });
    }

    const comentario = await Comentario.create({
      solicitudId: req.body.solicitudId,
      usuarioId: req.usuario.id,
      contenido: req.body.contenido,
      tipo: 'comentario'
    });

    const comentarioCompleto = await Comentario.findByPk(comentario.id, {
      include: [
        { model: Usuario, as: 'usuario', attributes: ['id', 'nombre', 'email', 'rol'] }
      ]
    });

    res.status(201).json(comentarioCompleto);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error del servidor' });
  }
});

// @route   DELETE /api/comentarios/:id
// @desc    Eliminar un comentario
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const comentario = await Comentario.findByPk(req.params.id);
    if (!comentario) {
      return res.status(404).json({ mensaje: 'Comentario no encontrado' });
    }

    // Solo el autor o un administrador puede eliminar
    if (comentario.usuarioId !== req.usuario.id && req.usuario.rol !== 'administrador') {
      return res.status(403).json({ mensaje: 'No tienes permiso para eliminar este comentario' });
    }

    await comentario.destroy();
    res.json({ mensaje: 'Comentario eliminado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error del servidor' });
  }
});

module.exports = router;



