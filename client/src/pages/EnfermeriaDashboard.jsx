import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useNavigate } from 'react-router-dom'
import api from '../utils/api'
import toast from 'react-hot-toast'
import { 
  LogOut, Plus, AlertCircle,
  Building2, User, MapPin, MessageSquare, History, Moon, Sun, UserCircle
} from 'lucide-react'
import SolicitudModal from '../components/SolicitudModal'
import SolicitudCard from '../components/SolicitudCard'
import FiltrosSolicitudes from '../components/FiltrosSolicitudes'
import MiPerfilModal from '../components/MiPerfilModal'
import CanceladasModal from '../components/CanceladasModal'
import EstadisticasTiempoReal from '../components/EstadisticasTiempoReal'

const EnfermeriaDashboard = () => {
  const { usuario, logout, refreshUsuario } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [solicitudes, setSolicitudes] = useState([])
  const [solicitudesFiltradas, setSolicitudesFiltradas] = useState([])
  const [servicios, setServicios] = useState([])
  const [mostrarModal, setMostrarModal] = useState(false)
  const [mostrarMiPerfil, setMostrarMiPerfil] = useState(false)
  const [mostrarCanceladasModal, setMostrarCanceladasModal] = useState(false)
  const [cargando, setCargando] = useState(true)
  const [pestañaActiva, setPestañaActiva] = useState('todas') // todas, pendientes, en_proceso, completadas
  const [pollIntervalMs, setPollIntervalMs] = useState(5000)
  const toastCargaErrorMostrado = useRef(false)

  const cargarDatos = useCallback(async () => {
    const [rSol, rSer] = await Promise.allSettled([
      api.get('/api/solicitudes'),
      api.get('/api/servicios')
    ])
    let ok = 0
    let fail = 0

    if (rSol.status === 'fulfilled') {
      ok++
      const rawSol = rSol.value.data || []
      setSolicitudes([...new Map(rawSol.map((s) => [s.id, s])).values()])
    } else {
      fail++
      console.error('solicitudes:', rSol.reason?.message || rSol.reason)
    }

    if (rSer.status === 'fulfilled') {
      ok++
      setServicios(rSer.value.data || [])
    } else {
      fail++
      console.error('servicios:', rSer.reason?.message || rSer.reason)
    }

    if (ok > 0) {
      toastCargaErrorMostrado.current = false
      setPollIntervalMs(5000)
    }
    if (fail > 0 && ok === 0) {
      if (!toastCargaErrorMostrado.current) {
        toast.error('Error cargando datos')
        toastCargaErrorMostrado.current = true
      }
      setPollIntervalMs((prev) => Math.min(60000, Math.max(15000, prev * 2)))
    }
    setCargando(false)
  }, [])

  useEffect(() => {
    if (!usuario || usuario.rol !== 'enfermeria') {
      navigate('/login')
      return
    }

    cargarDatos()

    const intervalo = setInterval(() => {
      if (!document.hidden) {
        cargarDatos()
      }
    }, pollIntervalMs)

    return () => clearInterval(intervalo)
  }, [usuario, navigate, pollIntervalMs, cargarDatos])

  useEffect(() => {
    // Filtrar solicitudes según la pestaña activa
    let filtradas = []
    switch (pestañaActiva) {
      case 'pendientes':
        filtradas = solicitudes.filter(s => s.estado === 'pendiente')
        break
      case 'en_proceso':
        filtradas = solicitudes.filter(s => s.estado === 'en_proceso')
        break
      case 'completadas':
        filtradas = solicitudes.filter(s => s.estado === 'completada')
        break
      default:
        filtradas = solicitudes
    }
    setSolicitudesFiltradas(filtradas)
  }, [solicitudes, pestañaActiva])

  const handleLogout = () => {
    logout()
    navigate('/login')
    toast.success('Sesión cerrada')
  }

  const handleNuevaSolicitud = async (datos) => {
    try {
      const datosConServicio = {
        ...datos,
        servicioId: usuario.servicioId || datos.servicioId
      }
      await api.post('/api/solicitudes', datosConServicio)
      toast.success('Solicitud creada exitosamente')
      setMostrarModal(false)
      await cargarDatos()
    } catch (error) {
      const msg = error.response?.data?.mensaje || 'Error creando solicitud'
      toast.error(msg)
      throw error
    }
  }

  const handleActualizarSolicitud = () => {
    cargarDatos()
  }

  const stats = {
    total: solicitudes.length,
    pendientes: solicitudes.filter(s => s.estado === 'pendiente').length,
    enProceso: solicitudes.filter(s => s.estado === 'en_proceso').length,
    completadas: solicitudes.filter(s => s.estado === 'completada').length,
    canceladas: solicitudes.filter(s => s.estado === 'cancelada').length
  }

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-primary-700 dark:text-primary-300 font-medium">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-primary-50/30 to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-lg border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
                Personal de Enfermería
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Bienvenido, <span className="font-semibold text-gray-900 dark:text-white">{usuario?.nombre}</span>
                {usuario?.servicio && (
                  <span className="ml-2 px-2 py-0.5 bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 rounded-full text-xs font-medium">
                    {usuario.servicio.nombre}
                  </span>
                )}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <button
                onClick={() => setMostrarMiPerfil(true)}
                className="flex items-center justify-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition w-full sm:w-auto"
                title="Modificar mi perfil"
              >
                <UserCircle className="w-5 h-5" />
                Modificar mi perfil
              </button>
              <button
                onClick={toggleTheme}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                title={isDark ? 'Modo claro' : 'Modo oscuro'}
              >
                {isDark ? (
                  <Sun className="w-5 h-5 text-yellow-500" />
                ) : (
                  <Moon className="w-5 h-5 text-gray-600" />
                )}
              </button>
              <button
                onClick={() => setMostrarModal(true)}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg hover:from-primary-700 hover:to-primary-800 transition shadow-md hover:shadow-lg w-full sm:w-auto"
              >
                <Plus className="w-5 h-5" />
                Nueva Solicitud
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center justify-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition w-full sm:w-auto"
              >
                <LogOut className="w-5 h-5" />
                Salir
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 pb-28 pt-6 sm:px-6 sm:pt-8 md:pb-8 lg:px-8">
        {/* Estadísticas solo del servicio del usuario (no total hospital) */}
        <div className="mb-6 sm:mb-8">
          <EstadisticasTiempoReal
            solicitudes={solicitudes}
            nombreServicio={usuario?.servicio?.nombre || servicios.find(s => s.id === usuario?.servicioId)?.nombre}
          />
        </div>

        {/* Contenedor principal */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          {/* Pestañas */}
          <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
            <div className="flex overflow-x-auto">
              <button
                onClick={() => setPestañaActiva('todas')}
                className={`flex-1 px-4 sm:px-6 py-3 sm:py-4 text-sm font-medium transition whitespace-nowrap ${
                  pestañaActiva === 'todas'
                    ? 'bg-white dark:bg-gray-800 text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                Todas ({stats.total})
              </button>
              <button
                onClick={() => setPestañaActiva('pendientes')}
                className={`flex-1 px-4 sm:px-6 py-3 sm:py-4 text-sm font-medium transition whitespace-nowrap ${
                  pestañaActiva === 'pendientes'
                    ? 'bg-white dark:bg-gray-800 text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                Pendientes ({stats.pendientes})
              </button>
              <button
                onClick={() => setPestañaActiva('en_proceso')}
                className={`flex-1 px-4 sm:px-6 py-3 sm:py-4 text-sm font-medium transition whitespace-nowrap ${
                  pestañaActiva === 'en_proceso'
                    ? 'bg-white dark:bg-gray-800 text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                En Proceso ({stats.enProceso})
              </button>
              <button
                onClick={() => setPestañaActiva('completadas')}
                className={`flex-1 px-4 sm:px-6 py-3 sm:py-4 text-sm font-medium transition whitespace-nowrap ${
                  pestañaActiva === 'completadas'
                    ? 'bg-white dark:bg-gray-800 text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                Completadas ({stats.completadas})
              </button>
              <button
                onClick={() => setMostrarCanceladasModal(true)}
                className="flex-1 px-4 sm:px-6 py-3 sm:py-4 text-sm font-medium transition whitespace-nowrap text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Canceladas ({stats.canceladas})
              </button>
            </div>
          </div>
          
          <div className="p-4 sm:p-6">
            <FiltrosSolicitudes 
              key={pestañaActiva}
              solicitudes={solicitudes.filter(s => {
                switch (pestañaActiva) {
                  case 'pendientes':
                    return s.estado === 'pendiente'
                  case 'en_proceso':
                    return s.estado === 'en_proceso'
                  case 'completadas':
                    return s.estado === 'completada'
                  default:
                    return true
                }
              })}
              onFiltroChange={setSolicitudesFiltradas}
            />

            {solicitudesFiltradas.length === 0 ? (
              <div className="text-center py-12">
                <AlertCircle className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">No hay solicitudes</p>
                <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
                  {pestañaActiva === 'todas' ? 'Crea tu primera solicitud' : 'No hay solicitudes en esta categoría'}
                </p>
                {pestañaActiva === 'todas' && (
                  <button
                    type="button"
                    onClick={() => setMostrarModal(true)}
                    className="mt-6 inline-flex min-h-[48px] items-center justify-center gap-2 rounded-lg bg-primary-600 px-6 py-3 text-base font-semibold text-white shadow-md hover:bg-primary-700 md:hidden"
                  >
                    <Plus className="h-5 w-5" />
                    Nueva solicitud
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {solicitudesFiltradas.map((solicitud) => (
                  <SolicitudCard
                    key={solicitud.id || solicitud._id}
                    solicitud={solicitud}
                    usuario={usuario}
                    onUpdate={handleActualizarSolicitud}
                    servicios={servicios}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de nueva solicitud */}
      {mostrarModal && (
        <SolicitudModal
          onClose={() => setMostrarModal(false)}
          onSolicitudCreada={handleNuevaSolicitud}
          servicios={servicios.filter(s => s.id === usuario?.servicioId)}
          servicioPredeterminado={usuario?.servicioId}
        />
      )}

      {/* Modal modificar mi perfil (enfermería) */}
      {mostrarMiPerfil && usuario && (
        <MiPerfilModal
          usuario={usuario}
          onClose={() => setMostrarMiPerfil(false)}
          onGuardado={() => refreshUsuario?.()}
        />
      )}

      {/* Modal solicitudes canceladas (solo de su servicio) */}
      {mostrarCanceladasModal && (
        <CanceladasModal
          solicitudesCanceladas={solicitudes.filter(s => s.estado === 'cancelada')}
          onClose={() => setMostrarCanceladasModal(false)}
          usuario={usuario}
          servicios={servicios.filter(s => s.id === usuario?.servicioId)}
          onUpdate={handleActualizarSolicitud}
        />
      )}

      {!mostrarModal && (
        <button
          type="button"
          aria-label="Nueva solicitud"
          onClick={() => setMostrarModal(true)}
          className="fixed z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary-600 text-white shadow-lg ring-4 ring-white/30 transition hover:bg-primary-700 hover:shadow-xl active:scale-95 dark:bg-primary-500 dark:ring-gray-900/50 md:hidden"
          style={{ bottom: 'max(1.25rem, env(safe-area-inset-bottom))', right: 'max(1.25rem, env(safe-area-inset-right))' }}
        >
          <Plus className="h-7 w-7" strokeWidth={2.5} />
        </button>
      )}
    </div>
  )
}

export default EnfermeriaDashboard

