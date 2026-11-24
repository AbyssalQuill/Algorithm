import { ArrayView, type Cell } from '../components/ArrayView'
import { GraphView, type GEdge, type GNode } from '../components/GraphView'
import { Stats } from '../components/Stats'
import { pickProblems } from '../data/problems'
import { Recorder } from '../engine/recorder'
import type { AlgoDef, Frame, ParseResult } from '../engine/types'
import { formatGraph, type ParsedEdge, randInt, randomGraph, readGraph, readInput } from './shared'

export interface DijInput {
  n: number
  edges: ParsedEdge[]
  start: number
}

export interface DijState {
  n: number
  edges: ParsedEdge[]
  /** 到起点的最短距离；null 表示目前还不知道怎么到达 */
  dist: (number | null)[]
  done: boolean[]
  par: number[]
  cur: number | null
  look: [number, number] | null
  improved: boolean
  finalized: number
}

export function runDijkstra({ n, edges, start }: DijInput): Frame<DijState>[] {
  const rec = new Recorder<DijState>()
  const adj: { v: number; w: number }[][] = Array.from({ length: n + 1 }, () => [])
  for (const e of edges) {
    adj[e.a].push({ v: e.b, w: e.w })
    adj[e.b].push({ v: e.a, w: e.w })
  }
  const dist: (number | null)[] = new Array(n + 1).fill(null)
  const done: boolean[] = new Array(n + 1).fill(false)
  const par: number[] = new Array(n + 1).fill(0)
  let cur: number | null = null
  let look: [number, number] | null = null
  let improved = false
  let finalized = 0
  const snap = (): DijState => ({ n, edges, dist, done, par, cur, look, improved, finalized })

  dist[start] = 0
  rec.push('init', snap(), `求从结点 ${start} 到其他所有结点的最短路。先记下已知的：起点到自己的距离是 0，别的结点还不知道怎么走过去（用 ∞ 表示）。`)
  for (let it = 0; it < n; it++) {
    let u = -1
    for (let i = 1; i <= n; i++) if (!done[i] && dist[i] !== null && (u === -1 || (dist[i] as number) < (dist[u] as number))) u = i
    look = null
    improved = false
    if (u === -1) {
      cur = null
      rec.push('stop', snap(), '剩下的结点都是 ∞，说明从起点走不到它们，最短路算法到此结束。')
      break
    }
    done[u] = true
    finalized++
    cur = u
    rec.push('pick', snap(), `在所有还没确定的结点里，选出距离最小的：结点 ${u}，距离 ${dist[u]}。可以证明它的最短距离已经不会再变小了（因为所有的边权都是正数），把它确定下来。`)
    for (const { v, w } of adj[u]) {
      look = [u, v]
      const cand = (dist[u] as number) + w
      const better = dist[v] === null || cand < (dist[v] as number)
      improved = false
      rec.push('relax', snap(), `看 ${u} 连着的 ${v}（边权 ${w}）：经过 ${u} 走到 ${v} 的距离是 ${dist[u]} + ${w} = ${cand}，${dist[v] === null ? '之前还没有到 ' + v + ' 的路，所以更短。' : `当前记录的是 ${dist[v]}，${better ? '更短' : '不比它更短'}。`}`)
      if (better) {
        dist[v] = cand
        par[v] = u
        improved = true
        rec.push('update', snap(), `更新：dist[${v}] 变成 ${cand}，并记下它是从 ${u} 过来的。这个动作叫“松弛”。`)
      }
    }
    look = null
    improved = false
  }
  cur = null
  look = null
  const far = Array.from({ length: n }, (_, i) => i + 1).map((i) => `${i}:${dist[i] ?? '∞'}`).join('  ')
  rec.push('done', snap(), `全部确定。从 ${start} 出发的最短距离依次是：${far}。`)
  return rec.frames
}

