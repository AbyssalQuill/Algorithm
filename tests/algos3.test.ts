import { describe, expect, it } from 'vitest'
import { bfsGrid, runBfs, type Maze } from '../src/algos/bfsGrid'
import { josephusQueue, runJosephus } from '../src/algos/josephusQueue'
import { lcs, lcsString, runLcs } from '../src/algos/lcs'
import { runSieve, sieve } from '../src/algos/sieve'
import { build, LANG_LIST, tools } from './helpers'

const rnd = (lo: number, hi: number) => lo + Math.floor(Math.random() * (hi - lo + 1))

/** 约瑟夫问题的参考解：用数组下标直接算 */
function josephusRef(n: number, m: number): number[] {
  const a = Array.from({ length: n }, (_, i) => i + 1)
  const out: number[] = []
  let k = 0
  while (a.length) {
    k = (k + m - 1) % a.length
    out.push(a.splice(k, 1)[0])
  }
  return out
}

describe('队列：约瑟夫问题', () => {
  it('出列顺序与参考解一致', () => {
    for (let n = 2; n <= 12; n++) for (let m = 1; m <= 12; m++) expect(runJosephus({ n, m }).at(-1)!.state.out, `${n} ${m}`).toEqual(josephusRef(n, m))
  })
  for (const lang of LANG_LIST) {
    it.skipIf(!tools[lang])(`${lang} 程序`, () => {
      const run = build(josephusQueue, lang)
      for (const [n, m] of [[7, 3], [6, 1], [5, 8], [2, 2], [41, 3], [30, 7]]) expect(run(`${n} ${m}\n`).trim().split(/\s+/).map(Number), `${n} ${m}`).toEqual(josephusRef(n, m))
    })
  }
})

const isPrime = (x: number) => {
  if (x < 2) return false
  for (let d = 2; d * d <= x; d++) if (x % d === 0) return false
  return true
}
const primesTo = (n: number) => Array.from({ length: n - 1 }, (_, i) => i + 2).filter(isPrime)

describe('埃氏筛法', () => {
  it('筛出的质数与试除法一致', () => {
    for (let n = 10; n <= 60; n++) {
      const st = runSieve(n).at(-1)!.state.st
      expect(st.map((x, i) => (x === 1 ? i : 0)).filter(Boolean), `n=${n}`).toEqual(primesTo(n))
    }
  })
  for (const lang of LANG_LIST) {
    it.skipIf(!tools[lang])(`${lang} 程序`, () => {
      const run = build(sieve, lang)
      for (const n of [10, 11, 49, 50, 60, 1000]) expect(run(`${n}\n`).trim().split(/\s+/).map(Number), `n=${n}`).toEqual(primesTo(n))
    })
  }
})

/** 迷宫最短路的参考解：从终点反着做的朴素松弛，写法和 BFS 完全不同 */
function mazeRef(maze: Maze): number {
  const n = maze.length
  const m = maze[0].length
  let s: [number, number] = [0, 0]
  let t: [number, number] = [0, 0]
  for (let i = 0; i < n; i++)
    for (let j = 0; j < m; j++) {
      if (maze[i][j] === 'S') s = [i, j]
      if (maze[i][j] === 'T') t = [i, j]
    }
  const INF = 1e9
  const d = Array.from({ length: n }, () => new Array<number>(m).fill(INF))
  d[t[0]][t[1]] = 0
  for (let round = 0; round < n * m; round++)
    for (let i = 0; i < n; i++)
      for (let j = 0; j < m; j++) {
        if (maze[i][j] === '#') continue
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const x = i + dx
          const y = j + dy
          if (x >= 0 && x < n && y >= 0 && y < m && maze[x][y] !== '#') d[i][j] = Math.min(d[i][j], d[x][y] + 1)
        }
      }
  return d[s[0]][s[1]] >= INF ? -1 : d[s[0]][s[1]]
}

