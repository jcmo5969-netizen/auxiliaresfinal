import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import api from '../utils/api'
import toast from 'react-hot-toast'

const EtiquetasContext = createContext(null)

function normalizeEtiquetas(data) {
  return Array.isArray(data) ? data : []
}

export function EtiquetasProvider({ children }) {
  const [etiquetas, setEtiquetas] = useState([])
  const [cargando, setCargando] = useState(true)
  const toastErrorMostrado = useRef(false)

  const refresh = useCallback(async () => {
    try {
      const res = await api.get('/api/etiquetas')
      setEtiquetas(normalizeEtiquetas(res.data))
      toastErrorMostrado.current = false
    } catch {
      setEtiquetas([])
      if (!toastErrorMostrado.current) {
        toastErrorMostrado.current = true
        toast.error('Error cargando etiquetas')
      }
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const value = { etiquetas, cargando, refreshEtiquetas: refresh }

  return (
    <EtiquetasContext.Provider value={value}>
      {children}
    </EtiquetasContext.Provider>
  )
}

export function useEtiquetasCatalogo() {
  const ctx = useContext(EtiquetasContext)
  return ctx
}
