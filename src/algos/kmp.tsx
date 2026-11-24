import { ArrayView, type Cell } from '../components/ArrayView'
import { GridView, type GridCell } from '../components/GridView'
import { Stats } from '../components/Stats'
import { pickProblems } from '../data/problems'
import { Recorder } from '../engine/recorder'
import type { AlgoDef, Frame, ParseResult } from '../engine/types'
import { randInt, splitBar } from './shared'

export interface KmpInput {
  text: string
  pat: string
}

export interface KmpState {
  text: string
  pat: string
  phase: 'build' | 'match'
  /** 上面一行的字符串：建表时是模式串自己，匹配时是文本 */
  top: string
  /** 下面一行的模式串相对上面一行向右平移了几格 */
  off: number
  /** 模式串里已经确认和上面对上的字符个数 */
  matched: number
  /** 正在比较的位置：上面的下标；null 表示这一帧没有比较 */
  i: number | null
  ok: boolean | null
  /** next 数组：nxt[i] 是 pat[0..i] 里“最长的相等的真前缀和真后缀”的长度 */
  nxt: (number | null)[]
  found: number[]
  steps: number
}

export function runKmp({ text, pat }: KmpInput): Frame<KmpState>[] {
  const rec = new Recorder<KmpState>()
  const m = pat.length
  const n = text.length
  const nxt: (number | null)[] = new Array(m).fill(null)
  nxt[0] = 0
  const found: number[] = []
  let phase: KmpState['phase'] = 'build'
  let top = pat
  let off = 0
  let matched = 0
  let i: number | null = null
  let ok: boolean | null = null
  let steps = 0
  const snap = (): KmpState => ({ text, pat, phase, top, off, matched, i, ok, nxt, found, steps })

  rec.push('init', snap(), `在文本里找模式串 ${pat} 出现的所有位置。朴素的做法一旦失配，就要把模式串后移一格，从头再比。KMP 利用模式串自身的结构避免这种浪费：先算出 next 数组，nxt[i] 表示 ${pat} 的前 i+1 个字符里，最长的“既是前缀又是后缀”的部分有多长（不能是整个串）。失配时，模式串不用从头比，直接跳到这个长度继续。nxt[0] 一定是 0。`)
  let j = 0
  for (let a = 1; a < m; a++) {
    i = a
    while (j > 0 && pat[a] !== pat[j]) {
      j = nxt[j - 1] as number
      steps++
      off = a - j
      matched = j
      ok = null
      rec.push('pFall', snap(), `pat[${a}] = ${pat[a]} 和 pat[${j > 0 ? '前一个 j' : 'j'}] 对不上，让 j 退回 nxt[j-1]，也就是 ${j}：已经配上的部分里，更短的前缀和后缀还能继续利用。`)
    }
    if (pat[a] === pat[j]) {
      steps++
      off = a - j
      matched = j
      ok = true
      rec.push('pExtend', snap(), `pat[${a}] = ${pat[a]} 与 pat[${j}] = ${pat[j]} 相同，前缀和后缀又长了一位，j 增加到 ${j + 1}。`)
      j++
    }
    nxt[a] = j
    off = a - j + 1
    matched = j
    ok = null
    rec.push('pSet', snap(), `记下 nxt[${a}] = ${j}：${pat.slice(0, a + 1)} 里最长的相等前后缀长度是 ${j}${j ? `（${pat.slice(0, j)}）` : ''}。`)
  }
  phase = 'match'
  top = text
  off = 0
  matched = 0
  i = null
  ok = null
  j = 0
  for (let a = 0; a < n; a++) {
    i = a
    while (j > 0 && text[a] !== pat[j]) {
      j = nxt[j - 1] as number
      steps++
      off = a - j
      matched = j
      ok = null
      rec.push('fall', snap(), `文本的 ${text[a]} 和 pat[${j > 0 ? '当前的 j' : 'j'}] 对不上。不用把模式串退到开头：已经配上的 ${j} 个字符（${pat.slice(0, j)}）可以继续用，j 退到 nxt 里记录的位置 ${j}。`)
    }
    if (text[a] === pat[j]) {
      steps++
      off = a - j
      matched = j
      ok = true
      rec.push('hit', snap(), `文本第 ${a} 个字符 ${text[a]} 与 pat[${j}] = ${pat[j]} 相同，匹配长度增加到 ${j + 1}。`)
      j++
    } else {
      steps++
      off = a
      matched = 0
      ok = false
      rec.push('miss', snap(), `文本第 ${a} 个字符 ${text[a]} 与 pat[0] = ${pat[0]} 不同，而且已经没有可以利用的前缀了，文本指针直接前进。`)
    }
    if (j === m) {
      found.push(a - m + 1)
      off = a - m + 1
      matched = m
      ok = true
      rec.push('found', snap(), `模式串全部配上了，在文本的位置 ${a - m + 1} 处找到一个。接着让 j 退回 nxt[${m - 1}] = ${nxt[m - 1]}，继续往后找，因为下一个匹配可能和这一个重叠。`)
      j = nxt[m - 1] as number
    }
  }
  i = null
  ok = null
  off = 0
  matched = 0
  rec.push('done', snap(), found.length ? `文本扫描完毕，${pat} 出现的位置（下标从 0 开始）有：${found.join('、')}。文本指针从头到尾只走了一遍，没有回退。` : `文本扫描完毕，没有找到 ${pat}。文本指针从头到尾只走了一遍，没有回退。`)
  return rec.frames
}

