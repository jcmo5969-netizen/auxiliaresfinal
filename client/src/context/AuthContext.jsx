import { createContext, useContext, useState, useEffect } from 'react'
import api from '../utils/api'
import { getItem, setItem, removeItem } from '../utils/storage'

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
    const token = getItem('token')
    const currentHash = window.location.hash || window.location.pathname
    const isAuxiliarAcceso = currentHash.includes('/auxiliar/acceso') || 
                            (typeof window.location.pathname === 'string' && window.location.pathname.includes('/auxiliar/acceso'))
    
    if (token && !isAuxiliarAcceso) {
      cargarUsuario()
    } else {
      setCargando(false)
    }
  }, [])

  const cargarUsuario = async () => {
    try {
      const res = await api.get('/api/auth/me')
      if (import.meta.env.DEV) console.log('👤 Usuario cargado:', res.data)
      setUsuario(res.data)
    } catch (error) {
      if (import.meta.env.DEV) console.error('❌ Error cargando usuario:', error)
      removeItem('token')
    } finally {
      setCargando(false)
    }
  }

  const login = async (email, password) => {
    const res = await api.post('/api/auth/login', { email, password })
    const { token, usuario } = res.data
    setItem('token', token)
    setUsuario(usuario)
    return usuario
  }

  const logout = () => {
    removeItem('token')
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


