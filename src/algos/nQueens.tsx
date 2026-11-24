import { GridView, type GridCell } from '../components/GridView'
import { Stats } from '../components/Stats'
import { pickProblems } from '../data/problems'
import { Recorder } from '../engine/recorder'
import type { AlgoDef, Frame, ParseResult } from '../engine/types'
import { readInput } from './shared'

export interface QueensState {
  n: number
  /** col[r] = 第 r 行皇后所在的列；-1 表示这一行还没放 */
  col: number[]
  /** 正在尝试的格子 */
  cell: [number, number] | null
  /** 与它冲突的已放皇后所在的行（冲突时才有） */
  clash: number | null
  kind: 'place' | 'conflict' | 'back' | 'solution' | 'none'
  count: number
  first: number[] | null
}

export function runQueens(n: number): Frame<QueensState>[] {
  const rec = new Recorder<QueensState>()
  const col: number[] = new Array(n).fill(-1)
  let cell: [number, number] | null = null
  let clash: number | null = null
  let kind: QueensState['kind'] = 'none'
  let count = 0
  let first: number[] | null = null
  const snap = (): QueensState => ({ n, col, cell, clash, kind, count, first })

  rec.push('init', snap(), `在 ${n}×${n} 的棋盘上放 ${n} 个皇后，让任意两个皇后都不在同一行、同一列、同一条斜线上。每行恰好放一个，所以逐行放：第 r 行依次试每一列，能放就放下，接着放下一行；放不下去就退回来，把上一行的皇后换个位置。这种“试探、不行就退回”的办法叫回溯。`)
  const conflictWith = (r: number, c: number): number | null => {
    for (let i = 0; i < r; i++) if (col[i] === c || Math.abs(col[i] - c) === r - i) return i
    return null
  }
  const dfs = (r: number) => {
    if (r === n) {
      count++
      if (!first) first = [...col]
      cell = null
      clash = null
      kind = 'solution'
      rec.push('solution', snap(), `${n} 行都放好了，找到一个解（第 ${count} 个）：每一行的皇后所在的列依次是 ${col.map((c) => c + 1).join('、')}。`)
      return
    }
    for (let c = 0; c < n; c++) {
      const bad = conflictWith(r, c)
      cell = [r, c]
      if (bad !== null) {
        clash = bad
        kind = 'conflict'
        rec.push('conflict', snap(), col[bad] === c ? `第 ${r + 1} 行第 ${c + 1} 列：和第 ${bad + 1} 行的皇后在同一列，不能放。` : `第 ${r + 1} 行第 ${c + 1} 列：和第 ${bad + 1} 行第 ${col[bad] + 1} 列的皇后在同一条斜线上，不能放。`)
        continue
      }
      col[r] = c
      clash = null
      kind = 'place'
      rec.push('place', snap(), `第 ${r + 1} 行第 ${c + 1} 列和已有的皇后都不冲突，放下，继续放第 ${r + 2} 行。`)
      dfs(r + 1)
      col[r] = -1
      cell = [r, c]
      clash = null
      kind = 'back'
      rec.push('back', snap(), `第 ${r + 2} 行（以及后面）已经没有别的可能了，退回来，把第 ${r + 1} 行第 ${c + 1} 列的皇后拿走，试这一行的下一列。`)
    }
  }
  dfs(0)
  cell = null
  clash = null
  kind = 'none'
  rec.push('done', snap(), `所有的可能都试过了，${n} 皇后问题一共有 ${count} 个解。`)
  return rec.frames
}

