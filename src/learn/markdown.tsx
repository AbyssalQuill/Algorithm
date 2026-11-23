import type { ReactNode } from 'react'
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

export function extractToc(tokens: Token[]): TocItem[] {
  const slug = makeSlugger()
  const out: TocItem[] = []
  for (const t of tokens) {
    if (t.type !== 'heading') continue
    const h = t as Tokens.Heading
    if (h.depth === 2 || h.depth === 3) out.push({ id: slug(h.text), text: h.text, depth: h.depth })
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

function Blocks({ tokens, slug }: { tokens: Token[]; slug: (s: string) => string }): ReactNode {
  return (
    <>
      {tokens.map((t, i) => {
        switch (t.type) {
          case 'space':
            return null
          case 'heading': {
            const h = t as Tokens.Heading
            if (h.depth === 1) return null
            const id = slug(h.text)
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
                    <Blocks tokens={it.tokens} slug={slug} />
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
                  <Blocks tokens={b.tokens} slug={slug} />
                </blockquote>
              )
            }
            const c = CALLOUT[m[1]]
            const body = marked.lexer(b.text.slice(m[0].length))
            const inner = <Blocks tokens={body} slug={slug} />
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

export function Markdown({ tokens }: { tokens: Token[] }) {
  return <Blocks tokens={tokens} slug={makeSlugger()} />
}
