import { motion } from 'motion/react'
import { useWidth } from '../hooks'
import type { Tone } from './ArrayView'

export interface LNode {
  id: number
  label: string | number
  /** 这个结点的“下一个”；null 表示指向空 */
  next: number | null
  tone?: Tone
  /** 这条 next 箭头的颜色 */
  arrow?: Tone
}

export interface LPointer {
  name: string
  id: number
  tone?: Tone
}

const spring = { type: 'spring', stiffness: 260, damping: 28 } as const

/**
 * 链表可视化：结点按 order 规定的顺序固定在一排位置上，箭头从结点指向它的 next。
 * 箭头朝右时画直线，朝左（比如反转之后）时从下面绕回去，这样一眼就能看出哪些指针已经掉头
 */
export function ListView({ nodes, order, pointers = [] }: { nodes: LNode[]; order: number[]; pointers?: LPointer[] }) {
  const [ref, w] = useWidth<HTMLDivElement>()
  const n = order.length
  const slotOf = new Map(order.map((id, i) => [id, i]))
  const byId = new Map(nodes.map((x) => [x.id, x]))
  const pad = 16
  const nullW = 26
  const gap = Math.max(14, Math.min(34, (w - pad * 2 - nullW) / Math.max(n, 1) * 0.42))
  const bw = Math.max(26, Math.min(58, (w - pad * 2 - nullW - gap * n) / Math.max(n, 1)))
  const total = n * bw + n * gap + nullW
  const x0 = Math.max(pad, (w - total) / 2)
  const left = (slot: number) => x0 + slot * (bw + gap)
  const top = 54
  const bh = 40
  const cy = top + bh / 2
  const H = top + bh + 62
  const nullX = left(n) + 2

  // 指针标签：同一个结点上有多个时往上叠
  const stack = new Map<number, number>()
  const labels = pointers.map((p) => {
    const k = stack.get(p.id) ?? 0
    stack.set(p.id, k + 1)
    return { ...p, k }
  })

  return (
    <div ref={ref} className="lv" style={{ height: H }}>
      {w > 0 && (
        <>
          <svg className="lv-svg" width={w} height={H} aria-hidden="true">
            <defs>
              {(['idle', 'done', 'swap', 'compare'] as const).map((t) => (
                <marker key={t} id={`lv-ar-${t}`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                  <path d="M0 1 L9 5 L0 9 z" className={`lv-head tone-${t}`} />
                </marker>
              ))}
            </defs>
            {nodes.map((nd) => {
              const a = slotOf.get(nd.id)
              if (a === undefined) return null
              const tone = nd.arrow && ['idle', 'done', 'swap', 'compare'].includes(nd.arrow) ? nd.arrow : 'idle'
              const cls = `lv-arrow tone-${tone}`
              const mk = `url(#lv-ar-${tone})`
              if (nd.next === null && a < n - 1) {
                // 不是最后一格的结点指向空（比如反转后的新尾巴）：从下沿画一小段箭头指向“∅”
                const x1 = left(a) + bw / 2
                const yb = top + bh
                return <motion.path key={nd.id} className={cls} markerEnd={mk} initial={false} animate={{ d: `M ${x1} ${yb} L ${x1} ${yb + 24}` }} transition={spring} />
              }
              if (nd.next === null) {
                const x1 = left(a) + bw
                return <motion.path key={nd.id} className={cls} markerEnd={mk} initial={false} animate={{ d: `M ${x1} ${cy} L ${nullX} ${cy}` }} transition={spring} />
              }
              const b = slotOf.get(nd.next)
              if (b === undefined) return null
              if (b > a) {
                const x1 = left(a) + bw
                const x2 = left(b) - 1
                return <motion.path key={nd.id} className={cls} markerEnd={mk} initial={false} animate={{ d: `M ${x1} ${cy} L ${x2} ${cy}` }} transition={spring} />
              }
              // 朝左：从当前结点下沿出发，在下面绕一圈回到目标结点的下沿
              const x1 = left(a) + bw / 2
              const x2 = left(b) + bw / 2
              const depth = 26 + Math.min(18, (a - b) * 5)
              const yb = top + bh
              return <motion.path key={nd.id} className={cls} markerEnd={mk} initial={false} animate={{ d: `M ${x1} ${yb} C ${x1} ${yb + depth} ${x2} ${yb + depth} ${x2} ${yb + 2}` }} transition={spring} />
            })}
          </svg>
          {order.map((id, i) => {
            const nd = byId.get(id)
            if (!nd) return null
            return (
              <div key={id} className={`lv-node tone-${nd.tone ?? 'idle'}`} style={{ left: left(i), top, width: bw, height: bh }}>
                {nd.label}
              </div>
            )
          })}
          <div className="lv-null" style={{ left: nullX + 2, top: cy - 10 }}>
            ∅
          </div>
          {nodes.map((nd) => {
            const a = slotOf.get(nd.id)
            if (nd.next !== null || a === undefined || a >= n - 1) return null
            return (
              <div key={`null${nd.id}`} className="lv-null" style={{ left: left(a) + bw / 2 - 6, top: top + bh + 24 }}>
                ∅
              </div>
            )
          })}
          {labels.map((p) => {
            const slot = slotOf.get(p.id)
            if (slot === undefined) return null
            return (
              <motion.div key={p.name} className={`lv-ptr tone-${p.tone ?? 'idle'}`} initial={false} animate={{ x: left(slot) + bw / 2, y: top - 22 - p.k * 22 }} transition={spring}>
                <span>▼ {p.name}</span>
              </motion.div>
            )
          })}
        </>
      )}
    </div>
  )
}
