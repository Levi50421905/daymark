import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

const configuredBase = process.env.PAGES_BASE?.trim()
const base = configuredBase && configuredBase !== '/' ? `${configuredBase.replace(/\/+$/, '')}/` : '/'

// https://vite.dev/config/
export default defineConfig({
  base,
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: false,
      includeAssets: ['favicon.svg', 'apple-touch-icon.png', 'icons/*.png'],
      manifest: {
        id: base,
        name: 'Daymark — Personal Life Planner',
        short_name: 'Daymark',
        description:
          'Satu tempat tenang untuk mengatur keuangan, belanja, stok makanan, rencana, dan refleksi harianmu.',
        lang: 'id',
        dir: 'ltr',
        start_url: base,
        scope: base,
        display: 'standalone',
        display_override: ['window-controls-overlay', 'standalone'],
        orientation: 'portrait-primary',
        background_color: '#F4F8FC',
        theme_color: '#12A8B8',
        categories: ['productivity', 'finance', 'lifestyle'],
        icons: [
          {
            src: `${base}icons/icon-192.png`,
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: `${base}icons/icon-512.png`,
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: `${base}icons/icon-maskable-192.png`,
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: `${base}icons/icon-maskable-512.png`,
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
        shortcuts: [
          {
            name: 'Buka Finance',
            short_name: 'Finance',
            url: `${base}finance`,
            icons: [{ src: `${base}icons/icon-192.png`, sizes: '192x192' }],
          },
          {
            name: 'Buka daftar belanja',
            short_name: 'Shopping',
            url: `${base}shopping`,
            icons: [{ src: `${base}icons/icon-192.png`, sizes: '192x192' }],
          },
          {
            name: 'Buka Planning',
            short_name: 'Planning',
            url: `${base}planning`,
            icons: [{ src: `${base}icons/icon-192.png`, sizes: '192x192' }],
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest,woff2}'],
        navigateFallback: `${base}index.html`,
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    host: true,
    port: 5173,
    watch: {
      ignored: ['**/.npm-cache/**', '**/.qa/**', '**/dist/**'],
    },
  },
  preview: {
    host: true,
    port: 4173,
  },
})
