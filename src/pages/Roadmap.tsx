import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { liveCount, STAGES } from '../data/roadmap'
import { EASE_OUT } from '../motion'

export default function Roadmap() {
  return (
    <div className="container page">
      <header className="page-head">
        <h1>
          <span className="mark">学习路线</span>
        </h1>
        <p>
          零基础从第 0 阶段顺着走即可；每个阶段里亮绿色的主题已经上线，灰色的正在准备中。C、C++、Python、Java 四种语言会同步讲解，蓝桥杯 B 组的几个赛道都能对上。
        </p>
      </header>

      <ol className="timeline">
        {STAGES.map((s, i) => {
          const live = liveCount(s)
          return (
            <motion.li
              key={s.no}
              className="stage-card"
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5, delay: 0.04 * i, ease: EASE_OUT }}
            >
              <div className="stage-no" aria-hidden="true">
                {s.no}
              </div>
              <div className="stage-body">
                <div className="stage-head">
                  <h2>{s.name}</h2>
                  <span className={`pill${live ? ' pill-live' : ''}`}>{live ? `${live} 个动画已上线` : '准备中'}</span>
                </div>
                <p>{s.blurb}</p>
                <ul className="topic-list">
                  {s.topics.map((t) => (
                    <li key={t.title}>
                      {t.lab ? (
                        <Link to={`/lab/${t.lab}`} className="topic live">
                          {t.title}
                          <em>可玩</em>
                        </Link>
                      ) : (
                        <span className="topic">{t.title}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.li>
          )
        })}
      </ol>
    </div>
  )
}