export const kmpRef = (text: string, pat: string) => {
  const out: number[] = []
  for (let i = 0; i + pat.length <= text.length; i++) if (text.startsWith(pat, i)) out.push(i)
  return out
}

function KmpView({ frame }: { frame: Frame<KmpState> }) {
  const s = frame.state
  const m = s.pat.length
  const cols = Math.max(s.top.length, s.off + m, 1)
  const topRow: GridCell[] = Array.from({ length: cols }, (_, c): GridCell => {
    if (c >= s.top.length) return { head: true }
    let tone: GridCell['tone'] = 'idle'
    if (c >= s.off && c < s.off + s.matched) tone = 'done'
    if (s.i === c) tone = s.ok === true ? 'found' : s.ok === false ? 'swap' : 'compare'
    return { text: s.top[c], tone }
  })
  const botRow: GridCell[] = Array.from({ length: cols }, (_, c): GridCell => {
    const k = c - s.off
    if (k < 0 || k >= m) return { head: true }
    let tone: GridCell['tone'] = 'idle'
    if (k < s.matched) tone = 'done'
    if (s.i !== null && k === s.matched && s.ok !== null) tone = s.ok ? 'found' : 'swap'
    else if (s.i !== null && k === s.matched) tone = 'compare'
    return { text: s.pat[k], tone }
  })
  const nxtCells: Cell[] = s.nxt.map((v, k) => ({ id: k, v: v ?? 0, label: v === null ? '?' : undefined, tone: v === null ? 'dim' : 'done' }))
  return (
    <div className="viz">
      <div className="row-label">{s.phase === 'build' ? '建 next 表：把模式串和它自己错开对齐，找最长的相等前后缀' : '匹配：上面是文本，下面是模式串（绿色 = 已经对上的部分）'}</div>
      <GridView rows={[topRow, botRow]} maxCell={42} />
      <div className="row-label">next 数组（nxt[i]，下标从 0 开始）</div>
      <ArrayView cells={nxtCells} mode="boxes" minSlots={0} />
      <Stats items={[['已找到', s.found.length ? s.found.join('、') : '—'], ['比较次数', s.steps]]} />
    </div>
  )
}

function parse(text: string): ParseResult<KmpInput> {
  const parts = splitBar(text)
  if (parts.length !== 2) return { ok: false, error: '格式是「文本 | 模式串」，例如：ababcabababc | abab' }
  const t = parts[0].trim()
  const p = parts[1].trim()
  if (!/^[a-z]{1,14}$/.test(t) || !/^[a-z]{1,6}$/.test(p)) return { ok: false, error: '只能用小写字母，文本最长 14 个，模式串最长 6 个。' }
  if (p.length > t.length) return { ok: false, error: '模式串不能比文本更长。' }
  return { ok: true, value: { text: t, pat: p } }
}

const rs = (len: number) => Array.from({ length: len }, () => 'ab'[randInt(0, 1)]).join('')

