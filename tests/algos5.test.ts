import { describe, expect, it } from 'vitest'
import { bst, preorderOf, runBst } from '../src/algos/bst'
import { heap, runHeap } from '../src/algos/heap'
import { itPrograms, rnd } from './helpers'

const distinct = (n: number, lo = 1, hi = 99) => {
  const s = new Set<number>()
  while (s.size < n) s.add(rnd(lo, hi))
  return [...s]
}

/** 参考解：用最朴素的方式建 BST 再取前序 */
function refPreorder(vals: number[]): number[] {
  type N = { v: number; l?: N; r?: N }
  let root: N | undefined
  for (const v of vals) {
    if (!root) {
      root = { v }
      continue
    }
    let p = root
    for (;;) {
      if (v < p.v) {
        if (p.l) p = p.l
        else {
          p.l = { v }
          break
        }
      } else if (p.r) p = p.r
      else {
        p.r = { v }
        break
      }
    }
  }
  const out: number[] = []
  const walk = (n?: N) => {
    if (!n) return
    out.push(n.v)
    walk(n.l)
    walk(n.r)
  }
  walk(root)
  return out
}

describe('二叉搜索树', () => {
  it('前序遍历与参考解一致，查找结果正确，中序是升序', () => {
    for (let t = 0; t < 300; t++) {
      const vals = distinct(rnd(1, 9))
      const target = Math.random() < 0.5 ? vals[rnd(0, vals.length - 1)] : rnd(1, 99)
      const last = runBst({ vals, target }).at(-1)!.state
      expect(preorderOf(last)).toEqual(refPreorder(vals))
      expect(last.result).toBe(vals.includes(target) ? 'hit' : 'miss')
      const inorder: number[] = []
      const walk = (id: number | null) => {
        if (id === null) return
        const n = last.nodes.find((q) => q.id === id)!
        walk(n.l)
        inorder.push(n.v)
        walk(n.r)
      }
      walk(last.root)
      expect(inorder).toEqual([...vals].sort((a, b) => a - b))
    }
  })
  itPrograms(bst, () =>
    Array.from({ length: 20 }, () => {
      const vals = distinct(rnd(1, 9))
      const target = Math.random() < 0.5 ? vals[rnd(0, vals.length - 1)] : rnd(1, 99)
      return { input: `${vals.length}\n${vals.join(' ')}\n${target}\n`, expected: `${refPreorder(vals).join(' ')} ${vals.includes(target) ? 'YES' : 'NO'}` }
    }),
  )
})

describe('堆', () => {
  it('依次弹出的数是最小的几个，并且每一帧都满足堆的规则', () => {
    for (let t = 0; t < 200; t++) {
      const vals = Array.from({ length: rnd(2, 10) }, () => rnd(1, 30))
      const pops = rnd(1, vals.length)
      const frames = runHeap({ vals, pops })
      const last = frames.at(-1)!.state
      expect(last.popped).toEqual([...vals].sort((a, b) => a - b).slice(0, pops))
      for (const f of frames) if (f.step === 'done' || f.step === 'init') for (let i = 2; i <= f.state.h.length; i++) expect(f.state.h[(i >> 1) - 1]).toBeLessThanOrEqual(f.state.h[i - 1])
    }
  })
  itPrograms(heap, () =>
    Array.from({ length: 20 }, () => {
      const vals = Array.from({ length: rnd(1, 30) }, () => rnd(1, 99))
      const pops = rnd(1, vals.length)
      return { input: `${vals.length} ${pops}\n${vals.join(' ')}\n`, expected: [...vals].sort((a, b) => a - b).slice(0, pops).join(' ') }
    }),
  )
})

import { runSeg, segTree, type SegOp } from '../src/algos/segTree'
import { buildTree, runTraversal, treeTraversal } from '../src/algos/treeTraversal'
import { runTrie, trie } from '../src/algos/trie'

const randWord = (lo: number, hi: number) => Array.from({ length: rnd(lo, hi) }, () => 'abc'[rnd(0, 2)]).join('')

