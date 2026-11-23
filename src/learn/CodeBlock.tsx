import { useMemo, useState } from 'react'
import { CodeBody } from '../components/CodeBody'
import { IconCheck, IconCopy } from '../components/icons'
import type { Lang } from '../engine/types'
import { parseFence } from './fence'

const LANG_LABEL: Record<string, string> = { c: 'C', cpp: 'C++', python: 'Python', java: 'Java' }

/** 课文里的代码块：真正的代码有行号和语法上色，输入 / 输出是“终端”样子的纯文本 */
export function CodeBlock({ code, info }: { code: string; info: string }) {
  const f = useMemo(() => parseFence(info), [info])
  const text = code.replace(/\s+$/, '')
  const lines = useMemo(() => text.split('\n'), [text])
  const [copied, setCopied] = useState(false)

  if (f.lang === 'input' || f.lang === 'output') {
    return (
      <div className={`io io-${f.lang}`}>
        <span className="io-tag">{f.lang === 'input' ? '输入' : '输出'}</span>
        <pre>{text}</pre>
      </div>
    )
  }
  if (!LANG_LABEL[f.lang]) {
    return (
      <div className="io io-text">
        <pre>{text}</pre>
      </div>
    )
  }

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
    <div className="code-card lcode">
      <div className="lcode-head">
        <span className="lcode-lang">{f.title ?? LANG_LABEL[f.lang]}</span>
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
      <CodeBody lines={lines} lang={f.lang as Lang} active={f.hl} />
    </div>
  )
}
