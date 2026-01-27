const express = require('express');
const { Solicitud, Usuario, Servicio } = require('../models');
const { auth, esAdministrador } = require('../middleware/auth');
const { Op } = require('sequelize');
const { Sequelize } = require('sequelize');

const router = express.Router();

// Función auxiliar para obtener tiempos por día
async function obtenerTiemposPorDia(whereFecha, campoFecha, nombreCampo) {
  try {
    const where = {
      ...whereFecha,
      estado: 'completada'
    };

    // Agregar condición según el campo de fecha
    if (campoFecha === 'fecha_asignacion') {
      where.fechaAsignacion = { [Op.ne]: null };
    } else if (campoFecha === 'fecha_completada') {
      where.fechaCompletada = { [Op.ne]: null };
      where.fechaAsignacion = { [Op.ne]: null }; // Necesitamos fecha_asignacion también
    }

    // Mapear nombre del campo del modelo al nombre en la BD
    const campoBD = campoFecha === 'fecha_asignacion' ? 'fecha_asignacion' : 'fecha_completada';
    
    // Simplificar: solo calcular si hay datos
    const resultados = await Solicitud.findAll({
      where,
      attributes: [
        [Sequelize.fn('DATE', Sequelize.literal(`"${campoBD}"`)), 'fecha'],
        [Sequelize.fn('AVG', 
          nombreCampo === 'tiempo_respuesta'
            ? Sequelize.literal(`EXTRACT(EPOCH FROM ("fecha_asignacion" - "created_at")) / 60`)
            : Sequelize.literal(`EXTRACT(EPOCH FROM ("fecha_completada" - "fecha_asignacion")) / 60`)
        ), 'tiempoPromedio']
      ],
      group: [Sequelize.fn('DATE', Sequelize.literal(`"${campoBD}"`))],
      order: [[Sequelize.literal('fecha'), 'ASC']],
      raw: true,
      limit: 100 // Limitar resultados
    });

    return resultados.map(r => ({
      fecha: r.fecha ? new Date(r.fecha).toISOString() : null,
      tiempoPromedio: r.tiempoPromedio ? parseFloat(r.tiempoPromedio) : 0
    })).filter(r => r.fecha !== null);
  } catch (error) {
    console.error(`Error obteniendo ${nombreCampo}:`, error.message);
    console.error('Stack:', error.stack);
    return [];
  }
}

