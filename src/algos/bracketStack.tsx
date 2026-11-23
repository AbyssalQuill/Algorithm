import { AnimatePresence, motion } from 'motion/react'
import { StackView, type StackItem } from '../components/StackView'
import { pickProblems } from '../data/problems'
import { useWidth } from '../hooks'
import { Recorder } from '../engine/recorder'
import type { AlgoDef, Frame, ParseResult } from '../engine/types'

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

  rec.push('init', snap(-1), '先准备一个空栈。接下来从左到右，一个字符一个字符地看。')
  for (let i = 0; i < chars.length; i++) {
    const c = chars[i]
    held = null
    if (OPEN.includes(c)) {
      rec.push('read', snap(i), `读到 '${c}'：是左括号，先放进栈里，等着右括号来配对。`)
      stack.push({ id: uid++, ch: c, idx: i })
      rec.push('push', snap(i), `压栈：'${c}' 进栈。现在栈里有 ${stack.length} 个在等配对的左括号。`)
    } else {
      rec.push('read', snap(i), `读到 '${c}'：是右括号，要看看栈顶是不是它的另一半。`)
      if (stack.length === 0) {
        verdict = 'bad'
        rec.push('emptyFail', snap(i), `栈是空的，没有左括号能和 '${c}' 配对 → 匹配失败 ✗`)
        return rec.frames
      }
      const t = stack.pop()!
      held = t.ch
      rec.push('pop', snap(i), `弹出栈顶 '${t.ch}'，拿它和 '${c}' 比一比。`)
      if (OPEN.indexOf(t.ch) !== CLOSE.indexOf(c)) {
        verdict = 'bad'
        rec.push('match', snap(i), `'${t.ch}' 和 '${c}' 不是一对 → 匹配失败 ✗`)
        return rec.frames
      }
      pairs.push([t.idx, i])
      rec.push('match', snap(i), `'${t.ch}' 和 '${c}' 正好一对，配对成功 ✓`)
    }
  }
  held = null
  verdict = stack.length === 0 ? 'ok' : 'bad'
  rec.push(
    'final',
    snap(chars.length),
    stack.length === 0 ? '字符串看完了，栈也空了：所有括号都配上了对 → 匹配成功 ✓' : `字符串看完了，但栈里还剩 ${stack.length} 个左括号没被配上 → 匹配失败 ✗`,
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
  const s = text.trim()
  if (!/^[()[\]{}]+$/.test(s)) return { ok: false, error: '只能输入 ( ) [ ] { } 这六种括号。' }
  if (s.length > 16) return { ok: false, error: '演示最多支持 16 个字符。' }
  return { ok: true, value: s }
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
  title: '栈：括号匹配',
  tagline: '后进先出的“一摞盘子”，用来检查括号是否成对',
  kind: '数据结构',
  intro: [
    '栈是一种“后进先出”（LIFO）的结构，就像一摞盘子：只能在最上面放（push），也只能从最上面拿（pop）。',
    '括号匹配是栈最经典的用法：遇到左括号先压栈，等着被配对；遇到右括号，就看栈顶是不是它的另一半，是就弹出。整个字符串看完，栈恰好空了，才说明所有括号都配好了。',
  ],
  points: [
    'push：放到栈顶；pop：弹出栈顶；top：只看栈顶不弹出；empty：判断栈是不是空的。',
    '右括号来了，但栈是空的 → 没有左括号可配，失败。',
    '字符串扫完，栈里还有剩 → 有左括号没被配上，失败。',
    'C 里用“数组 + top 下标”就能手写一个栈；C++ 有 stack，Python 用 list，Java 用 ArrayDeque。',
  ],
  pitfalls: [
    '先判断栈是否为空，再看栈顶，否则会越界或报错。',
    '只数“左括号个数 = 右括号个数”不够：([)] 个数相等，但顺序交叉，依然不合法。',
    'Java 里做栈，更推荐用 ArrayDeque（push / pop / isEmpty），而不是老的 Stack 类。',
  ],
  complexity: { time: 'O(n)', space: 'O(n)' },
  inputHint: '输入由 ( ) [ ] { } 组成的字符串（最多 16 个字符）。',
  presets: [
    { label: '完整匹配', text: '{[()]}()' },
    { label: '顺序交叉', text: '([)]' },
    { label: '右括号太多', text: '())' },
    { label: '左括号有剩', text: '((()' },
  ],
  defaultInput: '{[()]}()',
  parse,
  format: (v) => v,
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
    int top=0;                                   //@init
    for (int i=0;s[i];i++){                      //@read
        char c=s[i];                             //@read
        if (c=='('||c=='['||c=='{'){             //@push
            st[top++]=c;                         //@push
        }else{
            if (top==0) return 0;                //@emptyFail
            char t=st[--top];                    //@pop
            if ((c==')'&&t!='(')||(c==']'&&t!='[')||(c=='}'&&t!='{')) return 0;   //@match
        }
    }
    return top==0;                               //@final
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
    stack<char> st;                              //@init
    for (char c:s){                              //@read
        if (c=='('||c=='['||c=='{'){             //@push
            st.push(c);                          //@push
        }else{
            if (st.empty()) return false;        //@emptyFail
            char t=st.top();                     //@pop
            st.pop();                            //@pop
            if ((c==')'&&t!='(')||(c==']'&&t!='[')||(c=='}'&&t!='{')) return false;   //@match
        }
    }
    return st.empty();                           //@final
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
    st = []                                      #@init
    pair = {')': '(', ']': '[', '}': '{'}
    for c in s:                                  #@read
        if c in '([{':                           #@push
            st.append(c)                         #@push
        else:
            if not st:                           #@emptyFail
                return False                     #@emptyFail
            t = st.pop()                         #@pop
            if pair[c] != t:                     #@match
                return False                     #@match
    return not st                                #@final


s = input().strip()
print("YES" if check(s) else "NO")
`,
    java: String.raw`
import java.util.*;

public class Main {
    static boolean check(String s) {
        Deque<Character> st = new ArrayDeque<>();        //@init
        for (char c : s.toCharArray()) {                 //@read
            if (c == '(' || c == '[' || c == '{') {      //@push
                st.push(c);                              //@push
            } else {
                if (st.isEmpty()) return false;          //@emptyFail
                char t = st.pop();                       //@pop
                if ((c == ')' && t != '(') || (c == ']' && t != '[') || (c == '}' && t != '{')) return false;   //@match
            }
        }
        return st.isEmpty();                             //@final
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String s = sc.next();
        System.out.println(check(s) ? "YES" : "NO");
    }
}
`,
  },
  problems: pickProblems('P1739', 'P1449', 'P4387'),
}
