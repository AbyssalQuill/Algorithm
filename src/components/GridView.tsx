import { useWidth } from '../hooks'
import type { Tone } from './ArrayView'

export interface GridCell {
  text?: string | number
  /** 右下角的小字（比如距离、下标） */
  sub?: string | number
  tone?: Tone
  /** 墙：画成涂满的格子 */
  wall?: boolean
  /** 表头：没有边框，只显示文字 */
  head?: boolean
}

/** 网格可视化：迷宫、筛法的数字表、动态规划的表格都用它。格子颜色用和数组一样的几种“彩铅色” */
export function GridView({ rows, maxCell = 54 }: { rows: GridCell[][]; maxCell?: number }) {
  const [ref, w] = useWidth<HTMLDivElement>()
  const cols = rows[0]?.length ?? 1
  const gap = w < 420 ? 4 : 6
  const size = Math.max(22, Math.min(maxCell, Math.floor((w - gap * (cols - 1)) / cols)))
  return (
    <div ref={ref} className="gv-box">
      {w > 0 && (
        <div className="gv" style={{ gridTemplateColumns: `repeat(${cols}, ${size}px)`, gridAutoRows: `${size}px`, gap }}>
          {rows.flatMap((row, r) =>
            row.map((c, k) => (
              <div
                key={`${r}-${k}`}
                className={`gv-cell tone-${c.tone ?? 'idle'}${c.wall ? ' gv-wall' : ''}${c.head ? ' gv-head' : ''}`}
                style={{ fontSize: size < 32 ? 12 : size < 44 ? 14 : 16 }}
              >
                {c.text}
                {c.sub !== undefined && <span className="gv-sub">{c.sub}</span>}
              </div>
            )),
          )}
        </div>
      )}
    </div>
  )
}

/** 队列的横向展示：左边是队头，右边是队尾 */
export function QueueRow({ items, label = '队列', max = 14 }: { items: string[]; label?: string; max?: number }) {
  const shown = items.slice(0, max)
  return (
    <div className="qrow">
      <span className="qrow-label">{label}</span>
      <span className="qrow-end">队头</span>
      {shown.length === 0 && <span className="qrow-empty">空</span>}
      {shown.map((t, i) => (
        <span key={i} className="qchip">
          {t}
        </span>
      ))}
      {items.length > max && <span className="qrow-more">…还有 {items.length - max} 个</span>}
      <span className="qrow-end">队尾</span>
    </div>
  )
}
