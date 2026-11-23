import { ArrayView, type Cell, type Pointer, type Tone } from '../components/ArrayView'
import { Stats } from '../components/Stats'
import { pickProblems } from '../data/problems'
import { Recorder } from '../engine/recorder'
import type { AlgoDef, Frame } from '../engine/types'
import { parseList, randList } from './shared'

export interface QsState {
  cells: { id: number; v: number }[]
  /** 当前正在处理的区间；-1 表示还没开始 */
  lo: number
  hi: number
  /** 基准所在的位置（划分过程中固定在区间最右端，划分结束后是它的最终位置） */
  pivot: number | null
  i: number | null
  j: number | null
  /** 已经在最终位置上的下标 */
  fixed: number[]
  /** 本帧刚交换过的两个位置 */
  swapPair: [number, number] | null
  compares: number
  swaps: number
  ranges: number
}

export function runQuickSort(input: number[]): Frame<QsState>[] {
  const rec = new Recorder<QsState>()
  const a = input.map((v, id) => ({ id, v }))
  const n = a.length
  let lo = -1
  let hi = -1
  let pivot: number | null = null
  let i: number | null = null
  let j: number | null = null
  const fixed: number[] = []
  let swapPair: [number, number] | null = null
  let compares = 0
  let swaps = 0
  let ranges = 0
  const snap = (): QsState => ({ cells: a, lo, hi, pivot, i, j, fixed, swapPair, compares, swaps, ranges })

  const sort = (l: number, h: number) => {
    if (l > h) return // 空区间：什么也不用做，动画里也不单独演示
    lo = l
    hi = h
    pivot = i = j = null
    swapPair = null
    ranges++
    if (l === h) {
      fixed.push(l)
      rec.push('call', snap(), `区间 [${l}, ${h}] 里只有一个数 ${a[l].v}，它自己就是有序的，已经在最终位置上。`)
      return
    }
    rec.push('call', snap(), `开始处理区间 [${l}, ${h}]，里面有 ${h - l + 1} 个数。先挑一个基准，把区间分成“比它小”和“比它大”两边。`)
    const p = a[h].v
    pivot = h
    i = l
    rec.push('pivot', snap(), `取区间最右边的 a[${h}] = ${p} 作为基准。指针 i 指向“小数区”将要放下一个数的位置，现在是 ${l}。`)
    for (let k = l; k < h; k++) {
      j = k
      compares++
      const small = a[k].v < p
      swapPair = null
      rec.push('cmp', snap(), `看 a[${k}] = ${a[k].v}：${small ? `比基准 ${p} 小，应该放进小数区。` : `不比基准 ${p} 小，先留在原地。`}`)
      if (small) {
        const x = i
        ;[a[x], a[k]] = [a[k], a[x]]
        swaps++
        i++
        swapPair = [x, k]
        rec.push('swap', snap(), x === k ? `i 和 j 指向同一个位置，自己和自己交换等于没变，小数区向右扩大一格（i = ${i}）。` : `把 a[${k}] 与 a[${x}] 交换，${a[x].v} 进入小数区，i 向右移到 ${i}。`)
      }
    }
    j = null
    const x = i
    ;[a[x], a[h]] = [a[h], a[x]]
    if (x !== h) swaps++
    swapPair = x !== h ? [x, h] : null
    pivot = x
    fixed.push(x)
    rec.push('place', snap(), `扫描结束，把基准 ${p} 与 a[${x}] 交换，基准落在下标 ${x}。它左边的数都比它小，右边的都不小于它，所以它已经在最终的位置上了。`)
    i = null
    swapPair = null
    sort(l, x - 1)
    sort(x + 1, h)
  }

  rec.push('init', snap(), `一共 ${n} 个数。快速排序会反复“选基准、划分、再分别处理两边”，先从整个数组 [0, ${n - 1}] 开始。`)
  sort(0, n - 1)
  lo = hi = -1
  pivot = i = j = null
  swapPair = null
  rec.push('done', snap(), `排序完成，共比较 ${compares} 次，交换 ${swaps} 次。`)
  return rec.frames
}

