import { useState, useEffect, useCallback, useRef, Component } from 'react'
import api from '../utils/api'
import toast from 'react-hot-toast'
import {
  AlertTriangle, ArrowRightLeft, Bed, BedDouble, Calendar, CalendarClock, CheckCircle,
  ClipboardList, Clock, DoorOpen, Hand, Layers, List, Loader2, LogOut, MapPin, Moon,
  RefreshCw, RotateCcw, ShieldAlert, Stethoscope, Sun, User, WifiOff, Zap
} from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { getItem, setItem, removeItem } from '../utils/storage'
import { formatearFechaProgramadaDisplay } from '../utils/fechaHospital'
import { desvincularDispositivo } from '../utils/push'
import { useSolicitudesEnVivo } from '../utils/socket'
import CalendarioAuxiliar from '../components/CalendarioAuxiliar'
import NotificacionesPush from '../components/NotificacionesPush'
import TarjetaLogin from '../components/TarjetaLogin'
import { mensajeErrorLogin } from './Login'

// Respaldo por si se pierde la conexión en tiempo real: recarga cada 20 s
const INTERVALO_RESPALDO_MS = 20000

// Si falla la vista tras el login (p. ej. en iPhone), mostrar solo "Cerrar sesión"
class AuxiliarVistaErrorBoundary extends Component {
  state = { hasError: false }
  static getDerivedStateFromError = () => ({ hasError: true })
  componentDidCatch(err, info) {
    console.error('AuxiliarVistaErrorBoundary:', err, info)
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-6 dark:bg-gray-900">
          <p className="mb-4 text-center text-gray-700 dark:text-gray-300">
            No se pudo cargar la vista. Cierra sesión e intenta de nuevo.
          </p>
          <button
            type="button"
            onClick={this.props.onCerrarSesion}
            className="rounded-lg bg-primary-600 px-6 py-3 font-medium text-white"
          >
            Cerrar sesión
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

// ─── Textos y estilos de una solicitud ──────────────────────────────────────
const TIPOS = {
  alta: { etiqueta: 'Alta', Icono: DoorOpen },
  traslado: { etiqueta: 'Traslado', Icono: ArrowRightLeft },
  pabellon: { etiqueta: 'Pabellón', Icono: Stethoscope },
  gescas: { etiqueta: 'GESCAS', Icono: BedDouble },
  otro: { etiqueta: 'Otro', Icono: ClipboardList }
}

const TRASLADOS = {
  sin_silla_ni_camilla: 'Sin silla ni camilla',
  con_silla: 'Con silla de ruedas',
  con_camilla: 'Con camilla'
}

const PRIORIDADES = {
  baja: 'bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600',
  media: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/40 dark:text-blue-200 dark:border-blue-700',
  alta: 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/40 dark:text-orange-200 dark:border-orange-700',
  urgente: 'bg-red-600 text-white border-red-700'
}

const getPrioridadColor = (prioridad) => PRIORIDADES[prioridad] || PRIORIDADES.media

const getTipoIcon = (tipo) => {
  const { Icono } = TIPOS[tipo] || TIPOS.otro
  return <Icono className="inline h-6 w-6 text-primary-600 dark:text-primary-300" aria-hidden />
}

const textoCama = (s) => {
  const v = s?.cama ?? s?.cama_numero
  return v == null ? '' : String(v).trim()
}

const textoPiso = (s) => {
  const p = String(s?.servicio?.piso ?? '').trim()
  if (!p || /^(n\/?a|no aplica|-+)$/i.test(p)) return ''
  return /^piso\b/i.test(p) ? p : `Piso ${p}`
}

const formatearHace = (fecha) => {
  if (!fecha) return ''
  const mins = Math.floor((Date.now() - new Date(fecha).getTime()) / 60000)
  if (mins < 1) return 'hace un momento'
  if (mins < 60) return `hace ${mins} min`
  const horas = Math.floor(mins / 60)
  if (horas < 24) return `hace ${horas} h ${mins % 60} min`
  return new Date(fecha).toLocaleDateString('es-CL')
}

const esUrgente = (s) => s.prioridad === 'urgente' || Boolean(s.prioridadInmediato)

// ─── Tarjeta de solicitud ───────────────────────────────────────────────────
const TarjetaSolicitud = ({ solicitud, mia = false, ocupada = false, onAsignar, onFinalizar, onDevolver }) => {
  const tipo = TIPOS[solicitud.tipoRequerimiento] || TIPOS.otro
  const cama = textoCama(solicitud)
  const piso = textoPiso(solicitud)
  const urgente = esUrgente(solicitud)
  const id = solicitud.id || solicitud._id
  const destinoGescas = solicitud.destinoGescas || solicitud.destino_gescas
  const tipoPrecaucion = solicitud.tipoPrecaucion || solicitud.tipo_precaucion

  const borde = mia
    ? 'border-orange-400 dark:border-orange-500'
    : urgente
      ? 'border-red-500'
      : 'border-primary-500'

  return (
    <article
      className={`overflow-hidden rounded-2xl border-l-[6px] bg-white shadow-md ring-1 ring-gray-200 transition-colors dark:bg-gray-800 dark:ring-gray-700 ${borde}`}
    >
      {urgente && (
        <div className="flex items-center gap-2 bg-red-600 px-4 py-1.5 text-sm font-bold uppercase tracking-wide text-white">
          <Zap className="h-4 w-4" aria-hidden />
          {solicitud.prioridadInmediato ? 'Inmediato' : 'Urgente'}
        </div>
      )}

      <div className="p-4 sm:p-5">
        {/* Ubicación: lo primero que necesita saber el auxiliar */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              {cama ? (
                <p className="flex items-center gap-2 text-2xl font-extrabold leading-tight text-gray-900 dark:text-white">
                  <Bed className="h-6 w-6 shrink-0 text-primary-600 dark:text-primary-300" aria-hidden />
                  <span className="break-words">Cama {cama}</span>
                </p>
              ) : (
                <p className="text-xl font-bold leading-tight text-gray-900 dark:text-white">
                  {solicitud.servicio?.nombre || 'Servicio no indicado'}
                </p>
              )}
              {piso && (
                <span className="inline-flex items-center gap-1 rounded-lg bg-primary-100 px-2.5 py-1 text-base font-bold text-primary-800 dark:bg-primary-900/50 dark:text-primary-100">
                  <Layers className="h-4 w-4" aria-hidden />
                  {piso}
                </span>
              )}
            </div>
            {cama && (
              <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-gray-600 dark:text-gray-300">
                <MapPin className="h-4 w-4 shrink-0" aria-hidden />
                {solicitud.servicio?.nombre || 'Servicio no indicado'}
              </p>
            )}
          </div>
          <div className="shrink-0 rounded-xl bg-primary-50 p-2.5 dark:bg-primary-900/30">
            <tipo.Icono className="h-7 w-7 text-primary-700 dark:text-primary-200" aria-hidden />
          </div>
        </div>

        {/* Qué hay que hacer */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-primary-600 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
            {tipo.etiqueta}
          </span>
          {solicitud.tipoRequerimiento === 'traslado' && solicitud.tipoTraslado && (
            <span className="rounded-full border border-primary-300 bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-800 dark:border-primary-700 dark:bg-primary-900/30 dark:text-primary-100">
              {TRASLADOS[solicitud.tipoTraslado] || solicitud.tipoTraslado}
            </span>
          )}
          {!urgente && (
            <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase ${getPrioridadColor(solicitud.prioridad)}`}>
              Prioridad {solicitud.prioridad || 'media'}
            </span>
          )}
          {mia && (
            <span className="rounded-full bg-orange-500 px-3 py-1 text-xs font-bold uppercase text-white">En proceso</span>
          )}
        </div>

        {solicitud.tipoRequerimiento === 'gescas' && destinoGescas && (
          <p className="mt-3 text-sm font-semibold text-gray-800 dark:text-gray-100">Destino: {destinoGescas}</p>
        )}

        {solicitud.precaucionesEstandar && (
          <p className="mt-3 flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-900 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-100">
            <ShieldAlert className="h-5 w-5 shrink-0" aria-hidden />
            Precauciones adicionales{tipoPrecaucion ? `: ${tipoPrecaucion}` : ''}
          </p>
        )}

        {solicitud.descripcion && (
          <p className="mt-3 whitespace-pre-line break-words rounded-xl bg-gray-50 px-3 py-2.5 text-sm text-gray-800 dark:bg-gray-700/60 dark:text-gray-100">
            {solicitud.descripcion}
          </p>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-600 dark:text-gray-400">
          <span className="flex items-center gap-1">
            <User className="h-3.5 w-3.5" aria-hidden />
            {solicitud.solicitadoPor?.nombre || 'Sin solicitante'}
          </span>
          {mia && solicitud.fechaAsignacion ? (
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" aria-hidden />
              Tomada {formatearHace(solicitud.fechaAsignacion)}
            </span>
          ) : solicitud.createdAt ? (
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" aria-hidden />
              Pedida {formatearHace(solicitud.createdAt)}
            </span>
          ) : null}
          {solicitud.fechaProgramada && (
            <span className="flex items-center gap-1 font-semibold text-primary-700 dark:text-primary-300">
              <CalendarClock className="h-3.5 w-3.5" aria-hidden />
              Programada: {formatearFechaProgramadaDisplay(solicitud.fechaProgramada)}
            </span>
          )}
        </div>

        {/* Acciones */}
        {mia ? (
          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={() => onFinalizar(id)}
              disabled={ocupada}
              className="flex min-h-[52px] flex-1 items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 text-base font-bold text-white shadow-md transition hover:bg-green-700 active:scale-[0.98] disabled:opacity-60"
            >
              {ocupada ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : <CheckCircle className="h-5 w-5" aria-hidden />}
              Finalizar
            </button>
            <button
              type="button"
              onClick={() => onDevolver(id)}
              disabled={ocupada}
              className="flex min-h-[52px] items-center justify-center gap-2 rounded-xl border-2 border-orange-500 px-4 py-3 text-sm font-semibold text-orange-700 transition hover:bg-orange-50 active:scale-[0.98] disabled:opacity-60 dark:text-orange-300 dark:hover:bg-orange-900/20"
              title="Devolver la solicitud si no puedes realizarla"
            >
              <RotateCcw className="h-5 w-5" aria-hidden />
              Devolver
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => onAsignar(id)}
            disabled={ocupada}
            className={`mt-4 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-base font-bold text-white shadow-md transition active:scale-[0.98] disabled:opacity-60 ${
              urgente ? 'bg-red-600 hover:bg-red-700' : 'bg-primary-600 hover:bg-primary-700'
            }`}
          >
            {ocupada ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : <Hand className="h-5 w-5" aria-hidden />}
            Tomar esta solicitud
          </button>
        )}
      </div>
    </article>
  )
}

// ─── Página ─────────────────────────────────────────────────────────────────
const AuxiliarAcceso = () => {
  const { isDark, toggleTheme } = useTheme()
  const [autenticado, setAutenticado] = useState(false)
  const [usuario, setUsuario] = useState(null)
  const [solicitudes, setSolicitudes] = useState([])
  const [solicitudesAsignadas, setSolicitudesAsignadas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [primeraCargaLista, setPrimeraCargaLista] = useState(false)
  const [actualizando, setActualizando] = useState(false)
  const [sinConexion, setSinConexion] = useState(false)
  const [ultimaActualizacion, setUltimaActualizacion] = useState(null)
  const [vistaActiva, setVistaActiva] = useState('lista')
  const [solicitudesCalendario, setSolicitudesCalendario] = useState([])
  const [enCurso, setEnCurso] = useState(null) // id de la solicitud con una acción en vuelo
  const [, setTic] = useState(0) // refresca los "hace X min"
  const idsConocidos = useRef(null)

  const cerrarSesion = useCallback(() => {
    desvincularDispositivo() // captura el token antes de que se borre
    removeItem('token')
    idsConocidos.current = null
    setUsuario(null)
    setSolicitudes([])
    setSolicitudesAsignadas([])
    setPrimeraCargaLista(false)
    setAutenticado(false)
    setCargando(false)
  }, [])

  const cargarSolicitudes = useCallback(async ({ avisarNuevas = false, manual = false } = {}) => {
    if (manual) setActualizando(true)
    try {
      const [resPendientes, resAsignadas] = await Promise.all([
        api.get('/api/solicitudes/pendientes'),
        api.get('/api/solicitudes/mis-asignadas')
      ])
      const pendientes = resPendientes.data || []
      const asignadas = resAsignadas.data || []

      // Aviso dentro de la app cuando aparece una solicitud que no estaba
      const anteriores = idsConocidos.current
      if (avisarNuevas && anteriores) {
        const nuevas = pendientes.filter((s) => !anteriores.has(s.id))
        if (nuevas.length > 0) {
          const s = nuevas[0]
          const ubicacion = [textoCama(s) ? `Cama ${textoCama(s)}` : '', textoPiso(s)].filter(Boolean).join(', ')
          toast(
            nuevas.length === 1
              ? `Nueva solicitud${ubicacion ? `: ${ubicacion}` : ''}`
              : `${nuevas.length} solicitudes nuevas`,
            { duration: 5000 }
          )
          try { navigator.vibrate?.(200) } catch (_) { /* sin vibración */ }
        }
      }
      idsConocidos.current = new Set(pendientes.map((s) => s.id))

      setSolicitudes(pendientes)
      setSolicitudesAsignadas(asignadas)
      setUltimaActualizacion(new Date())
      setSinConexion(false)
      setPrimeraCargaLista(true)
    } catch (error) {
      if (error.response?.status === 401) {
        toast.error('Tu sesión expiró. Inicia sesión de nuevo.')
        cerrarSesion()
        return
      }
      setSinConexion(true)
      if (manual) toast.error(error.response?.data?.mensaje || 'No se pudo actualizar. Revisa tu conexión.')
    } finally {
      if (manual) setActualizando(false)
    }
  }, [cerrarSesion])

  const cargarCalendario = useCallback(async () => {
    try {
      const res = await api.get('/api/solicitudes/pendientes?incluirFuturas=1')
      setSolicitudesCalendario(res.data || [])
    } catch (e) {
      toast.error('Error cargando calendario')
    }
  }, [])

  // Verificar sesión guardada al abrir
  useEffect(() => {
    let vivo = true
    const verificar = async () => {
      if (!getItem('token')) {
        setCargando(false)
        return
      }
      try {
        const res = await api.get('/api/auth/me')
        if (!vivo) return
        if (res.data.rol === 'auxiliar') {
          setUsuario(res.data)
          setAutenticado(true)
        } else {
          // Sesión de otro rol: va a su propia pantalla, no se borra
          window.location.hash = '#/'
          window.location.reload()
          return
        }
      } catch (error) {
        if (!vivo) return
        if (error.response?.status === 401) removeItem('token')
      }
      setCargando(false)
    }
    verificar()
    return () => { vivo = false }
  }, [])

  // Carga inicial + respaldo periódico
  useEffect(() => {
    if (!autenticado) return undefined
    cargarSolicitudes()
    const intervalo = setInterval(() => {
      if (!document.hidden) cargarSolicitudes({ avisarNuevas: true })
      setTic((t) => t + 1)
    }, INTERVALO_RESPALDO_MS)
    return () => clearInterval(intervalo)
  }, [autenticado, cargarSolicitudes])

  // Tiempo real: se recarga apenas cambia una solicitud o llega un push
  useSolicitudesEnVivo(() => {
    cargarSolicitudes({ avisarNuevas: true })
    if (vistaActiva === 'calendario') cargarCalendario()
  }, autenticado)

  useEffect(() => {
    if (vistaActiva === 'calendario' && autenticado) cargarCalendario()
  }, [vistaActiva, autenticado, cargarCalendario])

  const ejecutar = async (solicitudId, accion, exito, errorPorDefecto) => {
    if (!solicitudId || enCurso) return
    setEnCurso(solicitudId)
    try {
      await accion()
      toast.success(exito)
    } catch (error) {
      toast.error(error.response?.data?.mensaje || errorPorDefecto)
    } finally {
      await cargarSolicitudes()
      if (vistaActiva === 'calendario') await cargarCalendario()
      setEnCurso(null)
    }
  }

  const handleAsignar = (id) =>
    ejecutar(id, () => api.put(`/api/solicitudes/${id}/asignar`), 'Solicitud tomada', 'No se pudo tomar la solicitud')

  const handleDevolver = (id) =>
    ejecutar(id, () => api.put(`/api/solicitudes/${id}/desasignar`), 'Solicitud devuelta a pendientes', 'No se pudo devolver la solicitud')

  const handleFinalizar = (id) =>
    ejecutar(id, () => api.put(`/api/solicitudes/${id}/estado`, { estado: 'completada' }), 'Solicitud finalizada', 'No se pudo finalizar la solicitud')

  const iniciarSesion = async (email, password) => {
    let res
    try {
      res = await api.post('/api/auth/login', { email, password })
    } catch (error) {
      throw new Error(mensajeErrorLogin(error))
    }
    const { token, usuario: u } = res.data
    if (u.rol !== 'auxiliar') {
      throw new Error('Este acceso es solo para auxiliares. Usa el inicio de sesión general.')
    }
    setItem('token', token)
    setUsuario(u)
    setAutenticado(true)
    toast.success(`Bienvenido, ${u.nombre}`)
  }

  if (cargando) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-primary-50 dark:bg-gray-900">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-primary-600" aria-hidden />
          <p className="font-medium text-primary-700 dark:text-primary-300">Cargando…</p>
        </div>
      </div>
    )
  }

  if (!autenticado) {
    return (
      <TarjetaLogin
        titulo="Acceso Auxiliares"
        subtitulo="Inicia sesión para ver y tomar solicitudes"
        nota="Acceso exclusivo para auxiliares de servicio"
        onSubmit={iniciarSesion}
      />
    )
  }

  const total = solicitudes.length
  const urgentes = solicitudes.filter(esUrgente).length

  return (
    <AuxiliarVistaErrorBoundary onCerrarSesion={cerrarSesion}>
      <div
        className="min-h-screen bg-gray-100 transition-colors dark:bg-gray-900"
        style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}
      >
        <header
          className="sticky top-0 z-20 bg-gradient-to-r from-primary-700 to-primary-600 text-white shadow-lg"
          style={{ paddingTop: 'env(safe-area-inset-top)' }}
        >
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
            <div className="min-w-0">
              <h1 className="truncate text-lg font-bold leading-tight sm:text-xl">Solicitudes de auxiliar</h1>
              <p className="truncate text-xs text-primary-100 sm:text-sm">
                {usuario?.nombre || 'Auxiliar'}
                {ultimaActualizacion && !sinConexion && (
                  <span className="ml-2 opacity-80">
                    · Actualizado {ultimaActualizacion.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={() => cargarSolicitudes({ manual: true })}
                disabled={actualizando}
                className="rounded-xl p-2.5 transition hover:bg-white/15 disabled:opacity-60"
                aria-label="Actualizar solicitudes"
              >
                <RefreshCw className={`h-5 w-5 ${actualizando ? 'animate-spin' : ''}`} />
              </button>
              <button
                type="button"
                onClick={toggleTheme}
                className="rounded-xl p-2.5 transition hover:bg-white/15"
                aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              >
                {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('¿Cerrar sesión? Este teléfono dejará de recibir avisos de solicitudes.')) cerrarSesion()
                }}
                className="flex items-center gap-1.5 rounded-xl bg-white/15 px-3 py-2 text-sm font-semibold transition hover:bg-white/25"
              >
                <LogOut className="h-4 w-4" aria-hidden />
                Salir
              </button>
            </div>
          </div>
          {sinConexion && (
            <div className="flex items-center justify-center gap-2 bg-red-600 px-4 py-1.5 text-center text-xs font-semibold" role="status">
              <WifiOff className="h-4 w-4" aria-hidden />
              Sin conexión con el servidor. Reintentando…
            </div>
          )}
        </header>

        <main className="mx-auto max-w-3xl space-y-5 px-4 py-5">
          <NotificacionesPush ejemplo="Cama 12, piso 3 · Traslado con camilla" />

          {/* Resumen */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl bg-white p-3 text-center shadow-sm ring-1 ring-gray-200 dark:bg-gray-800 dark:ring-gray-700">
              <p className="text-2xl font-extrabold text-primary-700 dark:text-primary-300">{total}</p>
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Pendientes</p>
            </div>
            <div className="rounded-2xl bg-white p-3 text-center shadow-sm ring-1 ring-gray-200 dark:bg-gray-800 dark:ring-gray-700">
              <p className={`text-2xl font-extrabold ${urgentes ? 'text-red-600' : 'text-gray-400 dark:text-gray-500'}`}>{urgentes}</p>
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Urgentes</p>
            </div>
            <div className="rounded-2xl bg-white p-3 text-center shadow-sm ring-1 ring-gray-200 dark:bg-gray-800 dark:ring-gray-700">
              <p className={`text-2xl font-extrabold ${solicitudesAsignadas.length ? 'text-orange-600' : 'text-gray-400 dark:text-gray-500'}`}>
                {solicitudesAsignadas.length}
              </p>
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Mías en proceso</p>
            </div>
          </div>

          {/* Lista / Calendario */}
          <div className="flex rounded-xl bg-gray-200 p-1 dark:bg-gray-800" role="tablist">
            {[
              { id: 'lista', etiqueta: 'Lista', Icono: List },
              { id: 'calendario', etiqueta: 'Calendario', Icono: Calendar }
            ].map(({ id, etiqueta, Icono }) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={vistaActiva === id}
                onClick={() => setVistaActiva(id)}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition ${
                  vistaActiva === id
                    ? 'bg-white text-primary-700 shadow dark:bg-gray-700 dark:text-white'
                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                }`}
              >
                <Icono className="h-4 w-4" aria-hidden />
                {etiqueta}
              </button>
            ))}
          </div>

          {vistaActiva === 'calendario' ? (
            <CalendarioAuxiliar
              solicitudesPendientes={solicitudesCalendario}
              solicitudesAsignadas={solicitudesAsignadas}
              onAsignar={handleAsignar}
              onCompletar={handleFinalizar}
              onDevolver={handleDevolver}
              getTipoIcon={getTipoIcon}
              getPrioridadColor={getPrioridadColor}
            />
          ) : !primeraCargaLista ? (
            <div className="flex items-center justify-center gap-3 rounded-2xl bg-white p-10 text-gray-600 shadow-sm ring-1 ring-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:ring-gray-700">
              {sinConexion ? (
                <>
                  <AlertTriangle className="h-6 w-6 text-red-500" aria-hidden />
                  No se pudieron cargar las solicitudes. Reintentando…
                </>
              ) : (
                <>
                  <Loader2 className="h-6 w-6 animate-spin text-primary-600" aria-hidden />
                  Cargando solicitudes…
                </>
              )}
            </div>
          ) : (
            <>
              {solicitudesAsignadas.length > 0 && (
                <section aria-label="Mis solicitudes en proceso">
                  <h2 className="mb-3 flex items-center gap-2 text-base font-bold text-gray-900 dark:text-white">
                    <span className="h-2.5 w-2.5 rounded-full bg-orange-500" aria-hidden />
                    Mis solicitudes en proceso ({solicitudesAsignadas.length})
                  </h2>
                  <div className="space-y-4">
                    {solicitudesAsignadas.map((s) => (
                      <TarjetaSolicitud
                        key={s.id || s._id}
                        solicitud={s}
                        mia
                        ocupada={enCurso === (s.id || s._id)}
                        onFinalizar={handleFinalizar}
                        onDevolver={handleDevolver}
                      />
                    ))}
                  </div>
                </section>
              )}

              <section aria-label="Solicitudes pendientes">
                <h2 className="mb-3 flex items-center gap-2 text-base font-bold text-gray-900 dark:text-white">
                  <span className="h-2.5 w-2.5 rounded-full bg-primary-500" aria-hidden />
                  Pendientes por tomar ({total})
                </h2>
                {total === 0 ? (
                  <div className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-gray-200 dark:bg-gray-800 dark:ring-gray-700">
                    <CheckCircle className="mx-auto mb-3 h-14 w-14 text-green-500" aria-hidden />
                    <p className="text-lg font-bold text-gray-900 dark:text-white">No hay solicitudes pendientes</p>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      Cuando enfermería pida un auxiliar, aparecerá aquí y te llegará una notificación.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {solicitudes.map((s) => (
                      <TarjetaSolicitud
                        key={s.id || s._id}
                        solicitud={s}
                        ocupada={enCurso === (s.id || s._id)}
                        onAsignar={handleAsignar}
                      />
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </main>
      </div>
    </AuxiliarVistaErrorBoundary>
  )
}

export default AuxiliarAcceso
