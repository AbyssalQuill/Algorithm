import { describe, expect, it } from 'vitest'
import { insertionSort, runInsertionSort } from '../src/algos/insertionSort'
import { prefixSum, runPrefixSum } from '../src/algos/prefixSum'
import { quickSort, runQuickSort } from '../src/algos/quickSort'
import { runTwoPointers, twoPointers } from '../src/algos/twoPointers'
import { build, LANG_LIST, tools } from './helpers'

const randInts = (n: number, max = 99) => Array.from({ length: n }, () => 1 + Math.floor(Math.random() * max))
const sorted = (a: number[]) => [...a].sort((x, y) => x - y)

describe('插入排序', () => {
  it('结果与 sort 一致；交换次数 = 逆序对个数', () => {
    for (let t = 0; t < 200; t++) {
      const arr = randInts(2 + Math.floor(Math.random() * 13))
      const last = runInsertionSort(arr).at(-1)!.state
      expect(last.cells.map((c) => c.v)).toEqual(sorted(arr))
      let inv = 0
      for (let i = 0; i < arr.length; i++) for (let j = i + 1; j < arr.length; j++) if (arr[i] > arr[j]) inv++
      expect(last.swaps).toBe(inv)
    }
  })
  const cases = [[5, 3, 8, 1, 9, 2, 7], [1], [3, 3, 3], [9, 8, 7, 6, 5, 4, 3, 2, 1], randInts(14), randInts(40)]
  for (const lang of LANG_LIST) {
    it.skipIf(!tools[lang])(`${lang} 程序`, () => {
      const run = build(insertionSort, lang)
      for (const arr of cases) expect(run(`${arr.length}\n${arr.join(' ')}\n`).trim().split(/\s+/).map(Number)).toEqual(sorted(arr))
    })
  }
})

describe('快速排序', () => {
  it('结果与 sort 一致，最后每个位置都已就位', () => {
    for (let t = 0; t < 200; t++) {
      const arr = randInts(2 + Math.floor(Math.random() * 11), 20)
      const last = runQuickSort(arr).at(-1)!.state
      expect(last.cells.map((c) => c.v)).toEqual(sorted(arr))
      expect([...last.fixed].sort((x, y) => x - y)).toEqual(arr.map((_, i) => i))
    }
  })
  const cases = [[6, 2, 9, 4, 7, 1, 8, 3], [1], [3, 3, 3], [9, 8, 7, 6, 5, 4, 3, 2, 1], randInts(40, 9), randInts(200)]
  for (const lang of LANG_LIST) {
    it.skipIf(!tools[lang])(`${lang} 程序`, () => {
      const run = build(quickSort, lang)
      for (const arr of cases) expect(run(`${arr.length}\n${arr.join(' ')}\n`).trim().split(/\s+/).map(Number)).toEqual(sorted(arr))
    })
  }
})

function bruteTwoSum(arr: number[], t: number) {
  for (let i = 0; i < arr.length; i++) for (let j = i + 1; j < arr.length; j++) if (arr[i] + arr[j] === t) return true
  return false
}

describe('双指针：两数之和', () => {
  it('有解当且仅当存在这样的两个数，且返回的下标确实满足和为目标', () => {
    for (let t = 0; t < 500; t++) {
      const arr = sorted(randInts(2 + Math.floor(Math.random() * 12), 30))
      const target = 2 + Math.floor(Math.random() * 60)
      const last = runTwoPointers({ arr, target }).at(-1)!.state
      expect(last.status === 'found', `${arr} | ${target}`).toBe(bruteTwoSum(arr, target))
      if (last.status === 'found') {
        expect(last.l).toBeLessThan(last.r)
        expect(arr[last.l] + arr[last.r]).toBe(target)
      }
    }
  })
  for (const lang of LANG_LIST) {
    it.skipIf(!tools[lang])(`${lang} 程序`, () => {
      const run = build(twoPointers, lang)
      for (let t = 0; t < 40; t++) {
        const arr = sorted(randInts(2 + Math.floor(Math.random() * 12), 30))
        const target = 2 + Math.floor(Math.random() * 60)
        const last = runTwoPointers({ arr, target }).at(-1)!.state
        const expected = last.status === 'found' ? `${last.l} ${last.r}` : '-1 -1'
        expect(run(`${arr.length}\n${arr.join(' ')}\n${target}\n`).trim(), `${arr} | ${target}`).toBe(expected)
      }
    })
  }
})

describe('前缀和', () => {
  it('区间和与直接累加一致', () => {
    for (let t = 0; t < 300; t++) {
      const arr = Array.from({ length: 2 + Math.floor(Math.random() * 9) }, () => Math.floor(Math.random() * 100))
      const a = 1 + Math.floor(Math.random() * arr.length)
      const b = 1 + Math.floor(Math.random() * arr.length)
      const l = Math.min(a, b)
      const r = Math.max(a, b)
      const last = runPrefixSum({ arr, l, r }).at(-1)!.state
      expect(last.answer).toBe(arr.slice(l - 1, r).reduce((x, y) => x + y, 0))
    }
  })
  for (const lang of LANG_LIST) {
    it.skipIf(!tools[lang])(`${lang} 程序`, () => {
      const run = build(prefixSum, lang)
      for (let t = 0; t < 20; t++) {
        const arr = Array.from({ length: 2 + Math.floor(Math.random() * 9) }, () => Math.floor(Math.random() * 100))
        const l = 1 + Math.floor(Math.random() * arr.length)
        const r = l + Math.floor(Math.random() * (arr.length - l + 1))
        expect(Number(run(`${arr.length}\n${arr.join(' ')}\n${l} ${r}\n`).trim())).toBe(arr.slice(l - 1, r).reduce((x, y) => x + y, 0))
      }
    })
  }
})
