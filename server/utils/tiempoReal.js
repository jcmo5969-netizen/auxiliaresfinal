/**
 * Avisos en tiempo real por Socket.IO.
 * Solo se envía "algo cambió" + el id: cada pantalla vuelve a pedir sus datos
 * por la API, que ya aplica los permisos de cada rol.
 */
const { calcularEstadisticas } = require('./estadisticas');

let temporizadorEstadisticas = null;

function emitirEstadisticas(io) {
  if (!io || temporizadorEstadisticas) return;
  // Agrupa ráfagas de cambios en un solo cálculo
  temporizadorEstadisticas = setTimeout(async () => {
    temporizadorEstadisticas = null;
    try {
      const estadisticas = await calcularEstadisticas();
      io.to('estadisticas').emit('estadisticas-actualizadas', estadisticas);
    } catch (error) {
      console.error('Error emitiendo estadísticas:', error.message);
    }
  }, 500);
}

/**
 * @param {import('express').Application} app
 * @param {'creada'|'asignada'|'devuelta'|'estado'|'editada'} tipo
 * @param {{ id: number, estado?: string, servicioId?: number }} solicitud
 */
function emitirCambioSolicitud(app, tipo, solicitud) {
  const io = app?.get?.('io');
  if (!io || !solicitud) return;
  io.emit('solicitudes-cambio', {
    tipo,
    solicitudId: solicitud.id,
    estado: solicitud.estado,
    servicioId: solicitud.servicioId
  });
  emitirEstadisticas(io);
}

module.exports = { emitirCambioSolicitud, emitirEstadisticas };
