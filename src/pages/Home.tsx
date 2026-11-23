import { useMemo, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { ALGOS } from '../algos'
import { bubbleSort } from '../algos/bubbleSort'
import { Arrow, Circled, PencilArt, Sparkle } from '../components/Doodles'
import { IconArrow } from '../components/icons'
import { STAGES } from '../data/roadmap'
import { usePlayer } from '../engine/usePlayer'
import { EASE_OUT } from '../motion'

function HeroDemo() {
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
              零基础 · 蓝桥杯 B 组 · C / C++ / Python / Java
            </motion.span>
            <motion.h1 {...rise(1)}>
              从第一行代码，
              <br />
              走到<Circled>蓝桥杯</Circled>
            </motion.h1>
            <motion.p className="hero-sub" {...rise(2)}>
              每个知识点都有动画演示、四种语言的逐行高亮代码，还有洛谷例题。看一遍动画，读一遍代码，算法是怎么“跑”起来的，一眼就能看见。
            </motion.p>
            <motion.div className="cta-row" {...rise(3)}>
              <Link to="/lab/bubble-sort" className="btn btn-primary">
                看第一个动画 <IconArrow />
              </Link>
              <Link to="/path" className="btn btn-ghost">
                查看学习路线
              </Link>
            </motion.div>
            <motion.div className="hero-pencil" {...rise(5)}>
              <PencilArt />
            </motion.div>
          </div>
          <motion.div className="hero-demo" initial={{ opacity: 0, y: 28, rotate: 0 }} animate={{ opacity: 1, y: 0, rotate: 1.2 }} transition={{ duration: 0.8, delay: 0.25, ease: EASE_OUT }}>
            <div className="hero-aside" aria-hidden="true">
              <span className="scribble-note">它会自己动哦</span>
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
              <span className="mark">三步</span>学会一个知识点
            </h2>
          </Reveal>
          <div className="steps">
            {[
              ['1', '看动画', '一步步前进、后退、拖进度条，还能自己改输入数据，看清每一步发生了什么。'],
              ['2', '读代码', 'C、C++、Python、Java 随时切换；动画走到哪一步，代码就高亮到哪一行。'],
              ['3', '刷例题', '每个知识点配洛谷例题，看懂了就去原站动手写一写。'],
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
            <h2 className="section-title">已经可以玩的动画</h2>
            <p className="section-sub">先从这几个开始，更多的会陆续加入。</p>
          </Reveal>
          <div className="lab-cards">
            {ALGOS.map((a, i) => (
              <Reveal key={a.id} delay={0.07 * i}>
                <Link to={`/lab/${a.id}`} className="card">
                  <span className="tag tag-kind">{a.kind}</span>
                  <h3>{a.title}</h3>
                  <p>{a.tagline}</p>
                  <div className="card-foot">
                    <span className="card-cx">时间 {a.complexity.time}</span>
                    <span className="card-go">
                      进入演示 <IconArrow />
                    </span>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <Reveal>
            <h2 className="section-title">学习路线</h2>
            <p className="section-sub">从零基础语法，一路走到蓝桥杯冲刺。</p>
          </Reveal>
          <div className="stage-strip">
            {STAGES.map((s, i) => (
              <Reveal key={s.no} delay={0.06 * i}>
                <Link to="/path" className="mini-stage">
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
