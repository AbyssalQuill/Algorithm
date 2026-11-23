import { ArrayView, type Cell } from '../components/ArrayView'
import { Stats } from '../components/Stats'
import { TreeView, type TNode } from '../components/TreeView'
import { pickProblems } from '../data/problems'
import { Recorder } from '../engine/recorder'
import type { AlgoDef, Frame, ParseResult } from '../engine/types'
import { randInt, splitBar, toNums } from './shared'

export type DsuOp = { kind: 'u'; a: number; b: number } | { kind: 'q'; a: number; b: number }

export interface DsuInput {
  n: number
  ops: DsuOp[]
}

export interface DsuState {
  n: number
  /** fa[1..n]，下标 0 不用 */
  fa: number[]
  sz: number[]
  cur: number | null
  /** 当前这次 find 经过的结点 */
  path: number[]
  /** 刚刚被挂到别的树下面的那个根 */
  linked: number | null
  op: DsuOp | null
  opNo: number
  answers: ('Y' | 'N')[]
  finds: number
}

export function runDsu({ n, ops }: DsuInput): Frame<DsuState>[] {
  const rec = new Recorder<DsuState>()
  const fa = Array.from({ length: n + 1 }, (_, i) => i)
  const sz = new Array(n + 1).fill(1)
  let cur: number | null = null
  let path: number[] = []
  let linked: number | null = null
  let op: DsuOp | null = null
  let opNo = 0
  const answers: ('Y' | 'N')[] = []
  let finds = 0
  const snap = (): DsuState => ({ n, fa, sz, cur, path, linked, op, opNo, answers, finds })

  rec.push('init', snap(), `一共 ${n} 个元素。开始时每个元素自己是一个集合，它的“父结点”就是自己（fa[i] = i），也就是每个元素都是自己那棵树的根。并查集用树来表示集合：同一棵树里的元素属于同一个集合，树根就是这个集合的代表。`)

  const find = (x: number): number => {
    cur = x
    if (fa[x] === x) {
      path = [...path, x]
      rec.push('root', snap(), `${x} 的父结点就是它自己，说明 ${x} 是根，也就是这个集合的代表。`)
      return x
    }
    path = [...path, x]
    rec.push('climb', snap(), `${x} 的父结点是 ${fa[x]}，不是根，继续向上找 ${fa[x]} 的根。`)
    const r = find(fa[x])
    if (fa[x] !== r) {
      fa[x] = r
      cur = x
      rec.push('compress', snap(), `回头时做“路径压缩”：既然已经知道根是 ${r}，就让 ${x} 直接挂到 ${r} 下面。以后再找 ${x}，一步就到根了。`)
    }
    return r
  }
  const begin = () => {
    path = []
    cur = null
    linked = null
    finds++
  }

  ops.forEach((o, idx) => {
    op = o
    opNo = idx + 1
    linked = null
    path = []
    cur = null
    if (o.kind === 'u') {
      rec.push('roots', snap(), `第 ${opNo} 个操作：合并 ${o.a} 和 ${o.b} 所在的集合。先分别找到两个集合的根。`)
      begin()
      const ra = find(o.a)
      begin()
      const rb = find(o.b)
      path = []
      cur = null
      if (ra === rb) {
        rec.push('same', snap(), `${o.a} 的根是 ${ra}，${o.b} 的根也是 ${rb}，两个元素本来就在同一个集合里，不需要合并。`)
        return
      }
      let big = ra
      let small = rb
      if (sz[big] < sz[small]) [big, small] = [small, big]
      fa[small] = big
      sz[big] += sz[small]
      linked = small
      cur = big
      rec.push('link', snap(), `两个根不同，要把两棵树接成一棵。为了让树尽量矮，把较小的那棵（根 ${small}，${sz[big] - sz[small]} 个元素）挂到较大的那棵（根 ${big}）下面，现在这个集合有 ${sz[big]} 个元素。`)
    } else {
      begin()
      const ra = find(o.a)
      begin()
      const rb = find(o.b)
      path = []
      cur = null
      const same = ra === rb
      answers.push(same ? 'Y' : 'N')
      rec.push('answer', snap(), `第 ${opNo} 个操作：询问 ${o.a} 和 ${o.b} 是不是在同一个集合。${o.a} 的根是 ${ra}，${o.b} 的根是 ${rb}，${same ? '根相同，在同一个集合里，回答 Y。' : '根不同，不在同一个集合里，回答 N。'}`)
    }
  })
  op = null
  return rec.frames
}

