import { ArrayView, type Cell, type Pointer, type Tone } from '../components/ArrayView'
import { Stats } from '../components/Stats'
import { pickProblems } from '../data/problems'
import { Recorder } from '../engine/recorder'
import type { AlgoDef, Frame } from '../engine/types'
import { arrayInput, randList } from './shared'

export interface InsState {
  cells: { id: number; v: number }[]
  /** 前 sortedN 个位置属于“手里已经理好的牌”（正在插入的那张也算在内） */
  sortedN: number
  /** 正在往左挪的那个数当前所在的位置 */
  cur: number | null
  /** 这一帧是否正在比较 cur-1 与 cur */
  cmp: boolean
  swapped: boolean
  compares: number
  swaps: number
}

export function runInsertionSort(input: number[]): Frame<InsState>[] {
  const rec = new Recorder<InsState>()
  const a = input.map((v, id) => ({ id, v }))
  const n = a.length
  let sortedN = 1
  let cur: number | null = null
  let compares = 0
  let swaps = 0
  const snap = (cmp = false, swapped = false): InsState => ({ cells: a, sortedN, cur, cmp, swapped, compares, swaps })

  rec.push('init', snap(), `一共 ${n} 个数。第 1 个数 ${a[0].v} 自己就是一个有序的“一张牌”，接下来依次把后面的数插进已经理好的部分。`)
  for (let i = 1; i < n; i++) {
    sortedN = i + 1
    cur = i
    rec.push('pick', snap(), `拿起 a[${i}] = ${a[i].v}，要把它插进前面已经有序的 ${i} 个数里。`)
    let j = i
    while (j > 0) {
      compares++
      const need = a[j - 1].v > a[j].v
      rec.push('cmp', snap(true), `比较 a[${j - 1}] = ${a[j - 1].v} 和 a[${j}] = ${a[j].v}：${need ? '左边的更大，需要换到右边去。' : '左边的不比它大，它的位置已经找到了。'}`)
      if (!need) break
      ;[a[j - 1], a[j]] = [a[j], a[j - 1]]
      swaps++
      j--
      cur = j
      rec.push('swap', snap(false, true), `交换之后，${a[j].v} 向左挪了一格，现在位于 a[${j}]。`)
    }
    cur = null
    rec.push('place', snap(), j === 0 ? `${a[j].v} 一路挪到了最左边，不需要再比较。前 ${i + 1} 个数现在有序。` : `${a[j].v} 停在 a[${j}]。前 ${i + 1} 个数现在有序。`)
  }
  sortedN = n
  rec.push('done', snap(), `排序完成，共比较 ${compares} 次，交换 ${swaps} 次。`)
  return rec.frames
}

function InsView({ frame }: { frame: Frame<InsState> }) {
  const s = frame.state
  const cells: Cell[] = s.cells.map((c, i) => {
    let tone: Tone = i < s.sortedN ? 'done' : 'idle'
    if (s.cur !== null && i === s.cur) tone = s.swapped ? 'swap' : 'compare'
    if (s.cmp && s.cur !== null && i === s.cur - 1) tone = 'compare'
    return { id: c.id, v: c.v, tone }
  })
  const pointers: Pointer[] = s.cur !== null ? [{ name: 'j', index: s.cur, tone: 'compare' }] : []
  return (
    <div className="viz">
      <ArrayView cells={cells} pointers={pointers} mode="bars" />
      <Stats
        items={[
          ['已经有序', `${s.sortedN} / ${s.cells.length}`],
          ['比较次数', s.compares],
          ['交换次数', s.swaps],
        ]}
      />
    </div>
  )
}

