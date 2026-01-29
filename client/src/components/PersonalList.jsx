import { User, Plus, Mail, Shield, UserCheck, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react'
import { useState } from 'react'
import api from '../utils/api'
import toast from 'react-hot-toast'
import AgregarPersonalModal from './AgregarPersonalModal'
import EditarPersonalModal from './EditarPersonalModal'

const PersonalList = ({ personal, usuario, onPersonalAgregado, servicios = [] }) => {
  const [mostrarForm, setMostrarForm] = useState(false)
  const [mostrarEditar, setMostrarEditar] = useState(false)
  const [personaEditando, setPersonaEditando] = useState(null)

  const handleAgregarPersonal = async (datos) => {
    try {
      const res = await api.post('/api/auth/registro', datos)
      toast.success(res.data.mensaje || 'Personal agregado exitosamente')
      setMostrarForm(false)
      if (onPersonalAgregado) {
        onPersonalAgregado()
      }
    } catch (error) {
      toast.error(error.response?.data?.mensaje || error.response?.data?.errores?.[0]?.msg || 'Error agregando personal')
    }
  }

  const handleToggleActivo = async (persona) => {
    try {
      // Nota: Necesitarías agregar una ruta en el backend para esto
      toast.info('Funcionalidad de activar/desactivar próximamente')
    } catch (error) {
      toast.error('Error actualizando estado')
    }
  }

  const handleEditarPersonal = async (datos) => {
    if (!personaEditando) return
    try {
      const payload = {
        nombre: datos.nombre,
        email: datos.email,
        rol: datos.rol,
        servicioId: datos.rol === 'enfermeria' ? datos.servicioId : null,
        activo: datos.activo
      }
      if (datos.password) {
        payload.password = datos.password
      }
      await api.put(`/api/auxiliares/${personaEditando.id || personaEditando._id}`, payload)
      toast.success('Personal actualizado')
      setMostrarEditar(false)
      setPersonaEditando(null)
      if (onPersonalAgregado) {
        onPersonalAgregado()
      }
    } catch (error) {
      toast.error(error.response?.data?.mensaje || 'Error actualizando personal')
    }
  }

  const getRolIcon = (rol) => {
    if (rol === 'administrador') return Shield
    if (rol === 'enfermeria') return UserCheck
    return UserCheck
  }

  const getRolColor = (rol) => {
    if (rol === 'administrador') return 'bg-gradient-to-br from-purple-500 to-purple-600'
    if (rol === 'enfermeria') return 'bg-gradient-to-br from-green-500 to-green-600'
    return 'bg-gradient-to-br from-blue-500 to-blue-600'
  }

  const getRolBadgeColor = (rol) => {
    if (rol === 'administrador') return 'bg-purple-100 text-purple-800 border-purple-300'
    if (rol === 'enfermeria') return 'bg-green-100 text-green-800 border-green-300'
    return 'bg-blue-100 text-blue-800 border-blue-300'
  }

  const getRolLabel = (rol) => {
    if (rol === 'administrador') return 'Admin'
    if (rol === 'enfermeria') return 'Enfermería'
    return 'Auxiliar'
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden transition-colors duration-300">
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 dark:from-indigo-700 dark:to-indigo-800 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Personal</h2>
          {usuario?.rol === 'administrador' && (
            <button
              onClick={() => setMostrarForm(!mostrarForm)}
              className="p-2 bg-white text-indigo-600 rounded-lg hover:bg-indigo-50 transition shadow-md hover:shadow-lg"
            >
              <Plus className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
      
      <div className="p-6">
        {personal.length === 0 ? (
          <div className="text-center py-8">
            <User className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">No hay personal registrado</p>
          </div>
        ) : (
          <div className="space-y-3">
            {personal.map((persona) => {
              const RolIcon = getRolIcon(persona.rol)
              return (
                <div
                  key={persona.id || persona._id}
                  className="group flex items-center gap-4 p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-md transition-all duration-200 bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-700"
                >
                  <div className={`p-3 rounded-xl text-white ${getRolColor(persona.rol)} shadow-md`}>
                    <RolIcon className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-bold text-gray-900 dark:text-white truncate">{persona.nombre}</h3>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${getRolBadgeColor(persona.rol)} dark:bg-opacity-20 dark:border-opacity-50`}>
                          {getRolLabel(persona.rol)}
                        </span>
                        {persona.servicio && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600">
                            {persona.servicio.nombre}
                          </span>
                        )}
                        {persona.activo ? (
                          <CheckCircle className="w-4 h-4 text-green-500" title="Activo" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500" title="Inactivo" />
                        )}
                        {usuario?.rol === 'administrador' && (
                          <button
                            onClick={() => {
                              setPersonaEditando(persona)
                              setMostrarEditar(true)
                            }}
                            className="p-1.5 rounded-md text-indigo-600 hover:bg-indigo-50 transition"
                            title="Editar personal"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Mail className="w-4 h-4" />
                      <span className="truncate">{persona.email}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {mostrarForm && usuario?.rol === 'administrador' && (
        <AgregarPersonalModal
          onClose={() => setMostrarForm(false)}
          onSubmit={handleAgregarPersonal}
          servicios={servicios}
        />
      )}
      {mostrarEditar && usuario?.rol === 'administrador' && (
        <EditarPersonalModal
          persona={personaEditando}
          onClose={() => {
            setMostrarEditar(false)
            setPersonaEditando(null)
          }}
          onSubmit={handleEditarPersonal}
          servicios={servicios}
        />
      )}
    </div>
  )
}

export default PersonalList
