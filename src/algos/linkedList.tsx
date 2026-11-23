import { ListView, type LNode, type LPointer } from '../components/ListView'
import { Stats } from '../components/Stats'
import { pickProblems } from '../data/problems'
import { Recorder } from '../engine/recorder'
import type { AlgoDef, Frame } from '../engine/types'
import { parseList, randInt, randList } from './shared'

interface LN {
  id: number
  v: number
  next: number | null
}

export interface ListState {
  nodes: LN[]
  /** 原来从头到尾的位置顺序（用来固定每个结点在画面上的位置） */
  order: number[]
  prev: number | null
  cur: number | null
  nxt: number | null
  /** 已经掉过头的结点 */
  flipped: number[]
  head: number | null
  finished: boolean
}

export function runReverse(input: number[]): Frame<ListState>[] {
  const rec = new Recorder<ListState>()
  const nodes: LN[] = input.map((v, id) => ({ id, v, next: id + 1 < input.length ? id + 1 : null }))
  const order = nodes.map((x) => x.id)
  let prev: number | null = null
  let cur: number | null = 0
  let nxt: number | null = null
  const flipped: number[] = []
  let head: number | null = 0
  let finished = false
  const snap = (): ListState => ({ nodes, order, prev, cur, nxt, flipped, head, finished })

  rec.push('init', snap(), '要把链表 1→2→3→… 反转成 …→3→2→1。做法是让每个结点的 next 指针掉头指向前一个结点。用 prev 表示已经反转好的那一段的头，cur 表示当前处理的结点，开始时 prev 是空，cur 是头结点。')
  while (cur !== null) {
    const c: number = cur
    nxt = nodes[c].next
    rec.push('save', snap(), `先把 ${nodes[c].v} 的下一个结点记在 nxt 里${nxt === null ? '（这里是空，已经是最后一个了）' : `（${nodes[nxt].v}）`}。因为马上要改动 next 指针，不先记住的话，后面的结点就找不到了。`)
    nodes[c].next = prev
    flipped.push(c)
    rec.push('flip', snap(), `让 ${nodes[c].v} 的 next 掉头，指向 prev${prev === null ? '（空）' : `（${nodes[prev].v}）`}。这条箭头反过来之后，${nodes[c].v} 就接到了已经反转好的那一段的前面。`)
    prev = c
    cur = nxt
    nxt = null
    rec.push('move', snap(), `prev 前进到 ${nodes[c].v}，cur 前进到${cur === null ? '空，所有结点都处理完了' : ` ${nodes[cur].v}，继续处理下一个`}。`)
  }
  head = prev
  finished = true
  rec.push('done', snap(), `cur 变成了空，循环结束。prev 指向的就是原来的最后一个结点，现在它是新链表的头：返回 prev。整条链表只被扫描了一遍，也没有借用额外的空间。`)
  return rec.frames
}

export const listToArray = (s: ListState): number[] => {
  const out: number[] = []
  let at = s.head
  while (at !== null) {
    out.push(s.nodes[at].v)
    at = s.nodes[at].next
  }
  return out
}

function ListDemoView({ frame }: { frame: Frame<ListState> }) {
  const s = frame.state
  const done = new Set(s.flipped)
  const nodes: LNode[] = s.nodes.map((n) => ({
    id: n.id,
    label: n.v,
    next: n.next,
    tone: n.id === s.cur ? 'compare' : done.has(n.id) ? 'done' : 'idle',
    arrow: done.has(n.id) ? 'done' : 'idle',
  }))
  const pointers: LPointer[] = []
  if (s.prev !== null) pointers.push({ name: 'prev', id: s.prev, tone: 'done' })
  if (s.cur !== null) pointers.push({ name: 'cur', id: s.cur, tone: 'compare' })
  if (s.nxt !== null) pointers.push({ name: 'nxt', id: s.nxt, tone: 'found' })
  if (s.finished && s.head !== null) pointers.push({ name: 'head', id: s.head, tone: 'found' })
  return (
    <div className="viz">
      <div className="target-row">
        <span className="target-chip">prev = <b>{s.prev === null ? '∅' : s.nodes[s.prev].v}</b></span>
        <span className="target-chip">cur = <b>{s.cur === null ? '∅' : s.nodes[s.cur].v}</b></span>
        <span className="target-chip">nxt = <b>{s.nxt === null ? '∅' : s.nodes[s.nxt].v}</b></span>
        {s.finished && <span className="verdict ok">反转完成</span>}
      </div>
      <ListView nodes={nodes} order={s.order} pointers={pointers} />
      {s.finished && (
        <div className="target-row">
          <span className="target-chip">新链表从头到尾：<b>{listToArray(s).join(' → ')}</b></span>
        </div>
      )}
      <Stats items={[['已掉头的结点', `${s.flipped.length} / ${s.nodes.length}`]]} />
    </div>
  )
}

