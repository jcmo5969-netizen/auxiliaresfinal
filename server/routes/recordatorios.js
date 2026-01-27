const express = require('express');
const { auth } = require('../middleware/auth');
const router = express.Router();

// Simulación de base de datos (en producción usar modelo Sequelize)
let recordatorios = [];

// @route   GET /api/recordatorios
// @desc    Obtener recordatorios del usuario
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { usuarioId } = req.query;
    const recordatoriosUsuario = recordatorios.filter(r => r.usuarioId === parseInt(usuarioId));
    res.json(recordatoriosUsuario);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error del servidor' });
  }
});

// @route   POST /api/recordatorios
// @desc    Crear recordatorio
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const nuevoRecordatorio = {
      id: Date.now(),
      ...req.body,
      usuarioId: req.usuario.id,
      createdAt: new Date().toISOString()
    };
    recordatorios.push(nuevoRecordatorio);
    res.status(201).json(nuevoRecordatorio);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error del servidor' });
  }
});

// @route   DELETE /api/recordatorios/:id
// @desc    Eliminar recordatorio
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    recordatorios = recordatorios.filter(r => r.id !== id);
    res.json({ mensaje: 'Recordatorio eliminado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error del servidor' });
  }
});

module.exports = router;

