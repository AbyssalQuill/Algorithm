import { GridView, type GridCell } from '../components/GridView'
import { Stats } from '../components/Stats'
import { pickProblems } from '../data/problems'
import { Recorder } from '../engine/recorder'
import type { AlgoDef, Frame, ParseResult } from '../engine/types'
import { bitSubsets } from './bitSubsets'
import { bitXor } from './bitXor'
import { randInt, readInput } from './shared'

export interface BitClearState {
  n0: number
  /** 当前的 n */
  n: number
  /** 这一步里被消掉的那一位（从右数，0 开始）；null 表示没有 */
  cleared: number | null
  cnt: number
  finished: boolean
}

const BITS = 8
const bits = (x: number) => Array.from({ length: BITS }, (_, i) => (x >> (BITS - 1 - i)) & 1)

export function runBitClear(n0: number): Frame<BitClearState>[] {
  const rec = new Recorder<BitClearState>()
  let n = n0
  let cnt = 0
  let cleared: number | null = null
  let finished = false
  const snap = (): BitClearState => ({ n0, n, cleared, cnt, finished })

  rec.push('init', snap(), `统计 ${n0} 的二进制里有多少个 1（叫作汉明重量）。逐位去数当然可以，但有一个更巧妙的办法：n & (n-1) 的作用，恰好是把 n 的二进制里最低位的那个 1 变成 0。每做一次，就少一个 1，做了几次就有几个 1。`)
  while (n) {
    const low = Math.log2(n & -n)
    n &= n - 1
    cnt++
    cleared = low
    rec.push('clear', snap(), `n - 1 会让最低位的 1（第 ${low} 位）变成 0，它右边的 0 全部变成 1，与原来的 n 按位与之后，这一段都被抵消了：最低位的 1 就被消掉了。这是第 ${cnt} 个 1，n 变成 ${n}。`)
  }
  cleared = null
  finished = true
  rec.push('done', snap(), `n 变成了 0，一共消掉了 ${cnt} 个 1，所以 ${n0} 的二进制里有 ${cnt} 个 1。循环的次数只取决于 1 的个数，而不是总位数。`)
  return rec.frames
}

function BitView({ frame }: { frame: Frame<BitClearState> }) {
  const s = frame.state
  const before = s.cleared === null ? s.n : s.n | (1 << s.cleared)
  const minus = before - 1
  const row = (label: string, v: number, mark: (pos: number) => GridCell['tone']): GridCell[] => [
    { head: true, text: label },
    ...bits(v).map((b, i): GridCell => ({ text: b, tone: mark(BITS - 1 - i) })),
    { head: true, text: v },
  ]
  const hasStep = s.cleared !== null
  const rows: GridCell[][] = [
    [{ head: true }, ...Array.from({ length: BITS }, (_, i): GridCell => ({ head: true, text: BITS - 1 - i })), { head: true, text: '十进制' }],
    row('n', hasStep ? before : s.n, (p) => (hasStep && p === s.cleared ? 'compare' : ((hasStep ? before : s.n) >> p) & 1 ? 'idle' : 'dim')),
    ...(hasStep ? [row('n-1', minus, (p) => (p <= (s.cleared as number) ? 'swap' : (minus >> p) & 1 ? 'idle' : 'dim')), row('n&(n-1)', s.n, (p) => (p === s.cleared ? 'found' : (s.n >> p) & 1 ? 'done' : 'dim'))] : []),
  ]
  return (
    <div className="viz">
      <GridView rows={rows} maxCell={44} />
      {hasStep && <div className="row-label">黄色 = 最低位的 1；红色 = n-1 里被改动的位；绿色 = 消掉之后的结果</div>}
      <Stats items={[['原来的数', s.n0], ['已经消掉的 1', s.cnt], ['现在的 n', s.n]]} />
    </div>
  )
}

function parse(text: string): ParseResult<number> {
  return readInput(text, (r) => {
    const n = r.int('n', 1, 255)
    r.end()
    return n
  })
}

