import { useState, useEffect } from 'react'
import api from '../utils/api'
import toast from 'react-hot-toast'
import { X, FileText, Plus, Edit, Trash2, Copy } from 'lucide-react'

const PlantillasModal = ({ onClose, onSeleccionarPlantilla, servicios }) => {
  const [plantillas, setPlantillas] = useState([])
  const [mostrarForm, setMostrarForm] = useState(false)
  const [editandoId, setEditandoId] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    tipoRequerimiento: 'alta',
    prioridad: 'media',
    servicioId: ''
  })

  useEffect(() => {
    cargarPlantillas()
  }, [])

  const cargarPlantillas = async () => {
    try {
      const res = await api.get('/api/plantillas')
      setPlantillas(res.data)
    } catch (error) {
      toast.error('Error cargando plantillas')
    } finally {
      setCargando(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editandoId) {
        await api.put(`/api/plantillas/${editandoId}`, formData)
        toast.success('Plantilla actualizada')
      } else {
        await api.post('/api/plantillas', formData)
        toast.success('Plantilla creada')
      }
      setMostrarForm(false)
      setEditandoId(null)
      setFormData({
        nombre: '',
        descripcion: '',
        tipoRequerimiento: 'alta',
        prioridad: 'media',
        servicioId: ''
      })
      cargarPlantillas()
    } catch (error) {
      toast.error(error.response?.data?.mensaje || 'Error guardando plantilla')
    }
  }

  const handleEliminar = async (id) => {
    if (!confirm('¿Estás seguro de eliminar esta plantilla?')) return
    try {
      await api.delete(`/api/plantillas/${id}`)
      toast.success('Plantilla eliminada')
      cargarPlantillas()
    } catch (error) {
      toast.error('Error eliminando plantilla')
    }
  }

  const handleUsarPlantilla = (plantilla) => {
    if (onSeleccionarPlantilla) {
      onSeleccionarPlantilla({
        servicio: plantilla.servicioId || '',
        tipoRequerimiento: plantilla.tipoRequerimiento,
        prioridad: plantilla.prioridad,
        descripcion: plantilla.descripcion || ''
      })
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-xl">
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <FileText className="w-6 h-6 text-white" />
            <h2 className="text-xl sm:text-2xl font-bold text-white">Plantillas de Solicitudes</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-lg p-2 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          {mostrarForm ? (
            <form onSubmit={handleSubmit} className="space-y-4 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {editandoId ? 'Editar Plantilla' : 'Nueva Plantilla'}
              </h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nombre de la Plantilla
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none bg-gray-50 dark:bg-gray-700 dark:text-white"
                  placeholder="Ej: Alta de paciente urgente"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tipo de Requerimiento
                  </label>
                  <select
                    value={formData.tipoRequerimiento}
                    onChange={(e) => setFormData({ ...formData, tipoRequerimiento: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none bg-gray-50 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="alta">Alta</option>
                    <option value="traslado">Traslado</option>
                    <option value="pabellon">Pabellón</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Prioridad
                  </label>
                  <select
                    value={formData.prioridad}
                    onChange={(e) => setFormData({ ...formData, prioridad: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none bg-gray-50 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="baja">Baja</option>
                    <option value="media">Media</option>
                    <option value="alta">Alta</option>
                    <option value="urgente">Urgente</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Servicio (opcional)
                </label>
                <select
                  value={formData.servicioId}
                  onChange={(e) => setFormData({ ...formData, servicioId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none bg-gray-50 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Todos los servicios</option>
                  {servicios.map((servicio) => (
                    <option key={servicio.id} value={servicio.id}>
                      {servicio.nombre} - Piso {servicio.piso}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Descripción (opcional)
                </label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none bg-gray-50 dark:bg-gray-700 dark:text-white"
                  placeholder="Descripción de la plantilla..."
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
                >
                  {editandoId ? 'Actualizar' : 'Crear'} Plantilla
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMostrarForm(false)
                    setEditandoId(null)
                    setFormData({
                      nombre: '',
                      descripcion: '',
                      tipoRequerimiento: 'alta',
                      prioridad: 'media',
                      servicioId: ''
                    })
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition dark:text-gray-300 w-full sm:w-auto"
                >
                  Cancelar
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setMostrarForm(true)}
              className="mb-4 flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition w-full sm:w-auto"
            >
              <Plus className="w-5 h-5" />
              Nueva Plantilla
            </button>
          )}

          {cargando ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent mx-auto"></div>
            </div>
          ) : plantillas.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No hay plantillas creadas</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {plantillas.map((plantilla) => (
                <div
                  key={plantilla.id}
                  className="border-2 border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-primary-500 dark:hover:border-primary-600 transition"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 dark:text-white mb-1">
                        {plantilla.nombre}
                      </h3>
                      {plantilla.servicio && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {plantilla.servicio.nombre} - Piso {plantilla.servicio.piso}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditandoId(plantilla.id)
                          setFormData({
                            nombre: plantilla.nombre,
                            descripcion: plantilla.descripcion || '',
                            tipoRequerimiento: plantilla.tipoRequerimiento,
                            prioridad: plantilla.prioridad,
                            servicioId: plantilla.servicioId || ''
                          })
                          setMostrarForm(true)
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEliminar(plantilla.id)}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-2 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300 rounded text-xs font-medium">
                      {plantilla.tipoRequerimiento}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      plantilla.prioridad === 'urgente' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                      plantilla.prioridad === 'alta' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' :
                      plantilla.prioridad === 'media' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                      'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                      {plantilla.prioridad}
                    </span>
                  </div>

                  {plantilla.descripcion && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {plantilla.descripcion}
                    </p>
                  )}

                  <button
                    onClick={() => handleUsarPlantilla(plantilla)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
                  >
                    <Copy className="w-4 h-4" />
                    Usar Plantilla
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PlantillasModal