function DsuView({ frame }: { frame: Frame<DsuState> }) {
  const s = frame.state
  const onPath = new Set(s.path)
  const kidsOf = (i: number) => Array.from({ length: s.n }, (_, k) => k + 1).filter((j) => j !== i && s.fa[j] === i)
  const roots = Array.from({ length: s.n }, (_, k) => k + 1).filter((j) => s.fa[j] === j)
  const tn: TNode[] = [
    { id: 0, label: '', kids: roots },
    ...Array.from({ length: s.n }, (_, k): TNode => {
      const i = k + 1
      return {
        id: i,
        label: i,
        kids: kidsOf(i),
        ring: s.fa[i] === i,
        tone: i === s.linked ? 'found' : i === s.cur ? 'compare' : onPath.has(i) ? 'done' : 'idle',
        edge: onPath.has(i) || i === s.linked ? 'done' : 'idle',
      }
    }),
  ]
  const faCells: Cell[] = Array.from({ length: s.n }, (_, k): Cell => ({ id: k + 1, v: s.fa[k + 1], tone: k + 1 === s.cur ? 'compare' : s.fa[k + 1] === k + 1 ? 'done' : 'idle' }))
  const szCells: Cell[] = Array.from({ length: s.n }, (_, k): Cell => ({ id: k + 1, v: s.sz[k + 1], tone: s.fa[k + 1] === k + 1 ? 'done' : 'dim' }))
  return (
    <div className="viz">
      {s.op && (
        <div className="target-row">
          <span className="target-chip">
            第 {s.opNo} 个操作：{s.op.kind === 'u' ? `合并 ${s.op.a} 与 ${s.op.b}` : `询问 ${s.op.a} 与 ${s.op.b} 是否同组`}
          </span>
          {s.answers.length > 0 && s.op.kind === 'q' && frame.step === 'answer' && <span className={`verdict ${s.answers[s.answers.length - 1] === 'Y' ? 'ok' : 'bad'}`}>{s.answers[s.answers.length - 1] === 'Y' ? '在同一组' : '不在同一组'}</span>}
        </div>
      )}
      <TreeView nodes={tn} root={0} mode="tidy" hideRoot levels={3} maxSlots={s.n} />
      <div className="row-label">fa[i]：i 的父结点（双圈 = 根，值等于自己）</div>
      <ArrayView cells={faCells} mode="boxes" base={1} minSlots={0} />
      <div className="row-label">sz[i]：以 i 为根的集合有多大</div>
      <ArrayView cells={szCells} mode="boxes" base={1} minSlots={0} />
      <Stats
        items={[
          ['集合数', Array.from({ length: s.n }, (_, k) => k + 1).filter((j) => s.fa[j] === j).length],
          ['已回答', s.answers.length ? s.answers.join(' ') : '—'],
        ]}
      />
    </div>
  )
}

function parse(text: string): ParseResult<DsuInput> {
  const parts = splitBar(text)
  if (parts.length !== 2) return { ok: false, error: '格式是「元素个数 | 操作 ; 操作」，例如：6 | u 1 2 ; u 3 4 ; u 1 3 ; q 2 4' }
  const nn = toNums(parts[0])
  if (nn.length !== 1 || !Number.isInteger(nn[0]) || nn[0] < 3 || nn[0] > 8) return { ok: false, error: '元素个数请取 3～8。' }
  const n = nn[0]
  const groups = parts[1].split(/[;；]/).map((g) => g.trim()).filter(Boolean)
  if (groups.length < 1 || groups.length > 7) return { ok: false, error: '请写 1～7 个操作，用分号隔开。' }
  const ops: DsuOp[] = []
  for (const g of groups) {
    const m = /^([uUqQ])\s+(\d+)\s+(\d+)$/.exec(g)
    if (!m) return { ok: false, error: `“${g}”不对：合并写成 u a b，询问写成 q a b。` }
    const a = Number(m[2])
    const b = Number(m[3])
    if (a < 1 || b < 1 || a > n || b > n) return { ok: false, error: `元素编号要在 1～${n} 之间。` }
    ops.push({ kind: m[1].toLowerCase() as 'u' | 'q', a, b })
  }
  return { ok: true, value: { n, ops } }
}

