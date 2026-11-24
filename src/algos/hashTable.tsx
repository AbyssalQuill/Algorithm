import { Stats } from '../components/Stats'
import { pickProblems } from '../data/problems'
import { Recorder } from '../engine/recorder'
import type { AlgoDef, Frame, ParseResult } from '../engine/types'
import { fail, randInt, readInput } from './shared'

const M = 7

export interface HashInput {
  keys: number[]
  target: number
}

export interface HashState {
  /** 每个桶里的链，从左到右是插入的先后 */
  buckets: number[][]
  /** 正在处理的桶；-1 表示没有 */
  bucket: number
  /** 正在比较的是链里的第几个；-1 表示还没开始 */
  pos: number
  /** 刚刚插入的数 */
  fresh: number | null
  x: number | null
  phase: 'insert' | 'search'
  collisions: number
  result: 'none' | 'hit' | 'miss'
  compares: number
}

export function runHash({ keys, target }: HashInput): Frame<HashState>[] {
  const rec = new Recorder<HashState>()
  const buckets: number[][] = Array.from({ length: M }, () => [])
  let bucket = -1
  let pos = -1
  let fresh: number | null = null
  let x: number | null = null
  let phase: HashState['phase'] = 'insert'
  let collisions = 0
  let result: HashState['result'] = 'none'
  let compares = 0
  const snap = (): HashState => ({ buckets, bucket, pos, fresh, x, phase, collisions, result, compares })

  rec.push('init', snap(), `哈希表有 ${M} 个“桶”，编号 0 到 ${M - 1}。每个数放进哪个桶，由哈希函数决定：这里取 h(x) = x % ${M}。要找一个数时，同样先算出它的桶，只需要在那一个桶里找，不必看整张表。`)
  for (const k of keys) {
    phase = 'insert'
    x = k
    bucket = k % M
    pos = -1
    fresh = null
    rec.push('hash', snap(), `插入 ${k}：h(${k}) = ${k} % ${M} = ${bucket}，应该放进 ${bucket} 号桶。`)
    const clash = buckets[bucket].length > 0
    if (clash) collisions++
    buckets[bucket].push(k)
    fresh = k
    pos = buckets[bucket].length - 1
    rec.push('append', snap(), clash ? `${bucket} 号桶里已经有 ${buckets[bucket].slice(0, -1).join('、')} 了，这叫“冲突”。办法是把桶做成一条链，新来的 ${k} 接在链的末尾。` : `${bucket} 号桶还是空的，直接放进去。`)
  }
  phase = 'search'
  x = target
  bucket = target % M
  pos = -1
  fresh = null
  compares = 0
  rec.push('sHash', snap(), `现在查找 ${target}：h(${target}) = ${target} % ${M} = ${bucket}，它如果存在，只可能在 ${bucket} 号桶里。`)
  let hit = false
  for (let i = 0; i < buckets[bucket].length; i++) {
    pos = i
    compares++
    if (buckets[bucket][i] === target) {
      hit = true
      result = 'hit'
      rec.push('sHit', snap(), `链里的第 ${i + 1} 个数是 ${buckets[bucket][i]}，等于 ${target}，找到了。一共比较了 ${compares} 次。`)
      break
    }
    rec.push('sProbe', snap(), `链里的第 ${i + 1} 个数是 ${buckets[bucket][i]}，不是 ${target}，看下一个。`)
  }
  if (!hit) {
    pos = -1
    result = 'miss'
    rec.push('sMiss', snap(), buckets[bucket].length === 0 ? `${bucket} 号桶是空的，说明表里没有 ${target}。` : `${bucket} 号桶里的数都看过了，没有 ${target}。一共比较了 ${compares} 次，没有去看另外 ${M - 1} 个桶。`)
  }
  return rec.frames
}

