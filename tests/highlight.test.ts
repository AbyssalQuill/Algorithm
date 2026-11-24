import { describe, expect, it } from 'vitest'
import { tokenize } from '../src/engine/highlight'
import type { Lang } from '../src/engine/types'

/** 每一行里有文字的片段是不是全都是注释（斜体） */
const allComment = (line: { text: string; italic?: boolean }[]) => line.filter((t) => t.text.trim()).every((t) => t.italic)

describe('代码高亮：注释', () => {
  it('多行注释从头到尾每一行都按注释上色', () => {
    const code = 'int main(){\n    /* 这是多行注释,\n       可以写很多行 */\n    cout<<"第二句"<<endl;\n    return 0;\n}'
    for (const lang of ['c', 'cpp', 'java'] as Lang[]) {
      const lines = tokenize(code, lang)
      expect(lines.length, lang).toBe(6)
      expect(allComment(lines[1]), `${lang} 第 2 行`).toBe(true)
      expect(allComment(lines[2]), `${lang} 第 3 行`).toBe(true)
      expect(allComment(lines[3]), `${lang} 注释结束以后恢复正常`).toBe(false)
    }
  })
  it('行尾注释只有注释的部分是注释', () => {
    const lines = tokenize('int a=1; // 先放着\nint b=2;', 'cpp')
    expect(lines[0].some((t) => !t.italic && t.text.includes('int'))).toBe(true)
    expect(lines[0][lines[0].length - 1].italic).toBe(true)
    expect(lines[1].every((t) => !t.italic)).toBe(true)
  })
  it('Python 的 # 注释和三引号字符串', () => {
    const lines = tokenize('x = 1  # 一个注释\ns = """第一行\n第二行"""\ny = 2', 'python')
    expect(lines[0][lines[0].length - 1].italic).toBe(true)
    expect(lines.length).toBe(4)
    expect(lines[3].every((t) => !t.italic)).toBe(true)
  })
  it('没有结束的多行注释，后面的行都算注释', () => {
    const lines = tokenize('/* 没有写结束\n第二行\n第三行', 'cpp')
    expect(lines.every((l) => allComment(l))).toBe(true)
  })
})
