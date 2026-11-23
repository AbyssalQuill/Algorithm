import type { HighlighterCore } from 'shiki/core'
import type { Lang } from './types'

export interface Tok {
  text: string
  light?: string
  dark?: string
  italic?: boolean
}

let hl: Promise<HighlighterCore> | null = null

/** 按需加载 Shiki（只带 C / C++ / Python / Java 四种语法 + 一对亮暗主题，用 JS 正则引擎，体积小） */
function getHighlighter() {
  hl ??= (async () => {
    const [{ createHighlighterCore }, { createJavaScriptRegexEngine }] = await Promise.all([import('shiki/core'), import('shiki/engine/javascript')])
    return createHighlighterCore({
      themes: [import('shiki/themes/vitesse-light.mjs'), import('shiki/themes/vitesse-dark.mjs')],
      langs: [import('shiki/langs/c.mjs'), import('shiki/langs/cpp.mjs'), import('shiki/langs/python.mjs'), import('shiki/langs/java.mjs')],
      engine: createJavaScriptRegexEngine(),
    })
  })()
  return hl
}

/** 把代码切成“每行若干带颜色的片段”，同时给出亮/暗两套颜色，主题切换时不用重新计算 */
export async function tokenizeCode(code: string, lang: Lang): Promise<Tok[][]> {
  const h = await getHighlighter()
  const lines = h.codeToTokensWithThemes(code, { lang, themes: { light: 'vitesse-light', dark: 'vitesse-dark' } })
  return lines.map((line) =>
    line.map((t) => ({
      text: t.content,
      light: t.variants.light?.color,
      dark: t.variants.dark?.color,
      italic: (((t.variants.light?.fontStyle as number | undefined) ?? 0) & 1) === 1,
    })),
  )
}
