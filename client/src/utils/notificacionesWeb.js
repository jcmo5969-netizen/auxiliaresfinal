// Sistema de notificaciones web nativas (funciona sin Firebase)
// Funciona en navegadores modernos y dispositivos móviles

let notificationPermission = null

// Verificar y solicitar permiso de notificaciones
export const solicitarPermisoNotificaciones = async () => {
  if (!('Notification' in window)) {
    console.warn('Este navegador no soporta notificaciones')
    return { activo: false, mensaje: 'Tu navegador no soporta notificaciones' }
  }

  if (Notification.permission === 'granted') {
    notificationPermission = 'granted'
    return { activo: true, mensaje: 'Notificaciones activadas' }
  }

  if (Notification.permission === 'denied') {
    // Si el permiso está denegado, no se puede solicitar nuevamente automáticamente
    // El usuario debe habilitarlo manualmente en la configuración del navegador
    notificationPermission = 'denied'
    return { 
      activo: false, 
      mensaje: 'Permiso denegado. Por favor, habilita las notificaciones en la configuración de tu navegador.',
      denegado: true
    }
  }

  // Si el permiso es 'default', podemos solicitarlo
  try {
    const permission = await Notification.requestPermission()
    notificationPermission = permission
    
    if (permission === 'granted') {
      return { activo: true, mensaje: 'Notificaciones activadas' }
    } else if (permission === 'denied') {
      return { 
        activo: false, 
        mensaje: 'Permiso denegado. Por favor, habilita las notificaciones en la configuración de tu navegador.',
        denegado: true
      }
    } else {
      return { activo: false, mensaje: 'Permiso no concedido' }
    }
  } catch (error) {
    console.error('Error solicitando permiso:', error)
    return { activo: false, mensaje: 'Error al solicitar permiso de notificaciones' }
  }
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



