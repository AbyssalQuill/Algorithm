import { execFile, spawn } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'
import { marked, type Token, type Tokens } from 'marked'
import { describe, expect, it } from 'vitest'
import { parseMarked } from '../src/engine/source'
import { findLesson, flatten, TRACKS } from '../src/learn/curriculum'
import { parseFence } from '../src/learn/fence'
import { checkTrace, parseTrace } from '../src/learn/trace'

/**
 * 课文验证：
 *  1. 目录里的每一课都有文档，文档以 # 标题开头，没有多余的文件；
 *  2. 课文里的 C++ 程序真的能编译、运行，并且输出和紧跟着的 ```output 一字不差（有 ```input 就用它当输入）；
 *  3. cpp frag / cpp top 片段：放进 main 里 / main 外面检查语法，后面跟了 output 的还会运行对比；
 *  4. ```trace 的每一步标签都对得上代码，并且“屏幕输出”列拼起来 = 程序真实输出。
 */
const run = promisify(execFile)
const ROOT = join(__dirname, '..', 'src', 'content')
const TMP = join(tmpdir(), 'algo-lessons')
mkdirSync(TMP, { recursive: true })

const HEAD = '#include <bits/stdc++.h>\nusing namespace std;\n'
const CALLOUTS = new Set(['目标', '提示', '注意', '竞赛', '小结', '思考', '答案'])
const FENCE_LANGS = new Set(['cpp', 'c', 'python', 'java', 'input', 'output', 'text', 'trace'])

const cpp = TRACKS.find((t) => t.id === 'cpp')!
// 写新课时可以只验证几课：LESSONS=hello,output npx vitest run tests/lessons.test.ts
const ONLY = process.env.LESSONS?.split(',').filter(Boolean)
const lessons = flatten(cpp).filter((l) => !ONLY || ONLY.includes(l.slug))

function readLesson(slug: string) {
  return readFileSync(join(ROOT, 'cpp', `${slug}.md`), 'utf-8')
}

/** 按文档顺序取出所有代码块（包括提示框里面的） */
function codeBlocks(tokens: Token[]): Tokens.Code[] {
  const out: Tokens.Code[] = []
  for (const t of tokens) {
    if (t.type === 'code') out.push(t as Tokens.Code)
    else if (t.type === 'blockquote') out.push(...codeBlocks(marked.lexer((t as Tokens.Blockquote).text.replace(/^\[!\S+?\][ \t]*[^\n]*\n?/, ''))))
    else if (t.type === 'list') for (const it of (t as Tokens.List).items) out.push(...codeBlocks(it.tokens))
  }
  return out
}

const norm = (s: string) =>
  s
    .replace(/\r/g, '')
    .split('\n')
    .map((l) => l.trimEnd())
    .join('\n')
    .replace(/^\n+|\n+$/g, '')

let seq = 0
async function compile(src: string, syntaxOnly: boolean): Promise<string | null> {
  const id = `${process.pid}-${seq++}`
  const file = join(TMP, `${id}.cpp`)
  const exe = join(TMP, `${id}.exe`)
  writeFileSync(file, src)
  try {
    await run('g++', ['-std=c++17', '-O0', '-w', ...(syntaxOnly ? ['-fsyntax-only'] : ['-o', exe]), file], { timeout: 60000 })
    return syntaxOnly ? '' : exe
  } catch (e) {
    throw new Error(`编译失败：\n${(e as { stderr?: string }).stderr ?? e}\n---- 源码 ----\n${src}`)
  }
}

function exec(exe: string, input: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const p = spawn(exe, [], { timeout: 8000 })
    let out = ''
    p.stdout.on('data', (d) => (out += d.toString('utf-8')))
    p.on('error', reject)
    p.on('close', (code) => (code === 0 ? resolve(out) : reject(new Error(`运行退出码 ${code}，输出：${out.slice(0, 200)}`))))
    p.stdin.on('error', () => {})
    p.stdin.end(input)
  })
}

