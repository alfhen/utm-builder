import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  // GitHub Pages serves from /utm-builder/ and sets VITE_BASE; utm.alfhen.dev serves from the root.
  base: process.env.VITE_BASE ?? '/',
})
