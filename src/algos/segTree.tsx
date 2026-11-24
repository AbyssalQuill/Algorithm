import { ArrayView, type Cell } from '../components/ArrayView'
import { Stats } from '../components/Stats'
import { TreeView, type TNode } from '../components/TreeView'
import { pickProblems } from '../data/problems'
import { Recorder } from '../engine/recorder'
import type { AlgoDef, Frame, ParseResult } from '../engine/types'
import { fail, randInt, readInput } from './shared'

export type SegOp = { kind: 'q'; l: number; r: number } | { kind: 'u'; i: number; v: number }

export interface SegInput {
  arr: number[]
  ops: SegOp[]
}

interface SNode {
  id: number
  l: number
  r: number
  /** 区间和；还没算出来是 null */
  sum: number | null
}

type NodeMark = 'cur' | 'take' | 'out' | 'split' | 'path'

export interface SegState {
  arr: number[]
  nodes: SNode[]
  marks: Record<number, NodeMark>
  cur: number | null
  /** 这次查询累加的结果 */
  acc: number
  /** 正在执行的操作 */
  op: SegOp | null
  opNo: number
  results: number[]
  visits: number
}

export function runSeg({ arr, ops }: SegInput): Frame<SegState>[] {
  const rec = new Recorder<SegState>()
  const n = arr.length
  const a = [...arr]
  const nodes: SNode[] = []
  const get = (id: number) => nodes.find((x) => x.id === id)!
  let marks: Record<number, NodeMark> = {}
  let cur: number | null = null
  let acc = 0
  let op: SegOp | null = null
  let opNo = 0
  const results: number[] = []
  let visits = 0
  const snap = (): SegState => ({ arr: a, nodes, marks, cur, acc, op, opNo, results, visits })

  // 先把树的骨架（每个结点的区间）建出来，和值一起在 build 帧里逐个“亮起来”
  const shape = (o: number, l: number, r: number) => {
    nodes.push({ id: o, l, r, sum: null })
    if (l === r) return
    const m = (l + r) >> 1
    shape(2 * o, l, m)
    shape(2 * o + 1, m + 1, r)
  }
  shape(1, 1, n)

  rec.push('init', snap(), `线段树把数组的区间对半拆开：根结点管整个区间 [1, ${n}]，它的两个孩子各管一半，一直拆到每个叶子只管一个数。每个结点里保存它所管区间的和。`)
  const build = (o: number, l: number, r: number) => {
    if (l === r) {
      get(o).sum = a[l - 1]
      cur = o
      rec.push('build', snap(), `叶子 [${l}, ${l}] 只管一个数，它的和就是 a[${l}] = ${a[l - 1]}。`)
      return
    }
    const m = (l + r) >> 1
    build(2 * o, l, m)
    build(2 * o + 1, m + 1, r)
    get(o).sum = (get(2 * o).sum as number) + (get(2 * o + 1).sum as number)
    cur = o
    rec.push('build', snap(), `区间 [${l}, ${r}] 的和 = 左边 ${get(2 * o).sum} + 右边 ${get(2 * o + 1).sum} = ${get(o).sum}。孩子都算好了才能算父结点，所以是从下往上建。`)
  }
  build(1, 1, n)
  cur = null

  const query = (o: number, l: number, r: number, ql: number, qr: number): number => {
    cur = o
    visits++
    if (qr < l || r < ql) {
      marks = { ...marks, [o]: 'out' }
      rec.push('qOut', snap(), `[${l}, ${r}] 和要查询的 [${ql}, ${qr}] 完全没有交集，这一整棵子树都不用看，直接返回 0。`)
      return 0
    }
    if (ql <= l && r <= qr) {
      marks = { ...marks, [o]: 'take' }
      acc += get(o).sum as number
      rec.push('qIn', snap(), `[${l}, ${r}] 完全落在 [${ql}, ${qr}] 里面，不需要再往下拆，直接取这个结点保存的和 ${get(o).sum}。累计 ${acc}。`)
      return get(o).sum as number
    }
    marks = { ...marks, [o]: 'split' }
    rec.push('qSplit', snap(), `[${l}, ${r}] 与 [${ql}, ${qr}] 只有一部分重叠，需要拆成左右两半，分别去查，再把结果加起来。`)
    const m = (l + r) >> 1
    return query(2 * o, l, m, ql, qr) + query(2 * o + 1, m + 1, r, ql, qr)
  }
  const update = (o: number, l: number, r: number, i: number, v: number) => {
    cur = o
    visits++
    marks = { ...marks, [o]: 'path' }
    if (l === r) {
      get(o).sum = v
      a[i - 1] = v
      rec.push('uLeaf', snap(), `找到了管 [${i}, ${i}] 的叶子，把它改成 ${v}。`)
      return
    }
    const m = (l + r) >> 1
    rec.push('uDown', snap(), `[${l}, ${r}] 包含位置 ${i}，要往${i <= m ? '左' : '右'}半 [${i <= m ? l : m + 1}, ${i <= m ? m : r}] 走。`)
    if (i <= m) update(2 * o, l, m, i, v)
    else update(2 * o + 1, m + 1, r, i, v)
    get(o).sum = (get(2 * o).sum as number) + (get(2 * o + 1).sum as number)
    cur = o
    rec.push('uUp', snap(), `回到 [${l}, ${r}]，孩子变了，重新计算它的和：${get(2 * o).sum} + ${get(2 * o + 1).sum} = ${get(o).sum}。`)
  }

  ops.forEach((o, idx) => {
    op = o
    opNo = idx + 1
    marks = {}
    cur = null
    acc = 0
    visits = 0
    if (o.kind === 'q') {
      rec.push('qStart', snap(), `第 ${opNo} 个操作：查询区间 [${o.l}, ${o.r}] 的和。从根结点开始往下找。`)
      const res = query(1, 1, n, o.l, o.r)
      results.push(res)
      cur = null
      rec.push('qStart', snap(), `查询结束，[${o.l}, ${o.r}] 的和是 ${res}。只访问了 ${visits} 个结点，远少于逐个相加的 ${o.r - o.l + 1} 次。`)
    } else {
      rec.push('uStart', snap(), `第 ${opNo} 个操作：把 a[${o.i}] 改成 ${o.v}。先找到管这个位置的叶子，改完再沿原路回到根，更新沿途的和。`)
      update(1, 1, n, o.i, o.v)
      cur = null
      rec.push('uStart', snap(), `修改完成，只更新了从叶子到根的 ${visits} 个结点。`)
    }
  })
  op = null
  marks = {}
  cur = null
  rec.push('done', snap(), `全部操作完成，查询的结果依次是：${results.join('、')}。`)
  return rec.frames
}

