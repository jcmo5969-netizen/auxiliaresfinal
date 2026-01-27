import { useState, useEffect } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { Clock, Plus, X, Trash2, Bell, AlertCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const RecordatoriosModal = ({ onClose }) => {
  const { usuario } = useAuth()
  const [recordatorios, setRecordatorios] = useState([])
  const [mostrarForm, setMostrarForm] = useState(false)
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    fechaRecordatorio: '',
    horaRecordatorio: '',
    solicitudId: null
  })

  useEffect(() => {
    cargarRecordatorios()
  }, [])

  const cargarRecordatorios = async () => {
    try {
      const res = await axios.get('/api/recordatorios', {
        params: { usuarioId: usuario.id }
      })
      setRecordatorios(res.data || [])
    } catch (error) {
      // Usar localStorage como fallback
      const recordatoriosLocales = JSON.parse(localStorage.getItem(`recordatorios_${usuario.id}`) || '[]')
      setRecordatorios(recordatoriosLocales)
    }
  }

  const guardarRecordatorio = async () => {
    try {
      const fechaHora = new Date(`${formData.fechaRecordatorio}T${formData.horaRecordatorio}`)
      
      if (fechaHora < new Date()) {
        toast.error('La fecha y hora deben ser futuras')
        return
      }

      const nuevoRecordatorio = {
        ...formData,
        fechaHora: fechaHora.toISOString(),
        usuarioId: usuario.id,
        completado: false
      }

      try {
        await axios.post('/api/recordatorios', nuevoRecordatorio)
        toast.success('Recordatorio creado')
      } catch (error) {
        // Guardar en localStorage como fallback
        const recordatoriosLocales = JSON.parse(localStorage.getItem(`recordatorios_${usuario.id}`) || '[]')
        recordatoriosLocales.push({ ...nuevoRecordatorio, id: Date.now() })
        localStorage.setItem(`recordatorios_${usuario.id}`, JSON.stringify(recordatoriosLocales))
        toast.success('Recordatorio creado (guardado localmente)')
      }

      setMostrarForm(false)
      setFormData({
        titulo: '',
        descripcion: '',
        fechaRecordatorio: '',
        horaRecordatorio: '',
        solicitudId: null
      })
      cargarRecordatorios()
    } catch (error) {
      toast.error('Error creando recordatorio')
    }
  }

  const eliminarRecordatorio = async (id) => {
    try {
      await axios.delete(`/api/recordatorios/${id}`)
      toast.success('Recordatorio eliminado')
    } catch (error) {
      // Eliminar de localStorage como fallback
      const recordatoriosLocales = JSON.parse(localStorage.getItem(`recordatorios_${usuario.id}`) || '[]')
      const filtrados = recordatoriosLocales.filter(r => r.id !== id)
      localStorage.setItem(`recordatorios_${usuario.id}`, JSON.stringify(filtrados))
      toast.success('Recordatorio eliminado')
    }
    cargarRecordatorios()
  }

  const recordatoriosPendientes = recordatorios.filter(r => !r.completado && new Date(r.fechaHora) > new Date())
  const recordatoriosVencidos = recordatorios.filter(r => !r.completado && new Date(r.fechaHora) <= new Date())

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-xl">
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell className="w-6 h-6 text-white" />
            <h2 className="text-2xl font-bold text-white">Recordatorios</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-lg p-2 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {mostrarForm ? (
            <div className="space-y-4 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Nuevo Recordatorio</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Título
                </label>
                <input
                  type="text"
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Ej: Revisar solicitudes pendientes"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Descripción
                </label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  rows="3"
                  placeholder="Descripción del recordatorio..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Fecha
                  </label>
                  <input
                    type="date"
                    value={formData.fechaRecordatorio}
                    onChange={(e) => setFormData({ ...formData, fechaRecordatorio: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Hora
                  </label>
                  <input
                    type="time"
                    value={formData.horaRecordatorio}
                    onChange={(e) => setFormData({ ...formData, horaRecordatorio: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={guardarRecordatorio}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
                >
                  Guardar
                </button>
                <button
                  onClick={() => {
                    setMostrarForm(false)
                    setFormData({
                      titulo: '',
                      descripcion: '',
                      fechaRecordatorio: '',
                      horaRecordatorio: '',
                      solicitudId: null
                    })
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setMostrarForm(true)}
              className="mb-4 flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
            >
              <Plus className="w-5 h-5" />
              Nuevo Recordatorio
            </button>
          )}

          {/* Recordatorios vencidos */}
          {recordatoriosVencidos.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-red-600 dark:text-red-400 mb-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Vencidos ({recordatoriosVencidos.length})
              </h3>
              <div className="space-y-2">
                {recordatoriosVencidos.map((r) => (
                  <div
                    key={r.id}
                    className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-red-900 dark:text-red-200">{r.titulo}</h4>
                        {r.descripcion && (
                          <p className="text-sm text-red-700 dark:text-red-300 mt-1">{r.descripcion}</p>
                        )}
                        <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                          {new Date(r.fechaHora).toLocaleString('es-ES')}
                        </p>
                      </div>
                      <button
                        onClick={() => eliminarRecordatorio(r.id)}
                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recordatorios pendientes */}
          {recordatoriosPendientes.length > 0 ? (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                Pendientes ({recordatoriosPendientes.length})
              </h3>
              <div className="space-y-2">
                {recordatoriosPendientes.map((r) => (
                  <div
                    key={r.id}
                    className="p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 dark:text-white">{r.titulo}</h4>
                        {r.descripcion && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{r.descripcion}</p>
                        )}
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(r.fechaHora).toLocaleString('es-ES')}
                        </p>
                      </div>
                      <button
                        onClick={() => eliminarRecordatorio(r.id)}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Bell className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No hay recordatorios pendientes</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default RecordatoriosModal

