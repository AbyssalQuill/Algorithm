import { GridView, type GridCell } from '../components/GridView'
import { Stats } from '../components/Stats'
import { pickProblems } from '../data/problems'
import { Recorder } from '../engine/recorder'
import type { AlgoDef, Frame, ParseResult } from '../engine/types'
import { randInt, readInput } from './shared'

export interface BigInput {
  a: string
  b: string
}

export interface BigState {
  a: string
  b: string
  /** 总共的列数（较长的数的位数再加一位进位） */
  cols: number
  /** 当前处理到从右数第几位（0 开始）；-1 表示还没开始 */
  pos: number
  /** 进到这一列的进位（上一列产生的） */
  carryIn: number
  /** 已经算出来的结果位，从低位到高位 */
  digits: number[]
  /** 每一列产生的进位 */
  carries: number[]
  stage: 'sum' | 'digit' | 'carry' | 'last' | 'init' | 'done'
  sum: number | null
}

export const bigAddRef = (a: string, b: string) => (BigInt(a) + BigInt(b)).toString()

export function runBigAdd({ a, b }: BigInput): Frame<BigState>[] {
  const rec = new Recorder<BigState>()
  const len = Math.max(a.length, b.length)
  const A = [...a].reverse().map(Number)
  const B = [...b].reverse().map(Number)
  const digits: number[] = []
  const carries: number[] = []
  let carry = 0
  let pos = -1
  let sum: number | null = null
  let stage: BigState['stage'] = 'init'
  const snap = (): BigState => ({ a, b, cols: len + 1, pos, carryIn: carry, digits, carries, stage, sum })

  rec.push('init', snap(), `两个数太大，超出了 long long 的范围，只能当作字符串，像小学竖式那样一位一位地加。先把两个数的各位倒过来存放（个位在最前面），这样下标 0 就是个位，进位的方向和下标增加的方向一致。`)
  for (let i = 0; i < len; i++) {
    pos = i
    const x = A[i] ?? 0
    const y = B[i] ?? 0
    const s = x + y + carry
    sum = s
    stage = 'sum'
    rec.push('sum', snap(), `${i === 0 ? '个位' : `从右数第 ${i + 1} 位`}：${x} + ${y}${carry ? ` + 上一位的进位 ${carry}` : ''} = ${s}。${A[i] === undefined || B[i] === undefined ? `（较短的那个数在这一位没有数字，按 0 算。）` : ''}`)
    digits.push(s % 10)
    stage = 'digit'
    rec.push('digit', snap(), `这一位写下 ${s} % 10 = ${s % 10}。`)
    const nc = Math.floor(s / 10)
    carries[i] = nc
    carry = nc
    stage = 'carry'
    rec.push('carry', snap(), nc ? `${s} / 10 = ${nc}，向前一位进 ${nc}。` : `${s} 不到 10，没有进位。`)
  }
  pos = len
  sum = null
  if (carry) {
    digits.push(carry)
    stage = 'last'
    rec.push('last', snap(), `所有的位都加完了，但还剩下一个进位 ${carry}，它成了结果的最高位，结果比两个加数都多出一位。`)
  }
  stage = 'done'
  rec.push('done', snap(), `把结果倒过来，得到 ${[...digits].reverse().join('')}。`)
  return rec.frames
}

