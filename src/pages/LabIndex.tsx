import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { ALGOS } from '../algos'
import { IconArrow } from '../components/icons'
import { EASE_OUT } from '../motion'

export default function LabIndex() {
  const groups = [
    { kind: '数据结构', list: ALGOS.filter((a) => a.kind === '数据结构') },
    { kind: '算法', list: ALGOS.filter((a) => a.kind === '算法') },
  ].filter((g) => g.list.length > 0)

  return (
    <div className="container page">
      <header className="page-head">
        <h1>
          <span className="mark">动画实验室</span>
        </h1>
        <p>每个演示都能自己输入数据、单步前进后退、拖动进度条；右边的代码会同步高亮，四种语言随时切换。</p>
      </header>

      {groups.map((g) => (
        <section key={g.kind} className="lab-group">
          <h2 className="group-title">{g.kind}</h2>
          <div className="lab-cards">
            {g.list.map((a, i) => (
              <motion.div key={a.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.06 * i, ease: EASE_OUT }}>
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
              </motion.div>
            ))}
          </div>
        </section>
      ))}

      <p className="more-note">更多数据结构与算法的动画会陆续加入，完整计划见「学习路线」。</p>
    </div>
  )
}
