import { parseMarked } from '../engine/source'
import type { Lang } from '../engine/types'

/**
 * 「逐步追踪」代码块：把一小段代码一步步跑给你看——代码高亮到哪一行，变量变成多少，屏幕上输出了什么。
 * 课文里这样写：
 *
 *   ```trace
 *   int a=3;          //@s1
 *   int b=a+4;        //@s2
 *   cout<<b;          //@s3
 *   ---
 *   s1 | a=3        |    | 创建变量 a，放进 3
 *   s2 | a=3; b=7   |    | 先算 a+4，得 7，放进新变量 b
 *   s3 | a=3; b=7   | 7  | 输出 b 的值
 *   ```
 *
 * 分隔线 --- 上面是代码（行尾 //@标签 表示这一行属于哪一步），下面每行是一步：
 *   标签 | 变量现状（用 ; 隔开） | 这一步在屏幕上多打印的内容（\n 表示换行） | 一句讲解
 */
export interface TraceStep {
  label: string
  vars: [string, string][]
  /** 这一步新增的输出 */
  out: string
  note: string
}

export interface Trace {
  lines: string[]
  marks: Record<string, number[]>
  steps: TraceStep[]
  lang: Lang
}

export function parseTrace(body: string, lang: Lang = 'cpp'): Trace {
  const cut = body.split(/\n-{3,}[ \t]*\n/)
  const code = cut[0] ?? ''
  const table = cut.slice(1).join('\n')
  const { lines, marks } = parseMarked(code, lang)
  const steps: TraceStep[] = []
  for (const row of table.split('\n')) {
    if (!row.trim()) continue
    const f = row.split('|')
    if (f.length < 4) throw new Error(`逐步追踪的一行要有 4 列（标签 | 变量 | 输出 | 讲解）：${row}`)
    const [label, vars, out] = f.slice(0, 3).map((x) => x.trim())
    const note = f.slice(3).join('|').trim()
    steps.push({
      label,
      vars: vars
        ? vars.split(';').map((kv) => {
            const i = kv.indexOf('=')
            return [kv.slice(0, i).trim(), kv.slice(i + 1).trim()] as [string, string]
          })
        : [],
      out: out.replace(/\\n/g, '\n'),
      note,
    })
  }
  return { lines, marks, steps, lang }
}

/** 检查标签是否一一对应：每一步的标签都要在代码里出现，代码里的每个标签也要被某一步用到 */
export function checkTrace(t: Trace): string[] {
  const errs: string[] = []
  const used = new Set(t.steps.map((s) => s.label))
  for (const s of t.steps) if (!t.marks[s.label]) errs.push(`步骤标签 ${s.label} 在代码里找不到`)
  for (const k of Object.keys(t.marks)) if (!used.has(k)) errs.push(`代码里的标签 ${k} 没有任何一步用到`)
  if (t.steps.length === 0) errs.push('一步都没有')
  return errs
}
