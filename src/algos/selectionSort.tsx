import { ArrayView, type Cell, type Pointer, type Tone } from '../components/ArrayView'
import { Stats } from '../components/Stats'
import { pickProblems } from '../data/problems'
import { Recorder } from '../engine/recorder'
import type { AlgoDef, Frame } from '../engine/types'
import { arrayInput, randList } from './shared'

export interface SelState {
  cells: { id: number; v: number }[]
  /** 前 sortedN 个位置已经确定 */
  sortedN: number
  /** 当前这一轮，到目前为止最小的数的下标 */
  min: number | null
  /** 正在比较的位置 */
  j: number | null
  swapPair: [number, number] | null
  compares: number
  swaps: number
}

export function runSelectionSort(input: number[]): Frame<SelState>[] {
  const rec = new Recorder<SelState>()
  const a = input.map((v, id) => ({ id, v }))
  const n = a.length
  let sortedN = 0
  let min: number | null = null
  let j: number | null = null
  let swapPair: [number, number] | null = null
  let compares = 0
  let swaps = 0
  const snap = (): SelState => ({ cells: a, sortedN, min, j, swapPair, compares, swaps })

  rec.push('init', snap(), `一共 ${n} 个数。选择排序每一轮从还没排好的部分里挑出最小的数，放到这一部分的最前面。`)
  for (let i = 0; i < n - 1; i++) {
    min = i
    j = null
    swapPair = null
    rec.push('pick', snap(), `第 ${i + 1} 轮：先假定 a[${i}] = ${a[i].v} 是剩下的数里最小的，然后依次与后面的数比较。`)
    for (let k = i + 1; k < n; k++) {
      j = k
      compares++
      const smaller = a[k].v < a[min].v
      rec.push('cmp', snap(), `比较 a[${k}] = ${a[k].v} 与当前最小的 a[${min}] = ${a[min].v}：${smaller ? '更小，需要更新最小值。' : '不比它小，保持不变。'}`)
      if (smaller) {
        min = k
        rec.push('newMin', snap(), `最小值的位置更新为 ${k}，现在最小的是 ${a[k].v}。`)
      }
    }
    j = null
    const m = min
    if (m !== i) {
      ;[a[i], a[m]] = [a[m], a[i]]
      swaps++
      swapPair = [i, m]
    }
    sortedN = i + 1
    rec.push('swap', snap(), m !== i ? `把最小的 ${a[i].v} 与 a[${i}] 交换，它被放到了位置 ${i}，之后不会再动。` : `最小的数本来就在位置 ${i}，不需要交换，它已经就位。`)
  }
  sortedN = n
  min = null
  j = null
  swapPair = null
  rec.push('done', snap(), `排序完成，共比较 ${compares} 次，交换 ${swaps} 次。`)
  return rec.frames
}

function SelView({ frame }: { frame: Frame<SelState> }) {
  const s = frame.state
  const cells: Cell[] = s.cells.map((c, i) => {
    let tone: Tone = i < s.sortedN ? 'done' : 'idle'
    if (s.swapPair && (i === s.swapPair[0] || i === s.swapPair[1])) tone = 'swap'
    if (s.min === i) tone = 'found'
    if (s.j === i) tone = 'compare'
    return { id: c.id, v: c.v, tone }
  })
  const pointers: Pointer[] = []
  if (s.j !== null) pointers.push({ name: 'j', index: s.j, tone: 'compare' })
  if (s.min !== null) pointers.push({ name: '最小', index: s.min, tone: 'found' })
  return (
    <div className="viz">
      <ArrayView cells={cells} pointers={pointers} mode="bars" minSlots={2} />
      <Stats
        items={[
          ['已确定', `${s.sortedN} / ${s.cells.length}`],
          ['比较次数', s.compares],
          ['交换次数', s.swaps],
        ]}
      />
    </div>
  )
}

