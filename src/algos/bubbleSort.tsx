import { ArrayView, type Cell, type Pointer, type Tone } from '../components/ArrayView'
import { Stats } from '../components/Stats'
import { pickProblems } from '../data/problems'
import { Recorder } from '../engine/recorder'
import type { AlgoDef, Frame, ParseResult } from '../engine/types'

export interface SortState {
  cells: { id: number; v: number }[]
  cmp: [number, number] | null
  swapped: boolean
  /** 末尾已经排好的个数 */
  sorted: number
  round: number
  compares: number
  swaps: number
}

export function runBubbleSort(input: number[]): Frame<SortState>[] {
  const rec = new Recorder<SortState>()
  const a = input.map((v, id) => ({ id, v }))
  const n = a.length
  let compares = 0
  let swaps = 0
  let sorted = 0
  const snap = (cmp: [number, number] | null, swapped: boolean, round: number): SortState => ({ cells: a, cmp, swapped, sorted, round, compares, swaps })

  rec.push('init', snap(null, false, 0), `准备排序，一共 ${n} 个数。每一轮从左向右比较相邻的两个数，把较大的那个往右推。`)
  for (let i = 0; i < n - 1; i++) {
    let swapped = false
    rec.push('outer', snap(null, false, i + 1), `第 ${i + 1} 轮开始，这一轮会把剩下的数里最大的一个送到位置 ${n - 1 - i}。`)
    for (let j = 0; j < n - 1 - i; j++) {
      compares++
      const need = a[j].v > a[j + 1].v
      rec.push('cmp', snap([j, j + 1], false, i + 1), `比较 a[${j}]=${a[j].v} 和 a[${j + 1}]=${a[j + 1].v}：${need ? '左边更大，需要交换。' : '顺序没有问题，不需要交换。'}`)
      if (need) {
        ;[a[j], a[j + 1]] = [a[j + 1], a[j]]
        swapped = true
        swaps++
        rec.push('swap', snap([j, j + 1], true, i + 1), `交换之后，a[${j}]=${a[j].v}，a[${j + 1}]=${a[j + 1].v}。`)
      }
    }
    if (swapped) sorted++
    else sorted = n
    rec.push(
      'pass',
      snap(null, false, i + 1),
      swapped ? `第 ${i + 1} 轮结束，${a[n - 1 - i].v} 已经到达最终位置。` : '这一轮没有发生任何交换，说明整个数组已经有序，可以提前结束。',
    )
    if (!swapped) break
  }
  sorted = n
  rec.push('done', snap(null, false, Math.min(n - 1, rec.frames[rec.frames.length - 1].state.round)), `排序完成，共比较 ${compares} 次，交换 ${swaps} 次。`)
  return rec.frames
}

function BubbleView({ frame }: { frame: Frame<SortState> }) {
  const s = frame.state
  const n = s.cells.length
  const cells: Cell[] = s.cells.map((c, i) => {
    let tone: Tone = 'idle'
    if (i >= n - s.sorted) tone = 'done'
    if (s.cmp && (i === s.cmp[0] || i === s.cmp[1])) tone = s.swapped ? 'swap' : 'compare'
    return { id: c.id, v: c.v, tone }
  })
  const pointers: Pointer[] = s.cmp
    ? [
        { name: 'j', index: s.cmp[0], tone: 'compare' },
        { name: 'j+1', index: s.cmp[1], tone: 'compare' },
      ]
    : []
  return (
    <div className="viz">
      <ArrayView cells={cells} pointers={pointers} mode="bars" />
      <Stats
        items={[
          ['轮次', `${s.round} / ${Math.max(n - 1, 1)}`],
          ['比较次数', s.compares],
          ['交换次数', s.swaps],
        ]}
      />
    </div>
  )
}

function parse(text: string): ParseResult<number[]> {
  const nums = text
    .trim()
    .split(/[\s,，、]+/)
    .filter(Boolean)
    .map(Number)
  if (nums.length < 2 || nums.length > 14) return { ok: false, error: '请输入 2～14 个整数，用空格隔开。' }
  if (nums.some((x) => !Number.isInteger(x) || x < 1 || x > 99)) return { ok: false, error: '每个数都要是 1～99 之间的整数哦。' }
  return { ok: true, value: nums }
}

