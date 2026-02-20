import { useState, useEffect } from 'react'
import api from '../utils/api'
import toast from 'react-hot-toast'
import { X, FileText, History, MessageSquare, User, Clock, ArrowRight, Send, Calendar, Bed } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const ZONA = 'America/Santiago'

const formatearFecha = (fecha) => {
  return new Date(fecha).toLocaleString('es-ES', {
    timeZone: ZONA,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getAccionIcon = (accion) => {
  switch (accion) {
    case 'crear': return '➕'
    case 'asignar': return '👤'
    case 'cambiar_estado': return '🔄'
    case 'actualizar': return '✏️'
    default: return '📝'
  }
}

const getAccionColor = (accion) => {
  switch (accion) {
    case 'crear': return 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300'
    case 'asignar': return 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300'
    case 'cambiar_estado': return 'bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300'
    case 'actualizar': return 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300'
    default: return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
  }
}

const getTipoIcon = (tipo) => {
  const iconos = { alta: '🏥', traslado: '🚑', pabellon: '⚕️', gescas: '🛏️', otro: '📋' }
  return iconos[tipo] || '📋'
}

const VentanaInformacionSolicitud = ({ solicitud, onClose, onComentarioEnviado }) => {
  const { usuario } = useAuth()
  const [historial, setHistorial] = useState([])
  const [comentarios, setComentarios] = useState([])
  const [nuevoComentario, setNuevoComentario] = useState('')
  const [cargandoHistorial, setCargandoHistorial] = useState(true)
  const [cargandoComentarios, setCargandoComentarios] = useState(true)
  const [enviando, setEnviando] = useState(false)

  const id = solicitud?.id ?? solicitud?._id
  const puedeComentar = usuario?.rol === 'administrador' ||
    solicitud?.solicitadoPorId === usuario?.id ||
    solicitud?.asignadoAId === usuario?.id ||
    (usuario?.rol === 'enfermeria' && solicitud?.servicioId === usuario?.servicioId)

  useEffect(() => {
    if (!id) return
    const cargar = async () => {
      setCargandoHistorial(true)
      setCargandoComentarios(true)
      try {
        const [resHist, resCom] = await Promise.all([
          api.get(`/api/historial/solicitud/${id}`),
          api.get(`/api/comentarios/solicitud/${id}`)
        ])
        setHistorial(resHist.data || [])
        setComentarios(resCom.data || [])
      } catch (e) {
        toast.error('Error cargando información')
      } finally {
        setCargandoHistorial(false)
        setCargandoComentarios(false)
      }
    }
    cargar()
    const intervalo = setInterval(cargar, 8000)
    return () => clearInterval(intervalo)
  }, [id])

  const handleEnviarComentario = async (e) => {
    e.preventDefault()
    if (!nuevoComentario.trim() || !id) return
    setEnviando(true)
    try {
      await api.post('/api/comentarios', { solicitudId: id, contenido: nuevoComentario })
      setNuevoComentario('')
      const res = await api.get(`/api/comentarios/solicitud/${id}`)
      setComentarios(res.data || [])
      toast.success('Comentario enviado')
      if (onComentarioEnviado) onComentarioEnviado()
    } catch (error) {
      toast.error(error.response?.data?.mensaje || 'Error enviando comentario')
    } finally {
      setEnviando(false)
    }
  }

  if (!solicitud) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Toda la información</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Resumen de la solicitud */}
          <section>
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Resumen</h3>
            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{getTipoIcon(solicitud.tipoRequerimiento)}</span>
                <span className="font-semibold text-gray-900 dark:text-white">{solicitud.servicio?.nombre || 'N/A'}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 rounded bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 text-xs">
                  {String(solicitud.estado || '').replace('_', ' ')}
                </span>
                <span className="px-2 py-1 rounded bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-200 text-xs">
                  {String(solicitud.prioridad || '')}
                </span>
              </div>
              {solicitud.estado === 'cancelada' && (solicitud.motivoCancelacion || solicitud.motivo_cancelacion) && (
                <div className="p-2 rounded bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                  <p className="text-sm font-medium text-red-800 dark:text-red-200">Motivo de cancelación</p>
                  <p className="text-sm text-red-700 dark:text-red-300">{solicitud.motivoCancelacion || solicitud.motivo_cancelacion}</p>
                </div>
              )}
              <div className="flex items-center gap-1 text-gray-600 dark:text-gray-300">
                <User className="w-4 h-4" />
                <span>Solicitado por: {solicitud.solicitadoPor?.nombre || 'N/A'}</span>
              </div>
              {solicitud.asignadoA && (
                <div className="flex items-center gap-1 text-green-700 dark:text-green-400">
                  <User className="w-4 h-4" />
                  <span>Asignado a: {solicitud.asignadoA.nombre}</span>
                </div>
              )}
              {(solicitud.fechaProgramada || solicitud.createdAt) && (
                <div className="flex items-center gap-1 text-gray-600 dark:text-gray-300">
                  <Calendar className="w-4 h-4" />
                  <span>{solicitud.fechaProgramada ? `Programada: ${new Date(solicitud.fechaProgramada).toLocaleDateString('es-ES', { timeZone: ZONA })}` : formatearFecha(solicitud.createdAt)}</span>
                </div>
              )}
              {solicitud.cama && (
                <div className="flex items-center gap-1 text-gray-600 dark:text-gray-300">
                  <Bed className="w-4 h-4" />
                  <span>Cama: {solicitud.cama}</span>
                </div>
              )}
              {solicitud.precaucionesEstandar && (
                <div className="text-gray-600 dark:text-gray-300">
                  Precauciones adicionales: Sí{solicitud.tipoPrecaucion || solicitud.tipo_precaucion ? ` – ${solicitud.tipoPrecaucion || solicitud.tipo_precaucion}` : ''}
                </div>
              )}
              {solicitud.descripcion && (
                <p className="text-gray-700 dark:text-gray-300 pt-1 border-t dark:border-gray-600">{solicitud.descripcion}</p>
              )}
            </div>
          </section>

          {/* Historial */}
          <section>
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1">
              <History className="w-4 h-4" /> Historial
            </h3>
            {cargandoHistorial ? (
              <div className="flex justify-center py-4"><div className="animate-spin rounded-full h-6 w-6 border-2 border-primary-600 border-t-transparent" /></div>
            ) : historial.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 py-2">No hay historial</p>
            ) : (
              <div className="space-y-3">
                {historial.map((cambio) => (
                  <div key={cambio.id} className="flex gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-sm">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 ${getAccionColor(cambio.accion)}`}>
                      {getAccionIcon(cambio.accion)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${getAccionColor(cambio.accion)}`}>
                          {String(cambio.accion || '').replace('_', ' ').toUpperCase()}
                        </span>
                        {cambio.usuario?.nombre && (
                          <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                            <User className="w-3 h-3" /> {cambio.usuario.nombre}
                          </span>
                        )}
                      </div>
                      {cambio.descripcion && <p className="text-gray-700 dark:text-gray-300 mt-0.5">{cambio.descripcion}</p>}
                      {cambio.valorAnterior != null && cambio.valorNuevo != null && (
                        <div className="flex items-center gap-2 mt-1 text-xs">
                          <span className="px-1.5 py-0.5 bg-red-100 dark:bg-red-900/20 rounded">{cambio.valorAnterior}</span>
                          <ArrowRight className="w-3 h-3" />
                          <span className="px-1.5 py-0.5 bg-green-100 dark:bg-green-900/20 rounded">{cambio.valorNuevo}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mt-1">
                        <Clock className="w-3 h-3" />
                        {formatearFecha(cambio.createdAt)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Comentarios */}
          <section>
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1">
              <MessageSquare className="w-4 h-4" /> Comentarios
            </h3>
            {cargandoComentarios ? (
              <div className="flex justify-center py-4"><div className="animate-spin rounded-full h-6 w-6 border-2 border-primary-600 border-t-transparent" /></div>
            ) : (
              <>
                <div className="space-y-3 mb-4">
                  {comentarios.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400 py-2">No hay comentarios</p>
                  ) : (
                    comentarios.map((c) => (
                      <div
                        key={c.id}
                        className={`p-3 rounded-lg text-sm ${c.usuario?.id === usuario?.id ? 'bg-primary-50 dark:bg-primary-900/20 ml-2' : 'bg-gray-50 dark:bg-gray-700/50'}`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900 dark:text-white">{c.usuario?.nombre || 'Usuario'}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {c.usuario?.rol === 'administrador' ? 'Administrador' : c.usuario?.rol === 'auxiliar' ? 'Auxiliar' : c.usuario?.rol === 'enfermeria' ? 'Enfermería' : c.usuario?.rol || ''}
                          </span>
                          <span className="text-xs text-gray-400"> · {formatearFecha(c.createdAt)}</span>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300">{c.contenido}</p>
                      </div>
                    ))
                  )}
                </div>
                {puedeComentar && (
                  <form onSubmit={handleEnviarComentario} className="flex gap-2">
                    <input
                      type="text"
                      value={nuevoComentario}
                      onChange={(e) => setNuevoComentario(e.target.value)}
                      placeholder="Escribe un comentario..."
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      disabled={enviando}
                    />
                    <button
                      type="submit"
                      disabled={enviando || !nuevoComentario.trim()}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700 disabled:opacity-50 flex items-center gap-1"
                    >
                      <Send className="w-4 h-4" /> Enviar
                    </button>
                  </form>
                )}
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}

export default VentanaInformacionSolicitud
