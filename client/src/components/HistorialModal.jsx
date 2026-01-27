import { useState, useEffect } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { X, History, User, Clock, ArrowRight } from 'lucide-react'

const HistorialModal = ({ solicitudId, onClose }) => {
  const [historial, setHistorial] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    cargarHistorial()
  }, [solicitudId])

  const cargarHistorial = async () => {
    try {
      const res = await axios.get(`/api/historial/solicitud/${solicitudId}`)
      setHistorial(res.data)
    } catch (error) {
      toast.error('Error cargando historial')
      console.error(error)
    } finally {
      setCargando(false)
    }
  }

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getAccionIcon = (accion) => {
    switch (accion) {
      case 'crear':
        return '➕'
      case 'asignar':
        return '👤'
      case 'cambiar_estado':
        return '🔄'
      case 'actualizar':
        return '✏️'
      default:
        return '📝'
    }
  }

  const getAccionColor = (accion) => {
    switch (accion) {
      case 'crear':
        return 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300'
      case 'asignar':
        return 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300'
      case 'cambiar_estado':
        return 'bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300'
      case 'actualizar':
        return 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300'
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b dark:border-gray-700">
          <div className="flex items-center gap-2">
            <History className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Historial de Cambios</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Lista de historial */}
        <div className="flex-1 overflow-y-auto p-6">
          {cargando ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-600 border-t-transparent mx-auto"></div>
            </div>
          ) : historial.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <History className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No hay historial de cambios</p>
            </div>
          ) : (
            <div className="space-y-4">
              {historial.map((cambio, index) => (
                <div
                  key={cambio.id}
                  className="flex gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                >
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${getAccionColor(cambio.accion)}`}>
                      {getAccionIcon(cambio.accion)}
                    </div>
                    {index < historial.length - 1 && (
                      <div className="w-0.5 h-full bg-gray-300 dark:bg-gray-600 mt-2"></div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getAccionColor(cambio.accion)}`}>
                        {cambio.accion.replace('_', ' ').toUpperCase()}
                      </span>
                      {cambio.usuario && (
                        <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                          <User className="w-4 h-4" />
                          <span>{cambio.usuario.nombre}</span>
                        </div>
                      )}
                    </div>
                    {cambio.descripcion && (
                      <p className="text-gray-700 dark:text-gray-300 mb-2">{cambio.descripcion}</p>
                    )}
                    {cambio.campo && cambio.valorAnterior && cambio.valorNuevo && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-600 dark:text-gray-400">{cambio.campo}:</span>
                        <span className="px-2 py-1 bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300 rounded">
                          {cambio.valorAnterior}
                        </span>
                        <ArrowRight className="w-4 h-4 text-gray-400" />
                        <span className="px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 rounded">
                          {cambio.valorNuevo}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mt-2">
                      <Clock className="w-3 h-3" />
                      <span>{formatearFecha(cambio.createdAt)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default HistorialModal