export const selectionSort: AlgoDef<number[], SelState> = {
  id: 'selection-sort',
  title: '选择排序',
  tagline: '每一轮从剩下的数里选出最小的，放到最前面',
  kind: '算法',
  slug: 'sort',
  name: '从小到大排序',
  type: '排序',
  statement: {
    desc: [
      '给定 n 个整数，用选择排序把它们从小到大排好序，输出排序之后的结果。演示里可以看到每一轮是怎样选出最小的数的。',
    ],
    input: [
      '第一行一个整数 n（2 ≤ n ≤ 12）。',
      '第二行 n 个整数，每个在 1～99 之间，可以有相同的数。',
    ],
    output: [
      '一行 n 个整数，从小到大排列，用空格隔开。',
    ],
  },
  intro: [
    '选择排序的想法很直接：整个数组里最小的数应该排在第一位，那就把它找出来，和第一位交换；剩下的数里最小的应该排在第二位，再找出来，和第二位交换。如此重复，每一轮确定一个位置。',
    '和冒泡排序相比，它每一轮最多只交换一次，交换的次数最少是 0，最多是 n-1，所以当交换数据代价很高时它有一定的优势。不过它仍然需要在每一轮里扫描全部剩下的数，比较次数是固定的，与数据原来是否有序无关。',
  ],
  points: [
    '外层循环的 i 表示这一轮要确定的位置，内层循环从 i+1 扫描到末尾，用变量 m 记录目前最小值的下标。',
    '扫描时只更新下标，不急着交换；扫描结束之后再交换一次。',
    '前 i 个位置排好之后，它们一定是整个数组里最小的 i 个数，所以以后不会再改动。',
    '最后一个数不需要单独处理，所以外层只需要循环 n-1 轮。',
  ],
  pitfalls: [
    '交换写在内层循环里，每发现一个更小的数就交换，既多做了很多交换，也容易把比较的基准弄乱。',
    '选择排序不是稳定排序：交换可能把相等的两个数的先后顺序颠倒，比如 {5a, 5b, 2} 排序后 5b 会排在 5a 前面。',
    '数据量到几万以上时，O(n²) 会超时，应该使用 sort。',
  ],
  complexity: { time: 'O(n²)', space: 'O(1)', note: '比较的次数固定为 n(n-1)/2，与输入的顺序无关；交换最多 n-1 次。' },
  presets: [
    { label: '已经有序', text: '7\n1 2 3 4 5 6 7' },
    { label: '完全倒序', text: '7\n9 8 7 6 5 4 3' },
    { label: '有重复数', text: '6\n4 2 4 1 3 2' },
  ],
  defaultInput: [5, 3, 8, 1, 9, 2, 7],
  ...arrayInput({ min: 2, max: 12, lo: 1, hi: 99 }),
  answer: (v) => [...v].sort((a, b) => a - b).join(' '),
  random: () => randList(8),
  run: runSelectionSort,
  View: SelView,
  sources: {
    c: String.raw`
#include <stdio.h>
void selectionSort(int a[],int n){            // 选择排序：每一轮选出最小的，放到最前面        //@init
    for (int i=0;i<n-1;i++){                  // 先假设第 i 个就是剩下的数里最小的，下标记作 m  //@pick
        int m=i;                                                            //@pick
        for (int j=i+1;j<n;j++){
            if (a[j]<a[m]){                   // 拿后面的数和当前的最小值比一比            //@cmp
                m=j;                          // 发现更小的，更新最小值的下标             //@newMin
            }
        }
        int t=a[i];                           // 把最小的数换到第 i 个位置             //@swap
        a[i]=a[m];                                                          //@swap
        a[m]=t;                                                             //@swap
    }
}
int main(){
    int n,a[1005];
    scanf("%d",&n);
    for (int i=0;i<n;i++) scanf("%d",&a[i]);
    selectionSort(a,n);
    for (int i=0;i<n;i++) printf("%d ",a[i]);  // 输出排好序的数组                  //@done
    return 0;
}
`,
    cpp: String.raw`
#include <bits/stdc++.h>
using namespace std;
void selectionSort(int a[],int n){          // 选择排序：每一轮选出最小的，放到最前面        //@init
    for (int i=0;i<n-1;i++){                // 先假设第 i 个就是剩下的数里最小的，下标记作 m  //@pick
        int m=i;                                                          //@pick
        for (int j=i+1;j<n;j++){
            if (a[j]<a[m]){                 // 拿后面的数和当前的最小值比一比            //@cmp
                m=j;                        // 发现更小的，更新最小值的下标             //@newMin
            }
        }
        swap(a[i],a[m]);                    // 把最小的数换到第 i 个位置             //@swap
    }
}
int main(){
    int n,a[1005];
    cin>>n;
    for (int i=0;i<n;i++) cin>>a[i];
    selectionSort(a,n);
    for (int i=0;i<n;i++) cout<<a[i]<<" ";  // 输出排好序的数组                   //@done
    return 0;
}
`,
    python: String.raw`
def selection_sort(a):       # 选择排序：每一轮选出最小的，放到最前面        #@init
    n=len(a)
    for i in range(n-1):     # 先假设第 i 个就是剩下的数里最小的，下标记作 m  #@pick
        m=i                                               #@pick
        for j in range(i+1,n):
            if a[j]<a[m]:    # 拿后面的数和当前的最小值比一比            #@cmp
                m=j          # 发现更小的，更新最小值的下标             #@newMin
        a[i],a[m]=a[m],a[i]  # 把最小的数换到第 i 个位置             #@swap

n=int(input())
a=list(map(int,input().split()))
selection_sort(a)
print(*a)                    # 输出排好序的数组                   #@done
`,
    java: String.raw`
import java.util.*;

public class Main{
    static void selectionSort(int[] a){       // 选择排序：每一轮选出最小的，放到最前面        //@init
        int n=a.length;
        for (int i=0;i<n-1;i++){              // 先假设第 i 个就是剩下的数里最小的，下标记作 m  //@pick
            int m=i;                                                        //@pick
            for (int j=i+1;j<n;j++){
                if (a[j]<a[m]){               // 拿后面的数和当前的最小值比一比            //@cmp
                    m=j;                      // 发现更小的，更新最小值的下标             //@newMin
                }
            }
            int t=a[i];                       // 把最小的数换到第 i 个位置             //@swap
            a[i]=a[m];                                                      //@swap
            a[m]=t;                                                         //@swap
        }
    }

    public static void main(String[] args){
        Scanner sc=new Scanner(System.in);
        int n=sc.nextInt();
        int[] a=new int[n];
        for (int i=0;i<n;i++) a[i]=sc.nextInt();
        selectionSort(a);
        for (int x:a) System.out.print(x+" ");  // 输出排好序的数组                 //@done
    }
}
`,
  },
  problems: pickProblems('P5715', 'P1177'),
}
