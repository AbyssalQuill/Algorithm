import { ArrayView, type Cell, type Pointer, type Tone } from '../components/ArrayView'
import { Stats } from '../components/Stats'
import { pickProblems } from '../data/problems'
import { Recorder } from '../engine/recorder'
import type { AlgoDef, Frame, ParseResult } from '../engine/types'
import { randInt, readInput } from './shared'

export interface Op {
  l: number
  r: number
  k: number
}

export interface DiffInput {
  arr: number[]
  ops: Op[]
}

export interface DiffState {
  arr: number[]
  /** 差分数组 d[1..n+1]；还没算的是 null */
  d: (number | null)[]
  /** 还原出来的最终数组；还没算的是 null */
  res: (number | null)[]
  /** 正在处理的第几次操作 */
  op: Op | null
  opNo: number
  /** 当前改动的是 d 的哪个位置、做第几次还原 */
  at: number | null
  phase: 'build' | 'update' | 'restore' | 'done'
}

export function runDiff({ arr, ops }: DiffInput): Frame<DiffState>[] {
  const rec = new Recorder<DiffState>()
  const n = arr.length
  const d: (number | null)[] = new Array(n + 2).fill(null)
  const res: (number | null)[] = new Array(n + 1).fill(null)
  let op: Op | null = null
  let opNo = 0
  let at: number | null = null
  let phase: DiffState['phase'] = 'build'
  const snap = (): DiffState => ({ arr, d, res, op, opNo, at, phase })

  rec.push('init', snap(), `要对数组做多次“把区间 [l, r] 里的每个数都加上 k”。逐个修改太慢，换一个思路：先建立差分数组 d，d[i] 表示 a[i] 比前一个数 a[i-1] 多多少（规定 a[0]=0）。`)
  for (let i = 1; i <= n; i++) {
    d[i] = arr[i - 1] - (i > 1 ? arr[i - 2] : 0)
    at = i
    rec.push('build', snap(), `d[${i}] = a[${i}] - a[${i - 1}] = ${arr[i - 1]} - ${i > 1 ? arr[i - 2] : 0} = ${d[i]}。`)
  }
  d[n + 1] = 0
  phase = 'update'
  ops.forEach((o, idx) => {
    op = o
    opNo = idx + 1
    d[o.l] = (d[o.l] as number) + o.k
    at = o.l
    rec.push('addL', snap(), `第 ${idx + 1} 次操作：区间 [${o.l}, ${o.r}] 都加 ${o.k}。从 ${o.l} 开始，每个数都比原来多 ${o.k}，所以 d[${o.l}] 增加 ${o.k}，变成 ${d[o.l]}。`)
    d[o.r + 1] = (d[o.r + 1] as number) - o.k
    at = o.r + 1
    rec.push('subR', snap(), `到 ${o.r + 1} 这个位置，多出来的 ${o.k} 要“取消”，所以 d[${o.r + 1}] 减去 ${o.k}，变成 ${d[o.r + 1]}。整个区间只改了 d 里的两个数。`)
  })
  op = null
  phase = 'restore'
  let sum = 0
  for (let i = 1; i <= n; i++) {
    sum += d[i] as number
    res[i] = sum
    at = i
    rec.push('restore', snap(), `把差分数组累加起来就能还原出数组：a[${i}] = d[1] + … + d[${i}] = ${sum}。`)
  }
  phase = 'done'
  at = null
  rec.push('done', snap(), `全部 ${ops.length} 次区间修改完成，最后只做了一遍 O(n) 的累加。`)
  return rec.frames
}

function DiffView({ frame }: { frame: Frame<DiffState> }) {
  const s = frame.state
  const n = s.arr.length
  // 三行都画成 n+1 格（下标 1～n+1），上下对齐：a 和还原结果的最后一格留空
  const blank = (id: number): Cell => ({ id, v: 0, label: '', tone: 'dim' })
  const orig: Cell[] = [...s.arr.map((v, k): Cell => ({ id: k + 1, v, tone: s.op && k + 1 >= s.op.l && k + 1 <= s.op.r ? 'compare' : 'idle' })), blank(n + 1)]
  const diff: Cell[] = Array.from({ length: n + 1 }, (_, i): Cell => {
    const idx = i + 1
    const v = s.d[idx]
    let tone: Tone = v === null ? 'dim' : 'idle'
    if (s.phase !== 'restore' && s.phase !== 'done' && s.at === idx) tone = 'swap'
    return { id: idx, v: v ?? 0, label: v === null ? '' : undefined, tone }
  })
  const res: Cell[] = [
    ...Array.from({ length: n }, (_, k): Cell => {
      const v = s.res[k + 1]
      return { id: k + 1, v: v ?? 0, label: v === null ? '' : undefined, tone: v === null ? 'dim' : s.phase === 'restore' && s.at === k + 1 ? 'compare' : 'done' }
    }),
    blank(n + 1),
  ]
  const dPtr: Pointer[] = s.at !== null && s.phase !== 'restore' && s.phase !== 'done' ? [{ name: 'd[' + s.at + ']', index: s.at - 1, tone: 'swap' }] : []
  return (
    <div className="viz">
      <div className="row-label">原数组 a（下标从 1 开始）{s.op ? `　第 ${s.opNo} 次操作：[${s.op.l}, ${s.op.r}] 加 ${s.op.k}` : ''}</div>
      <ArrayView cells={orig} mode="boxes" base={1} minSlots={0} />
      <div className="row-label">差分数组 d</div>
      <ArrayView cells={diff} pointers={dPtr} mode="boxes" base={1} minSlots={0} />
      <div className="row-label">还原的结果</div>
      <ArrayView cells={res} mode="boxes" base={1} minSlots={0} />
      <Stats
        items={[
          ['区间修改', s.opNo + ' 次'],
          ['每次改动', '只动 2 个数'],
        ]}
      />
    </div>
  )
}

