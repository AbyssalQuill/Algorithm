import { GridView, type GridCell } from '../components/GridView'
import { Stats } from '../components/Stats'
import { pickProblems } from '../data/problems'
import { Recorder } from '../engine/recorder'
import type { AlgoDef, Frame, ParseResult } from '../engine/types'
import { randInt, splitBar, toNums } from './shared'

export interface KnapInput {
  w: number[]
  v: number[]
  cap: number
}

type Pos = [number, number]

export interface KnapState {
  w: number[]
  v: number[]
  cap: number
  /** dp[i][j]：只考虑前 i 件物品、背包容量 j 时的最大价值；还没算的是 null */
  dp: (number | null)[][]
  cur: Pos | null
  src: Pos[]
  answer: number | null
}

export function runKnapsack({ w, v, cap }: KnapInput): Frame<KnapState>[] {
  const rec = new Recorder<KnapState>()
  const n = w.length
  const dp: (number | null)[][] = Array.from({ length: n + 1 }, (_, i) => Array.from({ length: cap + 1 }, () => (i === 0 ? 0 : null)))
  let cur: Pos | null = null
  let src: Pos[] = []
  let answer: number | null = null
  const snap = (): KnapState => ({ w, v, cap, dp, cur, src, answer })

  rec.push('init', snap(), `有 ${n} 件物品，每件只有一个，背包的容量是 ${cap}。要挑出一些放进去，使总价值最大。设 dp[i][j] 表示只考虑前 i 件物品、背包容量为 j 时能装下的最大价值。一件物品都不选（i=0）时，价值当然是 0。`)
  for (let i = 1; i <= n; i++) {
    for (let j = 0; j <= cap; j++) {
      cur = [i, j]
      if (w[i - 1] > j) {
        dp[i][j] = dp[i - 1][j]
        src = [[i - 1, j]]
        rec.push('tooHeavy', snap(), `第 ${i} 件物品重 ${w[i - 1]}，比容量 ${j} 还大，放不进去，只能不选：dp[${i}][${j}] = dp[${i - 1}][${j}] = ${dp[i][j]}。`)
      } else {
        const skip = dp[i - 1][j] as number
        const take = (dp[i - 1][j - w[i - 1]] as number) + v[i - 1]
        dp[i][j] = Math.max(skip, take)
        src = [[i - 1, j], [i - 1, j - w[i - 1]]]
        rec.push('choose', snap(), `第 ${i} 件物品（重 ${w[i - 1]}，价值 ${v[i - 1]}）放得下，有两种选择：不选，价值是 dp[${i - 1}][${j}] = ${skip}；选，先给它腾出 ${w[i - 1]} 的空间，价值是 dp[${i - 1}][${j - w[i - 1]}] + ${v[i - 1]} = ${take}。取较大的：dp[${i}][${j}] = ${dp[i][j]}。`)
      }
    }
  }
  cur = [n, cap]
  src = []
  answer = dp[n][cap] as number
  rec.push('done', snap(), `右下角的 dp[${n}][${cap}] = ${answer}，就是容量为 ${cap} 的背包最多能装下的总价值。`)
  return rec.frames
}

function KnapView({ frame }: { frame: Frame<KnapState> }) {
  const s = frame.state
  const n = s.w.length
  const key = (p: Pos) => `${p[0]},${p[1]}`
  const src = new Set(s.src.map(key))
  const rows: GridCell[][] = [
    [{ head: true }, ...Array.from({ length: s.cap + 1 }, (_, j): GridCell => ({ head: true, text: j, tone: s.cur && s.cur[1] === j ? 'compare' : 'idle' }))],
    ...Array.from({ length: n + 1 }, (_, i): GridCell[] => [
      { head: true, text: i === 0 ? '0' : `#${i}`, tone: s.cur && s.cur[0] === i && i > 0 ? 'compare' : 'idle' },
      ...Array.from({ length: s.cap + 1 }, (_, j): GridCell => {
        const val = s.dp[i][j]
        let tone: GridCell['tone'] = val === null ? 'dim' : i === 0 ? 'dim' : 'idle'
        if (src.has(`${i},${j}`)) tone = 'done'
        if (s.cur && s.cur[0] === i && s.cur[1] === j) tone = 'compare'
        return { text: val === null ? '' : val, tone }
      }),
    ]),
  ]
  return (
    <div className="viz">
      <div className="outline">
        {s.w.map((wi, k) => (
          <span key={k} className="qchip">
            #{k + 1}：重 {wi}，价值 {s.v[k]}
          </span>
        ))}
        <span className="qchip">容量 {s.cap}</span>
      </div>
      <GridView rows={rows} maxCell={46} />
      <div className="legend">
        <span><i className="sw tone-compare" />正在计算</span>
        <span><i className="sw tone-done" />它依赖的格子</span>
      </div>
      <Stats items={[['物品数', n], ['背包容量', s.cap], ['最大价值', s.answer ?? '—']]} />
    </div>
  )
}

