import { GridView, type GridCell } from '../components/GridView'
import { Stats } from '../components/Stats'
import { pickProblems } from '../data/problems'
import { Recorder } from '../engine/recorder'
import type { Example, Frame, ParseResult } from '../engine/types'
import { randInt, readInput } from './shared'

/** 地图：每一行是一个字符串，# 是陆地，. 是水 */
export type LandMap = string[]

type Pos = [number, number]

export interface IslandState {
  map: LandMap
  /** 每个格子属于第几座岛；0 表示还没有被访问到（或者是水） */
  id: number[][]
  /** 递归栈：现在正停留在哪些格子上，最后一个是当前格子 */
  path: Pos[]
  cur: Pos | null
  count: number
  done: boolean
}

const DX = [1, -1, 0, 0]
const DY = [0, 0, 1, -1]

export function runIsland(map: LandMap): Frame<IslandState>[] {
  const rec = new Recorder<IslandState>()
  const n = map.length
  const m = map[0].length
  const id = Array.from({ length: n }, () => new Array<number>(m).fill(0))
  const path: Pos[] = []
  let cur: Pos | null = null
  let count = 0
  let done = false
  const snap = (): IslandState => ({ map, id, path, cur, count, done })
  const name = (p: Pos) => `(${p[0]}, ${p[1]})`

  rec.push('init', snap(), '岛屿的个数用 cnt 记录，开始是 0。接下来按行扫描整张地图，遇到一块还没有访问过的陆地，就说明发现了一座新岛。')

  const dfs = (x: number, y: number, from: Pos | null) => {
    id[x][y] = count
    path.push([x, y])
    cur = [x, y]
    rec.push('visit', snap(), from ? `从 ${name(from)} 走到 ${name([x, y])}，把它也标记为第 ${count} 座岛。` : `从 ${name([x, y])} 出发做 DFS，把它标记为第 ${count} 座岛。`)
    for (let d = 0; d < 4; d++) {
      const nx = x + DX[d]
      const ny = y + DY[d]
      if (nx < 0 || nx >= n || ny < 0 || ny >= m) continue
      if (map[nx][ny] !== '#' || id[nx][ny] !== 0) continue
      dfs(nx, ny, [x, y])
    }
    cur = [x, y]
    rec.push('back', snap(), `${name([x, y])} 的四个方向都看完了，函数返回，退回上一层。`)
    path.pop()
  }

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < m; j++) {
      if (map[i][j] === '#' && id[i][j] === 0) {
        count++
        rec.push('start', snap(), `扫描到 ${name([i, j])}：这是陆地，而且没有访问过，是一座新的岛。cnt 加一，变成 ${count}，然后用 DFS 把和它相连的陆地全部标记。`)
        dfs(i, j, null)
      }
    }
  }
  cur = null
  done = true
  rec.push('done', snap(), count === 0 ? '整张地图扫完，一块陆地也没有，岛屿数量是 0。' : `整张地图扫完了，一共发现 ${count} 座岛，输出 ${count}。`)
  return rec.frames
}

const ISLAND_TONES: GridCell['tone'][] = ['done', 'found', 'compare']

function IslandView({ frame }: { frame: Frame<IslandState> }) {
  const s = frame.state
  const onPath = new Set(s.path.map((p) => `${p[0]},${p[1]}`))
  const rows: GridCell[][] = s.map.map((line, i) =>
    [...line].map((ch, j): GridCell => {
      if (ch !== '#') return { tone: 'dim' }
      const k = s.id[i][j]
      if (s.cur && s.cur[0] === i && s.cur[1] === j) return { text: k, tone: 'swap' }
      if (k === 0) return { tone: 'idle' }
      return { text: k, tone: onPath.has(`${i},${j}`) ? 'compare' : ISLAND_TONES[(k - 1) % ISLAND_TONES.length] }
    }),
  )
  return (
    <div className="viz">
      <GridView rows={rows} maxCell={56} />
      <div className="legend">
        <span><i className="sw tone-swap" />当前所在的格子</span>
        <span><i className="sw tone-compare" />递归栈里的格子</span>
        <span><i className="sw tone-done" />已经标记（数字是岛的编号）</span>
        <span><i className="sw tone-idle" />还没访问的陆地</span>
      </div>
      <div className="outline">
        <span className="row-label">递归栈</span>
        {s.path.length === 0 && <span className="qrow-empty">空</span>}
        {s.path.map((p, i) => (
          <span key={i} className="qchip">
            ({p[0]},{p[1]})
          </span>
        ))}
      </div>
      <Stats items={[['岛屿数量 cnt', s.count], ['递归深度', s.path.length]]} />
    </div>
  )
}

