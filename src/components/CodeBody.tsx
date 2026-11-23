import { useEffect, useMemo, useRef, type CSSProperties } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { tokenize, type Tok } from '../engine/highlight'
import { toRanges } from '../engine/source'
import type { Lang } from '../engine/types'

const LH = 28 // 每行高度，必须与 CSS 里 --code-lh 一致
const PAD = 12 // 代码区上内边距，必须与 .code-inner 的 padding 一致
const barSpring = { type: 'spring', stiffness: 420, damping: 38 } as const

function renderTokens(toks: Tok[] | undefined, fallback: string) {
  if (!toks || toks.length === 0) return fallback || ' '
  return toks.map((t, j) => (
    <span key={j} className={t.italic ? 'tok it' : 'tok'} style={{ '--tl': t.light, '--td': t.dark } as CSSProperties}>
      {t.text}
    </span>
  ))
}

/**
 * 代码主体：行号 + 语法上色 + 一条会滑动的高亮条。
 * 动画演示、课文里的代码块、逐步追踪都用它，所以看起来是一致的。
 * active：要高亮的行号（从 1 开始）；scroll：高亮行跑出可视区时自动滚过去。
 */
export function CodeBody({ lines, lang, active = [], scroll = false, maxHeight }: { lines: string[]; lang: Lang; active?: number[]; scroll?: boolean; maxHeight?: string }) {
  const colored = useMemo(() => tokenize(lines.join('\n'), lang), [lines, lang])
  const activeKey = active.join(',')
  const ranges = useMemo(() => toRanges(active), [activeKey]) // eslint-disable-line react-hooks/exhaustive-deps
  const activeSet = useMemo(() => new Set(active), [activeKey]) // eslint-disable-line react-hooks/exhaustive-deps

  const bodyRef = useRef<HTMLDivElement>(null)
  const first = ranges.length ? ranges[0][0] : 0
  const last = ranges.length ? ranges[ranges.length - 1][1] : 0
  useEffect(() => {
    const el = bodyRef.current
    if (!scroll || !el || !first) return
    const top = PAD + (first - 1) * LH
    const bottom = PAD + last * LH
    if (top < el.scrollTop + LH || bottom > el.scrollTop + el.clientHeight - LH) {
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      el.scrollTo({ top: Math.max(0, top - el.clientHeight / 3), behavior: reduce ? 'auto' : 'smooth' })
    }
  }, [scroll, first, last, lang])

  return (
    <div className="code-body" ref={bodyRef} style={maxHeight ? { maxHeight } : undefined}>
      <div className="code-inner">
        <AnimatePresence initial={false}>
          {ranges.map(([a, b], i) => (
            <motion.div
              key={i}
              className="code-bar"
              initial={{ opacity: 0, y: PAD + (a - 1) * LH, height: (b - a + 1) * LH }}
              animate={{ opacity: 1, y: PAD + (a - 1) * LH, height: (b - a + 1) * LH }}
              exit={{ opacity: 0 }}
              transition={barSpring}
            />
          ))}
        </AnimatePresence>
        {lines.map((line, i) => (
          <div key={i} className={`code-line${activeSet.has(i + 1) ? ' on' : ''}`}>
            <span className="ln">{i + 1}</span>
            <span className="lc">{renderTokens(colored[i], line)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