function BigView({ frame }: { frame: Frame<BigState> }) {
  const s = frame.state
  const cols = s.cols
  const cell = (text: string | number | undefined, tone: GridCell['tone'] = 'idle'): GridCell => ({ text, tone })
  const rowFor = (label: string, get: (i: number) => GridCell | undefined): GridCell[] => [
    { head: true, text: label },
    ...Array.from({ length: cols }, (_, c) => get(cols - 1 - c) ?? { head: true }),
  ]
  const carryRow = rowFor('进位', (i) => {
    const v = i > 0 ? s.carries[i - 1] : 0
    if (i === 0 || s.carries[i - 1] === undefined) return { head: true }
    return cell(v ? v : '', i === s.pos ? 'compare' : v ? 'swap' : 'dim')
  })
  const rows: GridCell[][] = [
    carryRow,
    rowFor('a', (i) => (i < s.a.length ? cell(s.a[s.a.length - 1 - i], i === s.pos ? 'compare' : 'idle') : { head: true })),
    rowFor('+ b', (i) => (i < s.b.length ? cell(s.b[s.b.length - 1 - i], i === s.pos ? 'compare' : 'idle') : { head: true })),
    rowFor('和', (i) => (i < s.digits.length ? cell(s.digits[i], s.stage === 'last' && i === s.digits.length - 1 ? 'found' : i === s.pos && s.stage !== 'done' ? 'compare' : 'done') : cell('', 'dim'))),
  ]
  return (
    <div className="viz">
      <GridView rows={rows} maxCell={44} />
      {s.sum !== null && s.stage !== 'done' && (
        <div className="target-row">
          <span className="target-chip">
            这一位的和 <b>{s.sum}</b> → 写下 <b>{s.sum % 10}</b>，进位 <b>{Math.floor(s.sum / 10)}</b>
          </span>
        </div>
      )}
      {s.stage === 'done' && (
        <div className="target-row">
          <span className="verdict ok">
            {s.a} + {s.b} = {[...s.digits].reverse().join('')}
          </span>
        </div>
      )}
      <Stats items={[['已处理的位数', `${Math.min(s.digits.length, Math.max(s.a.length, s.b.length))} / ${Math.max(s.a.length, s.b.length)}`]]} />
    </div>
  )
}

function parse(text: string): ParseResult<BigInput> {
  return readInput(text, (r) => {
    const a = r.word('a', /^[1-9]\d{0,7}$/, '要是 1～8 位的正整数，不能以 0 开头')
    const b = r.word('b', /^[1-9]\d{0,7}$/, '要是 1～8 位的正整数，不能以 0 开头')
    r.end()
    return { a, b }
  })
}

