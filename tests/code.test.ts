import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { runBinarySearch } from '../src/algos/binarySearch'
import { binarySearch } from '../src/algos/binarySearch'
import { bracketStack, runBracket } from '../src/algos/bracketStack'
import { bubbleSort, runBubbleSort } from '../src/algos/bubbleSort'
import { plainCode } from '../src/engine/source'
import type { AnyAlgo, Lang } from '../src/engine/types'

/**
 * 把网站上展示的“完整程序”真的编译、运行一遍，
 * 并和动画使用的 TypeScript 实现比对结果，保证四种语言的代码都是对的。
 */
const win = process.platform === 'win32'
const root = mkdtempSync(join(tmpdir(), 'algo-code-'))

function have(cmd: string, args: string[]): boolean {
  return spawnSync(cmd, args, { encoding: 'utf8' }).status === 0
}
const tools: Record<Lang, boolean> = {
  c: have('gcc', ['--version']),
  cpp: have('g++', ['--version']),
  python: have('python', ['--version']),
  java: have('javac', ['-version']) && have('java', ['-version']),
}

type Runner = (input: string) => string

function build(algo: AnyAlgo, lang: Lang): Runner {
  const dir = join(root, `${algo.id}-${lang}`)
  mkdirSync(dir, { recursive: true })
  const code = plainCode(algo.sources[lang], lang)
  const exe = join(dir, win ? 'prog.exe' : 'prog')
  const run = (cmd: string, args: string[], input?: string) => {
    const r = spawnSync(cmd, args, { input, encoding: 'utf8', timeout: 30000 })
    if (r.status !== 0) throw new Error(`${cmd} ${args.join(' ')} 失败:\n${r.stdout}\n${r.stderr}`)
    return r.stdout
  }
  if (lang === 'c') {
    writeFileSync(join(dir, 'main.c'), code)
    run('gcc', ['-O0', '-Wall', '-o', exe, join(dir, 'main.c')])
    return (inp) => run(exe, [], inp)
  }
  if (lang === 'cpp') {
    writeFileSync(join(dir, 'main.cpp'), code)
    run('g++', ['-std=c++17', '-O0', '-Wall', '-o', exe, join(dir, 'main.cpp')])
    return (inp) => run(exe, [], inp)
  }
  if (lang === 'java') {
    writeFileSync(join(dir, 'Main.java'), code)
    run('javac', ['-encoding', 'UTF-8', '-d', dir, join(dir, 'Main.java')])
    return (inp) => run('java', ['-cp', dir, 'Main'], inp)
  }
  writeFileSync(join(dir, 'main.py'), code)
  return (inp) => run('python', ['-I', join(dir, 'main.py')], inp)
}

const LANG_LIST: Lang[] = ['c', 'cpp', 'python', 'java']

function randInts(n: number, max = 99) {
  return Array.from({ length: n }, () => 1 + Math.floor(Math.random() * max))
}

describe('四种语言的完整程序：冒泡排序', () => {
  const cases = [[5, 3, 8, 1, 9, 2, 7], [1], [3, 3, 3], [9, 8, 7, 6, 5, 4, 3, 2, 1], randInts(14), randInts(40)]
  for (const lang of LANG_LIST) {
    it.skipIf(!tools[lang])(lang, () => {
      const run = build(bubbleSort, lang)
      for (const arr of cases) {
        const expected = arr.length <= 14 ? runBubbleSort(arr).at(-1)!.state.cells.map((c) => c.v) : [...arr].sort((a, b) => a - b)
        const out = run(`${arr.length}\n${arr.join(' ')}\n`).trim().split(/\s+/).map(Number)
        expect(out).toEqual(expected)
      }
    })
  }
})

describe('四种语言的完整程序：二分查找', () => {
  const arr = [2, 5, 8, 12, 16, 23, 38, 56]
  const targets = [23, 20, 2, 56, 1, 99, 8]
  for (const lang of LANG_LIST) {
    it.skipIf(!tools[lang])(lang, () => {
      const run = build(binarySearch, lang)
      for (const target of targets) {
        const last = runBinarySearch({ arr, target }).at(-1)!.state
        const expected = last.status === 'found' ? last.mid : -1
        expect(Number(run(`${arr.length}\n${arr.join(' ')}\n${target}\n`).trim()), `target=${target}`).toBe(expected)
      }
      expect(Number(run('1\n7\n7\n').trim())).toBe(0)
      expect(Number(run('1\n7\n8\n').trim())).toBe(-1)
    })
  }
})

describe('四种语言的完整程序：括号匹配', () => {
  const cases = ['{[()]}()', '([)]', '())', '((()', '()', '(', ')', '{{}}[[]]', '][']
  for (const lang of LANG_LIST) {
    it.skipIf(!tools[lang])(lang, () => {
      const run = build(bracketStack, lang)
      for (const s of cases) {
        const expected = runBracket(s).at(-1)!.state.verdict === 'ok' ? 'YES' : 'NO'
        expect(run(`${s}\n`).trim(), s).toBe(expected)
      }
    })
  }
})
