import { useState, useEffect } from 'react'
import api from '../utils/api'
import toast from 'react-hot-toast'
import { Calendar, ChevronLeft, ChevronRight, MapPin, Clock } from 'lucide-react'

const CalendarioSolicitudes = ({ solicitudes }) => {
  const [fechaActual, setFechaActual] = useState(new Date())
  const [solicitudesSeleccionadas, setSolicitudesSeleccionadas] = useState([])

  const mesActual = fechaActual.getMonth()
  const añoActual = fechaActual.getFullYear()

  const primerDiaMes = new Date(añoActual, mesActual, 1)
  const ultimoDiaMes = new Date(añoActual, mesActual + 1, 0)
  const diasEnMes = ultimoDiaMes.getDate()
  const diaInicioSemana = primerDiaMes.getDay()

  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ]

  const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

  const cambiarMes = (direccion) => {
    setFechaActual(new Date(añoActual, mesActual + direccion, 1))
  }

  const obtenerSolicitudesDelDia = (dia) => {
    const fecha = new Date(añoActual, mesActual, dia)
    fecha.setHours(0, 0, 0, 0)
    return solicitudes.filter(s => {
      // Usar fechaProgramada si existe, sino usar createdAt
      const fechaSolicitud = s.fechaProgramada 
        ? new Date(s.fechaProgramada)
        : new Date(s.createdAt)
      fechaSolicitud.setHours(0, 0, 0, 0)
      return fechaSolicitud.getTime() === fecha.getTime()
    })
  }

  // Obtener solicitudes del día actual
  const obtenerSolicitudesHoy = () => {
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    return solicitudes.filter(s => {
      // Usar fechaProgramada si existe, sino usar createdAt
      const fechaSolicitud = s.fechaProgramada 
        ? new Date(s.fechaProgramada)
        : new Date(s.createdAt)
      fechaSolicitud.setHours(0, 0, 0, 0)
      return fechaSolicitud.getTime() === hoy.getTime()
    })
  }

  const seleccionarDia = (dia) => {
    const solicitudesDelDia = obtenerSolicitudesDelDia(dia)
    setSolicitudesSeleccionadas(solicitudesDelDia)
  }

  const getPrioridadColor = (prioridad) => {
    const colores = {
      urgente: 'bg-red-500',
      alta: 'bg-orange-500',
      media: 'bg-blue-500',
      baja: 'bg-gray-400'
    }
    return colores[prioridad] || 'bg-gray-400'
  }

  const solicitudesHoy = obtenerSolicitudesHoy()

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Calendar className="w-6 h-6 text-primary-600 dark:text-primary-400" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Calendario de Solicitudes</h2>
            {solicitudesHoy.length > 0 && (
              <p className="text-sm text-primary-600 dark:text-primary-400 mt-1">
                {solicitudesHoy.length} solicitud{solicitudesHoy.length !== 1 ? 'es' : ''} hoy
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => cambiarMes(-1)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <span className="text-lg font-semibold text-gray-900 dark:text-white min-w-[200px] text-center">
            {meses[mesActual]} {añoActual}
          </span>
          <button
            onClick={() => cambiarMes(1)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
          >
            <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 mb-4">
        {diasSemana.map((dia) => (
          <div
            key={dia}
            className="text-center font-semibold text-gray-600 dark:text-gray-400 py-2"
          >
            {dia}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: diaInicioSemana }).map((_, index) => (
          <div key={`empty-${index}`} className="aspect-square"></div>
        ))}
        {Array.from({ length: diasEnMes }).map((_, index) => {
          const dia = index + 1
          const solicitudesDelDia = obtenerSolicitudesDelDia(dia)
          const fechaDia = new Date(añoActual, mesActual, dia)
          const hoy = new Date()
          hoy.setHours(0, 0, 0, 0)
          fechaDia.setHours(0, 0, 0, 0)
          const esHoy = fechaDia.getTime() === hoy.getTime()
          const tieneUrgentes = solicitudesDelDia.some(s => s.prioridad === 'urgente')

          return (
            <button
              key={dia}
              onClick={() => seleccionarDia(dia)}
              className={`aspect-square p-2 rounded-lg border-2 transition relative ${
                esHoy
                  ? 'border-primary-600 dark:border-primary-400 bg-primary-50 dark:bg-primary-900/20 ring-2 ring-primary-300 dark:ring-primary-600'
                  : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600'
              } ${
                solicitudesDelDia.length > 0 
                  ? tieneUrgentes 
                    ? 'bg-red-50 dark:bg-red-900/20' 
                    : 'bg-blue-50 dark:bg-blue-900/20'
                  : 'bg-white dark:bg-gray-800'
              }`}
            >
              <div className={`text-sm font-semibold mb-1 ${
                esHoy ? 'text-primary-700 dark:text-primary-300' : 'text-gray-900 dark:text-white'
              }`}>
                {dia}
              </div>
              {solicitudesDelDia.length > 0 && (
                <div className="flex flex-wrap gap-1 items-center">
                  {solicitudesDelDia.slice(0, 3).map((s) => (
                    <div
                      key={s.id}
                      className={`w-2 h-2 rounded-full ${getPrioridadColor(s.prioridad)}`}
                      title={`${s.tipoRequerimiento} - ${s.prioridad}`}
                    ></div>
                  ))}
                  {solicitudesDelDia.length > 3 && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 font-semibold">
                      +{solicitudesDelDia.length - 3}
                    </div>
                  )}
                </div>
              )}
              {esHoy && (
                <div className="absolute top-1 right-1 w-2 h-2 bg-primary-600 dark:bg-primary-400 rounded-full"></div>
              )}
            </button>
          )
        })}
      </div>

      {/* Solicitudes del día seleccionado */}
      {solicitudesSeleccionadas.length > 0 && (
        <div className="mt-6 pt-6 border-t dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
            Solicitudes del día seleccionado ({solicitudesSeleccionadas.length})
          </h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {solicitudesSeleccionadas.map((solicitud) => {
              const fechaDia = new Date(añoActual, mesActual, solicitudesSeleccionadas[0] ? new Date(solicitudesSeleccionadas[0].createdAt).getDate() : new Date().getDate())
              const esHoy = fechaDia.toDateString() === new Date().toDateString()
              
              return (
                <div
                  key={solicitud.id}
                  className={`p-3 rounded-lg ${
                    esHoy 
                      ? 'bg-primary-50 dark:bg-primary-900/20 border-l-4 border-primary-600 dark:border-primary-400'
                      : 'bg-gray-50 dark:bg-gray-700/50'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-3 h-3 rounded-full ${getPrioridadColor(solicitud.prioridad)}`}></div>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {solicitud.servicio?.nombre}
                    </span>
                    {solicitud.prioridad === 'urgente' && (
                      <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded text-xs font-semibold">
                        URGENTE
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      <span>Piso {solicitud.servicio?.piso}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(solicitud.createdAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      solicitud.estado === 'pendiente' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300' :
                      solicitud.estado === 'en_proceso' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300' :
                      'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                    }`}>
                      {solicitud.estado.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default CalendarioSolicitudes

