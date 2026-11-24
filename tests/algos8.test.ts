import { describe, expect, it } from 'vitest'
import { runStore } from '../src/algos/graphStore'
import { runHanoi } from '../src/algos/hanoi'
import { mstWeight, runKruskal } from '../src/algos/kruskal'
import { runQueens } from '../src/algos/nQueens'
import { randomGraph } from '../src/algos/shared'
import { runTopo, topoSort, type TopoInput } from '../src/algos/topoSort'
import { rnd } from './helpers'

const randEdges = (n: number) => randomGraph(n, rnd(0, 4), true).filter(() => Math.random() < 0.9)

/** 参考解：Prim（和 Kruskal 完全不同的算法），不连通返回 -1 */
function primRef(n: number, edges: { a: number; b: number; w: number }[]) {
  const inT = new Set([1])
  let total = 0
  while (inT.size < n) {
    let best: { a: number; b: number; w: number } | null = null
    for (const e of edges) if (inT.has(e.a) !== inT.has(e.b) && (!best || e.w < best.w)) best = e
    if (!best) return -1
    inT.add(best.a)
    inT.add(best.b)
    total += best.w
  }
  return total
}

describe('Kruskal 最小生成树', () => {
  it('总权值与 Prim 一致（含不连通）', () => {
    for (let t = 0; t < 300; t++) {
      const n = rnd(3, 7)
      const edges = randEdges(n)
      if (edges.length < 2) continue
      const nn = Math.max(n, ...edges.flatMap((e) => [e.a, e.b]))
      expect(mstWeight(runKruskal({ n: nn, edges }).at(-1)!.state), JSON.stringify(edges)).toBe(primRef(nn, edges))
    }
  })
})

describe('拓扑排序', () => {
  const hasCycle = (n: number, edges: { a: number; b: number }[]) => {
    const state = new Array(n + 1).fill(0)
    const adj: number[][] = Array.from({ length: n + 1 }, () => [])
    edges.forEach((e) => adj[e.a].push(e.b))
    const dfs = (u: number): boolean => {
      state[u] = 1
      for (const v of adj[u]) if (state[v] === 1 || (state[v] === 0 && dfs(v))) return true
      state[u] = 2
      return false
    }
    for (let i = 1; i <= n; i++) if (state[i] === 0 && dfs(i)) return true
    return false
  }
  it('有环当且仅当排不完；排出的顺序满足每条边起点在前', () => {
    for (let t = 0; t < 300; t++) {
      const input = topoSort.random() as TopoInput
      const last = runTopo(input).at(-1)!.state
      const cyc = hasCycle(input.n, input.edges)
      expect(last.order.length === input.n).toBe(!cyc)
      if (!cyc) {
        const pos = new Map(last.order.map((v, i) => [v, i]))
        for (const e of input.edges) expect(pos.get(e.a)!).toBeLessThan(pos.get(e.b)!)
      }
    }
  })
})

describe('图的存储', () => {
  it('矩阵是对称的，邻接表的邻居数之和是边数的两倍', () => {
    const n = 5
    const edges = randomGraph(n, 2, false)
    const s = runStore({ n, edges }).at(-1)!.state
    for (let i = 1; i <= n; i++) for (let j = 1; j <= n; j++) expect(s.matrix[i][j]).toBe(s.matrix[j][i])
    expect(s.lists.reduce((a, l) => a + l.length, 0)).toBe(edges.length * 2)
  })
})

describe('N 皇后', () => {
  const known: Record<number, number> = { 4: 2, 5: 10, 6: 4, 7: 40, 8: 92 }
  it('解的个数与已知值一致', () => {
    for (const n of [4, 5, 6]) expect(runQueens(n).at(-1)!.state.count).toBe(known[n])
  })
})

describe('汉诺塔', () => {
  it('每一步都合法，最后所有盘子都在 C 柱，步数是 2^n-1', () => {
    for (let n = 1; n <= 5; n++) {
      const frames = runHanoi(n)
      const last = frames.at(-1)!.state
      expect(last.pegs[2]).toEqual(Array.from({ length: n }, (_, i) => n - i))
      expect(last.moves).toBe(2 ** n - 1)
      for (const f of frames) for (const peg of f.state.pegs) for (let i = 1; i < peg.length; i++) expect(peg[i]).toBeLessThan(peg[i - 1])
    }
  })
})
