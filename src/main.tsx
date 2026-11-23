import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { MotionConfig } from 'motion/react'
import './styles/fonts.css'
import './styles/global.css'
import './styles/learn.css'
import App from './App'
import { whenIdle } from './prefetch'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      {/* 系统开启“减少动态效果”时，动画自动降级 */}
      <MotionConfig reducedMotion="user">
        <App />
      </MotionConfig>
    </HashRouter>
  </StrictMode>,
)

// 注册离线缓存：只在正式环境，并且等页面加载完、浏览器空闲时再做，不占用首屏的时间
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => whenIdle(() => navigator.serviceWorker.register('./sw.js').catch(() => {})))
}
