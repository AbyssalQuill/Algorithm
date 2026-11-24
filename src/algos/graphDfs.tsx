import { GraphView, type GEdge, type GNode } from '../components/GraphView'
import { Stats } from '../components/Stats'
import { pickProblems } from '../data/problems'
import { Recorder } from '../engine/recorder'
import type { AlgoDef, Frame, ParseResult } from '../engine/types'
import { dfsIsland } from './dfsIsland'
import { formatGraph, type ParsedEdge, randInt, randomGraph, readGraph, readInput } from './shared'

export interface DfsInput {
  n: number
  edges: ParsedEdge[]
  start: number
}

export interface DfsState {
  n: number
  edges: { a: number; b: number }[]
  /** 已经发现的树边（沿着它们走进了新结点） */
  tree: [number, number][]
  /** 当前正在检查的边 */
  look: [number, number] | null
  lookKind: 'go' | 'skip' | null
  vis: boolean[]
  /** 已经完全处理完（回溯过）的结点 */
  finished: boolean[]
  order: number[]
  stack: number[]
}

export function runDfs({ n, edges, start }: DfsInput): Frame<DfsState>[] {
  const rec = new Recorder<DfsState>()
  const adj: number[][] = Array.from({ length: n + 1 }, () => [])
  for (const e of edges) {
    adj[e.a].push(e.b)
    adj[e.b].push(e.a)
  }
  const vis = new Array(n + 1).fill(false)
  const finished = new Array(n + 1).fill(false)
  const order: number[] = []
  const stack: number[] = []
  const tree: [number, number][] = []
  let look: [number, number] | null = null
  let lookKind: DfsState['lookKind'] = null
  const snap = (): DfsState => ({ n, edges: edges.map((e) => ({ a: e.a, b: e.b })), tree, look, lookKind, vis, finished, order, stack })

  rec.push('init', snap(), `从结点 ${start} 出发做深度优先搜索：沿着一条路一直往深处走，走不下去了再退回来，换一条路。已经去过的结点用 vis 标记，不会重复访问。`)
  const dfs = (u: number) => {
    vis[u] = true
    order.push(u)
    stack.push(u)
    look = null
    lookKind = null
    rec.push('visit', snap(), `来到结点 ${u}，标记为已访问，记入访问顺序。目前的路径是 ${stack.join(' → ')}。`)
    for (const v of adj[u]) {
      look = [u, v]
      if (vis[v]) {
        lookKind = 'skip'
        rec.push('skip', snap(), `看 ${u} 的邻居 ${v}：${v} 已经访问过了，跳过，不然会绕圈。`)
        continue
      }
      lookKind = 'go'
      tree.push([u, v])
      rec.push('go', snap(), `看 ${u} 的邻居 ${v}：还没去过，沿着这条边走过去，并从 ${v} 开始继续往深处搜索。`)
      dfs(v)
    }
    look = null
    lookKind = null
    finished[u] = true
    stack.pop()
    rec.push('back', snap(), `${u} 的邻居都处理完了，没有新路可走，退回到上一层${stack.length ? `（${stack[stack.length - 1]}）` : '，搜索结束'}。`)
  }
  dfs(start)
  const unreachable = Array.from({ length: n }, (_, i) => i + 1).filter((i) => !vis[i])
  rec.push('done', snap(), `访问顺序是：${order.join(' → ')}。${unreachable.length ? `结点 ${unreachable.join('、')} 与起点不连通，没有被访问到。` : '所有结点都被访问到了。'}`)
  return rec.frames
}

function DfsView({ frame }: { frame: Frame<DfsState> }) {
  const s = frame.state
  const key = (a: number, b: number) => `${Math.min(a, b)}-${Math.max(a, b)}`
  const treeSet = new Set(s.tree.map(([a, b]) => key(a, b)))
  const lk = s.look ? key(s.look[0], s.look[1]) : ''
  const top = s.stack[s.stack.length - 1]
  const nodes: GNode[] = Array.from({ length: s.n }, (_, i): GNode => {
    const id = i + 1
    let tone: GNode['tone'] = 'idle'
    if (s.finished[id]) tone = 'done'
    else if (s.vis[id]) tone = id === top ? 'compare' : 'compare'
    if (id === top) tone = 'found'
    return { id, tone, sub: s.order.indexOf(id) >= 0 ? `第${s.order.indexOf(id) + 1}个` : undefined }
  })
  const edges: GEdge[] = s.edges.map((e) => {
    const k = key(e.a, e.b)
    let tone: GEdge['tone'] = treeSet.has(k) ? 'done' : 'idle'
    if (k === lk) tone = s.lookKind === 'skip' ? 'swap' : 'compare'
    return { a: e.a, b: e.b, tone }
  })
  return (
    <div className="viz">
      <GraphView nodes={nodes} edges={edges} height={290} />
      <div className="row-label">当前的路径（递归栈，最右边是正在处理的）</div>
      <div className="outline">{s.stack.length === 0 ? <span className="qrow-empty">空</span> : s.stack.map((v, i) => <span key={i} className="qchip">{v}</span>)}</div>
      <div className="row-label">访问顺序</div>
      <div className="outline">{s.order.length === 0 ? <span className="qrow-empty">还没有</span> : s.order.map((v, i) => <span key={i} className="qchip">{v}</span>)}</div>
      <div className="legend">
        <span><i className="sw tone-found" />当前结点</span>
        <span><i className="sw tone-compare" />路径上的结点</span>
        <span><i className="sw tone-done" />已处理完</span>
      </div>
      <Stats items={[['已访问', `${s.order.length} / ${s.n}`], ['路径深度', s.stack.length]]} />
    </div>
  )
}

