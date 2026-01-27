// Configuración de Firebase para notificaciones push en el cliente
// INSTRUCCIONES: Ve a CONFIGURAR_FIREBASE.md para configurar estos valores

import { initializeApp } from 'firebase/app'
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging'

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAIcdUMRP_IyiJv0xrdO1o8OrmOyYE8tuk",
  authDomain: "sistema-auxiliares.firebaseapp.com",
  projectId: "sistema-auxiliares",
  storageBucket: "sistema-auxiliares.firebasestorage.app",
  messagingSenderId: "434768515377",
  appId: "1:434768515377:web:5d93114a8a74e6437b2010"
}

// VAPID Key para notificaciones push
const VAPID_KEY = "BD8SwPsZNH_moHpKTmn8Xwyzh84XWy4ifomRfDtfh-XC-JnsKTGYw5Zx4FD-OyZ348SCSRL_fBZp9JVcSSh9Zco"

// Inicializar Firebase solo si hay configuración válida
let app = null
let messaging = null
let inicializando = false
let inicializado = false

const inicializarFirebase = async () => {
  // Evitar múltiples inicializaciones
  if (inicializado && messaging) {
    return true
  }
  
  if (inicializando) {
    // Esperar a que termine la inicialización actual
    while (inicializando) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    return inicializado
  }

  inicializando = true

  // Verificar si Firebase está configurado
  if (firebaseConfig.apiKey === "TU_API_KEY" || VAPID_KEY === "TU_VAPID_KEY") {
    console.warn('⚠️ Firebase no está configurado. Ve a CONFIGURAR_FIREBASE.md para configurarlo.')
    inicializando = false
    return false
  }

  // Verificar si el navegador soporta Firebase Messaging
  const supported = await isSupported()
  if (!supported) {
    console.warn('⚠️ Este navegador no soporta Firebase Messaging')
    inicializando = false
    return false
  }

  try {
    // Solo inicializar si no está ya inicializado
    if (!app) {
      app = initializeApp(firebaseConfig)
    }
    if (!messaging) {
      messaging = getMessaging(app)
    }
    inicializado = true
    console.log('✅ Firebase inicializado correctamente')
    return true
  } catch (error) {
    // Si ya está inicializado, es un error de Firebase duplicado, ignorar
    if (error.code === 'app/duplicate-app') {
      inicializado = true
      try {
        messaging = getMessaging(app)
      } catch (e) {
        console.error('❌ Error obteniendo messaging:', e)
      }
      return true
    }
    console.error('❌ Error inicializando Firebase:', error)
    inicializado = false
    return false
  } finally {
    inicializando = false
  }
}

// Solicitar permiso y obtener token FCM
export const solicitarPermisoNotificaciones = async () => {
  if (!messaging) {
    const inicializado = await inicializarFirebase()
    if (!inicializado) {
      console.warn('Firebase Messaging no está disponible')
      return null
    }
  }

  try {
    // Verificar permisos del navegador
    if (!('Notification' in window)) {
      console.warn('Este navegador no soporta notificaciones')
      return null
    }

    const permission = await Notification.requestPermission()
    if (permission === 'granted') {
      try {
        const token = await getToken(messaging, {
          vapidKey: VAPID_KEY
        })
        
        if (token) {
          console.log('✅ Token FCM obtenido:', token.substring(0, 20) + '...')
          
          // Enviar token al servidor
          try {
            const tokenGuardado = localStorage.getItem('token')
            if (!tokenGuardado) {
              console.warn('No hay token de autenticación, no se puede guardar FCM token')
              return token
            }

            const response = await fetch('/api/auth/fcm-token', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${tokenGuardado}`
              },
              body: JSON.stringify({ fcmToken: token })
            })
            
            if (response.ok) {
              console.log('✅ Token FCM registrado en el servidor')
            } else {
              console.error('Error registrando token FCM:', await response.text())
            }
          } catch (error) {
            console.error('Error enviando token FCM al servidor:', error)
          }
        } else {
          console.warn('No se pudo obtener el token FCM')
        }
        
        return token
      } catch (error) {
        console.error('Error obteniendo token FCM:', error)
        return null
      }
    } else {
      console.warn('Permiso de notificaciones denegado')
      return null
    }
  } catch (error) {
    console.error('Error solicitando permiso de notificaciones:', error)
    return null
  }
}

// Escuchar mensajes en primer plano
// Nota: onMessage solo puede registrarse una vez, así que guardamos el callback
let messageCallback = null

export const escucharNotificaciones = (callback) => {
  if (!messaging) {
    console.warn('Firebase Messaging no está disponible')
    return () => {} // Retornar función de limpieza vacía
  }

  // Guardar el callback
  messageCallback = callback

  try {
    // onMessage solo se puede llamar una vez, así que verificamos si ya está registrado
    if (messaging._onMessageRegistered) {
      console.log('⚠️ Listener de mensajes ya registrado')
      return () => {}
    }

    onMessage(messaging, (payload) => {
      console.log('🔔 Mensaje recibido:', payload)
      
      if (messageCallback) {
        messageCallback(payload)
      }
      
      // Mostrar notificación nativa del navegador
      if (Notification.permission === 'granted' && payload.notification) {
        const notification = new Notification(payload.notification.title, {
          body: payload.notification.body,
          icon: payload.notification.icon || '/vite.svg',
          badge: '/vite.svg',
          tag: payload.data?.solicitudId || 'solicitud',
          requireInteraction: payload.data?.prioridad === 'urgente',
          data: payload.data
        })

        // Manejar clic en la notificación
        notification.onclick = () => {
          window.focus()
          notification.close()
          
          // Si hay un ID de solicitud, podrías navegar a esa solicitud
          if (payload.data?.solicitudId) {
            // Aquí podrías agregar lógica para navegar a la solicitud
            console.log('Navegar a solicitud:', payload.data.solicitudId)
          }
        }

        // Cerrar automáticamente después de 5 segundos (excepto si es urgente)
        if (payload.data?.prioridad !== 'urgente') {
          setTimeout(() => {
            notification.close()
          }, 5000)
        }
      }
    })
    
    messaging._onMessageRegistered = true
    
    // Retornar función de limpieza
    return () => {
      messageCallback = null
      messaging._onMessageRegistered = false
    }
  } catch (error) {
    console.error('Error configurando listener de notificaciones:', error)
    return () => {}
  }
}

// Verificar si Firebase está configurado
export const estaFirebaseConfigurado = () => {
  return firebaseConfig.apiKey !== "TU_API_KEY" && VAPID_KEY !== "TU_VAPID_KEY"
}

export { messaging }
