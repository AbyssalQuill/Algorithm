import { Stats } from '../components/Stats'
import { pickProblems } from '../data/problems'
import { Recorder } from '../engine/recorder'
import type { AlgoDef, Frame, ParseResult } from '../engine/types'
import { toNums } from './shared'

export interface HanoiState {
  n: number
  /** 三根柱子 A、B、C，每根从下到上存放盘子的大小（1 最小） */
  pegs: number[][]
  move: { disk: number; from: number; to: number } | null
  moves: number
}

const NAME = ['A', 'B', 'C']

export const hanoiMoves = (n: number): [number, number, number][] => {
  const out: [number, number, number][] = []
  const go = (k: number, a: number, b: number, c: number) => {
    if (k === 0) return
    go(k - 1, a, c, b)
    out.push([k, a, c])
    go(k - 1, b, a, c)
  }
  go(n, 0, 1, 2)
  return out
}

export function runHanoi(n: number): Frame<HanoiState>[] {
  const rec = new Recorder<HanoiState>()
  const pegs: number[][] = [Array.from({ length: n }, (_, i) => n - i), [], []]
  let move: HanoiState['move'] = null
  let moves = 0
  const snap = (): HanoiState => ({ n, pegs, move, moves })

  rec.push('init', snap(), `把 ${n} 个盘子从 A 柱搬到 C 柱，每次只能搬一个，大盘子不能压在小盘子上，可以借助 B 柱。关键的想法是递归：要搬 ${n} 个盘子，先把上面的 ${n - 1} 个搬到 B 柱，再把最大的搬到 C 柱，最后把 B 柱上的 ${n - 1} 个搬到 C 柱。`)
  const go = (k: number, a: number, b: number, c: number) => {
    if (k === 0) return
    go(k - 1, a, c, b)
    pegs[a].pop()
    pegs[c].push(k)
    moves++
    move = { disk: k, from: a, to: c }
    rec.push('move', snap(), `第 ${moves} 步：把 ${k} 号盘从 ${NAME[a]} 搬到 ${NAME[c]}。${k === 1 ? '它是最小的盘子，不用考虑别的，直接搬。' : `它上面的 ${k - 1} 个盘子已经被搬到了 ${NAME[b]}，现在可以搬动它了。`}`)
    go(k - 1, b, a, c)
  }
  go(n, 0, 1, 2)
  move = null
  rec.push('done', snap(), `全部搬完，一共走了 ${moves} 步，正好是 2^${n} - 1。每多一个盘子，步数大约翻一倍：搬 64 个盘子需要约 1.8×10¹⁹ 步。`)
  return rec.frames
}

function HanoiView({ frame }: { frame: Frame<HanoiState> }) {
  const s = frame.state
  return (
    <div className="viz">
      <div className="pegs">
        {s.pegs.map((peg, i) => (
          <div key={i} className="peg-col">
            <div className="peg">
              {peg.map((d) => (
                <div key={d} className={`disk tone-${s.move && s.move.disk === d ? 'compare' : 'done'}`} style={{ width: `${30 + (d / s.n) * 62}%` }}>
                  {d}
                </div>
              ))}
            </div>
            <div className="peg-name">{NAME[i]}</div>
          </div>
        ))}
      </div>
      <Stats items={[['已走的步数', s.moves], ['总共需要', (1 << s.n) - 1]]} />
    </div>
  )
}

function parse(text: string): ParseResult<number> {
  const v = toNums(text)
  if (v.length !== 1 || !Number.isInteger(v[0]) || v[0] < 1 || v[0] > 5) return { ok: false, error: '盘子的个数请取 1～5。' }
  return { ok: true, value: v[0] }
}

