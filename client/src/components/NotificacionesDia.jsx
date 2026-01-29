import { useState, useEffect } from 'react'
import { Bell, X, Calendar, AlertCircle, CheckCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const NotificacionesDia = ({ solicitudes }) => {
  const [mostrar, setMostrar] = useState(false)
  const [solicitudesHoy, setSolicitudesHoy] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    
    const solicitudesDelDia = solicitudes.filter(s => {
      const fechaSolicitud = new Date(s.createdAt)
      fechaSolicitud.setHours(0, 0, 0, 0)
      return fechaSolicitud.getTime() === hoy.getTime()
    })

    setSolicitudesHoy(solicitudesDelDia)
    
    // Mostrar notificación si hay solicitudes del día y no se ha cerrado antes
    if (solicitudesDelDia.length > 0) {
      const notificacionCerrada = localStorage.getItem(`notificacion-dia-${hoy.toDateString()}`)
      if (!notificacionCerrada) {
        setMostrar(true)
      }
    }
  }, [solicitudes])

  const cerrarNotificacion = () => {
    const hoy = new Date()
    localStorage.setItem(`notificacion-dia-${hoy.toDateString()}`, 'true')
    setMostrar(false)
  }

  const irACalendario = () => {
    cerrarNotificacion()
    navigate('/dashboard')
    // Cambiar a pestaña de calendario (esto se manejará en el Dashboard)
    setTimeout(() => {
      const event = new CustomEvent('cambiarPestaña', { detail: 'calendario' })
      window.dispatchEvent(event)
    }, 100)
  }

  if (!mostrar || solicitudesHoy.length === 0) return null

  const pendientes = solicitudesHoy.filter(s => s.estado === 'pendiente').length
  const enProceso = solicitudesHoy.filter(s => s.estado === 'en_proceso').length
  const urgentes = solicitudesHoy.filter(s => s.prioridad === 'urgente').length

  return (
    <div className="fixed top-4 left-4 right-4 sm:left-auto sm:right-4 z-50 animate-slide-in">
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl shadow-2xl p-4 sm:p-6 max-w-none sm:max-w-md w-full border-l-4 border-yellow-400">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Bell className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Solicitudes de Hoy</h3>
              <p className="text-primary-100 text-sm">
                {solicitudesHoy.length} solicitud{solicitudesHoy.length !== 1 ? 'es' : ''} creada{solicitudesHoy.length !== 1 ? 's' : ''} hoy
              </p>
            </div>
          </div>
          <button
            onClick={cerrarNotificacion}
            className="p-1 hover:bg-white/20 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2 mb-4">
          {pendientes > 0 && (
            <div className="flex items-center gap-2 text-sm bg-white/10 rounded-lg p-2">
              <AlertCircle className="w-4 h-4" />
              <span>{pendientes} pendiente{pendientes !== 1 ? 's' : ''}</span>
            </div>
          )}
          {enProceso > 0 && (
            <div className="flex items-center gap-2 text-sm bg-white/10 rounded-lg p-2">
              <CheckCircle className="w-4 h-4" />
              <span>{enProceso} en proceso</span>
            </div>
          )}
          {urgentes > 0 && (
            <div className="flex items-center gap-2 text-sm bg-red-500/30 rounded-lg p-2 font-semibold">
              <AlertCircle className="w-4 h-4" />
              <span>{urgentes} urgente{urgentes !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={irACalendario}
            className="flex-1 flex items-center justify-center gap-2 bg-white text-primary-600 px-4 py-2 rounded-lg font-semibold hover:bg-primary-50 transition"
          >
            <Calendar className="w-4 h-4" />
            Ver Calendario
          </button>
          <button
            onClick={cerrarNotificacion}
            className="px-4 py-2 bg-white/20 rounded-lg font-semibold hover:bg-white/30 transition w-full sm:w-auto"
          >
            Cerrar
          </button>
        </div>
      </div>
      
      <style>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}

export default NotificacionesDia



