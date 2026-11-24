import { GridView, type GridCell } from '../components/GridView'
import { Stats } from '../components/Stats'
import { pickProblems } from '../data/problems'
import { Recorder } from '../engine/recorder'
import type { AlgoDef, Frame, ParseResult } from '../engine/types'
import { randInt, readInput } from './shared'

export interface SvState {
  n: number
  /** 下标 1..n：0 还没确定，1 质数，2 已被划掉（合数） */
  st: number[]
  /** 当前检查的数 */
  cur: number | null
  /** 这一帧刚刚第一次被划掉的数 */
  fresh: number[]
}

export function runSieve(n: number): Frame<SvState>[] {
  const rec = new Recorder<SvState>()
  const st = new Array(n + 1).fill(0)
  let cur: number | null = null
  let fresh: number[] = []
  const snap = (): SvState => ({ n, st, cur, fresh })

  rec.push('init', snap(), `把 2 到 ${n} 都当作“可能是质数”。1 既不是质数也不是合数，直接不看。接下来用质数去划掉它们的倍数，没有被划掉的就是质数。`)
  for (let i = 2; i * i <= n; i++) {
    cur = i
    fresh = []
    if (st[i] === 2) {
      rec.push('check', snap(), `${i} 已经被划掉了，说明它是合数。它的倍数一定也是某个更小的质数的倍数，早就划过了，这一轮直接跳过。`)
      continue
    }
    st[i] = 1
    rec.push('check', snap(), `${i} 还没有被划掉，所以它是质数。接下来把它的倍数划掉。`)
    const all: number[] = []
    const fresh2: number[] = []
    for (let j = i * i; j <= n; j += i) {
      all.push(j)
      if (st[j] !== 2) fresh2.push(j)
      st[j] = 2
    }
    fresh = fresh2
    rec.push(
      'cross',
      snap(),
      `从 ${i}×${i} = ${i * i} 开始，每隔 ${i} 个数划掉一个：${all.join('、')}。比 ${i * i} 小的倍数，比如 ${i}×2，已经被更小的质数划过，不需要再看。`,
    )
  }
  cur = null
  fresh = []
  for (let k = 2; k <= n; k++) if (st[k] === 0) st[k] = 1
  const primes: number[] = []
  for (let k = 2; k <= n; k++) if (st[k] === 1) primes.push(k)
  rec.push('done', snap(), `下一个要检查的数的平方已经超过了 ${n}，不需要再往下找了：剩下没被划掉的数都是质数。2 到 ${n} 里一共有 ${primes.length} 个质数：${primes.join('、')}。`)
  return rec.frames
}

const COLS = 10

function SvView({ frame }: { frame: Frame<SvState> }) {
  const s = frame.state
  const fresh = new Set(s.fresh)
  const total = Math.ceil(s.n / COLS) * COLS
  const rows: GridCell[][] = []
  for (let r = 0; r * COLS < total; r++) {
    const row: GridCell[] = []
    for (let k = 1; k <= COLS; k++) {
      const v = r * COLS + k
      if (v > s.n) {
        row.push({ head: true })
        continue
      }
      let tone: GridCell['tone'] = 'idle'
      if (v === 1 || s.st[v] === 2) tone = 'dim'
      if (s.st[v] === 1) tone = 'done'
      if (fresh.has(v)) tone = 'swap'
      if (s.cur === v) tone = 'compare'
      row.push({ text: v, tone })
    }
    rows.push(row)
  }
  const primes = s.st.filter((x) => x === 1).length
  const crossed = s.st.filter((x) => x === 2).length
  return (
    <div className="viz">
      <GridView rows={rows} maxCell={52} />
      <div className="legend">
        <span><i className="sw tone-compare" />正在检查</span>
        <span><i className="sw tone-swap" />刚划掉</span>
        <span><i className="sw tone-dim" />已划掉的合数</span>
        <span><i className="sw tone-done" />确认是质数</span>
      </div>
      <Stats
        items={[
          ['当前检查', s.cur ?? '—'],
          ['确认的质数', primes],
          ['已划掉', crossed],
        ]}
      />
    </div>
  )
}

function parse(text: string): ParseResult<number> {
  return readInput(text, (r) => {
    const n = r.int('n', 10, 60)
    r.end()
    return n
  })
}

