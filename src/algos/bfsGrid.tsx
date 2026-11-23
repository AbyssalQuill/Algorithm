import { GridView, QueueRow, type GridCell } from '../components/GridView'
import { Stats } from '../components/Stats'
import { pickProblems } from '../data/problems'
import { Recorder } from '../engine/recorder'
import type { AlgoDef, Frame, ParseResult } from '../engine/types'
import { randInt } from './shared'

/** 迷宫：每一行是一个字符串，. 是路，# 是墙，S 是起点，T 是终点 */
export type Maze = string[]

type Pos = [number, number]

export interface BfsState {
  maze: Maze
  /** 起点到每个格子的最短步数；-1 表示还没有到过 */
  dist: number[][]
  queue: Pos[]
  cur: Pos | null
  /** 这一帧刚刚发现、放进队尾的格子 */
  fresh: Pos[]
  /** 找到终点后，沿着来路标出的一条最短路线 */
  path: Pos[]
  status: 'run' | 'found' | 'none'
  pops: number
}

const DX = [1, -1, 0, 0]
const DY = [0, 0, 1, -1]
const DIR = ['下', '上', '右', '左']

function locate(maze: Maze, ch: string): Pos {
  for (let i = 0; i < maze.length; i++) {
    const j = maze[i].indexOf(ch)
    if (j >= 0) return [i, j]
  }
  return [0, 0]
}

export function runBfs(maze: Maze): Frame<BfsState>[] {
  const rec = new Recorder<BfsState>()
  const n = maze.length
  const m = maze[0].length
  const [sx, sy] = locate(maze, 'S')
  const [tx, ty] = locate(maze, 'T')
  const dist = Array.from({ length: n }, () => new Array<number>(m).fill(-1))
  const par = new Map<string, Pos>()
  const queue: Pos[] = []
  let cur: Pos | null = null
  let fresh: Pos[] = []
  let path: Pos[] = []
  let pops = 0
  let status: BfsState['status'] = 'run'
  const snap = (): BfsState => ({ maze, dist, queue, cur, fresh, path, status, pops })
  const name = (p: Pos) => `(${p[0]}, ${p[1]})`

  dist[sx][sy] = 0
  queue.push([sx, sy])
  rec.push('init', snap(), `起点 S 在 ${name([sx, sy])}，它离自己的距离是 0。把它放进队列，从它开始一层一层向外探索。`)
  while (queue.length > 0) {
    const [x, y] = queue.shift()!
    cur = [x, y]
    fresh = []
    pops++
    rec.push('pop', snap(), `取出队头 ${name([x, y])}，它的距离是 ${dist[x][y]}。队列里排在前面的格子，离起点一定更近。`)
    if (x === tx && y === ty) {
      // 沿着“从哪个格子走过来的”一路回溯到起点
      const p: Pos[] = []
      let at: Pos | undefined = [x, y]
      while (at) {
        p.push(at)
        at = par.get(`${at[0]},${at[1]}`)
      }
      path = p.reverse()
      status = 'found'
      rec.push('found', snap(), `这个格子就是终点 T。BFS 是一层一层扩展的，第一次到达终点时走的一定是最短路线：${dist[x][y]} 步。`)
      break
    }
    const got: string[] = []
    for (let d = 0; d < 4; d++) {
      const nx = x + DX[d]
      const ny = y + DY[d]
      if (nx < 0 || nx >= n || ny < 0 || ny >= m) continue
      if (maze[nx][ny] === '#' || dist[nx][ny] !== -1) continue
      dist[nx][ny] = dist[x][y] + 1
      par.set(`${nx},${ny}`, [x, y])
      queue.push([nx, ny])
      fresh.push([nx, ny])
      got.push(`${DIR[d]}边 ${name([nx, ny])}`)
    }
    rec.push(
      'expand',
      snap(),
      got.length > 0
        ? `向下、上、右、左四个方向看一看：新发现 ${got.length} 个可以走的格子（${got.join('、')}），距离都是 ${dist[x][y] + 1}，依次放进队尾。`
        : '四个方向要么是墙、要么出了边界、要么已经到过，没有新的格子可以加入队列。',
    )
  }
  cur = null
  fresh = []
  if (status !== 'found') {
    status = 'none'
    rec.push('done', snap(), '队列空了，所有能到达的格子都探索过了，仍然没有到过终点：终点被墙挡住了，答案是 -1。')
  } else {
    rec.push('done', snap(), `输出 dist[T] = ${dist[tx][ty]}。图里的绿色格子是沿着“从哪里走来的”倒推出的一条最短路线。`)
  }
  return rec.frames
}