// @route   GET /api/metricas/dashboard
// @desc    Obtener métricas para el dashboard
// @access  Private (Admin)
router.get('/dashboard', auth, esAdministrador, async (req, res) => {
  try {
    const { fechaInicio, fechaFin } = req.query;
    
    // Construir filtro de fechas
    const whereFecha = {};
    if (fechaInicio && fechaFin) {
      whereFecha.createdAt = {
        [Op.between]: [new Date(fechaInicio), new Date(fechaFin)]
      };
    }

    // Estadísticas generales
    const totalSolicitudes = await Solicitud.count({ where: whereFecha });
    const pendientes = await Solicitud.count({ where: { ...whereFecha, estado: 'pendiente' } });
    const enProceso = await Solicitud.count({ where: { ...whereFecha, estado: 'en_proceso' } });
    const completadas = await Solicitud.count({ where: { ...whereFecha, estado: 'completada' } });
    const canceladas = await Solicitud.count({ where: { ...whereFecha, estado: 'cancelada' } });

    // Solicitudes por prioridad
    const porPrioridad = await Solicitud.findAll({
      where: whereFecha,
      attributes: [
        'prioridad',
        [Sequelize.fn('COUNT', Sequelize.literal('"id"')), 'cantidad']
      ],
      group: ['prioridad'],
      raw: true
    });

    // Solicitudes por tipo
    const porTipo = await Solicitud.findAll({
      where: whereFecha,
      attributes: [
        'tipoRequerimiento',
        [Sequelize.fn('COUNT', Sequelize.literal('"id"')), 'cantidad']
      ],
      group: ['tipoRequerimiento'],
      raw: true
    });

    // Solicitudes por servicio
    let porServicio = [];
    try {
      porServicio = await Solicitud.findAll({
        where: whereFecha,
        include: [
          { model: Servicio, as: 'servicio', attributes: ['id', 'nombre', 'piso'], required: false }
        ],
        attributes: [
          'servicioId',
          [Sequelize.fn('COUNT', Sequelize.literal('"solicitudes"."id"')), 'cantidad']
        ],
        group: ['servicioId', 'servicio.id', 'servicio.nombre', 'servicio.piso'],
        raw: false
      });
    } catch (error) {
      console.error('Error obteniendo solicitudes por servicio:', error);
      porServicio = [];
    }

    // Tiempo promedio de respuesta (solo completadas)
    const solicitudesCompletadas = await Solicitud.findAll({
      where: {
        ...whereFecha,
        estado: 'completada',
        fechaAsignacion: { [Op.ne]: null },
        fechaCompletada: { [Op.ne]: null }
      },
      attributes: [
        [Sequelize.fn('AVG', 
          Sequelize.literal(`EXTRACT(EPOCH FROM ("fecha_completada" - "fecha_asignacion")) / 60`)
        ), 'tiempoPromedio']
      ],
      raw: true
    });

    const tiempoPromedioMinutos = solicitudesCompletadas[0]?.tiempoPromedio || 0;

    // Auxiliares más activos
    let auxiliaresActivos = [];
    try {
      auxiliaresActivos = await Solicitud.findAll({
        where: {
          ...whereFecha,
          estado: 'completada',
          asignadoAId: { [Op.ne]: null }
        },
        include: [
          { model: Usuario, as: 'asignadoA', attributes: ['id', 'nombre', 'email'], required: false }
        ],
        attributes: [
          'asignadoAId',
          [Sequelize.fn('COUNT', Sequelize.literal('"solicitudes"."id"')), 'completadas']
        ],
        group: ['asignadoAId', 'asignadoA.id', 'asignadoA.nombre', 'asignadoA.email'],
        order: [[Sequelize.literal('completadas'), 'DESC']],
        limit: 10,
        raw: false
      });
    } catch (error) {
      console.error('Error obteniendo auxiliares activos:', error);
      auxiliaresActivos = [];
    }

    // Solicitudes por día (últimos 30 días o según filtro de fechas)
    let solicitudesPorDia = [];
    try {
      const fechaInicioConsulta = fechaInicio 
        ? new Date(fechaInicio) 
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      solicitudesPorDia = await Solicitud.findAll({
        where: {
          createdAt: {
            [Op.gte]: fechaInicioConsulta,
            ...(fechaFin ? { [Op.lte]: new Date(fechaFin) } : {})
          }
        },
        attributes: [
          [Sequelize.fn('DATE', Sequelize.literal('"created_at"')), 'fecha'],
          [Sequelize.fn('COUNT', Sequelize.literal('"id"')), 'cantidad']
        ],
        group: [Sequelize.fn('DATE', Sequelize.literal('"created_at"'))],
        order: [[Sequelize.literal('fecha'), 'ASC']],
        raw: true
      });
    } catch (error) {
      console.error('Error obteniendo solicitudes por día:', error);
      solicitudesPorDia = [];
    }

    res.json({
      generales: {
        total: totalSolicitudes,
        pendientes,
        enProceso,
        completadas,
        canceladas,
        tiempoPromedioMinutos: Math.round(tiempoPromedioMinutos)
      },
      porPrioridad: porPrioridad.map(p => ({
        prioridad: p.prioridad,
        cantidad: parseInt(p.cantidad)
      })),
      porTipo: porTipo.map(t => ({
        tipo: t.tipoRequerimiento,
        cantidad: parseInt(t.cantidad)
      })),
      porServicio: porServicio.map(s => {
        const cantidad = s.dataValues?.cantidad || s.cantidad || 0;
        return {
          servicio: {
            id: s.servicio?.id,
            nombre: s.servicio?.nombre,
            piso: s.servicio?.piso
          },
          cantidad: parseInt(cantidad)
        };
      }),
      auxiliaresActivos: auxiliaresActivos.map(a => {
        const completadas = a.dataValues?.completadas || a.completadas || 0;
        return {
          auxiliar: {
            id: a.asignadoA?.id,
            nombre: a.asignadoA?.nombre,
            email: a.asignadoA?.email
          },
          completadas: parseInt(completadas)
        };
      }),
      solicitudesPorDia: solicitudesPorDia.map(d => ({
        fecha: d.fecha ? new Date(d.fecha).toISOString() : null,
        cantidad: parseInt(d.cantidad) || 0
      })).filter(d => d.fecha !== null),
      // Tiempos de respuesta por día
      tiemposRespuestaPorDia: await obtenerTiemposPorDia(whereFecha, 'fecha_asignacion', 'tiempo_respuesta').catch((err) => {
        console.error('Error en tiemposRespuestaPorDia:', err);
        return [];
      }),
      // Tiempos de completado por día
      tiemposCompletadoPorDia: await obtenerTiemposPorDia(whereFecha, 'fecha_completada', 'tiempo_completado').catch((err) => {
        console.error('Error en tiemposCompletadoPorDia:', err);
        return [];
      })
    });
  } catch (error) {
    console.error('Error en /api/metricas/dashboard:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({ 
      mensaje: 'Error del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

module.exports = router;

