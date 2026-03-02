import { resolve } from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
  esbuild: {
    pure: ['console.log'],
    drop: ['debugger'],
  },
  plugins: [
    react(),
    tailwindcss(),
    dts({ include: ['src'] }),
    visualizer({
      open: true, // Automatically open the report in the browser
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.tsx'),
      name: 'MindMapComponent',
      formats: ['es'],
      fileName: format => `index.${format}.js`,
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'tailwindcss'],
      output: {
        globals: {
          'react': 'React',
          'react-dom': 'ReactDOM',
          'tailwindcss': 'tailwindcss',
        },
      },
    },
  },
})