function BfsView({ frame }: { frame: Frame<BfsState> }) {
  const s = frame.state
  const key = (p: Pos) => `${p[0]},${p[1]}`
  const inQueue = new Set(s.queue.map(key))
  const onPath = new Set(s.path.map(key))
  const fresh = new Set(s.fresh.map(key))
  const rows: GridCell[][] = s.maze.map((line, i) =>
    [...line].map((ch, j): GridCell => {
      const k = `${i},${j}`
      if (ch === '#') return { wall: true }
      const d = s.dist[i][j]
      let tone: GridCell['tone'] = 'idle'
      if (d >= 0) tone = 'done'
      if (inQueue.has(k)) tone = 'compare'
      if (fresh.has(k)) tone = 'swap'
      if (s.cur && key(s.cur) === k) tone = 'swap'
      if (onPath.has(k)) tone = 'found'
      const text = ch === 'S' || ch === 'T' ? ch : d >= 0 ? d : ''
      return { text, tone, sub: ch === 'S' || ch === 'T' ? (d >= 0 ? d : undefined) : undefined }
    }),
  )
  const tx = s.maze.findIndex((l) => l.includes('T'))
  const tdist = tx >= 0 ? s.dist[tx][s.maze[tx].indexOf('T')] : -1
  return (
    <div className="viz">
      <GridView rows={rows} maxCell={56} />
      <div className="legend">
        <span><i className="sw tone-swap" />刚发现 / 正在处理</span>
        <span><i className="sw tone-compare" />在队列里</span>
        <span><i className="sw tone-done" />已经到过（数字是步数）</span>
        <span><i className="sw tone-found" />最短路线</span>
      </div>
      <QueueRow items={s.queue.map((p) => `(${p[0]},${p[1]})·${s.dist[p[0]][p[1]]}`)} label="队列" max={10} />
      {s.status === 'found' && <div className="target-row"><span className="verdict ok">最短路线：{tdist} 步</span></div>}
      {s.status === 'none' && <div className="target-row"><span className="verdict bad">到不了终点：输出 -1</span></div>}
      <Stats
        items={[
          ['已处理的格子', s.pops],
          ['队列里还有', s.queue.length],
        ]}
      />
    </div>
  )
}

