import { GraphView, type GEdge, type GNode } from '../components/GraphView'
import { QueueRow } from '../components/GridView'
import { Stats } from '../components/Stats'
import { pickProblems } from '../data/problems'
import { Recorder } from '../engine/recorder'
import type { Example, Frame, ParseResult } from '../engine/types'
import { formatGraph, type ParsedEdge, randInt, randomGraph, readGraph, readInput } from './shared'

export interface BfsGraphInput {
  n: number
  edges: ParsedEdge[]
  start: number
}

export interface BfsGraphState {
  n: number
  edges: { a: number; b: number }[]
  /** 起点到每个结点的最少边数；-1 表示还没有到过，下标从 1 开始 */
  dist: number[]
  queue: number[]
  /** 正在处理的结点（刚从队头取出） */
  cur: number | null
  /** 已经取出并处理完的结点 */
  finished: boolean[]
  /** 发现新结点时走过的边 */
  tree: [number, number][]
  look: [number, number] | null
  lookKind: 'push' | 'skip' | null
}

export function runBfsGraph({ n, edges, start }: BfsGraphInput): Frame<BfsGraphState>[] {
  const rec = new Recorder<BfsGraphState>()
  const adj: number[][] = Array.from({ length: n + 1 }, () => [])
  for (const e of edges) {
    adj[e.a].push(e.b)
    adj[e.b].push(e.a)
  }
  const dist = new Array<number>(n + 1).fill(-1)
  const finished = new Array<boolean>(n + 1).fill(false)
  const queue: number[] = []
  const tree: [number, number][] = []
  let cur: number | null = null
  let look: [number, number] | null = null
  let lookKind: BfsGraphState['lookKind'] = null
  const snap = (): BfsGraphState => ({ n, edges: edges.map((e) => ({ a: e.a, b: e.b })), dist, queue, cur, finished, tree, look, lookKind })

  dist[start] = 0
  queue.push(start)
  rec.push('init', snap(), `从车站 ${start} 出发：它离自己的距离是 0，先放进队列。BFS 一层一层地向外扩散，先处理距离近的结点，再处理距离远的。`)
  while (queue.length > 0) {
    const u = queue.shift()!
    cur = u
    look = null
    lookKind = null
    rec.push('pop', snap(), `取出队头 ${u}，它的距离是 ${dist[u]}。接下来看它的每个邻居。`)
    for (const v of adj[u]) {
      look = [u, v]
      if (dist[v] !== -1) {
        lookKind = 'skip'
        rec.push('skip', snap(), `邻居 ${v} 已经有距离 ${dist[v]} 了，它是更早被发现的，不会比现在的路线更远，跳过。`)
        continue
      }
      dist[v] = dist[u] + 1
      queue.push(v)
      tree.push([u, v])
      lookKind = 'push'
      rec.push('push', snap(), `邻居 ${v} 第一次被发现：距离是 ${dist[u]} + 1 = ${dist[v]}，放进队尾。`)
    }
    finished[u] = true
    look = null
    lookKind = null
    cur = null
  }
  rec.push('done', snap(), `队列空了。从 ${start} 出发到各个车站的最少站数依次是：${dist.slice(1).join('、')}${dist.slice(1).includes(-1) ? '（-1 表示到不了）' : ''}。`)
  return rec.frames
}

function BfsGraphView({ frame }: { frame: Frame<BfsGraphState> }) {
  const s = frame.state
  const key = (a: number, b: number) => `${Math.min(a, b)}-${Math.max(a, b)}`
  const treeSet = new Set(s.tree.map(([a, b]) => key(a, b)))
  const lk = s.look ? key(s.look[0], s.look[1]) : ''
  const inQueue = new Set(s.queue)
  const nodes: GNode[] = Array.from({ length: s.n }, (_, i): GNode => {
    const id = i + 1
    let tone: GNode['tone'] = 'idle'
    if (s.finished[id]) tone = 'done'
    if (inQueue.has(id)) tone = 'compare'
    if (s.cur === id) tone = 'found'
    return { id, tone, sub: s.dist[id] >= 0 ? `距离 ${s.dist[id]}` : undefined }
  })
  const edges: GEdge[] = s.edges.map((e) => {
    const k = key(e.a, e.b)
    let tone: GEdge['tone'] = treeSet.has(k) ? 'done' : 'idle'
    if (k === lk) tone = s.lookKind === 'skip' ? 'swap' : 'compare'
    return { a: e.a, b: e.b, tone }
  })
  const reached = s.dist.slice(1).filter((d) => d >= 0).length
  return (
    <div className="viz">
      <GraphView nodes={nodes} edges={edges} height={290} />
      <QueueRow items={s.queue.map((v) => `${v}·${s.dist[v]}`)} label="队列" max={10} />
      <div className="legend">
        <span><i className="sw tone-found" />正在处理</span>
        <span><i className="sw tone-compare" />在队列里</span>
        <span><i className="sw tone-done" />已处理完</span>
      </div>
      <Stats items={[['已有距离的结点', `${reached} / ${s.n}`], ['队列里还有', s.queue.length]]} />
    </div>
  )
}

