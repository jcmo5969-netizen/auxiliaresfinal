import { useState, useEffect } from 'react'

/**
 * Ventana que muestra la hora en GMT/UTC-3 (verano, Chile) sin adelanto.
 */
const ZONA_VERANO = 'America/Santiago' // UTC-3 en verano

function obtenerHoraSistema() {
  const formatter = new Intl.DateTimeFormat('es-CL', {
    timeZone: ZONA_VERANO,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })
  return formatter.format(new Date())
}

function obtenerFechaZona() {
  return new Date().toLocaleDateString('es-ES', {
    timeZone: ZONA_VERANO,
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}

const RelojVentana = ({ className = '', soloHora = false }) => {
  const [display, setDisplay] = useState(() => ({ hora: obtenerHoraSistema(), fecha: obtenerFechaZona() }))

  useEffect(() => {
    const actualizar = () => setDisplay({ hora: obtenerHoraSistema(), fecha: obtenerFechaZona() })
    actualizar()
    const intervalo = setInterval(actualizar, 1000)
    return () => clearInterval(intervalo)
  }, [])

  return (
    <div
      className={`flex flex-col items-center justify-center rounded-lg border border-primary-200 dark:border-primary-700 bg-white dark:bg-gray-800 shadow px-2.5 py-1.5 ${className}`}
      title="Hora GMT/UTC-3 (America/Santiago)"
    >
      <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wide leading-tight">
        Hora sistema (UTC-3)
      </p>
      <p className="text-lg font-mono font-bold text-gray-900 dark:text-white tabular-nums leading-tight">
        {display.hora}
      </p>
      {!soloHora && (
        <p className="text-[10px] text-gray-600 dark:text-gray-300 leading-tight">
          {display.fecha}
        </p>
      )}
    </div>
  )
}

export default RelojVentana