export const linkedList: AlgoDef<number[], ListState> = {
  id: 'linked-list',
  title: '链表：反转',
  tagline: '链表靠指针把结点串起来，反转它只需要让每个指针掉个头',
  kind: '数据结构',
  intro: [
    '链表的每个结点除了数据，还保存着下一个结点的地址。结点在内存里可以散落在任何地方，全靠这些指针串成一条链。所以在链表里插入或删除结点，不需要像数组那样搬动一大片元素，只要改几个指针；代价是不能按下标直接找到第 k 个，必须从头一个一个地走。',
    '反转链表是最经典的练习，它几乎把链表操作里最容易出错的地方都包含了。做法是用三个指针配合着走：prev 指向已经反转好的部分，cur 是当前要处理的结点，nxt 用来暂存 cur 的下一个结点。每一步让 cur 的 next 掉头指向 prev，再让两个指针一起向前走一格。',
  ],
  points: [
    '一定要先用 nxt 记住 cur->next，再去修改它，否则一改，后面的结点就丢了。',
    '循环的条件是 cur 不为空，结束时 prev 恰好指向原来的最后一个结点，它就是新的头。',
    '头结点的 next 在第一步被改成了空，所以反转后的链表末尾自然是空，不需要额外处理。',
    '整个过程只扫描一遍，只用了三个指针，时间 O(n)，额外空间 O(1)。',
  ],
  pitfalls: [
    '修改指针的顺序写错（比如先 cur->next=prev，再去取 cur->next），会让链表断开，后面的结点全部丢失。',
    '忘记处理空链表和只有一个结点的情况：循环条件已经覆盖，不必另外写判断，但要确认返回的是 prev，而不是 head。',
    '手动用 new / malloc 创建的结点，用完要释放；比赛里通常不在意，工程里要记得。',
  ],
  complexity: { time: 'O(n)', space: 'O(1)', note: '只扫描一遍链表，只使用 prev、cur、nxt 三个指针。' },
  inputHint: '输入 2～8 个 1～99 的整数，空格隔开，它们依次组成链表的各个结点。',
  presets: [
    { label: '五个结点', text: '1 2 3 4 5' },
    { label: '只有两个', text: '7 9' },
    { label: '八个结点', text: '3 1 4 1 5 9 2 6' },
  ],
  defaultInput: [1, 2, 3, 4, 5],
  parse: (t) => parseList(t, { min: 2, max: 8, lo: 1, hi: 99 }),
  format: (v) => v.join(' '),
  random: () => randList(randInt(4, 7), 1, 60),
  run: runReverse,
  View: ListDemoView,
  sources: {
    c: String.raw`
#include <stdio.h>
#include <stdlib.h>
typedef struct Node{
    int val;
    struct Node *next;
} Node;
Node* reverseList(Node* head){
    Node *prev=NULL,*cur=head;                  //@init
    while (cur){
        Node* nxt=cur->next;                    //@save
        cur->next=prev;                         //@flip
        prev=cur;                               //@move
        cur=nxt;                                //@move
    }
    return prev;                                //@done
}
int main(){
    int n;
    Node *head=NULL,*tail=NULL;
    scanf("%d",&n);
    for (int i=0;i<n;i++){
        Node* p=(Node*)malloc(sizeof(Node));
        scanf("%d",&p->val);
        p->next=NULL;
        if (!head) head=tail=p;
        else{
            tail->next=p;
            tail=p;
        }
    }
    head=reverseList(head);
    for (Node* p=head;p;p=p->next) printf("%d ",p->val);
    printf("\n");
    return 0;
}
`,
    cpp: String.raw`
#include <bits/stdc++.h>
using namespace std;
struct Node{
    int val;
    Node *next=nullptr;
    Node(int v):val(v){}
};
Node* reverseList(Node* head){
    Node *prev=nullptr,*cur=head;               //@init
    while (cur){
        Node* nxt=cur->next;                    //@save
        cur->next=prev;                         //@flip
        prev=cur;                               //@move
        cur=nxt;                                //@move
    }
    return prev;                                //@done
}
int main(){
    int n,x;
    Node *head=nullptr,*tail=nullptr;
    cin>>n;
    for (int i=0;i<n;i++){
        cin>>x;
        Node* p=new Node(x);
        if (!head) head=tail=p;
        else{
            tail->next=p;
            tail=p;
        }
    }
    head=reverseList(head);
    for (Node* p=head;p;p=p->next) cout<<p->val<<" ";
    cout<<endl;
    return 0;
}
`,
    python: String.raw`
class Node:
    def __init__(self, v):
        self.val = v
        self.next = None


def reverse_list(head):
    prev, cur = None, head                      #@init
    while cur:
        nxt = cur.next                          #@save
        cur.next = prev                         #@flip
        prev = cur                              #@move
        cur = nxt                               #@move
    return prev                                 #@done


n = int(input())
head = tail = None
for x in map(int, input().split()):
    p = Node(x)
    if head is None:
        head = tail = p
    else:
        tail.next = p
        tail = p
head = reverse_list(head)
out = []
while head:
    out.append(head.val)
    head = head.next
print(*out)
`,
    java: String.raw`
import java.util.*;

public class Main {
    static class Node {
        int val;
        Node next;
        Node(int v) { val = v; }
    }

    static Node reverseList(Node head) {
        Node prev = null, cur = head;               //@init
        while (cur != null) {
            Node nxt = cur.next;                    //@save
            cur.next = prev;                        //@flip
            prev = cur;                             //@move
            cur = nxt;                              //@move
        }
        return prev;                                //@done
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        Node head = null, tail = null;
        for (int i = 0; i < n; i++) {
            Node p = new Node(sc.nextInt());
            if (head == null) head = tail = p;
            else {
                tail.next = p;
                tail = p;
            }
        }
        head = reverseList(head);
        StringBuilder sb = new StringBuilder();
        for (Node p = head; p != null; p = p.next) sb.append(p.val).append(' ');
        System.out.println(sb);
    }
}
`,
  },
  problems: pickProblems('P1160', 'P1996'),
}
