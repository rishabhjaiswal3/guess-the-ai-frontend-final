import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react()],
  esbuild:
    command === 'build'
      ? {
          drop: ['console', 'debugger'],
        }
      : undefined,
}))
