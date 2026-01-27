import { useState, useEffect, useCallback } from 'react'
import api from '../utils/api'
import toast from 'react-hot-toast'
import { 
  CheckCircle, Clock, AlertCircle, MapPin, User, 
  LogIn, X, Loader, Bell, BellOff, RefreshCw, 
  TrendingUp, Calendar, Moon, Sun
} from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { solicitarPermisoNotificaciones, escucharNotificaciones, estaFirebaseConfigurado } from '../utils/firebase'
import { solicitarPermisoNotificaciones as solicitarWeb, mostrarNotificacion } from '../utils/notificacionesWeb'
import Logo from '../components/Logo'

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
      
      // Guardar token
      localStorage.setItem('token', token)
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
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 transition-colors duration-300">
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
          <Logo size="small" className="mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Acceso Auxiliares</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Inicia sesión para gestionar solicitudes</p>
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
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [notificacionesActivas, setNotificacionesActivas] = useState(false)
  const [ultimaActualizacion, setUltimaActualizacion] = useState(null)
  const [intervaloActualizacion, setIntervaloActualizacion] = useState(null)

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
    
    // Verificar si hay token al cargar el componente
    const tokenGuardado = localStorage.getItem('token')
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
          const activo = await solicitarWeb()
          setNotificacionesActivas(activo)
          if (activo) {
            toast.success('Notificaciones web activadas', { icon: '🔔' })
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
        localStorage.removeItem('token')
        setToken(null)
        setAutenticado(false)
        setCargando(false)
        toast.error('Solo los auxiliares pueden acceder aquí')
        // NO redirigir, solo mostrar el formulario de login en esta pestaña
      }
    } catch (error) {
      console.error('Error verificando autenticación:', error)
      // Si hay error 401 o cualquier otro, limpiar token localmente
      // pero NO redirigir para evitar cerrar otras pestañas
      localStorage.removeItem('token')
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
      // Recargar inmediatamente
      await cargarSolicitudes(false)
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
      // Recargar inmediatamente
      await cargarSolicitudes(false)
    } catch (error) {
      toast.error(error.response?.data?.mensaje || 'Error finalizando solicitud')
    }
  }

  const handleActivarNotificaciones = async () => {
    const usarFirebase = estaFirebaseConfigurado()
    
    if (usarFirebase) {
      const token = await solicitarPermisoNotificaciones()
      setNotificacionesActivas(!!token)
      if (token) {
        toast.success('Notificaciones push activadas', { icon: '🔔' })
      } else {
        toast.error('Permiso de notificaciones denegado', { icon: '⚠️' })
      }
    } else {
      const activo = await solicitarWeb()
      setNotificacionesActivas(activo)
      if (activo) {
        toast.success('Notificaciones web activadas', { icon: '🔔' })
      } else {
        toast.error('Permiso de notificaciones denegado', { icon: '⚠️' })
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
      localStorage.setItem('token', t)
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
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-2xl font-bold">Solicitudes Disponibles</h1>
              <p className="text-sm text-primary-100">Asigna y gestiona solicitudes en tiempo real</p>
            </div>
            <button
              onClick={() => {
                localStorage.removeItem('token')
                setToken(null)
                setAutenticado(false)
                setCargando(false)
                // NO recargar la página, solo limpiar el estado local
                // para evitar cerrar otras pestañas
              }}
              className="p-2 hover:bg-primary-700 rounded-lg transition"
              title="Cerrar sesión"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          {/* Barra de estado */}
          <div className="flex items-center justify-between pt-3 border-t border-primary-500">
            <div className="flex items-center gap-4 text-sm">
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
            
            <button
              onClick={handleActivarNotificaciones}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition ${
                notificacionesActivas 
                  ? 'bg-green-500/20 hover:bg-green-500/30' 
                  : 'bg-white/20 hover:bg-white/30'
              }`}
            >
              {notificacionesActivas ? (
                <>
                  <Bell className="w-4 h-4" />
                  <span className="text-xs">Notificaciones ON</span>
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
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">
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
                  className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl shadow-lg p-6 border-l-4 border-orange-500"
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
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-12 text-center transition-colors duration-300">
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
                  className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-primary-500 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
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
      </div>
    </div>
  )
}

export default AuxiliarAcceso
