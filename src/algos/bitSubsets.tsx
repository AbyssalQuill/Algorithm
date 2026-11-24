import { GridView, type GridCell } from '../components/GridView'
import { Stats } from '../components/Stats'
import { pickProblems } from '../data/problems'
import { Recorder } from '../engine/recorder'
import type { Example, Frame, ParseResult } from '../engine/types'
import { randInt, readInput } from './shared'

export interface SubsetInput {
  a: number[]
  target: number
}

export interface SubsetState {
  a: number[]
  target: number
  /** 当前枚举到的子集（用二进制数表示：第 i 位是 1 表示选了 a[i]） */
  mask: number
  sum: number
  /** 已经枚举了几个子集 */
  seen: number
  /** 和等于 target 的子集 */
  hits: number[]
  done: boolean
}

export function runSubsets({ a, target }: SubsetInput): Frame<SubsetState>[] {
  const rec = new Recorder<SubsetState>()
  const n = a.length
  const total = 1 << n
  const hits: number[] = []
  let mask = 0
  let sum = 0
  let seen = 0
  let done = false
  const snap = (): SubsetState => ({ a, target, mask, sum, seen, hits, done })
  const show = (m: number) => {
    const items = a.filter((_, i) => (m >> i) & 1)
    return items.length ? `{${items.join(', ')}}` : '空集'
  }

  rec.push('init', snap(), `${n} 个数，每个数“选”或“不选”，一共有 2^${n} = ${total} 个子集。用一个 ${n} 位的二进制数 mask 来表示一个子集：mask 的第 i 位是 1，就表示选了 a[i]。让 mask 从 0 数到 ${total - 1}，就恰好把所有子集枚举了一遍。`)
  for (mask = 0; mask < total; mask++) {
    sum = 0
    for (let i = 0; i < n; i++) if ((mask >> i) & 1) sum += a[i]
    seen = mask + 1
    rec.push('mask', snap(), `mask = ${mask}，二进制 ${mask.toString(2).padStart(n, '0')}，对应子集 ${show(mask)}，元素的和是 ${sum}${sum === target ? `，正好等于 ${target}` : sum > target ? '，已经超过了目标' : '，还不够'}。`)
    if (sum === target) {
      hits.push(mask)
      rec.push('hit', snap(), `和等于 ${target}，这是第 ${hits.length} 个满足条件的子集，计数加一。`)
    }
  }
  mask = total - 1
  done = true
  rec.push('done', snap(), `${total} 个子集都检查过了，和等于 ${target} 的子集一共有 ${hits.length} 个。`)
  return rec.frames
}

function SubsetView({ frame }: { frame: Frame<SubsetState> }) {
  const s = frame.state
  const n = s.a.length
  const started = s.seen > 0
  const rows: GridCell[][] = [
    [{ head: true, text: '第 i 位' }, ...Array.from({ length: n }, (_, i): GridCell => ({ head: true, text: n - 1 - i }))],
    [{ head: true, text: 'a[i]' }, ...Array.from({ length: n }, (_, i): GridCell => ({ text: s.a[n - 1 - i], tone: started && (s.mask >> (n - 1 - i)) & 1 ? 'compare' : 'dim' }))],
    [{ head: true, text: 'mask' }, ...Array.from({ length: n }, (_, i): GridCell => ({ text: started ? (s.mask >> (n - 1 - i)) & 1 : 0, tone: started && (s.mask >> (n - 1 - i)) & 1 ? 'found' : 'idle' }))],
  ]
  const items = s.a.filter((_, i) => started && (s.mask >> i) & 1)
  const isHit = started && s.sum === s.target
  return (
    <div className="viz">
      <GridView rows={rows} maxCell={50} />
      <div className="target-row">
        <span className="target-chip">
          选中的数：<b>{items.length ? items.join(' + ') : '（一个都不选）'}</b>
          {started ? ` = ${s.sum}` : ''}
        </span>
        {started && !s.done && <span className={`verdict ${isHit ? 'ok' : 'bad'}`}>{isHit ? `等于 ${s.target}` : s.sum > s.target ? '超过了' : '还不够'}</span>}
      </div>
      <div className="row-label">已经找到的子集</div>
      <div className="outline">
        {s.hits.length === 0 ? <span className="qrow-empty">还没有</span> : s.hits.map((m) => <span key={m} className="qchip">{`{${s.a.filter((_, i) => (m >> i) & 1).join(', ')}}`}</span>)}
      </div>
      <Stats items={[['已枚举', `${s.seen} / ${1 << n}`], ['目标', s.target], ['满足的个数', s.hits.length]]} />
    </div>
  )
}

function parse(text: string): ParseResult<SubsetInput> {
  return readInput(text, (r) => {
    const n = r.int('n', 2, 5)
    const target = r.int('t', 1, 99)
    const a = r.ints(n, '数', 1, 30)
    r.end()
    return { a, target }
  })
}