function SegView({ frame }: { frame: Frame<SegState> }) {
  const s = frame.state
  const tn: TNode[] = s.nodes.map((nd) => {
    const mk = s.marks[nd.id]
    let tone: TNode['tone'] = nd.sum === null ? 'dim' : 'idle'
    if (mk === 'split') tone = 'compare'
    if (mk === 'take') tone = 'found'
    if (mk === 'out') tone = 'dim'
    if (mk === 'path') tone = 'swap'
    if (s.cur === nd.id) tone = mk === 'take' ? 'found' : mk === 'out' ? 'dim' : mk === 'path' ? 'swap' : 'compare'
    return {
      id: nd.id,
      label: nd.sum === null ? '' : nd.sum,
      sub: `[${nd.l},${nd.r}]`,
      kids: nd.l < nd.r ? [nd.id * 2, nd.id * 2 + 1] : [],
      tone,
      edge: mk ? 'done' : 'idle',
    }
  })
  const q = s.op?.kind === 'q' ? s.op : null
  const cells: Cell[] = s.arr.map((v, i) => ({ id: i, v, tone: q && i + 1 >= q.l && i + 1 <= q.r ? 'compare' : s.op?.kind === 'u' && s.op.i === i + 1 ? 'swap' : 'idle' }))
  return (
    <div className="viz">
      {s.op && (
        <div className="target-row">
          <span className="target-chip">
            第 {s.opNo} 个操作：{s.op.kind === 'q' ? `查询 [${s.op.l}, ${s.op.r}] 的和` : `把 a[${s.op.i}] 改成 ${s.op.v}`}
          </span>
          {s.op.kind === 'q' && <span className="target-chip">累计 <b>{s.acc}</b></span>}
        </div>
      )}
      <TreeView nodes={tn} root={1} mode="tidy" levels={4} maxSlots={8} />
      <div className="row-label">数组 a（下标从 1 开始）</div>
      <ArrayView cells={cells} mode="boxes" base={1} minSlots={0} />
      <div className="legend">
        <span><i className="sw tone-compare" />需要拆开</span>
        <span><i className="sw tone-found" />整段取用</span>
        <span><i className="sw tone-dim" />与查询无关</span>
        <span><i className="sw tone-swap" />修改的路径</span>
      </div>
      <Stats
        items={[
          ['已访问的结点', s.visits],
          ['已得到的查询结果', s.results.length ? s.results.join('、') : '—'],
        ]}
      />
    </div>
  )
}

