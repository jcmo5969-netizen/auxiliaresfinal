// Sistema de notificaciones web nativas (funciona sin Firebase)
// Funciona en navegadores modernos y dispositivos móviles

let notificationPermission = null

// Verificar y solicitar permiso de notificaciones
export const solicitarPermisoNotificaciones = async () => {
  if (!('Notification' in window)) {
    console.warn('Este navegador no soporta notificaciones')
    return false
  }

  if (Notification.permission === 'granted') {
    notificationPermission = 'granted'
    return true
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission()
    notificationPermission = permission
    return permission === 'granted'
  }

  return false
}

// Enviar notificación local
export const mostrarNotificacion = (titulo, opciones = {}) => {
  if (!('Notification' in window)) {
    return null
  }

  if (Notification.permission === 'granted') {
    const notificacion = new Notification(titulo, {
      body: opciones.cuerpo || '',
      icon: opciones.icono || '/icon-192x192.png',
      badge: '/icon-192x192.png',
      tag: opciones.tag || 'solicitud',
      requireInteraction: opciones.urgente || false,
      data: opciones.data || {}
    })

    // Cerrar automáticamente después de 5 segundos si no es urgente
    if (!opciones.urgente) {
      setTimeout(() => {
        notificacion.close()
      }, 5000)
    }

    // Manejar clic en la notificación
    notificacion.onclick = () => {
      window.focus()
      if (opciones.onClick) {
        opciones.onClick()
      }
      notificacion.close()
    }

    return notificacion
  }

  return null
}

// Verificar estado de permisos
export const obtenerEstadoPermisos = () => {
  if (!('Notification' in window)) {
    return 'no-soportado'
  }
  return Notification.permission
}

// Escuchar cambios en el estado de permisos
export const escucharCambiosPermisos = (callback) => {
  if (!('Notification' in window)) {
    return
  }

  // Verificar periódicamente (cada 5 segundos)
  const intervalo = setInterval(() => {
    const nuevoEstado = Notification.permission
    if (nuevoEstado !== notificationPermission) {
      notificationPermission = nuevoEstado
      if (callback) {
        callback(nuevoEstado)
      }
    }
  }, 5000)

  return () => clearInterval(intervalo)
}



