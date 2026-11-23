import { describe, expect, it } from 'vitest'
import { diffArray, runDiff } from '../src/algos/diffArray'
import { mergeSort, runMergeSort } from '../src/algos/mergeSort'
import { runSelectionSort, selectionSort } from '../src/algos/selectionSort'
import { itPrograms, rnd, rndList } from './helpers'

const sorted = (a: number[]) => [...a].sort((x, y) => x - y)

describe('选择排序', () => {
  it('结果与 sort 一致，交换次数不超过 n-1', () => {
    for (let t = 0; t < 200; t++) {
      const arr = rndList(rnd(2, 12), 1, 30)
      const last = runSelectionSort(arr).at(-1)!.state
      expect(last.cells.map((c) => c.v)).toEqual(sorted(arr))
      expect(last.swaps).toBeLessThanOrEqual(arr.length - 1)
      expect(last.compares).toBe((arr.length * (arr.length - 1)) / 2)
    }
  })
  itPrograms(selectionSort, () =>
    [[5, 3, 8, 1, 9, 2, 7], [1], [3, 3, 3], [9, 8, 7, 6, 5, 4, 3, 2, 1], rndList(40, 1, 99)].map((arr) => ({ input: `${arr.length}\n${arr.join(' ')}\n`, expected: sorted(arr).join(' ') })),
  )
})

describe('归并排序', () => {
  it('结果与 sort 一致，辅助数组最后是空的', () => {
    for (let t = 0; t < 200; t++) {
      const arr = rndList(rnd(2, 10), 1, 30)
      const last = runMergeSort(arr).at(-1)!.state
      expect(last.cells.map((c) => c.v)).toEqual(sorted(arr))
      expect(last.tmp.every((x) => x === null)).toBe(true)
      expect(last.merges).toBe(arr.length - 1)
    }
  })
  it('稳定：相等的数保持原来的先后顺序', () => {
    const arr = [4, 2, 4, 1, 4]
    const ids = runMergeSort(arr).at(-1)!.state.cells.filter((c) => c.v === 4).map((c) => c.id)
    expect(ids).toEqual([0, 2, 4])
  })
  itPrograms(mergeSort, () =>
    [[6, 2, 9, 4, 7, 1, 8, 3], [1], [3, 3, 3], [9, 8, 7, 6, 5, 4, 3, 2, 1], rndList(60, 1, 99), rndList(200, 1, 20)].map((arr) => ({ input: `${arr.length}\n${arr.join(' ')}\n`, expected: sorted(arr).join(' ') })),
  )
})

describe('差分', () => {
  const naive = (arr: number[], ops: { l: number; r: number; k: number }[]) => {
    const a = [...arr]
    for (const o of ops) for (let i = o.l; i <= o.r; i++) a[i - 1] += o.k
    return a
  }
  const randCase = () => {
    const n = rnd(2, 8)
    const arr = rndList(n, -20, 20)
    const ops = Array.from({ length: rnd(1, 4) }, () => {
      const a = rnd(1, n)
      const b = rnd(1, n)
      return { l: Math.min(a, b), r: Math.max(a, b), k: rnd(-20, 20) }
    })
    return { arr, ops }
  }
  it('还原的结果与逐个修改一致', () => {
    for (let t = 0; t < 300; t++) {
      const { arr, ops } = randCase()
      const last = runDiff({ arr, ops }).at(-1)!.state
      expect(last.res.slice(1)).toEqual(naive(arr, ops))
    }
  })
  itPrograms(diffArray, () =>
    Array.from({ length: 20 }, () => {
      const { arr, ops } = randCase()
      return { input: `${arr.length}\n${arr.join(' ')}\n${ops.length}\n${ops.map((o) => `${o.l} ${o.r} ${o.k}`).join('\n')}\n`, expected: naive(arr, ops).join(' ') }
    }),
  )
})
