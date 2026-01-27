import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'esbuild', // Usar esbuild en lugar de terser (más rápido y viene incluido)
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          charts: ['recharts'],
          socket: ['socket.io-client']
        }
      }
    },
    // Optimizaciones para producción
    chunkSizeWarningLimit: 1000,
    assetsInlineLimit: 4096
  },
  define: {
    'process.env': {}
  },
  // Configuración para variables de entorno
  envPrefix: 'VITE_'
})
