import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { io } from 'socket.io-client'
import axios from 'axios'
import toast from 'react-hot-toast'
import { ArrowLeft, MessageSquare, Send, Users } from 'lucide-react'

const ChatPage = () => {
  const navigate = useNavigate()
  const { usuario } = useAuth()
  const [mensajes, setMensajes] = useState([])
  const [nuevoMensaje, setNuevoMensaje] = useState('')
  const [socket, setSocket] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [usuariosConectados, setUsuariosConectados] = useState([])
  const mensajesEndRef = useRef(null)

  useEffect(() => {
    if (!usuario) {
      navigate('/login', { replace: true })
      return
    }

    // Conectar a Socket.IO
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000'
    const newSocket = io(apiUrl, {
      transports: ['websocket', 'polling']
    })

    newSocket.on('connect', () => {
      console.log('Conectado al chat general')
      newSocket.emit('unirse-chat-general')
    })

    newSocket.on('mensaje-chat-general', (mensaje) => {
      setMensajes(prev => [...prev, mensaje])
    })

    newSocket.on('usuarios-conectados', (usuarios) => {
      setUsuariosConectados(usuarios)
    })

    setSocket(newSocket)

    // Cargar mensajes anteriores
    cargarMensajes()

    return () => {
      newSocket.disconnect()
    }
  }, [usuario, navigate])

  useEffect(() => {
    mensajesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensajes])

  const cargarMensajes = async () => {
    try {
      const res = await axios.get('/api/chat/general')
      setMensajes(res.data)
    } catch (error) {
      console.error('Error cargando mensajes:', error)
    } finally {
      setCargando(false)
    }
  }

  const enviarMensaje = async (e) => {
    e.preventDefault()
    if (!nuevoMensaje.trim() || !socket) return

    try {
      await axios.post('/api/chat/general', {
        contenido: nuevoMensaje,
        tipo: 'general'
      })
      setNuevoMensaje('')
    } catch (error) {
      toast.error('Error enviando mensaje')
      console.error(error)
    }
  }

  if (cargando) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Chat General</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {usuariosConectados.length} usuario(s) conectado(s)
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <Users className="w-4 h-4" />
              <span>{usuariosConectados.length} en línea</span>
            </div>
          </div>
        </div>
      </header>

      {/* Chat Container */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col">
        <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden flex flex-col">
          {/* Mensajes */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {mensajes.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
                <MessageSquare className="w-12 h-12 mb-4 opacity-50" />
                <p>No hay mensajes aún. ¡Sé el primero en escribir!</p>
              </div>
            ) : (
              mensajes.map((mensaje) => (
                <div
                  key={mensaje.id || mensaje._id}
                  className={`flex ${mensaje.usuarioId === usuario?.id ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      mensaje.usuarioId === usuario?.id
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                    }`}
                  >
                    <p className="text-xs font-semibold mb-1 opacity-75">
                      {mensaje.usuario?.nombre || 'Usuario'}
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
              ))
            )}
            <div ref={mensajesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={enviarMensaje} className="border-t border-gray-200 dark:border-gray-700 p-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={nuevoMensaje}
                onChange={(e) => setNuevoMensaje(e.target.value)}
                placeholder="Escribe un mensaje..."
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
    </div>
  )
}

export default ChatPage


