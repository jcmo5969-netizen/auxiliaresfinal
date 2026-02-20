import { useState } from 'react'
import { X, AlertTriangle } from 'lucide-react'
import api from '../utils/api'
import toast from 'react-hot-toast'

const CancelarSolicitudModal = ({ solicitud, onClose, onCancelada }) => {
  const [motivo, setMotivo] = useState('')
  const [enviando, setEnviando] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    const motivoTrim = motivo.trim()
    if (!motivoTrim) {
      toast.error('Indica el motivo de la cancelación')
      return
    }
    const id = solicitud?.id ?? solicitud?._id
    if (!id) return
    setEnviando(true)
    try {
      await api.put(`/api/solicitudes/${id}/estado`, {
        estado: 'cancelada',
        motivoCancelacion: motivoTrim
      })
      toast.success('Solicitud cancelada')
      if (onCancelada) await onCancelada()
      onClose()
    } catch (error) {
      toast.error(error.response?.data?.mensaje || 'Error al cancelar la solicitud')
    } finally {
      setEnviando(false)
    }
  }

  if (!solicitud) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Cancelar solicitud</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Esta solicitud quedará en estado &quot;Cancelada&quot;. Indica el motivo (obligatorio).
        </p>
        <form onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Motivo de cancelación <span className="text-red-500">*</span>
          </label>
          <textarea
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Ej: Paciente dado de alta, traslado suspendido..."
            rows={4}
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
            disabled={enviando}
          />
          <div className="flex gap-3 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              disabled={enviando}
            >
              Cerrar
            </button>
            <button
              type="submit"
              disabled={enviando || !motivo.trim()}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {enviando ? 'Cancelando…' : 'Confirmar cancelación'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CancelarSolicitudModal
