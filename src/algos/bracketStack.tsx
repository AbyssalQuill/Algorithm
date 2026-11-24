import { AnimatePresence, motion } from 'motion/react'
import { StackView, type StackItem } from '../components/StackView'
import { pickProblems } from '../data/problems'
import { useWidth } from '../hooks'
import { Recorder } from '../engine/recorder'
import type { AlgoDef, Frame, ParseResult } from '../engine/types'
import { readInput } from './shared'

interface Item extends StackItem {
  idx: number
}

export interface BrState {
  chars: string[]
  /** 当前正在看的字符下标；-1 表示还没开始，等于长度表示看完了 */
  pos: number
  stack: Item[]
  pairs: [number, number][]
  held: string | null
  verdict: 'running' | 'ok' | 'bad'
}

const OPEN = '([{'
const CLOSE = ')]}'

export function runBracket(input: string): Frame<BrState>[] {
  const rec = new Recorder<BrState>()
  const chars = [...input]
  const stack: Item[] = []
  const pairs: [number, number][] = []
  let held: string | null = null
  let verdict: BrState['verdict'] = 'running'
  let uid = 0
  const snap = (pos: number): BrState => ({ chars, pos, stack, pairs, held, verdict })

  rec.push('init', snap(-1), '先准备一个空栈，然后从左到右逐个读取字符。')
  for (let i = 0; i < chars.length; i++) {
    const c = chars[i]
    held = null
    if (OPEN.includes(c)) {
      rec.push('read', snap(i), `读到 '${c}'，它是左括号，先放进栈里，等待后面的右括号来和它配对。`)
      stack.push({ id: uid++, ch: c, idx: i })
      rec.push('push', snap(i), `'${c}' 入栈，目前栈里有 ${stack.length} 个等待配对的左括号。`)
    } else {
      rec.push('read', snap(i), `读到 '${c}'，它是右括号，需要检查栈顶的左括号是否与它成对。`)
      if (stack.length === 0) {
        verdict = 'bad'
        rec.push('emptyFail', snap(i), `栈已经空了，没有任何左括号可以和 '${c}' 配对，匹配失败。`)
        return rec.frames
      }
      const t = stack.pop()!
      held = t.ch
      rec.push('pop', snap(i), `取出栈顶的 '${t.ch}'，与当前的 '${c}' 比较。`)
      if (OPEN.indexOf(t.ch) !== CLOSE.indexOf(c)) {
        verdict = 'bad'
        rec.push('match', snap(i), `'${t.ch}' 和 '${c}' 不是一对括号，匹配失败。`)
        return rec.frames
      }
      pairs.push([t.idx, i])
      rec.push('match', snap(i), `'${t.ch}' 和 '${c}' 恰好是一对，配对成功。`)
    }
  }
  held = null
  verdict = stack.length === 0 ? 'ok' : 'bad'
  rec.push(
    'final',
    snap(chars.length),
    stack.length === 0 ? '字符串读完了，栈也恰好为空，说明所有括号都已配对，匹配成功。' : `字符串读完了，但栈里还剩 ${stack.length} 个左括号没有配对，匹配失败。`,
  )
  return rec.frames
}

function CharRow({ s }: { s: BrState }) {
  const [ref, w] = useWidth<HTMLDivElement>()
  const n = s.chars.length
  const gap = 6
  const cw = Math.max(22, Math.min(44, Math.floor((w - gap * (n - 1)) / n)))
  const total = n * cw + (n - 1) * gap
  const x0 = Math.max(0, (w - total) / 2)
  const left = (i: number) => x0 + i * (cw + gap)
  const arcH = 62
  const paired = new Set(s.pairs.flat())
  const leftover = new Set(s.verdict === 'bad' && s.pos >= n ? s.stack.map((x) => x.idx) : [])
  return (
    <div ref={ref} className="charrow" style={{ height: arcH + cw + 12 }}>
      {w > 0 && (
        <>
          <svg className="arcs" width={w} height={arcH + 4} aria-hidden="true">
            <AnimatePresence>
              {s.pairs.map(([a, b]) => {
                const h = Math.min(arcH - 6, 14 + (b - a) * 9)
                const xa = left(a) + cw / 2
                const xb = left(b) + cw / 2
                return (
                  <motion.path
                    key={`${a}-${b}`}
                    d={`M ${xa} ${arcH} C ${xa} ${arcH - h} ${xb} ${arcH - h} ${xb} ${arcH}`}
                    fill="none"
                    stroke="var(--green)"
                    filter="url(#pencil-a)"
                    strokeWidth={2.6}
                    strokeLinecap="round"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.45, ease: 'easeOut' }}
                  />
                )
              })}
            </AnimatePresence>
          </svg>
          {s.chars.map((c, i) => {
            let tone = 'idle'
            if (paired.has(i)) tone = 'done'
            if (leftover.has(i)) tone = 'swap'
            if (i === s.pos) tone = s.verdict === 'bad' ? 'swap' : 'compare'
            return (
              <div key={i} className={`char tone-${tone}`} style={{ left: left(i), top: arcH + 4, width: cw, height: cw }}>
                {c}
              </div>
            )
          })}
        </>
      )}
    </div>
  )
}

