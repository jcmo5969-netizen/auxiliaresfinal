import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useNavigate } from 'react-router-dom'
import api from '../utils/api'
import toast from 'react-hot-toast'
import { 
  LogOut, QrCode, Plus, CheckCircle, Clock, AlertCircle,
  User, Building2, Calendar, TrendingUp, Users, Moon, Sun, BarChart3,
  FileText, MessageSquare, Shield, Settings, Bell, Layout
} from 'lucide-react'
import SolicitudModal from '../components/SolicitudModal'
import ServiciosList from '../components/ServiciosList'
import PersonalList from '../components/PersonalList'
import SolicitudCard from '../components/SolicitudCard'
import FiltrosSolicitudes from '../components/FiltrosSolicitudes'
import NotificacionesDia from '../components/NotificacionesDia'
import ChatModal from '../components/ChatModal'
import MetricasModal from '../components/MetricasModal'
import CalendarioModal from '../components/CalendarioModal'
import LogsModal from '../components/LogsModal'
import PlantillasModal from '../components/PlantillasModal'
import AlertasPanel from '../components/AlertasPanel'
import RecordatoriosModal from '../components/RecordatoriosModal'
import CanceladasModal from '../components/CanceladasModal'
import WidgetConfig from '../components/WidgetConfig'
import EstadisticasTiempoReal from '../components/EstadisticasTiempoReal'
import Logo from '../components/Logo'
import RelojVentana from '../components/RelojVentana'
import { EtiquetasProvider } from '../context/EtiquetasContext'

