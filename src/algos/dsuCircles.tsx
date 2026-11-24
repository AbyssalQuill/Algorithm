import { pickProblems } from '../data/problems'
import type { Example, Frame, ParseResult } from '../engine/types'
import { DsuView, runDsu, type DsuState } from './dsu'
import { fail, randInt, readInput } from './shared'

export interface CirclesInput {
  n: number
  pairs: [number, number][]
}

/** 数集合的个数：把每一对朋友关系当成一次“合并”，全部合并完以后，剩下的集合数就是答案 */
export function runCircles({ n, pairs }: CirclesInput): Frame<DsuState>[] {
  const frames = runDsu({ n, ops: pairs.map(([a, b]) => ({ kind: 'u' as const, a, b })) })
  const last = frames[frames.length - 1].state
  const sets = Array.from({ length: n }, (_, k) => k + 1).filter((i) => last.fa[i] === i).length
  frames.push({
    state: { ...last, op: null, cur: null, path: [], linked: null },
    step: 'done',
    note: `${pairs.length} 对关系都处理完了。每成功合并一次，集合数就少一个，最后还剩 ${sets} 个集合，也就是 ${sets} 个朋友圈。`,
  })
  return frames
}

function parse(text: string): ParseResult<CirclesInput> {
  return readInput(text, (r) => {
    const n = r.int('n', 3, 8)
    const m = r.int('m', 1, 7)
    const pairs: [number, number][] = []
    for (let k = 1; k <= m; k++) {
      const a = r.int(`第 ${k} 对关系的 a`, 1, n)
      const b = r.int(`第 ${k} 对关系的 b`, 1, n)
      if (a === b) fail('一对关系里的两个人不能是同一个人。')
      pairs.push([a, b])
    }
    r.end()
    return { n, pairs }
  })
}

export const countCircles = ({ n, pairs }: CirclesInput) => {
  const fa = Array.from({ length: n + 1 }, (_, i) => i)
  const find = (x: number): number => (fa[x] === x ? x : (fa[x] = find(fa[x])))
  for (const [a, b] of pairs) fa[find(a)] = find(b)
  return Array.from({ length: n }, (_, k) => k + 1).filter((i) => find(i) === i).length
}

