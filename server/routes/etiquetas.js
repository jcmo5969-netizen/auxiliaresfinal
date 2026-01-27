const express = require('express');
const { body, validationResult } = require('express-validator');
const { Etiqueta, Solicitud, SolicitudEtiqueta } = require('../models');
const { auth, esAdministrador } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/etiquetas
// @desc    Obtener todas las etiquetas
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const etiquetas = await Etiqueta.findAll({
      order: [['nombre', 'ASC']]
    });
    res.json(etiquetas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error del servidor' });
  }
});

// @route   POST /api/etiquetas
// @desc    Crear etiqueta
// @access  Private/Admin
router.post('/', [
  body('nombre').notEmpty().withMessage('El nombre es requerido'),
  body('color').optional().matches(/^#[0-9A-F]{6}$/i).withMessage('Color inválido')
], auth, esAdministrador, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errores: errors.array() });
    }

    const etiqueta = await Etiqueta.create(req.body);
    res.status(201).json(etiqueta);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error del servidor' });
  }
});

// @route   PUT /api/etiquetas/:id
// @desc    Actualizar etiqueta
// @access  Private/Admin
router.put('/:id', auth, esAdministrador, async (req, res) => {
  try {
    const etiqueta = await Etiqueta.findByPk(req.params.id);
    if (!etiqueta) {
      return res.status(404).json({ mensaje: 'Etiqueta no encontrada' });
    }
    await etiqueta.update(req.body);
    res.json(etiqueta);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error del servidor' });
  }
});

// @route   DELETE /api/etiquetas/:id
// @desc    Eliminar etiqueta
// @access  Private/Admin
router.delete('/:id', auth, esAdministrador, async (req, res) => {
  try {
    const etiqueta = await Etiqueta.findByPk(req.params.id);
    if (!etiqueta) {
      return res.status(404).json({ mensaje: 'Etiqueta no encontrada' });
    }
    await etiqueta.destroy();
    res.json({ mensaje: 'Etiqueta eliminada' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error del servidor' });
  }
});

// @route   POST /api/etiquetas/:etiquetaId/solicitud/:solicitudId
// @desc    Agregar etiqueta a solicitud
// @access  Private
router.post('/:etiquetaId/solicitud/:solicitudId', auth, async (req, res) => {
  try {
    const { etiquetaId, solicitudId } = req.params;
    
    const solicitud = await Solicitud.findByPk(solicitudId);
    if (!solicitud) {
      return res.status(404).json({ mensaje: 'Solicitud no encontrada' });
    }

    const etiqueta = await Etiqueta.findByPk(etiquetaId);
    if (!etiqueta) {
      return res.status(404).json({ mensaje: 'Etiqueta no encontrada' });
    }

    await SolicitudEtiqueta.findOrCreate({
      where: { solicitudId, etiquetaId }
    });

    res.json({ mensaje: 'Etiqueta agregada' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error del servidor' });
  }
});

// @route   DELETE /api/etiquetas/:etiquetaId/solicitud/:solicitudId
// @desc    Remover etiqueta de solicitud
// @access  Private
router.delete('/:etiquetaId/solicitud/:solicitudId', auth, async (req, res) => {
  try {
    const { etiquetaId, solicitudId } = req.params;
    
    await SolicitudEtiqueta.destroy({
      where: { solicitudId, etiquetaId }
    });

    res.json({ mensaje: 'Etiqueta removida' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error del servidor' });
  }
});

module.exports = router;



