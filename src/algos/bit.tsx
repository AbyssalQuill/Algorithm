import { ArrayView, type Cell } from '../components/ArrayView'
import { Stats } from '../components/Stats'
import { pickProblems } from '../data/problems'
import { Recorder } from '../engine/recorder'
import type { AlgoDef, Frame, ParseResult } from '../engine/types'
import { randInt, splitBar, toNums } from './shared'

export type BitOp = { kind: 'u'; i: number; k: number } | { kind: 'q'; l: number; r: number }

export interface BitInput {
  arr: number[]
  ops: BitOp[]
}

export interface BitState {
  a: number[]
  /** 树状数组 c[1..n]，c[i] 保存 a[i-lowbit(i)+1 .. i] 的和 */
  c: number[]
  /** 当前正在访问的位置 c[cur]；0 表示没有 */
  cur: number
  visited: number[]
  op: BitOp | null
  opNo: number
  /** 当前累加的结果 */
  acc: number
  /** 当前在算哪一个前缀和：'r' 是 sum(r)，'l' 是 sum(l-1) */
  which: 'r' | 'l' | null
  results: number[]
  steps: number
}

const lowbit = (x: number) => x & -x

export function runBit({ arr, ops }: BitInput): Frame<BitState>[] {
  const rec = new Recorder<BitState>()
  const n = arr.length
  const a = [0, ...arr]
  const c = new Array(n + 1).fill(0)
  const addSilent = (i: number, k: number) => {
    for (; i <= n; i += lowbit(i)) c[i] += k
  }
  for (let i = 1; i <= n; i++) addSilent(i, a[i])
  let cur = 0
  let visited: number[] = []
  let op: BitOp | null = null
  let opNo = 0
  let acc = 0
  let which: BitState['which'] = null
  const results: number[] = []
  let steps = 0
  const snap = (): BitState => ({ a: a.slice(1), c: c.slice(1), cur, visited, op, opNo, acc, which, results, steps })

  rec.push('init', snap(), `树状数组 c 里，c[i] 保存的是 a 中“以 i 结尾、长度为 lowbit(i)”的一段的和。lowbit(i) 是 i 的二进制里最低位的 1 所代表的值，比如 lowbit(6)=2，所以 c[6]=a[5]+a[6]；lowbit(8)=8，所以 c[8] 是 a[1] 到 a[8] 的和。现在 c 已经按这个规则建好了。`)

  const sum = (i0: number, tag: 'r' | 'l') => {
    let s = 0
    which = tag
    visited = []
    acc = 0
    for (let i = i0; i > 0; i -= lowbit(i)) {
      s += c[i]
      acc = s
      cur = i
      steps++
      visited = [...visited, i]
      rec.push('qStep', snap(), `c[${i}] 管 [${i - lowbit(i) + 1}, ${i}]，累加进来：sum(${i0}) 目前是 ${s}。接着让 i 减去 lowbit(${i})=${lowbit(i)}，跳到 ${i - lowbit(i)}${i - lowbit(i) === 0 ? '（到 0 了，结束）' : ''}。`)
    }
    return s
  }

  ops.forEach((o, idx) => {
    op = o
    opNo = idx + 1
    cur = 0
    visited = []
    acc = 0
    which = null
    if (o.kind === 'u') {
      a[o.i] += o.k
      for (let i = o.i; i <= n; i += lowbit(i)) {
        c[i] += o.k
        cur = i
        steps++
        visited = [...visited, i]
        rec.push('uStep', snap(), `a[${o.i}] 加了 ${o.k}。c[${i}] 管 [${i - lowbit(i) + 1}, ${i}]，包含位置 ${o.i}，所以 c[${i}] 也要加 ${o.k}，变成 ${c[i]}。接着让 i 加上 lowbit(${i})=${lowbit(i)}，跳到 ${i + lowbit(i)}${i + lowbit(i) > n ? '（超过 n 了，结束）' : ''}。`)
      }
    } else {
      const sr = sum(o.r, 'r')
      const sl = sum(o.l - 1, 'l')
      cur = 0
      which = null
      const res = sr - sl
      results.push(res)
      rec.push('qAns', snap(), `第 ${opNo} 个操作：区间 [${o.l}, ${o.r}] 的和 = sum(${o.r}) - sum(${o.l - 1}) = ${sr} - ${sl} = ${res}。`)
    }
  })
  cur = 0
  op = null
  which = null
  visited = []
  rec.push('done', snap(), `全部操作完成，查询的结果依次是：${results.join('、')}。每次更新和查询都只访问了很少几个 c[i]。`)
  return rec.frames
}

