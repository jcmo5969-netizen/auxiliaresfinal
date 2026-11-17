/**
 * Notificaciones push del navegador (estándar Web Push).
 *
 * Llegan con el teléfono bloqueado o la app cerrada en:
 *  - iPhone / iPad con iOS 16.4 o superior, SOLO si la app se agregó a la pantalla
 *    de inicio y se abre desde ese ícono (requisito de Apple).
 *  - Android (Chrome, Edge, Samsung Internet…) y computadores.
 */
import api, { API_URL } from './api'
import { getItem } from './storage'

export function esIOS() {
  if (typeof navigator === 'undefined') return false
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    // iPadOS se presenta como Mac
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  )
}

export function esAndroid() {
  return typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent)
}

/** true si la app se abrió desde el ícono de la pantalla de inicio */
export function esAppInstalada() {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia?.('(display-mode: standalone)')?.matches === true ||
    window.navigator.standalone === true
  )
}

export function soportaPush() {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  )
}

function plataforma() {
  if (esIOS()) return 'ios'
  if (esAndroid()) return 'android'
  return 'escritorio'
}

function claveABytes(base64url) {
  const relleno = '='.repeat((4 - (base64url.length % 4)) % 4)
  const base64 = (base64url + relleno).replace(/-/g, '+').replace(/_/g, '/')
  const crudo = atob(base64)
  const bytes = new Uint8Array(crudo.length)
  for (let i = 0; i < crudo.length; i++) bytes[i] = crudo.charCodeAt(i)
  return bytes
}

function mismaClave(suscripcion, bytes) {
  const actual = suscripcion?.options?.applicationServerKey
  if (!actual) return true // el navegador no la expone: se asume válida
  const a = new Uint8Array(actual)
  if (a.length !== bytes.length) return false
  for (let i = 0; i < a.length; i++) if (a[i] !== bytes[i]) return false
  return true
}

let promesaRegistro = null

/** Registra el service worker (y retira el antiguo de Firebase si quedó instalado). */
export function registrarServiceWorker() {
  if (!('serviceWorker' in navigator)) return Promise.resolve(null)
  if (!promesaRegistro) {
    promesaRegistro = (async () => {
      try {
        const existentes = await navigator.serviceWorker.getRegistrations()
        await Promise.all(
          existentes
            .filter((r) => {
              const url = r.active?.scriptURL || r.waiting?.scriptURL || r.installing?.scriptURL || ''
              return url.includes('firebase-messaging-sw')
            })
            .map((r) => r.unregister())
        )
      } catch (_) {
        // sin acceso a los registros: se continúa igual
      }
      const url = '/sw.js' + (API_URL ? `?api=${encodeURIComponent(API_URL)}` : '')
      await navigator.serviceWorker.register(url, { scope: '/' })
      return navigator.serviceWorker.ready
    })().catch((error) => {
      promesaRegistro = null
      throw error
    })
  }
  return promesaRegistro
}

async function suscripcionActual() {
  if (!soportaPush()) return null
  try {
    const registro = await registrarServiceWorker()
    return registro ? await registro.pushManager.getSubscription() : null
  } catch (_) {
    return null
  }
}

/**
 * Estado de las notificaciones en este dispositivo:
 *  'activo'        → suscrito, recibe avisos
 *  'activable'     → falta que la persona toque "Activar"
 *  'instalar'      → iPhone/iPad abierto en el navegador: primero agregar a inicio
 *  'ios-antiguo'   → iPhone/iPad instalado pero con iOS anterior a 16.4
 *  'denegado'      → la persona bloqueó el permiso
 *  'no-soportado'  → navegador sin soporte
 */
export async function obtenerEstadoNotificaciones() {
  if (esIOS() && !esAppInstalada()) return 'instalar'
  if (!soportaPush()) return esIOS() ? 'ios-antiguo' : 'no-soportado'
  if (Notification.permission === 'denied') return 'denegado'
  if (Notification.permission !== 'granted') return 'activable'
  return (await suscripcionActual()) ? 'activo' : 'activable'
}

