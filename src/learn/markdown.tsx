import { memo, useMemo, type ReactNode } from 'react'
import { marked, type Token, type Tokens } from 'marked'
import { CodeBlock } from './CodeBlock'
import { parseFence } from './fence'
import { TraceBlock } from './TraceBlock'

/**
 * 课文用普通 Markdown 写（在 GitHub 上也能直接读）。这里用 marked 解析成记号，再自己渲染成 React：
 *  - ## / ### 小标题 → 带锚点，右侧“本页目录”用
 *  - ```cpp … ``` → 带行号和上色的代码块；```input / ```output → 终端样子的输入输出；```trace → 逐步追踪
 *  - > [!提示] 标题 … → 提示框（提示 / 注意 / 竞赛 / 目标 / 小结 / 思考 / 答案）
 */

export interface TocItem {
  id: string
  text: string
  depth: 2 | 3
}

function makeSlugger() {
  const seen = new Map<string, number>()
  return (text: string) => {
    const base = text.trim().replace(/\s+/g, '-').replace(/[^\p{L}\p{N}_-]/gu, '') || 'section'
    const n = seen.get(base) ?? 0
    seen.set(base, n + 1)
    return n === 0 ? base : `${base}-${n}`
  }
}

export function parseLesson(md: string): Token[] {
  return marked.lexer(md)
}

/** 给每个小标题算好锚点 id（按文档顺序、重名自动加序号）。渲染时直接查这张表，不在渲染过程里改状态 */
function headingIds(tokens: Token[]): Map<Token, string> {
  const slug = makeSlugger()
  const ids = new Map<Token, string>()
  for (const t of tokens) {
    if (t.type !== 'heading') continue
    const h = t as Tokens.Heading
    if (h.depth === 2 || h.depth === 3) ids.set(t, slug(h.text))
  }
  return ids
}

export function extractToc(tokens: Token[]): TocItem[] {
  const ids = headingIds(tokens)
  const out: TocItem[] = []
  for (const t of tokens) {
    const id = ids.get(t)
    if (id) out.push({ id, text: (t as Tokens.Heading).text, depth: (t as Tokens.Heading).depth as 2 | 3 })
  }
  return out
}

/** 课文第一行的 # 标题（页面头部已经显示标题，所以正文里不再重复） */
export function lessonTitle(tokens: Token[]): string | undefined {
  const h = tokens.find((t) => t.type === 'heading' && (t as Tokens.Heading).depth === 1) as Tokens.Heading | undefined
  return h?.text
}

const CALLOUT: Record<string, { cls: string; icon: string; label: string }> = {
  目标: { cls: 'goal', icon: '🎯', label: '本课目标' },
  提示: { cls: 'tip', icon: '💡', label: '提示' },
  注意: { cls: 'warn', icon: '⚠️', label: '注意' },
  竞赛: { cls: 'contest', icon: '🏁', label: '算法竞赛里' },
  小结: { cls: 'sum', icon: '📝', label: '小结' },
  思考: { cls: 'think', icon: '🤔', label: '思考' },
  答案: { cls: 'answer', icon: '✅', label: '答案' },
}

