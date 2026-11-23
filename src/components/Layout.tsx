import { useEffect } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { motion } from 'motion/react'
import { LogoMark } from './Doodles'
import { SketchDefs } from './SketchDefs'
import { ThemeToggle } from './ThemeToggle'

export function Layout() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [pathname])

  return (
    <>
      <SketchDefs />
      <header className="site-header">
        <div className="container bar">
          <NavLink to="/" className="brand">
            <LogoMark />
            <span>算法笔记本</span>
          </NavLink>
          <nav className="nav" aria-label="主导航">
            <NavLink to="/" end>
              首页
            </NavLink>
            <NavLink to="/learn">开始学习</NavLink>
            <NavLink to="/lab">动画实验室</NavLink>
          </nav>
          <ThemeToggle />
        </div>
      </header>
      <motion.main key={pathname} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}>
        <Outlet />
      </motion.main>
      <footer className="site-footer">
        <div className="container">
          <p>
            <strong>算法笔记本</strong> · 从第一行代码一路学到算法竞赛。讲解与代码均为原创，例题来自
            <a href="https://www.luogu.com.cn/" target="_blank" rel="noopener noreferrer">
              洛谷
            </a>
            ，点击题目会在洛谷原站打开。
          </p>
        </div>
      </footer>
    </>
  )
}
