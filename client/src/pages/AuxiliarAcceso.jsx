import { useState, useEffect, useCallback } from 'react'
import api from '../utils/api'
import toast from 'react-hot-toast'
import { 
  CheckCircle, Clock, AlertCircle, MapPin, User, 
  LogIn, X, Loader, Bell, BellOff, RefreshCw, 
  TrendingUp, Calendar, Moon, Sun, HelpCircle
} from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { solicitarPermisoNotificaciones, escucharNotificaciones, estaFirebaseConfigurado } from '../utils/firebase'
import { solicitarPermisoNotificaciones as solicitarWeb, mostrarNotificacion } from '../utils/notificacionesWeb'
import { getItem, setItem, removeItem } from '../utils/storage'
import CalendarioAuxiliar from '../components/CalendarioAuxiliar'

// Componente de Login específico para auxiliares
const LoginAuxiliar = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [cargando, setCargando] = useState(false)
  const { isDark, toggleTheme } = useTheme()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setCargando(true)

    try {
      const res = await api.post('/api/auth/login', { email, password })
      const { token, usuario } = res.data
      
      if (usuario.rol !== 'auxiliar') {
        toast.error('Solo los auxiliares pueden acceder desde aquí')
        setCargando(false)
        return
      }
      
      setItem('token', token)
      // Llamar al callback sin actualizar el contexto global para evitar redirecciones
      onLoginSuccess(token)
      toast.success('Inicio de sesión exitoso')
      // No actualizar el AuthContext global para evitar redirecciones automáticas
    } catch (error) {
      toast.error(error.response?.data?.mensaje || 'Error al iniciar sesión')
      setCargando(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 to-primary-700 dark:from-gray-900 dark:to-gray-800 px-4 transition-colors duration-300">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 sm:p-8 transition-colors duration-300">
        {/* Botón de modo oscuro */}
        <div className="flex justify-end mb-4">
          <button
            onClick={toggleTheme}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title={isDark ? 'Modo claro' : 'Modo oscuro'}
          >
            {isDark ? (
              <Sun className="w-5 h-5 text-yellow-500" />
            ) : (
              <Moon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            )}
          </button>
        </div>
        
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Acceso Auxiliares
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Inicia sesión para gestionar solicitudes
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
              placeholder="tu@email.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={cargando}
            className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cargando ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>

        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-800 dark:text-blue-300 text-center">
            <strong>Acceso exclusivo para auxiliares</strong>
          </p>
        </div>
      </div>
    </div>
  )
}

