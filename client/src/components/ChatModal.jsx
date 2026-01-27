import { useState, useEffect, useRef } from 'react'
import { io } from 'socket.io-client'
import api from '../utils/api'
import toast from 'react-hot-toast'
import { MessageSquare, Send, X, Users } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const ChatModal = ({ onClose, solicitudId = null }) => {
  const { usuario } = useAuth()
  const [mensajes, setMensajes] = useState([])
  const [nuevoMensaje, setNuevoMensaje] = useState('')
  const [socket, setSocket] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [usuariosConectados, setUsuariosConectados] = useState([])
  const mensajesEndRef = useRef(null)

  useEffect(() => {
    if (!usuario) return

    // Conectar a Socket.IO
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000'
    const newSocket = io(apiUrl, {
      transports: ['websocket', 'polling']
    })

    if (solicitudId) {
      // Chat de solicitud específica
      newSocket.emit('unirse-solicitud', solicitudId)
      newSocket.on('nuevo-mensaje', (mensaje) => {
        if (mensaje.solicitudId === solicitudId) {
          setMensajes(prev => [...prev, mensaje])
          scrollToBottom()
        }
      })
    } else {
      // Chat general
      newSocket.on('connect', () => {
        newSocket.emit('unirse-chat-general')
      })
      newSocket.on('mensaje-chat-general', (mensaje) => {
        setMensajes(prev => [...prev, mensaje])
        scrollToBottom()
      })
      newSocket.on('usuarios-conectados', (usuarios) => {
        setUsuariosConectados(usuarios)
      })
    }

    setSocket(newSocket)
    cargarMensajes()

    return () => {
      if (solicitudId) {
        newSocket.emit('salir-solicitud', solicitudId)
      }
      newSocket.disconnect()
    }
  }, [usuario, solicitudId])

  useEffect(() => {
    scrollToBottom()
  }, [mensajes])

  const scrollToBottom = () => {
    setTimeout(() => {
      mensajesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  const cargarMensajes = async () => {
    try {
      if (solicitudId) {
        const res = await api.get('/api/chat/mensajes', {
          params: { solicitudId }
        })
        setMensajes(res.data)
      } else {
        const res = await api.get('/api/chat/general')
        setMensajes(res.data)
      }
    } catch (error) {
      toast.error('Error cargando mensajes')
      console.error(error)
    } finally {
      setCargando(false)
    }
  }

  const handleEnviar = async (e) => {
    e.preventDefault()
    if (!nuevoMensaje.trim() || !socket) return

    try {
      if (solicitudId) {
        await api.post('/api/chat/mensajes', {
          contenido: nuevoMensaje,
          solicitudId
        })
      } else {
        await api.post('/api/chat/general', {
          contenido: nuevoMensaje,
          tipo: 'general'
        })
      }
      setNuevoMensaje('')
    } catch (error) {
      toast.error('Error enviando mensaje')
      console.error(error)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MessageSquare className="w-6 h-6 text-white" />
            <div>
              <h2 className="text-2xl font-bold text-white">
                {solicitudId ? 'Chat de Solicitud' : 'Chat General'}
              </h2>
              {!solicitudId && usuariosConectados.length > 0 && (
                <p className="text-sm text-primary-100 flex items-center gap-1 mt-1">
                  <Users className="w-4 h-4" />
                  {usuariosConectados.length} usuario(s) conectado(s)
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-lg p-2 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Mensajes */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50 dark:bg-gray-900/50">
          {cargando ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div>
            </div>
          ) : mensajes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
              <MessageSquare className="w-16 h-16 mb-4 opacity-50" />
              <p>No hay mensajes aún. ¡Sé el primero en escribir!</p>
            </div>
          ) : (
            mensajes.map((mensaje) => {
              const esMio = mensaje.remitenteId === usuario?.id || mensaje.remitente?.id === usuario?.id
              return (
                <div
                  key={mensaje.id || mensaje._id}
                  className={`flex ${esMio ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                      esMio
                        ? 'bg-primary-600 text-white'
                        : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                    }`}
                  >
                    <p className="text-xs font-semibold mb-1 opacity-75">
                      {mensaje.remitente?.nombre || 'Usuario'}
                    </p>
                    <p className="text-sm">{mensaje.contenido}</p>
                    <p className="text-xs mt-1 opacity-75">
                      {new Date(mensaje.createdAt).toLocaleTimeString('es-ES', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              )
            })
          )}
          <div ref={mensajesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleEnviar} className="border-t border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
          <div className="flex gap-2">
            <input
              type="text"
              value={nuevoMensaje}
              onChange={(e) => setNuevoMensaje(e.target.value)}
              placeholder="Escribe un mensaje..."
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            />
            <button
              type="submit"
              disabled={!nuevoMensaje.trim()}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
            >
              <Send className="w-5 h-5" />
              Enviar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ChatModal

