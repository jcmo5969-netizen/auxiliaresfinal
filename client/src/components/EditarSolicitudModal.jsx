import { useState, useEffect } from 'react'
import { X, Bed } from 'lucide-react'
import api from '../utils/api'
import { fechaProgramadaParaEnviar } from '../utils/fechaHospital'
import toast from 'react-hot-toast'
import CamaModal from './CamaModal'

const EditarSolicitudModal = ({ solicitud, servicios = [], onClose, onGuardado }) => {
  const [formData, setFormData] = useState({
    servicio: '',
    tipoRequerimiento: 'alta',
    tipoServicio: 'traslado_pcte',
    tipoTraslado: 'sin_silla_ni_camilla',
    destinoGescas: '',
    prioridadInmediato: false,
    descripcion: '',
    prioridad: 'media',
    fechaProgramada: '',
    cama: '',
    precaucionesEstandar: false,
    tipoPrecaucion: ''
  })
  const [guardando, setGuardando] = useState(false)
  const [mostrarCamaModal, setMostrarCamaModal] = useState(false)

  // Solo inicializar cuando abre el modal (por id), para no borrar lo que escribe el usuario al re-renderizar
  const solicitudId = solicitud?.id ?? solicitud?._id
  useEffect(() => {
    if (!solicitud || solicitudId == null) return
    const servicioId = solicitud.servicioId ?? solicitud.servicio?.id
    const fp = solicitud.fechaProgramada
    let fechaStr = ''
    if (fp) {
      const d = typeof fp === 'string' ? new Date(fp) : fp
      if (d && !isNaN(d.getTime())) {
        const y = d.getFullYear()
        const m = String(d.getMonth() + 1).padStart(2, '0')
        const day = String(d.getDate()).padStart(2, '0')
        const h = String(d.getHours()).padStart(2, '0')
        const min = String(d.getMinutes()).padStart(2, '0')
        fechaStr = `${y}-${m}-${day}T${h}:${min}`
      }
    }
    setFormData({
      servicio: String(servicioId || ''),
      tipoRequerimiento: solicitud.tipoRequerimiento || 'alta',
      tipoServicio: solicitud.tipoServicio || 'traslado_pcte',
      tipoTraslado: solicitud.tipoTraslado || 'sin_silla_ni_camilla',
      destinoGescas: solicitud.destinoGescas || solicitud.destino_gescas || '',
      prioridadInmediato: Boolean(solicitud.prioridadInmediato),
      descripcion: solicitud.descripcion || '',
      prioridad: solicitud.prioridad || 'media',
      fechaProgramada: fechaStr,
      cama: solicitud.cama || '',
      precaucionesEstandar: Boolean(solicitud.precaucionesEstandar),
      tipoPrecaucion: solicitud.tipoPrecaucion || solicitud.tipo_precaucion || ''
    })
    // Solo re-sincronizar cuando cambia la solicitud (por id), no en cada re-render del padre
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [solicitudId])

  const handlePrioridadInmediato = (checked) => {
    setFormData(prev => ({
      ...prev,
      prioridadInmediato: checked,
      prioridad: checked ? 'urgente' : prev.prioridad
    }))
  }

  const buildPayload = () => {
    const payload = {
      servicioId: formData.servicio ? Number(formData.servicio) : undefined,
      tipoRequerimiento: formData.tipoRequerimiento,
      tipoServicio: formData.tipoRequerimiento === 'traslado' ? formData.tipoServicio : undefined,
      tipoTraslado: formData.tipoRequerimiento === 'traslado' ? formData.tipoTraslado : undefined,
      destinoGescas: formData.tipoRequerimiento === 'gescas' ? (formData.destinoGescas || null) : undefined,
      prioridadInmediato: formData.prioridadInmediato,
      descripcion: formData.descripcion || null,
      prioridad: formData.prioridad,
      cama: formData.cama || null,
      precaucionesEstandar: formData.precaucionesEstandar,
      tipoPrecaucion: formData.precaucionesEstandar ? (formData.tipoPrecaucion || null) : null
    }
    if (formData.fechaProgramada) {
      const iso = fechaProgramadaParaEnviar(formData.fechaProgramada)
      if (iso) payload.fechaProgramada = iso
    } else {
      payload.fechaProgramada = null
    }
    return payload
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const id = solicitud.id ?? solicitud._id
    if (!id) return
    setGuardando(true)
    try {
      await api.put(`/api/solicitudes/${id}`, buildPayload())
      toast.success('Solicitud actualizada')
      if (onGuardado) await onGuardado()
      onClose()
    } catch (error) {
      toast.error(error.response?.data?.mensaje || 'Error al modificar la solicitud')
    } finally {
      setGuardando(false)
    }
  }

  if (!solicitud) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full p-6 md:p-8 relative shadow-xl max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Modificar solicitud</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Edita los datos que necesites. No se modifica el estado ni la asignación.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setMostrarCamaModal(true)}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"
          >
            <Bed className="w-4 h-4" />
            Cama
          </button>
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
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Selecciona un servicio</option>
                {servicios.map((s) => (
                  <option key={s.id ?? s._id} value={s.id ?? s._id}>{s.nombre}</option>
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
                  tipoTraslado: e.target.value === 'traslado' ? formData.tipoTraslado : '',
                  destinoGescas: e.target.value === 'gescas' ? formData.destinoGescas : ''
                })}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="alta">Alta</option>
                <option value="traslado">Traslado</option>
                <option value="pabellon">Pabellón</option>
                <option value="gescas">GESCAS</option>
                <option value="otro">Otro</option>
              </select>
            </div>
          </div>

          {formData.tipoRequerimiento === 'traslado' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-700/40 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tipo de Servicio</label>
                <select
                  value={formData.tipoServicio}
                  onChange={(e) => setFormData({ ...formData, tipoServicio: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="traslado_pcte">TRASLADO DE PCTE</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tipo de Traslado</label>
                <select
                  value={formData.tipoTraslado}
                  onChange={(e) => setFormData({ ...formData, tipoTraslado: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="sin_silla_ni_camilla">Sin silla ni camilla</option>
                  <option value="con_silla">Con silla de ruedas</option>
                  <option value="con_camilla">Con camilla</option>
                </select>
              </div>
            </div>
          )}

          {formData.tipoRequerimiento === 'gescas' && (
            <div className="bg-gray-50 dark:bg-gray-700/40 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Destino GESCAS</label>
              <input
                type="text"
                value={formData.destinoGescas || ''}
                onChange={(e) => setFormData({ ...formData, destinoGescas: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Ej: UCI, Pabellón 3..."
              />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Prioridad</label>
              <select
                value={formData.prioridad}
                onChange={(e) => setFormData({ ...formData, prioridad: e.target.value })}
                disabled={formData.prioridadInmediato}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="baja">Baja</option>
                <option value="media">Media</option>
                <option value="alta">Alta</option>
                <option value="urgente">Urgente</option>
              </select>
            </div>
            <div className="flex items-center gap-3 pt-8">
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Precauciones adicionales</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="radio" name="precaucionesEstandarEdit" checked={formData.precaucionesEstandar === true} onChange={() => setFormData(prev => ({ ...prev, precaucionesEstandar: true }))} className="h-4 w-4" />
                  Sí
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="radio" name="precaucionesEstandarEdit" checked={formData.precaucionesEstandar === false} onChange={() => setFormData(prev => ({ ...prev, precaucionesEstandar: false, tipoPrecaucion: '' }))} className="h-4 w-4" />
                  No
                </label>
              </div>
            </div>
            {formData.precaucionesEstandar && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tipo de precaución</label>
                <select value={formData.tipoPrecaucion} onChange={(e) => setFormData(prev => ({ ...prev, tipoPrecaucion: e.target.value }))} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                  <option value="">Seleccione tipo</option>
                  <option value="contacto">Contacto</option>
                  <option value="gotas">Gotas</option>
                  <option value="aereas">Aéreas</option>
                  <option value="combinadas">Combinadas</option>
                  <option value="otra">Otra</option>
                </select>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Cama (opcional)</label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMostrarCamaModal(true)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                {formData.cama ? 'Editar cama' : 'Agregar cama'}
              </button>
              {formData.cama && <span className="text-sm text-gray-600 dark:text-gray-300">Cama: {formData.cama}</span>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Descripción (opcional)</label>
            <textarea
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              rows="3"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Detalles adicionales..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Fecha y hora programada (opcional)</label>
            <input
              type="datetime-local"
              value={formData.fechaProgramada || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, fechaProgramada: e.target.value || '' }))}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Los auxiliares podrán tomarla en cualquier momento.</p>
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
              disabled={guardando}
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50"
            >
              {guardando ? 'Guardando…' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>

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

export default EditarSolicitudModal