function parse(text: string): ParseResult<DfsInput> {
  return readInput(text, (r) => {
    const { n, edges } = readGraph(r, { weighted: false, directed: false, maxN: 7, maxM: 10 })
    const start = r.int('起点 s', 1, n)
    r.end()
    return { n, edges, start }
  })
}

export const graphDfs: AlgoDef<DfsInput, DfsState> = {
  id: 'dfs',
  title: 'DFS',
  tagline: '深度优先搜索：沿着一条路一直走到头，走不通了再退回来换一条，用递归就能写出来',
  kind: '算法',
  slug: 'order',
  name: '遍历顺序',
  type: '图的遍历',
  statement: {
    desc: [
      '给定一张无向图和一个起点 s，从 s 出发做深度优先搜索，输出结点被访问到的先后顺序。到达每个结点以后，按照它的邻居在输入里出现的顺序依次尝试，已经访问过的结点不再访问。',
    ],
    input: [
      '第一行两个整数 n 和 m（2 ≤ n ≤ 7，1 ≤ m ≤ 10），表示结点数和边数。',
      '接下来 m 行，每行两个整数 a、b，表示 a 和 b 之间有一条边（1 ≤ a, b ≤ n，没有重边和自环）。',
      '最后一行一个整数 s（1 ≤ s ≤ n），是起点。',
    ],
    output: [
      '一行，按访问的先后顺序输出从 s 出发能到达的所有结点，用空格隔开。',
    ],
  },
  intro: [
    '深度优先搜索是图和树上最基本的遍历方式。它的行为很像在迷宫里探路：从起点出发，选一条没走过的路一直往前走，走到死胡同或者遇到已经去过的地方，就退回到上一个路口，换另一条路继续。每个结点只访问一次。',
    '用递归实现最自然：函数 dfs(u) 先标记 u 已访问，再依次检查 u 的每个邻居，没有访问过的就递归地搜索它。函数返回就相当于“退回上一个路口”，调用栈自己记住了回去的路。',
  ],
  points: [
    '必须有一个 vis 数组记录哪些结点访问过，否则遇到环（比如 1-2-3-1）会无限地绕下去。',
    '邻居的访问顺序取决于边的存储顺序，所以同一个图可能有不同的 DFS 顺序，它们都是正确的。',
    '图不连通时，从一个起点只能访问到它所在的连通块；要访问全部结点，需要对每个还没访问过的结点各启动一次 DFS，启动的次数就是连通块的个数。',
    'DFS 还可以用来判断连通性、找环、求连通块的个数、拓扑排序等，是后面很多算法的基础。',
  ],
  pitfalls: [
    '在进入结点时（而不是检查邻居时）标记 vis，否则同一个结点可能被多个邻居重复递归。',
    '图很大、很深（比如一条上十万个结点的链）时，递归会爆栈，需要改用显式的栈。',
    'DFS 找到的路径不一定是最短的；要求最短路径，应当用 BFS。',
  ],
  complexity: { time: 'O(n + m)', space: 'O(n)', note: 'n 是结点数，m 是边数：每个结点访问一次，每条边最多检查两次。空间主要是递归栈和 vis 数组。' },
  presets: [
    { label: '一棵树', text: '7 6\n1 2\n1 3\n2 4\n2 5\n3 6\n3 7\n1' },
    { label: '有环的图', text: '5 5\n1 2\n2 3\n3 1\n3 4\n4 5\n1' },
    { label: '不连通', text: '5 3\n1 2\n2 3\n4 5\n1' },
  ],
  defaultInput: { n: 7, edges: [{ a: 1, b: 2, w: 1 }, { a: 1, b: 3, w: 1 }, { a: 2, b: 4, w: 1 }, { a: 2, b: 5, w: 1 }, { a: 3, b: 6, w: 1 }, { a: 3, b: 7, w: 1 }], start: 1 },
  parse,
  format: (v) => `${formatGraph(v.n, v.edges, false)}\n${v.start}`,
  answer: (v) => {
    const adj: number[][] = Array.from({ length: v.n + 1 }, () => [])
    for (const e of v.edges) {
      adj[e.a].push(e.b)
      adj[e.b].push(e.a)
    }
    const seen = new Set<number>()
    const order: number[] = []
    const dfs = (u: number) => {
      seen.add(u)
      order.push(u)
      for (const w of adj[u]) if (!seen.has(w)) dfs(w)
    }
    dfs(v.start)
    return order.join(' ')
  },
  random: () => {
    const n = randInt(5, 7)
    return { n, edges: randomGraph(n, randInt(0, 3), false), start: randInt(1, n) }
  },
  run: runDfs,
  View: DfsView,
  sources: {
    c: String.raw`
#include <stdio.h>
int adj[105][105],deg[105],vis[105],order[105],cnt=0;
void dfs(int u){
    vis[u]=1;                  // 来到 u，先标记，并记下访问的顺序  //@visit
    order[cnt++]=u;                                  //@visit
    for (int i=0;i<deg[u];i++){
        int v=adj[u][i];
        if (vis[v]) continue;  // 去过的结点，不再去          //@skip
        dfs(v);                // 没去过，沿着这条边往深处走      //@go
    }
    // u 的邻居都处理完了，回到上一层                              //@back
}
int main(){
    int n,m,a,b,s;
    scanf("%d %d",&n,&m);
    for (int i=0;i<m;i++){
        scanf("%d %d",&a,&b);
        adj[a][deg[a]++]=b;
        adj[b][deg[b]++]=a;
    }
    scanf("%d",&s);
    dfs(s);                    // 从起点开始搜索            //@init
    for (int i=0;i<cnt;i++) printf("%d ",order[i]);
    printf("\n");                                    //@done
    return 0;
}
`,
    cpp: String.raw`
#include <bits/stdc++.h>
using namespace std;
vector<int> adj[105];
bool vis[105];
vector<int> order_;
void dfs(int u){
    vis[u]=true;               // 来到 u，先标记，并记下访问的顺序  //@visit
    order_.push_back(u);                             //@visit
    for (int v:adj[u]){
        if (vis[v]) continue;  // 去过的结点，不再去          //@skip
        dfs(v);                // 没去过，沿着这条边往深处走      //@go
    }
    // u 的邻居都处理完了，回到上一层                              //@back
}
int main(){
    int n,m,a,b,s;
    cin>>n>>m;
    for (int i=0;i<m;i++){
        cin>>a>>b;
        adj[a].push_back(b);
        adj[b].push_back(a);
    }
    cin>>s;
    dfs(s);                    // 从起点开始搜索            //@init
    for (int x:order_) cout<<x<<" ";
    cout<<endl;                                      //@done
    return 0;
}
`,
    python: String.raw`
import sys
sys.setrecursionlimit(10000)

def dfs(u):
    vis[u]=True       # 来到 u，先标记，并记下访问的顺序   #@visit
    order.append(u)                         #@visit
    for v in adj[u]:
        if vis[v]:
            continue  # 去过的结点，不再去           #@skip
        dfs(v)        # 没去过，沿着这条边往深处走       #@go
    # u 的邻居都处理完了，回到上一层                      #@back

n,m=map(int,input().split())
adj=[[] for _ in range(n+1)]
for _ in range(m):
    a,b=map(int,input().split())
    adj[a].append(b)
    adj[b].append(a)
s=int(input())
vis=[False]*(n+1)
order=[]
dfs(s)                # 从起点开始搜索             #@init
print(*order)                               #@done
`,
    java: String.raw`
import java.util.*;

public class Main{
    static List<List<Integer>> adj=new ArrayList<>();
    static boolean[] vis=new boolean[105];
    static List<Integer> order=new ArrayList<>();

    static void dfs(int u){
        vis[u]=true;               // 来到 u，先标记，并记下访问的顺序  //@visit
        order.add(u);                                    //@visit
        for (int v:adj.get(u)){
            if (vis[v]) continue;  // 去过的结点，不再去          //@skip
            dfs(v);                // 没去过，沿着这条边往深处走      //@go
        }
        // u 的邻居都处理完了，回到上一层                              //@back
    }

    public static void main(String[] args){
        Scanner sc=new Scanner(System.in);
        int n=sc.nextInt(),m=sc.nextInt();
        for (int i=0;i<=n;i++) adj.add(new ArrayList<>());
        for (int i=0;i<m;i++){
            int a=sc.nextInt(),b=sc.nextInt();
            adj.get(a).add(b);
            adj.get(b).add(a);
        }
        int s=sc.nextInt();
        dfs(s);                    // 从起点开始搜索            //@init
        StringBuilder sb=new StringBuilder();
        for (int x:order) sb.append(x).append(' ');
        System.out.println(sb);                          //@done
    }
}
`,
  },
  problems: pickProblems('P3916', 'P1596'),
  extra: [dfsIsland],
}
