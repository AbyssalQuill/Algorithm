import { GraphView, type GEdge, type GNode } from '../components/GraphView'
import { Stats } from '../components/Stats'
import { pickProblems } from '../data/problems'
import { Recorder } from '../engine/recorder'
import type { AlgoDef, Frame, ParseResult } from '../engine/types'
import { formatGraph, type ParsedEdge, randInt, readGraph, readInput } from './shared'

export interface TopoInput {
  n: number
  edges: ParsedEdge[]
}

export interface TopoState {
  n: number
  edges: ParsedEdge[]
  indeg: number[]
  /** 已经“拆掉”的边（它的起点已经排进了结果） */
  removed: boolean[]
  queue: number[]
  order: number[]
  cur: number | null
  look: number | null
  finished: boolean
}

export function runTopo({ n, edges }: TopoInput): Frame<TopoState>[] {
  const rec = new Recorder<TopoState>()
  const adj: { v: number; idx: number }[][] = Array.from({ length: n + 1 }, () => [])
  const indeg: number[] = new Array(n + 1).fill(0)
  edges.forEach((e, idx) => {
    adj[e.a].push({ v: e.b, idx })
    indeg[e.b]++
  })
  const removed = edges.map(() => false)
  const queue: number[] = []
  const order: number[] = []
  let cur: number | null = null
  let look: number | null = null
  let finished = false
  const snap = (): TopoState => ({ n, edges, indeg, removed, queue, order, cur, look, finished })

  for (let i = 1; i <= n; i++) if (indeg[i] === 0) queue.push(i)
  rec.push('init', snap(), `拓扑排序：把有向图的结点排成一列，使每条边都从前面的结点指向后面的结点（比如“先修课”要排在“后续课”前面）。先统计每个结点的入度（有几条边指向它）。入度为 0 的结点没有任何前提条件，可以最先安排：${queue.length ? queue.join('、') : '（一个也没有）'}，放进队列。`)
  while (queue.length > 0) {
    const u = queue.shift()!
    order.push(u)
    cur = u
    look = null
    rec.push('take', snap(), `取出队头 ${u}，把它排进结果。接下来要把 ${u} 发出的边都拆掉，它的后继结点少了一个“前提”。`)
    for (const { v, idx } of adj[u]) {
      removed[idx] = true
      indeg[v]--
      look = idx
      rec.push('dec', snap(), `拆掉边 ${u}→${v}，${v} 的入度减一，变成 ${indeg[v]}。`)
      if (indeg[v] === 0) {
        queue.push(v)
        rec.push('push', snap(), `${v} 的入度降到 0，所有前提都满足了，放进队列。`)
      }
    }
    look = null
  }
  cur = null
  look = null
  finished = true
  rec.push('done', snap(), order.length === n ? `队列空了，所有 ${n} 个结点都排好了，拓扑序是：${order.join(' → ')}。` : `队列空了，却只排好了 ${order.length} 个结点。剩下的结点入度始终降不到 0，它们互相等待，说明图里有环，没有拓扑序。`)
  return rec.frames
}

function TopoView({ frame }: { frame: Frame<TopoState> }) {
  const s = frame.state
  const inQ = new Set(s.queue)
  const placed = new Set(s.order)
  const nodes: GNode[] = Array.from({ length: s.n }, (_, i): GNode => {
    const id = i + 1
    return { id, tone: id === s.cur ? 'found' : placed.has(id) ? 'done' : inQ.has(id) ? 'compare' : 'idle', sub: placed.has(id) ? undefined : `入度 ${s.indeg[id]}` }
  })
  const edges: GEdge[] = s.edges.map((e, i) => ({ a: e.a, b: e.b, directed: true, tone: s.look === i ? 'compare' : s.removed[i] ? 'dim' : 'idle' }))
  return (
    <div className="viz">
      <GraphView nodes={nodes} edges={edges} height={280} />
      <div className="row-label">队列（入度为 0、等待处理的结点）</div>
      <div className="outline">{s.queue.length === 0 ? <span className="qrow-empty">空</span> : s.queue.map((v, i) => <span key={i} className="qchip">{v}</span>)}</div>
      <div className="row-label">已排好的顺序</div>
      <div className="outline">{s.order.length === 0 ? <span className="qrow-empty">还没有</span> : s.order.map((v, i) => <span key={i} className="qchip">{v}</span>)}</div>
      {s.finished && <div className="target-row">{s.order.length === s.n ? <span className="verdict ok">排序成功</span> : <span className="verdict bad">图里有环，无法排序</span>}</div>}
      <Stats items={[['已排好', `${s.order.length} / ${s.n}`]]} />
    </div>
  )
}

function parse(text: string): ParseResult<TopoInput> {
  return readInput(text, (r) => {
    const g = readGraph(r, { weighted: false, directed: true, maxN: 7, maxM: 11 })
    r.end()
    return g
  })
}

