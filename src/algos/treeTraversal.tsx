import { Stats } from '../components/Stats'
import { TreeView, type TNode } from '../components/TreeView'
import { pickProblems } from '../data/problems'
import { Recorder } from '../engine/recorder'
import type { AlgoDef, Frame, ParseResult } from '../engine/types'
import { fail, randInt, readInput } from './shared'

/** 按“层序”给出的二叉树：0 表示这个位置没有结点 */
export type LevelTree = number[]

interface TTNode {
  id: number
  v: number
  l: number | null
  r: number | null
}

export type Order = 'pre' | 'in' | 'post' | 'level'

export interface TravState {
  nodes: TTNode[]
  root: number | null
  order: Order | null
  cur: number | null
  visited: number[]
  outputs: Record<Order, number[]>
}

/** 把层序数组建成树：第 i 个结点的孩子，依次取数组里接下来的两个位置（0 表示空） */
export function buildTree(level: LevelTree): { nodes: TTNode[]; root: number | null } {
  const nodes: TTNode[] = []
  if (level.length === 0 || level[0] === 0) return { nodes, root: null }
  nodes.push({ id: 0, v: level[0], l: null, r: null })
  const queue = [0]
  let p = 1
  while (queue.length > 0 && p < level.length) {
    const u = queue.shift()!
    for (const side of ['l', 'r'] as const) {
      if (p >= level.length) break
      const val = level[p++]
      if (val !== 0) {
        const id = nodes.length
        nodes.push({ id, v: val, l: null, r: null })
        nodes[u][side] = id
        queue.push(id)
      }
    }
  }
  return { nodes, root: 0 }
}

const NAME: Record<Order, string> = { pre: '前序（根、左、右）', in: '中序（左、根、右）', post: '后序（左、右、根）', level: '层序（一层一层，从左到右）' }

export function runTraversal(level: LevelTree): Frame<TravState>[] {
  const rec = new Recorder<TravState>()
  const { nodes, root } = buildTree(level)
  const outputs: Record<Order, number[]> = { pre: [], in: [], post: [], level: [] }
  let order: Order | null = null
  let cur: number | null = null
  let visited: number[] = []
  const snap = (): TravState => ({ nodes, root, order, cur, visited, outputs })
  const get = (id: number) => nodes[id]

  rec.push('init', snap(), `这棵二叉树有 ${nodes.length} 个结点。“遍历”就是把每个结点恰好访问一遍，访问的顺序不同，得到的序列也不同。下面依次看前序、中序、后序和层序四种。`)
  const visit = (step: Order, id: number) => {
    order = step
    cur = id
    visited = [...visited, id]
    outputs[step].push(get(id).v)
    const notes: Record<Order, string> = {
      pre: `前序：先访问根。到达 ${get(id).v} 时立刻输出它，然后才去处理左子树和右子树。`,
      in: `中序：左子树已经全部处理完了，现在轮到 ${get(id).v}，输出它，然后去处理右子树。`,
      post: `后序：左右子树都处理完了，最后才输出 ${get(id).v} 自己。`,
      level: `层序：队头是 ${get(id).v}，输出它，再把它的孩子依次放进队尾。`,
    }
    rec.push(step, snap(), notes[step])
  }
  const pre = (id: number | null) => {
    if (id === null) return
    visit('pre', id)
    pre(get(id).l)
    pre(get(id).r)
  }
  const inorder = (id: number | null) => {
    if (id === null) return
    inorder(get(id).l)
    visit('in', id)
    inorder(get(id).r)
  }
  const post = (id: number | null) => {
    if (id === null) return
    post(get(id).l)
    post(get(id).r)
    visit('post', id)
  }
  visited = []
  pre(root)
  visited = []
  inorder(root)
  visited = []
  post(root)
  visited = []
  if (root !== null) {
    const q = [root]
    while (q.length > 0) {
      const u = q.shift()!
      visit('level', u)
      if (get(u).l !== null) q.push(get(u).l as number)
      if (get(u).r !== null) q.push(get(u).r as number)
    }
  }
  cur = null
  order = null
  visited = []
  rec.push('done', snap(), `四种遍历都完成了。同一棵树，前序是 ${outputs.pre.join(' ')}，中序是 ${outputs.in.join(' ')}，后序是 ${outputs.post.join(' ')}，层序是 ${outputs.level.join(' ')}。`)
  return rec.frames
}

