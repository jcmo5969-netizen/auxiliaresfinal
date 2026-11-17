import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { ErrorBoundary } from './components/ErrorBoundary'
import { registrarServiceWorker } from './utils/push'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)

// Service worker de notificaciones: se registra al cargar para que los avisos
// sigan llegando aunque la app esté cerrada.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    registrarServiceWorker().catch((error) => {
      console.warn('No se pudo registrar el service worker:', error?.message)
    })
  })
}