function parse(text: string): ParseResult<LandMap> {
  return readInput(text, (r) => {
    const n = r.int('n', 2, 7)
    const m = r.int('m', 2, 9)
    const rows = Array.from({ length: n }, (_, i) => r.word(`第 ${i + 1} 行`, new RegExp(`^[.#]{${m}}$`), `要恰好有 ${m} 个字符，只能用 . 和 #`))
    r.end()
    return rows
  })
}

/** 用不递归的写法数岛屿，作为“标准答案” */
export function countIslands(map: LandMap): number {
  const n = map.length
  const m = map[0].length
  const seen = Array.from({ length: n }, () => new Array<boolean>(m).fill(false))
  let cnt = 0
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < m; j++) {
      if (map[i][j] !== '#' || seen[i][j]) continue
      cnt++
      const st: Pos[] = [[i, j]]
      seen[i][j] = true
      while (st.length) {
        const [x, y] = st.pop()!
        for (let d = 0; d < 4; d++) {
          const nx = x + DX[d]
          const ny = y + DY[d]
          if (nx < 0 || nx >= n || ny < 0 || ny >= m || map[nx][ny] !== '#' || seen[nx][ny]) continue
          seen[nx][ny] = true
          st.push([nx, ny])
        }
      }
    }
  }
  return cnt
}

const text = (rows: string[]) => `${rows.length} ${rows[0].length}\n${rows.join('\n')}`

