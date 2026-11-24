import { ArrayView, type Cell, type Pointer, type Tone } from '../components/ArrayView'
import { Stats } from '../components/Stats'
import { pickProblems } from '../data/problems'
import { Recorder } from '../engine/recorder'
import type { AlgoDef, Frame, ParseResult } from '../engine/types'
import { randInt, readInput } from './shared'

export interface PsInput {
  arr: number[]
  /** 查询区间 [l, r]，下标从 1 开始，两端都包含 */
  l: number
  r: number
}

export interface PsState {
  arr: number[]
  /** 已经算好的前缀和 s[0..built]；s[0]=0 */
  s: number[]
  /** 正在计算的是 s[building]；0 表示没有 */
  building: number
  l: number
  r: number
  phase: 'build' | 'query'
  answer: number | null
}

export function runPrefixSum({ arr, l, r }: PsInput): Frame<PsState>[] {
  const rec = new Recorder<PsState>()
  const n = arr.length
  const s: number[] = [0]
  let building = 0
  let phase: PsState['phase'] = 'build'
  let answer: number | null = null
  const snap = (): PsState => ({ arr, s, building, l, r, phase, answer })

  rec.push('init', snap(), '先建一张“前缀和表” s：s[i] 表示 a[1] 到 a[i] 的总和。规定 s[0] = 0，表示“一个数都不取”的和。')
  for (let i = 1; i <= n; i++) {
    s.push(s[i - 1] + arr[i - 1])
    building = i
    rec.push('build', snap(), `s[${i}] = s[${i - 1}] + a[${i}] = ${s[i - 1]} + ${arr[i - 1]} = ${s[i]}。每个数只用加一次。`)
  }
  building = 0
  phase = 'query'
  answer = s[r] - s[l - 1]
  rec.push(
    'query',
    snap(),
    `表建好了。查询 a[${l}] 到 a[${r}] 的和：s[${r}] 是前 ${r} 个数的和，s[${l - 1}] 是前 ${l - 1} 个数的和，两者相减，多出来的正好就是第 ${l} 到第 ${r} 个数。s[${r}] - s[${l - 1}] = ${s[r]} - ${s[l - 1]} = ${answer}。`,
  )
  return rec.frames
}

function PsView({ frame }: { frame: Frame<PsState> }) {
  const s = frame.state
  const n = s.arr.length
  const inRange = (i: number) => s.phase === 'query' && i >= s.l && i <= s.r
  // 两行都画成 n+1 格（下标 0～n），让上下两行的列对齐
  const top: Cell[] = [{ id: 0, v: 0, label: '', tone: 'dim' }, ...s.arr.map((v, k): Cell => ({ id: k + 1, v, tone: inRange(k + 1) ? 'compare' : 'idle' }))]
  const bottom: Cell[] = Array.from({ length: n + 1 }, (_, i): Cell => {
    const known = i < s.s.length
    let tone: Tone = known ? 'done' : 'dim'
    if (s.phase === 'build' && i === s.building) tone = 'compare'
    if (s.phase === 'query' && (i === s.r || i === s.l - 1)) tone = 'found'
    return { id: i, v: known ? s.s[i] : 0, label: known ? undefined : '?', tone }
  })
  const bottomPtr: Pointer[] = []
  if (s.phase === 'query') {
    bottomPtr.push({ name: `s[${s.r}]`, index: s.r, tone: 'found' }, { name: `s[${s.l - 1}]`, index: s.l - 1, tone: 'found' })
  }
  return (
    <div className="viz">
      <div className="row-label">原数组 a（下标从 1 开始）</div>
      <ArrayView cells={top} mode="boxes" base={0} minSlots={0} />
      <div className="row-label">前缀和 s</div>
      <ArrayView cells={bottom} pointers={bottomPtr} mode="boxes" minSlots={2} />
      {s.answer !== null && (
        <div className="target-row">
          <span className="target-chip">
            s[{s.r}] − s[{s.l - 1}] = <b>{s.s[s.r]}</b> − <b>{s.s[s.l - 1]}</b> = <b>{s.answer}</b>
          </span>
          <span className="verdict ok">区间和：{s.answer}</span>
        </div>
      )}
      <Stats
        items={[
          ['查询区间', `[${s.l}, ${s.r}]`],
          ['区间长度', s.r - s.l + 1],
          ['直接累加要加', `${s.r - s.l} 次`],
          ['用前缀和要减', '1 次'],
        ]}
      />
    </div>
  )
}

function parse(text: string): ParseResult<PsInput> {
  return readInput(text, (r) => {
    const n = r.int('n', 2, 10)
    const arr = r.ints(n, '数', 0, 99)
    const l = r.int('l', 1, n)
    const rr = r.int('r', l, n)
    r.end()
    return { arr, l, r: rr }
  })
}

