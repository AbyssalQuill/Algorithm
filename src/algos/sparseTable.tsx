import { GridView, type GridCell } from '../components/GridView'
import { Stats } from '../components/Stats'
import { pickProblems } from '../data/problems'
import { Recorder } from '../engine/recorder'
import type { AlgoDef, Frame, ParseResult } from '../engine/types'
import { randInt, readInput } from './shared'

export interface StInput {
  arr: number[]
  qs: [number, number][]
}

type Pos = [number, number]

export interface StState {
  arr: number[]
  /** st[k][i]：从 i 开始、长度 2^k 的区间的最小值（i 从 1 开始，下标 0 不用） */
  st: (number | null)[][]
  cur: Pos | null
  src: Pos[]
  /** 当前查询 */
  q: [number, number] | null
  results: number[]
}

export function runSt({ arr, qs }: StInput): Frame<StState>[] {
  const rec = new Recorder<StState>()
  const n = arr.length
  const K = Math.floor(Math.log2(n)) + 1
  const st: (number | null)[][] = Array.from({ length: K }, (_, k) => Array.from({ length: n + 1 }, (_, i) => (k === 0 && i >= 1 ? arr[i - 1] : null)))
  let cur: Pos | null = null
  let src: Pos[] = []
  let q: [number, number] | null = null
  const results: number[] = []
  const snap = (): StState => ({ arr, st, cur, src, q, results })

  rec.push('init', snap(), `ST 表用来快速回答“区间最小值”：st[k][i] 保存从 i 开始、长度为 2^k 的区间里的最小值。第 0 行就是原数组（每个区间长度为 1）。`)
  for (let k = 1; k < K; k++) {
    for (let i = 1; i + (1 << k) - 1 <= n; i++) {
      const a = st[k - 1][i] as number
      const b = st[k - 1][i + (1 << (k - 1))] as number
      st[k][i] = Math.min(a, b)
      cur = [k, i]
      src = [[k - 1, i], [k - 1, i + (1 << (k - 1))]]
      rec.push('fill', snap(), `st[${k}][${i}] 管 [${i}, ${i + (1 << k) - 1}]，长度 ${1 << k}。把它平分成两半：前一半 st[${k - 1}][${i}] = ${a}，后一半 st[${k - 1}][${i + (1 << (k - 1))}] = ${b}，取较小的：${st[k][i]}。`)
    }
  }
  for (const [l, r] of qs) {
    q = [l, r]
    cur = null
    src = []
    const len = r - l + 1
    const k = Math.floor(Math.log2(len))
    rec.push('qLevel', snap(), `查询 [${l}, ${r}] 的最小值，长度是 ${len}。找到不超过它的最大的 2 的幂：2^${k} = ${1 << k}。用两个长度为 ${1 << k} 的区间就能盖住 [${l}, ${r}]，它们允许重叠。`)
    const a = st[k][l] as number
    const b = st[k][r - (1 << k) + 1] as number
    src = [[k, l], [k, r - (1 << k) + 1]]
    results.push(Math.min(a, b))
    rec.push('qAns', snap(), `一个区间是从 ${l} 开始的 st[${k}][${l}] = ${a}，另一个是以 ${r} 结束的 st[${k}][${r - (1 << k) + 1}] = ${b}。重叠的部分被算了两次，对“最小值”来说没有影响，所以答案是 min(${a}, ${b}) = ${Math.min(a, b)}。一次比较就够了，不需要逐个扫描。`)
  }
  q = null
  src = []
  rec.push('done', snap(), `全部查询完成，结果依次是：${results.join('、')}。`)
  return rec.frames
}

function StView({ frame }: { frame: Frame<StState> }) {
  const s = frame.state
  const n = s.arr.length
  const key = (p: Pos) => `${p[0]},${p[1]}`
  const src = new Set(s.src.map(key))
  const rows: GridCell[][] = [
    [{ head: true }, ...Array.from({ length: n }, (_, i): GridCell => ({ head: true, text: i + 1 }))],
    ...s.st.map((row, k): GridCell[] => [
      { head: true, text: `k=${k}` },
      ...Array.from({ length: n }, (_, c): GridCell => {
        const i = c + 1
        const val = row[i]
        let tone: GridCell['tone'] = val === null ? 'dim' : 'idle'
        if (src.has(`${k},${i}`)) tone = s.q ? 'found' : 'done'
        if (s.cur && s.cur[0] === k && s.cur[1] === i) tone = 'compare'
        return { text: val === null ? '' : val, tone }
      }),
    ]),
  ]
  return (
    <div className="viz">
      {s.q && (
        <div className="target-row">
          <span className="target-chip">
            查询区间 [{s.q[0]}, {s.q[1]}] 的最小值
          </span>
        </div>
      )}
      <GridView rows={rows} maxCell={50} />
      <div className="legend">
        <span><i className="sw tone-compare" />正在算</span>
        <span><i className="sw tone-done" />它的两个来源</span>
        <span><i className="sw tone-found" />查询用到的两块</span>
      </div>
      <Stats items={[['数组长度', n], ['层数', s.st.length], ['查询结果', s.results.length ? s.results.join('、') : '—']]} />
    </div>
  )
}

