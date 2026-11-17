const express = require('express');
const { Recordatorio } = require('../models');
const { auth } = require('../middleware/auth');
const { send500 } = require('../utils/sendError');

const router = express.Router();

/** El cliente espera `fechaHora` y también los campos separados que envió al crear. */
function serializar(r) {
  const json = r.toJSON();
  return { ...json, fechaHora: json.fechaHora instanceof Date ? json.fechaHora.toISOString() : json.fechaHora };
}

// @route   GET /api/recordatorios
// @desc    Recordatorios del usuario actual
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const recordatorios = await Recordatorio.findAll({
      where: { usuarioId: req.usuario.id },
      order: [['fechaHora', 'ASC']]
    });
    res.json(recordatorios.map(serializar));
  } catch (error) {
    return send500(res, error, 'GET /api/recordatorios');
  }
});

// @route   POST /api/recordatorios
// @desc    Crear recordatorio
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const titulo = String(req.body?.titulo || '').trim();
    if (!titulo) {
      return res.status(400).json({ mensaje: 'El título es requerido' });
    }
    const fechaHora = new Date(req.body?.fechaHora);
    if (Number.isNaN(fechaHora.getTime())) {
      return res.status(400).json({ mensaje: 'Fecha y hora inválidas' });
    }
    const solicitudId = /^\d+$/.test(String(req.body?.solicitudId ?? '')) ? Number(req.body.solicitudId) : null;

    const recordatorio = await Recordatorio.create({
      usuarioId: req.usuario.id,
      solicitudId,
      titulo: titulo.slice(0, 200),
      descripcion: req.body?.descripcion ? String(req.body.descripcion).slice(0, 2000) : null,
      fechaHora
    });
    res.status(201).json(serializar(recordatorio));
  } catch (error) {
    return send500(res, error, 'POST /api/recordatorios');
  }
});

// @route   PUT /api/recordatorios/:id
// @desc    Marcar recordatorio como completado / pendiente
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    if (!/^\d+$/.test(req.params.id)) return res.status(404).json({ mensaje: 'Recordatorio no encontrado' });
    const recordatorio = await Recordatorio.findOne({
      where: { id: req.params.id, usuarioId: req.usuario.id }
    });
    if (!recordatorio) return res.status(404).json({ mensaje: 'Recordatorio no encontrado' });
    if (req.body?.completado !== undefined) {
      await recordatorio.update({ completado: Boolean(req.body.completado) });
    }
    res.json(serializar(recordatorio));
  } catch (error) {
    return send500(res, error, 'PUT /api/recordatorios/:id');
  }
});

// @route   DELETE /api/recordatorios/:id
// @desc    Eliminar recordatorio propio
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    // Los recordatorios antiguos guardados solo en el navegador usan ids que no existen aquí
    if (!/^\d{1,9}$/.test(req.params.id)) return res.json({ mensaje: 'Recordatorio eliminado' });
    await Recordatorio.destroy({ where: { id: req.params.id, usuarioId: req.usuario.id } });
    res.json({ mensaje: 'Recordatorio eliminado' });
  } catch (error) {
    return send500(res, error, 'DELETE /api/recordatorios/:id');
  }
});

module.exports = router;
