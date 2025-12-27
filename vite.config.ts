import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('vite/preload-helper')) return 'runtime';
          if (id.includes('commonjsHelpers')) return 'runtime';
          if (!id.includes('node_modules')) return;

          if (id.includes('/node_modules/@privy-io/react-auth/')) return 'privy';
          if (id.includes('/node_modules/@tanstack/')) return 'tanstack';

          if (
            id.includes('/node_modules/react/') ||
            id.includes('/node_modules/react-dom/') ||
            id.includes('/node_modules/react-router/') ||
            id.includes('/node_modules/react-router-dom/') ||
            id.includes('/node_modules/scheduler/')
          ) {
            return 'react';
          }
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
