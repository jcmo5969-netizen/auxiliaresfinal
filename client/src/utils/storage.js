/**
 * localStorage seguro para iOS (modo privado puede lanzar al acceder).
 * Evita que la app se quede en blanco por un error al arrancar.
 */
function safeGet(key, defaultValue = null) {
  try {
    const v = localStorage.getItem(key)
    return v !== null ? v : defaultValue
  } catch {
    return defaultValue
  }
}

function safeSet(key, value) {
  try {
    localStorage.setItem(key, value)
  } catch (_) {
    // ignorar (ej. modo privado iOS)
  }
}

function safeRemove(key) {
  try {
    localStorage.removeItem(key)
  } catch (_) {}
}

export { safeGet as getItem, safeSet as setItem, safeRemove as removeItem }