function DijView({ frame }: { frame: Frame<DijState> }) {
  const s = frame.state
  const key = (a: number, b: number) => `${Math.min(a, b)}-${Math.max(a, b)}`
  const treeSet = new Set<string>()
  for (let v = 1; v <= s.n; v++) if (s.par[v] && s.dist[v] !== null) treeSet.add(key(s.par[v], v))
  const lk = s.look ? key(s.look[0], s.look[1]) : ''
  const nodes: GNode[] = Array.from({ length: s.n }, (_, i): GNode => {
    const id = i + 1
    return { id, tone: id === s.cur ? 'compare' : s.done[id] ? 'done' : 'idle', sub: s.dist[id] === null ? '∞' : s.dist[id]! }
  })
  const edges: GEdge[] = s.edges.map((e) => {
    const k = key(e.a, e.b)
    let tone: GEdge['tone'] = treeSet.has(k) ? 'done' : 'idle'
    if (k === lk) tone = s.improved ? 'found' : 'compare'
    return { a: e.a, b: e.b, w: e.w, tone }
  })
  const cells: Cell[] = Array.from({ length: s.n }, (_, i): Cell => {
    const id = i + 1
    return { id, v: s.dist[id] ?? 0, label: s.dist[id] === null ? '∞' : undefined, tone: id === s.cur ? 'compare' : s.done[id] ? 'done' : 'idle' }
  })
  return (
    <div className="viz">
      <GraphView nodes={nodes} edges={edges} height={290} />
      <div className="row-label">dist[i]：从起点到 i 的当前最短距离（绿色 = 已确定）</div>
      <ArrayView cells={cells} mode="boxes" base={1} minSlots={0} />
      <Stats items={[['已确定的结点', `${s.finalized} / ${s.n}`]]} />
    </div>
  )
}

function parse(text: string): ParseResult<DijInput> {
  return readInput(text, (r) => {
    const { n, edges } = readGraph(r, { weighted: true, directed: false, maxN: 7, maxM: 11 })
    const start = r.int('起点 s', 1, n)
    r.end()
    return { n, edges, start }
  })
}

