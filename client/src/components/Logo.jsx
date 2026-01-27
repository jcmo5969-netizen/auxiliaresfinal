import { useTheme } from '../context/ThemeContext'

const Logo = ({ className = '', size = 'default' }) => {
  const { isDark } = useTheme()
  
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
      <div className={`${sizes[size]} mb-4 flex items-center justify-center`}>
        <img 
          src="/logo-hospital-quilpue.png" 
          alt="Hospital de Quilpué - U. Innovación e Investigación"
          className="w-full h-full object-contain"
          onError={(e) => {
            // Fallback si la imagen no se encuentra
            e.target.style.display = 'none'
            e.target.nextSibling.style.display = 'flex'
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
      
      {/* Texto del logo */}
      <div className="text-center">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
          U. Innovación e Investigación
        </h2>
        <h3 className="text-base font-medium text-gray-700 dark:text-gray-300">
          Hospital de Quilpué
        </h3>
      </div>
    </div>
  )
}

export default Logo