export const bitSubsets: Example<SubsetInput, SubsetState> = {
  slug: 'subsets',
  name: '选数凑和',
  type: '子集枚举',
  statement: {
    desc: ['给定 n 个正整数和一个目标值 t。从这 n 个数里任意选出一些数（可以一个都不选），要求选出的数之和恰好等于 t。问一共有多少种不同的选法。选的数不同，就算不同的选法，哪怕这些数的值相同。'],
    input: ['第一行两个整数 n 和 t（2 ≤ n ≤ 5，1 ≤ t ≤ 99）。', '第二行 n 个整数，每个在 1～30 之间。'],
    output: ['一行一个整数，是满足条件的选法的个数。'],
  },
  idea: [
    '每个数只有“选”和“不选”两种可能，n 个数就有 2ⁿ 种选法。这个数目恰好等于 n 位二进制数能表示的数的个数：用一个 n 位的二进制数 mask 表示一种选法，mask 的第 i 位是 1，就表示选了第 i 个数。',
    '于是枚举所有选法，就变成了让 mask 从 0 数到 2ⁿ − 1。对每个 mask，用 (mask >> i) & 1 取出第 i 位，是 1 就把 a[i] 加进总和，最后和 t 比较。这种用二进制数表示集合的做法叫“状态压缩”，是位运算在竞赛里最常见的用法之一。',
    '子集的个数增长得很快，n 到 20 时有一百多万个，这种枚举还可以接受；到 30 就太多了，要换别的方法，比如动态规划。',
  ],
  complexity: { time: 'O(2ⁿ·n)', space: 'O(n)', note: '一共 2ⁿ 个子集，检查每个子集要看 n 位。' },
  presets: [
    { label: '有两种选法', text: '4 7\n2 3 4 5' },
    { label: '没有选法', text: '3 50\n5 10 20' },
    { label: '有相同的数', text: '4 4\n2 2 2 2' },
  ],
  defaultInput: { a: [3, 5, 2, 4], target: 9 },
  parse,
  format: (v) => `${v.a.length} ${v.target}\n${v.a.join(' ')}`,
  random: () => {
    const n = randInt(3, 5)
    const a = Array.from({ length: n }, () => randInt(1, 12))
    return { a, target: randInt(5, 24) }
  },
  answer: (v) => {
    let cnt = 0
    for (let m = 0; m < 1 << v.a.length; m++) {
      let sum = 0
      v.a.forEach((x, i) => {
        if ((m >> i) & 1) sum += x
      })
      if (sum === v.target) cnt++
    }
    return String(cnt)
  },
  run: runSubsets,
  View: SubsetView,
  sources: {
    c: String.raw`
#include <stdio.h>
int main(){
    int n,t,a[10];
    scanf("%d %d",&n,&t);
    for (int i=0;i<n;i++) scanf("%d",&a[i]);
    int cnt=0;                              //@init
    for (int mask=0;mask<(1<<n);mask++){
        int sum=0;
        for (int i=0;i<n;i++){
            if ((mask>>i)&1) sum+=a[i];
        }
        if (sum==t){                        //@mask
            cnt++;                          //@hit
        }
    }
    printf("%d\n",cnt);                     //@done
    return 0;
}
`,
    cpp: String.raw`
#include <bits/stdc++.h>
using namespace std;
int main(){
    int n,t,a[10];
    cin>>n>>t;
    for (int i=0;i<n;i++) cin>>a[i];
    int cnt=0;                              //@init
    for (int mask=0;mask<(1<<n);mask++){
        int sum=0;
        for (int i=0;i<n;i++){
            if ((mask>>i)&1) sum+=a[i];
        }
        if (sum==t){                        //@mask
            cnt++;                          //@hit
        }
    }
    cout<<cnt<<endl;                        //@done
    return 0;
}
`,
    python: String.raw`
n,t=map(int,input().split())
a=list(map(int,input().split()))
cnt=0                                       #@init
for mask in range(1<<n):
    s=0
    for i in range(n):
        if (mask>>i)&1:
            s+=a[i]
    if s==t:                                #@mask
        cnt+=1                              #@hit
print(cnt)                                  #@done
`,
    java: String.raw`
import java.util.*;

public class Main{
    public static void main(String[] args){
        Scanner sc=new Scanner(System.in);
        int n=sc.nextInt(),t=sc.nextInt();
        int[] a=new int[n];
        for (int i=0;i<n;i++) a[i]=sc.nextInt();
        int cnt=0;                          //@init
        for (int mask=0;mask<(1<<n);mask++){
            int sum=0;
            for (int i=0;i<n;i++){
                if (((mask>>i)&1)==1) sum+=a[i];
            }
            if (sum==t){                    //@mask
                cnt++;                      //@hit
            }
        }
        System.out.println(cnt);            //@done
    }
}
`,
  },
  problems: pickProblems('P1036'),
}