const isComplete = (code: string) => /\bint\s+main\s*\(/.test(code)
const wrapFrag = (code: string) => `${HEAD}int main(){\n${code}\nreturn 0;\n}\n`
const wrapTop = (code: string) => `${HEAD}${code}\nint main(){return 0;}\n`

describe('目录与文档', () => {
  it('目录里每一课都有文档，文档里没有多余的文件', () => {
    const slugs = lessons.map((l) => l.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
    for (const l of lessons) expect(existsSync(join(ROOT, 'cpp', `${l.slug}.md`)), `缺少 ${l.slug}.md`).toBe(true)
    expect(findLesson('cpp', flatten(cpp)[0].slug)?.prev).toBeUndefined()
  })

  for (const l of lessons) {
    it(`${l.chapterNo}.${l.no} ${l.title}：结构合法`, () => {
      const md = readLesson(l.slug)
      expect(md.startsWith('# '), '文档要以 # 标题开头').toBe(true)
      const tokens = marked.lexer(md)
      const blocks = codeBlocks(tokens)
      expect(blocks.length, '一课里至少要有一个代码块').toBeGreaterThan(0)
      for (const b of blocks) expect(FENCE_LANGS.has(parseFence(b.lang ?? '').lang), `未知的代码块语言：${b.lang}`).toBe(true)
      for (const t of tokens)
        if (t.type === 'blockquote') {
          const m = /^\[!(\S+?)\]/.exec((t as Tokens.Blockquote).text)
          if (m) expect(CALLOUTS.has(m[1]), `未知的提示框类型：${m[1]}`).toBe(true)
        }
      // 讲解里不要留下“待补充”之类的占位
      expect(md).not.toMatch(/TODO|待补充|XXX/)
    })
  }
})

describe('课文里的代码真的能跑', () => {
  for (const l of lessons) {
    it(
      `${l.chapterNo}.${l.no} ${l.title}`,
      async () => {
        const blocks = codeBlocks(marked.lexer(readLesson(l.slug)))
        const jobs: Promise<void>[] = []
        blocks.forEach((b, i) => {
          const f = parseFence(b.lang ?? '')
          if (f.lang === 'trace') {
            jobs.push(
              (async () => {
                const t = parseTrace(b.text)
                expect(checkTrace(t), `第 ${i + 1} 个代码块（trace）`).toEqual([])
                const code = parseMarked(b.text.split(/\n-{3,}[ \t]*\n/)[0], 'cpp').lines.join('\n')
                if (/\bcin\b|scanf|getline/.test(code)) {
                  await compile(isComplete(code) ? code : wrapFrag(code), true)
                  return
                }
                const exe = await compile(isComplete(code) ? code : wrapFrag(code), false)
                const real = await exec(exe!, '')
                expect(norm(t.steps.map((s) => s.out).join('')), `trace 的“屏幕输出”列要等于程序真实输出（第 ${i + 1} 个代码块）`).toBe(norm(real))
              })(),
            )
            return
          }
          if (f.lang !== 'cpp' || f.noverify) return
          let input = ''
          let expected: string | null = null
          let j = i + 1
          if (blocks[j] && parseFence(blocks[j].lang ?? '').lang === 'input') input = blocks[j++].text
          if (blocks[j] && parseFence(blocks[j].lang ?? '').lang === 'output') expected = blocks[j].text
          jobs.push(
            (async () => {
              const src = f.top ? wrapTop(b.text) : f.frag || !isComplete(b.text) ? wrapFrag(b.text) : b.text
              if (expected === null) {
                // 没有给输出：完整程序也只检查能编译；片段只查语法
                await compile(src, true)
                return
              }
              const exe = await compile(src, false)
              const real = await exec(exe!, input)
              expect(norm(real), `第 ${i + 1} 个代码块的输出和课文里写的不一致`).toBe(norm(expected))
            })(),
          )
        })
        await Promise.all(jobs)
      },
      180000,
    )
  }
})
