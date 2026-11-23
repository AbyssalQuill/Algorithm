import { GridView, type GridCell } from '../components/GridView'
import { Stats } from '../components/Stats'
import { pickProblems } from '../data/problems'
import { Recorder } from '../engine/recorder'
import type { AlgoDef, Frame, ParseResult } from '../engine/types'
import { randInt, splitBar } from './shared'

export interface LcsInput {
  a: string
  b: string
}

type Pos = [number, number]

export interface LcsState {
  a: string
  b: string
  /** dp[i][j]：a 的前 i 个字符与 b 的前 j 个字符的最长公共子序列的长度；还没算的是 null */
  dp: (number | null)[][]
  cur: Pos | null
  /** 当前格子的值是从哪几个格子得来的 */
  src: Pos[]
  /** 回溯时走过的格子 */
  path: Pos[]
  /** 回溯中已经收集到的公共字符（倒序） */
  picked: string
  phase: 'fill' | 'trace' | 'done'
  answer: number | null
}

export function lcsString(a: string, b: string): { len: number; str: string } {
  const n = a.length
  const m = b.length
  const dp = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0))
  for (let i = 1; i <= n; i++) for (let j = 1; j <= m; j++) dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1])
  let i = n
  let j = m
  let res = ''
  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1]) {
      res += a[i - 1]
      i--
      j--
    } else if (dp[i - 1][j] >= dp[i][j - 1]) i--
    else j--
  }
  return { len: dp[n][m], str: [...res].reverse().join('') }
}

export function runLcs({ a, b }: LcsInput): Frame<LcsState>[] {
  const rec = new Recorder<LcsState>()
  const n = a.length
  const m = b.length
  const dp: (number | null)[][] = Array.from({ length: n + 1 }, (_, i) => Array.from({ length: m + 1 }, (_, j) => (i === 0 || j === 0 ? 0 : null)))
  let cur: Pos | null = null
  let src: Pos[] = []
  let path: Pos[] = []
  let picked = ''
  let phase: LcsState['phase'] = 'fill'
  let answer: number | null = null
  const snap = (): LcsState => ({ a, b, dp, cur, src, path, picked, phase, answer })

  rec.push('init', snap(), `dp[i][j] 表示 A 的前 i 个字符与 B 的前 j 个字符的最长公共子序列的长度。有一边是空串时，公共部分只能是空的，所以第 0 行和第 0 列都是 0。`)
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      cur = [i, j]
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = (dp[i - 1][j - 1] as number) + 1
        src = [[i - 1, j - 1]]
        rec.push('match', snap(), `A 的第 ${i} 个字符是 ${a[i - 1]}，B 的第 ${j} 个字符也是 ${b[j - 1]}，它们可以配成一对。于是 dp[${i}][${j}] = dp[${i - 1}][${j - 1}] + 1 = ${dp[i][j]}。`)
      } else {
        const up = dp[i - 1][j] as number
        const left = dp[i][j - 1] as number
        dp[i][j] = Math.max(up, left)
        src = [[i - 1, j], [i, j - 1]]
        rec.push('skip', snap(), `A 的第 ${i} 个字符 ${a[i - 1]} 与 B 的第 ${j} 个字符 ${b[j - 1]} 不相同，它们不能同时用上。要么丢掉 A 的这个字符（看上面，${up}），要么丢掉 B 的这个字符（看左边，${left}），取较大的：dp[${i}][${j}] = ${dp[i][j]}。`)
      }
    }
  }
  cur = null
  src = []
  answer = dp[n][m] as number
  phase = 'trace'
  let i = n
  let j = m
  path = [[i, j]]
  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1]) {
      picked += a[i - 1]
      i--
      j--
      path.push([i, j])
      rec.push('tmatch', snap(), `回到表格的右下角往回走。A 的第 ${i + 1} 个字符与 B 的第 ${j + 1} 个字符都是 ${a[i]}，它是公共子序列里的一员，记下来，然后向左上方走。`)
    } else if ((dp[i - 1][j] as number) >= (dp[i][j - 1] as number)) {
      i--
      path.push([i, j])
      rec.push('tup', snap(), `这两个字符不相同，而上面的数不比左边的小，说明最优解来自上面，向上走一格。`)
    } else {
      j--
      path.push([i, j])
      rec.push('tleft', snap(), `这两个字符不相同，而左边的数更大，说明最优解来自左边，向左走一格。`)
    }
  }
  phase = 'done'
  const str = [...picked].reverse().join('')
  rec.push('done', snap(), str ? `走到了边界。把记下的字符倒过来，得到一个最长公共子序列：${str}，长度是 ${answer}。` : `走到了边界，一个公共字符也没有收集到：最长公共子序列的长度是 0。`)
  return rec.frames
}

