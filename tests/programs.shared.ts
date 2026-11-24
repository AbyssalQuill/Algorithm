import { describe } from 'vitest'
import { ALL_EXAMPLES } from '../src/algos'
import type { Lang } from '../src/engine/types'
import { itPrograms } from './helpers'

/**
 * 题面、输入输出、程序要说的是同一件事：
 * 对默认输入、每个预设和一批随机输入，用 format 得到的文本喂给程序，输出必须和页面上显示的 answer 一致。
 * 四种语言各放在一个测试文件里，这样它们可以同时跑。
 */
// 本地只想跑几个专题时：ONLY=dfs|bfs pnpm exec vitest run tests/programs
const only = process.env.ONLY ? new RegExp(process.env.ONLY) : null

export function registerPrograms(lang: Lang) {
  describe(`${lang} 程序和题面里的输出一致`, () => {
    for (const { algo, ex } of ALL_EXAMPLES) {
      if (only && !only.test(`${algo.id}/${ex.slug}`)) continue
      describe(`${algo.id}/${ex.slug}`, () => {
        itPrograms(
          { id: algo.id, slug: ex.slug, sources: ex.sources },
          () => {
            const inputs = [
              ex.defaultInput,
              ...(ex.presets ?? []).map((p) => {
                const r = ex.parse(p.text)
                if (!r.ok) throw new Error(r.error)
                return r.value
              }),
              ...Array.from({ length: 6 }, () => ex.random()),
            ]
            return inputs.map((v) => ({ input: `${ex.format(v)}
`, expected: ex.answer(v), label: ex.format(v) }))
          },
          [lang],
        )
      })
    }
  })
}
