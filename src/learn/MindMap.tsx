import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useWidth } from '../hooks'
import type { Chapter, LessonMeta, Track } from './curriculum'

/**
 * 思维导图：中间是教程名，两边是章，再往外是每一课，点一课直接进入。
 * 连线是一张静态的 SVG（画一次就不再变）；节点是普通的可点击链接，悬停只做位移，所以不会卡。
 */
const W = 1400
const ROW = 46
const GAP = 22
const TOP = 36
const CH_DX = 290 // 章节点中心到正中间的水平距离
const LS_EDGE = 430 // 课节点靠里的一侧到正中间的水平距离
const LS_W = 270

interface LNode {
  lesson: LessonMeta
  chapter: Chapter
  chNo: number
  x: number
  y: number
  side: 'L' | 'R'
}
interface CNode {
  chapter: Chapter
  no: number
  x: number
  y: number
  side: 'L' | 'R'
  lessons: LNode[]
}

function layout(track: Track) {
  const chs = track.chapters
  const counts = chs.map((c) => c.lessons.length)
  const total = counts.reduce((a, b) => a + b, 0)
  // 找一个切分点，让左右两边的课数尽量接近
  let best = 1
  let bestDiff = Infinity
  let acc = 0
  for (let k = 1; k < chs.length; k++) {
    acc += counts[k - 1]
    const d = Math.abs(acc - (total - acc))
    if (d < bestDiff) {
      bestDiff = d
      best = k
    }
  }
  const sideH = (arr: Chapter[]) => arr.reduce((h, c) => h + c.lessons.length * ROW, 0) + Math.max(0, arr.length - 1) * GAP
  const left = chs.slice(0, best)
  const right = chs.slice(best)
  const H = Math.max(sideH(left), sideH(right)) + TOP * 2
  const cNodes: CNode[] = []
  const place = (arr: Chapter[], side: 'L' | 'R', startNo: number) => {
    let y = TOP + (H - TOP * 2 - sideH(arr)) / 2
    arr.forEach((chapter, i) => {
      const lessons: LNode[] = chapter.lessons.map((lesson, j) => ({
        lesson,
        chapter,
        chNo: startNo + i,
        x: side === 'L' ? W / 2 - LS_EDGE - LS_W / 2 : W / 2 + LS_EDGE + LS_W / 2,
        y: y + j * ROW + ROW / 2,
        side,
      }))
      const cy = (lessons[0].y + lessons[lessons.length - 1].y) / 2
      cNodes.push({ chapter, no: startNo + i, x: side === 'L' ? W / 2 - CH_DX : W / 2 + CH_DX, y: cy, side, lessons })
      y += chapter.lessons.length * ROW + GAP
    })
  }
  place(left, 'L', 1)
  place(right, 'R', best + 1)
  return { H, cNodes }
}

const curve = (x1: number, y1: number, x2: number, y2: number) => {
  const mx = (x1 + x2) / 2
  return `M${x1} ${y1} C${mx} ${y1} ${mx} ${y2} ${x2} ${y2}`
}

export function MindMap({ track }: { track: Track }) {
  const { H, cNodes } = useMemo(() => layout(track), [track])
  const [ref, w] = useWidth<HTMLDivElement>()
  const k = w > 0 ? Math.min(1, w / W) : 1
  const cx = W / 2
  const cy = H / 2

  return (
    <div className="mm-wrap" ref={ref} style={{ height: H * k }}>
      <div className="mm" style={{ width: W, height: H, transform: `scale(${k})` }}>
        <svg className="mm-edges" width={W} height={H} aria-hidden="true">
          <g filter="url(#pencil-a)" fill="none" strokeLinecap="round">
            {cNodes.map((c) => {
              const rootEdge = curve(cx + (c.side === 'L' ? -86 : 86), cy, c.x + (c.side === 'L' ? 82 : -82), c.y)
              return (
                <g key={c.chapter.id} stroke={`var(--${c.chapter.tone})`}>
                  <path d={rootEdge} strokeWidth={3} />
                  {c.lessons.map((l) => (
                    <path key={l.lesson.slug} d={curve(c.x + (c.side === 'L' ? -82 : 82), c.y, l.x + (c.side === 'L' ? LS_W / 2 : -LS_W / 2), l.y)} strokeWidth={2} />
                  ))}
                </g>
              )
            })}
          </g>
        </svg>

        <div className="mm-node mm-root" style={{ left: cx - 86, top: cy - 36, width: 172, height: 72 }}>
          <strong>{track.short} 语法基础</strong>
          <span>{cNodes.reduce((n, c) => n + c.lessons.length, 0)} 课 · 点任意一课开始</span>
        </div>

        {cNodes.map((c) => (
          <div key={c.chapter.id}>
            <div className={`mm-node mm-ch tone-${c.chapter.tone}`} style={{ left: c.x - 82, top: c.y - 24, width: 164, height: 48 }}>
              <b>{c.no}</b>
              <span>{c.chapter.title.split('：')[0]}</span>
            </div>
            {c.lessons.map((l, j) => (
              <Link
                key={l.lesson.slug}
                to={`/learn/${track.id}/${l.lesson.slug}`}
                className={`mm-node mm-lesson tone-${c.chapter.tone} side-${l.side}`}
                style={{ left: l.x - LS_W / 2, top: l.y - 17, width: LS_W, height: 34 }}
              >
                <i>
                  {c.no}.{j + 1}
                </i>
                <span>{l.lesson.title}</span>
                <span className="mm-tip" role="tooltip">
                  <em>{l.lesson.summary}</em>
                  <span className="mm-pts">
                    {l.lesson.points.map((p) => (
                      <b key={p}>{p}</b>
                    ))}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
