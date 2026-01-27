const express = require('express');
const { Usuario, Solicitud, Servicio } = require('../models');
const { auth, esAdministrador } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/auxiliares
// @desc    Obtener todo el personal (auxiliares y administradores)
// @access  Private/Admin
router.get('/', auth, esAdministrador, async (req, res) => {
  try {
    const personal = await Usuario.findAll({
      attributes: { exclude: ['password'] },
      include: [
        { model: Servicio, as: 'servicio', attributes: ['id', 'nombre', 'piso'], required: false }
      ],
      order: [['rol', 'ASC'], ['nombre', 'ASC']]
    });
    res.json(personal);
  } catch (error) {
    console.error('Error en GET /api/auxiliares:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({ mensaje: 'Error del servidor', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
});

// @route   GET /api/auxiliares/:id/solicitudes
// @desc    Obtener solicitudes de un auxiliar
// @access  Private
router.get('/:id/solicitudes', auth, async (req, res) => {
  try {
    // Verificar que el usuario puede ver estas solicitudes
    if (req.usuario.rol !== 'administrador' && req.usuario.id !== parseInt(req.params.id)) {
      return res.status(403).json({ mensaje: 'Acceso denegado' });
    }

    const solicitudes = await Solicitud.findAll({
      where: { asignadoAId: req.params.id },
      include: [
        { model: Servicio, as: 'servicio', attributes: ['id', 'nombre', 'piso'] },
        { model: Usuario, as: 'solicitadoPor', attributes: ['id', 'nombre', 'email'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json(solicitudes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error del servidor' });
  }
});

module.exports = router;
