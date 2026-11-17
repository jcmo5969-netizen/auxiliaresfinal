import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Bell, BellOff, BellRing, CheckCircle2, Info, Loader2, MoreVertical, Send, Share, PlusSquare, Smartphone, X } from 'lucide-react'
import {
  activarNotificaciones,
  enviarNotificacionDePrueba,
  esAndroid,
  esAppInstalada,
  esIOS,
  obtenerEstadoNotificaciones,
  sincronizarNotificaciones
} from '../utils/push'

/**
 * Tarjeta que guía a la persona hasta dejar las notificaciones funcionando
 * en su dispositivo, y que luego se reduce a un indicador con botón de prueba.
 *
 * @param {string} ejemplo  Texto de ejemplo de lo que recibirá (según el rol)
 * @param {boolean} compacta  Versión reducida para pantallas de escritorio
 */
const NotificacionesPush = ({ ejemplo = 'Solicitud de auxiliar · Cama 12, piso 3', compacta = false }) => {
  const [estado, setEstado] = useState('cargando')
  const [trabajando, setTrabajando] = useState(false)
  const [probando, setProbando] = useState(false)
  const [ayudaAbierta, setAyudaAbierta] = useState(false)
  const [instalador, setInstalador] = useState(null) // Android/escritorio: aviso nativo de instalación

  useEffect(() => {
    let vivo = true
    sincronizarNotificaciones().then((e) => vivo && setEstado(e))
    // Respaldo: nunca dejar la tarjeta oculta si la comprobación se queda esperando
    const respaldo = setTimeout(() => {
      if (!vivo) return
      setEstado((actual) => {
        if (actual !== 'cargando') return actual
        if (typeof Notification === 'undefined') return 'no-soportado'
        return Notification.permission === 'denied' ? 'denegado' : 'activable'
      })
    }, 12000)

    const alPoderInstalar = (e) => {
      e.preventDefault()
      setInstalador(e)
    }
    window.addEventListener('beforeinstallprompt', alPoderInstalar)
    return () => {
      vivo = false
      clearTimeout(respaldo)
      window.removeEventListener('beforeinstallprompt', alPoderInstalar)
    }
  }, [])

  const probar = useCallback(async (silencioso = false) => {
    setProbando(true)
    try {
      await enviarNotificacionDePrueba()
      if (!silencioso) {
        toast.success('Prueba enviada. Bloquea el teléfono para verla en la pantalla de bloqueo.', { duration: 6000 })
      }
    } catch (error) {
      const msg = error.response?.data?.mensaje || 'No se pudo enviar la prueba'
      toast.error(msg, { duration: 6000 })
      // La suscripción pudo haber caducado: se vuelve a evaluar
      obtenerEstadoNotificaciones().then(setEstado)
    } finally {
      setProbando(false)
    }
  }, [])

  // Importante: esta función se llama directo desde el onClick (requisito de iOS)
  const activar = async () => {
    setTrabajando(true)
    const resultado = await activarNotificaciones()
    setEstado(resultado.estado)
    setTrabajando(false)
    if (resultado.ok) {
      toast.success('Notificaciones activadas. Te enviamos una de prueba.', { duration: 5000 })
      probar(true)
    } else if (resultado.mensaje) {
      toast.error(resultado.mensaje, { duration: 6000 })
    }
  }

  // Tarjeta de "permiso bloqueado": si la persona ya lo desbloqueó en los ajustes,
  // se suscribe de inmediato; si no, se le avisa que sigue bloqueado.
  const recomprobar = async () => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'denied') {
      toast.error('El permiso sigue bloqueado. Revisa los pasos y vuelve a intentarlo.', { duration: 6000 })
      return
    }
    await activar()
  }

  // Al volver desde los ajustes del teléfono se vuelve a comprobar sola
  useEffect(() => {
    if (estado !== 'denegado') return undefined
    const alVolver = () => {
      if (document.hidden) return
      if (typeof Notification !== 'undefined' && Notification.permission !== 'denied') {
        sincronizarNotificaciones().then(setEstado)
      }
    }
    document.addEventListener('visibilitychange', alVolver)
    window.addEventListener('focus', alVolver)
    return () => {
      document.removeEventListener('visibilitychange', alVolver)
      window.removeEventListener('focus', alVolver)
    }
  }, [estado])

  const instalarApp = async () => {
    if (!instalador) return
    instalador.prompt()
    await instalador.userChoice.catch(() => {})
    setInstalador(null)
  }

  if (estado === 'cargando') return null

  // ── Activas ────────────────────────────────────────────────────────────────
  if (estado === 'activo') {
    return (
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 dark:border-emerald-800 dark:bg-emerald-900/20">
        <span className="flex items-center gap-2 text-sm font-medium text-emerald-800 dark:text-emerald-200">
          <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
          Notificaciones activadas en este dispositivo
        </span>
        <div className="flex items-center gap-2">
          {instalador && (
            <button
              type="button"
              onClick={instalarApp}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 dark:text-emerald-200 dark:hover:bg-emerald-900/40"
            >
              <Smartphone className="h-3.5 w-3.5" aria-hidden />
              Instalar app
            </button>
          )}
          <button
            type="button"
            onClick={() => probar(false)}
            disabled={probando}
            className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-emerald-800 shadow-sm ring-1 ring-emerald-200 hover:bg-emerald-100 disabled:opacity-60 dark:bg-emerald-900/40 dark:text-emerald-100 dark:ring-emerald-700"
          >
            {probando ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : <Send className="h-3.5 w-3.5" aria-hidden />}
            Enviar prueba
          </button>
        </div>
      </div>
    )
  }

  const marco = 'rounded-2xl border p-4 shadow-sm sm:p-5'

  // ── iPhone/iPad en el navegador: hay que instalar primero ─────────────────
  if (estado === 'instalar') {
    return (
      <section className={`${marco} border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-900/20`} aria-label="Instalar la app para recibir notificaciones">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-amber-200 p-2 text-amber-900 dark:bg-amber-800 dark:text-amber-100">
            <Smartphone className="h-6 w-6" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-bold text-amber-950 dark:text-amber-50">
              Falta un paso para recibir avisos en tu iPhone
            </h2>
            <p className="mt-1 text-sm text-amber-900 dark:text-amber-100">
              Apple solo permite notificaciones con el teléfono bloqueado si la app está en tu pantalla de inicio.
            </p>
            <ol className="mt-3 space-y-2.5 text-sm text-amber-950 dark:text-amber-50">
              <li className="flex items-start gap-2">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-900 text-xs font-bold text-white">1</span>
                <span>
                  Toca el botón <strong>Compartir</strong>{' '}
                  <Share className="inline h-4 w-4 align-text-bottom" aria-hidden /> de Safari (abajo en la pantalla).
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-900 text-xs font-bold text-white">2</span>
                <span>
                  Elige <strong>«Agregar a inicio»</strong>{' '}
                  <PlusSquare className="inline h-4 w-4 align-text-bottom" aria-hidden /> y confirma con «Agregar».
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-900 text-xs font-bold text-white">3</span>
                <span>
                  Abre la app desde el ícono <strong>Auxiliares</strong>, inicia sesión y toca{' '}
                  <strong>«Activar notificaciones»</strong>.
                </span>
              </li>
            </ol>
            <p className="mt-3 text-xs text-amber-800 dark:text-amber-200">
              Requiere iOS 16.4 o superior (Ajustes → General → Información).
            </p>
          </div>
        </div>
      </section>
    )
  }

  // ── Permiso bloqueado ──────────────────────────────────────────────────────
  if (estado === 'denegado') {
    return (
      <section className={`${marco} border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-900/20`}>
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-red-200 p-2 text-red-900 dark:bg-red-800 dark:text-red-100">
            <BellOff className="h-6 w-6" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-bold text-red-950 dark:text-red-50">Las notificaciones están bloqueadas</h2>
            <p className="mt-1 text-sm text-red-900 dark:text-red-100">
              Este dispositivo tiene el permiso denegado, por eso no llegan los avisos. Para habilitarlo:
            </p>
            {esIOS() ? (
              <p className="mt-2 text-sm font-medium text-red-950 dark:text-red-50">
                Ajustes del iPhone → Notificaciones → Auxiliares → activa «Permitir notificaciones» y «Pantalla bloqueada».
              </p>
            ) : esAndroid() ? (
              <>
                <ol className="mt-3 space-y-2 text-sm font-medium text-red-950 dark:text-red-50">
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-800 text-xs font-bold text-white">1</span>
                    <span>
                      Toca los tres puntos <MoreVertical className="inline h-4 w-4 align-text-bottom" aria-label="menú" /> de Chrome, arriba a la derecha.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-800 text-xs font-bold text-white">2</span>
                    <span>
                      Toca el ícono de información <Info className="inline h-4 w-4 align-text-bottom" aria-label="información" /> en la fila de arriba del menú.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-800 text-xs font-bold text-white">3</span>
                    <span>
                      Entra a <strong>Permisos</strong> → <strong>Notificaciones</strong> y déjalo en <strong>Permitir</strong>.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-800 text-xs font-bold text-white">4</span>
                    <span>Vuelve a esta pantalla y toca el botón rojo de abajo.</span>
                  </li>
                </ol>
                <p className="mt-3 text-xs text-red-800 dark:text-red-200">
                  Si no aparece «Notificaciones» en Permisos: Ajustes del teléfono → Aplicaciones → Chrome →
                  Notificaciones → actívalas, y repite los pasos.
                </p>
              </>
            ) : (
              <p className="mt-2 text-sm font-medium text-red-950 dark:text-red-50">
                Haz clic en el ícono que está a la izquierda de la dirección de la página → Notificaciones → Permitir.
              </p>
            )}
            <button
              type="button"
              onClick={recomprobar}
              disabled={trabajando}
              className="mt-3 inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800 disabled:opacity-60"
            >
              {trabajando && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
              Ya lo habilité, activar notificaciones
            </button>
          </div>
        </div>
      </section>
    )
  }

  // ── Sin soporte ────────────────────────────────────────────────────────────
  if (estado === 'ios-antiguo' || estado === 'no-soportado') {
    return (
      <section className={`${marco} border-gray-300 bg-gray-50 dark:border-gray-600 dark:bg-gray-800`}>
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-gray-200 p-2 text-gray-700 dark:bg-gray-700 dark:text-gray-200">
            <BellOff className="h-6 w-6" aria-hidden />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white">
              Este dispositivo no admite notificaciones
            </h2>
            <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
              {estado === 'ios-antiguo'
                ? 'Tu iPhone necesita iOS 16.4 o superior. Actualízalo en Ajustes → General → Actualización de software.'
                : 'Abre esta página con Chrome (Android o computador) o con Safari en iPhone.'}
            </p>
          </div>
        </div>
      </section>
    )
  }

  // ── Listo para activar ─────────────────────────────────────────────────────
  return (
    <>
      <section className={`${marco} border-primary-300 bg-gradient-to-br from-primary-50 to-white dark:border-primary-700 dark:from-primary-900/30 dark:to-gray-800`}>
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-primary-600 p-2 text-white">
            <BellRing className="h-6 w-6" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-bold text-gray-900 dark:text-white">
              Activa las notificaciones en este dispositivo
            </h2>
            {!compacta && (
              <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                Recibirás el aviso aunque el teléfono esté bloqueado o la app cerrada:
              </p>
            )}
            {!compacta && (
              <div className="mt-3 flex items-center gap-3 rounded-xl bg-gray-900/90 px-3 py-2.5 text-white shadow-inner dark:bg-black/60">
                <img src="/icons/icon-192.png" alt="" className="h-9 w-9 rounded-lg" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">Solicitud de auxiliar</p>
                  <p className="truncate text-xs text-gray-300">{ejemplo.replace(/^Solicitud de auxiliar\s*·\s*/, '')}</p>
                </div>
              </div>
            )}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={activar}
                disabled={trabajando}
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-primary-700 active:scale-[0.98] disabled:opacity-60"
              >
                {trabajando ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : <Bell className="h-5 w-5" aria-hidden />}
                {trabajando ? 'Activando…' : 'Activar notificaciones'}
              </button>
              {instalador && (
                <button
                  type="button"
                  onClick={instalarApp}
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-primary-300 px-4 py-2.5 text-sm font-semibold text-primary-700 hover:bg-primary-50 dark:border-primary-600 dark:text-primary-200 dark:hover:bg-primary-900/30"
                >
                  <Smartphone className="h-4 w-4" aria-hidden />
                  Instalar app
                </button>
              )}
              <button
                type="button"
                onClick={() => setAyudaAbierta(true)}
                className="text-sm font-medium text-primary-700 underline-offset-2 hover:underline dark:text-primary-300"
              >
                ¿Problemas?
              </button>
            </div>
            {esAndroid() && !esAppInstalada() && !compacta && (
              <p className="mt-3 text-xs text-gray-600 dark:text-gray-400">
                Consejo: instala la app (menú ⋮ de Chrome → «Agregar a pantalla principal») para abrirla más rápido.
              </p>
            )}
          </div>
        </div>
      </section>

      {ayudaAbierta && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
          onClick={() => setAyudaAbierta(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Ayuda de notificaciones"
        >
          <div
            className="w-full max-w-md space-y-3 rounded-2xl bg-white p-5 shadow-xl dark:bg-gray-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Si no llegan los avisos</h3>
              <button
                type="button"
                onClick={() => setAyudaAbierta(false)}
                className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                aria-label="Cerrar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <ul className="list-disc space-y-2 pl-5 text-sm text-gray-700 dark:text-gray-200">
              <li>Toca «Activar notificaciones» y acepta el permiso que muestra el teléfono.</li>
              <li>Revisa que no esté activo <strong>No molestar</strong> ni un modo de concentración.</li>
              {esIOS() ? (
                <li>
                  En Ajustes → Notificaciones → <strong>Auxiliares</strong>, deja activados «Pantalla bloqueada», «Tiras» y «Sonidos».
                </li>
              ) : (
                <>
                  <li>
                    En Ajustes → Aplicaciones → <strong>Chrome</strong> (o Auxiliares) → Notificaciones, deja activado «Pantalla de bloqueo» y el sonido.
                  </li>
                  <li>
                    Quita el <strong>ahorro de batería</strong> para Chrome (Ajustes → Batería → Sin restricciones): algunos teléfonos retrasan los avisos en reposo.
                  </li>
                </>
              )}
              <li>Necesitas internet (wifi o datos) para recibirlos.</li>
            </ul>
            <button
              type="button"
              onClick={() => setAyudaAbierta(false)}
              className="w-full rounded-xl bg-primary-600 py-2.5 font-semibold text-white hover:bg-primary-700"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  )
}

export default NotificacionesPush
