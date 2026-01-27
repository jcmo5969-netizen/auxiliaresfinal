const express = require('express');
const QRCode = require('qrcode');
const { auth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/qr/generar
// @desc    Generar código QR para acceso de auxiliares
// @access  Private
router.get('/generar', auth, async (req, res) => {
  try {
    // URL para que los auxiliares escaneen y accedan
    // Usar HashRouter, así que la URL incluye #
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173'
    const urlAcceso = `${clientUrl}/#/auxiliar/acceso`;
    
    console.log('📱 Generando QR con URL:', urlAcceso);
    console.log('📱 CLIENT_URL configurado:', clientUrl);
    
    // Generar QR como imagen base64
    const qrCodeDataURL = await QRCode.toDataURL(urlAcceso, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      width: 300,
      margin: 1
    });

    res.json({
      qrCode: qrCodeDataURL,
      url: urlAcceso
    });
  } catch (error) {
    console.error('❌ Error generando QR:', error);
    res.status(500).json({ mensaje: 'Error generando QR' });
  }
});

module.exports = router;