const AuxiliarAcceso = () => {
  const [autenticado, setAutenticado] = useState(false)
  const [solicitudes, setSolicitudes] = useState([])
  const [solicitudesAsignadas, setSolicitudesAsignadas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [token, setToken] = useState(() => getItem('token'))
  const [notificacionesActivas, setNotificacionesActivas] = useState(false)
  const [ultimaActualizacion, setUltimaActualizacion] = useState(null)
  const [intervaloActualizacion, setIntervaloActualizacion] = useState(null)
  const [mostrarAyudaPantallaBloqueo, setMostrarAyudaPantallaBloqueo] = useState(false)
  const [vistaActiva, setVistaActiva] = useState('lista')
  const [solicitudesCalendario, setSolicitudesCalendario] = useState([])

  const cargarSolicitudes = useCallback(async (mostrarNotificacionNueva = false) => {
    try {
      const [resPendientes, resAsignadas] = await Promise.all([
        api.get('/api/solicitudes/pendientes'),
        api.get('/api/solicitudes/mis-asignadas')
      ])
      
      const nuevasSolicitudes = resPendientes.data || []
      const nuevasAsignadas = resAsignadas.data || []
      
      console.log('📋 Solicitudes cargadas:', {
        pendientes: nuevasSolicitudes.length,
        asignadas: nuevasAsignadas.length
      })
      
      setSolicitudes(prevSolicitudes => {
        // Detectar nuevas solicitudes solo si se solicita explícitamente
        if (mostrarNotificacionNueva && prevSolicitudes.length > 0) {
          // Comparar IDs para detectar nuevas solicitudes
          const idsAnteriores = new Set(prevSolicitudes.map(s => s.id || s._id))
          const nuevas = nuevasSolicitudes.filter(s => !idsAnteriores.has(s.id || s._id))
          
          if (nuevas.length > 0) {
            const nuevaSolicitud = nuevas[0]
            if (notificacionesActivas) {
              mostrarNotificacion(
                `Nueva solicitud - Piso ${nuevaSolicitud.servicio?.piso}`,
                {
                  cuerpo: `${nuevaSolicitud.tipoRequerimiento.toUpperCase()} - ${nuevaSolicitud.servicio?.nombre}`,
                  urgente: nuevaSolicitud.prioridad === 'urgente' || nuevaSolicitud.prioridad === 'alta',
                  data: { solicitudId: nuevaSolicitud.id || nuevaSolicitud._id },
                  onClick: () => {
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }
                }
              )
            }
            toast.success('¡Nueva solicitud disponible!', {
              icon: '🔔',
              duration: 4000
            })
          }
        }
        
        return nuevasSolicitudes
      })
      
      setSolicitudesAsignadas(nuevasAsignadas)
      setUltimaActualizacion(new Date())
    } catch (error) {
      console.error('❌ Error cargando solicitudes:', error)
      toast.error('Error cargando solicitudes: ' + (error.response?.data?.mensaje || error.message))
    }
  }, [notificacionesActivas])

  const cargarCalendario = useCallback(async () => {
    try {
      const res = await api.get('/api/solicitudes/pendientes?incluirFuturas=1')
      setSolicitudesCalendario(res.data || [])
    } catch (e) {
      toast.error('Error cargando calendario')
    }
  }, [])

  useEffect(() => {
    if (vistaActiva === 'calendario' && autenticado) {
      cargarCalendario()
    }
  }, [vistaActiva, autenticado, cargarCalendario])

  useEffect(() => {
    // Asegurarse de que estamos en la ruta correcta (por si acaso)
    const currentHash = window.location.hash || ''
    if (!currentHash.includes('/auxiliar/acceso') && window.location.pathname !== '/auxiliar/acceso') {
      // Si no estamos en la ruta correcta, redirigir
      if (!currentHash) {
        window.location.hash = '/auxiliar/acceso'
        return
      }
    }
    
    const tokenGuardado = getItem('token')
    if (tokenGuardado) {
      setToken(tokenGuardado)
      // Verificar autenticación inmediatamente
      verificarAuth()
    } else {
      setCargando(false)
      setAutenticado(false)
    }
  }, [])
  
  // Remover el segundo useEffect que causaba verificaciones duplicadas

  useEffect(() => {
    if (!autenticado || cargando) return

    let limpiarListener = null
    let intervalo = null

    // Configurar notificaciones
    const configurarNotificaciones = async () => {
      const usarFirebase = estaFirebaseConfigurado()
      
      if (usarFirebase) {
        // Usar Firebase Cloud Messaging
        try {
          const token = await solicitarPermisoNotificaciones()
          if (token) {
            setNotificacionesActivas(true)
            toast.success('Notificaciones push activadas', { icon: '🔔' })
          }
          
          // Escuchar notificaciones de Firebase (solo una vez)
          limpiarListener = escucharNotificaciones((payload) => {
            toast.success(`Nueva solicitud: ${payload.notification?.title || 'Nueva solicitud'}`, {
              icon: '🔔',
              duration: 5000
            })
            // Cargar solicitudes sin mostrar notificación adicional
            cargarSolicitudes(false)
          })
        } catch (error) {
          console.error('Error configurando Firebase:', error)
        }
      } else {
        // Usar notificaciones web nativas como fallback
        try {
          const resultado = await solicitarWeb()
          setNotificacionesActivas(resultado.activo)
          if (resultado.activo) {
            toast.success('Notificaciones web activadas', { icon: '🔔' })
          } else if (resultado.denegado) {
            // No mostrar error si el permiso está denegado al cargar
            // El usuario puede activarlo manualmente con el botón
            console.log('Permiso de notificaciones denegado, el usuario puede activarlo manualmente')
          }
        } catch (error) {
          console.error('Error configurando notificaciones web:', error)
        }
      }
    }

    // Cargar solicitudes iniciales (sin mostrar notificación de nueva)
    cargarSolicitudes(false)
    
    // Configurar notificaciones
    configurarNotificaciones()
    
    // Configurar actualización automática cada 3 segundos para actualizaciones casi instantáneas
    // Solo actualizar si la pestaña está visible
    intervalo = setInterval(() => {
      if (!document.hidden) {
        cargarSolicitudes(true) // Permitir notificaciones en actualizaciones automáticas
      }
    }, 3000) // Actualizar cada 3 segundos
    
    setIntervaloActualizacion(intervalo)
    
    // Limpiar al desmontar
    return () => {
      if (intervalo) clearInterval(intervalo)
      if (limpiarListener) limpiarListener()
    }
  }, [autenticado, cargarSolicitudes]) // Incluir cargarSolicitudes pero ahora es estable

  const verificarAuth = async () => {
    try {
      const res = await api.get('/api/auth/me')
      if (res.data.rol === 'auxiliar') {
        setAutenticado(true)
        setCargando(false)
        // Asegurarse de que no se redirija al dashboard
        // El usuario debe permanecer en /auxiliar/acceso
        // No actualizar el AuthContext global para evitar redirecciones
      } else {
        // Si el usuario no es auxiliar, limpiar token y mostrar login
        // pero NO redirigir para evitar cerrar otras pestañas
        console.log('⚠️ Usuario no es auxiliar, limpiando sesión local')
        removeItem('token')
        setToken(null)
        setAutenticado(false)
        setCargando(false)
        toast.error('Solo los auxiliares pueden acceder aquí')
        // NO redirigir, solo mostrar el formulario de login en esta pestaña
      }
    } catch (error) {
      console.error('Error verificando autenticación:', error)
      removeItem('token')
      setToken(null)
      setAutenticado(false)
      setCargando(false)
      // NO redirigir, solo mostrar el formulario de login en esta pestaña
    }
  }

  const handleAsignar = async (solicitudId) => {
    try {
      if (!solicitudId) {
        toast.error('ID de solicitud inválido')
        return
      }
      await api.put(`/api/solicitudes/${solicitudId}/asignar`)
      toast.success('Solicitud asignada exitosamente', { icon: '✅' })
      await cargarSolicitudes(false)
      if (vistaActiva === 'calendario') await cargarCalendario()
    } catch (error) {
      toast.error(error.response?.data?.mensaje || 'Error asignando solicitud')
    }
  }

  const handleFinalizar = async (solicitudId) => {
    try {
      if (!solicitudId) {
        toast.error('ID de solicitud inválido')
        return
      }
      await api.put(`/api/solicitudes/${solicitudId}/estado`, { estado: 'completada' })
      toast.success('Solicitud finalizada exitosamente', { icon: '✅' })
      await cargarSolicitudes(false)
      if (vistaActiva === 'calendario') await cargarCalendario()
    } catch (error) {
      toast.error(error.response?.data?.mensaje || 'Error finalizando solicitud')
    }
  }

  const handleActivarNotificaciones = async () => {
    const usarFirebase = estaFirebaseConfigurado()
    
    if (usarFirebase) {
      try {
        const token = await solicitarPermisoNotificaciones()
        setNotificacionesActivas(!!token)
        if (token) {
          toast.success('Notificaciones push activadas', { icon: '🔔' })
        } else {
          // Verificar si el permiso está denegado
          if (Notification.permission === 'denied') {
            toast.error(
              'Permiso denegado. Ve a Configuración del navegador > Notificaciones para habilitarlo.',
              { 
                icon: '⚠️',
                duration: 6000
              }
            )
          } else {
            toast.error('No se pudo activar las notificaciones', { icon: '⚠️' })
          }
        }
      } catch (error) {
        console.error('Error activando notificaciones:', error)
        toast.error('Error al activar notificaciones', { icon: '⚠️' })
      }
    } else {
      try {
        const resultado = await solicitarWeb()
        setNotificacionesActivas(resultado.activo)
        
        if (resultado.activo) {
          toast.success('Notificaciones web activadas', { icon: '🔔' })
        } else {
          if (resultado.denegado) {
            toast.error(
              resultado.mensaje || 'Permiso denegado. Ve a Configuración del navegador > Notificaciones para habilitarlo.',
              { 
                icon: '⚠️',
                duration: 6000
              }
            )
          } else {
            toast.error(resultado.mensaje || 'No se pudo activar las notificaciones', { icon: '⚠️' })
          }
        }
      } catch (error) {
        console.error('Error activando notificaciones:', error)
        toast.error('Error al activar notificaciones', { icon: '⚠️' })
      }
    }
  }

  const formatearTiempo = (fecha) => {
    if (!fecha) return 'N/A'
    const ahora = new Date()
    const fechaObj = new Date(fecha)
    const diffMs = ahora - fechaObj
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return 'Hace un momento'
    if (diffMins < 60) return `Hace ${diffMins} min`
    const diffHoras = Math.floor(diffMins / 60)
    if (diffHoras < 24) return `Hace ${diffHoras}h`
    return fechaObj.toLocaleDateString('es-ES')
  }

  const getPrioridadColor = (prioridad) => {
    const colores = {
      baja: 'bg-gray-100 text-gray-700 border-gray-300',
      media: 'bg-blue-100 text-blue-700 border-blue-300',
      alta: 'bg-orange-100 text-orange-700 border-orange-300',
      urgente: 'bg-red-100 text-red-700 border-red-300 animate-pulse'
    }
    return colores[prioridad] || colores.media
  }

  const getTipoIcon = (tipo) => {
    const iconos = {
      alta: '🏥',
      traslado: '🚑',
      pabellon: '⚕️',
      otro: '📋'
    }
    return iconos[tipo] || '📋'
  }

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
        <div className="text-center">
          <Loader className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-primary-700 font-medium">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!autenticado) {
    return <LoginAuxiliar onLoginSuccess={(t) => { 
      setToken(t)
      setItem('token', t)
      setAutenticado(true)
      setCargando(false)
      // Cargar solicitudes después de autenticar
      setTimeout(() => {
        cargarSolicitudes(false)
      }, 100)
    }} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 pb-8">
      {/* Header mejorado */}
      <header className="bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-xl sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
            <div>
              <h1 className="text-2xl font-bold">Solicitudes Disponibles</h1>
              <p className="text-sm text-primary-100">Asigna y gestiona solicitudes en tiempo real</p>
            </div>
            <button
              onClick={() => {
                removeItem('token')
                setToken(null)
                setAutenticado(false)
                setCargando(false)
              }}
              className="p-2 hover:bg-primary-700 rounded-lg transition"
              title="Cerrar sesión"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          {/* Barra de estado */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 border-t border-primary-500">
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <button
                onClick={() => cargarSolicitudes(false)}
                className="flex items-center gap-2 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition"
              >
                <RefreshCw className="w-4 h-4" />
                Actualizar
              </button>
              {ultimaActualizacion && (
                <span className="text-primary-100 flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {formatearTiempo(ultimaActualizacion)}
                </span>
              )}
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              {Notification.permission === 'denied' && (
                <div className="text-xs text-primary-100 bg-red-500/20 px-2 py-1 rounded max-w-xs">
                  Ve a Configuración del navegador para habilitar notificaciones
                </div>
              )}
              {notificacionesActivas && typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) && (
                <button
                  type="button"
                  onClick={() => setMostrarAyudaPantallaBloqueo(true)}
                  className="flex items-center gap-1.5 text-xs text-primary-100 bg-white/15 hover:bg-white/25 px-2 py-1.5 rounded transition"
                  title="Cómo ver notificaciones con el móvil bloqueado"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>¿No ves notificaciones al bloquear?</span>
                </button>
              )}
              <button
                onClick={handleActivarNotificaciones}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition ${
                  notificacionesActivas 
                    ? 'bg-green-500/20 hover:bg-green-500/30' 
                    : Notification.permission === 'denied'
                    ? 'bg-red-500/20 hover:bg-red-500/30'
                    : 'bg-white/20 hover:bg-white/30'
                }`}
                title={
                  Notification.permission === 'denied' 
                    ? 'Permiso denegado. Ve a Configuración del navegador para habilitarlo.'
                    : notificacionesActivas
                    ? 'Notificaciones activadas'
                    : 'Activar notificaciones'
                }
              >
                {notificacionesActivas ? (
                  <>
                    <Bell className="w-4 h-4" />
                    <span className="text-xs">Notificaciones ON</span>
                  </>
                ) : Notification.permission === 'denied' ? (
                  <>
                    <BellOff className="w-4 h-4" />
                    <span className="text-xs">Permiso Denegado</span>
                  </>
                ) : (
                  <>
                    <BellOff className="w-4 h-4" />
                    <span className="text-xs">Activar Notificaciones</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Modal: Cómo ver notificaciones en pantalla de bloqueo */}
      {mostrarAyudaPantallaBloqueo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setMostrarAyudaPantallaBloqueo(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Ver notificaciones con el móvil bloqueado</h3>
              <button type="button" onClick={() => setMostrarAyudaPantallaBloqueo(false)} className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              El sistema no puede forzar que aparezcan en la pantalla de bloqueo; depende de los ajustes del teléfono. Sigue estos pasos:
            </p>
            {typeof navigator !== 'undefined' && /iPhone|iPad|iPod/i.test(navigator.userAgent) ? (
              <ol className="text-sm text-gray-700 dark:text-gray-200 space-y-2 list-decimal list-inside">
                <li><strong>Añade la app a Inicio</strong>: en Safari, toca el botón compartir (cuadrado con flecha) → &quot;Añadir a la pantalla de inicio&quot;. Abre la app desde ese icono.</li>
                <li><strong>Ajustes del iPhone</strong> → Notificaciones → busca <strong>&quot;Auxiliares&quot;</strong> (o el nombre de la app).</li>
                <li>Activa <strong>&quot;Permitir notificaciones&quot;</strong> y <strong>&quot;Pantalla de bloqueo&quot;</strong> (y Centro de notificaciones si quieres).</li>
                <li>Opcional: activa sonido y avisos para no perderlas.</li>
              </ol>
            ) : (
              <ol className="text-sm text-gray-700 dark:text-gray-200 space-y-2 list-decimal list-inside">
                <li><strong>Ajustes</strong> (del móvil) → Aplicaciones → <strong>Chrome</strong> (o el navegador que uses).</li>
                <li>Entra en <strong>Notificaciones</strong> y asegúrate de que estén activadas.</li>
                <li>Busca la opción <strong>&quot;Mostrar en pantalla de bloqueo&quot;</strong> o &quot;En pantalla de bloqueo&quot; y actívala.</li>
                <li>En algunos móviles: Ajustes → Notificaciones → Notificaciones en pantalla de bloqueo → activar para Chrome o para esta app.</li>
              </ol>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Si ya lo tienes activado y no ves la notificación al bloquear, revisa que no tengas activado &quot;No molestar&quot; o modo concentración.
            </p>
            <button type="button" onClick={() => setMostrarAyudaPantallaBloqueo(false)} className="w-full py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
              Entendido
            </button>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Tabs Lista / Calendario */}
        <div className="flex gap-2 mb-6">
          <button
            type="button"
            onClick={() => setVistaActiva('lista')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              vistaActiva === 'lista'
                ? 'bg-primary-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            Lista
          </button>
          <button
            type="button"
            onClick={() => setVistaActiva('calendario')}
            className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
              vistaActiva === 'calendario'
                ? 'bg-primary-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Calendario
          </button>
        </div>

        {vistaActiva === 'calendario' ? (
          <CalendarioAuxiliar
            solicitudesPendientes={solicitudesCalendario}
            solicitudesAsignadas={solicitudesAsignadas}
            onAsignar={handleAsignar}
            onCompletar={handleFinalizar}
            getTipoIcon={getTipoIcon}
            getPrioridadColor={getPrioridadColor}
          />
        ) : (
          <>
        {/* Solicitudes Asignadas (En Proceso) */}
        {solicitudesAsignadas.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <AlertCircle className="w-6 h-6 text-orange-600" />
              Mis Solicitudes en Proceso ({solicitudesAsignadas.length})
            </h2>
            <div className="space-y-4">
              {solicitudesAsignadas.map((solicitud) => (
                <div
                  key={solicitud.id || solicitud._id}
                  className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl shadow-lg p-4 sm:p-6 border-l-4 border-orange-500"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-3xl">{getTipoIcon(solicitud.tipoRequerimiento)}</span>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">
                            Piso {solicitud.servicio?.piso} - {solicitud.servicio?.nombre}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <MapPin className="w-4 h-4 text-orange-600" />
                            <span className="text-sm text-gray-600">
                              {solicitud.servicio?.piso || 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getPrioridadColor(solicitud.prioridad)}`}>
                          {solicitud.prioridad.toUpperCase()}
                        </span>
                        <span className="px-3 py-1 bg-orange-200 text-orange-800 rounded-full text-xs font-medium">
                          EN PROCESO
                        </span>
                      </div>

                      {solicitud.descripcion && (
                        <p className="text-gray-700 dark:text-gray-300 mb-3 bg-white dark:bg-gray-800 p-3 rounded-lg">{solicitud.descripcion}</p>
                      )}

                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          <span>{solicitud.solicitadoPor?.nombre || 'N/A'}</span>
                        </div>
                        {solicitud.fechaAsignacion && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>Asignada {formatearTiempo(solicitud.fechaAsignacion)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleFinalizar(solicitud.id || solicitud._id)}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition font-semibold shadow-md hover:shadow-lg transform hover:scale-105"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Finalizar Solicitud
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Solicitudes Pendientes */}
        {solicitudes.length === 0 && solicitudesAsignadas.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 sm:p-12 text-center transition-colors duration-300">
            <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              No hay solicitudes disponibles
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Todas las solicitudes han sido asignadas o completadas
            </p>
            <button
              onClick={() => cargarSolicitudes(false)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-medium"
            >
              <RefreshCw className="w-5 h-5" />
              Actualizar
            </button>
          </div>
        ) : solicitudes.length > 0 ? (
          <>
            {/* Contador */}
            <div className="mb-6 bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 transition-colors duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Solicitudes pendientes</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{solicitudes.length}</p>
                  </div>
                </div>
                {ultimaActualizacion && (
                  <div className="text-right">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Última actualización</p>
                    <p className="text-sm font-medium text-gray-700">
                      {formatearTiempo(ultimaActualizacion)}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              {solicitudes.map((solicitud) => (
                <div
                  key={solicitud.id || solicitud._id}
                  className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border-l-4 border-primary-500 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-3xl">{getTipoIcon(solicitud.tipoRequerimiento)}</span>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">
                            Piso {solicitud.servicio?.piso} - {solicitud.servicio?.nombre}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <MapPin className="w-4 h-4 text-primary-600" />
                            <span className="text-sm text-gray-600">
                              {solicitud.servicio?.piso || 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getPrioridadColor(solicitud.prioridad)}`}>
                          {solicitud.prioridad.toUpperCase()}
                        </span>
                        <span className="px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-xs font-medium">
                          {solicitud.tipoRequerimiento.toUpperCase()}
                        </span>
                      </div>

                      {solicitud.descripcion && (
                        <p className="text-gray-700 mb-3 bg-gray-50 p-3 rounded-lg">{solicitud.descripcion}</p>
                      )}

                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          <span>{solicitud.solicitadoPor?.nombre || 'N/A'}</span>
                        </div>
                        {solicitud.fechaProgramada ? (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4 text-primary-600" />
                            <span className="text-primary-600 font-semibold">
                              Programada: {new Date(solicitud.fechaProgramada).toLocaleDateString('es-ES')}
                            </span>
                          </div>
                        ) : solicitud.createdAt && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>{formatearTiempo(solicitud.createdAt)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleAsignar(solicitud.id || solicitud._id)}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg hover:from-primary-700 hover:to-primary-800 transition font-semibold shadow-md hover:shadow-lg transform hover:scale-105"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Asignarme a esta solicitud
                  </button>
                </div>
              ))}
            </div>
          </>
        ) : null}
          </>
        )}
      </div>
    </div>
  )
}

export default AuxiliarAcceso
