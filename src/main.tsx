import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { MotionConfig } from 'motion/react'
import 'lxgw-wenkai-webfont/lxgwwenkai-regular.css'
import 'lxgw-wenkai-webfont/lxgwwenkai-bold.css'
import 'lxgw-wenkai-webfont/lxgwwenkaimono-regular.css'
import './styles/global.css'
import './styles/learn.css'
import App from './App'

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
