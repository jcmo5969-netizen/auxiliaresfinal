import { Component } from 'react'

/**
 * Evita pantalla en blanco en iOS/otros cuando hay un error de JavaScript.
 * Muestra un mensaje y opción de recargar.
 */
export class ErrorBoundary extends Component {
  state = { hasError: false, error: null }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary:', error, info)
  }

  irAlInicio = () => {
    // Ir a la raíz de la app con hash para que cargue bien (evita quedar en blanco tras recargar)
    const base = (typeof window !== 'undefined' && window.location.origin) || ''
    const path = (typeof window !== 'undefined' && window.location.pathname) || '/'
    const url = base + (path === '/' ? '' : path) + '#/'
    if (typeof window !== 'undefined') window.location.href = url
  }

  render() {
    if (this.state.hasError) {
      const btn = {
        padding: '12px 24px',
        fontSize: '1rem',
        border: 'none',
        borderRadius: 8,
        cursor: 'pointer',
        fontFamily: 'inherit'
      }
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            fontFamily: 'system-ui, sans-serif',
            backgroundColor: '#f3f4f6',
            color: '#111'
          }}
        >
          <h1 style={{ fontSize: '1.25rem', marginBottom: 8 }}>
            Algo salió mal
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: 24, textAlign: 'center' }}>
            Usa &quot;Ir al inicio&quot; para volver a la aplicación.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 280 }}>
            <button
              type="button"
              onClick={this.irAlInicio}
              style={{ ...btn, backgroundColor: '#2563eb', color: '#fff' }}
            >
              Ir al inicio
            </button>
            <button
              type="button"
              onClick={() => typeof window !== 'undefined' && window.location.reload()}
              style={{ ...btn, backgroundColor: '#e5e7eb', color: '#374151' }}
            >
              Recargar página
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

export default ErrorBoundary
