/**
 * Notificaciones push con el estándar Web Push (VAPID).
 *
 * Funciona en iPhone/iPad (iOS 16.4+ con la app agregada a la pantalla de inicio),
 * Android y computadores, y llega aunque el teléfono esté bloqueado o la app cerrada.
 * No depende de Firebase ni de credenciales externas: las claves VAPID se generan
 * solas la primera vez y se guardan en la base de datos.
 */
const webpush = require('web-push');
const { Op } = require('sequelize');
const { SuscripcionPush, Configuracion, Usuario, Solicitud, Servicio } = require('../models');
const textos = require('./textoNotificacion');

const CLAVE_CONFIG = 'vapid_keys';

// Servicios de push reales de los navegadores. Evita que alguien registre una URL
// arbitraria y use el servidor para hacer peticiones a otros sitios.
const HOSTS_PERMITIDOS = [
  /(^|\.)push\.apple\.com$/i,
  /^fcm\.googleapis\.com$/i,
  /^android\.googleapis\.com$/i,
  /(^|\.)notify\.windows\.com$/i,
  /(^|\.)push\.services\.mozilla\.com$/i
];

const estado = {
  listo: false,
  clavePublica: null,
  origenClaves: null,
  error: null
};
let promesaInicio = null;

function hostsExtra() {
  return String(process.env.PUSH_HOSTS_EXTRA || '')
    .split(',')
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean);
}

function endpointPermitido(endpoint) {
  try {
    const u = new URL(endpoint);
    if (u.protocol !== 'https:') return false;
    const host = u.hostname.toLowerCase();
    return HOSTS_PERMITIDOS.some((re) => re.test(host)) || hostsExtra().includes(host);
  } catch {
    return false;
  }
}

/** Identificador de contacto exigido por el estándar (Apple rechaza valores mal formados). */
function sujetoVapid() {
  const s = String(process.env.VAPID_SUBJECT || '').trim();
  if (/^mailto:[^\s@]+@[^\s@]+$/.test(s) || /^https:\/\/[^\s]+$/.test(s)) return s;
  const cliente = String(process.env.CLIENT_URL || '').trim().replace(/\/$/, '');
  if (/^https:\/\/[^\s/]+\.[^\s/]+/.test(cliente) && !/localhost/i.test(cliente)) return cliente;
  return 'mailto:admin@sistema-auxiliares.com';
}

async function cargarClaves() {
  const pub = String(process.env.VAPID_PUBLIC_KEY || '').trim();
  const priv = String(process.env.VAPID_PRIVATE_KEY || '').trim();
  if (pub && priv) {
    return { publicKey: pub, privateKey: priv, origen: 'variables de entorno' };
  }

  const fila = await Configuracion.findByPk(CLAVE_CONFIG);
  if (fila) {
    const guardadas = JSON.parse(fila.valor);
    if (guardadas.publicKey && guardadas.privateKey) {
      return { ...guardadas, origen: 'base de datos' };
    }
  }

  const nuevas = webpush.generateVAPIDKeys();
  // findOrCreate: si dos instancias arrancan a la vez, ambas terminan usando el mismo par
  const [creada] = await Configuracion.findOrCreate({
    where: { clave: CLAVE_CONFIG },
    defaults: { valor: JSON.stringify(nuevas) }
  });
  const finales = JSON.parse(creada.valor);
  return { ...finales, origen: 'generadas y guardadas en la base de datos' };
}

/** Deja el sistema de push listo. Si la BD no responde, se reintenta en la próxima llamada. */
async function inicializarPush() {
  if (estado.listo) return true;
  if (!promesaInicio) {
    promesaInicio = (async () => {
      try {
        const claves = await cargarClaves();
        webpush.setVapidDetails(sujetoVapid(), claves.publicKey, claves.privateKey);
        estado.listo = true;
        estado.clavePublica = claves.publicKey;
        estado.origenClaves = claves.origen;
        estado.error = null;
        console.log(`[push] Notificaciones push listas (claves VAPID: ${claves.origen})`);
        return true;
      } catch (error) {
        estado.error = error.message;
        console.error('[push] No se pudo inicializar:', error.message);
        return false;
      } finally {
        promesaInicio = null;
      }
    })();
  }
  return promesaInicio;
}

