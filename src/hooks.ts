import { useLayoutEffect, useRef, useState } from 'react'
import type { Lang } from './engine/types'

/** 测量元素宽度（首帧同步测量，避免动画从错误位置滑进来） */
export function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [w, setW] = useState(0)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    setW(el.clientWidth)
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return [ref, w] as const
}

const LANG_KEY = 'algo-lang'

/** 记住用户上次选的语言 tab */
export function useLang(): [Lang, (l: Lang) => void] {
  const [lang, setLang] = useState<Lang>(() => {
    try {
      const v = localStorage.getItem(LANG_KEY)
      if (v === 'c' || v === 'cpp' || v === 'python' || v === 'java') return v
    } catch {
      /* 隐私模式下 localStorage 可能不可用 */
    }
    return 'cpp'
  })
  const set = (l: Lang) => {
    setLang(l)
    try {
      localStorage.setItem(LANG_KEY, l)
    } catch {
      /* ignore */
    }
  }
  return [lang, set]
}
