import type { ParseResult } from '../engine/types'

/** 把“1 2, 3、4”这样的文本拆成数字（不检查范围） */
export function toNums(text: string): number[] {
  return text
    .trim()
    .split(/[\s,，、]+/)
    .filter(Boolean)
    .map(Number)
}

/** 解析一串整数，并检查个数与取值范围 */
export function parseList(text: string, o: { min: number; max: number; lo: number; hi: number }): ParseResult<number[]> {
  const nums = toNums(text)
  if (nums.length < o.min || nums.length > o.max) return { ok: false, error: `请输入 ${o.min}～${o.max} 个整数，用空格隔开。` }
  if (nums.some((x) => !Number.isInteger(x) || x < o.lo || x > o.hi)) return { ok: false, error: `每个数都要是 ${o.lo}～${o.hi} 之间的整数。` }
  return { ok: true, value: nums }
}

export const randInt = (lo: number, hi: number) => lo + Math.floor(Math.random() * (hi - lo + 1))
export const randList = (n: number, lo = 1, hi = 95) => Array.from({ length: n }, () => randInt(lo, hi))

/** 按“|”切成左右两半（支持全角竖线） */
export const splitBar = (text: string) => text.split(/[|｜]/)

export interface ParsedEdge {
  a: number
  b: number
  w: number
}

/**
 * 解析边的列表。写法：无向边 1-2，有向边 1>2，带权值就在后面加 :5（比如 1-2:5）。
 * 结点编号从 1 开始，结点个数取最大的那个编号。
 */
export function parseEdges(text: string, o: { weighted: boolean; directed: boolean; maxN: number; maxM: number; minM?: number }): ParseResult<{ n: number; edges: ParsedEdge[] }> {
  const tokens = text.trim().split(/[\s,，;；]+/).filter(Boolean)
  const sep = o.directed ? '>' : '-'
  const example = o.directed ? '1>2 1>3 2>4' : o.weighted ? '1-2:4 1-3:2 2-3:1' : '1-2 1-3 2-4'
  if (tokens.length < (o.minM ?? 1) || tokens.length > o.maxM) return { ok: false, error: `请写 ${o.minM ?? 1}～${o.maxM} 条边，用空格隔开，例如：${example}` }
  const edges: ParsedEdge[] = []
  let n = 0
  for (const t of tokens) {
    const m = (o.directed ? /^(\d+)>(\d+)(?::(-?\d+))?$/ : /^(\d+)-(\d+)(?::(-?\d+))?$/).exec(t)
    if (!m) return { ok: false, error: `“${t}”不对：边要写成 ${o.weighted ? `a${sep}b:权值` : `a${sep}b`}，例如 ${example}` }
    const a = Number(m[1])
    const b = Number(m[2])
    if (o.weighted && m[3] === undefined) return { ok: false, error: `“${t}”缺少权值，要写成 a${sep}b:权值。` }
    const w = m[3] === undefined ? 1 : Number(m[3])
    if (a < 1 || b < 1 || a > o.maxN || b > o.maxN) return { ok: false, error: `结点编号要在 1～${o.maxN} 之间。` }
    if (a === b) return { ok: false, error: '演示里不支持自己连自己的边。' }
    if (o.weighted && (w < 1 || w > 99)) return { ok: false, error: '权值请取 1～99。' }
    n = Math.max(n, a, b)
    edges.push({ a, b, w })
  }
  const seen = new Set<string>()
  for (const e of edges) {
    const k = o.directed ? `${e.a}>${e.b}` : `${Math.min(e.a, e.b)}-${Math.max(e.a, e.b)}`
    if (seen.has(k)) return { ok: false, error: '同一条边请只写一次。' }
    seen.add(k)
  }
  return { ok: true, value: { n, edges } }
}

export const formatEdges = (edges: ParsedEdge[], o: { weighted: boolean; directed: boolean }) => edges.map((e) => `${e.a}${o.directed ? '>' : '-'}${e.b}${o.weighted ? ':' + e.w : ''}`).join(' ')

/** 随机生成一个连通的无向图：先连一棵随机的树，再随机补几条边 */
export function randomGraph(n: number, extra: number, weighted: boolean): ParsedEdge[] {
  const edges: ParsedEdge[] = []
  const seen = new Set<string>()
  const add = (a: number, b: number) => {
    const k = `${Math.min(a, b)}-${Math.max(a, b)}`
    if (a === b || seen.has(k)) return false
    seen.add(k)
    edges.push({ a, b, w: weighted ? randInt(1, 9) : 1 })
    return true
  }
  for (let v = 2; v <= n; v++) add(randInt(1, v - 1), v)
  for (let i = 0, tries = 0; i < extra && tries < 50; tries++) if (add(randInt(1, n), randInt(1, n))) i++
  return edges.sort(() => Math.random() - 0.5)
}