async function obtenerClavePublica() {
  await inicializarPush();
  return estado.clavePublica;
}

function estadoPush() {
  return { ...estado };
}

/** Guarda (o reasigna) el dispositivo para un usuario. */
async function guardarSuscripcion(usuarioId, suscripcion, meta = {}) {
  const endpoint = String(suscripcion?.endpoint || '').trim();
  const p256dh = String(suscripcion?.keys?.p256dh || '').trim();
  const auth = String(suscripcion?.keys?.auth || '').trim();

  if (!endpoint || !p256dh || !auth) {
    const e = new Error('Suscripción incompleta');
    e.status = 400;
    throw e;
  }
  if (endpoint.length > 2000 || p256dh.length > 255 || auth.length > 255 || !endpointPermitido(endpoint)) {
    const e = new Error('Suscripción no válida');
    e.status = 400;
    throw e;
  }

  const datos = {
    usuarioId,
    p256dh,
    auth,
    plataforma: meta.plataforma ? String(meta.plataforma).slice(0, 40) : null,
    userAgent: meta.userAgent ? String(meta.userAgent).slice(0, 400) : null,
    fallosConsecutivos: 0
  };

  const existente = await SuscripcionPush.findOne({ where: { endpoint } });
  if (existente) {
    await existente.update(datos);
    return existente;
  }
  try {
    return await SuscripcionPush.create({ endpoint, ...datos });
  } catch (error) {
    // Dos pestañas registrando el mismo dispositivo a la vez
    if (error.name === 'SequelizeUniqueConstraintError') {
      const otra = await SuscripcionPush.findOne({ where: { endpoint } });
      if (otra) {
        await otra.update(datos);
        return otra;
      }
    }
    throw error;
  }
}

async function eliminarSuscripcion(usuarioId, endpoint) {
  if (!endpoint) return 0;
  return SuscripcionPush.destroy({ where: { usuarioId, endpoint: String(endpoint) } });
}

/**
 * Envía una notificación a una lista de suscripciones.
 * Nunca lanza: devuelve un resumen { total, enviados, fallidos, eliminados }.
 */
async function enviarASuscripciones(suscripciones, notificacion, opciones = {}) {
  const resumen = { total: suscripciones.length, enviados: 0, fallidos: 0, eliminados: 0 };
  if (suscripciones.length === 0) return resumen;

  if (!(await inicializarPush())) {
    resumen.fallidos = suscripciones.length;
    return resumen;
  }

  const cuerpo = JSON.stringify({
    titulo: notificacion.titulo,
    cuerpo: notificacion.cuerpo || '',
    tag: notificacion.tag || undefined,
    url: notificacion.url || '/',
    urgente: Boolean(notificacion.urgente),
    datos: notificacion.datos || {}
  });

  const opcionesEnvio = {
    TTL: opciones.ttl ?? 2 * 60 * 60, // si el teléfono está sin señal, se reintenta hasta 2 horas
    urgency: 'high', // despierta el dispositivo aunque esté en reposo
    timeout: 10000
  };
  // "topic": si hay un aviso pendiente de la misma solicitud, el nuevo lo reemplaza
  if (notificacion.tag && /^[A-Za-z0-9_-]{1,32}$/.test(notificacion.tag)) {
    opcionesEnvio.topic = notificacion.tag;
  }

  const exitosas = [];
  const caducadas = [];
  const conError = [];

  await Promise.all(
    suscripciones.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          cuerpo,
          opcionesEnvio
        );
        exitosas.push(s.id);
      } catch (error) {
        const codigo = error.statusCode;
        if (codigo === 404 || codigo === 410) {
          // El usuario desinstaló la app o revocó el permiso: la suscripción ya no existe
          caducadas.push(s.id);
        } else {
          conError.push(s.id);
          const detalle = String(error.body || error.message || '').slice(0, 200);
          console.error(`[push] Error ${codigo || ''} enviando al dispositivo #${s.id} (usuario ${s.usuarioId}): ${detalle}`);
        }
      }
    })
  );

  try {
    if (exitosas.length) {
      await SuscripcionPush.update(
        { ultimoEnvio: new Date(), fallosConsecutivos: 0 },
        { where: { id: { [Op.in]: exitosas } } }
      );
    }
    if (caducadas.length) {
      await SuscripcionPush.destroy({ where: { id: { [Op.in]: caducadas } } });
    }
    if (conError.length) {
      await SuscripcionPush.increment('fallosConsecutivos', { where: { id: { [Op.in]: conError } } });
    }
  } catch (error) {
    console.error('[push] Error actualizando estado de suscripciones:', error.message);
  }

  resumen.enviados = exitosas.length;
  resumen.eliminados = caducadas.length;
  resumen.fallidos = conError.length;
  return resumen;
}

