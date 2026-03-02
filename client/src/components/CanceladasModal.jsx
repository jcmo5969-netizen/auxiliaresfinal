import { X, Ban } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import SolicitudCard from './SolicitudCard'

/**
 * Modal que muestra la lista de solicitudes canceladas.
 * - Admin: recibe todas las canceladas (de todos los servicios).
 * - Enfermería: el padre debe pasar solo las canceladas de su servicio (el API ya filtra por servicioId).
 */
const CanceladasModal = ({ solicitudesCanceladas = [], onClose, usuario, servicios = [], onUpdate }) => {
  const { isDark } = useTheme()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div
        className={`rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col ${
          isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <Ban className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Solicitudes canceladas
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {solicitudesCanceladas.length} {solicitudesCanceladas.length === 1 ? 'solicitud' : 'solicitudes'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="overflow-y-auto p-4 flex-1">
          {solicitudesCanceladas.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <Ban className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="font-medium">No hay solicitudes canceladas</p>
            </div>
          ) : (
            <div className="space-y-4">
              {solicitudesCanceladas.map((solicitud) => (
                <SolicitudCard
                  key={solicitud.id || solicitud._id}
                  solicitud={solicitud}
                  usuario={usuario}
                  onUpdate={onUpdate}
                  servicios={servicios}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CanceladasModal