export const bitClear: AlgoDef<number, BitClearState> = {
  id: 'bitops',
  title: '位运算',
  tagline: '直接操作整数的二进制位：一个小小的表达式就能消掉最低位的 1，用它数 1 的个数、判断 2 的幂',
  kind: '算法',
  slug: 'popcount',
  name: '二进制中 1 的个数',
  type: '统计',
  statement: {
    desc: [
      '给定一个正整数 n，求它的二进制表示里有多少个 1。',
    ],
    input: [
      '一行一个整数 n（1 ≤ n ≤ 255）。',
    ],
    output: [
      '一行一个整数，是 n 的二进制里 1 的个数。',
    ],
  },
  intro: [
    '位运算直接操作整数的二进制位，速度快，写法短，是算法竞赛里的常用技巧。其中最有名的一个技巧是 n & (n-1)：它会把 n 的二进制里最低位的那个 1 变成 0，其他位保持不变。',
    '道理很简单：n-1 会让最低位的 1 变成 0，它右边原来全是 0 的位全部变成 1；这样 n 和 n-1 在这一段上一个是 1000…，一个是 0111…，按位与之后全是 0，而更高位两者相同，保持不变。反复执行 n &= n-1，每次消掉一个 1，直到 n 变成 0，执行的次数就是二进制里 1 的个数。',
  ],
  points: [
    'n & (n-1) 把最低位的 1 变成 0；n & (-n) 则是只保留最低位的 1（叫 lowbit，树状数组里会用到）。',
    '统计 1 的个数：每次 n&=n-1，计数加一，直到 n 为 0，循环次数等于 1 的个数。GCC 里可以直接用 __builtin_popcount。',
    '判断 n 是不是 2 的幂：2 的幂的二进制里只有一个 1，消掉之后就是 0，所以 n>0 && (n&(n-1))==0。',
    '这类技巧的关键，是看清每个运算符对每一位做了什么，不需要记结论，画一下二进制就能推出来。',
  ],
  pitfalls: [
    '用 n&(n-1) 判断 2 的幂时，要先排除 n=0（0&(−1)=0 会被误判为 2 的幂），写成 n>0 && …。',
    '负数的二进制是补码，对负数做这类位运算要格外小心，一般先转成无符号数。',
    '位运算的优先级低于比较运算符，写成 n&(n-1)==0 实际上是 n&((n-1)==0)，一定要加括号。',
  ],
  complexity: { time: 'O(1 的个数)', space: 'O(1)', note: '循环次数等于二进制里 1 的个数，最多就是位数（int 是 32），所以可以看作常数。' },
  presets: [
    { label: '180（10110100）', text: '180' },
    { label: '64（只有一个 1）', text: '64' },
    { label: '255（全是 1）', text: '255' },
  ],
  defaultInput: 180,
  parse,
  format: (v) => String(v),
  answer: (n) => String(n.toString(2).replace(/0/g, '').length),
  random: () => randInt(1, 255),
  run: runBitClear,
  View: BitView,
  sources: {
    c: String.raw`
#include <stdio.h>
int main(){
    int n,cnt=0;
    scanf("%d",&n);      // 读入 n                    //@init
    while (n){
        n&=(n-1);        // n&(n-1) 会消掉最低位的 1，次数加一  //@clear
        cnt++;                                      //@clear
    }
    printf("%d\n",cnt);  // 消了几次，就有几个 1             //@done
    return 0;
}
`,
    cpp: String.raw`
#include <bits/stdc++.h>
using namespace std;
int main(){
    int n,cnt=0;
    cin>>n;           // 读入 n                    //@init
    while (n){
        n&=(n-1);     // n&(n-1) 会消掉最低位的 1，次数加一  //@clear
        cnt++;                                   //@clear
    }
    cout<<cnt<<endl;  // 消了几次，就有几个 1             //@done
    return 0;
}
`,
    python: String.raw`
n=int(input())  # 读入 n                      #@init
cnt=0
while n:
    n&=n-1      # n&(n-1) 会消掉最低位的 1，次数加一    #@clear
    cnt+=1                                  #@clear
print(cnt)      # 消了几次，就有几个 1               #@done
`,
    java: String.raw`
import java.util.*;

public class Main{
    public static void main(String[] args){
        int n=new Scanner(System.in).nextInt();  // 读入 n                 //@init
        int cnt=0;
        while (n!=0){
            n&=(n-1);                         // n&(n-1) 会消掉最低位的 1，次数加一  //@clear
            cnt++;                                                       //@clear
        }
        System.out.println(cnt);              // 消了几次，就有几个 1             //@done
    }
}
`,
  },
  problems: pickProblems('P1100', 'P1226'),
  extra: [bitXor, bitSubsets],
}
