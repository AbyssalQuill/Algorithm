import { ArrayView, type Cell, type Pointer, type Tone } from '../components/ArrayView'
import { Stats } from '../components/Stats'
import { pickProblems } from '../data/problems'
import { Recorder } from '../engine/recorder'
import type { AlgoDef, Frame } from '../engine/types'
import { arrayInput, randList } from './shared'

type Item = { id: number; v: number }

export interface MsState {
  cells: Item[]
  /** 辅助数组：还没写入的位置是 null */
  tmp: (Item | null)[]
  /** 当前处理的区间 [l, r]，mid 是分界；-1 表示没有 */
  l: number
  r: number
  mid: number
  i: number | null
  j: number | null
  k: number | null
  depth: number
  compares: number
  writes: number
  merges: number
}

export function runMergeSort(input: number[]): Frame<MsState>[] {
  const rec = new Recorder<MsState>()
  const a: Item[] = input.map((v, id) => ({ id, v }))
  const n = a.length
  const tmp: (Item | null)[] = new Array(n).fill(null)
  let l = -1
  let r = -1
  let mid = -1
  let i: number | null = null
  let j: number | null = null
  let k: number | null = null
  let depth = 0
  let compares = 0
  let writes = 0
  let merges = 0
  const snap = (): MsState => ({ cells: a, tmp, l, r, mid, i, j, k, depth, compares, writes, merges })
  const clearPtr = () => {
    i = j = k = null
  }

  const sort = (lo: number, hi: number, d: number) => {
    l = lo
    r = hi
    mid = -1
    depth = d
    clearPtr()
    if (lo >= hi) {
      rec.push('call', snap(), `区间 [${lo}, ${hi}] 里只有一个数 ${a[lo].v}，它自己就是有序的，不用再分。`)
      return
    }
    rec.push('call', snap(), `处理区间 [${lo}, ${hi}]，共 ${hi - lo + 1} 个数。先把它从中间分成两半，各自排好序，再合并。`)
    const m = Math.floor((lo + hi) / 2)
    mid = m
    rec.push('split', snap(), `中点 mid = (${lo} + ${hi}) / 2 = ${m}，左半 [${lo}, ${m}]，右半 [${m + 1}, ${hi}]。`)
    sort(lo, m, d + 1)
    sort(m + 1, hi, d + 1)
    l = lo
    r = hi
    mid = m
    depth = d
    let p = lo
    let q = m + 1
    let w = lo
    i = p
    j = q
    k = w
    rec.push('merge', snap(), `左右两半都已经有序，开始合并。用 i、j 分别指向两半的第一个数，k 指向辅助数组里下一个要写入的位置。`)
    while (p <= m && q <= hi) {
      compares++
      i = p
      j = q
      k = w
      if (a[p].v <= a[q].v) {
        tmp[w++] = a[p++]
        writes++
        k = w
        i = p
        rec.push('takeL', snap(), `a[${p - 1}] = ${tmp[w - 1]!.v} 不比 a[${q}] = ${a[q].v} 大，把左边的 ${tmp[w - 1]!.v} 取出放进辅助数组。（相等时取左边，保证稳定。）`)
      } else {
        tmp[w++] = a[q++]
        writes++
        k = w
        j = q
        rec.push('takeR', snap(), `a[${q - 1}] = ${tmp[w - 1]!.v} 比 a[${p}] = ${a[p].v} 小，把右边的 ${tmp[w - 1]!.v} 取出放进辅助数组。`)
      }
    }
    if (p <= m) {
      const rest: number[] = []
      while (p <= m) {
        rest.push(a[p].v)
        tmp[w++] = a[p++]
        writes++
      }
      i = p
      k = w
      rec.push('restL', snap(), `右半已经取完，左半还剩 ${rest.join('、')}，它们本来就有序，原样接到后面。`)
    }
    if (q <= hi) {
      const rest: number[] = []
      while (q <= hi) {
        rest.push(a[q].v)
        tmp[w++] = a[q++]
        writes++
      }
      j = q
      k = w
      rec.push('restR', snap(), `左半已经取完，右半还剩 ${rest.join('、')}，它们本来就有序，原样接到后面。`)
    }
    for (let x = lo; x <= hi; x++) {
      a[x] = tmp[x]!
      tmp[x] = null
    }
    merges++
    clearPtr()
    rec.push('copy', snap(), `把辅助数组里排好的内容复制回 a[${lo}..${hi}]，这一段现在是有序的了。`)
  }

  rec.push('init', snap(), `一共 ${n} 个数。归并排序先把数组不断对半拆开，拆到只剩一个数时它自然有序，再一层一层地把有序的两半合并起来。`)
  sort(0, n - 1, 0)
  l = r = mid = -1
  depth = 0
  clearPtr()
  rec.push('done', snap(), `排序完成，共比较 ${compares} 次，合并了 ${merges} 次。`)
  return rec.frames
}

