import { ArrayView, type Cell, type Pointer } from '../components/ArrayView'
import { Stats } from '../components/Stats'
import { pickProblems } from '../data/problems'
import { Recorder } from '../engine/recorder'
import type { AlgoDef, Frame, ParseResult } from '../engine/types'
import { randInt, readInput } from './shared'

export interface JoInput {
  n: number
  m: number
}

export interface JoState {
  /** 队列里的人，队头在最前面；id 就是编号，方便动画里跟踪每个人 */
  queue: { id: number; v: number }[]
  /** 刚从队头出来、正在报数的人 */
  hand: number | null
  cnt: number
  /** 已经出列的人，按出列的先后顺序 */
  out: number[]
  n: number
  m: number
}

export function runJosephus({ n, m }: JoInput): Frame<JoState>[] {
  const rec = new Recorder<JoState>()
  const q = Array.from({ length: n }, (_, i) => ({ id: i + 1, v: i + 1 }))
  let hand: number | null = null
  let cnt = 0
  const out: number[] = []
  const snap = (): JoState => ({ queue: q, hand, cnt, out, n, m })

  rec.push('init', snap(), `${n} 个人按编号 1 到 ${n} 排成一队。队头的人开始报数，报到 ${m} 的人出列，没有报到的人回到队尾继续排队。`)
  while (q.length > 0) {
    const x = q.shift()!
    hand = x.v
    cnt++
    rec.push('pop', snap(), `队头的 ${x.v} 号离开队伍报数，他报的是 ${cnt}。`)
    if (cnt === m) {
      out.push(x.v)
      hand = null
      cnt = 0
      rec.push('out', snap(), `${x.v} 号报到了 ${m}，出列，不会再回到队伍里。下一个人重新从 1 开始报数。`)
    } else {
      q.push(x)
      hand = null
      rec.push('back', snap(), `${x.v} 号只报到 ${cnt}，还没到 ${m}，回到队尾。`)
    }
  }
  rec.push('done', snap(), `队伍空了，所有人都出过列。出列的顺序是：${out.join(' ')}。`)
  return rec.frames
}

function JoView({ frame }: { frame: Frame<JoState> }) {
  const s = frame.state
  const cells: Cell[] = s.queue.map((c) => ({ id: c.id, v: c.v, tone: 'idle' }))
  const pointers: Pointer[] =
    s.queue.length > 0
      ? [
          { name: '队头', index: 0, tone: 'done' },
          { name: '队尾', index: s.queue.length - 1, tone: 'compare' },
        ]
      : []
  return (
    <div className="viz">
      <div className="target-row">
        <span className="target-chip">
          报数到 <b>{s.m}</b> 的人出列
        </span>
        {s.hand !== null && (
          <span className="held">
            正在报数：<b>{s.hand}</b> 号，报了 <b>{s.cnt}</b>
          </span>
        )}
        {s.queue.length === 0 && <span className="verdict ok">全部出列</span>}
      </div>
      <ArrayView cells={cells} pointers={pointers} mode="boxes" minSlots={2} />
      <div className="row-label">出列的顺序</div>
      <div className="outline">{s.out.length === 0 ? <span className="qrow-empty">还没有人出列</span> : s.out.map((v, i) => <span key={i} className="qchip">{v}</span>)}</div>
      <Stats
        items={[
          ['队里还有', s.queue.length],
          ['已经出列', s.out.length],
          ['当前报数', s.cnt],
        ]}
      />
    </div>
  )
}

function parse(text: string): ParseResult<JoInput> {
  return readInput(text, (r) => {
    const n = r.int('n', 2, 12)
    const m = r.int('m', 1, 12)
    r.end()
    return { n, m }
  })
}

