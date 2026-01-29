import { useState, useEffect } from 'react'
import api from '../utils/api'
import toast from 'react-hot-toast'
import { FileText, Search, Filter, Calendar } from 'lucide-react'

const LogsViewer = () => {
  const [logs, setLogs] = useState([])
  const [cargando, setCargando] = useState(true)
  const [filtros, setFiltros] = useState({
    fechaInicio: '',
    fechaFin: '',
    accion: '',
    entidad: ''
  })
  const [mostrarFiltros, setMostrarFiltros] = useState(false)

  useEffect(() => {
    cargarLogs()
  }, [filtros])

  const cargarLogs = async () => {
    try {
      const params = {}
      if (filtros.fechaInicio) params.fechaInicio = filtros.fechaInicio
      if (filtros.fechaFin) params.fechaFin = filtros.fechaFin
      if (filtros.accion) params.accion = filtros.accion
      if (filtros.entidad) params.entidad = filtros.entidad

      const res = await api.get('/api/logs', { params })
      setLogs(res.data.logs || res.data)
    } catch (error) {
      toast.error('Error cargando logs')
    } finally {
      setCargando(false)
    }
  }

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getAccionColor = (accion) => {
    if (accion.includes('crear')) return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
    if (accion.includes('actualizar') || accion.includes('update')) return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
    if (accion.includes('eliminar') || accion.includes('delete')) return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
    return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div className="flex items-center gap-2">
          <FileText className="w-6 h-6 text-primary-600 dark:text-primary-400" />
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Logs de Actividad</h2>
        </div>
        <button
          onClick={() => setMostrarFiltros(!mostrarFiltros)}
          className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition w-full sm:w-auto"
        >
          <Filter className="w-5 h-5" />
          Filtros
        </button>
      </div>

      {mostrarFiltros && (
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Fecha Inicio
            </label>
            <input
              type="date"
              value={filtros.fechaInicio}
              onChange={(e) => setFiltros({ ...filtros, fechaInicio: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Fecha Fin
            </label>
            <input
              type="date"
              value={filtros.fechaFin}
              onChange={(e) => setFiltros({ ...filtros, fechaFin: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Acción
            </label>
            <input
              type="text"
              value={filtros.accion}
              onChange={(e) => setFiltros({ ...filtros, accion: e.target.value })}
              placeholder="crear, actualizar..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Entidad
            </label>
            <select
              value={filtros.entidad}
              onChange={(e) => setFiltros({ ...filtros, entidad: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">Todas</option>
              <option value="solicitud">Solicitud</option>
              <option value="usuario">Usuario</option>
              <option value="servicio">Servicio</option>
            </select>
          </div>
        </div>
      )}

      {cargando ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent mx-auto"></div>
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-8">
          <FileText className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No hay logs disponibles</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[600px] overflow-y-auto">
          {logs.map((log) => (
            <div
              key={log.id}
              className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getAccionColor(log.accion)}`}>
                      {log.accion}
                    </span>
                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs font-medium">
                      {log.entidad}
                    </span>
                  </div>
                  {log.usuario && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Usuario: <span className="font-medium">{log.usuario.nombre}</span>
                    </p>
                  )}
                  {log.detalles && Object.keys(log.detalles).length > 0 && (
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      {JSON.stringify(log.detalles, null, 2)}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatearFecha(log.createdAt)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default LogsViewer



