import { useState, useEffect, useRef } from 'react'
import { io } from 'socket.io-client'
import axios from 'axios'
import toast from 'react-hot-toast'
import { MessageSquare, Send, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const ChatComponent = ({ solicitudId, onClose }) => {
  const { usuario } = useAuth()
  const [mensajes, setMensajes] = useState([])
  const [nuevoMensaje, setNuevoMensaje] = useState('')
  const [socket, setSocket] = useState(null)
  const [cargando, setCargando] = useState(true)
  const mensajesEndRef = useRef(null)

  useEffect(() => {
    // Conectar a Socket.IO
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000'
    const newSocket = io(apiUrl, {
      transports: ['websocket', 'polling']
    })
    setSocket(newSocket)

    // Unirse a la sala de la solicitud
    if (solicitudId) {
      newSocket.emit('unirse-solicitud', solicitudId)
    }

    // Escuchar nuevos mensajes
    newSocket.on('nuevo-mensaje', (mensaje) => {
      if (mensaje.solicitudId === solicitudId || !solicitudId) {
        setMensajes(prev => [...prev, mensaje])
        scrollToBottom()
      }
    })

    // Cargar mensajes existentes
    cargarMensajes()

    return () => {
      if (solicitudId) {
        newSocket.emit('salir-solicitud', solicitudId)
      }
      newSocket.close()
    }
  }, [solicitudId])

  const cargarMensajes = async () => {
    try {
      const res = await axios.get('/api/chat/mensajes', {
        params: { solicitudId: solicitudId || null }
      })
      setMensajes(res.data)
      scrollToBottom()
    } catch (error) {
      toast.error('Error cargando mensajes')
    } finally {
      setCargando(false)
    }
  }

  const scrollToBottom = () => {
    setTimeout(() => {
      mensajesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  const handleEnviar = async (e) => {
    e.preventDefault()
    if (!nuevoMensaje.trim()) return

    try {
      await axios.post('/api/chat/mensajes', {
        contenido: nuevoMensaje,
        solicitudId: solicitudId || null
      })
      setNuevoMensaje('')
    } catch (error) {
      toast.error('Error enviando mensaje')
    }
  }

  if (cargando) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-600 border-t-transparent mx-auto"></div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg flex flex-col h-[500px]">
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-white" />
          <h3 className="text-white font-semibold">Chat {solicitudId ? 'de Solicitud' : 'General'}</h3>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-white hover:bg-white/20 rounded-lg p-1">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {mensajes.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No hay mensajes aún</p>
          </div>
        ) : (
          mensajes.map((mensaje) => {
            const esMio = mensaje.remitente?.id === usuario?.id
            return (
              <div
                key={mensaje.id}
                className={`flex ${esMio ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg p-3 ${
                    esMio
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                  }`}
                >
                  <div className="text-xs opacity-75 mb-1">
                    {mensaje.remitente?.nombre || 'Usuario'}
                  </div>
                  <div className="text-sm">{mensaje.contenido}</div>
                  <div className="text-xs opacity-75 mt-1">
                    {new Date(mensaje.createdAt).toLocaleTimeString('es-ES', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={mensajesEndRef} />
      </div>

      <form onSubmit={handleEnviar} className="p-4 border-t dark:border-gray-700">
        <div className="flex gap-2">
          <input
            type="text"
            value={nuevoMensaje}
            onChange={(e) => setNuevoMensaje(e.target.value)}
            placeholder="Escribe un mensaje..."
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  )
}

export default ChatComponent

