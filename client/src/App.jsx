import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import QRPage from './pages/QRPage'
import AuxiliarAcceso from './pages/AuxiliarAcceso'
import EnfermeriaDashboard from './pages/EnfermeriaDashboard'
import MetricasPage from './pages/MetricasPage'
import CalendarioPage from './pages/CalendarioPage'
import LogsPage from './pages/LogsPage'
import ChatPage from './pages/ChatPage'
import PlantillasPage from './pages/PlantillasPage'
import ProtectedRoute from './components/ProtectedRoute'

// Componente para redirigir según el rol
const HomeRedirect = () => {
  const { usuario, cargando } = useAuth()
  
  // Si estamos en /auxiliar/acceso, NO redirigir automáticamente
  // para evitar interferencias con la autenticación local
  const currentHash = window.location.hash || ''
  const currentPath = window.location.pathname || ''
  const isAuxiliarAcceso = currentHash.includes('/auxiliar/acceso') || 
                           currentPath.includes('/auxiliar/acceso')
  
  if (isAuxiliarAcceso) {
    // Si ya estamos en /auxiliar/acceso, no hacer nada
    // para evitar redirecciones que cierren otras pestañas
    return null
  }
  
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
  
  if (usuario.rol === 'auxiliar') {
    return <Navigate to="/auxiliar/acceso" replace />
  }
  
  if (usuario.rol === 'enfermeria') {
    return <Navigate to="/enfermeria/dashboard" replace />
  }
  
  return <Navigate to="/dashboard" replace />
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/qr" element={
                <ProtectedRoute>
                  <QRPage />
                </ProtectedRoute>
              } />
            <Route 
              path="/auxiliar/acceso" 
              element={
                // No usar ProtectedRoute aquí, AuxiliarAcceso maneja su propia autenticación
                <AuxiliarAcceso />
              } 
            />
            <Route path="/enfermeria/dashboard" element={
              <ProtectedRoute>
                <EnfermeriaDashboard />
              </ProtectedRoute>
            } />
            <Route path="/dashboard" element={
              <ProtectedRoute requireAdmin={true}>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/metricas" element={
              <ProtectedRoute requireAdmin={true}>
                <MetricasPage />
              </ProtectedRoute>
            } />
            <Route path="/calendario" element={
              <ProtectedRoute requireAdmin={true}>
                <CalendarioPage />
              </ProtectedRoute>
            } />
            <Route path="/logs" element={
              <ProtectedRoute requireAdmin={true}>
                <LogsPage />
              </ProtectedRoute>
            } />
            <Route path="/chat" element={
              <ProtectedRoute>
                <ChatPage />
              </ProtectedRoute>
            } />
            <Route path="/plantillas" element={
              <ProtectedRoute requireAdmin={true}>
                <PlantillasPage />
              </ProtectedRoute>
            } />
            <Route path="/" element={<HomeRedirect />} />
            </Routes>
            <Toaster position="top-right" />
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App


