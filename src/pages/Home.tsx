import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { ALGOS, examplesOf } from '../algos'
import { bubbleSort } from '../algos/bubbleSort'
import { Arrow, Circled, PencilArt, Sparkle } from '../components/Doodles'
import { IconArrow } from '../components/icons'
import { STAGES } from '../data/roadmap'
import { TRACKS } from '../learn/curriculum'
import { usePlayer } from '../engine/usePlayer'
import { EASE_OUT } from '../motion'
import { prefetchLearning } from '../prefetch'

/** 演示图比较重（柱子、指针、动画）：先把页面的框架画出来，下一帧再让它“动起来”，首屏就不会被它拖慢 */
function HeroDemo() {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    let b = 0
    const a = requestAnimationFrame(() => {
      b = requestAnimationFrame(() => setReady(true))
    })
    return () => {
      cancelAnimationFrame(a)
      cancelAnimationFrame(b)
    }
  }, [])
  if (!ready) {
    return (
      <div className="hero-stage" aria-hidden="true">
        <div className="hero-cap">
          <span className="live-dot" />
          冒泡排序 · 自动演示中
        </div>
      </div>
    )
  }
  return <HeroDemoLive />
}

function HeroDemoLive() {
  const frames = useMemo(() => bubbleSort.run([6, 3, 9, 2, 8, 4, 7, 1]), [])
  const p = usePlayer(frames, { autoplay: true, loop: true, baseMs: 560 })
  const f = frames[Math.min(p.index, frames.length - 1)]
  const View = bubbleSort.View
  return (
    <div className="hero-stage">
      <div className="hero-cap">
        <span className="live-dot" />
        冒泡排序 · 自动演示中
      </div>
      <View frame={f} />
      <p className="hero-note">{f.note}</p>
    </div>
  )
}

function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.55, delay, ease: EASE_OUT }}
    >
      {children}
    </motion.div>
  )
}

export default function Home() {
  const cpp = TRACKS[0]
  useEffect(prefetchLearning, [])
  const rise = (i: number) => ({
    initial: { opacity: 0, y: 18 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, delay: 0.08 * i, ease: EASE_OUT },
  })

  return (
    <>
      <section className="hero">
        <Sparkle className="spark s1" />
        <Sparkle className="spark s2" color="var(--blue)" />
        <Sparkle className="spark s3" color="var(--red)" />
        <div className="container hero-grid">
          <div className="hero-copy">
            <motion.span className="eyebrow" {...rise(0)}>
              零基础入门 · 算法竞赛 · 从 C++ 学起
            </motion.span>
            <motion.h1 {...rise(1)}>
              从第一行代码，
              <br />
              走到<Circled>算法大牛</Circled>
            </motion.h1>
            <motion.p className="hero-sub" {...rise(2)}>
              不要求你先配好开发环境，我们直接从最基础的语法讲起。每一课围绕一个主题展开，除了讲解，还能把程序一步步运行给你看，课后配有洛谷上的练习题。等语法学扎实了，再去看数据结构和算法的动画，理解起来会顺畅得多。
            </motion.p>
            <motion.div className="cta-row" {...rise(3)}>
              <Link to="/learn" className="btn btn-primary">
                开始第一步学习 <IconArrow />
              </Link>
              <Link to="/lab" className="btn btn-ghost">
                先看看动画
              </Link>
            </motion.div>
            <motion.div className="hero-pencil" {...rise(5)}>
              <PencilArt />
            </motion.div>
          </div>
          <motion.div className="hero-demo" initial={{ opacity: 0, y: 28, rotate: 0 }} animate={{ opacity: 1, y: 0, rotate: 1.2 }} transition={{ duration: 0.8, delay: 0.25, ease: EASE_OUT }}>
            <div className="hero-aside" aria-hidden="true">
              <span className="scribble-note">它会自己动起来</span>
              <Arrow className="hero-arrow" />
            </div>
            <HeroDemo />
          </motion.div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <Reveal>
            <h2 className="section-title">
              <span className="mark">每一课</span>是这样安排的
            </h2>
          </Reveal>
          <div className="steps">
            {[
              ['1', '先读讲解', '每一课只讲一个主题，借助日常生活里的例子把概念讲清楚。左侧有完整的目录，想跳到哪里都可以。'],
              ['2', '再看运行过程', '遇到不容易想象的地方，会附上逐步演示：代码一行一行地高亮，变量的值和屏幕输出同步变化，不必在脑子里一遍遍模拟。'],
              ['3', '最后动手练习', '每一课后面有对应的洛谷题目，只会用到当天学过的内容。读懂以后亲手写一遍，印象会深刻得多。'],
            ].map(([no, title, text], i) => (
              <Reveal key={no} delay={0.08 * i} className="step">
                <span className="step-no">{no}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <Reveal>
            <h2 className="section-title">从 C++ 语法开始</h2>
            <p className="section-sub">整套教程分为 {cpp.chapters.length} 章、{cpp.chapters.reduce((n, c) => n + c.lessons.length, 0)} 节，按顺序学习即可。每学完一章，你就能解决一类新的问题。</p>
          </Reveal>
          <div className="stage-strip home-chapters">
            {cpp.chapters.map((c, i) => (
              <Reveal key={c.id} delay={0.05 * i}>
                <Link to={`/learn/cpp/${c.lessons[0].slug}`} className={`mini-stage tone-${c.tone}`}>
                  <span className="mini-no">{i + 1}</span>
                  <h3>{c.title.split('：')[0]}</h3>
                  <p>{c.lessons.map((l) => l.title).join(' · ')}</p>
                </Link>
              </Reveal>
            ))}
          </div>
          <Reveal>
            <p className="home-more">
              <Link to="/learn" className="btn btn-ghost btn-sm">
                查看完整目录和思维导图 <IconArrow />
              </Link>
            </p>
          </Reveal>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <Reveal>
            <h2 className="section-title">动画实验室</h2>
            <p className="section-sub">每个专题里有几道不同类型的例题：题面、可以修改的输入、逐步演示的动画，以及四种语言的代码，都在同一页。</p>
          </Reveal>
          {(['数据结构', '算法'] as const).map((kind) => (
            <div key={kind} className="tiles-group">
              <h3 className="group-title">{kind}</h3>
              <div className="tiles">
                {ALGOS.filter((a) => a.kind === kind).map((a) => (
                  <Link key={a.id} to={`/lab/${a.id}`} className="tile">
                    {a.title}
                    {examplesOf(a).length > 1 && <small>{examplesOf(a).length} 道例题</small>}
                  </Link>
                ))}
              </div>
            </div>
          ))}
          <div className="cta-row tiles-more">
            <Link to="/lab" className="btn btn-ghost">
              查看全部专题 <IconArrow />
            </Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <Reveal>
            <h2 className="section-title">完整的学习路线</h2>
            <p className="section-sub">从零基础的语法，到数据结构与算法，再到面向比赛的综合训练。</p>
          </Reveal>
          <div className="stage-strip">
            {STAGES.map((s, i) => (
              <Reveal key={s.no} delay={0.06 * i}>
                <Link to="/learn" className="mini-stage">
                  <span className="mini-no">{s.no}</span>
                  <h3>{s.name}</h3>
                  <p>{s.blurb}</p>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
