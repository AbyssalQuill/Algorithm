import { GridView, type GridCell } from '../components/GridView'
import { Stats } from '../components/Stats'
import { pickProblems } from '../data/problems'
import { Recorder } from '../engine/recorder'
import type { Example, Frame, ParseResult } from '../engine/types'
import { randInt, readInput } from './shared'

export interface CutInput {
  k: number
  a: number[]
}

export interface CutState {
  k: number
  a: number[]
  lo: number
  hi: number
  mid: number | null
  /** 每根木头按 mid 切，能切出几段 */
  pieces: number[]
  cnt: number | null
  ans: number
  verdict: 'ok' | 'bad' | null
  done: boolean
}

export function runCut({ k, a }: CutInput): Frame<CutState>[] {
  const rec = new Recorder<CutState>()
  const mx = Math.max(...a)
  let lo = 1
  let hi = mx
  let mid: number | null = null
  let pieces: number[] = []
  let cnt: number | null = null
  let ans = 0
  let verdict: CutState['verdict'] = null
  let done = false
  const snap = (): CutState => ({ k, a, lo, hi, mid, pieces, cnt, ans, verdict, done })

  rec.push('init', snap(), `要切出至少 ${k} 段一样长的小段，求每段最长能有多长。小段的长度只可能是 1 到 ${mx}（最长那根木头的长度）之间的整数，先把这个范围 [${lo}, ${hi}] 当作候选的答案。`)
  while (lo <= hi) {
    mid = lo + Math.floor((hi - lo) / 2)
    pieces = a.map((x) => Math.floor(x / (mid as number)))
    cnt = pieces.reduce((x, y) => x + y, 0)
    verdict = null
    rec.push('check', snap(), `试一试长度 mid = ${mid}：每根木头能切出 ${a.map((x, i) => `${x}÷${mid}=${pieces[i]}`).join('、')} 段，一共 ${cnt} 段，${cnt >= k ? `不少于 ${k} 段，够用。` : `不到 ${k} 段，不够。`}`)
    if (cnt >= k) {
      ans = mid
      lo = mid + 1
      verdict = 'ok'
      rec.push('ok', snap(), `长度 ${mid} 能满足要求，先记下 ans = ${mid}。但也许还能更长，所以去右半边继续找：lo = ${lo}，候选范围变成 [${lo}, ${hi}]。`)
    } else {
      hi = mid - 1
      verdict = 'bad'
      rec.push('bad', snap(), `长度 ${mid} 切不出足够的段数，更长的就更不行了，所以答案一定比 ${mid} 短：hi = ${hi}，候选范围变成 [${lo}, ${hi}]。`)
    }
  }
  mid = null
  pieces = []
  cnt = null
  verdict = null
  done = true
  rec.push('done', snap(), ans > 0 ? `候选范围空了，最后记下的 ans = ${ans} 就是每段最长的长度。` : `候选范围空了，从来没有一个长度满足要求，连长度 1 也切不出 ${k} 段，输出 0。`)
  return rec.frames
}

