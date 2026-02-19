import { useState } from 'react'
import { 
  MapPin, User, Clock, AlertCircle, CheckCircle, 
  X, Edit, MoreVertical, Calendar, MessageSquare, History, Tag, Bed, FileText
} from 'lucide-react'
import api from '../utils/api'
import toast from 'react-hot-toast'
import ComentariosModal from './ComentariosModal'
import HistorialModal from './HistorialModal'
import EtiquetasManager from './EtiquetasManager'
import EditarSolicitudModal from './EditarSolicitudModal'
import VentanaInformacionSolicitud from './VentanaInformacionSolicitud'

const SolicitudCard = ({ solicitud, usuario, onUpdate, servicios = [] }) => {
  const [mostrarMenu, setMostrarMenu] = useState(false)
  const [cambiandoEstado, setCambiandoEstado] = useState(false)
  const [mostrarComentarios, setMostrarComentarios] = useState(false)
  const [mostrarHistorial, setMostrarHistorial] = useState(false)
  const [mostrarEditarSolicitud, setMostrarEditarSolicitud] = useState(false)
  const [mostrarVentanaInfo, setMostrarVentanaInfo] = useState(false)

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
      gescas: '🛏️',
      otro: '📋'
    }
    return iconos[tipo] || '📋'
  }

  const formatearFecha = (fecha) => {
    if (!fecha) return 'N/A'
    return new Date(fecha).toLocaleString('es-ES', {
      timeZone: 'America/Santiago',
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
  const formatearFechaProgramada = (fecha) => {
    if (!fecha) return ''
    return new Date(fecha).toLocaleDateString('es-ES', { timeZone: 'America/Santiago', day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  const handleCambiarEstado = async (nuevoEstado) => {
    setCambiandoEstado(true)
    try {
      await api.put(`/api/solicitudes/${solicitud.id || solicitud._id}/estado`, { 
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
      className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/40 hover:shadow-md dark:hover:shadow-gray-900/50 transition-all border-l-4 border-primary-500 dark:border-primary-400 overflow-hidden">
      <div className="p-3 sm:p-3">
        {/* Header compacto: servicio + cama + estado + prioridad */}
        <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="text-lg flex-shrink-0">{getTipoIcon(solicitud.tipoRequerimiento)}</span>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 flex-wrap">
                <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                  {solicitud.servicio?.nombre || 'Servicio no disponible'}
                </span>
                {solicitud.cama && (
                  <>
                    <span className="text-gray-400 dark:text-gray-500">·</span>
                    <Bed className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="text-xs">Cama {solicitud.cama}</span>
                  </>
                )}
              </div>
              {solicitud.tipoRequerimiento === 'gescas' && (solicitud.destinoGescas || solicitud.destino_gescas) && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                  Destino: {solicitud.destinoGescas || solicitud.destino_gescas}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border whitespace-nowrap ${getEstadoColor(solicitud.estado)}`}>
              {solicitud.estado.replace('_', ' ').toUpperCase()}
            </span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold whitespace-nowrap ${getPrioridadColor(solicitud.prioridad)}`}>
              {solicitud.prioridad.toUpperCase()}
            </span>
            {puedeEditar && (
              <div className="relative">
                <button
                  onClick={() => setMostrarMenu(!mostrarMenu)}
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition"
                >
                  <MoreVertical className="w-4 h-4 text-gray-600 dark:text-gray-400" />
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
                    <button
                      onClick={() => { setMostrarMenu(false); setMostrarEditarSolicitud(true) }}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300 transition-colors border-t dark:border-gray-600"
                    >
                      <Edit className="w-4 h-4 inline mr-2" />
                      Modificar solicitud
                    </button>
                  </div>
                </>
              )}
              </div>
            )}
          </div>
        </div>

        {/* Información adicional */}
        {(solicitud.tipoServicio || solicitud.tipoTraslado || solicitud.prioridadInmediato) && (
          <div className="mb-2 space-y-0.5 text-xs text-gray-600 dark:text-gray-300">
            {solicitud.tipoServicio && (
              <div>{solicitud.tipoServicio === 'traslado_pcte' ? 'TRASLADO DE PCTE' : solicitud.tipoServicio}</div>
            )}
            {solicitud.tipoTraslado && (
              <div>
                {solicitud.tipoTraslado === 'sin_silla_ni_camilla' ? 'Sin silla ni camilla' : solicitud.tipoTraslado === 'con_silla' ? 'Con silla' : solicitud.tipoTraslado === 'con_camilla' ? 'Con camilla' : solicitud.tipoTraslado}
              </div>
            )}
            {solicitud.prioridadInmediato && (
              <div className="text-red-600 dark:text-red-400 font-semibold">Prioridad Inmediato</div>
            )}
          </div>
        )}

        {/* Descripción */}
        {solicitud.descripcion && (
          <p className="text-gray-700 dark:text-gray-300 mb-2 bg-gray-50 dark:bg-gray-700/50 p-2 rounded text-xs line-clamp-2">
            {solicitud.descripcion}
          </p>
        )}

        {/* Etiquetas */}
        {solicitud.etiquetas && solicitud.etiquetas.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {solicitud.etiquetas.map((etiqueta) => (
              <span
                key={etiqueta.id || etiqueta._id}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium text-white"
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
          <div className="mb-2 p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
            <EtiquetasManager
              solicitudId={solicitud.id || solicitud._id}
              etiquetasActuales={solicitud.etiquetas || []}
              onEtiquetasChange={() => {
                if (onUpdate) onUpdate()
              }}
            />
          </div>
        )}

        {/* Footer compacto */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-gray-600 dark:text-gray-400 pt-2 border-t dark:border-gray-700">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="flex items-center gap-1">
              <User className="w-3.5 h-3.5" />
              {solicitud.solicitadoPor?.nombre || 'N/A'}
            </span>
            {solicitud.asignadoA && (
              <span className="flex items-center gap-1 text-green-700 dark:text-green-400">
                <CheckCircle className="w-3.5 h-3.5" />
                {solicitud.asignadoA.nombre}
              </span>
            )}
            <span className="flex items-center gap-1 text-primary-600 dark:text-primary-400 font-medium">
              <Calendar className="w-3.5 h-3.5" />
              {solicitud.fechaProgramada
                ? `Programada: ${formatearFechaProgramada(solicitud.fechaProgramada)}`
                : formatearFecha(solicitud.createdAt)}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setMostrarVentanaInfo(true)}
              className="flex items-center gap-1 px-2 py-1 bg-primary-600 dark:bg-primary-500 text-white hover:bg-primary-700 rounded text-xs font-medium"
              title="Ver toda la información"
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ver todo</span>
            </button>
            <button
              onClick={() => setMostrarComentarios(true)}
              className="flex items-center gap-1 px-2 py-1 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded text-xs"
              title="Comentarios"
            >
              <MessageSquare className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setMostrarHistorial(true)}
              className="flex items-center gap-1 px-2 py-1 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-xs"
              title="Historial"
            >
              <History className="w-3.5 h-3.5" />
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
      {mostrarEditarSolicitud && (
        <EditarSolicitudModal
          solicitud={solicitud}
          servicios={servicios}
          onClose={() => setMostrarEditarSolicitud(false)}
          onGuardado={onUpdate}
        />
      )}
      {mostrarVentanaInfo && (
        <VentanaInformacionSolicitud
          solicitud={solicitud}
          onClose={() => setMostrarVentanaInfo(false)}
          onComentarioEnviado={onUpdate}
        />
      )}
    </div>
  )
}

export default SolicitudCard

