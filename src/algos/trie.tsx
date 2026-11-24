import { Stats } from '../components/Stats'
import { TreeView, type TNode } from '../components/TreeView'
import { pickProblems } from '../data/problems'
import { Recorder } from '../engine/recorder'
import type { AlgoDef, Frame, ParseResult } from '../engine/types'
import { fail, randInt, readInput } from './shared'

export interface TrieInput {
  words: string[]
  query: string
}

interface TrNode {
  id: number
  ch: string
  /** 孩子的 id，按字母顺序排列 */
  kids: number[]
  end: boolean
}

export interface TrieState {
  nodes: TrNode[]
  cur: number
  path: number[]
  fresh: number | null
  word: string
  /** 正在处理单词的第几个字母（从 0 开始）；-1 表示还没开始 */
  pos: number
  phase: 'insert' | 'query' | 'done'
  result: 'none' | 'word' | 'prefix' | 'miss'
}

export function runTrie({ words, query }: TrieInput): Frame<TrieState>[] {
  const rec = new Recorder<TrieState>()
  const nodes: TrNode[] = [{ id: 0, ch: '·', kids: [], end: false }]
  let cur = 0
  let path: number[] = [0]
  let fresh: number | null = null
  let word = ''
  let pos = -1
  let phase: TrieState['phase'] = 'insert'
  let result: TrieState['result'] = 'none'
  const snap = (): TrieState => ({ nodes, cur, path, fresh, word, pos, phase, result })
  const childOf = (p: number, c: string) => nodes[p].kids.map((k) => nodes[k]).find((n) => n.ch === c)

  rec.push('init', snap(), `字典树（Trie）用一棵树存放很多个单词：从根出发，每走一步对应单词里的一个字母，所以有相同前缀的单词会共用同一段路。根结点不代表任何字母，先建一棵只有根的树。`)
  for (const w of words) {
    phase = 'insert'
    word = w
    pos = -1
    cur = 0
    path = [0]
    fresh = null
    rec.push('insStart', snap(), `插入单词 ${w}：从根结点出发，一个字母一个字母地往下走。`)
    for (let i = 0; i < w.length; i++) {
      const c = w[i]
      pos = i
      const exist = childOf(cur, c)
      if (!exist) {
        const id = nodes.length
        nodes.push({ id, ch: c, kids: [], end: false })
        nodes[cur].kids.push(id)
        nodes[cur].kids.sort((a, b) => nodes[a].ch.localeCompare(nodes[b].ch))
        fresh = id
        rec.push('create', snap(), `当前结点下面还没有字母 ${c} 的分支，新建一个结点。`)
        cur = id
      } else {
        cur = exist.id
        fresh = null
      }
      path = [...path, cur]
      rec.push('walk', snap(), exist ? `已经有字母 ${c} 的分支（别的单词留下的），直接走过去，不需要新建。` : `沿着新建的分支走到字母 ${c} 的结点。`)
    }
    nodes[cur].end = true
    fresh = null
    rec.push('mark', snap(), `单词 ${w} 的最后一个字母到了，给这个结点做上“单词结束”的标记（双圈）。只有路径不够，还要靠这个标记区分“完整的单词”和“只是前缀”。`)
  }
  phase = 'query'
  word = query
  pos = -1
  cur = 0
  path = [0]
  fresh = null
  rec.push('qStart', snap(), `现在查询 ${query} 是不是插入过的单词：同样从根出发，按字母逐个往下走。`)
  let ok = true
  for (let i = 0; i < query.length; i++) {
    const c = query[i]
    pos = i
    const nx = childOf(cur, c)
    if (!nx) {
      result = 'miss'
      ok = false
      rec.push('qMiss', snap(), `当前结点下面没有字母 ${c} 的分支，路走不通，说明 ${query} 没有出现过，连前缀都不是。`)
      break
    }
    cur = nx.id
    path = [...path, cur]
    rec.push('qWalk', snap(), `沿着字母 ${c} 走到下一个结点。`)
  }
  if (ok) {
    result = nodes[cur].end ? 'word' : 'prefix'
    rec.push('qEnd', snap(), nodes[cur].end ? `字母走完了，并且停在带“单词结束”标记的结点上：${query} 是一个插入过的单词。` : `字母走完了，路是通的，但这个结点没有“单词结束”标记：${query} 只是某个单词的前缀，并不是完整的单词。`)
  }
  phase = 'done'
  return rec.frames
}

