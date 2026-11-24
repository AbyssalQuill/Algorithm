import { Stats } from '../components/Stats'
import { pickProblems } from '../data/problems'
import { Recorder } from '../engine/recorder'
import type { AlgoDef, Frame, ParseResult } from '../engine/types'
import { greedyWater } from './greedyWater'
import { randInt, readInput } from './shared'

export interface Act {
  s: number
  e: number
}

export type GreedyInput = Act[]

type Status = 'wait' | 'take' | 'skip' | 'cur'

export interface GreedyState {
  /** 按结束时间从早到晚排好的活动 */
  acts: Act[]
  status: Status[]
  last: number
  count: number
  finished: boolean
}

export const sortActs = (acts: Act[]) => acts.map((a) => ({ ...a })).sort((x, y) => x.e - y.e || x.s - y.s)

export function runGreedy(input: GreedyInput): Frame<GreedyState>[] {
  const rec = new Recorder<GreedyState>()
  const acts = sortActs(input)
  const status: Status[] = acts.map(() => 'wait')
  let last = -1
  let count = 0
  let finished = false
  const snap = (): GreedyState => ({ acts, status, last, count, finished })

  rec.push('init', snap(), `同一个会议室，有 ${acts.length} 个活动，每个活动占用一段时间，时间重叠的两个活动不能同时安排。怎样安排才能让举办的活动个数最多？贪心的做法：先把活动按结束时间从早到晚排好，下面的条形图就是排好之后的样子。`)
  acts.forEach((a, i) => {
    status[i] = 'cur'
    if (a.s < last) {
      status[i] = 'skip'
      rec.push('skip', snap(), `活动 ${a.s}～${a.e} 的开始时间 ${a.s} 早于上一个已选活动的结束时间 ${last}，两者重叠，放弃。`)
      return
    }
    count++
    last = a.e
    status[i] = 'take'
    rec.push('take', snap(), `活动 ${a.s}～${a.e} 不与已选的活动重叠，选下它。因为是按结束时间排的，选结束最早的活动，给后面留下的时间最多。已选 ${count} 个，最后的结束时间是 ${last}。`)
  })
  finished = true
  rec.push('done', snap(), `一共可以安排 ${count} 个活动。`)
  return rec.frames
}

function GreedyView({ frame }: { frame: Frame<GreedyState> }) {
  const s = frame.state
  const T = Math.max(...s.acts.map((a) => a.e), 1)
  return (
    <div className="viz">
      <div className="tl">
        {s.acts.map((a, i) => (
          <div key={i} className="tl-row">
            <span className="tl-label">
              {a.s}～{a.e}
            </span>
            <span className="tl-track">
              <span className={`tl-bar tone-${s.status[i] === 'take' ? 'done' : s.status[i] === 'skip' ? 'swap' : s.status[i] === 'cur' ? 'compare' : 'idle'}`} style={{ left: `${(a.s / T) * 100}%`, width: `${((a.e - a.s) / T) * 100}%` }} />
            </span>
          </div>
        ))}
        <div className="tl-row">
          <span className="tl-label" />
          <span className="tl-track tl-axis">
            {Array.from({ length: T + 1 }, (_, t) => (
              <i key={t} style={{ left: `${(t / T) * 100}%` }}>
                {t}
              </i>
            ))}
          </span>
        </div>
      </div>
      <div className="legend">
        <span><i className="sw tone-done" />选中</span>
        <span><i className="sw tone-swap" />因重叠放弃</span>
        <span><i className="sw tone-compare" />正在看</span>
      </div>
      <Stats items={[['已选活动', s.count], ['上一个结束时间', s.last < 0 ? '—' : s.last]]} />
    </div>
  )
}

function parse(text: string): ParseResult<GreedyInput> {
  return readInput(text, (r) => {
    const n = r.int('n', 2, 8)
    const acts: Act[] = []
    for (let k = 1; k <= n; k++) {
      const s = r.int(`第 ${k} 个活动的 start`, 0, 19)
      const e = r.int(`第 ${k} 个活动的 end`, s + 1, 20)
      acts.push({ s, e })
    }
    r.end()
    return acts
  })
}