describe('字典树', () => {
  it('查询结果与集合判断一致（单词 / 前缀 / 不存在）', () => {
    for (let t = 0; t < 300; t++) {
      const words = Array.from({ length: rnd(1, 5) }, () => randWord(1, 4))
      const query = Math.random() < 0.5 ? words[rnd(0, words.length - 1)] : randWord(1, 4)
      const last = runTrie({ words, query }).at(-1)!.state
      const isWord = words.includes(query)
      const isPrefix = words.some((w) => w.startsWith(query))
      expect(last.result, `${words} | ${query}`).toBe(isWord ? 'word' : isPrefix ? 'prefix' : 'miss')
      const prefixes = new Set(words.flatMap((w) => [...w].map((_, i) => w.slice(0, i + 1))))
      expect(last.nodes.length).toBe(prefixes.size + 1)
    }
  })
  itPrograms(trie, () =>
    Array.from({ length: 25 }, () => {
      const words = Array.from({ length: rnd(1, 6) }, () => randWord(1, 5))
      const query = Math.random() < 0.5 ? words[rnd(0, words.length - 1)] : randWord(1, 5)
      return { input: `${words.length}\n${words.join('\n')}\n${query}\n`, expected: words.includes(query) ? 'YES' : 'NO' }
    }),
  )
})

describe('线段树', () => {
  const randOps = (n: number): SegOp[] => {
    const q = (): SegOp => {
      const a = rnd(1, n)
      const b = rnd(1, n)
      return { kind: 'q', l: Math.min(a, b), r: Math.max(a, b) }
    }
    return Array.from({ length: rnd(1, 4) }, (): SegOp => (Math.random() < 0.6 ? q() : { kind: 'u', i: rnd(1, n), v: rnd(0, 50) })).concat([q()])
  }
  const naive = (arr: number[], ops: SegOp[]) => {
    const a = [...arr]
    const out: number[] = []
    for (const o of ops) {
      if (o.kind === 'q') out.push(a.slice(o.l - 1, o.r).reduce((x, y) => x + y, 0))
      else a[o.i - 1] = o.v
    }
    return out
  }
  it('每次查询的结果与逐个相加一致', () => {
    for (let t = 0; t < 300; t++) {
      const n = rnd(3, 8)
      const arr = Array.from({ length: n }, () => rnd(0, 30))
      const ops = randOps(n)
      expect(runSeg({ arr, ops }).at(-1)!.state.results).toEqual(naive(arr, ops))
    }
  })
  itPrograms(segTree, () =>
    Array.from({ length: 25 }, () => {
      const n = rnd(3, 30)
      const arr = Array.from({ length: n }, () => rnd(0, 99))
      const ops = randOps(n)
      return { input: `${n}\n${arr.join(' ')}\n${ops.length}\n${ops.map((o) => (o.kind === 'q' ? `1 ${o.l} ${o.r}` : `2 ${o.i} ${o.v}`)).join('\n')}\n`, expected: naive(arr, ops).join(' ') }
    }),
  )
})

describe('二叉树遍历', () => {
  const refOrders = (level: number[]) => {
    const { nodes, root } = buildTree(level)
    const pre: number[] = []
    const ino: number[] = []
    const post: number[] = []
    const walk = (id: number | null) => {
      if (id === null) return
      const n = nodes[id]
      pre.push(n.v)
      walk(n.l)
      ino.push(n.v)
      walk(n.r)
      post.push(n.v)
    }
    walk(root)
    const lvl: number[] = []
    const q = root === null ? [] : [root]
    while (q.length) {
      const u = q.shift()!
      lvl.push(nodes[u].v)
      if (nodes[u].l !== null) q.push(nodes[u].l!)
      if (nodes[u].r !== null) q.push(nodes[u].r!)
    }
    return { pre, ino, post, lvl }
  }
  it('四种遍历的结果各自满足定义，且每个结点恰好出现一次', () => {
    for (let t = 0; t < 200; t++) {
      const level = treeTraversal.random()
      const last = runTraversal(level).at(-1)!.state
      const ref = refOrders(level)
      expect(last.outputs.pre).toEqual(ref.pre)
      expect(last.outputs.in).toEqual(ref.ino)
      expect(last.outputs.post).toEqual(ref.post)
      expect(last.outputs.level).toEqual(ref.lvl)
      expect(sorted(last.outputs.pre)).toEqual(sorted(last.outputs.level))
    }
  })
  itPrograms(treeTraversal, () =>
    Array.from({ length: 20 }, () => {
      const level = treeTraversal.random()
      const r = refOrders(level)
      return { input: `${level.length}\n${level.join(' ')}\n`, expected: [...r.pre, ...r.ino, ...r.post, ...r.lvl].join(' ') }
    }),
  )
})

function sorted(a: number[]) {
  return [...a].sort((x, y) => x - y)
}
