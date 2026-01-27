import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { usuario, cargando } = useAuth()
  const location = useLocation()

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!usuario) {
    return <Navigate to="/login" replace />
  }

  // Si requiere admin y el usuario no es administrador, redirigir
  if (requireAdmin) {
    console.log('🔐 ProtectedRoute - Verificando acceso admin:', {
      usuario: usuario?.nombre,
      rol: usuario?.rol,
      requireAdmin
    })
    
    if (usuario.rol !== 'administrador') {
      console.log('❌ Acceso denegado - No es administrador, redirigiendo...')
      // Redirigir según el rol del usuario
      if (usuario.rol === 'auxiliar') {
        return <Navigate to="/auxiliar/acceso" replace />
      }
      if (usuario.rol === 'enfermeria') {
        return <Navigate to="/enfermeria/dashboard" replace />
      }
      // Si no tiene permiso, redirigir al login
      return <Navigate to="/login" replace />
    }
    
    console.log('✅ Acceso permitido - Es administrador')
    // Si es administrador, permitir acceso
    return children
  }

  // Si no requiere admin, verificar que el usuario tenga el rol correcto para la ruta
  // Esto es para rutas específicas como /enfermeria/dashboard o /auxiliar/acceso
  const path = location.pathname
  
  if (path === '/enfermeria/dashboard') {
    if (usuario.rol !== 'enfermeria') {
      console.log('❌ Acceso denegado a /enfermeria/dashboard - Rol:', usuario.rol)
      // Redirigir según el rol
      if (usuario.rol === 'auxiliar') {
        return <Navigate to="/auxiliar/acceso" replace />
      }
      if (usuario.rol === 'administrador') {
        return <Navigate to="/dashboard" replace />
      }
      return <Navigate to="/login" replace />
    }
    return children
  }

  if (path === '/auxiliar/acceso') {
    if (usuario.rol !== 'auxiliar') {
      console.log('❌ Acceso denegado a /auxiliar/acceso - Rol:', usuario.rol)
      // Redirigir según el rol
      if (usuario.rol === 'enfermeria') {
        return <Navigate to="/enfermeria/dashboard" replace />
      }
      if (usuario.rol === 'administrador') {
        return <Navigate to="/dashboard" replace />
      }
      return <Navigate to="/login" replace />
    }
    return children
  }

  return children
}

export default ProtectedRoute


