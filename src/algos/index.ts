import type { AnyAlgo } from '../engine/types'
import { binarySearch } from './binarySearch'
import { bracketStack } from './bracketStack'
import { bst } from './bst'
import { diffArray } from './diffArray'
import { bfsGrid } from './bfsGrid'
import { bubbleSort } from './bubbleSort'
import { heap } from './heap'
import { insertionSort } from './insertionSort'
import { josephusQueue } from './josephusQueue'
import { lcs } from './lcs'
import { mergeSort } from './mergeSort'
import { prefixSum } from './prefixSum'
import { quickSort } from './quickSort'
import { selectionSort } from './selectionSort'
import { segTree } from './segTree'
import { sieve } from './sieve'
import { treeTraversal } from './treeTraversal'
import { trie } from './trie'
import { twoPointers } from './twoPointers'

/** 动画实验室里的所有演示。新增一个演示 = 写一个 AlgoDef，然后加到这里 */
export const ALGOS: AnyAlgo[] = [
  bracketStack,
  josephusQueue,
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
  lcs,
]

export const findAlgo = (id: string | undefined) => ALGOS.find((a) => a.id === id)
