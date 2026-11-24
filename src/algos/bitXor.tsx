import { ArrayView, type Cell } from '../components/ArrayView'
import { GridView, type GridCell } from '../components/GridView'
import { Stats } from '../components/Stats'
import { pickProblems } from '../data/problems'
import { Recorder } from '../engine/recorder'
import type { Example, Frame, ParseResult } from '../engine/types'
import { fail, randInt, readInput } from './shared'

export interface XorState {
  nums: number[]
  /** 已经处理了几个数 */
  done: number
  /** 处理当前这个数之前的结果 */
  before: number
  /** 当前的结果（异或之后） */
  res: number
  finished: boolean
}

const BITS = 7

export function runXor(nums: number[]): Frame<XorState>[] {
  const rec = new Recorder<XorState>()
  let res = 0
  let before = 0
  let done = 0
  let finished = false
  const snap = (): XorState => ({ nums, done, before, res, finished })
  const bin = (x: number) => x.toString(2).padStart(BITS, '0')

  rec.push('init', snap(), '用一个变量 res 记录异或的结果，开始是 0。异或有三条性质：任何数异或自己等于 0；任何数异或 0 还是它自己；异或满足交换律和结合律。所以成对出现的数会互相抵消，最后剩下的就是只出现一次的那个。')
  nums.forEach((x, i) => {
    before = res
    res ^= x
    done = i + 1
    rec.push('xor', snap(), `res = ${before} ^ ${x}：二进制 ${bin(before)} 和 ${bin(x)} 逐位比较，相同的位变成 0，不同的位变成 1，得到 ${bin(res)}，也就是 ${res}。`)
  })
  finished = true
  rec.push('done', snap(), `所有的数都异或完了：成对的数都抵消成 0，剩下的 ${res} 就是只出现一次的数。`)
  return rec.frames
}

function XorView({ frame }: { frame: Frame<XorState> }) {
  const s = frame.state
  const i = s.done - 1
  const cur = i >= 0 ? s.nums[i] : 0
  const started = s.done > 0
  const bits = (v: number) => Array.from({ length: BITS }, (_, k) => (v >> (BITS - 1 - k)) & 1)
  const row = (label: string, v: number, tone: (b: number, k: number) => GridCell['tone']): GridCell[] => [
    { head: true, text: label },
    ...bits(v).map((b, k): GridCell => ({ text: b, tone: tone(b, k) })),
    { head: true, text: v },
  ]
  const rows: GridCell[][] = [
    [{ head: true }, ...Array.from({ length: BITS }, (_, k): GridCell => ({ head: true, text: BITS - 1 - k })), { head: true, text: '十进制' }],
    ...(started && !s.finished
      ? [
          row('res（之前）', s.before, (b) => (b ? 'idle' : 'dim')),
          row('当前的数', cur, (b) => (b ? 'compare' : 'dim')),
          row('异或的结果', s.res, (b, k) => (bits(s.before)[k] !== bits(cur)[k] ? 'found' : b ? 'idle' : 'dim')),
        ]
      : [row('res', s.res, (b) => (s.finished ? (b ? 'found' : 'dim') : b ? 'idle' : 'dim'))]),
  ]
  const cells: Cell[] = s.nums.map((v, k) => ({ id: k, v, tone: k === i && !s.finished ? 'compare' : k < s.done ? 'done' : 'idle' }))
  return (
    <div className="viz">
      <ArrayView cells={cells} mode="boxes" minSlots={0} />
      <GridView rows={rows} maxCell={44} />
      {started && !s.finished && <div className="row-label">黄色 = 当前的数；红色 = 两个数不同的位，异或之后这些位变成 1</div>}
      {s.finished && (
        <div className="target-row">
          <span className="verdict ok">只出现一次的数：{s.res}</span>
        </div>
      )}
      <Stats items={[['已处理', `${s.done} / ${s.nums.length}`], ['res', s.res]]} />
    </div>
  )
}

