import { useState, useEffect } from 'react'

/**
 * Ventana que muestra la hora en GMT/UTC-3 (verano, Chile) adelantada 1 hora y 3 minutos.
 */
const ADELANTO_MINUTOS = 60 + 3 // 1 hora y 3 minutos
const ZONA_VERANO = 'America/Santiago' // UTC-3 en verano

function obtenerHoraSistema() {
  const formatter = new Intl.DateTimeFormat('es-CL', {
    timeZone: ZONA_VERANO,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })
  const parts = formatter.formatToParts(new Date())
  const get = (type) => parseInt(parts.find(p => p.type === type)?.value || '0', 10)
  let h = get('hour')
  let m = get('minute')
  let s = get('second')
  m += ADELANTO_MINUTOS
  h += Math.floor(m / 60)
  m = m % 60
  if (h >= 24) h -= 24
  const hStr = String(h).padStart(2, '0')
  const mStr = String(m).padStart(2, '0')
  const sStr = String(s).padStart(2, '0')
  return { hora: `${hStr}:${mStr}:${sStr}`, segundo: s }
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
  const [display, setDisplay] = useState(() => ({ ...obtenerHoraSistema(), fecha: obtenerFechaZona() }))

  useEffect(() => {
    const actualizar = () => setDisplay(prev => ({ ...obtenerHoraSistema(), fecha: obtenerFechaZona() }))
    actualizar()
    const intervalo = setInterval(actualizar, 1000)
    return () => clearInterval(intervalo)
  }, [])

  return (
    <div
      className={`flex flex-col items-center justify-center rounded-lg border border-primary-200 dark:border-primary-700 bg-white dark:bg-gray-800 shadow px-2.5 py-1.5 ${className}`}
      title="Hora sistema GMT/UTC-3 (+1h 3min)"
    >
      <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wide leading-tight">
        Hora sistema (+1h 3min)
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