export const topoSort: AlgoDef<TopoInput, TopoState> = {
  id: 'topo-sort',
  title: '拓扑排序',
  tagline: '不断取出入度为 0 的结点，把依赖关系排成一条合理的先后顺序',
  kind: '算法',
  slug: 'courses',
  name: '课程安排',
  type: '依赖关系',
  statement: {
    desc: [
      '有 n 门课，其中一些课必须先学完另一些课才能学。给出 m 条先修关系 a b，表示必须先学 a，才能学 b。请排出一个合法的学习顺序。排序时按下面的规则：先把所有没有先修课的课按编号从小到大放进队列；每次从队首取出一门课来学，学完之后，如果某门课的先修课都已经学完，就把它放到队尾。如果这些关系互相矛盾，无法排出顺序，输出 CYCLE。',
    ],
    input: [
      '第一行两个整数 n 和 m（2 ≤ n ≤ 7，1 ≤ m ≤ 11），课程编号是 1～n。',
      '接下来 m 行，每行两个整数 a、b，表示 a 是 b 的先修课（没有重复的关系，也没有 a 等于 b 的情况）。',
    ],
    output: [
      '一行 n 个整数，是学习的顺序，用空格隔开；无法排出顺序时输出 CYCLE。',
    ],
  },
  intro: [
    '很多事情有先后依赖：要学完高数才能学物理，要先穿袜子再穿鞋。把这些依赖画成有向图，“A 必须在 B 前面”就是一条从 A 到 B 的边。拓扑排序就是给所有结点安排一个先后顺序，使得每条边的起点都排在终点的前面。',
    '做法很自然：没有任何前提的结点（入度为 0）可以最先做。把它取出来排进结果，它发出的所有边就都满足了，可以拆掉，它的后继结点的入度各减一。又出现入度为 0 的结点就继续取。这样一直做到队列空为止。如果最后有结点没有排上，说明它们互相等待，图里有环，不存在这样的顺序。',
  ],
  points: [
    '先统计所有结点的入度，把入度为 0 的结点放进队列。',
    '每取出一个结点，就遍历它的出边，让终点的入度减一，减到 0 就入队。',
    '最后检查排好的结点数是否等于 n：不等就说明有环。这是用拓扑排序判断有向图有没有环的方法。',
    '拓扑序一般不唯一，队列里同时有多个结点时，先取谁都可以。',
  ],
  pitfalls: [
    '忘记检查最后的结点数，对有环的图输出一个不完整的“顺序”。',
    '入度数组没有在建图时同步统计，或者统计成了出度。',
    '题目要求“字典序最小的拓扑序”时，要把普通队列换成优先队列。',
  ],
  complexity: { time: 'O(n + m)', space: 'O(n + m)', note: '每个结点入队一次，每条边处理一次。' },
  presets: [
    { label: '先修课', text: '5 5\n1 2\n1 3\n2 4\n3 4\n4 5' },
    { label: '有环', text: '4 4\n1 2\n2 3\n3 1\n3 4' },
    { label: '有多个起点', text: '5 5\n1 3\n2 3\n3 4\n2 5\n5 4' },
  ],
  defaultInput: { n: 5, edges: [{ a: 1, b: 2, w: 1 }, { a: 1, b: 3, w: 1 }, { a: 2, b: 4, w: 1 }, { a: 3, b: 4, w: 1 }, { a: 4, b: 5, w: 1 }] },
  parse,
  format: (v) => formatGraph(v.n, v.edges, false),
  answer: (v) => {
    const adj: number[][] = Array.from({ length: v.n + 1 }, () => [])
    const indeg = Array<number>(v.n + 1).fill(0)
    for (const e of v.edges) {
      adj[e.a].push(e.b)
      indeg[e.b]++
    }
    const q: number[] = []
    for (let i = 1; i <= v.n; i++) if (indeg[i] === 0) q.push(i)
    const order: number[] = []
    while (q.length) {
      const u = q.shift()!
      order.push(u)
      for (const w of adj[u]) if (--indeg[w] === 0) q.push(w)
    }
    return order.length < v.n ? 'CYCLE' : order.join(' ')
  },
  random: () => {
    const n = randInt(5, 7)
    const perm = Array.from({ length: n }, (_, i) => i + 1).sort(() => Math.random() - 0.5)
    const seen = new Set<string>()
    const edges: ParsedEdge[] = []
    const add = (a: number, b: number) => {
      if (a === b || seen.has(`${a}>${b}`)) return
      seen.add(`${a}>${b}`)
      edges.push({ a, b, w: 1 })
    }
    for (let k = 0; k < randInt(n, n + 3); k++) {
      const i = randInt(0, n - 2)
      const j = randInt(i + 1, n - 1)
      add(perm[i], perm[j])
    }
    if (Math.random() < 0.3 && edges.length > 0) add(edges[0].b, edges[0].a)
    return { n, edges }
  },
  run: runTopo,
  View: TopoView,
  sources: {
    c: String.raw`
#include <stdio.h>
int adj[105][105],deg[105],indeg[105],q[105],order[105];
int main(){
    int n,m,a,b,head=0,tail=0,cnt=0;
    scanf("%d %d",&n,&m);
    for (int i=0;i<m;i++){
        scanf("%d %d",&a,&b);
        adj[a][deg[a]++]=b;
        indeg[b]++;
    }
    for (int i=1;i<=n;i++)
        if (indeg[i]==0) q[tail++]=i;         // 入度为 0 的课，先放进队列               //@init
    while (head<tail){
        int u=q[head++];                      // 取出队头，它就是下一门要学的课              //@take
        order[cnt++]=u;                                                       //@take
        for (int i=0;i<deg[u];i++){
            int v=adj[u][i];
            indeg[v]--;                       // 它学完了，后继课程的先修课少了一门            //@dec
            if (indeg[v]==0) q[tail++]=v;     // 先修课都学完了，可以入队了                //@push
        }
    }
    if (cnt<n) puts("CYCLE");                 // 全部学完就输出顺序，否则说明有环             //@done
    else{
        for (int i=0;i<cnt;i++) printf("%d ",order[i]);  // 全部学完就输出顺序，否则说明有环  //@done
        printf("\n");
    }
    return 0;
}
`,
    cpp: String.raw`
#include <bits/stdc++.h>
using namespace std;
vector<int> adj[105];
int indeg[105];
int main(){
    int n,m,a,b;
    cin>>n>>m;
    for (int i=0;i<m;i++){
        cin>>a>>b;
        adj[a].push_back(b);
        indeg[b]++;
    }
    queue<int> q;
    vector<int> order;
    for (int i=1;i<=n;i++)
        if (indeg[i]==0) q.push(i);           // 入度为 0 的课，先放进队列         //@init
    while (!q.empty()){
        int u=q.front();                      // 取出队头，它就是下一门要学的课        //@take
        q.pop();                                                        //@take
        order.push_back(u);                                             //@take
        for (int v:adj[u]){
            indeg[v]--;                       // 它学完了，后继课程的先修课少了一门      //@dec
            if (indeg[v]==0) q.push(v);       // 先修课都学完了，可以入队了          //@push
        }
    }
    if ((int)order.size()<n) cout<<"CYCLE"<<endl;  // 全部学完就输出顺序，否则说明有环  //@done
    else{
        for (int x:order) cout<<x<<" ";       // 全部学完就输出顺序，否则说明有环       //@done
        cout<<endl;
    }
    return 0;
}
`,
    python: String.raw`
from collections import deque

n,m=map(int,input().split())
adj=[[] for _ in range(n+1)]
indeg=[0]*(n+1)
for _ in range(m):
    a,b=map(int,input().split())
    adj[a].append(b)
    indeg[b]+=1
q=deque(i for i in range(1,n+1) if indeg[i]==0)  # 入度为 0 的课，先放进队列  #@init
order=[]
while q:
    u=q.popleft()                             # 取出队头，它就是下一门要学的课    #@take
    order.append(u)                                                #@take
    for v in adj[u]:
        indeg[v]-=1                           # 它学完了，后继课程的先修课少了一门  #@dec
        if indeg[v]==0:
            q.append(v)                       # 先修课都学完了，可以入队了      #@push
if len(order)<n:
    print("CYCLE")                            # 全部学完就输出顺序，否则说明有环   #@done
else:
    print(*order)                             # 全部学完就输出顺序，否则说明有环   #@done
`,
    java: String.raw`
import java.util.*;

public class Main{
    public static void main(String[] args){
        Scanner sc=new Scanner(System.in);
        int n=sc.nextInt(),m=sc.nextInt();
        List<List<Integer>> adj=new ArrayList<>();
        for (int i=0;i<=n;i++) adj.add(new ArrayList<>());
        int[] indeg=new int[n+1];
        for (int i=0;i<m;i++){
            int a=sc.nextInt(),b=sc.nextInt();
            adj.get(a).add(b);
            indeg[b]++;
        }
        Queue<Integer> q=new ArrayDeque<>();
        List<Integer> order=new ArrayList<>();
        for (int i=1;i<=n;i++)
            if (indeg[i]==0) q.add(i);        // 入度为 0 的课，先放进队列                //@init
        while (!q.isEmpty()){
            int u=q.poll();                   // 取出队头，它就是下一门要学的课               //@take
            order.add(u);                                                      //@take
            for (int v:adj.get(u)){
                indeg[v]--;                   // 它学完了，后继课程的先修课少了一门             //@dec
                if (indeg[v]==0) q.add(v);    // 先修课都学完了，可以入队了                 //@push
            }
        }
        if (order.size()<n) System.out.println("CYCLE");  // 全部学完就输出顺序，否则说明有环  //@done
        else{
            StringBuilder sb=new StringBuilder();
            for (int x:order) sb.append(x).append(' ');  // 全部学完就输出顺序，否则说明有环   //@done
            System.out.println(sb);
        }
    }
}
`,
  },
  problems: pickProblems('P1113', 'P1038'),
}
