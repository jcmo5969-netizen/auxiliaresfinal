import { useState, useEffect } from 'react'
import { GripVertical, X, Plus, BarChart3, TrendingUp, Clock, Users, AlertCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const WIDGETS_DISPONIBLES = [
  { id: 'metricas-generales', nombre: 'Métricas Generales', icono: BarChart3, categoria: 'metricas' },
  { id: 'solicitudes-pendientes', nombre: 'Solicitudes Pendientes', icono: AlertCircle, categoria: 'solicitudes' },
  { id: 'tiempo-promedio', nombre: 'Tiempo Promedio', icono: Clock, categoria: 'metricas' },
  { id: 'auxiliares-activos', nombre: 'Auxiliares Activos', icono: Users, categoria: 'personal' },
  { id: 'tendencias', nombre: 'Tendencias', icono: TrendingUp, categoria: 'metricas' }
]

const WidgetConfig = ({ widgets, onWidgetsChange, onClose }) => {
  const { usuario } = useAuth()
  const [widgetsActivos, setWidgetsActivos] = useState(widgets || [])
  const [widgetsDisponibles, setWidgetsDisponibles] = useState([])

  useEffect(() => {
    // Cargar configuración guardada del usuario
    const configGuardada = localStorage.getItem(`dashboard_config_${usuario?.id}`)
    if (configGuardada) {
      try {
        const config = JSON.parse(configGuardada)
        setWidgetsActivos(config.widgets || widgets || [])
      } catch (error) {
        console.error('Error cargando configuración:', error)
      }
    }

    // Calcular widgets disponibles (los que no están activos)
    const idsActivos = new Set(widgetsActivos.map(w => w.id))
    setWidgetsDisponibles(WIDGETS_DISPONIBLES.filter(w => !idsActivos.has(w.id)))
  }, [usuario, widgets])

  const agregarWidget = (widget) => {
    const nuevoWidget = {
      ...widget,
      orden: widgetsActivos.length,
      visible: true
    }
    const nuevos = [...widgetsActivos, nuevoWidget]
    setWidgetsActivos(nuevos)
    guardarConfiguracion(nuevos)
    onWidgetsChange(nuevos)
  }

  const eliminarWidget = (id) => {
    const nuevos = widgetsActivos.filter(w => w.id !== id)
    setWidgetsActivos(nuevos)
    guardarConfiguracion(nuevos)
    onWidgetsChange(nuevos)
  }

  const toggleVisibilidad = (id) => {
    const nuevos = widgetsActivos.map(w =>
      w.id === id ? { ...w, visible: !w.visible } : w
    )
    setWidgetsActivos(nuevos)
    guardarConfiguracion(nuevos)
    onWidgetsChange(nuevos)
  }

  const moverWidget = (index, direccion) => {
    const nuevos = [...widgetsActivos]
    const nuevoIndex = direccion === 'up' ? index - 1 : index + 1
    
    if (nuevoIndex < 0 || nuevoIndex >= nuevos.length) return
    
    [nuevos[index], nuevos[nuevoIndex]] = [nuevos[nuevoIndex], nuevos[index]]
    
    // Actualizar orden
    nuevos.forEach((w, i) => {
      w.orden = i
    })
    
    setWidgetsActivos(nuevos)
    guardarConfiguracion(nuevos)
    onWidgetsChange(nuevos)
  }

  const guardarConfiguracion = (widgets) => {
    if (usuario?.id) {
      localStorage.setItem(`dashboard_config_${usuario.id}`, JSON.stringify({
        widgets,
        fechaActualizacion: new Date().toISOString()
      }))
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-xl">
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-6 h-6 text-white" />
            <h2 className="text-2xl font-bold text-white">Configurar Dashboard</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-lg p-2 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {/* Widgets Activos */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Widgets Activos ({widgetsActivos.length})
            </h3>
            {widgetsActivos.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No hay widgets configurados</p>
              </div>
            ) : (
              <div className="space-y-2">
                {widgetsActivos.map((widget, index) => {
                  const Icono = widget.icono || BarChart3
                  return (
                    <div
                      key={widget.id}
                      className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
                    >
                      <GripVertical className="w-5 h-5 text-gray-400 cursor-move" />
                      <Icono className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white">{widget.nombre}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Orden: {widget.orden + 1} • {widget.visible ? 'Visible' : 'Oculto'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => moverWidget(index, 'up')}
                          disabled={index === 0}
                          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30"
                          title="Mover arriba"
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => moverWidget(index, 'down')}
                          disabled={index === widgetsActivos.length - 1}
                          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30"
                          title="Mover abajo"
                        >
                          ↓
                        </button>
                        <button
                          onClick={() => toggleVisibilidad(widget.id)}
                          className={`px-2 py-1 text-xs rounded ${
                            widget.visible
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-300'
                          }`}
                        >
                          {widget.visible ? 'Visible' : 'Oculto'}
                        </button>
                        <button
                          onClick={() => eliminarWidget(widget.id)}
                          className="p-1 text-red-400 hover:text-red-600 dark:hover:text-red-300"
                          title="Eliminar"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Widgets Disponibles */}
          {widgetsDisponibles.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Agregar Widgets
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {widgetsDisponibles.map((widget) => {
                  const Icono = widget.icono
                  return (
                    <button
                      key={widget.id}
                      onClick={() => agregarWidget(widget)}
                      className="flex items-center gap-3 p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-primary-500 dark:hover:border-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition text-left"
                    >
                      <Icono className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white">{widget.nombre}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{widget.categoria}</p>
                      </div>
                      <Plus className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
          >
            Guardar y Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}

export default WidgetConfig

