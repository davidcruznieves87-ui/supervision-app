import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),

    VitePWA({
      registerType: 'autoUpdate',

      manifest: {
        name: 'Sistema de Supervisión',
        short_name: 'Supervisión',
        description: 'Sistema operativo de supervisión técnica',
        theme_color: '#06b6d4',
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/',
        start_url: '/',

        icons: [
          {
            src: '/logo.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/logo.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ]
})