function randMaze(): Maze {
  const n = rnd(2, 8)
  const m = rnd(2, 9)
  const g: string[][] = Array.from({ length: n }, () => Array.from({ length: m }, (): string => (Math.random() < 0.3 ? '#' : '.')))
  const cells = Array.from({ length: n * m }, (_, i) => i).sort(() => Math.random() - 0.5)
  g[Math.floor(cells[0] / m)][cells[0] % m] = 'S'
  g[Math.floor(cells[1] / m)][cells[1] % m] = 'T'
  return g.map((r) => r.join(''))
}

describe('广度优先搜索：迷宫最短路', () => {
  it('最短步数与参考解一致；找到时给出的路线确实是最短路', () => {
    for (let t = 0; t < 300; t++) {
      const maze = randMaze()
      const last = runBfs(maze).at(-1)!.state
      const expected = mazeRef(maze)
      if (expected < 0) {
        expect(last.status, maze.join(' ')).toBe('none')
      } else {
        expect(last.status, maze.join(' ')).toBe('found')
        expect(last.path.length - 1).toBe(expected)
        for (const [x, y] of last.path) expect(maze[x][y]).not.toBe('#')
        for (let k = 1; k < last.path.length; k++) expect(Math.abs(last.path[k][0] - last.path[k - 1][0]) + Math.abs(last.path[k][1] - last.path[k - 1][1])).toBe(1)
      }
    }
  })
  for (const lang of LANG_LIST) {
    it.skipIf(!tools[lang])(`${lang} 程序`, () => {
      const run = build(bfsGrid, lang)
      const mazes = [bfsGrid.defaultInput as Maze, ...Array.from({ length: 12 }, randMaze)]
      for (const p of bfsGrid.presets ?? []) {
        const r = bfsGrid.parse(p.text)
        if (r.ok) mazes.push(r.value)
      }
      for (const maze of mazes) expect(Number(run(`${maze.length} ${maze[0].length}\n${maze.join('\n')}\n`).trim()), maze.join(' ')).toBe(mazeRef(maze))
    })
  }
})

/** 最长公共子序列长度的参考解：用递归 + 记忆化，和表格法的写法不同 */
function lcsLenRef(a: string, b: string): number {
  const memo = new Map<string, number>()
  const f = (i: number, j: number): number => {
    if (i === 0 || j === 0) return 0
    const k = `${i},${j}`
    if (memo.has(k)) return memo.get(k)!
    const v = a[i - 1] === b[j - 1] ? f(i - 1, j - 1) + 1 : Math.max(f(i - 1, j), f(i, j - 1))
    memo.set(k, v)
    return v
  }
  return f(a.length, b.length)
}
const isSubseq = (s: string, t: string) => {
  let k = 0
  for (const c of t) if (k < s.length && s[k] === c) k++
  return k === s.length
}
const randStr = (len: number) => Array.from({ length: len }, () => 'ABCD'[rnd(0, 3)]).join('')

describe('动态规划：最长公共子序列', () => {
  it('长度与参考解一致，回溯出的字符串是两者的公共子序列且长度正确', () => {
    for (let t = 0; t < 300; t++) {
      const a = randStr(rnd(1, 8))
      const b = randStr(rnd(1, 8))
      const last = runLcs({ a, b }).at(-1)!.state
      const len = lcsLenRef(a, b)
      expect(last.answer, `${a} ${b}`).toBe(len)
      const str = [...last.picked].reverse().join('')
      expect(str.length).toBe(len)
      expect(isSubseq(str, a) && isSubseq(str, b)).toBe(true)
      expect(lcsString(a, b)).toEqual({ len, str })
    }
  })
  for (const lang of LANG_LIST) {
    it.skipIf(!tools[lang])(`${lang} 程序`, () => {
      const run = build(lcs, lang)
      const cases = [['ABCBD', 'BDCAB'], ['ALGO', 'ALGO'], ['ABC', 'XYZ'], ['A', 'A'], ...Array.from({ length: 10 }, () => [randStr(rnd(1, 8)), randStr(rnd(1, 8))])]
      for (const [a, b] of cases) {
        const want = lcsString(a, b)
        const out = run(`${a}\n${b}\n`).split('\n')
        expect(Number(out[0]), `${a} ${b}`).toBe(want.len)
        expect((out[1] ?? '').trim(), `${a} ${b}`).toBe(want.str)
      }
    })
  }
})