function LcsView({ frame }: { frame: Frame<LcsState> }) {
  const s = frame.state
  const n = s.a.length
  const m = s.b.length
  const key = (p: Pos) => `${p[0]},${p[1]}`
  const src = new Set(s.src.map(key))
  const path = new Set(s.path.map(key))
  const rows: GridCell[][] = []
  // 表头行：B 的字符
  rows.push([{ head: true }, { head: true }, ...[...s.b].map((c, j): GridCell => ({ head: true, text: c, tone: s.cur && s.cur[1] === j + 1 ? 'compare' : 'idle' }))])
  for (let i = 0; i <= n; i++) {
    const row: GridCell[] = [{ head: true, text: i === 0 ? '' : s.a[i - 1] }]
    for (let j = 0; j <= m; j++) {
      const v = s.dp[i][j]
      const k = `${i},${j}`
      let tone: GridCell['tone'] = v === null ? 'dim' : 'idle'
      if (i === 0 || j === 0) tone = 'dim'
      if (src.has(k)) tone = 'done'
      if (s.cur && key(s.cur) === k) tone = 'compare'
      if (path.has(k)) tone = 'found'
      row.push({ text: v === null ? '' : v, tone })
    }
    rows.push(row)
  }
  // 当前比较的 A 字符高亮
  if (s.cur) rows[s.cur[0] + 1][0] = { ...rows[s.cur[0] + 1][0], tone: 'compare' }
  return (
    <div className="viz">
      <div className="target-row">
        <span className="target-chip">
          A = <b>{s.a}</b>
        </span>
        <span className="target-chip">
          B = <b>{s.b}</b>
        </span>
      </div>
      <GridView rows={rows} maxCell={50} />
      <div className="legend">
        <span><i className="sw tone-compare" />正在计算</span>
        <span><i className="sw tone-done" />它依赖的格子</span>
        <span><i className="sw tone-found" />回溯的路线</span>
      </div>
      {s.phase !== 'fill' && (
        <div className="target-row">
          <span className="target-chip">
            收集到的字符（倒序）：<b>{s.picked || '—'}</b>
          </span>
          {s.phase === 'done' && <span className="verdict ok">最长公共子序列：{[...s.picked].reverse().join('') || '空'}（长度 {s.answer}）</span>}
        </div>
      )}
      <Stats
        items={[
          ['表格大小', `${n + 1} × ${m + 1}`],
          ['已经算出', `${s.dp.flat().filter((x, idx) => x !== null && Math.floor(idx / (m + 1)) > 0 && idx % (m + 1) > 0).length} / ${n * m}`],
          ['目前的答案', s.answer ?? '—'],
        ]}
      />
    </div>
  )
}

function parse(text: string): ParseResult<LcsInput> {
  const parts = splitBar(text)
  if (parts.length !== 2) return { ok: false, error: '格式是「字符串 A | 字符串 B」，例如：ABCBD | BDCAB' }
  const a = parts[0].trim().toUpperCase()
  const b = parts[1].trim().toUpperCase()
  if (!/^[A-Z]{1,8}$/.test(a) || !/^[A-Z]{1,8}$/.test(b)) return { ok: false, error: '两个字符串都只能由字母组成，长度 1～8。' }
  return { ok: true, value: { a, b } }
}

