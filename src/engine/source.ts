import type { Lang } from './types'

export interface Marked {
  lines: string[]
  /** 标签 → 行号（从 1 开始） */
  marks: Record<string, number[]>
}

const RE_HASH = /\s*#\s*@([\w,\s]+?)\s*$/
const RE_SLASH = /\s*\/\/\s*@([\w,\s]+?)\s*$/

/** 解析带标记的源码：去掉行尾的 //@label，记录 label 对应的行号 */
export function parseMarked(raw: string, lang: Lang): Marked {
  const re = lang === 'python' ? RE_HASH : RE_SLASH
  const lines: string[] = []
  const marks: Record<string, number[]> = {}
  raw
    .replace(/^\n+|\s+$/g, '')
    .split('\n')
    .forEach((line, i) => {
      const m = re.exec(line)
      if (m) {
        line = line.slice(0, m.index)
        for (const label of m[1].split(/[\s,]+/).filter(Boolean)) (marks[label] ??= []).push(i + 1)
      }
      lines.push(line.trimEnd())
    })
  return { lines, marks }
}

/** 把行号合并成连续区间，便于画高亮条 */
export function toRanges(lines: number[]): [number, number][] {
  const sorted = [...new Set(lines)].sort((a, b) => a - b)
  const out: [number, number][] = []
  for (const l of sorted) {
    const last = out[out.length - 1]
    if (last && l === last[1] + 1) last[1] = l
    else out.push([l, l])
  }
  return out
}

/** 去掉标记后的纯代码（用于复制 / 编译测试） */
export function plainCode(raw: string, lang: Lang): string {
  return parseMarked(raw, lang).lines.join('\n') + '\n'
}
