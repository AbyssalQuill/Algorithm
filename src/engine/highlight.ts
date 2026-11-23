import type { Lang } from './types'

export interface Tok {
  text: string
  light?: string
  dark?: string
  italic?: boolean
}

/**
 * 轻量代码高亮（自己写的小词法器，C / C++ / Python / Java）。
 * 以前用 Shiki：C++ 语法包就有 ~800KB，首次打开课程要等它下载解析，还是异步上色（先白后彩，会闪）。
 * 教程里的代码都很规整，这个词法器只有几 KB、同步完成、没有闪烁；亮 / 暗两套颜色同时给出，切主题不用重算。
 */

type Kind = 'kw' | 'type' | 'str' | 'num' | 'com' | 'fn' | 'pre'

const PAL: Record<Kind, [string, string]> = {
  kw: ['#b8452a', '#ff9a82'],
  type: ['#17788a', '#6fd3d0'],
  str: ['#3b8a4f', '#9fdca9'],
  num: ['#a5671a', '#ffd166'],
  com: ['#8b8f97', '#7d8a84'],
  fn: ['#2a5db0', '#8dbcff'],
  pre: ['#8a5a2b', '#e2b27c'],
}

const set = (s: string) => new Set(s.split(/\s+/).filter(Boolean))

const C_KW = 'auto break case const continue default do else enum extern for goto if inline register return sizeof static struct switch typedef union volatile while true false NULL'
const C_TYPES = 'int char float double long short unsigned signed void bool size_t FILE'
const CPP_KW = `${C_KW} class namespace using template typename new delete public private protected virtual override final operator this try catch throw nullptr constexpr static_cast const_cast dynamic_cast reinterpret_cast friend explicit mutable noexcept decltype`
const CPP_TYPES = `${C_TYPES} string vector map set multiset multimap pair queue stack deque priority_queue bitset list array tuple unordered_map unordered_set cin cout cerr endl istream ostream ll`
const PY_KW = 'and as assert break class continue def del elif else except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield True False None self'
const PY_TYPES = 'int str float list dict set tuple bool bytes object'
const JAVA_KW = 'abstract assert break case catch class continue default do else enum extends final finally for if implements import instanceof interface new package private protected public return static super switch this throw throws try void volatile while true false null var'
const JAVA_TYPES = 'int long short byte char boolean float double String Integer Long Double Character Boolean Math Scanner System List ArrayList Map HashMap Set HashSet Deque ArrayDeque'

interface Spec {
  re: RegExp
  kw: Set<string>
  types: Set<string>
  capsAreTypes: boolean
}

const NUM = String.raw`(?:0[xX][0-9a-fA-F']+|0[bB][01']+|\d[\d_']*(?:\.\d*)?(?:[eE][+-]?\d+)?)[uUlLfF]*`
const mk = (comment: string, str: string, pre: string): RegExp =>
  new RegExp(`(${comment})|(${str})|(${pre})|(\\b${NUM}\\b)|([A-Za-z_]\\w*)`, 'y')

const SPECS: Record<Lang, Spec> = {
  c: { re: mk(String.raw`\/\/[^\n]*|\/\*[\s\S]*?(?:\*\/|$)`, String.raw`"(?:\\.|[^"\\\n])*"?|'(?:\\.|[^'\\\n])*'?`, String.raw`^[ \t]*#[ \t]*\w+(?:[ \t]*<[^>\n]*>)?`), kw: set(C_KW), types: set(C_TYPES), capsAreTypes: false },
  cpp: { re: mk(String.raw`\/\/[^\n]*|\/\*[\s\S]*?(?:\*\/|$)`, String.raw`"(?:\\.|[^"\\\n])*"?|'(?:\\.|[^'\\\n])*'?`, String.raw`^[ \t]*#[ \t]*\w+(?:[ \t]*<[^>\n]*>)?`), kw: set(CPP_KW), types: set(CPP_TYPES), capsAreTypes: false },
  python: { re: mk(String.raw`#[^\n]*`, String.raw`(?:[rRbBfF]{0,2})(?:"""[\s\S]*?(?:"""|$)|'''[\s\S]*?(?:'''|$)|"(?:\\.|[^"\\\n])*"?|'(?:\\.|[^'\\\n])*'?)`, String.raw`(?!)`), kw: set(PY_KW), types: set(PY_TYPES), capsAreTypes: false },
  java: { re: mk(String.raw`\/\/[^\n]*|\/\*[\s\S]*?(?:\*\/|$)`, String.raw`"(?:\\.|[^"\\\n])*"?|'(?:\\.|[^'\\\n])*'?`, String.raw`(?!)`), kw: set(JAVA_KW), types: set(JAVA_TYPES), capsAreTypes: true },
}
// 预处理行需要用多行模式识别行首的 #
for (const l of ['c', 'cpp'] as const) SPECS[l].re = new RegExp(SPECS[l].re.source, 'ym')

function color(kind: Kind): Pick<Tok, 'light' | 'dark'> {
  return { light: PAL[kind][0], dark: PAL[kind][1] }
}

/** 把一段（可能含换行的）文本按行切开，加进 lines */
function push(lines: Tok[][], text: string, kind?: Kind) {
  const parts = text.split('\n')
  parts.forEach((p, i) => {
    if (i > 0) lines.push([])
    if (p === '') return
    const cur = lines[lines.length - 1]
    const prev = cur[cur.length - 1]
    const tok: Tok = kind ? { text: p, ...color(kind), italic: kind === 'com' } : { text: p }
    // 相邻的同色片段合并，少生成 DOM 节点
    if (prev && prev.light === tok.light && prev.italic === tok.italic) prev.text += p
    else cur.push(tok)
  })
}

/** 把代码切成“每行若干带颜色的片段”，同时给出亮 / 暗两套颜色 */
export function tokenize(code: string, lang: Lang): Tok[][] {
  const spec = SPECS[lang]
  const lines: Tok[][] = [[]]
  const re = spec.re
  let i = 0
  let plainStart = 0
  const flush = (end: number) => {
    if (end > plainStart) push(lines, code.slice(plainStart, end))
  }
  while (i < code.length) {
    re.lastIndex = i
    const m = re.exec(code)
    if (!m) {
      // 当前位置不是任何记号的开头：往后挪一个字符继续试（逐字符前进，保证线性）
      i++
      continue
    }
    flush(i)
    const [text, com, str, pre, num, id] = m
    let kind: Kind | undefined
    if (com) kind = 'com'
    else if (str) kind = 'str'
    else if (pre) {
      // #include <xxx>：指令本身是 pre，尖括号里的头文件名是 str
      const lt = text.indexOf('<')
      if (lt > 0) {
        push(lines, text.slice(0, lt), 'pre')
        push(lines, text.slice(lt), 'str')
        i = plainStart = m.index + text.length
        continue
      }
      kind = 'pre'
    } else if (num) kind = 'num'
    else if (id) {
      if (spec.kw.has(id)) kind = 'kw'
      else if (spec.types.has(id)) kind = 'type'
      else if (spec.capsAreTypes && /^[A-Z]/.test(id)) kind = 'type'
      else if (code[m.index + id.length] === '(') kind = 'fn'
    }
    push(lines, text, kind)
    i = plainStart = m.index + text.length
  }
  flush(code.length)
  return lines
}

/** 兼容旧调用：现在是同步完成的 */
export async function tokenizeCode(code: string, lang: Lang): Promise<Tok[][]> {
  return tokenize(code, lang)
}