async function suscripcionesDeUsuarios(ids) {
  const unicos = [...new Set(ids.filter((id) => id != null))];
  if (unicos.length === 0) return [];
  return SuscripcionPush.findAll({
    where: { usuarioId: { [Op.in]: unicos } },
    include: [{ model: Usuario, as: 'usuario', attributes: [], where: { activo: true }, required: true }]
  });
}

async function suscripcionesDeRol(rol, { excluirUsuarioId } = {}) {
  const where = {};
  if (excluirUsuarioId != null) where.usuarioId = { [Op.ne]: excluirUsuarioId };
  return SuscripcionPush.findAll({
    where,
    include: [{ model: Usuario, as: 'usuario', attributes: [], where: { rol, activo: true }, required: true }]
  });
}

async function enviarAUsuarios(ids, notificacion, opciones) {
  return enviarASuscripciones(await suscripcionesDeUsuarios(ids), notificacion, opciones);
}

function registrar(etiqueta, r) {
  const extra = r.eliminados ? `, ${r.eliminados} caducado(s) eliminado(s)` : '';
  const fallos = r.fallidos ? `, ${r.fallidos} con error` : '';
  console.log(`[push] ${etiqueta}: ${r.enviados}/${r.total} dispositivo(s)${fallos}${extra}`);
}

const RUTA_AUXILIAR = '/#/auxiliar/acceso';
const RUTA_INICIO = '/#/';

// ─── Avisos del flujo de solicitudes ────────────────────────────────────────
// Ninguno lanza errores: una falla de push nunca debe impedir crear o tomar una solicitud.

/** Nueva solicitud → todos los auxiliares activos. */
async function notificarNuevaSolicitud(solicitud) {
  try {
    const t = textos.notificacionNuevaSolicitud(solicitud);
    const subs = await suscripcionesDeRol('auxiliar');
    const r = await enviarASuscripciones(subs, {
      ...t,
      tag: `solicitud-${solicitud.id}`,
      url: RUTA_AUXILIAR,
      datos: { tipo: 'nueva-solicitud', solicitudId: solicitud.id }
    });
    registrar(`nueva solicitud #${solicitud.id}`, r);
    return r;
  } catch (error) {
    console.error('[push] notificarNuevaSolicitud:', error.message);
    return null;
  }
}

/** El auxiliar devolvió la solicitud → vuelve a avisarse al resto de auxiliares. */
async function notificarSolicitudDevuelta(solicitud, auxiliarQueDevuelveId) {
  try {
    const t = textos.notificacionSolicitudDevuelta(solicitud);
    const subs = await suscripcionesDeRol('auxiliar', { excluirUsuarioId: auxiliarQueDevuelveId });
    const r = await enviarASuscripciones(subs, {
      ...t,
      tag: `solicitud-${solicitud.id}`,
      url: RUTA_AUXILIAR,
      datos: { tipo: 'solicitud-devuelta', solicitudId: solicitud.id }
    });
    registrar(`solicitud #${solicitud.id} devuelta`, r);
    return r;
  } catch (error) {
    console.error('[push] notificarSolicitudDevuelta:', error.message);
    return null;
  }
}

/** Un auxiliar tomó la solicitud → aviso a quien la pidió. */
async function notificarSolicitudTomada(solicitud, actorId) {
  try {
    if (!solicitud.solicitadoPorId || solicitud.solicitadoPorId === actorId) return null;
    const t = textos.notificacionSolicitudTomada(solicitud, solicitud.asignadoA?.nombre);
    const r = await enviarAUsuarios([solicitud.solicitadoPorId], {
      ...t,
      tag: `solicitud-${solicitud.id}`,
      url: RUTA_INICIO,
      datos: { tipo: 'solicitud-tomada', solicitudId: solicitud.id }
    });
    registrar(`solicitud #${solicitud.id} tomada`, r);
    return r;
  } catch (error) {
    console.error('[push] notificarSolicitudTomada:', error.message);
    return null;
  }
}