function parse(text: string): ParseResult<number[]> {
  return readInput(text, (r) => {
    const n = r.int('n', 3, 9)
    if (n % 2 === 0) fail('n 要是奇数：成对出现的数加上那个落单的数。')
    const a = r.ints(n, '数', 1, 99)
    r.end()
    const cnt = new Map<number, number>()
    for (const x of a) cnt.set(x, (cnt.get(x) ?? 0) + 1)
    const counts = [...cnt.values()]
    if (counts.filter((c) => c === 1).length !== 1 || counts.some((c) => c > 2)) fail('要恰好有一个数只出现一次，其余的数都恰好出现两次。')
    return a
  })
}

export const bitXor: Example<number[], XorState> = {
  slug: 'single',
  name: '只出现一次的数',
  type: '异或抵消',
  statement: {
    desc: ['给定 n 个正整数，其中恰好有一个数只出现了一次，其余的数都恰好出现了两次。找出那个只出现一次的数。要求只扫描一遍，并且只用常数个变量。'],
    input: ['第一行一个整数 n（3 ≤ n ≤ 9，n 是奇数）。', '第二行 n 个整数，每个在 1～99 之间。'],
    output: ['一行一个整数，是只出现一次的那个数。'],
  },
  idea: [
    '最容易想到的办法是用一张表统计每个数出现的次数，再找出次数为 1 的那个，但它要用额外的空间。位运算里有一个更巧的办法：异或。',
    '异或（^）逐位比较两个数，相同的位得 0，不同的位得 1。它有三条性质：a ^ a = 0，a ^ 0 = a，并且满足交换律和结合律。把所有数依次异或到一起，不管它们的顺序是什么，每一对相同的数都会先抵消成 0，最后只剩下落单的那个数与 0 异或，结果就是它本身。',
    '这样只需要一个变量 res，扫描一遍，时间 O(n)，额外空间 O(1)。这个技巧还能用来在两个数之间不借助临时变量交换它们，或者找出缺失的那个数。',
  ],
  complexity: { time: 'O(n)', space: 'O(1)', note: '只扫描一遍，只用一个变量保存结果。' },
  presets: [
    { label: '落单的在中间', text: '5\n7 3 7 9 9' },
    { label: '落单的在最后', text: '7\n4 5 4 6 5 8 8' },
    { label: '只有三个数', text: '3\n2 6 2' },
  ],
  defaultInput: [4, 1, 2, 1, 2],
  parse,
  format: (v) => `${v.length}\n${v.join(' ')}`,
  random: () => {
    const pairs = randInt(1, 4)
    const pool = new Set<number>()
    while (pool.size < pairs + 1) pool.add(randInt(1, 99))
    const vals = [...pool]
    const single = vals.pop()!
    const a = [single, ...vals.flatMap((v) => [v, v])]
    return a.sort(() => Math.random() - 0.5)
  },
  answer: (v) => {
    const cnt = new Map<number, number>()
    for (const x of v) cnt.set(x, (cnt.get(x) ?? 0) + 1)
    return String([...cnt].find(([, c]) => c === 1)![0])
  },
  run: runXor,
  View: XorView,
  sources: {
    c: String.raw`
#include <stdio.h>
int main(){
    int n,x,res=0;                          //@init
    scanf("%d",&n);
    for (int i=0;i<n;i++){
        scanf("%d",&x);
        res^=x;                             //@xor
    }
    printf("%d\n",res);                     //@done
    return 0;
}
`,
    cpp: String.raw`
#include <bits/stdc++.h>
using namespace std;
int main(){
    int n,x,res=0;                          //@init
    cin>>n;
    for (int i=0;i<n;i++){
        cin>>x;
        res^=x;                             //@xor
    }
    cout<<res<<endl;                        //@done
    return 0;
}
`,
    python: String.raw`
n=int(input())
res=0                                       #@init
for x in map(int,input().split()):
    res^=x                                  #@xor
print(res)                                  #@done
`,
    java: String.raw`
import java.util.*;

public class Main{
    public static void main(String[] args){
        Scanner sc=new Scanner(System.in);
        int n=sc.nextInt(),res=0;           //@init
        for (int i=0;i<n;i++){
            res^=sc.nextInt();              //@xor
        }
        System.out.println(res);            //@done
    }
}
`,
  },
  problems: pickProblems('P1469', 'P1100'),
}
