import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { ALGOS, findAlgo } from '../algos'
import { CodePanel } from '../components/CodePanel'
import { IconArrow, IconDice } from '../components/icons'
import { Player } from '../components/Player'
import { Problems } from '../components/Problems'
import type { AnyAlgo } from '../engine/types'
import { usePlayer } from '../engine/usePlayer'
import { useLang } from '../hooks'
import NotFound from './NotFound'

export default function Lab() {
  const { id } = useParams()
  const algo = findAlgo(id)
  return algo ? <LabView key={algo.id} algo={algo} /> : <NotFound />
}

function LabView({ algo }: { algo: AnyAlgo }) {
  const [input, setInput] = useState(algo.defaultInput)
  const [text, setText] = useState(algo.format(algo.defaultInput))
  const [error, setError] = useState('')
  const frames = useMemo(() => algo.run(input), [algo, input])
  const player = usePlayer(frames)
  const frame = frames[Math.min(player.index, frames.length - 1)]
  const [lang, setLang] = useLang()
  const View = algo.View

  const at = ALGOS.findIndex((a) => a.id === algo.id)
  const prevAlgo = ALGOS[at - 1]
  const nextAlgo = ALGOS[at + 1]

  const apply = (t: string) => {
    const r = algo.parse(t)
    if (r.ok) {
      setInput(r.value)
      setText(algo.format(r.value))
      setError('')
    } else {
      setError(r.error)
    }
  }
  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    apply(text)
  }
  const random = () => {
    const v = algo.random()
    setInput(v)
    setText(algo.format(v))
    setError('')
  }

  // 键盘：空格 播放/暂停，← → 单步，Home / End 跳到头 / 尾
  const pRef = useRef(player)
  useEffect(() => {
    pRef.current = player
  })
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return
      const t = e.target as HTMLElement
      const tag = t.tagName
      if (tag === 'TEXTAREA' || tag === 'SELECT' || (tag === 'INPUT' && (t as HTMLInputElement).type !== 'button')) return
      const p = pRef.current
      if (e.key === ' ') {
        if (tag === 'BUTTON' || tag === 'A') return
        e.preventDefault()
        p.toggle()
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        p.next()
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        p.prev()
      } else if (e.key === 'Home') {
        e.preventDefault()
        p.restart()
      } else if (e.key === 'End') {
        e.preventDefault()
        p.seek(p.last)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="container lab-wide page lab">
      <div className="crumbs">
        <Link to="/lab">动画实验室</Link>
        <span aria-hidden="true">/</span>
        <span>{algo.title}</span>
      </div>

      <header className="lab-head">
        <span className="tag tag-kind">{algo.kind}</span>
        <div className="lab-titlerow">
          <h1>{algo.title}</h1>
          <div className="cx" aria-label="复杂度">
            <span>
              <i>时间复杂度</i>
              {algo.complexity.time}
            </span>
            <span>
              <i>空间复杂度</i>
              {algo.complexity.space}
            </span>
          </div>
        </div>
        <p className="lab-tagline">{algo.tagline}</p>
        {algo.complexity.note && <p className="cx-note">{algo.complexity.note}</p>}
      </header>

      <div className="lab-grid">
        <section className="lab-left" aria-label="动画演示">
          <form className="inputbar" onSubmit={onSubmit}>
            <label htmlFor="lab-input">输入数据</label>
            <div className="input-row">
              <div className="field">
                <input id="lab-input" value={text} onChange={(e) => setText(e.target.value)} spellCheck={false} autoComplete="off" aria-invalid={!!error} />
              </div>
              <button type="submit" className="btn btn-primary btn-sm">
                应用
              </button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={random}>
                <IconDice /> 随机
              </button>
            </div>
            {algo.presets && (
              <div className="chips" aria-label="示例数据">
                {algo.presets.map((p: { label: string; text: string }) => (
                  <button type="button" key={p.label} className="chip" onClick={() => apply(p.text)}>
                    {p.label}
                  </button>
                ))}
              </div>
            )}
            <p className={error ? 'hint err' : 'hint'} role={error ? 'alert' : undefined}>
              {error || algo.inputHint}
            </p>
          </form>

          <div className="stage">
            <View frame={frame} />
          </div>

          <div className="note" aria-live="polite">
            <span className="note-step">第 {player.index + 1} 步</span>
            <AnimatePresence mode="wait" initial={false}>
              <motion.p key={player.index} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.16 }}>
                {frame.note}
              </motion.p>
            </AnimatePresence>
          </div>

          <Player p={player} total={frames.length} />
          <p className="kbd-hint">
            快捷键：<kbd>空格</kbd> 播放 / 暂停　<kbd>←</kbd> <kbd>→</kbd> 单步　<kbd>Home</kbd> <kbd>End</kbd> 跳到头 / 尾
          </p>
        </section>

        <aside className="lab-right" aria-label="对应代码">
          <CodePanel sources={algo.sources} step={frame.step} lang={lang} onLang={setLang} />
        </aside>
      </div>

      <section className="learn">
        <article className="learn-card learn-main">
          <h2>基本思路</h2>
          {algo.intro.map((t: string, i: number) => (
            <p key={i}>{t}</p>
          ))}
        </article>
        <article className="learn-card">
          <h2>关键点</h2>
          <ul>
            {algo.points.map((t: string, i: number) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        </article>
        <article className="learn-card warn">
          <h2>常见错误</h2>
          <ul>
            {algo.pitfalls.map((t: string, i: number) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        </article>
      </section>

      {algo.problems.length > 0 && (
        <section className="lab-problems">
          <h2 className="section-title">
            <span className="mark">洛谷例题</span>
          </h2>
          <p className="section-sub">看懂演示以后，可以去洛谷上亲手写一遍。点击题目会在新的标签页里打开。</p>
          <Problems list={algo.problems} />
        </section>
      )}

      <nav className="lab-nav" aria-label="上一个 / 下一个演示">
        {prevAlgo ? (
          <Link to={`/lab/${prevAlgo.id}`} className="lab-nav-a prev">
            <span>上一个</span>
            <strong>{prevAlgo.title}</strong>
          </Link>
        ) : (
          <span />
        )}
        {nextAlgo ? (
          <Link to={`/lab/${nextAlgo.id}`} className="lab-nav-a next">
            <span>下一个</span>
            <strong>
              {nextAlgo.title} <IconArrow />
            </strong>
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </div>
  )
}
