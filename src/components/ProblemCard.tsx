import type { FormEvent, KeyboardEvent } from 'react'
import type { AnyExample } from '../engine/types'
import { IconDice } from './icons'

interface Props {
  ex: AnyExample
  /** 在专题里的位置：0 是基础演示，从 1 开始才是例题 */
  index: number
  text: string
  onText: (t: string) => void
  error: string
  /** 当前生效的输入对应的输出 */
  output: string
  onApply: (t: string) => void
  onRandom: () => void
}

/** 题目卡片：左边是题面（描述、输入格式、输出格式），右边是可以修改的输入和对应的输出 */
export function ProblemCard({ ex, index, text, onText, error, output, onApply, onRandom }: Props) {
  const st = ex.statement
  const submit = (e: FormEvent) => {
    e.preventDefault()
    onApply(text)
  }
  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      onApply(text)
    }
  }
  const rows = Math.min(10, Math.max(3, text.split('\n').length + 1))
  const concept = index === 0
  return (
    <section className={concept ? 'problem concept' : 'problem'} aria-label={concept ? '基础演示' : '例题'}>
      <div className="problem-text">
        <div className="problem-head">
          <span className="ex-no">{concept ? '基础演示' : `例题 ${index}`}</span>
          <h2>{ex.name}</h2>
          <span className="tag tag-type">{ex.type}</span>
        </div>
        {concept ? (
          <>
            <p className="problem-desc">
              <span className="problem-lead">演示的内容：</span>
              {st.desc[0]}
            </p>
            <details className="fmt-fold">
              <summary>输入输出格式</summary>
              <div className="fmt">
                <div>
                  <h3>输入格式</h3>
                  {st.input.map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
                <div>
                  <h3>输出格式</h3>
                  {st.output.map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
              </div>
            </details>
          </>
        ) : (
          <>
            {st.desc.map((p, i) => (
              <p key={i} className="problem-desc">
                {p}
              </p>
            ))}
            <div className="fmt">
              <div>
                <h3>输入格式</h3>
                {st.input.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
              <div>
                <h3>输出格式</h3>
                {st.output.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      <form className="problem-io" onSubmit={submit}>
        <label htmlFor="lab-input">
          {concept ? '试试别的数据' : '输入'} <small>可以直接修改</small>
        </label>
        <div className="field">
          <textarea id="lab-input" value={text} rows={rows} onChange={(e) => onText(e.target.value)} onKeyDown={onKey} spellCheck={false} autoComplete="off" aria-invalid={!!error} />
        </div>
        <div className="io-actions">
          <button type="submit" className="btn btn-primary btn-sm">
            应用
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onRandom}>
            <IconDice /> 随机
          </button>
          {ex.presets && ex.presets.length > 0 && (
            <div className="chips" aria-label="示例数据">
              {ex.presets.map((p: { label: string; text: string }) => (
                <button type="button" key={p.label} className="chip" onClick={() => onApply(p.text)}>
                  {p.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <p className={error ? 'hint err' : 'hint'} role={error ? 'alert' : undefined}>
          {error || '改完点“应用”（或按 Ctrl + Enter），下面的动画和代码就会按这组输入重新演示。'}
        </p>
        <span className="io-label">{concept ? '程序的输出' : '输出'}</span>
        <div className="field field-out">
          <pre aria-live="polite">{output.trim() === '' ? <span className="io-empty">（这组输入没有输出）</span> : output}</pre>
        </div>
      </form>
    </section>
  )
}
