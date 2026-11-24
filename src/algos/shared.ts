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

/**
 * 读入题目规定格式的输入：把文本按空白切成一个个词，依次读取。
 * 读不对（缺内容、不是整数、超出范围）就抛出 InputError，readInput 会把它变成中文提示。
 */
export class InputError extends Error {}

export class Reader {
  private t: string[]
  private i = 0
  constructor(text: string) {
    this.t = text.trim().split(/\s+/).filter(Boolean)
  }
  private next(what: string): string {
    if (this.i >= this.t.length) throw new InputError(`输入不完整，还缺少「${what}」。`)
    return this.t[this.i++]
  }
  int(what: string, lo: number, hi: number): number {
    const s = this.next(what)
    if (!/^[+-]?\d+$/.test(s)) throw new InputError(`「${what}」应该是整数，读到的是“${s}”。`)
    const v = Number(s)
    if (v < lo || v > hi) throw new InputError(`「${what}」要在 ${lo}～${hi} 之间，读到的是 ${v}。`)
    return v
  }
  ints(n: number, what: string, lo: number, hi: number): number[] {
    return Array.from({ length: n }, (_, k) => this.int(`${what}第 ${k + 1} 个`, lo, hi))
  }
  /** 读一个符合 re 的词，比如一个小写字母串、一个括号串 */
  word(what: string, re: RegExp, rule: string): string {
    const s = this.next(what)
    if (!re.test(s)) throw new InputError(`「${what}」${rule}，读到的是“${s}”。`)
    return s
  }
  /** 读一个操作符，只能是 allowed 里的某一个 */
  op<T extends string>(what: string, allowed: readonly T[]): T {
    const s = this.next(what)
    if (!(allowed as readonly string[]).includes(s)) throw new InputError(`「${what}」只能是 ${allowed.join(' 或 ')}，读到的是“${s}”。`)
    return s as T
  }
  /** 输入应该到此为止，后面多出来的内容说明个数和前面写的对不上 */
  end() {
    if (this.i < this.t.length) throw new InputError(`后面多出了“${this.t.slice(this.i, this.i + 3).join(' ')}”，请检查前面写的个数是否和实际内容一致。`)
  }
}

export const fail = (msg: string): never => {
  throw new InputError(msg)
}

export function readInput<I>(text: string, f: (r: Reader) => I): ParseResult<I> {
  try {
    return { ok: true, value: f(new Reader(text)) }
  } catch (e) {
    if (e instanceof InputError) return { ok: false, error: e.message }
    throw e
  }
}

/** “第一行 n，第二行 n 个整数”这种最常见的输入（排序、链表等都用它） */
export function arrayInput(o: { min: number; max: number; lo: number; hi: number; what?: string }) {
  const what = o.what ?? '数'
  return {
    parse: (text: string): ParseResult<number[]> =>
      readInput(text, (r) => {
        const n = r.int('n', o.min, o.max)
        const a = r.ints(n, what, o.lo, o.hi)
        r.end()
        return a
      }),
    format: (a: number[]) => `${a.length}\n${a.join(' ')}`,
  }
}

export interface ParsedEdge {
  a: number
  b: number
  w: number
}

/**
 * 读入一张图：第一行 n m，接下来 m 行，每行一条边（a b，带权图是 a b w）。结点编号从 1 开始。
 * 不允许自环和重复的边，演示里的画面处理不了。
 */
export function readGraph(r: Reader, o: { weighted: boolean; directed: boolean; maxN: number; maxM: number; minM?: number }): { n: number; edges: ParsedEdge[] } {
  const n = r.int('结点数 n', 2, o.maxN)
  const m = r.int('边数 m', o.minM ?? 1, o.maxM)
  const edges: ParsedEdge[] = []
  const seen = new Set<string>()
  for (let k = 1; k <= m; k++) {
    const a = r.int(`第 ${k} 条边的起点`, 1, n)
    const b = r.int(`第 ${k} 条边的终点`, 1, n)
    const w = o.weighted ? r.int(`第 ${k} 条边的权值`, 1, 99) : 1
    if (a === b) fail('演示里不支持自己连自己的边。')
    const key = o.directed ? `${a}>${b}` : `${Math.min(a, b)}-${Math.max(a, b)}`
    if (seen.has(key)) fail('同一条边请只写一次。')
    seen.add(key)
    edges.push({ a, b, w })
  }
  return { n, edges }
}

export const formatGraph = (n: number, edges: ParsedEdge[], weighted: boolean) => `${n} ${edges.length}\n${edges.map((e) => (weighted ? `${e.a} ${e.b} ${e.w}` : `${e.a} ${e.b}`)).join('\n')}`

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
