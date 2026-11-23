/**
 * 课文里代码块的“信息串”解析。写法：
 *   ```cpp {3,5-7} title="hello.cpp" frag
 *   lang   = cpp / c / python / java / input / output / trace / text
 *   {…}    = 要高亮的行（行号从 1 开始，可用 3,5-7）
 *   title  = 代码块左上角的文件名
 *   frag   = 这是代码片段（不是完整程序）：测试时放进 main 里检查语法
 *   top    = 这是函数 / 结构体定义片段：测试时放在 main 外面检查语法
 *   noverify = 故意写错的反面例子，测试时跳过
 */
export interface Fence {
  lang: string
  hl: number[]
  title?: string
  frag: boolean
  top: boolean
  noverify: boolean
}

export function parseFence(info: string): Fence {
  const s = (info ?? '').trim()
  const lang = s.split(/\s+/)[0] ?? ''
  const rest = s.slice(lang.length)
  const hl: number[] = []
  const m = /\{([\d,\s-]+)\}/.exec(rest)
  if (m) {
    for (const part of m[1].split(',')) {
      const [a, b] = part.split('-').map((x) => parseInt(x, 10))
      if (!Number.isNaN(a)) for (let i = a; i <= (Number.isNaN(b) ? a : b); i++) hl.push(i)
    }
  }
  const t = /title="([^"]*)"/.exec(rest)
  const flags = new Set(rest.replace(/\{[^}]*\}/g, ' ').replace(/title="[^"]*"/g, ' ').split(/\s+/).filter(Boolean))
  return { lang, hl, title: t?.[1], frag: flags.has('frag'), top: flags.has('top'), noverify: flags.has('noverify') }
}