function MsView({ frame }: { frame: Frame<MsState> }) {
  const s = frame.state
  const n = s.cells.length
  const active = s.l >= 0
  const cells: Cell[] = s.cells.map((c, idx) => {
    let tone: Tone = 'idle'
    if (active && (idx < s.l || idx > s.r)) tone = 'dim'
    if (active && s.mid >= 0 && idx >= s.l && idx <= s.mid) tone = 'idle'
    if (active && s.mid >= 0 && idx > s.mid && idx <= s.r) tone = 'compare'
    if (!active) tone = 'done'
    return { id: c.id, v: c.v, tone }
  })
  const tmpCells: Cell[] = Array.from({ length: n }, (_, idx): Cell => {
    const t = s.tmp[idx]
    return t ? { id: idx, v: t.v, tone: 'done' } : { id: idx, v: 0, label: '', tone: 'dim' }
  })
  const pointers: Pointer[] = []
  if (s.i !== null && s.i < n) pointers.push({ name: 'i', index: s.i, tone: 'done' })
  if (s.j !== null && s.j < n) pointers.push({ name: 'j', index: s.j, tone: 'compare' })
  const tmpPtr: Pointer[] = s.k !== null && s.k < n ? [{ name: 'k', index: s.k, tone: 'swap' }] : []
  return (
    <div className="viz">
      <div className="row-label">原数组{active ? `（当前处理 [${s.l}, ${s.r}]，浅黄色是右半）` : ''}</div>
      <ArrayView cells={cells} pointers={pointers} mode="bars" areaH={150} minSlots={2} />
      <div className="row-label">辅助数组 tmp</div>
      <ArrayView cells={tmpCells} pointers={tmpPtr} mode="boxes" minSlots={tmpPtr.length > 0 ? 1 : 0} />
      <Stats
        items={[
          ['递归层数', s.depth],
          ['比较次数', s.compares],
          ['合并次数', s.merges],
        ]}
      />
    </div>
  )
}

