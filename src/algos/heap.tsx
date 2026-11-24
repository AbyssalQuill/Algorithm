import { ArrayView, type Cell, type Pointer, type Tone } from '../components/ArrayView'
import { Stats } from '../components/Stats'
import { TreeView, type TNode } from '../components/TreeView'
import { pickProblems } from '../data/problems'
import { Recorder } from '../engine/recorder'
import type { AlgoDef, Frame, ParseResult } from '../engine/types'
import { randInt, randList, readInput } from './shared'

export interface HeapInput {
  vals: number[]
  pops: number
}

export interface HeapState {
  /** 堆里的数，h[0] 对应位置 1（树的根） */
  h: number[]
  /** 正在处理的位置（从 1 开始） */
  cur: number | null
  /** 与它比较的位置：向上时是父结点，向下时是较小的孩子 */
  other: number | null
  swapped: boolean
  /** 正在做什么 */
  phase: 'push' | 'pop' | 'done'
  popped: number[]
  swaps: number
}

export function runHeap({ vals, pops }: HeapInput): Frame<HeapState>[] {
  const rec = new Recorder<HeapState>()
  const h: number[] = []
  let cur: number | null = null
  let other: number | null = null
  let swapped = false
  let phase: HeapState['phase'] = 'push'
  const popped: number[] = []
  let swaps = 0
  const snap = (): HeapState => ({ h, cur, other, swapped, phase, popped, swaps })
  const at = (i: number) => h[i - 1]

  rec.push('init', snap(), '用的是小根堆：每个结点都不大于它的两个孩子，所以堆顶（根）永远是最小的。堆存放在数组里，位置 i 的孩子是 2i 和 2i+1，父结点是 i/2。')
  for (const x of vals) {
    phase = 'push'
    h.push(x)
    let i = h.length
    cur = i
    other = null
    swapped = false
    rec.push('push', snap(), `插入 ${x}：先放在数组的最后，也就是树的最下面一层的下一个空位（位置 ${i}）。再让它“上浮”，直到不比父结点小。`)
    while (i > 1) {
      const p = i >> 1
      cur = i
      other = p
      swapped = false
      if (at(i) < at(p)) {
        rec.push('up', snap(), `${at(i)} 比它的父结点 ${at(p)} 小，违反了“父不大于子”的规则，需要交换。`)
        ;[h[i - 1], h[p - 1]] = [h[p - 1], h[i - 1]]
        swaps++
        swapped = true
        cur = p
        other = i
        rec.push('swapUp', snap(), `交换之后 ${at(p)} 来到位置 ${p}，继续和它新的父结点比较。`)
        i = p
      } else {
        rec.push('up', snap(), `${at(i)} 不比它的父结点 ${at(p)} 小，位置合适，上浮结束。`)
        break
      }
    }
    cur = null
    other = null
    swapped = false
  }
  for (let t = 0; t < pops; t++) {
    phase = 'pop'
    const top = h[0]
    popped.push(top)
    cur = 1
    other = null
    swapped = false
    rec.push('pop', snap(), `弹出堆顶 ${top}，它一定是当前最小的数。堆顶空了出来，要找个数补上去。`)
    const last = h.pop() as number
    if (h.length > 0) {
      h[0] = last
      cur = 1
      rec.push('moveLast', snap(), `把数组最后一个数 ${last} 搬到堆顶，这样数组仍然是连续的。但它很可能比孩子大，需要让它“下沉”。`)
    } else {
      cur = null
      rec.push('moveLast', snap(), `堆里只有这一个数，弹出后堆就空了。`)
    }
    let i = 1
    while (2 * i <= h.length) {
      let c = 2 * i
      let note = `位置 ${i} 的数是 ${at(i)}，只有左孩子 ${at(c)}。`
      if (c + 1 <= h.length) {
        note = `位置 ${i} 的数是 ${at(i)}，它的两个孩子是 ${at(c)} 和 ${at(c + 1)}，${at(c + 1) < at(c) ? `右边的 ${at(c + 1)} 更小，选右孩子。` : `左边的 ${at(c)} 不大于右边，选左孩子。`}`
        if (at(c + 1) < at(c)) c++
      }
      cur = i
      other = c
      swapped = false
      rec.push('pickChild', snap(), note)
      if (at(c) >= at(i)) {
        rec.push('down', snap(), `较小的孩子 ${at(c)} 不比 ${at(i)} 小，规则已经满足，下沉结束。`)
        break
      }
      rec.push('down', snap(), `较小的孩子 ${at(c)} 比 ${at(i)} 小，需要交换，让更小的数上去。`)
      ;[h[i - 1], h[c - 1]] = [h[c - 1], h[i - 1]]
      swaps++
      swapped = true
      cur = c
      other = i
      rec.push('swapDown', snap(), `交换之后 ${at(i)} 来到位置 ${i}，${at(c)} 继续在位置 ${c} 往下比较。`)
      i = c
    }
    cur = null
    other = null
    swapped = false
  }
  phase = 'done'
  cur = null
  other = null
  rec.push('done', snap(), `一共弹出了 ${pops} 次，依次得到 ${popped.join('、')}，恰好是从小到大的顺序。这就是堆排序的原理。`)
  return rec.frames
}