async function suscribirYRegistrar() {
  const registro = await registrarServiceWorker()
  const { data } = await api.get('/api/push/clave-publica')
  const clave = claveABytes(data.clavePublica)

  let suscripcion = await registro.pushManager.getSubscription()
  if (suscripcion && !mismaClave(suscripcion, clave)) {
    // Suscripción del sistema anterior (Firebase) o de otras claves: no sirve
    await suscripcion.unsubscribe().catch(() => {})
    suscripcion = null
  }
  if (!suscripcion) {
    suscripcion = await registro.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: clave
    })
  }

  await api.post('/api/push/suscripcion', {
    suscripcion: suscripcion.toJSON(),
    plataforma: plataforma()
  })
  return suscripcion
}

/**
 * Pide permiso y suscribe este dispositivo.
 * Debe llamarse directamente desde un toque/clic del usuario: iOS ignora la
 * solicitud de permiso si no viene de un gesto. Por eso el permiso es lo primero.
 * @returns {Promise<{ok: boolean, estado: string, mensaje?: string}>}
 */
export async function activarNotificaciones() {
  if (esIOS() && !esAppInstalada()) return { ok: false, estado: 'instalar' }
  if (!soportaPush()) return { ok: false, estado: esIOS() ? 'ios-antiguo' : 'no-soportado' }

  let permiso
  try {
    permiso = await Notification.requestPermission()
  } catch (_) {
    permiso = Notification.permission
  }
  if (permiso === 'denied') return { ok: false, estado: 'denegado' }
  if (permiso !== 'granted') return { ok: false, estado: 'activable', mensaje: 'No se concedió el permiso' }

  try {
    await suscribirYRegistrar()
    return { ok: true, estado: 'activo' }
  } catch (error) {
    console.error('Error activando notificaciones:', error)
    return {
      ok: false,
      estado: 'activable',
      mensaje: error.response?.data?.mensaje || 'No se pudo registrar este dispositivo. Revisa la conexión e inténtalo de nuevo.'
    }
  }
}

/**
 * Al abrir la app con sesión iniciada: si el permiso ya está concedido, renueva el
 * registro del dispositivo en el servidor (y lo asocia al usuario actual). No muestra nada.
 */
export async function sincronizarNotificaciones() {
  try {
    if (esIOS() && !esAppInstalada()) return 'instalar'
    if (!soportaPush()) return esIOS() ? 'ios-antiguo' : 'no-soportado'
    await registrarServiceWorker()
    if (Notification.permission === 'denied') return 'denegado'
    if (Notification.permission !== 'granted') return 'activable'
    await suscribirYRegistrar()
    return 'activo'
  } catch (error) {
    console.warn('No se pudo sincronizar las notificaciones:', error?.message)
    return obtenerEstadoNotificaciones().catch(() => 'activable')
  }
}

/**
 * Al cerrar sesión: este dispositivo deja de recibir avisos de ese usuario.
 * El token se captura al momento de llamar, así que puede invocarse justo antes
 * de borrar la sesión sin necesidad de esperar a que termine.
 */
export async function desvincularDispositivo(token = getItem('token')) {
  if (!token) return
  try {
    const suscripcion = await suscripcionActual()
    if (suscripcion) {
      await api.delete('/api/push/suscripcion', {
        data: { endpoint: suscripcion.endpoint },
        headers: { Authorization: 'Bearer ' + token }
      })
    }
  } catch (_) {
    // sin conexión: el servidor lo limpiará cuando la suscripción caduque
  }
}

/** Envía una notificación de prueba a este dispositivo. */
export async function enviarNotificacionDePrueba() {
  const suscripcion = await suscripcionActual()
  const { data } = await api.post('/api/push/prueba', suscripcion ? { endpoint: suscripcion.endpoint } : {})
  return data
}
