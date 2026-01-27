import { createContext, useContext, useState, useEffect } from 'react'
import api from '../utils/api'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    // No cargar usuario automáticamente si estamos en /auxiliar/acceso
    // para evitar redirecciones no deseadas y conflictos con la autenticación local
    const currentHash = window.location.hash || window.location.pathname
    const isAuxiliarAcceso = currentHash.includes('/auxiliar/acceso') || 
                            window.location.pathname.includes('/auxiliar/acceso')
    
    if (token && !isAuxiliarAcceso) {
      cargarUsuario()
    } else {
      // Si estamos en /auxiliar/acceso, no cargar usuario automáticamente
      // para evitar interferencias con la autenticación local del componente
      setCargando(false)
    }
  }, [])

  const cargarUsuario = async () => {
    try {
      const res = await api.get('/api/auth/me')
      console.log('👤 Usuario cargado:', res.data)
      setUsuario(res.data)
    } catch (error) {
      console.error('❌ Error cargando usuario:', error)
      localStorage.removeItem('token')
    } finally {
      setCargando(false)
    }
  }

  const login = async (email, password) => {
    const res = await api.post('/api/auth/login', { email, password })
    const { token, usuario } = res.data
    localStorage.setItem('token', token)
    setUsuario(usuario)
    return usuario
  }

  const logout = () => {
    localStorage.removeItem('token')
    setUsuario(null)
  }

  const value = {
    usuario,
    login,
    logout,
    cargando
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}


