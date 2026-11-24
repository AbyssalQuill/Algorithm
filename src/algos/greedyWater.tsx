import { ArrayView, type Cell } from '../components/ArrayView'
import { Stats } from '../components/Stats'
import { pickProblems } from '../data/problems'
import { Recorder } from '../engine/recorder'
import type { Example, Frame, ParseResult } from '../engine/types'
import { randInt, readInput } from './shared'

export interface WaterState {
  /** 按当前的接水顺序排列的人：id 是他在输入里的编号 */
  order: { id: number; t: number }[]
  /** 已经轮到了几个人 */
  served: number
  /** 轮到当前这个人时，他前面所有人已经用掉的时间，也就是他的等待时间 */
  wait: number
  total: number
  sorted: boolean
  done: boolean
}

export function runWater(t: number[]): Frame<WaterState>[] {
  const rec = new Recorder<WaterState>()
  let order = t.map((x, id) => ({ id, t: x }))
  let served = 0
  let wait = 0
  let total = 0
  let sorted = false
  let done = false
  const snap = (): WaterState => ({ order, served, wait, total, sorted, done })

  rec.push('init', snap(), `只有一个水龙头，大家排队接水，每个人的等待时间是他前面所有人接水时间的总和。要安排接水的顺序，使所有人的等待时间之和最小。先看一看现在这个顺序：它并不一定好。`)
  order = [...order].sort((x, y) => x.t - y.t || x.id - y.id)
  sorted = true
  rec.push('sort', snap(), `贪心的做法：接水时间短的人排在前面。因为排在前面的人的接水时间，会被后面每一个人等待一遍，时间越短，被重复计算的代价就越小。按接水时间从小到大排序。`)
  for (let i = 0; i < order.length; i++) {
    served = i + 1
    total += wait
    rec.push('wait', snap(), `第 ${i + 1} 个人（接水 ${order[i].t} 分钟）要等前面所有人接完，等待 ${wait} 分钟，总的等待时间加上 ${wait}，变成 ${total}。`)
    wait += order[i].t
  }
  done = true
  rec.push('done', snap(), `所有人都安排好了，最小的总等待时间是 ${total}。`)
  return rec.frames
}

function WaterView({ frame }: { frame: Frame<WaterState> }) {
  const s = frame.state
  const cells: Cell[] = s.order.map((p, i) => {
    let tone: Cell['tone'] = 'idle'
    if (s.sorted && i < s.served) tone = 'done'
    if (s.sorted && !s.done && i === s.served - 1) tone = 'compare'
    return { id: p.id, v: p.t, tone, label: `${p.t}` }
  })
  return (
    <div className="viz">
      <ArrayView cells={cells} mode="bars" areaH={190} minSlots={0} />
      <div className="row-label">{s.sorted ? '按接水时间从小到大排好的队（柱子越高，接水越久）' : '现在的队伍（柱子越高，接水越久）'}</div>
      {s.sorted && s.served > 0 && !s.done && (
        <div className="target-row">
          <span className="target-chip">
            第 {s.served} 个人等待 <b>{s.wait}</b> 分钟
          </span>
        </div>
      )}
      {s.done && (
        <div className="target-row">
          <span className="verdict ok">最小的总等待时间：{s.total}</span>
        </div>
      )}
      <Stats items={[['人数', s.order.length], ['已经算过的人', s.served], ['总等待时间', s.total]]} />
    </div>
  )
}

function parse(text: string): ParseResult<number[]> {
  return readInput(text, (r) => {
    const n = r.int('n', 2, 8)
    const t = r.ints(n, '接水时间', 1, 20)
    r.end()
    return t
  })
}

export const minWait = (t: number[]) => {
  let wait = 0
  let total = 0
  for (const x of [...t].sort((a, b) => a - b)) {
    total += wait
    wait += x
  }
  return total
}