export const insertionSort: AlgoDef<number[], InsState> = {
  id: 'insertion-sort',
  title: '插入排序',
  tagline: '像整理手里的扑克牌一样，每次把新的一张插进前面已经排好的部分',
  kind: '算法',
  slug: 'sort',
  name: '从小到大排序',
  type: '排序',
  statement: {
    desc: [
      '给定 n 个整数，用插入排序把它们从小到大排好序，输出排序之后的结果。演示里可以看到每个数是怎样一步步挪到合适位置的。',
    ],
    input: [
      '第一行一个整数 n（2 ≤ n ≤ 14）。',
      '第二行 n 个整数，每个在 1～99 之间，可以有相同的数。',
    ],
    output: [
      '一行 n 个整数，从小到大排列，用空格隔开。',
    ],
  },
  intro: [
    '打牌时整理手牌，大多数人的做法是这样的：左手拿着已经排好的牌，右手每抽到一张新牌，就从右往左找到它该在的位置，插进去。插入排序做的正是这件事。',
    '数组的前 i 个数始终保持有序。处理第 i 个数时，把它与左边相邻的数比较，只要左边的更大，就交换一次，让它再向左挪一格；遇到不比它大的数，或者已经到了最左边，就停下来。重复这个过程，直到最后一个数也插了进去。',
  ],
  points: [
    '外层循环从下标 1 开始：一个数天然有序，所以第一张牌不用处理。',
    '内层只要“左边存在，并且左边的更大”就继续交换，两个条件缺一不可，而且 j>0 必须写在前面。',
    '数组几乎有序时，每个数只需要挪动很少的次数，所以插入排序在这种情况下非常快，最好情况是 O(n)。',
    '它是稳定排序：遇到相等的数就停下，不会越过它。',
  ],
  pitfalls: [
    '把条件写成 a[j-1]>a[j] && j>0，会先读到 a[-1]，造成越界。',
    '比较时写成 a[j-1]>=a[j]，相等的数也会被交换，既多做了工作，也破坏了稳定性。',
    '在 n 很大时它同样是 O(n²)，数据量上万就应该改用 sort 或者归并、快速排序。',
  ],
  complexity: { time: 'O(n²)', space: 'O(1)', note: '数据已经有序时，每个数只比较一次，所以最好情况是 O(n)；完全倒序时最慢。' },
  presets: [
    { label: '已经有序', text: '8\n1 2 3 4 5 6 7 8' },
    { label: '完全倒序', text: '8\n9 8 7 6 5 4 3 2' },
    { label: '有重复数', text: '6\n4 2 4 1 3 2' },
  ],
  defaultInput: [5, 3, 8, 1, 9, 2, 7],
  ...arrayInput({ min: 2, max: 14, lo: 1, hi: 99 }),
  answer: (v) => [...v].sort((a, b) => a - b).join(' '),
  random: () => randList(8),
  run: runInsertionSort,
  View: InsView,
  sources: {
    c: String.raw`
#include <stdio.h>
void insertionSort(int a[],int n){            // 插入排序：像整理扑克牌，一张张插进前面已经排好的部分  //@init
    for (int i=1;i<n;i++){                    // 拿起第 i 个数，准备往前插              //@pick
        int j=i;                                                             //@pick
        while (j>0 && a[j-1]>a[j]){           // 前面的数更大，就还得再往前               //@cmp
            int t=a[j-1];                     // 前面的数往后挪一位，自己往前一位            //@swap
            a[j-1]=a[j];                                                     //@swap
            a[j]=t;                                                          //@swap
            j--;                                                             //@swap
        }
        // 此时 a[0..i] 已经有序                                                   //@place
    }
}
int main(){
    int n,a[1005];
    scanf("%d",&n);
    for (int i=0;i<n;i++) scanf("%d",&a[i]);
    insertionSort(a,n);
    for (int i=0;i<n;i++) printf("%d ",a[i]);  // 输出排好序的数组                   //@done
    return 0;
}
`,
    cpp: String.raw`
#include <bits/stdc++.h>
using namespace std;
void insertionSort(int a[],int n){          // 插入排序：像整理扑克牌，一张张插进前面已经排好的部分  //@init
    for (int i=1;i<n;i++){                  // 拿起第 i 个数，准备往前插              //@pick
        int j=i;                                                           //@pick
        while (j>0 && a[j-1]>a[j]){         // 前面的数更大，就还得再往前               //@cmp
            swap(a[j-1],a[j]);              // 前面的数往后挪一位，自己往前一位            //@swap
            j--;                                                           //@swap
        }
        // 此时 a[0..i] 已经有序                                                 //@place
    }
}
int main(){
    int n,a[1005];
    cin>>n;
    for (int i=0;i<n;i++) cin>>a[i];
    insertionSort(a,n);
    for (int i=0;i<n;i++) cout<<a[i]<<" ";  // 输出排好序的数组                    //@done
    return 0;
}
`,
    python: String.raw`
def insertion_sort(a):               # 插入排序：像整理扑克牌，一张张插进前面已经排好的部分  #@init
    for i in range(1,len(a)):        # 拿起第 i 个数，准备往前插              #@pick
        j=i                                                        #@pick
        while j>0 and a[j-1]>a[j]:   # 前面的数更大，就还得再往前               #@cmp
            a[j-1],a[j]=a[j],a[j-1]  # 前面的数往后挪一位，自己往前一位            #@swap
            j-=1                                                   #@swap
        # 此时 a[0..i] 已经有序                                          #@place

n=int(input())
a=list(map(int,input().split()))
insertion_sort(a)
print(*a)                            # 输出排好序的数组                    #@done
`,
    java: String.raw`
import java.util.*;

public class Main{
    static void insertionSort(int[] a){       // 插入排序：像整理扑克牌，一张张插进前面已经排好的部分  //@init
        int n=a.length;
        for (int i=1;i<n;i++){                // 拿起第 i 个数，准备往前插              //@pick
            int j=i;                                                         //@pick
            while (j>0&&a[j-1]>a[j]){         // 前面的数更大，就还得再往前               //@cmp
                int t=a[j-1];                 // 前面的数往后挪一位，自己往前一位            //@swap
                a[j-1]=a[j];                                                 //@swap
                a[j]=t;                                                      //@swap
                j--;                                                         //@swap
            }
            // 此时 a[0..i] 已经有序                                               //@place
        }
    }

    public static void main(String[] args){
        Scanner sc=new Scanner(System.in);
        int n=sc.nextInt();
        int[] a=new int[n];
        for (int i=0;i<n;i++) a[i]=sc.nextInt();
        insertionSort(a);
        for (int x:a) System.out.print(x+" ");  // 输出排好序的数组                  //@done
    }
}
`,
  },
  problems: pickProblems('P5715', 'P1116', 'P1177'),
}
