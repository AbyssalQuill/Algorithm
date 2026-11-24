import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { ALGOS, examplesOf, findAlgo } from '../algos'
import { CodePanel } from '../components/CodePanel'
import { IconArrow } from '../components/icons'
import { Player } from '../components/Player'
import { ProblemCard } from '../components/ProblemCard'
import { DiffLegend, Problems } from '../components/Problems'
import { topicProblems } from '../data/topicProblems'
import type { AnyAlgo, AnyExample } from '../engine/types'
import { usePlayer } from '../engine/usePlayer'
import { useLang } from '../hooks'
import NotFound from './NotFound'

export default function Lab() {
  const { id } = useParams()
  const [sp] = useSearchParams()
  const algo = findAlgo(id)
  if (!algo) return <NotFound />
  const list = examplesOf(algo)
  const at = Math.max(0, list.findIndex((e) => e.slug === sp.get('ex')))
  return <LabView key={`${algo.id}/${list[at].slug}`} algo={algo} list={list} at={at} />
}

function LabView({ algo, list, at }: { algo: AnyAlgo; list: AnyExample[]; at: number }) {
  const ex = list[at]
  const [input, setInput] = useState(ex.defaultInput)
  const [text, setText] = useState(() => ex.format(ex.defaultInput))
  const [error, setError] = useState('')
  const frames = useMemo(() => ex.run(input), [ex, input])
  const output = useMemo(() => ex.answer(input), [ex, input])
  const player = usePlayer(frames)
  const frame = frames[Math.min(player.index, frames.length - 1)]
  const [lang, setLang] = useLang()
  const View = ex.View
  const practice = useMemo(() => topicProblems(algo.id, list.flatMap((e) => e.problems)), [algo, list])

  const here = ALGOS.findIndex((a) => a.id === algo.id)
  const prevAlgo = ALGOS[here - 1]
  const nextAlgo = ALGOS[here + 1]

  const apply = (t: string) => {
    const r = ex.parse(t)
    if (r.ok) {
      setInput(r.value)
      setText(ex.format(r.value))
      setError('')
    } else {
      setText(t)
      setError(r.error)
    }
  }
  const random = () => {
    const v = ex.random()
    setInput(v)
    setText(ex.format(v))
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
              {ex.complexity.time}
            </span>
            <span>
              <i>空间复杂度</i>
              {ex.complexity.space}
            </span>
          </div>
        </div>
        <p className="lab-tagline">{algo.tagline}</p>
        {ex.complexity.note && <p className="cx-note">{ex.complexity.note}</p>}
      </header>

      {list.length > 1 && (
        <nav className="ex-tabs" aria-label="基础演示与例题">
          <span className="ex-tabs-label">先看基础演示，再做例题</span>
          {list.map((e, i) => (
            <Link key={e.slug} to={i === 0 ? `/lab/${algo.id}` : `/lab/${algo.id}?ex=${e.slug}`} replace className={`ex-tab${i === at ? ' on' : ''}${i === 0 ? ' base' : ''}`} aria-current={i === at ? 'page' : undefined}>
              <b>{i === 0 ? '基' : i}</b>
              <span>
                <strong>{i === 0 ? '基础演示' : e.name}</strong>
                <i>{i === 0 ? e.name : e.type}</i>
              </span>
            </Link>
          ))}
        </nav>
      )}

      <ProblemCard ex={ex} index={at} text={text} onText={setText} error={error} output={output} onApply={apply} onRandom={random} />

      <div className="lab-grid">
        <section className="lab-left" aria-label="动画演示">
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
          <CodePanel sources={ex.sources} step={frame.step} lang={lang} onLang={setLang} />
        </aside>
      </div>

      <section className="learn">
        {ex.idea && ex.idea.length > 0 && (
          <article className="learn-card learn-main learn-idea">
            <h2>这道题怎么想</h2>
            {ex.idea.map((t: string, i: number) => (
              <p key={i}>{t}</p>
            ))}
          </article>
        )}
        <article className="learn-card learn-main">
          <h2>{algo.title} 的基本思路</h2>
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

      {practice.length > 0 && (
        <section className="lab-problems">
          <h2 className="section-title">
            <span className="mark">课后练习</span>
          </h2>
          <p className="section-sub">看懂演示以后，可以去洛谷上亲手写一遍。题目由易到难排列，题号和难度的颜色与洛谷一致。点击题目会在新的标签页里打开。</p>
          <DiffLegend levels={[...new Set(practice.map((p) => p.diff ?? 0))].filter((d) => d > 0).sort()} />
          <Problems list={practice} />
        </section>
      )}

      <nav className="lab-nav" aria-label="上一个 / 下一个专题">
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