function parse(text: string): ParseResult<StInput> {
  return readInput(text, (r) => {
    const n = r.int('n', 4, 8)
    const arr = r.ints(n, '数', 0, 99)
    const m = r.int('m', 1, 3)
    const qs: [number, number][] = []
    for (let t = 1; t <= m; t++) {
      const l = r.int(`第 ${t} 次询问的 l`, 1, n)
      const rr = r.int(`第 ${t} 次询问的 r`, l, n)
      qs.push([l, rr])
    }
    r.end()
    return { arr, qs }
  })
}

export const sparseTable: AlgoDef<StInput, StState> = {
  id: 'sparse-table',
  title: 'ST 表',
  tagline: '花 O(n log n) 的时间预处理，之后每次区间最值查询只需要比较两个数',
  kind: '数据结构',
  slug: 'range-min',
  name: '区间最小值',
  type: '静态区间查询',
  statement: {
    desc: [
      '给定一个长度为 n 的数列，有 m 次询问，每次询问第 l 到第 r 个数里的最小值。数列在询问之间不会被修改。',
    ],
    input: [
      '第一行一个整数 n（4 ≤ n ≤ 8），第二行 n 个整数，每个在 0～99 之间。',
      '第三行一个整数 m（1 ≤ m ≤ 3），其后 m 行每行两个整数 l、r（1 ≤ l ≤ r ≤ n）。',
    ],
    output: [
      '一行 m 个整数，依次是每次询问的最小值，用空格隔开。',
    ],
  },
  intro: [
    '数组不会修改，却要回答很多次“从 l 到 r 的最小值是多少”。每次扫描要 O(n)，查询一多就太慢。ST 表（稀疏表）的办法是提前把所有“长度为 2 的幂”的区间的最小值都算出来：st[k][i] 表示从 i 开始、长度为 2ᵏ 的区间的最小值。算它很简单：把这个区间平分成两半，各自的最小值前面已经算好了，取较小的就行。',
    '查询时，设区间长度为 len，取 k = ⌊log₂ len⌋，那么两个长度为 2ᵏ 的区间——一个从 l 开始，一个以 r 结束——正好可以盖住整个 [l, r]，只是中间可能重叠。最小值这类运算允许重叠（重复比较不影响结果），所以答案就是这两个预处理好的值里较小的那个，一次比较搞定。',
  ],
  points: [
    '建表：第 0 层是原数组；第 k 层的每个格子由第 k-1 层的两个格子合并得到，共 log n 层。',
    '查询的两个区间可以重叠，这要求运算满足“重复计算不影响结果”，最大值、最小值、gcd 都可以，求和就不行。',
    '需要预先算好 lg 数组（lg[i] 等于 ⌊log₂ i⌋），避免每次查询都调用对数函数。',
    'ST 表只能处理不修改数组的情形。数组会被修改时，要改用线段树或者树状数组。',
  ],
  pitfalls: [
    '第二个区间的起点是 r-2ᵏ+1，写成 r-2ᵏ 会漏掉区间的最右端。',
    '空间是 O(n log n)，数组很大（比如一百万）时要留意内存。',
    '用 log2 函数求 k 在浮点数上可能出现误差，更稳妥的是提前用整数递推算好 lg 数组。',
  ],
  complexity: { time: 'O(n log n) 预处理，O(1) 查询', space: 'O(n log n)', note: '预处理一次 O(n log n)，之后每次查询只需要比较两个数，是常数时间。' },
  presets: [
    { label: '两次查询', text: '8\n3 1 4 1 5 9 2 6\n2\n2 7\n1 4' },
    { label: '长度刚好是 2 的幂', text: '4\n5 2 8 6\n2\n1 4\n2 3' },
    { label: '整个数组', text: '8\n9 7 5 3 1 2 4 6\n1\n1 8' },
  ],
  defaultInput: { arr: [3, 1, 4, 1, 5, 9, 2, 6], qs: [[2, 7], [1, 4]] },
  parse,
  format: (v) => `${v.arr.length}\n${v.arr.join(' ')}\n${v.qs.length}\n${v.qs.map((q) => q.join(' ')).join('\n')}`,
  answer: (v) => v.qs.map(([l, r]) => Math.min(...v.arr.slice(l - 1, r))).join(' '),
  random: () => {
    const n = randInt(5, 8)
    const arr = Array.from({ length: n }, () => randInt(0, 30))
    const q = (): [number, number] => {
      const a = randInt(1, n)
      const b = randInt(1, n)
      return [Math.min(a, b), Math.max(a, b)]
    }
    return { arr, qs: [q(), q()] }
  },
  run: runSt,
  View: StView,
  sources: {
    c: String.raw`
#include <stdio.h>
int n,a[105],st[8][105],lg[105];
int min(int x,int y){
    return x<y?x:y;
}
int main(){
    int m,l,r;
    scanf("%d",&n);
    for (int i=1;i<=n;i++){
        scanf("%d",&a[i]);
        st[0][i]=a[i];                        // st[0][i] 就是只有一个数的区间 [i, i] 的最小值          //@init
    }
    lg[1]=0;
    for (int i=2;i<=n;i++) lg[i]=lg[i/2]+1;
    for (int k=1;(1<<k)<=n;k++)
        for (int i=1;i+(1<<k)-1<=n;i++)
            st[k][i]=min(st[k-1][i],st[k-1][i+(1<<(k-1))]);  // 长度翻倍：两个长度为 2^(k-1) 的区间，取较小值  //@fill
    scanf("%d",&m);
    while (m--){
        scanf("%d %d",&l,&r);
        int k=lg[r-l+1];                      // 找到不超过区间长度的最大的 2 的幂                       //@qLevel
        printf("%d ",min(st[k][l],st[k][r-(1<<k)+1]));  // 两个可能重叠的区间正好盖住查询区间，取较小值         //@qAns
    }
    printf("\n");                             // 输出所有查询的结果                                //@done
    return 0;
}
`,
    cpp: String.raw`
#include <bits/stdc++.h>
using namespace std;
int n,a[105],st[8][105],lg[105];
int main(){
    int m,l,r;
    cin>>n;
    for (int i=1;i<=n;i++){
        cin>>a[i];
        st[0][i]=a[i];                        // st[0][i] 就是只有一个数的区间 [i, i] 的最小值          //@init
    }
    lg[1]=0;
    for (int i=2;i<=n;i++) lg[i]=lg[i/2]+1;
    for (int k=1;(1<<k)<=n;k++)
        for (int i=1;i+(1<<k)-1<=n;i++)
            st[k][i]=min(st[k-1][i],st[k-1][i+(1<<(k-1))]);  // 长度翻倍：两个长度为 2^(k-1) 的区间，取较小值  //@fill
    cin>>m;
    while (m--){
        cin>>l>>r;
        int k=lg[r-l+1];                      // 找到不超过区间长度的最大的 2 的幂                       //@qLevel
        cout<<min(st[k][l],st[k][r-(1<<k)+1])<<" ";  // 两个可能重叠的区间正好盖住查询区间，取较小值            //@qAns
    }
    cout<<endl;                               // 输出所有查询的结果                                //@done
    return 0;
}
`,
    python: String.raw`
n=int(input())
a=[0]+list(map(int,input().split()))
st=[a[:]]                                     # st[0][i] 就是只有一个数的区间 [i, i] 的最小值  #@init
lg=[0]*(n+2)
for i in range(2,n+1):
    lg[i]=lg[i//2]+1
k=1
while (1<<k)<=n:
    prev=st[k-1]
    row=[0]*(n+1)
    for i in range(1,n-(1<<k)+2):
        row[i]=min(prev[i],prev[i+(1<<(k-1))])  # 长度翻倍：两个长度为 2^(k-1) 的区间，取较小值    #@fill
    st.append(row)
    k+=1
res=[]
for _ in range(int(input())):
    l,r=map(int,input().split())
    k=lg[r-l+1]                               # 找到不超过区间长度的最大的 2 的幂               #@qLevel
    res.append(min(st[k][l],st[k][r-(1<<k)+1]))  # 两个可能重叠的区间正好盖住查询区间，取较小值        #@qAns
print(*res)                                   # 输出所有查询的结果                        #@done
`,
    java: String.raw`
import java.util.*;

public class Main{
    public static void main(String[] args){
        Scanner sc=new Scanner(System.in);
        int n=sc.nextInt();
        int[][] st=new int[8][n+2];
        int[] lg=new int[n+2];
        for (int i=1;i<=n;i++){
            st[0][i]=sc.nextInt();            // st[0][i] 就是只有一个数的区间 [i, i] 的最小值          //@init
        }
        for (int i=2;i<=n;i++) lg[i]=lg[i/2]+1;
        for (int k=1;(1<<k)<=n;k++)
            for (int i=1;i+(1<<k)-1<=n;i++)
                st[k][i]=Math.min(st[k-1][i],st[k-1][i+(1<<(k-1))]);  // 长度翻倍：两个长度为 2^(k-1) 的区间，取较小值  //@fill
        int m=sc.nextInt();
        StringBuilder sb=new StringBuilder();
        while (m-- > 0){
            int l=sc.nextInt(),r=sc.nextInt();
            int k=lg[r-l+1];                  // 找到不超过区间长度的最大的 2 的幂                       //@qLevel
            sb.append(Math.min(st[k][l],st[k][r-(1<<k)+1])).append(' ');  // 两个可能重叠的区间正好盖住查询区间，取较小值  //@qAns
        }
        System.out.println(sb);               // 输出所有查询的结果                                //@done
    }
}
`,
  },
  problems: pickProblems('P3865', 'P1816'),
}
