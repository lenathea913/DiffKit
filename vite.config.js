import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    // Kunci port: dipilih eksplisit agar tidak bentrok dengan proyek lokal lain
    // (InStats 5173, StockVest 5174, BelajarLog 5175, DiffKit 5176).
    port: 5176,
    strictPort: true,
  },
  // Path aset relatif agar build statis tetap benar di GitHub Pages
  // (https://lenathea913.github.io/DiffKit/) maupun saat dibuka lokal.
  base: './',
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
})
