import { describe, expect, it } from 'vitest'
import { bit, runBit, type BitOp } from '../src/algos/bit'
import { dsu, runDsu, type DsuOp } from '../src/algos/dsu'
import { hashTable, runHash } from '../src/algos/hashTable'
import { linkedList, listToArray, runReverse } from '../src/algos/linkedList'
import { itPrograms, rnd, rndList } from './helpers'

describe('链表反转', () => {
  it('结果恰好是原来的倒序，并且每个结点只被处理一次', () => {
    for (let t = 0; t < 200; t++) {
      const arr = rndList(rnd(2, 8), 1, 99)
      const last = runReverse(arr).at(-1)!.state
      expect(listToArray(last)).toEqual([...arr].reverse())
      expect(last.flipped.length).toBe(arr.length)
    }
  })
  itPrograms(linkedList, () =>
    Array.from({ length: 15 }, () => {
      const arr = rndList(rnd(1, 20), 1, 99)
      return { input: `${arr.length}\n${arr.join(' ')}\n`, expected: [...arr].reverse().join(' ') }
    }),
  )
})

describe('并查集', () => {
  /** 参考解：每次合并时把整个集合重新编号，写法和并查集完全不同 */
  const ref = (n: number, ops: DsuOp[]) => {
    const g = Array.from({ length: n + 1 }, (_, i) => i)
    const out: string[] = []
    for (const o of ops) {
      if (o.kind === 'u') {
        const from = g[o.b]
        const to = g[o.a]
        for (let i = 1; i <= n; i++) if (g[i] === from) g[i] = to
      } else out.push(g[o.a] === g[o.b] ? 'Y' : 'N')
    }
    return out
  }
  const randOps = (n: number): DsuOp[] => Array.from({ length: rnd(3, 12) }, (): DsuOp => ({ kind: Math.random() < 0.6 ? 'u' : 'q', a: rnd(1, n), b: rnd(1, n) }))
  it('每次询问的回答与参考解一致，最终 fa 都指向根', () => {
    for (let t = 0; t < 300; t++) {
      const n = rnd(3, 8)
      const ops = randOps(n)
      const last = runDsu({ n, ops }).at(-1)!.state
      expect(last.answers).toEqual(ref(n, ops))
    }
  })
  itPrograms(dsu, () =>
    Array.from({ length: 20 }, () => {
      const n = rnd(3, 30)
      const ops = randOps(n)
      return { input: `${n} ${ops.length}\n${ops.map((o) => `${o.kind === 'u' ? 1 : 2} ${o.a} ${o.b}`).join('\n')}\n`, expected: ref(n, ops).join(' ') }
    }),
  )
})

describe('哈希表', () => {
  const distinct = (n: number) => {
    const s = new Set<number>()
    while (s.size < n) s.add(rnd(1, 99))
    return [...s]
  }
  it('查找结果与 includes 一致，每个数都在 x%7 号桶里', () => {
    for (let t = 0; t < 300; t++) {
      const keys = distinct(rnd(2, 9))
      const target = Math.random() < 0.5 ? keys[rnd(0, keys.length - 1)] : rnd(1, 99)
      const last = runHash({ keys, target }).at(-1)!.state
      expect(last.result).toBe(keys.includes(target) ? 'hit' : 'miss')
      last.buckets.forEach((b, i) => b.forEach((k) => expect(k % 7).toBe(i)))
    }
  })
  itPrograms(hashTable, () =>
    Array.from({ length: 20 }, () => {
      const keys = distinct(rnd(2, 30))
      const target = Math.random() < 0.5 ? keys[rnd(0, keys.length - 1)] : rnd(1, 99)
      return { input: `${keys.length}\n${keys.join(' ')}\n${target}\n`, expected: keys.includes(target) ? 'YES' : 'NO' }
    }),
  )
})

describe('树状数组', () => {
  const randOps = (n: number): BitOp[] => {
    const q = (): BitOp => {
      const a = rnd(1, n)
      const b = rnd(1, n)
      return { kind: 'q', l: Math.min(a, b), r: Math.max(a, b) }
    }
    return Array.from({ length: rnd(1, 4) }, (): BitOp => (Math.random() < 0.5 ? q() : { kind: 'u', i: rnd(1, n), k: rnd(-9, 9) })).concat([q()])
  }
  const naive = (arr: number[], ops: BitOp[]) => {
    const a = [...arr]
    const out: number[] = []
    for (const o of ops) {
      if (o.kind === 'q') out.push(a.slice(o.l - 1, o.r).reduce((x, y) => x + y, 0))
      else a[o.i - 1] += o.k
    }
    return out
  }
  it('每次查询与逐个相加一致', () => {
    for (let t = 0; t < 300; t++) {
      const n = rnd(3, 8)
      const arr = rndList(n, 0, 30)
      const ops = randOps(n)
      expect(runBit({ arr, ops }).at(-1)!.state.results).toEqual(naive(arr, ops))
    }
  })
  itPrograms(bit, () =>
    Array.from({ length: 20 }, () => {
      const n = rnd(3, 40)
      const arr = rndList(n, 0, 99)
      const ops = randOps(n)
      return { input: `${n}\n${arr.join(' ')}\n${ops.length}\n${ops.map((o) => (o.kind === 'q' ? `2 ${o.l} ${o.r}` : `1 ${o.i} ${o.k}`)).join('\n')}\n`, expected: naive(arr, ops).join(' ') }
    }),
  )
})