export const josephusQueue: AlgoDef<JoInput, JoState> = {
  id: 'josephus-queue',
  title: '队列',
  tagline: '队列遵循“先进先出”的规则，用它来模拟一圈人报数、淘汰的过程',
  kind: '数据结构',
  slug: 'josephus',
  name: '约瑟夫问题',
  type: '模拟',
  statement: {
    desc: [
      'n 个人围成一圈，从 1 到 n 编号。从 1 号开始报数，报到 m 的人出列，然后下一个人重新从 1 开始报，直到所有人都出列。按出列的先后顺序，输出每个人的编号。',
    ],
    input: [
      '一行两个整数 n 和 m，用空格隔开（2 ≤ n ≤ 12，1 ≤ m ≤ 12）。',
    ],
    output: [
      '一行 n 个整数，是出列的顺序，用空格隔开。',
    ],
  },
  intro: [
    '队列是和栈相反的数据结构：先来的先走。就像排队买票，新来的人站到队尾，每次办完事离开的一定是队头的人。对应的两个基本操作叫作入队（push）和出队（pop）。',
    '约瑟夫问题是队列最经典的练习：n 个人围成一圈，从第一个人开始报数，报到 m 的人出列，然后从下一个人开始重新报数，直到所有人都出列。把圈拉直，就是一支队伍：每次让队头的人报数，没报到 m 的回到队尾，报到 m 的就不再回来。',
  ],
  points: [
    '队列有三个常用的操作：push 把元素放到队尾，pop 取走队头的元素，front 只看队头而不取走，empty 判断队列是否为空。',
    '“回到队尾”就是先 pop 再 push 同一个人，这正是用队列模拟环形排队最方便的地方。',
    '报数的计数器 cnt 在有人出列时要清零，下一个人重新从 1 开始。',
    '在 C 里没有现成的队列，可以用数组加两个下标 head、tail 来模拟：出队时 head 加一，入队时 tail 加一。C++ 有 queue，Python 常用 collections.deque，Java 用 ArrayDeque。',
  ],
  pitfalls: [
    '对空队列执行 front 或 pop 是错误的，循环的条件一定要先判断队列是否为空。',
    '用数组模拟队列时，每个人最多会入队 m 次，数组要开得足够大，否则会越界。',
    '把 cnt==m 写成 cnt>=m 在这里碰巧不会出错，但含义不清楚，容易在改题以后留下隐患。',
  ],
  complexity: { time: 'O(n·m)', space: 'O(n)', note: '每个人最多入队 m 次，所以操作总数是 n·m 的量级。' },
  presets: [
    { label: '7 个人报 3', text: '7 3' },
    { label: '报 1 就出列', text: '6 1' },
    { label: '报得比人数还大', text: '5 8' },
  ],
  defaultInput: { n: 7, m: 3 },
  parse,
  format: (v) => `${v.n} ${v.m}`,
  answer: (v) => {
    const q = Array.from({ length: v.n }, (_, i) => i + 1)
    const out: number[] = []
    let cnt = 0
    while (q.length) {
      const x = q.shift()!
      if (++cnt === v.m) {
        out.push(x)
        cnt = 0
      } else q.push(x)
    }
    return out.join(' ')
  },
  random: () => ({ n: randInt(5, 10), m: randInt(2, 5) }),
  run: runJosephus,
  View: JoView,
  sources: {
    c: String.raw`
#include <stdio.h>
int q[100005];
int main(){
    int n,m,head=0,tail=0,cnt=0;
    scanf("%d %d",&n,&m);
    for (int i=1;i<=n;i++) q[tail++]=i;     //@init
    while (head<tail){
        int x=q[head++];                    //@pop
        cnt++;                              //@pop
        if (cnt==m){                        //@out
            printf("%d ",x);                //@out
            cnt=0;                          //@out
        }else{
            q[tail++]=x;                    //@back
        }
    }
    printf("\n");                           //@done
    return 0;
}
`,
    cpp: String.raw`
#include <bits/stdc++.h>
using namespace std;
int main(){
    int n,m;
    cin>>n>>m;
    queue<int> q;
    for (int i=1;i<=n;i++) q.push(i);       //@init
    int cnt=0;
    while (!q.empty()){
        int x=q.front();                    //@pop
        q.pop();                            //@pop
        cnt++;                              //@pop
        if (cnt==m){                        //@out
            cout<<x<<" ";                   //@out
            cnt=0;                          //@out
        }else{
            q.push(x);                      //@back
        }
    }
    cout<<endl;                             //@done
    return 0;
}
`,
    python: String.raw`
from collections import deque

n,m=map(int,input().split())
q=deque(range(1,n+1))                       #@init
cnt=0
res=[]
while q:
    x=q.popleft()                           #@pop
    cnt+=1                                  #@pop
    if cnt==m:                              #@out
        res.append(x)                       #@out
        cnt=0                               #@out
    else:
        q.append(x)                         #@back
print(*res)                                 #@done
`,
    java: String.raw`
import java.util.*;

public class Main{
    public static void main(String[] args){
        Scanner sc=new Scanner(System.in);
        int n=sc.nextInt(),m=sc.nextInt();
        Queue<Integer> q=new ArrayDeque<>();
        for (int i=1;i<=n;i++) q.add(i);    //@init
        int cnt=0;
        while (!q.isEmpty()){
            int x=q.poll();                 //@pop
            cnt++;                          //@pop
            if (cnt==m){                    //@out
                System.out.print(x+" ");    //@out
                cnt=0;                      //@out
            }else{
                q.add(x);                   //@back
            }
        }
        System.out.println();               //@done
    }
}
`,
  },
  problems: pickProblems('P1996', 'P1540'),
}
