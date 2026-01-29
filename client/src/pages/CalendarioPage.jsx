import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'
import toast from 'react-hot-toast'
import { ArrowLeft } from 'lucide-react'
import CalendarioSolicitudes from '../components/CalendarioSolicitudes'

const CalendarioPage = () => {
  const navigate = useNavigate()
  const { usuario } = useAuth()
  const [solicitudes, setSolicitudes] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    if (!usuario || usuario.rol !== 'administrador') {
      navigate('/dashboard', { replace: true })
      return
    }
    cargarSolicitudes()
  }, [usuario, navigate])

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

  if (cargando) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Calendario de Solicitudes</h1>
          </div>
        </div>
      </header>

      {/* Contenido */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <CalendarioSolicitudes solicitudes={solicitudes} />
      </main>
    </div>
  )
}

export default CalendarioPage


