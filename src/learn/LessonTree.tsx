import { Link } from 'react-router-dom'
import type { Track } from './curriculum'

/** 课程目录树：课程页左边栏 / 手机上折叠的“目录”。当前章节默认展开，当前课高亮 */
export function LessonTree({ track, current }: { track: Track; current?: string }) {
  return (
    <nav className="ltree" aria-label="课程目录">
      {track.chapters.map((ch, ci) => {
        const here = ch.lessons.some((l) => l.slug === current)
        return (
          <details key={ch.id} open={here || (!current && ci === 0) || undefined} className={`ltree-ch tone-${ch.tone}`}>
            <summary>
              <span className="ltree-no">{ci + 1}</span>
              <span>{ch.title.split('：')[0]}</span>
            </summary>
            <ul>
              {ch.lessons.map((l, li) => (
                <li key={l.slug}>
                  <Link to={`/learn/${track.id}/${l.slug}`} className={l.slug === current ? 'on' : ''} aria-current={l.slug === current ? 'page' : undefined}>
                    <span className="ltree-idx">
                      {ci + 1}.{li + 1}
                    </span>
                    {l.title}
                  </Link>
                </li>
              ))}
            </ul>
          </details>
        )
      })}
    </nav>
  )
}
