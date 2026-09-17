import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    // 5173 (defaut Vite) est deja occupe sur cette machine
    port: 5174,
    strictPort: true,
    proxy: {
      // evite toute question de CORS en developpement
      '/api': {
        target: 'http://localhost:8081',
        changeOrigin: true,
      },
      // sonde de sante du backend (hors /api)
      '/actuator': {
        target: 'http://localhost:8081',
        changeOrigin: true,
      },
    },
  },
})
