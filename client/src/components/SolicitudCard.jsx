import { useState } from 'react'
import { 
  MapPin, User, Clock, AlertCircle, CheckCircle, 
  X, Edit, MoreVertical, Calendar, MessageSquare, History, Tag
} from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'
import ComentariosModal from './ComentariosModal'
import HistorialModal from './HistorialModal'
import EtiquetasManager from './EtiquetasManager'

const SolicitudCard = ({ solicitud, usuario, onUpdate, servicios }) => {
  const [mostrarMenu, setMostrarMenu] = useState(false)
  const [cambiandoEstado, setCambiandoEstado] = useState(false)
  const [mostrarComentarios, setMostrarComentarios] = useState(false)
  const [mostrarHistorial, setMostrarHistorial] = useState(false)

  const getEstadoColor = (estado) => {
    const colores = {
      pendiente: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      asignada: 'bg-blue-100 text-blue-800 border-blue-300',
      en_proceso: 'bg-purple-100 text-purple-800 border-purple-300',
      completada: 'bg-green-100 text-green-800 border-green-300',
      cancelada: 'bg-red-100 text-red-800 border-red-300'
    }
    return colores[estado] || 'bg-gray-100 text-gray-800 border-gray-300'
  }

  const getPrioridadColor = (prioridad) => {
    const colores = {
      baja: 'text-gray-600 bg-gray-100',
      media: 'text-blue-600 bg-blue-100',
      alta: 'text-orange-600 bg-orange-100',
      urgente: 'text-red-600 bg-red-100'
    }
    return colores[prioridad] || 'text-gray-600 bg-gray-100'
  }

  const getTipoIcon = (tipo) => {
    const iconos = {
      alta: '🏥',
      traslado: '🚑',
      pabellon: '⚕️',
      otro: '📋'
    }
    return iconos[tipo] || '📋'
  }

  const formatearFecha = (fecha) => {
    if (!fecha) return 'N/A'
    return new Date(fecha).toLocaleString('es-ES', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleCambiarEstado = async (nuevoEstado) => {
    setCambiandoEstado(true)
    try {
      await axios.put(`/api/solicitudes/${solicitud.id || solicitud._id}/estado`, { 
        estado: nuevoEstado 
      })
      toast.success('Estado actualizado')
      // Actualizar inmediatamente
      if (onUpdate) {
        await onUpdate()
      }
      setMostrarMenu(false)
    } catch (error) {
      toast.error(error.response?.data?.mensaje || 'Error actualizando estado')
    } finally {
      setCambiandoEstado(false)
    }
  }

  const puedeEditar = usuario?.rol === 'administrador' || 
    (usuario?.rol === 'auxiliar' && solicitud.asignadoAId === usuario?.id)

  return (
    <div 
      data-solicitud-id={solicitud.id || solicitud._id}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-md dark:shadow-gray-900/50 hover:shadow-xl dark:hover:shadow-gray-900/70 transition-all duration-300 border-l-4 border-primary-500 dark:border-primary-400 overflow-hidden group transform hover:-translate-y-1">
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{getTipoIcon(solicitud.tipoRequerimiento)}</span>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                  {solicitud.servicio?.nombre || 'Servicio no disponible'}
                </h3>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mt-1">
                  <MapPin className="w-4 h-4" />
                  <span>Piso {solicitud.servicio?.piso || 'N/A'}</span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getEstadoColor(solicitud.estado)}`}>
                {solicitud.estado.replace('_', ' ').toUpperCase()}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPrioridadColor(solicitud.prioridad)}`}>
                {solicitud.prioridad.toUpperCase()}
              </span>
            </div>
          </div>

          {puedeEditar && (
            <div className="relative">
              <button
                onClick={() => setMostrarMenu(!mostrarMenu)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
              >
                <MoreVertical className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
              
              {mostrarMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setMostrarMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl dark:shadow-gray-900/50 border dark:border-gray-700 z-20 overflow-hidden">
                    {solicitud.estado === 'pendiente' && (
                      <button
                        onClick={() => handleCambiarEstado('asignada')}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 transition-colors"
                      >
                        Marcar como Asignada
                      </button>
                    )}
                    {solicitud.estado === 'asignada' && (
                      <button
                        onClick={() => handleCambiarEstado('en_proceso')}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-purple-50 dark:hover:bg-purple-900/20 text-purple-600 dark:text-purple-400 transition-colors"
                      >
                        En Proceso
                      </button>
                    )}
                    {(solicitud.estado === 'en_proceso' || solicitud.estado === 'asignada') && (
                      <button
                        onClick={() => handleCambiarEstado('completada')}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-green-50 dark:hover:bg-green-900/20 text-green-600 dark:text-green-400 transition-colors"
                      >
                        Completar
                      </button>
                    )}
                    {solicitud.estado !== 'cancelada' && solicitud.estado !== 'completada' && (
                      <button
                        onClick={() => handleCambiarEstado('cancelada')}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors"
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Descripción */}
        {solicitud.descripcion && (
          <p className="text-gray-700 dark:text-gray-300 mb-4 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg text-sm">
            {solicitud.descripcion}
          </p>
        )}

        {/* Etiquetas */}
        {solicitud.etiquetas && solicitud.etiquetas.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {solicitud.etiquetas.map((etiqueta) => (
              <span
                key={etiqueta.id || etiqueta._id}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium text-white"
                style={{ backgroundColor: etiqueta.color }}
              >
                <Tag className="w-3 h-3" />
                {etiqueta.nombre}
              </span>
            ))}
          </div>
        )}

        {/* Gestión de Etiquetas (solo para administradores) */}
        {usuario?.rol === 'administrador' && (
          <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <EtiquetasManager
              solicitudId={solicitud.id || solicitud._id}
              etiquetasActuales={solicitud.etiquetas || []}
              onEtiquetasChange={() => {
                if (onUpdate) onUpdate()
              }}
            />
          </div>
        )}

        {/* Footer con información */}
        <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-gray-600 pt-3 border-t dark:border-gray-700">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-1">
              <User className="w-4 h-4" />
              <span className="dark:text-gray-300">{solicitud.solicitadoPor?.nombre || 'N/A'}</span>
            </div>
            {solicitud.asignadoA && (
              <div className="flex items-center gap-1">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-green-700 dark:text-green-400">{solicitud.asignadoA.nombre}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              {solicitud.fechaProgramada ? (
                <>
                  <Calendar className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                  <span className="text-primary-600 dark:text-primary-400 font-semibold">
                    Programada: {new Date(solicitud.fechaProgramada).toLocaleDateString('es-ES')}
                  </span>
                </>
              ) : (
                <>
                  <Calendar className="w-4 h-4" />
                  <span className="dark:text-gray-300">{formatearFecha(solicitud.createdAt)}</span>
                </>
              )}
            </div>
          </div>
          
          {/* Botones de acción */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMostrarComentarios(true)}
              className="flex items-center gap-1 px-3 py-1.5 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition text-sm font-medium"
              title="Ver comentarios"
            >
              <MessageSquare className="w-4 h-4" />
              Comentarios
            </button>
            <button
              onClick={() => setMostrarHistorial(true)}
              className="flex items-center gap-1 px-3 py-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition text-sm font-medium"
              title="Ver historial"
            >
              <History className="w-4 h-4" />
              Historial
            </button>
          </div>
        </div>
      </div>

      {/* Modales */}
      {mostrarComentarios && (
        <ComentariosModal
          solicitudId={solicitud.id || solicitud._id}
          onClose={() => setMostrarComentarios(false)}
        />
      )}
      {mostrarHistorial && (
        <HistorialModal
          solicitudId={solicitud.id || solicitud._id}
          onClose={() => setMostrarHistorial(false)}
        />
      )}
    </div>
  )
}

export default SolicitudCard