function BitView({ frame }: { frame: Frame<BitState> }) {
  const s = frame.state
  const n = s.a.length
  const lo = s.cur > 0 ? s.cur - lowbit(s.cur) + 1 : 0
  const seen = new Set(s.visited)
  const aCells: Cell[] = s.a.map((v, k) => ({ id: k + 1, v, tone: s.cur > 0 && k + 1 >= lo && k + 1 <= s.cur ? 'compare' : 'idle' }))
  const cCells: Cell[] = s.c.slice(1).length === 0 ? [] : s.c.slice(1).map((v, k) => ({ id: k + 1, v, tone: k + 1 === s.cur ? 'compare' : seen.has(k + 1) ? 'done' : 'idle' }))
  return (
    <div className="viz">
      {s.op && (
        <div className="target-row">
          <span className="target-chip">
            第 {s.opNo} 个操作：{s.op.kind === 'u' ? `a[${s.op.i}] 加 ${s.op.k}` : `查询 [${s.op.l}, ${s.op.r}] 的和`}
          </span>
          {s.op.kind === 'q' && s.which && (
            <span className="target-chip">
              正在算 {s.which === 'r' ? `sum(${s.op.r})` : `sum(${s.op.l - 1})`}：<b>{s.acc}</b>
            </span>
          )}
        </div>
      )}
      <div className="row-label">原数组 a（下标从 1 开始）{s.cur > 0 ? `　c[${s.cur}] 管的范围是 [${lo}, ${s.cur}]（黄色）` : ''}</div>
      <ArrayView cells={aCells} mode="boxes" base={1} minSlots={0} />
      <div className="row-label">树状数组 c（绿色 = 这次操作已经访问过）</div>
      <ArrayView cells={cCells} mode="boxes" base={1} minSlots={0} />
      <Stats
        items={[
          ['数组长度', n],
          ['访问的 c[i] 个数', s.steps],
          ['查询结果', s.results.length ? s.results.join('、') : '—'],
        ]}
      />
    </div>
  )
}

function parse(text: string): ParseResult<BitInput> {
  const parts = splitBar(text)
  if (parts.length !== 2) return { ok: false, error: '格式是「数组 | 操作 ; 操作」，例如：3 1 4 1 5 9 2 6 | q 2 6 ; u 3 5 ; q 2 6' }
  const arr = toNums(parts[0])
  if (arr.length < 3 || arr.length > 8) return { ok: false, error: '数组里请放 3～8 个整数。' }
  if (arr.some((x) => !Number.isInteger(x) || x < 0 || x > 99)) return { ok: false, error: '数组里的数是 0～99 的整数。' }
  const groups = parts[1].split(/[;；]/).map((g) => g.trim()).filter(Boolean)
  if (groups.length < 1 || groups.length > 3) return { ok: false, error: '请写 1～3 个操作，用分号隔开。' }
  const ops: BitOp[] = []
  for (const g of groups) {
    const m = /^([qQ])\s+(\d+)\s+(\d+)$/.exec(g) ?? /^([uU])\s+(\d+)\s+(-?\d+)$/.exec(g)
    if (!m) return { ok: false, error: `“${g}”不对：查询写成 q l r，加法写成 u 位置 增加的值。` }
    const x = Number(m[2])
    const y = Number(m[3])
    if (m[1].toLowerCase() === 'q') {
      if (x < 1 || y > arr.length || x > y) return { ok: false, error: `查询要满足 1 ≤ l ≤ r ≤ ${arr.length}。` }
      ops.push({ kind: 'q', l: x, r: y })
    } else {
      if (x < 1 || x > arr.length) return { ok: false, error: `位置要在 1～${arr.length} 之间。` }
      if (Math.abs(y) > 99) return { ok: false, error: '增加的值请取 -99～99。' }
      ops.push({ kind: 'u', i: x, k: y })
    }
  }
  if (!ops.some((o) => o.kind === 'q')) return { ok: false, error: '至少要有一个查询操作（q l r）。' }
  return { ok: true, value: { arr, ops } }
}

