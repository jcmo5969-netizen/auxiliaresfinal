import axios from 'axios'
import { getItem, removeItem } from './storage'

// Configurar la URL base del API
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

// Log para debug (solo en desarrollo)
if (import.meta.env.DEV) {
  console.log('🔗 API URL configurada:', API_URL || 'NO CONFIGURADA - usando localhost:5000')
}

// Crear instancia de axios con configuración base
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
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
    if (error.response?.status === 401) {
      const currentHash = window.location.hash || ''
      removeItem('token')
      if (!currentHash.includes('/auxiliar/acceso')) {
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

