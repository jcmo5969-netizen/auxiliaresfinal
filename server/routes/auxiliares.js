const express = require('express');
const { Usuario, Solicitud, Servicio, SuscripcionPush, sequelize } = require('../models');
const { auth, esAdministrador, invalidateUserCache } = require('../middleware/auth');
const { send500 } = require('../utils/sendError');

const router = express.Router();

// @route   GET /api/auxiliares
// @desc    Obtener todo el personal (auxiliares y administradores)
// @access  Private/Admin
router.get('/', auth, esAdministrador, async (req, res) => {
  try {
    let personal;
    try {
      personal = await Usuario.findAll({
        attributes: { exclude: ['password'] },
        include: [
          { model: Servicio, as: 'servicio', attributes: ['id', 'nombre', 'piso'], required: false }
        ],
        order: [['rol', 'ASC'], ['nombre', 'ASC']]
      });
    } catch (err) {
      console.error('GET /api/auxiliares: include servicio falló, sin join:', err.parent?.message || err.message);
      personal = await Usuario.findAll({
        attributes: { exclude: ['password'] },
        order: [['rol', 'ASC'], ['nombre', 'ASC']]
      });
    }
    // Cuántos dispositivos tiene cada persona con notificaciones activadas
    // (sirve para saber quién todavía no las ha activado en su celular)
    let porUsuario = new Map();
    try {
      const conteos = await SuscripcionPush.findAll({
        attributes: ['usuarioId', [sequelize.fn('COUNT', sequelize.col('id')), 'total']],
        group: ['usuarioId'],
        raw: true
      });
      porUsuario = new Map(conteos.map((c) => [c.usuarioId, Number(c.total)]));
    } catch (err) {
      console.error('GET /api/auxiliares: conteo de dispositivos falló:', err.parent?.message || err.message);
    }

    res.json(
      personal.map((p) => {
        const { fcmToken, secret2FA, ...datos } = p.toJSON();
        return { ...datos, dispositivosPush: porUsuario.get(p.id) || 0 };
      })
    );
  } catch (error) {
    return send500(res, error, 'GET /api/auxiliares');
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

// @route   PUT /api/auxiliares/:id
// @desc    Actualizar datos de personal (solo admin)
// @access  Private/Admin
router.put('/:id', auth, esAdministrador, async (req, res) => {
  try {
    const usuario = await Usuario.findByPk(req.params.id);
    if (!usuario) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    const {
      nombre,
      email,
      rol,
      servicioId,
      activo,
      password
    } = req.body;

    if (email) {
      const emailNormalizado = email.toLowerCase();
      if (emailNormalizado !== usuario.email) {
        const emailEnUso = await Usuario.findOne({ where: { email: emailNormalizado } });
        if (emailEnUso) {
          return res.status(400).json({ mensaje: 'El email ya está en uso' });
        }
      }
    }

    if (rol === 'enfermeria' && !servicioId) {
      return res.status(400).json({ mensaje: 'El personal de enfermería debe tener un servicio asignado' });
    }

    const updateData = {};
    if (nombre !== undefined) updateData.nombre = nombre;
    if (email !== undefined) updateData.email = email.toLowerCase();
    if (rol !== undefined) updateData.rol = rol;
    if (typeof activo === 'boolean') updateData.activo = activo;
    if (password) updateData.password = password;

    if (rol && rol !== 'enfermeria') {
      updateData.servicioId = null;
    } else if (servicioId !== undefined) {
      updateData.servicioId = servicioId || null;
    }

    await usuario.update(updateData);
    invalidateUserCache(usuario.id);

    // Si se desactiva a la persona, sus dispositivos dejan de recibir avisos
    if (updateData.activo === false) {
      await SuscripcionPush.destroy({ where: { usuarioId: usuario.id } }).catch(() => {});
    }

    const usuarioActualizado = await Usuario.findByPk(usuario.id, {
      attributes: { exclude: ['password', 'secret2FA', 'fcmToken'] },
      include: [
        { model: Servicio, as: 'servicio', attributes: ['id', 'nombre', 'piso'], required: false }
      ]
    });

    res.json(usuarioActualizado);
  } catch (error) {
    console.error('Error en PUT /api/auxiliares/:id:', error);
    res.status(500).json({ mensaje: 'Error del servidor' });
  }
});

module.exports = router;
