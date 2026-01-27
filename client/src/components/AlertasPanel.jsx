import { useState, useEffect } from 'react'
import api from '../utils/api'
import toast from 'react-hot-toast'
import { AlertTriangle, Bell, X, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const AlertasPanel = ({ solicitudes = [] }) => {
  const { usuario } = useAuth()
  const [alertas, setAlertas] = useState([])
  const [mostrarPanel, setMostrarPanel] = useState(true)
  const [recordatorios, setRecordatorios] = useState([])

  useEffect(() => {
    if (!usuario || usuario.rol !== 'administrador') return
    
    calcularAlertas()
    cargarRecordatorios()
    
    // Actualizar cada 30 segundos
    const intervalo = setInterval(() => {
      calcularAlertas()
      cargarRecordatorios()
    }, 30000)
    
    return () => clearInterval(intervalo)
  }, [solicitudes, usuario])

  const calcularAlertas = () => {
    const nuevasAlertas = []
    
    // Alertas por solicitudes urgentes sin asignar
    const urgentesSinAsignar = solicitudes.filter(s => 
      s.prioridad === 'urgente' && 
      s.estado === 'pendiente' && 
      !s.asignadoAId
    )
    
    if (urgentesSinAsignar.length > 0) {
      nuevasAlertas.push({
        id: 'urgentes-sin-asignar',
        tipo: 'urgente',
        titulo: `${urgentesSinAsignar.length} Solicitud${urgentesSinAsignar.length > 1 ? 'es' : ''} Urgente${urgentesSinAsignar.length > 1 ? 's' : ''} Sin Asignar`,
        mensaje: `Hay ${urgentesSinAsignar.length} solicitud${urgentesSinAsignar.length > 1 ? 'es' : ''} urgente${urgentesSinAsignar.length > 1 ? 's' : ''} esperando asignación`,
        icono: AlertTriangle,
        color: 'red',
        acciones: urgentesSinAsignar.map(s => ({
          id: s.id,
          texto: `Ver solicitud ${s.servicio?.nombre || 'N/A'}`
        }))
      })
    }

    // Alertas por solicitudes pendientes antiguas (>2 horas)
    const pendientesAntiguas = solicitudes.filter(s => {
      if (s.estado !== 'pendiente') return false
      const horasPendiente = (new Date() - new Date(s.createdAt)) / (1000 * 60 * 60)
      return horasPendiente > 2
    })

    if (pendientesAntiguas.length > 0) {
      nuevasAlertas.push({
        id: 'pendientes-antiguas',
        tipo: 'advertencia',
        titulo: `${pendientesAntiguas.length} Solicitud${pendientesAntiguas.length > 1 ? 'es' : ''} Pendiente${pendientesAntiguas.length > 1 ? 's' : ''} Antigua${pendientesAntiguas.length > 1 ? 's' : ''}`,
        mensaje: `Hay ${pendientesAntiguas.length} solicitud${pendientesAntiguas.length > 1 ? 'es' : ''} pendiente${pendientesAntiguas.length > 1 ? 's' : ''} por más de 2 horas`,
        icono: Clock,
        color: 'orange',
        acciones: pendientesAntiguas.map(s => ({
          id: s.id,
          texto: `Revisar solicitud ${s.servicio?.nombre || 'N/A'}`
        }))
      })
    }

    // Alertas por solicitudes en proceso sin actividad (>4 horas)
    const sinActividad = solicitudes.filter(s => {
      if (s.estado !== 'en_proceso') return false
      const fechaUltimaActividad = s.fechaAsignacion || s.updatedAt
      const horasSinActividad = (new Date() - new Date(fechaUltimaActividad)) / (1000 * 60 * 60)
      return horasSinActividad > 4
    })

    if (sinActividad.length > 0) {
      nuevasAlertas.push({
        id: 'sin-actividad',
        tipo: 'info',
        titulo: `${sinActividad.length} Solicitud${sinActividad.length > 1 ? 'es' : ''} Sin Actividad`,
        mensaje: `Hay ${sinActividad.length} solicitud${sinActividad.length > 1 ? 'es' : ''} en proceso sin actividad por más de 4 horas`,
        icono: AlertCircle,
        color: 'blue',
        acciones: sinActividad.map(s => ({
          id: s.id,
          texto: `Revisar solicitud ${s.servicio?.nombre || 'N/A'}`
        }))
      })
    }

    setAlertas(nuevasAlertas)
  }

  const cargarRecordatorios = async () => {
    try {
      // Obtener recordatorios guardados del usuario
      const res = await api.get('/api/recordatorios', {
        params: { usuarioId: usuario.id }
      })
      setRecordatorios(res.data || [])
    } catch (error) {
      // Si no existe el endpoint, usar recordatorios locales
      const recordatoriosLocales = JSON.parse(localStorage.getItem(`recordatorios_${usuario.id}`) || '[]')
      setRecordatorios(recordatoriosLocales)
    }
  }

  const marcarAlertaLeida = (alertaId) => {
    setAlertas(prev => prev.filter(a => a.id !== alertaId))
    toast.success('Alerta marcada como leída')
  }

  const getColorClasses = (color) => {
    const colors = {
      red: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200',
      orange: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 text-orange-800 dark:text-orange-200',
      blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200',
      yellow: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200'
    }
    return colors[color] || colors.blue
  }

  if (!mostrarPanel || alertas.length === 0) return null

  return (
    <div className="fixed top-20 right-4 z-40 max-w-md w-full space-y-2">
      {alertas.map((alerta) => {
        const Icono = alerta.icono
        return (
          <div
            key={alerta.id}
            className={`${getColorClasses(alerta.color)} border-2 rounded-lg p-4 shadow-lg animate-slide-in-right transition-all duration-300`}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-1">
                <Icono className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm mb-1">{alerta.titulo}</h4>
                <p className="text-xs opacity-90 mb-2">{alerta.mensaje}</p>
                {alerta.acciones && alerta.acciones.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {alerta.acciones.slice(0, 3).map((accion) => (
                      <button
                        key={accion.id}
                        className="text-xs px-2 py-1 bg-white/50 dark:bg-black/20 rounded hover:bg-white/70 dark:hover:bg-black/40 transition"
                        onClick={() => {
                          // Scroll a la solicitud o abrir modal
                          const elemento = document.querySelector(`[data-solicitud-id="${accion.id}"]`)
                          if (elemento) {
                            elemento.scrollIntoView({ behavior: 'smooth', block: 'center' })
                            elemento.classList.add('ring-2', 'ring-primary-500', 'animate-pulse')
                            setTimeout(() => {
                              elemento.classList.remove('ring-2', 'ring-primary-500', 'animate-pulse')
                            }, 3000)
                          }
                        }}
                      >
                        {accion.texto}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={() => marcarAlertaLeida(alerta.id)}
                className="flex-shrink-0 text-current opacity-50 hover:opacity-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default AlertasPanel