function Inline({ tokens }: { tokens?: Token[] }): ReactNode {
  if (!tokens) return null
  return (
    <>
      {tokens.map((t, i) => {
        switch (t.type) {
          case 'strong':
            return <strong key={i}>{<Inline tokens={(t as Tokens.Strong).tokens} />}</strong>
          case 'em':
            return <em key={i}>{<Inline tokens={(t as Tokens.Em).tokens} />}</em>
          case 'del':
            return <del key={i}>{<Inline tokens={(t as Tokens.Del).tokens} />}</del>
          case 'codespan':
            return <code key={i}>{(t as Tokens.Codespan).text.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')}</code>
          case 'br':
            return <br key={i} />
          case 'link': {
            const l = t as Tokens.Link
            return (
              <a key={i} href={l.href} target="_blank" rel="noopener noreferrer">
                <Inline tokens={l.tokens} />
              </a>
            )
          }
          case 'escape':
            return <span key={i}>{(t as Tokens.Escape).text}</span>
          case 'text': {
            const x = t as Tokens.Text
            return x.tokens ? <Inline key={i} tokens={x.tokens} /> : <span key={i}>{unescape(x.text)}</span>
          }
          case 'html':
            return <span key={i} dangerouslySetInnerHTML={{ __html: (t as Tokens.HTML).text }} />
          default:
            return <span key={i}>{'raw' in t ? (t as { raw: string }).raw : ''}</span>
        }
      })}
    </>
  )
}

function unescape(s: string) {
  return s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
}

function Blocks({ tokens, ids }: { tokens: Token[]; ids: Map<Token, string> }): ReactNode {
  return (
    <>
      {tokens.map((t, i) => {
        switch (t.type) {
          case 'space':
            return null
          case 'heading': {
            const h = t as Tokens.Heading
            if (h.depth === 1) return null
            const id = ids.get(t)
            const inner = <Inline tokens={h.tokens} />
            if (h.depth === 2)
              return (
                <h2 key={i} id={id}>
                  {inner}
                </h2>
              )
            if (h.depth === 3)
              return (
                <h3 key={i} id={id}>
                  {inner}
                </h3>
              )
            return <h4 key={i}>{inner}</h4>
          }
          case 'paragraph':
            return (
              <p key={i}>
                <Inline tokens={(t as Tokens.Paragraph).tokens} />
              </p>
            )
          case 'text': {
            const x = t as Tokens.Text
            return (
              <p key={i}>
                <Inline tokens={x.tokens} />
              </p>
            )
          }
          case 'code': {
            const c = t as Tokens.Code
            const f = parseFence(c.lang ?? '')
            if (f.lang === 'trace') return <TraceBlock key={i} body={c.text} />
            return <CodeBlock key={i} code={c.text} info={c.lang ?? ''} />
          }
          case 'list': {
            const l = t as Tokens.List
            const Tag = l.ordered ? 'ol' : 'ul'
            return (
              <Tag key={i} start={l.ordered && l.start !== 1 ? Number(l.start) : undefined}>
                {l.items.map((it, j) => (
                  <li key={j}>
                    <Blocks tokens={it.tokens} ids={ids} />
                  </li>
                ))}
              </Tag>
            )
          }
          case 'table': {
            const tb = t as Tokens.Table
            return (
              <div key={i} className="tbl">
                <table>
                  <thead>
                    <tr>
                      {tb.header.map((c, j) => (
                        <th key={j} style={{ textAlign: tb.align[j] ?? undefined }}>
                          <Inline tokens={c.tokens} />
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tb.rows.map((r, k) => (
                      <tr key={k}>
                        {r.map((c, j) => (
                          <td key={j} style={{ textAlign: tb.align[j] ?? undefined }}>
                            <Inline tokens={c.tokens} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          }
          case 'blockquote': {
            const b = t as Tokens.Blockquote
            const m = /^\[!(\S+?)\][ \t]*([^\n]*)\n?/.exec(b.text)
            if (!m || !CALLOUT[m[1]]) {
              return (
                <blockquote key={i}>
                  <Blocks tokens={b.tokens} ids={ids} />
                </blockquote>
              )
            }
            const c = CALLOUT[m[1]]
            const body = marked.lexer(b.text.slice(m[0].length))
            const inner = <Blocks tokens={body} ids={ids} />
            if (c.cls === 'answer')
              return (
                <details key={i} className="callout c-answer">
                  <summary>
                    {c.icon} {m[2] || '点开看答案'}
                  </summary>
                  {inner}
                </details>
              )
            return (
              <aside key={i} className={`callout c-${c.cls}`}>
                <div className="callout-title">
                  <span aria-hidden="true">{c.icon}</span> {m[2] || c.label}
                </div>
                {inner}
              </aside>
            )
          }
          case 'hr':
            return <hr key={i} />
          case 'html':
            return <div key={i} dangerouslySetInnerHTML={{ __html: (t as Tokens.HTML).text }} />
          default:
            return null
        }
      })}
    </>
  )
}

/** 估算一段内容渲染出来有多高（像素）。屏幕外的段落先按这个高度占位，滚过去才真正布局，所以不用算得很准 */
function estimateHeight(tokens: Token[]): number {
  let h = 0
  for (const t of tokens) {
    switch (t.type) {
      case 'heading':
        h += (t as Tokens.Heading).depth === 2 ? 96 : 64
        break
      case 'paragraph':
      case 'text':
        h += 24 + Math.ceil((t as Tokens.Paragraph).text.length / 34) * 33
        break
      case 'code': {
        const c = t as Tokens.Code
        const f = parseFence(c.lang ?? '')
        const n = c.text.split('\n').length
        h += f.lang === 'trace' ? 560 : f.lang === 'input' || f.lang === 'output' ? 48 + n * 26 : 92 + n * 28
        break
      }
      case 'list':
        h += 24 + (t as Tokens.List).items.length * 42
        break
      case 'table':
        h += 32 + ((t as Tokens.Table).rows.length + 1) * 46
        break
      case 'blockquote':
        h += 70 + Math.ceil((t as Tokens.Blockquote).text.length / 34) * 33
        break
      default:
        h += 20
    }
  }
  return Math.round(h)
}

export const Markdown = memo(function Markdown({ tokens }: { tokens: Token[] }) {
  const ids = useMemo(() => headingIds(tokens), [tokens])
  const groups = useMemo(() => {
    const g: Token[][] = [[]]
    for (const t of tokens) {
      if (t.type === 'heading' && (t as Tokens.Heading).depth === 2 && g[g.length - 1].length > 0) g.push([])
      g[g.length - 1].push(t)
    }
    return g
  }, [tokens])
  return (
    <>
      {groups.map((g, i) => (
        <section key={i} className={i === 0 ? 'lsec' : 'lsec lsec-defer'} style={i === 0 ? undefined : { containIntrinsicSize: `auto ${estimateHeight(g)}px` }}>
          <Blocks tokens={g} ids={ids} />
        </section>
      ))}
    </>
  )
})