function HeapView({ frame }: { frame: Frame<HeapState> }) {
  const s = frame.state
  const tone = (i: number): Tone => {
    if (s.cur === i) return s.swapped ? 'swap' : 'compare'
    if (s.other === i) return s.swapped ? 'swap' : 'found'
    return 'idle'
  }
  const n = s.h.length
  const tn: TNode[] = s.h.map((v, k) => {
    const i = k + 1
    return { id: i, label: v, kids: [2 * i, 2 * i + 1].filter((c) => c <= n), tone: tone(i), edge: s.cur === i || s.other === i ? 'done' : 'idle' }
  })
  const cells: Cell[] = s.h.map((v, k) => ({ id: k + 1, v, tone: tone(k + 1) }))
  const ptr: Pointer[] = []
  if (s.cur !== null && s.cur <= n) ptr.push({ name: 'i', index: s.cur - 1, tone: 'compare' })
  return (
    <div className="viz">
      <div className="row-label">堆（把数组看成一棵完全二叉树）</div>
      <TreeView nodes={tn} root={n > 0 ? 1 : null} mode="tidy" levels={4} maxSlots={6} />
      <div className="row-label">存放堆的数组（下标从 1 开始）</div>
      <ArrayView cells={cells} pointers={ptr} mode="boxes" base={1} minSlots={1} />
      {s.popped.length > 0 && (
        <>
          <div className="row-label">已经弹出的数（依次）</div>
          <div className="outline">
            {s.popped.map((v, i) => (
              <span key={i} className="qchip">
                {v}
              </span>
            ))}
          </div>
        </>
      )}
      <Stats
        items={[
          ['堆里的数', n],
          ['交换次数', s.swaps],
        ]}
      />
    </div>
  )
}

function parse(text: string): ParseResult<HeapInput> {
  return readInput(text, (r) => {
    const m = r.int('m', 2, 10)
    const pops = r.int('k', 1, m)
    const vals = r.ints(m, '数', 1, 99)
    r.end()
    return { vals, pops }
  })
}

