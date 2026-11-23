import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * 站点自带的字体只包含“用到的字”（tools/subset_fonts.py 生成）。
 * 新增了课文或界面文字之后，如果出现了字库里没有的汉字，这里会提醒你重新运行脚本，
 * 否则这些字会退回到系统字体，看起来和其余文字不一致。
 */
const ROOT = join(__dirname, '..', 'src')
const regular = new Set(readFileSync(join(ROOT, 'assets', 'fonts', 'wenkai-regular.chars.txt'), 'utf-8'))

function walk(dir: string, out: string[] = []): string[] {
  for (const n of readdirSync(dir)) {
    const p = join(dir, n)
    if (statSync(p).isDirectory()) walk(p, out)
    else if (/\.(ts|tsx|md|css)$/.test(n)) out.push(p)
  }
  return out
}

describe('字体字库', () => {
  it('课文和界面里的汉字都在自带的字体里', () => {
    const missing = new Set<string>()
    for (const f of walk(ROOT)) {
      for (const c of readFileSync(f, 'utf-8')) {
        // 只检查汉字；表情符号、少见符号本来就走系统字体
        if (/[\u3400-\u9fff]/.test(c) && !regular.has(c)) missing.add(c)
      }
    }
    expect([...missing].join(''), '字库缺字，请运行 python tools/subset_fonts.py').toBe('')
  })
})
