import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import TarjetaLogin from '../components/TarjetaLogin'

const rutaPorRol = (rol) => {
  if (rol === 'auxiliar') return '/auxiliar/acceso'
  if (rol === 'enfermeria') return '/enfermeria/dashboard'
  return '/dashboard'
}

export const mensajeErrorLogin = (error) => {
  if (error.response?.status === 429) {
    return error.response.data?.mensaje || 'Demasiados intentos. Espera unos minutos.'
  }
  if (error.response) {
    return error.response.data?.mensaje || error.response.data?.errores?.[0]?.msg || 'Error al iniciar sesión'
  }
  if (error.code === 'ECONNABORTED') {
    return 'El servidor está tardando en responder. Inténtalo de nuevo en unos segundos.'
  }
  return 'No hay conexión con el servidor. Revisa tu internet e inténtalo de nuevo.'
}

const Login = () => {
  const { login, usuario } = useAuth()
  const navigate = useNavigate()

  // Si ya hay sesión, ir directo a la pantalla del rol
  useEffect(() => {
    if (usuario) navigate(rutaPorRol(usuario.rol), { replace: true })
  }, [usuario, navigate])

  const iniciarSesion = async (email, password) => {
    try {
      const u = await login(email, password)
      toast.success(`Bienvenido, ${u.nombre}`)
      navigate(rutaPorRol(u.rol), { replace: true })
    } catch (error) {
      throw new Error(mensajeErrorLogin(error))
    }
  }

  return (
    <TarjetaLogin
      titulo="Sistema de Auxiliares"
      subtitulo="Inicia sesión para continuar"
      onSubmit={iniciarSesion}
    />
  )
}

export default Login