function HashView({ frame }: { frame: Frame<HashState> }) {
  const s = frame.state
  const longest = Math.max(...s.buckets.map((b) => b.length))
  const total = s.buckets.reduce((a, b) => a + b.length, 0)
  return (
    <div className="viz">
      <div className="target-row">
        <span className="target-chip">
          {s.phase === 'insert' ? '正在插入' : '正在查找'}
          {s.x !== null && <b> {s.x}</b>}
        </span>
        {s.x !== null && <span className="target-chip">h(x) = x % {M} = <b>{s.x % M}</b></span>}
        {s.result === 'hit' && <span className="verdict ok">找到了</span>}
        {s.result === 'miss' && <span className="verdict bad">表里没有</span>}
      </div>
      <div className="hash">
        {s.buckets.map((chain, i) => (
          <div key={i} className={`hash-row${s.bucket === i ? ' is-cur' : ''}`}>
            <span className="hash-idx">{i}</span>
            <span className="hash-chain">
              {chain.length === 0 && <span className="qrow-empty">空</span>}
              {chain.map((v, j) => (
                <span key={j} className="hash-item">
                  {j > 0 && <i className="hash-arrow">→</i>}
                  <span className={`qchip tone-${s.fresh === v && s.phase === 'insert' ? 'found' : s.bucket === i && s.pos === j ? (s.result === 'hit' ? 'found' : 'compare') : 'idle'}`}>{v}</span>
                </span>
              ))}
            </span>
          </div>
        ))}
      </div>
      <Stats
        items={[
          ['已存放', total],
          ['发生冲突', s.collisions],
          ['最长的链', longest],
          ['查找比较', s.compares],
        ]}
      />
    </div>
  )
}

function parse(text: string): ParseResult<HashInput> {
  return readInput(text, (r) => {
    const n = r.int('n', 2, 9)
    const keys = r.ints(n, '数', 1, 99)
    const target = r.int('t', 1, 99)
    r.end()
    if (new Set(keys).size !== keys.length) fail('演示里存入的数请互不相同。')
    return { keys, target }
  })
}

