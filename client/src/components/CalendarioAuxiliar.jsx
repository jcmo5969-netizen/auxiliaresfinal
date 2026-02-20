import { useState } from 'react'
import { Calendar, ChevronLeft, ChevronRight, MapPin, Clock, User, CheckCircle } from 'lucide-react'

const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

const CalendarioAuxiliar = ({
  solicitudesPendientes = [],
  solicitudesAsignadas = [],
  onAsignar,
  onCompletar,
  getTipoIcon,
  getPrioridadColor
}) => {
  const [fechaActual, setFechaActual] = useState(new Date())
  const [diaSeleccionado, setDiaSeleccionado] = useState(null)

  const mesActual = fechaActual.getMonth()
  const añoActual = fechaActual.getFullYear()
  const primerDiaMes = new Date(añoActual, mesActual, 1)
  const ultimoDiaMes = new Date(añoActual, mesActual + 1, 0)
  const diasEnMes = ultimoDiaMes.getDate()
  const diaInicioSemana = primerDiaMes.getDay()

  const todasParaCalendario = [
    ...solicitudesPendientes.map(s => ({ ...s, _estado: 'pendiente' })),
    ...solicitudesAsignadas.map(s => ({ ...s, _estado: 'asignada' }))
  ]

  const getFechaSolicitud = (s) => {
    if (s.fechaProgramada) {
      const d = new Date(s.fechaProgramada)
      return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
    }
    return new Date(s.createdAt)
  }

  const obtenerSolicitudesDelDia = (dia) => {
    const fecha = new Date(añoActual, mesActual, dia)
    fecha.setHours(0, 0, 0, 0)
    return todasParaCalendario.filter(s => {
      const f = getFechaSolicitud(s)
      f.setHours(0, 0, 0, 0)
      return f.getTime() === fecha.getTime()
    })
  }

  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)

  const esDiaDisponibleParaAsignar = (dia) => {
    const fecha = new Date(añoActual, mesActual, dia)
    fecha.setHours(0, 0, 0, 0)
    return fecha.getTime() <= hoy.getTime()
  }

  const seleccionarDia = (dia) => {
    setDiaSeleccionado(dia)
  }

  const solicitudesDelDiaSeleccionado = diaSeleccionado !== null ? obtenerSolicitudesDelDia(diaSeleccionado) : []
  const fechaSeleccionada = diaSeleccionado !== null ? new Date(añoActual, mesActual, diaSeleccionado) : null
  const fechaSelNorm = fechaSeleccionada ? (() => { const d = new Date(fechaSeleccionada); d.setHours(0, 0, 0, 0); return d; })() : null
  const puedeAsignarEnDiaSeleccionado = fechaSelNorm && fechaSelNorm.getTime() <= hoy.getTime()

  const getP = (prioridad) => {
    const colores = {
      urgente: 'bg-red-500',
      alta: 'bg-orange-500',
      media: 'bg-blue-500',
      baja: 'bg-gray-400'
    }
    return colores[prioridad] || 'bg-gray-400'
  }
  const getPC = (prioridad) => {
    const colores = {
      urgente: 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200',
      alta: 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-800 dark:text-orange-200',
      media: 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200',
      baja: 'border-gray-400 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
    }
    return colores[prioridad] || 'border-gray-400 bg-gray-50'
  }
  const getIcon = (tipo) => {
    const icons = { alta: '🏥', traslado: '🚶', pabellon: '⚕️', otro: '📋' }
    return icons[tipo] || '📋'
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-6 h-6 text-primary-600 dark:text-primary-400" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Calendario de solicitudes</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFechaActual(new Date(añoActual, mesActual - 1, 1))}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <span className="text-base font-semibold text-gray-900 dark:text-white min-w-[160px] text-center">
            {meses[mesActual]} {añoActual}
          </span>
          <button
            type="button"
            onClick={() => setFechaActual(new Date(añoActual, mesActual + 1, 1))}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
          >
            <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Toca un día para ver las solicitudes. Cuando llegue el día podrás asignarte y completar el traslado.
      </p>

      <div className="overflow-x-auto">
        <div className="min-w-[280px] grid grid-cols-7 gap-1 mb-4">
          {diasSemana.map((d) => (
            <div key={d} className="text-center font-semibold text-gray-600 dark:text-gray-400 py-1 text-xs">
              {d}
            </div>
          ))}
          {Array.from({ length: diaInicioSemana }).map((_, i) => (
            <div key={`e-${i}`} className="aspect-square" />
          ))}
          {Array.from({ length: diasEnMes }).map((_, i) => {
            const dia = i + 1
            const list = obtenerSolicitudesDelDia(dia)
            const fechaDia = new Date(añoActual, mesActual, dia)
            fechaDia.setHours(0, 0, 0, 0)
            const esHoy = fechaDia.getTime() === hoy.getTime()
            const disponible = esDiaDisponibleParaAsignar(dia)
            const seleccionado = diaSeleccionado === dia

            return (
              <button
                key={dia}
                type="button"
                onClick={() => seleccionarDia(dia)}
                className={`aspect-square p-1 rounded-lg border-2 transition text-sm font-semibold ${
                  seleccionado
                    ? 'border-primary-600 bg-primary-100 dark:bg-primary-900/40 text-primary-800 dark:text-primary-200 ring-2 ring-primary-400'
                    : esHoy
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                      : list.length > 0
                        ? 'border-gray-300 dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 text-gray-900 dark:text-white'
                        : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {dia}
                {list.length > 0 && (
                  <span className="block text-xs font-normal mt-0.5">{list.length}</span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {solicitudesDelDiaSeleccionado.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
            {fechaSeleccionada && fechaSeleccionada.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
            {!puedeAsignarEnDiaSeleccionado && (
              <span className="ml-2 text-sm font-normal text-amber-600 dark:text-amber-400">
                (al llegar el día podrás asignarte y completar)
              </span>
            )}
          </h3>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {solicitudesDelDiaSeleccionado.map((solicitud) => {
              const esPendiente = solicitud._estado === 'pendiente' || solicitud.estado === 'pendiente'
              const esMiaEnProceso = solicitud.estado === 'en_proceso'
              const id = solicitud.id || solicitud._id

              return (
                <div
                  key={id}
                  className={`p-4 rounded-xl border-l-4 ${getPC(solicitud.prioridad)}`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{getTipoIcon ? getTipoIcon(solicitud.tipoRequerimiento) : getIcon(solicitud.tipoRequerimiento)}</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {solicitud.servicio?.nombre}
                    </span>
                    {solicitud.prioridad === 'urgente' && (
                      <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 rounded text-xs font-semibold">
                        URGENTE
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 dark:text-gray-400 mb-3">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {solicitud.servicio?.nombre}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {solicitud.createdAt && new Date(solicitud.createdAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" /> {solicitud.solicitadoPor?.nombre || 'N/A'}
                    </span>
                  </div>
                  {solicitud.descripcion && (
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">{solicitud.descripcion}</p>
                  )}
                  {puedeAsignarEnDiaSeleccionado && (
                    <div className="flex gap-2">
                      {esPendiente && onAsignar && (
                        <button
                          type="button"
                          onClick={() => onAsignar(id)}
                          className="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition"
                        >
                          Asignarme
                        </button>
                      )}
                      {esMiaEnProceso && onCompletar && (
                        <button
                          type="button"
                          onClick={() => onCompletar(id)}
                          className="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Completar traslado
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default CalendarioAuxiliar
