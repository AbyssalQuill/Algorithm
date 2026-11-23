import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { plainCode } from '../src/engine/source'
import type { AnyAlgo, Lang } from '../src/engine/types'

/** 把演示里展示的完整程序真的编译、运行：四种语言共用的测试工具 */
const win = process.platform === 'win32'
const root = mkdtempSync(join(tmpdir(), 'algo-code-'))

function have(cmd: string, args: string[]): boolean {
  return spawnSync(cmd, args, { encoding: 'utf8' }).status === 0
}
export const tools: Record<Lang, boolean> = {
  c: have('gcc', ['--version']),
  cpp: have('g++', ['--version']),
  python: have('python', ['--version']),
  java: have('javac', ['-version']) && have('java', ['-version']),
}
export const LANG_LIST: Lang[] = ['c', 'cpp', 'python', 'java']

export type Runner = (input: string) => string

export function build(algo: AnyAlgo, lang: Lang): Runner {
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
