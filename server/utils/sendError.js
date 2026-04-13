/**
 * Respuesta 500 homogénea. Si EXPOSE_API_ERRORS=true en Render, incluye el mensaje SQL
 * para depurar sin abrir logs (desactivar en producción estable).
 */
function send500(res, error, logLabel) {
  const msg = error?.parent?.message || error?.original?.message || error?.message || 'Error';
  if (logLabel) {
    console.error(logLabel + ':', msg);
  }
  const body = { mensaje: 'Error del servidor' };
  if (process.env.EXPOSE_API_ERRORS === 'true') {
    body.detalle = msg;
  }
  res.status(500).json(body);
}

module.exports = { send500 };