function QueensView({ frame }: { frame: Frame<QueensState> }) {
  const s = frame.state
  const rows: GridCell[][] = Array.from({ length: s.n }, (_, r) =>
    Array.from({ length: s.n }, (_, c): GridCell => {
      let tone: GridCell['tone'] = (r + c) % 2 === 0 ? 'idle' : 'dim'
      let text: string | undefined
      if (s.col[r] === c) {
        text = 'Q'
        tone = 'done'
      }
      if (s.cell && s.cell[0] === r && s.cell[1] === c) {
        tone = s.kind === 'conflict' ? 'swap' : s.kind === 'back' ? 'compare' : s.kind === 'place' ? 'found' : tone
        if (s.kind === 'conflict') text = '✗'
        if (s.kind === 'place') text = 'Q'
      }
      if (s.clash !== null && s.clash === r && s.col[r] === c) tone = 'swap'
      return { text, tone }
    }),
  )
  const placed = s.col.filter((c) => c >= 0).length
  return (
    <div className="viz">
      <GridView rows={rows} maxCell={56} />
      <div className="legend">
        <span><i className="sw tone-done" />已放下的皇后</span>
        <span><i className="sw tone-found" />刚放下</span>
        <span><i className="sw tone-swap" />冲突</span>
        <span><i className="sw tone-compare" />退回、拿走</span>
      </div>
      {s.first && (
        <div className="target-row">
          <span className="target-chip">第一个解：每行皇后的列 = <b>{s.first.map((c) => c + 1).join(' ')}</b></span>
        </div>
      )}
      <Stats items={[['已放皇后', `${placed} / ${s.n}`], ['已找到的解', s.count]]} />
    </div>
  )
}

function parse(text: string): ParseResult<number> {
  return readInput(text, (r) => {
    const n = r.int('n', 4, 6)
    r.end()
    return n
  })
}

