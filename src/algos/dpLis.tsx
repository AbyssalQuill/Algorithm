import { GridView, type GridCell } from '../components/GridView'
import { Stats } from '../components/Stats'
import { pickProblems } from '../data/problems'
import { Recorder } from '../engine/recorder'
import type { Example, Frame, ParseResult } from '../engine/types'
import { randInt, readInput } from './shared'

export interface LisState {
  a: number[]
  /** dp[i]：以 a[i] 结尾的最长上升子序列的长度；还没算到的是 0 */
  dp: number[]
  i: number | null
  j: number | null
  best: number
  done: boolean
}

export function runLis(a: number[]): Frame<LisState>[] {
  const rec = new Recorder<LisState>()
  const n = a.length
  const dp = new Array<number>(n).fill(0)
  let i: number | null = null
  let j: number | null = null
  let best = 0
  let done = false
  const snap = (): LisState => ({ a, dp, i, j, best, done })

  rec.push('init', snap(), '要找最长的“严格上升”的子序列（可以不连续）。设 dp[i] 表示以 a[i] 结尾的最长上升子序列的长度。按下标从左到右依次算出每个 dp[i]，每个都只依赖它左边已经算好的值。')
  for (let x = 0; x < n; x++) {
    i = x
    j = null
    dp[x] = 1
    rec.push('start', snap(), `开始算 dp[${x}]。a[${x}] = ${a[x]} 自己就能单独组成一个长度为 1 的上升子序列，所以先令 dp[${x}] = 1。接下来看它左边的每个数能不能接在前面。`)
    for (let y = 0; y < x; y++) {
      j = y
      if (a[y] >= a[x]) {
        rec.push('skip', snap(), `a[${y}] = ${a[y]} 不比 a[${x}] = ${a[x]} 小，不能接在它的前面，跳过。`)
        continue
      }
      if (dp[y] + 1 > dp[x]) {
        dp[x] = dp[y] + 1
        rec.push('update', snap(), `a[${y}] = ${a[y]} < ${a[x]}，可以接在它前面：以 a[${y}] 结尾的最长长度是 dp[${y}] = ${dp[y]}，再加上 a[${x}]，长度是 ${dp[y] + 1}，比现在的 dp[${x}] 大，更新 dp[${x}] = ${dp[x]}。`)
      } else {
        rec.push('keep', snap(), `a[${y}] = ${a[y]} < ${a[x]}，可以接，但接上以后长度是 ${dp[y] + 1}，不比现在的 dp[${x}] = ${dp[x]} 更长，不更新。`)
      }
    }
    best = Math.max(best, dp[x])
  }
  i = null
  j = null
  done = true
  rec.push('done', snap(), `dp 都算完了。最长上升子序列可以在任何一个位置结束，所以答案是所有 dp[i] 里最大的：${best}。`)
  return rec.frames
}

function LisView({ frame }: { frame: Frame<LisState> }) {
  const s = frame.state
  const n = s.a.length
  const rows: GridCell[][] = [
    [{ head: true, text: '下标' }, ...Array.from({ length: n }, (_, k): GridCell => ({ head: true, text: k }))],
    [{ head: true, text: 'a[i]' }, ...s.a.map((v, k): GridCell => ({ text: v, tone: k === s.i ? 'compare' : k === s.j ? 'swap' : s.i !== null && k > s.i ? 'dim' : 'idle' }))],
    [{ head: true, text: 'dp[i]' }, ...s.dp.map((v, k): GridCell => ({ text: v === 0 ? '' : v, tone: s.done && v === s.best ? 'found' : k === s.i ? 'compare' : v > 0 ? 'done' : 'dim' }))],
  ]
  return (
    <div className="viz">
      <GridView rows={rows} maxCell={50} />
      <div className="legend">
        <span><i className="sw tone-compare" />正在算的 a[i]</span>
        <span><i className="sw tone-swap" />正在比较的 a[j]</span>
        <span><i className="sw tone-done" />已经算好的 dp</span>
      </div>
      {s.done && (
        <div className="target-row">
          <span className="verdict ok">最长上升子序列的长度：{s.best}</span>
        </div>
      )}
      <Stats items={[['已经算完的位置', `${s.done ? n : s.i ?? 0} / ${n}`], ['目前最长', s.best || '—']]} />
    </div>
  )
}

function parse(text: string): ParseResult<number[]> {
  return readInput(text, (r) => {
    const n = r.int('n', 2, 9)
    const a = r.ints(n, '数', 1, 99)
    r.end()
    return a
  })
}

export const lisLength = (a: number[]) => {
  const dp = a.map(() => 1)
  for (let i = 0; i < a.length; i++) for (let j = 0; j < i; j++) if (a[j] < a[i]) dp[i] = Math.max(dp[i], dp[j] + 1)
  return Math.max(...dp)
}

