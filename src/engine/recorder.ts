import type { Frame } from './types'

/** 记录器：算法每走一步就 push 一帧（状态会被深拷贝），播放器之后可以前进、后退、拖动进度 */
export class Recorder<S> {
  frames: Frame<S>[] = []

  push(step: string, state: S, note: string) {
    this.frames.push({ step, note, state: structuredClone(state) })
  }
}
