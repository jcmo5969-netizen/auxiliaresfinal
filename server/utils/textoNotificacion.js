/**
 * Construye los textos de las notificaciones push.
 * Funciones puras (sin BD ni red) para poder probarlas con `npm test`.
 *
 * Lo que se muestra en la pantalla de bloqueo lo puede leer cualquiera que vea
 * el teléfono, así que solo se incluye ubicación y tipo de requerimiento,
 * nunca la descripción libre (puede traer datos del paciente).
 */

const TIPOS = {
  alta: 'Alta',
  traslado: 'Traslado',
  pabellon: 'Pabellón',
  gescas: 'GESCAS',
  otro: 'Otro requerimiento'
};

const TRASLADOS = {
  sin_silla_ni_camilla: 'sin silla ni camilla',
  con_silla: 'con silla de ruedas',
  con_camilla: 'con camilla'
};

const OFFSET_CHILE_HORAS = -4; // misma convención que client/src/utils/fechaHospital.js

function limpio(v) {
  return v == null ? '' : String(v).trim();
}

/** "12" -> "Cama 12" · "cama 12" -> "Cama 12" · "" -> "" */
function textoCama(cama) {
  const c = limpio(cama);
  if (!c) return '';
  if (/^camas?\b/i.test(c)) return c.charAt(0).toUpperCase() + c.slice(1);
  return `Cama ${c}`;
}

/** "3" -> "Piso 3" · "Piso 2" -> "Piso 2" · "N/A" -> "" */
function textoPiso(piso) {
  const p = limpio(piso);
  if (!p || /^(n\/?a|no aplica|-+|sin piso)$/i.test(p)) return '';
  if (/^piso\b/i.test(p)) return p.charAt(0).toUpperCase() + p.slice(1);
  return `Piso ${p}`;
}

/** "Cama 12, piso 3" (omite lo que no exista) */
function textoUbicacion(solicitud) {
  const cama = textoCama(solicitud?.cama);
  const piso = textoPiso(solicitud?.servicio?.piso);
  if (cama && piso) return `${cama}, ${piso.charAt(0).toLowerCase()}${piso.slice(1)}`;
  return cama || piso;
}

function textoTipo(solicitud) {
  const tipo = limpio(solicitud?.tipoRequerimiento);
  let t = TIPOS[tipo] || (tipo ? tipo.charAt(0).toUpperCase() + tipo.slice(1) : 'Requerimiento');
  if (tipo === 'traslado' && TRASLADOS[solicitud.tipoTraslado]) {
    t += ` ${TRASLADOS[solicitud.tipoTraslado]}`;
  }
  if (tipo === 'gescas' && limpio(solicitud.destinoGescas)) {
    t += ` a ${limpio(solicitud.destinoGescas)}`;
  }
  return t;
}

function formatearFechaChile(fecha) {
  const d = new Date(fecha);
  if (Number.isNaN(d.getTime())) return '';
  const c = new Date(d.getTime() + OFFSET_CHILE_HORAS * 3600 * 1000);
  const dd = String(c.getUTCDate()).padStart(2, '0');
  const mm = String(c.getUTCMonth() + 1).padStart(2, '0');
  const hh = String(c.getUTCHours()).padStart(2, '0');
  const mi = String(c.getUTCMinutes()).padStart(2, '0');
  return `${dd}/${mm} ${hh}:${mi}`;
}

/** Línea de detalle: "Medicina Quirúrgica 3 · Traslado con camilla" */
function textoDetalle(solicitud) {
  const partes = [];
  const servicio = limpio(solicitud?.servicio?.nombre);
  if (servicio) partes.push(servicio);
  partes.push(textoTipo(solicitud));
  if (solicitud?.precaucionesEstandar) {
    const tp = limpio(solicitud.tipoPrecaucion);
    partes.push(tp ? `Precaución: ${tp}` : 'Con precauciones');
  }
  return partes.join(' · ');
}

/**
 * Notificación que reciben los auxiliares cuando se crea una solicitud.
 * Ejemplo:
 *   título: "Solicitud de auxiliar"
 *   cuerpo: "Cama 12, piso 3\nMedicina Quirúrgica 3 · Traslado con camilla"
 */
function notificacionNuevaSolicitud(solicitud) {
  const urgente = solicitud?.prioridad === 'urgente' || Boolean(solicitud?.prioridadInmediato);
  const ubicacion = textoUbicacion(solicitud);
  const lineas = [];
  if (ubicacion) lineas.push(ubicacion);
  lineas.push(textoDetalle(solicitud));

  if (solicitud?.fechaProgramada) {
    const cuando = formatearFechaChile(solicitud.fechaProgramada);
    if (cuando) lineas.push(`Programada: ${cuando}`);
  }

  return {
    titulo: urgente ? 'URGENTE: Solicitud de auxiliar' : 'Solicitud de auxiliar',
    cuerpo: lineas.join('\n'),
    urgente
  };
}

/** Aviso a quien pidió el auxiliar: alguien tomó la solicitud. */
function notificacionSolicitudTomada(solicitud, nombreAuxiliar) {
  const ubicacion = textoUbicacion(solicitud);
  return {
    titulo: 'Auxiliar en camino',
    cuerpo: [
      `${limpio(nombreAuxiliar) || 'Un auxiliar'} tomó la solicitud`,
      [ubicacion, textoTipo(solicitud)].filter(Boolean).join(' · ')
    ].filter(Boolean).join('\n')
  };
}

function notificacionSolicitudCompletada(solicitud, nombreAuxiliar) {
  const ubicacion = textoUbicacion(solicitud);
  return {
    titulo: 'Solicitud completada',
    cuerpo: [
      [ubicacion, textoTipo(solicitud)].filter(Boolean).join(' · '),
      limpio(nombreAuxiliar) ? `Realizada por ${limpio(nombreAuxiliar)}` : ''
    ].filter(Boolean).join('\n')
  };
}

/** Aviso a los auxiliares: la solicitud volvió a quedar disponible. */
function notificacionSolicitudDevuelta(solicitud) {
  const base = notificacionNuevaSolicitud(solicitud);
  return {
    ...base,
    titulo: base.urgente ? 'URGENTE: Solicitud disponible nuevamente' : 'Solicitud disponible nuevamente'
  };
}

function notificacionSolicitudCancelada(solicitud) {
  const ubicacion = textoUbicacion(solicitud);
  return {
    titulo: 'Solicitud cancelada',
    cuerpo: [ubicacion, textoDetalle(solicitud)].filter(Boolean).join('\n')
  };
}

function notificacionComentario(solicitud, autorNombre, contenido) {
  const texto = limpio(contenido);
  const recorte = texto.length > 90 ? `${texto.slice(0, 90)}…` : texto;
  const ubicacion = textoUbicacion(solicitud);
  return {
    titulo: ubicacion ? `Comentario · ${ubicacion}` : 'Nuevo comentario en solicitud',
    cuerpo: `${limpio(autorNombre) || 'Usuario'}: ${recorte}`
  };
}

module.exports = {
  textoCama,
  textoPiso,
  textoUbicacion,
  textoTipo,
  textoDetalle,
  formatearFechaChile,
  notificacionNuevaSolicitud,
  notificacionSolicitudTomada,
  notificacionSolicitudCompletada,
  notificacionSolicitudDevuelta,
  notificacionSolicitudCancelada,
  notificacionComentario
};