function TravView({ frame }: { frame: Frame<TravState> }) {
  const s = frame.state
  const seen = new Set(s.visited)
  const tn: TNode[] = s.nodes.map((n) => ({
    id: n.id,
    label: n.v,
    left: n.l,
    right: n.r,
    tone: n.id === s.cur ? 'swap' : seen.has(n.id) ? 'done' : 'idle',
    edge: seen.has(n.id) ? 'done' : 'idle',
  }))
  const orders: Order[] = ['pre', 'in', 'post', 'level']
  return (
    <div className="viz">
      <TreeView nodes={tn} root={s.root} mode="binary" levels={4} maxSlots={8} />
      {orders.map((o) => (
        <div key={o} className={`trav-row${s.order === o ? ' is-now' : ''}`}>
          <span className="trav-name">{NAME[o]}</span>
          <span className="trav-out">
            {s.outputs[o].length === 0 ? <span className="qrow-empty">—</span> : s.outputs[o].map((v, i) => <span key={i} className="qchip">{v}</span>)}
          </span>
        </div>
      ))}
      <Stats items={[['结点数', s.nodes.length]]} />
    </div>
  )
}

function parse(text: string): ParseResult<LevelTree> {
  return readInput(text, (r) => {
    const n = r.int('n', 1, 20)
    const v = r.ints(n, '结点', 0, 99)
    r.end()
    if (v[0] === 0) fail('第一个数是根结点，不能是 0。')
    if (buildTree(v).nodes.length > 10) fail('演示最多画 10 个结点。')
    return v
  })
}

