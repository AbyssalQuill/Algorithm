import { motion } from 'motion/react'
import { useWidth } from '../hooks'
import type { Tone } from './ArrayView'

export interface GNode {
  id: number
  label?: string | number
  tone?: Tone
  /** 结点旁边的小字（比如到起点的距离） */
  sub?: string | number
}

export interface GEdge {
  a: number
  b: number
  w?: number
  tone?: Tone
  directed?: boolean
}

const spring = { type: 'spring', stiffness: 260, damping: 28 } as const

/** 图可视化：结点均匀地排在一个圆上，边是直线（有向边带箭头），权值写在边的中间 */
export function GraphView({ nodes, edges, height = 300 }: { nodes: GNode[]; edges: GEdge[]; height?: number }) {
  const [ref, w] = useWidth<HTMLDivElement>()
  const n = nodes.length
  const R = Math.max(40, Math.min(w / 2 - 44, height / 2 - 40))
  const cx = w / 2
  const cy = height / 2
  const r = 19
  const pos = new Map(nodes.map((nd, i) => [nd.id, { x: cx + R * Math.cos(-Math.PI / 2 + (2 * Math.PI * i) / n), y: cy + R * Math.sin(-Math.PI / 2 + (2 * Math.PI * i) / n) }]))
  const tones = ['idle', 'done', 'swap', 'compare', 'found'] as const

  return (
    <div ref={ref} className="gr" style={{ height }}>
      {w > 0 && (
        <>
          <svg className="gr-svg" width={w} height={height} aria-hidden="true">
            <defs>
              {tones.map((t) => (
                <marker key={t} id={`gr-ar-${t}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto">
                  <path d="M0 1 L9 5 L0 9 z" className={`gr-head tone-${t}`} />
                </marker>
              ))}
            </defs>
            {edges.map((e) => {
              const p = pos.get(e.a)
              const q = pos.get(e.b)
              if (!p || !q) return null
              const dx = q.x - p.x
              const dy = q.y - p.y
              const len = Math.hypot(dx, dy) || 1
              const ux = dx / len
              const uy = dy / len
              const x1 = p.x + ux * (r + 1)
              const y1 = p.y + uy * (r + 1)
              const x2 = q.x - ux * (r + (e.directed ? 4 : 1))
              const y2 = q.y - uy * (r + (e.directed ? 4 : 1))
              const tone = e.tone ?? 'idle'
              return (
                <g key={`${e.a}-${e.b}`}>
                  <motion.line className={`gr-edge tone-${tone}`} markerEnd={e.directed ? `url(#gr-ar-${tone})` : undefined} initial={false} animate={{ x1, y1, x2, y2 }} transition={spring} />
                  {e.w !== undefined && (
                    <g className={`gr-w tone-${tone}`}>
                      <rect x={(x1 + x2) / 2 - 11} y={(y1 + y2) / 2 - 9} width={22} height={18} rx={6} />
                      <text x={(x1 + x2) / 2} y={(y1 + y2) / 2 + 4.5} textAnchor="middle">
                        {e.w}
                      </text>
                    </g>
                  )}
                </g>
              )
            })}
          </svg>
          {nodes.map((nd) => {
            const p = pos.get(nd.id)!
            return (
              <div key={nd.id} className={`gr-node tone-${nd.tone ?? 'idle'}`} style={{ left: p.x - r, top: p.y - r, width: r * 2, height: r * 2 }}>
                {nd.label ?? nd.id}
                {nd.sub !== undefined && <span className="gr-sub">{nd.sub}</span>}
              </div>
            )
          })}
        </>
      )}
    </div>
  )
}
