import { useCallback, useEffect, useState } from 'react'

export interface PlayerOptions {
  autoplay?: boolean
  loop?: boolean
  baseMs?: number
}

export function usePlayer(frames: readonly unknown[], opts: PlayerOptions = {}) {
  const { autoplay = false, loop = false, baseMs = 950 } = opts
  const last = Math.max(frames.length - 1, 0)
  const [index, setIndex] = useState(0)
  const [playing, setPlaying] = useState(autoplay)
  const [speed, setSpeed] = useState(1)

  // 换了一组帧（比如输入变了）就回到开头
  useEffect(() => {
    setIndex(0)
    setPlaying(autoplay)
  }, [frames, autoplay])

  useEffect(() => {
    if (!playing) return
    if (index >= last) {
      if (!loop) {
        setPlaying(false)
        return
      }
      const t = setTimeout(() => setIndex(0), 1500)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => setIndex((i) => Math.min(i + 1, last)), baseMs / speed)
    return () => clearTimeout(t)
  }, [playing, index, last, loop, baseMs, speed])

  const seek = useCallback(
    (i: number) => {
      setPlaying(false)
      setIndex(Math.min(Math.max(i, 0), last))
    },
    [last],
  )
  const next = useCallback(() => {
    setPlaying(false)
    setIndex((i) => Math.min(i + 1, last))
  }, [last])
  const prev = useCallback(() => {
    setPlaying(false)
    setIndex((i) => Math.max(i - 1, 0))
  }, [])
  const restart = useCallback(() => {
    setPlaying(false)
    setIndex(0)
  }, [])
  const toggle = useCallback(() => {
    if (!playing && index >= last) setIndex(0)
    setPlaying(!playing)
  }, [playing, index, last])

  return { index, last, playing, speed, setSpeed, seek, next, prev, restart, toggle, atEnd: index >= last }
}