function CutView({ frame }: { frame: Frame<CutState> }) {
  const s = frame.state
  const mx = Math.max(...s.a)
  const pct = (v: number) => `${((v - 1) / Math.max(1, mx)) * 100}%`
  const rows: GridCell[][] = [
    [{ head: true, text: '木头' }, ...s.a.map((_, i): GridCell => ({ head: true, text: `#${i + 1}` }))],
    [{ head: true, text: '长度' }, ...s.a.map((x): GridCell => ({ text: x, tone: 'idle' }))],
    ...(s.mid !== null ? [[{ head: true, text: `÷ ${s.mid}` } as GridCell, ...s.pieces.map((p): GridCell => ({ text: p, tone: p > 0 ? 'found' : 'dim' }))]] : []),
  ]
  return (
    <div className="viz">
      <div className="row-label">候选的长度范围 [lo, hi]（刻度 1 到 {mx}）</div>
      <div className="rng" aria-hidden="true">
        {s.lo <= s.hi && <div className="rng-seg" style={{ left: pct(s.lo), width: `${((s.hi - s.lo + 1) / Math.max(1, mx)) * 100}%` }} />}
        {s.mid !== null && <div className="rng-mid" style={{ left: `calc(${pct(s.mid)} + ${50 / Math.max(1, mx)}%)` }} />}
      </div>
      <GridView rows={rows} maxCell={52} />
      {s.cnt !== null && (
        <div className="target-row">
          <span className="target-chip">
            长度 {s.mid} 一共能切出 <b>{s.cnt}</b> 段，需要 <b>{s.k}</b> 段
          </span>
          {s.verdict && <span className={`verdict ${s.verdict}`}>{s.verdict === 'ok' ? '够用，试试更长的' : '不够，要切短一点'}</span>}
        </div>
      )}
      {s.done && (
        <div className="target-row">
          <span className="verdict ok">每段最长：{s.ans}</span>
        </div>
      )}
      <Stats items={[['lo', s.lo], ['mid', s.mid ?? '—'], ['hi', s.hi], ['目前的答案 ans', s.ans]]} />
    </div>
  )
}

function parse(text: string): ParseResult<CutInput> {
  return readInput(text, (r) => {
    const n = r.int('n', 1, 6)
    const k = r.int('k', 1, 30)
    const a = r.ints(n, '木头的长度', 1, 30)
    r.end()
    return { k, a }
  })
}

export const cutAnswer = ({ k, a }: CutInput) => {
  for (let len = Math.max(...a); len >= 1; len--) if (a.reduce((s, x) => s + Math.floor(x / len), 0) >= k) return len
  return 0
}

