import type { ComponentType } from 'react'

export type Lang = 'c' | 'cpp' | 'python' | 'java'

export const LANGS: { id: Lang; label: string }[] = [
  { id: 'c', label: 'C' },
  { id: 'cpp', label: 'C++' },
  { id: 'python', label: 'Python' },
  { id: 'java', label: 'Java' },
]

/** 动画的一帧：数据状态 + 当前对应的代码标签 + 一句中文讲解 */
export interface Frame<S> {
  state: S
  step: string
  note: string
}

/** 洛谷例题。diff 取洛谷难度：0 暂无评定，1 入门，2 普及-，3 普及/提高-，4 普及+/提高，5 提高+/省选-，6 省选/NOI-，7 NOI/NOI+/CTSC */
export interface Problem {
  pid: string
  title: string
  /** 洛谷难度；没核对过的就不写，页面上不显示难度 */
  diff?: number
  why: string
}

export interface Preset {
  label: string
  /** 完整的输入文本，格式和题目里的“输入格式”一致，可以有多行 */
  text: string
}

export type ParseResult<I> = { ok: true; value: I } | { ok: false; error: string }

/** 题面：和比赛里的题目一样，由描述、输入格式、输出格式三部分组成 */
export interface Statement {
  /** 题目描述，每个元素是一段 */
  desc: string[]
  /** 输入格式（连同数据范围），每个元素是一行 */
  input: string[]
  /** 输出格式 */
  output: string[]
}

/** 一道例题：有自己的题面、输入、动画和四种语言的完整程序 */
export interface Example<I, S> {
  /** 例题在地址里的名字，同一个专题内不重复，如 'island' */
  slug: string
  /** 例题名，如“岛屿数量” */
  name: string
  /** 例题的类型，如“连通块计数”，用来区分同一个算法的不同用法 */
  type: string
  statement: Statement
  /** 这道题怎么想：说明题目是怎样落到这个算法上的，每个元素一段 */
  idea?: string[]
  complexity: { time: string; space: string; note?: string }
  presets?: Preset[]
  defaultInput: I
  /** 把输入框里的文本（题目规定的输入格式）解析成输入，格式不对时给出中文提示 */
  parse: (text: string) => ParseResult<I>
  /** 把输入还原成输入框里的文本，必须和 parse 互逆 */
  format: (v: I) => string
  random: () => I
  /** 程序对这份输入应该输出的内容，用来显示输出，测试里也用它核对四种语言的程序 */
  answer: (v: I) => string
  run: (input: I) => Frame<S>[]
  View: ComponentType<{ frame: Frame<S> }>
  /** 四种语言的完整程序。行尾用 //@标签（Python 用 #@标签）标记该行对应的动画步骤，显示时会被去掉 */
  sources: Record<Lang, string>
  problems: Problem[]
}

/** 一个专题（一个算法或数据结构）：专题自己的介绍，加上若干道例题，第一道例题就是这个对象本身 */
export interface AlgoDef<I, S> extends Example<I, S> {
  id: string
  /** 专题的标题，就是算法或数据结构的名字，如“DFS” */
  title: string
  tagline: string
  kind: '数据结构' | '算法'
  intro: string[]
  points: string[]
  pitfalls: string[]
  /** 第一道例题之外的其他例题 */
  extra?: AnyExample[]
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyExample = Example<any, any>
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyAlgo = AlgoDef<any, any>
