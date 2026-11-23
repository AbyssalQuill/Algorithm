import { useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { parseMarked, type Marked } from '../engine/source'
import { LANGS, type Lang } from '../engine/types'
import { CodeBody } from './CodeBody'
import { IconCheck, IconCopy } from './icons'

export function CodePanel({ sources, step, lang, onLang }: { sources: Record<Lang, string>; step: string; lang: Lang; onLang: (l: Lang) => void }) {
  const marked = useMemo(() => {
    const o = {} as Record<Lang, Marked>
    for (const l of LANGS) o[l.id] = parseMarked(sources[l.id], l.id)
    return o
  }, [sources])
  const m = marked[lang]
  const active = m.marks[step] ?? []

  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(m.lines.join('\n') + '\n')
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
      <CodeBody lines={m.lines} lang={lang} active={active} scroll />
      <div className="code-foot">高亮的行 = 动画当前这一步对应的代码</div>
    </div>
  )
}
