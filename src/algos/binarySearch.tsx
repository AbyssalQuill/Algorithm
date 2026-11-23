import { ArrayView, type Cell, type Pointer, type Tone } from '../components/ArrayView'
import { Stats } from '../components/Stats'
import { pickProblems } from '../data/problems'
import { Recorder } from '../engine/recorder'
import type { AlgoDef, Frame, ParseResult } from '../engine/types'

export interface BsInput {
  arr: number[]
  target: number
}

export interface BsState {
  cells: { id: number; v: number }[]
  target: number
  lo: number
  hi: number
  mid: number | null
  status: 'run' | 'found' | 'miss'
  steps: number
}

export function runBinarySearch({ arr, target }: BsInput): Frame<BsState>[] {
  const rec = new Recorder<BsState>()
  const a = arr
  const cells = a.map((v, id) => ({ id, v }))
  let lo = 0
  let hi = a.length - 1
  let mid: number | null = null
  let steps = 0
  const snap = (status: BsState['status'] = 'run'): BsState => ({ cells, target, lo, hi, mid, status, steps })

  rec.push('init', snap(), `要在有序数组里查找 ${target}，先把整个数组作为候选区间：lo = 0，hi = ${hi}。`)
  while (lo <= hi) {
    mid = null
    rec.push('loop', snap(), `当前的候选区间是 [${lo}, ${hi}]，还剩 ${hi - lo + 1} 个数。`)
    mid = lo + Math.floor((hi - lo) / 2)
    steps++
    rec.push('mid', snap(), `取中间位置 mid = ${lo} + (${hi} - ${lo}) / 2 = ${mid}，检查 a[${mid}] = ${a[mid]} 是不是目标。`)
    if (a[mid] === target) {
      rec.push('hit', snap('found'), `a[${mid}] = ${a[mid]} 恰好等于 ${target}，查找成功，答案是下标 ${mid}。`)
      return rec.frames
    }
    if (a[mid] < target) {
      lo = mid + 1
      rec.push('goRight', snap(), `a[${mid}] = ${a[mid]} 比 ${target} 小，目标只可能在右边，令 lo = mid + 1 = ${lo}，左半部分全部排除。`)
    } else {
      hi = mid - 1
      rec.push('goLeft', snap(), `a[${mid}] = ${a[mid]} 比 ${target} 大，目标只可能在左边，令 hi = mid - 1 = ${hi}，右半部分全部排除。`)
    }
  }
  mid = null
  rec.push('miss', snap('miss'), `lo = ${lo} 已经大于 hi = ${hi}，候选区间为空，说明数组里没有 ${target}，返回 -1。`)
  return rec.frames
}

function BsView({ frame }: { frame: Frame<BsState> }) {
  const s = frame.state
  const cells: Cell[] = s.cells.map((c, i) => {
    let tone: Tone = 'idle'
    if (s.status === 'miss' || i < s.lo || i > s.hi) tone = 'dim'
    if (s.mid === i) tone = s.status === 'found' ? 'found' : 'compare'
    return { id: c.id, v: c.v, tone }
  })
  const pointers: Pointer[] = [
    { name: 'lo', index: s.lo, tone: 'done' },
    { name: 'hi', index: s.hi, tone: 'done' },
  ]
  if (s.mid !== null) pointers.push({ name: 'mid', index: s.mid, tone: 'compare' })
  const left = Math.max(0, s.hi - s.lo + 1)
  return (
    <div className="viz">
      <div className="target-row">
        <span className="target-chip">
          要找 <b>{s.target}</b>
        </span>
        {s.status === 'found' && <span className="verdict ok">找到了：下标 {s.mid}</span>}
        {s.status === 'miss' && <span className="verdict bad">没找到：返回 -1</span>}
      </div>
      <ArrayView cells={cells} pointers={pointers} mode="boxes" minSlots={2} />
      <Stats
        items={[
          ['候选个数', s.status === 'miss' ? 0 : left],
          ['已看了几次', s.steps],
          ['数组长度', s.cells.length],
        ]}
      />
    </div>
  )
}

function parseNums(text: string): number[] {
  return text
    .trim()
    .split(/[\s,，、]+/)
    .filter(Boolean)
    .map(Number)
}

function parse(text: string): ParseResult<BsInput> {
  const parts = text.split(/[|｜]/)
  if (parts.length !== 2) return { ok: false, error: '格式是「有序数组 | 目标」，例如：1 3 5 7 9 | 7' }
  const arr = parseNums(parts[0])
  const t = parseNums(parts[1])
  if (arr.length < 1 || arr.length > 14) return { ok: false, error: '数组里请放 1～14 个整数。' }
  if (t.length !== 1) return { ok: false, error: '“|”右边只放一个目标数。' }
  if ([...arr, t[0]].some((x) => !Number.isInteger(x) || x < 0 || x > 99)) return { ok: false, error: '数都要是 0～99 之间的整数哦。' }
  for (let i = 1; i < arr.length; i++) if (arr[i] < arr[i - 1]) return { ok: false, error: '二分查找要求数组已经从小到大排好序，请先排序再输入。' }
  return { ok: true, value: { arr, target: t[0] } }
}

