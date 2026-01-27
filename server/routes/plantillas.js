const express = require('express');
const { body, validationResult } = require('express-validator');
const { PlantillaSolicitud, Usuario, Servicio } = require('../models');
const { auth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/plantillas
// @desc    Obtener plantillas (propias y públicas)
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const plantillas = await PlantillaSolicitud.findAll({
      where: {
        [require('sequelize').Op.or]: [
          { creadoPorId: req.usuario.id },
          { esPublica: true }
        ]
      },
      include: [
        { model: Usuario, as: 'creadoPor', attributes: ['id', 'nombre'] },
        { model: Servicio, as: 'servicio', attributes: ['id', 'nombre', 'piso'], required: false }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.json(plantillas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error del servidor' });
  }
});

// @route   POST /api/plantillas
// @desc    Crear plantilla
// @access  Private
router.post('/', [
  body('nombre').notEmpty().withMessage('El nombre es requerido'),
  body('tipoRequerimiento').isIn(['alta', 'traslado', 'pabellon', 'otro']).withMessage('Tipo inválido')
], auth, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errores: errors.array() });
    }

    const plantilla = await PlantillaSolicitud.create({
      ...req.body,
      creadoPorId: req.usuario.id
    });

    const plantillaCompleta = await PlantillaSolicitud.findByPk(plantilla.id, {
      include: [
        { model: Usuario, as: 'creadoPor', attributes: ['id', 'nombre'] },
        { model: Servicio, as: 'servicio', attributes: ['id', 'nombre', 'piso'], required: false }
      ]
    });

    res.status(201).json(plantillaCompleta);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error del servidor' });
  }
});

// @route   PUT /api/plantillas/:id
// @desc    Actualizar plantilla
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const plantilla = await PlantillaSolicitud.findByPk(req.params.id);
    
    if (!plantilla) {
      return res.status(404).json({ mensaje: 'Plantilla no encontrada' });
    }

    if (plantilla.creadoPorId !== req.usuario.id && req.usuario.rol !== 'administrador') {
      return res.status(403).json({ mensaje: 'No tienes permiso para editar esta plantilla' });
    }

    await plantilla.update(req.body);
    res.json(plantilla);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error del servidor' });
  }
});

// @route   DELETE /api/plantillas/:id
// @desc    Eliminar plantilla
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const plantilla = await PlantillaSolicitud.findByPk(req.params.id);
    
    if (!plantilla) {
      return res.status(404).json({ mensaje: 'Plantilla no encontrada' });
    }

    if (plantilla.creadoPorId !== req.usuario.id && req.usuario.rol !== 'administrador') {
      return res.status(403).json({ mensaje: 'No tienes permiso para eliminar esta plantilla' });
    }

    await plantilla.destroy();
    res.json({ mensaje: 'Plantilla eliminada' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error del servidor' });
  }
});

module.exports = router;



