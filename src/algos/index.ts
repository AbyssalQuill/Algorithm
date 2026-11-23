import type { AnyAlgo } from '../engine/types'
import { binarySearch } from './binarySearch'
import { bracketStack } from './bracketStack'
import { bfsGrid } from './bfsGrid'
import { bubbleSort } from './bubbleSort'
import { insertionSort } from './insertionSort'
import { josephusQueue } from './josephusQueue'
import { lcs } from './lcs'
import { prefixSum } from './prefixSum'
import { quickSort } from './quickSort'
import { sieve } from './sieve'
import { twoPointers } from './twoPointers'

/** 动画实验室里的所有演示。新增一个演示 = 写一个 AlgoDef，然后加到这里 */
export const ALGOS: AnyAlgo[] = [
  bracketStack,
  josephusQueue,
  bubbleSort,
  insertionSort,
  quickSort,
  binarySearch,
  twoPointers,
  prefixSum,
  sieve,
  bfsGrid,
  lcs,
]

export const findAlgo = (id: string | undefined) => ALGOS.find((a) => a.id === id)
