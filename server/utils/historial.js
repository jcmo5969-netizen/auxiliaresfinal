const { HistorialCambio } = require('../models');

/**
 * Registrar un cambio en el historial de una solicitud
 */
const registrarCambio = async (solicitudId, usuarioId, accion, campo = null, valorAnterior = null, valorNuevo = null, descripcion = null) => {
  try {
    await HistorialCambio.create({
      solicitudId,
      usuarioId,
      accion,
      campo,
      valorAnterior: valorAnterior ? String(valorAnterior) : null,
      valorNuevo: valorNuevo ? String(valorNuevo) : null,
      descripcion
    });
  } catch (error) {
    console.error('Error registrando cambio en historial:', error);
    // No lanzar error para no interrumpir el flujo principal
  }
};

/**
 * Registrar creación de solicitud
 */
const registrarCreacion = async (solicitud, usuarioId) => {
  await registrarCambio(
    solicitud.id,
    usuarioId,
    'crear',
    null,
    null,
    null,
    `Solicitud creada: ${solicitud.tipoRequerimiento} - Prioridad: ${solicitud.prioridad}`
  );
};

/**
 * Registrar cambio de estado
 */
const registrarCambioEstado = async (solicitudId, usuarioId, estadoAnterior, estadoNuevo) => {
  await registrarCambio(
    solicitudId,
    usuarioId,
    'cambiar_estado',
    'estado',
    estadoAnterior,
    estadoNuevo,
    `Estado cambiado de "${estadoAnterior}" a "${estadoNuevo}"`
  );
};

/**
 * Registrar asignación
 */
const registrarAsignacion = async (solicitudId, usuarioId, auxiliarId) => {
  await registrarCambio(
    solicitudId,
    usuarioId,
    'asignar',
    'asignadoAId',
    null,
    auxiliarId,
    `Solicitud asignada a auxiliar`
  );
};

/**
 * Registrar actualización de campo
 */
const registrarActualizacion = async (solicitudId, usuarioId, campo, valorAnterior, valorNuevo) => {
  await registrarCambio(
    solicitudId,
    usuarioId,
    'actualizar',
    campo,
    valorAnterior,
    valorNuevo,
    `${campo} actualizado`
  );
};

module.exports = {
  registrarCambio,
  registrarCreacion,
  registrarCambioEstado,
  registrarAsignacion,
  registrarActualizacion
};