export const heap: AlgoDef<HeapInput, HeapState> = {
  id: 'heap',
  title: '堆',
  tagline: '用数组存放的完全二叉树，堆顶永远是最小的数，插入和弹出都只沿着一条路径走',
  kind: '数据结构',
  slug: 'push-pop',
  name: '插入与弹出',
  type: '小根堆',
  statement: {
    desc: [
      '依次把 m 个整数插入一个小根堆（堆顶是当前最小的数），然后连续弹出 k 次堆顶，按弹出的先后顺序输出这些数。',
    ],
    input: [
      '第一行两个整数 m 和 k（2 ≤ m ≤ 10，1 ≤ k ≤ m）。',
      '第二行 m 个整数，每个在 1～99 之间，按这个顺序依次插入。',
    ],
    output: [
      '一行 k 个整数，是依次弹出的数，用空格隔开。',
    ],
  },
  intro: [
    '堆是一棵完全二叉树，并且每个结点都不大于它的两个孩子（这是小根堆；反过来就是大根堆）。所以最小的数一定在最顶上。完全二叉树有一个很方便的性质：可以直接存放在数组里，位置 i 的左右孩子是 2i 和 2i+1，父结点是 i/2，不需要任何指针。',
    '插入时先把新数放在数组末尾，再和父结点比较，比父结点小就交换，一路向上，这叫上浮。弹出时取走堆顶，把末尾的数搬到堆顶补缺，再和较小的孩子比较，比孩子大就交换，一路向下，这叫下沉。两种操作最多走过树的高度那么多步，所以都是 O(log n)。',
  ],
  points: [
    '数组从下标 1 开始存放，这样 2i、2i+1、i/2 的计算最简单。',
    '上浮时只需要和父结点比较；下沉时要先在两个孩子里选出较小的一个，再和它比较。',
    '下沉时要先判断有没有右孩子（2i+1<=n），只有左孩子的情形也很常见。',
    '把所有数依次插入再依次弹出，得到的就是从小到大的有序序列，这就是堆排序。标准库的 priority_queue 就是堆。',
  ],
  pitfalls: [
    '下沉时没有选较小的孩子，而是总和左孩子比较，会破坏堆的规则。',
    '弹出之后忘记把元素个数减一，或者在只有一个元素时还去访问 h[n]。',
    '堆只能快速地取出最小值，不能快速地查找任意一个数，也不能对整个堆做有序遍历。',
  ],
  complexity: { time: 'O(log n)', space: 'O(n)', note: '插入和弹出都是 O(log n)，取堆顶是 O(1)。' },
  presets: [
    { label: '随便一组', text: '6 3\n5 3 8 1 9 2' },
    { label: '递增插入', text: '7 2\n1 2 3 4 5 6 7' },
    { label: '递减插入', text: '7 3\n7 6 5 4 3 2 1' },
  ],
  defaultInput: { vals: [5, 3, 8, 1, 9, 2], pops: 3 },
  parse,
  format: (v) => `${v.vals.length} ${v.pops}\n${v.vals.join(' ')}`,
  answer: (v) => [...v.vals].sort((a, b) => a - b).slice(0, v.pops).join(' '),
  random: () => {
    const vals = randList(randInt(6, 9), 1, 60)
    return { vals, pops: randInt(1, Math.min(4, vals.length)) }
  },
  run: runHeap,
  View: HeapView,
  sources: {
    c: String.raw`
#include <stdio.h>
int h[1005],n=0;                            //@init
void push(int x){
    h[++n]=x;                               //@push
    int i=n;
    while (i>1&&h[i]<h[i/2]){               //@up
        int t=h[i];                         //@swapUp
        h[i]=h[i/2];                        //@swapUp
        h[i/2]=t;                           //@swapUp
        i/=2;                               //@swapUp
    }
}
int pop(){
    int top=h[1];                           //@pop
    h[1]=h[n--];                            //@moveLast
    int i=1;
    while (2*i<=n){
        int c=2*i;                          //@pickChild
        if (c+1<=n&&h[c+1]<h[c]) c++;       //@pickChild
        if (h[c]>=h[i]) break;              //@down
        int t=h[i];                         //@swapDown
        h[i]=h[c];                          //@swapDown
        h[c]=t;                             //@swapDown
        i=c;                                //@swapDown
    }
    return top;
}
int main(){
    int m,k,x;
    scanf("%d %d",&m,&k);
    for (int i=0;i<m;i++){
        scanf("%d",&x);
        push(x);
    }
    for (int i=0;i<k;i++) printf("%d ",pop());
    printf("\n");                           //@done
    return 0;
}
`,
    cpp: String.raw`
#include <bits/stdc++.h>
using namespace std;
int h[1005],n=0;                            //@init
void push(int x){
    h[++n]=x;                               //@push
    int i=n;
    while (i>1&&h[i]<h[i/2]){               //@up
        swap(h[i],h[i/2]);                  //@swapUp
        i/=2;                               //@swapUp
    }
}
int pop(){
    int top=h[1];                           //@pop
    h[1]=h[n--];                            //@moveLast
    int i=1;
    while (2*i<=n){
        int c=2*i;                          //@pickChild
        if (c+1<=n&&h[c+1]<h[c]) c++;       //@pickChild
        if (h[c]>=h[i]) break;              //@down
        swap(h[i],h[c]);                    //@swapDown
        i=c;                                //@swapDown
    }
    return top;
}
int main(){
    int m,k,x;
    cin>>m>>k;
    for (int i=0;i<m;i++){
        cin>>x;
        push(x);
    }
    for (int i=0;i<k;i++) cout<<pop()<<" ";
    cout<<endl;                             //@done
    return 0;
}
`,
    python: String.raw`
h=[0]                                       #@init

def push(x):
    h.append(x)                             #@push
    i=len(h)-1
    while i>1 and h[i]<h[i//2]:             #@up
        h[i],h[i//2]=h[i//2],h[i]           #@swapUp
        i//=2                               #@swapUp

def pop():
    top=h[1]                                #@pop
    h[1]=h[-1]                              #@moveLast
    h.pop()                                 #@moveLast
    n=len(h)-1
    i=1
    while 2*i<=n:
        c=2*i                               #@pickChild
        if c+1<=n and h[c+1]<h[c]:          #@pickChild
            c+=1                            #@pickChild
        if h[c]>=h[i]:                      #@down
            break
        h[i],h[c]=h[c],h[i]                 #@swapDown
        i=c                                 #@swapDown
    return top

m,k=map(int,input().split())
for x in map(int,input().split()):
    push(x)
print(*[pop() for _ in range(k)])           #@done
`,
    java: String.raw`
import java.util.*;

public class Main{
    static int[] h=new int[1005];
    static int n=0;                         //@init

    static void push(int x){
        h[++n]=x;                           //@push
        int i=n;
        while (i>1&&h[i]<h[i/2]){           //@up
            int t=h[i];                     //@swapUp
            h[i]=h[i/2];                    //@swapUp
            h[i/2]=t;                       //@swapUp
            i/=2;                           //@swapUp
        }
    }

    static int pop(){
        int top=h[1];                       //@pop
        h[1]=h[n--];                        //@moveLast
        int i=1;
        while (2*i<=n){
            int c=2*i;                      //@pickChild
            if (c+1<=n&&h[c+1]<h[c]) c++;   //@pickChild
            if (h[c]>=h[i]) break;          //@down
            int t=h[i];                     //@swapDown
            h[i]=h[c];                      //@swapDown
            h[c]=t;                         //@swapDown
            i=c;                            //@swapDown
        }
        return top;
    }

    public static void main(String[] args){
        Scanner sc=new Scanner(System.in);
        int m=sc.nextInt(),k=sc.nextInt();
        for (int i=0;i<m;i++) push(sc.nextInt());
        StringBuilder sb=new StringBuilder();
        for (int i=0;i<k;i++) sb.append(pop()).append(' ');
        System.out.println(sb);             //@done
    }
}
`,
  },
  problems: pickProblems('P3378', 'P1090'),
}
