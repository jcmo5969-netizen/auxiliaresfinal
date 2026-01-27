import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import toast from 'react-hot-toast'
import { LogIn, Moon, Sun } from 'lucide-react'
import axios from 'axios'
import Logo from '../components/Logo'

const Login = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [cargando, setCargando] = useState(false)
  const { login, usuario } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const navigate = useNavigate()
  
  // Si ya está autenticado, redirigir según su rol
  useEffect(() => {
    if (usuario && !onLoginSuccess) {
      // Solo redirigir si no estamos en una página específica de login
      const currentPath = window.location.pathname
      if (currentPath === '/login') {
        if (usuario.rol === 'auxiliar') {
          navigate('/auxiliar/acceso', { replace: true })
        } else if (usuario.rol === 'enfermeria') {
          navigate('/enfermeria/dashboard', { replace: true })
        } else {
          navigate('/dashboard', { replace: true })
        }
      }
    }
  }, [usuario, navigate, onLoginSuccess])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setCargando(true)

    try {
      if (onLoginSuccess) {
        // Login directo para auxiliares
        const res = await axios.post('/api/auth/login', { email, password })
        const { token, usuario } = res.data
        if (usuario.rol !== 'auxiliar') {
          toast.error('Solo los auxiliares pueden acceder desde aquí')
          return
        }
        localStorage.setItem('token', token)
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
        onLoginSuccess(token)
        toast.success('Inicio de sesión exitoso')
      } else {
        // Login normal - redirigir según rol
        const usuario = await login(email, password)
        toast.success('Inicio de sesión exitoso')
        
        // Redirigir según el rol del usuario
        if (usuario.rol === 'auxiliar') {
          navigate('/auxiliar/acceso')
        } else if (usuario.rol === 'enfermeria') {
          navigate('/enfermeria/dashboard')
        } else {
          navigate('/dashboard')
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.mensaje || 'Error al iniciar sesión')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 to-primary-700 dark:from-gray-900 dark:to-gray-800 px-4 transition-colors duration-300">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 transition-colors duration-300">
        {/* Botón de modo oscuro */}
        <div className="flex justify-end mb-4">
          <button
            onClick={toggleTheme}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title={isDark ? 'Modo claro' : 'Modo oscuro'}
          >
            {isDark ? (
              <Sun className="w-5 h-5 text-yellow-500" />
            ) : (
              <Moon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            )}
          </button>
        </div>
        
        <div className="text-center mb-8">
          <Logo size="default" className="mb-6" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Sistema de Auxiliares</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Inicia sesión para continuar</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
              placeholder="tu@email.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={cargando}
            className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cargando ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>

        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-800 dark:text-blue-300">
            <strong>Credenciales por defecto:</strong><br />
            Email: admin@sistema.com<br />
            Password: admin123
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login

