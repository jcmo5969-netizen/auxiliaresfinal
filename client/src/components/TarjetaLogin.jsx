import { useState } from 'react'
import { Eye, EyeOff, Loader2, LogIn, Moon, Sun } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

/**
 * Formulario de inicio de sesión compartido por el acceso general y el de auxiliares.
 * `onSubmit(email, password)` debe lanzar un Error con el mensaje a mostrar si falla.
 */
const TarjetaLogin = ({ titulo, subtitulo, nota, onSubmit }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [verPassword, setVerPassword] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const { isDark, toggleTheme } = useTheme()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (cargando) return
    setError('')
    setCargando(true)
    try {
      await onSubmit(email.trim(), password)
    } catch (err) {
      setError(err?.message || 'Error al iniciar sesión')
      setCargando(false)
    }
  }

  const campo =
    'w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-base text-gray-900 placeholder-gray-400 outline-none transition focus:border-transparent focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500'

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 px-4 py-8 transition-colors duration-300 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800"
      style={{ paddingTop: 'max(2rem, env(safe-area-inset-top))', paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}
    >
      <div className="w-full max-w-md">
        <div className="relative rounded-3xl bg-white p-6 shadow-2xl transition-colors duration-300 dark:bg-gray-800 sm:p-8">
          <button
            type="button"
            onClick={toggleTheme}
            className="absolute right-4 top-4 rounded-lg p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          >
            {isDark ? <Sun className="h-5 w-5 text-yellow-400" /> : <Moon className="h-5 w-5 text-gray-600" />}
          </button>

          <div className="mb-7 text-center">
            <img
              src="/icons/icon-192.png"
              alt="Hospital de Quilpué"
              className="mx-auto mb-4 h-20 w-20 rounded-2xl shadow-md ring-1 ring-gray-200 dark:ring-gray-700"
            />
            <h1 className="text-2xl font-bold leading-tight text-gray-900 dark:text-white">{titulo}</h1>
            {subtitulo && <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{subtitulo}</p>}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate={false}>
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Correo electrónico
              </label>
              <input
                id="email"
                name="email"
                type="email"
                inputMode="email"
                autoComplete="username"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={campo}
                placeholder="nombre@hospital.cl"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={verPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className={`${campo} pr-12`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setVerPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  aria-label={verPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {verPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {error && (
              <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-200">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={cargando}
              className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-primary-600 py-3 text-base font-semibold text-white shadow-md transition hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 dark:focus:ring-offset-gray-800"
            >
              {cargando ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : <LogIn className="h-5 w-5" aria-hidden />}
              {cargando ? 'Ingresando…' : 'Iniciar sesión'}
            </button>
          </form>

          {nota && (
            <p className="mt-6 rounded-xl border border-primary-200 bg-primary-50 px-4 py-3 text-center text-sm text-primary-800 dark:border-primary-800 dark:bg-primary-900/20 dark:text-primary-200">
              {nota}
            </p>
          )}
        </div>
        <p className="mt-5 text-center text-xs text-primary-100/90 dark:text-gray-500">
          Unidad de Innovación · Hospital de Quilpué
        </p>
      </div>
    </div>
  )
}

export default TarjetaLogin
