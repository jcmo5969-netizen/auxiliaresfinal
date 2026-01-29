import { useState, useEffect } from 'react'
import { io } from 'socket.io-client'
import { Activity, TrendingUp, Clock, Users } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

const EstadisticasTiempoReal = () => {
  const { isDark } = useTheme()
  const [socket, setSocket] = useState(null)
  const [estadisticas, setEstadisticas] = useState({
    solicitudesTotales: 0,
    pendientes: 0,
    enProceso: 0,
    completadasHoy: 0,
    tiempoPromedio: 0,
    auxiliaresActivos: 0,
    tasaCompletacion: 0
  })
  const [actualizacion, setActualizacion] = useState(new Date())

  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000'
    const newSocket = io(apiUrl, {
      transports: ['websocket', 'polling']
    })

    newSocket.on('connect', () => {
      console.log('Conectado a estadísticas en tiempo real')
      newSocket.emit('suscribir-estadisticas')
    })

    newSocket.on('estadisticas-actualizadas', (data) => {
      setEstadisticas(data)
      setActualizacion(new Date())
    })

    setSocket(newSocket)

    return () => {
      newSocket.disconnect()
    }
  }, [])

  const formatearTiempo = (minutos) => {
    if (minutos < 60) return `${Math.round(minutos)} min`
    const horas = Math.floor(minutos / 60)
    const mins = Math.round(minutos % 60)
    return `${horas}h ${mins}min`
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6 border-2 border-primary-200 dark:border-primary-800">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Activity className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Estadísticas en Tiempo Real</h3>
        </div>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Actualizado: {actualizacion.toLocaleTimeString('es-ES')}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Solicitudes Totales */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-4 text-white">
          <div className="flex items-center justify-between mb-2">
            <span className="text-blue-100 text-xs font-medium">Total</span>
            <Activity className="w-4 h-4 text-blue-100" />
          </div>
          <p className="text-2xl font-bold">{estadisticas.solicitudesTotales}</p>
          <p className="text-blue-100 text-xs mt-1">Solicitudes</p>
        </div>

        {/* Pendientes */}
        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg p-4 text-white">
          <div className="flex items-center justify-between mb-2">
            <span className="text-yellow-100 text-xs font-medium">Pendientes</span>
            <Clock className="w-4 h-4 text-yellow-100" />
          </div>
          <p className="text-2xl font-bold">{estadisticas.pendientes}</p>
          <p className="text-yellow-100 text-xs mt-1">Esperando</p>
        </div>

        {/* En Proceso */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-4 text-white">
          <div className="flex items-center justify-between mb-2">
            <span className="text-purple-100 text-xs font-medium">En Proceso</span>
            <TrendingUp className="w-4 h-4 text-purple-100" />
          </div>
          <p className="text-2xl font-bold">{estadisticas.enProceso}</p>
          <p className="text-purple-100 text-xs mt-1">Activas</p>
        </div>

        {/* Completadas Hoy */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-4 text-white">
          <div className="flex items-center justify-between mb-2">
            <span className="text-green-100 text-xs font-medium">Completadas</span>
            <Users className="w-4 h-4 text-green-100" />
          </div>
          <p className="text-2xl font-bold">{estadisticas.completadasHoy}</p>
          <p className="text-green-100 text-xs mt-1">Hoy</p>
        </div>
      </div>

      {/* KPIs Adicionales */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Tiempo Promedio</span>
            <Clock className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          </div>
          <p className="text-xl font-bold text-gray-900 dark:text-white">
            {formatearTiempo(estadisticas.tiempoPromedio)}
          </p>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Auxiliares Activos</span>
            <Users className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          </div>
          <p className="text-xl font-bold text-gray-900 dark:text-white">
            {estadisticas.auxiliaresActivos}
          </p>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Tasa de Completación</span>
            <TrendingUp className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          </div>
          <p className="text-xl font-bold text-gray-900 dark:text-white">
            {estadisticas.tasaCompletacion.toFixed(1)}%
          </p>
        </div>
      </div>
    </div>
  )
}

export default EstadisticasTiempoReal

