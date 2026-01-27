const express = require('express');
const { body, validationResult } = require('express-validator');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const { Usuario } = require('../models');
const { auth } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/auth/2fa/generar
// @desc    Generar código QR para 2FA
// @access  Private
router.post('/generar', auth, async (req, res) => {
  try {
    const usuario = await Usuario.findByPk(req.usuario.id);
    
    // Generar secreto
    const secret = speakeasy.generateSecret({
      name: `Sistema Auxiliares (${usuario.email})`,
      issuer: 'Sistema de Auxiliares'
    });

    // Guardar secreto temporalmente (no habilitar 2FA aún)
    await usuario.update({
      secret2FA: secret.base32
    });

    // Generar QR Code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

    res.json({
      secret: secret.base32,
      qrCode: qrCodeUrl,
      manualEntryKey: secret.base32
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error del servidor' });
  }
});

// @route   POST /api/auth/2fa/verificar
// @desc    Verificar código 2FA y habilitar
// @access  Private
router.post('/verificar', [
  body('token').isLength({ min: 6, max: 6 }).withMessage('El código debe tener 6 dígitos')
], auth, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errores: errors.array() });
    }

    const usuario = await Usuario.findByPk(req.usuario.id);
    
    if (!usuario.secret2FA) {
      return res.status(400).json({ mensaje: 'Primero debes generar un código QR' });
    }

    // Verificar token
    const verificado = speakeasy.totp.verify({
      secret: usuario.secret2FA,
      encoding: 'base32',
      token: req.body.token,
      window: 2 // Permitir tokens anteriores/posteriores (2 minutos)
    });

    if (!verificado) {
      return res.status(400).json({ mensaje: 'Código inválido' });
    }

    // Habilitar 2FA
    await usuario.update({
      habilitado2FA: true
    });

    res.json({ mensaje: 'Autenticación de dos factores habilitada' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error del servidor' });
  }
});

// @route   POST /api/auth/2fa/deshabilitar
// @desc    Deshabilitar 2FA
// @access  Private
router.post('/deshabilitar', [
  body('password').notEmpty().withMessage('La contraseña es requerida para deshabilitar 2FA')
], auth, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errores: errors.array() });
    }

    const usuario = await Usuario.findByPk(req.usuario.id);
    
    // Verificar contraseña
    const passwordValida = await usuario.comparePassword(req.body.password);
    if (!passwordValida) {
      return res.status(401).json({ mensaje: 'Contraseña incorrecta' });
    }

    // Deshabilitar 2FA
    await usuario.update({
      habilitado2FA: false,
      secret2FA: null
    });

    res.json({ mensaje: 'Autenticación de dos factores deshabilitada' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error del servidor' });
  }
});

// @route   POST /api/auth/2fa/validar
// @desc    Validar código 2FA durante login
// @access  Public (pero requiere token temporal)
router.post('/validar', [
  body('token').isLength({ min: 6, max: 6 }).withMessage('El código debe tener 6 dígitos'),
  body('userId').isInt().withMessage('ID de usuario inválido')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errores: errors.array() });
    }

    const usuario = await Usuario.findByPk(req.body.userId);
    
    if (!usuario || !usuario.habilitado2FA || !usuario.secret2FA) {
      return res.status(400).json({ mensaje: '2FA no está habilitado para este usuario' });
    }

    // Verificar token
    const verificado = speakeasy.totp.verify({
      secret: usuario.secret2FA,
      encoding: 'base32',
      token: req.body.token,
      window: 2
    });

    if (!verificado) {
      return res.status(401).json({ mensaje: 'Código 2FA inválido' });
    }

    res.json({ mensaje: 'Código 2FA válido' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error del servidor' });
  }
});

module.exports = router;