function parse(text: string): ParseResult<KnapInput> {
  const parts = splitBar(text)
  if (parts.length !== 3) return { ok: false, error: '格式是「各物品的重量 | 各物品的价值 | 背包容量」，例如：2 3 4 5 | 3 4 5 6 | 8' }
  const w = toNums(parts[0])
  const v = toNums(parts[1])
  const c = toNums(parts[2])
  if (w.length < 1 || w.length > 5 || w.length !== v.length) return { ok: false, error: '请写 1～5 件物品，重量和价值的个数要一样。' }
  if (c.length !== 1 || !Number.isInteger(c[0]) || c[0] < 1 || c[0] > 10) return { ok: false, error: '背包容量请取 1～10。' }
  if (w.some((x) => !Number.isInteger(x) || x < 1 || x > 10) || v.some((x) => !Number.isInteger(x) || x < 1 || x > 99)) return { ok: false, error: '重量取 1～10，价值取 1～99 的整数。' }
  return { ok: true, value: { w, v, cap: c[0] } }
}

export const knapsack: AlgoDef<KnapInput, KnapState> = {
  id: 'knapsack',
  title: '动态规划：0-1 背包',
  tagline: '每件物品选或不选，用一张表记下“前 i 件物品、容量 j”时的最大价值',
  kind: '算法',
  intro: [
    '背包问题是动态规划最经典的入门题：有若干件物品，每件有重量和价值，只有一个；背包有容量限制，要挑出一些放进去，使价值之和最大。“每件要么放要么不放”，所以叫 0-1 背包。如果逐个枚举所有的选法，n 件物品就有 2ⁿ 种，很快就算不动了。',
    '动态规划把问题拆小：设 dp[i][j] 为只考虑前 i 件物品、容量是 j 时的最大价值。对第 i 件物品只有两种可能：不选，价值和只考虑前 i-1 件、容量 j 时一样；选，就要先给它腾出空间，价值是前 i-1 件、容量 j-w 时的最大价值再加上它自己的价值。两者取较大的。把表从上到下、从左到右填满，右下角就是答案。',
  ],
  points: [
    '状态：dp[i][j]。第 0 行全是 0（没有物品可选）。转移：放不下时 dp[i][j]=dp[i-1][j]，放得下时取 max(dp[i-1][j], dp[i-1][j-w]+v)。',
    '每个格子只依赖上一行的格子，所以可以把二维数组压缩成一维，内层循环从大到小倒着遍历，空间降到 O(W)。',
    '这个算法的时间是 O(nW)，与容量 W 的数值大小有关，所以叫“伪多项式”，W 到十亿时就不能用了。',
    '要知道具体选了哪些物品，可以从 dp[n][W] 倒着看：如果它和上一行相等，就说明没选；否则选了，容量减去它的重量。',
  ],
  pitfalls: [
    '一维写法里内层循环必须倒着遍历（从 W 到 w），正着遍历会让同一件物品被重复选择，变成完全背包。',
    '放不下的情形不能漏掉，否则 j-w 会变成负数，数组越界。',
    '容量和价值的类型要留意：价值总和可能超过 int 的范围，要用 long long。',
  ],
  complexity: { time: 'O(nW)', space: 'O(nW)', note: '这里是二维表的空间；压缩成一维后只需要 O(W)。n 是物品数，W 是背包容量。' },
  inputHint: '格式：各物品的重量 | 各物品的价值 | 背包容量，例如 2 3 4 5 | 3 4 5 6 | 8（最多 5 件物品，容量 1～10）。',
  presets: [
    { label: '经典例子', text: '2 3 4 5 | 3 4 5 6 | 8' },
    { label: '贪心会出错', text: '5 4 3 | 10 40 50 | 7' },
    { label: '全都放得下', text: '1 2 3 | 5 6 7 | 10' },
  ],
  defaultInput: { w: [2, 3, 4, 5], v: [3, 4, 5, 6], cap: 8 },
  parse,
  format: (x) => `${x.w.join(' ')} | ${x.v.join(' ')} | ${x.cap}`,
  random: () => {
    const n = randInt(3, 5)
    return { w: Array.from({ length: n }, () => randInt(1, 6)), v: Array.from({ length: n }, () => randInt(2, 30)), cap: randInt(5, 10) }
  },
  run: runKnapsack,
  View: KnapView,
  sources: {
    c: String.raw`
#include <stdio.h>
int n,W,w[15],v[15],dp[15][105];                //@init
int max(int a,int b){ return a>b?a:b; }
int main(){
    scanf("%d %d",&n,&W);
    for (int i=1;i<=n;i++) scanf("%d",&w[i]);
    for (int i=1;i<=n;i++) scanf("%d",&v[i]);
    for (int i=1;i<=n;i++){
        for (int j=0;j<=W;j++){
            if (w[i]>j){
                dp[i][j]=dp[i-1][j];            //@tooHeavy
            }else{
                dp[i][j]=max(dp[i-1][j],dp[i-1][j-w[i]]+v[i]);   //@choose
            }
        }
    }
    printf("%d\n",dp[n][W]);                    //@done
    return 0;
}
`,
    cpp: String.raw`
#include <bits/stdc++.h>
using namespace std;
int n,W,w[15],v[15],dp[15][105];                //@init
int main(){
    cin>>n>>W;
    for (int i=1;i<=n;i++) cin>>w[i];
    for (int i=1;i<=n;i++) cin>>v[i];
    for (int i=1;i<=n;i++){
        for (int j=0;j<=W;j++){
            if (w[i]>j){
                dp[i][j]=dp[i-1][j];            //@tooHeavy
            }else{
                dp[i][j]=max(dp[i-1][j],dp[i-1][j-w[i]]+v[i]);   //@choose
            }
        }
    }
    cout<<dp[n][W]<<endl;                       //@done
    return 0;
}
`,
    python: String.raw`
n, W = map(int, input().split())
w = [0] + list(map(int, input().split()))
v = [0] + list(map(int, input().split()))
dp = [[0] * (W + 1) for _ in range(n + 1)]      #@init
for i in range(1, n + 1):
    for j in range(W + 1):
        if w[i] > j:
            dp[i][j] = dp[i - 1][j]             #@tooHeavy
        else:
            dp[i][j] = max(dp[i - 1][j], dp[i - 1][j - w[i]] + v[i])   #@choose
print(dp[n][W])                                 #@done
`,
    java: String.raw`
import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt(), W = sc.nextInt();
        int[] w = new int[n + 1], v = new int[n + 1];
        for (int i = 1; i <= n; i++) w[i] = sc.nextInt();
        for (int i = 1; i <= n; i++) v[i] = sc.nextInt();
        int[][] dp = new int[n + 1][W + 1];         //@init
        for (int i = 1; i <= n; i++) {
            for (int j = 0; j <= W; j++) {
                if (w[i] > j) {
                    dp[i][j] = dp[i - 1][j];        //@tooHeavy
                } else {
                    dp[i][j] = Math.max(dp[i - 1][j], dp[i - 1][j - w[i]] + v[i]);   //@choose
                }
            }
        }
        System.out.println(dp[n][W]);               //@done
    }
}
`,
  },
  problems: pickProblems('P1048', 'P1060'),
}
