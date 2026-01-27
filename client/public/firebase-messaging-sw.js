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

// Manejar mensajes en segundo plano
if (messaging) {
  messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Mensaje recibido en segundo plano:', payload);
    
    const notificationTitle = payload.notification?.title || 'Nueva solicitud';
    const notificationOptions = {
      body: payload.notification?.body || 'Tienes una nueva solicitud pendiente',
      icon: payload.notification?.icon || '/logo-hospital-quilpue.png',
      badge: '/logo-hospital-quilpue.png',
      tag: payload.data?.solicitudId || 'solicitud',
      data: payload.data,
      requireInteraction: payload.data?.prioridad === 'urgente',
      vibrate: payload.data?.prioridad === 'urgente' ? [200, 100, 200] : [100]
    };

    return self.registration.showNotification(notificationTitle, notificationOptions);
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

