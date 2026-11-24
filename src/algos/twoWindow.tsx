import { ArrayView, type Cell, type Pointer } from '../components/ArrayView'
import { Stats } from '../components/Stats'
import { pickProblems } from '../data/problems'
import { Recorder } from '../engine/recorder'
import type { Example, Frame, ParseResult } from '../engine/types'
import { randInt, readInput } from './shared'

export interface WindowInput {
  s: number
  arr: number[]
}

export interface WindowState {
  arr: number[]
  s: number
  l: number
  r: number
  sum: number
  /** 到目前为止最短的合格窗口长度；还没有时为 0 */
  best: number
  /** 最短窗口的位置 */
  bestAt: [number, number] | null
  stage: 'start' | 'extend' | 'record' | 'shrink' | 'done'
}

export function runWindow({ s, arr }: WindowInput): Frame<WindowState>[] {
  const rec = new Recorder<WindowState>()
  const n = arr.length
  let l = 0
  let r = -1
  let sum = 0
  let best = 0
  let bestAt: [number, number] | null = null
  let stage: WindowState['stage'] = 'start'
  const snap = (): WindowState => ({ arr, s, l, r, sum, best, bestAt, stage })

  rec.push('init', snap(), `要找和不小于 ${s} 的最短连续一段。用 l、r 圈出一个“窗口”，窗口里的数的和记作 sum，开始时窗口是空的。思路是：窗口不够大就向右扩张，够大了就尽量从左边缩小，在缩小的过程中记录最短的长度。`)
  for (r = 0; r < n; r++) {
    sum += arr[r]
    stage = 'extend'
    rec.push('extend', snap(), `r 右移到 ${r}，把 a[${r}] = ${arr[r]} 加进窗口，窗口 [${l}, ${r}] 的和是 ${sum}，${sum >= s ? `不小于 ${s}，窗口已经够大了。` : `还不到 ${s}，继续向右扩张。`}`)
    while (sum >= s) {
      const len = r - l + 1
      if (best === 0 || len < best) {
        best = len
        bestAt = [l, r]
      }
      stage = 'record'
      rec.push('record', snap(), `窗口 [${l}, ${r}] 的和 ${sum} 不小于 ${s}，它的长度是 ${len}。${bestAt && bestAt[0] === l && bestAt[1] === r ? `比之前记录的都短，最短长度更新为 ${best}。` : `不比已经记录的最短长度 ${best} 更短。`}`)
      sum -= arr[l]
      l++
      stage = 'shrink'
      rec.push('shrink', snap(), `试着把窗口左边缩小：去掉 a[${l - 1}] = ${arr[l - 1]}，l 右移到 ${l}，窗口的和变成 ${sum}${sum >= s ? `，仍然不小于 ${s}，还可以继续缩小。` : `，不够 ${s} 了，要回去让 r 右移，重新扩张。`}`)
    }
  }
  stage = 'done'
  rec.push('done', snap(), best > 0 ? `r 走到了末尾，最短的窗口长度是 ${best}（下标 ${bestAt![0]} 到 ${bestAt![1]}）。` : `所有的数加起来也不到 ${s}，没有合格的窗口，输出 0。`)
  return rec.frames
}

function WindowView({ frame }: { frame: Frame<WindowState> }) {
  const s = frame.state
  const empty = s.r < s.l
  const cells: Cell[] = s.arr.map((v, i) => {
    const inWin = !empty && i >= s.l && i <= s.r
    const inBest = s.bestAt !== null && i >= s.bestAt[0] && i <= s.bestAt[1]
    let tone: Cell['tone'] = inWin ? 'compare' : 'idle'
    if (s.stage === 'done' && inBest) tone = 'found'
    return { id: i, v, tone }
  })
  const pointers: Pointer[] = s.stage === 'start' || s.stage === 'done' ? [] : [
    { name: 'l', index: s.l, tone: 'done' },
    { name: 'r', index: s.r, tone: 'swap' },
  ]
  return (
    <div className="viz">
      <div className="target-row">
        <span className="target-chip">
          目标 <b>{s.s}</b>
        </span>
        <span className="target-chip">
          窗口的和 sum = <b>{s.sum}</b>
        </span>
        {s.stage !== 'start' && s.stage !== 'done' && <span className={`verdict ${s.sum >= s.s ? 'ok' : 'bad'}`}>{s.sum >= s.s ? '够了' : '不够'}</span>}
        {s.stage === 'done' && (s.best > 0 ? <span className="verdict ok">最短长度 {s.best}</span> : <span className="verdict bad">没有合格的窗口：输出 0</span>)}
      </div>
      <ArrayView cells={cells} pointers={pointers} mode="boxes" minSlots={1} />
      <Stats items={[['窗口长度', empty ? 0 : s.r - s.l + 1], ['最短的合格长度', s.best || '—'], ['数组长度', s.arr.length]]} />
    </div>
  )
}

function parse(text: string): ParseResult<WindowInput> {
  return readInput(text, (r) => {
    const n = r.int('n', 2, 14)
    const s = r.int('s', 1, 300)
    const arr = r.ints(n, '数', 1, 30)
    r.end()
    return { s, arr }
  })
}