function BrView({ frame }: { frame: Frame<BrState> }) {
  const s = frame.state
  const capacity = s.chars.filter((c) => OPEN.includes(c)).length
  return (
    <div className="viz br">
      <CharRow s={s} />
      <div className="br-row">
        <StackView items={s.stack} capacity={capacity} />
        <div className="br-side">
          <AnimatePresence mode="wait" initial={false}>
            {s.held && (
              <motion.div key={`h${s.pos}`} className="held" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                刚弹出的栈顶：<b>{s.held}</b>
              </motion.div>
            )}
          </AnimatePresence>
          {s.verdict === 'ok' && <div className="verdict ok">匹配成功 ✓</div>}
          {s.verdict === 'bad' && <div className="verdict bad">匹配失败 ✗</div>}
        </div>
      </div>
    </div>
  )
}

function parse(text: string): ParseResult<string> {
  return readInput(text, (r) => {
    const s = r.word('括号串', /^[()[\]{}]{1,16}$/, '只能由 ( ) [ ] { } 组成，长度 1～16')
    r.end()
    return s
  })
}

function randomBalanced(pairsN: number): string {
  const kinds = ['()', '[]', '{}']
  const out: string[] = []
  const stack: string[] = []
  let opens = 0
  while (out.length < pairsN * 2) {
    const canOpen = opens < pairsN
    const canClose = stack.length > 0
    if (canOpen && (!canClose || Math.random() < 0.55)) {
      const k = kinds[Math.floor(Math.random() * 3)]
      out.push(k[0])
      stack.push(k[1])
      opens++
    } else {
      out.push(stack.pop()!)
    }
  }
  return out.join('')
}