export const hanoi: AlgoDef<number, HanoiState> = {
  id: 'hanoi',
  title: '递归：汉诺塔',
  tagline: '把大问题拆成两个更小的同类问题，递归会自己记住每一层的进度',
  kind: '算法',
  intro: [
    '汉诺塔有三根柱子，A 柱上从大到小叠着 n 个盘子，要全部搬到 C 柱上：每次只能搬一个盘子，并且大盘子永远不能放在小盘子上面。直接想每一步怎么搬很难，但递归的想法很简单：只要能搬走上面的 n-1 个盘子，剩下的最大一个就能一步搬过去。',
    '所以搬 n 个盘子分三步：先把上面的 n-1 个从 A 搬到 B（借助 C），再把最大的一个从 A 搬到 C，最后把 B 上的 n-1 个搬到 C（借助 A）。其中“搬 n-1 个”正是同样的问题，只是规模小了一点，一直缩小到 0 个盘子时什么也不用做，这就是递归的边界。',
  ],
  points: [
    '递归函数需要四个信息：搬几个盘子，从哪根柱子出发，借助哪根，搬到哪根。每次递归调用时，后三根柱子的角色要相应调换。',
    '边界是 n==0，直接返回。边界不写或者写错，递归会永远进行下去。',
    '搬 n 个盘子需要的步数 T(n) = 2T(n-1) + 1，解出来是 2ⁿ - 1，增长非常快，所以汉诺塔只能用来练习递归的思想。',
    '递归的好处是代码和思路一一对应，三行代码就完整地表达了“拆成子问题”的想法。',
  ],
  pitfalls: [
    '递归时柱子的顺序传错，盘子会被搬到错误的位置，违反大盘不能压小盘的规则。',
    '规模稍大（超过 25 个盘子）程序就会运行很久，因为步数是指数增长的。',
    '把输出放在递归的前面或者后面，输出的步骤顺序就会是错的，一定要放在两次递归调用的中间。',
  ],
  complexity: { time: 'O(2ⁿ)', space: 'O(n)', note: '搬 n 个盘子需要 2ⁿ - 1 步；空间是递归的深度 n。' },
  inputHint: '输入盘子的个数（1～5）。',
  presets: [
    { label: '3 个盘子', text: '3' },
    { label: '4 个盘子', text: '4' },
    { label: '1 个盘子', text: '1' },
  ],
  defaultInput: 3,
  parse,
  format: (v) => String(v),
  random: () => 2 + Math.floor(Math.random() * 3),
  run: runHanoi,
  View: HanoiView,
  sources: {
    c: String.raw`
#include <stdio.h>
void hanoi(int n,char a,char b,char c){
    if (n==0) return;
    hanoi(n-1,a,c,b);
    printf("%d %c %c\n",n,a,c);                 //@move
    hanoi(n-1,b,a,c);
}
int main(){
    int n;
    scanf("%d",&n);
    hanoi(n,'A','B','C');                       //@init
    printf("%d\n",(1<<n)-1);                    //@done
    return 0;
}
`,
    cpp: String.raw`
#include <bits/stdc++.h>
using namespace std;
void hanoi(int n,char a,char b,char c){
    if (n==0) return;
    hanoi(n-1,a,c,b);
    cout<<n<<" "<<a<<" "<<c<<endl;             //@move
    hanoi(n-1,b,a,c);
}
int main(){
    int n;
    cin>>n;
    hanoi(n,'A','B','C');                       //@init
    cout<<(1<<n)-1<<endl;                       //@done
    return 0;
}
`,
    python: String.raw`
def hanoi(n, a, b, c):
    if n == 0:
        return
    hanoi(n - 1, a, c, b)
    print(n, a, c)                              #@move
    hanoi(n - 1, b, a, c)


n = int(input())
hanoi(n, 'A', 'B', 'C')                         #@init
print((1 << n) - 1)                             #@done
`,
    java: String.raw`
import java.util.*;

public class Main {
    static void hanoi(int n, char a, char b, char c) {
        if (n == 0) return;
        hanoi(n - 1, a, c, b);
        System.out.println(n + " " + a + " " + c);  //@move
        hanoi(n - 1, b, a, c);
    }

    public static void main(String[] args) {
        int n = new Scanner(System.in).nextInt();
        hanoi(n, 'A', 'B', 'C');                    //@init
        System.out.println((1 << n) - 1);           //@done
    }
}
`,
  },
  problems: pickProblems('P1760', 'P1255'),
}
