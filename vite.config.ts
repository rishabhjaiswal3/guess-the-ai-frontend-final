import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          privy: ['@privy-io/react-auth'],
          tanstack: ['@tanstack/react-query'],
        },
      },
    },
  },
  // server: {
  //   port: 3000,
  //   strictPort: true,
  //   host: true
  // },
  // preview: {
  //   port: 3000,
  //   strictPort: true,
  //   host: true
  // }
})
