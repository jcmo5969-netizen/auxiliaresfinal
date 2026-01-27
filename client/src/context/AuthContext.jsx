import { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

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
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      cargarUsuario()
    } else {
      setCargando(false)
    }
  }, [])

  const cargarUsuario = async () => {
    try {
      const res = await axios.get('/api/auth/me')
      console.log('👤 Usuario cargado:', res.data)
      setUsuario(res.data)
    } catch (error) {
      console.error('❌ Error cargando usuario:', error)
      localStorage.removeItem('token')
      delete axios.defaults.headers.common['Authorization']
    } finally {
      setCargando(false)
    }
  }

  const login = async (email, password) => {
    const res = await axios.post('/api/auth/login', { email, password })
    const { token, usuario } = res.data
    localStorage.setItem('token', token)
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    setUsuario(usuario)
    return usuario
  }

  const logout = () => {
    localStorage.removeItem('token')
    delete axios.defaults.headers.common['Authorization']
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


