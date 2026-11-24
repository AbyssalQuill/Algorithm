import { Stats } from '../components/Stats'
import { pickProblems } from '../data/problems'
import { Recorder } from '../engine/recorder'
import type { AlgoDef, Frame, ParseResult } from '../engine/types'
import { randInt } from './shared'

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
  const tokens = text.trim().split(/[\s,，;；]+/).filter(Boolean)
  if (tokens.length < 2 || tokens.length > 8) return { ok: false, error: '请写 2～8 个活动，每个写成“开始-结束”，例如：1-4 3-5 0-6 5-7' }
  const acts: Act[] = []
  for (const t of tokens) {
    const m = /^(\d+)-(\d+)$/.exec(t)
    if (!m) return { ok: false, error: `“${t}”不对，要写成 开始-结束，例如 1-4。` }
    const s = Number(m[1])
    const e = Number(m[2])
    if (s >= e || e > 20) return { ok: false, error: '每个活动要满足 开始 < 结束 ≤ 20。' }
    acts.push({ s, e })
  }
  return { ok: true, value: acts }
}

export const greedy: AlgoDef<GreedyInput, GreedyState> = {
  id: 'greedy',
  title: '贪心：活动选择',
  tagline: '每一步都选“当下最合适”的，只要选择的标准是对的，局部最优就能拼出全局最优',
  kind: '算法',
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
  inputHint: '输入活动，每个写成 开始-结束，用空格隔开，例如 1-4 3-5 0-6 5-7 3-9 5-9 6-10 8-11（时间 0～20，最多 8 个）。',
  presets: [
    { label: '经典例子', text: '1-4 3-5 0-6 5-7 3-9 5-9 6-10 8-11' },
    { label: '一个长活动挡路', text: '0-10 1-3 3-5 5-7 7-9' },
    { label: '首尾相接', text: '1-3 3-6 6-9 2-7' },
  ],
  defaultInput: [{ s: 1, e: 4 }, { s: 3, e: 5 }, { s: 0, e: 6 }, { s: 5, e: 7 }, { s: 3, e: 9 }, { s: 5, e: 9 }, { s: 6, e: 10 }, { s: 8, e: 11 }],
  parse,
  format: (v) => v.map((a) => `${a.s}-${a.e}`).join(' '),
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
int s[105],e[105];
int main(){
    int n;
    scanf("%d",&n);
    for (int i=0;i<n;i++) scanf("%d %d",&s[i],&e[i]);
    for (int i=1;i<n;i++){                      //@init
        int a=s[i],b=e[i],j=i-1;
        while (j>=0&&(e[j]>b||(e[j]==b&&s[j]>a))){
            s[j+1]=s[j]; e[j+1]=e[j];
            j--;
        }
        s[j+1]=a; e[j+1]=b;
    }
    int last=-1,cnt=0;
    for (int i=0;i<n;i++){
        if (s[i]<last) continue;                //@skip
        cnt++;                                  //@take
        last=e[i];                              //@take
    }
    printf("%d\n",cnt);                         //@done
    return 0;
}
`,
    cpp: String.raw`
#include <bits/stdc++.h>
using namespace std;
struct Act{ int s,e; };
int main(){
    int n;
    cin>>n;
    vector<Act> acts(n);
    for (auto &a:acts) cin>>a.s>>a.e;
    sort(acts.begin(),acts.end(),[](const Act &x,const Act &y){
        return x.e!=y.e?x.e<y.e:x.s<y.s;
    });                                         //@init
    int last=-1,cnt=0;
    for (auto &a:acts){
        if (a.s<last) continue;                 //@skip
        cnt++;                                  //@take
        last=a.e;                               //@take
    }
    cout<<cnt<<endl;                            //@done
    return 0;
}
`,
    python: String.raw`
n = int(input())
acts = [tuple(map(int, input().split())) for _ in range(n)]
acts.sort(key=lambda a: (a[1], a[0]))           #@init
last, cnt = -1, 0
for s, e in acts:
    if s < last:
        continue                                #@skip
    cnt += 1                                    #@take
    last = e                                    #@take
print(cnt)                                      #@done
`,
    java: String.raw`
import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        int[][] acts = new int[n][2];
        for (int i = 0; i < n; i++) {
            acts[i][0] = sc.nextInt();
            acts[i][1] = sc.nextInt();
        }
        Arrays.sort(acts, (a, b) -> a[1] != b[1] ? a[1] - b[1] : a[0] - b[0]);   //@init
        int last = -1, cnt = 0;
        for (int[] a : acts) {
            if (a[0] < last) continue;              //@skip
            cnt++;                                  //@take
            last = a[1];                            //@take
        }
        System.out.println(cnt);                    //@done
    }
}
`,
  },
  problems: pickProblems('P1803', 'P1090'),
}
