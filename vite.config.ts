import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  // Base path for GitHub Pages deployment
  // Change 'utm-validator' to match your repository name
  base: '/utm-builder/',
})