export const dsu: AlgoDef<DsuInput, DsuState> = {
  id: 'dsu',
  title: '并查集',
  tagline: '用一片树表示若干个集合，支持“合并两个集合”和“判断两个元素是否同组”',
  kind: '数据结构',
  intro: [
    '并查集管理的是一批互不相交的集合，只支持两种操作：把两个元素所在的集合合并，以及查询两个元素是不是在同一个集合里。社交网络里的“朋友的朋友也是朋友”、图里的连通块、判断加入一条边之后会不会出现环，都是它的用武之地。',
    '实现的办法出奇地简单：用 fa[x] 记录 x 的“上一级”，每个集合就是一棵树，树根的 fa 指向自己，树根就是这个集合的代表。查找 x 的集合，就是顺着 fa 一路向上走到根；两个元素的根相同，就在同一个集合里；合并就是让一个根挂到另一个根下面。两个优化让它快到几乎是常数时间：查找时顺手做路径压缩，合并时让小树挂到大树下面。',
  ],
  points: [
    'find(x)：如果 fa[x]==x，x 就是根；否则递归地找 fa[x] 的根，并把 fa[x] 直接改成这个根（路径压缩）。',
    'merge(a,b)：分别找到两个根，相同就说明已经在一起；不同就把较小的树挂到较大的树下面（按大小合并），并更新大小。',
    '不做任何优化时，最坏情况树会退化成一条链，一次查找要 O(n)；加上两个优化后，每次操作的平均代价接近常数。',
    '初始化时 fa[i]=i，所有元素各自成组，数组下标通常从 1 开始。',
  ],
  pitfalls: [
    '合并时直接写 fa[a]=b，而不是先找到根再挂，会让不相关的树被错误地连起来，或者把同一棵树接成环。',
    '路径压缩只让沿途结点直接指向根，不会改变集合的划分，所以不会影响答案，只是让以后更快。',
    '并查集只能合并，不能把集合拆开。需要“删除”的场景要换别的办法。',
  ],
  complexity: { time: 'O(α(n))', space: 'O(n)', note: 'α 是反阿克曼函数，增长极慢，在实际数据规模里可以看作不超过 5，所以每次操作几乎是常数时间。' },
  inputHint: '格式：元素个数 | 操作 ; 操作。u a b 是合并，q a b 是询问，例如 6 | u 1 2 ; u 3 4 ; u 1 3 ; q 2 4。',
  presets: [
    { label: '先合并再询问', text: '6 | u 1 2 ; u 3 4 ; u 1 3 ; q 2 4 ; q 2 5' },
    { label: '串成一条链', text: '6 | u 1 2 ; u 2 3 ; u 3 4 ; u 4 5 ; q 1 5' },
    { label: '重复合并', text: '5 | u 1 2 ; u 2 1 ; u 3 4 ; q 1 4' },
  ],
  defaultInput: { n: 6, ops: [{ kind: 'u', a: 1, b: 2 }, { kind: 'u', a: 3, b: 4 }, { kind: 'u', a: 1, b: 3 }, { kind: 'q', a: 2, b: 4 }, { kind: 'q', a: 2, b: 5 }] },
  parse,
  format: (v) => `${v.n} | ${v.ops.map((o) => `${o.kind} ${o.a} ${o.b}`).join(' ; ')}`,
  random: () => {
    const n = randInt(5, 8)
    const ops: DsuOp[] = []
    const cnt = randInt(5, 7)
    for (let i = 0; i < cnt; i++) {
      const a = randInt(1, n)
      const b = randInt(1, n)
      ops.push({ kind: i >= cnt - 2 || Math.random() < 0.25 ? 'q' : 'u', a, b })
    }
    return { n, ops }
  },
  run: runDsu,
  View: DsuView,
  sources: {
    c: String.raw`
#include <stdio.h>
int fa[1005],sz[1005];
int find(int x){
    if (fa[x]==x) return x;                     //@root
    int r=find(fa[x]);                          //@climb
    fa[x]=r;                                    //@compress
    return r;
}
void merge(int a,int b){
    a=find(a);                                  //@roots
    b=find(b);
    if (a==b) return;                           //@same
    if (sz[a]<sz[b]){ int t=a; a=b; b=t; }
    fa[b]=a;                                    //@link
    sz[a]+=sz[b];                               //@link
}
int main(){
    int n,m,z,a,b;
    scanf("%d %d",&n,&m);
    for (int i=1;i<=n;i++){
        fa[i]=i;                                //@init
        sz[i]=1;
    }
    while (m--){
        scanf("%d %d %d",&z,&a,&b);
        if (z==1) merge(a,b);
        else puts(find(a)==find(b)?"Y":"N");    //@answer
    }
    return 0;
}
`,
    cpp: String.raw`
#include <bits/stdc++.h>
using namespace std;
int fa[1005],sz[1005];
int find(int x){
    if (fa[x]==x) return x;                     //@root
    int r=find(fa[x]);                          //@climb
    fa[x]=r;                                    //@compress
    return r;
}
void merge(int a,int b){
    a=find(a);                                  //@roots
    b=find(b);
    if (a==b) return;                           //@same
    if (sz[a]<sz[b]) swap(a,b);
    fa[b]=a;                                    //@link
    sz[a]+=sz[b];                               //@link
}
int main(){
    int n,m,z,a,b;
    cin>>n>>m;
    for (int i=1;i<=n;i++){
        fa[i]=i;                                //@init
        sz[i]=1;
    }
    while (m--){
        cin>>z>>a>>b;
        if (z==1) merge(a,b);
        else cout<<(find(a)==find(b)?"Y":"N")<<endl;    //@answer
    }
    return 0;
}
`,
    python: String.raw`
import sys
sys.setrecursionlimit(10000)


def find(x):
    if fa[x] == x:
        return x                                #@root
    r = find(fa[x])                             #@climb
    fa[x] = r                                   #@compress
    return r


def merge(a, b):
    a = find(a)                                 #@roots
    b = find(b)
    if a == b:
        return                                  #@same
    if sz[a] < sz[b]:
        a, b = b, a
    fa[b] = a                                   #@link
    sz[a] += sz[b]                              #@link


n, m = map(int, input().split())
fa = list(range(n + 1))                         #@init
sz = [1] * (n + 1)
for _ in range(m):
    z, a, b = map(int, input().split())
    if z == 1:
        merge(a, b)
    else:
        print("Y" if find(a) == find(b) else "N")   #@answer
`,
    java: String.raw`
import java.util.*;

public class Main {
    static int[] fa = new int[1005], sz = new int[1005];

    static int find(int x) {
        if (fa[x] == x) return x;                   //@root
        int r = find(fa[x]);                        //@climb
        fa[x] = r;                                  //@compress
        return r;
    }

    static void merge(int a, int b) {
        a = find(a);                                //@roots
        b = find(b);
        if (a == b) return;                         //@same
        if (sz[a] < sz[b]) { int t = a; a = b; b = t; }
        fa[b] = a;                                  //@link
        sz[a] += sz[b];                             //@link
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt(), m = sc.nextInt();
        for (int i = 1; i <= n; i++) {
            fa[i] = i;                              //@init
            sz[i] = 1;
        }
        while (m-- > 0) {
            int z = sc.nextInt(), a = sc.nextInt(), b = sc.nextInt();
            if (z == 1) merge(a, b);
            else System.out.println(find(a) == find(b) ? "Y" : "N");   //@answer
        }
    }
}
`,
  },
  problems: pickProblems('P3367', 'P1551'),
}
