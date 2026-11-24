import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { ALGOS, examplesOf } from '../algos'
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
        <p>每个专题里有几道不同类型的例题。先读题，再输入自己的数据，动画会一步步演示；右边的代码同步高亮，可以在 C、C++、Python、Java 之间切换。</p>
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
                  {a.extra && a.extra.length > 0 && <p className="card-ex">例题：{examplesOf(a).map((e) => e.name).join('、')}</p>}
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

      <p className="more-note">更多专题和例题会陆续加入，完整的学习计划见“开始学习”页面。</p>
    </div>
  )
}
