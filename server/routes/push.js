const express = require('express');
const rateLimit = require('express-rate-limit');
const { SuscripcionPush } = require('../models');
const { auth } = require('../middleware/auth');
const { send500 } = require('../utils/sendError');
const push = require('../utils/push');

const router = express.Router();

// @route   GET /api/push/clave-publica
// @desc    Clave pública VAPID que el navegador necesita para suscribirse
// @access  Public
router.get('/clave-publica', async (req, res) => {
  try {
    const clavePublica = await push.obtenerClavePublica();
    if (!clavePublica) {
      return res.status(503).json({ mensaje: 'Notificaciones no disponibles por el momento' });
    }
    res.json({ clavePublica });
  } catch (error) {
    return send500(res, error, 'GET /api/push/clave-publica');
  }
});

// @route   GET /api/push/estado
// @desc    Estado de las notificaciones del usuario actual
// @access  Private
router.get('/estado', auth, async (req, res) => {
  try {
    const dispositivos = await SuscripcionPush.findAll({
      where: { usuarioId: req.usuario.id },
      attributes: ['id', 'plataforma', 'ultimoEnvio', 'createdAt', 'updatedAt'],
      order: [['updatedAt', 'DESC']]
    });
    res.json({ disponible: push.estadoPush().listo, dispositivos });
  } catch (error) {
    return send500(res, error, 'GET /api/push/estado');
  }
});

// @route   POST /api/push/suscripcion
// @desc    Registrar este dispositivo para recibir notificaciones
// @access  Private
router.post('/suscripcion', auth, async (req, res) => {
  try {
    const sub = await push.guardarSuscripcion(req.usuario.id, req.body?.suscripcion, {
      plataforma: req.body?.plataforma,
      userAgent: req.get('user-agent')
    });
    res.status(201).json({ mensaje: 'Dispositivo registrado', id: sub.id });
  } catch (error) {
    if (error.status === 400) return res.status(400).json({ mensaje: error.message });
    return send500(res, error, 'POST /api/push/suscripcion');
  }
});

// @route   DELETE /api/push/suscripcion
// @desc    Dejar de enviar notificaciones a este dispositivo (cierre de sesión)
// @access  Private
router.delete('/suscripcion', auth, async (req, res) => {
  try {
    const eliminadas = await push.eliminarSuscripcion(req.usuario.id, req.body?.endpoint);
    res.json({ mensaje: 'Dispositivo desvinculado', eliminadas });
  } catch (error) {
    return send500(res, error, 'DELETE /api/push/suscripcion');
  }
});

// Las pruebas envían notificaciones reales: se limita para que no se abuse del botón
const limitePruebas = rateLimit({
  windowMs: 60 * 1000,
  limit: 6,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `prueba-${req.usuario?.id || req.ip}`,
  message: { mensaje: 'Demasiadas pruebas seguidas. Espera un minuto.' }
});

// @route   POST /api/push/prueba
// @desc    Enviar una notificación de prueba a los dispositivos del usuario
// @access  Private
router.post('/prueba', auth, limitePruebas, async (req, res) => {
  try {
    const resultado = await push.enviarPrueba(req.usuario.id, req.body?.endpoint);
    if (resultado.total === 0) {
      return res.status(404).json({
        mensaje: 'Este usuario no tiene dispositivos con notificaciones activadas',
        ...resultado
      });
    }
    if (resultado.enviados === 0) {
      return res.status(502).json({
        mensaje: 'No se pudo entregar la notificación. Vuelve a activar las notificaciones en este dispositivo.',
        ...resultado
      });
    }
    res.json({ mensaje: 'Notificación de prueba enviada', ...resultado });
  } catch (error) {
    return send500(res, error, 'POST /api/push/prueba');
  }
});

// @route   POST /api/push/renovar
// @desc    El navegador cambió la suscripción en segundo plano (lo llama el service worker).
//          No hay sesión disponible ahí: se autoriza conociendo el endpoint anterior.
// @access  Public (limitado)
const limiteRenovar = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false
});

router.post('/renovar', limiteRenovar, async (req, res) => {
  try {
    const endpointAnterior = String(req.body?.endpointAnterior || '').trim();
    if (!endpointAnterior) return res.status(400).json({ mensaje: 'Falta el endpoint anterior' });

    const anterior = await SuscripcionPush.findOne({ where: { endpoint: endpointAnterior } });
    if (!anterior) return res.status(404).json({ mensaje: 'Suscripción no encontrada' });

    const nueva = req.body?.suscripcion;
    if (!nueva?.endpoint) {
      await anterior.destroy();
      return res.json({ mensaje: 'Suscripción eliminada' });
    }

    await push.guardarSuscripcion(anterior.usuarioId, nueva, {
      plataforma: anterior.plataforma,
      userAgent: req.get('user-agent')
    });
    if (nueva.endpoint !== endpointAnterior) await anterior.destroy();
    res.json({ mensaje: 'Suscripción renovada' });
  } catch (error) {
    if (error.status === 400) return res.status(400).json({ mensaje: error.message });
    return send500(res, error, 'POST /api/push/renovar');
  }
});

module.exports = router;
