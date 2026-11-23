import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { IconMoon, IconSun } from './icons'

type Theme = 'light' | 'dark'

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() => (document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'))

  const toggle = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    document.documentElement.dataset.theme = next
    try {
      localStorage.setItem('theme', next)
    } catch {
      /* ignore */
    }
  }

  return (
    <button className="theme-btn" onClick={toggle} aria-label={theme === 'dark' ? '切换到浅色主题' : '切换到暗色主题'} title="切换主题">
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={theme}
          initial={{ rotate: -70, opacity: 0, scale: 0.7 }}
          animate={{ rotate: 0, opacity: 1, scale: 1 }}
          exit={{ rotate: 70, opacity: 0, scale: 0.7 }}
          transition={{ duration: 0.18 }}
          style={{ display: 'grid', placeItems: 'center' }}
        >
          {theme === 'dark' ? <IconMoon /> : <IconSun />}
        </motion.span>
      </AnimatePresence>
    </button>
  )
}
