import axios from 'axios'
import { getItem, removeItem } from './storage'

/**
 * URL base del API.
 * - Si se define VITE_API_URL (frontend y backend en servicios separados), se usa esa.
 * - En producción sin variable: mismo origen (el backend también sirve el frontend).
 * - En desarrollo: backend local en el puerto 5000.
 */
export const API_URL = (
  import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000' : '')
).replace(/\/$/, '')

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  // En Render (plan gratuito) el servidor puede tardar ~1 minuto en despertar
  timeout: 70000
})

// Interceptor para agregar el token (storage seguro para iOS)
api.interceptors.request.use(
  (config) => {
    const token = getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Interceptor para manejar errores de autenticación
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const esLogin = String(error.config?.url || '').includes('/api/auth/login')
    if (error.response?.status === 401 && !esLogin) {
      const currentHash = window.location.hash || ''
      removeItem('token')
      if (!currentHash.includes('/auxiliar/acceso') && !currentHash.includes('/login')) {
        const base = (window.location.origin || '') + (window.location.pathname || '/')
        window.location.href = base + '#/login'
      }
    }
    // 503 = BD temporalmente en recovery mode; no redirigir, dejar que el
    // polling del Dashboard reintente automáticamente con backoff.
    return Promise.reject(error)
  }
)

export default api
