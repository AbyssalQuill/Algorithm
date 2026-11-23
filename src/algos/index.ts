import type { AnyAlgo } from '../engine/types'
import { binarySearch } from './binarySearch'
import { bracketStack } from './bracketStack'
import { bubbleSort } from './bubbleSort'

/** 动画实验室里的所有演示。新增一个演示 = 写一个 AlgoDef，然后加到这里 */
export const ALGOS: AnyAlgo[] = [bracketStack, bubbleSort, binarySearch]

export const findAlgo = (id: string | undefined) => ALGOS.find((a) => a.id === id)