export const bit: AlgoDef<BitInput, BitState> = {
  id: 'bit',
  title: '树状数组',
  tagline: '用 lowbit 把前缀和“切块”存放，单点修改和前缀查询都只需要跳 log n 次',
  kind: '数据结构',
  intro: [
    '要同时支持“修改某个数”和“求前缀和”，前缀和数组改一个数要重算后面所有的和，太慢；原数组求和又要逐个相加，也慢。树状数组的办法是把前缀和“切成几块”存放：c[i] 只保存以 i 结尾、长度为 lowbit(i) 的那一小段的和。lowbit(i) = i & -i，是 i 的二进制里最低位的 1 所表示的数。',
    '求前缀和 sum(i) 时，从 i 开始，累加 c[i]，再让 i 减去 lowbit(i) 跳到下一块，直到 i 变成 0，这些块恰好拼成 [1, i]。修改 a[i] 时，要把所有“包含位置 i”的块都改一遍：从 i 开始让 c[i] 加上增量，再让 i 加上 lowbit(i) 跳到上一层，直到超过 n。两个循环最多执行 log n 次。区间 [l, r] 的和就是 sum(r) - sum(l-1)。',
  ],
  points: [
    '数组下标必须从 1 开始：lowbit(0) 是 0，会让循环停不下来。',
    '求和是“减 lowbit”（向左跳），修改是“加 lowbit”（向右跳），两个方向正好相反。',
    '树状数组的代码很短，常数又小，只有几行，是比赛里使用最广的数据结构之一。',
    '它只擅长这种“可以相减”的统计（求和、异或等）；求区间最大值、最小值就要用线段树或者 ST 表。',
  ],
  pitfalls: [
    '修改的循环条件写成 i<n，会漏掉 c[n]；应该是 i<=n。',
    '建立树状数组时，最直接的办法是对每个位置调用一次 add，总共 O(n log n)，对大多数题目已经足够。',
    '初始值不为 0 时，要把初始数组也加进去，不能只处理后续的修改。',
  ],
  complexity: { time: 'O(log n)', space: 'O(n)', note: '单点修改与前缀和查询都是 O(log n)；建树是 O(n log n)。' },
  inputHint: '格式：数组 | 操作 ; 操作。q l r 查询区间和，u 位置 增量 修改，例如 3 1 4 1 5 9 2 6 | q 2 6 ; u 3 5 ; q 2 6。',
  presets: [
    { label: '先查后改再查', text: '3 1 4 1 5 9 2 6 | q 2 6 ; u 3 5 ; q 2 6' },
    { label: '修改靠前的位置', text: '2 7 1 8 2 8 1 8 | u 1 10 ; q 1 8' },
    { label: '长度不是 2 的幂', text: '5 2 8 6 3 | q 1 5 ; u 2 -2 ; q 2 4' },
  ],
  defaultInput: { arr: [3, 1, 4, 1, 5, 9, 2, 6], ops: [{ kind: 'q', l: 2, r: 6 }, { kind: 'u', i: 3, k: 5 }, { kind: 'q', l: 2, r: 6 }] },
  parse,
  format: (v) => `${v.arr.join(' ')} | ${v.ops.map((o) => (o.kind === 'q' ? `q ${o.l} ${o.r}` : `u ${o.i} ${o.k}`)).join(' ; ')}`,
  random: () => {
    const n = randInt(5, 8)
    const arr = Array.from({ length: n }, () => randInt(0, 20))
    const q = (): BitOp => {
      const x = randInt(1, n)
      const y = randInt(1, n)
      return { kind: 'q', l: Math.min(x, y), r: Math.max(x, y) }
    }
    return { arr, ops: [q(), { kind: 'u', i: randInt(1, n), k: randInt(-9, 9) }, q()] }
  },
  run: runBit,
  View: BitView,
  sources: {
    c: String.raw`
#include <stdio.h>
int n,c[1005];
int lowbit(int x){
    return x&-x;
}
void add(int i,int k){
    for (;i<=n;i+=lowbit(i)) c[i]+=k;           //@uStep
}
int sum(int i){
    int s=0;
    for (;i>0;i-=lowbit(i)) s+=c[i];            //@qStep
    return s;
}
int main(){
    int m,x,y,z,a,res[1005],rc=0;
    scanf("%d",&n);
    for (int i=1;i<=n;i++){
        scanf("%d",&a);
        add(i,a);                               //@init
    }
    scanf("%d",&m);
    while (m--){
        scanf("%d %d %d",&z,&x,&y);
        if (z==1) add(x,y);
        else res[rc++]=sum(y)-sum(x-1);         //@qAns
    }
    for (int i=0;i<rc;i++) printf("%d ",res[i]);
    printf("\n");                               //@done
    return 0;
}
`,
    cpp: String.raw`
#include <bits/stdc++.h>
using namespace std;
int n,c[1005];
int lowbit(int x){
    return x&-x;
}
void add(int i,int k){
    for (;i<=n;i+=lowbit(i)) c[i]+=k;           //@uStep
}
int sum(int i){
    int s=0;
    for (;i>0;i-=lowbit(i)) s+=c[i];            //@qStep
    return s;
}
int main(){
    int m,x,y,z,a;
    vector<int> res;
    cin>>n;
    for (int i=1;i<=n;i++){
        cin>>a;
        add(i,a);                               //@init
    }
    cin>>m;
    while (m--){
        cin>>z>>x>>y;
        if (z==1) add(x,y);
        else res.push_back(sum(y)-sum(x-1));    //@qAns
    }
    for (int v:res) cout<<v<<" ";
    cout<<endl;                                 //@done
    return 0;
}
`,
    python: String.raw`
def lowbit(x):
    return x & -x


def add(i, k):
    while i <= n:
        c[i] += k                               #@uStep
        i += lowbit(i)


def prefix(i):
    s = 0
    while i > 0:
        s += c[i]                               #@qStep
        i -= lowbit(i)
    return s


n = int(input())
c = [0] * (n + 1)
for i, a in enumerate(map(int, input().split()), 1):
    add(i, a)                                   #@init
res = []
for _ in range(int(input())):
    z, x, y = map(int, input().split())
    if z == 1:
        add(x, y)
    else:
        res.append(prefix(y) - prefix(x - 1))   #@qAns
print(*res)                                     #@done
`,
    java: String.raw`
import java.util.*;

public class Main {
    static int n;
    static int[] c = new int[1005];

    static int lowbit(int x) {
        return x & -x;
    }

    static void add(int i, int k) {
        for (; i <= n; i += lowbit(i)) c[i] += k;   //@uStep
    }

    static int sum(int i) {
        int s = 0;
        for (; i > 0; i -= lowbit(i)) s += c[i];    //@qStep
        return s;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        n = sc.nextInt();
        for (int i = 1; i <= n; i++) {
            add(i, sc.nextInt());                   //@init
        }
        int m = sc.nextInt();
        StringBuilder sb = new StringBuilder();
        while (m-- > 0) {
            int z = sc.nextInt(), x = sc.nextInt(), y = sc.nextInt();
            if (z == 1) add(x, y);
            else sb.append(sum(y) - sum(x - 1)).append(' ');    //@qAns
        }
        System.out.println(sb);                     //@done
    }
}
`,
  },
  problems: pickProblems('P3374', 'P3368'),
}
