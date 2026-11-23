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
  text: string
}

export type ParseResult<I> = { ok: true; value: I } | { ok: false; error: string }

export interface AlgoDef<I, S> {
  id: string
  title: string
  tagline: string
  kind: '数据结构' | '算法'
  intro: string[]
  points: string[]
  pitfalls: string[]
  complexity: { time: string; space: string }
  inputHint: string
  presets?: Preset[]
  defaultInput: I
  parse: (text: string) => ParseResult<I>
  format: (v: I) => string
  random: () => I
  run: (input: I) => Frame<S>[]
  View: ComponentType<{ frame: Frame<S> }>
  /** 四种语言的完整程序。行尾用 //@标签（Python 用 #@标签）标记该行对应的动画步骤，显示时会被去掉 */
  sources: Record<Lang, string>
  problems: Problem[]
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyAlgo = AlgoDef<any, any>
