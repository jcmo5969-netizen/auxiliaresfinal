import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import toast from 'react-hot-toast'
import { 
  LogOut, Plus, Calendar, AlertCircle, CheckCircle, Clock,
  Building2, User, MapPin, MessageSquare, History, Moon, Sun
} from 'lucide-react'
import SolicitudModal from '../components/SolicitudModal'
import SolicitudCard from '../components/SolicitudCard'
import FiltrosSolicitudes from '../components/FiltrosSolicitudes'

const EnfermeriaDashboard = () => {
  const { usuario, logout } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [solicitudes, setSolicitudes] = useState([])
  const [solicitudesFiltradas, setSolicitudesFiltradas] = useState([])
  const [servicios, setServicios] = useState([])
  const [mostrarModal, setMostrarModal] = useState(false)
  const [cargando, setCargando] = useState(true)
  const [pestañaActiva, setPestañaActiva] = useState('todas') // todas, pendientes, en_proceso, completadas

  useEffect(() => {
    if (!usuario || usuario.rol !== 'enfermeria') {
      navigate('/login')
      return
    }
    
    cargarDatos()
    
    // Actualización automática cada 5 segundos
    const intervalo = setInterval(() => {
      if (!document.hidden) {
        cargarDatos()
      }
    }, 5000)
    
    return () => clearInterval(intervalo)
  }, [usuario, navigate])

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

  const cargarDatos = async () => {
    try {
      const [resSolicitudes, resServicios] = await Promise.all([
        axios.get('/api/solicitudes'),
        axios.get('/api/servicios')
      ])
      
      setSolicitudes(resSolicitudes.data || [])
      setServicios(resServicios.data || [])
    } catch (error) {
      console.error('Error cargando datos:', error)
      toast.error('Error cargando datos')
    } finally {
      setCargando(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
    toast.success('Sesión cerrada')
  }

  const handleNuevaSolicitud = async (datos) => {
    try {
      // Asegurar que la solicitud sea del servicio del usuario
      const datosConServicio = {
        ...datos,
        servicioId: usuario.servicioId || datos.servicioId
      }
      await axios.post('/api/solicitudes', datosConServicio)
      toast.success('Solicitud creada exitosamente')
      setMostrarModal(false)
      await cargarDatos()
    } catch (error) {
      toast.error(error.response?.data?.mensaje || 'Error creando solicitud')
    }
  }

  const handleActualizarSolicitud = () => {
    cargarDatos()
  }

  const stats = {
    total: solicitudes.length,
    pendientes: solicitudes.filter(s => s.estado === 'pendiente').length,
    enProceso: solicitudes.filter(s => s.estado === 'en_proceso').length,
    completadas: solicitudes.filter(s => s.estado === 'completada').length
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
                Personal de Enfermería
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Bienvenido, <span className="font-semibold text-gray-900 dark:text-white">{usuario?.nombre}</span>
                {usuario?.servicio && (
                  <span className="ml-2 px-2 py-0.5 bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 rounded-full text-xs font-medium">
                    {usuario.servicio.nombre} - Piso {usuario.servicio.piso}
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-3">
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
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg hover:from-primary-700 hover:to-primary-800 transition shadow-md hover:shadow-lg"
              >
                <Plus className="w-5 h-5" />
                Nueva Solicitud
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
              >
                <LogOut className="w-5 h-5" />
                Salir
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Total</p>
                <p className="text-3xl font-bold mt-1">{stats.total}</p>
              </div>
              <Calendar className="w-10 h-10 text-blue-200" />
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100 text-sm font-medium">Pendientes</p>
                <p className="text-3xl font-bold mt-1">{stats.pendientes}</p>
              </div>
              <Clock className="w-10 h-10 text-yellow-200" />
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">En Proceso</p>
                <p className="text-3xl font-bold mt-1">{stats.enProceso}</p>
              </div>
              <AlertCircle className="w-10 h-10 text-purple-200" />
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Completadas</p>
                <p className="text-3xl font-bold mt-1">{stats.completadas}</p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-200" />
            </div>
          </div>
        </div>

        {/* Contenedor principal */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          {/* Pestañas */}
          <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
            <div className="flex overflow-x-auto">
              <button
                onClick={() => setPestañaActiva('todas')}
                className={`flex-1 px-6 py-4 text-sm font-medium transition whitespace-nowrap ${
                  pestañaActiva === 'todas'
                    ? 'bg-white dark:bg-gray-800 text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                Todas ({stats.total})
              </button>
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
                onClick={() => setPestañaActiva('completadas')}
                className={`flex-1 px-6 py-4 text-sm font-medium transition whitespace-nowrap ${
                  pestañaActiva === 'completadas'
                    ? 'bg-white dark:bg-gray-800 text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                Completadas ({stats.completadas})
              </button>
            </div>
          </div>
          
          <div className="p-6">
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
    </div>
  )
}

export default EnfermeriaDashboard

