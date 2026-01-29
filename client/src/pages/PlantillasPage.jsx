import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'
import toast from 'react-hot-toast'
import { ArrowLeft, FileText, Plus, Edit, Trash2, Copy } from 'lucide-react'

const PlantillasPage = () => {
  const navigate = useNavigate()
  const { usuario } = useAuth()
  const [plantillas, setPlantillas] = useState([])
  const [servicios, setServicios] = useState([])
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
    if (!usuario || usuario.rol !== 'administrador') {
      navigate('/dashboard', { replace: true })
      return
    }
    cargarDatos()
  }, [usuario, navigate])

  const cargarDatos = async () => {
    try {
      const [plantillasRes, serviciosRes] = await Promise.all([
        api.get('/api/plantillas'),
        api.get('/api/servicios')
      ])
      setPlantillas(plantillasRes.data)
      setServicios(serviciosRes.data)
    } catch (error) {
      toast.error('Error cargando datos')
      console.error(error)
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
      cargarDatos()
    } catch (error) {
      toast.error('Error guardando plantilla')
      console.error(error)
    }
  }

  const handleEditar = (plantilla) => {
    setFormData({
      nombre: plantilla.nombre,
      descripcion: plantilla.descripcion,
      tipoRequerimiento: plantilla.tipoRequerimiento,
      prioridad: plantilla.prioridad,
      servicioId: plantilla.servicioId || ''
    })
    setEditandoId(plantilla.id)
    setMostrarForm(true)
  }

  const handleEliminar = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar esta plantilla?')) return
    try {
      await api.delete(`/api/plantillas/${id}`)
      toast.success('Plantilla eliminada')
      cargarDatos()
    } catch (error) {
      toast.error('Error eliminando plantilla')
      console.error(error)
    }
  }

  const handleCopiar = (plantilla) => {
    setFormData({
      nombre: `${plantilla.nombre} (Copia)`,
      descripcion: plantilla.descripcion,
      tipoRequerimiento: plantilla.tipoRequerimiento,
      prioridad: plantilla.prioridad,
      servicioId: plantilla.servicioId || ''
    })
    setEditandoId(null)
    setMostrarForm(true)
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Plantillas de Solicitudes</h1>
            </div>
            <button
              onClick={() => {
                setMostrarForm(true)
                setEditandoId(null)
                setFormData({
                  nombre: '',
                  descripcion: '',
                  tipoRequerimiento: 'alta',
                  prioridad: 'media',
                  servicioId: ''
                })
              }}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition w-full sm:w-auto"
            >
              <Plus className="w-5 h-5" />
              Nueva Plantilla
            </button>
          </div>
        </div>
      </header>

      {/* Contenido */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Formulario */}
        {mostrarForm && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              {editandoId ? 'Editar Plantilla' : 'Nueva Plantilla'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nombre
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Descripción
                </label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  rows="3"
                  required
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tipo
                  </label>
                  <select
                    value={formData.tipoRequerimiento}
                    onChange={(e) => setFormData({ ...formData, tipoRequerimiento: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="alta">Alta</option>
                    <option value="traslado">Traslado</option>
                    <option value="pabellon">Pabellón</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Prioridad
                  </label>
                  <select
                    value={formData.prioridad}
                    onChange={(e) => setFormData({ ...formData, prioridad: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="baja">Baja</option>
                    <option value="media">Media</option>
                    <option value="alta">Alta</option>
                    <option value="urgente">Urgente</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Servicio (Opcional)
                </label>
                <select
                  value={formData.servicioId}
                  onChange={(e) => setFormData({ ...formData, servicioId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Todos los servicios</option>
                  {servicios.map((servicio) => (
                    <option key={servicio.id} value={servicio.id}>
                      {servicio.nombre} - Piso {servicio.piso}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition w-full sm:w-auto"
                >
                  {editandoId ? 'Actualizar' : 'Crear'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMostrarForm(false)
                    setEditandoId(null)
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition w-full sm:w-auto"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Lista de Plantillas */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          <div className="p-4 sm:p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Plantillas Disponibles ({plantillas.length})
            </h2>
            {plantillas.length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>No hay plantillas disponibles. Crea una nueva plantilla.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {plantillas.map((plantilla) => (
                  <div
                    key={plantilla.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white">{plantilla.nombre}</h3>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleEditar(plantilla)}
                          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        </button>
                        <button
                          onClick={() => handleCopiar(plantilla)}
                          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                          title="Copiar"
                        >
                          <Copy className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        </button>
                        <button
                          onClick={() => handleEliminar(plantilla.id)}
                          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{plantilla.descripcion}</p>
                    <div className="flex gap-2 text-xs">
                      <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded">
                        {plantilla.tipoRequerimiento}
                      </span>
                      <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 rounded">
                        {plantilla.prioridad}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default PlantillasPage