export const dfsIsland: Example<LandMap, IslandState> = {
  slug: 'islands',
  name: '岛屿数量',
  type: '连通块计数',
  statement: {
    desc: [
      '给定一张 n 行 m 列的地图，# 表示陆地，. 表示水。上、下、左、右相邻的陆地连在一起，算作同一座岛（斜着相邻的不算相连）。请数一数地图上一共有多少座岛。',
    ],
    input: ['第一行两个整数 n 和 m（2 ≤ n ≤ 7，2 ≤ m ≤ 9）。', '接下来 n 行，每行一个长度为 m 的字符串，只包含 # 和 .。'],
    output: ['一行一个整数，是岛屿的数量；一块陆地也没有时输出 0。'],
  },
  idea: [
    '这是 DFS 最常见的另一种用法：数连通块。把每块陆地看成图里的结点，上下左右相邻的陆地之间有一条边，一座岛就是图里的一个连通块。',
    '做法是按行扫描整张地图。遇到一块还没有访问过的陆地，就说明发现了一座新的岛，计数加一，然后从这块陆地出发做一次 DFS，把整座岛上相连的陆地都标记为“已经访问”。后面再扫描到这座岛的任何一块陆地，因为已经标记过，就不会重复计数。',
    '和上一道例题相比，这里的“图”没有显式地存下来，相邻的关系直接由坐标推出：向四个方向各走一步，检查有没有越界、是不是陆地、有没有访问过。',
  ],
  complexity: { time: 'O(n·m)', space: 'O(n·m)', note: '每个格子最多被访问一次，每次检查 4 个方向。递归最深可能走遍整座岛，所以栈的深度最多是 n·m。' },
  presets: [
    { label: '一座环形岛', text: text(['.####.', '.#..#.', '.####.', '......']) },
    { label: '零散的小岛', text: text(['#.#.#.#', '.......', '#.#.#.#', '.......']) },
    { label: '斜着不算相连', text: text(['#..', '.#.', '..#']) },
    { label: '没有陆地', text: text(['....', '....']) },
  ],
  defaultInput: ['##..#..', '#...##.', '..#....', '.###..#', '....#.#'],
  parse,
  format: (v) => text(v),
  random: () => {
    const n = randInt(4, 6)
    const m = randInt(5, 8)
    const rows = Array.from({ length: n }, () => Array.from({ length: m }, () => (Math.random() < 0.42 ? '#' : '.')).join(''))
    return rows
  },
  answer: (v) => String(countIslands(v)),
  run: runIsland,
  View: IslandView,
  sources: {
    c: String.raw`
#include <stdio.h>
int n,m;
char g[10][12];
int vis[10][10];
int dx[4]={1,-1,0,0},dy[4]={0,0,1,-1};
void dfs(int x,int y){
    vis[x][y]=1;                            //@visit
    for (int d=0;d<4;d++){
        int nx=x+dx[d],ny=y+dy[d];
        if (nx<0||nx>=n||ny<0||ny>=m) continue;
        if (g[nx][ny]!='#'||vis[nx][ny]) continue;
        dfs(nx,ny);
    }
}                                           //@back
int main(){
    int cnt=0;                              //@init
    scanf("%d %d",&n,&m);
    for (int i=0;i<n;i++) scanf("%s",g[i]);
    for (int i=0;i<n;i++){
        for (int j=0;j<m;j++){
            if (g[i][j]=='#'&&!vis[i][j]){
                cnt++;                      //@start
                dfs(i,j);
            }
        }
    }
    printf("%d\n",cnt);                     //@done
    return 0;
}
`,
    cpp: String.raw`
#include <bits/stdc++.h>
using namespace std;
int n,m;
string g[10];
bool vis[10][10];
int dx[4]={1,-1,0,0},dy[4]={0,0,1,-1};
void dfs(int x,int y){
    vis[x][y]=true;                         //@visit
    for (int d=0;d<4;d++){
        int nx=x+dx[d],ny=y+dy[d];
        if (nx<0||nx>=n||ny<0||ny>=m) continue;
        if (g[nx][ny]!='#'||vis[nx][ny]) continue;
        dfs(nx,ny);
    }
}                                           //@back
int main(){
    int cnt=0;                              //@init
    cin>>n>>m;
    for (int i=0;i<n;i++) cin>>g[i];
    for (int i=0;i<n;i++){
        for (int j=0;j<m;j++){
            if (g[i][j]=='#'&&!vis[i][j]){
                cnt++;                      //@start
                dfs(i,j);
            }
        }
    }
    cout<<cnt<<endl;                        //@done
    return 0;
}
`,
    python: String.raw`
n,m=map(int,input().split())
g=[input() for _ in range(n)]
vis=[[False]*m for _ in range(n)]
DIRS=[(1,0),(-1,0),(0,1),(0,-1)]
def dfs(x,y):
    vis[x][y]=True                          #@visit
    for dx,dy in DIRS:
        nx,ny=x+dx,y+dy
        if nx<0 or nx>=n or ny<0 or ny>=m:
            continue
        if g[nx][ny]!='#' or vis[nx][ny]:
            continue
        dfs(nx,ny)
    return                                  #@back
cnt=0                                       #@init
for i in range(n):
    for j in range(m):
        if g[i][j]=='#' and not vis[i][j]:
            cnt+=1                          #@start
            dfs(i,j)
print(cnt)                                  #@done
`,
    java: String.raw`
import java.util.*;

public class Main{
    static int n,m;
    static String[] g;
    static boolean[][] vis=new boolean[10][10];
    static int[] dx={1,-1,0,0},dy={0,0,1,-1};

    static void dfs(int x,int y){
        vis[x][y]=true;                     //@visit
        for (int d=0;d<4;d++){
            int nx=x+dx[d],ny=y+dy[d];
            if (nx<0||nx>=n||ny<0||ny>=m) continue;
            if (g[nx].charAt(ny)!='#'||vis[nx][ny]) continue;
            dfs(nx,ny);
        }
    }                                       //@back

    public static void main(String[] args){
        Scanner sc=new Scanner(System.in);
        n=sc.nextInt();
        m=sc.nextInt();
        g=new String[n];
        for (int i=0;i<n;i++) g[i]=sc.next();
        int cnt=0;                          //@init
        for (int i=0;i<n;i++){
            for (int j=0;j<m;j++){
                if (g[i].charAt(j)=='#'&&!vis[i][j]){
                    cnt++;                  //@start
                    dfs(i,j);
                }
            }
        }
        System.out.println(cnt);            //@done
    }
}
`,
  },
  problems: pickProblems('P1451', 'P1596'),
}