export const mergeSort: AlgoDef<number[], MsState> = {
  id: 'merge-sort',
  title: '归并排序',
  tagline: '先对半拆开分别排好，再把两个有序的部分合并成一个',
  kind: '算法',
  slug: 'sort',
  name: '从小到大排序',
  type: '排序',
  statement: {
    desc: [
      '给定 n 个整数，用归并排序把它们从小到大排好序，输出排序之后的结果。演示里可以看到数组怎样被拆开、又怎样被合并。',
    ],
    input: [
      '第一行一个整数 n（2 ≤ n ≤ 10）。',
      '第二行 n 个整数，每个在 1～99 之间，可以有相同的数。',
    ],
    output: [
      '一行 n 个整数，从小到大排列，用空格隔开。',
    ],
  },
  intro: [
    '归并排序是“分治”思想的典型例子。要给一个数组排序，先把它从中间分成两半，让两半各自排好序，最后只需要把两个有序的序列合并成一个有序序列。至于两半怎么排好，就继续对半拆，一直拆到每一段只剩一个数，一个数当然是有序的。',
    '合并是关键的一步：两个有序序列各有一个指针，指向各自最小的数，每次比较两个指针所指的数，把较小的取出来放到辅助数组里，指针后移。一边取完后，另一边剩下的直接接上。合并 n 个数只需要扫描一遍。',
  ],
  points: [
    '拆分共有大约 log₂n 层，每一层合并时总共要处理 n 个数，所以总时间是 O(n log n)，并且最好、最坏、平均都是这个数。',
    '合并需要一块与原数组一样大的辅助空间，这是它与快速排序、堆排序相比的主要代价。',
    '比较时用 a[i]<=a[j]（相等时取左边的），可以保证相等的数保持原来的先后顺序，因此归并排序是稳定的。',
    '归并排序有一个重要的副产品：在合并的过程中可以数出逆序对的个数，这是它在比赛里很常见的用法。',
  ],
  pitfalls: [
    '合并结束后忘记把辅助数组复制回原数组，排序结果就没有生效。',
    '中点写成 (l+r)/2 在下标很大时可能溢出，更稳妥的是 l+(r-l)/2；辅助数组的下标要与原数组的下标对应起来。',
    '递归的边界写成 l>r 而不是 l>=r，会让只剩一个数的区间继续往下分，造成无限递归。',
  ],
  complexity: { time: 'O(n log n)', space: 'O(n)', note: '无论数据原来是什么顺序，时间都是 O(n log n)；需要额外的 O(n) 辅助数组。' },
  presets: [
    { label: '随便一组', text: '8\n6 2 9 4 7 1 8 3' },
    { label: '已经有序', text: '8\n1 2 3 4 5 6 7 8' },
    { label: '有重复数', text: '7\n4 2 4 1 3 2 4' },
  ],
  defaultInput: [6, 2, 9, 4, 7, 1, 8, 3],
  ...arrayInput({ min: 2, max: 10, lo: 1, hi: 99 }),
  answer: (v) => [...v].sort((a, b) => a - b).join(' '),
  random: () => randList(8),
  run: runMergeSort,
  View: MsView,
  sources: {
    c: String.raw`
#include <stdio.h>
int tmp[1005];
void mergeSort(int a[],int l,int r){
    if (l>=r) return;                         // 只剩一个数，就不用再分了      //@call
    int mid=(l+r)/2;                          // 从中间一分为二，分别排好序     //@split
    mergeSort(a,l,mid);
    mergeSort(a,mid+1,r);
    int i=l,j=mid+1,k=l;                      // 把两个有序的部分合并成一个     //@merge
    while (i<=mid&&j<=r){
        if (a[i]<=a[j]) tmp[k++]=a[i++];      // 左边的数小（或相等），先取左边的  //@takeL
        else tmp[k++]=a[j++];                 // 否则先取右边的           //@takeR
    }
    while (i<=mid) tmp[k++]=a[i++];           // 右边取完了，把左边剩下的搬过来   //@restL
    while (j<=r) tmp[k++]=a[j++];             // 左边取完了，把右边剩下的搬过来   //@restR
    for (int p=l;p<=r;p++) a[p]=tmp[p];       // 合并好的结果放回原数组       //@copy
}
int main(){
    int n,a[1005];
    scanf("%d",&n);
    for (int i=0;i<n;i++) scanf("%d",&a[i]);
    mergeSort(a,0,n-1);                       // 从整个数组开始排序         //@init
    for (int i=0;i<n;i++) printf("%d ",a[i]);  // 输出排好序的数组         //@done
    return 0;
}
`,
    cpp: String.raw`
#include <bits/stdc++.h>
using namespace std;
int tmp[1005];
void mergeSort(int a[],int l,int r){
    if (l>=r) return;                       // 只剩一个数，就不用再分了      //@call
    int mid=(l+r)/2;                        // 从中间一分为二，分别排好序     //@split
    mergeSort(a,l,mid);
    mergeSort(a,mid+1,r);
    int i=l,j=mid+1,k=l;                    // 把两个有序的部分合并成一个     //@merge
    while (i<=mid&&j<=r){
        if (a[i]<=a[j]) tmp[k++]=a[i++];    // 左边的数小（或相等），先取左边的  //@takeL
        else tmp[k++]=a[j++];               // 否则先取右边的           //@takeR
    }
    while (i<=mid) tmp[k++]=a[i++];         // 右边取完了，把左边剩下的搬过来   //@restL
    while (j<=r) tmp[k++]=a[j++];           // 左边取完了，把右边剩下的搬过来   //@restR
    for (int p=l;p<=r;p++) a[p]=tmp[p];     // 合并好的结果放回原数组       //@copy
}
int main(){
    int n,a[1005];
    cin>>n;
    for (int i=0;i<n;i++) cin>>a[i];
    mergeSort(a,0,n-1);                     // 从整个数组开始排序         //@init
    for (int i=0;i<n;i++) cout<<a[i]<<" ";  // 输出排好序的数组          //@done
    return 0;
}
`,
    python: String.raw`
def merge_sort(a,l,r,tmp):
    if l>=r:               # 只剩一个数，就不用再分了      #@call
        return
    mid=(l+r)//2           # 从中间一分为二，分别排好序     #@split
    merge_sort(a,l,mid,tmp)
    merge_sort(a,mid+1,r,tmp)
    i,j,k=l,mid+1,l        # 把两个有序的部分合并成一个     #@merge
    while i<=mid and j<=r:
        if a[i]<=a[j]:
            tmp[k]=a[i]    # 左边的数小（或相等），先取左边的  #@takeL
            i+=1                               #@takeL
        else:
            tmp[k]=a[j]    # 否则先取右边的           #@takeR
            j+=1                               #@takeR
        k+=1
    while i<=mid:
        tmp[k]=a[i]        # 右边取完了，把左边剩下的搬过来   #@restL
        i+=1                                   #@restL
        k+=1
    while j<=r:
        tmp[k]=a[j]        # 左边取完了，把右边剩下的搬过来   #@restR
        j+=1                                   #@restR
        k+=1
    a[l:r+1]=tmp[l:r+1]    # 合并好的结果放回原数组       #@copy

n=int(input())
a=list(map(int,input().split()))
merge_sort(a,0,n-1,[0]*n)  # 从整个数组开始排序         #@init
print(*a)                  # 输出排好序的数组          #@done
`,
    java: String.raw`
import java.util.*;

public class Main{
    static int[] tmp=new int[1005];

    static void mergeSort(int[] a,int l,int r){
        if (l>=r) return;                     // 只剩一个数，就不用再分了      //@call
        int mid=(l+r)/2;                      // 从中间一分为二，分别排好序     //@split
        mergeSort(a,l,mid);
        mergeSort(a,mid+1,r);
        int i=l,j=mid+1,k=l;                  // 把两个有序的部分合并成一个     //@merge
        while (i<=mid&&j<=r){
            if (a[i]<=a[j]) tmp[k++]=a[i++];  // 左边的数小（或相等），先取左边的  //@takeL
            else tmp[k++]=a[j++];             // 否则先取右边的           //@takeR
        }
        while (i<=mid) tmp[k++]=a[i++];       // 右边取完了，把左边剩下的搬过来   //@restL
        while (j<=r) tmp[k++]=a[j++];         // 左边取完了，把右边剩下的搬过来   //@restR
        for (int p=l;p<=r;p++) a[p]=tmp[p];   // 合并好的结果放回原数组       //@copy
    }

    public static void main(String[] args){
        Scanner sc=new Scanner(System.in);
        int n=sc.nextInt();
        int[] a=new int[n];
        for (int i=0;i<n;i++) a[i]=sc.nextInt();
        mergeSort(a,0,n-1);                   // 从整个数组开始排序         //@init
        for (int x:a) System.out.print(x+" ");  // 输出排好序的数组        //@done
    }
}
`,
  },
  problems: pickProblems('P1177', 'P1908'),
}
