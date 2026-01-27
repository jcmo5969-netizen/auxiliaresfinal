const express = require('express');
const { LogActividad, Usuario } = require('../models');
const { auth, esAdministrador } = require('../middleware/auth');
const { Op } = require('sequelize');

const router = express.Router();

// @route   GET /api/logs
// @desc    Obtener logs de actividad
// @access  Private/Admin
router.get('/', auth, esAdministrador, async (req, res) => {
  try {
    const { fechaInicio, fechaFin, usuarioId, accion, entidad, limit = 100, offset = 0 } = req.query;
    
    const where = {};
    
    if (fechaInicio && fechaFin) {
      where.createdAt = {
        [Op.between]: [new Date(fechaInicio), new Date(fechaFin)]
      };
    }
    
    if (usuarioId) {
      where.usuarioId = usuarioId;
    }
    
    if (accion) {
      where.accion = { [Op.like]: `%${accion}%` };
    }
    
    if (entidad) {
      where.entidad = entidad;
    }

    const logs = await LogActividad.findAndCountAll({
      where,
      include: [
        { model: Usuario, as: 'usuario', attributes: ['id', 'nombre', 'email'], required: false }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      logs: logs.rows,
      total: logs.count,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error del servidor' });
  }
});

// @route   GET /api/logs/usuario/:id
// @desc    Obtener logs de un usuario específico
// @access  Private
router.get('/usuario/:id', auth, async (req, res) => {
  try {
    // Solo puede ver sus propios logs o ser admin
    if (req.usuario.id !== parseInt(req.params.id) && req.usuario.rol !== 'administrador') {
      return res.status(403).json({ mensaje: 'Acceso denegado' });
    }

    const logs = await LogActividad.findAll({
      where: { usuarioId: req.params.id },
      order: [['createdAt', 'DESC']],
      limit: 50
    });

    res.json(logs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error del servidor' });
  }
});

module.exports = router;