function parse(text: string): ParseResult<BfsGraphInput> {
  return readInput(text, (r) => {
    const { n, edges } = readGraph(r, { weighted: false, directed: false, maxN: 7, maxM: 10 })
    const start = r.int('起点 s', 1, n)
    r.end()
    return { n, edges, start }
  })
}

export const bfsGraph: Example<BfsGraphInput, BfsGraphState> = {
  slug: 'stations',
  name: '最少坐几站',
  type: '无权图的最短距离',
  statement: {
    desc: [
      '有 n 个车站，m 条双向的地铁线段，每条线段连接两个车站，坐过一条线段算一站。小明从起点站 s 出发，求到每个车站最少需要坐几站；到不了的车站输出 -1。',
    ],
    input: ['第一行两个整数 n 和 m（2 ≤ n ≤ 7，1 ≤ m ≤ 10），表示车站数和线段数。', '接下来 m 行，每行两个整数 a、b，表示 a 站和 b 站之间有一条线段（没有重边和自环）。', '最后一行一个整数 s（1 ≤ s ≤ n），是起点站。'],
    output: ['一行 n 个整数，第 i 个是从 s 到第 i 站最少需要坐几站，到不了输出 -1，用空格隔开。'],
  },
  idea: [
    '每条边都算一站，边没有长短之分，所以“最少坐几站”就是图上的最短路径，边数最少的那条路。这正是 BFS 擅长的事：它从起点开始一层一层地向外扩展，先到达的结点，距离一定不会比后到达的更大。',
    '做法和迷宫那道题完全一样，只是迷宫里“邻居”要从上下左右算出来，这里的邻居直接从邻接表里取。起点的距离是 0，每次从队头取出一个结点 u，把它所有还没有距离的邻居 v 的距离设为 dist[u] + 1，并放进队尾。每个结点只会在第一次被发现时赋值，那一次的距离就是最短的。',
    '队列保证了处理的顺序是“距离 0 的、距离 1 的、距离 2 的……”，所以这里不需要 Dijkstra 里的“每次找最小”，边权都是 1 时，BFS 就是最短路算法。',
  ],
  complexity: { time: 'O(n + m)', space: 'O(n + m)', note: 'n 是结点数，m 是边数。每个结点进队一次，每条边在无向图里被检查两次。' },
  presets: [
    { label: '有两条路线', text: '5 5\n1 2\n1 3\n2 4\n3 4\n4 5\n1' },
    { label: '有到不了的站', text: '5 3\n1 2\n2 3\n4 5\n1' },
    { label: '从中间出发', text: '7 6\n1 2\n1 3\n2 4\n2 5\n3 6\n3 7\n2' },
  ],
  defaultInput: { n: 6, edges: [[1, 2], [1, 3], [2, 4], [3, 4], [4, 5], [5, 6]].map(([a, b]) => ({ a, b, w: 1 })), start: 1 },
  parse,
  format: (v) => `${formatGraph(v.n, v.edges, false)}\n${v.start}`,
  random: () => {
    const n = randInt(5, 7)
    return { n, edges: randomGraph(n, randInt(1, 3), false), start: randInt(1, n) }
  },
  answer: (v) => {
    const adj: number[][] = Array.from({ length: v.n + 1 }, () => [])
    for (const e of v.edges) {
      adj[e.a].push(e.b)
      adj[e.b].push(e.a)
    }
    const dist = new Array<number>(v.n + 1).fill(-1)
    dist[v.start] = 0
    const q = [v.start]
    while (q.length) {
      const u = q.shift()!
      for (const w of adj[u]) {
        if (dist[w] !== -1) continue
        dist[w] = dist[u] + 1
        q.push(w)
      }
    }
    return dist.slice(1).join(' ')
  },
  run: runBfsGraph,
  View: BfsGraphView,
  sources: {
    c: String.raw`
#include <stdio.h>
int n,m,s,adj[10][10],deg[10],dist[10],q[10];
int main(){
    int a,b,head=0,tail=0;
    scanf("%d %d",&n,&m);
    for (int i=0;i<m;i++){
        scanf("%d %d",&a,&b);
        adj[a][deg[a]++]=b;
        adj[b][deg[b]++]=a;
    }
    scanf("%d",&s);
    for (int i=1;i<=n;i++) dist[i]=-1;
    dist[s]=0;
    q[tail++]=s;                                   //@init
    while (head<tail){
        int u=q[head++];                           //@pop
        for (int k=0;k<deg[u];k++){
            int v=adj[u][k];
            if (dist[v]!=-1) continue;             //@skip
            dist[v]=dist[u]+1;                     //@push
            q[tail++]=v;                           //@push
        }
    }
    for (int i=1;i<=n;i++) printf("%d ",dist[i]);  //@done
    printf("\n");
    return 0;
}
`,
    cpp: String.raw`
#include <bits/stdc++.h>
using namespace std;
vector<int> adj[10];
int dist_[10];
int main(){
    int n,m,a,b,s;
    cin>>n>>m;
    for (int i=0;i<m;i++){
        cin>>a>>b;
        adj[a].push_back(b);
        adj[b].push_back(a);
    }
    cin>>s;
    fill(dist_,dist_+n+1,-1);
    queue<int> q;
    dist_[s]=0;
    q.push(s);                                   //@init
    while (!q.empty()){
        int u=q.front();
        q.pop();                                 //@pop
        for (int v:adj[u]){
            if (dist_[v]!=-1) continue;          //@skip
            dist_[v]=dist_[u]+1;                 //@push
            q.push(v);                           //@push
        }
    }
    for (int i=1;i<=n;i++) cout<<dist_[i]<<" ";  //@done
    cout<<endl;
    return 0;
}
`,
    python: String.raw`
from collections import deque
n,m=map(int,input().split())
adj=[[] for _ in range(n+1)]
for _ in range(m):
    a,b=map(int,input().split())
    adj[a].append(b)
    adj[b].append(a)
s=int(input())
dist=[-1]*(n+1)
dist[s]=0
q=deque([s])                                #@init
while q:
    u=q.popleft()                           #@pop
    for v in adj[u]:
        if dist[v]!=-1:
            continue                        #@skip
        dist[v]=dist[u]+1                   #@push
        q.append(v)                         #@push
print(*dist[1:])                            #@done
`,
    java: String.raw`
import java.util.*;

public class Main{
    public static void main(String[] args){
        Scanner sc=new Scanner(System.in);
        int n=sc.nextInt(),m=sc.nextInt();
        List<List<Integer>> adj=new ArrayList<>();
        for (int i=0;i<=n;i++) adj.add(new ArrayList<>());
        for (int i=0;i<m;i++){
            int a=sc.nextInt(),b=sc.nextInt();
            adj.get(a).add(b);
            adj.get(b).add(a);
        }
        int s=sc.nextInt();
        int[] dist=new int[n+1];
        Arrays.fill(dist,-1);
        dist[s]=0;
        Deque<Integer> q=new ArrayDeque<>();
        q.add(s);                           //@init
        while (!q.isEmpty()){
            int u=q.poll();                 //@pop
            for (int v:adj.get(u)){
                if (dist[v]!=-1) continue;  //@skip
                dist[v]=dist[u]+1;          //@push
                q.add(v);                   //@push
            }
        }
        StringBuilder sb=new StringBuilder();
        for (int i=1;i<=n;i++) sb.append(dist[i]).append(' ');
        System.out.println(sb);             //@done
    }
}
`,
  },
  problems: pickProblems('P1135', 'P1443'),
}
