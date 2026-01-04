import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    fs: {
      allow: [
        projectRoot,
        // Allow loading local images via /@fs from the project data directory.
        path.resolve(projectRoot, '..', 'data'),
      ],
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
