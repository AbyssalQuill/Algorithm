import { ArrayView, type Cell, type Pointer, type Tone } from '../components/ArrayView'
import { Stats } from '../components/Stats'
import { pickProblems } from '../data/problems'
import { Recorder } from '../engine/recorder'
import type { AlgoDef, Frame, ParseResult } from '../engine/types'
import { randInt, splitBar, toNums } from './shared'

export interface TpInput {
  arr: number[]
  target: number
}

export interface TpState {
  cells: { id: number; v: number }[]
  target: number
  l: number
  r: number
  /** 当前这一对的和；还没算时为 null */
  sum: number | null
  status: 'run' | 'found' | 'miss'
  checks: number
}

export function runTwoPointers({ arr, target }: TpInput): Frame<TpState>[] {
  const rec = new Recorder<TpState>()
  const cells = arr.map((v, id) => ({ id, v }))
  let l = 0
  let r = arr.length - 1
  let sum: number | null = null
  let checks = 0
  const snap = (status: TpState['status'] = 'run'): TpState => ({ cells, target, l, r, sum, status, checks })

  rec.push('init', snap(), `数组已经从小到大排好。想找两个数，使它们的和等于 ${target}：让 l 指向最小的数，r 指向最大的数，一起向中间靠拢。`)
  while (l < r) {
    sum = arr[l] + arr[r]
    checks++
    rec.push('sum', snap(), `a[${l}] + a[${r}] = ${arr[l]} + ${arr[r]} = ${sum}，与目标 ${target} 比较。`)
    if (sum === target) {
      rec.push('hit', snap('found'), `${sum} 恰好等于 ${target}，找到了：下标 ${l} 和 ${r}。`)
      return rec.frames
    }
    if (sum < target) {
      const old = l
      l++
      rec.push('moveL', snap(), `和比目标小。a[${r}] 已经是剩下的数里最大的了，连它都配不够，所以 a[${old}] = ${arr[old]} 不可能是答案，排除它：l 右移到 ${l}。`)
    } else {
      const old = r
      r--
      rec.push('moveR', snap(), `和比目标大。a[${l}] 已经是剩下的数里最小的了，连它都嫌大，所以 a[${old}] = ${arr[old]} 不可能是答案，排除它：r 左移到 ${r}。`)
    }
  }
  sum = null
  rec.push('miss', snap('miss'), `l 追上了 r，两个指针之间已经没有可以配对的数了：不存在和为 ${target} 的两个数。`)
  return rec.frames
}

function TpView({ frame }: { frame: Frame<TpState> }) {
  const s = frame.state
  const n = s.cells.length
  const cells: Cell[] = s.cells.map((c, i) => {
    let tone: Tone = 'idle'
    if (i < s.l || i > s.r) tone = 'dim'
    if (i === s.l || i === s.r) tone = s.status === 'found' ? 'found' : 'compare'
    return { id: c.id, v: c.v, tone }
  })
  const pointers: Pointer[] = s.status === 'miss' ? [] : [
    { name: 'l', index: s.l, tone: 'done' },
    { name: 'r', index: s.r, tone: 'swap' },
  ]
  return (
    <div className="viz">
      <div className="target-row">
        <span className="target-chip">
          目标和 <b>{s.target}</b>
        </span>
        {s.sum !== null && s.status !== 'miss' && (
          <span className="target-chip">
            a[l] + a[r] = <b>{s.sum}</b>
          </span>
        )}
        {s.status === 'found' && <span className="verdict ok">找到了：下标 {s.l} 和 {s.r}</span>}
        {s.status === 'miss' && <span className="verdict bad">没有这样的两个数</span>}
      </div>
      <ArrayView cells={cells} pointers={pointers} mode="boxes" minSlots={1} />
      <Stats
        items={[
          ['还没排除的', s.status === 'miss' ? 0 : s.r - s.l + 1],
          ['已经算了几次和', s.checks],
          ['数组长度', n],
        ]}
      />
    </div>
  )
}

function parse(text: string): ParseResult<TpInput> {
  const parts = splitBar(text)
  if (parts.length !== 2) return { ok: false, error: '格式是「有序数组 | 目标和」，例如：1 3 4 6 8 11 | 10' }
  const arr = toNums(parts[0])
  const t = toNums(parts[1])
  if (arr.length < 2 || arr.length > 14) return { ok: false, error: '数组里请放 2～14 个整数。' }
  if (t.length !== 1) return { ok: false, error: '“|”右边只放一个目标和。' }
  if (arr.some((x) => !Number.isInteger(x) || x < 0 || x > 99) || !Number.isInteger(t[0]) || t[0] < 0 || t[0] > 198) return { ok: false, error: '数组里的数是 0～99 的整数，目标和是 0～198 的整数。' }
  for (let i = 1; i < arr.length; i++) if (arr[i] < arr[i - 1]) return { ok: false, error: '双指针要求数组已经从小到大排好序，请先排序再输入。' }
  return { ok: true, value: { arr, target: t[0] } }
}

