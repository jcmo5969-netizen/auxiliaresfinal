import { Search, Filter, X, Calendar } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'

const FiltrosSolicitudes = ({ solicitudes, onFiltroChange }) => {
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [filtroPrioridad, setFiltroPrioridad] = useState('todos')
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')
  const [mostrarFiltros, setMostrarFiltros] = useState(false)
  
  // Usar refs para evitar loops infinitos
  const solicitudesRef = useRef(solicitudes)
  const onFiltroChangeRef = useRef(onFiltroChange)
  
  // Actualizar refs cuando cambian
  useEffect(() => {
    solicitudesRef.current = solicitudes
  }, [solicitudes])
  
  useEffect(() => {
    onFiltroChangeRef.current = onFiltroChange
  }, [onFiltroChange])

  const aplicarFiltros = () => {
    let filtradas = [...solicitudesRef.current]

    // Filtro por búsqueda
    if (busqueda) {
      filtradas = filtradas.filter(s => 
        s.servicio?.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
        s.servicio?.piso?.toLowerCase().includes(busqueda.toLowerCase()) ||
        s.tipoRequerimiento?.toLowerCase().includes(busqueda.toLowerCase()) ||
        s.descripcion?.toLowerCase().includes(busqueda.toLowerCase())
      )
    }

    // Filtro por estado
    if (filtroEstado !== 'todos') {
      filtradas = filtradas.filter(s => s.estado === filtroEstado)
    }

    // Filtro por prioridad
    if (filtroPrioridad !== 'todos') {
      filtradas = filtradas.filter(s => s.prioridad === filtroPrioridad)
    }

    // Filtro por fecha inicio
    if (fechaInicio) {
      const fechaInicioObj = new Date(fechaInicio)
      fechaInicioObj.setHours(0, 0, 0, 0)
      filtradas = filtradas.filter(s => {
        const fechaSolicitud = new Date(s.createdAt)
        fechaSolicitud.setHours(0, 0, 0, 0)
        return fechaSolicitud >= fechaInicioObj
      })
    }

    // Filtro por fecha fin
    if (fechaFin) {
      const fechaFinObj = new Date(fechaFin)
      fechaFinObj.setHours(23, 59, 59, 999)
      filtradas = filtradas.filter(s => {
        const fechaSolicitud = new Date(s.createdAt)
        return fechaSolicitud <= fechaFinObj
      })
    }

    onFiltroChangeRef.current(filtradas)
  }

  const limpiarFiltros = () => {
    setBusqueda('')
    setFiltroEstado('todos')
    setFiltroPrioridad('todos')
    setFechaInicio('')
    setFechaFin('')
  }

  // Aplicar filtros cuando cambian los valores de filtro
  useEffect(() => {
    aplicarFiltros()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busqueda, filtroEstado, filtroPrioridad, fechaInicio, fechaFin])
  
  // Aplicar filtros cuando cambian las solicitudes (nueva pestaña)
  useEffect(() => {
    aplicarFiltros()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [solicitudes.length]) // Solo cuando cambia la cantidad de solicitudes

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        {/* Búsqueda */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por servicio, piso, tipo..."
            value={busqueda}
            onChange={(e) => {
              setBusqueda(e.target.value)
              aplicarFiltros()
            }}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        {/* Botón de filtros */}
        <button
          onClick={() => setMostrarFiltros(!mostrarFiltros)}
          className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition text-gray-700 dark:text-gray-300 w-full sm:w-auto"
        >
          <Filter className="w-5 h-5" />
          <span>Filtros</span>
        </button>

        {/* Limpiar filtros */}
        {(busqueda || filtroEstado !== 'todos' || filtroPrioridad !== 'todos' || fechaInicio || fechaFin) && (
          <button
            onClick={limpiarFiltros}
            className="flex items-center justify-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition w-full sm:w-auto"
          >
            <X className="w-5 h-5" />
            <span>Limpiar</span>
          </button>
        )}
      </div>

      {/* Panel de filtros expandible */}
      {mostrarFiltros && (
        <div className="mt-4 pt-4 border-t dark:border-gray-700 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Estado
            </label>
            <select
              value={filtroEstado}
              onChange={(e) => {
                setFiltroEstado(e.target.value)
                aplicarFiltros()
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="todos">Todos</option>
              <option value="pendiente">Pendiente</option>
              <option value="asignada">Asignada</option>
              <option value="en_proceso">En Proceso</option>
              <option value="completada">Completada</option>
              <option value="cancelada">Cancelada</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Prioridad
            </label>
            <select
              value={filtroPrioridad}
              onChange={(e) => {
                setFiltroPrioridad(e.target.value)
                aplicarFiltros()
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="todos">Todas</option>
              <option value="baja">Baja</option>
              <option value="media">Media</option>
              <option value="alta">Alta</option>
              <option value="urgente">Urgente</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Fecha Inicio
            </label>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => {
                setFechaInicio(e.target.value)
                aplicarFiltros()
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Fecha Fin
            </label>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => {
                setFechaFin(e.target.value)
                aplicarFiltros()
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default FiltrosSolicitudes

