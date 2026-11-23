import { Stats } from '../components/Stats'
import { TreeView, type TNode } from '../components/TreeView'
import { pickProblems } from '../data/problems'
import { Recorder } from '../engine/recorder'
import type { AlgoDef, Frame, ParseResult } from '../engine/types'
import { randInt, splitBar, toNums } from './shared'

export interface BstInput {
  vals: number[]
  target: number
}

interface BNode {
  id: number
  v: number
  l: number | null
  r: number | null
}

export interface BstState {
  nodes: BNode[]
  root: number | null
  /** 当前正在比较的结点 */
  cur: number | null
  /** 这次操作已经走过的结点 */
  path: number[]
  /** 刚刚插入的结点 */
  fresh: number | null
  /** 查找成功时找到的结点 */
  found: number | null
  x: number | null
  phase: 'insert' | 'search' | 'done'
  compares: number
  result: 'none' | 'hit' | 'miss'
}

export const height = (nodes: BNode[], id: number | null): number => {
  if (id === null) return 0
  const n = nodes.find((q) => q.id === id)!
  return 1 + Math.max(height(nodes, n.l), height(nodes, n.r))
}

export const preorderOf = (s: BstState): number[] => {
  const out: number[] = []
  const walk = (id: number | null) => {
    if (id === null) return
    const n = s.nodes.find((q) => q.id === id)!
    out.push(n.v)
    walk(n.l)
    walk(n.r)
  }
  walk(s.root)
  return out
}

export function runBst({ vals, target }: BstInput): Frame<BstState>[] {
  const rec = new Recorder<BstState>()
  const nodes: BNode[] = []
  let root: number | null = null
  let cur: number | null = null
  let path: number[] = []
  let fresh: number | null = null
  let found: number | null = null
  let x: number | null = null
  let phase: BstState['phase'] = 'insert'
  let compares = 0
  let result: BstState['result'] = 'none'
  const snap = (): BstState => ({ nodes, root, cur, path, fresh, found, x, phase, compares, result })
  const get = (id: number) => nodes.find((n) => n.id === id)!

  rec.push('init', snap(), `二叉搜索树的规则：每个结点左子树里的数都比它小，右子树里的数都比它大。先依次插入 ${vals.join('、')}，再查找 ${target}。`)
  for (const v of vals) {
    x = v
    cur = null
    path = []
    fresh = null
    compares = 0
    rec.push('ins', snap(), root === null ? `插入 ${v}：树还是空的。` : `插入 ${v}：从根结点出发，一路比较，直到找到一个空位。`)
    let at = root
    let parent: number | null = null
    let goLeft = false
    while (at !== null) {
      const n = get(at)
      cur = at
      compares++
      if (v < n.v) {
        rec.push('goLeft', snap(), `${v} < ${n.v}，应该放在 ${n.v} 的左边，进入左子树。`)
        path = [...path, at]
        parent = at
        goLeft = true
        at = n.l
      } else {
        rec.push('goRight', snap(), `${v} > ${n.v}，应该放在 ${n.v} 的右边，进入右子树。`)
        path = [...path, at]
        parent = at
        goLeft = false
        at = n.r
      }
    }
    const id = nodes.length
    nodes.push({ id, v, l: null, r: null })
    if (parent === null) root = id
    else if (goLeft) get(parent).l = id
    else get(parent).r = id
    cur = id
    fresh = id
    rec.push('place', snap(), parent === null ? `空树里放进第一个结点，它就是根。` : `走到了空位，新结点 ${v} 就挂在 ${get(parent).v} 的${goLeft ? '左' : '右'}边。`)
  }
  phase = 'search'
  x = target
  cur = null
  path = []
  fresh = null
  compares = 0
  rec.push('sStart', snap(), `树建好了。现在查找 ${target}：同样从根开始，比目标大就往左找，比目标小就往右找。`)
  let at = root
  while (at !== null) {
    const n = get(at)
    cur = at
    compares++
    if (target === n.v) {
      found = at
      result = 'hit'
      rec.push('hit', snap(), `${target} 等于 ${n.v}，找到了。一共比较了 ${compares} 次。`)
      break
    }
    path = [...path, at]
    rec.push('sgo', snap(), target < n.v ? `${target} < ${n.v}，目标只可能在左子树里，向左走。` : `${target} > ${n.v}，目标只可能在右子树里，向右走。`)
    at = target < n.v ? n.l : n.r
  }
  if (found === null) {
    cur = null
    result = 'miss'
    rec.push('miss', snap(), `走到了空位，说明树里没有 ${target}。一共比较了 ${compares} 次。`)
  }
  phase = 'done'
  cur = null
  const s = snap()
  rec.push('done', s, `前序遍历（根、左、右）的结果是：${preorderOf(s).join(' ')}。查找 ${target} 的结果是：${result === 'hit' ? '找到' : '没有'}。`)
  return rec.frames
}

