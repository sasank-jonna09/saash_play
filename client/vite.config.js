import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      include: ['events', 'util', 'stream', 'buffer'],
      globals: {
        global: true,
      }
    })
  ],
  define: {
    global: 'globalThis',
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          peer: ['simple-peer'],
          socket: ['socket.io-client'],
          hash: ['spark-md5'],
        }
      }
    }
  }
})
