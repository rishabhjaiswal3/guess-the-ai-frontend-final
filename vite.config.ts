import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
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
  esbuild:
    command === 'build'
      ? {
          drop: ['console', 'debugger'],
        }
      : undefined,
}))
