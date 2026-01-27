import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'
import toast from 'react-hot-toast'
import { QRCodeSVG } from 'qrcode.react'
import { ArrowLeft, Download } from 'lucide-react'

const QRPage = () => {
  const { usuario } = useAuth()
  const navigate = useNavigate()
  const [qrData, setQrData] = useState(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    cargarQR()
  }, [])

  const cargarQR = async () => {
    try {
      const res = await api.get('/api/qr/generar')
      setQrData(res.data)
    } catch (error) {
      console.error('Error generando QR:', error)
      toast.error(error.response?.data?.mensaje || 'Error generando QR')
      // Generar QR localmente como fallback
      const urlAcceso = `${window.location.origin}/auxiliar/acceso`
      setQrData({
        qrCode: null,
        url: urlAcceso
      })
    } finally {
      setCargando(false)
    }
  }

  const descargarQR = () => {
    if (!qrData) return
    
    const link = document.createElement('a')
    link.href = qrData.qrCode
    link.download = 'qr-auxiliares.png'
    link.click()
  }

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-8">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition"
        >
          <ArrowLeft className="w-5 h-5" />
          Volver al Dashboard
        </button>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Código QR de Acceso</h1>
          <p className="text-gray-600">
            Los auxiliares pueden escanear este código para acceder a la plataforma móvil
          </p>
        </div>

        <div className="flex flex-col items-center justify-center bg-gray-50 rounded-xl p-8 mb-6">
          {qrData && (
            <div className="bg-white p-6 rounded-lg shadow-lg mb-4">
              <QRCodeSVG
                value={qrData.url}
                size={300}
                level="M"
                includeMargin={true}
              />
            </div>
          )}
          
          <button
            onClick={descargarQR}
            className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
          >
            <Download className="w-5 h-5" />
            Descargar QR
          </button>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Instrucciones:</strong> Muestra este código QR en una pantalla o imprímelo. 
            Los auxiliares pueden escanearlo con su celular para acceder directamente a la plataforma 
            donde verán todas las solicitudes disponibles.
          </p>
        </div>

        {qrData && (
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">URL de acceso:</p>
            <p className="text-xs text-primary-600 break-all mt-1">{qrData.url}</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default QRPage




