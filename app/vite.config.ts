import { defineConfig } from 'vite';

export default defineConfig({
  base: './', // Asegura rutas relativas para GitHub Pages
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist'
  }
});
