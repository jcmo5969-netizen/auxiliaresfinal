import { useState, useEffect } from 'react'
import api from '../utils/api'
import toast from 'react-hot-toast'
import { X, Send, MessageSquare, User, Clock } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const ComentariosModal = ({ solicitudId, onClose }) => {
  const { usuario } = useAuth()
  const [comentarios, setComentarios] = useState([])
  const [nuevoComentario, setNuevoComentario] = useState('')
  const [cargando, setCargando] = useState(true)
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    cargarComentarios()
    // Actualizar comentarios cada 5 segundos
    const intervalo = setInterval(cargarComentarios, 5000)
    return () => clearInterval(intervalo)
  }, [solicitudId])

  const cargarComentarios = async () => {
    try {
      const res = await api.get(`/api/comentarios/solicitud/${solicitudId}`)
      setComentarios(res.data)
    } catch (error) {
      console.error('Error cargando comentarios:', error)
    } finally {
      setCargando(false)
    }
  }

  const handleEnviar = async (e) => {
    e.preventDefault()
    if (!nuevoComentario.trim()) return

    setEnviando(true)
    try {
      await api.post('/api/comentarios', {
        solicitudId,
        contenido: nuevoComentario
      })
      setNuevoComentario('')
      await cargarComentarios()
      toast.success('Comentario enviado')
    } catch (error) {
      toast.error(error.response?.data?.mensaje || 'Error enviando comentario')
    } finally {
      setEnviando(false)
    }
  }

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleString('es-ES', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="comentarios-titulo"
    >
      {/* Clic fuera cierra el modal */}
      <div
        className="absolute inset-0"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] min-h-[280px] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            <h2 id="comentarios-titulo" className="text-xl font-bold text-gray-900 dark:text-white">Comentarios</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Lista de comentarios - área con scroll y altura mínima para que siempre se vea contenido */}
        <div className="flex-1 min-h-[180px] overflow-y-auto p-4 sm:p-6 space-y-4">
          {cargando ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-600 border-t-transparent mx-auto"></div>
            </div>
          ) : comentarios.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No hay comentarios aún</p>
            </div>
          ) : (
            comentarios.map((comentario) => (
              <div
                key={comentario.id}
                className={`p-4 rounded-lg ${
                  comentario.usuario?.id === usuario?.id
                    ? 'bg-primary-50 dark:bg-primary-900/20 sm:ml-8'
                    : 'bg-gray-50 dark:bg-gray-700/50 sm:mr-8'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary-600 dark:bg-primary-500 flex items-center justify-center text-white text-sm font-semibold">
                    {comentario.usuario?.nombre?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {comentario.usuario?.nombre || 'Usuario'}
                      </span>
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300">
                        {comentario.usuario?.rol === 'administrador'
                          ? 'Administrador'
                          : comentario.usuario?.rol === 'auxiliar'
                            ? 'Auxiliar'
                            : comentario.usuario?.rol === 'enfermeria'
                              ? 'Enfermería'
                              : comentario.usuario?.rol || 'Usuario'}
                      </span>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 mb-2">{comentario.contenido}</p>
                    <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                      <Clock className="w-3 h-3" />
                      <span>{formatearFecha(comentario.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Formulario de nuevo comentario */}
        <form onSubmit={handleEnviar} className="p-4 sm:p-6 border-t dark:border-gray-700 flex-shrink-0">
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={nuevoComentario}
              onChange={(e) => setNuevoComentario(e.target.value)}
              placeholder="Escribe un comentario..."
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              disabled={enviando}
            />
            <button
              type="submit"
              disabled={enviando || !nuevoComentario.trim()}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              <Send className="w-4 h-4" />
              Enviar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ComentariosModal



