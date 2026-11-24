import type { AnyAlgo, AnyExample } from '../engine/types'
import { binarySearch } from './binarySearch'
import { bracketStack } from './bracketStack'
import { bigAdd } from './bigAdd'
import { bit } from './bit'
import { bitClear } from './bitClear'
import { bst } from './bst'
import { diffArray } from './diffArray'
import { dijkstra } from './dijkstra'
import { bfsGrid } from './bfsGrid'
import { bubbleSort } from './bubbleSort'
import { dsu } from './dsu'
import { dsuCircles } from './dsuCircles'
import { gcd } from './gcd'
import { graphDfs } from './graphDfs'
import { greedy } from './greedy'
import { graphStore } from './graphStore'
import { hanoi } from './hanoi'
import { hashTable } from './hashTable'
import { heap } from './heap'
import { insertionSort } from './insertionSort'
import { josephusQueue } from './josephusQueue'
import { kmp } from './kmp'
import { knapsack } from './knapsack'
import { kruskal } from './kruskal'
import { linkedList } from './linkedList'
import { mergeSort } from './mergeSort'
import { nQueens } from './nQueens'
import { prefixSum } from './prefixSum'
import { quickSort } from './quickSort'
import { selectionSort } from './selectionSort'
import { segTree } from './segTree'
import { sieve } from './sieve'
import { sparseTable } from './sparseTable'
import { topoSort } from './topoSort'
import { treeTraversal } from './treeTraversal'
import { trie } from './trie'
import { twoPointers } from './twoPointers'

/** DSU 专题：亲戚（合并与查询）、朋友圈（数集合）。两道例题共用同一套画面，所以在这里拼起来，避免文件互相引用 */
const dsuTopic: AnyAlgo = { ...dsu, extra: [dsuCircles] }

/** 动画实验室里的所有演示。新增一个演示 = 写一个 AlgoDef，然后加到这里 */
export const ALGOS: AnyAlgo[] = [
  bracketStack,
  josephusQueue,
  linkedList,
  hashTable,
  dsuTopic,
  bit,
  graphStore,
  bst,
  treeTraversal,
  heap,
  trie,
  segTree,
  sparseTable,
  bubbleSort,
  selectionSort,
  insertionSort,
  mergeSort,
  quickSort,
  binarySearch,
  twoPointers,
  prefixSum,
  diffArray,
  sieve,
  bfsGrid,
  graphDfs,
  dijkstra,
  kruskal,
  topoSort,
  hanoi,
  nQueens,
  greedy,
  knapsack,
  gcd,
  bitClear,
  bigAdd,
  kmp,
]

export const findAlgo = (id: string | undefined) => ALGOS.find((a) => a.id === id)

/** 一个专题下的所有例题：第一道就是专题对象本身，后面是 extra */
export const examplesOf = (a: AnyAlgo): AnyExample[] => [a, ...(a.extra ?? [])]

/** 所有例题，连同它所属的专题（统计个数、跑测试时用） */
export const ALL_EXAMPLES = ALGOS.flatMap((algo) => examplesOf(algo).map((ex) => ({ algo, ex })))
