import { GridView, type GridCell } from '../components/GridView'
import { Stats } from '../components/Stats'
import { pickProblems } from '../data/problems'
import { Recorder } from '../engine/recorder'
import type { AlgoDef, Frame, ParseResult } from '../engine/types'
import { randInt, readInput } from './shared'

export interface GcdInput {
  a: number
  b: number
}

export interface GcdStep {
  a: number
  b: number
  q: number
  r: number
}

export interface GcdState {
  a0: number
  b0: number
  steps: GcdStep[]
  /** 当前的 (a, b) */
  a: number
  b: number
  gcd: number | null
  lcm: number | null
}

export const gcdOf = (a: number, b: number): number => (b === 0 ? a : gcdOf(b, a % b))

export function runGcd({ a: a0, b: b0 }: GcdInput): Frame<GcdState>[] {
  const rec = new Recorder<GcdState>()
  const steps: GcdStep[] = []
  let a = a0
  let b = b0
  let gcd: number | null = null
  let lcm: number | null = null
  const snap = (): GcdState => ({ a0, b0, steps, a, b, gcd, lcm })

  rec.push('init', snap(), `求 ${a0} 和 ${b0} 的最大公约数。辗转相除法依据的是一个事实：a 和 b 的公约数，也一定是 b 和 a % b 的公约数，反过来也成立，所以 gcd(a, b) = gcd(b, a % b)。每做一次，数字就变小很多，当余数变成 0 时，另一个数就是答案。`)
  while (b !== 0) {
    const q = Math.floor(a / b)
    const r = a % b
    steps.push({ a, b, q, r })
    rec.push('step', snap(), `${a} ÷ ${b} = ${q} …… ${r}，也就是 ${a} = ${q} × ${b} + ${r}。所以 gcd(${a}, ${b}) = gcd(${b}, ${r})，换成更小的一对数继续算。`)
    a = b
    b = r
  }
  gcd = a
  lcm = (a0 / a) * b0
  rec.push('done', snap(), `余数变成了 0，这时的 a 就是答案：${a0} 和 ${b0} 的最大公约数是 ${gcd}。最小公倍数用公式 a ÷ gcd × b 计算：${a0} ÷ ${gcd} × ${b0} = ${lcm}。`)
  return rec.frames
}

function GcdView({ frame }: { frame: Frame<GcdState> }) {
  const s = frame.state
  const rows: GridCell[][] = [
    [{ head: true, text: 'a' }, { head: true, text: 'b' }, { head: true, text: 'a÷b 的商' }, { head: true, text: '余数 a%b' }],
    ...s.steps.map((st, i): GridCell[] => {
      const last = i === s.steps.length - 1 && s.gcd === null
      return [{ text: st.a, tone: last ? 'compare' : 'idle' }, { text: st.b, tone: last ? 'compare' : 'idle' }, { text: st.q, tone: 'idle' }, { text: st.r, tone: st.r === 0 ? 'found' : last ? 'compare' : 'idle' }]
    }),
  ]
  return (
    <div className="viz">
      <div className="target-row">
        <span className="target-chip">
          gcd({s.a0}, {s.b0})
        </span>
        {s.gcd !== null && <span className="verdict ok">最大公约数 = {s.gcd}</span>}
        {s.lcm !== null && <span className="verdict ok">最小公倍数 = {s.lcm}</span>}
      </div>
      {s.steps.length > 0 ? <GridView rows={rows} maxCell={96} /> : <div className="row-label">每一步的算式会出现在这里。</div>}
      <Stats items={[['已经做了', `${s.steps.length} 步`], ['当前的一对数', `(${s.a}, ${s.b})`]]} />
    </div>
  )
}

function parse(text: string): ParseResult<GcdInput> {
  return readInput(text, (r) => {
    const a = r.int('a', 1, 9999)
    const b = r.int('b', 1, 9999)
    r.end()
    return { a, b }
  })
}

