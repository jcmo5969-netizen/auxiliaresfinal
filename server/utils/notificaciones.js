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
      titulo: `Nueva solicitud en Piso ${solicitud.servicio?.piso || 'N/A'}`,
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

    const mensaje = {
      notification: {
        title: `Nueva solicitud - Piso ${solicitud.servicio.piso}`,
        body: `Se necesita auxiliar para: ${solicitud.tipoRequerimiento.toUpperCase()}. Servicio: ${solicitud.servicio.nombre}`
      },
      data: {
        solicitudId: solicitud.id.toString(),
        tipoRequerimiento: solicitud.tipoRequerimiento,
        piso: solicitud.servicio.piso,
        servicio: solicitud.servicio.nombre,
        prioridad: solicitud.prioridad || 'media'
      },
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'solicitudes_channel'
        }
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1
          }
        }
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

module.exports = { enviarNotificacionPush };
