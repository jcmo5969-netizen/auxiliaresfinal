import { useEffect, useState } from 'react'
import { X, Bed } from 'lucide-react'

const CamaModal = ({ camaActual, onClose, onGuardar }) => {
  const [cama, setCama] = useState(camaActual || '')

  useEffect(() => {
    setCama(camaActual || '')
  }, [camaActual])

  const handleGuardar = () => {
    if (onGuardar) {
      onGuardar(cama.trim())
    }
    onClose()
  }

  const handleLimpiar = () => {
    if (onGuardar) {
      onGuardar('')
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-4 sm:p-6 relative shadow-xl max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          aria-label="Cerrar"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="flex items-center gap-2 mb-6">
          <Bed className="w-6 h-6 text-primary-600" />
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Cama</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Número o identificación de cama
            </label>
            <input
              type="text"
              value={cama}
              onChange={(e) => setCama(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Ej: 12A"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Opcional. Puedes dejarlo vacío si no aplica.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="button"
              onClick={handleLimpiar}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              Limpiar
            </button>
            <button
              type="button"
              onClick={handleGuardar}
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
            >
              Guardar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CamaModal
