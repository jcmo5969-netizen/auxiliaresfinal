const { Op } = require('sequelize');
const { Solicitud, Usuario } = require('../models');

/**
 * Calcula estadísticas en tiempo real (solicitudes, auxiliares activos/disponibles, etc.)
 * Se usa en el dashboard y se emite por socket al completar una solicitud.
 */
async function calcularEstadisticas() {
  try {
    const totalSolicitudes = await Solicitud.count();
    const pendientes = await Solicitud.count({ where: { estado: 'pendiente' } });
    const enProceso = await Solicitud.count({ where: { estado: 'en_proceso' } });

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const completadasHoy = await Solicitud.count({
      where: {
        estado: 'completada',
        fechaCompletada: { [Op.gte]: hoy }
      }
    });

    const solicitudesCompletadas = await Solicitud.findAll({
      where: {
        estado: 'completada',
        fechaAsignacion: { [Op.ne]: null },
        fechaCompletada: { [Op.ne]: null }
      },
      attributes: [
        [require('sequelize').fn('AVG',
          require('sequelize').literal(`EXTRACT(EPOCH FROM ("fecha_completada" - "fecha_asignacion")) / 60`)
        ), 'tiempoPromedio']
      ],
      raw: true
    });
    const tiempoPromedio = solicitudesCompletadas[0]?.tiempoPromedio || 0;

    // Auxiliares ocupados (con al menos una solicitud asignada o en proceso)
    const auxiliaresOcupados = await Usuario.count({
      include: [{
        model: Solicitud,
        as: 'solicitudesAsignadas',
        where: { estado: { [Op.in]: ['en_proceso', 'asignada'] } },
        required: true
      }],
      distinct: true
    });

    // Total de auxiliares (rol auxiliar)
    const totalAuxiliares = await Usuario.count({
      where: { rol: 'auxiliar' }
    });
    const auxiliaresDisponibles = Math.max(0, totalAuxiliares - auxiliaresOcupados);

    const tasaCompletacion = totalSolicitudes > 0
      ? (completadasHoy / totalSolicitudes) * 100
      : 0;

    return {
      solicitudesTotales: totalSolicitudes,
      pendientes,
      enProceso,
      completadasHoy,
      tiempoPromedio: Math.round(tiempoPromedio),
      auxiliaresActivos: auxiliaresOcupados,
      totalAuxiliares,
      auxiliaresDisponibles,
      tasaCompletacion: Math.round(tasaCompletacion * 10) / 10
    };
  } catch (error) {
    console.error('Error calculando estadísticas:', error);
    return {
      solicitudesTotales: 0,
      pendientes: 0,
      enProceso: 0,
      completadasHoy: 0,
      tiempoPromedio: 0,
      auxiliaresActivos: 0,
      totalAuxiliares: 0,
      auxiliaresDisponibles: 0,
      tasaCompletacion: 0
    };
  }
}

module.exports = { calcularEstadisticas };
