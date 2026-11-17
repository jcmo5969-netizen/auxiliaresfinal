/*
 * Service worker de notificaciones push.
 *
 * Recibe el aviso del servidor y lo muestra como notificación del sistema,
 * también con el teléfono bloqueado o la app cerrada.
 *
 * Importante (iPhone): cada push recibido DEBE terminar mostrando una notificación.
 * Si no, iOS cancela la suscripción tras unos pocos avisos. Por eso todo el manejo
 * tiene respaldo y nunca se sale sin llamar a showNotification.
 */

var API = '';
try {
  API = new URL(self.location.href).searchParams.get('api') || '';
} catch (e) {
  API = '';
}

self.addEventListener('install', function () {
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil(self.clients.claim());
});

function leerDatos(event) {
  if (!event.data) return {};
  try {
    return event.data.json() || {};
  } catch (e) {
    try {
      return { cuerpo: event.data.text() };
    } catch (e2) {
      return {};
    }
  }
}

function avisarVentanas(mensaje) {
  return self.clients
    .matchAll({ type: 'window', includeUncontrolled: true })
    .then(function (lista) {
      lista.forEach(function (cliente) {
        cliente.postMessage(mensaje);
      });
    })
    .catch(function () {});
}

self.addEventListener('push', function (event) {
  var d = leerDatos(event);
  var datos = d.datos || {};
  var titulo = d.titulo || 'Solicitud de auxiliar';
  var cuerpo = d.cuerpo || '';
  var esSolicitud = datos.tipo === 'nueva-solicitud' || datos.tipo === 'solicitud-devuelta';

  var opciones = {
    body: cuerpo,
    icon: '/icons/icon-192.png',
    badge: '/icons/badge-96.png',
    tag: d.tag || 'auxiliares',
    renotify: true, // vuelve a sonar aunque reemplace a un aviso anterior de la misma solicitud
    requireInteraction: Boolean(d.urgente) || esSolicitud,
    vibrate: d.urgente ? [500, 200, 500, 200, 500] : [300, 150, 300],
    timestamp: Date.now(),
    data: { url: d.url || '/', datos: datos }
  };

  var mostrar = self.registration.showNotification(titulo, opciones).catch(function () {
    // Algún navegador puede rechazar una opción: se reintenta con lo mínimo
    return self.registration.showNotification(titulo, { body: cuerpo, data: opciones.data });
  });

  event.waitUntil(
    Promise.all([mostrar, avisarVentanas({ tipo: 'push-recibido', datos: datos })])
  );
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  var info = event.notification.data || {};
  var destino = new URL(info.url || '/', self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (lista) {
      for (var i = 0; i < lista.length; i++) {
        var cliente = lista[i];
        var mismoOrigen = false;
        try {
          mismoOrigen = new URL(cliente.url).origin === self.location.origin;
        } catch (e) {
          mismoOrigen = false;
        }
        if (mismoOrigen && 'focus' in cliente) {
          cliente.postMessage({ tipo: 'notificacion-click', datos: info.datos || {} });
          return cliente.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(destino);
    })
  );
});

// El navegador renovó la suscripción por su cuenta: se informa al servidor para no perder avisos
self.addEventListener('pushsubscriptionchange', function (event) {
  var anterior = event.oldSubscription;
  if (!anterior) return;

  var obtenerNueva = event.newSubscription
    ? Promise.resolve(event.newSubscription)
    : self.registration.pushManager.subscribe(anterior.options).catch(function () {
        return null;
      });

  event.waitUntil(
    obtenerNueva.then(function (nueva) {
      return fetch(API + '/api/push/renovar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpointAnterior: anterior.endpoint,
          suscripcion: nueva ? nueva.toJSON() : null
        })
      }).catch(function () {});
    })
  );
});