export const binarySearch: AlgoDef<BsInput, BsState> = {
  id: 'binary-search',
  title: '二分查找',
  tagline: '在有序数组里每次查看正中间的元素，一次就能排除一半的候选',
  kind: '算法',
  intro: [
    '二分查找只能用在已经排好序的数据上。每次先看候选区间正中间的数：如果它恰好是目标，查找就结束了；如果它比目标小，目标只可能在右边；如果比目标大，则只可能在左边。',
    '每看一次，候选范围就缩小一半，所以 n 个数最多只需要看大约 log₂n 次，一百万个数也不过二十次左右。',
  ],
  points: [
    '用 lo 和 hi 表示尚未排除的闭区间 [lo, hi]，循环的条件是 lo<=hi。',
    '中点写成 mid = lo + (hi - lo) / 2，比 (lo + hi) / 2 更不容易溢出。',
    '如果 a[mid] 比目标小，说明 mid 以及它左边的元素都可以排除，因此令 lo = mid + 1；另一侧同理，令 hi = mid - 1。',
    '循环结束时 lo 已经大于 hi，仍然没有找到，就说明目标不存在，返回 -1。',
  ],
  pitfalls: [
    '数组没有排好序就使用二分查找，结果是不可靠的。',
    '把更新写成 lo = mid 或 hi = mid（少了 +1 或 -1），在某些情况下会进入死循环。',
    '数组里有重复的数时，这种写法找到的不一定是第一个。如果要找“第一个大于等于 x 的位置”，需要使用 lower_bound 的写法，后面会专门介绍。',
  ],
  complexity: { time: 'O(log n)', space: 'O(1)' },
  inputHint: '格式：有序数组 | 目标，例如 1 3 5 7 9 11 | 7（0～99，最多 14 个数）。',
  presets: [
    { label: '找得到', text: '2 5 8 12 16 23 38 56 | 23' },
    { label: '找不到', text: '2 5 8 12 16 23 38 56 | 20' },
    { label: '在最左边', text: '2 5 8 12 16 23 38 56 | 2' },
    { label: '在最右边', text: '2 5 8 12 16 23 38 56 | 56' },
  ],
  defaultInput: { arr: [2, 5, 8, 12, 16, 23, 38, 56], target: 23 },
  parse,
  format: (v) => `${v.arr.join(' ')} | ${v.target}`,
  random: () => {
    const set = new Set<number>()
    while (set.size < 10) set.add(1 + Math.floor(Math.random() * 60))
    const arr = [...set].sort((x, y) => x - y)
    const target = Math.random() < 0.7 ? arr[Math.floor(Math.random() * arr.length)] : 1 + Math.floor(Math.random() * 60)
    return { arr, target }
  },
  run: runBinarySearch,
  View: BsView,
  sources: {
    c: String.raw`
#include <stdio.h>
int binarySearch(int a[],int n,int target){
    int lo=0,hi=n-1;                         //@init
    while (lo<=hi){                          //@loop
        int mid=lo+(hi-lo)/2;                //@mid
        if (a[mid]==target) return mid;      //@hit
        else if (a[mid]<target) lo=mid+1;    //@goRight
        else hi=mid-1;                       //@goLeft
    }
    return -1;                               //@miss
}
int main(){
    int n,target,a[1005];
    scanf("%d",&n);
    for (int i=0;i<n;i++) scanf("%d",&a[i]);
    scanf("%d",&target);
    printf("%d\n",binarySearch(a,n,target));
    return 0;
}
`,
    cpp: String.raw`
#include <bits/stdc++.h>
using namespace std;
int binarySearch(int a[],int n,int target){
    int lo=0,hi=n-1;                         //@init
    while (lo<=hi){                          //@loop
        int mid=lo+(hi-lo)/2;                //@mid
        if (a[mid]==target) return mid;      //@hit
        else if (a[mid]<target) lo=mid+1;    //@goRight
        else hi=mid-1;                       //@goLeft
    }
    return -1;                               //@miss
}
int main(){
    int n,target,a[1005];
    cin>>n;
    for (int i=0;i<n;i++) cin>>a[i];
    cin>>target;
    cout<<binarySearch(a,n,target)<<endl;
    return 0;
}
`,
    python: String.raw`
def binary_search(a, target):
    lo, hi = 0, len(a) - 1               #@init
    while lo <= hi:                      #@loop
        mid = lo + (hi - lo) // 2        #@mid
        if a[mid] == target:             #@hit
            return mid                   #@hit
        elif a[mid] < target:            #@goRight
            lo = mid + 1                 #@goRight
        else:                            #@goLeft
            hi = mid - 1                 #@goLeft
    return -1                            #@miss


n = int(input())
a = list(map(int, input().split()))
target = int(input())
print(binary_search(a, target))
`,
    java: String.raw`
import java.util.*;

public class Main {
    static int binarySearch(int[] a, int target) {
        int lo = 0, hi = a.length - 1;           //@init
        while (lo <= hi) {                       //@loop
            int mid = lo + (hi - lo) / 2;        //@mid
            if (a[mid] == target) return mid;    //@hit
            else if (a[mid] < target) lo = mid + 1;   //@goRight
            else hi = mid - 1;                   //@goLeft
        }
        return -1;                               //@miss
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        int[] a = new int[n];
        for (int i = 0; i < n; i++) a[i] = sc.nextInt();
        int target = sc.nextInt();
        System.out.println(binarySearch(a, target));
    }
}
`,
  },
  problems: pickProblems('P2249', 'P1678', 'P1873'),
}
