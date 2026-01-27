import { useState, useEffect } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { Tag, Plus, Edit, Trash2, X } from 'lucide-react'

const EtiquetasManager = ({ solicitudId, etiquetasActuales = [], onEtiquetasChange }) => {
  const [etiquetas, setEtiquetas] = useState([])
  const [mostrarForm, setMostrarForm] = useState(false)
  const [formData, setFormData] = useState({ nombre: '', color: '#3B82F6' })
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    cargarEtiquetas()
  }, [])

  const cargarEtiquetas = async () => {
    try {
      const res = await axios.get('/api/etiquetas')
      setEtiquetas(res.data)
    } catch (error) {
      toast.error('Error cargando etiquetas')
    } finally {
      setCargando(false)
    }
  }

  const handleCrearEtiqueta = async (e) => {
    e.preventDefault()
    try {
      await axios.post('/api/etiquetas', formData)
      toast.success('Etiqueta creada')
      setFormData({ nombre: '', color: '#3B82F6' })
      setMostrarForm(false)
      cargarEtiquetas()
    } catch (error) {
      toast.error(error.response?.data?.mensaje || 'Error creando etiqueta')
    }
  }

  const handleAgregarEtiqueta = async (etiquetaId) => {
    try {
      await axios.post(`/api/etiquetas/${etiquetaId}/solicitud/${solicitudId}`)
      toast.success('Etiqueta agregada')
      if (onEtiquetasChange) {
        onEtiquetasChange()
      }
    } catch (error) {
      toast.error('Error agregando etiqueta')
    }
  }

  const handleRemoverEtiqueta = async (etiquetaId) => {
    try {
      await axios.delete(`/api/etiquetas/${etiquetaId}/solicitud/${solicitudId}`)
      toast.success('Etiqueta removida')
      if (onEtiquetasChange) {
        onEtiquetasChange()
      }
    } catch (error) {
      toast.error('Error removiendo etiqueta')
    }
  }

  const idsEtiquetasActuales = etiquetasActuales.map(e => e.id || e._id)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Etiquetas</h3>
        {!mostrarForm && (
          <button
            onClick={() => setMostrarForm(true)}
            className="flex items-center gap-1 px-2 py-1 text-xs bg-primary-600 text-white rounded hover:bg-primary-700 transition"
          >
            <Plus className="w-3 h-3" />
            Nueva
          </button>
        )}
      </div>

      {mostrarForm && (
        <form onSubmit={handleCrearEtiqueta} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-2">
          <input
            type="text"
            value={formData.nombre}
            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
            placeholder="Nombre de la etiqueta"
            required
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none bg-white dark:bg-gray-800 dark:text-white"
          />
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              className="w-10 h-10 rounded border border-gray-300 dark:border-gray-600"
            />
            <button
              type="submit"
              className="flex-1 px-3 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
            >
              Crear
            </button>
            <button
              type="button"
              onClick={() => {
                setMostrarForm(false)
                setFormData({ nombre: '', color: '#3B82F6' })
              }}
              className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition dark:text-gray-300"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}

      {/* Etiquetas actuales */}
      {etiquetasActuales.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {etiquetasActuales.map((etiqueta) => (
            <span
              key={etiqueta.id || etiqueta._id}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium text-white"
              style={{ backgroundColor: etiqueta.color }}
            >
              {etiqueta.nombre}
              {solicitudId && (
                <button
                  onClick={() => handleRemoverEtiqueta(etiqueta.id || etiqueta._id)}
                  className="hover:bg-white/20 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </span>
          ))}
        </div>
      )}

      {/* Lista de etiquetas disponibles */}
      {solicitudId && etiquetas.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs text-gray-500 dark:text-gray-400">Agregar etiqueta:</p>
          <div className="flex flex-wrap gap-2">
            {etiquetas
              .filter(e => !idsEtiquetasActuales.includes(e.id))
              .map((etiqueta) => (
                <button
                  key={etiqueta.id}
                  onClick={() => handleAgregarEtiqueta(etiqueta.id)}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border-2 border-gray-300 dark:border-gray-600 hover:border-primary-500 dark:hover:border-primary-400 transition"
                  style={{ color: etiqueta.color, borderColor: etiqueta.color }}
                >
                  <Tag className="w-3 h-3" />
                  {etiqueta.nombre}
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default EtiquetasManager



