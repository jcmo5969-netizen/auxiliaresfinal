import axios from 'axios'

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

// Interceptor para agregar el token de autenticación
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Interceptor para manejar errores de autenticación
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api