export const greedy: AlgoDef<GreedyInput, GreedyState> = {
  id: 'greedy',
  title: '贪心',
  tagline: '每一步都选“当下最合适”的，只要选择的标准是对的，局部最优就能拼出全局最优',
  kind: '算法',
  slug: 'activities',
  name: '活动选择',
  type: '区间调度',
  statement: {
    desc: [
      'n 个活动要在同一个教室里举行，每个活动有开始时间 start 和结束时间 end。同一时刻教室里只能进行一个活动，一个活动结束的时刻，别的活动可以立刻开始。最多能安排多少个活动？',
    ],
    input: [
      '第一行一个整数 n（2 ≤ n ≤ 8）。',
      '接下来 n 行，每行两个整数 start 和 end（0 ≤ start < end ≤ 20）。',
    ],
    output: [
      '一行一个整数，是最多能安排的活动个数。',
    ],
  },
  intro: [
    '贪心算法的特点是：每一步都做出当前看起来最好的选择，不回头，也不考虑以后。这听起来有些莽撞，但在很多问题里，只要“最好”的标准选对了，一路这样选下去，得到的就是全局最优解。',
    '活动选择问题是最好的例子：很多活动争用同一个会议室，要选出尽可能多的、互不重叠的活动。有人会想先选开始最早的，也有人想先选时间最短的，它们都能举出反例。正确的标准是“结束得最早”：先挑结束最早的活动，这样留给后面的时间最多。选定之后，再从剩下的、与它不重叠的活动里，继续挑结束最早的。',
  ],
  points: [
    '先按结束时间从小到大排序，然后顺序扫描，用 last 记录最后一个已选活动的结束时间。',
    '当前活动的开始时间不早于 last，就选下它并更新 last；否则跳过。',
    '时间刚好相接（一个的结束时间等于另一个的开始时间）不算重叠，所以判断重叠时用 a.s<last，而不是 <=。',
    '总时间主要是排序的 O(n log n)，扫描一遍只要 O(n)。',
  ],
  pitfalls: [
    '贪心的标准必须有道理，不能凭感觉：按“开始最早”或“时间最短”排序都会得到错误的答案，一定要想反例验证。',
    '很多看似可以贪心的题目其实不行（比如 0-1 背包），需要动态规划。写贪心前要先证明或者举反例检验。',
    '排序时结束时间相同的活动，要保证排序规则一致，否则统计结果虽然相同，但选出的活动可能不同。',
  ],
  complexity: { time: 'O(n log n)', space: 'O(n)', note: '时间花在排序上；排好序之后只需要线性扫描一遍。' },
  presets: [
    { label: '经典例子', text: '8\n1 4\n3 5\n0 6\n5 7\n3 9\n5 9\n6 10\n8 11' },
    { label: '一个长活动挡路', text: '5\n0 10\n1 3\n3 5\n5 7\n7 9' },
    { label: '首尾相接', text: '4\n1 3\n3 6\n6 9\n2 7' },
  ],
  defaultInput: [{ s: 1, e: 4 }, { s: 3, e: 5 }, { s: 0, e: 6 }, { s: 5, e: 7 }, { s: 3, e: 9 }, { s: 5, e: 9 }, { s: 6, e: 10 }, { s: 8, e: 11 }],
  parse,
  format: (v) => `${v.length}\n${v.map((a) => `${a.s} ${a.e}`).join('\n')}`,
  answer: (v) => {
    let last = -1
    let cnt = 0
    for (const a of [...v].sort((x, y) => x.e - y.e || x.s - y.s)) {
      if (a.s < last) continue
      cnt++
      last = a.e
    }
    return String(cnt)
  },
  random: () =>
    Array.from({ length: randInt(5, 7) }, () => {
      const s = randInt(0, 14)
      return { s, e: s + randInt(1, 6) }
    }),
  run: runGreedy,
  View: GreedyView,
  sources: {
    c: String.raw`
#include <stdio.h>
#include <stdlib.h>
struct Act{
    int start,end;
};
int cmp(const void *x,const void *y){
    const struct Act *a=x,*b=y;
    if (a->end!=b->end) return a->end-b->end;
    return a->start-b->start;
}
int main(){
    int n;
    struct Act acts[105];
    scanf("%d",&n);
    for (int i=0;i<n;i++) scanf("%d %d",&acts[i].start,&acts[i].end);
    qsort(acts,n,sizeof(struct Act),cmp);   //@init
    int last=-1,cnt=0;
    for (int i=0;i<n;i++){
        if (acts[i].start<last) continue;   //@skip
        cnt++;                              //@take
        last=acts[i].end;                   //@take
    }
    printf("%d\n",cnt);                     //@done
    return 0;
}
`,
    cpp: String.raw`
#include <bits/stdc++.h>
using namespace std;
struct Act{
    int start,end;
};
int main(){
    int n;
    cin>>n;
    vector<Act> acts(n);
    for (auto &a:acts) cin>>a.start>>a.end;
    sort(acts.begin(),acts.end(),[](const Act &x,const Act &y){
        if (x.end!=y.end) return x.end<y.end;
        return x.start<y.start;
    });                                     //@init
    int last=-1,cnt=0;
    for (auto &a:acts){
        if (a.start<last) continue;         //@skip
        cnt++;                              //@take
        last=a.end;                         //@take
    }
    cout<<cnt<<endl;                        //@done
    return 0;
}
`,
    python: String.raw`
from collections import namedtuple
Act=namedtuple('Act','start end')
n=int(input())
acts=[Act(*map(int,input().split())) for _ in range(n)]
acts.sort(key=lambda a: (a.end,a.start))    #@init
last,cnt=-1,0
for a in acts:
    if a.start<last:
        continue                            #@skip
    cnt+=1                                  #@take
    last=a.end                              #@take
print(cnt)                                  #@done
`,
    java: String.raw`
import java.util.*;

public class Main{
    static class Act{
        int start,end;
        Act(int start,int end){
            this.start=start;
            this.end=end;
        }
    }

    public static void main(String[] args){
        Scanner sc=new Scanner(System.in);
        int n=sc.nextInt();
        Act[] acts=new Act[n];
        for (int i=0;i<n;i++) acts[i]=new Act(sc.nextInt(),sc.nextInt());
        Arrays.sort(acts,(a,b)->a.end!=b.end?a.end-b.end:a.start-b.start);  //@init
        int last=-1,cnt=0;
        for (Act a:acts){
            if (a.start<last) continue;                         //@skip
            cnt++;                                              //@take
            last=a.end;                                         //@take
        }
        System.out.println(cnt);                                //@done
    }
}
`,
  },
  problems: pickProblems('P1803', 'P1090'),
  extra: [greedyWater],
}
