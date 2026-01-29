import { Building2, Plus, Edit, Trash2, Check, X } from 'lucide-react'
import { useState } from 'react'
import api from '../utils/api'
import toast from 'react-hot-toast'

const ServiciosList = ({ servicios, usuario, onUpdate }) => {
  const [mostrarForm, setMostrarForm] = useState(false)
  const [editandoId, setEditandoId] = useState(null)
  const [formData, setFormData] = useState({
    nombre: '',
    piso: '',
    descripcion: ''
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (usuario?.rol !== 'administrador') {
      toast.error('Solo los administradores pueden crear servicios')
      return
    }

    try {
      if (editandoId) {
        await api.put(`/api/servicios/${editandoId}`, formData)
        toast.success('Servicio actualizado exitosamente')
      } else {
        await api.post('/api/servicios', formData)
        toast.success('Servicio creado exitosamente')
      }
      setFormData({ nombre: '', piso: '', descripcion: '' })
      setMostrarForm(false)
      setEditandoId(null)
      if (onUpdate) onUpdate()
      else window.location.reload()
    } catch (error) {
      toast.error(error.response?.data?.mensaje || 'Error guardando servicio')
    }
  }

  const handleEditar = (servicio) => {
    setEditandoId(servicio.id || servicio._id)
    setFormData({
      nombre: servicio.nombre,
      piso: servicio.piso,
      descripcion: servicio.descripcion || ''
    })
    setMostrarForm(true)
  }

  const handleEliminar = async (id) => {
    if (!confirm('¿Estás seguro de desactivar este servicio?')) return
    
    try {
      await api.delete(`/api/servicios/${id}`)
      toast.success('Servicio desactivado')
      if (onUpdate) onUpdate()
      else window.location.reload()
    } catch (error) {
      toast.error('Error desactivando servicio')
    }
  }

  const cancelarEdicion = () => {
    setEditandoId(null)
    setFormData({ nombre: '', piso: '', descripcion: '' })
    setMostrarForm(false)
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden transition-colors duration-300">
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 dark:from-primary-700 dark:to-primary-800 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="text-xl font-bold text-white">Servicios</h2>
          {usuario?.rol === 'administrador' && (
            <button
              onClick={() => {
                if (mostrarForm) cancelarEdicion()
                else setMostrarForm(true)
              }}
              className="p-2 bg-white text-primary-600 rounded-lg hover:bg-primary-50 transition w-full sm:w-auto"
            >
              {mostrarForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            </button>
          )}
        </div>
      </div>
      
      <div className="p-4 sm:p-6">
        {mostrarForm && usuario?.rol === 'administrador' && (
          <form onSubmit={handleSubmit} className="mb-6 p-4 bg-gradient-to-br from-primary-50 to-blue-50 dark:from-gray-700 dark:to-gray-800 rounded-lg space-y-3 border border-primary-200 dark:border-gray-600">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
              {editandoId ? 'Editar Servicio' : 'Nuevo Servicio'}
            </h3>
            <input
              type="text"
              placeholder="Nombre del servicio"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
            />
            <input
              type="text"
              placeholder="Piso"
              value={formData.piso}
              onChange={(e) => setFormData({ ...formData, piso: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
            />
            <textarea
              placeholder="Descripción (opcional)"
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              rows="2"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
            />
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="submit"
                className="flex-1 px-3 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700 transition font-medium flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                {editandoId ? 'Actualizar' : 'Crear'}
              </button>
              <button
                type="button"
                onClick={cancelarEdicion}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition text-gray-700 dark:text-gray-300 w-full sm:w-auto"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}

        {servicios.length === 0 ? (
          <div className="text-center py-8">
            <Building2 className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">No hay servicios</p>
          </div>
        ) : (
          <div className="space-y-3">
            {servicios.map((servicio) => (
              <div
                key={servicio.id || servicio._id}
                className="group flex flex-col sm:flex-row sm:items-start gap-3 p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-600 hover:shadow-md transition-all duration-200 bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-700"
              >
                <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                  <Building2 className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 dark:text-white truncate">{servicio.nombre}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1 mt-1">
                    <span className="font-medium">Piso {servicio.piso}</span>
                  </p>
                  {servicio.descripcion && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 line-clamp-2">{servicio.descripcion}</p>
                  )}
                </div>
                {usuario?.rol === 'administrador' && (
                  <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleEditar(servicio)}
                      className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition"
                      title="Editar"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleEliminar(servicio.id || servicio._id)}
                      className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                      title="Desactivar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ServiciosList
