import { readFileSync } from 'node:fs'
import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import widget from '@widget-js/vite-plugin-widget'
import consola from 'consola'
import { defineConfig } from 'vite'

const pkg = JSON.parse(readFileSync('package.json', 'utf-8'))

export default defineConfig((config) => {
  const mode = config.mode
  consola.info('Vite mode:', mode)
  let base = '/'
  if (mode == 'offline') {
    base = './'
  }
  return {
    base,
    plugins: [
      react(),
      tailwindcss(),
      widget(),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    define: {
      __APP_VERSION__: JSON.stringify(pkg.version),
    },
  }
})
