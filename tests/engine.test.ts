import { describe, expect, it } from 'vitest'
import { ALGOS } from '../src/algos'
import { runBinarySearch } from '../src/algos/binarySearch'
import { runBracket } from '../src/algos/bracketStack'
import { runBubbleSort } from '../src/algos/bubbleSort'
import { parseMarked, toRanges } from '../src/engine/source'
import { LANGS } from '../src/engine/types'

describe('parseMarked / toRanges', () => {
  it('去掉行尾标记并记录行号（// 与 # 两种）', () => {
    const c = parseMarked('\nint a;   //@x\nint b;   //@x,y\nint c;\n', 'cpp')
    expect(c.lines).toEqual(['int a;', 'int b;', 'int c;'])
    expect(c.marks).toEqual({ x: [1, 2], y: [2] })
    const p = parseMarked('a = 1   #@x\nb = 2\n', 'python')
    expect(p.lines).toEqual(['a = 1', 'b = 2'])
    expect(p.marks).toEqual({ x: [1] })
  })
  it('合并连续行号', () => {
    expect(toRanges([5, 3, 4, 9, 4])).toEqual([
      [3, 5],
      [9, 9],
    ])
  })
})

describe('每个演示：帧里的每个步骤标签，在四种语言的代码里都有对应的行', () => {
  for (const algo of ALGOS) {
    it(algo.id, () => {
      // 只用默认输入走不到所有分支，所以把默认值、预设、随机输入的帧合在一起看
      const inputs = [
        algo.defaultInput,
        ...(algo.presets ?? []).map((p) => {
          const r = algo.parse(p.text)
          if (!r.ok) throw new Error(`${algo.id} 预设 ${p.label} 无法解析`)
          return r.value
        }),
        ...Array.from({ length: 80 }, () => algo.random()),
      ]
      const steps = new Set(inputs.flatMap((v) => algo.run(v).map((f) => f.step)))
      for (const l of LANGS) {
        const { marks } = parseMarked(algo.sources[l.id], l.id)
        for (const s of steps) expect(marks[s], `${algo.id} / ${l.label} 缺少标签 ${s}`).toBeTruthy()
        // 反过来：代码里的标签都应该被某一帧用到，避免写错字母
        for (const k of Object.keys(marks)) expect(steps.has(k), `${algo.id} / ${l.label} 的标签 ${k} 没有任何一帧使用`).toBe(true)
      }
    })
    it(`${algo.id}：随机输入都能解析、能生成帧`, () => {
      for (let i = 0; i < 30; i++) {
        const v = algo.random()
        const r = algo.parse(algo.format(v))
        expect(r.ok, `${algo.id} 随机输入 ${algo.format(v)} 无法被自己解析`).toBe(true)
        expect(algo.run(v).length).toBeGreaterThan(1)
      }
      for (const p of algo.presets ?? []) expect(algo.parse(p.text).ok, `${algo.id} 预设 ${p.label}`).toBe(true)
    })
  }
})

describe('冒泡排序', () => {
  it('结果与 sort 一致，且最后一帧全部标为已排好', () => {
    for (let t = 0; t < 200; t++) {
      const n = 2 + Math.floor(Math.random() * 13)
      const arr = Array.from({ length: n }, () => 1 + Math.floor(Math.random() * 99))
      const frames = runBubbleSort(arr)
      const last = frames[frames.length - 1].state
      expect(last.cells.map((c) => c.v)).toEqual([...arr].sort((a, b) => a - b))
      expect(last.sorted).toBe(n)
    }
  })
  it('已有序时第一轮就提前结束', () => {
    const frames = runBubbleSort([1, 2, 3, 4, 5])
    expect(frames[frames.length - 1].state.swaps).toBe(0)
    expect(frames.filter((f) => f.step === 'outer').length).toBe(1)
  })
  it('交换次数 = 逆序对个数', () => {
    const arr = [5, 3, 8, 1, 9, 2, 7]
    let inv = 0
    for (let i = 0; i < arr.length; i++) for (let j = i + 1; j < arr.length; j++) if (arr[i] > arr[j]) inv++
    expect(runBubbleSort(arr).at(-1)!.state.swaps).toBe(inv)
  })
})

describe('二分查找', () => {
  it('与 indexOf 一致（无重复时）', () => {
    for (let t = 0; t < 300; t++) {
      const set = new Set<number>()
      const n = 1 + Math.floor(Math.random() * 14)
      while (set.size < n) set.add(Math.floor(Math.random() * 100))
      const arr = [...set].sort((a, b) => a - b)
      const target = Math.floor(Math.random() * 100)
      const last = runBinarySearch({ arr, target }).at(-1)!.state
      const expected = arr.indexOf(target)
      if (expected >= 0) {
        expect(last.status).toBe('found')
        expect(last.mid).toBe(expected)
      } else expect(last.status).toBe('miss')
    }
  })
  it('次数不超过 log2(n)+1', () => {
    const arr = Array.from({ length: 14 }, (_, i) => i * 2)
    for (const target of [0, 26, 13, 99, 12]) expect(runBinarySearch({ arr, target }).at(-1)!.state.steps).toBeLessThanOrEqual(4)
  })
})

describe('括号匹配', () => {
  const ref = (s: string) => {
    const st: string[] = []
    const pair: Record<string, string> = { ')': '(', ']': '[', '}': '{' }
    for (const c of s) {
      if ('([{'.includes(c)) st.push(c)
      else if (st.pop() !== pair[c]) return false
    }
    return st.length === 0
  }
  it('与参考实现一致', () => {
    for (let t = 0; t < 500; t++) {
      const n = 1 + Math.floor(Math.random() * 12)
      const s = Array.from({ length: n }, () => '()[]{}'[Math.floor(Math.random() * 6)]).join('')
      expect(runBracket(s).at(-1)!.state.verdict === 'ok', s).toBe(ref(s))
    }
    for (const s of ['{[()]}()', '([)]', '())', '((()']) expect(runBracket(s).at(-1)!.state.verdict === 'ok', s).toBe(ref(s))
  })
})
