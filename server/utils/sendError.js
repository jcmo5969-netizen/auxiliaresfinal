/**
 * Devuelve 503 si el DB está en recovery/arranque (error transitorio),
 * o 500 para cualquier otro error interno.
 * Si EXPOSE_API_ERRORS=true incluye el detalle para depurar.
 */
function send500(res, error, logLabel) {
  const msg = error?.parent?.message || error?.original?.message || error?.message || 'Error';
  if (logLabel) {
    console.error(logLabel + ':', msg);
  }

  // Códigos PostgreSQL de error transitorio: recovery mode (57P03), shutdown (57P01)
  const pgCode = error?.parent?.code || error?.original?.code || error?.code;
  const esTransitorio = pgCode === '57P03' || pgCode === '57P01' ||
    /recovery mode|starting up|shut down/i.test(msg);

  const status = esTransitorio ? 503 : 500;
  const body = { mensaje: esTransitorio ? 'Base de datos no disponible temporalmente, reintente en unos segundos' : 'Error del servidor' };

  if (process.env.EXPOSE_API_ERRORS === 'true') {
    body.detalle = msg;
  }
  res.status(status).json(body);
}

module.exports = { send500 };