export const sieve: AlgoDef<number, SvState> = {
  id: 'sieve',
  title: '埃氏筛',
  tagline: '不去逐个判断，而是用质数去划掉它们的倍数，剩下的就是质数',
  kind: '算法',
  slug: 'primes',
  name: '求质数',
  type: '筛法',
  statement: {
    desc: [
      '给定一个整数 n，按从小到大的顺序，输出 2 到 n 之间的所有质数。',
    ],
    input: [
      '一行一个整数 n（10 ≤ n ≤ 60）。',
    ],
    output: [
      '一行若干个质数，用空格隔开。',
    ],
  },
  intro: [
    '要找出 1 到 n 里所有的质数，可以逐个数去试除，但更快的办法是反过来想：每找到一个质数，就把它的所有倍数划掉。2 是质数，所以 4、6、8 都不是；3 是质数，所以 6、9、12 都不是……一直做下去，剩下没有被划掉的数就是质数。',
    '这个方法叫埃拉托斯特尼筛法，简称埃氏筛。它有一个小小的优化：对质数 i，只需要从 i×i 开始划。因为比 i×i 小的倍数，比如 i×2、i×3，它们有更小的因数，早在处理那些更小的质数时就被划掉了。同样的道理，只需要检查到 i×i≤n 为止。',
  ],
  points: [
    '用一个布尔数组 comp 记录“某个数是否已经被划掉”，初始全部为 false。',
    '外层循环只需要走到 i*i<=n。i 如果已经被划掉就跳过，只有没被划掉的 i 才是质数，才需要去划它的倍数。',
    '内层循环从 i*i 开始，每次加 i，把这些位置都标记为合数。',
    '循环结束后，凡是 comp 为 false 的数（从 2 开始）都是质数。',
  ],
  pitfalls: [
    '内层从 i*i 开始时，i*i 在 i 较大时可能溢出 int，所以 n 很大时要把 i 声明成 long long。',
    '数组下标是 0 到 n，所以数组至少要开 n+1 个位置。',
    '数据达到千万级时，埃氏筛会偏慢，可以改用线性筛（欧拉筛），让每个合数只被划一次。',
  ],
  complexity: { time: 'O(n log log n)', space: 'O(n)', note: '几乎接近线性：n 在一千万以内时，通常一秒左右就能筛完。' },
  presets: [
    { label: '到 30', text: '30' },
    { label: '到 50', text: '50' },
    { label: '到 60', text: '60' },
  ],
  defaultInput: 50,
  parse,
  format: (v) => String(v),
  answer: (n) => {
    const out: number[] = []
    for (let i = 2; i <= n; i++) if (Array.from({ length: i - 2 }, (_, k) => k + 2).every((d) => i % d !== 0)) out.push(i)
    return out.join(' ')
  },
  random: () => randInt(20, 60),
  run: runSieve,
  View: SvView,
  sources: {
    c: String.raw`
#include <stdio.h>
int comp[1005];                             //@init
int main(){
    int n;
    scanf("%d",&n);
    for (int i=2;i*i<=n;i++){
        if (!comp[i]){                      //@check
            for (int j=i*i;j<=n;j+=i)       //@cross
                comp[j]=1;                  //@cross
        }
    }
    for (int i=2;i<=n;i++)                  //@done
        if (!comp[i]) printf("%d ",i);      //@done
    printf("\n");
    return 0;
}
`,
    cpp: String.raw`
#include <bits/stdc++.h>
using namespace std;
bool comp[1005];                            //@init
int main(){
    int n;
    cin>>n;
    for (int i=2;i*i<=n;i++){
        if (!comp[i]){                      //@check
            for (int j=i*i;j<=n;j+=i)       //@cross
                comp[j]=true;               //@cross
        }
    }
    for (int i=2;i<=n;i++)                  //@done
        if (!comp[i]) cout<<i<<" ";         //@done
    cout<<endl;
    return 0;
}
`,
    python: String.raw`
n=int(input())
comp=[False]*(n+1)                          #@init
i=2
while i*i<=n:
    if not comp[i]:                         #@check
        for j in range(i*i,n+1,i):          #@cross
            comp[j]=True                    #@cross
    i+=1
for i in range(2,n+1):                      #@done
    if not comp[i]:                         #@done
        print(i,end=' ')                    #@done
print()
`,
    java: String.raw`
import java.util.*;

public class Main{
    public static void main(String[] args){
        Scanner sc=new Scanner(System.in);
        int n=sc.nextInt();
        boolean[] comp=new boolean[n+1];            //@init
        for (int i=2;i*i<=n;i++){
            if (!comp[i]){                          //@check
                for (int j=i*i;j<=n;j+=i)           //@cross
                    comp[j]=true;                   //@cross
            }
        }
        for (int i=2;i<=n;i++)                      //@done
            if (!comp[i]) System.out.print(i+" ");  //@done
        System.out.println();
    }
}
`,
  },
  problems: pickProblems('P5736', 'P3383'),
}
