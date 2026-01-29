import { useState } from 'react'
import { useTheme } from '../context/ThemeContext'

const Logo = ({ className = '', size = 'default' }) => {
  const { isDark } = useTheme()
  const [logoSrc, setLogoSrc] = useState('/logo-hospital-quilpue.png')
  
  // Tamaños predefinidos
  const sizes = {
    small: 'w-24 h-24',
    default: 'w-32 h-32',
    large: 'w-48 h-48',
    xl: 'w-64 h-64'
  }

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      {/* Logo - Imagen del Hospital de Quilpué */}
      <div className={`${sizes[size]} mb-2 flex items-center justify-center`}>
        <img 
          src={logoSrc}
          alt="U. Innovación e Investigación • Hospital de Quilpué"
          className="w-full h-full object-contain"
          onError={(e) => {
            if (logoSrc !== '/logo-hospital-quilpue.svg') {
              setLogoSrc('/logo-hospital-quilpue.svg')
              return
            }
            // Fallback si no hay imagen
            e.currentTarget.style.display = 'none'
            if (e.currentTarget.nextSibling) {
              e.currentTarget.nextSibling.style.display = 'flex'
            }
          }}
        />
        {/* Fallback si no hay imagen */}
        <div 
          className="hidden flex-col items-center justify-center w-full h-full bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900 dark:to-primary-800 rounded-full"
          style={{ display: 'none' }}
        >
          <div className="text-4xl font-bold text-primary-600 dark:text-primary-400">HQ</div>
        </div>
      </div>
    </div>
  )
}

export default Logo