export const hashTable: AlgoDef<HashInput, HashState> = {
  id: 'hash-table',
  title: '哈希表',
  tagline: '用一个函数把数“分配”到不同的桶里，查找时只需要翻开一个桶',
  kind: '数据结构',
  slug: 'lookup',
  name: '查找一个数',
  type: '拉链法',
  statement: {
    desc: [
      '依次把 n 个互不相同的整数存进一个哈希表。哈希表有 7 个桶，数 x 放进编号为 x mod 7 的桶，同一个桶里的数用链表串起来（这叫拉链法）。存完之后，判断给定的数 t 是否在表里。',
    ],
    input: [
      '第一行一个整数 n（2 ≤ n ≤ 9）。',
      '第二行 n 个互不相同的整数，每个在 1～99 之间，按这个顺序依次存入。',
      '第三行一个整数 t（1～99），是要查找的数。',
    ],
    output: [
      '一行。t 在表里输出 YES，否则输出 NO。',
    ],
  },
  intro: [
    '想在一堆数里快速找到某个数，最直接的办法是一个一个地比较，要花 O(n) 的时间。哈希表换了一个想法：准备若干个桶，用一个哈希函数把每个数“算”到某个桶里，比如 h(x) = x % 7。查找的时候，也先算出它应该在哪个桶，然后只在这一个桶里找，不必看别的桶。',
    '不同的数可能算出同一个桶，这叫冲突。最常用的处理办法是拉链法：每个桶是一条链，同一个桶里的数依次接在链上。只要哈希函数分得比较均匀，每条链都很短，一次查找就几乎只需要一次计算加上一两次比较，所以平均是 O(1)。标准库里的 unordered_set 和 unordered_map 就是这样实现的。',
  ],
  points: [
    '哈希函数要把数据尽量均匀地分散到各个桶里。对整数最常见的是除以桶的个数取余，桶的个数常取质数。',
    '冲突无法避免，必须有处理办法：拉链法（桶里放链表）和开放寻址法（冲突了就往后找空位）是两种最常用的。',
    '桶的个数相对于数据量太少时，链会变长，退化成逐个比较；所以数据多了要扩容并重新分配（C++ 的 unordered_map 会自动做）。',
    '哈希表擅长“有没有”和“按键取值”，但数据是无序的，不能直接得到最大值，也不能范围查询。',
  ],
  pitfalls: [
    '用整数哈希时，恶意构造的数据可能让很多数落在同一个桶里，把一次查找拖成 O(n)。比赛里遇到可能被卡的题目，可以改用 map，或者给哈希函数加上随机数。',
    '遍历 unordered_map 得到的顺序是不确定的，不要依赖它的顺序。',
    '对负数取余在 C++ 里结果可能是负的，作为桶的编号要先修正（比如加上桶数再取一次余）。',
  ],
  complexity: { time: 'O(1)', space: 'O(n)', note: '这是平均情况；所有数都冲突到一个桶里时，查找退化为 O(n)。' },
  presets: [
    { label: '有冲突，找得到', text: '6\n15 22 8 3 29 36\n36' },
    { label: '找不到', text: '5\n15 22 8 3 29\n50' },
    { label: '全冲突在一个桶', text: '5\n7 14 21 28 35\n35' },
  ],
  defaultInput: { keys: [15, 22, 8, 3, 29, 36], target: 36 },
  parse,
  format: (v) => `${v.keys.length}\n${v.keys.join(' ')}\n${v.target}`,
  answer: (v) => (v.keys.includes(v.target) ? 'YES' : 'NO'),
  random: () => {
    const set = new Set<number>()
    const n = randInt(5, 8)
    while (set.size < n) set.add(randInt(1, 60))
    const keys = [...set]
    return { keys, target: Math.random() < 0.6 ? keys[randInt(0, n - 1)] : randInt(1, 60) }
  },
  run: runHash,
  View: HashView,
  sources: {
    c: String.raw`
#include <stdio.h>
#define M 7
int table[M][105],cnt[M];              // 7 个桶，每个桶里是一条链         //@init
void insert(int x){
    int h=x%M;                         // 用 x 除以 7 的余数，决定放进哪个桶  //@hash
    table[h][cnt[h]++]=x;              // 接到这个桶的链尾              //@append
}
int search(int x){
    int h=x%M;                         // 查找时，也先算出它应该在哪个桶       //@sHash
    for (int i=0;i<cnt[h];i++){        // 只翻开这一个桶，逐个比较          //@sProbe
        if (table[h][i]==x) return 1;  // 找到了                   //@sHit
    }
    return 0;                          // 桶里没有，说明不在表里           //@sMiss
}
int main(){
    int n,t,x;
    scanf("%d",&n);
    for (int i=0;i<n;i++){
        scanf("%d",&x);
        insert(x);
    }
    scanf("%d",&t);
    puts(search(t)?"YES":"NO");
    return 0;
}
`,
    cpp: String.raw`
#include <bits/stdc++.h>
using namespace std;
const int M=7;
vector<int> table_[M];          // 7 个桶，每个桶里是一条链         //@init
void insert(int x){
    int h=x%M;                  // 用 x 除以 7 的余数，决定放进哪个桶  //@hash
    table_[h].push_back(x);     // 接到这个桶的链尾              //@append
}
bool search(int x){
    int h=x%M;                  // 查找时，也先算出它应该在哪个桶       //@sHash
    for (int y:table_[h]){      // 只翻开这一个桶，逐个比较          //@sProbe
        if (y==x) return true;  // 找到了                   //@sHit
    }
    return false;               // 桶里没有，说明不在表里           //@sMiss
}
int main(){
    int n,t,x;
    cin>>n;
    for (int i=0;i<n;i++){
        cin>>x;
        insert(x);
    }
    cin>>t;
    cout<<(search(t)?"YES":"NO")<<endl;
    return 0;
}
`,
    python: String.raw`
M=7
table=[[] for _ in range(M)]  # 7 个桶，每个桶里是一条链         #@init

def insert(x):
    h=x%M                     # 用 x 除以 7 的余数，决定放进哪个桶  #@hash
    table[h].append(x)        # 接到这个桶的链尾              #@append

def search(x):
    h=x%M                     # 查找时，也先算出它应该在哪个桶       #@sHash
    for y in table[h]:        # 只翻开这一个桶，逐个比较          #@sProbe
        if y==x:
            return True       # 找到了                   #@sHit
    return False              # 桶里没有，说明不在表里           #@sMiss

n=int(input())
for x in map(int,input().split()):
    insert(x)
t=int(input())
print("YES" if search(t) else "NO")
`,
    java: String.raw`
import java.util.*;

public class Main{
    static final int M=7;
    static List<List<Integer>> table=new ArrayList<>();  // 7 个桶，每个桶里是一条链  //@init

    static void insert(int x){
        int h=x%M;                            // 用 x 除以 7 的余数，决定放进哪个桶      //@hash
        table.get(h).add(x);                  // 接到这个桶的链尾                  //@append
    }

    static boolean search(int x){
        int h=x%M;                            // 查找时，也先算出它应该在哪个桶           //@sHash
        for (int y:table.get(h)){             // 只翻开这一个桶，逐个比较              //@sProbe
            if (y==x) return true;            // 找到了                       //@sHit
        }
        return false;                         // 桶里没有，说明不在表里               //@sMiss
    }

    public static void main(String[] args){
        for (int i=0;i<M;i++) table.add(new ArrayList<>());
        Scanner sc=new Scanner(System.in);
        int n=sc.nextInt();
        for (int i=0;i<n;i++) insert(sc.nextInt());
        int t=sc.nextInt();
        System.out.println(search(t)?"YES":"NO");
    }
}
`,
  },
  problems: pickProblems('P3370', 'P1102'),
}