export const twoPointers: AlgoDef<TpInput, TpState> = {
  id: 'two-pointers',
  title: '双指针：两数之和',
  tagline: '在有序数组里让两个指针从两端向中间靠拢，一趟就能找到和为目标的两个数',
  kind: '算法',
  intro: [
    '问题是这样的：给一个从小到大排好的数组，找出两个数，使它们的和等于给定的目标。最直接的做法是枚举所有的数对，需要 O(n²) 次。',
    '利用“有序”这个条件可以做得更快。让 l 指向最小的数，r 指向最大的数，看它们的和：如果比目标小，说明最大的数都配不够，那么 l 指向的数无论和谁搭配都不可能达标，可以放心地排除它；如果比目标大，同理排除 r 指向的数。每看一次都能排除一个数，所以最多看 n 次就有结论。',
  ],
  points: [
    '每一步排除的是“一定不可能是答案”的数，所以不会漏掉解。这个论证依赖数组有序，没排序时指针的移动就失去了依据。',
    '循环的条件是 l<r，两个指针不能指向同一个数，一个数不能和自己配对。',
    '如果数组是乱序的，可以先用 sort 排好，代价是多出 O(n log n) 的排序时间，总体仍然比 O(n²) 好得多。',
    '双指针的思路还能用在很多地方：判断回文、合并两个有序数组、滑动窗口求最短区间等。',
  ],
  pitfalls: [
    '循环条件写成 l<=r 会让一个数和自己配对。',
    '没有先排序就直接使用，结果是错误的，并且不会有任何报错。',
    '要求输出所有满足条件的数对时，找到一个以后不能简单地退出，还要同时移动两个指针继续找，并处理好重复的数。',
  ],
  complexity: { time: 'O(n)', space: 'O(1)', note: '每一步都会排除一个数，所以最多检查 n-1 次。' },
  inputHint: '格式：有序数组 | 目标和，例如 1 3 4 6 8 11 | 10（数组里 0～99，最多 14 个数）。',
  presets: [
    { label: '找得到', text: '1 3 4 6 8 11 15 | 14' },
    { label: '找不到', text: '1 3 4 6 8 11 15 | 2' },
    { label: '有重复数', text: '2 2 5 5 9 | 10' },
  ],
  defaultInput: { arr: [1, 3, 4, 6, 8, 11, 15], target: 14 },
  parse,
  format: (v) => `${v.arr.join(' ')} | ${v.target}`,
  random: () => {
    const n = randInt(6, 10)
    const arr = Array.from({ length: n }, () => randInt(1, 40)).sort((a, b) => a - b)
    const target = Math.random() < 0.7 ? arr[randInt(0, n - 1)] + arr[randInt(0, n - 1)] : randInt(2, 80)
    return { arr, target }
  },
  run: runTwoPointers,
  View: TpView,
  sources: {
    c: String.raw`
#include <stdio.h>
int main(){
    int n,t,a[1005];
    scanf("%d",&n);
    for (int i=0;i<n;i++) scanf("%d",&a[i]);
    scanf("%d",&t);
    int l=0,r=n-1;                              //@init
    while (l<r){
        int sum=a[l]+a[r];                      //@sum
        if (sum==t){
            printf("%d %d\n",l,r);              //@hit
            return 0;                           //@hit
        }else if (sum<t){
            l++;                                //@moveL
        }else{
            r--;                                //@moveR
        }
    }
    printf("-1 -1\n");                          //@miss
    return 0;
}
`,
    cpp: String.raw`
#include <bits/stdc++.h>
using namespace std;
int main(){
    int n,t,a[1005];
    cin>>n;
    for (int i=0;i<n;i++) cin>>a[i];
    cin>>t;
    int l=0,r=n-1;                              //@init
    while (l<r){
        int sum=a[l]+a[r];                      //@sum
        if (sum==t){
            cout<<l<<" "<<r<<endl;              //@hit
            return 0;                           //@hit
        }else if (sum<t){
            l++;                                //@moveL
        }else{
            r--;                                //@moveR
        }
    }
    cout<<"-1 -1"<<endl;                        //@miss
    return 0;
}
`,
    python: String.raw`
def two_sum(a, t):
    l, r = 0, len(a) - 1                        #@init
    while l < r:
        s = a[l] + a[r]                         #@sum
        if s == t:
            return l, r                         #@hit
        elif s < t:
            l += 1                              #@moveL
        else:
            r -= 1                              #@moveR
    return -1, -1                               #@miss


n = int(input())
a = list(map(int, input().split()))
t = int(input())
print(*two_sum(a, t))
`,
    java: String.raw`
import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        int[] a = new int[n];
        for (int i = 0; i < n; i++) a[i] = sc.nextInt();
        int t = sc.nextInt();
        int l = 0, r = n - 1;                       //@init
        while (l < r) {
            int sum = a[l] + a[r];                  //@sum
            if (sum == t) {
                System.out.println(l + " " + r);    //@hit
                return;                             //@hit
            } else if (sum < t) {
                l++;                                //@moveL
            } else {
                r--;                                //@moveR
            }
        }
        System.out.println("-1 -1");                //@miss
    }
}
`,
  },
  problems: pickProblems('P1102', 'P1638'),
}
