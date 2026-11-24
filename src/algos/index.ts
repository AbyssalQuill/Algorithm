import type { AnyAlgo } from '../engine/types'
import { binarySearch } from './binarySearch'
import { bracketStack } from './bracketStack'
import { bit } from './bit'
import { bst } from './bst'
import { diffArray } from './diffArray'
import { dijkstra } from './dijkstra'
import { bfsGrid } from './bfsGrid'
import { bubbleSort } from './bubbleSort'
import { dsu } from './dsu'
import { graphDfs } from './graphDfs'
import { graphStore } from './graphStore'
import { hanoi } from './hanoi'
import { hashTable } from './hashTable'
import { heap } from './heap'
import { insertionSort } from './insertionSort'
import { josephusQueue } from './josephusQueue'
import { kruskal } from './kruskal'
import { lcs } from './lcs'
import { linkedList } from './linkedList'
import { mergeSort } from './mergeSort'
import { nQueens } from './nQueens'
import { prefixSum } from './prefixSum'
import { quickSort } from './quickSort'
import { selectionSort } from './selectionSort'
import { segTree } from './segTree'
import { sieve } from './sieve'
import { topoSort } from './topoSort'
import { treeTraversal } from './treeTraversal'
import { trie } from './trie'
import { twoPointers } from './twoPointers'

/** 动画实验室里的所有演示。新增一个演示 = 写一个 AlgoDef，然后加到这里 */
export const ALGOS: AnyAlgo[] = [
  bracketStack,
  josephusQueue,
  linkedList,
  hashTable,
  dsu,
  bit,
  graphStore,
  bst,
  treeTraversal,
  heap,
  trie,
  segTree,
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
  lcs,
]

export const findAlgo = (id: string | undefined) => ALGOS.find((a) => a.id === id)
