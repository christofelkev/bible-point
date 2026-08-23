import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 1420,
    // The Tauri shell points at this exact origin, so a silent fallback to
    // another port would leave the desktop build loading nothing.
    strictPort: true,
    watch: {
      // Rust build artefacts churn constantly and must never trigger an HMR pass.
      ignored: ['**/src-tauri/**'],
    },
  },
  clearScreen: false,
})