const randStr = (len: number) => Array.from({ length: len }, () => 'ABCD'[randInt(0, 3)]).join('')

export const lcs: AlgoDef<LcsInput, LcsState> = {
  id: 'lcs',
  title: '动态规划：最长公共子序列',
  tagline: '把大问题拆成小问题，每个小问题只算一次，结果填进表格里反复使用',
  kind: '算法',
  intro: [
    '给两个字符串，找出它们最长的公共子序列。子序列的意思是：从原字符串里按顺序取出一些字符（可以不连续），比如 ACD 是 ABCD 的子序列，而 CAD 不是。直接枚举 A 的所有子序列再逐个检查，数量是指数级的，根本算不完。',
    '动态规划的做法是先把问题缩小。设 dp[i][j] 为 A 的前 i 个字符与 B 的前 j 个字符的答案，只看最后一对字符：如果它们相同，这一对一定可以配上，答案就是 dp[i-1][j-1] 加一；如果不同，它们至少有一个用不上，答案是丢掉其中一个后的两种情况里较大的。把表格从左上角填到右下角，右下角的数就是最终答案。',
  ],
  points: [
    '状态：dp[i][j] 表示 A 的前 i 个字符和 B 的前 j 个字符的最长公共子序列长度。第 0 行、第 0 列表示其中一个是空串，都是 0。',
    '转移：a[i]==b[j] 时 dp[i][j]=dp[i-1][j-1]+1；否则 dp[i][j]=max(dp[i-1][j], dp[i][j-1])。每个格子只依赖它左边、上边和左上角的格子，所以按行从左到右填就保证用到的值都已经算好了。',
    '字符串下标从 0 开始，而表格的下标从 1 开始，所以比较的是 a[i-1] 和 b[j-1]，这是最容易写错的地方。',
    '只知道长度还不够时，可以从右下角沿着“值来自哪里”往回走，遇到相同的字符就记下来，最后把记下的字符倒过来，就是一个具体的公共子序列。',
  ],
  pitfalls: [
    '比较字符时写成 a[i]==b[j]，下标与表格错开了一位。',
    '最长公共子序列往往不止一种，回溯时遇到上、左相等的情况选哪一边，会得到不同但长度相同的答案。',
    '这张表格是 O(n·m) 的，字符串长到十万时既存不下，也算不完，需要换别的思路。',
  ],
  complexity: { time: 'O(n·m)', space: 'O(n·m)', note: 'n、m 是两个字符串的长度。只求长度时，可以只保留相邻两行，空间降到 O(m)。' },
  inputHint: '格式：字符串 A | 字符串 B，例如 ABCBD | BDCAB（只能是字母，每个最多 8 个）。',
  presets: [
    { label: '有公共部分', text: 'ABCBD | BDCAB' },
    { label: '完全相同', text: 'ALGO | ALGO' },
    { label: '没有公共字符', text: 'ABC | XYZ' },
  ],
  defaultInput: { a: 'ABCBD', b: 'BDCAB' },
  parse,
  format: (v) => `${v.a} | ${v.b}`,
  random: () => ({ a: randStr(randInt(4, 6)), b: randStr(randInt(4, 6)) }),
  run: runLcs,
  View: LcsView,
  sources: {
    c: String.raw`
#include <stdio.h>
#include <string.h>
int dp[105][105];
int max(int x,int y){ return x>y?x:y; }
int main(){
    char a[105],b[105],res[105];
    scanf("%s %s",a,b);
    int n=strlen(a),m=strlen(b);                        //@init
    for (int i=1;i<=n;i++){
        for (int j=1;j<=m;j++){
            if (a[i-1]==b[j-1]){
                dp[i][j]=dp[i-1][j-1]+1;                //@match
            }else{
                dp[i][j]=max(dp[i-1][j],dp[i][j-1]);    //@skip
            }
        }
    }
    int i=n,j=m,k=0;
    while (i>0&&j>0){
        if (a[i-1]==b[j-1]){
            res[k++]=a[i-1];                            //@tmatch
            i--;                                        //@tmatch
            j--;                                        //@tmatch
        }else if (dp[i-1][j]>=dp[i][j-1]){
            i--;                                        //@tup
        }else{
            j--;                                        //@tleft
        }
    }
    printf("%d\n",dp[n][m]);                            //@done
    for (int t=k-1;t>=0;t--) putchar(res[t]);           //@done
    printf("\n");
    return 0;
}
`,
    cpp: String.raw`
#include <bits/stdc++.h>
using namespace std;
int dp[105][105];
int main(){
    string a,b;
    cin>>a>>b;
    int n=a.size(),m=b.size();                          //@init
    for (int i=1;i<=n;i++){
        for (int j=1;j<=m;j++){
            if (a[i-1]==b[j-1]){
                dp[i][j]=dp[i-1][j-1]+1;                //@match
            }else{
                dp[i][j]=max(dp[i-1][j],dp[i][j-1]);    //@skip
            }
        }
    }
    string res;
    int i=n,j=m;
    while (i>0&&j>0){
        if (a[i-1]==b[j-1]){
            res+=a[i-1];                                //@tmatch
            i--;                                        //@tmatch
            j--;                                        //@tmatch
        }else if (dp[i-1][j]>=dp[i][j-1]){
            i--;                                        //@tup
        }else{
            j--;                                        //@tleft
        }
    }
    reverse(res.begin(),res.end());
    cout<<dp[n][m]<<endl<<res<<endl;                    //@done
    return 0;
}
`,
    python: String.raw`
a = input()
b = input()
n, m = len(a), len(b)                                   #@init
dp = [[0] * (m + 1) for _ in range(n + 1)]
for i in range(1, n + 1):
    for j in range(1, m + 1):
        if a[i - 1] == b[j - 1]:
            dp[i][j] = dp[i - 1][j - 1] + 1             #@match
        else:
            dp[i][j] = max(dp[i - 1][j], dp[i][j - 1])  #@skip
res = []
i, j = n, m
while i > 0 and j > 0:
    if a[i - 1] == b[j - 1]:
        res.append(a[i - 1])                            #@tmatch
        i -= 1                                          #@tmatch
        j -= 1                                          #@tmatch
    elif dp[i - 1][j] >= dp[i][j - 1]:
        i -= 1                                          #@tup
    else:
        j -= 1                                          #@tleft
print(dp[n][m])                                         #@done
print(''.join(reversed(res)))                           #@done
`,
    java: String.raw`
import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String a = sc.next(), b = sc.next();
        int n = a.length(), m = b.length();                 //@init
        int[][] dp = new int[n + 1][m + 1];
        for (int i = 1; i <= n; i++) {
            for (int j = 1; j <= m; j++) {
                if (a.charAt(i - 1) == b.charAt(j - 1)) {
                    dp[i][j] = dp[i - 1][j - 1] + 1;        //@match
                } else {
                    dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);   //@skip
                }
            }
        }
        StringBuilder res = new StringBuilder();
        int i = n, j = m;
        while (i > 0 && j > 0) {
            if (a.charAt(i - 1) == b.charAt(j - 1)) {
                res.append(a.charAt(i - 1));                //@tmatch
                i--;                                        //@tmatch
                j--;                                        //@tmatch
            } else if (dp[i - 1][j] >= dp[i][j - 1]) {
                i--;                                        //@tup
            } else {
                j--;                                        //@tleft
            }
        }
        System.out.println(dp[n][m]);                       //@done
        System.out.println(res.reverse());                  //@done
    }
}
`,
  },
  problems: pickProblems('P1216', 'P1439'),
}
