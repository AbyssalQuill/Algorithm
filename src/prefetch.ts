/** 在浏览器空闲的时候做事，不和首屏抢时间 */
export function whenIdle(fn: () => void) {
  const w = window as unknown as { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }
  if (w.requestIdleCallback) w.requestIdleCallback(fn, { timeout: 3000 })
  else setTimeout(fn, 1500)
}

/** 预先下载“开始学习”会用到的页面和第一课，点击时就不会再等待加载 */
export function prefetchLearning() {
  whenIdle(() => {
    void import('./pages/Learn')
    void import('./pages/Lesson')
    void import('./learn/content').then((m) => m.loadLesson('cpp', 'hello'))
  })
}
