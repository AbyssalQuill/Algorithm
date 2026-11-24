import { GraphView, type GEdge, type GNode } from '../components/GraphView'
import { GridView, type GridCell } from '../components/GridView'
import { Stats } from '../components/Stats'
import { pickProblems } from '../data/problems'
import { Recorder } from '../engine/recorder'
import type { AlgoDef, Frame, ParseResult } from '../engine/types'
import { formatEdges, parseEdges, randInt, randomGraph, type ParsedEdge } from './shared'

export interface StoreInput {
  n: number
  edges: ParsedEdge[]
}

export interface StoreState {
  n: number
  edges: ParsedEdge[]
  /** 已经录入的边数 */
  added: number
  matrix: number[][]
  lists: number[][]
  /** 刚刚改动的边 */
  last: [number, number] | null
  stage: 'matrix' | 'list' | null
}

export function runStore({ n, edges }: StoreInput): Frame<StoreState>[] {
  const rec = new Recorder<StoreState>()
  const matrix = Array.from({ length: n + 1 }, () => new Array<number>(n + 1).fill(0))
  const lists: number[][] = Array.from({ length: n + 1 }, () => [])
  let added = 0
  let last: [number, number] | null = null
  let stage: StoreState['stage'] = null
  const snap = (): StoreState => ({ n, edges, added, matrix, lists, last, stage })

  rec.push('init', snap(), `同一张图有两种常见的存法。邻接矩阵是一张 n×n 的表，第 a 行第 b 列是 1 表示 a、b 之间有边；邻接表是每个结点一条清单，只写出它的邻居。现在两种都是空的，依次录入每条边，看看它们怎么变化。`)
  edges.forEach((e, i) => {
    added = i + 1
    last = [e.a, e.b]
    matrix[e.a][e.b] = 1
    matrix[e.b][e.a] = 1
    stage = 'matrix'
    rec.push('matrix', snap(), `录入边 ${e.a}-${e.b}。邻接矩阵里把 (${e.a}, ${e.b}) 和 (${e.b}, ${e.a}) 两个格子都置为 1（无向边是双向的，所以矩阵关于对角线对称）。`)
    lists[e.a].push(e.b)
    lists[e.b].push(e.a)
    stage = 'list'
    rec.push('list', snap(), `邻接表里，把 ${e.b} 加到 ${e.a} 的清单，再把 ${e.a} 加到 ${e.b} 的清单。`)
  })
  last = null
  stage = null
  rec.push('done', snap(), `录入完成。矩阵占用 ${n}×${n} 个格子，邻接表只存了 ${edges.length * 2} 个邻居。结点很多、边很少的图（稀疏图）适合用邻接表；结点少、边很多，或者需要快速判断“a、b 之间有没有边”时，邻接矩阵更方便。`)
  return rec.frames
}

function StoreView({ frame }: { frame: Frame<StoreState> }) {
  const s = frame.state
  const n = s.n
  const hot = (a: number, b: number) => s.last !== null && s.stage === 'matrix' && ((s.last[0] === a && s.last[1] === b) || (s.last[0] === b && s.last[1] === a))
  const rows: GridCell[][] = [
    [{ head: true }, ...Array.from({ length: n }, (_, j): GridCell => ({ head: true, text: j + 1 }))],
    ...Array.from({ length: n }, (_, i): GridCell[] => [
      { head: true, text: i + 1 },
      ...Array.from({ length: n }, (_, j): GridCell => ({ text: s.matrix[i + 1][j + 1], tone: hot(i + 1, j + 1) ? 'compare' : s.matrix[i + 1][j + 1] ? 'done' : 'dim' })),
    ]),
  ]
  const nodes: GNode[] = Array.from({ length: n }, (_, i): GNode => ({ id: i + 1 }))
  const gedges: GEdge[] = s.edges.slice(0, s.added).map((e) => ({ a: e.a, b: e.b, tone: s.last && s.last[0] === e.a && s.last[1] === e.b ? 'compare' : 'idle' }))
  return (
    <div className="viz">
      <GraphView nodes={nodes} edges={gedges} height={210} />
      <div className="row-label">邻接矩阵</div>
      <GridView rows={rows} maxCell={36} />
      <div className="row-label">邻接表（每个结点的邻居清单）</div>
      <div className="hash">
        {Array.from({ length: n }, (_, i) => (
          <div key={i} className={`hash-row${s.last && s.stage === 'list' && (s.last[0] === i + 1 || s.last[1] === i + 1) ? ' is-cur' : ''}`}>
            <span className="hash-idx">{i + 1}</span>
            <span className="hash-chain">
              {s.lists[i + 1].length === 0 && <span className="qrow-empty">空</span>}
              {s.lists[i + 1].map((v, j) => (
                <span key={j} className="hash-item">
                  {j > 0 && <i className="hash-arrow">→</i>}
                  <span className="qchip tone-idle">{v}</span>
                </span>
              ))}
            </span>
          </div>
        ))}
      </div>
      <Stats items={[['已录入的边', `${s.added} / ${s.edges.length}`]]} />
    </div>
  )
}

function parse(text: string): ParseResult<StoreInput> {
  const r = parseEdges(text, { weighted: false, directed: false, maxN: 6, maxM: 9, minM: 1 })
  return r.ok ? { ok: true, value: r.value } : r
}