export const dijkstra: AlgoDef<DijInput, DijState> = {
  id: 'dijkstra',
  title: 'Dijkstra',
  tagline: '每次确定离起点最近的那个结点，再用它去更新相邻结点的距离',
  kind: '算法',
  slug: 'shortest',
  name: '单源最短路',
  type: '非负边权',
  statement: {
    desc: [
      '给定一张带权无向图，所有边的权值都是正整数。求结点 s 到每个结点的最短路径长度，到不了的结点输出 -1。',
    ],
    input: [
      '第一行两个整数 n 和 m（2 ≤ n ≤ 7，1 ≤ m ≤ 11），表示结点数和边数。',
      '接下来 m 行，每行三个整数 a、b、w，表示 a 和 b 之间有一条长为 w 的边（1 ≤ w ≤ 99，没有重边和自环）。',
      '最后一行一个整数 s，是起点。',
    ],
    output: [
      '一行 n 个整数，第 i 个是 s 到结点 i 的最短距离，到不了输出 -1，用空格隔开。',
    ],
  },
  intro: [
    '图里每条边都有一个正的权值（比如路的长度），要求从起点到其他所有结点的最短路线。Dijkstra 算法的思路是：维护一个 dist 数组，记录“目前已知的”到每个结点的最短距离，起点是 0，其余是无穷大。然后重复这样一件事：在还没确定的结点里，挑出 dist 最小的那个，它的距离就不会再变小了，把它“确定”下来；再用它去更新所有相邻结点的距离。',
    '更新的操作叫“松弛”：如果经过当前结点走到邻居，比邻居原来记录的距离更短，就更新为更短的值。每次确定一个结点，重复 n 次，所有结点的最短距离就都确定了。这里每一步都是在“局部最优”之间做选择，所以它属于贪心算法，成立的前提是所有边权都不是负数。',
  ],
  points: [
    'dist 数组初始化为一个很大的数（INF），dist[起点]=0，另用 done 数组标记哪些结点已经确定。',
    '每一轮：在没确定的结点里找 dist 最小的 u，标记确定；遍历 u 的每条边 (u,v,w)，若 dist[u]+w<dist[v] 就更新 dist[v]。',
    '这里的找最小值用一个循环扫描，总时间是 O(n²)；在边比较少的大图里，用优先队列代替扫描，可以降到 O((n+m) log n)。',
    '要还原具体的路线，再用一个数组记下每个结点是从哪里更新来的（前驱），最后从终点沿着前驱倒着走回起点。',
  ],
  pitfalls: [
    '有负权边时 Dijkstra 会出错，因为“确定下来的结点不会再变小”这个前提不再成立，要改用 Bellman-Ford 或 SPFA。',
    'INF 不能取得太大：dist[u]+w 在 INF 附近相加可能溢出 int，常取 1e9 或者用 long long。',
    '如果有些结点从起点走不到，它们的 dist 一直是 INF，输出时要单独处理（常见的约定是输出 -1 或者 INF）。',
  ],
  complexity: { time: 'O(n²)', space: 'O(n + m)', note: '这是用数组扫描找最小值的版本；用优先队列优化后是 O((n + m) log n)。' },
  presets: [
    { label: '绕路更近', text: '4 5\n1 2 4\n1 3 2\n2 3 1\n2 4 5\n3 4 8\n1' },
    { label: '有走不到的点', text: '5 3\n1 2 3\n2 3 4\n4 5 2\n1' },
    { label: '六个结点', text: '6 9\n1 2 7\n1 3 9\n1 6 14\n2 3 10\n2 4 15\n3 4 11\n3 6 2\n4 5 6\n5 6 9\n1' },
  ],
  defaultInput: { n: 4, edges: [{ a: 1, b: 2, w: 4 }, { a: 1, b: 3, w: 2 }, { a: 2, b: 3, w: 1 }, { a: 2, b: 4, w: 5 }, { a: 3, b: 4, w: 8 }], start: 1 },
  parse,
  format: (v) => `${formatGraph(v.n, v.edges, true)}\n${v.start}`,
  answer: (v) => {
    const INF = 1e9
    const dist = Array<number>(v.n + 1).fill(INF)
    const done = Array<boolean>(v.n + 1).fill(false)
    dist[v.start] = 0
    for (let it = 0; it < v.n; it++) {
      let u = -1
      for (let i = 1; i <= v.n; i++) if (!done[i] && dist[i] < INF && (u === -1 || dist[i] < dist[u])) u = i
      if (u === -1) break
      done[u] = true
      for (const e of v.edges) {
        if (e.a === u) dist[e.b] = Math.min(dist[e.b], dist[u] + e.w)
        if (e.b === u) dist[e.a] = Math.min(dist[e.a], dist[u] + e.w)
      }
    }
    return dist.slice(1).map((d) => (d === INF ? -1 : d)).join(' ')
  },
  random: () => {
    const n = randInt(5, 7)
    return { n, edges: randomGraph(n, randInt(1, 4), true), start: randInt(1, n) }
  },
  run: runDijkstra,
  View: DijView,
  sources: {
    c: String.raw`
#include <stdio.h>
#define INF 1000000000
int adj[105][105],wt[105][105],deg[105],dist[105],done[105];
int main(){
    int n,m,a,b,w,s;
    scanf("%d %d",&n,&m);
    for (int i=0;i<m;i++){
        scanf("%d %d %d",&a,&b,&w);
        adj[a][deg[a]]=b; wt[a][deg[a]++]=w;
        adj[b][deg[b]]=a; wt[b][deg[b]++]=w;
    }
    scanf("%d",&s);
    for (int i=1;i<=n;i++) dist[i]=INF;
    dist[s]=0;               // 起点到自己的距离是 0              //@init
    for (int it=0;it<n;it++){
        int u=-1;
        for (int i=1;i<=n;i++)
            if (!done[i]&&dist[i]<INF&&(u==-1||dist[i]<dist[u])) u=i;
        if (u==-1) break;    // 剩下的结点都到不了，提前结束           //@stop
        done[u]=1;           // 选出离起点最近的、还没确定的结点，把它确定下来  //@pick
        for (int i=0;i<deg[u];i++){
            int v=adj[u][i],c=dist[u]+wt[u][i];
            if (c<dist[v]){  // 经过 u 走到 v，比原来记录的距离更短吗    //@relax
                dist[v]=c;   // 更短，更新 v 的距离              //@update
            }
        }
    }
    for (int i=1;i<=n;i++) printf("%d ",dist[i]==INF?-1:dist[i]);
    printf("\n");            // 输出到每个结点的最短距离             //@done
    return 0;
}
`,
    cpp: String.raw`
#include <bits/stdc++.h>
using namespace std;
const int INF=1e9;
vector<pair<int,int>> adj[105];
int dist_[105];
bool done[105];
int main(){
    int n,m,a,b,w,s;
    cin>>n>>m;
    for (int i=0;i<m;i++){
        cin>>a>>b>>w;
        adj[a].push_back({b,w});
        adj[b].push_back({a,w});
    }
    cin>>s;
    fill(dist_,dist_+n+1,INF);
    dist_[s]=0;                        // 起点到自己的距离是 0              //@init
    for (int it=0;it<n;it++){
        int u=-1;
        for (int i=1;i<=n;i++)
            if (!done[i]&&dist_[i]<INF&&(u==-1||dist_[i]<dist_[u])) u=i;
        if (u==-1) break;              // 剩下的结点都到不了，提前结束           //@stop
        done[u]=true;                  // 选出离起点最近的、还没确定的结点，把它确定下来  //@pick
        for (auto [v,c]:adj[u]){
            if (dist_[u]+c<dist_[v]){  // 经过 u 走到 v，比原来记录的距离更短吗    //@relax
                dist_[v]=dist_[u]+c;   // 更短，更新 v 的距离              //@update
            }
        }
    }
    for (int i=1;i<=n;i++) cout<<(dist_[i]==INF?-1:dist_[i])<<" ";
    cout<<endl;                        // 输出到每个结点的最短距离             //@done
    return 0;
}
`,
    python: String.raw`
INF=10**9
n,m=map(int,input().split())
adj=[[] for _ in range(n+1)]
for _ in range(m):
    a,b,w=map(int,input().split())
    adj[a].append((b,w))
    adj[b].append((a,w))
s=int(input())
dist=[INF]*(n+1)
dist[s]=0                                     # 起点到自己的距离是 0              #@init
done=[False]*(n+1)
for _ in range(n):
    u=-1
    for i in range(1,n+1):
        if not done[i] and dist[i]<INF and (u==-1 or dist[i]<dist[u]):
            u=i
    if u==-1:
        break                                 # 剩下的结点都到不了，提前结束           #@stop
    done[u]=True                              # 选出离起点最近的、还没确定的结点，把它确定下来  #@pick
    for v,c in adj[u]:
        if dist[u]+c<dist[v]:                 # 经过 u 走到 v，比原来记录的距离更短吗    #@relax
            dist[v]=dist[u]+c                 # 更短，更新 v 的距离              #@update
print(*[-1 if d==INF else d for d in dist[1:]])  # 输出到每个结点的最短距离          #@done
`,
    java: String.raw`
import java.util.*;

public class Main{
    public static void main(String[] args){
        final int INF=1000000000;
        Scanner sc=new Scanner(System.in);
        int n=sc.nextInt(),m=sc.nextInt();
        List<List<int[]>> adj=new ArrayList<>();
        for (int i=0;i<=n;i++) adj.add(new ArrayList<>());
        for (int i=0;i<m;i++){
            int a=sc.nextInt(),b=sc.nextInt(),w=sc.nextInt();
            adj.get(a).add(new int[]{b,w});
            adj.get(b).add(new int[]{a,w});
        }
        int s=sc.nextInt();
        int[] dist=new int[n+1];
        boolean[] done=new boolean[n+1];
        Arrays.fill(dist,INF);
        dist[s]=0;                            // 起点到自己的距离是 0              //@init
        for (int it=0;it<n;it++){
            int u=-1;
            for (int i=1;i<=n;i++)
                if (!done[i]&&dist[i]<INF&&(u==-1||dist[i]<dist[u])) u=i;
            if (u==-1) break;                 // 剩下的结点都到不了，提前结束           //@stop
            done[u]=true;                     // 选出离起点最近的、还没确定的结点，把它确定下来  //@pick
            for (int[] e:adj.get(u)){
                if (dist[u]+e[1]<dist[e[0]]){  // 经过 u 走到 v，比原来记录的距离更短吗   //@relax
                    dist[e[0]]=dist[u]+e[1];  // 更短，更新 v 的距离              //@update
                }
            }
        }
        StringBuilder sb=new StringBuilder();
        for (int i=1;i<=n;i++) sb.append(dist[i]==INF?-1:dist[i]).append(' ');
        System.out.println(sb);               // 输出到每个结点的最短距离             //@done
    }
}
`,
  },
  problems: pickProblems('P4779', 'P3371'),
}