function parse(text: string): ParseResult<DiffInput> {
  return readInput(text, (r) => {
    const n = r.int('n', 2, 8)
    const arr = r.ints(n, '数', -99, 99)
    const m = r.int('m', 1, 4)
    const ops: Op[] = []
    for (let t = 1; t <= m; t++) {
      const l = r.int(`第 ${t} 次操作的 l`, 1, n)
      const rr = r.int(`第 ${t} 次操作的 r`, l, n)
      const k = r.int(`第 ${t} 次操作的 k`, -99, 99)
      ops.push({ l, r: rr, k })
    }
    r.end()
    return { arr, ops }
  })
}

export const diffArray: AlgoDef<DiffInput, DiffState> = {
  id: 'diff-array',
  title: '差分',
  tagline: '把“给一段区间都加上 k”变成“只改两个位置”，最后一次性还原',
  kind: '算法',
  slug: 'range-add',
  name: '区间加法',
  type: '一维差分',
  statement: {
    desc: [
      '给定一个长度为 n 的数组，依次执行 m 次操作，每次操作把下标 l 到 r（含两端，下标从 1 开始）的每个数都加上 k。所有操作结束以后，输出整个数组。',
    ],
    input: [
      '第一行一个整数 n（2 ≤ n ≤ 8），第二行 n 个整数，每个在 -99～99 之间。',
      '第三行一个整数 m（1 ≤ m ≤ 4），其后 m 行每行三个整数 l、r、k（1 ≤ l ≤ r ≤ n，-99 ≤ k ≤ 99）。',
    ],
    output: [
      '一行 n 个整数，是所有操作结束以后的数组，用空格隔开。',
    ],
  },
  intro: [
    '有一类题目会给出很多次这样的操作：把数组里从 l 到 r 的每个数都加上 k，操作完之后再问数组变成了什么样。如果真的一个一个地加，每次操作要花 O(n) 的时间，次数一多就超时了。',
    '差分的想法是换一种方式记录数组：不记每个数是多少，而是记每个数比前一个数多多少，也就是 d[i] = a[i] - a[i-1]。这样一来，“区间 [l, r] 都加 k”只会改变两处差值：从 l 开始每个数都多了 k，所以 d[l] 加 k；到 r+1 这里要把多出来的取消，所以 d[r+1] 减 k。每次操作只改两个数，所有操作做完之后，再把 d 累加一遍，就还原出最终的数组。',
  ],
  points: [
    '差分是前缀和的逆运算：对 d 求前缀和，得到的正是 a。',
    '一次区间修改只需要 d[l]+=k 和 d[r+1]-=k 两步，时间 O(1)。',
    'd 要开到 n+1 的大小，因为 r 可能等于 n，此时 r+1 就是 n+1。',
    '所有修改做完之后再一次性求前缀和，总时间是 O(n + 操作次数)。如果中途也需要查询，就要换用树状数组或线段树。',
  ],
  pitfalls: [
    '把减的位置写成 d[r]，而不是 d[r+1]，区间的最后一个数就没有被加上。',
    '数组下标从 0 开始时，l-1、r+1 容易越界，通常把数组从下标 1 开始存放，并把 a[0] 当作 0。',
    '差分只适合“先全部修改，最后再查看”的场景；修改和查询交替出现时，每次查询都要重新累加，反而更慢。',
  ],
  complexity: { time: 'O(n + m)', space: 'O(n)', note: 'm 是区间修改的次数。每次修改 O(1)，最后还原一遍 O(n)。' },
  presets: [
    { label: '两次操作', text: '6\n1 2 3 4 5 6\n2\n2 4 10\n3 6 -5' },
    { label: '全是 0', text: '6\n0 0 0 0 0 0\n3\n1 3 2\n2 5 3\n4 6 1' },
    { label: '修改到末尾', text: '4\n5 5 5 5\n1\n3 4 -2' },
  ],
  defaultInput: { arr: [1, 2, 3, 4, 5, 6], ops: [{ l: 2, r: 4, k: 10 }, { l: 3, r: 6, k: -5 }] },
  parse,
  format: (v) => `${v.arr.length}\n${v.arr.join(' ')}\n${v.ops.length}\n${v.ops.map((o) => `${o.l} ${o.r} ${o.k}`).join('\n')}`,
  answer: (v) => {
    const a = [...v.arr]
    for (const o of v.ops) for (let i = o.l - 1; i < o.r; i++) a[i] += o.k
    return a.join(' ')
  },
  random: () => {
    const n = randInt(5, 8)
    const arr = Array.from({ length: n }, () => randInt(0, 9))
    const ops = Array.from({ length: randInt(1, 3) }, () => {
      const a = randInt(1, n)
      const b = randInt(1, n)
      return { l: Math.min(a, b), r: Math.max(a, b), k: randInt(-9, 9) }
    })
    return { arr, ops }
  },
  run: runDiff,
  View: DiffView,
  sources: {
    c: String.raw`
#include <stdio.h>
int main(){
    int n,m,a[1005]={0},d[1005]={0};
    scanf("%d",&n);
    for (int i=1;i<=n;i++){
        scanf("%d",&a[i]);
        d[i]=a[i]-a[i-1];  // 差分数组：每个数和前一个数的差    //@build
    }
    scanf("%d",&m);        // 读入操作的次数            //@init
    while (m--){
        int l,r,k;
        scanf("%d %d %d",&l,&r,&k);
        d[l]+=k;           // 从 l 开始，后面的数都要加上 k  //@addL
        d[r+1]-=k;         // 到 r+1 这里，把这个影响抵消掉  //@subR
    }
    for (int i=1;i<=n;i++){
        d[i]+=d[i-1];      // 对差分数组求前缀和，还原出每个数   //@restore
        printf("%d ",d[i]);
    }
    printf("\n");          // 输出最终的数组            //@done
    return 0;
}
`,
    cpp: String.raw`
#include <bits/stdc++.h>
using namespace std;
int main(){
    int n,m;
    cin>>n;
    vector<int> a(n+2),d(n+2);
    for (int i=1;i<=n;i++){
        cin>>a[i];
        d[i]=a[i]-a[i-1];  // 差分数组：每个数和前一个数的差    //@build
    }
    cin>>m;                // 读入操作的次数            //@init
    while (m--){
        int l,r,k;
        cin>>l>>r>>k;
        d[l]+=k;           // 从 l 开始，后面的数都要加上 k  //@addL
        d[r+1]-=k;         // 到 r+1 这里，把这个影响抵消掉  //@subR
    }
    for (int i=1;i<=n;i++){
        d[i]+=d[i-1];      // 对差分数组求前缀和，还原出每个数   //@restore
        cout<<d[i]<<" ";
    }
    cout<<endl;            // 输出最终的数组            //@done
    return 0;
}
`,
    python: String.raw`
n=int(input())
a=[0]+list(map(int,input().split()))
d=[0]*(n+2)
for i in range(1,n+1):
    d[i]=a[i]-a[i-1]  # 差分数组：每个数和前一个数的差     #@build
m=int(input())        # 读入操作的次数             #@init
for _ in range(m):
    l,r,k=map(int,input().split())
    d[l]+=k           # 从 l 开始，后面的数都要加上 k   #@addL
    d[r+1]-=k         # 到 r+1 这里，把这个影响抵消掉   #@subR
for i in range(1,n+1):
    d[i]+=d[i-1]      # 对差分数组求前缀和，还原出每个数    #@restore
print(*d[1:n+1])      # 输出最终的数组             #@done
`,
    java: String.raw`
import java.util.*;

public class Main{
    public static void main(String[] args){
        Scanner sc=new Scanner(System.in);
        int n=sc.nextInt();
        int[] a=new int[n+2],d=new int[n+2];
        for (int i=1;i<=n;i++){
            a[i]=sc.nextInt();
            d[i]=a[i]-a[i-1];    // 差分数组：每个数和前一个数的差    //@build
        }
        int m=sc.nextInt();      // 读入操作的次数            //@init
        while (m-- > 0){
            int l=sc.nextInt(),r=sc.nextInt(),k=sc.nextInt();
            d[l]+=k;             // 从 l 开始，后面的数都要加上 k  //@addL
            d[r+1]-=k;           // 到 r+1 这里，把这个影响抵消掉  //@subR
        }
        StringBuilder sb=new StringBuilder();
        for (int i=1;i<=n;i++){
            d[i]+=d[i-1];        // 对差分数组求前缀和，还原出每个数   //@restore
            sb.append(d[i]).append(' ');
        }
        System.out.println(sb);  // 输出最终的数组            //@done
    }
}
`,
  },
  problems: pickProblems('P2367', 'P3397'),
}
