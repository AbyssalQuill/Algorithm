import { describe, expect, it } from 'vitest'
import { runDiff } from '../src/algos/diffArray'
import { runMergeSort } from '../src/algos/mergeSort'
import { runSelectionSort } from '../src/algos/selectionSort'
import { rnd, rndList } from './helpers'

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
})
