import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      // Proxy para News
      '/news': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        rewrite: (path) => path, // mantiene /news
      },
      // Proxy para Users (login, register, profile, history)
      '/users': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        rewrite: (path) => path,
      },
      // Proxy para Comments
      '/comments': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        rewrite: (path) => path,
      },
      // Proxy para Stats si lo necesitas
      '/stats': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        rewrite: (path) => path,
      },
    }
  }
})
