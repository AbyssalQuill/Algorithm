import { GraphView, type GEdge, type GNode } from '../components/GraphView'
import { Stats } from '../components/Stats'
import { pickProblems } from '../data/problems'
import { Recorder } from '../engine/recorder'
import type { AlgoDef, Frame, ParseResult } from '../engine/types'
import { formatGraph, type ParsedEdge, randInt, randomGraph, readGraph, readInput } from './shared'

export interface KruskalInput {
  n: number
  edges: ParsedEdge[]
}

type Status = 'wait' | 'accept' | 'reject' | 'cur'

export interface KruskalState {
  n: number
  /** 按权值从小到大排好的边 */
  sorted: ParsedEdge[]
  status: Status[]
  /** 每个结点所在集合的代表 */
  comp: number[]
  total: number
  accepted: number
  finished: boolean
}

export function runKruskal({ n, edges }: KruskalInput): Frame<KruskalState>[] {
  const rec = new Recorder<KruskalState>()
  const sorted = edges.map((e, i) => ({ e, i })).sort((x, y) => x.e.w - y.e.w || x.i - y.i).map((x) => x.e)
  const status: Status[] = sorted.map(() => 'wait')
  const fa = Array.from({ length: n + 1 }, (_, i) => i)
  const find = (x: number): number => (fa[x] === x ? x : (fa[x] = find(fa[x])))
  let total = 0
  let accepted = 0
  let finished = false
  const snap = (): KruskalState => ({ n, sorted, status, comp: fa.map((_, i) => (i === 0 ? 0 : find(i))), total, accepted, finished })

  rec.push('init', snap(), `最小生成树：用 ${n - 1} 条边把 ${n} 个结点全部连起来，并且边的权值之和最小。Kruskal 算法先把所有的边按权值从小到大排好队，每个结点最开始自己是一个集合。`)
  sorted.forEach((e, i) => {
    status[i] = 'cur'
    const ra = find(e.a)
    const rb = find(e.b)
    rec.push('consider', snap(), `看权值最小的待选边 ${e.a}-${e.b}（权值 ${e.w}）：${e.a} 在以 ${ra} 为代表的集合里，${e.b} 在以 ${rb} 为代表的集合里。`)
    if (ra === rb) {
      status[i] = 'reject'
      rec.push('reject', snap(), `两端已经在同一个集合里（已经连通），再加这条边就会形成环，放弃它。`)
      return
    }
    fa[ra] = rb
    total += e.w
    accepted++
    status[i] = 'accept'
    rec.push('accept', snap(), `两端属于不同的集合，选下这条边，并把两个集合合并。目前选了 ${accepted} 条边，权值之和 ${total}。`)
  })
  finished = true
  rec.push('done', snap(), accepted === n - 1 ? `所有的边都看过了，一共选了 ${accepted} 条边，最小生成树的总权值是 ${total}。` : `所有的边都看过了，只选出 ${accepted} 条，少于 ${n - 1} 条，说明图本身不连通，不存在生成树。`)
  return rec.frames
}

export const mstWeight = (s: KruskalState) => (s.accepted === s.n - 1 ? s.total : -1)

function KruskalView({ frame }: { frame: Frame<KruskalState> }) {
  const s = frame.state
  const tone = (st: Status): GEdge['tone'] => (st === 'accept' ? 'done' : st === 'reject' ? 'swap' : st === 'cur' ? 'compare' : 'idle')
  const edges: GEdge[] = s.sorted.map((e, i) => ({ a: e.a, b: e.b, w: e.w, tone: tone(s.status[i]) }))
  const nodes: GNode[] = Array.from({ length: s.n }, (_, i): GNode => ({ id: i + 1, tone: 'idle', sub: s.comp[i + 1] === i + 1 ? '代表' : `→${s.comp[i + 1]}` }))
  return (
    <div className="viz">
      <GraphView nodes={nodes} edges={edges} height={280} />
      <div className="row-label">按权值排好的边（绿 = 选中，红 = 放弃，黄 = 正在看）</div>
      <div className="outline">
        {s.sorted.map((e, i) => (
          <span key={i} className={`qchip tone-${s.status[i] === 'accept' ? 'done' : s.status[i] === 'reject' ? 'swap' : s.status[i] === 'cur' ? 'compare' : 'idle'}`} style={{ background: 'var(--t-bg)', borderColor: 'var(--t-bd)' }}>
            {e.a}-{e.b}:{e.w}
          </span>
        ))}
      </div>
      <Stats items={[['已选的边', `${s.accepted} / ${s.n - 1}`], ['总权值', s.total]]} />
    </div>
  )
}

