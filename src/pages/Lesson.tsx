import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import type { Token } from 'marked'
import { IconArrow } from '../components/icons'
import { Problems } from '../components/Problems'
import { pickProblems } from '../data/problems'
import { loadLesson } from '../learn/content'
import { findLesson } from '../learn/curriculum'
import { LessonTree } from '../learn/LessonTree'
import { extractToc, Markdown, parseLesson, type TocItem } from '../learn/markdown'

function Toc({ items }: { items: TocItem[] }) {
  const [active, setActive] = useState(items[0]?.id ?? '')
  useEffect(() => {
    setActive(items[0]?.id ?? '')
    if (items.length === 0) return
    const els = items.map((i) => document.getElementById(i.id)).filter((e): e is HTMLElement => !!e)
    const visible = new Set<string>()
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) e.isIntersecting ? visible.add(e.target.id) : visible.delete(e.target.id)
        const first = items.find((i) => visible.has(i.id))
        if (first) setActive((cur) => (cur === first.id ? cur : first.id))
      },
      { rootMargin: '-80px 0px -65% 0px' },
    )
    els.forEach((e) => io.observe(e))
    return () => io.disconnect()
  }, [items])

  const go = (id: string) => {
    const el = document.getElementById(id)
    if (!el) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
    setActive(id)
  }

  if (items.length === 0) return null
  return (
    <nav className="toc" aria-label="本页目录">
      <h4>本页目录</h4>
      <ul>
        {items.map((i) => (
          <li key={i.id} className={`d${i.depth}${active === i.id ? ' on' : ''}`}>
            <button onClick={() => go(i.id)}>{i.text}</button>
          </li>
        ))}
      </ul>
    </nav>
  )
}

export default function Lesson() {
  const { track: trackId = 'cpp', slug = '' } = useParams()
  const found = useMemo(() => findLesson(trackId, slug), [trackId, slug])
  const [doc, setDoc] = useState<{ slug: string; tokens: Token[] } | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let alive = true
    setFailed(false)
    const p = found ? loadLesson(trackId, slug) : null
    if (!p) {
      setFailed(true)
      return
    }
    p.then((md) => alive && setDoc({ slug, tokens: parseLesson(md) })).catch(() => alive && setFailed(true))
    return () => {
      alive = false
    }
  }, [trackId, slug, found])

  const tokens = doc && doc.slug === slug ? doc.tokens : null
  const toc = useMemo(() => (tokens ? extractToc(tokens) : []), [tokens])

  if (!found) return <Navigate to="/learn" replace />
  const { lesson, prev, next } = found
  const probs = pickProblems(...lesson.problems)

  return (
    <div className="container lesson-wrap">
      <aside className="lesson-side">
        <LessonTree track={lesson.track} current={slug} />
      </aside>

      <article className="lesson">
        <nav className="crumbs" aria-label="位置">
          <Link to="/learn">学习</Link>
          <span>/</span>
          <Link to={`/learn/${lesson.track.id}`}>{lesson.track.title}</Link>
          <span>/</span>
          <span>第 {lesson.chapterNo} 章</span>
        </nav>

        <header className="lesson-head">
          <span className={`tag tone-${lesson.chapter.tone}`}>
            第 {lesson.chapterNo} 章 · {lesson.chapter.title.split('：')[0]} · 第 {lesson.no} 课
          </span>
          <h1>{lesson.title}</h1>
          <p className="lesson-sum">{lesson.summary}</p>
          <p className="lesson-meta">
            预计用时 {lesson.minutes} 分钟 · 本课要点：
            {lesson.points.map((p) => (
              <b key={p}>{p}</b>
            ))}
          </p>
        </header>

        <details className="lesson-drawer">
          <summary>展开课程目录（第 {lesson.chapterNo} 章 · 第 {lesson.no} 课）</summary>
          <LessonTree track={lesson.track} current={slug} />
        </details>

        <div className="prose">
          {tokens ? <Markdown tokens={tokens} /> : failed ? <p className="prose-wait">这一课的文档还在撰写中，请稍后再来。</p> : <p className="prose-wait">正在加载本课内容…</p>}
        </div>

        {tokens && probs.length > 0 && (
          <section className="lesson-problems">
            <h2>配套练习（洛谷）</h2>
            <p className="lp-sub">下面几道题只会用到本课的内容。点击题目会在洛谷原站打开，请在那里编写并提交代码。</p>
            <Problems list={probs} />
          </section>
        )}

        <nav className="lesson-nav" aria-label="上一课 / 下一课">
          {prev ? (
            <Link to={`/learn/${prev.track.id}/${prev.slug}`} className="lab-nav-a">
              <span>上一课</span>
              <strong>{prev.title}</strong>
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link to={`/learn/${next.track.id}/${next.slug}`} className="lab-nav-a next">
              <span>下一课</span>
              <strong>
                {next.title} <IconArrow />
              </strong>
            </Link>
          ) : (
            <Link to="/lab" className="lab-nav-a next">
              <span>语法部分到此结束</span>
              <strong>
                继续学习数据结构与算法动画 <IconArrow />
              </strong>
            </Link>
          )}
        </nav>
      </article>

      <aside className="lesson-toc">
        <Toc items={toc} />
      </aside>
    </div>
  )
}