const Dashboard = () => {
  const { usuario, logout } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [solicitudes, setSolicitudes] = useState([])
  const [solicitudesFiltradas, setSolicitudesFiltradas] = useState([])
  const [servicios, setServicios] = useState([])
  const [personal, setPersonal] = useState([])
  const [mostrarModal, setMostrarModal] = useState(false)
  const [cargando, setCargando] = useState(true)
  const [pestañaActiva, setPestañaActiva] = useState('pendientes') // pendientes, en_proceso, historicos
  const [mostrarChatModal, setMostrarChatModal] = useState(false)
  const [mostrarMetricasModal, setMostrarMetricasModal] = useState(false)
  const [mostrarCalendarioModal, setMostrarCalendarioModal] = useState(false)
  const [mostrarLogsModal, setMostrarLogsModal] = useState(false)
  const [mostrarPlantillasModal, setMostrarPlantillasModal] = useState(false)
  const [datosPlantillaParaNueva, setDatosPlantillaParaNueva] = useState(null)
  const [mostrarRecordatoriosModal, setMostrarRecordatoriosModal] = useState(false)
  const [mostrarCanceladasModal, setMostrarCanceladasModal] = useState(false)
  const [mostrarWidgetConfig, setMostrarWidgetConfig] = useState(false)
  const [widgetsConfig, setWidgetsConfig] = useState([])
  /** Intervalo de auto-refresh: sube si el API falla (evita spam de 500 cada 3s) */
  const [pollIntervalMs, setPollIntervalMs] = useState(15000)
  const toastCargaErrorMostrado = useRef(false)

  // Verificar que el usuario sea administrador
  useEffect(() => {
    if (!usuario) {
      navigate('/login', { replace: true })
      return
    }
    
    if (usuario.rol !== 'administrador') {
      // Si no es administrador, redirigir según su rol
      if (usuario.rol === 'auxiliar') {
        navigate('/auxiliar/acceso', { replace: true })
      } else if (usuario.rol === 'enfermeria') {
        navigate('/login', { replace: true })
      }
      return
    }
  }, [usuario, navigate])

  const cargarDatos = useCallback(async () => {
    const promesas = [api.get('/api/solicitudes'), api.get('/api/servicios')]
    if (usuario?.rol === 'administrador') {
      promesas.push(api.get('/api/auxiliares'))
    }

    const resultados = await Promise.allSettled(promesas)
    let ok = 0
    let fail = 0

    const r0 = resultados[0]
    if (r0.status === 'fulfilled') {
      ok++
      const rawSol = r0.value.data || []
      setSolicitudes([...new Map(rawSol.map((s) => [s.id, s])).values()])
    } else {
      fail++
      if (import.meta.env.DEV) {
        console.error('❌ solicitudes:', r0.reason?.message || r0.reason)
      }
    }

    const r1 = resultados[1]
    if (r1.status === 'fulfilled') {
      ok++
      setServicios(r1.value.data || [])
    } else {
      fail++
      if (import.meta.env.DEV) {
        console.error('❌ servicios:', r1.reason?.message || r1.reason)
      }
    }

    if (usuario?.rol === 'administrador' && resultados[2]) {
      const r2 = resultados[2]
      if (r2.status === 'fulfilled') {
        ok++
        setPersonal(r2.value.data || [])
      } else {
        fail++
        if (import.meta.env.DEV) {
          console.error('❌ auxiliares:', r2.reason?.message || r2.reason)
        }
      }
    }

    if (ok > 0) {
      toastCargaErrorMostrado.current = false
      setPollIntervalMs(15000)
      if (import.meta.env.DEV) {
        if (fail === 0) {
          console.log('📊 Datos cargados OK (todos los endpoints)')
        } else {
          console.warn('⚠️ Carga parcial: se mantiene lo que respondió bien')
        }
      }
    }
    if (fail > 0 && ok === 0) {
      if (!toastCargaErrorMostrado.current) {
        toast.error('Error cargando datos. Comprueba la conexión con el servidor.')
        toastCargaErrorMostrado.current = true
      }
      setPollIntervalMs((prev) => Math.min(60000, Math.max(10000, prev * 2)))
    }
    setCargando(false)
  }, [usuario])

  useEffect(() => {
    if (!usuario || usuario.rol !== 'administrador') return

    cargarDatos()

    const intervalo = setInterval(() => {
      if (!document.hidden) {
        cargarDatos()
      }
    }, pollIntervalMs)

    return () => clearInterval(intervalo)
  }, [usuario, pollIntervalMs, cargarDatos])

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
      case 'historicos':
        filtradas = solicitudes.filter(s => s.estado === 'completada' || s.estado === 'cancelada')
        break
      default:
        filtradas = solicitudes
    }
    if (import.meta.env.DEV) {
      console.log(`📑 Pestaña ${pestañaActiva}: ${filtradas.length} solicitudes de ${solicitudes.length} totales`)
    }
    setSolicitudesFiltradas(filtradas)
  }, [solicitudes, pestañaActiva])

  // Escuchar evento para cambiar pestaña desde NotificacionesDia
  useEffect(() => {
    const handleCambiarPestaña = (event) => {
      setPestañaActiva(event.detail)
    }
    window.addEventListener('cambiarPestaña', handleCambiarPestaña)
    return () => window.removeEventListener('cambiarPestaña', handleCambiarPestaña)
  }, [])

  const handlePersonalAgregado = async () => {
    if (usuario?.rol === 'administrador') {
      try {
        const res = await api.get('/api/auxiliares')
        setPersonal(res.data)
      } catch (error) {
        toast.error('Error recargando personal')
      }
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
    toast.success('Sesión cerrada')
  }

  const handleNuevaSolicitud = async (datos) => {
    try {
      await api.post('/api/solicitudes', datos)
      toast.success('Solicitud creada exitosamente')
      setMostrarModal(false)
      setDatosPlantillaParaNueva(null)
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
    canceladas: solicitudes.filter(s => s.estado === 'cancelada').length,
    auxiliares: personal.filter(p => p.rol === 'auxiliar' && p.activo).length
  }

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-primary-700 font-medium">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <EtiquetasProvider>
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-primary-50/30 to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Panel de Alertas */}
      <AlertasPanel solicitudes={solicitudes} />
      
      {/* Notificación de solicitudes del día */}
      <NotificacionesDia solicitudes={solicitudes} />
      
      {/* Header mejorado */}
      <header className="bg-white dark:bg-gray-800 shadow-lg border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30 backdrop-blur-sm bg-white/95 dark:bg-gray-800/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Primera fila: Título y usuario */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-4 border-b border-gray-200 dark:border-gray-700 gap-4">
            <div className="flex items-center gap-4">
              {/* Logo del Hospital */}
              <div className="flex items-center gap-3">
                <img 
                  src="/logo-hospital-quilpue.svg" 
                  alt="Hospital de Quilpué"
                  className="h-10 sm:h-12 w-auto object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
                <div className="hidden flex-col">
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
                    Dashboard
                  </h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Sistema de Gestión de Auxiliares
                  </p>
                </div>
              </div>
              <div className="flex flex-col">
                <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
                  Dashboard
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Sistema de Gestión de Auxiliares
                </p>
              </div>
            </div>
            
            {/* Ventana de hora adelantada (1h 3min) */}
            <div className="hidden md:block">
              <RelojVentana className="min-w-[140px]" soloHora={false} />
            </div>

            {/* Información del usuario */}
            <div className="flex items-center gap-3 justify-between sm:justify-end">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                  {usuario?.nombre?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="hidden md:block">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {usuario?.nombre}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                    {usuario?.rol}
                  </p>
                </div>
              </div>
              
              {/* Botones de acción rápida */}
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleTheme}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-300 group"
                  title={isDark ? 'Modo claro' : 'Modo oscuro'}
                >
                  {isDark ? (
                    <Sun className="w-5 h-5 text-yellow-500 transition-transform duration-300 group-hover:rotate-180" />
                  ) : (
                    <Moon className="w-5 h-5 text-gray-600 dark:text-gray-300 transition-transform duration-300 group-hover:scale-110" />
                  )}
                </button>
                <button
                  onClick={() => navigate('/qr')}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                  title="Ver QR"
                >
                  <QrCode className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                </button>
                <button
                  onClick={handleLogout}
                  className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                  title="Cerrar sesión"
                >
                  <LogOut className="w-5 h-5 text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400" />
                </button>
              </div>
            </div>
          </div>

          {/* Segunda fila: Navegación de funcionalidades */}
          <div className="py-3">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2">
              {/* Botones principales - Administrador */}
              {usuario?.rol === 'administrador' && (
                <>
                  <button
                    onClick={() => setMostrarMetricasModal(true)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition whitespace-nowrap border border-transparent hover:border-primary-200 dark:hover:border-primary-800"
                    title="Métricas y Estadísticas"
                  >
                    <BarChart3 className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                    <span className="hidden sm:inline">Métricas</span>
                  </button>
                  <button
                    onClick={() => setMostrarCalendarioModal(true)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition whitespace-nowrap border border-transparent hover:border-primary-200 dark:hover:border-primary-800"
                    title="Calendario de Solicitudes"
                  >
                    <Calendar className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                    <span className="hidden sm:inline">Calendario</span>
                  </button>
                  <button
                    onClick={() => setMostrarLogsModal(true)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition whitespace-nowrap border border-transparent hover:border-primary-200 dark:hover:border-primary-800"
                    title="Logs de Actividad"
                  >
                    <FileText className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                    <span className="hidden sm:inline">Logs</span>
                  </button>
                </>
              )}
              
              {/* Chat - Botón destacado */}
              <button
                onClick={() => setMostrarChatModal(true)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg hover:from-primary-700 hover:to-primary-800 transition shadow-md hover:shadow-lg whitespace-nowrap transform hover:scale-105"
                title="Chat General"
              >
                <MessageSquare className="w-4 h-4" />
                <span className="hidden sm:inline">Chat</span>
              </button>
              
              {/* Botones secundarios */}
              <button
                onClick={() => setMostrarPlantillasModal(true)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition whitespace-nowrap border border-transparent hover:border-primary-200 dark:hover:border-primary-800"
                title="Plantillas de Solicitudes"
              >
                <FileText className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                <span className="hidden sm:inline">Plantillas</span>
              </button>
              
              {usuario?.rol === 'administrador' && (
                <>
                  <button
                    onClick={() => setMostrarRecordatoriosModal(true)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition whitespace-nowrap border border-transparent hover:border-primary-200 dark:hover:border-primary-800 relative"
                    title="Recordatorios"
                  >
                    <Bell className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                    <span className="hidden sm:inline">Recordatorios</span>
                  </button>
                  <button
                    onClick={() => setMostrarWidgetConfig(true)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition whitespace-nowrap border border-transparent hover:border-primary-200 dark:hover:border-primary-800"
                    title="Configurar Dashboard"
                  >
                    <Layout className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                    <span className="hidden sm:inline">Configurar</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 pb-28 pt-8 sm:px-6 md:pb-8 lg:px-8">
        {/* Estadísticas en Tiempo Real */}
        {usuario?.rol === 'administrador' && (
          <div className="mb-8">
            <EstadisticasTiempoReal />
          </div>
        )}


        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Solicitudes */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg dark:shadow-gray-900/50 overflow-hidden transition-all duration-300 hover:shadow-xl">
              <div className="bg-gradient-to-r from-primary-600 to-primary-700 dark:from-primary-700 dark:to-primary-800 p-4 sm:p-6 shadow-md">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <h2 className="text-2xl font-bold text-white">Solicitudes</h2>
                  <button
                    onClick={() => setMostrarModal(true)}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all duration-300 shadow-md hover:shadow-lg font-medium transform hover:scale-105"
                  >
                    <Plus className="w-5 h-5" />
                    Nueva
                  </button>
                </div>
              </div>
              
              {/* Pestañas */}
              <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                <div className="flex overflow-x-auto">
                  <button
                    onClick={() => setPestañaActiva('pendientes')}
                    className={`flex-1 px-6 py-4 text-sm font-medium transition whitespace-nowrap ${
                      pestañaActiva === 'pendientes'
                        ? 'bg-white dark:bg-gray-800 text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    Pendientes ({stats.pendientes})
                  </button>
                  <button
                    onClick={() => setPestañaActiva('en_proceso')}
                    className={`flex-1 px-6 py-4 text-sm font-medium transition whitespace-nowrap ${
                      pestañaActiva === 'en_proceso'
                        ? 'bg-white dark:bg-gray-800 text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    En Proceso ({stats.enProceso})
                  </button>
                  <button
                    onClick={() => setPestañaActiva('historicos')}
                    className={`flex-1 px-6 py-4 text-sm font-medium transition whitespace-nowrap ${
                      pestañaActiva === 'historicos'
                        ? 'bg-white dark:bg-gray-800 text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    Históricos ({stats.completadas})
                  </button>
                  <button
                    onClick={() => setMostrarCanceladasModal(true)}
                    className="flex-1 px-6 py-4 text-sm font-medium transition whitespace-nowrap text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Canceladas ({stats.canceladas})
                  </button>
                </div>
              </div>
              
              <div className="p-4 sm:p-6">
                {pestañaActiva !== 'historicos' && (
                      <FiltrosSolicitudes 
                        key={pestañaActiva} // Forzar recreación del componente al cambiar pestaña
                        solicitudes={solicitudes.filter(s => {
                          switch (pestañaActiva) {
                            case 'pendientes':
                              return s.estado === 'pendiente'
                            case 'en_proceso':
                              return s.estado === 'en_proceso'
                            default:
                              return true
                          }
                        })}
                        onFiltroChange={(filtradas) => {
                          // Solo actualizar si no estamos en históricos
                          if (pestañaActiva !== 'historicos') {
                            setSolicitudesFiltradas(filtradas)
                          }
                        }}
                      />
                    )}

                    {solicitudesFiltradas.length === 0 ? (
                      <div className="text-center py-16 px-4">
                        <div className="relative inline-block mb-6">
                          <div className="absolute inset-0 bg-primary-200 dark:bg-primary-900/30 rounded-full blur-2xl opacity-50 animate-pulse"></div>
                          <div className="relative bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/20 dark:to-primary-800/20 p-6 rounded-full">
                            <AlertCircle className="w-20 h-20 text-primary-500 dark:text-primary-400 mx-auto" />
                          </div>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No hay solicitudes</h3>
                        <div className="flex items-center justify-center gap-3">
                          {pestañaActiva === 'pendientes' && (
                            <button
                              onClick={() => setMostrarModal(true)}
                              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 dark:from-primary-500 dark:to-primary-600 text-white rounded-lg hover:from-primary-700 hover:to-primary-800 dark:hover:from-primary-600 dark:hover:to-primary-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 font-medium"
                            >
                              <Plus className="w-5 h-5" />
                              Crear Solicitud
                            </button>
                          )}
                        </div>
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

            {/* Personal - Solo para administradores */}
            {usuario?.rol === 'administrador' && (
                <PersonalList 
                  personal={personal} 
                  usuario={usuario}
                  onPersonalAgregado={handlePersonalAgregado}
                  servicios={servicios}
                />
            )}
          </div>

          {/* Servicios */}
          <div>
            <ServiciosList 
              servicios={servicios} 
              usuario={usuario}
              onUpdate={cargarDatos}
            />
          </div>
        </div>
      </div>

      {mostrarModal && (
        <SolicitudModal
          servicios={servicios}
          onClose={() => { setMostrarModal(false); setDatosPlantillaParaNueva(null) }}
          onSubmit={handleNuevaSolicitud}
          initialFormDataFromPlantilla={datosPlantillaParaNueva}
        />
      )}

      {/* Modales independientes */}
      {mostrarChatModal && (
        <ChatModal
          onClose={() => setMostrarChatModal(false)}
        />
      )}

      {mostrarMetricasModal && (
        <MetricasModal
          onClose={() => setMostrarMetricasModal(false)}
        />
      )}

      {mostrarCalendarioModal && (
        <CalendarioModal
          onClose={() => setMostrarCalendarioModal(false)}
        />
      )}

      {mostrarLogsModal && (
        <LogsModal
          onClose={() => setMostrarLogsModal(false)}
        />
      )}

      {mostrarPlantillasModal && (
        <PlantillasModal
          onClose={() => setMostrarPlantillasModal(false)}
          servicios={servicios}
          onSeleccionarPlantilla={(datos) => {
            setMostrarPlantillasModal(false)
            setDatosPlantillaParaNueva(datos)
            setMostrarModal(true)
          }}
        />
      )}

      {mostrarRecordatoriosModal && (
        <RecordatoriosModal
          onClose={() => setMostrarRecordatoriosModal(false)}
        />
      )}

      {mostrarCanceladasModal && (
        <CanceladasModal
          solicitudesCanceladas={solicitudes.filter(s => s.estado === 'cancelada')}
          onClose={() => setMostrarCanceladasModal(false)}
          usuario={usuario}
          servicios={servicios}
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

      {mostrarWidgetConfig && (
        <WidgetConfig
          widgets={widgetsConfig}
          onWidgetsChange={setWidgetsConfig}
          onClose={() => setMostrarWidgetConfig(false)}
        />
      )}

    </div>
    </EtiquetasProvider>
  )
}

export default Dashboard