function BstView({ frame }: { frame: Frame<BstState> }) {
  const s = frame.state
  const onPath = new Set(s.path)
  const tn: TNode[] = s.nodes.map((n) => ({
    id: n.id,
    label: n.v,
    left: n.l,
    right: n.r,
    tone: n.id === s.found || n.id === s.fresh ? 'found' : n.id === s.cur ? 'compare' : onPath.has(n.id) ? 'done' : 'idle',
    edge: onPath.has(n.id) || n.id === s.cur || n.id === s.fresh ? 'done' : 'idle',
  }))
  return (
    <div className="viz">
      <div className="target-row">
        <span className="target-chip">
          {s.phase === 'insert' ? '正在插入' : s.phase === 'search' ? '正在查找' : '完成'}
          {s.x !== null && s.phase !== 'done' && <b> {s.x}</b>}
        </span>
        {s.result === 'hit' && <span className="verdict ok">找到了</span>}
        {s.result === 'miss' && <span className="verdict bad">树里没有这个数</span>}
      </div>
      <TreeView nodes={tn} root={s.root} mode="binary" levels={5} maxSlots={9} />
      <Stats
        items={[
          ['结点数', s.nodes.length],
          ['树的高度', height(s.nodes, s.root)],
          ['这次比较了', s.compares],
        ]}
      />
    </div>
  )
}

function parse(text: string): ParseResult<BstInput> {
  const parts = splitBar(text)
  if (parts.length !== 2) return { ok: false, error: '格式是「依次插入的数 | 要查找的数」，例如：50 30 70 20 40 | 40' }
  const vals = toNums(parts[0])
  const t = toNums(parts[1])
  if (vals.length < 1 || vals.length > 9) return { ok: false, error: '请放 1～9 个要插入的数。' }
  if (t.length !== 1) return { ok: false, error: '“|”右边只放一个要查找的数。' }
  if ([...vals, t[0]].some((v) => !Number.isInteger(v) || v < 1 || v > 99)) return { ok: false, error: '所有的数都是 1～99 的整数。' }
  if (new Set(vals).size !== vals.length) return { ok: false, error: '演示里插入的数请互不相同（相同的数会被忽略）。' }
  return { ok: true, value: { vals, target: t[0] } }
}

