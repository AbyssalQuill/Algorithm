import { motion } from 'motion/react'
import { useWidth } from '../hooks'

export type Tone = 'idle' | 'compare' | 'swap' | 'done' | 'found' | 'dim'
export interface Cell {
  id: number
  v: number
  tone?: Tone
  /** 要显示的文字；不写就显示 v（柱状图的高度始终由 v 决定） */
  label?: string
}
export interface Pointer {
  name: string
  index: number
  tone?: Tone
}

const spring = { type: 'spring', stiffness: 240, damping: 24, mass: 0.9 } as const

/** 数组可视化：bars 是柱状图（排序），boxes 是方格（查找）。元素按 id 追踪，交换时会顺滑地滑到新位置 */
export function ArrayView({
  cells,
  pointers = [],
  mode = 'bars',
  areaH = 230,
  minSlots = 1,
  base = 0,
}: {
  cells: Cell[]
  pointers?: Pointer[]
  mode?: 'bars' | 'boxes'
  areaH?: number
  /** 至少给指针留几行，避免指针叠起来时整体高度跳动 */
  minSlots?: number
  /** 下标标签从几开始数（前缀和里的数组从 1 开始） */
  base?: number
}) {
  const [ref, w] = useWidth<HTMLDivElement>()
  const n = cells.length
  const gap = w < 520 ? 4 : 8
  const pad = 14
  const cw = Math.max(16, Math.min(64, Math.floor((w - pad * 2 - gap * (n - 1)) / n)))
  const total = n * cw + (n - 1) * gap
  const x0 = Math.max(pad, (w - total) / 2)
  const xOf = (i: number) => x0 + i * (cw + gap)
  const maxV = Math.max(1, ...cells.map((c) => c.v))
  const stageH = mode === 'bars' ? areaH : cw

  const slots = new Map<number, number>()
  const ptrs = pointers.map((p) => {
    const idx = Math.min(Math.max(p.index, 0), n - 1)
    const slot = slots.get(idx) ?? 0
    slots.set(idx, slot + 1)
    const out = p.index < 0 ? '←越界' : p.index >= n ? '越界→' : ''
    return { ...p, idx, slot, out }
  })
  const maxSlot = ptrs.reduce((m, p) => Math.max(m, p.slot), -1)
  const ptrTop = stageH + 30
  const height = ptrTop + Math.max(maxSlot + 1, minSlots) * 28 + 8

  return (
    <div ref={ref} className="av" style={{ height }}>
      {w > 0 && (
        <>
          {cells.map((c, i) => {
            const h = mode === 'bars' ? 30 + (c.v / maxV) * (areaH - 30) : cw
            return (
              <motion.div
                key={c.id}
                className={`av-cell av-${mode} tone-${c.tone ?? 'idle'}`}
                initial={false}
                animate={{ x: xOf(i), y: stageH - h, width: cw, height: h }}
                transition={spring}
                style={{ fontSize: cw < 28 ? 11 : 15 }}
              >
                <span className="av-val">{c.label ?? c.v}</span>
              </motion.div>
            )
          })}
          {cells.map((_, i) => (
            <div key={`idx${i}`} className="av-idx" style={{ left: xOf(i), width: cw, top: stageH + 8 }}>
              {i + base}
            </div>
          ))}
          {ptrs.map((p) => (
            <motion.div
              key={p.name}
              className={`av-ptr tone-${p.tone ?? 'idle'}`}
              initial={false}
              animate={{ x: xOf(p.idx) + cw / 2, y: ptrTop + p.slot * 28 }}
              transition={spring}
            >
              <span>
                ▲ {p.name}
                {p.out && <em> {p.out}</em>}
              </span>
            </motion.div>
          ))}
        </>
      )}
    </div>
  )
}
