import { useState, useEffect } from 'react'
import { X, FileText, Bed } from 'lucide-react'
import PlantillasModal from './PlantillasModal'
import CamaModal from './CamaModal'

const SolicitudModal = ({ servicios, onClose, onSubmit, servicioPredeterminado, onSolicitudCreada }) => {
  const [formData, setFormData] = useState({
    servicio: servicioPredeterminado || '',
    tipoRequerimiento: 'alta',
    tipoServicio: 'traslado_pcte',
    tipoTraslado: 'sin_silla_ni_camilla',
    prioridadInmediato: false,
    descripcion: '',
    prioridad: 'media',
    fechaProgramada: '',
    cama: ''
  })
  const [mostrarPlantillas, setMostrarPlantillas] = useState(false)
  const [mostrarCamaModal, setMostrarCamaModal] = useState(false)

  // Actualizar servicio si cambia servicioPredeterminado
  useEffect(() => {
    if (servicioPredeterminado) {
      setFormData(prev => ({ ...prev, servicio: servicioPredeterminado }))
    }
  }, [servicioPredeterminado])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (onSolicitudCreada) {
      await onSolicitudCreada(formData)
    } else if (onSubmit) {
      onSubmit(formData)
    }
    setFormData({
      servicio: servicioPredeterminado || '',
      tipoRequerimiento: 'alta',
      tipoServicio: 'traslado_pcte',
      tipoTraslado: 'sin_silla_ni_camilla',
      prioridadInmediato: false,
      descripcion: '',
      prioridad: 'media',
      fechaProgramada: '',
      cama: ''
    })
  }

  const handlePrioridadInmediato = (checked) => {
    setFormData(prev => ({
      ...prev,
      prioridadInmediato: checked,
      prioridad: checked ? 'urgente' : prev.prioridad
    }))
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full p-6 md:p-8 relative shadow-xl max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Nueva Solicitud</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Completa los datos mínimos para crear la solicitud.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMostrarCamaModal(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"
            >
              <Bed className="w-4 h-4" />
              Cama
            </button>
            <button
              type="button"
              onClick={() => setMostrarPlantillas(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"
            >
              <FileText className="w-4 h-4" />
              Plantillas
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Servicio <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.servicio}
              onChange={(e) => setFormData({ ...formData, servicio: e.target.value })}
              required
              disabled={servicios.length === 1 && servicioPredeterminado}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {servicios.length > 1 && <option value="">Selecciona un servicio</option>}
              {servicios.map((servicio) => (
                <option key={servicio.id || servicio._id} value={servicio.id || servicio._id}>
                  {servicio.nombre} - Piso {servicio.piso}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tipo de Requerimiento <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.tipoRequerimiento}
              onChange={(e) => setFormData({
                ...formData,
                tipoRequerimiento: e.target.value,
                tipoServicio: e.target.value === 'traslado' ? formData.tipoServicio : '',
                tipoTraslado: e.target.value === 'traslado' ? formData.tipoTraslado : ''
              })}
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="alta">Alta</option>
              <option value="traslado">Traslado</option>
              <option value="pabellon">Pabellón</option>
              <option value="otro">Otro</option>
            </select>
          </div>
          </div>

          {formData.tipoRequerimiento === 'traslado' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-700/40 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
              <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tipo de Servicio
            </label>
            <select
              value={formData.tipoServicio}
              onChange={(e) => setFormData({ ...formData, tipoServicio: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="traslado_pcte">TRASLADO DE PCTE</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tipo de Traslado
            </label>
            <select
              value={formData.tipoTraslado}
              onChange={(e) => setFormData({ ...formData, tipoTraslado: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="sin_silla_ni_camilla">Sin silla ni camilla</option>
              <option value="con_silla">Con silla de ruedas</option>
              <option value="con_camilla">Con camilla</option>
            </select>
          </div>
          </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Prioridad
            </label>
            <select
              value={formData.prioridad}
              onChange={(e) => setFormData({ ...formData, prioridad: e.target.value })}
              required
              disabled={formData.prioridadInmediato}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="baja">Baja</option>
              <option value="media">Media</option>
              <option value="alta">Alta</option>
              <option value="urgente">Urgente</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={formData.prioridadInmediato}
                onChange={(e) => handlePrioridadInmediato(e.target.checked)}
                className="h-4 w-4"
              />
              Prioridad Inmediato
            </label>
          </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Cama (opcional)
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMostrarCamaModal(true)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                {formData.cama ? 'Editar cama' : 'Agregar cama'}
              </button>
              {formData.cama && (
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  Cama: {formData.cama}
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Descripción (opcional)
            </label>
            <textarea
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              rows="3"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Detalles adicionales..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Fecha Programada (opcional)
            </label>
            <input
              type="date"
              value={formData.fechaProgramada}
              onChange={(e) => setFormData({ ...formData, fechaProgramada: e.target.value })}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Selecciona una fecha"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Si seleccionas una fecha, la solicitud aparecerá en el calendario y estará disponible para los auxiliares en esa fecha
            </p>
          </div>
          </div>

          <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-primary-700 dark:text-primary-300 mb-2">Resumen</h3>
            <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
              <div>Servicio: {formData.servicio ? 'Seleccionado' : 'Pendiente'}</div>
              <div>Tipo: {formData.tipoRequerimiento}</div>
              <div>Prioridad: {formData.prioridadInmediato ? 'Inmediato' : formData.prioridad}</div>
              {formData.tipoRequerimiento === 'traslado' && (
                <div>Traslado: {formData.tipoTraslado || 'Pendiente'}</div>
              )}
              {formData.cama && <div>Cama: {formData.cama}</div>}
              {formData.fechaProgramada && <div>Fecha: {formData.fechaProgramada}</div>}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
            >
              Crear Solicitud
            </button>
          </div>
        </form>
      </div>

      {mostrarPlantillas && (
        <PlantillasModal
          servicios={servicios}
          onClose={() => setMostrarPlantillas(false)}
          onSeleccionarPlantilla={(datos) => {
            setFormData(prev => ({
              ...prev,
              servicio: datos.servicio || prev.servicio,
              tipoRequerimiento: datos.tipoRequerimiento,
              prioridad: datos.prioridad,
              descripcion: datos.descripcion || prev.descripcion
            }))
            setMostrarPlantillas(false)
          }}
        />
      )}
      {mostrarCamaModal && (
        <CamaModal
          camaActual={formData.cama}
          onClose={() => setMostrarCamaModal(false)}
          onGuardar={(cama) => setFormData(prev => ({ ...prev, cama }))}
        />
      )}
    </div>
  )
}

export default SolicitudModal


