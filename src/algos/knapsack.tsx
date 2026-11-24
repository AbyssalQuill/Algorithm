import { GridView, type GridCell } from '../components/GridView'
import { Stats } from '../components/Stats'
import { pickProblems } from '../data/problems'
import { Recorder } from '../engine/recorder'
import type { AlgoDef, Frame, ParseResult } from '../engine/types'
import { lcs } from './lcs'
import { dpLis } from './dpLis'
import { randInt, readInput } from './shared'

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
  return readInput(text, (r) => {
    const n = r.int('n', 1, 5)
    const cap = r.int('W', 1, 10)
    const w = r.ints(n, '重量', 1, 10)
    const v = r.ints(n, '价值', 1, 99)
    r.end()
    return { w, v, cap }
  })
}

export const knapsack: AlgoDef<KnapInput, KnapState> = {
  id: 'dp',
  title: '动态规划',
  tagline: '把大问题拆成小问题，每个小问题只算一次，结果填进表格里反复使用',
  kind: '算法',
  slug: 'knapsack',
  name: '0-1 背包',
  type: '二维状态',
  idea: [
    '背包问题是动态规划最经典的入门题：有若干件物品，每件有重量和价值，只有一个；背包有容量限制，要挑出一些放进去，使价值之和最大。“每件要么放要么不放”，所以叫 0-1 背包。如果逐个枚举所有的选法，n 件物品就有 2ⁿ 种，很快就算不动了。',
    '动态规划把问题拆小：设 dp[i][j] 为只考虑前 i 件物品、容量是 j 时的最大价值。对第 i 件物品只有两种可能：不选，价值和只考虑前 i-1 件、容量 j 时一样；选，就要先给它腾出空间，价值是前 i-1 件、容量 j-w 时的最大价值再加上它自己的价值。两者取较大的。把表从上到下、从左到右填满，右下角就是答案。',
    '每个格子只依赖上一行的格子，所以可以把二维数组压缩成一维，内层循环从大到小倒着遍历，空间降到 O(W)。',
    '要知道具体选了哪些物品，可以从 dp[n][W] 倒着看：如果它和上一行相等，就说明没选；否则选了，容量减去它的重量。',
    '一维写法里内层循环必须倒着遍历（从 W 到 w），正着遍历会让同一件物品被重复选择，变成完全背包。',
  ],
  statement: {
    desc: [
      '有 n 件物品和一个容量为 W 的背包，第 i 件物品的重量是 w[i]、价值是 v[i]，每件物品最多选一次。选出一些物品放进背包，要求总重量不超过 W，求能得到的最大总价值。',
    ],
    input: [
      '第一行两个整数 n 和 W（1 ≤ n ≤ 5，1 ≤ W ≤ 10）。',
      '第二行 n 个整数，是各物品的重量（1～10）。',
      '第三行 n 个整数，是各物品的价值（1～99）。',
    ],
    output: [
      '一行一个整数，是能得到的最大总价值。',
    ],
  },
  intro: [
    '动态规划（DP）适合这样的问题：直接枚举所有方案，数量是指数级的，根本算不完；但是大问题可以拆成规模更小、形式相同的子问题，而且不同的方案会反复遇到同样的子问题。DP 先定义一个“状态”，用它表示一个子问题的答案，再找出大问题和小问题之间的关系，然后按从小到大的顺序，把每个子问题只算一次，结果记在表里反复使用。',
    '写 DP 一般分四步：确定状态表示什么；写出转移方程，说明一个状态怎样由更小的状态得到；确定边界（最小的子问题的答案）和计算的顺序；最后看清答案在表里的哪个位置。下面的两道例题，一道状态是“前 i 件物品、容量 j”，另一道是“A 的前 i 个字符、B 的前 j 个字符”，都是二维的表，填表的方式也很相似。',
  ],
  points: [
    '状态要能完整地描述一个子问题，写代码之前先用一句话说清“dp[i][j] 表示什么”，后面的转移才不会乱。',
    '转移方程说明一个状态怎样由更小的状态得到，常见的形式是在几种选择里取最大值、最小值，或者把几种情况相加。',
    '计算的顺序要保证用到某个格子时，它依赖的格子都已经算好了。二维表通常按行从上到下、每行从左到右填。',
    '如果每个格子只依赖上一行，可以只保留一行，把二维数组压缩成一维，空间从 O(nW) 降到 O(W)。',
    '表里存的是最优值，要知道具体选了什么，需要从终点沿着“值来自哪里”倒着走一遍。',
  ],
  pitfalls: [
    '状态没有定义清楚，转移时就会漏掉情况或者重复计算。',
    '边界没有初始化，或者下标从 0 还是从 1 开始搞混，是越界和答案错误最常见的来源。',
    '数据一大，二维表放不下，也算不完，要考虑压缩状态或者换思路；背包的容量到十亿时，这样的表是不能用的。',
  ],
  complexity: { time: 'O(nW)', space: 'O(nW)', note: '这里是二维表的空间；压缩成一维后只需要 O(W)。n 是物品数，W 是背包容量。' },
  presets: [
    { label: '经典例子', text: '4 8\n2 3 4 5\n3 4 5 6' },
    { label: '贪心会出错', text: '3 7\n5 4 3\n10 40 50' },
    { label: '全都放得下', text: '3 10\n1 2 3\n5 6 7' },
  ],
  defaultInput: { w: [2, 3, 4, 5], v: [3, 4, 5, 6], cap: 8 },
  parse,
  format: (x) => `${x.w.length} ${x.cap}\n${x.w.join(' ')}\n${x.v.join(' ')}`,
  answer: (x) => {
    let best = 0
    for (let mask = 0; mask < 1 << x.w.length; mask++) {
      let sw = 0
      let sv = 0
      x.w.forEach((wi, i) => {
        if ((mask >> i) & 1) {
          sw += wi
          sv += x.v[i]
        }
      })
      if (sw <= x.cap) best = Math.max(best, sv)
    }
    return String(best)
  },
  random: () => {
    const n = randInt(3, 5)
    return { w: Array.from({ length: n }, () => randInt(1, 6)), v: Array.from({ length: n }, () => randInt(2, 30)), cap: randInt(5, 10) }
  },
  run: runKnapsack,
  View: KnapView,
  sources: {
    c: String.raw`
#include <stdio.h>
int n,W,w[15],v[15],dp[15][105];                                //@init
int max(int a,int b){
    return a>b?a:b;
}
int main(){
    scanf("%d %d",&n,&W);
    for (int i=1;i<=n;i++) scanf("%d",&w[i]);
    for (int i=1;i<=n;i++) scanf("%d",&v[i]);
    for (int i=1;i<=n;i++){
        for (int j=0;j<=W;j++){
            if (w[i]>j){
                dp[i][j]=dp[i-1][j];                            //@tooHeavy
            }else{
                dp[i][j]=max(dp[i-1][j],dp[i-1][j-w[i]]+v[i]);  //@choose
            }
        }
    }
    printf("%d\n",dp[n][W]);                                    //@done
    return 0;
}
`,
    cpp: String.raw`
#include <bits/stdc++.h>
using namespace std;
int n,W,w[15],v[15],dp[15][105];                                //@init
int main(){
    cin>>n>>W;
    for (int i=1;i<=n;i++) cin>>w[i];
    for (int i=1;i<=n;i++) cin>>v[i];
    for (int i=1;i<=n;i++){
        for (int j=0;j<=W;j++){
            if (w[i]>j){
                dp[i][j]=dp[i-1][j];                            //@tooHeavy
            }else{
                dp[i][j]=max(dp[i-1][j],dp[i-1][j-w[i]]+v[i]);  //@choose
            }
        }
    }
    cout<<dp[n][W]<<endl;                                       //@done
    return 0;
}
`,
    python: String.raw`
n,W=map(int,input().split())
w=[0]+list(map(int,input().split()))
v=[0]+list(map(int,input().split()))
dp=[[0]*(W+1) for _ in range(n+1)]                         #@init
for i in range(1,n+1):
    for j in range(W+1):
        if w[i]>j:
            dp[i][j]=dp[i-1][j]                            #@tooHeavy
        else:
            dp[i][j]=max(dp[i-1][j],dp[i-1][j-w[i]]+v[i])  #@choose
print(dp[n][W])                                            #@done
`,
    java: String.raw`
import java.util.*;

public class Main{
    public static void main(String[] args){
        Scanner sc=new Scanner(System.in);
        int n=sc.nextInt(),W=sc.nextInt();
        int[] w=new int[n+1],v=new int[n+1];
        for (int i=1;i<=n;i++) w[i]=sc.nextInt();
        for (int i=1;i<=n;i++) v[i]=sc.nextInt();
        int[][] dp=new int[n+1][W+1];                           //@init
        for (int i=1;i<=n;i++){
            for (int j=0;j<=W;j++){
                if (w[i]>j){
                    dp[i][j]=dp[i-1][j];                        //@tooHeavy
                }else{
                    dp[i][j]=Math.max(dp[i-1][j],dp[i-1][j-w[i]]+v[i]);  //@choose
                }
            }
        }
        System.out.println(dp[n][W]);                           //@done
    }
}
`,
  },
  problems: pickProblems('P1048', 'P1060'),
  extra: [lcs, dpLis],
}