export const binaryAnswer: Example<CutInput, CutState> = {
  slug: 'cut',
  name: '木材加工',
  type: '二分答案',
  statement: {
    desc: [
      '有 n 根木头，长度分别是 a[1]、a[2]……a[n]。现在要把它们锯成许多段长度相同的小段，每根木头锯下的小段的长度必须是整数，剩下不足一段的部分不要。要求一共至少得到 k 段，求每段小木头最长可以是多少；如果连长度 1 的小段也凑不够 k 段，输出 0。',
    ],
    input: ['第一行两个整数 n 和 k（1 ≤ n ≤ 6，1 ≤ k ≤ 30）。', '第二行 n 个整数，是各根木头的长度，每个在 1～30 之间。'],
    output: ['一行一个整数，是小段的最大长度，凑不够时输出 0。'],
  },
  idea: [
    '这道题要找的不是数组里的某个数，而是一个“最大的、满足条件的长度”。答案可能的取值是 1 到最长木头的长度，范围不大时可以一个一个试，但范围一大就太慢了，这时可以对“答案”本身做二分。',
    '能这样做，是因为答案具有单调性：如果长度 L 能切出至少 k 段，那么比 L 更短的长度一定也能；如果 L 切不出，更长的就更切不出。所以所有的长度分成两段，前面一段“能”，后面一段“不能”，要找的是“能”的这一段里最靠后的那个，正好用二分。',
    '每次取中间的长度 mid，用一个循环算出每根木头能切几段、一共多少段，和 k 比较：够了，说明 mid 可行，先记下，然后去更长的一边找；不够，就去更短的一边找。这样的“判断一个答案行不行”的函数，竞赛里叫 check，二分答案的难点就是把 check 写对。',
  ],
  complexity: { time: 'O(n·log M)', space: 'O(n)', note: 'M 是最长那根木头的长度，二分最多做 log M 次，每次判断要把 n 根木头都看一遍。' },
  presets: [
    { label: '切出 7 段', text: '3 7\n8 14 20' },
    { label: '要的段数太多', text: '2 30\n5 6' },
    { label: '只有一根木头', text: '1 3\n9' },
  ],
  defaultInput: { k: 8, a: [12, 9, 20, 7] },
  parse,
  format: (v) => `${v.a.length} ${v.k}\n${v.a.join(' ')}`,
  random: () => {
    const n = randInt(2, 5)
    return { k: randInt(3, 14), a: Array.from({ length: n }, () => randInt(4, 30)) }
  },
  answer: (v) => String(cutAnswer(v)),
  run: runCut,
  View: CutView,
  sources: {
    c: String.raw`
#include <stdio.h>
int main(){
    int n,k,a[10],mx=0;
    scanf("%d %d",&n,&k);
    for (int i=0;i<n;i++){
        scanf("%d",&a[i]);
        if (a[i]>mx) mx=a[i];
    }
    int lo=1,hi=mx,ans=0;      // 答案的范围，是 1 到最长的那根木头   //@init
    while (lo<=hi){
        int mid=lo+(hi-lo)/2;  // 试试长度 mid，数一数一共能切出几段  //@check
        int cnt=0;                                     //@check
        for (int i=0;i<n;i++) cnt+=a[i]/mid;           //@check
        if (cnt>=k){
            ans=mid;           // 够用，先记下来，再试试更长的       //@ok
            lo=mid+1;                                  //@ok
        }else{
            hi=mid-1;          // 不够，只能切短一点            //@bad
        }
    }
    printf("%d\n",ans);        // 输出最长的可行长度            //@done
    return 0;
}
`,
    cpp: String.raw`
#include <bits/stdc++.h>
using namespace std;
int main(){
    int n,k,a[10],mx=0;
    cin>>n>>k;
    for (int i=0;i<n;i++){
        cin>>a[i];
        mx=max(mx,a[i]);
    }
    int lo=1,hi=mx,ans=0;      // 答案的范围，是 1 到最长的那根木头   //@init
    while (lo<=hi){
        int mid=lo+(hi-lo)/2;  // 试试长度 mid，数一数一共能切出几段  //@check
        int cnt=0;                                     //@check
        for (int i=0;i<n;i++) cnt+=a[i]/mid;           //@check
        if (cnt>=k){
            ans=mid;           // 够用，先记下来，再试试更长的       //@ok
            lo=mid+1;                                  //@ok
        }else{
            hi=mid-1;          // 不够，只能切短一点            //@bad
        }
    }
    cout<<ans<<endl;           // 输出最长的可行长度            //@done
    return 0;
}
`,
    python: String.raw`
n,k=map(int,input().split())
a=list(map(int,input().split()))
lo,hi,ans=1,max(a),0   # 答案的范围，是 1 到最长的那根木头   #@init
while lo<=hi:
    mid=lo+(hi-lo)//2  # 试试长度 mid，数一数一共能切出几段  #@check
    cnt=sum(x//mid for x in a)                #@check
    if cnt>=k:
        ans=mid        # 够用，先记下来，再试试更长的       #@ok
        lo=mid+1                              #@ok
    else:
        hi=mid-1       # 不够，只能切短一点            #@bad
print(ans)             # 输出最长的可行长度            #@done
`,
    java: String.raw`
import java.util.*;

public class Main{
    public static void main(String[] args){
        Scanner sc=new Scanner(System.in);
        int n=sc.nextInt(),k=sc.nextInt(),mx=0;
        int[] a=new int[n];
        for (int i=0;i<n;i++){
            a[i]=sc.nextInt();
            mx=Math.max(mx,a[i]);
        }
        int lo=1,hi=mx,ans=0;      // 答案的范围，是 1 到最长的那根木头   //@init
        while (lo<=hi){
            int mid=lo+(hi-lo)/2;  // 试试长度 mid，数一数一共能切出几段  //@check
            int cnt=0;                                     //@check
            for (int i=0;i<n;i++) cnt+=a[i]/mid;           //@check
            if (cnt>=k){
                ans=mid;           // 够用，先记下来，再试试更长的       //@ok
                lo=mid+1;                                  //@ok
            }else{
                hi=mid-1;          // 不够，只能切短一点            //@bad
            }
        }
        System.out.println(ans);   // 输出最长的可行长度            //@done
    }
}
`,
  },
  problems: pickProblems('P2440', 'P1873', 'P2678'),
}