export const kmp: AlgoDef<KmpInput, KmpState> = {
  id: 'kmp',
  title: '字符串匹配：KMP',
  tagline: '失配时不让文本回头，而是利用模式串自己的前缀和后缀，让模式串跳到合适的位置继续',
  kind: '算法',
  intro: [
    '在一段很长的文本里找一个模式串，最朴素的方法是把模式串放在文本的每个位置上，逐个字符比较，一旦失配就后移一格从头再来，最坏要 O(nm)。可是失配的时候，我们其实已经知道了不少信息：前面那一段文本和模式串的前缀是相同的，这些信息被朴素的做法浪费了。',
    'KMP 算法把这些信息用起来：它先对模式串自己做一次预处理，算出 next 数组，nxt[i] 是模式串前 i+1 个字符里，最长的“既是前缀又是后缀”的部分的长度（不能是整个串）。匹配时如果在第 j 个字符失配，说明前 j 个字符是已经对上的，其中长度为 nxt[j-1] 的前缀和后缀相同，就不必从头比起，让 j 直接退到 nxt[j-1] 继续比较。文本的指针永远不后退，所以总时间是 O(n + m)。',
  ],
  points: [
    '建 next 表和匹配的代码几乎一样：建表是“模式串拿自己匹配自己”，所以只要理解了一个，另一个就通了。',
    '失配时的 while 循环让 j 沿着 nxt 链一直退，直到对上或者退到 0；对上了 j 才增加 1。',
    '找到一个完整匹配（j==m）以后，j 不是清零，而是退到 nxt[m-1]，这样能找到相互重叠的匹配。',
    '虽然有 while 循环，但 j 每次最多增加 1，退的总次数不会超过增加的总次数，所以整体仍然是线性的。',
  ],
  pitfalls: [
    'next 数组有不同的定义（有的整体向右移一位，有的从 -1 开始），代码和讲义混用时很容易错位，要统一一种。',
    '匹配成功后忘记让 j 退回 nxt[m-1]，会访问到 pat[m] 越界，或者漏掉重叠的匹配。',
    '字符串很短时，朴素匹配往往更快更简单，不必每次都用 KMP；它的价值体现在文本很长、模式串有大量重复的场合。',
  ],
  complexity: { time: 'O(n + m)', space: 'O(m)', note: 'n 是文本长度，m 是模式串长度。建 next 表 O(m)，匹配 O(n)。' },
  inputHint: '格式：文本 | 模式串，小写字母，例如 ababcabababc | abab（文本最长 14 个，模式串最长 6 个）。',
  presets: [
    { label: '有重叠的匹配', text: 'abababab | abab' },
    { label: '会失配', text: 'ababcabababc | ababc' },
    { label: '找不到', text: 'aaaaaaab | aaab' },
  ],
  defaultInput: { text: 'ababcabababc', pat: 'abab' },
  parse,
  format: (v) => `${v.text} | ${v.pat}`,
  random: () => {
    const pat = rs(randInt(2, 4))
    return { text: rs(randInt(7, 12)), pat }
  },
  run: runKmp,
  View: KmpView,
  sources: {
    c: String.raw`
#include <stdio.h>
#include <string.h>
int main(){
    char t[105],p[105];
    int nxt[105],res[105],rc=0;
    scanf("%s %s",t,p);
    int n=strlen(t),m=strlen(p);
    nxt[0]=0;                                   //@init
    for (int i=1,j=0;i<m;i++){
        while (j>0&&p[i]!=p[j]) j=nxt[j-1];     //@pFall
        if (p[i]==p[j]) j++;                    //@pExtend
        nxt[i]=j;                               //@pSet
    }
    for (int i=0,j=0;i<n;i++){
        while (j>0&&t[i]!=p[j]) j=nxt[j-1];     //@fall
        if (t[i]==p[j]) j++;                    //@hit,miss
        if (j==m){
            res[rc++]=i-m+1;                    //@found
            j=nxt[j-1];
        }
    }
    if (rc==0) printf("-1");
    for (int i=0;i<rc;i++) printf("%d ",res[i]);    //@done
    printf("\n");
    return 0;
}
`,
    cpp: String.raw`
#include <bits/stdc++.h>
using namespace std;
int main(){
    string t,p;
    cin>>t>>p;
    int n=t.size(),m=p.size();
    vector<int> nxt(m,0),res;                   //@init
    for (int i=1,j=0;i<m;i++){
        while (j>0&&p[i]!=p[j]) j=nxt[j-1];     //@pFall
        if (p[i]==p[j]) j++;                    //@pExtend
        nxt[i]=j;                               //@pSet
    }
    for (int i=0,j=0;i<n;i++){
        while (j>0&&t[i]!=p[j]) j=nxt[j-1];     //@fall
        if (t[i]==p[j]) j++;                    //@hit,miss
        if (j==m){
            res.push_back(i-m+1);               //@found
            j=nxt[j-1];
        }
    }
    if (res.empty()) cout<<-1;
    for (int x:res) cout<<x<<" ";               //@done
    cout<<endl;
    return 0;
}
`,
    python: String.raw`
t, p = input().split()
n, m = len(t), len(p)
nxt = [0] * m                                   #@init
j = 0
for i in range(1, m):
    while j > 0 and p[i] != p[j]:
        j = nxt[j - 1]                          #@pFall
    if p[i] == p[j]:
        j += 1                                  #@pExtend
    nxt[i] = j                                  #@pSet
res = []
j = 0
for i in range(n):
    while j > 0 and t[i] != p[j]:
        j = nxt[j - 1]                          #@fall
    if t[i] == p[j]:
        j += 1                                  #@hit,miss
    if j == m:
        res.append(i - m + 1)                   #@found
        j = nxt[j - 1]
print(*(res if res else [-1]))                  #@done
`,
    java: String.raw`
import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String t = sc.next(), p = sc.next();
        int n = t.length(), m = p.length();
        int[] nxt = new int[m];                     //@init
        for (int i = 1, j = 0; i < m; i++) {
            while (j > 0 && p.charAt(i) != p.charAt(j)) j = nxt[j - 1];     //@pFall
            if (p.charAt(i) == p.charAt(j)) j++;    //@pExtend
            nxt[i] = j;                             //@pSet
        }
        List<Integer> res = new ArrayList<>();
        for (int i = 0, j = 0; i < n; i++) {
            while (j > 0 && t.charAt(i) != p.charAt(j)) j = nxt[j - 1];     //@fall
            if (t.charAt(i) == p.charAt(j)) j++;    //@hit,miss
            if (j == m) {
                res.add(i - m + 1);                 //@found
                j = nxt[j - 1];
            }
        }
        StringBuilder sb = new StringBuilder();
        if (res.isEmpty()) sb.append(-1);
        for (int x : res) sb.append(x).append(' ');     //@done
        System.out.println(sb);
    }
}
`,
  },
  problems: pickProblems('P3375', 'P4391'),
}
