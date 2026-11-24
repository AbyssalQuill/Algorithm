import { describe, expect, it } from 'vitest'
import { bigAdd, bigAddRef, runBigAdd } from '../src/algos/bigAdd'
import { bitClear, runBitClear } from '../src/algos/bitClear'
import { gcd, gcdOf, runGcd } from '../src/algos/gcd'
import { greedy, runGreedy, type Act } from '../src/algos/greedy'
import { kmp, kmpRef, runKmp } from '../src/algos/kmp'
import { knapsack, runKnapsack } from '../src/algos/knapsack'
import { runSt, sparseTable } from '../src/algos/sparseTable'
import { itPrograms, rnd, rndList } from './helpers'

describe('0-1 背包', () => {
  const brute = (w: number[], v: number[], cap: number) => {
    let best = 0
    for (let mask = 0; mask < 1 << w.length; mask++) {
      let sw = 0
      let sv = 0
      w.forEach((x, i) => {
        if (mask >> i & 1) {
          sw += x
          sv += v[i]
        }
      })
      if (sw <= cap) best = Math.max(best, sv)
    }
    return best
  }
  it('最大价值与枚举所有子集一致', () => {
    for (let t = 0; t < 300; t++) {
      const n = rnd(1, 5)
      const w = rndList(n, 1, 8)
      const v = rndList(n, 1, 40)
      const cap = rnd(1, 10)
      expect(runKnapsack({ w, v, cap }).at(-1)!.state.answer).toBe(brute(w, v, cap))
    }
  })
  itPrograms(knapsack, () =>
    Array.from({ length: 20 }, () => {
      const n = rnd(1, 8)
      const w = rndList(n, 1, 12)
      const v = rndList(n, 1, 50)
      const cap = rnd(1, 40)
      return { input: `${n} ${cap}\n${w.join(' ')}\n${v.join(' ')}\n`, expected: String(brute(w, v, cap)) }
    }),
  )
})

describe('贪心：活动选择', () => {
  const brute = (acts: Act[]) => {
    let best = 0
    for (let mask = 0; mask < 1 << acts.length; mask++) {
      const pick = acts.filter((_, i) => mask >> i & 1).sort((a, b) => a.s - b.s)
      let ok = true
      for (let i = 1; i < pick.length; i++) if (pick[i].s < pick[i - 1].e) ok = false
      if (ok) best = Math.max(best, pick.length)
    }
    return best
  }
  const rand = (): Act[] =>
    Array.from({ length: rnd(2, 8) }, () => {
      const s = rnd(0, 14)
      return { s, e: s + rnd(1, 6) }
    })
  it('选出的个数与穷举最优一致', () => {
    for (let t = 0; t < 300; t++) {
      const acts = rand()
      expect(runGreedy(acts).at(-1)!.state.count).toBe(brute(acts))
    }
  })
  itPrograms(greedy, () =>
    Array.from({ length: 20 }, () => {
      const acts = rand()
      return { input: `${acts.length}\n${acts.map((a) => `${a.s} ${a.e}`).join('\n')}\n`, expected: String(brute(acts)) }
    }),
  )
})

describe('辗转相除法', () => {
  it('最大公约数整除两个数，且是最大的；最小公倍数正确', () => {
    for (let t = 0; t < 300; t++) {
      const a = rnd(1, 999)
      const b = rnd(1, 999)
      const s = runGcd({ a, b }).at(-1)!.state
      let g = 1
      for (let d = 1; d <= Math.min(a, b); d++) if (a % d === 0 && b % d === 0) g = d
      expect(s.gcd).toBe(g)
      expect(s.lcm).toBe((a * b) / g)
    }
  })
  itPrograms(gcd, () =>
    Array.from({ length: 20 }, () => {
      const a = rnd(1, 9999)
      const b = rnd(1, 9999)
      return { input: `${a} ${b}\n`, expected: `${gcdOf(a, b)} ${(a / gcdOf(a, b)) * b}` }
    }),
  )
})

describe('ST 表', () => {
  const randQs = (n: number): [number, number][] =>
    Array.from({ length: rnd(1, 3) }, () => {
      const a = rnd(1, n)
      const b = rnd(1, n)
      return [Math.min(a, b), Math.max(a, b)] as [number, number]
    })
  it('每次查询与直接求最小值一致', () => {
    for (let t = 0; t < 300; t++) {
      const n = rnd(4, 8)
      const arr = rndList(n, 0, 30)
      const qs = randQs(n)
      expect(runSt({ arr, qs }).at(-1)!.state.results).toEqual(qs.map(([l, r]) => Math.min(...arr.slice(l - 1, r))))
    }
  })
  itPrograms(sparseTable, () =>
    Array.from({ length: 20 }, () => {
      const n = rnd(4, 30)
      const arr = rndList(n, 0, 99)
      const qs = Array.from({ length: rnd(1, 5) }, () => {
        const a = rnd(1, n)
        const b = rnd(1, n)
        return [Math.min(a, b), Math.max(a, b)] as [number, number]
      })
      return { input: `${n}\n${arr.join(' ')}\n${qs.length}\n${qs.map((q) => q.join(' ')).join('\n')}\n`, expected: qs.map(([l, r]) => Math.min(...arr.slice(l - 1, r))).join(' ') }
    }),
  )
})

describe('高精度加法', () => {
  const rs = () => String(rnd(1, 99999999))
  it('结果与 BigInt 一致', () => {
    for (let t = 0; t < 300; t++) {
      const a = rs()
      const b = Math.random() < 0.3 ? '9'.repeat(rnd(1, 8)) : rs()
      const s = runBigAdd({ a, b }).at(-1)!.state
      expect([...s.digits].reverse().join('')).toBe(bigAddRef(a, b))
    }
  })
  itPrograms(bigAdd, () => [['999', '1'], ['1', '1'], ['958', '67'], ...Array.from({ length: 15 }, () => [rs(), rs()])].map(([a, b]) => ({ input: `${a} ${b}\n`, expected: bigAddRef(a, b) })))
})

describe('KMP', () => {
  const rs = (len: number) => Array.from({ length: len }, () => 'ab'[rnd(0, 1)]).join('')
  it('找到的位置与朴素匹配一致', () => {
    for (let t = 0; t < 500; t++) {
      const text = rs(rnd(4, 14))
      const pat = rs(rnd(1, Math.min(6, text.length)))
      expect(runKmp({ text, pat }).at(-1)!.state.found, `${text} | ${pat}`).toEqual(kmpRef(text, pat))
    }
  })
  itPrograms(kmp, () =>
    Array.from({ length: 25 }, () => {
      const text = rs(rnd(4, 40))
      const pat = rs(rnd(1, 6))
      const r = kmpRef(text, pat)
      return { input: `${text} ${pat}\n`, expected: r.length ? r.join(' ') : '-1' }
    }),
  )
})

describe('位运算：n&(n-1)', () => {
  it('消掉的 1 的个数等于二进制里 1 的个数', () => {
    for (let n = 1; n <= 255; n++) expect(runBitClear(n).at(-1)!.state.cnt).toBe(n.toString(2).replace(/0/g, '').length)
  })
  itPrograms(bitClear, () => [1, 64, 255, 180, 7, 128].map((n) => ({ input: `${n}\n`, expected: String(n.toString(2).replace(/0/g, '').length) })))
})