/** Solicitud completada → aviso a quien la pidió. */
async function notificarSolicitudCompletada(solicitud, actorId) {
  try {
    if (!solicitud.solicitadoPorId || solicitud.solicitadoPorId === actorId) return null;
    const t = textos.notificacionSolicitudCompletada(solicitud, solicitud.asignadoA?.nombre);
    const r = await enviarAUsuarios([solicitud.solicitadoPorId], {
      ...t,
      tag: `solicitud-${solicitud.id}`,
      url: RUTA_INICIO,
      datos: { tipo: 'solicitud-completada', solicitudId: solicitud.id }
    });
    registrar(`solicitud #${solicitud.id} completada`, r);
    return r;
  } catch (error) {
    console.error('[push] notificarSolicitudCompletada:', error.message);
    return null;
  }
}

/** Solicitud cancelada → aviso al auxiliar que la tenía asignada (si no la canceló él). */
async function notificarSolicitudCancelada(solicitud, auxiliarAsignadoId, actorId) {
  try {
    if (!auxiliarAsignadoId || auxiliarAsignadoId === actorId) return null;
    const t = textos.notificacionSolicitudCancelada(solicitud);
    const r = await enviarAUsuarios([auxiliarAsignadoId], {
      ...t,
      tag: `solicitud-${solicitud.id}`,
      url: RUTA_AUXILIAR,
      datos: { tipo: 'solicitud-cancelada', solicitudId: solicitud.id }
    });
    registrar(`solicitud #${solicitud.id} cancelada`, r);
    return r;
  } catch (error) {
    console.error('[push] notificarSolicitudCancelada:', error.message);
    return null;
  }
}

/** Nuevo comentario → auxiliar asignado, solicitante y enfermería del servicio (menos el autor). */
async function notificarComentario(solicitudId, autor, contenido) {
  try {
    const solicitud = await Solicitud.findByPk(solicitudId, {
      include: [{ model: Servicio, as: 'servicio', attributes: ['id', 'nombre', 'piso'] }]
    });
    if (!solicitud) return null;

    const enfermeria = await Usuario.findAll({
      where: { rol: 'enfermeria', servicioId: solicitud.servicioId, activo: true },
      attributes: ['id']
    });
    const destinatarios = [solicitud.asignadoAId, solicitud.solicitadoPorId, ...enfermeria.map((u) => u.id)]
      .filter((id) => id != null && id !== autor.id);

    const t = textos.notificacionComentario(solicitud, autor.nombre, contenido);
    const r = await enviarAUsuarios(destinatarios, {
      ...t,
      tag: `comentario-${solicitud.id}`,
      url: RUTA_INICIO,
      datos: { tipo: 'comentario', solicitudId: solicitud.id }
    });
    registrar(`comentario en solicitud #${solicitud.id}`, r);
    return r;
  } catch (error) {
    console.error('[push] notificarComentario:', error.message);
    return null;
  }
}

/** Notificación de prueba para que el usuario confirme que su teléfono la recibe. */
async function enviarPrueba(usuarioId, endpoint) {
  const where = { usuarioId };
  if (endpoint) where.endpoint = String(endpoint);
  const subs = await SuscripcionPush.findAll({ where });
  return enviarASuscripciones(
    subs,
    {
      titulo: 'Notificación de prueba',
      cuerpo: 'Así llegarán los avisos de solicitud de auxiliar, también con el teléfono bloqueado.',
      tag: 'prueba',
      url: RUTA_INICIO,
      datos: { tipo: 'prueba' }
    },
    { ttl: 300 }
  );
}

module.exports = {
  inicializarPush,
  obtenerClavePublica,
  estadoPush,
  endpointPermitido,
  guardarSuscripcion,
  eliminarSuscripcion,
  enviarASuscripciones,
  enviarAUsuarios,
  enviarPrueba,
  notificarNuevaSolicitud,
  notificarSolicitudDevuelta,
  notificarSolicitudTomada,
  notificarSolicitudCompletada,
  notificarSolicitudCancelada,
  notificarComentario
};
