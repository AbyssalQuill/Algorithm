import { useMemo } from 'react'
import { CodeBody } from '../components/CodeBody'
import { Player } from '../components/Player'
import { usePlayer } from '../engine/usePlayer'
import { parseTrace, checkTrace } from './trace'

/** 「逐步追踪」：代码一行一行跑，旁边同步显示变量的值和屏幕输出（写法见 trace.ts） */
export function TraceBlock({ body }: { body: string }) {
  const t = useMemo(() => parseTrace(body), [body])
  const errs = useMemo(() => checkTrace(t), [t])
  const p = usePlayer(t.steps, { baseMs: 1400 })
  const s = t.steps[Math.min(p.index, t.steps.length - 1)]
  const prev = p.index > 0 ? t.steps[p.index - 1] : undefined

  const out = useMemo(
    () =>
      t.steps
        .slice(0, p.index + 1)
        .map((x) => x.out)
        .join(''),
    [t, p.index],
  )

  if (errs.length || !s) {
    return <div className="io io-text">逐步追踪的内容有问题：{errs.join('；')}</div>
  }
  const before = new Map(prev?.vars ?? [])

  return (
    <div className="trace">
      <div className="trace-cap">
        <span className="trace-tag">逐步看一遍</span>
        点播放，或者一步一步点“下一步”
      </div>
      <div className="trace-grid">
        <div className="code-card trace-code">
          <CodeBody lines={t.lines} lang={t.lang} active={t.marks[s.label] ?? []} scroll />
        </div>
        <div className="trace-side">
          <div className="trace-panel">
            <h4>变量：内存里现在有什么</h4>
            <div className="vars">
              {s.vars.length === 0 && <span className="vars-empty">还没有变量</span>}
              {s.vars.map(([name, val]) => (
                <div key={`${name}=${val}@${before.get(name) === val ? 'same' : p.index}`} className={`var${before.get(name) === val ? '' : ' chg'}`}>
                  <span className="var-name">{name}</span>
                  <span className="var-val">{val}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="trace-panel">
            <h4>屏幕输出</h4>
            <pre className="term">
              {out || ' '}
              <span className="caret" />
            </pre>
          </div>
        </div>
      </div>
      <div className="note trace-note">
        <span className="note-step">第 {p.index + 1} 步</span>
        <p>{s.note}</p>
      </div>
      <Player p={p} total={t.steps.length} />
    </div>
  )
}
