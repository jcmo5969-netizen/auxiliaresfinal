const admin = require('firebase-admin');
const { Usuario } = require('../models');
const { Op } = require('sequelize');

// Inicializar Firebase Admin (se puede hacer de forma condicional si no hay credenciales)
let firebaseInitialized = false;

try {
  let serviceAccount;
  
  // Prioridad 1: Variable de entorno (para producción en Render)
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      console.log('📦 Usando Firebase desde variable de entorno');
    } catch (parseError) {
      console.error('❌ Error parseando FIREBASE_SERVICE_ACCOUNT:', parseError.message);
      throw parseError;
    }
  } 
  // Prioridad 2: Archivo local (para desarrollo)
  else {
    const path = require('path');
    const serviceAccountPath = path.join(__dirname, '..', 'firebase-service-account.json');
    const fs = require('fs');
    
    if (fs.existsSync(serviceAccountPath)) {
      serviceAccount = require(serviceAccountPath);
      console.log('📦 Usando Firebase desde archivo local');
    } else {
      throw new Error('No se encontró configuración de Firebase');
    }
  }
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  firebaseInitialized = true;
  console.log('✅ Firebase Admin inicializado');
} catch (error) {
  console.warn('⚠️  Firebase no configurado. Las notificaciones push no funcionarán.');
  console.warn('   Para desarrollo: Coloca firebase-service-account.json en server/');
  console.warn('   Para producción: Configura FIREBASE_SERVICE_ACCOUNT como variable de entorno');
}

const enviarNotificacionPush = async (solicitud) => {
  if (!firebaseInitialized) {
    console.log('📱 Notificación simulada (Firebase no configurado):', {
      titulo: `Nueva solicitud - ${solicitud.servicio?.nombre || 'N/A'}`,
      cuerpo: `Se necesita auxiliar para: ${solicitud.tipoRequerimiento}`
    });
    console.log('💡 Para activar notificaciones push reales, configura Firebase siguiendo CONFIGURAR_FIREBASE.md');
    return;
  }

  try {
    // Obtener todos los auxiliares activos con FCM token
    const auxiliares = await Usuario.findAll({ 
      where: {
        rol: 'auxiliar', 
        activo: true,
        fcmToken: { [Op.ne]: null }
      }
    });

    if (auxiliares.length === 0) {
      console.log('No hay auxiliares con tokens FCM registrados');
      return;
    }

    const title = `Nueva solicitud - ${solicitud.servicio?.nombre || 'N/A'}`;
    const body = `Se necesita auxiliar para: ${solicitud.tipoRequerimiento.toUpperCase()}. Servicio: ${solicitud.servicio.nombre}`;
    // FCM exige que todos los valores en data sean string
    const data = {
      solicitudId: String(solicitud.id),
      tipoRequerimiento: String(solicitud.tipoRequerimiento || ''),
      servicio: String(solicitud.servicio.nombre || ''),
      prioridad: String(solicitud.prioridad || 'media')
    };

    const mensaje = {
      notification: { title, body },
      data,
      android: {
        priority: 'high',
        notification: { sound: 'default', channelId: 'solicitudes_channel' }
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
            'interruption-level': 'time-sensitive'
          }
        }
      },
      webpush: {
        headers: { Urgency: 'high' },
        notification: { title, body }
      }
    };

    // Enviar a todos los auxiliares
    const tokens = auxiliares.map(a => a.fcmToken).filter(Boolean);
    
    if (tokens.length > 0) {
      const response = await admin.messaging().sendEachForMulticast({
        tokens,
        ...mensaje
      });
      
      console.log(`✅ Notificaciones enviadas: ${response.successCount}/${tokens.length}`);
    }
  } catch (error) {
    console.error('Error enviando notificaciones push:', error);
  }
};

/**
 * Enviar notificación de nuevo comentario al auxiliar asignado y al solicitante (para que reciban alarma en el celular).
 * No se notifica al autor del comentario.
 */
const enviarNotificacionNuevoComentario = async (solicitudId, autorNombre, contenido, autorId) => {
  if (!firebaseInitialized) {
    console.log('📱 Notificación comentario simulada (Firebase no configurado)');
    return;
  }

  try {
    const { Solicitud, Usuario } = require('../models');
    const solicitud = await Solicitud.findByPk(solicitudId, {
      include: [
        { model: Usuario, as: 'asignadoA', attributes: ['id', 'nombre', 'fcmToken'] },
        { model: Usuario, as: 'solicitadoPor', attributes: ['id', 'nombre', 'fcmToken'] }
      ]
    });
    if (!solicitud) return;

    const idsIncluidos = new Set();
    const destinatarios = [];
    const agregar = (u) => {
      if (u?.fcmToken && u.id !== autorId && !idsIncluidos.has(u.id)) {
        idsIncluidos.add(u.id);
        destinatarios.push(u);
      }
    };
    if (solicitud.asignadoA) agregar(solicitud.asignadoA);
    if (solicitud.solicitadoPor) agregar(solicitud.solicitadoPor);

    // Personal de enfermería del mismo servicio (reciben alarma en el celular)
    const enfermeriaServicio = await Usuario.findAll({
      where: { rol: 'enfermeria', servicioId: solicitud.servicioId, fcmToken: { [Op.ne]: null } },
      attributes: ['id', 'nombre', 'fcmToken']
    });
    enfermeriaServicio.forEach(agregar);

    const tokens = destinatarios.map(d => d.fcmToken).filter(Boolean);
    if (tokens.length === 0) return;

    const titulo = 'Nuevo comentario en solicitud';
    const cuerpo = `${autorNombre}: ${(contenido || '').slice(0, 80)}${(contenido && contenido.length > 80) ? '…' : ''}`;
    const mensaje = {
      notification: { title: titulo, body: cuerpo },
      data: {
        solicitudId: String(solicitudId),
        tipo: 'comentario'
      },
      android: {
        priority: 'high',
        notification: { sound: 'default', channelId: 'solicitudes_channel' }
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
            'interruption-level': 'time-sensitive'
          }
        }
      }
    };

    const response = await admin.messaging().sendEachForMulticast({ tokens, ...mensaje });
    console.log(`✅ Notificaciones de comentario enviadas: ${response.successCount}/${tokens.length}`);
  } catch (error) {
    console.error('Error enviando notificación de comentario:', error);
  }
};

module.exports = { enviarNotificacionPush, enviarNotificacionNuevoComentario };
