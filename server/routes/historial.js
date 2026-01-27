const express = require('express');
const { HistorialCambio, Solicitud, Usuario } = require('../models');
const { auth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/historial/solicitud/:id
// @desc    Obtener historial de cambios de una solicitud
// @access  Private
router.get('/solicitud/:id', auth, async (req, res) => {
  try {
    // Verificar que la solicitud existe y el usuario tiene acceso
    const solicitud = await Solicitud.findByPk(req.params.id);
    if (!solicitud) {
      return res.status(404).json({ mensaje: 'Solicitud no encontrada' });
    }

    // Verificar permisos
    const puedeVer = 
      req.usuario.rol === 'administrador' ||
      solicitud.solicitadoPorId === req.usuario.id ||
      solicitud.asignadoAId === req.usuario.id;

    if (!puedeVer) {
      return res.status(403).json({ mensaje: 'No tienes permiso para ver el historial de esta solicitud' });
    }

    const historial = await HistorialCambio.findAll({
      where: { solicitudId: req.params.id },
      include: [
        { model: Usuario, as: 'usuario', attributes: ['id', 'nombre', 'email', 'rol'], required: false }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json(historial);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error del servidor' });
  }
});

module.exports = router;