function QsView({ frame }: { frame: Frame<QsState> }) {
  const s = frame.state
  const fixed = new Set(s.fixed)
  const cells: Cell[] = s.cells.map((c, idx) => {
    let tone: Tone = 'idle'
    if (s.lo >= 0 && (idx < s.lo || idx > s.hi)) tone = 'dim'
    if (fixed.has(idx)) tone = 'done'
    if (s.pivot === idx && !fixed.has(idx)) tone = 'found'
    if (s.swapPair && (idx === s.swapPair[0] || idx === s.swapPair[1]) && !fixed.has(idx)) tone = 'swap'
    if (s.j === idx) tone = 'compare'
    return { id: c.id, v: c.v, tone }
  })
  const pointers: Pointer[] = []
  if (s.i !== null) pointers.push({ name: 'i', index: s.i, tone: 'done' })
  if (s.j !== null) pointers.push({ name: 'j', index: s.j, tone: 'compare' })
  if (s.pivot !== null && !fixed.has(s.pivot)) pointers.push({ name: '基准', index: s.pivot, tone: 'found' })
  return (
    <div className="viz">
      <ArrayView cells={cells} pointers={pointers} mode="bars" minSlots={2} />
      <Stats
        items={[
          ['当前区间', s.lo >= 0 ? `[${s.lo}, ${s.hi}]` : '—'],
          ['比较次数', s.compares],
          ['交换次数', s.swaps],
          ['已就位', `${s.fixed.length} / ${s.cells.length}`],
        ]}
      />
    </div>
  )
}