function parse(text: string): ParseResult<SegInput> {
  return readInput(text, (r) => {
    const n = r.int('n', 3, 8)
    const arr = r.ints(n, '数', 0, 99)
    const m = r.int('m', 1, 3)
    const ops: SegOp[] = []
    for (let t = 1; t <= m; t++) {
      const z = r.int(`第 ${t} 个操作的类型 z`, 1, 2)
      if (z === 1) {
        const l = r.int(`第 ${t} 个操作的 l`, 1, n)
        const rr = r.int(`第 ${t} 个操作的 r`, l, n)
        ops.push({ kind: 'q', l, r: rr })
      } else {
        const i = r.int(`第 ${t} 个操作的位置`, 1, n)
        const v = r.int(`第 ${t} 个操作的新值`, 0, 99)
        ops.push({ kind: 'u', i, v })
      }
    }
    r.end()
    if (!ops.some((o) => o.kind === 'q')) fail('至少要有一个查询操作（z 为 1）。')
    return { arr, ops }
  })
}

export const segTree: AlgoDef<SegInput, SegState> = {
  id: 'seg-tree',
  title: '线段树',
  tagline: '把区间对半拆开，每个结点管一段，查询和修改都只需要走 log n 个结点',
  kind: '数据结构',
  slug: 'range-sum',
  name: '区间求和，单点修改',
  type: '区间查询',
  statement: {
    desc: [
      '给定一个长度为 n 的数列，依次执行 m 个操作：操作 1 l r 询问第 l 到第 r 个数的和；操作 2 i v 把第 i 个数改成 v。对每个询问输出结果。',
    ],
    input: [
      '第一行一个整数 n（3 ≤ n ≤ 8），第二行 n 个整数，每个在 0～99 之间。',
      '第三行一个整数 m（1 ≤ m ≤ 3），其后 m 行每行三个整数 z、x、y。z 为 1 时，x、y 是查询区间的两端（1 ≤ x ≤ y ≤ n）；z 为 2 时，x 是位置，y 是新的值（0～99）。至少要有一个查询。',
    ],
    output: [
      '对每个查询输出一个整数，所有结果写在同一行，用空格隔开。',
    ],
  },
  intro: [
    '如果数组会不断被修改，又要不断询问“某一段的和是多少”，前缀和就不够用了：每改一个数，后面所有的前缀和都得重算。线段树用一棵二叉树同时解决这两件事。根结点管理整个区间，把区间从中间劈成两半，分给左右孩子，一直劈到每个叶子只管一个数；每个结点里存着它所管区间的和。',
    '查询区间和的时候，从根往下走：结点的区间完全落在要查的范围里，就直接取它保存的和，不再往下；完全不相交就跳过；只重叠一部分，才拆成左右两半分别去问。这样需要访问的结点只有 O(log n) 个。修改一个数时，先走到对应的叶子改掉，再沿原路返回，把沿途结点的和重新算一遍，同样是 O(log n)。',
  ],
  points: [
    '用堆的编号方式存放：根是 1，结点 o 的左右孩子是 2o 和 2o+1。数组要开到 4n，才够所有情况使用。',
    '查询的三种情形：完全在范围外返回 0，完全在范围内返回结点的和，部分重叠就递归左右两边相加。',
    '修改时递归到叶子赋新值，回溯时用两个孩子的和更新父结点，这一步叫“上推”（pushup）。',
    '区间修改、区间最值等更复杂的功能，在这个结构上加上“懒标记”就能实现，是比赛里非常常见的数据结构。',
  ],
  pitfalls: [
    '数组只开 2n 往往不够：当 n 不是 2 的幂时，树的最后一层会不规则，保险的做法是开 4n。',
    '递归的区间划分要前后一致：左边是 [l, m]，右边是 [m+1, r]，写成别的会漏掉或者重复一个位置。',
    '修改之后忘记“上推”，沿途的结点还保存着旧的和，后面的查询就会得到错误的结果。',
  ],
  complexity: { time: 'O(log n)', space: 'O(n)', note: '建树 O(n)，每次查询和修改 O(log n)。' },
  presets: [
    { label: '先查后改再查', text: '8\n3 1 4 1 5 9 2 6\n3\n1 2 5\n2 3 10\n1 2 5' },
    { label: '查整个区间', text: '8\n3 1 4 1 5 9 2 6\n1\n1 1 8' },
    { label: '长度不是 2 的幂', text: '5\n5 2 8 6 3\n2\n1 2 4\n2 5 0' },
  ],
  defaultInput: { arr: [3, 1, 4, 1, 5, 9, 2, 6], ops: [{ kind: 'q', l: 2, r: 5 }, { kind: 'u', i: 3, v: 10 }, { kind: 'q', l: 2, r: 5 }] },
  parse,
  format: (v) => `${v.arr.length}\n${v.arr.join(' ')}\n${v.ops.length}\n${v.ops.map((o) => (o.kind === 'q' ? `1 ${o.l} ${o.r}` : `2 ${o.i} ${o.v}`)).join('\n')}`,
  answer: (v) => {
    const a = [...v.arr]
    const out: number[] = []
    for (const o of v.ops) {
      if (o.kind === 'u') a[o.i - 1] = o.v
      else out.push(a.slice(o.l - 1, o.r).reduce((x, y) => x + y, 0))
    }
    return out.join(' ')
  },
  random: () => {
    const n = randInt(5, 8)
    const arr = Array.from({ length: n }, () => randInt(0, 20))
    const q = (): SegOp => {
      const x = randInt(1, n)
      const y = randInt(1, n)
      return { kind: 'q', l: Math.min(x, y), r: Math.max(x, y) }
    }
    const ops: SegOp[] = [q(), { kind: 'u', i: randInt(1, n), v: randInt(0, 20) }, q()]
    return { arr, ops }
  },
  run: runSeg,
  View: SegView,
  sources: {
    c: String.raw`
#include <stdio.h>
int a[1005],t[4005];                          // a 是原数组，t 是线段树，每个结点管着一段  //@init
void build(int o,int l,int r){
    if (l==r){                                // 叶子直接放数，其他结点等于左右孩子之和     //@build
        t[o]=a[l];                                                       //@build
        return;                                                          //@build
    }                                                                    //@build
    int m=(l+r)/2;
    build(2*o,l,m);
    build(2*o+1,m+1,r);
    t[o]=t[2*o]+t[2*o+1];                     // 叶子直接放数，其他结点等于左右孩子之和     //@build
}
int query(int o,int l,int r,int ql,int qr){
    if (qr<l||r<ql) return 0;                 // 这一段和查询区间没有交集，贡献是 0      //@qOut
    if (ql<=l&&r<=qr) return t[o];            // 这一段完全落在查询区间里，直接用现成的和    //@qIn
    int m=(l+r)/2;                            // 只重合了一部分，分成左右两半分别查       //@qSplit
    return query(2*o,l,m,ql,qr)+query(2*o+1,m+1,r,ql,qr);
}
void update(int o,int l,int r,int i,int v){
    if (l==r){                                // 找到要修改的叶子，改成新值           //@uLeaf
        t[o]=v;                                                          //@uLeaf
        return;                                                          //@uLeaf
    }                                                                    //@uLeaf
    int m=(l+r)/2;                            // 先判断要改的位置在左半还是右半         //@uDown
    if (i<=m) update(2*o,l,m,i,v);
    else update(2*o+1,m+1,r,i,v);
    t[o]=t[2*o]+t[2*o+1];                     // 改完以后，沿路更新每个祖先的和         //@uUp
}
int main(){
    int n,m,res[1005],rc=0;
    scanf("%d",&n);
    for (int i=1;i<=n;i++) scanf("%d",&a[i]);
    build(1,1,n);
    scanf("%d",&m);
    while (m--){
        int z,x,y;
        scanf("%d %d %d",&z,&x,&y);
        if (z==1) res[rc++]=query(1,1,n,x,y);  // 操作 1：查询区间和             //@qStart
        else update(1,1,n,x,y);               // 操作 2：把一个位置改成新值          //@uStart
    }
    for (int i=0;i<rc;i++) printf("%d ",res[i]);
    printf("\n");                             // 输出所有查询的结果               //@done
    return 0;
}
`,
    cpp: String.raw`
#include <bits/stdc++.h>
using namespace std;
int a[1005],t[4005];                          // a 是原数组，t 是线段树，每个结点管着一段  //@init
void build(int o,int l,int r){
    if (l==r){                                // 叶子直接放数，其他结点等于左右孩子之和     //@build
        t[o]=a[l];                                                       //@build
        return;                                                          //@build
    }                                                                    //@build
    int m=(l+r)/2;
    build(2*o,l,m);
    build(2*o+1,m+1,r);
    t[o]=t[2*o]+t[2*o+1];                     // 叶子直接放数，其他结点等于左右孩子之和     //@build
}
int query(int o,int l,int r,int ql,int qr){
    if (qr<l||r<ql) return 0;                 // 这一段和查询区间没有交集，贡献是 0      //@qOut
    if (ql<=l&&r<=qr) return t[o];            // 这一段完全落在查询区间里，直接用现成的和    //@qIn
    int m=(l+r)/2;                            // 只重合了一部分，分成左右两半分别查       //@qSplit
    return query(2*o,l,m,ql,qr)+query(2*o+1,m+1,r,ql,qr);
}
void update(int o,int l,int r,int i,int v){
    if (l==r){                                // 找到要修改的叶子，改成新值           //@uLeaf
        t[o]=v;                                                          //@uLeaf
        return;                                                          //@uLeaf
    }                                                                    //@uLeaf
    int m=(l+r)/2;                            // 先判断要改的位置在左半还是右半         //@uDown
    if (i<=m) update(2*o,l,m,i,v);
    else update(2*o+1,m+1,r,i,v);
    t[o]=t[2*o]+t[2*o+1];                     // 改完以后，沿路更新每个祖先的和         //@uUp
}
int main(){
    int n,m;
    vector<int> res;
    cin>>n;
    for (int i=1;i<=n;i++) cin>>a[i];
    build(1,1,n);
    cin>>m;
    while (m--){
        int z,x,y;
        cin>>z>>x>>y;
        if (z==1) res.push_back(query(1,1,n,x,y));  // 操作 1：查询区间和        //@qStart
        else update(1,1,n,x,y);               // 操作 2：把一个位置改成新值          //@uStart
    }
    for (int x:res) cout<<x<<" ";
    cout<<endl;                               // 输出所有查询的结果               //@done
    return 0;
}
`,
    python: String.raw`
import sys
sys.setrecursionlimit(10000)
a=[0]
t=[0]*4005                            # a 是原数组，t 是线段树，每个结点管着一段  #@init

def build(o,l,r):
    if l==r:
        t[o]=a[l]                     # 叶子直接放数，其他结点等于左右孩子之和     #@build
        return
    m=(l+r)//2
    build(2*o,l,m)
    build(2*o+1,m+1,r)
    t[o]=t[2*o]+t[2*o+1]              # 叶子直接放数，其他结点等于左右孩子之和     #@build

def query(o,l,r,ql,qr):
    if qr<l or r<ql:
        return 0                      # 这一段和查询区间没有交集，贡献是 0      #@qOut
    if ql<=l and r<=qr:
        return t[o]                   # 这一段完全落在查询区间里，直接用现成的和    #@qIn
    m=(l+r)//2                        # 只重合了一部分，分成左右两半分别查       #@qSplit
    return query(2*o,l,m,ql,qr)+query(2*o+1,m+1,r,ql,qr)

def update(o,l,r,i,v):
    if l==r:
        t[o]=v                        # 找到要修改的叶子，改成新值           #@uLeaf
        return
    m=(l+r)//2                        # 先判断要改的位置在左半还是右半         #@uDown
    if i<=m:
        update(2*o,l,m,i,v)
    else:
        update(2*o+1,m+1,r,i,v)
    t[o]=t[2*o]+t[2*o+1]              # 改完以后，沿路更新每个祖先的和         #@uUp

n=int(input())
a+=list(map(int,input().split()))
build(1,1,n)
res=[]
for _ in range(int(input())):
    z,x,y=map(int,input().split())
    if z==1:
        res.append(query(1,1,n,x,y))  # 操作 1：查询区间和              #@qStart
    else:
        update(1,1,n,x,y)             # 操作 2：把一个位置改成新值          #@uStart
print(*res)                           # 输出所有查询的结果               #@done
`,
    java: String.raw`
import java.util.*;

public class Main{
    static int[] a=new int[1005],t=new int[4005];  // a 是原数组，t 是线段树，每个结点管着一段   //@init

    static void build(int o,int l,int r){
        if (l==r){                            // 叶子直接放数，其他结点等于左右孩子之和           //@build
            t[o]=a[l];                                                         //@build
            return;                                                            //@build
        }                                                                      //@build
        int m=(l+r)/2;
        build(2*o,l,m);
        build(2*o+1,m+1,r);
        t[o]=t[2*o]+t[2*o+1];                 // 叶子直接放数，其他结点等于左右孩子之和           //@build
    }

    static int query(int o,int l,int r,int ql,int qr){
        if (qr<l||r<ql) return 0;             // 这一段和查询区间没有交集，贡献是 0            //@qOut
        if (ql<=l&&r<=qr) return t[o];        // 这一段完全落在查询区间里，直接用现成的和          //@qIn
        int m=(l+r)/2;                        // 只重合了一部分，分成左右两半分别查             //@qSplit
        return query(2*o,l,m,ql,qr)+query(2*o+1,m+1,r,ql,qr);
    }

    static void update(int o,int l,int r,int i,int v){
        if (l==r){                            // 找到要修改的叶子，改成新值                 //@uLeaf
            t[o]=v;                                                            //@uLeaf
            return;                                                            //@uLeaf
        }                                                                      //@uLeaf
        int m=(l+r)/2;                        // 先判断要改的位置在左半还是右半               //@uDown
        if (i<=m) update(2*o,l,m,i,v);
        else update(2*o+1,m+1,r,i,v);
        t[o]=t[2*o]+t[2*o+1];                 // 改完以后，沿路更新每个祖先的和               //@uUp
    }

    public static void main(String[] args){
        Scanner sc=new Scanner(System.in);
        int n=sc.nextInt();
        for (int i=1;i<=n;i++) a[i]=sc.nextInt();
        build(1,1,n);
        int m=sc.nextInt();
        StringBuilder sb=new StringBuilder();
        while (m-- > 0){
            int z=sc.nextInt(),x=sc.nextInt(),y=sc.nextInt();
            if (z==1) sb.append(query(1,1,n,x,y)).append(' ');  // 操作 1：查询区间和  //@qStart
            else update(1,1,n,x,y);           // 操作 2：把一个位置改成新值                //@uStart
        }
        System.out.println(sb);               // 输出所有查询的结果                     //@done
    }
}
`,
  },
  problems: pickProblems('P3374', 'P3372'),
}
