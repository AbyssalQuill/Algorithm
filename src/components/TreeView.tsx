import { motion } from 'motion/react'
import { useWidth } from '../hooks'
import type { Tone } from './ArrayView'

export interface TNode {
  id: number
  label: string | number
  /** 二叉树：左右孩子的 id（没有就不写或写 null） */
  left?: number | null
  right?: number | null
  /** 多叉树（字典树）：按顺序排列的孩子 id */
  kids?: number[]
  tone?: Tone
  /** 从父结点连到这个结点的那条边的颜色 */
  edge?: Tone
  /** 结点下方的小字（比如线段树里的区间） */
  sub?: string
  /** 画成双圈：表示“一个单词到这里结束”之类的标记 */
  ring?: boolean
}

const spring = { type: 'spring', stiffness: 260, damping: 26, mass: 0.8 } as const

interface Layout {
  pos: Map<number, { x: number; d: number }>
  slots: number
  depth: number
}

/** 排版：二叉树按“中序”给每个结点一个横向位置（保证左右分明）；多叉树按“叶子”排，父结点取孩子的中点 */
export function layoutTree(nodes: Map<number, TNode>, root: number | null, mode: 'binary' | 'tidy'): Layout {
  const pos = new Map<number, { x: number; d: number }>()
  let counter = 0
  let depth = 0
  const walk = (id: number, d: number): number => {
    const n = nodes.get(id)
    if (!n) return counter
    depth = Math.max(depth, d)
    if (mode === 'binary') {
      if (n.left != null) walk(n.left, d + 1)
      const x = counter++
      pos.set(id, { x, d })
      if (n.right != null) walk(n.right, d + 1)
      return x
    }
    const kids = n.kids ?? []
    if (kids.length === 0) {
      const x = counter++
      pos.set(id, { x, d })
      return x
    }
    const xs = kids.map((k) => walk(k, d + 1))
    const x = (xs[0] + xs[xs.length - 1]) / 2
    pos.set(id, { x, d })
    return x
  }
  if (root !== null && nodes.has(root)) walk(root, 0)
  return { pos, slots: Math.max(counter, 1), depth }
}

/** 树形可视化：结点是圆，边是线，结点按 id 追踪，树的形状变化时会顺滑地移动 */
export function TreeView({
  nodes,
  root,
  mode = 'binary',
  levels = 4,
  maxSlots = 8,
  hideRoot = false,
}: {
  nodes: TNode[]
  root: number | null
  mode?: 'binary' | 'tidy'
  /** 至少给几层的高度，避免树长高时整个页面跳动 */
  levels?: number
  /** 至少按几个横向位置留宽，避免树变宽时结点缩小 */
  maxSlots?: number
  /** 不画根结点：用来把一片“森林”画成几棵并排的树（并查集），此时根只是个看不见的总根 */
  hideRoot?: boolean
}) {
  const [ref, w] = useWidth<HTMLDivElement>()
  const map = new Map(nodes.map((n) => [n.id, n]))
  const { pos, slots, depth } = layoutTree(map, root, mode)
  const cols = Math.max(slots, maxSlots)
  const sw = Math.min(64, Math.max(30, w / cols))
  const total = slots * sw
  const x0 = Math.max(0, (w - total) / 2)
  const r = Math.min(20, sw * 0.42)
  const off = hideRoot ? 1 : 0
  const lv = Math.max(depth + 1 - off, levels - off, 1)
  const levelH = Math.min(70, Math.max(46, 300 / lv))
  const px = (id: number) => x0 + ((pos.get(id)?.x ?? 0) + 0.5) * sw
  const py = (id: number) => r + 6 + ((pos.get(id)?.d ?? 0) - off) * levelH
  const height = r * 2 + 12 + (lv - 1) * levelH + 18

  const edges: { from: number; to: number; tone: Tone }[] = []
  for (const n of nodes) {
    const kids = mode === 'binary' ? [n.left, n.right] : n.kids ?? []
    if (hideRoot && n.id === root) continue
    for (const k of kids) if (k != null && map.has(k) && pos.has(k)) edges.push({ from: n.id, to: k, tone: map.get(k)!.edge ?? 'idle' })
  }

  return (
    <div ref={ref} className="tv" style={{ height }}>
      {w > 0 && (
        <>
          <svg className="tv-edges" width={w} height={height} aria-hidden="true">
            {edges.map((e) => (
              <motion.line
                key={`${e.from}-${e.to}`}
                className={`tv-edge tone-${e.tone}`}
                initial={false}
                animate={{ x1: px(e.from), y1: py(e.from), x2: px(e.to), y2: py(e.to) }}
                transition={spring}
              />
            ))}
          </svg>
          {nodes
            .filter((n) => pos.has(n.id) && !(hideRoot && n.id === root))
            .map((n) => (
              <motion.div
                key={n.id}
                className={`tv-node tone-${n.tone ?? 'idle'}${n.ring ? ' tv-ring' : ''}`}
                initial={false}
                animate={{ x: px(n.id) - r, y: py(n.id) - r, width: r * 2, height: r * 2 }}
                transition={spring}
                style={{ fontSize: r < 16 ? 11 : r < 19 ? 13 : 15 }}
              >
                {n.label}
                {n.sub && <span className="tv-sub">{n.sub}</span>}
              </motion.div>
            ))}
        </>
      )}
    </div>
  )
}
