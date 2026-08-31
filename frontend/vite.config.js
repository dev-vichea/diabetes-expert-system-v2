import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5001',
        changeOrigin: true
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        // Split heavy / stable vendor libraries into separate long-lived
        // cacheable chunks, so app-code changes don't invalidate the whole
        // bundle for returning visitors. Order matters: scoped packages
        // (e.g. @radix-ui/react-*) must be matched before generic substrings.
        manualChunks(id) {
          if (!id.includes('/node_modules/')) return undefined
          // Shared micro-utilities used by BOTH the entry and heavy vendor
          // libs. Pin them to the eager react chunk — otherwise Rollup may
          // hoist them into a heavy chunk (e.g. clsx into vendor-charts),
          // forcing the entry to statically import it upfront.
          if (id.includes('clsx') || id.includes('tailwind-merge') || id.includes('class-variance-authority')) return 'vendor-react'
          if (id.includes('recharts') || id.includes('d3-') || id.includes('victory-vendor') || id.includes('internmap')) return 'vendor-charts'
          if (id.includes('@xyflow')) return 'vendor-flow'
          if (id.includes('@radix-ui') || id.includes('@base-ui') || id.includes('cmdk')) return 'vendor-ui'
          if (/\/node_modules\/(react|react-dom|react-router|react-router-dom|scheduler)\//.test(id)) return 'vendor-react'
          return undefined
        },
      },
    },
  },
})
