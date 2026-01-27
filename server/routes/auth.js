const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { Usuario, sequelize } = require('../models');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Generar JWT
const generarToken = (id) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET no está definido');
  }
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// @route   POST /api/auth/registro
// @desc    Registrar nuevo usuario (solo admin)
// @access  Private/Admin
router.post('/registro', [
  body('nombre').notEmpty().withMessage('El nombre es requerido'),
  body('email').isEmail().withMessage('Email inválido'),
  body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
  body('rol').isIn(['administrador', 'auxiliar', 'enfermeria']).withMessage('Rol inválido')
], auth, async (req, res) => {
  try {
    // Solo administradores pueden crear usuarios
    if (req.usuario.rol !== 'administrador') {
      return res.status(403).json({ mensaje: 'Solo los administradores pueden crear usuarios' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errores: errors.array() });
    }

    const { nombre, email, password, rol, servicioId } = req.body;

    // Verificar si el usuario ya existe
    const usuarioExiste = await Usuario.findOne({ where: { email: email.toLowerCase() } });
    if (usuarioExiste) {
      return res.status(400).json({ mensaje: 'El usuario ya existe' });
    }

    // Si es personal de enfermería, debe tener un servicio asignado
    if (rol === 'enfermeria' && !servicioId) {
      return res.status(400).json({ mensaje: 'El personal de enfermería debe tener un servicio asignado' });
    }

    const usuario = await Usuario.create({
      nombre,
      email: email.toLowerCase(),
      password,
      rol,
      servicioId: rol === 'enfermeria' ? servicioId : null
    });

    res.status(201).json({
      mensaje: 'Usuario creado exitosamente',
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol
      }
    });
  } catch (error) {
    console.error('Error en registro:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({ 
      mensaje: 'Error del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/auth/login
// @desc    Iniciar sesión
// @access  Public
router.post('/login', [
  body('email').isEmail().withMessage('Email inválido'),
  body('password').notEmpty().withMessage('La contraseña es requerida')
], async (req, res) => {
  try {
    // Verificar conexión a PostgreSQL
    await sequelize.authenticate();

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errores: errors.array() });
    }

    const { email, password } = req.body;

    // Buscar usuario
    const usuario = await Usuario.findOne({ where: { email: email.toLowerCase() } });
    if (!usuario) {
      return res.status(401).json({ mensaje: 'Credenciales inválidas' });
    }

    if (!usuario.activo) {
      return res.status(401).json({ mensaje: 'Usuario inactivo' });
    }

    // Verificar contraseña
    const passwordValida = await usuario.comparePassword(password);
    if (!passwordValida) {
      return res.status(401).json({ mensaje: 'Credenciales inválidas' });
    }

    // Generar token
    const token = generarToken(usuario.id);

    // Cargar servicio si es personal de enfermería
    let usuarioData = {
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol
    };

    if (usuario.rol === 'enfermeria' && usuario.servicioId) {
      const { Servicio } = require('../models');
      const servicio = await Servicio.findByPk(usuario.servicioId);
      usuarioData.servicio = servicio;
      usuarioData.servicioId = usuario.servicioId;
    }

    res.json({
      token,
      usuario: usuarioData
    });
  } catch (error) {
    console.error('Error en login:', error);
    console.error('Stack:', error.stack);
    
    if (error.name === 'SequelizeConnectionError') {
      return res.status(503).json({ 
        mensaje: 'Servicio no disponible. Base de datos no conectada.',
        error: 'PostgreSQL connection error'
      });
    }
    
    res.status(500).json({ 
      mensaje: 'Error del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/auth/me
// @desc    Obtener usuario actual
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    // El usuario ya viene con el servicio cargado del middleware si es enfermería
    const usuarioData = {
      id: req.usuario.id,
      nombre: req.usuario.nombre,
      email: req.usuario.email,
      rol: req.usuario.rol,
      activo: req.usuario.activo,
      servicioId: req.usuario.servicioId,
      servicioAsignado: req.usuario.servicio || null
    };
    
    res.json(usuarioData);
  } catch (error) {
    console.error('Error en /me:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({ 
      mensaje: 'Error del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/auth/fcm-token
// @desc    Guardar FCM token para notificaciones push
// @access  Private
router.post('/fcm-token', auth, [
  body('fcmToken').notEmpty().withMessage('El token FCM es requerido')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errores: errors.array() });
    }

    const { fcmToken } = req.body;
    await Usuario.update({ fcmToken }, { where: { id: req.usuario.id } });

    res.json({ mensaje: 'Token FCM guardado exitosamente' });
  } catch (error) {
    console.error('Error en fcm-token:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({ 
      mensaje: 'Error del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
