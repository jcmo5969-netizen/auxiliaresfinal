const express = require('express');
const { body, validationResult } = require('express-validator');
const { Servicio } = require('../models');
const { auth, esAdministrador } = require('../middleware/auth');
const { send500 } = require('../utils/sendError');
const { Op } = require('sequelize');

const router = express.Router();

// @route   GET /api/servicios
// @desc    Obtener todos los servicios
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    let servicios;
    try {
      servicios = await Servicio.findAll({
        where: { activo: true },
        order: [['nombre', 'ASC']]
      });
    } catch (err) {
      console.error('GET /api/servicios: filtro activo falló, listando todos:', err.parent?.message || err.message);
      servicios = await Servicio.findAll({
        order: [['nombre', 'ASC']]
      });
    }
    res.json(servicios);
  } catch (error) {
    return send500(res, error, 'GET /api/servicios');
  }
});

// @route   GET /api/servicios/:id
// @desc    Obtener un servicio por ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const servicio = await Servicio.findByPk(req.params.id);
    if (!servicio) {
      return res.status(404).json({ mensaje: 'Servicio no encontrado' });
    }
    res.json(servicio);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error del servidor' });
  }
});

// @route   POST /api/servicios
// @desc    Crear un nuevo servicio
// @access  Private/Admin
router.post('/', [
  body('nombre').notEmpty().withMessage('El nombre es requerido')
], auth, esAdministrador, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errores: errors.array() });
    }

    const servicio = await Servicio.create(req.body);
    res.status(201).json(servicio);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error del servidor' });
  }
});

// @route   PUT /api/servicios/:id
// @desc    Actualizar un servicio
// @access  Private/Admin
router.put('/:id', auth, esAdministrador, async (req, res) => {
  try {
    const servicio = await Servicio.findByPk(req.params.id);
    if (!servicio) {
      return res.status(404).json({ mensaje: 'Servicio no encontrado' });
    }
    
    await servicio.update(req.body);
    res.json(servicio);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error del servidor' });
  }
});

// @route   DELETE /api/servicios/:id
// @desc    Eliminar (desactivar) un servicio
// @access  Private/Admin
router.delete('/:id', auth, esAdministrador, async (req, res) => {
  try {
    const servicio = await Servicio.findByPk(req.params.id);
    if (!servicio) {
      return res.status(404).json({ mensaje: 'Servicio no encontrado' });
    }
    
    await servicio.update({ activo: false });
    res.json({ mensaje: 'Servicio desactivado exitosamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error del servidor' });
  }
});

module.exports = router;
