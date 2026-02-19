import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import api from '../utils/api'
import toast from 'react-hot-toast'

const MiPerfilModal = ({ usuario, onClose, onGuardado }) => {
  const [formData, setFormData] = useState({ nombre: '', email: '', password: '' })
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    if (usuario) {
      setFormData({
        nombre: usuario.nombre || '',
        email: usuario.email || '',
        password: ''
      })
    }
  }, [usuario])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setGuardando(true)
    try {
      const payload = { nombre: formData.nombre.trim(), email: formData.email.trim() }
      if (formData.password && formData.password.length >= 6) payload.password = formData.password
      const res = await api.put('/api/auth/me', payload)
      toast.success('Perfil actualizado')
      if (onGuardado) onGuardado(res.data)
      onClose()
    } catch (error) {
      toast.error(error.response?.data?.mensaje || 'Error al actualizar el perfil')
    } finally {
      setGuardando(false)
    }
  }

  if (!usuario) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6 relative shadow-xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          aria-label="Cerrar"
        >
          <X className="w-6 h-6" />
        </button>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Modificar mi perfil</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre</label>
            <input
              type="text"
              value={formData.nombre}
              onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nueva contraseña (opcional)</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              minLength={6}
              placeholder="Dejar vacío para no cambiar"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300">
              Cancelar
            </button>
            <button type="submit" disabled={guardando} className="flex-1 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50">
              {guardando ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default MiPerfilModal