export const bigAdd: AlgoDef<BigInput, BigState> = {
  id: 'bigint',
  title: '高精度',
  tagline: '把大数当作字符串，像小学竖式一样一位一位地计算，并处理进位',
  kind: '算法',
  slug: 'add',
  name: '大整数加法',
  type: '竖式',
  statement: {
    desc: [
      '给定两个正整数 a 和 b，它们可能大到 long long 也装不下，请输出 a + b 的结果。',
    ],
    input: [
      '一行两个正整数 a 和 b，用空格隔开，不含前导 0。演示里每个数最多 8 位；真正的题目里它们常常有几百位。',
    ],
    output: [
      '一行一个整数，是 a + b 的值。',
    ],
  },
  intro: [
    'int 最大约 21 亿，long long 最大约 9.2×10¹⁸。如果题目要求计算两个几十位、几百位的整数相加，这些类型都装不下。解决的办法是回到小学：用竖式一位一位地加，每一位的结果满十就向前一位进一。整个数用字符串或者数组保存，位数多长都可以，这就是“高精度”。',
    '实现时有两个小技巧。第一，把每个数的各位倒过来存放，让个位在下标 0，这样“从个位开始、向高位进位”的方向，正好是下标增大的方向。第二，较短的数在高位没有数字，按 0 处理，最后如果还有进位，结果就比两个加数都多出一位。',
  ],
  points: [
    '用字符串读入两个数，倒序后逐位转成数字；对每一位计算 s = x + y + carry，写下 s%10，进位 carry = s/10。',
    '循环要走到较长的那个数的最后一位，较短的数越界的位置取 0。',
    '所有位处理完之后，如果 carry 不为 0，要把它放到结果最前面。',
    '减法、乘法的高精度也是同样的思路：先写出竖式，再翻译成逐位的循环，难点只在进位或借位的处理。',
  ],
  pitfalls: [
    '忘记处理最后的进位，比如 99 + 1 会得到 00，而不是 100。',
    '数字顺序没有倒过来就直接从下标 0 加起，高位会和低位对齐，结果是错的。',
    '输出时要把倒序存放的结果再反转回来；还要注意结果开头不能有多余的 0。',
  ],
  complexity: { time: 'O(n)', space: 'O(n)', note: 'n 是较长的那个数的位数，每一位只处理一次。' },
  presets: [
    { label: '连续进位', text: '999 1' },
    { label: '位数不同', text: '958 67' },
    { label: '没有进位', text: '1234 4321' },
  ],
  defaultInput: { a: '958', b: '67' },
  parse,
  format: (v) => `${v.a} ${v.b}`,
  answer: (v) => bigAddRef(v.a, v.b),
  random: () => ({ a: String(randInt(10, 99999)), b: String(randInt(1, 9999)) }),
  run: runBigAdd,
  View: BigView,
  sources: {
    c: String.raw`
#include <stdio.h>
#include <string.h>
int main(){
    char s1[105],s2[105];
    int a[105]={0},b[105]={0},c[105]={0};
    scanf("%s %s",s1,s2);
    int l1=strlen(s1),l2=strlen(s2);
    for (int i=0;i<l1;i++) a[i]=s1[l1-1-i]-'0';  // 把两个数的各位倒过来，让个位放在最前面  //@init
    for (int i=0;i<l2;i++) b[i]=s2[l2-1-i]-'0';
    int len=l1>l2?l1:l2,carry=0;
    for (int i=0;i<len;i++){
        int s=a[i]+b[i]+carry;                // 这一位的和 = 两个数字 + 进位       //@sum
        c[i]=s%10;                            // 这一位写下和的个位               //@digit
        carry=s/10;                           // 和除以 10，得到新的进位           //@carry
    }
    if (carry) c[len++]=carry;                // 最后还剩一个进位，它成了最高位         //@last
    for (int i=len-1;i>=0;i--) printf("%d",c[i]);  // 把结果倒回来输出           //@done
    printf("\n");
    return 0;
}
`,
    cpp: String.raw`
#include <bits/stdc++.h>
using namespace std;
int main(){
    string s1,s2;
    cin>>s1>>s2;
    reverse(s1.begin(),s1.end());             // 把两个数的各位倒过来，让个位放在最前面  //@init
    reverse(s2.begin(),s2.end());
    int len=max(s1.size(),s2.size()),carry=0;
    vector<int> c;
    for (int i=0;i<len;i++){
        int x=i<(int)s1.size()?s1[i]-'0':0;
        int y=i<(int)s2.size()?s2[i]-'0':0;
        int s=x+y+carry;                      // 这一位的和 = 两个数字 + 进位    //@sum
        c.push_back(s%10);                    // 这一位写下和的个位            //@digit
        carry=s/10;                           // 和除以 10，得到新的进位        //@carry
    }
    if (carry) c.push_back(carry);            // 最后还剩一个进位，它成了最高位      //@last
    for (int i=c.size()-1;i>=0;i--) cout<<c[i];  // 把结果倒回来输出          //@done
    cout<<endl;
    return 0;
}
`,
    python: String.raw`
s1,s2=input().split()
a=[int(ch) for ch in reversed(s1)]    # 把两个数的各位倒过来，让个位放在最前面  #@init
b=[int(ch) for ch in reversed(s2)]
c=[]
carry=0
for i in range(max(len(a),len(b))):
    x=a[i] if i<len(a) else 0
    y=b[i] if i<len(b) else 0
    s=x+y+carry                       # 这一位的和 = 两个数字 + 进位    #@sum
    c.append(s%10)                    # 这一位写下和的个位            #@digit
    carry=s//10                       # 和除以 10，得到新的进位        #@carry
if carry:
    c.append(carry)                   # 最后还剩一个进位，它成了最高位      #@last
print(''.join(map(str,reversed(c))))  # 把结果倒回来输出             #@done
`,
    java: String.raw`
import java.util.*;

public class Main{
    public static void main(String[] args){
        Scanner sc=new Scanner(System.in);
        String s1=new StringBuilder(sc.next()).reverse().toString();  // 把两个数的各位倒过来，让个位放在最前面  //@init
        String s2=new StringBuilder(sc.next()).reverse().toString();
        int len=Math.max(s1.length(),s2.length()),carry=0;
        StringBuilder c=new StringBuilder();
        for (int i=0;i<len;i++){
            int x=i<s1.length()?s1.charAt(i)-'0':0;
            int y=i<s2.length()?s2.charAt(i)-'0':0;
            int s=x+y+carry;                  // 这一位的和 = 两个数字 + 进位                        //@sum
            c.append(s%10);                   // 这一位写下和的个位                                //@digit
            carry=s/10;                       // 和除以 10，得到新的进位                            //@carry
        }
        if (carry>0) c.append(carry);         // 最后还剩一个进位，它成了最高位                          //@last
        System.out.println(c.reverse());      // 把结果倒回来输出                                 //@done
    }
}
`,
  },
  problems: pickProblems('P1601', 'P1255'),
}
