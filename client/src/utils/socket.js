import { useEffect, useRef } from 'react'
import { io } from 'socket.io-client'
import { API_URL } from './api'
import { getItem } from './storage'

/**
 * Crea una conexión Socket.IO autenticada con la sesión actual.
 * El servidor rechaza conexiones sin token.
 */
export function crearSocket() {
  return io(API_URL || undefined, {
    transports: ['websocket', 'polling'],
    // Se evalúa en cada reconexión, por si el token cambió
    auth: (cb) => cb({ token: getItem('token') })
  })
}

/**
 * Llama a `alCambiar` cada vez que cambia alguna solicitud (creada, tomada,
 * devuelta, completada…) o llega un aviso push con la app abierta.
 * La pantalla solo tiene que volver a cargar sus datos.
 */
export function useSolicitudesEnVivo(alCambiar, activo = true) {
  const ref = useRef(alCambiar)
  ref.current = alCambiar

  useEffect(() => {
    if (!activo) return undefined

    let pendiente = null
    const avisar = (evento) => {
      // Agrupa ráfagas de eventos en una sola recarga
      if (pendiente) return
      pendiente = setTimeout(() => {
        pendiente = null
        ref.current?.(evento)
      }, 250)
    }

    const socket = crearSocket()
    socket.on('solicitudes-cambio', avisar)
    // Al reconectar puede haberse perdido algún evento
    socket.io.on('reconnect', () => avisar({ tipo: 'reconexion' }))

    const alMensajeSW = (e) => {
      const tipo = e.data?.tipo
      if (tipo === 'push-recibido' || tipo === 'notificacion-click') avisar({ tipo })
    }
    navigator.serviceWorker?.addEventListener?.('message', alMensajeSW)

    // Al volver a la app (desbloquear el teléfono, cambiar de pestaña) se refresca
    const alVolver = () => {
      if (!document.hidden) avisar({ tipo: 'visible' })
    }
    document.addEventListener('visibilitychange', alVolver)
    window.addEventListener('focus', alVolver)

    return () => {
      if (pendiente) clearTimeout(pendiente)
      socket.disconnect()
      navigator.serviceWorker?.removeEventListener?.('message', alMensajeSW)
      document.removeEventListener('visibilitychange', alVolver)
      window.removeEventListener('focus', alVolver)
    }
  }, [activo])
}
