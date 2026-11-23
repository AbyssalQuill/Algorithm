import { useMemo } from 'react'
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom'
import { motion } from 'motion/react'
import { Circled, Sparkle } from '../components/Doodles'
import { IconArrow } from '../components/icons'
import { findTrack, flatten, TRACKS } from '../learn/curriculum'
import { MindMap } from '../learn/MindMap'
import { EASE_OUT } from '../motion'

/** 学习中心：先在这里看清整个教程长什么样（目录 / 思维导图），再点进去一课一课学 */
export default function Learn() {
  const { track: trackId = 'cpp' } = useParams()
  const [sp, setSp] = useSearchParams()
  const track = findTrack(trackId)
  const view = sp.get('view') === 'map' ? 'map' : 'toc'
  const all = useMemo(() => (track ? flatten(track) : []), [track])
  if (!track) return <Navigate to="/learn" replace />

  const minutes = all.reduce((n, l) => n + l.minutes, 0)
  const first = all[0]

  return (
    <div className="container page learn-page">
      <div className="track-tabs" role="tablist" aria-label="选择语言">
        {TRACKS.map((t) =>
          t.ready ? (
            <Link key={t.id} to={`/learn/${t.id}`} role="tab" aria-selected={t.id === track.id} className={`track-tab${t.id === track.id ? ' on' : ''}`}>
              {t.short}
            </Link>
          ) : (
            <span key={t.id} role="tab" aria-disabled="true" className="track-tab off" title="正在筹备，目前先完善 C++">
              {t.short}
              <small>筹备中</small>
            </span>
          ),
        )}
      </div>

      {!track.ready || !first ? (
        <p className="page-sub">这门语言的教程还在筹备中，目前请先从 C++ 开始。</p>
      ) : (
        <>
          <motion.section className="learn-hero" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE_OUT }}>
            <Sparkle className="lh-spark" color="var(--yellow-edge)" />
            <div>
              <h1>
                <Circled delay={0.3}>{track.title}</Circled>
              </h1>
              <p>{track.tagline}</p>
              <div className="lh-stats">
                <span>
                  <b>{track.chapters.length}</b> 章
                </span>
                <span>
                  <b>{all.length}</b> 课
                </span>
                <span>
                  约 <b>{Math.round(minutes / 60)}</b> 小时
                </span>
                <span>零基础也能读懂</span>
              </div>
            </div>
            <div className="lh-cta">
              <Link to={`/learn/${track.id}/${first.slug}`} className="btn btn-primary">
                从第一课开始 <IconArrow />
              </Link>
              <small>第 1 课：{first.title}</small>
            </div>
          </motion.section>

          <div className="view-switch" role="tablist" aria-label="切换查看方式">
            <button role="tab" aria-selected={view === 'toc'} className={view === 'toc' ? 'on' : ''} onClick={() => setSp({}, { replace: true })}>
              目录
            </button>
            <button role="tab" aria-selected={view === 'map'} className={view === 'map' ? 'on' : ''} onClick={() => setSp({ view: 'map' }, { replace: true })}>
              思维导图
            </button>
          </div>

          {view === 'map' ? (
            <>
              <p className="mm-hint">把鼠标移到某一课上，可以看到这一课的内容简介；点击即可进入。</p>
              <MindMap track={track} />
            </>
          ) : (
            <div className="ch-grid">
              {track.chapters.map((ch, ci) => (
                <motion.section
                  key={ch.id}
                  className={`card ch-card tone-${ch.tone}`}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.5, ease: EASE_OUT }}
                >
                  <header>
                    <span className="ch-no">{String(ci + 1).padStart(2, '0')}</span>
                    <div>
                      <h2>{ch.title}</h2>
                      <p>{ch.blurb}</p>
                    </div>
                  </header>
                  <ol className="ch-lessons">
                    {ch.lessons.map((l, li) => (
                      <li key={l.slug}>
                        <Link to={`/learn/${track.id}/${l.slug}`}>
                          <i>
                            {ci + 1}.{li + 1}
                          </i>
                          <span className="cl-main">
                            <b>{l.title}</b>
                            <small>{l.summary}</small>
                          </span>
                          <span className="cl-min">{l.minutes} 分钟</span>
                        </Link>
                      </li>
                    ))}
                  </ol>
                </motion.section>
              ))}
            </div>
          )}

          <section className="learn-next">
            <h2>语法之后是什么</h2>
            <p>学完语法之后，数据结构和算法会配上逐步演示的动画，代码也会同步高亮。把语法打牢以后再去看，会轻松不少。</p>
            <Link to="/lab" className="btn btn-ghost btn-sm">
              先预览动画实验室 <IconArrow />
            </Link>
          </section>
        </>
      )}
    </div>
  )
}
