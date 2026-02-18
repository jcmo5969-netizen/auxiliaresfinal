import { useState, useEffect } from 'react'

/**
 * Ventana que muestra la hora del sistema adelantada 1 hora y 3 minutos.
 * Útil para pantallas de sala o monitores.
 */
const ADELANTO_MINUTOS = 60 + 3 // 1 hora y 3 minutos

const RelojVentana = ({ className = '', soloHora = false }) => {
  const [horaAdelantada, setHoraAdelantada] = useState(null)

  useEffect(() => {
    const actualizar = () => {
      const ahora = new Date()
      const adelantada = new Date(ahora.getTime() + ADELANTO_MINUTOS * 60 * 1000)
      setHoraAdelantada(adelantada)
    }
    actualizar()
    const intervalo = setInterval(actualizar, 1000)
    return () => clearInterval(intervalo)
  }, [])

  if (!horaAdelantada) {
    return (
      <div className={`flex items-center justify-center text-gray-500 dark:text-gray-400 ${className}`}>
        <span className="animate-pulse">--:--:--</span>
      </div>
    )
  }

  const opcionesHora = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }
  const opcionesFecha = { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }

  return (
    <div
      className={`flex flex-col items-center justify-center rounded-xl border-2 border-primary-200 dark:border-primary-700 bg-white dark:bg-gray-800 shadow-lg p-4 sm:p-6 ${className}`}
      title="Hora adelantada 1h 3min (sistema)"
    >
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">
        Hora sistema (+1h 3min)
      </p>
      <p className="text-3xl sm:text-4xl font-mono font-bold text-gray-900 dark:text-white tabular-nums">
        {horaAdelantada.toLocaleTimeString('es-CL', opcionesHora)}
      </p>
      {!soloHora && (
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
          {horaAdelantada.toLocaleDateString('es-ES', opcionesFecha)}
        </p>
      )}
    </div>
  )
}

export default RelojVentana
