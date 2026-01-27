import { useState, useEffect } from 'react'
import api from '../utils/api'
import toast from 'react-hot-toast'
import { Calendar, X } from 'lucide-react'
import CalendarioSolicitudes from './CalendarioSolicitudes'

const CalendarioModal = ({ onClose }) => {
  const [solicitudes, setSolicitudes] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    cargarSolicitudes()
  }, [])

  const cargarSolicitudes = async () => {
    try {
      const res = await api.get('/api/solicitudes')
      setSolicitudes(res.data)
    } catch (error) {
      toast.error('Error cargando solicitudes')
      console.error(error)
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-6xl w-full my-8 shadow-xl relative">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-6 flex items-center justify-between sticky top-0 z-10 rounded-t-xl">
          <div className="flex items-center gap-3">
            <Calendar className="w-6 h-6 text-white" />
            <h2 className="text-2xl font-bold text-white">Calendario de Solicitudes</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-lg p-2 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-6 max-h-[calc(90vh-100px)] overflow-y-auto">
          {cargando ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div>
            </div>
          ) : (
            <div className="bg-transparent">
              <CalendarioSolicitudes solicitudes={solicitudes} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CalendarioModal