export const bst: AlgoDef<BstInput, BstState> = {
  id: 'bst',
  title: '二叉搜索树：插入与查找',
  tagline: '每个结点的左边都比它小、右边都比它大，查找时每一步都能排除一半',
  kind: '数据结构',
  intro: [
    '二叉搜索树是一棵二叉树，并且满足一条规则：任意结点的左子树里所有的数都比它小，右子树里所有的数都比它大。这条规则让查找变得很像二分查找：把目标和当前结点比较，比它小就只可能在左边，比它大就只可能在右边，一步就排除了一整棵子树。',
    '插入同样依靠这条规则。新来的数从根开始，沿着“小了往左、大了往右”的路线一直走到空位，就挂在那里。所以树的形状取决于数据插入的顺序：顺序比较均匀时，树很矮，查找很快；如果数据本来就有序，树会退化成一条链，查找也就退化成了逐个比较。',
  ],
  points: [
    '结点用一个结构体表示：存放数据，加上指向左右孩子的指针，空指针表示没有孩子。',
    '插入可以写成递归：空位就创建新结点；否则比较大小，递归地插入左子树或者右子树。',
    '查找不需要递归，用一个循环沿着路线向下走，走到空指针就说明没有。',
    '对二叉搜索树做中序遍历（左、根、右），得到的恰好是从小到大排好的序列，这是它名字里“搜索”之外的另一个重要性质。',
  ],
  pitfalls: [
    '数据已经有序（比如 1 2 3 4 5）时，树会变成一条链，高度等于结点数，所有操作都退化成 O(n)。比赛里常用平衡树，或者直接用 set / map（它们的底层是红黑树）。',
    '对相等的数要先约定怎么办：忽略、放进左边或者记录出现次数，否则同一个数可能被重复插入。',
    '递归插入时，忘记把递归的返回值赋回给 root->l 或 root->r，新结点就没有挂到树上。',
  ],
  complexity: { time: 'O(log n)', space: 'O(n)', note: '这是树比较矮（接近平衡）时每次操作的时间；最坏情况树退化成链，每次操作是 O(n)。空间是存放全部结点所需的。' },
  inputHint: '格式：依次插入的数 | 要查找的数，例如 50 30 70 20 40 60 80 | 60（最多 9 个互不相同的数）。',
  presets: [
    { label: '比较均匀', text: '50 30 70 20 40 60 80 | 60' },
    { label: '退化成链', text: '10 20 30 40 50 | 50' },
    { label: '查找不到', text: '25 15 40 10 20 35 | 33' },
  ],
  defaultInput: { vals: [50, 30, 70, 20, 40, 60, 80], target: 60 },
  parse,
  format: (v) => `${v.vals.join(' ')} | ${v.target}`,
  random: () => {
    const set = new Set<number>()
    const n = randInt(6, 9)
    while (set.size < n) set.add(randInt(1, 99))
    const vals = [...set]
    return { vals, target: Math.random() < 0.6 ? vals[randInt(0, n - 1)] : randInt(1, 99) }
  },
  run: runBst,
  View: BstView,
  sources: {
    c: String.raw`
#include <stdio.h>
#include <stdlib.h>
typedef struct Node{
    int val;
    struct Node *l,*r;
} Node;
Node* insert(Node* root,int x){
    if (!root){                                 //@place
        Node* p=(Node*)malloc(sizeof(Node));    //@place
        p->val=x;                               //@place
        p->l=p->r=NULL;                         //@place
        return p;                               //@place
    }
    if (x<root->val) root->l=insert(root->l,x);         //@goLeft
    else if (x>root->val) root->r=insert(root->r,x);    //@goRight
    return root;
}
int search(Node* root,int x){
    while (root){
        if (x==root->val) return 1;             //@hit
        root=x<root->val?root->l:root->r;       //@sgo
    }
    return 0;                                   //@miss
}
void preorder(Node* root){
    if (!root) return;
    printf("%d ",root->val);
    preorder(root->l);
    preorder(root->r);
}
int main(){
    int n,t,x;
    Node* root=NULL;                            //@init
    scanf("%d",&n);
    for (int i=0;i<n;i++){
        scanf("%d",&x);
        root=insert(root,x);                    //@ins
    }
    scanf("%d",&t);
    int found=search(root,t);                   //@sStart
    preorder(root);
    printf("\n%s\n",found?"YES":"NO");          //@done
    return 0;
}
`,
    cpp: String.raw`
#include <bits/stdc++.h>
using namespace std;
struct Node{
    int val;
    Node *l,*r;
    Node(int v):val(v),l(nullptr),r(nullptr){}
};
Node* insert(Node* root,int x){
    if (!root) return new Node(x);              //@place
    if (x<root->val) root->l=insert(root->l,x);         //@goLeft
    else if (x>root->val) root->r=insert(root->r,x);    //@goRight
    return root;
}
bool search(Node* root,int x){
    while (root){
        if (x==root->val) return true;          //@hit
        root=x<root->val?root->l:root->r;       //@sgo
    }
    return false;                               //@miss
}
void preorder(Node* root){
    if (!root) return;
    cout<<root->val<<" ";
    preorder(root->l);
    preorder(root->r);
}
int main(){
    int n,t,x;
    Node* root=nullptr;                         //@init
    cin>>n;
    for (int i=0;i<n;i++){
        cin>>x;
        root=insert(root,x);                    //@ins
    }
    cin>>t;
    bool found=search(root,t);                  //@sStart
    preorder(root);
    cout<<endl<<(found?"YES":"NO")<<endl;       //@done
    return 0;
}
`,
    python: String.raw`
class Node:
    def __init__(self, v):
        self.val = v
        self.l = None
        self.r = None


def insert(root, x):
    if root is None:
        return Node(x)                          #@place
    if x < root.val:
        root.l = insert(root.l, x)              #@goLeft
    elif x > root.val:
        root.r = insert(root.r, x)              #@goRight
    return root


def search(root, x):
    while root is not None:
        if x == root.val:
            return True                         #@hit
        root = root.l if x < root.val else root.r   #@sgo
    return False                                #@miss


def preorder(root, out):
    if root is None:
        return
    out.append(root.val)
    preorder(root.l, out)
    preorder(root.r, out)


n = int(input())
nums = list(map(int, input().split()))
t = int(input())
root = None                                     #@init
for x in nums:
    root = insert(root, x)                      #@ins
found = search(root, t)                         #@sStart
out = []
preorder(root, out)
print(*out)
print("YES" if found else "NO")                  #@done
`,
    java: String.raw`
import java.util.*;

public class Main {
    static class Node {
        int val;
        Node l, r;
        Node(int v) { val = v; }
    }

    static Node insert(Node root, int x) {
        if (root == null) return new Node(x);               //@place
        if (x < root.val) root.l = insert(root.l, x);       //@goLeft
        else if (x > root.val) root.r = insert(root.r, x);  //@goRight
        return root;
    }

    static boolean search(Node root, int x) {
        while (root != null) {
            if (x == root.val) return true;                 //@hit
            root = x < root.val ? root.l : root.r;          //@sgo
        }
        return false;                                       //@miss
    }

    static void preorder(Node root, StringBuilder sb) {
        if (root == null) return;
        sb.append(root.val).append(' ');
        preorder(root.l, sb);
        preorder(root.r, sb);
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        Node root = null;                                   //@init
        for (int i = 0; i < n; i++) {
            root = insert(root, sc.nextInt());              //@ins
        }
        int t = sc.nextInt();
        boolean found = search(root, t);                    //@sStart
        StringBuilder sb = new StringBuilder();
        preorder(root, sb);
        System.out.println(sb);
        System.out.println(found ? "YES" : "NO");           //@done
    }
}
`,
  },
  problems: pickProblems('P5076', 'P3369'),
}