function TrieView({ frame }: { frame: Frame<TrieState> }) {
  const s = frame.state
  const onPath = new Set(s.path)
  const tn: TNode[] = s.nodes.map((n) => ({
    id: n.id,
    label: n.ch,
    kids: n.kids,
    ring: n.end,
    tone: n.id === s.fresh ? 'found' : n.id === s.cur ? 'compare' : onPath.has(n.id) ? 'done' : 'idle',
    edge: onPath.has(n.id) ? 'done' : 'idle',
  }))
  const wordChars = [...s.word]
  return (
    <div className="viz">
      <div className="target-row">
        <span className="target-chip">
          {s.phase === 'insert' ? '正在插入' : '正在查询'}
          {s.word && (
            <b>
              {' '}
              {wordChars.map((c, i) => (
                <span key={i} style={{ color: i === s.pos ? 'var(--blue)' : undefined, textDecoration: i === s.pos ? 'underline' : undefined }}>
                  {c}
                </span>
              ))}
            </b>
          )}
        </span>
        {s.result === 'word' && <span className="verdict ok">是一个单词</span>}
        {s.result === 'prefix' && <span className="verdict bad">只是前缀</span>}
        {s.result === 'miss' && <span className="verdict bad">不存在</span>}
      </div>
      <TreeView nodes={tn} root={0} mode="tidy" levels={5} maxSlots={7} />
      <Stats
        items={[
          ['结点数（含根）', s.nodes.length],
          ['单词数', s.nodes.filter((n) => n.end).length],
        ]}
      />
    </div>
  )
}

function parse(text: string): ParseResult<TrieInput> {
  return readInput(text, (r) => {
    const n = r.int('n', 1, 6)
    const words = Array.from({ length: n }, (_, k) => r.word(`第 ${k + 1} 个单词`, /^[a-z]{1,5}$/, '只能由 1～5 个小写字母组成'))
    const query = r.word('要查询的单词', /^[a-z]{1,5}$/, '只能由 1～5 个小写字母组成')
    r.end()
    const total = new Set(words.flatMap((w) => [...w].map((_, i) => w.slice(0, i + 1)))).size
    if (total > 18) fail('这些单词合起来的结点太多，画不下，请换短一点或者前缀更相近的单词。')
    return { words, query }
  })
}

const rw = (len: number) => Array.from({ length: len }, () => 'abc'[randInt(0, 2)]).join('')

