import type { ParseResult } from '../engine/types'

/** 把“1 2, 3、4”这样的文本拆成数字（不检查范围） */
export function toNums(text: string): number[] {
  return text
    .trim()
    .split(/[\s,，、]+/)
    .filter(Boolean)
    .map(Number)
}

/** 解析一串整数，并检查个数与取值范围 */
export function parseList(text: string, o: { min: number; max: number; lo: number; hi: number }): ParseResult<number[]> {
  const nums = toNums(text)
  if (nums.length < o.min || nums.length > o.max) return { ok: false, error: `请输入 ${o.min}～${o.max} 个整数，用空格隔开。` }
  if (nums.some((x) => !Number.isInteger(x) || x < o.lo || x > o.hi)) return { ok: false, error: `每个数都要是 ${o.lo}～${o.hi} 之间的整数。` }
  return { ok: true, value: nums }
}

export const randInt = (lo: number, hi: number) => lo + Math.floor(Math.random() * (hi - lo + 1))
export const randList = (n: number, lo = 1, hi = 95) => Array.from({ length: n }, () => randInt(lo, hi))

/** 按“|”切成左右两半（支持全角竖线） */
export const splitBar = (text: string) => text.split(/[|｜]/)