function parse(text: string): ParseResult<KruskalInput> {
  return readInput(text, (r) => {
    const g = readGraph(r, { weighted: true, directed: false, maxN: 7, maxM: 11, minM: 2 })
    r.end()
    return g
  })
}

export const kruskal: AlgoDef<KruskalInput, KruskalState> = {
  id: 'kruskal',
  title: 'Kruskal',
  tagline: '把边按权值排好队，从小到大挑，只要不形成环就选下',
  kind: '算法',
  slug: 'mst',
  name: '最小生成树',
  type: '选边',
  statement: {
    desc: [
      '给定一张带权无向图，从中选出若干条边，使所有结点连通，并且选出的边的权值之和最小。求这个最小的权值和；如果图本身不连通，输出 -1。',
    ],
    input: [
      '第一行两个整数 n 和 m（2 ≤ n ≤ 7，2 ≤ m ≤ 11），表示结点数和边数。',
      '接下来 m 行，每行三个整数 a、b、w，表示 a 和 b 之间有一条权值为 w 的边（1 ≤ w ≤ 99，没有重边和自环）。',
    ],
    output: [
      '一行一个整数，是最小的权值和；图不连通时输出 -1。',
    ],
  },
  intro: [
    '一个带权的无向连通图里，用最少的边（n-1 条）把所有结点连成一棵树，并且让这些边的权值之和最小，这样的树叫最小生成树。修路、铺管道、拉网线都是这类问题：既要全部连通，又要花费最少。',
    'Kruskal 的做法是贪心：把所有边按权值从小到大排好，依次检查。如果这条边的两端还不连通，就选下它；如果两端已经连通了，再加就会形成环，直接放弃。判断“是否已经连通”，正是并查集最擅长的事。',
  ],
  points: [
    '先排序，再依次处理每条边，用并查集判断两个端点是否在同一个集合里。',
    '选下一条边时，同时把两个集合合并；选够 n-1 条边就可以提前结束。',
    '排序是主要的时间开销，所以总时间是 O(m log m)，m 是边数。',
    '如果最后选出的边数不足 n-1，说明图不连通，没有最小生成树。',
  ],
  pitfalls: [
    '没有排序，或者排序的方向反了，得到的就不是最小的树。',
    '只判断边是否出现过，而没有用并查集判断连通性，会漏掉间接连通的情形而形成环。',
    '权值相同的边先后顺序不同，选出的树可能不同，但总权值一定相同。',
  ],
  complexity: { time: 'O(m log m)', space: 'O(n + m)', note: '时间主要花在对 m 条边排序上；并查集的操作近似常数。' },
  presets: [
    { label: '四个结点', text: '4 5\n1 2 4\n1 3 2\n2 3 1\n2 4 5\n3 4 8' },
    { label: '有一个环要放弃', text: '5 6\n1 2 1\n2 3 2\n1 3 3\n3 4 4\n4 5 5\n2 5 6' },
    { label: '图不连通', text: '5 3\n1 2 3\n2 3 5\n4 5 2' },
  ],
  defaultInput: { n: 4, edges: [{ a: 1, b: 2, w: 4 }, { a: 1, b: 3, w: 2 }, { a: 2, b: 3, w: 1 }, { a: 2, b: 4, w: 5 }, { a: 3, b: 4, w: 8 }] },
  parse,
  format: (v) => formatGraph(v.n, v.edges, true),
  answer: (v) => {
    const fa = Array.from({ length: v.n + 1 }, (_, i) => i)
    const find = (x: number): number => (fa[x] === x ? x : (fa[x] = find(fa[x])))
    let total = 0
    let cnt = 0
    for (const e of [...v.edges].sort((x, y) => x.w - y.w)) {
      const ra = find(e.a)
      const rb = find(e.b)
      if (ra === rb) continue
      fa[ra] = rb
      total += e.w
      cnt++
    }
    return String(cnt === v.n - 1 ? total : -1)
  },
  random: () => {
    const n = randInt(5, 7)
    return { n, edges: randomGraph(n, randInt(2, 4), true).filter((_, i, a) => Math.random() < 0.92 || i < a.length - 3) }
  },
  run: runKruskal,
  View: KruskalView,
  sources: {
    c: String.raw`
#include <stdio.h>
int fa[105],ea[105],eb[105],ew[105];
int find(int x){
    return fa[x]==x?x:(fa[x]=find(fa[x]));
}
int main(){
    int n,m;
    scanf("%d %d",&n,&m);
    for (int i=0;i<m;i++) scanf("%d %d %d",&ea[i],&eb[i],&ew[i]);
    for (int i=1;i<m;i++){                  // 把边按权值从小到大排好队           //@init
        int a=ea[i],b=eb[i],w=ew[i],j=i-1;
        while (j>=0&&ew[j]>w){
            ea[j+1]=ea[j]; eb[j+1]=eb[j]; ew[j+1]=ew[j];
            j--;
        }
        ea[j+1]=a; eb[j+1]=b; ew[j+1]=w;
    }
    for (int i=1;i<=n;i++) fa[i]=i;
    int total=0,cnt=0;
    for (int i=0;i<m;i++){
        int ra=find(ea[i]),rb=find(eb[i]);  // 找出这条边两个端点所在集合的根        //@consider
        if (ra==rb) continue;               // 根相同，加进来会成环，放弃          //@reject
        fa[ra]=rb;                          // 连接了两个不同的集合，选下这条边       //@accept
        total+=ew[i];                                                 //@accept
        cnt++;                                                        //@accept
    }
    printf("%d\n",cnt==n-1?total:-1);       // 选够 n-1 条边就连通了，否则输出 -1  //@done
    return 0;
}
`,
    cpp: String.raw`
#include <bits/stdc++.h>
using namespace std;
struct E{
    int a,b,w;
};
int fa[105];
int find(int x){
    return fa[x]==x?x:(fa[x]=find(fa[x]));
}
int main(){
    int n,m;
    cin>>n>>m;
    vector<E> es(m);
    for (auto &e:es) cin>>e.a>>e.b>>e.w;
    stable_sort(es.begin(),es.end(),[](const E &x,const E &y){  // 把边按权值从小到大排好队  //@init
        return x.w<y.w;                                                          //@init
    });                                                                          //@init
    for (int i=1;i<=n;i++) fa[i]=i;
    int total=0,cnt=0;
    for (auto &e:es){
        int ra=find(e.a),rb=find(e.b);        // 找出这条边两个端点所在集合的根                 //@consider
        if (ra==rb) continue;                 // 根相同，加进来会成环，放弃                   //@reject
        fa[ra]=rb;                            // 连接了两个不同的集合，选下这条边                //@accept
        total+=e.w;                                                              //@accept
        cnt++;                                                                   //@accept
    }
    cout<<(cnt==n-1?total:-1)<<endl;          // 选够 n-1 条边就连通了，否则输出 -1           //@done
    return 0;
}
`,
    python: String.raw`
def find(x):
    if fa[x]!=x:
        fa[x]=find(fa[x])
    return fa[x]

n,m=map(int,input().split())
es=[tuple(map(int,input().split())) for _ in range(m)]
es.sort(key=lambda e: e[2])       # 把边按权值从小到大排好队           #@init
fa=list(range(n+1))
total=cnt=0
for a,b,w in es:
    ra,rb=find(a),find(b)         # 找出这条边两个端点所在集合的根        #@consider
    if ra==rb:
        continue                  # 根相同，加进来会成环，放弃          #@reject
    fa[ra]=rb                     # 连接了两个不同的集合，选下这条边       #@accept
    total+=w                                               #@accept
    cnt+=1                                                 #@accept
print(total if cnt==n-1 else -1)  # 选够 n-1 条边就连通了，否则输出 -1  #@done
`,
    java: String.raw`
import java.util.*;

public class Main{
    static int[] fa=new int[105];

    static int find(int x){
        return fa[x]==x?x:(fa[x]=find(fa[x]));
    }

    public static void main(String[] args){
        Scanner sc=new Scanner(System.in);
        int n=sc.nextInt(),m=sc.nextInt();
        int[][] es=new int[m][3];
        for (int i=0;i<m;i++) for (int j=0;j<3;j++) es[i][j]=sc.nextInt();
        Arrays.sort(es,(x,y)->x[2]-y[2]);     // 把边按权值从小到大排好队             //@init
        for (int i=1;i<=n;i++) fa[i]=i;
        int total=0,cnt=0;
        for (int[] e:es){
            int ra=find(e[0]),rb=find(e[1]);  // 找出这条边两个端点所在集合的根          //@consider
            if (ra==rb) continue;             // 根相同，加进来会成环，放弃            //@reject
            fa[ra]=rb;                        // 连接了两个不同的集合，选下这条边         //@accept
            total+=e[2];                                                  //@accept
            cnt++;                                                        //@accept
        }
        System.out.println(cnt==n-1?total:-1);  // 选够 n-1 条边就连通了，否则输出 -1  //@done
    }
}
`,
  },
  problems: pickProblems('P3366', 'P1546'),
}