export const prefixSum: AlgoDef<PsInput, PsState> = {
  id: 'prefix-sum',
  title: '前缀和',
  tagline: '先花一遍的时间累加成一张表，之后每次区间求和只需要做一次减法',
  kind: '算法',
  slug: 'range-sum',
  name: '区间求和',
  type: '一维前缀和',
  statement: {
    desc: [
      '给定一个长度为 n 的数组，求下标从 l 到 r（含两端，下标从 1 开始）的所有数之和。',
    ],
    input: [
      '第一行一个整数 n（2 ≤ n ≤ 10），第二行 n 个整数，每个在 0～99 之间。',
      '第三行两个整数 l 和 r（1 ≤ l ≤ r ≤ n）。',
    ],
    output: [
      '一行一个整数，表示区间 [l, r] 里所有数的和。',
    ],
  },
  intro: [
    '假设要回答很多次这样的询问：数组里从第 l 个数到第 r 个数的和是多少？每次都从 l 加到 r，询问次数一多，时间就吃不消了。',
    '前缀和的想法是把累加的工作提前做完。先算出 s[i]，表示前 i 个数的总和。之后任意一段区间的和，都等于“到 r 为止的总和”减去“到 l-1 为止的总和”，多出来的部分正好就是这一段。建表花一遍 O(n)，之后每次询问只要一次减法。',
  ],
  points: [
    '下标从 1 开始存放数组，并规定 s[0]=0，这样 l=1 时 s[l-1]=s[0] 不会越界，也不需要单独判断。',
    's[i] = s[i-1] + a[i]：每个前缀和都在前一个的基础上加一个数。',
    '区间 [l, r] 的和等于 s[r] - s[l-1]，与区间的长短无关，永远只需要一次减法。',
    '建表的过程可以和读入同时完成，不必另外再扫一遍。',
  ],
  pitfalls: [
    '写成 s[r] - s[l] 会漏掉 a[l] 这一项，应该减的是 s[l-1]。',
    '总和可能很大，数据量大时要用 long long 保存前缀和，否则会溢出。',
    '数组从 0 开始存放时，s[l-1] 在 l=0 处会越界，这是下标从 1 开始存放的主要原因。',
  ],
  complexity: { time: 'O(n + q)', space: 'O(n)', note: '建表 O(n)，之后每次询问 O(1)，一共 q 次询问就是 O(n + q)。' },
  presets: [
    { label: '中间一段', text: '8\n3 1 4 1 5 9 2 6\n3 6' },
    { label: '从头开始', text: '8\n3 1 4 1 5 9 2 6\n1 4' },
    { label: '只有一个数', text: '8\n3 1 4 1 5 9 2 6\n5 5' },
  ],
  defaultInput: { arr: [3, 1, 4, 1, 5, 9, 2, 6], l: 3, r: 6 },
  parse,
  format: (v) => `${v.arr.length}\n${v.arr.join(' ')}\n${v.l} ${v.r}`,
  answer: (v) => String(v.arr.slice(v.l - 1, v.r).reduce((x, y) => x + y, 0)),
  random: () => {
    const n = randInt(6, 9)
    const arr = Array.from({ length: n }, () => randInt(0, 20))
    const a = randInt(1, n)
    const b = randInt(1, n)
    return { arr, l: Math.min(a, b), r: Math.max(a, b) }
  },
  run: runPrefixSum,
  View: PsView,
  sources: {
    c: String.raw`
#include <stdio.h>
int main(){
    int n,l,r,a[1005],s[1005];
    scanf("%d",&n);
    s[0]=0;                      // s[0]=0，方便处理从第 1 个开始的区间        //@init
    for (int i=1;i<=n;i++){
        scanf("%d",&a[i]);
        s[i]=s[i-1]+a[i];        // s[i] 是前 i 个数的和                //@build
    }
    scanf("%d %d",&l,&r);
    printf("%d\n",s[r]-s[l-1]);  // 区间 [l, r] 的和 = s[r] - s[l-1]  //@query
    return 0;
}
`,
    cpp: String.raw`
#include <bits/stdc++.h>
using namespace std;
int main(){
    int n,l,r,a[1005],s[1005];
    cin>>n;
    s[0]=0;                   // s[0]=0，方便处理从第 1 个开始的区间        //@init
    for (int i=1;i<=n;i++){
        cin>>a[i];
        s[i]=s[i-1]+a[i];     // s[i] 是前 i 个数的和                //@build
    }
    cin>>l>>r;
    cout<<s[r]-s[l-1]<<endl;  // 区间 [l, r] 的和 = s[r] - s[l-1]  //@query
    return 0;
}
`,
    python: String.raw`
n=int(input())
a=[0]+list(map(int,input().split()))
s=[0]*(n+1)           # s[0]=0，方便处理从第 1 个开始的区间        #@init
for i in range(1,n+1):
    s[i]=s[i-1]+a[i]  # s[i] 是前 i 个数的和                #@build
l,r=map(int,input().split())
print(s[r]-s[l-1])    # 区间 [l, r] 的和 = s[r] - s[l-1]  #@query
`,
    java: String.raw`
import java.util.*;

public class Main{
    public static void main(String[] args){
        Scanner sc=new Scanner(System.in);
        int n=sc.nextInt();
        int[] a=new int[n+1];
        int[] s=new int[n+1];             // s[0]=0，方便处理从第 1 个开始的区间        //@init
        for (int i=1;i<=n;i++){
            a[i]=sc.nextInt();
            s[i]=s[i-1]+a[i];             // s[i] 是前 i 个数的和                //@build
        }
        int l=sc.nextInt(),r=sc.nextInt();
        System.out.println(s[r]-s[l-1]);  // 区间 [l, r] 的和 = s[r] - s[l-1]  //@query
    }
}
`,
  },
  problems: pickProblems('P8218', 'P2004'),
}