export const bubbleSort: AlgoDef<number[], SortState> = {
  id: 'bubble-sort',
  title: '冒泡排序',
  tagline: '每一轮比较相邻的两个数，让较大的数一步步移动到最右边',
  kind: '算法',
  intro: [
    '冒泡排序是最容易理解的排序方法。每一轮从左向右，依次比较相邻的两个数，如果左边的比右边的大，就交换它们的位置。较大的数就像水里的气泡一样，一点一点浮到右端。',
    '一轮结束之后，尚未排好的数里最大的那个，必定已经来到了它最终的位置。重复 n-1 轮，整个数组就从小到大排好了。',
  ],
  points: [
    '外层循环控制轮数，最多需要 n-1 轮。',
    '内层循环每一轮只需比较到 n-1-i 的位置，因为末尾的 i 个数已经就位，不必再看。',
    '可以增加一个 swapped 标记：如果某一轮一次交换都没有发生，就说明数组已经有序，可以提前结束。',
    '冒泡排序是稳定的排序，相等的两个数不会交换位置，它们原来的先后顺序得以保留。',
  ],
  pitfalls: [
    '把比较条件写成 a[j]>=a[j+1]，会让相等的数也发生交换，既多做了无用功，也破坏了稳定性。',
    '内层循环的上界写成 n-i，会在 i=0 时访问到 a[n]，造成越界。',
    '当 n 很大（比如十万）时，O(n²) 的时间会超限，应该改用 sort 等更快的排序方法。',
  ],
  complexity: { time: 'O(n²)', space: 'O(1)', note: '如果加上“一整趟没有交换就提前结束”的优化，最好情况是 O(n)。' },
  inputHint: '输入 2～14 个 1～99 的整数，空格隔开，回车或点“应用”。',
  presets: [
    { label: '已经有序', text: '1 2 3 4 5 6 7 8' },
    { label: '完全倒序', text: '9 8 7 6 5 4 3 2' },
    { label: '有重复数', text: '4 2 4 1 3 2' },
  ],
  defaultInput: [5, 3, 8, 1, 9, 2, 7],
  parse,
  format: (v) => v.join(' '),
  random: () => Array.from({ length: 8 }, () => 1 + Math.floor(Math.random() * 95)),
  run: runBubbleSort,
  View: BubbleView,
  sources: {
    c: String.raw`
#include <stdio.h>
void bubbleSort(int a[],int n){          //@init
    for (int i=0;i<n-1;i++){             //@outer
        int swapped=0;                   //@outer
        for (int j=0;j<n-1-i;j++){
            if (a[j]>a[j+1]){            //@cmp
                int temp=a[j];           //@swap
                a[j]=a[j+1];             //@swap
                a[j+1]=temp;             //@swap
                swapped=1;               //@swap
            }
        }
        if (!swapped) break;             //@pass
    }
}
int main(){
    int n,a[1005];
    scanf("%d",&n);
    for (int i=0;i<n;i++) scanf("%d",&a[i]);
    bubbleSort(a,n);
    for (int i=0;i<n;i++) printf("%d ",a[i]);   //@done
    return 0;
}
`,
    cpp: String.raw`
#include <bits/stdc++.h>
using namespace std;
void bubbleSort(int a[],int n){          //@init
    for (int i=0;i<n-1;i++){             //@outer
        bool swapped=false;              //@outer
        for (int j=0;j<n-1-i;j++){
            if (a[j]>a[j+1]){            //@cmp
                swap(a[j],a[j+1]);       //@swap
                swapped=true;            //@swap
            }
        }
        if (!swapped) break;             //@pass
    }
}
int main(){
    int n,a[1005];
    cin>>n;
    for (int i=0;i<n;i++) cin>>a[i];
    bubbleSort(a,n);
    for (int i=0;i<n;i++) cout<<a[i]<<" ";   //@done
    return 0;
}
`,
    python: String.raw`
def bubble_sort(a):                      #@init
    n = len(a)
    for i in range(n - 1):               #@outer
        swapped = False                  #@outer
        for j in range(n - 1 - i):
            if a[j] > a[j + 1]:          #@cmp
                a[j], a[j + 1] = a[j + 1], a[j]   #@swap
                swapped = True           #@swap
        if not swapped:                  #@pass
            break                        #@pass


n = int(input())
a = list(map(int, input().split()))
bubble_sort(a)
print(*a)                                #@done
`,
    java: String.raw`
import java.util.*;

public class Main {
    static void bubbleSort(int[] a) {            //@init
        int n = a.length;
        for (int i = 0; i < n - 1; i++) {        //@outer
            boolean swapped = false;             //@outer
            for (int j = 0; j < n - 1 - i; j++) {
                if (a[j] > a[j + 1]) {           //@cmp
                    int temp = a[j];             //@swap
                    a[j] = a[j + 1];             //@swap
                    a[j + 1] = temp;             //@swap
                    swapped = true;              //@swap
                }
            }
            if (!swapped) break;                 //@pass
        }
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        int[] a = new int[n];
        for (int i = 0; i < n; i++) a[i] = sc.nextInt();
        bubbleSort(a);
        for (int x : a) System.out.print(x + " ");   //@done
    }
}
`,
  },
  problems: pickProblems('P5715', 'P1116'),
}
