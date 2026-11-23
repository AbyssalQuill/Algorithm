import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { tokenizeCode, type Tok } from '../engine/highlight'
import { parseMarked, toRanges, type Marked } from '../engine/source'
import { LANGS, type Lang } from '../engine/types'
import { IconCheck, IconCopy } from './icons'

const LH = 26 // 每行高度，必须与 CSS 里 --code-lh 一致
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

export function CodePanel({ sources, step, lang, onLang }: { sources: Record<Lang, string>; step: string; lang: Lang; onLang: (l: Lang) => void }) {
  const marked = useMemo(() => {
    const o = {} as Record<Lang, Marked>
    for (const l of LANGS) o[l.id] = parseMarked(sources[l.id], l.id)
    return o
  }, [sources])
  const m = marked[lang]
  const text = useMemo(() => m.lines.join('\n'), [m])

  const [toks, setToks] = useState<{ key: string; lines: Tok[][] } | null>(null)
  useEffect(() => {
    let alive = true
    tokenizeCode(text, lang)
      .then((lines) => alive && setToks({ key: lang + text, lines }))
      .catch(() => {
        /* 高亮失败就显示纯文本，不影响演示 */
      })
    return () => {
      alive = false
    }
  }, [text, lang])
  const colored = toks && toks.key === lang + text ? toks.lines : null

  const active = m.marks[step] ?? []
  const ranges = useMemo(() => toRanges(m.marks[step] ?? []), [m, step])
  const activeSet = new Set(active)

  const bodyRef = useRef<HTMLDivElement>(null)
  const first = ranges.length ? ranges[0][0] : 0
  const last = ranges.length ? ranges[ranges.length - 1][1] : 0
  useEffect(() => {
    const el = bodyRef.current
    if (!el || !first) return
    const top = PAD + (first - 1) * LH
    const bottom = PAD + last * LH
    if (top < el.scrollTop + LH || bottom > el.scrollTop + el.clientHeight - LH) {
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      el.scrollTo({ top: Math.max(0, top - el.clientHeight / 3), behavior: reduce ? 'auto' : 'smooth' })
    }
  }, [first, last, lang])

  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text + '\n')
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      /* 剪贴板不可用时忽略 */
    }
  }

  return (
    <div className="code-card">
      <div className="code-head">
        <div className="code-tabs" role="tablist" aria-label="编程语言">
          {LANGS.map((l) => (
            <button key={l.id} role="tab" aria-selected={lang === l.id} className={`code-tab${lang === l.id ? ' on' : ''}`} onClick={() => onLang(l.id)}>
              {lang === l.id && <motion.span layoutId="code-tab-pill" className="code-tab-pill" transition={{ type: 'spring', stiffness: 520, damping: 40 }} />}
              <span className="code-tab-label">{l.label}</span>
            </button>
          ))}
        </div>
        <button className="code-copy" onClick={copy} aria-label="复制代码">
          {copied ? (
            <>
              <IconCheck /> 已复制
            </>
          ) : (
            <>
              <IconCopy /> 复制
            </>
          )}
        </button>
      </div>
      <div className="code-body" ref={bodyRef}>
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
          {m.lines.map((line, i) => (
            <div key={i} className={`code-line${activeSet.has(i + 1) ? ' on' : ''}`}>
              <span className="ln">{i + 1}</span>
              <span className="lc">{renderTokens(colored?.[i], line)}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="code-foot">高亮的行 = 动画当前这一步对应的代码</div>
    </div>
  )
}
