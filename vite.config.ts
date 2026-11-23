import { defineConfig, type Plugin } from 'vitest/config'
import react from '@vitejs/plugin-react'

/** 构建时把正文用的两个字体文件写进 <head> 做预加载：字体和脚本、样式同时下载，首屏的文字只排一次版，不会先用备用字体再“跳”成霞鹜文楷 */
function preloadFonts(): Plugin {
  return {
    name: 'preload-fonts',
    transformIndexHtml: {
      order: 'post',
      handler(_html, ctx) {
        if (!ctx.bundle) return []
        return Object.keys(ctx.bundle)
          .filter((f) => /wenkai-(regular|bold)-[\w-]+\.woff2$/.test(f))
          .map((f) => ({ tag: 'link', attrs: { rel: 'preload', as: 'font', type: 'font/woff2', crossorigin: '', href: `./${f}` }, injectTo: 'head' as const }))
      },
    },
  }
}

// base './' + HashRouter：dist 可以放到任何静态托管（Cloudflare Pages / GitHub Pages / 本地双击）
export default defineConfig({
  base: './',
  plugins: [react(), preloadFonts()],
  test: { environment: 'node', include: ['tests/**/*.test.ts'], testTimeout: 60000 },
  build: { chunkSizeWarningLimit: 1200 },
})
