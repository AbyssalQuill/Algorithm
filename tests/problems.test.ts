import { describe, expect, it } from 'vitest'
import { ALGOS } from '../src/algos'
import { pickProblems } from '../src/data/problems'
import { TOPIC_PROBLEM_IDS, topicProblems } from '../src/data/topicProblems'

describe('洛谷题单', () => {
  it('每个专题都有课后练习，题号都能在题库里找到，并且标了难度', () => {
    for (const a of ALGOS) {
      const ids = TOPIC_PROBLEM_IDS[a.id]
      expect(ids, `${a.id} 没有配置课后练习`).toBeTruthy()
      const list = pickProblems(...ids)
      expect(list.length, `${a.id} 里有题号不在题库里`).toBe(ids.length)
      expect(new Set(ids).size, `${a.id} 里有重复的题号`).toBe(ids.length)
      expect(list.every((p) => p.diff !== undefined && p.diff >= 1 && p.diff <= 7), `${a.id} 有题目没标难度`).toBe(true)
      expect(list.length, `${a.id} 的题太少`).toBeGreaterThanOrEqual(3)
    }
  })
  it('题单按难度由易到难排列', () => {
    for (const a of ALGOS) {
      const d = topicProblems(a.id).map((p) => p.diff ?? 0)
      expect(d, a.id).toEqual([...d].sort((x, y) => x - y))
    }
  })
  it('大多数专题的题单跨了两个以上的难度', () => {
    const wide = ALGOS.filter((a) => new Set(topicProblems(a.id).map((p) => p.diff)).size >= 2)
    expect(wide.length).toBeGreaterThanOrEqual(ALGOS.length - 2)
  })
})