export const graphStore: AlgoDef<StoreInput, StoreState> = {
  id: 'graph-store',
  title: '图的存储：矩阵与邻接表',
  tagline: '同一张图，既可以用一张表格记录，也可以给每个结点写一份邻居清单',
  kind: '数据结构',
  intro: [
    '要在程序里处理图，第一步是把它存起来。邻接矩阵用一个二维数组 g：g[a][b] 为 1 就表示 a 和 b 之间有一条边，查询两个结点是否相邻只需要看一个格子；缺点是不管有没有边都要占 n×n 的空间，结点一多就放不下了。',
    '邻接表则给每个结点保存一份它的邻居的清单，只记真正存在的边，占用的空间是 O(n + m)，遍历一个结点的所有邻居也只需要走过它自己的清单。大部分比赛题目的图都比较稀疏，所以邻接表是最常用的存储方式，前面的 DFS、最短路演示用的都是它。',
  ],
  points: [
    '无向边要存两次：矩阵里 g[a][b] 和 g[b][a] 都要置位；邻接表里要把 b 放进 a 的清单，也要把 a 放进 b 的清单。有向边只存一次。',
    '带权图里，矩阵的格子存权值（用一个特殊值表示没有边），邻接表的清单里存 (邻居, 权值) 这样的对。',
    '邻接矩阵判断“有没有边”是 O(1)，邻接表需要扫描清单；遍历所有邻居，矩阵要 O(n)，邻接表只要 O(度数)。',
    '结点编号从 1 开始时，数组要开到 n+1。',
  ],
  pitfalls: [
    '结点个数到一万以上时，邻接矩阵需要上亿个格子，几乎一定会超出内存，只能改用邻接表。',
    '无向图只存一次方向，遍历时就会漏掉一半的边。',
    '重边（两个结点之间有多条边）和自环，在矩阵里会被覆盖成一个，要看题目是否需要保留。',
  ],
  complexity: { time: 'O(m)', space: 'O(n + m)', note: '这里的空间是邻接表的；邻接矩阵需要 O(n²)。录入 m 条边各需要常数时间。' },
  inputHint: '输入边：a-b，用空格隔开，例如 1-2 1-3 2-4 3-4（结点 1～6，最多 9 条边）。',
  presets: [
    { label: '四个结点', text: '1-2 1-3 2-4 3-4' },
    { label: '一条星形', text: '1-2 1-3 1-4 1-5' },
    { label: '稠密一些', text: '1-2 1-3 1-4 2-3 2-4 3-4' },
  ],
  defaultInput: { n: 4, edges: [{ a: 1, b: 2, w: 1 }, { a: 1, b: 3, w: 1 }, { a: 2, b: 4, w: 1 }, { a: 3, b: 4, w: 1 }] },
  parse,
  format: (v) => formatEdges(v.edges, { weighted: false, directed: false }),
  random: () => {
    const n = randInt(4, 6)
    return { n, edges: randomGraph(n, randInt(0, 3), false) }
  },
  run: runStore,
  View: StoreView,
  sources: {
    c: String.raw`
#include <stdio.h>
int g[105][105],adj[105][105],deg[105];        //@init
int main(){
    int n,m,a,b;
    scanf("%d %d",&n,&m);
    for (int i=0;i<m;i++){
        scanf("%d %d",&a,&b);
        g[a][b]=g[b][a]=1;                      //@matrix
        adj[a][deg[a]++]=b;                     //@list
        adj[b][deg[b]++]=a;                     //@list
    }
    for (int u=1;u<=n;u++){                     //@done
        printf("%d:",u);
        for (int i=0;i<deg[u];i++) printf(" %d",adj[u][i]);
        printf("\n");
    }
    return 0;
}
`,
    cpp: String.raw`
#include <bits/stdc++.h>
using namespace std;
int g[105][105];                                //@init
vector<int> adj[105];
int main(){
    int n,m,a,b;
    cin>>n>>m;
    for (int i=0;i<m;i++){
        cin>>a>>b;
        g[a][b]=g[b][a]=1;                      //@matrix
        adj[a].push_back(b);                    //@list
        adj[b].push_back(a);                    //@list
    }
    for (int u=1;u<=n;u++){                     //@done
        cout<<u<<":";
        for (int v:adj[u]) cout<<" "<<v;
        cout<<endl;
    }
    return 0;
}
`,
    python: String.raw`
n, m = map(int, input().split())
g = [[0] * (n + 1) for _ in range(n + 1)]       #@init
adj = [[] for _ in range(n + 1)]
for _ in range(m):
    a, b = map(int, input().split())
    g[a][b] = g[b][a] = 1                       #@matrix
    adj[a].append(b)                            #@list
    adj[b].append(a)                            #@list
for u in range(1, n + 1):                       #@done
    print(str(u) + ":", *adj[u])
`,
    java: String.raw`
import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt(), m = sc.nextInt();
        int[][] g = new int[n + 1][n + 1];          //@init
        List<List<Integer>> adj = new ArrayList<>();
        for (int i = 0; i <= n; i++) adj.add(new ArrayList<>());
        for (int i = 0; i < m; i++) {
            int a = sc.nextInt(), b = sc.nextInt();
            g[a][b] = g[b][a] = 1;                  //@matrix
            adj.get(a).add(b);                      //@list
            adj.get(b).add(a);                      //@list
        }
        for (int u = 1; u <= n; u++) {              //@done
            StringBuilder sb = new StringBuilder(u + ":");
            for (int v : adj.get(u)) sb.append(' ').append(v);
            System.out.println(sb);
        }
    }
}
`,
  },
  problems: pickProblems('P5318', 'P3916'),
}
