import { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext()

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme debe usarse dentro de ThemeProvider')
  }
  return context
}

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(() => {
    // Leer preferencia guardada o detectar preferencia del sistema
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme')
      if (saved) {
        return saved === 'dark'
      }
      return window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    return false
  })

  useEffect(() => {
    // Aplicar tema al documento con transición suave
    const root = document.documentElement
    root.style.transition = 'background-color 0.3s ease, color 0.3s ease'
    
    if (isDark) {
      root.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      root.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }

    // Escuchar cambios en la preferencia del sistema (solo si no hay preferencia guardada)
    if (!localStorage.getItem('theme')) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const handleChange = (e) => {
        setIsDark(e.matches)
      }
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    }
  }, [isDark])

  const toggleTheme = () => {
    setIsDark(prev => !prev)
  }

  const value = {
    isDark,
    toggleTheme
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