export const gcd: AlgoDef<GcdInput, GcdState> = {
  id: 'gcd',
  title: '辗转相除法',
  tagline: '用“大数除以小数取余数”不断缩小，最后剩下的就是最大公约数',
  kind: '算法',
  slug: 'gcd-lcm',
  name: '最大公约数与最小公倍数',
  type: '数论',
  statement: {
    desc: [
      '给定两个正整数 a 和 b，求它们的最大公约数和最小公倍数。',
    ],
    input: [
      '一行两个整数 a 和 b，用空格隔开（1 ≤ a, b ≤ 9999）。',
    ],
    output: [
      '一行两个整数，依次是最大公约数和最小公倍数，用空格隔开。',
    ],
  },
  intro: [
    '两个数的最大公约数，最直接的求法是从小到大逐个试，慢而且笨。两千多年前欧几里得就给出了一个又快又漂亮的办法：辗转相除。用较大的数除以较小的数，取余数；然后拿较小的数和这个余数继续做同样的事，直到余数是 0 为止，这时除数就是答案。',
    '它背后的道理是：a 和 b 的公约数，一定整除 a - k·b，也就是余数 a % b。所以 a、b 的所有公约数，和 b、a%b 的所有公约数是同一批，最大公约数自然也相同。每一步，较大的数至少减少一半以上，所以步数只有 O(log n)，即使是十亿级的数，也只要几十步。',
  ],
  points: [
    '核心就是 gcd(a, b) = gcd(b, a % b)，直到 b 变成 0，此时 gcd(a, 0) = a。',
    '循环的写法只需要三行：t = a % b; a = b; b = t。不需要判断哪个数更大，如果 a 比 b 小，第一次循环会自动把它们交换。',
    '最小公倍数 = a ÷ gcd × b。先除再乘，可以避免中间的乘积溢出。',
    'C++ 标准库里有 __gcd（以及 C++17 的 gcd），比赛里可以直接使用。理解它的原理，才能写扩展欧几里得、解同余方程这些进阶内容。',
  ],
  pitfalls: [
    '计算最小公倍数时写成 a*b/gcd，当 a、b 很大时，a*b 会先溢出，应该写成 a/gcd*b。',
    '输入里有 0 时要小心：gcd(a, 0) 是 a，gcd(0, 0) 没有意义，题目没有说明时要自己约定。',
    '只记住了“较小的数除较大的数”而在代码里加了多余的交换判断，不但没有必要，还容易写错。',
  ],
  complexity: { time: 'O(log n)', space: 'O(1)', note: '每两步，较大的数至少减半，所以步数不超过 2·log₂n。' },
  presets: [
    { label: '48 和 18', text: '48 18' },
    { label: '互质的两个数', text: '35 64' },
    { label: '小的在前', text: '17 391' },
  ],
  defaultInput: { a: 48, b: 18 },
  parse,
  format: (v) => `${v.a} ${v.b}`,
  answer: (v) => {
    let x = v.a
    let y = v.b
    while (y) [x, y] = [y, x % y]
    return `${x} ${(v.a / x) * v.b}`
  },
  random: () => ({ a: randInt(10, 999), b: randInt(10, 999) }),
  run: runGcd,
  View: GcdView,
  sources: {
    c: String.raw`
#include <stdio.h>
int gcd(int a,int b){
    while (b){
        int t=a%b;                          //@step
        a=b;                                //@step
        b=t;                                //@step
    }
    return a;
}
int main(){
    int a,b;
    scanf("%d %d",&a,&b);
    int g=gcd(a,b);                         //@init
    printf("%d %d\n",g,a/g*b);              //@done
    return 0;
}
`,
    cpp: String.raw`
#include <bits/stdc++.h>
using namespace std;
int gcd_(int a,int b){
    while (b){
        int t=a%b;                          //@step
        a=b;                                //@step
        b=t;                                //@step
    }
    return a;
}
int main(){
    int a,b;
    cin>>a>>b;
    int g=gcd_(a,b);                        //@init
    cout<<g<<" "<<a/g*b<<endl;              //@done
    return 0;
}
`,
    python: String.raw`
def gcd(a,b):
    while b:
        t=a%b                               #@step
        a=b                                 #@step
        b=t                                 #@step
    return a

a,b=map(int,input().split())
g=gcd(a,b)                                  #@init
print(g,a//g*b)                             #@done
`,
    java: String.raw`
import java.util.*;

public class Main{
    static int gcd(int a,int b){
        while (b!=0){
            int t=a%b;                      //@step
            a=b;                            //@step
            b=t;                            //@step
        }
        return a;
    }

    public static void main(String[] args){
        Scanner sc=new Scanner(System.in);
        int a=sc.nextInt(),b=sc.nextInt();
        int g=gcd(a,b);                     //@init
        System.out.println(g+" "+a/g*b);    //@done
    }
}
`,
  },
  problems: pickProblems('P1029', 'P1075'),
}