export const dpLis: Example<number[], LisState> = {
  slug: 'lis',
  name: '最长上升子序列',
  type: '一维状态',
  statement: {
    desc: ['给定一个长度为 n 的整数序列，求它的最长严格上升子序列的长度。子序列是从序列里按原来的先后顺序取出一些数（它们在原序列里不必相邻）；严格上升是指后一个数必须比前一个数大，相等也不行。'],
    input: ['第一行一个整数 n（2 ≤ n ≤ 9）。', '第二行 n 个整数，每个在 1～99 之间。'],
    output: ['一行一个整数，是最长上升子序列的长度。'],
  },
  idea: [
    '这道题的状态只有一个下标，是一维的：设 dp[i] 表示以 a[i] 结尾的最长上升子序列的长度。注意“以 a[i] 结尾”这个限定很关键，它让 a[i] 前面的那一个数可以是任何一个比它小的 a[j]。',
    '于是转移方程是：dp[i] = 1 + max(dp[j])，其中 j < i 并且 a[j] < a[i]；如果左边没有比它小的数，dp[i] 就是 1。每个 dp[i] 要看它左边的所有位置，总共 O(n²)。最后的答案不一定在最后一个位置，要在所有 dp[i] 里取最大的。',
    '和前两道例题相比，这里的表只有一行；但是“把大问题拆成以不同位置结尾的小问题，再用小问题的答案拼出大问题的答案”的思路是一样的。数据量到十万时，O(n²) 太慢，需要用二分把它优化到 O(n log n)。',
  ],
  complexity: { time: 'O(n²)', space: 'O(n)', note: '每个 dp[i] 要看它左边的所有位置。用二分可以优化到 O(n log n)。' },
  presets: [
    { label: '经典例子', text: '8\n10 9 2 5 3 7 40 18' },
    { label: '本来就是上升的', text: '6\n1 3 5 7 9 11' },
    { label: '一路下降', text: '5\n9 7 5 3 1' },
    { label: '有相同的数', text: '6\n4 4 4 5 5 6' },
  ],
  defaultInput: [3, 1, 4, 1, 5, 9, 2, 6],
  parse,
  format: (v) => `${v.length}\n${v.join(' ')}`,
  random: () => Array.from({ length: randInt(5, 8) }, () => randInt(1, 30)),
  answer: (v) => String(lisLength(v)),
  run: runLis,
  View: LisView,
  sources: {
    c: String.raw`
#include <stdio.h>
int main(){
    int n,a[20],dp[20],best=0;
    scanf("%d",&n);
    for (int i=0;i<n;i++) scanf("%d",&a[i]);  //@init
    for (int i=0;i<n;i++){
        dp[i]=1;                              //@start
        for (int j=0;j<i;j++){
            if (a[j]>=a[i]) continue;         //@skip
            if (dp[j]+1>dp[i]){               //@keep
                dp[i]=dp[j]+1;                //@update
            }
        }
        if (dp[i]>best) best=dp[i];
    }
    printf("%d\n",best);                      //@done
    return 0;
}
`,
    cpp: String.raw`
#include <bits/stdc++.h>
using namespace std;
int main(){
    int n,a[20],dp[20],best=0;
    cin>>n;
    for (int i=0;i<n;i++) cin>>a[i];        //@init
    for (int i=0;i<n;i++){
        dp[i]=1;                            //@start
        for (int j=0;j<i;j++){
            if (a[j]>=a[i]) continue;       //@skip
            if (dp[j]+1>dp[i]){             //@keep
                dp[i]=dp[j]+1;              //@update
            }
        }
        best=max(best,dp[i]);
    }
    cout<<best<<endl;                       //@done
    return 0;
}
`,
    python: String.raw`
n=int(input())
a=list(map(int,input().split()))            #@init
dp=[1]*n
for i in range(n):
    dp[i]=1                                 #@start
    for j in range(i):
        if a[j]>=a[i]:
            continue                        #@skip
        if dp[j]+1>dp[i]:                   #@keep
            dp[i]=dp[j]+1                   #@update
print(max(dp))                              #@done
`,
    java: String.raw`
import java.util.*;

public class Main{
    public static void main(String[] args){
        Scanner sc=new Scanner(System.in);
        int n=sc.nextInt(),best=0;
        int[] a=new int[n],dp=new int[n];
        for (int i=0;i<n;i++) a[i]=sc.nextInt();  //@init
        for (int i=0;i<n;i++){
            dp[i]=1;                              //@start
            for (int j=0;j<i;j++){
                if (a[j]>=a[i]) continue;         //@skip
                if (dp[j]+1>dp[i]){               //@keep
                    dp[i]=dp[j]+1;                //@update
                }
            }
            best=Math.max(best,dp[i]);
        }
        System.out.println(best);                 //@done
    }
}
`,
  },
  problems: pickProblems('P1020', 'P1091'),
}
