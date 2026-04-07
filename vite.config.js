import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Controle de Gastos Familiar',
        short_name: 'Gastos',
        description: 'App para registrar as contas de casa',
        theme_color: '#4CAF50',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            // Usando um ícone temporário para o celular reconhecer
            src: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png', 
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          }
        ]
      }
    })
  ]
})