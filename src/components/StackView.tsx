import { AnimatePresence, motion } from 'motion/react'

export interface StackItem {
  id: number
  ch: string
}

const spring = { type: 'spring', stiffness: 320, damping: 26 } as const

/** 栈可视化：开口向上的杯子，只能从上面放入、拿走 */
export function StackView({ items, capacity }: { items: StackItem[]; capacity: number }) {
  const cap = Math.max(4, capacity)
  const itemH = cap <= 8 ? 40 : Math.max(20, Math.floor(330 / cap) - 4)
  const cupH = cap * (itemH + 6) + 14
  return (
    <div className="stack-wrap">
      <div className="stack-label">栈（后进先出）</div>
      <div className="stack-cup" style={{ height: cupH }}>
        <AnimatePresence initial={false}>
          {items.map((it, i) => (
            <motion.div
              key={it.id}
              layout
              className={`stack-item${i === items.length - 1 ? ' is-top' : ''}`}
              initial={{ y: -70, opacity: 0, scale: 0.9 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -70, opacity: 0, scale: 0.9 }}
              transition={spring}
              style={{ height: itemH, fontSize: itemH < 28 ? 13 : 18 }}
            >
              {it.ch}
              {i === items.length - 1 && <span className="stack-top-tag">← 栈顶</span>}
            </motion.div>
          ))}
        </AnimatePresence>
        {items.length === 0 && <div className="stack-empty">空栈</div>}
      </div>
    </div>
  )
}
