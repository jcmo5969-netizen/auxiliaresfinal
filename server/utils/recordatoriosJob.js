/**
 * Cada minuto busca recordatorios cuya hora ya llegó y avisa al usuario por push.
 */
const { Op } = require('sequelize');
const { Recordatorio } = require('../models');
const { enviarAUsuarios } = require('./push');

async function revisarRecordatorios() {
  const ahora = new Date();
  // No avisar recordatorios muy antiguos (p. ej. tras varias horas con el servidor dormido)
  const limiteAntiguedad = new Date(ahora.getTime() - 6 * 60 * 60 * 1000);

  const pendientes = await Recordatorio.findAll({
    where: {
      notificado: false,
      completado: false,
      fechaHora: { [Op.lte]: ahora, [Op.gte]: limiteAntiguedad }
    },
    limit: 50
  });

  for (const r of pendientes) {
    // Se marca primero: si el envío falla no se repite el aviso en bucle
    await r.update({ notificado: true });
    await enviarAUsuarios([r.usuarioId], {
      titulo: `Recordatorio: ${r.titulo}`,
      cuerpo: r.descripcion ? String(r.descripcion).slice(0, 120) : '',
      tag: `recordatorio-${r.id}`,
      url: '/#/',
      datos: { tipo: 'recordatorio', recordatorioId: r.id, solicitudId: r.solicitudId }
    });
  }
}

function iniciarAvisosRecordatorios() {
  const intervalo = setInterval(() => {
    revisarRecordatorios().catch((error) => {
      // La tabla puede no existir todavía si la BD aún no está lista
      if (!/does not exist|no existe|ECONNREFUSED|ConnectionError/i.test(String(error.message))) {
        console.error('Error revisando recordatorios:', error.message);
      }
    });
  }, 60000);
  intervalo.unref();
  return intervalo;
}

module.exports = { iniciarAvisosRecordatorios, revisarRecordatorios };