export const treeTraversal: AlgoDef<LevelTree, TravState> = {
  id: 'tree-traversal',
  title: '二叉树遍历',
  tagline: '同一棵树，按不同的顺序把每个结点走一遍，得到前序、中序、后序和层序四种序列',
  kind: '数据结构',
  slug: 'orders',
  name: '四种遍历',
  type: '遍历序列',
  statement: {
    desc: [
      '给定一棵二叉树，依次输出它的前序、中序、后序和层序遍历。树按层序给出：从上到下、从左到右写出每个位置上的结点，某个位置没有结点就写 0，不存在的结点也就没有孩子，后面不会再为它占位。',
    ],
    input: [
      '第一行一个整数 n（1 ≤ n ≤ 20），表示序列的长度。',
      '第二行 n 个整数，结点的值在 1～99 之间，0 表示这个位置没有结点。第一个数是根，不能是 0；结点总数不超过 10。',
    ],
    output: [
      '四行，依次是前序、中序、后序和层序遍历的结果，每行的数用空格隔开。',
    ],
  },
  intro: [
    '遍历是处理树的基本功：把每个结点恰好访问一次。对于二叉树，最常用的是三种深度优先的顺序，区别只在于“根”在什么时候被访问：前序是根、左、右，中序是左、根、右，后序是左、右、根。它们都可以用一个递归函数写出来，三种写法只差“输出这一句放在哪里”。',
    '还有一种按层访问的层序遍历，从上到下、同一层从左到右。它不是递归，而是靠队列：取出队头访问，再把它的左右孩子放到队尾，这正是广度优先搜索在树上的样子。',
  ],
  points: [
    '前序遍历的第一个数一定是根；后序遍历的最后一个数一定是根。',
    '对二叉搜索树做中序遍历，得到的恰好是从小到大排好的序列。',
    '已知前序和中序（或者后序和中序）可以唯一确定一棵树，但只知道前序和后序不行。',
    '层序遍历用队列实现，深度优先遍历用递归（本质是栈）。',
  ],
  pitfalls: [
    '递归函数忘记处理空结点（root 为空时直接返回），会访问到空指针而崩溃。',
    '树的深度很大（比如一条链有十万个结点）时，递归会爆栈，需要改成手动用栈或者队列。',
    '三种遍历顺序容易记混，记住“前、中、后”指的是根的位置。',
  ],
  complexity: { time: 'O(n)', space: 'O(h)', note: '每个结点只访问一次。空间是递归的深度 h（层序遍历是队列的大小）。' },
  presets: [
    { label: '一般的树', text: '7\n1 2 3 4 5 0 6' },
    { label: '完全二叉树', text: '7\n1 2 3 4 5 6 7' },
    { label: '只往左长', text: '6\n1 2 0 3 0 4' },
  ],
  defaultInput: [1, 2, 3, 4, 5, 0, 6],
  parse,
  format: (v) => `${v.length}\n${v.join(' ')}`,
  answer: (v) => {
    interface N {
      val: number
      l?: N
      r?: N
    }
    const root: N = { val: v[0] }
    const q = [root]
    let p = 1
    while (q.length && p < v.length) {
      const u = q.shift()!
      if (p < v.length && v[p]) q.push((u.l = { val: v[p] }))
      p++
      if (p < v.length && v[p]) q.push((u.r = { val: v[p] }))
      p++
    }
    const pre = (n?: N): number[] => (n ? [n.val, ...pre(n.l), ...pre(n.r)] : [])
    const ino = (n?: N): number[] => (n ? [...ino(n.l), n.val, ...ino(n.r)] : [])
    const post = (n?: N): number[] => (n ? [...post(n.l), ...post(n.r), n.val] : [])
    const lev: number[] = []
    for (const w = [root]; w.length; ) {
      const u = w.shift()!
      lev.push(u.val)
      if (u.l) w.push(u.l)
      if (u.r) w.push(u.r)
    }
    return [pre(root), ino(root), post(root), lev].map((a) => a.join(' ')).join('\n')
  },
  random: () => {
    for (;;) {
      const total = randInt(5, 9)
      const pool = new Set<number>()
      while (pool.size < total) pool.add(randInt(1, 30))
      const vals = [...pool]
      const out: number[] = [vals.pop()!]
      // 按层序一个结点一个结点地决定左右孩子是否存在（和输入格式一致）
      let waiting = 1
      let count = 1
      while (count < total && waiting > 0) {
        waiting--
        for (let k = 0; k < 2; k++) {
          if (count < total && Math.random() < 0.7) {
            out.push(vals.pop()!)
            count++
            waiting++
          } else out.push(0)
        }
      }
      while (out.length > 0 && out[out.length - 1] === 0) out.pop()
      if (count >= 5 && out.length <= 15) return out
    }
  },
  run: runTraversal,
  View: TravView,
  sources: {
    c: String.raw`
#include <stdio.h>
#include <stdlib.h>
typedef struct Node{
    int val;
    struct Node *l,*r;
} Node;
Node* newNode(int v){
    Node* p=(Node*)malloc(sizeof(Node));
    p->val=v; p->l=p->r=NULL;
    return p;
}
void pre(Node* r){
    if (!r) return;
    printf("%d ",r->val);                   //@pre
    pre(r->l);
    pre(r->r);
}
void in(Node* r){
    if (!r) return;
    in(r->l);
    printf("%d ",r->val);                   //@in
    in(r->r);
}
void post(Node* r){
    if (!r) return;
    post(r->l);
    post(r->r);
    printf("%d ",r->val);                   //@post
}
int main(){
    int n,a[105];
    Node* q[105];
    scanf("%d",&n);
    for (int i=0;i<n;i++) scanf("%d",&a[i]);
    Node* root=newNode(a[0]);               //@init
    int head=0,tail=0,p=1;
    q[tail++]=root;
    while (head<tail&&p<n){
        Node* u=q[head++];
        if (p<n&&a[p]) q[tail++]=u->l=newNode(a[p]);
        p++;
        if (p<n&&a[p]) q[tail++]=u->r=newNode(a[p]);
        p++;
    }
    pre(root);
    printf("\n");
    in(root);
    printf("\n");
    post(root);
    printf("\n");
    head=tail=0;
    q[tail++]=root;
    while (head<tail){
        Node* u=q[head++];
        printf("%d ",u->val);               //@level
        if (u->l) q[tail++]=u->l;
        if (u->r) q[tail++]=u->r;
    }
    printf("\n");                           //@done
    return 0;
}
`,
    cpp: String.raw`
#include <bits/stdc++.h>
using namespace std;
struct Node{
    int val;
    Node *l=nullptr,*r=nullptr;
    Node(int v):val(v){}
};
void pre(Node* r){
    if (!r) return;
    cout<<r->val<<" ";                      //@pre
    pre(r->l);
    pre(r->r);
}
void in(Node* r){
    if (!r) return;
    in(r->l);
    cout<<r->val<<" ";                      //@in
    in(r->r);
}
void post(Node* r){
    if (!r) return;
    post(r->l);
    post(r->r);
    cout<<r->val<<" ";                      //@post
}
int main(){
    int n;
    cin>>n;
    vector<int> a(n);
    for (int &x:a) cin>>x;
    Node* root=new Node(a[0]);              //@init
    queue<Node*> q;
    q.push(root);
    int p=1;
    while (!q.empty()&&p<n){
        Node* u=q.front();
        q.pop();
        if (p<n&&a[p]){
            u->l=new Node(a[p]);
            q.push(u->l);
        }
        p++;
        if (p<n&&a[p]){
            u->r=new Node(a[p]);
            q.push(u->r);
        }
        p++;
    }
    pre(root);
    cout<<endl;
    in(root);
    cout<<endl;
    post(root);
    cout<<endl;
    q=queue<Node*>();
    q.push(root);
    while (!q.empty()){
        Node* u=q.front();
        q.pop();
        cout<<u->val<<" ";                  //@level
        if (u->l) q.push(u->l);
        if (u->r) q.push(u->r);
    }
    cout<<endl;                             //@done
    return 0;
}
`,
    python: String.raw`
from collections import deque

class Node:
    def __init__(self,v):
        self.val=v
        self.l=None
        self.r=None

def pre(r,out):
    if r is None:
        return
    out.append(r.val)                       #@pre
    pre(r.l,out)
    pre(r.r,out)

def inorder(r,out):
    if r is None:
        return
    inorder(r.l,out)
    out.append(r.val)                       #@in
    inorder(r.r,out)

def post(r,out):
    if r is None:
        return
    post(r.l,out)
    post(r.r,out)
    out.append(r.val)                       #@post

n=int(input())
a=list(map(int,input().split()))
root=Node(a[0])                             #@init
q=deque([root])
p=1
while q and p<n:
    u=q.popleft()
    if p<n and a[p]:
        u.l=Node(a[p])
        q.append(u.l)
    p+=1
    if p<n and a[p]:
        u.r=Node(a[p])
        q.append(u.r)
    p+=1
for f in (pre,inorder,post):
    out=[]
    f(root,out)
    print(*out)
q=deque([root])
out=[]
while q:
    u=q.popleft()
    out.append(u.val)                       #@level
    if u.l:
        q.append(u.l)
    if u.r:
        q.append(u.r)
print(*out)                                 #@done
`,
    java: String.raw`
import java.util.*;

public class Main{
    static class Node{
        int val;
        Node l,r;
        Node(int v){
            val=v;
        }
    }

    static StringBuilder sb=new StringBuilder();

    static void pre(Node r){
        if (r==null) return;
        sb.append(r.val).append(' ');       //@pre
        pre(r.l);
        pre(r.r);
    }

    static void in(Node r){
        if (r==null) return;
        in(r.l);
        sb.append(r.val).append(' ');       //@in
        in(r.r);
    }

    static void post(Node r){
        if (r==null) return;
        post(r.l);
        post(r.r);
        sb.append(r.val).append(' ');       //@post
    }

    public static void main(String[] args){
        Scanner sc=new Scanner(System.in);
        int n=sc.nextInt();
        int[] a=new int[n];
        for (int i=0;i<n;i++) a[i]=sc.nextInt();
        Node root=new Node(a[0]);           //@init
        Queue<Node> q=new ArrayDeque<>();
        q.add(root);
        int p=1;
        while (!q.isEmpty()&&p<n){
            Node u=q.poll();
            if (p<n&&a[p]!=0){
                u.l=new Node(a[p]);
                q.add(u.l);
            }
            p++;
            if (p<n&&a[p]!=0){
                u.r=new Node(a[p]);
                q.add(u.r);
            }
            p++;
        }
        pre(root);
        sb.append('\n');
        in(root);
        sb.append('\n');
        post(root);
        sb.append('\n');
        q.clear();
        q.add(root);
        while (!q.isEmpty()){
            Node u=q.poll();
            sb.append(u.val).append(' ');   //@level
            if (u.l!=null) q.add(u.l);
            if (u.r!=null) q.add(u.r);
        }
        System.out.println(sb);             //@done
    }
}
`,
  },
  problems: pickProblems('P1305', 'P5076'),
}
