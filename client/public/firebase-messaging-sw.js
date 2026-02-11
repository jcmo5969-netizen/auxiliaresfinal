// Service Worker para Firebase Cloud Messaging
// Este archivo debe estar en la carpeta public/ para que funcione

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Configuración de Firebase (debe coincidir con client/src/utils/firebase.js)
const firebaseConfig = {
  apiKey: "AIzaSyAIcdUMRP_IyiJv0xrdO1o8OrmOyYE8tuk",
  authDomain: "sistema-auxiliares.firebaseapp.com",
  projectId: "sistema-auxiliares",
  storageBucket: "sistema-auxiliares.firebasestorage.app",
  messagingSenderId: "434768515377",
  appId: "1:434768515377:web:5d93114a8a74e6437b2010"
};

// Inicializar Firebase con manejo de errores
let messaging = null;

try {
  // Verificar si Firebase ya está inicializado
  if (!firebase.apps || firebase.apps.length === 0) {
    firebase.initializeApp(firebaseConfig);
  }
  
  // Obtener instancia de messaging
  messaging = firebase.messaging();
} catch (error) {
  console.error('[firebase-messaging-sw.js] Error inicializando Firebase:', error);
  // Continuar sin messaging si hay error
}

function mostrarNotificacionEnSW(payload) {
  var baseUrl = self.location.origin || '';
  var iconUrl = (payload.notification && payload.notification.icon) || (baseUrl + '/logo-hospital-quilpue.svg');
  var badgeUrl = (payload.notification && payload.notification.badge) || (baseUrl + '/logo-hospital-quilpue.svg');
  var title = (payload.notification && payload.notification.title) || (payload.data && payload.data.servicio)
    ? 'Nueva solicitud - ' + (payload.data.servicio || '')
    : 'Nueva solicitud';
  var body = (payload.notification && payload.notification.body) || (payload.data && payload.data.tipoRequerimiento)
    ? 'Se necesita auxiliar: ' + (payload.data.tipoRequerimiento || '')
    : 'Tienes una nueva solicitud pendiente';
  var tag = (payload.data && payload.data.solicitudId) ? ('solicitud-' + payload.data.solicitudId) : ('solicitud-' + Date.now());
  var options = {
    body: body,
    icon: iconUrl,
    badge: badgeUrl,
    tag: tag,
    data: payload.data || {},
    requireInteraction: payload.data && payload.data.prioridad === 'urgente',
    silent: false,
    vibrate: payload.data && payload.data.prioridad === 'urgente' ? [200, 100, 200, 100, 200] : [100, 50, 100],
    renotify: true,
    timestamp: Date.now()
  };
  return self.registration.showNotification(title, options);
}

// Manejar mensajes en segundo plano (visibles en pantalla de bloqueo si el usuario lo permite)
if (messaging) {
  messaging.onBackgroundMessage(function(payload) {
    console.log('[firebase-messaging-sw.js] Mensaje en segundo plano:', payload);
    return mostrarNotificacionEnSW(payload);
  });
} else {
  console.warn('[firebase-messaging-sw.js] Messaging no disponible');
}


// Manejar clic en la notificación
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notificación clickeada:', event);
  
  event.notification.close();
  
  // Abrir o enfocar la ventana de la aplicación
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Si hay una ventana abierta, enfocarla
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      // Si no hay ventana abierta, abrir una nueva
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});