function parse(text: string): ParseResult<Maze> {
  const rows = text.trim().split(/[\s/|｜]+/).filter(Boolean)
  if (rows.length < 2 || rows.length > 8) return { ok: false, error: '迷宫请写 2～8 行，每行之间用空格隔开。' }
  const w = rows[0].length
  if (w < 2 || w > 9) return { ok: false, error: '每一行请写 2～9 个字符。' }
  if (rows.some((r) => r.length !== w)) return { ok: false, error: '每一行的长度必须相同。' }
  if (rows.some((r) => /[^.#ST]/.test(r))) return { ok: false, error: '只能使用 .（路）、#（墙）、S（起点）、T（终点）这四种字符。' }
  const all = rows.join('')
  if ([...all].filter((c) => c === 'S').length !== 1) return { ok: false, error: '需要恰好一个起点 S。' }
  if ([...all].filter((c) => c === 'T').length !== 1) return { ok: false, error: '需要恰好一个终点 T。' }
  return { ok: true, value: rows }
}

function randomMaze(): Maze {
  const n = randInt(5, 7)
  const m = randInt(5, 8)
  const g: string[][] = Array.from({ length: n }, () => Array.from({ length: m }, (): string => (Math.random() < 0.28 ? '#' : '.')))
  const s: Pos = [randInt(0, n - 1), 0]
  const t: Pos = [randInt(0, n - 1), m - 1]
  g[s[0]][s[1]] = 'S'
  g[t[0]][t[1]] = 'T'
  return g.map((r) => r.join(''))
}

export const bfsGrid: AlgoDef<Maze, BfsState> = {
  id: 'bfs-grid',
  title: '广度优先搜索：迷宫最短路',
  tagline: '从起点出发，像水波一样一层一层向外扩散，第一次碰到终点时走的就是最短路线',
  kind: '算法',
  intro: [
    '在迷宫里找最短路线，广度优先搜索（BFS）是最自然的办法。想象在起点滴下一滴水：它先流到距离为 1 的所有格子，再流到距离为 2 的所有格子，一层一层向外扩散。因为是按距离从近到远的顺序处理，所以第一次碰到终点时，用的步数一定是最少的。',
    '实现靠的是队列。队头永远是当前最近的格子：取出它，把它四周还没到过的格子放进队尾，并把它们的距离记为“当前距离加一”。队列保证了“先发现的先处理”，这正好就是一层一层向外扩的顺序。',
  ],
  points: [
    '用 dist 数组记录每个格子的最短步数，初始为 -1。-1 同时起到“还没到过”的标记，不需要另外再开 visited 数组。',
    '一个格子在第一次被发现时，距离就已经是最短的，并且立刻放进队列。以后再遇到它都跳过，所以每个格子最多入队一次。',
    '用方向数组 dx、dy 来循环四个方向，比把四个方向各写一遍更短，也不容易写错。',
    '要输出具体的路线，再开一个数组记录每个格子是从哪个格子走来的，找到终点后倒着走回起点。',
  ],
  pitfalls: [
    '先判断下标有没有越界，再去读 g[nx][ny]，顺序反了会读到界外。',
    '把标记距离的步骤放到“取出队头”的时候而不是“放入队列”的时候，同一个格子会被多次放进队列，运行时间会变得很慢。',
    '这个办法只适用于每一步代价相同的情况。如果每条边的权值不同，要改用 Dijkstra 算法。',
  ],
  complexity: { time: 'O(n·m)', space: 'O(n·m)', note: '每个格子最多入队、出队一次，每次检查 4 个方向。' },
  inputHint: '每一行之间用空格隔开：. 是路，# 是墙，S 是起点，T 是终点（最多 8 行，每行最多 9 个字符）。',
  presets: [
    { label: '绕远路', text: 'S..#.... .#.#.##. .#...#.. .####.#. ......#T' },
    { label: '没有路', text: 'S..#.... ...#.... ...#..T. ...#....' },
    { label: '空旷', text: 'S...... ....... ....... ......T' },
  ],
  defaultInput: ['S..#....', '.#.#.##.', '.#...#..', '.####.#.', '......#T'],
  parse,
  format: (v) => v.join(' '),
  random: randomMaze,
  run: runBfs,
  View: BfsView,
  sources: {
    c: String.raw`
#include <stdio.h>
int dx[4]={1,-1,0,0},dy[4]={0,0,1,-1};
char g[105][105];
int dist[105][105],qx[10005],qy[10005];
int main(){
    int n,m,sx=0,sy=0,tx=0,ty=0,head=0,tail=0;
    scanf("%d %d",&n,&m);
    for (int i=0;i<n;i++){
        scanf("%s",g[i]);
        for (int j=0;j<m;j++){
            if (g[i][j]=='S') sx=i,sy=j;
            if (g[i][j]=='T') tx=i,ty=j;
            dist[i][j]=-1;
        }
    }
    dist[sx][sy]=0;                                     //@init
    qx[tail]=sx; qy[tail++]=sy;                         //@init
    while (head<tail){
        int x=qx[head],y=qy[head++];                    //@pop
        if (x==tx&&y==ty) break;                        //@found
        for (int d=0;d<4;d++){                          //@expand
            int nx=x+dx[d],ny=y+dy[d];                  //@expand
            if (nx<0||nx>=n||ny<0||ny>=m) continue;     //@expand
            if (g[nx][ny]=='#'||dist[nx][ny]!=-1) continue;   //@expand
            dist[nx][ny]=dist[x][y]+1;                  //@expand
            qx[tail]=nx; qy[tail++]=ny;                 //@expand
        }
    }
    printf("%d\n",dist[tx][ty]);                        //@done
    return 0;
}
`,
    cpp: String.raw`
#include <bits/stdc++.h>
using namespace std;
int dx[4]={1,-1,0,0},dy[4]={0,0,1,-1};
int main(){
    int n,m,sx=0,sy=0,tx=0,ty=0;
    cin>>n>>m;
    vector<string> g(n);
    vector<vector<int>> dist(n,vector<int>(m,-1));
    for (int i=0;i<n;i++){
        cin>>g[i];
        for (int j=0;j<m;j++){
            if (g[i][j]=='S') sx=i,sy=j;
            if (g[i][j]=='T') tx=i,ty=j;
        }
    }
    queue<pair<int,int>> q;
    dist[sx][sy]=0;                                     //@init
    q.push({sx,sy});                                    //@init
    while (!q.empty()){
        auto [x,y]=q.front();                           //@pop
        q.pop();                                        //@pop
        if (x==tx&&y==ty) break;                        //@found
        for (int d=0;d<4;d++){                          //@expand
            int nx=x+dx[d],ny=y+dy[d];                  //@expand
            if (nx<0||nx>=n||ny<0||ny>=m) continue;     //@expand
            if (g[nx][ny]=='#'||dist[nx][ny]!=-1) continue;   //@expand
            dist[nx][ny]=dist[x][y]+1;                  //@expand
            q.push({nx,ny});                            //@expand
        }
    }
    cout<<dist[tx][ty]<<endl;                           //@done
    return 0;
}
`,
    python: String.raw`
from collections import deque

n, m = map(int, input().split())
g = [input() for _ in range(n)]
dist = [[-1] * m for _ in range(n)]
for i in range(n):
    for j in range(m):
        if g[i][j] == 'S':
            sx, sy = i, j
        if g[i][j] == 'T':
            tx, ty = i, j
dx = [1, -1, 0, 0]
dy = [0, 0, 1, -1]
q = deque()
dist[sx][sy] = 0                                        #@init
q.append((sx, sy))                                      #@init
while q:
    x, y = q.popleft()                                  #@pop
    if (x, y) == (tx, ty):                              #@found
        break                                           #@found
    for d in range(4):                                  #@expand
        nx, ny = x + dx[d], y + dy[d]                   #@expand
        if nx < 0 or nx >= n or ny < 0 or ny >= m:      #@expand
            continue                                    #@expand
        if g[nx][ny] == '#' or dist[nx][ny] != -1:      #@expand
            continue                                    #@expand
        dist[nx][ny] = dist[x][y] + 1                   #@expand
        q.append((nx, ny))                              #@expand
print(dist[tx][ty])                                     #@done
`,
    java: String.raw`
import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt(), m = sc.nextInt();
        int[] dx = {1, -1, 0, 0}, dy = {0, 0, 1, -1};
        String[] g = new String[n];
        int[][] dist = new int[n][m];
        int sx = 0, sy = 0, tx = 0, ty = 0;
        for (int i = 0; i < n; i++) {
            g[i] = sc.next();
            for (int j = 0; j < m; j++) {
                dist[i][j] = -1;
                if (g[i].charAt(j) == 'S') { sx = i; sy = j; }
                if (g[i].charAt(j) == 'T') { tx = i; ty = j; }
            }
        }
        Queue<int[]> q = new ArrayDeque<>();
        dist[sx][sy] = 0;                                       //@init
        q.add(new int[]{sx, sy});                               //@init
        while (!q.isEmpty()) {
            int[] cur = q.poll();                               //@pop
            int x = cur[0], y = cur[1];                         //@pop
            if (x == tx && y == ty) break;                      //@found
            for (int d = 0; d < 4; d++) {                       //@expand
                int nx = x + dx[d], ny = y + dy[d];             //@expand
                if (nx < 0 || nx >= n || ny < 0 || ny >= m) continue;   //@expand
                if (g[nx].charAt(ny) == '#' || dist[nx][ny] != -1) continue;   //@expand
                dist[nx][ny] = dist[x][y] + 1;                  //@expand
                q.add(new int[]{nx, ny});                       //@expand
            }
        }
        System.out.println(dist[tx][ty]);                       //@done
    }
}
`,
  },
  problems: pickProblems('P1443', 'P1162'),
}
