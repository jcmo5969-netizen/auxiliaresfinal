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

  render() {
    if (this.state.hasError) {
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
            Prueba recargar la página. Si usas iPhone, abre el enlace de nuevo.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              padding: '12px 24px',
              fontSize: '1rem',
              backgroundColor: '#2563eb',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer'
            }}
          >
            Recargar
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

export default ErrorBoundary
