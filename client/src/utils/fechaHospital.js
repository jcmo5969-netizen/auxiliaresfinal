/**
 * Utilidad para que la hora programada se vea igual en todos los perfiles (admin, enfermería, auxiliares).
 * Se usa zona fija Chile (UTC-4 estándar) para guardar y mostrar, evitando diferencias por DST o por zona del navegador.
 */
const OFFSET_CHILE_HORAS = -4

/**
 * Dado un string datetime-local "YYYY-MM-DDTHH:mm", devuelve ISO string para enviar al servidor,
 * interpretando esa hora como hora Chile (UTC-4).
 * Así 10:50 siempre se guarda como 14:50Z y se muestra como 10:50 en todos lados.
 */
export function fechaProgramadaParaEnviar (valor) {
  if (!valor || typeof valor !== 'string') return null
  const str = valor.trim()
  if (!/^\d{4}-\d{2}-\d{2}T\d{1,2}:\d{2}$/.test(str)) return null
  return `${str}:00-04:00`
}

/**
 * Formatea una fecha/hora (ISO string o Date) para mostrar como "hora del hospital" (Chile),
 * usando offset fijo -4h para que no varíe por DST ni por zona del dispositivo.
 */
export function formatearFechaProgramadaDisplay (fecha) {
  if (!fecha) return ''
  const d = new Date(fecha)
  if (isNaN(d.getTime())) return ''
  const utcMs = d.getTime()
  const chileMs = utcMs + OFFSET_CHILE_HORAS * 60 * 60 * 1000
  const c = new Date(chileMs)
  const day = String(c.getUTCDate()).padStart(2, '0')
  const month = String(c.getUTCMonth() + 1).padStart(2, '0')
  const year = String(c.getUTCFullYear()).slice(-2)
  const h = String(c.getUTCHours()).padStart(2, '0')
  const min = String(c.getUTCMinutes()).padStart(2, '0')
  return `${day}/${month}/${year}, ${h}:${min}`
}

/**
 * Solo hora "HH:mm" para textos como "Disponible a las 11:30"
 */
export function formatearHoraProgramadaDisplay (fecha) {
  if (!fecha) return ''
  const d = new Date(fecha)
  if (isNaN(d.getTime())) return ''
  const utcMs = d.getTime()
  const chileMs = utcMs + OFFSET_CHILE_HORAS * 60 * 60 * 1000
  const c = new Date(chileMs)
  const h = String(c.getUTCHours()).padStart(2, '0')
  const min = String(c.getUTCMinutes()).padStart(2, '0')
  return `${h}:${min}`
}