export const trie: AlgoDef<TrieInput, TrieState> = {
  id: 'trie',
  title: 'Trie',
  tagline: '字典树：让有相同前缀的单词共用同一段路，查找一个单词只需要走它的长度那么多步',
  kind: '数据结构',
  slug: 'search',
  name: '查找单词',
  type: '前缀树',
  statement: {
    desc: [
      '把 n 个由小写字母组成的单词依次插入一棵字典树（Trie），然后判断给定的单词 w 是不是插入过的单词。只是某个单词的前缀、但没有被单独插入过的字符串，不算。',
    ],
    input: [
      '第一行一个整数 n（1 ≤ n ≤ 6），第二行 n 个单词，每个由 1～5 个小写字母组成。',
      '第三行一个单词 w，同样由 1～5 个小写字母组成。单词合起来的字典树最多 18 个结点。',
    ],
    output: [
      '一行。w 是插入过的单词输出 YES，否则输出 NO。',
    ],
  },
  intro: [
    '字典树（也叫前缀树）是专门用来存放一大批字符串的树。树里的每一条边对应一个字母，从根走到某个结点所经过的字母连起来，就是一个字符串。cat、car、cart 都以 ca 开头，所以它们共用 c→a 这一段，到第三个字母才分开，节省了空间。',
    '插入一个单词，就是从根开始按字母逐个往下走：这条路已经有了就直接走，没有就新建一个结点。最后在单词末尾的结点上做一个“结束”标记。查询的时候同样按字母往下走，路中途断了就说明不存在；走完了还要检查终点有没有“结束”标记，才能区分它是完整的单词还是只是某个单词的前缀。',
  ],
  points: [
    '用二维数组 ch[结点][字母] 保存孩子的编号，0 表示没有（根结点是 0，不会是任何结点的孩子）。',
    '插入和查询花的时间只与单词的长度有关，与已经存放了多少单词无关，都是 O(L)。',
    '“结束”标记不可缺少：cart 存在不代表 car 存在，必须看 car 的最后一个结点有没有标记。',
    '同一个结构还能回答“有多少个单词以某个前缀开头”：在每个结点上多记一个经过它的次数就行。',
  ],
  pitfalls: [
    '结点数组要开够：最坏情况下每个字母都新建一个结点，需要“所有单词的总长度 + 1”个结点，每个结点还要存放字母表大小那么多个孩子编号，字母表很大时很占内存。',
    '字母下标写成 c-\'a\' 时，如果输入里有大写字母或者其他字符，会越界，要先确认字符集。',
    '查询前缀和查询完整单词要分清：前者只看路是否走得通，后者还要检查结束标记。',
  ],
  complexity: { time: 'O(L)', space: 'O(总字符数)', note: 'L 是单词的长度。插入和查询只取决于单词有多长，与单词的个数无关。' },
  presets: [
    { label: '是单词', text: '4\ncat car cart dog\ncar' },
    { label: '只是前缀', text: '4\ncat car cart dog\nca' },
    { label: '不存在', text: '4\ncat car cart dog\ncow' },
  ],
  defaultInput: { words: ['cat', 'car', 'cart', 'dog'], query: 'car' },
  parse,
  format: (v) => `${v.words.length}\n${v.words.join(' ')}\n${v.query}`,
  answer: (v) => (v.words.includes(v.query) ? 'YES' : 'NO'),
  random: () => {
    const words = Array.from({ length: randInt(3, 5) }, () => rw(randInt(2, 4)))
    const r = Math.random()
    const w = words[randInt(0, words.length - 1)]
    const query = r < 0.4 ? w : r < 0.7 ? w.slice(0, randInt(1, w.length)) : rw(randInt(1, 4))
    return { words, query }
  },
  run: runTrie,
  View: TrieView,
  sources: {
    c: String.raw`
#include <stdio.h>
int ch[1005][26],cnt=1;                 // ch[p][c] 是结点 p 沿着字母 c 走到的孩子  //@init
int isEnd[1005];
void insert(char *s){
    int p=0;                            // 插入单词：从根（0 号结点）出发             //@insStart
    for (int i=0;s[i];i++){
        int x=s[i]-'a';
        if (!ch[p][x]) ch[p][x]=cnt++;  // 这条路还不存在，就新建一个结点              //@create
        p=ch[p][x];                     // 沿着字母往下走一步                    //@walk
    }
    isEnd[p]=1;                         // 单词的最后一个字母，标记“到这里是一个完整的单词”    //@mark
}
int query(char *s){
    int p=0;                            // 查询单词：同样从根出发                  //@qStart
    for (int i=0;s[i];i++){
        int x=s[i]-'a';
        if (!ch[p][x]) return 0;        // 路断了，单词不存在                    //@qMiss
        p=ch[p][x];                     // 沿着字母往下走                      //@qWalk
    }
    return isEnd[p];                    // 走完了，还要看这里是不是一个完整的单词          //@qEnd
}
int main(){
    int n;
    char w[105];
    scanf("%d",&n);
    while (n--){
        scanf("%s",w);
        insert(w);
    }
    scanf("%s",w);
    puts(query(w)?"YES":"NO");
    return 0;
}
`,
    cpp: String.raw`
#include <bits/stdc++.h>
using namespace std;
int ch[1005][26],cnt=1;                 // ch[p][c] 是结点 p 沿着字母 c 走到的孩子  //@init
bool isEnd[1005];
void insert(const string &s){
    int p=0;                            // 插入单词：从根（0 号结点）出发             //@insStart
    for (char c:s){
        int x=c-'a';
        if (!ch[p][x]) ch[p][x]=cnt++;  // 这条路还不存在，就新建一个结点              //@create
        p=ch[p][x];                     // 沿着字母往下走一步                    //@walk
    }
    isEnd[p]=true;                      // 单词的最后一个字母，标记“到这里是一个完整的单词”    //@mark
}
bool query(const string &s){
    int p=0;                            // 查询单词：同样从根出发                  //@qStart
    for (char c:s){
        int x=c-'a';
        if (!ch[p][x]) return false;    // 路断了，单词不存在                    //@qMiss
        p=ch[p][x];                     // 沿着字母往下走                      //@qWalk
    }
    return isEnd[p];                    // 走完了，还要看这里是不是一个完整的单词          //@qEnd
}
int main(){
    int n;
    string w;
    cin>>n;
    while (n--){
        cin>>w;
        insert(w);
    }
    cin>>w;
    cout<<(query(w)?"YES":"NO")<<endl;
    return 0;
}
`,
    python: String.raw`
ch=[{}]                    # ch[p][c] 是结点 p 沿着字母 c 走到的孩子  #@init
is_end=[False]

def insert(s):
    p=0                    # 插入单词：从根（0 号结点）出发             #@insStart
    for c in s:
        if c not in ch[p]:
            ch.append({})  # 这条路还不存在，就新建一个结点              #@create
            is_end.append(False)                          #@create
            ch[p][c]=len(ch)-1                            #@create
        p=ch[p][c]         # 沿着字母往下走一步                    #@walk
    is_end[p]=True         # 单词的最后一个字母，标记“到这里是一个完整的单词”    #@mark

def query(s):
    p=0                    # 查询单词：同样从根出发                  #@qStart
    for c in s:
        if c not in ch[p]:
            return False   # 路断了，单词不存在                    #@qMiss
        p=ch[p][c]         # 沿着字母往下走                      #@qWalk
    return is_end[p]       # 走完了，还要看这里是不是一个完整的单词          #@qEnd

n=int(input())
for w in input().split():
    insert(w)
print("YES" if query(input().strip()) else "NO")
`,
    java: String.raw`
import java.util.*;

public class Main{
    static int[][] ch=new int[1005][26];
    static boolean[] isEnd=new boolean[1005];
    static int cnt=1;                         // ch[p][c] 是结点 p 沿着字母 c 走到的孩子  //@init

    static void insert(String s){
        int p=0;                              // 插入单词：从根（0 号结点）出发             //@insStart
        for (char c:s.toCharArray()){
            int x=c-'a';
            if (ch[p][x]==0) ch[p][x]=cnt++;  // 这条路还不存在，就新建一个结点              //@create
            p=ch[p][x];                       // 沿着字母往下走一步                    //@walk
        }
        isEnd[p]=true;                        // 单词的最后一个字母，标记“到这里是一个完整的单词”    //@mark
    }

    static boolean query(String s){
        int p=0;                              // 查询单词：同样从根出发                  //@qStart
        for (char c:s.toCharArray()){
            int x=c-'a';
            if (ch[p][x]==0) return false;    // 路断了，单词不存在                    //@qMiss
            p=ch[p][x];                       // 沿着字母往下走                      //@qWalk
        }
        return isEnd[p];                      // 走完了，还要看这里是不是一个完整的单词          //@qEnd
    }

    public static void main(String[] args){
        Scanner sc=new Scanner(System.in);
        int n=sc.nextInt();
        while (n-- > 0) insert(sc.next());
        System.out.println(query(sc.next())?"YES":"NO");
    }
}
`,
  },
  problems: pickProblems('P8306', 'P2580'),
}