export const shortestWindow = ({ s, arr }: WindowInput) => {
  let best = 0
  for (let i = 0; i < arr.length; i++) {
    let sum = 0
    for (let j = i; j < arr.length; j++) {
      sum += arr[j]
      if (sum >= s) {
        if (best === 0 || j - i + 1 < best) best = j - i + 1
        break
      }
    }
  }
  return best
}

export const twoWindow: Example<WindowInput, WindowState> = {
  slug: 'window',
  name: '和不小于 s 的最短一段',
  type: '同向双指针（滑动窗口）',
  statement: {
    desc: ['给定 n 个正整数组成的数组和一个整数 s。在数组里找一段连续的数，使它们的和不小于 s，要求这一段尽量短。输出最短的长度；如果所有的数加起来也不到 s，输出 0。'],
    input: ['第一行两个整数 n 和 s（2 ≤ n ≤ 14，1 ≤ s ≤ 300）。', '第二行 n 个整数，每个在 1～30 之间。'],
    output: ['一行一个整数，是最短的长度，不存在时输出 0。'],
  },
  idea: [
    '直接做的话，要枚举每个起点，再向右一个个加到够 s 为止，最坏要做 n² 次。但这道题里所有的数都是正数，这就带来了一个性质：窗口向右扩张，和只会变大；向左缩小，和只会变小。',
    '有了单调性，就可以用两个指针 l 和 r 圈出一个窗口，并且两个指针都只往右走：先让 r 右移，把新的数加进窗口；只要窗口的和已经不小于 s，就记录一下长度，再让 l 右移，把最左边的数去掉，看看变短以后是否仍然够用。直到不够了，r 才再向右走。',
    '每个数最多被 r 加进来一次，被 l 去掉一次，所以总共只做 O(n) 次操作。这和上一道例题里“两个指针从两头往中间靠”不同，这里两个指针朝着同一个方向走，通常叫做滑动窗口。',
  ],
  complexity: { time: 'O(n)', space: 'O(1)', note: 'l 和 r 各自最多向右走 n 步。' },
  presets: [
    { label: '窗口会反复收缩', text: '8 15\n5 1 3 5 10 7 4 9' },
    { label: '整个数组才够', text: '5 20\n4 4 4 4 4' },
    { label: '怎么都不够', text: '4 100\n10 20 30 5' },
  ],
  defaultInput: { s: 12, arr: [2, 3, 1, 2, 4, 3, 5] },
  parse,
  format: (v) => `${v.arr.length} ${v.s}\n${v.arr.join(' ')}`,
  random: () => {
    const n = randInt(6, 12)
    return { s: randInt(8, 40), arr: Array.from({ length: n }, () => randInt(1, 12)) }
  },
  answer: (v) => String(shortestWindow(v)),
  run: runWindow,
  View: WindowView,
  sources: {
    c: String.raw`
#include <stdio.h>
int main(){
    int n,s,a[20];
    scanf("%d %d",&n,&s);
    for (int i=0;i<n;i++) scanf("%d",&a[i]);
    int l=0,sum=0,best=0;                         //@init
    for (int r=0;r<n;r++){
        sum+=a[r];                                //@extend
        while (sum>=s){
            if (best==0||r-l+1<best) best=r-l+1;  //@record
            sum-=a[l];                            //@shrink
            l++;                                  //@shrink
        }
    }
    printf("%d\n",best);                          //@done
    return 0;
}
`,
    cpp: String.raw`
#include <bits/stdc++.h>
using namespace std;
int main(){
    int n,s,a[20];
    cin>>n>>s;
    for (int i=0;i<n;i++) cin>>a[i];
    int l=0,sum=0,best=0;                         //@init
    for (int r=0;r<n;r++){
        sum+=a[r];                                //@extend
        while (sum>=s){
            if (best==0||r-l+1<best) best=r-l+1;  //@record
            sum-=a[l];                            //@shrink
            l++;                                  //@shrink
        }
    }
    cout<<best<<endl;                             //@done
    return 0;
}
`,
    python: String.raw`
n,s=map(int,input().split())
a=list(map(int,input().split()))
l,total,best=0,0,0                          #@init
for r in range(n):
    total+=a[r]                             #@extend
    while total>=s:
        if best==0 or r-l+1<best:
            best=r-l+1                      #@record
        total-=a[l]                         #@shrink
        l+=1                                #@shrink
print(best)                                 #@done
`,
    java: String.raw`
import java.util.*;

public class Main{
    public static void main(String[] args){
        Scanner sc=new Scanner(System.in);
        int n=sc.nextInt(),s=sc.nextInt();
        int[] a=new int[n];
        for (int i=0;i<n;i++) a[i]=sc.nextInt();
        int l=0,sum=0,best=0;                         //@init
        for (int r=0;r<n;r++){
            sum+=a[r];                                //@extend
            while (sum>=s){
                if (best==0||r-l+1<best) best=r-l+1;  //@record
                sum-=a[l];                            //@shrink
                l++;                                  //@shrink
            }
        }
        System.out.println(best);                     //@done
    }
}
`,
  },
  problems: pickProblems('P1638', 'P1147'),
}