export const quickSort: AlgoDef<number[], QsState> = {
  id: 'quick-sort',
  title: '快速排序',
  tagline: '选一个基准，把比它小的放左边、比它大的放右边，再分别处理两边',
  kind: '算法',
  intro: [
    '快速排序用的是“分治”的想法：先挑一个数作为基准，通过一趟扫描，把比基准小的数都换到它的左边，其余的留在右边。这一趟结束后，基准恰好落在它最终应该在的位置上，不会再动了。',
    '剩下的问题就变成了两个更小的同类问题：左边那一段怎么排，右边那一段怎么排。对它们各自重复同样的做法，直到每一段只剩一个数，整个数组就有序了。',
  ],
  points: [
    '这里每次取区间最右边的数当基准，划分的做法是：用 j 从左到右扫描，i 记录“小数区”的右边界；遇到比基准小的数，就换到 i 的位置，并让 i 加一。',
    '扫描结束后，把基准与 a[i] 交换，基准就落在了 i：它左边都比它小，右边都不比它小。',
    '递归的边界是区间里至多一个数，此时无需任何操作。',
    '平均情况下每次划分都能把区间分成大小差不多的两半，一共约 log n 层，每层总共扫描 n 个数，所以是 O(n log n)。',
  ],
  pitfalls: [
    '如果数组本来就有序（或者完全倒序），而基准又总是取最右边，每次划分只能分出一个数，复杂度退化为 O(n²)。比赛里常用随机选基准，或者直接使用 sort。',
    '这个写法对相等的数不是稳定的，如果需要保持相等元素的原有顺序，要用 stable_sort。',
    '递归深度在最坏情况下会达到 n，数据很大时可能栈溢出。',
  ],
  complexity: { time: 'O(n log n)', space: 'O(log n)', note: '时间是平均情况；基准选得很差时最坏为 O(n²)。空间是递归占用的栈。' },
  inputHint: '输入 2～12 个 1～99 的整数，空格隔开，回车或点“应用”。',
  presets: [
    { label: '随便一组', text: '6 2 9 4 7 1 8 3' },
    { label: '已经有序', text: '1 2 3 4 5 6 7 8' },
    { label: '有重复数', text: '4 2 4 1 3 2 4' },
  ],
  defaultInput: [6, 2, 9, 4, 7, 1, 8, 3],
  parse: (t) => parseList(t, { min: 2, max: 12, lo: 1, hi: 99 }),
  format: (v) => v.join(' '),
  random: () => randList(8),
  run: runQuickSort,
  View: QsView,
  sources: {
    c: String.raw`
#include <stdio.h>
int partition(int a[],int lo,int hi){
    int pivot=a[hi];                            //@pivot
    int i=lo;                                   //@pivot
    for (int j=lo;j<hi;j++){
        if (a[j]<pivot){                        //@cmp
            int t=a[i];                         //@swap
            a[i]=a[j];                          //@swap
            a[j]=t;                             //@swap
            i++;                                //@swap
        }
    }
    int t=a[i];                                 //@place
    a[i]=a[hi];                                 //@place
    a[hi]=t;                                    //@place
    return i;
}
void quickSort(int a[],int lo,int hi){
    if (lo>=hi) return;                         //@call
    int p=partition(a,lo,hi);
    quickSort(a,lo,p-1);
    quickSort(a,p+1,hi);
}
int main(){
    int n,a[1005];
    scanf("%d",&n);
    for (int i=0;i<n;i++) scanf("%d",&a[i]);
    quickSort(a,0,n-1);                         //@init
    for (int i=0;i<n;i++) printf("%d ",a[i]);   //@done
    return 0;
}
`,
    cpp: String.raw`
#include <bits/stdc++.h>
using namespace std;
int partitionArr(int a[],int lo,int hi){
    int pivot=a[hi];                            //@pivot
    int i=lo;                                   //@pivot
    for (int j=lo;j<hi;j++){
        if (a[j]<pivot){                        //@cmp
            swap(a[i],a[j]);                    //@swap
            i++;                                //@swap
        }
    }
    swap(a[i],a[hi]);                           //@place
    return i;
}
void quickSort(int a[],int lo,int hi){
    if (lo>=hi) return;                         //@call
    int p=partitionArr(a,lo,hi);
    quickSort(a,lo,p-1);
    quickSort(a,p+1,hi);
}
int main(){
    int n,a[1005];
    cin>>n;
    for (int i=0;i<n;i++) cin>>a[i];
    quickSort(a,0,n-1);                         //@init
    for (int i=0;i<n;i++) cout<<a[i]<<" ";      //@done
    return 0;
}
`,
    python: String.raw`
def partition(a, lo, hi):
    pivot = a[hi]                               #@pivot
    i = lo                                      #@pivot
    for j in range(lo, hi):
        if a[j] < pivot:                        #@cmp
            a[i], a[j] = a[j], a[i]             #@swap
            i += 1                              #@swap
    a[i], a[hi] = a[hi], a[i]                   #@place
    return i


def quick_sort(a, lo, hi):
    if lo >= hi:                                #@call
        return
    p = partition(a, lo, hi)
    quick_sort(a, lo, p - 1)
    quick_sort(a, p + 1, hi)


n = int(input())
a = list(map(int, input().split()))
quick_sort(a, 0, n - 1)                         #@init
print(*a)                                       #@done
`,
    java: String.raw`
import java.util.*;

public class Main {
    static int partition(int[] a, int lo, int hi) {
        int pivot = a[hi];                          //@pivot
        int i = lo;                                 //@pivot
        for (int j = lo; j < hi; j++) {
            if (a[j] < pivot) {                     //@cmp
                int t = a[i];                       //@swap
                a[i] = a[j];                        //@swap
                a[j] = t;                           //@swap
                i++;                                //@swap
            }
        }
        int t = a[i];                               //@place
        a[i] = a[hi];                               //@place
        a[hi] = t;                                  //@place
        return i;
    }

    static void quickSort(int[] a, int lo, int hi) {
        if (lo >= hi) return;                       //@call
        int p = partition(a, lo, hi);
        quickSort(a, lo, p - 1);
        quickSort(a, p + 1, hi);
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        int[] a = new int[n];
        for (int i = 0; i < n; i++) a[i] = sc.nextInt();
        quickSort(a, 0, n - 1);                     //@init
        for (int x : a) System.out.print(x + " ");  //@done
    }
}
`,
  },
  problems: pickProblems('P1177', 'P1923'),
}