export const dsuCircles: Example<CirclesInput, DsuState> = {
  slug: 'circles',
  name: '朋友圈',
  type: '连通块计数',
  statement: {
    desc: [
      '班上有 n 个同学，编号是 1 到 n。已知 m 对朋友关系，“朋友的朋友也是朋友”，所以只要能通过一连串的朋友关系连起来，就在同一个朋友圈里。求班上一共有多少个朋友圈。',
    ],
    input: ['第一行两个整数 n 和 m（3 ≤ n ≤ 8，1 ≤ m ≤ 7）。', '接下来 m 行，每行两个整数 a 和 b，表示 a 和 b 是朋友（1 ≤ a, b ≤ n，a ≠ b，同一对关系可能重复出现）。'],
    output: ['一行一个整数，是朋友圈的个数。'],
  },
  idea: [
    '一个朋友圈就是一个集合，“有朋友关系”就是把两个人所在的集合合并，要数的是最后剩下几个集合。所以这道题和上一道例题用的是同一套并查集，只是不再回答“是不是同一组”，而是统计集合的个数。',
    '一开始每个人自成一个圈，一共有 n 个集合，用 cnt 记录。处理每一对关系 a、b 时，先找到两人所在集合的根：根相同，说明已经在同一个圈里，什么也不用做；根不同，就把两个集合合并，集合少了一个，cnt 减一。全部处理完，cnt 就是答案。',
    '换一个角度看，这是在数无向图的连通块：把人看作结点，朋友关系看作边。上一个专题里用 DFS 数过岛屿，这里用并查集做同样的事，好处是关系可以一对一对地陆续读入，不用先把整张图存下来。',
  ],
  complexity: { time: 'O(m·α(n))', space: 'O(n)', note: 'α 是反阿克曼函数，增长极慢，可以看作常数。n 是人数，m 是关系的对数。' },
  presets: [
    { label: '分成两个圈', text: '6 4\n1 2\n3 4\n2 3\n5 6' },
    { label: '几乎互不认识', text: '5 1\n1 2' },
    { label: '全都连起来', text: '5 4\n1 2\n2 3\n3 4\n4 5' },
    { label: '重复的关系', text: '5 4\n1 2\n2 1\n3 4\n1 2' },
  ],
  defaultInput: { n: 7, pairs: [[1, 2], [3, 4], [2, 3], [5, 6]] },
  parse,
  format: (v) => `${v.n} ${v.pairs.length}\n${v.pairs.map(([a, b]) => `${a} ${b}`).join('\n')}`,
  random: () => {
    const n = randInt(4, 8)
    const pairs: [number, number][] = Array.from({ length: randInt(2, 7) }, () => {
      const a = randInt(1, n)
      let b = randInt(1, n)
      while (b === a) b = randInt(1, n)
      return [a, b]
    })
    return { n, pairs }
  },
  answer: (v) => String(countCircles(v)),
  run: runCircles,
  View: DsuView,
  sources: {
    c: String.raw`
#include <stdio.h>
int fa[1005],sz[1005];
int find(int x){
    if (fa[x]==x) return x;                 //@root
    int r=find(fa[x]);                      //@climb
    fa[x]=r;                                //@compress
    return r;
}
int main(){
    int n,m,a,b;
    scanf("%d %d",&n,&m);
    for (int i=1;i<=n;i++){
        fa[i]=i;                            //@init
        sz[i]=1;
    }
    int cnt=n;
    while (m--){
        scanf("%d %d",&a,&b);
        a=find(a);                          //@roots
        b=find(b);
        if (a==b) continue;                 //@same
        if (sz[a]<sz[b]){
            int t=a;
            a=b;
            b=t;
        }
        fa[b]=a;                            //@link
        sz[a]+=sz[b];                       //@link
        cnt--;                              //@link
    }
    printf("%d\n",cnt);                     //@done
    return 0;
}
`,
    cpp: String.raw`
#include <bits/stdc++.h>
using namespace std;
int fa[1005],sz[1005];
int find(int x){
    if (fa[x]==x) return x;                 //@root
    int r=find(fa[x]);                      //@climb
    fa[x]=r;                                //@compress
    return r;
}
int main(){
    int n,m,a,b;
    cin>>n>>m;
    for (int i=1;i<=n;i++){
        fa[i]=i;                            //@init
        sz[i]=1;
    }
    int cnt=n;
    while (m--){
        cin>>a>>b;
        a=find(a);                          //@roots
        b=find(b);
        if (a==b) continue;                 //@same
        if (sz[a]<sz[b]) swap(a,b);
        fa[b]=a;                            //@link
        sz[a]+=sz[b];                       //@link
        cnt--;                              //@link
    }
    cout<<cnt<<endl;                        //@done
    return 0;
}
`,
    python: String.raw`
def find(x):
    if fa[x]==x:
        return x                            #@root
    r=find(fa[x])                           #@climb
    fa[x]=r                                 #@compress
    return r

n,m=map(int,input().split())
fa=list(range(n+1))                         #@init
sz=[1]*(n+1)
cnt=n
for _ in range(m):
    a,b=map(int,input().split())
    a=find(a)                               #@roots
    b=find(b)
    if a==b:
        continue                            #@same
    if sz[a]<sz[b]:
        a,b=b,a
    fa[b]=a                                 #@link
    sz[a]+=sz[b]                            #@link
    cnt-=1                                  #@link
print(cnt)                                  #@done
`,
    java: String.raw`
import java.util.*;

public class Main{
    static int[] fa=new int[1005],sz=new int[1005];

    static int find(int x){
        if (fa[x]==x) return x;             //@root
        int r=find(fa[x]);                  //@climb
        fa[x]=r;                            //@compress
        return r;
    }

    public static void main(String[] args){
        Scanner sc=new Scanner(System.in);
        int n=sc.nextInt(),m=sc.nextInt();
        for (int i=1;i<=n;i++){
            fa[i]=i;                        //@init
            sz[i]=1;
        }
        int cnt=n;
        while (m-- > 0){
            int a=find(sc.nextInt());       //@roots
            int b=find(sc.nextInt());
            if (a==b) continue;             //@same
            if (sz[a]<sz[b]){
                int t=a;
                a=b;
                b=t;
            }
            fa[b]=a;                        //@link
            sz[a]+=sz[b];                   //@link
            cnt--;                          //@link
        }
        System.out.println(cnt);            //@done
    }
}
`,
  },
  problems: pickProblems('P1536', 'P1111'),
}