export const nQueens: AlgoDef<number, QueensState> = {
  id: 'n-queens',
  title: '回溯',
  tagline: '一行一行地试着放，放不下去就退回一步换个位置，试遍所有可能',
  kind: '算法',
  slug: 'queens',
  name: 'N 皇后',
  type: '逐行试探',
  statement: {
    desc: [
      '在 n×n 的棋盘上放 n 个皇后，使得任意两个皇后都不在同一行、同一列，也不在同一条斜线上（皇后可以攻击这三个方向上的棋子）。求一共有多少种不同的放法。',
    ],
    input: [
      '一行一个整数 n（4 ≤ n ≤ 6）。',
    ],
    output: [
      '一行一个整数，是放法的总数。',
    ],
  },
  intro: [
    '回溯是一种“试错”的搜索方法：沿着一条路往下做选择，一旦发现走不通，就撤销上一步的选择，退回来换一个选择继续试。它像是在走迷宫，遇到死路就原路返回。N 皇后是它最经典的例子：在 N×N 的棋盘上放 N 个皇后，要求任意两个皇后不能互相攻击，也就是不在同一行、同一列或者同一条斜线上。',
    '既然每一行恰好要放一个皇后，就逐行处理：对第 r 行，依次尝试每一个列，如果和之前放的皇后不冲突，就放下去，再递归地处理第 r+1 行；递归返回之后，把这个皇后拿走（这就是回溯），继续试下一个列。放满 N 行就记下一个解。',
  ],
  points: [
    '用 col[r] 记录第 r 行皇后的列，判断冲突只需要和前面各行比较：列相同，或者行差等于列差（在同一条斜线上）。',
    '递归函数的结构是：到达边界就统计答案；否则枚举选择，做出选择、递归、撤销选择。撤销这一步不能忘。',
    '“剪枝”：一旦发现某个位置冲突，就不再往下搜索，这比把所有摆法列出来再检查要快得多。',
    '回溯可以用来求所有排列、所有子集、数独、迷宫路径等，写法的骨架都是一样的。',
  ],
  pitfalls: [
    '递归返回后忘记撤销选择（把 col[r] 恢复），后面的判断会受到上一次尝试留下的影响。',
    '斜线冲突的判断要用 abs(列差)==行差，只判断一个方向会漏掉另一条斜线。',
    '回溯的时间随着规模爆炸式增长，N 到十几时已经很慢，需要用位运算等办法优化。',
  ],
  complexity: { time: 'O(N!)', space: 'O(N)', note: '最坏情况是 N 的阶乘量级，剪枝之后实际要小得多。空间只有递归的深度和 col 数组。' },
  presets: [
    { label: '4 皇后', text: '4' },
    { label: '5 皇后', text: '5' },
    { label: '6 皇后', text: '6' },
  ],
  defaultInput: 4,
  parse,
  format: (v) => String(v),
  answer: (n) => {
    const col: number[] = []
    let cnt = 0
    const ok = (r: number, c: number) => col.every((cc, rr) => cc !== c && Math.abs(cc - c) !== r - rr)
    const dfs = (r: number) => {
      if (r === n) {
        cnt++
        return
      }
      for (let c = 0; c < n; c++) {
        if (!ok(r, c)) continue
        col.push(c)
        dfs(r + 1)
        col.pop()
      }
    }
    dfs(0)
    return String(cnt)
  },
  random: () => 4 + Math.floor(Math.random() * 3),
  run: runQueens,
  View: QueensView,
  sources: {
    c: String.raw`
#include <stdio.h>
#include <stdlib.h>
int n,cnt=0,col[15];
int ok(int r,int c){
    for (int i=0;i<r;i++)
        if (col[i]==c||abs(col[i]-c)==r-i) return 0;
    return 1;
}
void dfs(int r){
    if (r==n){                              //@solution
        cnt++;                              //@solution
        return;                             //@solution
    }                                       //@solution
    for (int c=0;c<n;c++){
        if (!ok(r,c)) continue;             //@conflict
        col[r]=c;                           //@place
        dfs(r+1);
        // 撤销这一行的选择，试下一列                    //@back
    }
}
int main(){
    scanf("%d",&n);
    dfs(0);                                 //@init
    printf("%d\n",cnt);                     //@done
    return 0;
}
`,
    cpp: String.raw`
#include <bits/stdc++.h>
using namespace std;
int n,cnt=0,col[15];
bool ok(int r,int c){
    for (int i=0;i<r;i++)
        if (col[i]==c||abs(col[i]-c)==r-i) return false;
    return true;
}
void dfs(int r){
    if (r==n){                              //@solution
        cnt++;                              //@solution
        return;                             //@solution
    }                                       //@solution
    for (int c=0;c<n;c++){
        if (!ok(r,c)) continue;             //@conflict
        col[r]=c;                           //@place
        dfs(r+1);
        // 撤销这一行的选择，试下一列                    //@back
    }
}
int main(){
    cin>>n;
    dfs(0);                                 //@init
    cout<<cnt<<endl;                        //@done
    return 0;
}
`,
    python: String.raw`
def ok(r,c):
    return all(col[i]!=c and abs(col[i]-c)!=r-i for i in range(r))

def dfs(r):
    global cnt
    if r==n:
        cnt+=1                              #@solution
        return
    for c in range(n):
        if not ok(r,c):
            continue                        #@conflict
        col[r]=c                            #@place
        dfs(r+1)
        # 撤销这一行的选择，试下一列                     #@back

n=int(input())
cnt=0
col=[0]*n
dfs(0)                                      #@init
print(cnt)                                  #@done
`,
    java: String.raw`
import java.util.*;

public class Main{
    static int n,cnt=0;
    static int[] col=new int[15];

    static boolean ok(int r,int c){
        for (int i=0;i<r;i++)
            if (col[i]==c||Math.abs(col[i]-c)==r-i) return false;
        return true;
    }

    static void dfs(int r){
        if (r==n){                          //@solution
            cnt++;                          //@solution
            return;                         //@solution
        }                                   //@solution
        for (int c=0;c<n;c++){
            if (!ok(r,c)) continue;         //@conflict
            col[r]=c;                       //@place
            dfs(r+1);
            // 撤销这一行的选择，试下一列                //@back
        }
    }

    public static void main(String[] args){
        n=new Scanner(System.in).nextInt();
        dfs(0);                             //@init
        System.out.println(cnt);            //@done
    }
}
`,
  },
  problems: pickProblems('P1219', 'P1706'),
}