export const greedyWater: Example<number[], WaterState> = {
  slug: 'water',
  name: '排队接水',
  type: '按大小排序',
  statement: {
    desc: ['有 n 个人在一个水龙头前排队接水，第 i 个人需要 t[i] 分钟。每个人的等待时间，是他开始接水之前，前面所有人接水用掉的时间之和（自己接水的时间不算）。可以任意安排接水的顺序，求所有人等待时间之和的最小值。'],
    input: ['第一行一个整数 n（2 ≤ n ≤ 8）。', '第二行 n 个整数，是每个人的接水时间，每个在 1～20 之间。'],
    output: ['一行一个整数，是所有人等待时间之和的最小值。'],
  },
  idea: [
    '先想想谁应该排在最前面。排在第一位的人，他的接水时间会被后面 n−1 个人各等待一遍；排在第二位的人，会被后面 n−2 个人等待……也就是说，排得越靠前，他的接水时间被“重复计算”的次数越多。所以应该让接水时间最短的人排在最前面。',
    '这个想法可以用“交换”来证明：假如有相邻的两个人，前面的人接水时间更长，把他们交换位置，后面所有人的等待时间不变，这两个人的等待时间之和会变小。所以只要存在“前长后短”的相邻对，就还能改进，最优的顺序一定是从小到大排好的。',
    '和活动选择不同，这里贪心的标准不是“结束得早”，而是“用时少的在前”。每一道贪心题的难点，都在于找到那个正确的排序标准，并且想办法说明它为什么对。',
  ],
  complexity: { time: 'O(n log n)', space: 'O(1)', note: '时间都花在排序上，排好以后只需要扫描一遍。' },
  presets: [
    { label: '原来的顺序很差', text: '5\n9 1 7 2 5' },
    { label: '全都一样', text: '4\n3 3 3 3' },
    { label: '只有两个人', text: '2\n8 2' },
  ],
  defaultInput: [6, 2, 8, 3, 5],
  parse,
  format: (v) => `${v.length}\n${v.join(' ')}`,
  random: () => Array.from({ length: randInt(3, 7) }, () => randInt(1, 15)),
  answer: (v) => String(minWait(v)),
  run: runWater,
  View: WaterView,
  sources: {
    c: String.raw`
#include <stdio.h>
#include <stdlib.h>
int cmp(const void *x,const void *y){
    return *(int*)x-*(int*)y;
}
int main(){
    int n,t[20];
    scanf("%d",&n);
    for (int i=0;i<n;i++) scanf("%d",&t[i]);  // 读入每个人的接水时间             //@init
    qsort(t,n,sizeof(int),cmp);               // 接水时间短的排在前面             //@sort
    int total=0,wait=0;
    for (int i=0;i<n;i++){
        total+=wait;                          // 这个人的等待时间，是前面所有人接水时间之和  //@wait
        wait+=t[i];                                                     //@wait
    }
    printf("%d\n",total);                     // 输出最小的总等待时间             //@done
    return 0;
}
`,
    cpp: String.raw`
#include <bits/stdc++.h>
using namespace std;
int main(){
    int n,t[20];
    cin>>n;
    for (int i=0;i<n;i++) cin>>t[i];  // 读入每个人的接水时间             //@init
    sort(t,t+n);                      // 接水时间短的排在前面             //@sort
    int total=0,wait=0;
    for (int i=0;i<n;i++){
        total+=wait;                  // 这个人的等待时间，是前面所有人接水时间之和  //@wait
        wait+=t[i];                                             //@wait
    }
    cout<<total<<endl;                // 输出最小的总等待时间             //@done
    return 0;
}
`,
    python: String.raw`
n=int(input())
t=list(map(int,input().split()))  # 读入每个人的接水时间             #@init
t.sort()                          # 接水时间短的排在前面             #@sort
total,wait=0,0
for x in t:
    total+=wait                   # 这个人的等待时间，是前面所有人接水时间之和  #@wait
    wait+=x                                                #@wait
print(total)                      # 输出最小的总等待时间             #@done
`,
    java: String.raw`
import java.util.*;

public class Main{
    public static void main(String[] args){
        Scanner sc=new Scanner(System.in);
        int n=sc.nextInt();
        int[] t=new int[n];
        for (int i=0;i<n;i++) t[i]=sc.nextInt();  // 读入每个人的接水时间         //@init
        Arrays.sort(t);                       // 接水时间短的排在前面             //@sort
        int total=0,wait=0;
        for (int i=0;i<n;i++){
            total+=wait;                      // 这个人的等待时间，是前面所有人接水时间之和  //@wait
            wait+=t[i];                                                 //@wait
        }
        System.out.println(total);            // 输出最小的总等待时间             //@done
    }
}
`,
  },
  problems: pickProblems('P1223', 'P1090'),
}
