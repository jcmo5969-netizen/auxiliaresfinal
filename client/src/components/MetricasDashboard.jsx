import { useState, useEffect } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { BarChart3, TrendingUp, Clock, Users, Activity, Download, Filter } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart
} from 'recharts'

const MetricasDashboard = () => {
  const { isDark } = useTheme()
  const [metricas, setMetricas] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [rangoFecha, setRangoFecha] = useState('30') // días
  const [tipoGrafico, setTipoGrafico] = useState('linea') // linea, area, barra

  useEffect(() => {
    cargarMetricas()
  }, [rangoFecha])

  const cargarMetricas = async () => {
    try {
      const fechaFin = new Date()
      const fechaInicio = new Date()
      fechaInicio.setDate(fechaInicio.getDate() - parseInt(rangoFecha))

      const res = await axios.get('/api/metricas/dashboard', {
        params: {
          fechaInicio: fechaInicio.toISOString(),
          fechaFin: fechaFin.toISOString()
        }
      })
      setMetricas(res.data)
    } catch (error) {
      toast.error('Error cargando métricas')
      console.error(error)
    } finally {
      setCargando(false)
    }
  }

  if (cargando) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent mx-auto"></div>
      </div>
    )
  }

  if (!metricas) return null

  const formatearTiempo = (minutos) => {
    if (minutos < 60) return `${Math.round(minutos)} min`
    const horas = Math.floor(minutos / 60)
    const mins = Math.round(minutos % 60)
    return `${horas}h ${mins}min`
  }

  // Colores para gráficos (adaptados para modo oscuro)
  const COLORS = {
    prioridad: {
      urgente: '#EF4444',
      alta: '#F97316',
      media: '#3B82F6',
      baja: '#9CA3AF'
    },
    tipo: {
      alta: '#3B82F6',
      traslado: '#10B981',
      pabellon: '#8B5CF6',
      otro: '#6B7280'
    },
    gradientes: {
      azul: ['#3B82F6', '#1D4ED8'],
      verde: ['#10B981', '#059669'],
      morado: ['#8B5CF6', '#7C3AED'],
      naranja: ['#F97316', '#EA580C']
    }
  }

  // Tooltip personalizado
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className={`p-3 rounded-lg shadow-lg border ${
          isDark 
            ? 'bg-gray-800 border-gray-700 text-white' 
            : 'bg-white border-gray-200 text-gray-900'
        }`}>
          <p className="font-semibold mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: <span className="font-bold">{entry.value}</span>
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  // Preparar datos para gráficos
  const datosLinea = metricas.solicitudesPorDia?.map(d => ({
    fecha: new Date(d.fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }),
    cantidad: d.cantidad
  })) || []

  const datosTiemposRespuesta = metricas.tiemposRespuestaPorDia?.map(d => ({
    fecha: new Date(d.fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }),
    minutos: d.tiempoPromedio,
    fechaOriginal: d.fecha
  })) || []

  const datosTiemposCompletado = metricas.tiemposCompletadoPorDia?.map(d => ({
    fecha: new Date(d.fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }),
    minutos: d.tiempoPromedio,
    fechaOriginal: d.fecha
  })) || []

  // Combinar datos de tiempos para el gráfico combinado
  const datosTiemposCombinados = (() => {
    const mapa = new Map()
    
    datosTiemposRespuesta.forEach(item => {
      const fecha = item.fechaOriginal || item.fecha
      if (!mapa.has(fecha)) {
        mapa.set(fecha, { fecha: item.fecha, respuesta: item.minutos, completado: null })
      } else {
        mapa.get(fecha).respuesta = item.minutos
      }
    })
    
    datosTiemposCompletado.forEach(item => {
      const fecha = item.fechaOriginal || item.fecha
      if (!mapa.has(fecha)) {
        mapa.set(fecha, { fecha: item.fecha, respuesta: null, completado: item.minutos })
      } else {
        mapa.get(fecha).completado = item.minutos
      }
    })
    
    return Array.from(mapa.values()).sort((a, b) => 
      new Date(a.fecha) - new Date(b.fecha)
    )
  })()

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
            <BarChart3 className="w-6 h-6 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Métricas y Estadísticas</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Análisis detallado del rendimiento</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={rangoFecha}
            onChange={(e) => setRangoFecha(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
          >
            <option value="7">Últimos 7 días</option>
            <option value="30">Últimos 30 días</option>
            <option value="90">Últimos 90 días</option>
          </select>
        </div>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium mb-1">Tiempo Promedio</p>
              <p className="text-3xl font-bold">
                {formatearTiempo(metricas.generales.tiempoPromedioMinutos)}
              </p>
              <p className="text-blue-100 text-xs mt-2">Por solicitud</p>
            </div>
            <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
              <Clock className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-5 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium mb-1">Completadas</p>
              <p className="text-3xl font-bold">{metricas.generales.completadas}</p>
              <p className="text-green-100 text-xs mt-2">
                {metricas.generales.total > 0 
                  ? `${Math.round((metricas.generales.completadas / metricas.generales.total) * 100)}% del total`
                  : '0% del total'}
              </p>
            </div>
            <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
              <TrendingUp className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-5 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium mb-1">En Proceso</p>
              <p className="text-3xl font-bold">{metricas.generales.enProceso}</p>
              <p className="text-purple-100 text-xs mt-2">Activas ahora</p>
            </div>
            <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
              <Activity className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-5 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm font-medium mb-1">Pendientes</p>
              <p className="text-3xl font-bold">{metricas.generales.pendientes}</p>
              <p className="text-orange-100 text-xs mt-2">Esperando asignación</p>
            </div>
            <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
              <Users className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Gráfico de líneas - Solicitudes por día */}
      {datosLinea.length > 0 && (
        <div className={`${isDark ? 'bg-gray-700/50' : 'bg-gray-50'} rounded-xl p-6 border ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Solicitudes por Día</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setTipoGrafico('linea')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                  tipoGrafico === 'linea'
                    ? 'bg-primary-600 text-white'
                    : isDark ? 'bg-gray-600 text-gray-300 hover:bg-gray-500' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Línea
              </button>
              <button
                onClick={() => setTipoGrafico('area')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                  tipoGrafico === 'area'
                    ? 'bg-primary-600 text-white'
                    : isDark ? 'bg-gray-600 text-gray-300 hover:bg-gray-500' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Área
              </button>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={350}>
            {tipoGrafico === 'area' ? (
              <AreaChart data={datosLinea}>
                <defs>
                  <linearGradient id="colorCantidad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#4B5563' : '#e0e0e0'} />
                <XAxis 
                  dataKey="fecha" 
                  stroke={isDark ? '#9CA3AF' : '#666'}
                  tick={{ fill: isDark ? '#9CA3AF' : '#666' }}
                />
                <YAxis 
                  stroke={isDark ? '#9CA3AF' : '#666'}
                  tick={{ fill: isDark ? '#9CA3AF' : '#666' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ color: isDark ? '#fff' : '#000' }} />
                <Area 
                  type="monotone" 
                  dataKey="cantidad" 
                  stroke="#3B82F6" 
                  strokeWidth={3}
                  fill="url(#colorCantidad)"
                  name="Solicitudes"
                  animationDuration={1000}
                />
              </AreaChart>
            ) : (
              <LineChart data={datosLinea}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#4B5563' : '#e0e0e0'} />
                <XAxis 
                  dataKey="fecha" 
                  stroke={isDark ? '#9CA3AF' : '#666'}
                  tick={{ fill: isDark ? '#9CA3AF' : '#666' }}
                />
                <YAxis 
                  stroke={isDark ? '#9CA3AF' : '#666'}
                  tick={{ fill: isDark ? '#9CA3AF' : '#666' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ color: isDark ? '#fff' : '#000' }} />
                <Line 
                  type="monotone" 
                  dataKey="cantidad" 
                  stroke="#3B82F6" 
                  strokeWidth={3}
                  dot={{ fill: '#3B82F6', r: 5 }}
                  activeDot={{ r: 7 }}
                  name="Solicitudes"
                  animationDuration={1000}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      )}

      {/* Gráfico de barras - Por Prioridad */}
      {metricas.porPrioridad?.length > 0 && (
        <div className={`${isDark ? 'bg-gray-700/50' : 'bg-gray-50'} rounded-xl p-6 border ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Distribución por Prioridad</h3>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={metricas.porPrioridad}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#4B5563' : '#e0e0e0'} />
              <XAxis 
                dataKey="prioridad" 
                stroke={isDark ? '#9CA3AF' : '#666'}
                tick={{ fill: isDark ? '#9CA3AF' : '#666' }}
              />
              <YAxis 
                stroke={isDark ? '#9CA3AF' : '#666'}
                tick={{ fill: isDark ? '#9CA3AF' : '#666' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ color: isDark ? '#fff' : '#000' }} />
              <Bar 
                dataKey="cantidad" 
                name="Cantidad"
                radius={[8, 8, 0, 0]}
                animationDuration={1000}
              >
                {metricas.porPrioridad.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS.prioridad[entry.prioridad] || '#9CA3AF'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Gráfico de pastel - Por Tipo */}
      {metricas.porTipo?.length > 0 && (
        <div className={`${isDark ? 'bg-gray-700/50' : 'bg-gray-50'} rounded-xl p-6 border ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Distribución por Tipo de Requerimiento</h3>
          <div className="flex flex-col lg:flex-row items-center gap-6">
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={metricas.porTipo.map(item => ({
                    ...item,
                    porcentaje: metricas.generales.total > 0 
                      ? Math.round((item.cantidad / metricas.generales.total) * 100)
                      : 0
                  }))}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ tipo, porcentaje }) => `${tipo}: ${porcentaje}%`}
                  outerRadius={120}
                  innerRadius={60}
                  fill="#8884d8"
                  dataKey="cantidad"
                  animationDuration={1000}
                >
                  {metricas.porTipo.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS.tipo[entry.tipo] || '#6B7280'} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-3 w-full lg:w-auto">
              {metricas.porTipo.map((entry, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg">
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: COLORS.tipo[entry.tipo] || '#6B7280' }}
                  />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white capitalize">{entry.tipo}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {entry.cantidad} solicitudes
                    </p>
                  </div>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {metricas.generales.total > 0 
                      ? `${Math.round((entry.cantidad / metricas.generales.total) * 100)}%`
                      : '0%'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Gráfico combinado - Tiempos de respuesta y completado */}
      {datosTiemposCombinados.length > 0 && (
        <div className={`${isDark ? 'bg-gray-700/50' : 'bg-gray-50'} rounded-xl p-6 border ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Análisis de Tiempos</h3>
          <ResponsiveContainer width="100%" height={350}>
            <ComposedChart data={datosTiemposCombinados}>
              <defs>
                <linearGradient id="colorRespuesta" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="colorCompletado" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#4B5563' : '#e0e0e0'} />
              <XAxis 
                dataKey="fecha" 
                stroke={isDark ? '#9CA3AF' : '#666'}
                tick={{ fill: isDark ? '#9CA3AF' : '#666' }}
              />
              <YAxis 
                stroke={isDark ? '#9CA3AF' : '#666'}
                tick={{ fill: isDark ? '#9CA3AF' : '#666' }}
                label={{ value: 'Minutos', angle: -90, position: 'insideLeft', fill: isDark ? '#9CA3AF' : '#666' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ color: isDark ? '#fff' : '#000' }} />
              {datosTiemposRespuesta.length > 0 && (
                <Area
                  type="monotone"
                  dataKey="respuesta"
                  fill="url(#colorRespuesta)"
                  stroke="#10B981"
                  strokeWidth={2}
                  name="Tiempo de Respuesta"
                  animationDuration={1000}
                />
              )}
              {datosTiemposCompletado.length > 0 && (
                <Line
                  type="monotone"
                  dataKey="completado"
                  stroke="#8B5CF6"
                  strokeWidth={3}
                  dot={{ fill: '#8B5CF6', r: 5 }}
                  activeDot={{ r: 7 }}
                  name="Tiempo de Completado"
                  animationDuration={1000}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Auxiliares más activos */}
      {metricas.auxiliaresActivos?.length > 0 && (
        <div className={`${isDark ? 'bg-gray-700/50' : 'bg-gray-50'} rounded-xl p-6 border ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Auxiliares Más Activos</h3>
          <div className="space-y-3">
            {metricas.auxiliaresActivos.map((item, index) => {
              const porcentaje = metricas.generales.completadas > 0 
                ? Math.round((item.completadas / metricas.generales.completadas) * 100)
                : 0
              return (
                <div 
                  key={item.auxiliar.id} 
                  className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white ${
                      index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' :
                      index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500' :
                      index === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600' :
                      'bg-gradient-to-br from-primary-500 to-primary-600'
                    }`}>
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 dark:text-white">{item.auxiliar.nombre}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{item.auxiliar.email}</p>
                      <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-primary-500 to-primary-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${porcentaje}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-3xl font-bold text-primary-600 dark:text-primary-400">
                      {item.completadas}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {porcentaje}% del total
                    </p>
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

export default MetricasDashboard
