import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

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