export const bracketStack: AlgoDef<string, BrState> = {
  id: 'bracket-stack',
  title: '栈',
  tagline: '栈遵循“后进先出”的规则，最适合用来检查括号是否成对',
  kind: '数据结构',
  slug: 'brackets',
  name: '括号匹配',
  type: '后进先出',
  statement: {
    desc: [
      '给定一个只包含 ( ) [ ] { } 六种括号的字符串，判断其中的括号是否合法：每个左括号都要被同类型的右括号闭合，并且括号必须按正确的顺序闭合。例如 ([]) 是合法的，而 ([)] 不合法。',
    ],
    input: [
      '一行，一个只含 ( ) [ ] { } 的字符串，长度 1～16。',
    ],
    output: [
      '一行。括号合法输出 YES，不合法输出 NO。',
    ],
  },
  intro: [
    '栈是一种“后进先出”（LIFO）的数据结构，就像叠在一起的一摞盘子：新盘子只能放在最上面，取的时候也只能先取最上面的一个。对应的两个基本操作叫作入栈（push）和出栈（pop）。',
    '括号匹配是栈最典型的应用。遇到左括号，先把它放进栈里等待；遇到右括号，就看栈顶的左括号是否与它成对，成对就取出，不成对则匹配失败。整个字符串读完时，如果栈恰好是空的，说明每个括号都找到了自己的另一半。',
  ],
  points: [
    '栈有四个常用的操作：push 把元素放到栈顶，pop 取出栈顶元素，top 只查看栈顶而不取出，empty 判断栈是否为空。',
    '遇到右括号时栈已经是空的，说明没有左括号可以和它配对，直接判定失败。',
    '字符串读完以后栈里还有剩余，说明有些左括号始终没有等到右括号，同样判定失败。',
    '在 C 里可以用“数组加一个 top 下标”自己实现栈；C++ 有现成的 stack，Python 用列表，Java 则推荐 ArrayDeque。',
  ],
  pitfalls: [
    '要先判断栈是否为空，再去看栈顶，否则对空栈取栈顶会越界或者报错。',
    '只统计左括号和右括号的个数是否相等并不够：([)] 中两种括号的个数相同，但顺序交叉，依然不合法。',
    'Java 里实现栈，更推荐使用 ArrayDeque 的 push、pop 和 isEmpty，而不是历史遗留的 Stack 类。',
  ],
  complexity: { time: 'O(n)', space: 'O(n)' },
  presets: [
    { label: '完整匹配', text: '{[()]}()' },
    { label: '顺序交叉', text: '([)]' },
    { label: '右括号太多', text: '())' },
    { label: '左括号有剩', text: '((()' },
  ],
  defaultInput: '{[()]}()',
  parse,
  format: (s) => s,
  answer: (s) => {
    const st: string[] = []
    const pair: Record<string, string> = { ')': '(', ']': '[', '}': '{' }
    for (const c of s) {
      if ('([{'.includes(c)) st.push(c)
      else if (st.pop() !== pair[c]) return 'NO'
    }
    return st.length === 0 ? 'YES' : 'NO'
  },
  random: () => {
    const base = randomBalanced(3 + Math.floor(Math.random() * 3))
    if (Math.random() < 0.5) return base
    const chars = [...base]
    const k = Math.floor(Math.random() * chars.length)
    chars[k] = '()[]{}'[Math.floor(Math.random() * 6)]
    return chars.join('')
  },
  run: runBracket,
  View: BrView,
  sources: {
    c: String.raw`
#include <stdio.h>
char st[1005];
int check(char s[]){
    int top=0;                                // 准备一个空栈                                   //@init
    for (int i=0;s[i];i++){                   // 从左到右，一个一个看括号                             //@read
        char c=s[i];                                                                      //@read
        if (c=='('||c=='['||c=='{'){          // 左括号先压进栈，等着被配对                            //@push
            st[top++]=c;                                                                  //@push
        }else{
            if (top==0) return 0;             // 栈是空的，说明右括号多了                             //@emptyFail
            char t=st[--top];                 // 取出栈顶，看看它和当前的右括号配不配                       //@pop
            if ((c==')'&&t!='(')||(c==']'&&t!='[')||(c=='}'&&t!='{')) return 0;  // 类型对不上，直接判不合法  //@match
        }
    }
    return top==0;                            // 栈空了，才说明所有左括号都配上了                         //@final
}
int main(){
    char s[1005];
    scanf("%s",s);
    puts(check(s)?"YES":"NO");
    return 0;
}
`,
    cpp: String.raw`
#include <bits/stdc++.h>
using namespace std;
bool check(string s){
    stack<char> st;                           // 准备一个空栈                                   //@init
    for (char c:s){                           // 从左到右，一个一个看括号                             //@read
        if (c=='('||c=='['||c=='{'){          // 左括号先压进栈，等着被配对                            //@push
            st.push(c);                                                                   //@push
        }else{
            if (st.empty()) return false;     // 栈是空的，说明右括号多了                             //@emptyFail
            char t=st.top();                  // 取出栈顶，看看它和当前的右括号配不配                       //@pop
            st.pop();                                                                     //@pop
            if ((c==')'&&t!='(')||(c==']'&&t!='[')||(c=='}'&&t!='{')) return false;  // 类型对不上，直接判不合法  //@match
        }
    }
    return st.empty();                        // 栈空了，才说明所有左括号都配上了                         //@final
}
int main(){
    string s;
    cin>>s;
    cout<<(check(s)?"YES":"NO")<<endl;
    return 0;
}
`,
    python: String.raw`
def check(s):
    st=[]                   # 准备一个空栈              #@init
    pair={')': '(',']': '[','}': '{'}
    for c in s:             # 从左到右，一个一个看括号        #@read
        if c in '([{':      # 左括号先压进栈，等着被配对       #@push
            st.append(c)                          #@push
        else:
            if not st:      # 栈是空的，说明右括号多了        #@emptyFail
                return False                      #@emptyFail
            t=st.pop()      # 取出栈顶，看看它和当前的右括号配不配  #@pop
            if pair[c]!=t:  # 类型对不上，直接判不合法        #@match
                return False                      #@match
    return not st           # 栈空了，才说明所有左括号都配上了    #@final

s=input().strip()
print("YES" if check(s) else "NO")
`,
    java: String.raw`
import java.util.*;

public class Main{
    static boolean check(String s){
        Deque<Character> st=new ArrayDeque<>();  // 准备一个空栈                                //@init
        for (char c:s.toCharArray()){         // 从左到右，一个一个看括号                             //@read
            if (c=='('||c=='['||c=='{'){      // 左括号先压进栈，等着被配对                            //@push
                st.push(c);                                                               //@push
            }else{
                if (st.isEmpty()) return false;  // 栈是空的，说明右括号多了                          //@emptyFail
                char t=st.pop();              // 取出栈顶，看看它和当前的右括号配不配                       //@pop
                if ((c==')'&&t!='(')||(c==']'&&t!='[')||(c=='}'&&t!='{')) return false;  // 类型对不上，直接判不合法  //@match
            }
        }
        return st.isEmpty();                  // 栈空了，才说明所有左括号都配上了                         //@final
    }

    public static void main(String[] args){
        Scanner sc=new Scanner(System.in);
        String s=sc.next();
        System.out.println(check(s)?"YES":"NO");
    }
}
`,
  },
  problems: pickProblems('P1739', 'P1449', 'P4387'),
}
