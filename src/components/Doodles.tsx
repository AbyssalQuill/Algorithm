import type { ReactNode } from 'react'
import { motion } from 'motion/react'

/** 手绘圈：把一个词圈起来，像用铅笔随手画了一圈。进入页面时会“画”出来 */
export function Circled({ children, delay = 0.9, color = 'var(--blue)' }: { children: ReactNode; delay?: number; color?: string }) {
  return (
    <span className="circled">
      {children}
      <svg className="circle-svg" viewBox="0 0 200 80" preserveAspectRatio="none" aria-hidden="true">
        <motion.path
          d="M 14 48 C 6 22 58 6 112 8 C 168 10 197 28 187 50 C 177 70 112 77 62 73 C 26 69 5 57 13 33"
          fill="none"
          stroke={color}
          strokeWidth="3.4"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          filter="url(#pencil-a)"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.1, delay, ease: 'easeInOut' }}
        />
      </svg>
    </span>
  )
}

/** 手绘弯箭头 */
export function Arrow({ className, color = 'var(--ink-2)' }: { className?: string; color?: string }) {
  return (
    <svg className={className} width="120" height="70" viewBox="0 0 120 70" fill="none" aria-hidden="true">
      <motion.g
        stroke={color}
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#pencil-a)"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.9, delay: 1.3, ease: 'easeOut' }}
      >
        <motion.path d="M6 14 C 30 4, 80 6, 104 46" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.9, delay: 1.3, ease: 'easeOut' }} />
        <motion.path d="M84 40 L105 48 L106 24" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.4, delay: 2.1 }} />
      </motion.g>
    </svg>
  )
}

/** 小星星/火花 */
export function Sparkle({ className, color = 'var(--yellow-edge)' }: { className?: string; color?: string }) {
  return (
    <svg className={className} width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <g stroke={color} strokeWidth="2.4" strokeLinecap="round" filter="url(#pencil-a)">
        <path d="M14 3 L14 25" />
        <path d="M3 14 L25 14" />
        <path d="M6 6 L22 22" />
        <path d="M22 6 L6 22" />
      </g>
    </svg>
  )
}

/** 一支铅笔（装饰用） */
export function PencilArt({ className }: { className?: string }) {
  return (
    <svg className={className} width="190" height="34" viewBox="0 0 190 34" fill="none" aria-hidden="true">
      <g filter="url(#pencil-a)" strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round">
        <path d="M4 8 H20 V26 H4 Q0 26 0 22 V12 Q0 8 4 8 Z" fill="#f4a9a0" stroke="var(--pencil)" />
        <path d="M20 8 H30 V26 H20 Z" fill="#c9ccd2" stroke="var(--pencil)" />
        <path d="M30 8 H138 V26 H30 Z" fill="#ffd54a" stroke="var(--pencil)" />
        <path d="M30 14 H138 M30 20 H138" stroke="#e0a100" strokeWidth="1.4" />
        <path d="M138 8 L176 17 L138 26 Z" fill="#f6dfb8" stroke="var(--pencil)" />
        <path d="M168 14.2 L186 17 L168 19.8 Z" fill="var(--pencil)" stroke="var(--pencil)" strokeWidth="1.4" />
      </g>
    </svg>
  )
}

/** logo：一个手画的方格本，中间涂黄了一格 */
export function LogoMark() {
  return (
    <svg className="brand-mark" width="34" height="34" viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <g filter="url(#pencil-a)" stroke="var(--pencil)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 10 C 24 7, 44 9, 56 8 C 57 24, 55 42, 56 56 C 40 58, 22 55, 8 57 C 7 42, 9 24, 9 10 Z" fill="var(--face)" />
        <path d="M22 9 C 21 26, 23 40, 22 56 M42 9 C 41 24, 43 40, 42 57 M9 24 C 24 23, 40 25, 56 24 M8 41 C 24 40, 40 42, 57 41" strokeWidth="1.6" stroke="var(--blue)" />
        <path d="M23 25 H41 V40 H23 Z" fill="var(--yellow)" stroke="var(--pencil)" strokeWidth="2.4" />
      </g>
    </svg>
  )
}
