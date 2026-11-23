import { describe, expect, it } from 'vitest'
import { dijkstra, runDijkstra } from '../src/algos/dijkstra'
import { graphDfs, runDfs } from '../src/algos/graphDfs'
import { randomGraph } from '../src/algos/shared'
import { itPrograms, rnd } from './helpers'

describe('深度优先搜索', () => {
  it('访问的恰好是起点所在连通块里的全部结点，且每个只访问一次', () => {
    for (let t = 0; t < 300; t++) {
      const n = rnd(3, 7)
      const edges = randomGraph(n, rnd(0, 3), false).filter(() => Math.random() < 0.85)
      const start = rnd(1, n)
      const last = runDfs({ n, edges, start }).at(-1)!.state
      // 参考：用并查集式的反复扩张求连通块
      const comp = new Set([start])
      for (let k = 0; k < n; k++) for (const e of edges) if (comp.has(e.a) || comp.has(e.b)) (comp.add(e.a), comp.add(e.b))
      expect(new Set(last.order)).toEqual(comp)
      expect(last.order.length).toBe(comp.size)
      expect(last.order[0]).toBe(start)
    }
  })
  itPrograms(graphDfs, () =>
    Array.from({ length: 20 }, () => {
      const n = rnd(3, 7)
      const edges = randomGraph(n, rnd(0, 3), false)
      const start = rnd(1, n)
      const order = runDfs({ n, edges, start }).at(-1)!.state.order
      return { input: `${n} ${edges.length}\n${edges.map((e) => `${e.a} ${e.b}`).join('\n')}\n${start}\n`, expected: order.join(' ') }
    }),
  )
})

describe('Dijkstra', () => {
  /** 参考解：Bellman-Ford，写法和 Dijkstra 完全不同 */
  const ref = (n: number, edges: { a: number; b: number; w: number }[], s: number) => {
    const d = new Array(n + 1).fill(Infinity)
    d[s] = 0
    for (let k = 0; k < n; k++)
      for (const e of edges) {
        if (d[e.a] + e.w < d[e.b]) d[e.b] = d[e.a] + e.w
        if (d[e.b] + e.w < d[e.a]) d[e.a] = d[e.b] + e.w
      }
    return d.slice(1).map((x) => (x === Infinity ? -1 : x))
  }
  it('最短距离与 Bellman-Ford 一致（含不连通的情况）', () => {
    for (let t = 0; t < 300; t++) {
      const n = rnd(3, 7)
      const edges = randomGraph(n, rnd(0, 4), true).filter(() => Math.random() < 0.9)
      const start = rnd(1, n)
      const last = runDijkstra({ n, edges, start }).at(-1)!.state
      expect(last.dist.slice(1).map((x) => (x === null ? -1 : x))).toEqual(ref(n, edges, start))
    }
  })
  itPrograms(dijkstra, () =>
    Array.from({ length: 20 }, () => {
      const n = rnd(3, 7)
      const edges = randomGraph(n, rnd(0, 4), true).filter(() => Math.random() < 0.9)
      const start = rnd(1, n)
      return { input: `${n} ${edges.length}\n${edges.map((e) => `${e.a} ${e.b} ${e.w}`).join('\n')}\n${start}\n`, expected: ref(n, edges, start).join(' ') }
    }),
  )
})
