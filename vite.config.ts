import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// base './' + HashRouter：dist 可以放到任何静态托管（Cloudflare Pages / GitHub Pages / 本地双击）
export default defineConfig({
  base: './',
  plugins: [react()],
  test: { environment: 'node', include: ['tests/**/*.test.ts'], testTimeout: 60000 },
  build: { chunkSizeWarningLimit: 1200 },
})
